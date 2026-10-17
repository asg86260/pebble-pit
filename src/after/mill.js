// The saw mill and the paper mill (DESIGN.md, "Acts 3 and 4", act 3, "The
// chain: trees to signs and posters"). A stub of the scaffold: nothing here
// runs yet.
//
// What it will own: a log sawn into timber and sawdust; the sawdust heaping
// beside the mill to the brim (the pile-full mark) and swept off the cloud's
// edge by a sawyer taken off the saw until the paper mill opens at the
// slowdown; the paper mill pulping sawdust into sheets. And the fence, the
// act's standing decision: set fine, more timber; coarse, more sawdust (call
// 13 open: a control on the mill's card recommended, or a fixed split the
// ladders shift). Act 3 never gets tiers (DESIGN.md, "How act 3 differs from
// act 4"): a better saw makes more boards, never a new kind of tree.

import { S } from '../state.js';

// One frame of both mills.
export function stepMill(c) {}

// The fence's setting, timber's share of a log: null while call 13 is open.
export const fenceSplit = () => (S.after ? S.after.fence : null);
