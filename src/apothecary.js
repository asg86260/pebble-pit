// The apothecary: the hut, the bookshelf of stock, the pots on their fires, and
// the doses a stirrer deals out to the yard.
//
// The building and the bodies in it are here; the numbers are in
// config/apothecary.js. The one thing paid for *continuously*: you set what a
// pot is on and it brews that again and again while it has crop and a stirrer
// (DESIGN.md, "The apothecary").
//
// The buff is never a flag that flips on everywhere at once. A batch goes on
// the shelf for its tonic, the stirrer walks the doses out one trip at a
// time, and the buff lands on a body when the dose reaches it.
//
//  * Every pot is its own: its own tonic, batch clock and one-off flag.
//  * Stock is per TONIC, not per pot: turning a pot from stew to brace leaves
//    the stew already brewed standing there to be dealt.
//  * Potency is climbed one tonic at a time; batch speed, dose length, batch
//    size and carry are the building's.

import { LADDER, BREW_BILL, BREW_MS, rungValue, TONIC_STEW_SPEED, TONIC_STRONG_STRENGTH, TONIC_BRACE_CRIT, APOTH_POTS_MAX, POT_COST, POT_RATE, DOSE_CARRY, APOTH_POT_ROW, APOTH_POT_STAND, POT_PITCH, POT_W, POT_H, WORKER, APOTH_HUT_W, APOTH_HUT_H, DOSE_MOTE_MS, DOSE_MOTE_RISE, DOSE_MOTE_LIFE } from './config.js';
import { S, apothecary } from './state.js';
import { posts } from './roster.js';
import { now, frames } from './clock.js';
import { rand } from './rng.js';
import { walkY } from './world.js';
import { climbTo } from './route.js';
import { JOB_OF, jobSaid } from './kit.js';
import { rebalance } from './staffing.js';
import { commutePace } from './levels.js';
import { unitText } from './words.js';
import { registerRows } from './works.js';
import { tierRows, named } from './upgrades/tiers.js';
import { puff } from './puff.js';
import { JOB, TYPE } from './jobs.js';
import { moored } from './balloon.js';

// --- the pot's dials, level by level ------------------------------------------
// Clamped to the ladder, so a save from before a ladder landed reads as level
// nought rather than a rung nothing agrees with.
const rung = lvl => Math.max(0, Math.min(LADDER, lvl | 0));
const ease = (a, b, lvl) => a + (b - a) * (rung(lvl) / LADDER);

// The building's figures, one for every pot in it. Dose length and batch size
// read live off their ladders so a rung bought mid-brew is felt on the next
// batch; the batch clock is fixed (BREW_MS).
export const brewMs = () => BREW_MS;
export const buffMs = (lvl = S.lengthLevel) => rungValue('bufflength', lvl) * 1000;
// Whole doses off its list (config/rungs.js).
export const dosesPer = (lvl = S.dosesLevel) => rungValue('brewdoses', lvl);
// One vial in a stirrer's hands, always -- see DOSE_CARRY.
export const carryDoses = () => DOSE_CARRY;
// --- the three brews ----------------------------------------------------------
// One a coin, each one axis of a body's day, read in its own trade's terms
// (DESIGN.md, "Three brews, one a coin, read per trade"). The brew is WHAT you
// want more of; the favor set under the pot is WHO.
//
// `reagent` names the second line of `BREW_BILL` and is what the menu gates
// on. `color` is the liquid: the shelf, the carried vial, the fire under the
// pot and the plume off a dosed body all read as the same brew by color
// (`tonicColor`, render/crew.js, render/apothecary.js). The bracing tonic is
// red because it is priced in sparks and red is the machines' color.
// `short` is the one word that tells the three apart on a row that already
// says what it is doing ("a stronger strong brew" is a joke).
// `jobs` is who a brew reaches: haulers and purifiers have no crit, so a dose
// of the bracing tonic walked out to them would be a dose for nothing.
// `takesTonic` is a membership test on this list, so who a brew reaches and
// what the picker offers cannot come apart. The stirrer is on none of them.
const EVERY = Object.values(JOB).filter(j => j !== JOB.STIR);
const ROLLERS = EVERY.filter(j => j !== JOB.HAUL && j !== JOB.PURIFY);
export const TONICS = [
  { key: 'stew',   name: 'hearty stew',   reagent: 'spore', kind: 'speed',
    base: TONIC_STEW_SPEED,      unit: 'faster',   color: '#5fb84f', short: 'stew',
    jobs: EVERY },                                                               // green
  { key: 'strong', name: 'strong brew',   reagent: 'shard', kind: 'strength',
    base: TONIC_STRONG_STRENGTH, unit: 'stronger', color: '#4a86c7', short: 'brew',
    jobs: EVERY },                                                               // blue
  { key: 'brace',  name: 'bracing tonic', reagent: 'spark', kind: 'crit',
    base: TONIC_BRACE_CRIT,      unit: 'crit',     color: '#e04848', short: 'tonic',
    jobs: ROLLERS }                                                              // red
];
// A recipe is hidden until its reagent has been seen: a brew priced in a
// currency the player has never met is a row about nothing. Asked by the
// picker and by the potency rows alike.
export const tonicShown = t => !!t && (t.reagent === 'shard' ? !!S.quarryOpen :
                                       t.reagent === 'spark' ? !!S.seenSpark : true);
export const tonicOf = key => TONICS.find(t => t.key === key) || null;

// --- the potency ladders, one to a tonic --------------------------------------
// A rung here deepens ONE brew: which of the three to lean on is the decision.
export const potencyLevel = key => rung((S.potency || {})[key]);
// Off the tonic's own list, written as the percent the row shows; what the
// tonic does with it is `base` times this factor.
const strengthOf = (key, lvl = potencyLevel(key)) => rungValue(`potency-${key}`, lvl) / 100 / tonicOf(key).base;

// What a tonic is worth right now. A crit tonic reads in points of chance;
// the other two in a fraction of the action.
export const tonicVal = t => (t ? t.base * strengthOf(t.key) : 0);

// What a brew does, in the few words a menu row has: the AXIS (faster,
// stronger, crit), not the trade's word for it, because the same dose is a
// quicker swing on one body and quicker legs on the next. Read live off the
// brew's own ladder and the building's dose-length ladder.
export function tonicGain(t) {
  if (!t) return '';
  const v = Math.round(tonicVal(t) * 100);
  const what = t.kind === 'crit' ? `+${v} crit` : `+${v}% ${t.unit}`;
  return `${what}, ${Math.round(buffMs() / 1000)} ${unitText('s')}`;
}

// --- who a tonic is for -------------------------------------------------------
// Asked by the readers below (so an old save's misplaced dose stops counting)
// and by `buffable` (so no stirrer walks one out again).
export const takesTonic = (w, t) =>
  !!t && t.jobs.includes(JOB_OF[w.type]);

// --- the buffs on a body ------------------------------------------------------
// A body carries a LIST of dealt tonics: one of each KIND at most, each on its
// own clock. A second stew refreshes the stew it has; a stew on top of a brace
// is both. Nothing sweeps the yard to take a spent one off; the readers stop
// seeing it, and `stepDoses` clears the husks so the list cannot grow forever.
const liveOf = w => (w && w.doses ? w.doses.filter(d => d.until > now()) : []);
export const doses = liveOf;
export const doseLive = w => liveOf(w).length > 0;
// The live dose of one KIND: what the readers ask for, and what `deal`
// refreshes rather than piles on to.
const kindOf = (w, kind) => liveOf(w).find(d => {
  const t = tonicOf(d.tonic);
  return t && t.kind === kind && takesTonic(w, t);
});
export const doseTonics = w => liveOf(w).map(d => tonicOf(d.tonic)).filter(Boolean);
// For the vial on the shelf and in a stirrer's hands; a body may be under
// several, so the plume asks `doseTonics` instead.
export const tonicColor = key => { const t = tonicOf(key); return t ? t.color : '#fff'; };
// The longest-lasting one's time to run, for the card.
export const doseLeftMs = w =>
  liveOf(w).reduce((most, d) => Math.max(most, d.until - now()), 0);

// The three readers, each returning the neutral value when the body wears no
// dose of that kind. The TRADE decides what each multiplies, through the same
// reader at every call site: speed divides a clock (`rockhandMs`, `beatMs`,
// tending and cut, `haulSpeed`, `wizMs`, the purifier's pull); strength
// multiplies what one go makes (the bite, the shard a beat, the crop a cut,
// `load`, `wizBite`, the motes drawn); crit adds points to whoever rolls.
export function speedBoost(w) {
  const d = kindOf(w, 'speed');
  return d ? 1 + tonicVal(tonicOf(d.tonic)) : 1;
}
export function strengthBoost(w) {
  const d = kindOf(w, 'strength');
  return d ? 1 + tonicVal(tonicOf(d.tonic)) : 1;
}
export function critBoost(w) {
  const d = kindOf(w, 'crit');
  return d ? tonicVal(tonicOf(d.tonic)) : 0;
}
// A whole count under the body's strength, rounded UP and only when a dose is
// worn: a quarter more of one grain rounded to nearest is one grain again,
// and a brew bought, walked out and drunk for nothing. The undosed count is
// untouched.
export const stronger = (w, n) => {
  const b = strengthBoost(w);
  return b > 1 ? Math.ceil(n * b) : n;
};

// Take the spent ones off, or a body that works all day carries a list of
// every tonic it has ever been handed.
export function stepDoses() {
  for (const w of S.workers) {
    if (!w.doses || !w.doses.length) continue;
    const live = liveOf(w);
    if (live.length !== w.doses.length) w.doses = live;
  }
}

// --- what each pot is on, and what is on the shelf ----------------------------
// Read through these so an array shorter than the pot count (every save
// written before a pot was bought) reads as "off" and "nothing" rather than
// undefined.
export const potTonicOf = i => (S.potTonics || [])[i] || null;
// What the batch on a pot was lit and PAID for: the price is taken when it
// lights, so turning the pot to another tonic while it cooks must not change
// what comes off it, or a cheap brew buys a dear one. Falls back to the pot's
// setting for a save written before batches carried their own key.
export const brewKeyOf = i => (S.brewKeys || [])[i] || potTonicOf(i);
export const potSpentOf = i => !!(S.potSpents || [])[i];
export const doseStock = key => Math.max(0, (S.shelf || {})[key] | 0);
export const doseStockTotal = () => TONICS.reduce((n, t) => n + doseStock(t.key), 0);
const shelve = (key, n) => { S.shelf[key] = doseStock(key) + n; };
// The dev handle behind `__stock`; nothing in the game calls this.
export const setStock = (key, n) => {
  if (!tonicOf(key)) return 0;
  S.shelf[key] = Math.max(0, n | 0);
  return S.shelf[key];
};

// --- the crew of the pot ------------------------------------------------------
export function newStirrer() {
  return { type: TYPE.STIR, goal: 'to', x: apothecary.x, y: 0 };
}

// Where a stirrer stands to work: at the LEFT of its own pot, the k-th keeper
// at the k-th pot, so three bodies spread along the building rather than
// three drawn on top of each other. `apothecaryDoor` is the first pot's
// stand, where the commute drops a body off. `inMix` counts the bodies at a
// pot, not `S.stirrers`, one of whom may be crossing the yard with a vial.
export const potStandX = i =>
  apothecary.x + APOTH_POT_ROW + Math.max(0, i) * POT_PITCH - APOTH_POT_STAND;
export const apothecaryDoor = () => potStandX(0);

// A pot is a control as well as a picture, and the drawing and the pointer
// must not each work its box out for themselves.
export const potBox = i => ({
  x: apothecary.x + APOTH_POT_ROW + i * POT_PITCH,
  y: S.groundY - POT_H,
  w: POT_W,
  h: POT_H
});
// The hut is the building: the board opens at it and the site's bar hangs
// over it, and everything that wants "the building" must mean the same rect.
export const apothHut = () => ({
  x: apothecary.x, y: S.groundY - APOTH_HUT_H,
  w: APOTH_HUT_W, h: APOTH_HUT_H
});

// Which pot a point in the yard is on, or -1. Only pots that have been stood.
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

// The k-th stirrer keeps the k-th pot. One with no pot (more bodies than
// pots) idles at the door.
const potOf = w => stirrers().indexOf(w);

// A body worth dealing a tonic to: working, not a stirrer, takes that tonic
// at all, and not already under a live dose OF ITS KIND. Not "under
// anything": with tonics that stack, the crew would settle on whichever tonic
// reached them first and the rest of the menu would go nowhere.
const buffable = (w, key) => {
  if (w.type === TYPE.STIR) return false;
  // A balloon's rider is dosed at its post: the craft comes home for the vial
  // (`sentFor` in balloon.js). Not one still climbing in, nor one being
  // brought home off the job.
  if (w.craft != null && (w.goal !== 'aloft' || w.homeward != null)) return false;
  const t = tonicOf(key);
  if (!t || !takesTonic(w, t)) return false;
  return !doses(w).some(d => (tonicOf(d.tonic) || {}).kind === t.kind);
};

// The body the next dose goes to: the pot's favored station first, then
// whoever is nearest the pot. `skip` is who the carrier has already dealt to
// this trip; they are still buffable for a frame, and without it a stirrer
// carrying three would hand all three to one body. The favor is the POT's
// (`potPreferOf`), read off the stirrer's own pot.
function pickTarget(self, key, skip) {
  const door = apothecaryDoor();
  let pool = S.workers.filter(w => w !== self && w !== skip && buffable(w, key));
  if (!pool.length) return null;
  const favor = potPreferOf(potOf(self));
  if (favor) {
    const pref = pool.filter(w => JOB_OF[w.type] === favor);
    if (pref.length) pool = pref;
  }
  return pool.reduce((best, w) =>
    Math.abs(w.x - door) < Math.abs(best.x - door) ? w : best);
}

// Whether a stirrer is on its way to this body with a dose in hand. The
// wizard comes down for its dose (wizard.js reads this). Derived from the
// stirrers rather than flagged on the body: a flag it forgot to clear would
// be a wizard grounded for good.
export const doseComing = w =>
  S.workers.some(s => s.type === TYPE.STIR && s.holding > 0 && s.dealTo === w);

// The buff lands here, when the stirrer arrives, and not before.
function deal(w, target, key) {
  // A tonic of a kind the body already carries refreshes that one rather than
  // being added beside it, so two stews can never both count.
  const t = tonicOf(key);
  const keep = doses(target).filter(d => (tonicOf(d.tonic) || {}).kind !== (t || {}).kind);
  target.doses = [...keep, { tonic: key, until: now() + buffMs() }];
  w.brewed = (w.brewed || 0) + 1;
}

// --- one stirrer, one frame ---------------------------------------------------
// A stirrer keeps one pot: it lights a batch stood at it, carries doses out
// (an armful, dealt one body at a time) while that batch brews on its own,
// and comes back between rounds. The batch clock in `stepApothecary` does
// NOT pause while it is out; that is what frees the body to deal.
export function stepStirrer(w) {
  const idx = potOf(w);

  // At the pot. The moment there is stock of its pot's tonic and a body
  // somewhere wants it, the stirrer takes an armful and sets out.
  if (w.goal === 'in') {
    // Stirring: a lean toward the pot on its own slow rhythm, the same
    // `lunge` a farmhand stoops with.
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

  // Carrying doses out. If the target has gone the round looks for somebody
  // else, and whatever is still in hand goes back on the shelf.
  if (w.holding) {
    const key = w.carryTonic;
    const t = w.dealTo;
    if (!t || !buffable(t, key) || !S.workers.includes(t)) {
      const next = pickTarget(w, key, null);
      if (next) { w.dealTo = next; return; }
      shelve(key, w.holding);
      w.holding = 0; w.dealTo = null; w.goal = 'to'; return;
    }
    // Through the climber, never a bare assignment: a body handed over from
    // anything that held it off the walk line would drop to it in one frame.
    w.y = climbTo(w, walkY(w.x + WORKER / 2));
    const d = t.x - w.x;
    if (Math.abs(d) < WORKER) {
      // A body in the sky is not in reach, whatever its x says: the stirrer
      // stands under it and waits, and the wizard or the balloon is on its way
      // down (`doseComing`). A rider is in reach once its craft is moored.
      const reach = t.craft != null ? moored(t.craft) : !t.aloft;
      if (!reach) { w.face = Math.sign(d) || w.face || 1; return; }
      deal(w, t, key);
      w.holding--;
      // Still loaded: straight on to the next body, without the walk home.
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

  // Walking back to its own pot. A body with no pot of its own stands at the
  // last one rather than out on ground the building does not own.
  w.y = climbTo(w, walkY(w.x + WORKER / 2));
  const mine = Math.min(Math.max(0, idx), Math.max(0, S.apothPots - 1));
  const d = potStandX(mine) - WORKER / 2 - w.x;
  if (Math.abs(d) < 1) { w.goal = 'in'; return; }
  w.face = Math.sign(d) || w.face || 1;
  w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
}

// --- the pots on the boil -----------------------------------------------------
// A batch is lit by the pot's keeper standing at it; an unkept pot brews
// nothing. Once lit it cooks on its own clock. Crop is spent when a batch
// *begins*: a pot with no crop to start on does not start, and nothing
// smokes. A one-off brews a single batch and idles; a keep-brewing pot starts
// the next the moment the last is minted.
//
// The one place the price is read: the pot asks it before it lights, pays out
// of the same list, and the picker prints it, so what you are shown and what
// you are charged cannot come apart.
export const brewCost = key => (BREW_BILL[key] || []).map(line => [...line]);

// `purse` in upgrades.js is this, but this module cannot see upgrades.js at
// load (the ring runs upgrades -> works -> apothecary).
const held = money =>
  money === 'shard' ? S.shards :
  money === 'spore' ? S.spores :
  money === 'core' ? S.cores :
  money === 'spark' ? S.sparks : S.stored;

// Also the picker's question: a brew the purse cannot cover is off the list.
export const canAffordBrew = key =>
  brewCost(key).length > 0 && brewCost(key).every(([money, n]) => held(money) >= n);

function spendBrew(key) {
  // Through `take`, so the grains are lifted out of the pile the way every
  // price in the game is paid.
  for (const [money, n] of brewCost(key)) take(money, n);
}

// `take` is upgrades.js's, but importing it at the top makes a ring
// (upgrades -> works -> apothecary -> upgrades).
let take = () => {};
export const setTake = fn => { take = fn; };

// Whether a pot is mid-batch, for its fire: up while the batch cooks and the
// keeper is off dealing, not only while it stands and stirs.
export const potBoiling = i =>
  i < S.apothPots && i < stirrers().length && (S.brewAt[i] || 0) > 0;
// Turning or clearing a pot mid-batch cannot un-buy the batch on it: it goes
// on cooking what it was lit for and the new setting takes over at the next
// lighting.
export const boiling = () => {
  for (let i = 0; i < S.apothPots; i++) if (potBoiling(i)) return true;
  return false;
};

// How far one pot is through its batch, 0..1; zero when cold, so a bar is
// only up while its own batch is going.
export const brewFracOf = i => {
  if (!potBoiling(i)) return 0;
  return Math.min(1, (S.brewAt[i] || 0) / Math.max(1, brewMs()));
};
// The tonic burning off a dosed body: colored motes let go from the head into
// the *yard* (puff.js), so a walking body leaves a trail and a standing one
// stands in its own column. Full strength for the dose's whole life: a plume
// that thinned read as a timer, and people stood at the pot waiting instead
// of working.
export function stepDoseMotes(dt) {
  for (const w of S.workers) {
    if (!doseLive(w)) { w.moteAt = 0; continue; }
    // Nothing to see through a wall, or off a body in your hand or falling.
    // A body flying is in plain view, and the plume is the one sign the dose
    // is on it. Read off the body's own fields rather than by asking the lab
    // and the house.
    if (w.inside || w.lifted || w.falling) continue;
    const at = now();
    if (at < (w.moteAt || 0)) continue;
    w.moteAt = at + DOSE_MOTE_MS;
    // A body under several tonics gives off one mote of each color, not a
    // blend: an average of green and purple is a color that is neither. Two
    // motes a beat per tonic, or a single-tonic body's column thins to a
    // thread.
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
  if (!S.apothecaryOpen) return;
  const list = stirrers();
  for (let i = 0; i < S.apothPots; i++) {
    if (S.brewAt[i] == null) S.brewAt[i] = 0;
    const body = list[i];
    if (!body) continue;                         // no keeper

    if (S.brewAt[i] === 0) {                     // lighting a fresh batch
      const key = potTonicOf(i);
      if (!key) continue;                        // this pot is off
      // A one-off that has put its batch up does not start another; its doses
      // are still on the shelf to be dealt.
      if (!S.potKeep && potSpentOf(i)) continue;
      if (body.goal !== 'in') continue;          // the keeper lights it, stood at the pot...
      if (!canAffordBrew(key)) continue;         // ...and only if there is crop to start on
      spendBrew(key);
      // The batch is now this tonic's, whatever the pot is turned to next.
      S.brewKeys[i] = key;
    }
    // Once lit, the batch brews on its own; the clock does not pause for the
    // keeper's absence.
    S.brewAt[i] += dt;
    if (S.brewAt[i] >= brewMs()) {
      S.brewAt[i] = 0;
      // Onto the shelf for what it IS, not for the pot that made it.
      shelve(brewKeyOf(i), dosesPer());
      S.brewKeys[i] = null;
      S.brews++;                                 // and the craft is one batch deeper
      if (!S.potKeep) S.potSpents[i] = true;     // this pot's one-off is spent
    }
  }
}

// --- setting the pots ---------------------------------------------------------
// A fresh setting clears that pot's one-off spent flag, so the same tonic set
// again brews again.
export function setPotTonic(i, key) {
  const was = potTonicOf(i);
  S.potTonics[i] = was === key ? null : key;     // the set tonic toggles the pot off
  S.potSpents[i] = false;
}
// The picker at the pot: a pick says which one it wants, so unlike
// `setPotTonic` it does not toggle off on the one already set; `null` is the
// picker's own "nothing" row.
export function choosePotTonic(i, key) {
  S.potTonics[i] = key || null;
  S.potSpents[i] = false;
}
// Every pot's one-off flag is cleared together, because the dial is the
// building's: turning it back to "just this one" means one more batch each.
export function setKeep(keep) { S.potKeep = keep; S.potSpents = []; }
// Who a pot's doses go to first, set at the pot (potpick.js). `null` is
// whoever is nearest.
export const potPreferOf = i => (S.potPrefers || [])[i] || null;
export function choosePotPrefer(i, job) {
  if (!S.potPrefers) S.potPrefers = [];
  S.potPrefers[i] = job || null;
}

// --- what the building's board sells ------------------------------------------
// The rungs, and nothing about what any one pot is brewing: setting a pot's
// brew is done at the pot (potpick.js). Reading and setting are different
// errands and this is the reading one.

// A ladder on the building, in bands like every ladder (CLAUDE.md,
// "Decided"). `after` is batches landed before the ladder shows at all: the
// deeper rows reveal themselves as the craft is practiced, rather than the
// whole board arriving priced and clickable on the frame the door opens.
const brewLadder = ({ after = 0, ...o }) => tierRows({
  ...o,
  site: 'apothecary',
  show: () => S.apothecaryOpen && S.brews >= after
});

// One potency ladder a tonic, all in the hut's own section, named for the
// drink so three ladders showing one card each still read as three brews.
// `does` says what each number is a number *of*.
const DOES = { speed: 'faster', strength: 'stronger', crit: 'crit' };
const potencyRows = t => brewLadder({
  level: () => potencyLevel(t.key),
  climb: () => { S.potency[t.key] = potencyLevel(t.key) + 1; },
  // Points of crit chance are a percentage like the rest once the verb says
  // "crit"; a unit of "crit" read "crit 8 -> 10 crit".
  unit: '%',
  does: DOES[t.kind],
  value: lvl => Math.round(t.base * strengthOf(t.key, lvl) * 100),
  // No potency card until a first batch has landed: the deeper craft is
  // earned by brewing.
  after: 1,
  bands: named(`potency-${t.key}`, t.name).map(card => ({
    ...card,
    // A recipe the player cannot brew yet is worth no rung either: the cards
    // hide with the picker entry.
    gate: () => tonicShown(t)
  }))
});

export const APOTHECARY_UPGRADES = [
  // A dial, spending nothing: keep the fires going, or let them die once this
  // batch is dealt.
  {
    key: 'potkeep', dial: true, site: 'apothecary',
    name: 'keep brewing',
    value: () => (S.potKeep ? 'batch after batch' : 'just this one'),
    // `options` is what makes a dial a select; a dial without it keeps the two
    // buttons, which is what a *number* like the casino's chip wants.
    options: () => [{ key: 'on', label: 'batch after batch' },
                    { key: 'off', label: 'just this one' }],
    at: () => (S.potKeep ? 'on' : 'off'),
    pick: k => setKeep(k === 'on'),
    less: () => setKeep(!S.potKeep),
    more: () => setKeep(!S.potKeep),
    lo: () => false, hi: () => false,
    show: () => S.apothecaryOpen
  },

  // Standing room for one more pot and its stirrer, the farm's "another plot"
  // exactly.
  {
    key: 'anotherpot', kind: 'place', site: 'apothecary',
    name: 'another pot', unit: 'pots',
    from: () => S.apothPots,
    to: () => S.apothPots + 1,
    cost: () => Math.round(POT_COST * Math.pow(POT_RATE, S.apothPots - 1)),
    currency: 'dust',
    buy: () => { S.apothPots++; rebalance(); },
    // A second pot is for a craft with batches behind it, the same earned
    // reveal the deeper rungs use.
    show: () => S.apothecaryOpen && S.brews >= 5 && S.apothPots < APOTH_POTS_MAX
  },

  ...brewLadder({ field: 'lengthLevel', unit: 's', does: 'lasts', after: 3,
    value: lvl => Math.round(buffMs(lvl) / 1000),
    bands: named('bufflength', 'brew concentration') }),
  ...brewLadder({ field: 'dosesLevel', unit: 'doses', after: 3,
    value: lvl => dosesPer(lvl),
    bands: named('brewdoses', 'batch size') }),
  ...TONICS.flatMap(potencyRows)
];

// How it is run, how well it runs, and how deep each recipe goes.
export const APOTHECARY_SECTIONS = [
  { title: 'the pot', keys: ['potkeep', 'anotherpot'] },
  { title: 'brewing', keys: ['bufflength', 'brewdoses'] },
  { title: 'potency', keys: TONICS.map(t => `potency-${t.key}`) }
];

// The jobs a dose can favor, in the picker's order. Null (whoever is nearest)
// is the first row of the list.
const PREFER_JOBS = [JOB.ROCK, JOB.QUARRY, JOB.FARM, JOB.PURIFY, JOB.HAUL, JOB.WIZARD];
// The trades the pot's brew can land on whose station stands in the yard,
// asked through `posts` so the picker and the counters under the buildings
// agree about what exists. A pot set to nothing offers every standing trade.
export function preferableFor(i) {
  const t = tonicOf(potTonicOf(i));
  const standing = new Set(posts().map(p => p.job));
  return PREFER_JOBS.filter(j => standing.has(j) && (!t || t.jobs.includes(j)));
}
// Said the way every other board says a job (`jobSaid` in kit.js); a second
// table of the same words had the haulers as "the crew" here and "haulers"
// everywhere else.
export const preferLabel = job => jobSaid(job);
// How many of a job are under this pot's brew, out of how many there are: the
// "2/3" on the picker's row. The kind, not the exact tonic, since a body under
// any brew of the kind is not waiting for this one (`buffable`).
export function doseCount(i, job) {
  const t = tonicOf(potTonicOf(i));
  const bodies = S.workers.filter(w => JOB_OF[w.type] === job);
  const dosed = t ? bodies.filter(w => doses(w).some(d => (tonicOf(d.tonic) || {}).kind === t.kind)) : [];
  return { dosed: dosed.length, of: bodies.length };
}

// The brew clock is stepped here, not by `stepWorks`, because a brew is an
// upkeep and not a build. So the site claims no `room` of its own: brews never
// enter the works list, and `room` would only let rungs climb in parallel at
// a station every other board works one at a time.
registerRows(APOTHECARY_UPGRADES);
