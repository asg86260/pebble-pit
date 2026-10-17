// Act 4's beats, the bodies of their rows (DESIGN.md, "Acts 3 and 4", "The
// story, beat by beat", act 4). The rows -- the order, the owner, the trigger
// -- are in BEATS (beats.js); this file is what each one does, and in the
// scaffold each does nothing: it enters, ends on its first step and lands no
// fact. The run of chambers, the barriers and the forge are mocks before they
// are code.

import { HELL_TIERS } from '../config.js';

// A beat that does nothing yet: entered, over on its first frame.
const stub = () => ({ enter() {}, step() { return false; }, skip() {} });

// The barriers' falls, `wall-1` onward: one a barrier but the last, whose fall
// is `unchain`. Off the table's length, so call 4's four or five is one row.
export const WALL_BEATS = HELL_TIERS.slice(0, -1).map((_, i) => `wall-${i + 1}`);

export const HELL_STORY = {
  // 10. The return, as ghosts: the pair down the cloud stair onto their own
  // yard, still at work, the crew a few generations on.
  'haunt': stub(),
  // 11. The first descent: the pit, the abyss, the deep and through its
  // floor, onto hell's first chamber.
  'descend': stub(),
  // 12. The first attempt: the yard's pick on the rubble, ringing off, and
  // the camera to the seam whose grain matches.
  'wall-first': stub(),
  // 13. Each barrier's fall: the camera on into the next chamber, the next
  // barrier struck once and ringing the tool off.
  ...Object.fromEntries(WALL_BEATS.map(k => [k, stub()])),
  // 14. Freeing God: the cage's last bar, God standing. A cutscene.
  'unchain': stub(),
  // 15. Lives returned: the pair's rims filling to black.
  'alive': stub(),
  // 16. Home: back up the way they came, the house put up again, the bench.
  'home-again': stub()
};
