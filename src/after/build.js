// The construction shack's work: a station bought is raised a piece at a
// time (the owner, 2026-10-18), AFTER_BUILD_PIECES bands of its box from the
// floor up, each fading in as it lands, by a builder standing at its door.
//
// The builder is a member from the camp. With nobody waiting there -- every
// member at a post -- the pair step down off the pedestal and raise it
// themselves, and climb back up when it stands; so a camp with no free hands
// never leaves a bought station unbuilt. A member builder walks back to the
// camp after, and is counted there again on arrival.
//
// `S.after.raising` is each bought station's pieces: { n, at: [time a piece] },
// kept after it stands, so its bands finish fading in.

import { S } from '../state.js';
import { P, AFTER_BUILD_PIECES, AFTER_BUILD_PIECE_S } from '../config.js';
import { nextId } from './util.js';
import { built } from './levels.js';
import { campSpot, speakerAt } from './place.js';

// A station bought on the shack: its site started.
export function raiseStation(key) {
  const a = S.after;
  if (a.raising[key] || built(key)) return false;
  a.raising[key] = { n: 0, at: [] };
  return true;
}
const sites = () => Object.keys(S.after.raising).filter(k => !built(k));
export const pairBuilding = () => !!S.after && S.after.bodies.some(b => b.job === 'builder' && b.pair != null);

// Every site without a builder gets one: a member off the back of the camp,
// or, with none waiting and the pair on the pedestal, the pair.
export function fillBuilders() {
  const a = S.after;
  for (const key of sites()) {
    if (a.bodies.some(b => b.job === 'builder' && b.site === key && b.state !== 'home')) continue;
    if (a.camp > 0) {
      a.camp -= 1;
      const at = campSpot(a.camp);
      a.bodies.push({ id: nextId(), job: 'builder', site: key, pair: null, x: at.x, y: at.y, face: 1, state: 'work', t: 0, load: null, target: null, n: 0 });
    } else if (!pairBuilding()) {
      for (const k of [0, 1]) {
        const at = speakerAt(k);     // a speaker's spot is its left edge, a body's x its middle column
        a.bodies.push({ id: nextId(), job: 'builder', site: key, pair: k, x: at.x + P, y: at.y, face: -1, state: 'work', t: 0, load: null, target: null, n: 0 });
      }
    }
  }
}

// A builder's piece landed at `key`: true when that was the last, the
// station standing.
export function layPiece(key) {
  const a = S.after, r = a.raising[key];
  if (!r || built(key)) return true;
  r.n += 1; r.at.push(a.t);
  if (r.n >= AFTER_BUILD_PIECES) { a.built.push(key); return true; }
  return false;
}
export const pieceS = () => AFTER_BUILD_PIECE_S;
