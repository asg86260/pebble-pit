// Every door on the bench has a line of words under it.
//
// A door is the one row a player buys before they have seen the place, so the
// note is the whole pitch. Three of them -- the farm, the quarry, the apothecary
// -- are cut from `site()` in upgrades/site.js, and that helper once copied a
// fixed list of fields and left `note` behind: the rows file wrote one, the card
// never showed it, and the bench read as if those three were told less than the
// rest. Held over every door at once, so the next field the helper forgets is a
// red check rather than a bare card.

import { group, ok } from './helpers.mjs';
import { UPGRADES } from '../src/upgrades.js';

group('every door on the bench carries its note onto the card', async () => {
  const doors = UPGRADES.filter(u => u.kind === 'building');
  const mute = doors.filter(u => typeof u.note !== 'function').map(u => u.key);
  return [
    ok(doors.length >= 3, 'there are doors to hold to it', `${doors.length}`),
    ok(mute.length === 0, 'and each one has a note', mute.join(',') || 'none')
  ];
});
