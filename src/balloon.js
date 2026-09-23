// The purifier balloon: the craft, where it is, and how a body gets into it.
//
// The house draws the sky down into itself; a balloon goes up into the clouds,
// travels from one to the next drawing each in, and brings what it catches
// home to its post. See DESIGN.md, "The balloons ride the clouds". It is a
// thing the shed sells: the board and the gauge are the shed's.
//
// Two halves, kept apart on purpose. **The yard's half** is a clock: a craft is
// moored, going up, aloft or coming down, for a time. Nothing
// in it depends on the view, so a scrolled yard and a still one do the same
// thing. **The picture's half** is where the craft is in the sky: among the
// clouds, at their depth, drawn where they are drawn, which is a matter of the
// camera the way a cloud's place is. The picture reads the clock; the clock
// never reads the picture.

import { P, WORKER, COMMUTE_PACE, BALLOON_DUST, BALLOON_RATE, BALLOON_W, BALLOON_H,
         BALLOON_BASKET, BALLOON_LINES, BALLOON_BOB,
         BALLOON_MAST_GAP, BALLOON_CLIMB_S, BALLOON_TRAVEL_S, BALLOON_DWELL_S,
         BALLOON_HANG, BALLOON_VISIT, CLOUD_DRAWN_EASE, CLOUD_LAYERS,
         BALLOON_SPAN, BALLOON_MIN_SIZE, FILTER_WALL, DIAL_CELLS, DIAL_STUB, CLIMB_PACE,
         rungValue } from './config.js';
import { S, filter } from './state.js';
import { frames, now } from './clock.js';
import { walkY } from './world.js';
import { climbTo, plant } from './route.js';
import { TYPE } from './jobs.js';
import { stream } from './rng.js';
import { GUESTS } from './skyguests.js';

// --- the craft ----------------------------------------------------------------------
// A craft is `{ phase, t, hang }` to the yard:
//
//   phase  'moored' at its post, 'up' on the way into the sky, 'aloft' at
//          work among the clouds, 'down' on the way home.
//   t      seconds into the phase, or aloft into the hang or the trip.
//   hang   aloft, whether it is hanging at a cloud drawing it in or on its
//          way to the next one. Only the hanging cleans anything.
//
// and carries `sky`, the picture's half (below), which is never saved.
// Its post is its index, so two craft cannot disagree about which is which.
export const CRAFT = [];

export const craftCount = () => CRAFT.length;

// What one more costs: a finite ladder in dust on the house's own board.
export const craftCost = () => Math.round(BALLOON_DUST * Math.pow(BALLOON_RATE, CRAFT.length));

// Bought moored, with nobody in it, like every other station that sells the
// room before the body.
export function buyCraft() {
  CRAFT.push({ phase: 'moored', t: 0, hang: false, sky: null });
}

// --- the posts ----------------------------------------------------------------------
// A row of them to the right of the filter's dial, one a craft, the way the
// apothecary stands its pots in a row; the filter's site keeps the ground for
// the whole row (config/sites.js). Derived, not stored, since the house is
// re-sited whenever the yard is laid out.
const dialEnd = () => filter.x + filter.w - P * FILTER_WALL + P * (DIAL_STUB + DIAL_CELLS);
export const mastX = (i = 0) =>
  dialEnd() + P * BALLOON_MAST_GAP + BALLOON_SPAN / 2 + i * (BALLOON_SPAN + P * BALLOON_MAST_GAP);

// Where a moored craft's basket sits: on the ground at its post, the way a
// balloon is moored, tied off to a stake beside it; a rider steps up into it
// (`stepRider`).
export const postY = i => walkY(mastX(i)) + WORKER;

// --- who is in it ---------------------------------------------------------------------
// A fact about the body, not the craft: `w.craft` is the index it is riding.
// A craft holds no reference to a worker, so a body knocked off its job or
// taken off the roster cannot leave a craft believing it is still crewed.
export const riderOf = i => S.workers.find(w => w.craft === i && w.goal === 'aloft' && w.homeward == null) || null;
export const crewed = i => !!riderOf(i);

// A body in a basket, working or being brought home: the balloon draws it,
// so the crew do not (render/crew.js).
export const inBasket = w => w.craft != null && (w.goal === 'aloft' || w.homeward != null);
// Anybody in craft `i`'s basket, working or on the way home.
export const aboard = i => S.workers.some(w => w.craft === i && inBasket(w));

// A craft is at work while it is up among the clouds with somebody in it,
export const working = i => !!CRAFT[i] && CRAFT[i].phase === 'aloft' && crewed(i);
// and takes anything out of the sky only while it hangs at a cloud: the trips
// between are time it is not cleaning, which is what its speed buys back.
export const drawing = i => working(i) && CRAFT[i].hang;
// And it is seen drawing a cloud in only once the picture has it under one
// (craftair.js): a picture question, asked of the picture's half.
export const atCloud = i => drawing(i) && !!CRAFT[i].sky && !!CRAFT[i].sky.cloud && CRAFT[i].sky.go >= 1;
// Tied off at its post, where a body on the ground can reach into the basket.
export const moored = i => !!CRAFT[i] && CRAFT[i].phase === 'moored';

// A stirrer is on its way with a dose for this craft's rider: the craft comes
// home for it, the way the wizard lands for one, and goes back up once it is
// handed over. `doseComing` in apothecary.js, asked here without the import
// ring; derived from the stirrers so a trip given up lets the craft go.
const sentFor = i => {
  const r = riderOf(i);
  return !!r && S.workers.some(s => s.type === TYPE.STIR && s.holding > 0 && s.dealTo === r);
};

// Seconds a trip from one cloud to the next takes, at the fleet's speed.
export const travelS = () => BALLOON_TRAVEL_S / rungValue('balloonspeed', S.balloonSpeedLevel || 0);

// Which craft a body on the purifiers rides: its index, or `-1` with none
// free. **Claimed once and kept.** A berth worked out from the body's place in
// the roster changes under it, because the roster's order is not stable: the
// rider already aloft was handed another berth and pulled straight back out
// of its craft, over and over.
export function berthFor(w) {
  const others = S.workers.filter(o => o !== w && o.type === TYPE.PURIFY && o.berth != null);
  const taken = new Set(others.map(o => o.berth));
  // What it already holds, if that is still a real place: a save from a
  // smaller fleet can land a body on a craft that is not there.
  if (w.berth != null && w.berth >= 0 && !taken.has(w.berth) && w.berth < CRAFT.length) {
    return w.berth;
  }
  for (let i = 0; i < CRAFT.length; i++) if (!taken.has(i)) return (w.berth = i);
  // Every berth spoken for: `capOf` should not have let it be assigned, and
  // a body with nowhere to be goes somewhere obvious.
  return (w.berth = -1);
}

// **Brought home.** A rider taken off the purifiers while the craft is up
// stays in the basket and comes down with it; it steps off at the post and
// goes to its new job from there (`comeHome`, run early in the crew's frame).
// Where a craft is in the sky is a picture, so a body let go up there would
// land wherever the camera happened to put it.
export function bailOut(w) {
  if (w.craft == null) return;
  if (w.goal === 'aloft' && CRAFT[w.craft] && CRAFT[w.craft].phase !== 'moored') {
    w.homeward = w.craft;
    w.berth = null;
    return;
  }
  w.craft = null;
  w.berth = null;
  w.aloft = false;
  if (w.goal === 'aloft' || w.goal === 'board') w.goal = 'to';
}

// A body being brought home: held at its post, out of the yard, until its
// craft is moored, then let go at the foot of the post. True once it is off.
export function comeHome(w) {
  const i = w.homeward, c = CRAFT[i];
  if (c && c.phase !== 'moored') {
    w.x = mastX(i) - WORKER / 2;
    return false;
  }
  if (c) w.x = mastX(i) - WORKER / 2;
  w.homeward = null;
  w.craft = null;
  w.aloft = false;
  plant(w, walkY(w.x + WORKER / 2));
  return true;
}

// Out of the basket, but still on the purifiers: it keeps its berth. Used
// when a body's berth turns out to be the house after all.
export function dismount(w) {
  w.craft = null;
  w.aloft = false;
  if (w.goal === 'aloft' || w.goal === 'board') w.goal = 'to';
}

// --- the yard's half: the clock ----------------------------------------------------
// Up when somebody is aboard; home when its rider has gone. What it catches
// it lets fall where it is (`swallow` in smog/craft.js), so it never has to
// come home to empty.

// Timed by the frame's own `dt`, like every other clock in the step list:
// `frames()` is the draw's measure, and a yard stepped by hand (`__fast`) ran
// a craft's clock at whatever the last drawn frame had been.
export function stepBalloons(dt) {
  const secs = dt / 1000;
  for (let i = 0; i < CRAFT.length; i++) {
    const c = CRAFT[i];
    // Called home for a dose reads as unmanned to the clock: down it comes,
    // rider and all, and it stays moored until the vial is in the basket.
    const manned = crewed(i) && !sentFor(i);
    if (c.phase === 'moored') {
      if (manned) { c.phase = 'up'; c.t = 0; }
    } else if (c.phase === 'up') {
      c.t += secs;
      // Let go of on the way up: it turns round where it is.
      if (!manned) { c.phase = 'down'; c.t = Math.max(0, BALLOON_CLIMB_S - c.t); }
      // Up, it is at its first cloud.
      else if (c.t >= BALLOON_CLIMB_S) { c.phase = 'aloft'; c.t = 0; c.hang = true; }
    } else if (c.phase === 'aloft') {
      c.t += secs;
      if (!manned) { c.phase = 'down'; c.t = 0; c.hang = false; }
      else if (c.hang && c.t >= BALLOON_DWELL_S) { c.hang = false; c.t = 0; }
      else if (!c.hang && c.t >= travelS()) { c.hang = true; c.t = 0; }
    } else if (c.phase === 'down') {
      c.t += secs;
      if (c.t >= BALLOON_CLIMB_S) { c.phase = 'moored'; c.t = 0; }
    }
    stepSky(i, c, secs);
  }
  paleClouds(secs);
}

// --- the picture's half: where it is among the clouds ------------------------------
// `sky` is `{ x, far, y }` -- an `x` in the clouds' own space (the camera is
// added to it by depth, as to a cloud's), the depth, and where the bottom of
// the basket is -- plus the cloud it is at or going to, and the trip or the
// wait it is part way through. A depth of one is the yard's own.
//
// Chance off a stream of its own: which cloud a craft goes to next changes
// only what the sky looks like.
const roll = stream(0xba11007);
const ease = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const mix = (a, b, k) => ({ x: lerp(a.x, b.x, k), far: lerp(a.far, b.far, k), y: lerp(a.y, b.y, k) });
const here = k => ({ x: k.x, far: k.far, y: k.y });
const CRAFT_TALL = BALLOON_H + BALLOON_LINES + BALLOON_BASKET;

const atPost = i => ({ x: mastX(i), far: 1, y: postY(i) });
// Where something at a depth is drawn on the glass: the camera added by depth,
// as it is to a cloud (`skyAt` in weather.js).
const onSky = (x, far) => x + S.camX * (1 - far);

// Hanging under a cloud: a little nearer than it, so it is drawn in front of
// the cloud it is working and behind the ones in front of that.
function under(cloud) {
  const s = cloud && GUESTS.clouds().includes(cloud) ? GUESTS.spot(cloud) : null;
  if (!s) return null;
  // The hang and the craft at the size it is drawn at that depth, or a far
  // craft hangs a whole craft's height below a cloud it is drawn a third of.
  return { x: s.x, far: s.far + 0.005, y: s.y + (P * BALLOON_HANG + CRAFT_TALL) * sizeAt(s.far) };
}

// The next cloud: any sheet, not the one it is at nor one another craft is at
// or going to, among those within BALLOON_VISIT of where it is on the glass,
// so it goes visiting rather than crossing the world.
function nextCloud(i, from, not) {
  const at = onSky(from.x, from.far);
  const held = new Set(CRAFT.map((c, n) => n !== i && c.sky && c.sky.cloud).filter(Boolean));
  const open = GUESTS.clouds().filter(c => c !== not && !held.has(c) && GUESTS.spot(c));
  const near = open.filter(c => Math.abs(onSky(GUESTS.spot(c).x, c.far) - at) < BALLOON_VISIT);
  const pool = near.length ? near : open;
  return pool.length ? pool[Math.floor(roll() * pool.length)] : null;
}

// The trips between clouds are the yard's clock (`c.hang`, `c.t`): the picture
// only chooses where they go. `k.go` is how far along its last trip the
// picture is, nought to one; a cloud that goes out from under a hanging craft
// (a front's, melted away) is a trip the picture makes up at the same pace.
function stepSky(i, c, secs) {
  const post = atPost(i);
  if (!c.sky) c.sky = { ...post, cloud: null, from: null, leg: null, go: 0 };
  const k = c.sky;
  if (c.phase === 'moored') {
    Object.assign(k, post, { cloud: null, from: null, leg: null });
    return;
  }
  if (c.phase === 'down') {
    // Home from wherever it was when it turned for home.
    if (k.leg !== 'down') { k.from = here(k); k.leg = 'down'; }
    Object.assign(k, mix(k.from, post, ease(c.t / BALLOON_CLIMB_S)));
    k.cloud = null;
    return;
  }
  if (c.phase === 'up') {
    if (!under(k.cloud)) k.cloud = nextCloud(i, post, null);
    const to = under(k.cloud) || { ...post, y: post.y - CRAFT_TALL * 3 };
    Object.assign(k, mix(post, to, ease(c.t / BALLOON_CLIMB_S)));
    k.leg = 'up'; k.from = null; k.go = 1;
    return;
  }
  // Aloft. Set off for the next cloud the moment the clock does, or when the
  // one it was at has gone.
  if (!c.hang && k.leg !== 'trip') {
    k.from = here(k); k.cloud = nextCloud(i, k, k.cloud); k.leg = 'trip';
  }
  if (!under(k.cloud)) { k.from = here(k); k.cloud = nextCloud(i, k, null); k.go = 0; }
  const to = under(k.cloud);
  if (!to) return;
  if (!c.hang) {
    k.go = Math.min(1, c.t / travelS());
  } else {
    if (k.leg === 'trip') { k.leg = 'aloft'; k.go = 1; }
    if (k.go < 1) k.go = Math.min(1, k.go + secs / travelS());
  }
  if (k.go < 1) {
    if (!k.from) k.from = here(k);
    Object.assign(k, mix(k.from, to, ease(k.go)));
    return;
  }
  // At the cloud, swaying a little on its own breath.
  Object.assign(k, to);
  k.y += bobOf(i) * sizeAt(k.far);
}

// A cloud a working craft is at pales, and fills back in once it has gone.
function paleClouds(secs) {
  const held = new Set();
  for (let i = 0; i < CRAFT.length; i++) {
    const k = CRAFT[i].sky;
    if (atCloud(i)) held.add(k.cloud);
  }
  const e = Math.min(1, CLOUD_DRAWN_EASE * secs);
  for (const cl of GUESTS.clouds()) cl.drawn = (cl.drawn || 0) + ((held.has(cl) ? 1 : 0) - (cl.drawn || 0)) * e;
}

// How far off its cloud a craft is swaying, this instant: two swings whose
// periods do not divide, so it never quite repeats, and each craft on its own
// place in both.
const BOB_A = 7.9, BOB_B = 11.3;
const swing = i => i * 0.6180339887498949 * Math.PI * 2;
export function bobOf(i) {
  const t = now() / 1000, p = swing(i);
  return (Math.sin(t / BOB_A * Math.PI * 2 + p) * 0.62
        + Math.sin(t / BOB_B * Math.PI * 2 + p * 1.7) * 0.38) * BALLOON_BOB;
}

// How big a craft is drawn at a depth: the cell of the cloud sheet it is among,
// against the nearest sheet's, the way the clouds and the rain are sized; at
// the yard's own depth and anywhere nearer than the nearest sheet, its full
// size. Eased between the sheets, so it grows and shrinks as it travels rather
// than stepping.
const SIZES = CLOUD_LAYERS
  .map(l => ({ far: l.far, s: l.cell / CLOUD_LAYERS[CLOUD_LAYERS.length - 1].cell }))
  .sort((a, b) => a.far - b.far);
export function sizeAt(far) {
  return Math.max(BALLOON_MIN_SIZE, sheetSize(far));
}
function sheetSize(far) {
  if (far <= SIZES[0].far) return SIZES[0].s;
  for (let n = 1; n < SIZES.length; n++)
    if (far <= SIZES[n].far)
      return lerp(SIZES[n - 1].s, SIZES[n].s, (far - SIZES[n - 1].far) / (SIZES[n].far - SIZES[n - 1].far));
  return 1;
}

// Where a craft is on the glass this frame, for drawing and for the pointer:
// the bottom-middle of its basket, its depth and its size.
export function craftAt(i) {
  const c = CRAFT[i];
  const k = c && c.sky ? c.sky : atPost(i);
  return { x: onSky(k.x, k.far), y: k.y, far: k.far, s: sizeAt(k.far) };
}
// The bottom of the basket.
export const craftY = i => craftAt(i).y;

// --- the body walking to it -------------------------------------------------------------
// A purifier whose berth is a craft walks to its post, at the pace any body
// walks to work, and climbs into the basket. Returns true when it has taken
// the body for this frame, so the house's stepper is left only the bodies
// going in.
export function stepRider(w, berth) {
  // Up the post and into the basket at a ladder's pace: the basket hangs
  // over a body's head, and set in it outright the body is seven cells up a
  // frame after it stood at the foot. `aloft` from the first rung, which is
  // what the fall rule asks; `goal` is not 'aloft' until it is in, so the
  // craft does not leave without it.
  if (w.goal === 'board') {
    if (w.craft == null || !CRAFT[w.craft]) { w.goal = 'to'; w.craft = null; w.aloft = false; return false; }
    const want = postY(w.craft) - P - WORKER;
    const up = want - w.y;
    plant(w, w.y + Math.sign(up) * Math.min(CLIMB_PACE * frames(), Math.abs(up)));
    if (Math.abs(want - w.y) < 0.5) w.goal = 'aloft';   // in, and the craft takes it from here
    return true;
  }
  if (w.goal === 'aloft') {
    // Aboard. To the yard it stands at its post, out of reach, however far
    // off in the sky the craft is drawn; the balloon draws it in the basket.
    if (!CRAFT[berth]) { w.goal = 'to'; w.craft = null; w.aloft = false; return false; }
    w.x = mastX(berth) - WORKER / 2;
    plant(w, postY(berth) - P - WORKER);
    return true;
  }

  w.y = climbTo(w, walkY(w.x + WORKER / 2));
  const c = CRAFT[berth];
  const d = mastX(berth) - WORKER / 2 - w.x;
  if (Math.abs(d) >= 1) {
    // Times the frame (`frames` in clock.js), or at thirty hertz the body
    // crosses at half speed.
    w.x += Math.sign(d) * Math.min(COMMUTE_PACE * frames(), Math.abs(d));
    return true;
  }
  w.x = mastX(berth) - WORKER / 2;
  // Into the basket only while the craft is home.
  if (c && c.phase === 'moored') {
    // **This flag is the whole of what keeps a rider in the sky.** The fall
    // rule runs early in the crew pipeline and a body up a post with nothing
    // under it is exactly what it looks for; `aloft` is how the wizard
    // escapes it too.
    w.aloft = true;
    w.goal = 'board';                  // and up the post, above
    w.craft = berth;
  }
  return true;
}

// --- the save -------------------------------------------------------------------------
// The clock. Where the craft is in the sky is a picture and is
// not written down: the clouds it was among are not saved either, so a craft
// read back aloft finds a cloud of the new sky.
export const craftSave = () => CRAFT.map(c => ({ phase: c.phase, t: +c.t.toFixed(2), hang: !!c.hang }));

const PHASES = new Set(['moored', 'up', 'aloft', 'down']);
export function craftLoad(list) {
  CRAFT.length = 0;
  for (const c of (Array.isArray(list) ? list : [])) {
    CRAFT.push({
      phase: PHASES.has(c && c.phase) ? c.phase : 'moored',
      t: Number.isFinite(c && c.t) ? Math.max(0, c.t) : 0,
      hang: !!(c && c.hang),
      sky: null
    });
  }
}

export const clearCraft = () => { CRAFT.length = 0; };

// The craft, on the save (persist.js, `SAVERS`).
export const SAVE = {
  fields: ['craft'],
  write(out) { out.craft = craftSave(); },
  read(s) { craftLoad(s.craft); },
  blank() { clearCraft(); }
};

export { BALLOON_W, BALLOON_H, BALLOON_BASKET, BALLOON_LINES };
