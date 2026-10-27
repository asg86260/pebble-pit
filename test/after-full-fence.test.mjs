// A player's yard from the field (the owner, 2026-10-21: "the workers just
// dont do anything"), kept from when the fence's forty posters were up and
// idle members stood holding sheets; posters are cut since 2026-10-26, and
// the save is read through that cut (src/migrations/2026-10-26-cut-paper.js).
//
// Its one sawyer stood at a bare mill while 46 logs lay in the grove, with
// no gatherer or hauler to bring them (DESIGN.md, "Act 3: one job a
// station"). Idle hands carry them in now, and the sawyer fetches its own.
import { readFileSync } from 'node:fs';
import { yard, group, ok, runUntil } from './helpers.mjs';

group('the yard\'s idle hands bring the grove\'s logs in and its sawyer saws them, nobody else put on', async () => {
  localStorage.setItem('boulder-clicker/v4', readFileSync(new URL('./fixtures/act3-full-fence.json', import.meta.url), 'utf8'));
  yard.restore();
  // Its timber stands past the timber pile's brim, which stops the saw
  // (after/piles.js): spent first, as a bill would spend it, so the saw has room.
  window.__afterGrant({ timber: -yard.S.after.stock.timber });
  const S = yard.S, t0 = S.after.stock.timber, lying = S.after.groundLogs.filter(q => (q.kind || 'log') === 'log').length;
  const sawn = runUntil(() => S.after.stock.timber > t0, 300);
  return [ok(lying > 0 && sawn, 'timber rises off the logs that lay in the grove', `${lying} lying, timber ${t0} -> ${S.after.stock.timber}`)];
});
