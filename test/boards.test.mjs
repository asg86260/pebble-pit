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

group('every row on every board has somewhere to be drawn', async () => {
  window.__reset();
  openSites();
  window.__lab(true);

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
  window.__lab(true);
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
