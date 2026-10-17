// Act 3's beats, the bodies of their rows (DESIGN.md, "Acts 3 and 4", "The
// story, beat by beat", act 3). The rows themselves -- the order, the owner,
// the trigger -- are in BEATS (beats.js); this file is what each one does.
// All but the axe still do nothing: each enters, ends on its first step and
// lands no fact, until its piece is built, mock-voted first (God, the throne,
// the unmasking are mocks before they are code).
//
// The ids are the spec's, but for the house's fall: the spec calls it `fall`,
// and `fall` is already the opening's rock coming down (beats.js), so it is
// `house-fall` here.

import { giveAxe } from './faith.js';

// A beat that does nothing yet: entered, over on its first frame.
const stub = () => ({ enter() {}, step() { return false; }, skip() {} });

export const AFTER_STORY = {
  // 1. The house falls: a rock out of the sky on the house, two souls lifting
  // out of the wreck dressed as chosen, the camera up through the yard's sky
  // into cloud. What sets it off is call 7, open (a line on the story card
  // recommended, or on its own a while after the finale).
  'house-fall': stub(),
  // 2. The arrival: the souls down onto cloud, every soul that rose in acts 1
  // and 2 standing in files by line, God's yard behind them already at work.
  'arrive': stub(),
  // 3. The meeting: the throne in the glare, a pick sent down the stair.
  'meet-god': stub(),
  // 4. The refusal: the pick set down, the first members inking their rims
  // and following the pair to the camp's bare patch, a first hit on a cloud.
  'refuse': stub(),
  // The axe handed over after CHOP_CLICKS cloud hits (call 15 open): owed by
  // faith.js when the count is reached. The member walking over from the
  // grove with it is a mock before it is a drawing; until then the beat
  // hands the axe over on its first frame, so the click chops from then on.
  'axe': { enter() { giveAxe(); }, step() { return false; }, skip() { giveAxe(); } },
  // 6. The strike: the whole crowd's tools down at once, God's yard still.
  // Owed by strike.js at STRIKE_SHARE.
  'strike': stub(),
  // 7. The unmasking: the starved glare fading off cell by cell, Satan under it.
  'unmask': stub(),
  // 8. Satan's line: the afterlife his trap, God caged in hell; Satan sinking
  // through the cloud, a body going.
  'hell-told': stub(),
  // 9. The way down opens: a stair of cloud from the empty throne to the
  // house's ruin. If act 3 ships alone this is where its last sheet stands
  // (call 7).
  'ghost-road': stub()
};
