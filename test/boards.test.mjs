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
    ok(orphans.length === 0,
       'no row exists that no board will draw',
       orphans.join(', ') || 'none'),
    ok(ghosts.length === 0,
       'and no board names a row that does not exist',
       ghosts.join(', ') || 'none')
  ];
});
