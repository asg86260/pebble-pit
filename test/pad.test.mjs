// A pad (DESIGN.md, "Controller support"): the focus walks the one list of
// stops, A does what a click there does, and a body in the pad's hand goes
// where the hand takes it at the hand's speed and no faster. Everything here
// is pressed through `__pad`, the checks' own pad, read by pad.js exactly as
// a real one is -- never by setting the focus or the body by hand.

import { group, ok, run, runUntil, haveRock } from './helpers.mjs';
import { S } from '../src/state.js';
import { STATIONS, standRect } from '../src/stations.js';
import { hopTarget } from '../src/hop.js';
import { setPref } from '../src/prefs.js';
import { PAD_HAND_SPEED, WORKER, SKIP_HOLD_MS } from '../src/config.js';
import { dropTargets } from '../src/crew/assign.js';
import { skippable } from '../src/skip.js';

const pad = () => window.__pad;
// A frame of the pad and a frame of the yard, the way the page turns both.
const frame = () => { pad().step(1 / 60); run(1 / 60); };
// Wake the pad, with the camera cut rather than glided so a hop's stop is on
// the glass the frame after (the glide itself is lookAt's, checked in
// hop.test.mjs).
function wake() {
  setPref('motion', true);
  pad().off();
  pad().on();
  pad().press('b');
}
const done = () => { pad().off(); setPref('motion', null); };

// --- 1. one list -------------------------------------------------------------------
group('the stops are every standing station, the rock between them, left to right', async () => {
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  haveRock();
  wake();
  const ids = pad().stops();
  const standing = STATIONS.filter(r => r.name && r.stand && standRect(r.key) && standRect(r.key).y < S.worldH)
    .map(r => `st:${r.key}`);
  const missing = standing.filter(id => !ids.includes(id));
  // The hop arrows walk the same list: every station they would go to is a stop.
  const hopKeys = [];
  for (let t = hopTarget(1, 0), n = 0; t && n < 30; t = hopTarget(1, t.mid - S.viewW / 2), n++) hopKeys.push(`st:${t.key}`);
  done();
  return [
    ok(ids.includes('rock'), 'the rock is a stop', ids.join(' ')),
    ok(missing.length === 0, 'every standing station is a stop', missing.join(' ')),
    ok(hopKeys.every(k => ids.includes(k)), "every hop arrow's station is a stop", hopKeys.join(' ')),
  ];
});

// --- 2. hops in order --------------------------------------------------------------
group('the d-pad hops the stops in order, one press a stop, and the camera follows', async () => {
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  run(0.5);
  wake();
  const ids = pad().stops();
  for (let i = 0; i < ids.length + 2; i++) pad().press('left');
  const first = pad().focus();
  const walked = [first];
  const seen = [];
  for (let i = 1; i < ids.length; i++) {
    pad().press('right');
    walked.push(pad().focus());
    const b = pad().box();
    seen.push(b && b.x + b.w > S.camX && b.x < S.camX + S.viewW);
  }
  const atEnd = pad().focus();
  pad().press('right');
  const still = pad().focus();
  done();
  return [
    ok(first === ids[0], 'pressed left to the end, the focus is on the first stop', `${first} of ${ids[0]}`),
    ok(walked.join() === ids.join(), 'and right walks every stop in yard order', walked.join(' ')),
    ok(seen.every(Boolean), 'with the view on each as it arrives', seen.join()),
    ok(still === atEnd, 'and the last press at the end of the world goes nowhere', `${atEnd} -> ${still}`),
  ];
});

// --- 3. a focus is not a hover -----------------------------------------------------
group('arriving at a station opens nothing; A opens its board and B puts it away', async () => {
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  run(0.5);
  wake();
  for (let i = 0; i < 12 && pad().focus() !== 'st:farm'; i++) pad().press(pad().stops().indexOf('st:farm') < pad().stops().indexOf(pad().focus()) ? 'left' : 'right');
  const on = pad().focus();
  const openOnArrival = S.farmBoardOpen;
  pad().press('a');
  const opened = S.farmBoardOpen;
  pad().press('b');
  const closed = !S.farmBoardOpen;
  const back = pad().focus();
  done();
  return [
    ok(on === 'st:farm', 'the focus got to the farm', on),
    ok(!openOnArrival, 'and the farm board is not up for its being there'),
    ok(opened, 'A opens it'),
    ok(closed && back === 'st:farm', 'B puts it away and the focus is back on the farm', back),
  ];
});

// --- 4. the roster, from the pad ---------------------------------------------------
group("down steps into a station's roster, and its plus is the roster's plus", async () => {
  window.__crew(2, 6, 0, 0);
  window.__fullSites();
  run(1);
  wake();
  for (let i = 0; i < 12 && pad().focus() !== 'st:farm'; i++) pad().press(pad().stops().indexOf('st:farm') < pad().stops().indexOf(pad().focus()) ? 'left' : 'right');
  pad().press('down');
  const less = pad().focus();
  pad().press('right');
  const more = pad().focus();
  const before = S.farmhands;
  pad().press('a');
  const after = S.farmhands;
  pad().press('up');
  const up = pad().focus();
  done();
  return [
    ok(less === 'st:farm|ros:farmjob:less', 'down lands on the minus', less),
    ok(more === 'st:farm|ros:farmjob:more', 'right goes to the plus', more),
    ok(after === before + 1, 'A on it puts one more on the farm', `${before} -> ${after}`),
    ok(up === 'st:farm', 'and up is the station again', up),
  ];
});

// --- 5. the rock --------------------------------------------------------------------
group('A on the rock is a swing at it', async () => {
  window.__crew(0, 0);
  haveRock();
  wake();
  for (let i = 0; i < 12 && pad().focus() !== 'rock'; i++) pad().press(pad().stops().indexOf('rock') < pad().stops().indexOf(pad().focus()) ? 'left' : 'right');
  const on = pad().focus();
  const cells = () => S.boulder.flat().reduce((a, v) => a + (v || 0), 0);
  const before = cells();
  pad().press('a');
  const after = cells();
  done();
  return [
    ok(on === 'rock', 'the focus is on the rock', on),
    ok(after < before, 'and A took stone off it', `${before} -> ${after}`),
    ok(S.handChipped, 'by your own hands'),
  ];
});

// --- 6. the carry ----------------------------------------------------------------
// One body followed from its lift to its drop, a minute's walk at most: the
// reload harness would stand a fresh body up in the middle of a carry and
// the hand would be holding nobody (a page reload starts with nothing in it).
group('a body in the pad\'s hand is carried, never moved faster than the hand', async () => {
  window.__crew(0, 6, 0, 0);
  window.__fullSites();
  run(6);
  wake();
  // At the house, where the haulers are.
  const stopsNow = pad().stops();
  const near = 'st:house';
  for (let i = 0; i < 12 && pad().focus() !== near; i++) pad().press(stopsNow.indexOf(near) < stopsNow.indexOf(pad().focus()) ? 'left' : 'right');
  pad().down('lt');
  frame();
  // Under sight, find a hauler: the d-pad walks the bodies.
  let w = pad().body();
  for (let i = 0; i < 20 && w && w.type !== 'hauler'; i++) { pad().press('right'); w = pad().body(); }
  if (!w || w.type !== 'hauler') for (let i = 0; i < 40 && w && w.type !== 'hauler'; i++) { pad().press('left'); w = pad().body(); }
  const picked = w && w.type;
  pad().down('a');
  frame();
  const lifted = pad().carried() === w && w.lifted;
  // The farm's drop spot: the d-pad carries the body there, a frame at a time.
  const farm = dropTargets().find(t => t.key === 'farm');
  const goal = farm.ring.x + farm.ring.w / 2;
  const dir = goal < w.x ? 'left' : 'right';
  // A press a station: as many as stand between the hand and the farm.
  const mids = dropTargets().map(t => t.ring.x + t.ring.w / 2);
  const x0 = w.x + WORKER / 2;
  const hops = mids.filter(m => (dir === 'left' ? m < x0 - 6 && m >= goal : m > x0 + 6 && m <= goal)).length;
  for (let i = 0; i < hops; i++) { pad().down(dir); frame(); pad().up(dir); frame(); }
  let worst = 0, frames = 0;
  const step = PAD_HAND_SPEED / 60;
  let was = { x: w.x, y: w.y };
  while (frames < 60 * 30 && Math.abs(w.x + WORKER / 2 - goal) > 1) {
    frame();
    frames++;
    worst = Math.max(worst, Math.hypot(w.x - was.x, w.y - was.y));
    was = { x: w.x, y: w.y };
    if (!w.lifted) break;
  }
  const arrived = Math.abs(w.x + WORKER / 2 - goal) <= 1;
  const farmBefore = S.farmhands;
  pad().up('a');
  frame();
  pad().up('lt');
  frame();
  const retrained = runUntil(() => S.farmhands > farmBefore || w.type === 'farmhand', 30);
  done();
  return [
    ok(picked === 'hauler', 'sight finds a hauler', picked),
    ok(lifted, 'LT and A lift it'),
    ok(frames > 1, 'the carry takes frames, not one', `${frames}`),
    ok(worst <= step + 1e-6, 'and no frame moves it further than the hand goes in one', `${worst.toFixed(2)} of ${step.toFixed(2)}`),
    ok(arrived, 'it gets to the farm', `${Math.round(w.x)} of ${Math.round(goal)}`),
    ok(retrained, 'and let go there, it is put on the farm', `${farmBefore} -> ${S.farmhands}, ${w.type}`),
  ];
}, { reload: false });

// --- 7. a scene ----------------------------------------------------------------------
group('A held through a scene skips it, as the space bar does', async () => {
  window.__reset(true);
  run(0.5);
  const up = skippable();
  pad().off();
  pad().on();
  pad().down('a');
  let n = 0;
  while (skippable() && n < 60 * (SKIP_HOLD_MS / 1000 + 2)) { frame(); n++; }
  pad().up('a');
  frame();
  const gone = !skippable();
  done();
  return [
    ok(up, 'the opening has the yard'),
    ok(gone, 'and A held long enough ends it', `${n} frames`),
  ];
});
