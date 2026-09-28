// A yard's name (DESIGN.md, "Cloud saves"): minted with a new game and never
// changed, so two copies of a slot can be told to be one yard at two points
// or two yards. Its own module because persist.js and the migrations need it
// and cloud.js runs the migrations: kept in cloud.js, the three would import
// each other in a ring. Never the seeded rng.js: two yards seeded alike would
// share a name.

import { draw } from './codes.js';
import { YARD_ID_LEN } from './config/cloud.js';

export const mintYardId = () => draw(YARD_ID_LEN);
