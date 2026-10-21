// A player's yard from the field (the owner, 2026-10-21: "the workers just
// dont do anything"): the fence's forty posters up and three idle members on
// the paster's errand, each still holding sheets with nowhere left to paste
// them. Held, they were neither idle nor on a job, so the podium had nobody
// to send and the + nobody to put to work.
import { readFileSync } from 'node:fs';
import { yard, group, ok, run, runUntil } from './helpers.mjs';
import { isIdle } from '../src/after/build.js';

group('with the fence full, posters in hand go back to the press and their hands come free', async () => {
  localStorage.setItem('boulder-clicker/v4', readFileSync(new URL('./fixtures/act3-full-fence.json', import.meta.url), 'utf8'));
  yard.restore();
  const S = yard.S, held = () => S.after.bodies.filter(b => b.load === 'posters');
  const n = held().length, p0 = S.after.stock.posters;
  const back = runUntil(() => held().length === 0, 120);
  run(1);
  return [
    ok(n > 0 && back, 'nobody is left holding posters', `${n} held, ${held().length} still`),
    ok(S.after.stock.posters > p0, 'the sheets are put back on the press\'s pile', `${p0} -> ${S.after.stock.posters}`),
    ok(S.after.bodies.filter(isIdle).length >= 2 + n, 'and their hands are idle again', `${S.after.bodies.filter(isIdle).length} idle`)
  ];
});
