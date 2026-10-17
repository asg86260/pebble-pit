// The seams and the brimstone (DESIGN.md, "Acts 3 and 4", act 4, "The chain:
// five ores, five tools, five barriers", mining). A stub of the scaffold:
// nothing here runs yet.
//
// What it will own: each chamber's seam as a face that deepens a cell at a
// time, never a heap that fills; a blow -- the pair's click or a miner's swing
// with the best tool the forge has carried to that face -- that bites or rings
// off by the tool's tier, a lump knocked loose as a counted item carried by a
// body, never grains in a sand grid; brimstone crusting round the vents,
// gathered with any tool, the dust band's coin. Act 4 never gets a by-product
// worth keeping or a split (DESIGN.md, "How act 3 differs from act 4"). Ore
// by tier is `S.hell.ore`, brimstone `S.hell.brimstone`, each face's tool and
// each seam's depth `S.hell.faces` and `S.hell.seams`.

// One frame of the faces and the vents.
export function stepOre(c) {}

// A click in hell, in world pixels: true if it struck a seam or a barrier.
// Nothing to strike yet.
export function strikeAt(x, y) { return false; }
