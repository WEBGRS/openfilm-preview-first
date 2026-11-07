// evals/measure.mjs reads a finished run: a whole preview, a gap, a sound clip, a short film and the closing question
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const MEASURE = join(import.meta.dirname, '..', 'evals', 'measure.mjs');
const WORDS = 'the saturn rocket lifts off from the pad at kennedy and the whole crew rides it to orbit'; // 18 words

/** A film.html of `n` twelve-second cards; `skip` leaves one card out, `sound` adds a music clip */
function film(n, { skip = -1, sound = false, w = 1920, h = 1080 } = {}) {
  const cards = [];
  for (let i = 0; i < n; i++) if (i !== skip) cards.push(`<iframe src="cards/${i}.html#t=0,12" at="${i * 12}"></iframe>`);
  return `<!doctype html><html><head><meta name="viewport" content="width=${w}, height=${h}"></head><body>
<section>${cards.join('\n')}</section>${sound ? '<section><audio src="assets/bed.mp3#t=0,60" at="0"></audio></section>' : ''}</body></html>`;
}

/** A run folder as of-eval.mjs leaves it, holding `html` as the film the agent wrote */
function makeRun(html, { final = 'The preview is up. Shall I go on to the pictures?' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pf-measure-'));
  mkdirSync(join(dir, 'work', 'cards'), { recursive: true });
  writeFileSync(join(dir, 'work', 'film.html'), html);
  for (let i = 0; i < 12; i++) writeFileSync(join(dir, 'work', 'cards', `${i}.html`), `<h1>Section ${i}</h1><p>${WORDS}</p>`);
  const usage = { input_tokens: 2, output_tokens: 100, cache_read_input_tokens: 10000, cache_creation_input_tokens: 1000 };
  const lines = [
    { type: 'system', subtype: 'init', model: 'claude-sonnet-5-5' },
    { type: 'assistant', timestamp: '2026-11-06T10:00:00.000Z', message: { id: 'a', usage, content: [{ type: 'text', text: 'Reading.' }] } },
    { type: 'assistant', timestamp: '2026-11-06T10:03:00.000Z', message: { id: 'b', usage, content: [{ type: 'tool_use', id: 't', name: 'Write', input: { file_path: 'C:/p/work/film.html', content: html } }] } },
    { type: 'assistant', timestamp: '2026-11-06T10:05:00.000Z', message: { id: 'c', usage, content: [{ type: 'text', text: final }] } },
    { type: 'result', subtype: 'success', num_turns: 3, result: final, total_cost_usd: 0.3, usage: { output_tokens: 300 } },
  ];
  writeFileSync(join(dir, 'run.jsonl'), lines.map((l) => JSON.stringify(l)).join('\n'));
  writeFileSync(join(dir, 'done.json'), JSON.stringify({ minutes: 5, cost: 0.3 }));
  return dir;
}

const measure = (dir, ...args) => JSON.parse(execFileSync('node', [MEASURE, dir, '--want', '120', ...args], { encoding: 'utf8' }));

test('a whole preview is found at the write that made it, with its cost', () => {
  const dir = makeRun(film(10));
  try {
    const m = measure(dir, '--frame', 'landscape');
    assert.equal(m.firstWholeFilm.via, 'own writes');
    assert.equal(m.firstWholeFilm.minutes, 3);
    assert.equal(m.finalFilm.seconds, 120);
    assert.equal(m.finalFilm.gaps, 0);
    assert.equal(m.finalFilm.audioClips, 0);
    assert.deepEqual(m.madeOutside, []);
    assert.equal(m.frameAsRequested, true);
    assert.equal(m.finalMessageAsks, true);
    assert.ok(m.firstWholeFilm.cost > 0 && m.firstWholeFilm.cost < 0.3);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a card left out is a gap, and the film is not whole', () => {
  const dir = makeRun(film(10, { skip: 4 }));
  try {
    const m = measure(dir);
    assert.equal(m.finalFilm.gaps, 12);
    assert.equal(m.firstWholeFilm, null);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a sound clip is counted, so a preview with voice or music shows', () => {
  const dir = makeRun(film(10, { sound: true }));
  try { assert.equal(measure(dir).finalFilm.audioClips, 1); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a film shorter than planned is not whole', () => {
  const dir = makeRun(film(5));
  try { assert.equal(measure(dir).firstWholeFilm, null); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the pace of the words on a card is read, and a tall frame is not landscape', () => {
  const dir = makeRun(film(10, { w: 1080, h: 1920 }));
  try {
    const m = measure(dir, '--frame', 'landscape');
    assert.equal(m.frameAsRequested, false);
    assert.equal(m.cards.n, 10);
    assert.equal(m.cards.medianPace, 1.5); // 18 words in 12 s
    assert.equal(m.cards.paceInRange, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a closing message with no question is read as not asking', () => {
  const dir = makeRun(film(10), { final: 'Done. The film is finished.' });
  try { assert.equal(measure(dir).finalMessageAsks, false); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});
