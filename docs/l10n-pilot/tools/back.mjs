// Back-translation of version A (the drafts) through the machine engine,
// xx -> en, one language a run. The line sent is the draft as a player reads
// it with fixed arguments (results/render.json: a number is 5, a word X).
// Version B is back-translated by hand instead (results/back/machine-<lang>.json),
// so neither version is judged by the system that wrote it.
//
//   node docs/l10n-pilot/tools/back.mjs <lang>
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SAMPLE } from './lib.mjs';
import { translate, done, MT } from './engine.mjs';

// With `machine` as a second argument it also sends version B back through
// its own engine (results/back/machine-self-<lang>.json): not a score either
// version is judged by, but the measure of how far a system flatters itself.
const lang = process.argv[2];
const version = process.argv[3] === 'machine' ? 'machine' : 'draft';
const renders = JSON.parse(fs.readFileSync(path.join(ROOT, 'results', 'render.json'), 'utf8'));
const lines = SAMPLE.map(id => renders[`${lang}.${version}`][id]);
const out = await translate(MT[lang], 'en', lines, false);
done();
fs.mkdirSync(path.join(ROOT, 'results', 'back'), { recursive: true });
const name = version === 'draft' ? `draft-${lang}.json` : `machine-self-${lang}.json`;
fs.writeFileSync(path.join(ROOT, 'results', 'back', name), JSON.stringify(Object.fromEntries(SAMPLE.map((id, i) => [id, out[i]])), null, 1));
console.log(lang, out.length);
