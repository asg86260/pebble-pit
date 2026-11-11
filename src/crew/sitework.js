// REVIEW review-a3-build
// --- a builder at a site: the choice every place's builders share --------------
// Which work a builder is on, where it stands to do it, when it has arrived,
// and the rule for who is made a builder at all (`manSites`). The walk there is the
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

// Who is made a builder, in every place (the yard, the deep, an act): one a
// work wanted, never more, so a build never swallows the place's hands.
// Builders come from the spare; short of them, the body nearest the work is
// *lent* off its post -- which makes it spare -- and the loan goes home once
// nothing is left to build, not as soon as one build lands, so a second build
// still on the go does not lend the same body again a frame later. The place
// answers its half as data:
//   want     how many builders its builds want now
//   spare()  how many of its hands are on nothing (a body lent counts)
//   lend()   the body nearest the work off its post, the loan recorded on
//            the body (`lentFrom`); false with nobody to lend
//   home()   every loan given back, asked only once nothing is left to build
// How many build is returned: the want, or as many as are spare. Which bodies
// those are is the place's catch-up (the yard's `syncWorkers`, an act's walk).
export function manSites(place) {
  // The shortfall is read once: a place's spare count can be clamped (the
  // yard's is never below nought), so a lend need not raise it, and a loop
  // asking again would lend more than the build is short.
  for (let short = place.want - place.spare(); short > 0; short--) if (!place.lend()) break;
  if (!place.want) place.home();
  return Math.min(place.want, place.spare());
}
