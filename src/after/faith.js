// MOCK faith16
// The shrine's faith ring as the pointer sees it. The ring is drawn by
// render/after/stations.js (`shrine`), which writes here each frame where it
// stands and whether it is full; the click cue (render/aftercues.js), the
// cursor (input.js) and the hover tip (the station table's `after-faith` row,
// after/stations.js) read it. `cue` is which of the yard's click cues a
// review option shows: 'hand' the ghost hand, 'hover' the same hand only
// while the pointer is over, 'hand+' the hand, the pointing cursor and a tip.
// Stood by the scenes: the real build reads the shrine's own count.
export const faith = { full: false, box: null, cue: 'hand' };   // page: written by the drawing and the scenes, never saved
export const overFaith = (x, y) => faith.full && !!faith.box && x >= faith.box.x && x <= faith.box.x + faith.box.w && y >= faith.box.y && y <= faith.box.y + faith.box.h;
