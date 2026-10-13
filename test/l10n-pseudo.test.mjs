// The words a player meets come out of the language file, as the yard writes
// them: a pseudo-language wraps every message (tools/wording/pseudo.mjs), the
// boards are built and filled at three points in a game, the held sheet's
// pages, the corner cards, the story's line and the canvas's text are written,
// the hover is asked of a grid of spots, and nothing is left over that the
// code wrote itself. The crew's own names are names and pass. What the static
// guard (test/l10n.test.mjs) cannot see -- a single word in a table, a word
// built from pieces -- shows up here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findUnmarked } from '../tools/wording/pseudo.mjs';

test('every word the yard writes is a message', async () => {
  assert.deepEqual(await findUnmarked(), []);
});
