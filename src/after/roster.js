// Act 3's rosters: a post a job, under the station it works at, on the
// yard's own roster (roster.js; DESIGN.md, "Act 3's crew: assigned like the
// yard's"). The drawing, the buttons, the hit test and the seat pips are the
// yard's; what is the act's is the answers -- how many of a job the roster
// wants (`S.after.crew`), who is spare (the idle, at the podium or in the
// crowd), the seats bought, and the bodies on the job (bodies.js).
//
// A station's one job stands under it, the woodcutter's under the forestry
// shack in front of its trees, and says what it does with the cursor on it,
// or why it is standing still. Each names its station's board, so the
// roster stands the board's UPGRADES button over its count: up here that
// button is the one way into a station's shop (the owner, 2026-10-28).

import { S } from '../state.js';
import { AFTER_JOBS, AFTER_JOB_POST, AFTER_ROSTER_DOWN, AFTER_ROSTER_SHOP_DROP, AFTER_SIGN_TIMBER } from '../config.js';
import { msg } from '../lang.js';
import { rosterPlace } from '../roster.js';
import { afterlifeOn } from '../acts.js';
import { built, seatsOf, stumpsOn } from './levels.js';
import { stationBox, groundOf, closed } from './place.js';
import { crewAt, bodiesOf, spareMembers, putOn, walkLeft, holds } from './bodies.js';
import { standing, stumped } from './grove.js';
import { heapFull } from './mill.js';
import { pileFull } from './piles.js';
import { JOB_NAMES } from './rows.js';

const stationOf = card => (card === 'grove' ? 'forestry' : card);
const live = () => afterlifeOn() && !!S.after;

const SRC = {
  count: p => crewAt(p.job),
  press: (p, d) => putOn(p.job, d),
  spare: () => spareMembers(),
  cap: p => seatsOf(p.job),
  bodies: p => bodiesOf(p.job),
  coming: w => !w.on,
  left: w => walkLeft(w),
  uid: w => `after:${w.id}`
};

// Why a station's worker stands still, off the same stock its frame reads
// (bodies.js, mill.js): a message id, or null while it can work.
const stock = () => S.after.stock;
const noLogs = pile => stock()[pile] <= 0 && stock().grovelogs <= 0;
const STALL = {
  woodcutter: () => (!S.after.groundLogs.length && !S.after.plots.some(p => standing(p) || (stumpsOn() && stumped(p))) ? 'after-stall-trees' : null),
  sawyer: () => (heapFull() ? 'after-stall-heap' : pileFull('timber') ? 'hover-pile-full' : noLogs('logs') ? 'after-stall-logs' : null),
  joiner: () => (stock().timber < AFTER_SIGN_TIMBER && stock().signs < holds('sign') ? 'after-stall-timber' : null)
};
const DOES = {
  woodcutter: () => msg('after-job-woodcutter.says'), sawyer: () => msg('after-job-sawyer.says'),
  joiner: () => msg('after-job-joiner.says')
};
export const jobSays = job => { const k = STALL[job](); return msg('after-roster-tip', { job: JOB_NAMES[job](), line: k ? msg(k) : DOES[job]() }); };

const POSTS = AFTER_JOBS.map(job => {
  const card = AFTER_JOB_POST[job], key = stationOf(card);
  return {
    key: `after-${job}`, job, place: 'after', group: `after-${key}`, board: `after-${card}`, kit: false, fixed: false, src: SRC,
    show: () => live() && built(card) && !closed(card),
    at: () => { const b = stationBox(key); return b.x + b.w / 2; },
    y: () => groundOf(key) + AFTER_ROSTER_DOWN + AFTER_ROSTER_SHOP_DROP,
    deep: false,
    says: () => jobSays(job)
  };
});
export const afterPosts = () => POSTS;
rosterPlace('after', afterPosts);
