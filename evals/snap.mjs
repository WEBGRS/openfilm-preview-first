// Watch trial projects while they run: copy film.html each time it changes, and log when each file first appears.
//   node evals/snap.mjs <folder of runs> <folder for snapshots>
// A run is a folder named like v3-r1-with with a work/ folder inside. Reads only; stop it by ending its process.
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const [RUNS, SNAP] = process.argv.slice(2);
if (!RUNS || !SNAP) throw new Error('usage: node evals/snap.mjs <folder of runs> <folder for snapshots>');
mkdirSync(SNAP, { recursive: true });
const SKIP = new Set(['node_modules', '.claude', '.git']);
/** @type {Map<string, { films: Map<string, string>, files: Set<string> }>} */
const seen = new Map();

// Files under a folder, three levels deep
const walk = (dir, base = '', depth = 0) => {
  const out = [];
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const rel = base ? `${base}/${e.name}` : e.name;
    if (!e.isDirectory()) out.push(rel);
    else if (depth < 3) out.push(...walk(join(dir, e.name), rel, depth + 1));
  }
  return out;
};

const tick = () => {
  let runs = [];
  try { runs = readdirSync(RUNS).filter((d) => /-(with|without)$/.test(d)); } catch {}
  for (const run of runs) {
    const work = join(RUNS, run, 'work');
    if (!existsSync(work)) continue;
    const s = seen.get(run) ?? { films: new Map(), files: new Set() };
    seen.set(run, s);
    mkdirSync(join(SNAP, run), { recursive: true });
    const log = (o) => appendFileSync(join(SNAP, run, 'events.jsonl'), JSON.stringify({ t: Date.now(), ...o }) + '\n');
    // The film is work/film.html, or film.html in the one folder the agent opened a project in
    const films = ['film.html', ...readdirSync(work, { withFileTypes: true }).filter((e) => e.isDirectory() && !SKIP.has(e.name)).map((e) => `${e.name}/film.html`)];
    for (const rel of films) {
      const film = join(work, rel);
      if (!existsSync(film)) continue;
      try {
        const buf = readFileSync(film);
        const sha = createHash('sha1').update(buf).digest('hex').slice(0, 12);
        if (s.films.get(rel) !== sha) {
          s.films.set(rel, sha);
          copyFileSync(film, join(SNAP, run, `film-${Date.now()}.html`));
          log({ kind: 'film', path: rel, size: buf.length, sha });
        }
      } catch {}
    }
    for (const rel of walk(work)) {
      if (s.files.has(rel)) continue;
      s.files.add(rel);
      let size = 0;
      try { size = statSync(join(work, rel)).size; } catch {}
      log({ kind: 'file', path: rel, size });
    }
  }
};
setInterval(tick, 2000);
tick();
