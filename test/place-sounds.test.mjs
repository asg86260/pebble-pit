// The polish bar's sound gate (docs/polish-bar.md, "Automated gates" 3).
//
// Ten game seconds in each act with its bodies walking and working: at least
// one footstep and one work sound raised there, and every name an act calls
// `sfx` with is a row of SOUNDS. A sound is the act's when its place says so
// (`opts.place`, which the place body engine passes) or when the call comes
// from the act's own modules (src/after/, src/hell/), read off the stack.
//
// What it finds is a set of `place:key:item` gaps; KNOWN_GAPS is today's and
// the last group asks that the two are the same set.

import { group, ok, run, yard } from './helpers.mjs';
import { hear } from '../src/audio.js';
import { SOUNDS } from '../src/config.js';
import { SCENES } from '../src/scenes.js';

const S = yard.S;

// Today's gaps. The acts' own work sounds are a later, by-ear task.
export const KNOWN_GAPS = [
  'after:work:none', 'hell:work:none',
  'after:footstep:none', 'hell:footstep:none',
];

// The sounds a station's work makes, as the yard's are named (polish bar §11).
const WORK = new Set(['pick-swing', 'shovel-scrape', 'belt-load', 'build-blow', 'work-land']);

let heardIn = null;
const placeOfCall = (opts) => {
  if (opts && opts.place) return opts.place;
  const st = new Error().stack || '';
  if (/[\\/]src[\\/]after[\\/]/.test(st)) return 'after';
  if (/[\\/]src[\\/]hell[\\/]/.test(st)) return 'hell';
  return null;
};
hear((name, opts) => { if (heardIn) { const v = placeOfCall(opts); if (v) heardIn.push([v, name]); } });

const found = new Set();

function listen(place) {
  heardIn = [];
  run(10);
  const got = heardIn.filter(([v]) => v === place).map(([, n]) => n);
  heardIn = null;
  if (!got.includes('footstep')) found.add(`${place}:footstep:none`);
  if (!got.some(n => WORK.has(n))) found.add(`${place}:work:none`);
  for (const n of new Set(got)) if (!SOUNDS[n]) found.add(`${place}:${n}:row`);
  return got.length;
}

group('act 3: its bodies walking and working are heard', async () => {
  SCENES['after-chain'].run();
  window.__goPlace('after');
  run(1);
  const walking = S.after.bodies.filter(b => b.job).length;
  listen('after');
  window.__view('yard');
  window.__actsOn(null);
  return [ok(walking >= 3, 'the camp has bodies at work', `${walking}`)];
});

group('hell: its bodies walking and working are heard', async () => {
  SCENES['hell-forge'].run();
  window.__goPlace('hell');
  run(1);
  const walking = S.hell.bodies.filter(b => b.job).length;
  listen('hell');
  window.__view('yard');
  window.__actsOn(null);
  return [ok(walking >= 3, 'the landing has bodies at work', `${walking}`)];
});

group('KNOWN_GAPS lists exactly the gaps there are', async () => {
  const stale = KNOWN_GAPS.filter(k => !found.has(k));
  const fresh = [...found].filter(k => !KNOWN_GAPS.includes(k)).sort();
  return [
    ok(stale.length === 0, 'every listed gap is still a gap (take a fixed one off the list)', stale.join(', ')),
    ok(fresh.length === 0, 'every gap is listed', fresh.map(k => `'${k}',`).join(' '))
  ];
});
