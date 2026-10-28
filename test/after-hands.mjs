// Act 3's hand work as a player does it (after/gestures.js): every motion a
// press, moves a frame of the act's clock apart, and a release, through the
// very calls input.js makes, at the world points where each part is drawn.
// Shared by the checks that need a station worked by hand; the rules of
// each motion are test/after-gestures.test.mjs's.
import { run, yard, P } from './helpers.mjs';
import { GESTURE_SAW_AMP, GESTURE_STUMP_DRAG, GESTURE_NAILS, GESTURE_NAIL_TAPS, GESTURE_SWING_S } from '../src/config.js';
import { gestureDown, gestureMove, gestureUp, groveIcons, partsOf } from '../src/after/gestures.js';
import { stationAt } from '../src/stations.js';
import { shopBoxOf, rosterHit, rosterUp } from '../src/roster.js';

const S = yard.S;
export const FRAME = 1 / 60;
export const frame = () => run(FRAME);
const mid = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
export const click = p => { const took = gestureDown(p.x, p.y); gestureUp(p.x, p.y); return took; };
// A plain press as input.js answers it up there: the hand work's first, else
// the station under it (the one station table, stations.js `stationAt`), its
// board's key; null for neither.
export const asks = p => (click(p) ? null : stationAt(p.x, p.y));
// ...and the board that press opens (input.js `clickBoard`): none on a
// station whose board has its UPGRADES button standing, the button being
// the one way in there.
export const opens = p => { const k = asks(p); return k && !shopBoxOf(k) ? k : null; };
// A press on a board's UPGRADES button, through the roster's own hit test
// (the call input.js makes): the board it asks for, or null off every one.
export const pressShop = key => {
  const b = shopBoxOf(key);
  if (!b) return null;
  const r = rosterHit(b.x + b.w / 2, b.y + b.h / 2);
  rosterUp();
  return typeof r === 'string' ? r : null;
};

// Frames until `done`, each first moved by `motion(t)` (t the seconds since
// it began); the seconds it took, or Infinity past `limit`.
export function timeTo(motion, done, limit = 40) {
  for (let f = 0; f < limit * 60; f++) {
    motion(f * FRAME);
    frame();
    if (done()) return (f + 1) * FRAME;
  }
  return Infinity;
}

// The saw put on plot i's tree by its icon: true if the icon was there.
export function sawOn(i = 0) {
  const icon = groveIcons().find(c => c.kind === 'saw' && c.i === i);
  if (!icon) return false;
  return click({ x: icon.box.x + icon.box.w / 2, y: icon.box.y + icon.box.h / 2 });
}
// The saw on plot i dragged back and forth, a stroke every `period` / 2
// seconds, until `done` or `limit`; the seconds it took.
export function saw(i, done, period = 0.6, limit = 60) {
  const b = partsOf('tree', i).sawBox, x0 = b.x + P * 2, y = b.y + b.h / 2;
  gestureDown(x0, y);
  const secs = timeTo(t => gestureMove(x0 + Math.sin(t / period * 2 * Math.PI) * GESTURE_SAW_AMP * 1.2, y), done, limit);
  gestureUp(x0, y);
  return secs;
}
// Plot i's stump taken hold of and dragged up `cells` cells, held there `secs`.
export function lift(i, cells, secs) {
  const g = mid(partsOf('stump', i).stump);
  gestureDown(g.x, g.y);
  gestureMove(g.x, g.y - cells * P / GESTURE_STUMP_DRAG);
  run(secs);
  gestureUp(g.x, g.y);
}
// Station `key`'s round part (the saw mill's wheel) turned at `rev` turns a
// second until `done`; the seconds it took.
export function spin(key, rev, done, limit = 40) {
  const part = partsOf(key).wheel;
  const at = a => ({ x: part.x + Math.cos(a) * part.r, y: part.y + Math.sin(a) * part.r });
  const p0 = at(0);
  gestureDown(p0.x, p0.y);
  const secs = timeTo(t => { const p = at(t * rev * 2 * Math.PI); gestureMove(p.x, p.y); }, done, limit);
  gestureUp(p0.x, p0.y);
  return secs;
}

// Every nail of the sign on the workshop's bench tapped flush, a tap every
// `every` seconds; the taps made.
export function nailSign(every = GESTURE_SWING_S * 2) {
  let taps = 0;
  for (let k = 0; k < GESTURE_NAILS; k++) for (let n = 0; n < GESTURE_NAIL_TAPS; n++) {
    click(mid(partsOf('workshop').nails[k])); taps++; run(every);
  }
  return taps;
}

// A load off the heap carried slowly to the notch and let go there.
export function tipHeap() {
  const p = partsOf('heap'), a = mid(p.heap), to = p.edge + P;
  if (!gestureDown(a.x, a.y)) return false;
  timeTo(t => gestureMove(a.x + Math.min(1, t / 1.5) * (to - a.x), a.y), () => false, 1.6);
  gestureUp(to, a.y);
  run(0.5);
  return true;
}
export { S };
