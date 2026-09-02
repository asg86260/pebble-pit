// Works in progress: the things the yard is in the middle of building.
//
// Everything past the bench used to be bought the way you buy anything in a
// menu -- watch a number climb, press once, and the thing is simply *there*.
// The yard had no idea anything had been built. Two rows in the whole game knew
// better: the lab's research, which somebody has to stand there and do, and the
// tower's hat, which takes two minutes -- and both of them are the most
// interesting purchases in the game for exactly that reason. The waiting is what
// makes the choice a choice. While the cut is going down a bench it is not doing
// anything else, and you had to decide that was the thing worth the yard's time.
//
// So time is a price like the rest of them, and it is paid the way the lab's is:
// in worker-seconds, by somebody standing at the place it is happening. A
// building nobody is working on does not go up. See DESIGN.md, "Time is a
// price".
//
// This file holds what is on the go and the rules about it. It does not know who
// any of the bodies are -- crew.js registers the one thing only it can answer,
// which is how many pairs of hands are actually at a site this frame, the same
// way the machines ask about their tenders.

import { S, bench } from './state.js';
import { WORK_BASE, WORK_STEP, BUILD_EFFORT } from './config.js';

// Where a row's work stands, and therefore whose hands do it.
//
// Four of the sites have a gang of their own and the work is theirs: quarriers
// take out the next bench, farmhands break the next furrow, the scrubbers fit
// the bigger fan, the wizards raise what the tower raises. That is the whole
// cost of it -- a station building its own upgrade is a station not producing
// while it does, which is the same bargain every other decision in this game
// makes.
//
// The school and everything on the bench have no gang, because the thing being
// built is not standing there yet. Those go to the yard, and the yard's spare
// hands walk over and put it up. See `builders` in crew.js.
export const SITE_JOB = {
  quarry: 'quarriers',
  farm: 'farmhands',
  scrub: 'scrubbers',
  tower: 'wizards',
  yard: 'builders',
  // The bench's own ladders, fitted at the bench: the one site where what is
  // being built is not a place but a thing about somebody.
  bench: 'builders'
};

export const SITES = Object.keys(SITE_JOB);

// Which row opens which place on the ground -- the same keys `SITES` in
// config.js is laid out by, not the job-sites above. See C7 in
// wave-feedback3.md: the yard remembers the order these are bought in, so
// `placeSites` can walk the table in that order instead of a fixed one.
// Exported so that render.js can tell which place, if any, a `kind: 'building'`
// work on the yard is actually raising -- see #3, "Wave 3.1".
export const OPENS_PLACE = {
  unlockouthouse: 'outhouse', unlockschool: 'school',
  unlockquarry: 'quarry', unlockfarm: 'farm', unlocklab: 'lab',
  unlockscrub: 'scrub', unlockcasino: 'casino', unlocktower: 'tower'
};
// The sites with no gang of their own, worked by whoever is spare -- and by
// whoever is nearest, when nobody is. See `rebalance` in upgrades.js.
export const BUILDER_SITES = SITES.filter(site => SITE_JOB[site] === 'builders');
export const busyBuilderSites = () => BUILDER_SITES.filter(site => busyAt(site));

// Where a site's work stands, for a body walking to it. A row that opens a
// place says where its place will be; the bench is the bench; the rest have
// nowhere in particular and a body already in the yard is at work where it is.
export const siteX = site => {
  const w = workAt(site);
  if (!w) return null;
  if (w.at != null) return w.at;
  return site === 'bench' ? bench.x + bench.w / 2 : null;
};

// How many pairs of hands are at a site this frame. crew.js sets it; until it
// does, nothing is anywhere -- which is the right answer for a check that has
// not built a yard.
let handsHook = () => 0;
export const setHands = fn => { handsHook = fn; };
export const handsAt = site => Math.max(0, handsHook(site) | 0);

// ...and putting the crew back where the change leaves them. A build starting is
// what makes spare hands into builders, and a build landing is what makes them
// spare again -- neither is a thing this file can do, and both have to happen on
// the frame it changes or the site stands there with nobody at it.
let staffHook = () => {};
export const setStaff = fn => { staffHook = fn; };

// --- the rows themselves ------------------------------------------------------
// Which row a work belongs to, so a work coming out of a save -- which is a key
// and two numbers, because a function is not a thing you can write down -- knows
// what to do when it finishes.
//
// Each board hands its own list in at the bottom of its own file. That is the
// only shape that does not put a list of eight imports somewhere: works.js is
// imported *by* the boards, so it cannot import them back, and a registry in
// shop.js would tie the yard's building to the drawing of a menu.
let ROWS = [];
export const registerRows = list => { ROWS = ROWS.concat(list); };
export const rowFor = key => ROWS.find(u => u.key === key) || null;

// --- what a thing takes -------------------------------------------------------
// One table, off the kind of thing a row sells, climbing with the rung the way
// the price does. Not a number hand-tuned per row: a constant a case is the bug
// rather than the fix, and thirteen of them is thirteen things to keep in step
// with a ladder that might grow a sixth rung tomorrow.
//
// Read it as "how long with one pair of hands on it". Three quarriers in the cut
// take a bench out in a third of the time, which is what a gang is for.
//
// A row may carry its own `work: () => seconds` instead of leaning on
// `WORK_BASE`/`WORK_STEP` -- one hook on the general function, not a special
// case inside it. See #8, "Wave 3.1" amendment: the house has a rung in all
// but name (how many rooms already stand) and no rung of its own to read it
// off, so it supplies the curve itself rather than getting the one flat
// number every other `kind: 'building'` row shares.
export const workFor = u =>
  u.work ? Math.round(u.work()) :
  Math.round((WORK_BASE[u.kind] || 0) * Math.pow(WORK_STEP, u.rung ? u.rung() : 0));

// Whether a row is one the yard has to build at all. A row with no `kind` is
// bought and had -- the bench's own ladders, the casino's decisions, a dial.
export const takesTime = u => !!u.kind && workFor(u) > 0;

// --- what is on the go --------------------------------------------------------
// One work per site, and it is not a queue. The cut builds one thing at a time,
// and so do the plots, the school, the scrubbing house and the tower: a queue
// you fire and forget is not a decision, and the lab has had this rule since the
// day it opened -- one piece per bench, and the second bench is a purchase.
export const workAt = site => S.works?.[site] || null;
export const workOn = key => SITES.map(workAt).find(w => w && w.key === key) || null;
export const busyAt = site => !!workAt(site);

// how far along it is, 0..1 -- for a bar over the site
export const progressAt = site => {
  const w = workAt(site);
  return w && w.of > 0 ? Math.min(1, w.done / w.of) : 0;
};

// What is left of a work, in milliseconds, at the rate it is actually going.
//
// With nobody on it that is the one-body figure rather than for ever: a row
// saying "never" is a row that reads as broken, and the honest thing to tell you
// is how long it would take if you put somebody on it -- which is the decision
// the number is there to inform.
export const leftAt = site => {
  const w = workAt(site);
  if (!w) return 0;
  const rate = Math.max(1, handsAt(site)) * BUILD_EFFORT;
  return Math.max(0, (w.of - w.done) * 1000 / rate);
};

// and whether anybody is actually on it, for the row to say so
export const stalled = site => busyAt(site) && handsAt(site) < 1;

// Start one. Nothing happens if the site already has something on it -- the
// board greys the row for that reason, but the board is not the only way in
// here, and one guard at the door is cheaper than thirteen.
export function start(site, u, at) {
  if (!site || busyAt(site)) return false;
  S.works[site] = { key: u.key, done: 0, of: workFor(u), at: at ?? null };
  staffHook();
  S.dirty = true;
  return true;
}

// --- one frame of it ----------------------------------------------------------
// `done` is worker-seconds, so a site with three pairs of hands on it puts three
// seconds of work in every second. A site with none puts in nothing at all, and
// that is the whole of the mechanic: an empty cut builds nothing, however long
// you leave it.
//
// What a finished work *does* is the row's own business and stays in the row's
// own `buy` -- so a row still describes one thing and does it in one function,
// and the waiting is not written into thirteen of them.
export function stepWorks(dt) {
  for (const site of SITES) {
    const w = S.works[site];
    if (!w) continue;
    const hands = handsAt(site);
    // Nobody there, nothing done. That is the whole of the mechanic: an empty
    // cut builds nothing however long you leave it.
    if (hands > 0) w.done += hands * BUILD_EFFORT * (dt / 1000);
    // ...but a work that is already through lands whether or not anybody is
    // standing there this frame. The last body walking off on the frame the
    // work completes is not a reason to leave a finished thing unbuilt, and a
    // check that fills the work in and asks for it (see `__finish`) is asking
    // for exactly this.
    if (w.done < w.of) continue;
    delete S.works[site];
    // The row's own `buy` is what a finished work does -- which for a row that
    // opens a place is the view gliding to the thing that has just been put up,
    // and that is the whole of the announcement. There is no mark to come and
    // look at afterwards the way the lab has one: the lab's work is behind a
    // door and this is not, so the bar over the site has been saying it for the
    // whole of the build.
    rowFor(w.key)?.buy();
    // And the yard remembers it broke this ground, so the next time the table
    // is walked -- which is the next reload, not this frame; nothing here
    // moves anything already standing -- this one stands where it was bought
    // relative to the rest, not where the fixed table always put it.
    const opened = OPENS_PLACE[w.key];
    if (opened && !S.buildOrder.includes(opened)) S.buildOrder = [...S.buildOrder, opened];
    staffHook();
    S.dirty = true;
  }
}
