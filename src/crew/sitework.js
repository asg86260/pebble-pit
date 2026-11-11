// REVIEW review-a3-build
// --- a builder at a site: the choice every place's builders share --------------
// Which work a builder is on, where it stands to do it, when it has arrived,
// and the rule for who is made a builder at all. The walk there is the
// place's own (the yard's route, an act's floor), handed in by the caller;
// everything else is here once, so the yard, the deep and an act raise a
// station the same way (DESIGN.md, "Act 3 builds through the yard's
// construction").

import { WORKER, BUILD_SHIFT, BUILD_SHIFT_SPAN } from '../config.js';
import { siteBox, worksAt, onTheGo, siteX } from '../works.js';

// Which (site, work) slot a builder is on, among `busy` sites, `mates` the
// other builders of its crew. The unit is a work, not a site: a place can
// hold two builds at once, and a body has to be at one of them or its
// presence credits a bar it is nowhere near. It keeps its slot while the work
// is on the go; when the work lands it takes the emptiest slot next, oldest
// first on a tie, so a queue finishes in the order it was bought.
export function claimWork(w, busy, mates) {
  if (w.site && busy.includes(w.site)
      && onTheGo(w.site).some(x => x.id === w.workId)) return w.site;
  let pick = null, pickId = null, fewest = Infinity;
  for (const site of busy) {
    // Only what is being built: a work in line has nobody walking to it until
    // it reaches the front (`stepWorks` in works.js).
    for (const work of onTheGo(site)) {
      const n = mates.filter(o => o !== w && o.site === site && o.workId === work.id).length;
      if (n < fewest) { fewest = n; pick = site; pickId = work.id; }
    }
  }
  w.site = pick;
  w.workId = pickId;
  return pick;
}

// The ground inside a site's zone nearest a given left edge: the whole box
// less the body's own width, the same span `jigSpan` works across in
// dance.js, so the spot a builder walks to and the patch it shuffles along
// are one rule.
export const nearestIn = (box, x) => Math.max(box.x, Math.min(box.x + box.w - WORKER, x));

// The box a builder's OWN work is on (`siteBox`, the same box the tape is
// drawn round and the bar hangs over), by the work's id, so two bodies on one
// site each stand at the thing they are putting up.
export const ownBox = w =>
  siteBox(w.site, worksAt(w.site).find(x => x.id === w.workId) || null);

// Where a builder is bound, as its left edge, or null with nothing to build;
// a site with no box of its own is worked where the site says it is.
export function builderMark(w) {
  if (!w.site) return null;
  const box = ownBox(w);
  return box ? nearestIn(box, w.x) : siteX(w.site);
}

// Arrived is a patch, not a pixel: `workJig` shifts the body a few cells a
// burst, and a walk re-aimed at one pixel drags it straight back, sixty
// times a second. Only a body genuinely somewhere else is walked again.
export const arrivedSlack = w => (w.goal === 'at' ? BUILD_SHIFT_SPAN + BUILD_SHIFT * 2 : 1);

// Who is made a builder, for a crew kept as bodies (an act's): one a work on
// the go, never more, so a build never swallows the place's hands. Taken
// from the spare first, the nearest the work; with none spare, the nearest
// body at a post is lent, and every builder goes back once there is no work
// left for it -- the yard's rule (staffing.js, `rebalance`), there kept in
// counts. `crew` answers the place's half:
//   builders()   its builders now
//   spare(x)     a spare body nearest x, made a builder, or null
//   lend(x)      a posted body nearest x, made a builder, or null
//   free(w)      a builder no work wants, sent back
//   handsFree(w) whether it can be let go of now (nothing in its arms)
export function manSites(busy, crew) {
  const works = busy.flatMap(site => onTheGo(site).map(work => ({ site, work })));
  const on = crew.builders();
  // Over the works on the go: the newest off first, once its hands are free.
  for (let k = on.length - 1; k >= 0 && on.length > works.length; k--)
    if (crew.handsFree(on[k])) { crew.free(on[k]); on.splice(k, 1); }
  for (let short = works.length - on.length; short > 0; short--) {
    // The work with nobody on it, oldest first.
    const open = works.find(({ work }) => !on.some(b => b.workId === work.id));
    const box = open && siteBox(open.site, open.work);
    const x = box ? box.x + box.w / 2 : open ? siteX(open.site) : null;
    const w = crew.spare(x) || crew.lend(x);
    if (!w) break;
    on.push(w);
  }
}
