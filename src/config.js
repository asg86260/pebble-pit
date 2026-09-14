// Every number that decides how the game looks and plays, and nothing that
// changes while it runs. If you are tuning the game, it is all in here.
//
// "In here" is now a directory rather than a file. The numbers live in
// `src/config/`, one file per thing they tune, and this file is the door: it
// re-exports all of them, so `import { P } from './config.js'` still reaches
// every one and nothing outside had to be touched to split them up.
//
// `export *` re-exports the *binding*, not a copy, so the handful of `export
// let` dials below still move the running game the moment the dev panel writes
// them. Never restate one here as a `const` -- that would freeze it at boot and
// the slider would go quietly dead.
//
// The grouping, in the order they are strung together below: the yard's own
// measurements, the opening, the sky and what fouls it, the scrubbing house,
// the buildings' boxes, what the yard is bought with, the balloon, the tower,
// the casino, the kit, where the sites stand, the pit, the rift, how a cell
// is drawn, dust in flight, the crew, the rock and the dance between rocks, the
// quarry, the machines, the farm, the lab, the weather, the air, the crew's
// houses, the walk to work, the piles, building a thing, crits, and the
// apothecary.

export * from './config/yard.js';
export * from './config/intro.js';
export * from './config/sky.js';
export * from './config/scrub.js';
export * from './config/buildings.js';
export * from './config/unlocks.js';
export * from './config/notices.js';
export * from './config/balloon.js';
export * from './config/tower.js';
export * from './config/casino.js';
export * from './config/kit.js';
export * from './config/sites.js';
export * from './config/pit.js';
export * from './config/rift.js';
export * from './config/cutscene.js';
export * from './config/view.js';
export * from './config/dust.js';
export * from './config/crew.js';
export * from './config/tiers.js';
export * from './config/rocks.js';
export * from './config/quarry.js';
export * from './config/machines.js';
export * from './config/farm.js';
export * from './config/lab.js';
export * from './config/weather.js';
export * from './config/air.js';
export * from './config/house.js';
export * from './config/travel.js';
export * from './config/piles.js';
export * from './config/build.js';
export * from './config/crits.js';
export * from './config/apothecary.js';
// Track F3 (wave5): the pips under a row's name, and the books over the pit.
export * from './config/boards.js';
// F4: the rift's pull and look, a crit landing, and the dance.
export * from './config/effects.js';

// --- turning the knobs ------------------------------------------------------
// One dial, one row, one home.
//
// A handful of these numbers are `let` rather than `const` so a dev panel can
// move them while the game is running. Modules import the binding, not a copy,
// so a change here is a change everywhere the moment it is made -- which is the
// whole point: the way to find a good number is to sit with the game and push it
// about. That is why the `let`s stay exactly where they are, up in the tracks
// they belong to, next to the comments that explain them.
//
// What used to be spread out was everything *else* about a dial. A knob was four
// facts kept in four places -- the `export let` itself, a row in the panel's
// list, a case in the getter's switch, and a case in the setter's switch -- and
// a new one had to be added to all four or it went half-missing, with nothing
// said about it. DEVICE_PIXELS is what that cost looked like: it was in the list
// and in neither switch, so the panel drew it a slider that read nothing and
// wrote its value into a pile limit that did not exist. A dial the panel shows
// and the game does not hear is not a dial, it is a picture of one.
//
// So: one row per knob, holding everything anybody asks about one -- what it is
// called, what it is called *on screen*, how far it goes and in what steps, and
// the one pair of lines that reads and writes the binding. The pair is the
// irreducible cost of a live binding: nothing but an assignment in the file that
// declares a `let` can move it -- an imported one is read-only. So the row is
// written beside the binding, in that file's own `KNOBS`, and this file only
// strings the lists together in the order the panel shows them.
//
// Nothing outside a knob's own file writes them. `tune` is the only door in, it
// will not open on a key that has no row, and the panel builds itself out of
// TUNABLE rather than knowing any of them by name.
//
//   key     the name, for the panel's own bookkeeping and for `__tune`
//   label   what the panel calls it
//   min     the ends of the slider, and how far one nudge of it moves
//   max
//   step
//   layout  the yard has to be measured again after this one moves
//   get     read the binding
//   set     write it -- and anything else that has to happen when it moves
import { YARD_KNOBS } from './config/yard.js';
import { VIEW_KNOBS } from './config/view.js';
import { PIT_KNOBS } from './config/pit.js';
import { DUST_KNOBS } from './config/dust.js';
import { AIR_KNOBS } from './config/air.js';
import { SKY_KNOBS } from './config/sky.js';
import { SCRUB_KNOBS } from './config/scrub.js';
import { CREW_KNOBS } from './config/crew.js';
import { KIT_KNOBS } from './config/kit.js';
import { QUARRY_KNOBS } from './config/quarry.js';
import { MACHINE_KNOBS } from './config/machines.js';
import { FARM_KNOBS } from './config/farm.js';
import { WEATHER_KNOBS } from './config/weather.js';

import { ROCK_KNOBS } from './config/rocks.js';
import { EFFECT_KNOBS } from './config/effects.js';   // F4
import { RIFT_KNOBS } from './config/rift.js';
import { NOTICE_KNOBS } from './config/notices.js';
import { SOUND_KNOBS } from './config/sound.js';

export const TUNABLE = [
  ...YARD_KNOBS, ...VIEW_KNOBS, ...PIT_KNOBS, ...DUST_KNOBS, ...AIR_KNOBS,
  ...SKY_KNOBS, ...SCRUB_KNOBS, ...CREW_KNOBS, ...KIT_KNOBS, ...QUARRY_KNOBS,
  ...MACHINE_KNOBS, ...FARM_KNOBS, ...WEATHER_KNOBS,
  ...ROCK_KNOBS, ...EFFECT_KNOBS, ...RIFT_KNOBS, ...SOUND_KNOBS
];

// The rows, by key. Asking for a knob that has no row is worth hearing about:
// it used to come back `undefined`, and setting one wrote the value into a pile
// limit nobody had named.
const KNOB = new Map(TUNABLE.map(t => [t.key, t]));
const knob = key => {
  const t = KNOB.get(key);
  if (!t) throw new Error(`no such knob: ${key}`);
  return t;
};

export const tuned = key => knob(key).get();

export function tune(key, v) {
  const t = knob(key);
  t.set(v);
  return t.get();
}

// wave7-ui: the pulsing offer aura around a station with something affordable.
export * from './config/aura.js';

// the five shields, and the shape a rock is in while it is arriving
export * from './config/shields.js';

// wave-desk-sound, track B: the sound of the yard -- every SND_ number.
export * from './config/sound.js';
