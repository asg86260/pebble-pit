// The shrine's faith ring as the pointer's cue sees it. The ring is drawn by
// render/after/stations.js (`shrine`), which writes here each frame where it
// stands; the click cue (render/aftercues.js) reads it, so the cue never
// imports the drawing.
export const faith = { box: null };   // page: written by the drawing each frame, never saved
