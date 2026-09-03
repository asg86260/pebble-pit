// The apothecary: the pot on the fire, the body stirring it, and the doses it
// deals out to the yard.
//
// The building on the ground and the bodies in it are here; the numbers are in
// config.js and the changing facts on `S`. The one big idea is that this is the
// first thing in the game paid for *continuously* -- you set what the pot is on
// and it brews that again and again while it has crop and a stirrer, and the
// buff is up for as long as both hold. See DESIGN.md, "The apothecary".
//
// The buff is never a flag that flips on everywhere at once. A brewed batch is a
// handful of doses sitting in the pot, and the stirrer walks each one out to a
// body -- the preferred station first -- the way a hauler walks a load. The buff
// lands on a body when the dose reaches it, and not before. So a fresh brew
// spreads across the yard rather than blinking on, and a body whose dose has
// worn off is a body the stirrer comes back to.

import { P, RUNGS, FARM_WALK, APOTH_WALK,
         BREW_CROP, BREW_REAGENT, BREW_MS0, BREW_MS5, BUFF_MS0, BUFF_MS5,
         DOSES0, DOSES5, STRENGTH0, STRENGTH5,
         TONIC_STEW_WORK, TONIC_BRACE_CRIT, TONIC_STRONG_CARRY,
         BREW_RUNG_SPORE, BREW_RUNG_DUST, APOTH_POTS_MAX, POT_COST, POT_RATE,
         APOTHECARY_DUST, APOTHECARY_CORES, WORKER } from './config.js';
import { S, apothecary } from './state.js';
import { now, frames } from './clock.js';
import { walkY } from './world.js';
import { JOB_OF } from './kit.js';
import { rebalance, rungCost } from './upgrades.js';
import { registerRows, registerSite } from './works.js';

// --- the pot's dials, level by level ------------------------------------------
// Each eases straight across the ladder from its level-0 value to the top over
// `RUNGS`, the way the crit ladders do. A save from before this landed reads as
// level nought rather than as some rung nothing agrees with.
const rung = lvl => Math.max(0, Math.min(RUNGS, lvl | 0));
const ease = (a, b, lvl) => a + (b - a) * (rung(lvl) / RUNGS);

// How long one batch takes, how long a dose lasts, and how many doses a batch
// mints -- all read live off the ladders so a rung bought mid-brew is felt on
// the next batch.
export const brewMs = () => ease(BREW_MS0, BREW_MS5, S.brewLevel);
export const buffMs = () => ease(BUFF_MS0, BUFF_MS5, S.lengthLevel);
export const dosesPer = () => Math.round(ease(DOSES0, DOSES5, S.dosesLevel));

// The strength ladder lifts what a level-0 dose is worth up to its top figure,
// and every tonic's own effect rides the same climb -- so one rung deepens the
// whole menu at once. At level 0 it is 1.0 (the tonic's own base); at the top it
// is STRENGTH5/STRENGTH0, which is the +25% stew becoming a +60% one.
export const strengthMult = () => ease(STRENGTH0, STRENGTH5, S.strengthLevel) / STRENGTH0;

// --- the three tonics ---------------------------------------------------------
// A crop base plus one reagent that is never the coin of the station it boosts.
// The stew is the general buff, so its reagent is dust, the shared coin; the two
// targeted tonics take shard, the coin of neither the crew nor the crit they
// lift. Each effect is a lever the game already has.
export const TONICS = [
  { key: 'stew',   name: 'a hearty stew',   reagent: 'dust',  kind: 'work',
    base: TONIC_STEW_WORK,   unit: 'work' },
  { key: 'brace',  name: 'a bracing tonic', reagent: 'shard', kind: 'crit',
    base: TONIC_BRACE_CRIT,  unit: 'crit' },
  { key: 'strong', name: 'a strong brew',   reagent: 'shard', kind: 'carry',
    base: TONIC_STRONG_CARRY, unit: 'carry' }
];
export const tonicOf = key => TONICS.find(t => t.key === key) || null;

// What a tonic is worth right now, at the strength the ladder has climbed to. A
// crit tonic reads in points of chance; the other two in a fraction of the
// action.
export const tonicVal = t => (t ? t.base * strengthMult() : 0);

// A short line for the submenu / the row: what this tonic does and how much,
// spelled at the strength it is worth today.
export function tonicSays(t) {
  if (!t) return '';
  const v = tonicVal(t);
  if (t.kind === 'work')  return `works ${Math.round(v * 100)}% faster`;
  if (t.kind === 'crit')  return `crit chance +${Math.round(v * 100)} points`;
  if (t.kind === 'carry') return `carries ${Math.round(v * 100)}% more`;
  return '';
}

// --- the buff on a body -------------------------------------------------------
// A dealt tonic is a record on the body: which tonic, and when it runs out. It
// is read wherever the body's work happens, and it expires on its own clock --
// nothing sweeps the yard to take it off, the readers simply stop seeing it.
export const doseLive = w => !!(w && w.dose && w.dose.until > now());
export const doseOf = w => (doseLive(w) ? w.dose : null);
export const doseTonic = w => { const d = doseOf(w); return d ? tonicOf(d.tonic) : null; };
export const doseName = w => { const t = doseTonic(w); return t ? t.name : ''; };
export const doseLeftMs = w => { const d = doseOf(w); return d ? Math.max(0, d.until - now()) : 0; };
// How much of the dose is left, 0..1 -- the mark on the body stands in this many
// of its cells, so it fades as the dose wears off.
export const doseFrac = w => { const d = doseOf(w); return d ? Math.min(1, doseLeftMs(w) / buffMs()) : 0; };

// The three readers, each returning the neutral value when the body wears no
// dose of that kind. A body can wear one dose at a time -- a fresh dose refreshes
// the timer rather than stacking (which is why doses and bodies are one ladder,
// not two; see DESIGN.md "Open").
export function workBoost(w) {
  const t = doseTonic(w);
  return t && t.kind === 'work' ? 1 + tonicVal(t) : 1;
}
export function critBoost(w) {
  const t = doseTonic(w);
  return t && t.kind === 'crit' ? tonicVal(t) : 0;
}
export function carryBoost(w) {
  const t = doseTonic(w);
  return t && t.kind === 'carry' ? 1 + tonicVal(t) : 1;
}

// --- the crew of the pot ------------------------------------------------------
export function newStirrer() {
  return { type: 'stirrer', goal: 'to', x: apothecary.x, y: 0 };
}

// The door, and who is through it. `inMix` counts only the bodies actually at a
// pot brewing -- not `S.stirrers`, which counts everybody the building has been
// given, one of whom may be crossing the yard with a dose in hand.
export const apothecaryDoor = () => apothecary.x + apothecary.w * 0.5;
const stirrers = () => S.workers.filter(w => w.type === 'stirrer');
export const atPot = w => w.type === 'stirrer' && w.goal === 'in';
export const inMix = () => S.workers.filter(atPot).length;

// The pot a body tends: the k-th stirrer keeps the k-th pot, so one stirrer is
// always one pot and a second pot is a second body's to keep. A stirrer with no
// pot (more bodies than pots) has nothing to do and idles at the door.
const potOf = w => stirrers().indexOf(w);

// A body worth dealing a dose to: anybody working who is not a stirrer and is
// not already under a live dose. The preferred station is a nudge applied on top
// of this, not a wall.
const buffable = w => w.type !== 'stirrer' && !doseLive(w);

// The body the next dose goes to: the preferred station first, then whoever is
// nearest the pot. A small brew lands where it matters and a big one spills to
// the rest of the yard.
function pickTarget(self) {
  const door = apothecaryDoor();
  let pool = S.workers.filter(w => w !== self && buffable(w));
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
function deal(w, target) {
  target.dose = { tonic: S.potTonic, until: now() + buffMs() };
  w.brewed = (w.brewed || 0) + 1;
  S.dirty = true;
}

// --- one stirrer, one frame ---------------------------------------------------
// A stirrer brews at the pot, then carries doses out one at a time. It only
// counts as brewing while it is through the door (`goal === 'in'`), so the batch
// clock in `stepApothecary` pauses while it is out dealing -- same pot, same
// body, the way the design wants.
export function stepStirrer(w) {
  const idx = potOf(w);

  // At the pot, brewing (the batch clock runs in `stepApothecary`). The moment a
  // dose is ready and a body somewhere wants it, the stirrer picks it up and sets
  // out -- which takes it off the pot, so brewing pauses while it is dealing,
  // same body, same pot.
  if (w.goal === 'in') {
    if (idx >= 0 && idx < S.apothPots && (S.doseHold[idx] || 0) > 0) {
      const target = pickTarget(w);
      if (target) { S.doseHold[idx]--; w.holding = 1; w.dealTo = target; w.goal = 'out'; }
    }
    return;
  }

  // Carrying a dose out to a body. If the target has gone (walked off, taken a
  // dose from another pot) the dose is put back on the pile rather than lost, and
  // the body heads home for the next one.
  if (w.holding) {
    const t = w.dealTo;
    if (!t || !buffable(t) || !S.workers.includes(t)) {
      S.doseHold[idx] = (S.doseHold[idx] || 0) + 1;
      w.holding = 0; w.dealTo = null; w.goal = 'to'; return;
    }
    w.y = walkY(w.x + WORKER / 2);
    const d = t.x - w.x;
    if (Math.abs(d) < WORKER) { deal(w, t); w.holding = 0; w.dealTo = null; w.goal = 'to'; return; }
    w.x += Math.sign(d) * Math.min(APOTH_WALK * frames(), Math.abs(d));
    return;
  }

  // Walking back to the pot (`goal === 'to'`) to brew the next batch or to pick
  // up the next dose. The dose is picked up at the pot, in the `in` branch above,
  // so the round is always: brew, come out with a dose, deal it, walk back.
  w.y = walkY(w.x + WORKER / 2);
  const d = apothecaryDoor() - WORKER / 2 - w.x;
  if (Math.abs(d) < 1) { w.goal = 'in'; return; }
  w.x += Math.sign(d) * Math.min(FARM_WALK * frames(), Math.abs(d));
}

// --- the pot on the boil ------------------------------------------------------
// A batch is worker-milliseconds of stirring, and it only advances while a body
// is at the pot -- an empty pot brews nothing, however long you leave it, which
// is the lab's chimney rule made into a clock. When a batch lands it mints its
// doses onto the pile for the stirrer to deal.
//
// Crop is spent when a batch *begins*, which is what makes "it has crop" the
// thing that gates the brew: a pot with no crop to start on does not start, and
// nothing smokes. A one-off brews a single batch and then idles; a keep-brewing
// pot starts the next batch the moment the last one is minted.
function canAffordBrew() {
  const t = tonicOf(S.potTonic);
  if (!t) return false;
  if (S.spores < BREW_CROP) return false;
  const reagent = t.reagent === 'dust' ? S.stored : t.reagent === 'shard' ? S.shards : S.spores;
  return reagent >= BREW_REAGENT;
}

function spendBrew() {
  const t = tonicOf(S.potTonic);
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

// Whether a pot is mid-batch with a body on it -- the readout the whole building
// has, the way the lab smokes and the scrubbing house breathes. Only true while
// a stirrer is through the door and a batch is actually going.
export const boiling = () =>
  stirrers().some((w, i) => w.goal === 'in' && i < S.apothPots && (S.brewAt[i] || 0) > 0);

export function stepApothecary(dt) {
  if (!S.apothecaryOpen) return;
  const list = stirrers();
  for (let i = 0; i < S.apothPots; i++) {
    if (S.brewAt[i] == null) S.brewAt[i] = 0;
    if (S.doseHold[i] == null) S.doseHold[i] = 0;
    const body = list[i];
    const brewing = body && body.goal === 'in';
    if (!brewing || !S.potTonic) continue;

    // A one-off that has already put its batch up does not start another. Its
    // doses are still on the pile to be dealt; once they are gone the pot idles.
    if (!S.potKeep && S.potSpent) continue;

    if (S.brewAt[i] === 0) {                      // starting a batch
      if (!canAffordBrew()) continue;            // no crop, no boil
      spendBrew();
    }
    S.brewAt[i] += dt;
    if (S.brewAt[i] >= brewMs()) {
      S.brewAt[i] = 0;
      S.doseHold[i] = (S.doseHold[i] || 0) + dosesPer();
      if (!S.potKeep) S.potSpent = true;         // the one-off is spent
      S.dirty = true;
    }
  }
}

// --- setting the pot ----------------------------------------------------------
// The board sets these; kept here so the one place that knows what a fresh
// setting means -- it clears the one-off's spent flag, so the same tonic set
// again brews again -- is the module that owns the pot.
export function setTonic(key) {
  S.potTonic = S.potTonic === key ? null : key;  // the set tonic toggles the pot off
  S.potSpent = false;
  S.dirty = true;
}
export function setKeep(keep) { S.potKeep = keep; S.potSpent = false; S.dirty = true; }
export function setPrefer(job) { S.potPrefer = S.potPrefer === job ? null : job; S.dirty = true; }

// --- what the pot's board sells ----------------------------------------------
// The tonics are a menu you set, not rungs you buy; the ladders below are the
// building's own rungs, all about what a brew is worth. The tonic rows carry a
// `pot` flag so the board can render them as a set-the-pot choice rather than a
// purchase.
const tonicRow = t => ({
  key: `tonic-${t.key}`, pot: true, tonic: t.key,
  name: t.name,
  note: () => `${BREW_CROP} spore + ${BREW_REAGENT} ${t.reagent} a brew -- ${tonicSays(t)}`,
  on: () => S.potTonic === t.key,
  set: () => setTonic(t.key),
  show: () => S.apothecaryOpen
});

// A rung on the pot, priced spore + dust like every tier-two row.
const brewRung = ({ key, name, unit, level, from, to, cap = RUNGS }) => ({
  key, kind: 'rung', site: 'apothecary', name, unit,
  rung: () => S[level],
  from, to,
  bill: () => [['spore', rungCost(BREW_RUNG_SPORE, S[level])],
               ['dust', rungCost(BREW_RUNG_DUST, S[level])]],
  cost: () => rungCost(BREW_RUNG_DUST, S[level]),
  buy: () => { S[level]++; },
  show: () => S.apothecaryOpen && S[level] < cap
});

export const APOTHECARY_UPGRADES = [
  ...TONICS.map(tonicRow),

  // The rhythm: keep at it, or a single batch. A dial, spending nothing.
  {
    key: 'potkeep', dial: true, site: 'apothecary',
    name: 'the pot',
    value: () => (S.potKeep ? 'keep brewing' : 'a one-off'),
    less: () => setKeep(!S.potKeep),
    more: () => setKeep(!S.potKeep),
    lo: () => false, hi: () => false,
    show: () => S.apothecaryOpen
  },

  // Who the round favors. A dial that walks the jobs the doses can land on.
  {
    key: 'potprefer', dial: true, site: 'apothecary',
    name: 'doses favor',
    value: () => PREFER_LABEL[S.potPrefer] || 'whoever is nearest',
    less: () => setPrefer(stepPrefer(-1)),
    more: () => setPrefer(stepPrefer(1)),
    lo: () => false, hi: () => false,
    show: () => S.apothecaryOpen
  },

  brewRung({ key: 'brewspeed', name: 'brew speed', unit: 's', level: 'brewLevel',
    from: () => Math.round(brewMs() / 1000),
    to: () => Math.round(ease(BREW_MS0, BREW_MS5, S.brewLevel + 1) / 1000) }),
  brewRung({ key: 'bufflength', name: 'buff length', unit: 's', level: 'lengthLevel',
    from: () => Math.round(buffMs() / 1000),
    to: () => Math.round(ease(BUFF_MS0, BUFF_MS5, S.lengthLevel + 1) / 1000) }),
  brewRung({ key: 'buffstrength', name: 'buff strength', unit: '%', level: 'strengthLevel',
    from: () => Math.round(ease(STRENGTH0, STRENGTH5, S.strengthLevel) * 100),
    to: () => Math.round(ease(STRENGTH0, STRENGTH5, S.strengthLevel + 1) * 100) }),
  brewRung({ key: 'brewdoses', name: 'doses a brew', unit: 'doses', level: 'dosesLevel',
    from: () => Math.round(ease(DOSES0, DOSES5, S.dosesLevel)),
    to: () => Math.round(ease(DOSES0, DOSES5, S.dosesLevel + 1)) }),

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
  }
];

export const APOTHECARY_SECTIONS = [
  { title: 'the menu', keys: TONICS.map(t => `tonic-${t.key}`) },
  { title: 'the pot', keys: ['potkeep', 'potprefer', 'anotherpot'] },
  { title: 'the ladders', keys: ['brewspeed', 'bufflength', 'buffstrength', 'brewdoses'] }
];

// The jobs a dose can favor, in the order the dial walks them. Null (whoever is
// nearest) is the step before the first and after the last.
const PREFER_JOBS = ['miners', 'quarriers', 'farmhands', 'labbers', 'scrubbers', 'haulers'];
const PREFER_LABEL = { miners: 'miners', quarriers: 'quarriers', farmhands: 'farmhands',
                       labbers: 'labbers', scrubbers: 'scrubbers', haulers: 'the crew' };
function stepPrefer(d) {
  const at = PREFER_JOBS.indexOf(S.potPrefer);
  const next = at + d;
  return next < 0 || next >= PREFER_JOBS.length ? null : PREFER_JOBS[next];
}

// What it costs to put the place up: a core, and dust a small early yard can
// find -- the farm's own shape, because it stands right after the farm.
export const apothecaryCost = () => APOTHECARY_DUST;
export const apothecaryCores = () => APOTHECARY_CORES;

// The building brews rather than buys, so the works machinery knows the pot is
// its own gang's work-site and the rungs belong to it. One stirrer to a pot is
// the room, and the pot's own pace is a body's second a second -- the brew clock
// is stepped here, not by `stepWorks`, because a brew is an upkeep and not a
// one-shot build.
registerSite('apothecary', { room: () => S.apothPots });
registerRows(APOTHECARY_UPGRADES);
