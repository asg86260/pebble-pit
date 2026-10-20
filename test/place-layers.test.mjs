// The polish bar's painting-order gate (docs/polish-bar.md, "Automated gates"
// 5), read off render.js's LAYERS with nothing drawn:
//
//   - the pile marks, the work bars and the done marks are drawn in every
//     place, as one layer each;
//   - the layer an act's bodies are drawn in carries `dim`, so the corner's
//     crew switch fades or hides them as it does the yard's, and a sight
//     layer stands in the place for the right button's veil and rings;
//   - `mapOf` hands each place a dark-page map of its own.
//
// What it finds is a set of `place:key:item` gaps; KNOWN_GAPS is today's and
// the last group asks that the two are the same set.

import { group, ok } from './helpers.mjs';
import { LAYERS, mapOf } from '../src/render.js';

export const KNOWN_GAPS = [
  'after:pile marks:in', 'after:work bars:in', 'after:done marks:in', 'after:bodies:dim', 'after:sight:layer',
  'hell:pile marks:in', 'hell:work bars:in', 'hell:done marks:in', 'hell:bodies:layer', 'hell:sight:layer', 'hell:map:own',
];

const PLACES = ['yard', 'deep', 'after', 'hell'];
const ACTS = ['after', 'hell'];
// The layer each act's own bodies are drawn in.
const BODIES = { after: 'after members', hell: 'hell ghosts' };
const inPlace = (l, place) => (l.in || 'yard') === place || (Array.isArray(l.in) && l.in.includes(place));
const found = new Set();

group('the marks over the stations are drawn in every place', async () => {
  for (const name of ['pile marks', 'work bars', 'done marks']) {
    const layer = LAYERS.find(l => l.name === name);
    for (const place of PLACES) if (!layer || !inPlace(layer, place)) found.add(`${place}:${name}:in`);
  }
  return [ok(true, 'read')];
});

group("an act's bodies answer the crew switch and the right button", async () => {
  for (const place of ACTS) {
    const layer = LAYERS.find(l => l.name === BODIES[place]);
    if (!layer || !inPlace(layer, place)) found.add(`${place}:bodies:layer`);
    else if (!layer.dim) found.add(`${place}:bodies:dim`);
    if (!LAYERS.some(l => /sight/.test(l.name) && inPlace(l, place))) found.add(`${place}:sight:layer`);
  }
  return [ok(true, 'read')];
});

group('each place is drawn in a dark-page map of its own', async () => {
  const maps = Object.fromEntries(PLACES.map(p => [p, mapOf({ name: `${p} test`, in: p }, p)]));
  for (const p of PLACES) if (PLACES.some(q => q !== p && maps[q] === maps[p]) && p !== 'yard') found.add(`${p}:map:own`);
  return [ok(true, JSON.stringify(maps))];
});

group('KNOWN_GAPS lists exactly the gaps there are', async () => {
  const stale = KNOWN_GAPS.filter(k => !found.has(k));
  const fresh = [...found].filter(k => !KNOWN_GAPS.includes(k)).sort();
  return [
    ok(stale.length === 0, 'every listed gap is still a gap (take a fixed one off the list)', stale.join(', ')),
    ok(fresh.length === 0, 'every gap is listed', fresh.map(k => `'${k}',`).join(' '))
  ];
});
