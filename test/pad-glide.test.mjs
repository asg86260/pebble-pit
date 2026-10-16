// The pad's marker travels from the thing it was on to the thing it is on,
// on the glass, where the player can follow it (the owner, 2026-10-16: "i
// also want to see the corner bracket transition between elements"). Its box
// on the glass is read every frame of a press: it must pass through the
// places between, and no frame may carry it further than a few cells, with
// the camera standing or gliding after it. Across to the corner cards and a
// board's rows is the browser group's (src/selftest/pad.js), since those are
// the page's.
//
// The marker runs on the wall clock, as the page does; here the wall clock
// is turned a frame at a time with the yard's, so a frame is a frame however
// fast the machine is.

import { group, ok, run } from './helpers.mjs';
import { S } from '../src/state.js';
import { setPref } from '../src/prefs.js';
import { P, PAD_GLIDE_SPEED } from '../src/config.js';

const pad = () => window.__pad;
let clock = 1e6;
const realNow = performance.now.bind(performance);
const frame = () => { clock += 1000 / 60; pad().step(1 / 60); run(1 / 60); };

function wake() {
  performance.now = () => clock;
  setPref('motion', null);           // the glide is a motion; this is about it
  pad().off();
  pad().on();
  pad().press('b');
  for (let i = 0; i < 90; i++) frame();
}
const done = () => { pad().off(); performance.now = realNow; };

// The marker's box on the glass, as padglide.js reports it.
const glass = m => m.seen;

// A press, and the marker's box on the glass every frame until it has
// landed: the most any frame moved it, how many frames it was between, and
// whether it ended on the new thing.
function follow(dir) {
  const was = pad().focus();
  const start = glass(pad().mark());
  pad().down(dir);
  frame();
  pad().up(dir);
  const seen = [start];
  for (let i = 0; i < 150; i++) {
    const m = pad().mark();
    seen.push(glass(m));
    if (m.landed) break;
    frame();
  }
  const mid = s => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 });
  let worst = 0, between = 0;
  const end = mid(seen[seen.length - 1]), from = mid(start);
  const far = Math.hypot(end.x - from.x, end.y - from.y);
  for (let i = 1; i < seen.length; i++) {
    const a = mid(seen[i - 1]), b = mid(seen[i]);
    worst = Math.max(worst, Math.hypot(b.x - a.x, b.y - a.y));
    const d = Math.hypot(b.x - from.x, b.y - from.y);
    if (d > far * 0.1 && d < far * 0.9) between++;
  }
  return { was, now: pad().focus(), worst, between, far };
}

// A few cells a frame: the speed the glide is held to, and the camera's own
// share as it carries the end along, at most as much again.
const CELLS = () => (PAD_GLIDE_SPEED / 60) * 2 / (P * S.zoom);

group('the marker travels between neighbors, a few cells a frame', async () => {
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  run(1);
  wake();
  const out = [];
  for (const d of ['left', 'left', 'right']) {
    const f = follow(d);
    out.push(ok(f.now !== f.was && f.between >= 3, `${f.was} ${d} -> ${f.now}: through the places between`,
                `${f.between} frames between, ${Math.round(f.far)} px`));
    out.push(ok(f.worst / (P * S.zoom) <= CELLS(), 'and no frame carried it more than a few cells',
                `${(f.worst / (P * S.zoom)).toFixed(1)} cells of ${CELLS().toFixed(1)}`));
  }
  done();
  return out;
}, { reload: false });

group('the marker travels on the glass while the camera glides after it', async () => {
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  run(1);
  wake();
  // To the far end, a press at a time, each hop a pan.
  const out = [];
  let pans = 0;
  for (let i = 0; i < 6; i++) {
    const cam = S.camX;
    const f = follow('left');
    if (f.now === f.was) break;
    const panned = Math.abs(S.camX - cam) > P;
    pans += panned;
    out.push(ok(f.between >= 3, `${f.was} -> ${f.now}${panned ? ', panning' : ''}: through the places between`,
                `${f.between} frames between, ${Math.round(f.far)} px`));
    out.push(ok(f.worst / (P * S.zoom) <= CELLS(), 'and no frame carried it more than a few cells',
                `${(f.worst / (P * S.zoom)).toFixed(1)} cells of ${CELLS().toFixed(1)}`));
  }
  done();
  out.unshift(ok(pans > 0, 'the camera panned on some of the hops', `${pans}`));
  return out;
}, { reload: false });
