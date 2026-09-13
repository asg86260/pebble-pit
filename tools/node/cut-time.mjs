// How long a cut takes to dig out, in game seconds, on a seeded yard:
//
//   node tools/node/cut-time.mjs [quarriers] [pace rung] [seed]
//
// The number the pocket dig has to hold (DESIGN.md, "The cut is worked in
// pockets"): a swing that takes more ground on a slower beat is meant to
// finish the same cut in the same time, and this is where that is measured,
// before and after, on one seed. The clock starts on the first cell out and
// stops on the last, so the walk in from the door is not in it.
import { newYard } from './yard.mjs';
const yard = await newYard();
const S = yard.S;
const { cellsLeft } = await import("../../src/quarry.js");
const now = () => yard.clock.now();
const n = +process.argv[2] || 1, lvl = +process.argv[3] || 0, seed = +process.argv[4] || 20250830;
window.__seed(seed); window.__crew(0, 0, n, 0); window.__fullSites(); window.__tip(90000);
if (lvl) window.__levels({ quarryPaceLevel: lvl });
// Any knob, for tuning without an edit: KNOBS="CUT_BEAT_MS=1500,CUT_POCKET=2"
for (const kv of (process.env.KNOBS || "").split(",").filter(Boolean)) { const [k, v] = kv.split("="); window.__tune(k, +v); }
yard.until(() => (S.quarryTotal || 0) > 0, 120);
const t1 = now();
const total = S.quarryTotal + cellsLeft();
yard.until(() => S.quarryTotal >= total, 900);
console.log(JSON.stringify({ quarriers: n, rung: lvl, seed, cells: S.quarryTotal, digSeconds: +((now() - t1) / 1000).toFixed(1) }));
