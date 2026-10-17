// Where each of hell's four ladders stands, and what it is worth there. The
// rungs live in `S.hell.rungs`, by the ladder's key (upgrades/rows-hell.js);
// the values are LADDERS' (config/hell.js, `HELL_LADDERS`).

import { S } from '../state.js';
import { rungValue } from '../config.js';

export const hellRung = key => S.hell?.rungs?.[key] || 0;
export const hellValue = key => rungValue(key, hellRung(key));
