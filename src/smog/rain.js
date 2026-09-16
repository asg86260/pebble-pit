import { frames } from '../clock.js';
import { EMBER_EASE, EMBER_LEAN, EMBER_PER_CELL, EMBER_LIFE_S, EMBER_RISE, EMBER_SCATTER, BOLT_EVERY_S, BOLT_FLASH_S, BOLT_FORK_AT, BOLT_FORK_LEN, BOLT_JOG, BOLT_KINK, BOLT_LIFE_S, BOLT_STEP, GOING_CAP, GOING_EASE, MUCK_MAX, P, RAIN_DRIZZLE_S, RAIN_FALL, RAIN_FALL_GIVE, RAIN_GAP, RAIN_LEAN, RAIN_MARK, RAIN_PER_S, RAIN_RISE_S, RAIN_TAPER_AT, RAIN_TAPER_FLOOR, SMOG_CAP, SMOG_GO_MS, SMOG_RAIN_BEND, SMOG_SAMPLE, SMOG_SINK, STORM_BREW_S } from '../config.js';
import { rand } from '../rng.js';
import { gust } from '../wind.js';
import { S } from '../state.js';
import { DROPS, GOING, SKY, raining } from './band.js';
import { colAt, muckCols, muckFloor } from './layer.js';
import { dropped, moteX, moteY } from './sky.js';

// --- the rain ----------------------------------------------------------------------
// No clock. It runs until the marked sky is empty, because what falls *is*
// the sky: a mote drops out of it, comes down under gravity and lands.
const RAIN_FLOOR = 4;

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

// How many motes the shower broke on, written at the roll and read by the
// taper: "a quarter of the marked sky left" is a share of what was marked, not
// of whatever has climbed up since.
let stormMarked = 0;
export const markStorm = n => { stormMarked = n; };

// One for a shower in full voice down to nought as the last marked motes
// fall; the wash over the sky reads it.
let tail = 1;
export const stormTail = () => tail;

export function pour(secs) {
  if (!SKY.length) { S.raining = false; tail = 0; return; }

  // The envelope: a drizzle at a fifth of the rate, a smoothstep up to the
  // full pour, and a taper over the last quarter of the marked sky so the
  // shower trails off instead of cutting. Nothing is lost to the shape; it
  // runs until every marked mote is gone.
  S.rainFor = (S.rainFor || 0) + secs;
  const t = S.rainFor;
  const env = 0.2 + 0.8 * smooth((t - RAIN_DRIZZLE_S) / RAIN_RISE_S);
  let n = RAIN_PER_S * secs * env;
  // A strike now and then at the height of it. Squared on the envelope so the
  // drizzle and the taper hardly ever flash; one at a time, because a second
  // bolt over the first is a fizz.
  if (!S.bolt && rand() < secs * env * env / BOLT_EVERY_S) S.bolt = strike();

  // Which ones may fall, as indices: this runs every frame of a downpour over
  // thousands of specks, so a pick is a swap out of the back of the list, not
  // a search.
  const pick = [];
  for (let i = 0; i < SKY.length; i++) if (doomed(SKY[i])) pick.push(i);
  // Nothing settled left: a shower does not reach down the plume.
  if (!pick.length) { S.raining = false; tail = 0; return; }

  // The taper floor is never nothing, so every marked mote still goes and the
  // shower ends clean.
  const frac = stormMarked > 0 ? pick.length / stormMarked : 1;
  tail = smooth(frac / RAIN_TAPER_AT);
  if (frac < RAIN_TAPER_AT) n *= RAIN_TAPER_FLOOR + (1 - RAIN_TAPER_FLOOR) * tail;

  const gone = new Set();
  while (n > 0 && pick.length) {
    if (n < 1 && rand() > n) break;
    n -= 1;
    const at = Math.floor(rand() * pick.length);
    const i = pick[at];
    pick[at] = pick[pick.length - 1];
    pick.pop();
    gone.add(i);
    const m = SKY[i];
    // The drop falls from over the top of the window, not from where its mote
    // hung: drops materializing at every height of the screen read as the air
    // leaking. The mote thins out where it stood; one mote taken is one drop.
    DROPS.push({ x: moteX(m), y: S.camY - P,
                 vy: RAIN_FALL + (rand() - 0.5) * RAIN_FALL_GIVE });
    if (GOING.length < GOING_CAP)
      GOING.push({ x: moteX(m), y: moteY(m), kind: m.kind, tone: m.tone,
                   ink: m.ink, t: 1, vx: 0, vy: 0 });
    dropped(m);
  }

  // and out of the sky in one pass, keeping the order of what is left
  if (gone.size) {
    let w = 0;
    for (let i = 0; i < SKY.length; i++) if (!gone.has(i)) SKY[w++] = SKY[i];
    SKY.length = w;
  }
  // Over when the sky it broke on is gone, whatever has arrived since. No
  // second condition on the number: the number is the specks, so a shower
  // that stopped on a figure could stop with a filthy figure over an empty
  // sky and start again next frame, for ever.
  if (!SKY.some(doomed)) { S.raining = false; tail = 0; }
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
  if (GOING.length) S.dirty = true;
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
    if (rand() < RAIN_MARK && m[c] < MUCK_MAX) m[c]++;
    DROPS.splice(i, 1);
    S.dirty = true;
  }
}

// --- whether it rains ----------------------------------------------------------------
// The sky is looked at every few seconds and asked, not compared against a
// line every frame. There is no line: one curve, the share of the cap raised
// to `SMOG_RAIN_BEND`, so the chance falls away far faster than the sky
// clears and a lightly dirty yard is not rained on. Nought at nought exactly:
// a clean sky is not a question, and asking it anyway would take a number off
// the yard's one generator every few seconds (see `breaks`).
export function rainOdds() {
  if (!(S.haze > 0)) return 0;
  const share = Math.min(1, S.haze / SMOG_CAP);
  return Math.min(1, Math.pow(share, SMOG_RAIN_BEND));
}

// Seconds since the last shower stopped, and since the sky was last looked
// at. Facts about a run, not a save: a game picked up again is a dry yard.
export let dryFor = Infinity, sinceLook = 0;

export const dryTime = () => dryFor;
// Put back from `seedSmog`; only the declaring file may write it.
export const resetRain = () => { dryFor = Infinity; sinceLook = 0; };

// Asked every frame and answered on the frames a sample falls due, so the
// roll happens at the sampling rate however fast the machine is running.
export function breaks(secs) {
  // A storm on the way is a storm: the sky is not asked again while it brews.
  if (raining() || brewing()) { dryFor = 0; sinceLook = 0; return false; }
  dryFor += secs;
  sinceLook += secs;
  if (sinceLook < SMOG_SAMPLE) return false;
  sinceLook = 0;
  // A shower rains the sky it broke on and the works go on fouling underneath
  // it, so without RAIN_GAP a busy yard comes out of one downpour straight
  // into the next.
  if (dryFor < RAIN_GAP) return false;
  // The roll only if there are odds: a coin flipped for a clean sky would
  // make every seeded run, weather or not, come out differently.
  const odds = rainOdds();
  return odds > 0 && rand() < odds;
}
