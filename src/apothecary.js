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

import { LADDER,
         BREW_BILL, BREW_MS, BUFF_MS0, BUFF_MS5,
         DOSES0, DOSES_CARDS, TIER_BAND, STRENGTH0, STRENGTH5,
         TONIC_STEW_WORK, TONIC_BRACE_CRIT, TONIC_STRONG_CARRY,
         TONIC_SWIFT_PACE, TONIC_GLEAM_SPARK,
         BREW_RUNG_DUST, APOTH_POTS_MAX, POT_COST, POT_RATE,
         DOSE_CARRY, APOTH_POT_ROW, APOTH_POT_STAND, POT_PITCH,
         POT_W, POT_H,
         APOTHECARY_DUST, APOTHECARY_CORES, WORKER, APOTH_HUT_W, APOTH_HUT_H,
         DOSE_MOTE_MS, DOSE_MOTE_RISE, DOSE_MOTE_LIFE } from './config.js';
import { S, apothecary } from './state.js';
import { now, frames } from './clock.js';
import { rand } from './rng.js';
import { walkY } from './world.js';
import { JOB_OF, jobSaid } from './kit.js';
import { rebalance, commutePace, unitText } from './upgrades.js';
import { registerRows } from './works.js';
import { tierRows, cards, named } from './upgrades/tiers.js';
import { puff } from './puff.js';
import { JOB, TYPE } from './jobs.js';

// --- the pot's dials, level by level ------------------------------------------
// Each eases straight across the ladder from its level-0 value to the top over
// `LADDER`, the way the crit ladders do. The top is where it was when the
// ladders were five rungs; nine is finer steps to it, not a better pot. A save
// from before this landed reads as level nought rather than as some rung
// nothing agrees with.
const rung = lvl => Math.max(0, Math.min(LADDER, lvl | 0));
const ease = (a, b, lvl) => a + (b - a) * (rung(lvl) / LADDER);

// How long one batch takes, how long a dose lasts, and how many doses a batch
// mints -- the last two read live off their ladders so a rung bought mid-brew
// is felt on the next batch. These are the building's, one figure for every
// pot in it. The batch clock is fixed; see BREW_MS.
export const brewMs = () => BREW_MS;
export const buffMs = (lvl = S.lengthLevel) => ease(BUFF_MS0, BUFF_MS5, lvl);
// A whole dose a rung over its own shorter ladder -- see DOSES0.
export const dosesPer = (lvl = S.dosesLevel) =>
  DOSES0 + Math.max(0, Math.min(DOSES_CARDS * TIER_BAND, lvl | 0));
// One vial in a stirrer's hands, always -- see DOSE_CARRY.
export const carryDoses = () => DOSE_CARRY;
// --- the three tonics ---------------------------------------------------------
// A crop base plus one reagent. The stew is the general buff, so its reagent is
// dust, the shared coin; the two targeted tonics take shard, the coin of
// neither the crew nor the crit they lift; the gleam brew alone is priced in
// the coin it makes, sparks, so a wizard's tonic is a bet with the machines'
// money. Each effect is a lever the game already has. How much of each coin a
// batch takes is `BREW_BILL` in config -- the reagent here names the second
// line of that bill and is what the menu gates on.
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
// `jobs` is who a brew is for, said on the recipe itself (item 22). The stew and
// the bracing tonic are for everybody who swings or rolls -- every job but the
// haulers, whose day has no swing in it; the strong brew is for whoever carries;
// and the two wave-7 recipes are each one trade's own. `takesTonic` below is
// nothing but a membership test on this list, so who a brew reaches and what the
// picker offers cannot come apart.
const EVERY_BUT_HAUL = Object.values(JOB).filter(j => j !== JOB.HAUL);
export const TONICS = [
  { key: 'stew',   name: 'hearty stew',   reagent: 'dust',  kind: 'work',
    base: TONIC_STEW_WORK,   unit: 'work',  color: '#5fb84f', short: 'stew',
    jobs: EVERY_BUT_HAUL },                                                      // green
  { key: 'brace',  name: 'bracing tonic', reagent: 'shard', kind: 'crit',
    base: TONIC_BRACE_CRIT,  unit: 'crit',  color: '#a05fd6', short: 'tonic',
    jobs: EVERY_BUT_HAUL },                                                      // purple
  { key: 'strong', name: 'strong brew',   reagent: 'shard', kind: 'carry',
    base: TONIC_STRONG_CARRY, unit: 'carry', color: '#4a86c7', short: 'brew',
    jobs: [JOB.HAUL, JOB.QUARRY] },                                              // blue
  { key: 'swift',  name: 'speed brew',      reagent: 'spore', kind: 'pace',
    base: TONIC_SWIFT_PACE,  unit: 'pace',  color: '#d9a441', short: 'speed',
    jobs: [JOB.HAUL] },                                                          // amber
  { key: 'gleam',  name: 'mana brew',      reagent: 'spark', kind: 'spark',
    base: TONIC_GLEAM_SPARK, unit: 'spark', color: '#e04848', short: 'gleam',
    jobs: [JOB.WIZARD] }                                                         // red
];
// A recipe is hidden until its reagent has been seen (item 24): shard is the
// quarry's coin and a spark comes off the sky, and a brew priced in a currency
// the player has never met is a row about nothing. Asked by the picker and by
// the potency rows alike.
export const tonicShown = t => !!t && (t.reagent === 'shard' ? !!S.quarryOpen :
                                       t.reagent === 'spark' ? !!S.seenSpark : true);
export const tonicOf = key => TONICS.find(t => t.key === key) || null;

// --- the potency ladders, one to a tonic --------------------------------------
// Item 14, decided hybrid: a rung here deepens ONE brew. It used to be a single
// `strengthLevel` for the building, which meant the deepest question the place
// could ask -- which of these three is worth leaning on -- had already been
// answered for you by any purchase at all.
export const potencyLevel = key => rung((S.potency || {})[key]);
const strengthOf = (key, lvl = potencyLevel(key)) => ease(STRENGTH0, STRENGTH5, lvl) / STRENGTH0;

// What a tonic is worth right now, at the strength ITS OWN ladder has climbed
// to. A crit tonic reads in points of chance; the other two in a fraction of the
// action.
export const tonicVal = t => (t ? t.base * strengthOf(t.key) : 0);

// What a brew does, in the few words a menu row has for it: how much of what,
// and how long it lasts. Read live off the tonic's own potency ladder and off
// the building's dose-length ladder, so a rung bought on one recipe changes what
// the picker says about that recipe the next time it opens and says nothing
// about the other two.
//
// One place, because it is said in one place: the picker at the pot. It was
// written for the board rows that used to set a pot's brew and went with them,
// and it is back for the control that replaced them -- the same string, because
// the question "what does this do" did not change when the answer moved.
//
// Seconds are a clock, never the letter `s` (see `secondsMark` in upgrades.js).
// The carry brew names haulers because it is the only brew a hauler takes at
// all, and that is the fact that decides whether it is worth putting a pot on.
export function tonicGain(t) {
  if (!t) return '';
  const v = Math.round(tonicVal(t) * 100);
  const what = t.kind === 'work' ? `+${v}% work`
             : t.kind === 'crit' ? `+${v} crit`
             : t.kind === 'pace' ? `+${v}% haul speed`
             : t.kind === 'spark' ? `+${v}% sparks`
             : `+${v}% carried, haulers too`;
  return `${what}, ${Math.round(buffMs() / 1000)} ${unitText('s')}`;
}

// --- who a tonic is for -------------------------------------------------------
// The recipe says who it is for (`jobs`, item 22), so this is nothing but a
// membership test. It was a hand-written hauler exception; the list is asked
// both by the readers below -- so an old save's misplaced dose stops counting --
// and by `buffable`, so no stirrer ever walks one out again.
export const takesTonic = (w, t) =>
  !!t && t.jobs.includes(JOB_OF[w.type]);

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
// The speed brew on a hauler's legs (item 21): multiply the pace wherever a
// hauler's own walk is computed. The one call site is crew/hauler.js's use of
// `haulSpeed()`.
export function paceBoost(w) {
  const d = kindOf(w, 'pace');
  return d ? 1 + tonicVal(tonicOf(d.tonic)) : 1;
}
// And the gleam brew on a wizard's bolt (item 25): scale what a strike brings
// off the star, at wizard.js's one `fire(...)` call.
export function sparkBoost(w) {
  const d = kindOf(w, 'spark');
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
// What the batch on a given pot was lit and PAID for. A batch belongs to the
// tonic it was bought as: the price is taken when it lights, so turning the pot
// to another tonic while it cooks must not change what comes off it, or a cheap
// brew buys a dear one. Falls back to the pot's setting for a save written
// before batches carried their own key.
export const brewKeyOf = i => (S.brewKeys || [])[i] || potTonicOf(i);
export const potSpentOf = i => !!(S.potSpents || [])[i];
export const doseStock = key => Math.max(0, (S.shelf || {})[key] | 0);
export const doseStockTotal = () => TONICS.reduce((n, t) => n + doseStock(t.key), 0);
const shelve = (key, n) => { S.shelf[key] = doseStock(key) + n; S.dirty = true; };
// What is standing on a shelf, set outright rather than brewed onto it. Nothing
// in the game calls this -- it is the dev handle behind `__stock`, for looking
// at a stocked shelf without brewing twenty batches first.
export const setStock = (key, n) => {
  if (!tonicOf(key)) return 0;
  S.shelf[key] = Math.max(0, n | 0);
  S.dirty = true;
  return S.shelf[key];
};

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
  // A tonic added after a save was written has no key in the save's maps. The
  // readers already treat a missing key as zero, but the maps are written back
  // out whole, so the keys are stood up here once and every save carries the
  // full recipe book from then on (items 21 and 25).
  S.potency = S.potency || {};
  S.shelf = S.shelf || {};
  S.brewKeys = S.brewKeys || [];
  for (const t of TONICS) {
    if (S.potency[t.key] == null) S.potency[t.key] = 0;
    if (S.shelf[t.key] == null) S.shelf[t.key] = 0;
  }
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

// Where a pot stands, as a box. The drawing wants it and so does the pointer --
// a pot is a control now, not only a picture (item 17: each pot chooses its own
// brew, at the pot) -- and the two must not each work it out for themselves.
export const potBox = i => ({
  x: apothecary.x + APOTH_POT_ROW + i * POT_PITCH,
  y: S.groundY - POT_H,
  w: POT_W,
  h: POT_H
});
// The hut itself, as a box. The plot runs hut, shelves and pots, but the hut is
// the building -- the board opens at it and the site's bar hangs over it -- and
// everything that wants "the building" must mean the same rect.
export const apothHut = () => ({
  x: apothecary.x, y: S.groundY - APOTH_HUT_H,
  w: APOTH_HUT_W, h: APOTH_HUT_H
});

// Which pot a point in the yard is on, or -1. Only pots that have actually been
// stood: the ground where a fifth one would go is bare ground.
export const potAt = (x, y) => {
  if (!S.apothecaryOpen) return -1;
  for (let i = 0; i < S.apothPots; i++) {
    const b = potBox(i);
    if (x >= b.x && x < b.x + b.w && y >= b.y && y <= b.y + b.h) return i;
  }
  return -1;
};
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
// What one batch of a tonic costs: crop on every recipe -- the green drain the
// whole design wants -- plus the reagent that gives that recipe its identity,
// each recipe its own amounts (`BREW_BILL` in config says why they differ).
//
// The one place the price is read. The pot asks it before it lights, the pot
// pays it out of the same list, and the picker at the pot prints it, so what you
// are shown and what you are charged cannot come apart. It reads as a bill --
// pairs of currency and number -- because that is what every price in this game
// is, and the picker hands it straight to the same marks the boards print.
export const brewCost = key => (BREW_BILL[key] || []).map(line => [...line]);

// What is in the pile of a given coin. `purse` in upgrades.js is this, but this
// module cannot see upgrades.js at load (the ring runs upgrades -> works ->
// apothecary), and a brew has to know before it lights whether it can pay.
const held = money =>
  money === 'shard' ? S.shards :
  money === 'spore' ? S.spores :
  money === 'core' ? S.cores :
  money === 'spark' ? S.sparks : S.stored;

// Also the picker's question: a brew the purse cannot cover is off the pot's
// list, so the menu shows what can be lit and nothing else.
export const canAffordBrew = key =>
  brewCost(key).length > 0 && brewCost(key).every(([money, n]) => held(money) >= n);

function spendBrew(key) {
  // Taken through `take` so the grains are lifted out of the pile the way every
  // price in the game is paid.
  for (const [money, n] of brewCost(key)) take(money, n);
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
// Turning a pot mid-batch cannot un-buy the batch on it -- the crop is spent and
// the fire is lit -- so the pot goes on cooking what it was lit for and the new
// setting takes over at the next lighting. Clearing the setting outright is the
// same: the batch you paid for still lands.
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
// Full strength for the dose's whole life. It used to thin as the dose wore
// off, and that made the plume a timer you read at a glance -- which is not
// its job: the buff is either on you or it is not, and a wisp reading as
// "nearly out" had people standing at the pot waiting instead of working.
export function stepDoseMotes(dt) {
  for (const w of S.workers) {
    if (!doseLive(w)) { w.moteAt = 0; continue; }
    // Nothing to see through a wall, or off a body in the air. Read off the
    // body's own fields rather than by asking the lab and the house, which
    // would be this module importing half the yard to draw a mote.
    if (w.inside || w.aloft || w.lifted || w.falling) continue;
    const at = now();
    if (at < (w.moteAt || 0)) continue;
    w.moteAt = at + DOSE_MOTE_MS;
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
    if (!body) continue;                         // no keeper

    if (S.brewAt[i] === 0) {                     // lighting a fresh batch
      const key = potTonicOf(i);
      if (!key) continue;                        // this pot is off
      // A one-off that has already put its batch up does not start another. Its
      // doses are still on the shelf to be dealt; once they are gone it idles.
      if (!S.potKeep && potSpentOf(i)) continue;
      if (body.goal !== 'in') continue;          // the keeper lights it, stood at the pot...
      if (!canAffordBrew(key)) continue;         // ...and only if there is crop to start on
      spendBrew(key);
      // The batch is now this tonic's, whatever the pot is turned to next. What
      // was paid for is what comes off the fire.
      S.brewKeys[i] = key;
    }
    // Once lit, the batch brews on its own -- the keeper is free to walk doses
    // out and deal them, and the clock does not pause for its absence. It comes
    // back between rounds, which is when the next batch is lit.
    S.brewAt[i] += dt;
    if (S.brewAt[i] >= brewMs()) {
      S.brewAt[i] = 0;
      // Onto the shelf for what it IS, not for the pot that made it: turn this
      // pot to another tonic tomorrow and today's batch is still standing there.
      shelve(brewKeyOf(i), dosesPer());
      S.brewKeys[i] = null;
      S.brews++;                                 // and the craft is one batch deeper
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
// The same setting, chosen off a list rather than stepped onto -- the picker at
// the pot. A pick says which one it wants, so unlike `setPotTonic` it does not
// toggle back off when you pick the one already set; picking `null` is how the
// picker turns a pot off, and it says so with a row of its own. Same split as
// `setPrefer` and `choosePrefer` below.
export function choosePotTonic(i, key) {
  S.potTonics[i] = key || null;
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
// The rungs, and nothing about what any one pot is brewing. Setting a pot's brew
// is done at the pot now (see potpick.js): the board is where you read the
// building's figures and buy its ladders, and a menu of twelve rows saying the
// same three things four times over was the board doing a job the yard does
// better. Reading and setting are different errands and this is the reading one.

// A ladder on the building, in bands like every ladder in the yard (CLAUDE.md,
// "Decided"): dust for the first card, dust and crops for the second, dust,
// crops and ore for the third. `after` is batches landed before the ladder
// shows at all: the deeper rows of the craft reveal themselves as the craft is
// practiced, rather than the whole board arriving priced and clickable on the
// frame the door opens. A first rung at the door's own price (900 dust), not a
// fortieth of it: a board you can clear on the frame it opens is a list, not a
// set of choices (docs/critics-2026-09-10.md, B9).
const brewLadder = ({ after = 0, ...o }) => tierRows({
  ...o,
  first: BREW_RUNG_DUST,
  site: 'apothecary',
  show: () => S.apothecaryOpen && S.brews >= after
});

// The per-tonic potency ladders (item 14). One ladder a tonic, all in the hut's
// own section: what you are buying is a deeper version of one recipe, which is a
// fact about the craft rather than about any one pot. The cards are named for
// the drink, with a numeral, so five ladders showing one card each still read
// as five tonics.
//
// What each tonic's number is a number *of*, in the yard's own words: "stew 25
// -> 32%" says nothing about what the drinker does more of.
const DOES = { work: 'work', crit: 'crit', carry: 'carry', pace: 'walk', spark: 'sparks' };
const potencyRows = t => brewLadder({
  level: () => potencyLevel(t.key),
  climb: () => { S.potency[t.key] = potencyLevel(t.key) + 1; },
  // The bracing tonic adds points of crit chance, which is a percentage like
  // the rest of them once the verb says "crit"; it used to carry "crit" as its
  // unit, which with the verb in front read "crit 8 -> 10 crit".
  unit: '%',
  does: DOES[t.kind],
  value: lvl => Math.round(t.base * strengthOf(t.key, lvl) * 100),
  // No potency card at all until a first batch has landed (the grind pass):
  // the deeper craft is earned by brewing.
  after: 1,
  bands: named(`potency-${t.key}`, t.name).map(card => ({
    ...card,
    // A shard recipe the player cannot brew yet is a recipe worth no rung
    // either (item 24) -- the cards hide with the picker entry until the quarry
    // opens.
    gate: () => tonicShown(t)
  }))
});

export const APOTHECARY_UPGRADES = [
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
    name: 'give tonics to',
    value: () => PREFER_LABEL[S.potPrefer] || 'whoever is nearest',
    // Seven stations to walk past two buttons at a time; a list you pick from is
    // the whole reason this control exists. "Nobody in particular" is the first
    // of them rather than a step off either end.
    options: () => [{ key: '', label: 'whoever is nearest' },
                    ...preferable().map(j => ({ key: j, label: PREFER_LABEL[j] }))],
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
    // A second pot is for a craft with batches behind it -- the same earned
    // reveal the deeper rungs use (`after` on brewLadder).
    show: () => S.apothecaryOpen && S.brews >= 5 && S.apothPots < APOTH_POTS_MAX
  },

  ...brewLadder({ field: 'lengthLevel', unit: 's', does: 'lasts', after: 3,
    value: lvl => Math.round(buffMs(lvl) / 1000),
    bands: named('bufflength', 'brew concentration') }),
  ...brewLadder({ field: 'dosesLevel', unit: 'doses', after: 3,
    value: lvl => dosesPer(lvl),
    // Two cards, not three: a dose a rung and one to seven is six rungs.
    bands: named('brewdoses', 'batch size', DOSES_CARDS) }),
  ...TONICS.flatMap(potencyRows)
];

// Three sections, all of them the building's: how it is run, how well it runs,
// and how deep each recipe goes.
export const APOTHECARY_SECTIONS = [
  { title: 'the pot', keys: ['potkeep', 'potprefer', 'anotherpot'] },
  { title: 'brewing', keys: [...cards('bufflength'), ...cards('brewdoses')] },
  { title: 'potency', keys: TONICS.flatMap(t => cards(`potency-${t.key}`)) }
];

// The jobs a dose can favor, in the order the dial walks them. Null (whoever is
// nearest) is the step before the first and after the last.
const PREFER_JOBS = [JOB.ROCK, JOB.QUARRY, JOB.FARM, JOB.PURIFY, JOB.HAUL, JOB.WIZARD];
// The jobs the dial actually offers right now: only those some tonic a pot is
// SET to can land on (item 22). A dial listing "haulers" while every pot is on
// stew would be offering a preference no dose can honor. With no pot set, the
// whole list stands -- the dial then reads as what the building could do.
function preferable() {
  const set = (S.potTonics || []).map(tonicOf).filter(Boolean);
  if (!set.length) return PREFER_JOBS;
  return PREFER_JOBS.filter(j => set.some(t => t.jobs.includes(j)));
}
// Said the way every other board says a job -- see `jobSaid` in kit.js. This was
// a second table of the same words, which is how the haulers ended up as "the
// crew" here and "haulers" everywhere else, on a board where "the crew" also
// means the whole settlement.
const PREFER_LABEL = Object.fromEntries(PREFER_JOBS.map(j => [j, jobSaid(j)]));
function stepPrefer(d) {
  const list = preferable();                 // the buttons walk what the picker offers
  const at = list.indexOf(S.potPrefer);
  const next = at + d;
  return next < 0 || next >= list.length ? null : list[next];
}

// What it costs to put the place up: a core, and dust a small early yard can
// find -- the farm's own shape, because it stands right after the farm.
export const apothecaryCost = () => APOTHECARY_DUST;
export const apothecaryCores = () => APOTHECARY_CORES;

// The building brews rather than buys: the brew clock is stepped here, not by
// `stepWorks`, because a brew is an upkeep and not a one-shot build. Which is
// why the site claims no `room` of its own -- brews never enter the works list,
// so `room` would only widen how many *upgrades* can be built at once. It was
// one per pot for a while, meant as "one stirrer to a pot", and what it
// actually bought was four rungs climbing in parallel at a station every other
// board works one at a time. The default room of one is the rule everywhere
// but the lab, and the lab pays for its second bench.
registerRows(APOTHECARY_UPGRADES);
