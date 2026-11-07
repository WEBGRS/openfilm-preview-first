// Measure one preview-first trial run, the same way whichever arm made it.
//   node evals/measure.mjs <run folder> --want <seconds> [--frame landscape|portrait] [--material <folder>] [--snap <folder>]
// A run folder holds run.jsonl, done.json and work/ (what of-eval.mjs leaves). --snap is a folder of film-<ms>.html copies
// taken while the run went (snap.mjs); without it the first whole film is read from the agent's own writes of film.html.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const argv = process.argv.slice(2);
const flag = (k) => { const i = argv.indexOf(`--${k}`); return i < 0 ? undefined : argv[i + 1]; };
const dir = argv.find((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
if (!dir) throw new Error('usage: node evals/measure.mjs <run folder> --want <seconds> [--frame landscape|portrait] [--material <folder>] [--snap <folder>]');
const want = Number(flag('want') ?? 0);
const work = join(dir, 'work');
// The film is work/film.html, or film.html in a folder the agent opened a project in (the one with the most clips)
const films = ['film.html', ...(existsSync(work) ? readdirSync(work, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.')).map((e) => `${e.name}/film.html`) : [])]
  .map((f) => join(work, f)).filter((f) => existsSync(f));
const clipCount = (f) => (readFileSync(f, 'utf8').match(/<(iframe|video|img|audio)\b/g) ?? []).length;
const filmPath = films.sort((a, b) => clipCount(b) - clipCount(a))[0] ?? join(work, 'film.html');
const base = dirname(filmPath);

// Per-million-token prices that reproduce the cost of 40 finished sonnet runs to the cent
const PRICE = { input: 2, output: 10, read: 0.1, create: 4 };

/* the run's events */
const events = [];
for (const line of readFileSync(join(dir, 'run.jsonl'), 'utf8').split('\n')) {
  try { events.push(JSON.parse(line)); } catch {}
}
const done = existsSync(join(dir, 'done.json')) ? JSON.parse(readFileSync(join(dir, 'done.json'), 'utf8')) : {};
const init = events.find((e) => e.type === 'system' && e.subtype === 'init');
const result = events.find((e) => e.type === 'result') ?? {};
const stamps = events.map((e) => Date.parse(e.timestamp)).filter(Number.isFinite);
const t0 = Math.min(...stamps);

/* one message per id; the last usage seen for it. Input-side counts are exact; output counts are logged part-way. */
const messages = new Map();
const toolUses = [];
for (const e of events) {
  if (e.type !== 'assistant') continue;
  const m = e.message, t = Date.parse(e.timestamp);
  const u = m.usage ?? {};
  const cur = messages.get(m.id) ?? { t, input: 0, output: 0, read: 0, create: 0, chars: 0 };
  cur.input = Math.max(cur.input, u.input_tokens ?? 0);
  cur.output = Math.max(cur.output, u.output_tokens ?? 0);
  cur.read = Math.max(cur.read, u.cache_read_input_tokens ?? 0);
  cur.create = Math.max(cur.create, u.cache_creation_input_tokens ?? 0);
  for (const c of m.content ?? []) {
    cur.chars += (c.text?.length ?? 0) + (c.type === 'tool_use' ? JSON.stringify(c.input).length : 0);
    if (c.type === 'tool_use') toolUses.push({ t, name: c.name, input: c.input });
  }
  messages.set(m.id, cur);
}
// Spread the output tokens the log left out over the messages by how much each wrote
const all = [...messages.values()];
const loggedOut = all.reduce((n, m) => n + m.output, 0);
const totalOut = result.usage?.output_tokens ?? loggedOut;
const chars = all.reduce((n, m) => n + m.chars, 0) || 1;
for (const m of all) {
  const out = m.output + Math.max(0, totalOut - loggedOut) * (m.chars / chars);
  m.cost = (m.input * PRICE.input + out * PRICE.output + m.read * PRICE.read + m.create * PRICE.create) / 1e6;
}
const estimated = all.reduce((n, m) => n + m.cost, 0);
const scale = (result.total_cost_usd ?? estimated) / (estimated || 1);
const costBy = (t) => +(all.filter((m) => m.t <= t).reduce((n, m) => n + m.cost, 0) * scale).toFixed(2);

/* a film.html: its tracks, clips and length */
const attrs = (s) => Object.fromEntries([...s.matchAll(/([\w-]+)\s*=\s*"([^"]*)"/g)].map((m) => [m[1], m[2]]));
function readFilm(html, base) {
  const viewport = /name="viewport"[^>]*content="([^"]*)"/.exec(html)?.[1] ?? '';
  const w = Number(/width=(\d+)/.exec(viewport)?.[1] ?? 1920), h = Number(/height=(\d+)/.exec(viewport)?.[1] ?? 1080);
  const sections = [...html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/g)].map((s) => s[1]);
  const clips = [];
  sections.forEach((body, track) => {
    for (const m of body.matchAll(/<(iframe|video|img|audio)\b([^>]*)>/g)) {
      const a = attrs(m[2]);
      const [file, frag = ''] = (a.src ?? '').split('#');
      const range = /t=([\d.]+)(?:,([\d.]+))?/.exec(frag);
      let len = range?.[2] !== undefined ? (Number(range[2]) - Number(range[1])) / Number(a.speed ?? 1) : NaN;
      if (Number.isNaN(len) && m[1] === 'iframe' && base && existsSync(join(base, file))) {
        const d = /duration:\s*([\d.]+)/.exec(readFileSync(join(base, file), 'utf8'));
        if (d) len = Number(d[1]);
      }
      clips.push({ tag: m[1], file, at: Number(a.at ?? 0), len, track });
    }
  });
  const visual = clips.filter((c) => c.tag !== 'audio' && Number.isFinite(c.len));
  const total = visual.reduce((n, c) => Math.max(n, c.at + c.len), 0);
  // Seconds of the film with no picture on any track
  let covered = 0, edge = 0;
  for (const c of [...visual].sort((x, y) => x.at - y.at)) {
    if (c.at + c.len > edge) { covered += c.at + c.len - Math.max(c.at, edge); edge = c.at + c.len; }
  }
  return { w, h, tracks: sections.length, clips, total: +total.toFixed(1), gaps: +(total - covered).toFixed(1),
    audio: clips.filter((c) => c.tag === 'audio').length, video: clips.filter((c) => c.tag === 'video').length,
    captionTracks: (html.match(/<track\b/g) ?? []).length };
}

/* the cards: the longest block of text on each page, as the words planned for it */
const NATURAL = { en: [1.8, 3.3], zh: [3.2, 6.2] };
function cards(film) {
  const rows = [];
  for (const c of film.clips.filter((x) => x.tag === 'iframe' && /\.html$/.test(x.file) && existsSync(join(base, x.file)))) {
    const text = readFileSync(join(base, c.file), 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ');
    const blocks = text.split(/<[^>]+>/).map((s) => s.replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const longest = blocks.sort((a, b) => b.length - a.length)[0] ?? '';
    const cjk = (longest.match(/[㐀-鿿]/g) ?? []).length;
    const lang = cjk > longest.length / 3 ? 'zh' : 'en';
    const units = lang === 'zh' ? cjk : longest.split(/\s+/).filter(Boolean).length;
    rows.push({ file: c.file, at: c.at, len: c.len, lang, units, pace: +(units / c.len).toFixed(1) });
  }
  return rows;
}

/* run facts */
const commands = toolUses.filter((u) => u.name === 'Bash' || u.name === 'PowerShell').map((u) => u.input.command ?? '');
const count = (re) => commands.filter((c) => re.test(c)).length;
const readSkill = toolUses.some((u) => /preview-first/.test(JSON.stringify(u.input)) && (u.name === 'Skill' || /SKILL|skill/.test(JSON.stringify(u.input))));
const finalText = String(result.result ?? '');

/* the first whole film: from snapshots, else from the agent's own Writes */
const whole = (film) => want && film.total >= 0.9 * want && film.gaps <= 0.05 * film.total;
let first = null;
const snap = flag('snap');
if (snap && existsSync(snap)) {
  const files = readdirSync(snap).filter((f) => /^film-\d+\.html$/.test(f)).sort();
  for (const f of files) {
    const film = readFilm(readFileSync(join(snap, f), 'utf8'), null);
    // A page that only says its length in its own file counts from the final project; fragments are in film.html itself
    if (whole(film)) { first = { via: 'snapshots', t: Number(/\d+/.exec(f)[0]), film }; break; }
  }
} else {
  for (const u of toolUses.filter((x) => x.name === 'Write' && /film\.html$/.test(x.input.file_path ?? ''))) {
    const film = readFilm(u.input.content ?? '', null);
    if (whole(film)) { first = { via: 'own writes', t: u.t, film }; break; }
  }
}

/* the final film */
const film = existsSync(filmPath) ? readFilm(readFileSync(filmPath, 'utf8'), base) : null;
const material = flag('material');
let used = null;
if (film && material && existsSync(material)) {
  const names = readdirSync(material).filter((n) => !/\.(txt|md)$/i.test(n));
  const local = (f) => basename(decodeURIComponent(f.split(/[?#]/)[0]));
  // The person's files that are clips of film.html
  const asClips = new Set(film.clips.map((c) => local(c.file)).filter((n) => names.includes(n)));
  const pages = film.clips.filter((c) => c.tag === 'iframe' && existsSync(join(base, c.file))).map((c) => readFileSync(join(base, c.file), 'utf8'));
  // Their files a card's own markup loads
  const inPages = new Set();
  for (const p of pages) {
    for (const m of p.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^)"']+)/g)) {
      const n = local(m[1] ?? m[2]);
      if (names.includes(n) && !asClips.has(n)) inPages.add(n);
    }
  }
  // Their files only named in the words on a card
  const words = pages.map((p) => p.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).join('\n');
  const namedInText = names.filter((n) => words.includes(n) && !asClips.has(n) && !inPages.has(n));
  used = { of: names.length, asClips: asClips.size, inPages: inPages.size, namedInText: namedInText.length };
}
const assets = existsSync(join(base, 'assets')) ? readdirSync(join(base, 'assets'), { recursive: true }).filter((f) => /\.[a-z0-9]+$/i.test(f)) : [];
const byExt = (re) => assets.filter((f) => re.test(f)).length;
const cardRows = film ? cards(film) : [];
/* media the agent made outside the project: video or sound next to the film that the material did not have */
const had = new Set(material && existsSync(material) ? readdirSync(material) : []);
const madeFiles = [...new Set([work, base, join(base, 'assets')])].filter((d) => existsSync(d)).flatMap((d) => readdirSync(d, { withFileTypes: true })
  .filter((e) => e.isFile() && /\.(mp4|webm|mov|mkv|wav|mp3|m4a)$/i.test(e.name) && !had.has(e.name)).map((e) => join(d, e.name)));
const probe = (f) => {
  try {
    const r = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'json', f], { encoding: 'utf8' }));
    return { file: basename(f), seconds: +Number(r.format.duration).toFixed(1), frame: r.streams?.[0]?.width ? `${r.streams[0].width}x${r.streams[0].height}` : undefined };
  } catch { return { file: basename(f) }; }
};
const [lo, hi] = NATURAL[cardRows[0]?.lang ?? 'en'];

const out = {
  run: dir.split(/[\\/]/).slice(-1)[0], model: init?.model, subtype: result.subtype, turns: result.num_turns,
  minutes: done.minutes, cost: done.cost == null ? undefined : +done.cost.toFixed(2),
  readSkill,
  slow: { get: count(/openfilm(?:\.mjs)?\s+get\s/), look: count(/openfilm(?:\.mjs)?\s+look/), render: count(/openfilm(?:\.mjs)?\s+(render|export)/), ffmpeg: count(/ffmpeg|ffprobe/) },
  firstWholeFilm: first && { via: first.via, minutes: +((first.t - t0) / 60000).toFixed(1), cost: costBy(first.t), seconds: first.film.total, tracks: first.film.tracks, clips: first.film.clips.length },
  finalFilm: film && { lastWriteMinutes: +((statSync(filmPath).mtimeMs - t0) / 60000).toFixed(1), costAtLastWrite: costBy(statSync(filmPath).mtimeMs), frame: `${film.w}x${film.h}`, orientation: film.w >= film.h ? 'landscape' : 'portrait', seconds: film.total, wantSeconds: want, gaps: film.gaps, tracks: film.tracks, clips: film.clips.length, audioClips: film.audio, videoClips: film.video, captionTracks: film.captionTracks },
  madeOutside: madeFiles.map(probe),
  assets: { audio: byExt(/\.(wav|mp3|m4a|ogg|flac|aac)$/i), video: byExt(/\.(mp4|webm|mov|mkv)$/i), image: byExt(/\.(png|jpe?g|gif|webp|svg)$/i), other: assets.length - byExt(/\.(wav|mp3|m4a|ogg|flac|aac|mp4|webm|mov|mkv|png|jpe?g|gif|webp|svg)$/i) },
  material: used,
  cards: { n: cardRows.length, paceInRange: cardRows.filter((c) => c.pace >= lo && c.pace <= hi).length, medianPace: cardRows.length ? cardRows.map((c) => c.pace).sort((a, b) => a - b)[Math.floor(cardRows.length / 2)] : null, unit: cardRows[0]?.lang === 'zh' ? 'characters per second' : 'words per second', range: [lo, hi] },
  finalMessageAsks: /[?？]/.test(finalText.slice(-600)),
  finalMessageChars: finalText.length,
};
if (flag('frame') && film) out.frameAsRequested = out.finalFilm.orientation === flag('frame');
console.log(JSON.stringify(out, null, 1));
if (flag('cards')) console.table(cardRows);
