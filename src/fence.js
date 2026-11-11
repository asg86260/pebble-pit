// The fence round a building going up: a striped post either side of its
// ground and the tape between them, for as long as the work is in the works.
// One answer for the drawing (render/buildsites.js) and for the ground the
// fence takes on the map (footprints.js), in every place: a fence drawn where
// nothing claims it could stand on a neighbor's pile.

import { P, PARTY_IDS } from './config.js';
import { SITES, OPENS_PLACE, rowFor, siteBox, siteFloor, siteShown, worksAt, placeOfSite } from './works.js';
import { groundOf } from './deep/place.js';

export const FENCE_POST_W = 2;      // cells
export const FENCE_POST_BANDS = 5;  // cells tall, a stripe a cell
const FENCE_GAP = 3;                // cells between the ground and each post
const TAPE_UP = 3;                  // cells over the ground the tape runs at

// Only a building or a machine rising out of the ground gets fenced: a rung
// worked at the bench (`kind: 'rung'`) is a body at a bench that was already
// there, and tape round it would fence off thin air.
const risingKinds = new Set(['building', 'machine']);
// A station of the party going up draws its own scaffold in the deep's tones
// (`drawDeepStations`, render/deep.js), so it is not fenced.
const OWN_SCAFFOLD = new Set(PARTY_IDS);

// Per WORK, not per site: a build in line behind another stands fenced on its
// own ground too, which is how the place says the ground is spoken for.
export const fencedWorks = site =>
  (OWN_SCAFFOLD.has(site) ? [] : worksAt(site).filter(w => risingKinds.has(rowFor(w.key)?.kind)));

// The ground under a post at x: the site's own floor where its place has one
// (an act's cloud), else the yard's line or the deep's floor.
const groundAt = (site, foot, x) => {
  const f = siteFloor(site, x);
  return Math.round((f ?? groundOf(foot.y)) / P) * P;
};

// The fence of one work: its two posts as rects, and the tape's run.
export function fenceOf(site, work) {
  const foot = siteBox(site, work);
  if (!foot) return null;
  const postW = P * FENCE_POST_W, postH = P * FENCE_POST_BANDS;
  const left = Math.round(foot.x / P) * P - P * FENCE_GAP - postW;
  const right = Math.round((foot.x + foot.w) / P) * P + P * FENCE_GAP;
  const gl = groundAt(site, foot, left + postW / 2), gr = groundAt(site, foot, right + postW / 2);
  const mid = groundAt(site, foot, foot.x + foot.w / 2);
  return {
    posts: [{ x: left, y: gl - postH, w: postW, h: postH }, { x: right, y: gr - postH, w: postW, h: postH }],
    tape: { x0: left + postW, x1: right, y: mid - P * TAPE_UP }
  };
}

// Every fence standing, keyed by the site it fences.
export const fences = () => SITES.flatMap(site => fencedWorks(site).map(w => ({ site, work: w, fence: fenceOf(site, w) })))
  .filter(f => f.fence);

// The posts standing in `place` ('yard', 'deep', 'after'), each with the
// object it is part of, for the map (footprints.js). The tape is not ground:
// it runs at head height across the work's own box.
export const fencePosts = place => fences().filter(f => placeOfSite(f.site) === place)
  .map(f => ({ id: fenceOwner(f.site, f.work), rects: f.fence.posts }));

// The object on the map a fence is part of: what is going up inside it --
// the station a row stands as (`stands`), the place a yard door opens, the
// house, or the station that is its own site.
export const fenceOwner = (site, work) => {
  const row = rowFor(work.key);
  if (row?.stands) return row.stands;
  if (site === 'yard') return OPENS_PLACE[work.key] || (work.key === 'house' ? 'house' : work.key);
  return site;
};
