// The yard's sound set, by lanes (DESIGN.md): recorded takes beside the
// recipes, rows heard on screen only, and rows thinned under their class.
//
// Neither tier can hear, so these hold what a listen cannot: that every take
// the table names is a file that ships, that every event the game asks for
// has a row (an event with none is silent forever and nobody notices -- the
// dome's burst was), and that the two density knobs do what they say on the
// decision half.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { group, ok, run, runUntil } from './helpers.mjs';
import { sfx, wakeAudio, muteAudio, audioDecisions } from '../src/audio.js';
import { S } from '../src/state.js';
import { SOUNDS, RECIPES, SND_FOLD_MS } from '../src/config/sound.js';

const snap = () => JSON.parse(JSON.stringify(audioDecisions()));

group('every take the table names is a file in public/sfx', async () => {
  const missing = [];
  for (const [event, row] of Object.entries(SOUNDS)) {
    const r = row.recipe;
    if (typeof r === 'string') { if (!RECIPES[r]) missing.push(`${event}: no recipe ${r}`); continue; }
    if (!r?.sample) continue;
    for (const f of r.sample) if (!existsSync(join('public', 'sfx', f))) missing.push(`${event}: ${f}`);
    if (!(r.seconds > 0)) missing.push(`${event}: no seconds`);
  }
  return [ok(missing.length === 0, 'every named take and recipe exists', missing.join(', '))];
});

group('every event the game asks for has a row in the table', async () => {
  const files = [];
  const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && files.push(p); } };
  walk('src');
  const asked = new Set();
  // the calls in code, not the ones a comment shows as an example
  const code = f => readFileSync(f, 'utf8').split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  for (const f of files) for (const m of code(f).matchAll(/\bsfx\(\s*'([a-z0-9-]+)'/g)) asked.add(m[1]);
  const missing = [...asked].filter(e => !SOUNDS[e]);
  return [ok(asked.size > 20, 'the scan found the calls', `${asked.size}`),
          ok(missing.length === 0, 'none of them is missing from SOUNDS', missing.join(', '))];
});

group('an on-screen row is counted off screen, and kept silent there', async () => {
  window.__crew(0);
  wakeAudio();
  muteAudio(false);
  run(2);
  const far = S.camX + (S.viewW || 800) * 4;
  const before = snap();
  sfx('footstep', { x: far });
  runUntil(() => audioDecisions().pending === 0, 1);
  const off = snap();
  sfx('footstep', { x: S.camX + (S.viewW || 800) / 2 });
  runUntil(() => audioDecisions().pending === 0, 1);
  const on = snap();
  return [
    ok(off.byClass.fold - before.byClass.fold === 1, 'the step off screen is still asked for and counted'),
    ok(off.unseen - before.unseen === 1 && off.fired === before.fired, 'and goes no further', `${off.unseen - before.unseen}`),
    ok(on.unseen === off.unseen && on.fired - off.fired === 1, 'a step in view is played', `${on.fired - off.fired}`),
  ];
});

group("a row's own ceiling thins it under its class's", async () => {
  run(2);
  const cap = SOUNDS.footstep.perS;
  const before = snap();
  // a second's worth of steps, one a fold window apart, so none of them folds
  const gap = (SND_FOLD_MS + 5) / 1000;
  for (let t = 0; t < 1; t += gap) { sfx('footstep', { x: null }); run(gap); }
  const after = snap();
  return [
    ok(cap > 0 && cap < 12, 'footsteps carry a ceiling of their own', `${cap}`),
    ok(after.fired - before.fired <= cap, 'no more than it are heard in a second', `${after.fired - before.fired}`),
    ok(after.dropped > before.dropped, 'and the rest are dropped, not deferred'),
  ];
});
