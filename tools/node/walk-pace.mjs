// What a body actually covers per frame on the way to a job.
//
// The question this answers is "does a builder walk at its own speed, or at
// the crew's" -- and it answers it by measuring travel rather than by reading
// the constant, because the constant was right once before while the walk was
// still wrong (`stepBuilder` asked for the pace it wanted and then handed the
// route a different one).
//
//   node tools/node/walk-pace.mjs

import { newYard } from './yard.mjs';

const yard = await newYard();
const S = yard.S;

// Fastest travel seen over a run: a body crossing open ground is at its pace,
// a body picking its way over the hill is not, so the top speed is the honest
// reading of "how fast does this thing walk".
function paceOf(type, seconds = 25) {
  const last = new Map();
  let best = 0;
  for (let i = 0; i < seconds * 60; i++) {
    yard.fast(1 / 60);
    for (const w of S.workers) {
      if (w.type !== type) continue;
      // Any frame of open-ground travel, whatever the body calls the errand.
      // Filtering on `goal === 'to'` reads zero for a hauler, which does not
      // use that word for a trip -- and a zero here looks exactly like a body
      // that never moved, which is the wrong answer to this question.
      const was = last.get(w);
      if (was != null) best = Math.max(best, Math.abs(w.x - was));
      last.set(w, w.x);
    }
  }
  return best;
}

const show = (label, n) => console.log(`  ${label.padEnd(22)} ${n.toFixed(2)} px/frame`);

console.log('\nbare yard, no gear bought');
window.__reset();
window.__crew(1, 2);
window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
window.__tip(90000);
const haul0 = paceOf('hauler');
window.__shack(false); window.__buy('unlockshack');
const build0 = paceOf('builder');
show('hauler', haul0);
show('builder', build0);
show('difference', Math.abs(haul0 - build0));

console.log('\nsame yard, every pace rung and boot bought');
window.__reset();
window.__crew(1, 2);
window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
window.__tip(90000);
window.__levels({ haulPaceLevel: 5, bootsLevel: 5, haulCarryLevel: 5, harnessLevel: 5 });
const haul1 = paceOf('hauler');
window.__shack(false); window.__buy('unlockshack');
const build1 = paceOf('builder');
show('hauler', haul1);
show('builder', build1);
show('difference', Math.abs(haul1 - build1));

console.log('\nand the gear moves the builder too');
show('builder, no gear', build0);
show('builder, full gear', build1);
console.log('');
