// --- the cutscenes --------------------------------------------------------------
// The one-time beats are watched: the camera goes to the event, the moment
// plays, the camera comes back. One mechanism (src/cutscene.js) owns the
// camera for the length of a scene; the yard never pauses, and any click
// skips. Times are wall seconds, zooms are the setZoom step the scene pulls
// in to. They lived in rift.js while the rift's two transitions were the only
// scenes; the shields' answers are scenes too now, so the numbers have a file.
export const CUT_TEAR_S = 6;         // how long the tearing is watched
export const CUT_TEAR_ZOOM = 1.5;    // pulled in on a small hole being born
export const CUT_DROWN_S = 8;        // the drowning runs longer than its gulp
export const CUT_DROWN_ZOOM = 1;     // and is framed wide: the whole mouth goes
// A shield's answer has no length of its own to give: the net pays out for
// as long as its rate takes, the dome's first hold waits on somebody's walk. So
// the scene ends on the fact -- the shield
// gone, or the rock set down -- plus a tail to see the wreck fly, under a
// ceiling that is a safety and never the design.
export const CUT_SHIELD_ZOOM = 1.5;  // pulled in on the span, the tearing's step, at most
// A shield is tall -- the arch's crown is forty-odd cells up -- and what is
// watched is the rock meeting its top, so the pull-in is measured against
// the thing rather than fixed: the span, the rock over it and a little sky
// fill this much of the frame, and the zoom is whatever makes that so, never
// closer than the step above.
export const CUT_SHIELD_FILL = 0.8;
export const CUT_SHIELD_GROUND = 0.88; // and the ground line sits this far down the frame
export const CUT_SHIELD_TAIL_S = 3;   // after the answer, so the wreck is seen going out along the heap
export const CUT_SHIELD_MAX_S = 30;  // and never longer than this, whatever the answer does
// Letting go. The seat stays on the event -- there is no trip back to where
// the player was looking -- and the zoom and the held ground line ease out to
// the yard's own over this stretch, so the scene ends on the picture it was
// about rather than on a snap. The glide is the fraction of the way to the
// spot the seat covers each frame, going in and coming out alike.
export const CUT_OUT_S = 1.5;
export const CUT_GLIDE = 0.12;
