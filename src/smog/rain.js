import { frames } from '../clock.js';
import { EMBER_EASE, EMBER_LEAN, EMBER_PER_CELL, EMBER_LIFE_S, EMBER_RISE, EMBER_SCATTER, BOLT_EVERY_S, BOLT_FLASH_S, BOLT_FORK_AT, BOLT_FORK_LEN, BOLT_JOG, BOLT_KINK, BOLT_LIFE_S, BOLT_STEP, GOING_CAP, GOING_EASE, MUCK_MAX, P, RAIN_DRIZZLE_S, RAIN_EVERY_GIVE, RAIN_EVERY_S, RAIN_FALL, RAIN_FALL_GIVE, RAIN_GAP, RAIN_LEAN, RAIN_LEN_MIN_S, RAIN_LEN_S, RAIN_MARK, RAIN_PER_S, RAIN_RISE_S, RAIN_TAPER_FLOOR, RAIN_TAPER_S, RAIN_WASH, SMOG_GO_MS, SMOG_SINK, STORM_BREW_S } from '../config.js';
import { rand } from '../rng.js';
import { gust } from '../wind.js';
import { S } from '../state.js';
import { DROPS, GOING, SKY, raining } from './band.js';
import { colAt, muckCols, muckFloor } from './layer.js';
import { dropped, moteX, moteY } from './sky.js';

// --- the rain ----------------------------------------------------------------------
// A shower is water, and the wash is what is acid in it: a sheet of clean
// drops out of the clouds for the storm's own length, and among them the
// motes the front marked, one mote one drop, coming down as muck. A clean
// drop lands and is gone.

// What falls has to have got there first: a mote is settled once it has eased
// into the band (the same `SMOG_SINK` the sinking-in uses). Picking from the
// whole sky pulls a puff you just watched climb straight back down as a drop.
export const settled = m => !m.up && m.age >= SMOG_SINK;

// ...and part of *this* shower. Without the mark a shower feeds on the smoke
// the works put up during it and runs far longer than there was sky to
// justify; new haze belongs to the next one.
const doomed = m => settled(m) && m.rain === S.rains;

// A plain smoothstep, nought to one across [0, 1]: a shower has no corners.
const smooth = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };

// The front's share of the settled sky, marked at the roll: a uniform pick,
// so the wash is spread over the whole band and not one end of it. What is
// not marked stays up; only the house empties the sky. `S.stormLeft` is how
// many are still to fall, saved, so a reload marks that many of the rebuilt
// band and not a fresh share of it.
export function markSky(share = RAIN_WASH * S.stormHeft) {
  let marked = 0;
  for (const m of SKY) if (settled(m) && rand() < share) { m.rain = S.rains; marked++; }
  S.stormLeft = marked;
  return marked;
}

// A save coming back mid-storm: the motes still owed, out of what is settled.
export function remarkSky() {
  let up = 0;
  for (const m of SKY) if (settled(m)) up++;
  markSky(up ? Math.min(1, (S.stormLeft || 0) / up) : 0);
}

// How long this front pours: its heft's share of a full storm, and never
// under the floor, so a drizzle is still weather.
export const stormLen = () => Math.max(RAIN_LEN_MIN_S, RAIN_LEN_S * S.stormHeft);

// The shower's envelope at a moment: a drizzle at a fifth of the rate, a
// smoothstep up to the full pour, and a taper over the last seconds so it
// trails off instead of cutting.
export function envelope(t) {
  const up = 0.2 + 0.8 * smooth((t - RAIN_DRIZZLE_S) / RAIN_RISE_S);
  const tail = smooth((stormLen() - t) / RAIN_TAPER_S);
  return up * (RAIN_TAPER_FLOOR + (1 - RAIN_TAPER_FLOOR) * tail);
}

// The envelope integrated from `t` to the shower's end, in envelope-seconds:
// what the acid still has to be spread over. A coarse sum, half a second a
// step, which is well inside the smoothstep's curvature.
function envLeft(t, len) {
  let sum = 0;
  for (let x = t; x < len; x += 0.5) sum += envelope(Math.min(x + 0.25, len)) * Math.min(0.5, len - x);
  return sum;
}

// What the rain has done, for the rules: drops landed by kind and the muck the
// dirty ones laid. Only a dirty drop may mark, so `laid` never passes `dirty`.
export const LEDGER = { clean: 0, dirty: 0, laid: 0 };

// One frame of the shower. The length is the storm's own; the marked motes
// come down through it in proportion to the envelope, so the dirt arrives
// with the rain and not in a lump at the front, and the shower is over when
// its time is up and the last marked mote has gone.
export function pour(secs) {
  S.rainFor = (S.rainFor || 0) + secs;
  const t = S.rainFor;
  const len = stormLen();
  const env = envelope(t);
  // A strike now and then at the height of it. Squared on the envelope so the
  // drizzle and the taper hardly ever flash, and by the heft so a light front
  // never does; one at a time, because a second bolt over the first is a fizz.
  if (!S.bolt && rand() < secs * env * env * S.stormHeft / BOLT_EVERY_S) S.bolt = strike();

  // One sheet over the yard, born over the top of the window the whole width
  // of it, water and the washed acid alike. Not from the clouds: they are far,
  // few and parallax, so a sheet tied to them thinned to wherever a cloud
  // happened to be and slid sideways as the view scrolled. The rain is the
  // yard's -- it lands here -- so it is born over the yard and falls straight.
  const top = S.camY - P;
  const born = () => ({ x: S.camX + rand() * S.viewW, y: top });

  // The water.
  let water = RAIN_PER_S * secs * env;
  while (water > 0) {
    if (water < 1 && rand() > water) break;
    water -= 1;
    const p = born();
    DROPS.push({ x: p.x, y: p.y, dirt: false,
                 vy: RAIN_FALL + (rand() - 0.5) * RAIN_FALL_GIVE });
  }

  // The acid: which marked motes may fall, as indices. This runs every frame
  // over thousands of specks, so a pick is a swap out of the back of the list,
  // not a search.
  const pick = [];
  for (let i = 0; i < SKY.length; i++) if (doomed(SKY[i])) pick.push(i);
  // Shaped by the envelope, like the water -- a drizzle carries little acid
  // and the pour most -- and normalized by what is left of the envelope, so
  // the lot of it is down as the shower ends: this frame's share is env(t)
  // over the integral of env from now to the end. No lump in the last frame
  // (the old "whatever is left, now"), and no flat rate that drowned the
  // drizzle. Past the end, what a reload re-marked drains over the taper.
  const rest = t < len ? envLeft(t, len) : 0;
  let n = rest > 0 ? pick.length * secs * env / rest : pick.length * secs / RAIN_TAPER_S;
  const gone = new Set();
  while (n > 0 && pick.length) {
    if (n < 1 && rand() > n) break;
    n -= 1;
    const at = Math.floor(rand() * pick.length);
    const i = pick[at];
    pick[at] = pick[pick.length - 1];
    pick.pop();
    gone.add(i);
    // A marked mote is consumed -- the sky thins, the clouds pale by the
    // number -- and a dirty drop falls, its place the sheet's and not the
    // invisible mote's.
    const p = born();
    DROPS.push({ x: p.x, y: p.y, dirt: true,
                 vy: RAIN_FALL + (rand() - 0.5) * RAIN_FALL_GIVE });
    dropped(SKY[i]);
  }

  // and out of the sky in one pass, keeping the order of what is left
  if (gone.size) {
    let w = 0;
    for (let i = 0; i < SKY.length; i++) if (!gone.has(i)) SKY[w++] = SKY[i];
    SKY.length = w;
  }
  S.stormLeft = pick.length;
  if (t >= len && !pick.length) S.raining = false;
}

// --- the brew-up ---------------------------------------------------------------
// A storm that has been rolled waits STORM_BREW_S before the drizzle begins.
// `S.stormFor` is the brew's clock: -1 for no storm on the way, otherwise
// seconds since the roll. The marking and the count of rains happen at the
// roll (`stepSmog`), so the shower rains the sky that earned it, not whatever
// climbed up while it brewed.
export const brewing = () => S.stormFor >= 0;

export function stepStorm(secs) {
  if (!brewing()) return;
  S.stormFor += secs;
  if (S.stormFor >= STORM_BREW_S) {
    S.stormFor = -1;
    S.raining = true;
    S.rainFor = 0;
  }
}

// One frame of the fading, and it keeps whatever motion it had, easing off:
// a mote that halts and then thins reads as the frame going wrong rather than
// as smoke going. It is not pulled anywhere (`eat`); it finishes the movement
// it was making.
export function stepGoing(secs) {
  const by = secs / (SMOG_GO_MS / 1000);
  const slow = Math.max(0, 1 - GOING_EASE * secs);
  const f = secs * 60;
  for (let i = GOING.length - 1; i >= 0; i--) {
    const g = GOING[i];
    g.x += (g.vx || 0) * f;
    g.y += (g.vy || 0) * f;
    g.vx *= slow;
    g.vy *= slow;
    g.t -= by;
    if (g.t <= 0) GOING.splice(i, 1);
  }
}

// --- lightning ----------------------------------------------------------------
// A bolt is a list of cells, made once when it strikes and drawn as it fades:
// down from over the top of the window, jogging sideways a little each
// segment, to whatever that column has for a floor, with one fork partway
// down that goes the other way and gives up before the ground. Weather only:
// it changes nothing.
function strike() {
  const cells = [];
  const jog = () => Math.round((rand() * 2 - 1) * BOLT_JOG) * P;
  // The jog is kept from one segment to the next more often than not, so the
  // bolt runs straight and then kinks; re-rolled every segment it is a worm.
  const run = (x, y, max, lean) => {
    let dx = jog() + lean;
    for (let s = 0; s < max; s++) {
      const floorY = muckFloor(colAt(x));
      if (y >= floorY) return;
      if (rand() < BOLT_KINK) dx = jog() + lean;
      for (let k = 0; k < BOLT_STEP && y + k * P < floorY; k++)
        cells.push([x + Math.round(k * dx / BOLT_STEP / P) * P, y + k * P]);
      x += dx; y += BOLT_STEP * P;
    }
  };
  const x0 = Math.round((S.camX + rand() * S.viewW) / P) * P;
  const y0 = S.camY - P;
  // the fork leans the way the main bolt was not
  run(x0, y0, 1e3, 0);
  // A column whose floor is already over the top of the window -- a tall rock
  // in the air -- has nowhere for a bolt to run, so there is none this frame.
  if (!cells.length) return null;
  const [lo, hi] = BOLT_FORK_AT;
  const at = cells[Math.floor(cells.length * (lo + rand() * (hi - lo)))];
  const way = at[0] < x0 ? 1 : -1;
  run(at[0], at[1], BOLT_FORK_LEN, way * BOLT_JOG * P);
  // embers along the whole of it, not a burst at the foot: the bolt is the
  // hot thing, all the way down
  for (const [x, y] of cells) if (rand() < EMBER_PER_CELL) ember(x, y);
  return { cells, x: x0, left: BOLT_LIFE_S, flash: BOLT_FLASH_S };
}

// --- embers ------------------------------------------------------------------
// The specks a strike throws off. Each is thrown sideways a little and upward,
// and both die away, so it rises, hangs and fades where it got to rather than
// sailing off the top of the window. The wind has them at a share.
export const EMBERS = [];
function ember(x, y) {
  const life = EMBER_LIFE_S * (0.6 + 0.4 * rand());
  EMBERS.push({ x: x + rand() * P, y,
                vx: (rand() * 2 - 1) * EMBER_SCATTER,
                vy: -EMBER_RISE * (0.5 + rand()),
                t: life, life });
}

export function stepEmbers(secs) {
  if (!EMBERS.length) return;
  const f = secs * 60;
  const slow = Math.max(0, 1 - EMBER_EASE * secs);
  const lean = gust() * RAIN_LEAN * EMBER_LEAN;
  for (let i = EMBERS.length - 1; i >= 0; i--) {
    const e = EMBERS[i];
    e.x += (e.vx + lean) * f;
    e.y += e.vy * f;
    e.vx *= slow;
    e.vy *= slow;
    e.t -= secs;
    if (e.t <= 0) EMBERS.splice(i, 1);
  }
}

// dev: a strike now, held for `hold` seconds with the flash on for `flash` of
// them, so a scene can stand at either frame of one.
export function forceStrike(hold = BOLT_LIFE_S, flash = BOLT_FLASH_S) {
  const had = EMBERS.length;
  S.bolt = strike();
  if (!S.bolt) return;
  S.bolt.left = hold;
  S.bolt.flash = flash;
  // the embers it threw are held with it, so a shot a second later still has
  // them
  for (let i = had; i < EMBERS.length; i++) EMBERS[i].t = EMBERS[i].life = Math.max(EMBERS[i].life, hold);
}

export function stepBolt(secs) {
  if (!S.bolt) return;
  S.bolt.left -= secs;
  S.bolt.flash -= secs;
  if (S.bolt.left <= 0) S.bolt = null;
}


export function stepDrops() {
  const m = muckCols();
  const f = frames();
  // Every drop is carried by this instant's wind: the sheet leans as one and
  // swings with the gust rather than each drop remembering the air it was
  // born into.
  const lean = gust() * RAIN_LEAN;
  for (let i = DROPS.length - 1; i >= 0; i--) {
    const d = DROPS[i];
    // pixels a frame, so it moves by however long the frame was
    d.x += lean * f;
    d.y += d.vy * f;
    const c = colAt(d.x);
    if (c < 0 || c >= m.length) { DROPS.splice(i, 1); continue; }
    const rest = muckFloor(c) - m[c] * P;
    if (d.y < rest - P) continue;
    // Only what was sky leaves a mark; the water is water.
    if (d.dirt) {
      LEDGER.dirty++;
      if (rand() < RAIN_MARK && m[c] < MUCK_MAX) { m[c]++; LEDGER.laid++; }
    } else LEDGER.clean++;
    DROPS.splice(i, 1);
  }
}

// --- when it rains ------------------------------------------------------------------
// The rain is the sky's own: a front is due every few minutes on a rolled
// interval, whatever is overhead, and the dirt only decides what the shower
// costs. The clock runs down between showers and stands still through one.
export const nextDue = () =>
  RAIN_EVERY_S * (1 + (rand() * 2 - 1) * RAIN_EVERY_GIVE);

// How big the front rolled now is. The first of a save is a full storm, so
// the lightning is seen early over a sky too clean to mark; a check may pin
// the next one (`__front`).
let pinned = null;
export const pinHeft = h => { pinned = h; };
export function rollHeft() {
  const h = pinned ?? (S.rains === 1 ? 1 : rand());
  pinned = null;
  return h;
}

// Seconds since the last shower stopped. A fact about a run, not a save: a
// game picked up again is a dry yard.
export let dryFor = Infinity;

export const dryTime = () => dryFor;
// Put back from `seedSmog`; only the declaring file may write it.
export const resetRain = () => { dryFor = Infinity; pinned = null; LEDGER.clean = LEDGER.dirty = LEDGER.laid = 0; };

// Asked every frame; true on the frame the front is due. The yard sets the
// first `rainDue` (`seedSmog`); a save from before the clock has none and is
// given the first front. RAIN_GAP is a floor under the roll, not a schedule.
export function stepFront(secs) {
  if (raining() || brewing()) { dryFor = 0; return false; }
  dryFor += secs;
  if (!(S.rainDue >= 0)) return false;
  S.rainDue = Math.max(0, S.rainDue - secs);
  return S.rainDue <= 0 && dryFor >= RAIN_GAP;
}
