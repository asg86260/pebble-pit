// The air filter (DESIGN.md, "The air filter"): the scrubbing house renamed
// through the code and the save. It is the balloons' shed now and filters
// nothing itself; the balloons are test/balloon.test.mjs. Its dial is a
// drawing and no check can see it; the `filter*` scenes are its check.

import { readFileSync } from 'node:fs';
import { group, ok, yard } from './helpers.mjs';

const S = yard.S;

group('a save from before the rename comes back with its scrubbing house as the filter', async () => {
  // A player's yard with the house standing, its row seen and its board read.
  const raw = readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8');
  const was = JSON.parse(raw);
  localStorage.setItem('boulder-clicker/v4', raw);
  yard.restore();
  return [
    ok(was.scrubOpen === true && S.filterOpen === true, 'the building is still standing', `filterOpen ${S.filterOpen}`),
    ok(!('scrubOpen' in S), 'under its new name only'),
    ok(S.seenRows.includes('unlockfilter') && !S.seenRows.includes('unlockscrub'),
       'its row is still one the player has seen'),
    ok(S.seenSects.includes('the air filter') && !S.seenSects.includes('the scrubbing house'),
       'and its board is still one they have read', S.seenSects.join(', '))
  ];
});
