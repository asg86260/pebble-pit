import { frames } from '../clock.js';
import { GOING_EASE, MUCK_MAX, P, RAIN_GAP, RAIN_GRAV, RAIN_MARK, RAIN_PER_S, RAIN_RAMP, SMOG_CAP, SMOG_GO_MS, SMOG_RAIN_BEND, SMOG_SAMPLE, SMOG_SINK } from '../config.js';
import { rand } from '../rng.js';
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

export function pour(secs) {
  if (!SKY.length) { S.raining = false; return; }

  // How far into the shower this is. Rain comes on: a spot or two, then more of
  // them, then the whole sky. It used to open at the full rate on the very first
  // frame -- nothing overhead, and a quarter of a second later sixteen hundred
  // drops in the air -- which is not weather arriving, it is a bucket being
  // tipped over. The rate is squared across the ramp, so the first second is a
  // scatter and the shower is properly on by the end of it.
  //
  // Nothing is lost to the slow start. What falls is the sky itself, and the sky
  // is still up there: a shower runs until it is empty either way, so the ramp
  // makes the front of it gentler rather than the whole of it smaller.
  S.rainFor = (S.rainFor || 0) + secs;
  const on = Math.min(1, S.rainFor / RAIN_RAMP);
  let n = RAIN_PER_S * secs * on * on;

  // Which ones may fall, as places in the sky rather than as motes: a settled
  // sky is thousands of specks and this runs every frame of a downpour, so a
  // pick has to cost nothing. Taken by swapping the chosen one out of the back
  // of the list, which is a pick without a search.
  const pick = [];
  for (let i = 0; i < SKY.length; i++) if (doomed(SKY[i])) pick.push(i);
  // Nothing settled left, and what is left is still climbing. A shower does not
  // reach down the plume and pull specks back out of it -- it is over, and what
  // is on its way up belongs to the next one.
  if (!pick.length) { S.raining = false; return; }

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
    DROPS.push({ x: moteX(m), y: moteY(m), vy: 0.2 + rand() * 0.4 });
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
  if (!SKY.some(doomed)) S.raining = false;
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

export function stepDrops() {
  const m = muckCols();
  const f = frames();
  for (let i = DROPS.length - 1; i >= 0; i--) {
    const d = DROPS[i];
    // rain falls at pixels a frame, so it falls by however long the frame was
    d.vy += RAIN_GRAV * f;
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
  if (raining()) { dryFor = 0; sinceLook = 0; return false; }
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
