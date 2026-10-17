// The cage room (DESIGN.md, "Acts 3 and 4", act 4, beats 14 to 16, "Freeing
// God", "Lives returned" and "Home").
//
// The last chamber, God hanging in the cage cut from the room's own adamant.
// The cage is the last barrier and is worked like the others (barriers.js):
// the adamant pick, the gang and the click, a cell at a time. Its last cell
// down is the act's climax, `cageBroken`, for the story to take (the
// `unchain` beat, Track C's). Still open and not built: whether the cage is
// the crew's work or a cutscene once the fourth wall falls (call 4), whether
// Satan watches, the pair's rims filling (call 6) and the way home (call 8).

import { S } from '../state.js';
import { HELL_TIERS } from '../config.js';
import { barrierFallen } from './barriers.js';

// The cage's index in the run: the last barrier.
export const CAGE = HELL_TIERS.length - 1;
// Whether the cage's last bar is down.
export const cageBroken = () => !!S.hell && barrierFallen(CAGE);

// One frame of the cage room: nothing of its own yet beyond the barrier.
export function stepCage(c) {}
