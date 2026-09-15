// Every number that decides how the game looks and plays, and nothing that
// changes while it runs. The numbers live in `src/config/`, one file per thing
// they tune; this file is the door and re-exports all of them.
//
// `export *` re-exports the *binding*, not a copy, so the `export let` dials
// still move the running game the moment the dev panel writes them. Never
// restate one here as a `const` -- that would freeze it at boot and the slider
// would go quietly dead.

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
export * from './config/rungs.js';
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
export * from './config/boards.js';
export * from './config/effects.js';

// --- turning the knobs ------------------------------------------------------
// One dial, one row, one home.
//
// A `let` can only be assigned from the file that declares it (an imported one
// is read-only), so each knob's row lives beside its binding in that file's own
// `KNOBS`, and this file only strings the lists together in the order the panel
// shows them. `tune` is the only door in, it will not open on a key that has no
// row, and the panel builds itself out of TUNABLE rather than knowing any of
// them by name.
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
import { EFFECT_KNOBS } from './config/effects.js';
import { RIFT_KNOBS } from './config/rift.js';
import { NOTICE_KNOBS } from './config/notices.js';
import { SOUND_KNOBS } from './config/sound.js';
import { RUNG_KNOBS } from './config/rungs.js';

export const TUNABLE = [
  ...YARD_KNOBS, ...VIEW_KNOBS, ...PIT_KNOBS, ...DUST_KNOBS, ...AIR_KNOBS,
  ...SKY_KNOBS, ...SCRUB_KNOBS, ...CREW_KNOBS, ...KIT_KNOBS, ...QUARRY_KNOBS,
  ...MACHINE_KNOBS, ...FARM_KNOBS, ...WEATHER_KNOBS,
  ...ROCK_KNOBS, ...EFFECT_KNOBS, ...RIFT_KNOBS, ...SOUND_KNOBS, ...RUNG_KNOBS
];

// A knob with no row throws rather than reading `undefined`: setting one
// silently wrote the value somewhere nobody had named.
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

// the pulsing offer aura around a station with something affordable
export * from './config/aura.js';

// the five shields, and the shape a rock is in while it is arriving
export * from './config/shields.js';

// the sound of the yard -- every SND_ number
export * from './config/sound.js';
