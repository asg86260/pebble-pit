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

const mid = s => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 });

// A press, and every frame after it until the marker has landed and the
// camera has stopped: the marker on the glass and in the yard, and the
// camera.
function follow(dir) {
  const was = pad().focus();
  const m0 = pad().mark();
  const frames = [{ seen: m0.seen, at: mid(m0.r), cam: S.camX }];
  pad().down(dir);
  frame();
  pad().up(dir);
  for (let i = 0; i < 150; i++) {
    const m = pad().mark();
    frames.push({ seen: m.seen, at: mid(m.r), cam: S.camX });
    if (m.landed && S.camTo === null) break;
    frame();
  }
  const first = frames[0], last = frames[frames.length - 1];
  // Through the places between, in the yard: the marker going from the old
  // thing to the new one, whatever the camera does under it.
  const far = Math.hypot(last.at.x - first.at.x, last.at.y - first.at.y);
  let between = 0, worst = 0, out = 0;
  const g0 = mid(first.seen);
  for (let i = 1; i < frames.length; i++) {
    const d = Math.hypot(frames[i].at.x - first.at.x, frames[i].at.y - first.at.y);
    if (d > far * 0.1 && d < far * 0.9) between++;
    const a = mid(frames[i - 1].seen), b = mid(frames[i].seen);
    worst = Math.max(worst, Math.hypot(b.x - a.x, b.y - a.y));
    out = Math.max(out, Math.hypot(b.x - g0.x, b.y - g0.y));
  }
  // The camera's steps, frame by frame, while it moved.
  const steps = [];
  for (let i = 1; i < frames.length; i++) { const s = Math.abs(frames[i].cam - frames[i - 1].cam); if (s > 0.01) steps.push(s); }
  return { was, now: pad().focus(), far, between, worst, out, steps,
           centered: Math.abs(mid(pad().box()).x - (S.camX + S.viewW / 2)) };
}

// A few cells a frame: the speed the glide is held to, and the camera's own
// share as it carries the end along, at most as much again.
const cell = () => P * S.zoom;
const LIMIT = () => (PAD_GLIDE_SPEED / 60) * 2;

group('a hop: the camera pans to center the new thing, eased in and out, and the marker is seen to travel there', async () => {
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  run(1);
  wake();
  const out = [];
  let hops = 0;
  for (const d of ['left', 'left', 'left', 'right', 'right']) {
    const f = follow(d);
    if (f.now === f.was) continue;
    hops++;
    const peak = Math.max(0, ...f.steps);
    const pan = f.steps.length > 0;
    const eased = f.steps.length >= 4 && f.steps[0] < peak / 2 && f.steps[f.steps.length - 1] < peak / 2;
    out.push(ok(f.between >= 3, `${f.was} ${d} -> ${f.now}: the marker passes through the places between`,
                `${f.between} frames between, ${Math.round(f.far)} world px`));
    out.push(ok(f.out >= cell() * 3, 'and is seen to move on the glass while the camera pans',
                `${(f.out / cell()).toFixed(1)} cells out from where it stood`));
    out.push(ok(f.worst <= LIMIT(), 'and no frame carried it more than a few cells',
                `${(f.worst / cell()).toFixed(1)} cells of ${(LIMIT() / cell()).toFixed(1)}`));
    out.push(ok(!pan || eased, 'the camera eases in and out', f.steps.map(s => s.toFixed(1)).join(' ')));
    out.push(ok(!pan || f.centered <= cell() * 2, 'and ends with the new thing in the middle', `${Math.round(f.centered)} px off`));  }
  done();
  out.unshift(ok(hops >= 3, 'the focus hopped', `${hops}`));
  return out;
}, { reload: false });

