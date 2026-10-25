// Which part of the frame reads and writes which fact (docs/wave-tests.md,
// step 4): every scene in src/scenes.js stood and run, each frame step
// (`STEPS` in game.js) wrapped, and every field of `S` behind a getter and a
// setter that note the step on the frame. A field mutated in place (a body
// pushed, a count bumped inside an object) is caught by comparing the fields a
// step reads, before and after it runs, on every SAMPLE-th frame: on that frame
// every step is compared, so a field's print after one step is the next one's
// before, and each field is printed once a step at most.
//
//   node tools/node/systems-trace.mjs            # writes test/systems.json
//   node tools/node/systems-trace.mjs scene,...  # only those scenes, printed
//
// A system needs every system that writes a field it reads: that is the graph
// test/sim.mjs closes over to step one part of the game alone, and
// test/systems.test.mjs holds the committed graph to the code.

import { writeFileSync } from 'node:fs';
import { newYard } from './yard.mjs';

const yard = await newYard();
const { STEPS } = await import('../../src/game.js');
const { S } = await import('../../src/state.js');
const { SCENES } = await import('../../src/scenes.js');

const SAMPLE = 120;
const reads = {}, writes = {};
const note = (book, step, key) => (book[step] ||= new Set()).add(key);
let cur = null, frame = 0, seen = -1;
const prints = new Map();   // a field's print as the last step on this frame left it

// Every field behind an accessor: the object is the same object, so nothing
// that holds `S` notices.
const backing = {};
for (const key of Object.keys(S)) {
  backing[key] = S[key];
  Object.defineProperty(S, key, {
    get() { if (cur) note(reads, cur, key); return backing[key]; },
    set(v) { if (cur) note(writes, cur, key); backing[key] = v; prints.delete(key); },
    enumerable: true, configurable: true
  });
}

const typed = v => ArrayBuffer.isView(v) ? Array.from(v) : v;
const print = key => { try { return JSON.stringify(backing[key], (k, v) => typed(v)); } catch { return String(Math.random()); } };
for (const s of STEPS) {
  const run = s.step;
  s.step = c => {
    if (s === STEPS[0]) frame++;   // a frame is a frame, whoever turns the clock (a scene's own fast-forward too)
    const sampled = frame % SAMPLE === 0;
    if (sampled && seen !== frame) { seen = frame; prints.clear(); }
    const look = sampled ? [...(reads[s.name] || [])] : [];
    const before = look.map(key => prints.get(key) ?? print(key));
    cur = s.name;
    try { run(c); } finally { cur = null; }
    look.forEach((key, i) => { const now = print(key); prints.set(key, now); if (now !== before[i]) note(writes, s.name, key); });
  };
}
const { step } = await import('../../src/game.js');
const hooks = await import('../../src/hooks.js');
const go = seconds => hooks.fast(seconds);

const only = process.argv[2]?.split(',');
const names = Object.keys(SCENES).filter(k => !SCENES[k].page && (!only || only.includes(k)));
window.__board = () => {};
let stood = 0;
for (const name of names) {
  try { SCENES[name].run(); go(2); stood++; }
  catch (e) { console.error(`${name}: ${e.message.split('\n')[0]}`); }
}

const graph = STEPS.map(({ name }) => ({
  name,
  reads: [...(reads[name] || [])].sort(),
  writes: [...(writes[name] || [])].sort()
}));
const writers = key => graph.filter(g => g.writes.includes(key)).map(g => g.name);
for (const g of graph) g.needs = [...new Set(g.reads.flatMap(writers))].filter(n => n !== g.name).sort();

if (only) console.log(JSON.stringify(graph.filter(g => g.reads.length || g.writes.length), null, 1));
else {
  writeFileSync('test/systems.json', JSON.stringify({ scenes: stood, systems: graph }, null, 1) + '\n');
  console.log(`test/systems.json: ${graph.length} systems over ${stood} scenes`);
}
void yard; void step;
