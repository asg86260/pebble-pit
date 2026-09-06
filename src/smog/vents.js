import { now } from '../clock.js';
import { GOING_CAP, P, PLUME_LEAN, PLUME_LIFE, PLUME_THIN, PUFF_FADE, PUFF_LEAN_WIND, PUFF_UP, PUFF_UP_FLOOR, PUFF_UP_GIVE, PUFF_WANDER, SMOG_CAP, SMOG_GIVE, SMOG_PER_DUST, SMOG_PER_MOTE, SMOG_TINTS } from '../config.js';
import { rand } from '../rng.js';
import { S } from '../state.js';
import { give, windAt } from '../wind.js';
import { GOING, SKY, bandLow, bandTop, drift } from './band.js';
import { countMade } from './books.js';
import { enter, nextSlot } from './sky.js';

// --- what goes up --------------------------------------------------------------
// Something was taken out of the ground, at a place. The number is bookkeeping;
// the puff is the point. Without one, the connection between what the crew do and
// what is overhead is a line in a design document and nothing you could see.
// `kind` is which part of the works this came out of -- 'dust' off the rock,
// 'shard' out of the quarry, 'spore' off the plots. It is carried all the way up and
// kept on the mote, because unlike the dust hanging over a place, smoke drifts:
// by the time a mote has settled and spread it is nowhere near what made it, so
// asking what is under it now would give the wrong answer. Where it came from is
// a fact about the mote, so the mote holds it.
export function foul(grains, x, y, kind = 'dust') {
  // Nothing a machine does fouls where it happened. Its dirt goes up off its own
  // stack, in soot, in one place -- see `stepMachines` -- rather than being added
  // to what the station raised. Without this the sky over a working quarry went
  // blue, because the cut's dust is blue and the machine was still raising it.
  // ...and it does not matter whether one is working *now*. This used to read
  // `S.machineWorking && kind !== 'mach'`, which is a gate that depends on the
  // state of the yard at the moment somebody asks -- so the guarantee "hand work
  // never fouls" was true only while a machine happened to be mid-beat. It is
  // unconditional now: the sky has one producer, and the only dirt it accepts is
  // a machine's. Anything else is refused here rather than being trusted not to
  // ask, which is what makes the rule a rule instead of a habit.
  if (kind !== 'mach') return 0;
  if (!grains) return;
  const add = grains * SMOG_PER_DUST;
  countMade(add);                  // counted where it is made -- see `sampleAir`
  // Nothing is added to the number here, and that is the whole of the fix for a
  // sky that rained twice. The haze *is* the motes -- see `reckon` -- so what
  // this does is put motes up, and the number follows them by arithmetic rather
  // than by being kept alongside and hoped to agree.
  //
  // It never did agree. The haze went up by what the hit was worth and the
  // specks that were supposed to carry it were dropped whenever there were
  // already a few hundred climbing, so on a busy yard the number ran away from
  // the band underneath it. Then a shower emptied a band that was always short,
  // stopped with the number still over the line, and the next frame read a
  // filthy sky over an empty one and started another. That is the rain that
  // never stops and the haze that never comes back, and neither of them is
  // weather: they are two accounts of one thing disagreeing.
  // Everything that goes up climbs from where it was made. Nothing is put
  // straight into the band -- see below.
  if (x == null) return;
  // One puff stands for one mote's worth of sky, so what goes up is what this
  // was worth: the whole ones, and the fraction left over as a chance at one
  // more. Every hit throwing exactly one puff would put ten times as many in
  // the air as ever end up staying.
  //
  // It *was* one puff at most -- a coin weighted by what the hit was worth --
  // which is right only while a hit is worth less than a mote, and every hit
  // was, until the sky was made of two and a half times the specks and a swing
  // started being worth more than one of them. A cut shard is worth nearly
  // seven. The haze went up by all seven and one speck was sent to stand for
  // them, so the number climbed away from the sky it was supposed to be
  // counting: eight hundred of haze over a band holding six hundred of it.
  //
  // That gap is why the sky rains and rains again. Rain empties the band, the
  // band is short, so it runs out while the number is still over the line --
  // and the next frame reads a filthy sky over an empty one and starts another
  // shower. What is overhead and what the readout says have to be the same
  // thing, or the weather is driven by a number nobody can see.
  const puffs = whole(add / SMOG_PER_MOTE);
  for (let i = 0; i < puffs; i++) {
    // A full sky takes no more. This is the one place a mote is turned away, and
    // it is turned away *with* its dirt: the number cannot go up if the speck
    // did not.
    if (SKY.length >= MOTE_CAP) break;
    // And there is no cap on the climb. There was one -- past a few hundred
    // specks on their way up, the next was put straight into the band instead --
    // and what that looked like was pollution appearing in the sky out of
    // nothing, a hundred cells from anything that could have made it, and being
    // dragged off to the house before you had worked out where it came from.
    // A thick plume is what a busy yard looks like; it is not a thing to hide.
    // Made by the band's own maker, because it is going to be a mote in the band
    // and the object is never replaced -- see `skyMote` for why one shape
    // matters. The look, the kind and the share of the wind all come from there;
    // what a climbing one has of its own is the climb.
    // Born a little either side of the stack's mouth. Eight cells of scatter
    // (wave7-sky, A1): three read as one column however much it leaned, and
    // widening the birth is widening the climb rather than the sky -- the band
    // above is untouched.
    const p = skyMote(x + (rand() - 0.5) * P * 8, y, kind);
    p.up = true;
    // How fast it goes up, and it is the one number that decides whether a plume
    // reads as smoke or as sparks. It was more than twice this and spread twice
    // as wide, so the quickest specks left the slowest behind and drew the eye
    // straight up the window. Slower and closer together: the plume rises as a
    // body, and a speck bound for the top of the sky takes its time getting
    // there instead of making a run for it.
    p.vy = -(PUFF_UP + rand() * PUFF_UP_GIVE);
    // Where it started and which way it leans. A plume widens with height --
    // every puff leaning on the same shared sway sent the lot up as one straight
    // cylinder, which reads as a pipe rather than as smoke.
    p.lean = (rand() - 0.5) * 2;
    enter(p);
  }
}

// Whole things out of a fractional amount: the whole ones, and the fraction left
// over as a chance at one more. Over a run this is exact, and it is the only way
// to spend a fraction of a speck when a speck is the smallest thing there is.
const whole = n => Math.floor(n) + (rand() < n - Math.floor(n) ? 1 : 0);

// What the sky holds at its filthiest, in motes rather than in dirt. Everything
// else in this file counts specks now, so the ceiling does too.
const MOTE_CAP = Math.round(SMOG_CAP / SMOG_PER_MOTE);

// The number over the pit, worked out from the sky rather than kept beside it.
// One line, called once a frame, and it is the whole of the accounting: there is
// no second place where haze is added or taken, so there is nothing for the two
// of them to disagree about.
export const reckon = () => { S.haze = SKY.length * SMOG_PER_MOTE; };

// A mote is a slot in the band and a share of the wind. It has no position of
// its own: where it is is where its slot is, this frame, leaned on by whatever
// the wind is doing at that instant.
// What a speck looks like, decided once and kept for life.
//
// Both ends of a speck's life are built here: the puff that leaves a swing (see
// `foul`) and the mote that is placed in the band (`skyMote`). That is the point
// of it being one function. The look used to be set in `skyMote` alone, and
// `skyMote` is only reached when a sky is *restored* -- a save coming back or
// the dev panel winding the haze up. Everything that gets into the sky the way
// the game actually puts it there climbs, and a climbing puff is built by hand
// in `foul` and then handed its band fields by `settleHere`, neither of which
// knew about any of this. So the variation was real in a loaded sky and absent
// in a played one, which is the one place it matters.
//
// A speck also has to keep it across that hand-off. It went up looking like
// this and it stays looking like this -- the whole argument for `settleHere`
// not touching a mote's position or weight is that the thing off the swing and
// the thing in the band are one thing, and its colour is no different.
export const look = (kind = 'dust') => ({
  // What this one weighs, to look at: a fifth either side of the haze's own ink.
  // A band of specks all drawn at exactly one weight is a screen of identical
  // dots -- it reads as noise laid over the sky rather than as smoke of
  // different ages and thicknesses hanging in it. Texture, not confetti.
  ink: 0.8 + rand() * 0.4,
  // and which of its kind's shades it is. See SMOG_TINTS: a kind is a small
  // family of tones, not one flat colour.
  tone: Math.floor(rand() * (SMOG_TINTS[kind] || SMOG_TINTS.dust).length)
});

// A mote is a place in the band, a share of the wind, and -- for its first few
// seconds -- where it came in. It arrives at the spot the puff got to and eases
// out to its place among the others, which is what joining a haze looks like.
//
// **There is one shape of mote and this is it**, climbing or settled, and every
// field either kind will ever have is named here even where it means nothing
// yet. This is not tidiness. A speck that goes up is *the same object* that
// comes to rest -- that is the whole design of the plume, see `settleHere` --
// and the way that was done was to hand it four new fields on arrival and
// `delete` two others. A `delete` puts the object into dictionary mode for the
// rest of its life, so every settled mote in the sky was a hash table, and
// `place` reads eleven fields off every one of them sixty times a second: with a
// full band that is three million dictionary lookups a second, and it was more
// than half of what the frame cost. Growing a mote's shape late costs more than
// the whole of what the missing fields save -- the same lesson the grids learned
// about their `awake` flags, see grid.js.
export const skyMote = (x, y, kind = 'dust') => ({
  kind,
  up: false,                            // arrived: this one is in the band
  ...look(kind),
  ...nextSlot(),
  // The climb, which is over for a mote made here and is the whole of a mote
  // made by `foul`: how fast it is rising, where it started, and which way it
  // leans on the way up. See `stepPuffs`.
  vy: 0,
  y0: y,
  lean: 0,
  // What a hand through the smoke and a fan on the other side of the yard have
  // bent it out of place by. Both ease back to nought and both start there.
  px: 0, py: 0, sx: 0, sy: 0,
  // its share of the wind, a sixth either way. This was a phase to bob on, and
  // a band of motes each bobbing on its own was a haze that shimmered where it
  // stood -- movement everywhere and no direction anywhere.
  give: give(rand(), SMOG_GIVE),
  // The band's shared creep as it stood when this mote's place was fixed. What
  // this one has crept is `give * (drift - roam0)`, worked out on demand rather
  // than accumulated per mote per frame -- see `roamOf`.
  roam0: drift,
  // How long it has been up there. The stretch of sky it is placed within opens
  // out with this, which is what dispersal is here -- see `spreadAt`.
  age: 0,
  fromX: x,
  fromY: y,
  // From nothing (wave7-sky, A1). A speck born at full weight is a speck that
  // pops into view, and popping is the one thing nothing in this sky may do.
  // Every mote everywhere -- a climbing puff, a restored band -- comes up to
  // weight over PUFF_FADE: `stepPuffs` steps a climber's fade and `place` steps
  // a settled one's, both against the same clock.
  fade: 0,
  // the phase its own sideways wander runs on, fixed at birth so a puff leans
  // its own way for the whole climb -- see `stepPuffs`
  seed: rand() * Math.PI * 2,
  // Which shower this one belongs to, if any. Written by `stepSmog` when a
  // shower breaks and read by `doomed`; named here rather than added there,
  // because a field added late is a mote that has stopped being one shape.
  rain: -1,
  // Whether it still has anything to integrate, and whether it is still in the
  // sky at all. See ACTIVE: a mote at rest is not stepped, and `x`/`y` below are
  // whatever it was last written at rather than where it is -- ask `moteX` and
  // `moteY`.
  awake: false,
  gone: false,
  x: x,
  y: y
});

// An even handful of a list, in its own order. Taking the first n of the sky
// takes the *oldest* n -- near neighbours that have been drifting together for
// minutes, which in a sky with eddies in it agree with each other rather than
// with the weather. Striding across the whole list samples the band instead of
// sampling one swirl.
export function spread(list, n) {
  if (list.length <= n) return list;
  const step = list.length / n, out = [];
  for (let i = 0; i < n; i++) out.push(list[Math.floor(i * step)]);
  return out;
}

// How many should be up there for the haze there is. The motes say where the sky
// is thick and thin; this only says how many of them there are.
export const motesWanted = () => Math.round(S.haze / SMOG_PER_MOTE);

// The height a mote lives at: its slot's own place down the sky. One line, and
// it is what `moteY` reads too -- see there.
const slotY = (m, top, deep) => top + m.sv * deep;

export function stepPuffs(secs) {
  const top = bandTop(), deep = bandLow() - top;
  const w = windAt(now());          // one wind, asked once, for the whole plume
  const tSec = now() / 1000;        // one clock for every puff's wander
  const fadeBy = secs / (PUFF_FADE / 1000);
  for (let i = SKY.length - 1; i >= 0; i--) {
    const p = SKY[i];
    if (!p.up) continue;            // arrived: the band has it, see `place`
    // Slowing into the band and thinning where it stands.
    //
    // It reached the air the haze lives in. It does not stop dead, it does not
    // blink out, and it does not go anywhere in particular: it runs out of climb,
    // drifts on what it had, and thins into what is already up there, while the
    // mote it becomes comes up to weight in the same place over the same breath.
    //
    // It used to pick a spot along the whole sky and slide to it, on the argument
    // that the wind takes it and that arriving where it rose would pile the sky
    // over the rock. Watching it, that was a speck shooting off sideways and
    // vanishing -- an errand, not weather. The spreading belongs to the band and
    // the band already does it: what a mote does when it gets there is settle, and
    // being carried along the sky is the next hour of its life, not the next
    // half second of it.
    const rose = -p.vy * secs * 60;             // what it climbed this frame
    p.y -= rose;
    // carried by the yard's wind, its own share of it, for as long as it is up
    p.x += w * PUFF_LEAN_WIND * p.give * secs;
    // and a tenth of that sideways, the way it is leaning. Taken off the climb
    // itself rather than off the clock, so the drift is always the same share of
    // the height however fast the puff got up there -- a plume that leans and
    // opens a little, not one that fans across the sky.
    p.x += p.lean * PLUME_LEAN * rose;
    // and its own wander (wave7-sky, A1): a slow sine on the mote's own seed,
    // on top of the lean. The lean is one straight line per puff, so a plume of
    // them was a sheaf of straight lines -- still a band, only splayed. A
    // wander bends each line its own way as it climbs, which is what makes the
    // plume billow open instead of standing.
    p.x += Math.sin(p.seed + tSec * 0.7) * PUFF_WANDER * secs;
    // Coming up to weight as it climbs (wave7-sky, A1). Born at nothing -- see
    // `skyMote` -- and only while the plume is still a plume: past PLUME_LIFE
    // the thinning below owns the fade, and stepping it up under that would be
    // two hands on one number.
    if (p.age <= PLUME_LIFE && p.fade < 1) p.fade = Math.min(1, p.fade + fadeBy);
    // whatever the cursor left in it, dying away
    if (p.sx || p.sy) {
      p.x += p.sx || 0;
      p.y += p.sy || 0;
      p.sx = (p.sx || 0) * 0.94;
      p.sy = (p.sy || 0) * 0.94;
    }
    // It slows on the way up, but it always gets there: a puff that ran out of
    // push halfway and hung about would be a swing that never reached the sky.
    // It eases off as it goes, but never below a crawl -- a puff that ran out of
    // push halfway and hung about would be a swing that never reached the sky.
    p.vy = Math.min(p.vy * (1 - secs * 0.12), -PUFF_UP_FLOOR);

    // **A plume is a plume for PLUME_LIFE, and no puff flies to its slot.**
    //
    // (wave6-sky, item 4.) A puff used to climb all the way to the height its
    // slot lives at, which for a speck bound near the top of the window is most
    // of the sky -- a column of smoke crossing the whole view reads as an
    // event, not as exhaust. Every puff now climbs for PLUME_LIFE, thins out
    // where it is over PLUME_THIN, and only once it is gone from the climb does
    // its mote join the band *at its slot* -- fading in there over PUFF_FADE,
    // the same arrival every settled mote makes. The dirt is counted
    // identically; only the journey is cut.
    //
    // The relocation waits a tenth of a second past the fade reaching nothing,
    // and the weight is derived from the climb's own age rather than
    // integrated, so it cannot drift with the step size: whatever the frame
    // step, there is no instant at which something visible is somewhere new.
    // That is the rule the sky-readout check holds -- nothing you can see ever
    // jumps.
    //
    // And it is the same speck. Nothing is spliced out and nothing is pushed
    // in: the object you have been watching climb is given a slot and carries
    // on. The stack that made it is forgotten with the climb -- the band is a
    // total over the whole yard, not a bank over each machine.
    p.age += secs;
    if (p.age <= PLUME_LIFE) continue;
    p.fade = Math.max(0, 1 - (p.age - PLUME_LIFE) / PLUME_THIN);
    if (p.age <= PLUME_LIFE + PLUME_THIN + 0.1) continue;
    settleHere(p, false);
    // Born straight at its place in the band, so the sink ease has nothing to
    // do and the fade-in is the whole of the arrival.
    p.fromY = slotY(p, top, deep);
    p.y = p.fromY;
  }
}

// A climbing mote becomes a band mote, in place. Its position is not touched --
// the band eases it from here to its slot over the next few seconds, which is
// what settling looks like -- and neither is what it is made of or how solid it
// is drawn: it went up at the weight of the haze and it stays at the weight of
// the haze.
// `ghost` is the cross-fade picture left at the top of a finished climb. A
// plume that timed out has already thinned to nothing -- leaving a ghost there
// would draw the smoke back in at the spot it just faded from.
function settleHere(m, ghost = true) {
  m.up = false;
  // Its look is not among the fields set here, and that is deliberate: `foul`
  // gave it one when it left the swing and it keeps it. A speck that changed
  // colour or weight on arriving would be a speck you watched climb and then
  // saw replaced by another one.
  
  Object.assign(m, nextSlot());
  m.roam0 = drift;
  m.age = 0;
  m.fromX = m.x;
  m.fromY = m.y;
  // **It comes up to weight rather than appearing at it**, and a picture of it is
  // left behind at the top of the climb to thin out.
  //
  // A puff joins the sky wherever the air up there has taken it, which is the
  // whole argument a few lines up in `stepPuffs` and is right -- a mote that
  // stayed over the place it rose from makes the sky a mound sitting on the
  // rock. But that arrival is a *jump*: the speck you have been watching climb
  // is over the works on one frame and half the world away on the next. It read
  // as the plume popping out of existence at the top.
  //
  // So it is a cross-fade. This used to say `m.fade = 1` on the reasoning that a
  // speck never went out and so had nothing to come back from, which was true
  // when it arrived where it had climbed to, and is not true now.
  if (ghost && GOING.length < GOING_CAP) {
    // still climbing, and still leaning the way it was leaning: what is left
    // behind at the top of a climb is smoke thinning as it goes, not a speck
    // parked in the air.
    GOING.push({ x: m.x, y: m.y, kind: m.kind, tone: m.tone, ink: m.ink, t: 1,
                 vx: m.lean * PLUME_LEAN * 2, vy: m.vy });
  }
  m.fade = 0;
  // The climb, over. Set back rather than deleted: these two used to be
  // `delete`d here, which is the one operation that turns an object into a
  // dictionary for good, and it was being done to every mote in the sky on the
  // frame it arrived. See `skyMote`.
  m.vy = 0;
  m.lean = 0;
  m.y0 = m.y;
}
