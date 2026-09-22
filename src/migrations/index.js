// Every change to the save's shape since the floor, one file a migration,
// in date order. `migrate` runs each `apply` over the raw save object, in
// order, before `restore()` (persist.js) reads a single field, and stamps the
// save with today's `SAVE_V`; `restore` then reads today's shape and nothing
// else. Nothing below the floor is here: a save with no `build` stamp is not
// read at all (save.js), so a branch for the shape before v0.1.1
// (2026-09-12) has no save left to run on.
//
// The key is `saveV`, not a date: a dev build has no date. A save with no
// `saveV` is "everything before today" and gets every migration in the list.
// A migration carries `v`, the `SAVE_V` it raises the save to, and runs only
// on saves whose `saveV` is below it. So the list is the migrations from
// 2026-09-12 to the day `saveV` was first written, all with `v: 1`, and every
// one written since with `v: 2, 3, ...`, each raising `SAVE_V` (config/saves.js)
// by one as it lands.
//
// Adding one: a file named by its date and its subject, exporting
// `{ since, v, says, apply(s) }`, and a line here in date order.
//
// Archiving one is deleting its file and its line here. A migration may go
// once every save it could apply to is below the floor: when the floor moves
// up to a build that already wrote the new shape, everything dated before
// that build goes.
import { SAVE_V } from '../config/saves.js';
import sparkRung from './2026-09-14-spark-rung.js';
import school from './2026-09-14-school.js';
import beats from './2026-09-15-beats.js';
import threeBrews from './2026-09-15-three-brews.js';
import handful from './2026-09-15-handful.js';
import pour from './2026-09-16-pour.js';
import doneList from './2026-09-17-done-list.js';
import weather from './2026-09-20-weather.js';
import airFilter from './2026-09-22-air-filter.js';

export const MIGRATIONS = [sparkRung, school, beats, threeBrews, handful, pour, doneList, weather, airFilter];

// The raw save, brought up to today's shape in place. Answers with the
// migrations it ran, for a check.
export function migrate(s) {
  const was = Number.isFinite(+s.saveV) ? +s.saveV : 0;
  const ran = [];
  for (const m of MIGRATIONS) {
    if (m.v <= was) continue;
    m.apply(s);
    ran.push(m);
  }
  s.saveV = SAVE_V;
  return ran;
}
