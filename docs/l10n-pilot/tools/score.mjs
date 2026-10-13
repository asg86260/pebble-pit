// chrF of every back-translation against the English it came from, both
// rendered with the same fixed arguments. My notes inside a hand
// back-translation are in [brackets] and are dropped before scoring.
// Writes results/scores.json.
//
//   node docs/l10n-pilot/tools/score.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, LANGS, SAMPLE, chrf } from './lib.mjs';

const R = path.join(ROOT, 'results');
const en = JSON.parse(fs.readFileSync(path.join(R, 'render.json'), 'utf8')).en;
const read = f => JSON.parse(fs.readFileSync(path.join(R, 'back', f), 'utf8'));
const clean = s => (s || '').replace(/\s*\[[^\]]*\]/g, '').trim();
// The game's name is kept by both versions by rule; it is left out of the
// averages so it cannot flatter either.
const IDS = SAMPLE.filter(id => id !== 'title-gamename');
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

const out = { langs: {} };
for (const lang of LANGS) {
  const A = read(`draft-${lang}.json`), B = read(`machine-${lang}.json`), Bself = read(`machine-self-${lang}.json`);
  // The third engine, back-translating both: the one symmetric referee.
  const has = fs.existsSync(path.join(R, 'back', `argos-draft-${lang}.json`));
  const Aa = has ? read(`argos-draft-${lang}.json`) : {}, Ba = has ? read(`argos-machine-${lang}.json`) : {};
  const per = {};
  for (const id of IDS) per[id] = {
    a: chrf(clean(A[id]), en[id]), b: chrf(clean(B[id]), en[id]), bself: chrf(clean(Bself[id]), en[id]),
    aArgos: has ? chrf(Aa[id] || '', en[id]) : null, bArgos: has ? chrf(Ba[id] || '', en[id]) : null,
  };
  const m = k => has || !k.endsWith('Argos') ? mean(IDS.map(id => per[id][k])) : null;
  const wins = IDS.filter(id => per[id].aArgos > per[id].bArgos + 5).length, losses = IDS.filter(id => per[id].bArgos > per[id].aArgos + 5).length;
  out.langs[lang] = { a: m('a'), b: m('b'), bself: m('bself'), aArgos: m('aArgos'), bArgos: m('bArgos'), argosWinsA: wins, argosWinsB: losses, per };
  const f = x => x == null ? '  -  ' : x.toFixed(1);
  console.log(lang.padEnd(6), 'A via Bergamot', f(m('a')), '| B via hand', f(m('b')), '| B via own engine', f(m('bself')), '| Argos: A', f(m('aArgos')), 'B', f(m('bArgos')), `(A ahead ${wins}, B ahead ${losses})`);
}
fs.writeFileSync(path.join(R, 'scores.json'), JSON.stringify(out, null, 1));
