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

// The same yard's other dead end: its one sawyer stood at a bare mill while
// 46 logs lay in the grove, with no gatherer or hauler to bring them (DESIGN.md,
// "Act 3: one job a station"). Idle hands carry them in now, and the sawyer
// fetches its own.
group('the yard\'s idle hands bring the grove\'s logs in and its sawyer saws them, nobody else put on', async () => {
  localStorage.setItem('boulder-clicker/v4', readFileSync(new URL('./fixtures/act3-full-fence.json', import.meta.url), 'utf8'));
  yard.restore();
  const S = yard.S, t0 = S.after.stock.timber, lying = S.after.groundLogs.length;
  const sawn = runUntil(() => S.after.stock.timber > t0, 300);
  return [ok(lying > 0 && sawn, 'timber rises off the logs that lay in the grove', `${lying} lying, timber ${t0} -> ${S.after.stock.timber}`)];
});
