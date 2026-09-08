// Every row is on a board.
//
// A board draws the keys its *sections* name, not the rows in its array, so
// adding a row is two edits and only one of them is where the row is. Miss the
// second and the row exists, prices correctly, buys correctly, is reachable from
// `__buy` -- and is on no board anywhere, which is indistinguishable from never
// having written it.
//
// It happened to five things at once: the lab's own two ladders, both of the
// tower's, all four of its enchantments and the scrubbing house's fan were
// invisible for as long as they had existed. Nothing failed. There was simply
// nothing to click.

import { group, ok, state, openSites } from './helpers.mjs';

// The row arrays themselves, for the grammar check at the foot of this file. It
// reads the static shape of every row -- `kind`, `name`, `unit` -- so it takes
// them straight from the modules rather than through `__rows`, which reports only
// what a board draws (key, name, price) and not what a row *is*. These are static
// definitions, so a direct import is the same table the game builds from; helpers
// already reaches for `src/quarry.js` this way.
import { UPGRADES } from '../src/upgrades.js';
import { BUILDBENCH_UPGRADES } from '../src/upgrades/rows-buildbench.js';
import { TOWER_UPGRADES } from '../src/tower.js';
import { SCHOOL_UPGRADES } from '../src/school.js';
import { SCRUB_UPGRADES } from '../src/scrubhouse.js';
import { QUARRY_UPGRADES } from '../src/quarry.js';
import { FARM_UPGRADES } from '../src/farm.js';
import { CASINO_UPGRADES } from '../src/casino.js';
import { APOTHECARY_UPGRADES } from '../src/apothecary.js';

group('every row on every board has somewhere to be drawn', async () => {
  window.__reset();
  openSites();
  window.__buildbench(true);

  const boards = window.__boards();
  const orphans = [];
  const ghosts = [];
  for (const b of boards) {
    const inSections = new Set(b.sections.flat());
    for (const k of b.keys) if (!inSections.has(k)) orphans.push(`${b.name}:${k}`);
    for (const k of inSections) if (!b.keys.includes(k)) ghosts.push(`${b.name}:${k}`);
  }
  return [
    ok(boards.length >= 4, 'there are boards to check', `${boards.length}`),
    // Still worth saying, because a row under "and" is a row whose heading
    // somebody forgot -- it is visible, which is the thing that matters, but it
    // is not where it was meant to be.
    ok(orphans.length === 0,
       'every row is named by a section, so none of them land under "and"',
       orphans.join(', ') || 'none'),
    ok(ghosts.length === 0,
       'and no board names a row that does not exist',
       ghosts.join(', ') || 'none')
  ];
});

// And a row nobody named still gets drawn.
//
// This is the guarantee rather than the guard. The check above says every row
// has a heading, which is a tidiness rule and can be broken by anybody adding a
// row; this says that breaking it costs you the *heading* and not the row. The
// rows are what exist. The sections only say how they are grouped.
group('a row no section names is still drawn', async () => {
  window.__reset();
  openSites();
  window.__buildbench(true);
  window.__grant({ shards: 400, spores: 400, cores: 9 });
  window.__tip(20000);

  // Take a row's key out of every section on its board and check it survives.
  const before = window.__rows().filter(r => r.shown).map(r => r.key);
  const hidden = window.__unsection('labswing');
  const after = window.__rows().filter(r => r.shown).map(r => r.key);
  window.__unsection(null);                    // and put the sections back

  return [
    ok(before.includes('labswing'), 'the row is on its board to begin with'),
    ok(hidden, 'its key can be taken out of every section'),
    ok(after.includes('labswing'),
       'and it is still drawn with no section naming it',
       after.filter(k => k.startsWith('lab')).join(','))
  ];
});

// The shop speaks one language, and this holds it to the grammar.
//
// A player learns what a row is called on one board and expects it to mean the
// same thing on the next. That only holds if the boards keep to one rule per
// `kind` -- see "The shop's language" in DESIGN.md -- so this checks the rule
// rather than the fifty-two rows, and the fifty-third cannot quietly break it.
//
// It reads the static shape, not a running yard: no seed, no frames. `group`
// still wraps it so a fistful of violations reports as a fistful.
group('the shop keeps to one grammar per kind', async () => {
  const rows = [...UPGRADES, ...BUILDBENCH_UPGRADES, ...TOWER_UPGRADES, ...SCHOOL_UPGRADES,
                ...SCRUB_UPGRADES, ...QUARRY_UPGRADES, ...FARM_UPGRADES,
                ...APOTHECARY_UPGRADES];

  // The casino is not a shop -- chips, stake, bank it, spin again are moves at a
  // table -- so its rows keep their own register on purpose. And `airrate` is a
  // readout wearing a row (it says "pollution / holding steady" and sells
  // nothing), exempt until it stops being a row at all. See "What is exempt".
  const casinoKeys = new Set(CASINO_UPGRADES.map(r => r.key));
  // `recycler` is typed `place` for a mechanical reason -- the house's own body
  // walks over to fit it, the same walk a bench costs -- but it is not standing
  // room for another body, so DESIGN's rename gives it machine language ("the
  // recycler") over the "another X" the place rule asks for. The kind cannot
  // move without moving the mechanic, so the row is the one exception to that
  // rule and is named here rather than left to fail silently.
  const exempt = k => casinoKeys.has(k) || k === 'airrate' || k === 'recycler';

  // The four tune rows, held to "tune the X" -- one verb for all four, the
  // flavour carried by the note a line below. They are `kind: 'rung'`, so they
  // are found by key rather than by kind.
  const tuneKeys = new Set(['tuneram', 'tunebelt', 'tunetiller', 'tunejaw']);

  const machineBad = [];   // kind 'machine' must be "the X"
  const placeBad = [];     // kind 'place' must be "another X"
  const tuneBad = [];      // a tune row must be "tune the X"
  const unitless = [];     // a rated row (pct) must state a unit
  const genreBad = [];     // no row says "upgrade" -- the one genre-word cut

  for (const r of rows) {
    const name = r.name || '';
    if (tuneKeys.has(r.key)) {
      if (!name.startsWith('tune the ')) tuneBad.push(`${r.key}:"${name}"`);
    } else if (!exempt(r.key)) {
      if (r.kind === 'machine' && !name.startsWith('the '))
        machineBad.push(`${r.key}:"${name}"`);
      if (r.kind === 'place' && !name.startsWith('another '))
        placeBad.push(`${r.key}:"${name}"`);
    }
    // A "+25%" of nothing is the bug this catches: every rated row names its
    // unit, whatever its kind or board.
    if (r.pct && !r.unit) unitless.push(r.key);
    // "upgrade pickaxe" was the only genre-speak in the game and the rename cut
    // it; this stops it or another "upgrade the X" from creeping back onto any
    // board -- every row is an upgrade, so saying so carries nothing.
    if (/\bupgrade\b/i.test(name)) genreBad.push(`${r.key}:"${name}"`);
  }

  return [
    ok(machineBad.length === 0,
       'every machine row is named "the X"',
       machineBad.join(', ') || 'none'),
    ok(placeBad.length === 0,
       'every place row is named "another X"',
       placeBad.join(', ') || 'none'),
    ok(tuneBad.length === 0,
       'every tune row is named "tune the X"',
       tuneBad.join(', ') || 'none'),
    ok(unitless.length === 0,
       'every rated row states a unit, so none render a percent of nothing',
       unitless.join(', ') || 'none'),
    ok(genreBad.length === 0,
       'no row says "upgrade" -- every row is one, so the word carries nothing',
       genreBad.join(', ') || 'none')
  ];
});
