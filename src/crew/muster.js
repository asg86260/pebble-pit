// The crew, kept to the counts: who the yard has, who it is short of, and who is
// actually standing at a site rather than merely assigned to one.

import { WORKER, CORE_SIZE } from '../config.js';
import { S } from '../state.js';
import { spawnChip, bell } from '../dust.js';
import { SITE_JOB, setHands, setHandsOn, setStaff, worksAt, builderManned } from '../works.js';
import { JOB_OF, hats, rockhandMs, rebalance } from '../upgrades.js';
import { KIT_JOBS } from '../kit.js';
import { TYPE } from '../jobs.js';
import { now } from '../clock.js';
import { newRecord } from './records.js';
import { retask } from './commute.js';
import { unbook } from './hole.js';
import { FACTORY, TYPES, wanted } from './jobs.js';
import { atShed, SHED_SITES } from './shedhand.js';

// --- who is actually at a site ------------------------------------------------
// The one question works.js cannot answer for itself, registered here the same
// way the machines register what only the stations know: a count is not a body,
// and a station idles until somebody is *actually standing there*.
//
// Arrived, not assigned. `S.quarriers` counts everybody the cut has been given
// and one of them may still be crossing the yard, and a bench that came out
// while its gang was halfway down the ladder would be the building claiming
// something the crew deny.
const ARRIVED = {
  // The rock's gang, for the shack: a pick is fitted by one of them standing
  // at the hut (see shedhand.js), so what is asked of this is only that the
  // body is one of theirs and not still on its way out.
  rockhands: w => w.type === TYPE.ROCK && w.goal !== 'to',
  quarriers: w => w.type === TYPE.QUARRY && w.goal !== 'to',
  farmhands: w => w.type === TYPE.FARM && w.goal !== 'to',
  purifiers: w => w.type === TYPE.PURIFY && w.goal === 'in',
  // Through the door and stirring. A stirrer out dealing a dose is not at the
  // pot, so the brew clock pauses -- same rule the lab and the house keep.
  stirrers: w => w.type === TYPE.STIR && w.goal === 'in',
  // A wizard's work is four hundred pixels up and the walk is to the ground
  // under it; either way it is at the tower, which is the only thing this asks.
  wizards: w => w.type === TYPE.WIZARD,
  builders: w => w.type === TYPE.BUILD && w.goal === 'at',
  // Through the door and at the bench. A scholar crossing the yard is not doing
  // research yet, which is the same rule the purifiers keep.
  // Through the door and teaching -- the scholar's rule at the school. The
  // trades on the school's board accrue only against this. (wave6-sim, item 1)
  teachers: w => w.type === TYPE.TEACH && w.goal === 'in'
};

setHands(site => {
  const at = ARRIVED[SITE_JOB[site]];
  if (!at) return 0;
  // A builder is at *its* site and no other: three sites can be busy at once
  // and a body at the bench is not putting up the lab.
  //
  // ...and a builder standing at a station counts there too, whoever the
  // station's own gang is. The yard sends spare hands to a station with nobody
  // in it (see `busyBuilderSites`), and until they counted, the body walked
  // over, stood at the tower and did nothing: the work it had been sent for was
  // asking how many WIZARDS were there, and the answer was the nought that had
  // sent for it.
  const helping = w => w.type === TYPE.BUILD && w.goal === 'at' && w.site === site;
  // The quarry's and the farm's works are not done from the bench or the plot:
  // the work claims one of the gang and the claimed body does it from the
  // station's shed -- see shedhand.js -- so what counts here is that body
  // standing there, not the gang at its posts. The rest of the gang goes on
  // producing and none of it credits the bar. A station with no gang at all is
  // still helped by a lent builder, through `helping` above. (wave6-sim, item 2)
  const shedwork = SHED_SITES.has(site);
  const there = S.workers.filter(w => helping(w)
                                   || (shedwork ? atShed(w) && w.onBuild === site
                                               : at(w) && (w.type !== TYPE.BUILD || w.site === site))).length;
  // One pair of hands on a piece of work, whoever owns the site.
  //
  // `BUILD_GANG` already said this for the yard and the bench -- one spare body
  // is retasked to a build, not three. It did not say it for the four sites
  // that have a gang of their own: a cut with five quarriers in it took its
  // next bench out five times as fast, and the tower went up at the speed of
  // however many wizards happened to be standing in it. So the same row cost a
  // wildly different amount of time depending on which board it sat on, which
  // is not a difficulty curve, it is an accident of staffing.
  //
  // Capped here rather than in each station because this is the one function
  // that answers "how many hands are on this", and a cap written four times is
  // four things to keep in step. The gang is not idle meanwhile -- the others
  // go on quarrying, farming and scrubbing; what they no longer do is stack up
  // on the one piece of work.
  // A builder-manned site with several works on the go holds one pair of hands
  // PER WORK, because each body is at exactly one of them (see `handsOn`
  // below). Everywhere else the cap stays at one.
  const cap = builderManned(site) ? Math.max(1, worksAt(site).length) : 1;
  return Math.min(cap, there);
});

// The hands at ONE work of a site's several -- only ever asked
// about builder-manned sites, so only builders answer. A body counts toward the
// work it was given (`w.workKey`, see `slotFor` in builders.js); one with no
// key yet is still walking and counts toward nothing.
setHandsOn((site, key) =>
  S.workers.filter(w => w.type === TYPE.BUILD && w.goal === 'at'
                     && w.site === site && w.workKey === key).length);

// A build starting turns spare hands into builders and a build landing turns
// them back; both have to be walked out to the yard on the frame it happens.
setStaff(() => { rebalance(); syncWorkers(); });

export function syncWorkers() {
  // Every job, and the registry is the one list that decides whether a job
  // exists at all. A job missing from there has a count on the boards and no
  // bodies in the yard: `room[w.type]` comes back undefined, every body of that
  // type is stood down on the frame it is made, and the station runs on the
  // number alone with nobody ever walking to it. See `wanted` in crew/jobs.js.
  const want = wanted();
  // Bodies are moved between jobs, not bought and sold, so one that is stood
  // down is usually one that has just been put on something else. Whatever it
  // was carrying goes on the ground at its feet: every pixel is worth one dust
  // wherever it came from, and losing a load to a reshuffle would break that.
  const room = { ...want };                 // want, counted down as bodies are kept
  const keep = [], stood = [];
  // A body lent to a build is the one its station gives up -- `rebalance` picked
  // it for being nearest -- so it is considered last and therefore stood down
  // first. Everybody else keeps their order.
  const ordered = [...S.workers.filter(w => !w.lentFrom), ...S.workers.filter(w => w.lentFrom)];
  for (const w of ordered) (room[w.type]-- > 0 ? keep : stood).push(w);
  for (const w of stood) {
    for (let i = 0; i < (w.carry || 0); i++)
      spawnChip(w.x + WORKER / 2, S.groundY - WORKER, bell() * 0.5, -1.2, w.load?.[i] || 1);
    if (w.hasCore) {
      S.coreItem = { x: w.x, y: S.groundY - CORE_SIZE, vx: 0, vy: -1, rest: false };
      if (S.coreTaker === w) S.coreTaker = null;
    }
    // hands empty and nothing claimed, so whatever it does next it starts with
    // nothing on it
    w.carry = 0;
    w.load = [];
    w.hasCore = false;
    w.claim = -1;
    unbook(w);                     // and the room it had booked goes back
  }
  S.workers = keep;

  // count what is missing first: pushing while re-reading the length only ever
  // creates half of them
  const have = t => S.workers.filter(w => w.type === t).length;

  // A body stood down from one job while another is short of one has not been
  // sacked and replaced -- it is the same person, and it walks over. So the
  // surplus is spent before anything is made from nothing, and the only bodies
  // pushed here are the ones the crew has actually grown by.
  for (const type of TYPES) {
    for (let short = want[type] - have(type); short > 0; short--) {
      const spare = stood.shift();
      if (spare) { retask(spare, type); S.workers.push(spare); }
      else S.workers.push(Object.assign(FACTORY(type), newRecord()));
    }
  }

  // number the rock hands off so they can be spaced evenly round the rock, and
  // stagger the new ones through the swing cycle so the crew never hits as one
  let slot = 0;
  for (const w of S.workers) {
    if (w.type !== TYPE.ROCK) continue;
    w.slot = slot++;
    if (!w.next) w.next = now() + rockhandMs() * (w.slot / Math.max(1, S.rockhands));
  }

  // Nothing here hands out hats. A hat is on a head because that body walked
  // over and picked it up, and it comes off because it walked back and put it
  // down -- see `retask` and `stepKit`. A brand new body starts bare-headed and
  // goes and gets one like everybody else.
}

// --- coming back to it --------------------------------------------------------
// Bodies are not saved: the crew is a set of counts, and `syncWorkers` builds
// the people from them when the game comes back. So who was wearing what is not
// saved either, and everybody used to walk back in bare-headed with the stands
// piled high -- a shift's worth of errands to redo for nothing.
//
// The rule is the obvious one: you left them at work in it, so they are at work
// in it. Each station's hats go on that many of the bodies standing at it, and
// the rest stay on the stand. Nobody walks for these: they never took them off.
export function wearKitOnLoad() {
  for (const job of KIT_JOBS) {
    let left = hats(job);
    for (const w of S.workers) {
      if (JOB_OF[w.type] !== job) continue;
      const on = left-- > 0;
      w.trained = on;
      w.kitOf = on ? job : null;
    }
  }
}
