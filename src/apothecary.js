// The apothecary: the hut, the bookshelf of stock, the pots on their fires, and
// the doses a stirrer deals out to the yard.
//
// The building on the ground and the bodies in it are here; the numbers are in
// config/apothecary.js and the changing facts on `S`. The one big idea is that
// this is the first thing in the game paid for *continuously* -- you set what a
// pot is on and it brews that again and again while it has crop and a stirrer,
// and the buff is up for as long as both hold. See DESIGN.md, "The apothecary".
//
// The buff is never a flag that flips on everywhere at once. A brewed batch goes
// on the shelf for its tonic, and the stirrer walks the doses out one trip at a
// time -- the preferred station first -- the way a hauler walks a load. The buff
// lands on a body when the dose reaches it, and not before. So a fresh brew
// spreads across the yard rather than blinking on, and a body whose dose has
// worn off is a body the stirrer comes back to.
//
// Three things about the shape of it, all of them item numbers in wave5.md:
//
//  * Every pot is its own. A pot has its own tonic, its own batch clock and its
//    own one-off flag, so a second pot is a second brew rather than more of the
//    same one.
//  * Stock is per TONIC, not per pot. A batch is minted onto the shelf for what
//    it was, so turning a pot from stew to brace leaves the stew already brewed
//    standing there to be dealt.
//  * The ladders are hybrid. Potency is climbed one tonic at a time -- leaning
//    on one brew is a decision -- while how fast a batch comes, how long a dose
//    lasts, how big a batch is and how many a body carries are the building's,
//    because those are facts about the place rather than about a recipe.

import { RUNGS,
         BREW_CROP, BREW_REAGENT, BREW_MS0, BREW_MS5, BUFF_MS0, BUFF_MS5,
         DOSES0, DOSES5, STRENGTH0, STRENGTH5,
         TONIC_STEW_WORK, TONIC_BRACE_CRIT, TONIC_STRONG_CARRY,
         BREW_RUNG_SPORE, BREW_RUNG_DUST, APOTH_POTS_MAX, POT_COST, POT_RATE,
         DOSE_CARRY, CARRY_RUNGS, APOTH_POT_ROW, APOTH_POT_STAND, POT_PITCH,
         APOTHECARY_DUST, APOTHECARY_CORES, WORKER,
         DOSE_MOTE_MS, DOSE_MOTE_RISE, DOSE_MOTE_LIFE } from './config.js';
import { S, apothecary } from './state.js';
import { now, frames } from './clock.js';
import { rand } from './rng.js';
import { walkY } from './world.js';
import { JOB_OF, jobSaid } from './kit.js';
import { rebalance, rungCost, commutePace } from './upgrades.js';
import { registerRows, registerSite } from './works.js';
import { puff } from './puff.js';
import { JOB, TYPE } from './jobs.js';

// --- the pot's dials, level by level ------------------------------------------
// Each eases straight across the ladder from its level-0 value to the top over
// `RUNGS`, the way the crit ladders do. A save from before this landed reads as
// level nought rather than as some rung nothing agrees with.
const rung = lvl => Math.max(0, Math.min(RUNGS, lvl | 0));
const ease = (a, b, lvl) => a + (b - a) * (rung(lvl) / RUNGS);

// How long one batch takes, how long a dose lasts, and how many doses a batch
// mints -- all read live off the ladders so a rung bought mid-brew is felt on
// the next batch. These are the building's, one figure for every pot in it.
export const brewMs = () => ease(BREW_MS0, BREW_MS5, S.brewLevel);
export const buffMs = () => ease(BUFF_MS0, BUFF_MS5, S.lengthLevel);
export const dosesPer = () => Math.round(ease(DOSES0, DOSES5, S.dosesLevel));
// How many vials leave the building in a stirrer's hands at once (item 11). One
// at level nought, four at the top of a three-rung ladder.
export const carryRung = () => Math.max(0, Math.min(CARRY_RUNGS, S.doseCarryLevel | 0));
export const carryDoses = () => DOSE_CARRY[carryRung()];

// --- the three tonics ---------------------------------------------------------
// A crop base plus one reagent that is never the coin of the station it boosts.
// The stew is the general buff, so its reagent is dust, the shared coin; the two
// targeted tonics take shard, the coin of neither the crew nor the crit they
// lift. Each effect is a lever the game already has.
// `color` is the liquid in the vial -- each tonic its own, so the stock on the
// shelf, the vial a stirrer carries, the fire under the pot that is brewing it
// and the potion floating over a buffed body all read as the same brew by
// colour. The one place besides the fire the yard takes colour, and here it
// carries meaning (which tonic), which is what colour is for. See `tonicColor`,
// the buff haze and carried vial in render/crew.js, and the shelf and the flames
// in render/apothecary.js.
//
// `short` is the one word that tells the three apart, for a row that already
// says what it is doing to them -- "a stronger hearty stew" is three words of
// throat-clearing on a line with a price on the end of it, and "a stronger
// strong brew" is a joke.
export const TONICS = [
  { key: 'stew',   name: 'a hearty stew',   reagent: 'dust',  kind: 'work',
    base: TONIC_STEW_WORK,   unit: 'work',  color: '#5fb84f', short: 'stew' },   // green
  { key: 'brace',  name: 'a bracing tonic', reagent: 'shard', kind: 'crit',
    base: TONIC_BRACE_CRIT,  unit: 'crit',  color: '#a05fd6', short: 'tonic' },  // purple
  { key: 'strong', name: 'a strong brew',   reagent: 'shard', kind: 'carry',
    base: TONIC_STRONG_CARRY, unit: 'carry', color: '#4a86c7', short: 'brew' }   // blue
];
export const tonicOf = key => TONICS.find(t => t.key === key) || null;

// --- the potency ladders, one to a tonic --------------------------------------
// Item 14, decided hybrid: a rung here deepens ONE brew. It used to be a single
// `strengthLevel` for the building, which meant the deepest question the place
// could ask -- which of these three is worth leaning on -- had already been
// answered for you by any purchase at all.
export const potencyLevel = key => rung((S.potency || {})[key]);
const strengthOf = key => ease(STRENGTH0, STRENGTH5, potencyLevel(key)) / STRENGTH0;

// What a tonic is worth right now, at the strength ITS OWN ladder has climbed
// to. A crit tonic reads in points of chance; the other two in a fraction of the
// action.
export const tonicVal = t => (t ? t.base * strengthOf(t.key) : 0);

// A short line for the hover: what this tonic does and how much, spelled at the
// strength it is worth today. The carry brew says who it reaches, because it is
// the only one that reaches a hauler at all (item 12) and that is the whole
// reason to buy it.
export function tonicSays(t) {
  if (!t) return '';
  const v = tonicVal(t);
  if (t.kind === 'work')  return `works ${Math.round(v * 100)}% faster; nothing for a hauler`;
  if (t.kind === 'crit')  return `crit chance +${Math.round(v * 100)} points; nothing for a hauler`;
  if (t.kind === 'carry') return `carries ${Math.round(v * 100)}% more -- the one brew a hauler takes`;
  return '';
}

// The compact form for the menu row itself -- the effect in a few characters, so
// it fits beside the name with the duration and the price. The hover carries the
// full sentence.
export function tonicGain(t) {
  if (!t) return '';
  const v = tonicVal(t);
  if (t.kind === 'work')  return `+${Math.round(v * 100)}% work`;
  if (t.kind === 'crit')  return `+${Math.round(v * 100)} crit`;
  if (t.kind === 'carry') return `+${Math.round(v * 100)}% carry`;
  return '';
}

// --- who a tonic is for -------------------------------------------------------
// A hauler takes the carry brew and nothing else (item 12). Its whole day is the
// walk between a pile and the hole: a quicker swing is a swing it never makes
// and a lifted crit is a roll nobody asks it for, so a stew handed to a hauler
// was crop and dust spent on nothing. Said here once, and asked both by the
// readers below -- so an old save's misplaced dose stops counting -- and by
// `buffable`, so no stirrer ever walks one out again.
const takesTonic = (w, t) =>
  !!t && (t.kind === 'carry' || JOB_OF[w.type] !== JOB.HAUL);

// --- the buffs on a body ------------------------------------------------------
// A body carries a LIST of dealt tonics: one of each kind at most, each on its
// own clock. A second stew refreshes the stew it already has; a stew on top of a
// brace is both, because they lift different things and there is no sense in
// which one replaces the other.
//
// It was one dose flat, and a body under a bracing tonic lost it the moment
// somebody handed it a stew -- the yard quietly undoing work it had just paid
// crop and a reagent for. The KINDS are what may not double up, not the doses:
// two stews at once would be the same boost applied twice, which is the stacking
// this is meant to avoid.
//
// Nothing sweeps the yard to take a spent one off; the readers simply stop
// seeing it, and `stepDoses` clears the husks so the list cannot grow for ever.
const liveOf = w => (w && w.doses ? w.doses.filter(d => d.until > now()) : []);
export const doses = liveOf;
export const doseLive = w => liveOf(w).length > 0;
// The live dose of one KIND -- what each of the three readers below is asking
// for, and what `deal` refreshes rather than piles on to.
const kindOf = (w, kind) => liveOf(w).find(d => {
  const t = tonicOf(d.tonic);
  return t && t.kind === kind && takesTonic(w, t);
});
export const doseTonics = w => liveOf(w).map(d => tonicOf(d.tonic)).filter(Boolean);
// What it is wearing, said: every tonic on it, for the card that lists a body's
// state. One name while it is under one, which is what it always used to say.
export const doseName = w => doseTonics(w).map(t => t.name).join(', ');
// The colour of a tonic's liquid -- for the vial on the shelf and in a stirrer's
// hands. A body may be under several, so the plume asks `doseTonics` instead.
export const tonicColor = key => { const t = tonicOf(key); return t ? t.color : '#fff'; };
// How long the longest-lasting of them has to run, which is what "under a tonic
// for another Ns" means on the card.
export const doseLeftMs = w =>
  liveOf(w).reduce((most, d) => Math.max(most, d.until - now()), 0);
// How much of a dose is left, 0..1, taking the freshest -- what the plume thins
// against, so a body just topped up gives off a full plume even if something
// else on it is nearly spent.
export const doseFrac = w => {
  const ms = Math.max(1, buffMs());
  return liveOf(w).reduce((most, d) => Math.max(most, Math.min(1, (d.until - now()) / ms)), 0);
};

// The three readers, each returning the neutral value when the body wears no
// dose of that kind. One of each kind at most, so each of these finds one or
// none -- no summing, and no question about what two stews would mean.
export function workBoost(w) {
  const d = kindOf(w, 'work');
  return d ? 1 + tonicVal(tonicOf(d.tonic)) : 1;
}
export function critBoost(w) {
  const d = kindOf(w, 'crit');
  return d ? tonicVal(tonicOf(d.tonic)) : 0;
}
export function carryBoost(w) {
  const d = kindOf(w, 'carry');
  return d ? 1 + tonicVal(tonicOf(d.tonic)) : 1;
}

// Take the spent ones off. Nothing reads a lapsed dose, but a body that works
// all day would otherwise carry a list of every tonic it has ever been handed.
export function stepDoses() {
  for (const w of S.workers) {
    if (!w.doses || !w.doses.length) continue;
    const live = liveOf(w);
    if (live.length !== w.doses.length) w.doses = live;
  }
}

// --- what each pot is on, and what is on the shelf ----------------------------
// A pot's tonic and its one-off flag are per pot; the stock is per tonic. Read
// through these two so that an array shorter than the pot count -- which is what
// every save written before a pot was bought holds -- reads as "off" and
// "nothing" rather than as undefined.
export const potTonicOf = i => (S.potTonics || [])[i] || null;
export const potSpentOf = i => !!(S.potSpents || [])[i];
export const doseStock = key => Math.max(0, (S.shelf || {})[key] | 0);
export const doseStockTotal = () => TONICS.reduce((n, t) => n + doseStock(t.key), 0);
const shelve = (key, n) => { S.shelf[key] = doseStock(key) + n; S.dirty = true; };

// --- an old save, poured into the new shape -----------------------------------
// Everything the building used to hold as one figure -- one tonic, one spent
// flag, one heap of doses, one strength ladder -- becomes the first pot's, the
// currently-brewing tonic's shelf, and a rung on each of the three tonics. It
// runs off the legacy field being non-null, and blanks it once it has read it,
// so it happens exactly once however many frames later the building opens. A
// player who had climbed the old strength ladder keeps every rung of it on every
// brew: taking rungs away because the shape of the ladder changed would be the
// one thing a refactor must never do to a save.
export function migrateApothecary() {
  if (S.potTonic != null && !(S.potTonics || []).length) {
    S.potTonics = [S.potTonic];
    S.potTonic = null;
    S.dirty = true;
  }
  if (S.potSpent && !(S.potSpents || []).length) {
    S.potSpents = [true];
    S.potSpent = false;
    S.dirty = true;
  }
  const held = (S.doseHold || []).reduce((a, b) => a + (b || 0), 0);
  if (held > 0) {
    // Doses in the old save have no tonic of their own -- the building brewed
    // one thing -- so they land on the shelf of whatever it was brewing.
    const key = potTonicOf(0) || TONICS[0].key;
    S.doseHold = [];
    shelve(key, held);
  }
  if (S.strengthLevel > 0) {
    for (const t of TONICS)
      if (!potencyLevel(t.key)) S.potency[t.key] = S.strengthLevel;
    S.strengthLevel = 0;
    S.dirty = true;
  }
}

// --- the crew of the pot ------------------------------------------------------
export function newStirrer() {
  return { type: TYPE.STIR, goal: 'to', x: apothecary.x, y: 0 };
}

// Where a stirrer stands to work: at the LEFT of its own pot, not in it. It
// stands there and stirs, in plain sight, the way a farmhand stands at a plot,
// and the k-th keeper stands at the k-th pot -- so a building with three pots
// has three bodies spread along it rather than three drawn on top of each other.
//
// `apothecaryDoor` is the first pot's stand: the mouth of the building, past the
// hut and the shelves, which is where the commute drops a body off and where it
// walks on from. `inMix` counts the bodies actually at a pot brewing -- not
// `S.stirrers`, which counts everybody the building has, one of whom may be
// crossing the yard with a vial.
export const potStandX = i =>
  apothecary.x + APOTH_POT_ROW + Math.max(0, i) * POT_PITCH - APOTH_POT_STAND;
export const apothecaryDoor = () => potStandX(0);
const stirrers = () => S.workers.filter(w => w.type === TYPE.STIR);
export const atPot = w => w.type === TYPE.STIR && w.goal === 'in';
export const inMix = () => S.workers.filter(atPot).length;

// The pot a body tends: the k-th stirrer keeps the k-th pot, so one stirrer is
// always one pot and a second pot is a second body's to keep. A stirrer with no
// pot (more bodies than pots) has nothing to do and idles at the door.
const potOf = w => stirrers().indexOf(w);

// A body worth dealing a tonic to: anybody working who is not a stirrer, who
// takes that tonic at all (a hauler takes only the carry brew -- item 12), and
// who is not already under a live dose OF ITS KIND. It used to be "not already
// under anything", which with tonics that stack means a body under a bracing
// tonic would never be offered a stew -- the crew would settle on whichever
// tonic reached them first and the rest of the menu would go nowhere. What a
// body may not have is two of the same kind.
const buffable = (w, key) => {
  if (w.type === TYPE.STIR) return false;
  const t = tonicOf(key);
  if (!t || !takesTonic(w, t)) return false;
  return !doses(w).some(d => (tonicOf(d.tonic) || {}).kind === t.kind);
};

// The body the next dose goes to: the preferred station first, then whoever is
// nearest the pot. A small brew lands where it matters and a big one spills to
// the rest of the yard. `skip` is who the carrier has already dealt to this
// trip -- they are still standing there and still buffable for a frame, and
// without it a stirrer carrying three would hand all three to one body.
function pickTarget(self, key, skip) {
  const door = apothecaryDoor();
  let pool = S.workers.filter(w => w !== self && w !== skip && buffable(w, key));
  if (!pool.length) return null;
  if (S.potPrefer) {
    const pref = pool.filter(w => JOB_OF[w.type] === S.potPrefer);
    if (pref.length) pool = pref;
  }
  return pool.reduce((best, w) =>
    Math.abs(w.x - door) < Math.abs(best.x - door) ? w : best);
}

// The dose reaches the body: the buff lands here, when the stirrer arrives, and
// not before.
function deal(w, target, key) {
  // One of each kind: a tonic of a kind the body already carries refreshes that
  // one rather than being added beside it, so two stews can never both count.
  const t = tonicOf(key);
  const keep = doses(target).filter(d => (tonicOf(d.tonic) || {}).kind !== (t || {}).kind);
  target.doses = [...keep, { tonic: key, until: now() + buffMs() }];
  w.brewed = (w.brewed || 0) + 1;
  S.dirty = true;
}

// --- one stirrer, one frame ---------------------------------------------------
// A stirrer keeps one pot: it lights a batch stood at it, then carries doses out
// -- as many as the carry ladder allows, dealt one body at a time -- while that
// batch brews on its own. It comes back to the pot between rounds, to take the
// next armful off the shelf and to light the next batch, so the round is: light
// it, come out loaded, deal the lot, walk back. The batch clock in
// `stepApothecary` does NOT pause while it is out; the pot cooks whether or not
// the keeper is stood at it, which is what frees the body to deal.
export function stepStirrer(w) {
  const idx = potOf(w);

  // At the pot, brewing (the batch clock runs in `stepApothecary`). The moment
  // there is stock of its pot's tonic and a body somewhere wants it, the stirrer
  // takes an armful off the shelf and sets out.
  if (w.goal === 'in') {
    // Stood at the pot's left, facing it and stirring: a lean toward the pot on
    // its own slow rhythm, the same `lunge` a farmhand stoops with, so the body
    // is plainly working the pot rather than standing idle beside it.
    w.face = 1;
    if (now() >= (w.stirAt || 0)) { w.lunge = 1; w.stirAt = now() + 520 + rand() * 260; }
    const key = potTonicOf(idx);
    if (idx >= 0 && idx < S.apothPots && key && doseStock(key) > 0) {
      const target = pickTarget(w, key, null);
      if (target) {
        const armful = Math.min(carryDoses(), doseStock(key));
        shelve(key, -armful);
        w.holding = armful; w.carryTonic = key; w.dealTo = target; w.goal = 'out';
      }
    }
    return;
  }

  // Carrying doses out to bodies. If the target has gone (walked off, taken a
  // dose from another pot) the round looks for somebody else, and whatever is
  // still in hand goes back on the shelf rather than being lost.
  if (w.holding) {
    const key = w.carryTonic;
    const t = w.dealTo;
    if (!t || !buffable(t, key) || !S.workers.includes(t)) {
      const next = pickTarget(w, key, null);
      if (next) { w.dealTo = next; return; }
      shelve(key, w.holding);
      w.holding = 0; w.dealTo = null; w.goal = 'to'; return;
    }
    w.y = walkY(w.x + WORKER / 2);
    const d = t.x - w.x;
    if (Math.abs(d) < WORKER) {
      deal(w, t, key);
      w.holding--;
      // Still loaded: straight on to the next body, without the walk home. This
      // is what the carry ladder buys -- one round instead of four.
      if (w.holding > 0) {
        const next = pickTarget(w, key, t);
        if (next) { w.dealTo = next; return; }
        shelve(key, w.holding);                  // nobody left wanting it
        w.holding = 0;
      }
      w.dealTo = null; w.goal = 'to'; return;
    }
    w.face = Math.sign(d) || w.face || 1;
    w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
    return;
  }

  // Walking back to its own pot (`goal === 'to'`) to brew the next batch or to
  // take the next armful off the shelf. A body with no pot of its own -- more
  // stirrers than pots -- goes and stands at the last one rather than out on
  // ground the building does not own.
  w.y = walkY(w.x + WORKER / 2);
  const mine = Math.min(Math.max(0, idx), Math.max(0, S.apothPots - 1));
  const d = potStandX(mine) - WORKER / 2 - w.x;
  if (Math.abs(d) < 1) { w.goal = 'in'; return; }
  w.face = Math.sign(d) || w.face || 1;
  w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
}

// --- the pots on the boil -----------------------------------------------------
// A batch is lit by the pot's keeper standing at it -- an unkept pot brews
// nothing, however long you leave it, which is the lab's chimney rule kept for
// the *start*: the work is begun by a body that is there. Once lit, though, the
// batch cooks on its own clock and does not need the keeper stood over it, so the
// keeper is free to carry doses out while it brews. When a batch lands it mints
// its doses onto the shelf for the tonic it was, and the keeper deals from there.
//
// Crop is spent when a batch *begins*, which is what makes "it has crop" the
// thing that gates the brew: a pot with no crop to start on does not start, and
// nothing smokes. A one-off brews a single batch and then idles; a keep-brewing
// pot starts the next batch the moment the last one is minted.
function canAffordBrew(key) {
  const t = tonicOf(key);
  if (!t) return false;
  if (S.spores < BREW_CROP) return false;
  const reagent = t.reagent === 'dust' ? S.stored : t.reagent === 'shard' ? S.shards : S.spores;
  return reagent >= BREW_REAGENT;
}

function spendBrew(key) {
  const t = tonicOf(key);
  // Crop, on every tonic -- the green drain. Taken through `take` so the grains
  // are lifted out of the pile the way every price is paid.
  take('spore', BREW_CROP);
  take(t.reagent, BREW_REAGENT);
}

// `take` is upgrades.js's, but importing it at the top makes a ring (upgrades ->
// works -> apothecary -> upgrades); read it out of the module the same lazy way
// the boards read each other.
let take = () => {};
export const setTake = fn => { take = fn; };

// Whether a given pot is mid-batch -- the readout each fire has, the way the lab
// smokes and the scrubbing house breathes. True while a batch is going on a kept
// pot, whether or not its keeper is stood at it: once lit, a batch brews on its
// own (see `stepApothecary`), so the fire is up while it cooks and the keeper is
// off dealing, not only while it stands and stirs.
export const potBoiling = i =>
  i < S.apothPots && i < stirrers().length && (S.brewAt[i] || 0) > 0;
// And whether anything in the building is on the boil at all.
export const boiling = () => {
  for (let i = 0; i < S.apothPots; i++) if (potBoiling(i)) return true;
  return false;
};

// How far one pot is through its current batch, 0..1 -- what the progress bar
// over that cauldron reads. Zero when that pot is cold, so a bar is only up
// while its own batch is actually going.
export const brewFracOf = i => {
  if (!potBoiling(i)) return 0;
  return Math.min(1, (S.brewAt[i] || 0) / Math.max(1, brewMs()));
};
// The most-advanced pot in the building, for anything that wants one figure.
export const brewFrac = () => {
  let best = 0;
  for (let i = 0; i < S.apothPots; i++) best = Math.max(best, brewFracOf(i));
  return best;
};

// The tonic burning off the bodies that are under one: a plume of coloured motes
// let go from the head, on the same machinery as every other plume in the yard
// (see puff.js). Motes, not a shape drawn on the head: they are let go into the
// *yard* and they stay where they were let go, so a body that walks leaves its
// trail hanging behind it and a body standing still stands in its own column.
// A flame drawn on the head could only ever move with the head.
//
// Thinner the less of the dose is left, so a body coming to the end of one gives
// off a wisp rather than stopping mid-plume.
export function stepDoseMotes(dt) {
  for (const w of S.workers) {
    const frac = doseFrac(w);
    if (frac <= 0) { w.moteAt = 0; continue; }
    // Nothing to see through a wall, or off a body in the air. Read off the
    // body's own fields rather than by asking the lab and the house, which
    // would be this module importing half the yard to draw a mote.
    if (w.inside || w.aloft || w.lifted || w.falling) continue;
    const at = now();
    if (at < (w.moteAt || 0)) continue;
    // Faster while the dose is fresh, so the plume thins as it wears off rather
    // than stopping all at once.
    w.moteAt = at + DOSE_MOTE_MS * (1.6 - frac * 0.8);
    // A body under several tonics gives off all of them at once, mixed: one
    // mote of each colour, let go together off the same head. Not blended into
    // an average colour -- an average of green and purple is a colour that is
    // neither, and which tonic a body is under has to stay readable. Two
    // colours rising together says two tonics; one muddy one says nothing.
    // Two motes a beat, per tonic -- the density the plume had when it was one
    // tonic flat. "Shows both" cut this to one so a stacked pair would not
    // crowd, and halved the common case instead: a single-tonic body's column
    // thinned from a plume you could read across the yard to a thread.
    for (const t of doseTonics(w))
      puff(w.x + WORKER / 2, w.y, {
        n: 2,
        s: 0.55,
        rise: DOSE_MOTE_RISE,
        life: DOSE_MOTE_LIFE,
        color: t.color
      });
  }
}

export function stepApothecary(dt) {
  // An old save is poured into the new shape before anything reads it, and
  // before the early return: a save whose building is shut still carries the
  // ladder rungs it bought, and they must be there the moment it opens again.
  migrateApothecary();
  if (!S.apothecaryOpen) return;
  const list = stirrers();
  for (let i = 0; i < S.apothPots; i++) {
    if (S.brewAt[i] == null) S.brewAt[i] = 0;
    const body = list[i];
    const key = potTonicOf(i);
    if (!body || !key) continue;                 // no keeper, or this pot is off

    // A one-off that has already put its batch up does not start another. Its
    // doses are still on the shelf to be dealt; once they are gone the pot idles.
    if (!S.potKeep && potSpentOf(i)) continue;

    if (S.brewAt[i] === 0) {                      // lighting a fresh batch
      if (body.goal !== 'in') continue;          // the keeper lights it, stood at the pot...
      if (!canAffordBrew(key)) continue;         // ...and only if there is crop to start on
      spendBrew(key);
    }
    // Once lit, the batch brews on its own -- the keeper is free to walk doses
    // out and deal them, and the clock does not pause for its absence. It comes
    // back between rounds, which is when the next batch is lit.
    S.brewAt[i] += dt;
    if (S.brewAt[i] >= brewMs()) {
      S.brewAt[i] = 0;
      // Onto the shelf for what it IS, not for the pot that made it: turn this
      // pot to another tonic tomorrow and today's batch is still standing there.
      shelve(key, dosesPer());
      if (!S.potKeep) S.potSpents[i] = true;     // this pot's one-off is spent
      S.dirty = true;
    }
  }
}

// --- setting the pots ---------------------------------------------------------
// The board sets these; kept here so the one place that knows what a fresh
// setting means -- it clears that pot's one-off spent flag, so the same tonic
// set again brews again -- is the module that owns the pots.
export function setPotTonic(i, key) {
  const was = potTonicOf(i);
  S.potTonics[i] = was === key ? null : key;     // the set tonic toggles the pot off
  S.potSpents[i] = false;
  S.dirty = true;
}
// Every pot's one-off flag is cleared together, because the dial is the
// building's: turning it back to "just this one" means one more batch each.
export function setKeep(keep) { S.potKeep = keep; S.potSpents = []; S.dirty = true; }
export function setPrefer(job) { S.potPrefer = S.potPrefer === job ? null : job; S.dirty = true; }
// The same setting, chosen off a list rather than stepped onto: a pick says
// which one it wants, so unlike `setPrefer` it does not toggle back off when the
// one you picked is the one already set.
export function choosePrefer(job) { S.potPrefer = job; S.dirty = true; }

// --- what the building's board sells ------------------------------------------
// The hut holds every rung (item 17); each pot gets a section of its own holding
// the menu, so setting what a pot brews is a choice made at that pot rather than
// a single setting for the place. The tonic rows carry a `pot` flag so the board
// renders them as a set-the-pot choice rather than a purchase.
const tonicRow = (i, t) => ({
  key: `tonic-${i}-${t.key}`, pot: true, tonic: t.key, potIndex: i,
  name: t.name,
  // What the row shows in place of a gain and a price: the effect, and the
  // crop-and-reagent a brew costs. The board renders these the way it renders
  // any row's gain and bill, so a tonic reads at a glance rather than only on
  // hover. See the pot branch in shop.js.
  //
  // How long it lasts is not here: it is a rung of its own further down the same
  // board ("a longer dose"), and a figure that is set in one place and repeated
  // in three is a figure you have to keep in step.
  gain: () => tonicGain(t),
  brewCost: () => [['spore', BREW_CROP], [t.reagent, BREW_REAGENT]],
  // No description. A brew's row is its name, what it does, and what it costs,
  // and all three are already on the line -- a sentence under it could only say
  // them again. The rows that keep a description are the ones whose meaning is
  // not on the line at all.
  on: () => potTonicOf(i) === t.key,
  set: () => setPotTonic(i, t.key),
  show: () => S.apothecaryOpen && i < S.apothPots
});

// A rung on the building, priced spore + dust like every tier-two row. `level`
// reads the rung and `climb` puts it up, so a ladder kept on `S` as a number and
// one kept per tonic in a map are the same row to the board.
const brewRung = ({ key, name, unit, level, climb, from, to, rungs }) => ({
  key, kind: 'rung', site: 'apothecary', name, unit,
  rung: level,
  rungs,
  from, to,
  bill: () => [['spore', rungCost(BREW_RUNG_SPORE, level())],
               ['dust', rungCost(BREW_RUNG_DUST, level())]],
  cost: () => rungCost(BREW_RUNG_DUST, level()),
  buy: climb,
  show: () => S.apothecaryOpen && level() < (rungs ? rungs() : RUNGS)
});

// A ladder kept on `S` under its own name -- the building's four.
const stateRung = o => brewRung({
  ...o,
  level: () => S[o.level],
  climb: () => { S[o.level]++; }
});

// And the per-tonic potency ladders (item 14). One row a tonic, all in the hut's
// own section: what you are buying is a deeper version of one recipe, which is a
// fact about the craft rather than about any one pot.
const potencyRow = t => brewRung({
  key: `potency-${t.key}`,
  name: `a stronger ${t.short}`,
  unit: t.kind === 'crit' ? 'crit' : '%',
  level: () => potencyLevel(t.key),
  climb: () => { S.potency[t.key] = potencyLevel(t.key) + 1; },
  from: () => Math.round(t.base * strengthOf(t.key) * 100),
  to: () => Math.round(t.base * (ease(STRENGTH0, STRENGTH5, potencyLevel(t.key) + 1) / STRENGTH0) * 100)
});

// What each pot's section is called. Named rather than numbered because the
// board's headings are words everywhere else in the game, and a heading reading
// "pot 2" would be the only figure on a board of sentences. One a pot the
// building can ever hold; the sections for pots nobody has broken room for hold
// no visible rows, and a section with no rows is not drawn.
const POT_SAID = ['the first pot', 'the second pot', 'the third pot', 'the fourth pot'];

export const APOTHECARY_UPGRADES = [
  // The menu, pot by pot. Pot-major order, so the first pot's rows come first --
  // which is also what makes `__pot('stew')`, the hook that finds a row by its
  // tonic, still mean "put the first pot on a stew".
  ...Array.from({ length: APOTH_POTS_MAX }, (_, i) => TONICS.map(t => tonicRow(i, t))).flat(),

  // The rhythm: keep the fires going for batch after batch, or let them die once
  // this one is dealt. A dial, spending nothing. Named "the fire" rather than
  // "the pot" so it does not echo the section heading a line above it.
  {
    key: 'potkeep', dial: true, site: 'apothecary',
    name: 'keep brewing',
    value: () => (S.potKeep ? 'batch after batch' : 'just this one'),
    // A setting picked off a list rather than stepped through. `options` is what
    // makes a dial a select -- a dial without it keeps the two buttons, which is
    // what a *number* like the casino's chip still wants.
    options: () => [{ key: 'on', label: 'batch after batch' },
                    { key: 'off', label: 'just this one' }],
    at: () => (S.potKeep ? 'on' : 'off'),
    pick: k => setKeep(k === 'on'),
    less: () => setKeep(!S.potKeep),
    more: () => setKeep(!S.potKeep),
    lo: () => false, hi: () => false,
    show: () => S.apothecaryOpen
  },

  // Who the round favors. A dial that walks the jobs the doses can land on.
  {
    key: 'potprefer', dial: true, site: 'apothecary',
    name: 'give potion to',
    value: () => PREFER_LABEL[S.potPrefer] || 'whoever is nearest',
    // Seven stations to walk past two buttons at a time; a list you pick from is
    // the whole reason this control exists. "Nobody in particular" is the first
    // of them rather than a step off either end.
    options: () => [{ key: '', label: 'whoever is nearest' },
                    ...PREFER_JOBS.map(j => ({ key: j, label: PREFER_LABEL[j] }))],
    at: () => S.potPrefer || '',
    pick: k => choosePrefer(k || null),
    less: () => setPrefer(stepPrefer(-1)),
    more: () => setPrefer(stepPrefer(1)),
    lo: () => false, hi: () => false,
    show: () => S.apothecaryOpen
  },

  // Standing room for one more pot and its stirrer -- capOfBare-shaped, the
  // farm's "another plot" exactly. Broken by the building's own hands.
  {
    key: 'anotherpot', kind: 'place', site: 'apothecary',
    name: 'another pot', unit: 'pots',
    from: () => S.apothPots,
    to: () => S.apothPots + 1,
    cost: () => Math.round(POT_COST * Math.pow(POT_RATE, S.apothPots - 1)),
    currency: 'dust',
    buy: () => { S.apothPots++; rebalance(); },
    show: () => S.apothecaryOpen && S.apothPots < APOTH_POTS_MAX
  },

  stateRung({ key: 'brewspeed', name: 'a quicker brew', unit: 's', level: 'brewLevel',
    from: () => Math.round(brewMs() / 1000),
    to: () => Math.round(ease(BREW_MS0, BREW_MS5, S.brewLevel + 1) / 1000) }),
  stateRung({ key: 'bufflength', name: 'a longer dose', unit: 's', level: 'lengthLevel',
    from: () => Math.round(buffMs() / 1000),
    to: () => Math.round(ease(BUFF_MS0, BUFF_MS5, S.lengthLevel + 1) / 1000) }),
  stateRung({ key: 'brewdoses', name: 'a bigger batch', unit: 'doses', level: 'dosesLevel',
    from: () => Math.round(ease(DOSES0, DOSES5, S.dosesLevel)),
    to: () => Math.round(ease(DOSES0, DOSES5, S.dosesLevel + 1)) }),
  // How many vials leave in one pair of hands (item 11). Three rungs, not five:
  // the ladder ends where a body carrying an armful of glass stops being one you
  // believe. Its `note` is the one place the hauler rule is written on a row.
  stateRung({ key: 'dosecarry', name: 'a fuller armful', unit: 'doses',
    level: 'doseCarryLevel', rungs: () => CARRY_RUNGS,
    from: () => DOSE_CARRY[carryRung()],
    to: () => DOSE_CARRY[Math.min(CARRY_RUNGS, carryRung() + 1)] }),

  ...TONICS.map(potencyRow)
];

// The board reads top to bottom the way the building stands left to right: the
// pots' menus first, then the hut that holds everything else.
export const APOTHECARY_SECTIONS = [
  ...POT_SAID.slice(0, APOTH_POTS_MAX)
    .map((title, i) => ({ title, keys: TONICS.map(t => `tonic-${i}-${t.key}`) })),
  { title: 'the pot', keys: ['potkeep', 'potprefer', 'anotherpot'] },
  { title: 'the craft', keys: ['brewspeed', 'bufflength', 'brewdoses', 'dosecarry'] },
  { title: 'the recipes', keys: TONICS.map(t => `potency-${t.key}`) }
];

// The jobs a dose can favor, in the order the dial walks them. Null (whoever is
// nearest) is the step before the first and after the last.
const PREFER_JOBS = [JOB.ROCK, JOB.QUARRY, JOB.FARM, JOB.SCHOLAR, JOB.PURIFY, JOB.HAUL];
// Said the way every other board says a job -- see `jobSaid` in kit.js. This was
// a second table of the same words, which is how the haulers ended up as "the
// crew" here and "haulers" everywhere else, on a board where "the crew" also
// means the whole settlement.
const PREFER_LABEL = Object.fromEntries(PREFER_JOBS.map(j => [j, jobSaid(j)]));
function stepPrefer(d) {
  const at = PREFER_JOBS.indexOf(S.potPrefer);
  const next = at + d;
  return next < 0 || next >= PREFER_JOBS.length ? null : PREFER_JOBS[next];
}

// What it costs to put the place up: a core, and dust a small early yard can
// find -- the farm's own shape, because it stands right after the farm.
export const apothecaryCost = () => APOTHECARY_DUST;
export const apothecaryCores = () => APOTHECARY_CORES;

// The building brews rather than buys, so the works machinery knows the pots are
// its own gang's work-site and the rungs belong to it. One stirrer to a pot is
// the room, and the pot's own pace is a body's second a second -- the brew clock
// is stepped here, not by `stepWorks`, because a brew is an upkeep and not a
// one-shot build.
registerSite('apothecary', { room: () => S.apothPots });
registerRows(APOTHECARY_UPGRADES);
