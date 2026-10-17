// The furnaces and the anvil (DESIGN.md, "Acts 3 and 4", act 4, "The chain:
// five ores, five tools, five barriers", smelting and the forge). A stub of
// the scaffold: nothing here runs yet.
//
// What it will own: a furnace in every chamber, its heat its chamber's depth,
// melting any ore of its tier or below and refusing the rest (the hopper's
// pile-full mark), burning brimstone by the second while lit and cooling when
// it runs out; stokers and haulers; the anvil in the landing turning a tier's
// bars and the tool before it into the next tool in TOOL_STROKES held strokes
// (white sparks, never red); tier III's alloy, copper and iron at once; the
// top two tools quenched in the abyss's black water carried down by a ghost.
// A new tool reaches a face in a body's hands before its swing changes. The
// tool tier made is `S.hell.tool` (0 the yard's pick), bars by tier
// `S.hell.bars`, each furnace's fuel and lit state `S.hell.furnaces`.

import { S } from '../state.js';

// One frame of the furnaces and the anvil.
export function stepForge(c) {}

// The tool tier the forge has made, 0 the yard's own pick.
export const toolTier = () => (S.hell ? S.hell.tool : 0);
