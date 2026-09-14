import { frames } from '../clock.js';
import { EMBER_EASE, EMBER_LEAN, EMBER_PER_CELL, EMBER_LIFE_S, EMBER_RISE, EMBER_SCATTER, BOLT_EVERY_S, BOLT_FLASH_S, BOLT_FORK_AT, BOLT_FORK_LEN, BOLT_JOG, BOLT_KINK, BOLT_LIFE_S, BOLT_STEP, GOING_CAP, GOING_EASE, MUCK_MAX, P, RAIN_DRIZZLE_S, RAIN_FALL, RAIN_FALL_GIVE, RAIN_GAP, RAIN_LEAN, RAIN_MARK, RAIN_PER_S, RAIN_RISE_S, RAIN_TAPER_AT, RAIN_TAPER_FLOOR, SMOG_CAP, SMOG_GO_MS, SMOG_RAIN_BEND, SMOG_SAMPLE, SMOG_SINK, STORM_BREW_S } from '../config.js';
import { rand } from '../rng.js';
import { gust } from '../wind.js';
import { S } from '../state.js';
import { DROPS, GOING, SKY, raining } from './band.js';
import { colAt, muckCols, muckFloor } from './layer.js';
import { dropped, moteX, moteY } from './sky.js';

// --- the rain ----------------------------------------------------------------------
// No clock. It runs until the sky is empty, because what falls *is* the sky: a
// mote drops out of it, comes down under gravity and lands. The banks thin as it
// goes because there is less and less of them left up there.
const RAIN_FLOOR = 4;

// What falls has to have got there first. This picked out of the whole sky, a
// mote at a time, which during a downpour included the ones that had arrived
// that instant -- so a puff you had just watched climb for four seconds off a
// swing reached the band and was pulled straight back down as a raindrop. It
// reads as pollution turning into rain on contact, which is not what either of
// them is: the sky is the thing coming down, and a speck that has not joined
// the sky yet is not part of it.
//
// A mote is settled once it has eased into the band -- the same `SMOG_SINK` the
// sinking-in uses. Only settled ones can be picked, unless there is nothing
// settled left at all, in which case the rain takes what there is rather than
// stalling with a sky still overhead.
export const settled = m => !m.up && m.age >= SMOG_SINK;

// ...and part of *this* shower.
//
// A shower rains the sky that was overhead when it broke, and no more. Without
// that mark it rained whatever happened to be up there at the time, so every
// mote that climbed into the band during a downpour was taken straight back down
// again -- and the works went on fouling all the way through, so the shower fed
// on its own smoke and ran far longer than there was sky to justify. New haze
// arriving belongs to the next one.
const doomed = m => settled(m) && m.rain === S.rains;

// A plain smoothstep, nought to one across [0, 1]. The storm's envelope is made
// of these because a shower has no corners in it.
const smooth = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };

// How many motes the shower this one broke on was made of, written when the
// storm commits (see `brew`) and read by the taper: "a quarter of the marked
// sky left" has to be a share of what was marked, not of whatever has climbed
// up since.
let stormMarked = 0;
export const markStorm = n => { stormMarked = n; };

// How far through the tail the shower is, one for a shower in full voice down
// to nought as the last marked motes fall. The wash over the sky reads it --
// the darkness fades back out over the taper.
let tail = 1;
export const stormTail = () => tail;

export function pour(secs) {
  if (!SKY.length) { S.raining = false; tail = 0; return; }

  // The storm envelope (wave6-sky, item 5). Rain comes on the way rain comes
  // on: a drizzle at a fifth of the rate for the first few seconds, a
  // smoothstep up to the full pour -- and at the far end, once the marked sky
  // is down to its last quarter, the rate tapers away with what is left, so
  // the shower trails off instead of cutting. Nothing is lost to the shape:
  // what falls is the sky itself, and the shower runs until every marked mote
  // is gone.
  S.rainFor = (S.rainFor || 0) + secs;
  const t = S.rainFor;
  const env = 0.2 + 0.8 * smooth((t - RAIN_DRIZZLE_S) / RAIN_RISE_S);
  let n = RAIN_PER_S * secs * env;
  // And now and then, at the height of it, a strike. Squared on the envelope
  // so the drizzle and the taper hardly ever flash; one at a time, because a
  // second bolt over the first is a fizz rather than a storm.
  if (!S.bolt && rand() < secs * env * env / BOLT_EVERY_S) S.bolt = strike();

  // Which ones may fall, as places in the sky rather than as motes: a settled
  // sky is thousands of specks and this runs every frame of a downpour, so a
  // pick has to cost nothing. Taken by swapping the chosen one out of the back
  // of the list, which is a pick without a search.
  const pick = [];
  for (let i = 0; i < SKY.length; i++) if (doomed(SKY[i])) pick.push(i);
  // Nothing settled left, and what is left is still climbing. A shower does not
  // reach down the plume and pull specks back out of it -- it is over, and what
  // is on its way up belongs to the next one.
  if (!pick.length) { S.raining = false; tail = 0; return; }

  // The taper: the last quarter of the marked sky falls at a rate that shrinks
  // with it, smoothing to a tenth -- but never to nothing, so every marked mote
  // still goes and a shower still ends clean.
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
    // The drop falls from over the top of the window, not from wherever its
    // mote happened to hang. The mote *was* the drop for a while -- it swapped
    // into one in place -- and a band spread over the whole sky meant drops
    // materializing at every height of the screen at once, which reads as the
    // air leaking rather than as weather arriving. So the two halves come
    // apart: the mote thins out where it stood, like every other speck that
    // leaves the sky, and the rain comes down over everything from above the
    // view. The accounting is unchanged -- one mote taken is one drop down.
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
  // The shower is over when the sky it was made of is gone. There is no second
  // condition on the number any more, and there is no room for one: the number
  // is the specks, so an empty band *is* a clean readout. It used to be able to
  // stop with a filthy figure still standing over an empty sky, and the next
  // frame would start another shower with nothing to pour -- on and off, every
  // frame, for ever, which is what a haze that never comes back looks like from
  // the outside.
  // Over when the sky it broke on is gone, whatever has arrived since.
  if (!SKY.some(doomed)) { S.raining = false; tail = 0; }
}

// --- the brew-up ---------------------------------------------------------------
// (wave6-sky, item 5.) A storm that has been rolled does not open at once: for
// STORM_BREW_S the sky *brews*, and only then does the drizzle begin. There
// used to be a wash of darkness ramping over the band through the brew; it was
// cut -- the sky itself is the warning -- and what is left of the brew is the
// delay.
//
// `S.stormFor` is the brew's clock: -1 for no storm on the way, otherwise
// seconds since the roll. The marking of the sky and the count of rains happen
// at the roll -- see `stepSmog` -- so the shower that finally opens rains the
// sky that earned it, not whatever climbed up while it brewed.
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

// One frame of the fading, and **it keeps whatever motion it had.**
//
// These were parked where the speck stood, on the reasoning that a speck being
// taken is not a speck going anywhere -- which is true of the taking and wrong
// about the picture. What you saw was a mote crossing the sky, or climbing out
// of a stack, coming to a dead stop and only then thinning out. Nothing in the
// air stops. A thing that halts and fades reads as the frame going wrong rather
// than as smoke going.
//
// So it carries its own drift and eases off as it goes, the way everything else
// up here does. It is still not being *pulled* anywhere -- see `eat`, and the
// whole argument about not moving the sky to show a mouth working. It simply
// finishes the movement it was already making.
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
// A bolt is a list of cells, made once when it strikes and drawn as it fades.
// It comes down from over the top of the window, somewhere across the view,
// jogging sideways a little each segment, and stops at whatever that column
// has for a floor -- the ground, the rock, the dug quarry -- with one fork
// off it partway down that goes the other way and gives up before the ground.
// Weather only: it is the storm being seen, and it changes nothing.
function strike() {
  const cells = [];
  const jog = () => Math.round((rand() * 2 - 1) * BOLT_JOG) * P;
  // one run of segments from (x, y) downward, for at most `max` of them. The
  // jog is kept from one segment to the next more often than not, so the
  // bolt runs straight for a stretch and then kinks -- re-rolled every
  // segment it was a wiggle, and a wiggle is a worm rather than a bolt.
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
  // the main bolt, then the fork off one of its cells in the middle stretch,
  // leaning the way the main bolt was not
  run(x0, y0, 1e3, 0);
  const [lo, hi] = BOLT_FORK_AT;
  const at = cells[Math.floor(cells.length * (lo + rand() * (hi - lo)))];
  const way = at[0] < x0 ? 1 : -1;
  run(at[0], at[1], BOLT_FORK_LEN, way * BOLT_JOG * P);
  // and what it throws off: embers along the whole of it, not a burst at the
  // foot -- the bolt is the hot thing, all the way down
  for (const [x, y] of cells) if (rand() < EMBER_PER_CELL) ember(x, y);
  return { cells, x: x0, left: BOLT_LIFE_S, flash: BOLT_FLASH_S };
}

// --- embers ------------------------------------------------------------------
// The specks a strike throws off, all along it. Each is thrown out sideways a little and
// upward, and both die away as it goes, so it rises, hangs and fades where it
// got to rather than sailing off the top of the window. Black, and drawn on
// the cell grid like everything else in the air. The wind has them the way it
// has the rain, at a share -- they are lighter than a drop but they are not
// nothing.
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
  // and the embers it threw are held with it, at full weight, where they
  // come to rest -- a shot a second later still has them
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
  // Every drop is carried by this instant's wind. A drop has no momentum of
  // its own worth keeping, so the sheet leans as one and swings with the gust
  // rather than each drop remembering the air it was born into.
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
// The sky is looked at every few seconds and asked, not compared against a line
// every frame. What a sample gives is a chance, and the chance is how filthy it
// is: nothing at all under the line, about one in eight the moment it crosses,
// and a certainty at the brim.
//
// So a full sky is a thing that is *going* to rain rather than a thing that
// rains at a number, and the yard cannot be played by the arithmetic -- you
// watch it darken and you get on with the shovels.
// **There is no line.** It used to be nothing at all under `SMOG_RAIN_AT` and a
// chance ramping from there to the brim. What is left is one curve: how often it
// rains *is* how dirty the sky is, all the way down.
//
// Bent hard rather than straight, which is what keeps a lightly dirty yard from
// being rained on: the chance is the share of the cap raised to
// `SMOG_RAIN_BEND`, so it falls away far faster than the sky clears.
//
// And **nought at nought**, exactly. A clean sky is not a one-in-a-million
// chance that happens to lose: it is not a question. That is not only fair, it
// is what keeps `breaks` from taking a number off the yard's one generator every
// few seconds for the whole of a game -- see the note there, and why every
// seeded run would otherwise diverge over a coin that was never flipped.
export function rainOdds() {
  if (!(S.haze > 0)) return 0;
  const share = Math.min(1, S.haze / SMOG_CAP);
  return Math.min(1, Math.pow(share, SMOG_RAIN_BEND));
}

// Seconds since the last shower stopped, and how long it is since the sky was
// last looked at. Both are facts about a run rather than about a save -- a game
// picked up again is a dry yard, and it may rain on you when it likes.
export let dryFor = Infinity, sinceLook = 0;

export const dryTime = () => dryFor;
// A fresh yard, put back from `seedSmog`: it can only be written here, in the
// file that declares it.
export const resetRain = () => { dryFor = Infinity; sinceLook = 0; };

// One frame of that question. It is asked every frame and answered on the frames
// a sample falls due, so the roll happens at the sampling rate however fast the
// machine underneath is running.
export function breaks(secs) {
  // A storm on the way is a storm: the sky is not asked again while it brews.
  if (raining() || brewing()) { dryFor = 0; sinceLook = 0; return false; }
  dryFor += secs;
  sinceLook += secs;
  if (sinceLook < SMOG_SAMPLE) return false;
  sinceLook = 0;
  // A minute of dry, whatever is overhead. See RAIN_GAP: a shower rains the sky
  // it broke on and the works go on fouling underneath it, so without this floor
  // a busy yard came out of one downpour straight into the next.
  if (dryFor < RAIN_GAP) return false;
  // The odds first, and the roll only if there are any. A clean sky is not a
  // one-in-nothing chance that happens to lose: it is not a question, and asking
  // it anyway would take a number off the yard's one generator every few seconds
  // for the whole of a game -- so every seeded run in the yard, weather or not,
  // would come out differently for the sake of a coin that was never flipped.
  const odds = rainOdds();
  return odds > 0 && rand() < odds;
}
