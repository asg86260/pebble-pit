// The index: an entry is listed once the player has met the thing, by the
// save's own fact where it has one and by `S.seen` where it has none, and a
// thing met stays met. DESIGN.md, "The index".
import { group, ok, run, runUntil, makeItRain } from './helpers.mjs';
import { S } from '../src/state.js';
import { INDEX, GROUPS } from '../src/config/index.js';
import { metEntries, metParts, isMet } from '../src/met.js';
import { MACHINES } from '../src/machines.js';
import { KINDS } from '../src/shield.js';
import { BEATS } from '../src/beats.js';
import { BLANK } from '../src/state.js';
import { GLYPHS } from '../src/glyphs.js';

const listed = () => metEntries(false).map(e => e.key);
const entry = key => INDEX.find(e => e.key === key);

group('every entry has a name, a group and words, and its met resolves', async () => {
  const bad = [];
  const keys = new Set();
  for (const e of INDEX) {
    if (keys.has(e.key)) bad.push(`${e.key}: twice`);
    keys.add(e.key);
    if (!e.name) bad.push(`${e.key}: no name`);
    if (!GROUPS.includes(e.group)) bad.push(`${e.key}: group ${e.group}`);
    if (!e.text || !e.text.trim()) bad.push(`${e.key}: no text`);
    const [kind, arg] = metParts(e.met || '');
    const fine =
      kind === 'field' ? arg === 'start' || arg === 'seen' || arg in BLANK :
      kind === 'tally' ? !!arg :
      kind === 'machine' ? MACHINES.some(m => m.key === arg) :
      kind === 'shield' ? arg in KINDS :
      kind === 'beat' ? BEATS.some(b => b.key === arg) : false;
    if (!fine) bad.push(`${e.key}: met '${e.met}' resolves to nothing`);
  }
  const released = INDEX.filter(e => !e.serpent).length;
  return [
    ok(bad.length === 0, 'every entry is whole', bad.join('; ')),
    ok(released === 60, 'sixty entries in a released build', `${released}`),
  ];
});

// An icon is a picture of its entry (docs/index-icons.md); a place and the
// crew who work it may share one, as the apothecary and its keeper do.
group('every icon is a drawing that exists', async () => {
  const bad = INDEX.filter(e => e.glyph && !e.glyph.startsWith('mark:') && !GLYPHS[e.glyph])
    .map(e => `${e.key}: no drawing '${e.glyph}'`);
  return [ok(bad.length === 0, 'every drawing drawn', bad.join('; '))];
});

group('a fresh game lists only the opening\'s things', async () => {
  window.__reset();
  run(1 / 60);
  // the opening hands over a body on carrying, and its house with it
  const opening = INDEX.filter(e => !e.serpent && (e.met === 'start' || (e.key === 'house' && S.crew > 0)))
    .map(e => e.key).sort();
  const now = listed().sort();
  return [
    ok(JSON.stringify(now) === JSON.stringify(opening), 'only the entries met from the start',
       `listed ${now.join(',')}`),
    ok(!now.includes('muck') && !now.includes('crit') && !now.includes('shard'), 'no muck, crit or ore yet'),
  ];
});

group('a storm that leaves muck down reveals muck', async () => {
  window.__reset();
  window.__crew(0, 3);
  run(2);
  const before = listed().includes('muck');
  makeItRain();
  runUntil(() => !S.raining && (S.tally.muckRains | 0) >= 1, 180);
  return [
    ok(!before, 'muck is not listed before any storm'),
    ok(listed().includes('muck'), 'and is once a storm has left it down', `muckRains ${S.tally.muckRains | 0}`),
    ok(listed().includes('rain') && listed().includes('pollution'), 'the rain and the sky with it'),
  ];
});

group('a crit swing reveals the crit, and it survives a reload', async () => {
  window.__reset();
  run(1);
  const before = listed().includes('crit');
  window.__crit(true);
  window.__swing(1);
  window.__crit(null);
  const after = listed().includes('crit');
  run(1);
  window.__cold();
  const kept = S.seen.includes('crit') && listed().includes('crit');
  return [
    ok(!before, 'no crit listed before one lands'),
    ok(after, 'a swing that crits lists it'),
    ok(kept, 'S.seen keeps it through a reload', S.seen.join(',')),
  ];
});

group('a thing met by a count stays met when the count falls', async () => {
  window.__reset();
  window.__crew(3);                      // three on the rock
  run(1);
  const met = listed().includes('rockhand');
  window.__crew(0, 3);                   // and all of them moved off it
  run(1);
  return [
    ok(met, 'diggers are listed while there are diggers'),
    ok(S.rockhands === 0 && isMet(entry('rockhand')), 'and still with none left', `rockhands ${S.rockhands}`),
  ];
});
