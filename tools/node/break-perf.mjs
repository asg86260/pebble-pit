// How much a frame costs under a driven ram, and how much the break spikes.
//
//   node tools/node/break-perf.mjs [seconds] [tune]
//
// The endgame yard: every machine standing, the ram tuned up its endless
// ladder, the belt running, the rift torn. Frames are stepped by hand on the
// node yard, each one timed, and what is printed is the shape of the cost:
// the median frame, the worst frames and what the yard was doing on them, and
// the frames on which a rock landed or broke -- which is where the spike was
// reported. The sim is seeded, so a before/after pair is the same frames both
// times.
// `YARD=file:///.../tools/node/yard.mjs` measures another checkout's game with
// this same scene, which is how a before and an after are the same yard.
const { newYard } = await import(process.env.YARD || './yard.mjs');

const seconds = +(process.argv[2] || 30);
const tune = +(process.argv[3] || 12);

const yard = await newYard();
const { S } = yard;
window.__seed(20250901);
window.__crew(3, 6, 3, 3);
window.__fullSites();
window.__grant({ sparks: 999999, shards: 9999, spores: 9999, dust: 200000 });
window.__levels({ haulCarryLevel: 5, haulPaceLevel: 5, harnessLevel: 5, bootsLevel: 5 });
// `BARE=1` leaves the machines out and `NOTOWER=1` the tower, to bisect a
// spike by what is in the yard.
if (!process.env.BARE) {
  for (const k of ['jaw', 'ram', 'tiller', 'belt']) window.__machine(k, { bought: true });
  const ram = yard.S.machines.ram; ram.tune = tune; ram.driven = true;
  yard.S.machines.belt.tune = tune;
}
if (!process.env.NOTOWER) window.__meteor();          // the tower stands: the rift is summoned from it
window.__give(60000);
// (the grant above has already torn it: what it could not hold went through)
if (!S.riftOpen && !window.__buy('rift')) console.log('the rift could not be summoned; the yard is not the one measured');
for (let i = 0; i < 14; i++) window.__buy('riftrate');
if (!S.riftLevel) console.log('the rift is not widened; the yard is not the one measured');
window.__fast(10);                                   // let everybody get to work

const frames = seconds * 60;
const times = new Float64Array(frames);
const note = new Array(frames);
const landed = [], broke = [];
let wasFall = S.rockFall > 0, wasNo = S.boulderNo;
for (let i = 0; i < frames; i++) {
  const t0 = performance.now();
  window.__fast(1 / 60);
  times[i] = performance.now() - t0;
  const fall = S.rockFall > 0;
  if (wasFall && !fall) landed.push(i);
  if (S.boulderNo !== wasNo) broke.push(i);
  wasFall = fall; wasNo = S.boulderNo;
  note[i] = `chips ${S.chips.length} belt ${S.belt.length} fall ${Math.round(S.rockFall)} ` +
            `rock ${S.boulderNo} full ${S.pileFull.rock ? 'y' : 'n'} gulped ${S.gulped.length}`;
}
const order = Array.from(times.keys()).sort((a, b) => times[b] - times[a]);
const sorted = order.map(i => times[i]);
const q = p => sorted[Math.floor((1 - p) * (sorted.length - 1))].toFixed(2);
const at = list => list.map(i => `${i}:${times[i].toFixed(1)}`).join(' ');
console.log(`frames ${frames}  median ${q(0.5)}  p90 ${q(0.9)}  p99 ${q(0.99)}  max ${q(1)} ms`);
console.log(`rocks ${wasNo - 1}  rift ${S.rift}  stored ${S.stored}`);
console.log(`landed (frame:ms)  ${at(landed)}`);
console.log(`broke  (frame:ms)  ${at(broke)}`);
console.log('worst ten:');
for (const i of order.slice(0, 10)) console.log(`  ${i}: ${times[i].toFixed(2)} ms  ${note[i]}`);
