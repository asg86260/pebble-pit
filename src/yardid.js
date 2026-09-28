// A yard's name (DESIGN.md, "Cloud saves"): minted with a new game and never
// changed, so two copies of a slot can be told to be one yard at two points
// or two yards. Its own module because persist.js and the migrations need it
// and cloud.js runs the migrations: kept in cloud.js, the three would import
// each other in a ring.

import { CLOUD_ALPHABET, YARD_ID_LEN } from './config/cloud.js';

// Never the seeded rng.js: two yards seeded alike would share a name.
function draw(n) {
  const b = new Uint8Array(n);
  try { crypto.getRandomValues(b); }
  catch { for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256); }
  let s = '';
  for (const x of b) s += CLOUD_ALPHABET[x & 31];
  return s;
}

export const mintYardId = () => draw(YARD_ID_LEN);
