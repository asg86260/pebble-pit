// The crew, kept to the counts: who the yard has, who it is short of, and who is
// actually standing at a site rather than merely assigned to one.

import { WORKER, CORE_SIZE } from '../config.js';
import { S } from '../state.js';
import { spawnChip, bell } from '../dust.js';
import { setHands, setHandsOn, setStaff, onTheGo, builderManned } from '../works.js';
import { JOB_OF, hats, rockhandMs } from '../levels.js';
import { rebalance } from '../staffing.js';
import { KIT_JOBS } from '../kit.js';
import { TYPE } from '../jobs.js';
import { now } from '../clock.js';
import { newRecord } from './records.js';
import { retask } from './commute.js';
import { unbook } from './hole.js';
import { FACTORY, TYPES, wanted } from './jobs.js';

// --- who is actually at a site ------------------------------------------------
// The one question works.js cannot answer for itself: a count is not a body,
// and a site idles until somebody is *actually standing there*. Arrived, not
// assigned, and at *its* site: a builder still crossing the yard, or standing
// at the next station over, puts in nothing.
const building = site => w => w.type === TYPE.BUILD && w.goal === 'at' && w.site === site;

setHands(site => {
  // The sphere's rung is poured by whoever is up on the ring pouring: the
  // tender, the one body that can reach it.
  if (site === 'sphere')
    return Math.min(1, S.workers.filter(w => w.type === TYPE.WIZARD && w.aloft && w.channel).length);
  if (!builderManned(site)) return 0;
  // One pair of hands per work on the go, because each body is at exactly one
  // of them (`handsOn`); a gang of spare hands at one work is still one.
  return Math.min(Math.max(1, onTheGo(site).length), S.workers.filter(building(site)).length);
});

// The hands at ONE work of a site's several; only builders answer. A body
// with no `workKey` yet is still walking and counts toward nothing.
setHandsOn((site, key) =>
  S.workers.filter(w => w.type === TYPE.BUILD && w.goal === 'at'
                     && w.site === site && w.workKey === key).length);

// A build starting turns spare hands into builders and a build landing turns
// them back; both have to be walked out to the yard on the frame it happens.
setStaff(() => { rebalance(); syncWorkers(); });

export function syncWorkers() {
  // The registry is the one list that decides whether a job exists at all
  // (`wanted` in crew/jobs.js).
  const want = wanted();
  // A body stood down is usually one just put on something else. Whatever it
  // was carrying goes on the ground at its feet: every pixel is worth one
  // dust wherever it came from.
  const room = { ...want };                 // want, counted down as bodies are kept
  const keep = [], stood = [];
  // A body lent to a build is the one its station gives up, so it is
  // considered last and therefore stood down first.
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

  // A body stood down while another job is short is the same person, and it
  // walks over: the surplus is spent before anything is made from nothing.
  const joined = new Set();
  for (const type of TYPES) {
    for (let short = want[type] - have(type); short > 0; short--) {
      const spare = stood.shift();
      const w = spare || Object.assign(FACTORY(type), newRecord());
      if (spare) retask(spare, type);
      S.workers.push(w);
      joined.add(w);
    }
  }

  // number the rock hands off so they can be spaced evenly round the rock, and
  // stagger the ones who have just joined through the swing cycle so the crew
  // never hits as one. Only those: a swing not yet due is `next` 0 too, and
  // re-timed here it would move every time the yard is read back.
  let slot = 0;
  for (const w of S.workers) {
    if (w.type !== TYPE.ROCK) continue;
    w.slot = slot++;
    if (joined.has(w)) w.next = now() + rockhandMs() * (w.slot / Math.max(1, S.rockhands));
  }

  // Nothing here hands out hats: a hat is on a head because that body walked
  // over and picked it up (`retask`, `stepKit`).
}

// --- coming back to it --------------------------------------------------------
// Bodies are not saved, so neither is who was wearing what. You left them at
// work in it, so they are at work in it: each station's hats go on that many
// of the bodies standing at it, and nobody walks for these.
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
