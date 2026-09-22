// Works in progress: the things the yard is in the middle of building.
//
// Time is a price like the rest of them, paid in worker-seconds by somebody
// standing at the place it is happening. A building nobody is working on does
// not go up (DESIGN.md, "Time is a price").
//
// This file holds what is on the go and the rules about it. It does not know
// who any of the bodies are: crew.js registers the one thing only it can
// answer, how many pairs of hands are at a site this frame.

import { S, bench, lab, filter, tower, shack } from './state.js';
import { P, HOUSE_CUBE, WORK_BASE, WORK_STEP, BUILD_EFFORT } from './config.js';
import { JOB } from './jobs.js';
import { sfx } from './audio.js';

// Where a row's work stands, and therefore whose hands do it: the yard's spare
// hands (`builders` in crew.js) everywhere a station's own gang is at a post.
export const SITE_JOB = {
  // A spare hand at the shed, not one of the station's own gang: a body at its
  // post is a body the player put there to produce, and a one-body gang with
  // a load in its hands never qualified, so the claim could stall for good.
  quarry: JOB.BUILD,
  farm: JOB.BUILD,
  apothecary: JOB.BUILD,
  // The purifier's post and the wizard's are where they work, so crediting
  // them had the fan rung fill while the filter scrubbed and the hat rise
  // while the wizard cast: a rung for free.
  filter: JOB.BUILD,
  tower: JOB.BUILD,
  yard: JOB.BUILD,
  // The bench's own ladders, fitted at the bench: the one site where what is
  // being built is not a place but a thing about somebody.
  bench: JOB.BUILD,
  lab: JOB.SCHOLAR,
  // The rock's gang is capped at one by the ram and had nobody to spare; a
  // carrier off the dust is a cost the yard can always pay.
  shack: JOB.BUILD
};

// --- what a site can take, and how fast ----------------------------------------
// Both defaulted so a station that says nothing behaves like every other.
//
//   room    how many works it can have on the go at once. One everywhere, two
//           at a lab with a second bench.
//   effort  worker-seconds a pair of hands puts in per second. `BUILD_EFFORT`
//           everywhere, and the lab's own pace at the lab, which is what its
//           `labkit` ladder buys.
//   started what to do when one begins here. The lab alone wants this: it
//           calls back the bodies it let out of an empty room.
//
// Registered by the station rather than imported from it: works.js is read by
// every board in the game and may not read one back.
const SITE_SAYS = {};
export const roomAt = site => Math.max(1, Math.round(SITE_SAYS[site]?.room?.() ?? 1));
export const effortAt = site => Math.max(0, SITE_SAYS[site]?.effort?.() ?? BUILD_EFFORT);

export const SITES = Object.keys(SITE_JOB);

// Which row opens which place on the ground, keyed as `SITES` in config.js
// is. The yard remembers the order these are bought in, so `placeSites` can
// walk the table in that order. Exported so render.js can tell which place a
// `kind: 'building'` work on the yard is raising.
export const OPENS_PLACE = {
  unlockshack: 'shack',
  unlockouthouse: 'outhouse',
  unlockquarry: 'quarry', unlockfarm: 'farm', unlocklab: 'lab',
  unlockfilter: 'filter', unlockcasino: 'casino', unlocktower: 'tower',
  unlockapothecary: 'apothecary'
};
// The sites with no gang of their own, worked by whoever is spare, and by
// whoever is nearest when nobody is (`rebalance` in upgrades.js).
export const BUILDER_SITES = SITES.filter(site => SITE_JOB[site] === JOB.BUILD);

// "Empty" is whether that job has ANYBODY on it, not how busy anybody is: a
// cut with quarriers in it digs its own bench however long they take, and a
// cut with nobody in it would otherwise take your spores and sit there for
// the rest of the run. The tower's first hat is the same case: before there
// is a wizard there is nobody up there.
const noGang = site => !(S[SITE_JOB[site]] > 0);

// A station with a gang raises its own work, so nobody is lent to it.
export const builderManned = site => SITE_JOB[site] === JOB.BUILD;

export const busyBuilderSites = () =>
  SITES.filter(site => busyAt(site) && (SITE_JOB[site] === JOB.BUILD || noGang(site)));

// Where a station itself stands, for a body walking to a work that is not a
// building going up somewhere new. Wired in game.js to the same `stationFoot`
// the boards use, so there is no second answer to disagree with it.
let footHook = () => null;
export const setFoot = fn => { footHook = fn; };

export const siteX = site => {
  const w = workAt(site);
  if (!w) return null;
  if (w.at != null) return w.at;
  if (site === 'bench') return bench.x + bench.w / 2;
  // Without this a spare hand sent to help at a station had nowhere to walk
  // to and the work sat at nought forever.
  return footHook(site);
};

// How many pairs of hands are at a site this frame. crew.js sets it; until it
// does, nothing is anywhere, which is right for a check that has not built a
// yard.
let handsHook = () => 0;
export const setHands = fn => { handsHook = fn; };
export const handsAt = site => Math.max(0, handsHook(site) | 0);

// How many of them are at ONE work of the site's several: a builder is given
// a work, not just a site. Null until crew.js wires it, in which case the site
// total is shared out.
let handsOnHook = null;
export const setHandsOn = fn => { handsOnHook = fn; };
export const handsOn = (site, key) =>
  handsOnHook ? Math.max(0, handsOnHook(site, key) | 0) : null;

// A build starting makes spare hands into builders and a build landing makes
// them spare again; both have to happen on the frame it changes or the site
// stands there with nobody at it.
let staffHook = () => {};
export const setStaff = fn => { staffHook = fn; };

// Who lays the ground when the order the yard was bought in changes: this file
// knows what happened and nothing about where anything stands. Wired in
// game.js, the one file that imports both.
let groundHook = () => {};
export const setGround = fn => { groundHook = fn; };

// Who says so when one lands. Wired in game.js.
let doneHook = () => {};
export const setDone = fn => { doneHook = fn; };

// --- the rows themselves ------------------------------------------------------
// Which row a work belongs to, so a work coming out of a save (a key and two
// numbers, because a function is not a thing you can write down) knows what
// to do when it finishes. Each board hands its own list in at the bottom of
// its own file: works.js is imported *by* the boards, so it cannot import
// them back.
let ROWS = [];
export const registerRows = list => { ROWS = ROWS.concat(list); };
export const rowFor = key => ROWS.find(u => u.key === key) || null;

// The works, on the save (persist.js, `SAVERS`): what the yard is partway
// through building, a list a site, and the order its buildings went up in.
export const SAVE = {
  fields: ['works', 'buildOrder'],
  write(out) {
    // Worker-seconds rather than a deadline: `now()` starts wherever the
    // page started, so an absolute time saved in one session means nothing
    // in the next.
    out.works = S.works;
    out.buildOrder = S.buildOrder || [];
  },
  read(s) {
    // Empty is the fixed order. `placeSites` (world.js) drops an
    // unrecognized key, since it already knows which keys are real places.
    S.buildOrder = Array.isArray(s.buildOrder) ? s.buildOrder.filter(k => typeof k === 'string') : [];
    // A list a site. Only rows the board still sells, each under the site
    // its row says today, so a work whose row has moved sites does not come
    // back blocking a site that is not there.
    S.works = {};
    for (const [site, list] of Object.entries(s.works || {})) {
      if (!Array.isArray(list)) continue;
      for (const w of list) {
        if (!(w && w.key && rowFor(w.key) && w.of > 0)) continue;
        const home = rowFor(w.key).site || site;
        if (!SITES.includes(home)) continue;
        (S.works[home] ||= []).push({ key: w.key, done: Math.max(0, Math.min(w.of, w.done || 0)),
                                      of: w.of, at: w.at ?? null });
      }
    }
  },
  blank() {
    S.works = {};
    S.buildOrder = [];
  }
};

// --- what a thing takes -------------------------------------------------------
// One table off the kind of thing a row sells, climbing with the rung the way
// the price does. Read it as "how long with one pair of hands on it".
//
// A row may carry its own `work: () => seconds` instead: the house has a rung
// in all but name (how many rooms already stand) and no rung of its own to
// read it off.
export const workFor = u =>
  u.work ? Math.round(u.work()) :
  Math.round((WORK_BASE[u.kind] || 0) * Math.pow(WORK_STEP, u.rung ? u.rung() : 0));

// A row with no `kind` is bought and had: the bench's own ladders, the
// casino's decisions, a dial.
export const takesTime = u => !!u.kind && workFor(u) > 0;

// --- the ground a site's work is on ---------------------------------------------
// One answer for the tape drawn round a build, the bar hung over it and the
// patch the builder swings across: three answers put the builder hammering
// off to the left of the zone it was fencing. A station IS its own box; the
// yard's slot is whatever is being put up there, which the row itself names.
const YARD_ROW_SITE = {
  house: 'house', unlockshack: 'shack', unlockouthouse: 'outhouse',
  unlockquarry: 'quarry', unlockfarm: 'farm',
  unlocklab: 'lab', unlockcasino: 'casino', unlocktower: 'tower', unlockfilter: 'filter',
  unlockapothecary: 'apothecary'
};

// Every site with work needs a box here, or `barSpot` answers null and the
// work goes on with no bar anywhere.
//
// The quarry's, the farm's and the apothecary's boxes are their sheds, not
// their ground: the shed is where the board opens, the bar hangs, the tape
// goes and the spare hand stands. The sheds are wired in from game.js
// (`setSheds`): world.js and apothecary.js both import this file, so naming
// them here reads them before they exist.
const SITE_BOX = { filter: () => filter, tower: () => tower, bench: () => bench,
                   lab: () => lab, shack: () => shack };
export const setSheds = sheds => Object.assign(SITE_BOX, sheds);

// Every room the settlement will have once the one going up lands, the same
// way `nextHouseAt` in house.js asks.
const risingRooms = () => {
  const today = S.crew > 0 ? S.crew + 1 : 0;
  return houseRooms(today + (S.crew > 0 ? 1 : 2));
};
let houseRooms = () => [];
export const setRooms = fn => { houseRooms = fn; };

// `which` names one particular work on a yard holding several: the fence, the
// bar and the builder for the SECOND thing going up must stand on the second
// thing's ground. Left out, it is the head work.
export function siteBox(site, which = null) {
  const box = SITE_BOX[site]?.();
  if (box) return { x: box.x, w: box.w, y: box.y, h: box.h };
  if (site !== 'yard') return null;
  const w = which || workAt(site);
  if (!w) return null;
  // The settlement grows a room at a time, so its ground is the rooms it will
  // have once this one lands, not the street reserved for all of them.
  if (w.key === 'house') {
    const rooms = risingRooms();
    if (rooms.length) {
      const left = Math.min(...rooms.map(r => r.x));
      const right = Math.max(...rooms.map(r => r.x)) + HOUSE_CUBE;
      const top = Math.min(...rooms.map(r => r.y));
      return { x: left, w: right - left, y: top, h: S.groundY - top };
    }
  }
  // A row that knows its own ground says so: the belt is a run from the
  // rock's right edge to the pit's lip, and the guess below would center its
  // bar on `w.at`, the tail of the run, inside the boulder.
  const boxed = rowFor(w.key)?.box?.();
  if (boxed) return boxed;
  const placed = S.placed && S.placed[YARD_ROW_SITE[w.key]];
  if (placed) return { x: placed.x, w: placed.w, y: placed.y, h: placed.h };
  // A yard row this table does not know: a guess centered on where the row
  // said it would stand.
  const x = w.at ?? S.cx;
  return { x: x - P * 6, w: P * 12 };
}

// --- what is on the go --------------------------------------------------------
// A site builds as many as it has room for and the rest wait in line, paid
// for now and built in turn (DESIGN.md, "The queue"). The save, the report
// and the count on a card mean this whole list.
export const worksAt = site => S.works?.[site] || [];
// The front of it, being built now: the only ones that get hands, a bar, a
// fence or a body walking over.
export const onTheGo = site => worksAt(site).slice(0, roomAt(site));
// The rest, in the order they will be built, at nought until then.
export const inLine = site => worksAt(site).slice(roomAt(site));
// "The" work at a site, for callers asking about a site with room for one.
export const workAt = site => worksAt(site)[0] || null;
export const workOn = key => SITES.flatMap(worksAt).find(w => w && w.key === key) || null;
export const busyAt = site => worksAt(site).length > 0;
// The bodies on this work's patch right now, for the tile that bought it
// (DESIGN.md, "A hand on the tile"). Read off the bodies each frame, so the
// tile shows a hand only while the site has one.
export const bodiesOn = key => S.workers.filter(w => w.jigAt != null && w.workKey === key);
// Where a work stands in its site's list, counting the front as one, so the
// first behind it is 2, which is what "2nd" in its tag means. Nought for a
// work the site does not have.
export const placeOf = (site, key) => worksAt(site).findIndex(w => w.key === key) + 1;
export const waiting = (site, key) => placeOf(site, key) > roomAt(site);
// Only what says where a new work goes; nothing is greyed on it.
export const fullAt = site => worksAt(site).length >= roomAt(site);

// how far along it is, 0..1 -- for a bar over the site
export const progressOf = w => (w && w.of > 0 ? Math.min(1, w.done / w.of) : 0);
// One particular work's, for a site with several: each rising building is
// clipped to ITS work's progress, not the head's.
export const progressOfKey = (site, key) =>
  progressOf(worksAt(site).find(w => w.key === key) || null);

// What is left of a work, in milliseconds. With nobody on it, the one-body
// figure rather than forever: "never" reads as broken, and how long it would
// take with somebody on it is the decision the number informs.
export const leftAt = (site, key = null) => {
  const list = worksAt(site);
  const w = key ? list.find(x => x.key === key) || list[0] : list[0];
  if (!w) return 0;
  // At this site's own pace: a clock on a lab row that quoted the yard's plain
  // effort would be quoting somebody else's day.
  const rate = Math.max(1, handsAt(site)) * effortAt(site);
  return Math.max(0, (w.of - w.done) * 1000 / rate);
};

// and whether anybody is actually on it, for the row to say so
export const stalled = site => busyAt(site) && handsAt(site) < 1;

// A place claims its ground in the walk. Idempotent: a place already in the
// order is left where it is, so the order is the order things were BOUGHT and
// never shuffles under a yard that is standing.
function reserve(key) {
  const opened = OPENS_PLACE[key] || (key === 'house' ? 'house' : null);
  if (!opened || S.buildOrder.includes(opened)) return;
  S.buildOrder = [...S.buildOrder, opened];
  groundHook();
}

// Start one, or put it in line if the site is already building as much as it
// can.
export function start(site, u, at) {
  if (!site) return false;
  const was = fullAt(site);
  (S.works[site] ||= []).push({ key: u.key, done: 0, of: workFor(u), at: at ?? null });
  // The ground is spoken for the moment it is paid for, not when the thing
  // lands: the walk is laid out in the order places were bought (`siteOrder`
  // in world.js), and a place not yet in that order was laid at the end of
  // the walk, so the whole building jumped across the yard when it finished.
  reserve(u.key);
  // A full site has nothing new starting; `started` is said when the work
  // reaches the front (`stepWorks`). The staff hook is still asked, because a
  // card has a name to add.
  if (!was) SITE_SAYS[site]?.started?.();
  staffHook();
  return true;
}

// Take a work out of the line, unbuilt. Only a waiting one: a work being built
// has hands on it and is committed. What is handed back is the row's business
// (`buy` in upgrades.js).
export function pullOut(site, key) {
  if (!waiting(site, key)) return false;
  const list = worksAt(site);
  list.splice(list.findIndex(w => w.key === key), 1);
  staffHook();
  return true;
}

// Put one down unfinished, with nothing built and nothing handed back. The lab
// alone offers this.
export function abandonAt(site, key = null) {
  const list = worksAt(site);
  // `0` for "the first one" of an empty list is a truthy index that splices
  // nothing and answers yes, which is a caller in a `while` that never ends.
  if (!list.length) return false;
  const i = key ? list.findIndex(w => w.key === key) : 0;
  if (i < 0) return false;
  list.splice(i, 1);
  staffHook();
  return true;
}

// --- one frame of it ----------------------------------------------------------
// `done` is worker-seconds: a site with three pairs of hands puts three
// seconds of work in every second, and a site with none puts in nothing.
// What a finished work *does* stays in the row's own `buy`.
export function stepWorks(dt) {
  for (const site of SITES) {
    const list = worksAt(site);
    if (!list.length) continue;
    const hands = handsAt(site);
    // Only the front of the line is worked; the rest stand at nought.
    const going = Math.min(list.length, roomAt(site));
    // The hands are shared out over what is on the go: two benches with one
    // scholar between them is one scholar's work spread over both.
    const each = hands / going;
    // A builder-manned site does not spread: a body is at ONE work (`slotFor`
    // in crew/builders.js), so each work moves by the hands actually at it,
    // and a queued build with nobody at it stands at nought instead of
    // creeping along at a fraction. The lab keeps the spread.
    const manned = builderManned(site);
    const effort = effortAt(site);
    // Backwards, because a finished work is spliced out of the list it is being
    // walked.
    for (let i = going - 1; i >= 0; i--) {
      const w = list[i];
      const own = manned ? handsOn(site, w.key) : null;
      const share = own != null ? Math.min(1, own) : each;
      if (share > 0) w.done += share * effort * (dt / 1000);
      // A work that is already through lands whether or not anybody is
      // standing there this frame (`__finish` fills the work in and asks for
      // exactly this).
      if (w.done < w.of) continue;
      // Asked before the splice, because where a yard work stands is read off
      // the work itself.
      const box = siteBox(site, w);
      sfx('work-land', { x: box ? box.x + box.w / 2 : (w.at ?? S.cx), big: true });
      list.splice(i, 1);
      // For a row that opens a place, the view gliding to the thing just put
      // up is the whole of the announcement.
      rowFor(w.key)?.buy();
      // Ordinarily already done at `start`; kept for a work that was on the go
      // in a save written before ground was reserved at purchase. Laid again
      // HERE, on the frame the order changes: `layPiles` answers from a cached
      // key, so left for the next walk it was left for the next reload.
      reserve(w.key);
      doneHook(site, w.key);
      // The next in line is told it has started, exactly as if bought into an
      // empty site, and the builder this landing freed takes it (`siteFor` in
      // crew/builders.js).
      if (list.length >= roomAt(site)) SITE_SAYS[site]?.started?.();
      staffHook();
    }
  }
}

// --- the mark a finished work leaves -------------------------------------------
// The announcing, as against what the row does: a rung usually lands while
// you are looking somewhere else, so every site leaves a tick over its
// building until its board is read. The yard's own builds are the exception:
// a building arriving is its own announcement, and the yard has no box to
// center a tick on.
export function workFinished(site, key) {
  if (site === 'yard') return;
  // Everything landed since the board was read, oldest first: the stack over
  // the station shows them all, ticked, in the order they landed. A fresh
  // array, as `markRowSeen` writes one, for the save.
  S.siteDone[site] = [...doneAt(site), key];
  // The tile wears the turned-down corner of a card never seen until hovered
  // (`markRowSeen` in shop.js): the tick says a board has something, the
  // corner says which tile. A fresh array, as `markRowSeen` writes one: the
  // save notices a new array where it can miss a splice.
  if (S.seenRows.includes(key)) S.seenRows = S.seenRows.filter(k => k !== key);
}

// What a site has finished and not yet shown, oldest first.
export const doneAt = site => S.siteDone?.[site] || [];

// what finished at a site, in the words the rows used
export const doneName = site => {
  const names = doneAt(site).map(key => rowFor(key)?.name).filter(Boolean);
  return names.length ? `${names.join(', ')} done` : 'work done';
};

// and reading that station's board is what clears its mark
export function markDoneSeen(site) {
  if (!doneAt(site).length) return;
  delete S.siteDone[site];
}
