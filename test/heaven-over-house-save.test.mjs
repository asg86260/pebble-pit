// A save from before heaven's gates moved over the house (2026-11-01), read
// into today's yard: the home is laid out from the yard's edge now, not past
// a stairway, so the whole yard stands further left, and the migration
// (src/migrations/2026-11-01-gates-over-house.js) moves everything the save
// holds by world x with it. The fixture is the widest yard in act 4, the
// pair on the road as ghosts, a crew at work, saved on the old layout.
//
// Asserted: every body stands where the old layout stood it on loading the
// same save, against the ground it stood on -- its x less the ground's
// anchor (`S.cx`), within a cell, read off the old build into
// `heaven-over-house-before-stood.json` -- the house and the ground moved by
// the same distance, the pair and the two at home with them, and the yard
// runs on with every rule in verify.js quiet. And the pair saved on the
// stair that is gone float on from where they were, down to the ruin.
import { readFileSync } from 'node:fs';
import { group, ok, run, yard } from './helpers.mjs';

const S = yard.S;
const { P, FINALE_END_CELLS } = await import('../src/config.js');
const { houseX } = await import('../src/home.js');
const { ruinX, yardFeet } = await import('../src/ghosts.js');

const RAW = readFileSync(new URL('./fixtures/heaven-over-house-before.json', import.meta.url), 'utf8');
const STOOD = JSON.parse(readFileSync(new URL('./fixtures/heaven-over-house-before-stood.json', import.meta.url), 'utf8'));
const OLD_DOOR = 81;   // cells: the door's cell off the yard's edge on the old layout

function load(raw) {
  localStorage.setItem('boulder-clicker/v4', raw);
  yard.restore();
}

group('a save from before the gates moved: every body where it stood against the ground', async () => {
  const s = JSON.parse(RAW);
  load(RAW);
  const off = [];
  for (const w of S.workers) {
    const then = STOOD.workers[w.uid];
    if (then != null && Math.abs(w.x - S.cx - then) > P) off.push(`${w.uid} ${w.type} ${Math.round(then)} -> ${Math.round(w.x - S.cx)}`);
  }
  STOOD.lifts.forEach((then, i) => { const l = S.lifts[i]; if (!l || Math.abs(l.x - S.cx - then) > P) off.push(`lift ${i}`); });
  const pair = Math.abs(S.acts.pair.x - S.cx - STOOD.pair);
  const home = STOOD.retired.map((then, i) => Math.abs(S.retired.x[i] - S.cx - then));
  const house = { then: STOOD.house, now: houseX() - S.cx };
  const moved = { anchor: S.cx - STOOD.cx, door: (FINALE_END_CELLS - OLD_DOOR) * P, cam: S.camWas == null ? null : S.camWas - S.cx - STOOD.camWas };
  run(3);
  const after = { workers: S.workers.length, saved: s.who.length, pair, home, house, moved, saveV: s.saveV };
  return [
    ok(moved.anchor < 0 && moved.anchor === moved.door, 'the ground and the house both moved left by the same distance', JSON.stringify(after)),
    ok(house.then === house.now, 'the house stands where it stood against the ground', JSON.stringify(house)),
    ok(off.length === 0 && S.workers.length >= Object.keys(STOOD.workers).length, 'every body and lift stands where it stood against the ground, within a cell', off.join('; ') || `${after.workers} of ${after.saved}`),
    ok(pair < P && home.every(d => d < P), 'the pair on the road and the two at home moved with it', JSON.stringify(after)),
    ok(moved.cam === 0, 'the camera moved with it', JSON.stringify(moved))
  ];
});

group('the pair saved on the stair that is gone float on down to the ruin', async () => {
  const s = JSON.parse(RAW);
  // as the old yard saved them partway down the stair: route `down`, a stair
  // leg, out in the air left of the house
  Object.assign(s.acts.pair, { route: 'down', leg: 9, at: null, x: s.acts.pair.x - 30 * P, y: s.floor.cx > 0 ? 1980 - 20 * P : 1800 });
  load(JSON.stringify(s));
  // (read afresh each frame: the harness's reloads put a new pair in its place)
  const pair = () => S.acts.pair, start = { route: pair().route, leg: pair().leg };
  let jump = 0, was = null;
  for (let i = 0; i < 60 * 60 && pair().route === 'down'; i++) {
    run(1 / 60);
    const p = pair();
    if (was) jump = Math.max(jump, Math.hypot(p.x - was.x, p.y - was.y));
    was = { x: p.x, y: p.y };
  }
  const p = pair();
  const end = { start, at: p.at, x: p.x, y: p.y, ruin: { x: ruinX(), y: yardFeet(ruinX()) }, jump: +jump.toFixed(1) };
  return [
    ok(start.route === 'down' && start.leg === 2, 'put on the float down', JSON.stringify(end)),
    ok(Math.hypot(p.x - end.ruin.x, p.y - end.ruin.y) < 1 && jump < P * 4, 'and floated down to the ruin, a step a frame', JSON.stringify(end))
  ];
});
