// How much a frame costs in a yard built like a thirty-hour one: everything
// bought, a crew in the hundreds, the deep with every slot taken, the
// serpent up.
//
//   node tools/node/late-perf.mjs [seconds] [view]
//
// `view` is `yard` or `deep` -- which half the camera is on, since some of
// the sim only runs for the half in view. The yard is the `late` scene
// (src/scenes.js), which the browser can stand too, so the draw is timed on
// the same yard. Crits roll as they do in play: a late yard's crits keep
// thousands of grains in the air, and the crit-free node yard has hundreds.
// The sim is seeded, so a before/after pair is the same frames both times;
// what is printed is the minimum of ten equal segments, wall and processor
// time, which is the number another agent's load cannot inflate (PERF.md,
// section 0).
// `YARD=file:///.../tools/node/yard.mjs` measures another checkout's game.
const { newYard } = await import(process.env.YARD || './yard.mjs');
const yardUrl = new URL(process.env.YARD || './yard.mjs', import.meta.url);

const seconds = +(process.argv[2] || 20);
const view = process.argv[3] || 'yard';

const yard = await newYard();
const { S } = yard;
const { SCENES } = await import(new URL('../../src/scenes.js', yardUrl));
window.__seed(20250901);
window.__crit(null);                // real rolls, as a player's yard has them (see above)
SCENES.late.run();
window.__view(view);
window.__fast(10);

const frames = seconds * 60, seg = Math.floor(frames / 10);
const mins = [], cpus = [];
let worst = 0;
for (let k = 0; k < 10; k++) {
  const t0 = performance.now(), c0 = process.cpuUsage();
  for (let i = 0; i < seg; i++) {
    const a = performance.now();
    window.__fast(1 / 60);
    worst = Math.max(worst, performance.now() - a);
  }
  mins.push((performance.now() - t0) / seg);
  const c = process.cpuUsage(c0);
  cpus.push((c.user + c.system) / 1000 / seg);
}
console.log(`view ${view}  crew ${S.crew} workers ${S.workers.length}  stations ${S.stations.length}  ` +
            `serpent ${S.serpentStage}  chips ${S.chips.length}`);
console.log(`ms/frame  min ${Math.min(...mins).toFixed(3)}  median ${mins.sort((a, b) => a - b)[5].toFixed(3)}  worst frame ${worst.toFixed(2)}  ` +
            `cpu min ${Math.min(...cpus).toFixed(3)}`);
