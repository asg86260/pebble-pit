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

import { S, bench, quarry, farm, lab, scrub, tower, apothecary, school, shack } from './state.js';
import { P, HOUSE_CUBE, WORK_BASE, WORK_STEP, BUILD_EFFORT } from './config.js';
import { JOB } from './jobs.js';
import { sfx } from './audio.js';

// Where a row's work stands, and therefore whose hands do it.
//
// Four of the sites have a gang of their own and the work is theirs: quarriers
// take out the next bench, farmhands break the next furrow, the purifiers fit
// the bigger fan, the wizards raise what the tower raises. That is the whole
// cost of it -- a station building its own upgrade is a station not producing
// while it does, which is the same bargain every other decision in this game
// makes.
//
// The school and everything on the bench have no gang, because the thing being
// built is not standing there yet. Those go to the yard, and the yard's spare
// hands walk over and put it up. See `builders` in crew.js.
export const SITE_JOB = {
  quarry: JOB.QUARRY,
  farm: JOB.FARM,
  scrub: JOB.PURIFY,
  tower: JOB.WIZARD,
  yard: JOB.BUILD,
  // The bench's own ladders, fitted at the bench: the one site where what is
  // being built is not a place but a thing about somebody.
  bench: JOB.BUILD,
  // The school's training, taught by the teacher. It was `JOB.BUILD` -- taught
  // by whoever was spare -- which left the training grounds the one station
  // with no post on the boards and no body of its own through the door. The
  // school *building* is still put up by the yard's spare hands: `unlockschool`
  // is a yard row, so this line was never about the construction. And a school
  // with no teacher assigned is still lent a spare hand, the same as the
  // tower's first hat -- see `busyBuilderSites`. (wave6-sim, item 1)
  school: JOB.TEACH,
  // And the lab, which used to run a building site of its own behind the same
  // door: its own clock, its own bar, its own two save fields. A piece of
  // research is a thing somebody stands there and works at, which is what every
  // row in this file already was.
  lab: JOB.SCHOLAR,
  // The apothecary, whose gang is its stirrers. Its rungs are built by its own
  // hands the way the plots break the next furrow; the brewing itself is an
  // upkeep stepped in apothecary.js, not a one-shot work here.
  apothecary: JOB.STIR,
  // The shack, worked by the yard's spare hands: a hauler walks over, stands
  // at the hut while the bar fills, and goes back to the dust. It was the
  // rock's own gang (`JOB.ROCK`, through the shed claim in shedhand.js), and
  // that stalled twice over -- a gang capped at one by the ram had nobody to
  // spare, and a claimed rockhand walking to the hut could be stood down on
  // the way and never arrive, so the row took your spores and sat at nought.
  // The rock's gang has no post to leave and nothing to carry; the cost of a
  // pick is a carrier off the dust, which the yard can always pay. This is the
  // shack's slice of "Every station's work is done by a spare hand" in
  // DESIGN.md; the quarry, the farm and the apothecary still keep the claim.
  shack: JOB.BUILD
};

// --- what a site can take, and how fast ----------------------------------------
// Two things a site may say about itself, both defaulted so that a station which
// says nothing behaves exactly as every station did before there was anything to
// say.
//
//   room    how many works it can have on the go at once. One, everywhere, and
//           two at a lab with a second bench -- "one work per site" was never a
//           rule about sites, it was the number one written into the code in
//           place of a station's own answer.
//   effort  worker-seconds a pair of hands puts in per second. One everywhere
//           (`BUILD_EFFORT`), and the lab's own pace at the lab, which is what
//           its `labkit` ladder has always been buying.
//   started what to do when one begins here. The lab alone wants this: it calls
//           back the bodies it let out of an empty room, because the reason
//           they left has just gone away.
//
// Registered by the station rather than imported from it: works.js is read by
// every board in the game and may not read one back.
const SITE_SAYS = {};
export const registerSite = (site, says) => { SITE_SAYS[site] = { ...SITE_SAYS[site], ...says }; };
export const roomAt = site => Math.max(1, Math.round(SITE_SAYS[site]?.room?.() ?? 1));
export const effortAt = site => Math.max(0, SITE_SAYS[site]?.effort?.() ?? BUILD_EFFORT);

export const SITES = Object.keys(SITE_JOB);

// Which row opens which place on the ground -- the same keys `SITES` in
// config.js is laid out by, not the job-sites above. See C7 in
// wave-feedback3.md: the yard remembers the order these are bought in, so
// `placeSites` can walk the table in that order instead of a fixed one.
// Exported so that render.js can tell which place, if any, a `kind: 'building'`
// work on the yard is actually raising -- see #3, "Wave 3.1".
export const OPENS_PLACE = {
  unlockshack: 'shack',
  unlockouthouse: 'outhouse', unlockschool: 'school',
  unlockquarry: 'quarry', unlockfarm: 'farm', unlocklab: 'lab',
  unlockscrub: 'scrub', unlockcasino: 'casino', unlocktower: 'tower',
  unlockapothecary: 'apothecary'
};
// The sites with no gang of their own, worked by whoever is spare -- and by
// whoever is nearest, when nobody is. See `rebalance` in upgrades.js.
export const BUILDER_SITES = SITES.filter(site => SITE_JOB[site] === JOB.BUILD);

// Where the yard's spare hands are needed. The two sites that have no gang of
// their own -- the yard and the bench -- and any station standing empty.
//
// "Empty" is the whole of the second clause, and it is not about how busy
// anybody is: it is whether that job has ANYBODY on it. A cut with quarriers in
// it digs its own bench, however long they take, and the yard does not quietly
// cover for a gang that is merely busy elsewhere. A cut with nobody in it is a
// different thing -- there is no gang to do it, ever -- and the purchase would
// otherwise take your spores and sit there for the rest of the run with nothing
// to show and nothing said.
//
// The tower's first hat is the same case rather than a special one: a wizard is
// what the tower's own gang is made of, so before there is one there is nobody
// up there, and whoever is spare goes and does it.
const noGang = site => !(S[SITE_JOB[site]] > 0);

// A site the builders man: the ones with no gang of their own. A station with a
// gang raises its own work, so nobody is lent to it.
export const builderManned = site => SITE_JOB[site] === JOB.BUILD;

export const busyBuilderSites = () =>
  SITES.filter(site => busyAt(site) && (SITE_JOB[site] === JOB.BUILD || noGang(site)));

// And where a station itself stands, for a body walking to a work that is not a
// building going up somewhere new. Wired in game.js to the same `stationFoot`
// the boards use, so a body walks to the place you walk to -- rather than to a
// second answer kept here that could disagree with it.
let footHook = () => null;
export const setFoot = fn => { footHook = fn; };

export const siteX = site => {
  const w = workAt(site);
  if (!w) return null;
  if (w.at != null) return w.at;
  if (site === 'bench') return bench.x + bench.w / 2;
  // The station's own front. Without this a body sent to help at a station --
  // the yard's spare hands making the tower's first hat -- had nowhere to walk
  // to and the work sat there at nought for ever.
  return footHook(site);
};

// How many pairs of hands are at a site this frame. crew.js sets it; until it
// does, nothing is anywhere -- which is the right answer for a check that has
// not built a yard.
let handsHook = () => 0;
export const setHands = fn => { handsHook = fn; };
export const handsAt = site => Math.max(0, handsHook(site) | 0);

// wave7b-build: and how many of them are at ONE work of the site's several. A
// builder is given a work, not just a site, so two things rising on the yard at
// once each move only while its own body is present. Null until crew.js wires
// it, in which case the site total is shared out the old way.
let handsOnHook = null;
export const setHandsOn = fn => { handsOnHook = fn; };
export const handsOn = (site, key) =>
  handsOnHook ? Math.max(0, handsOnHook(site, key) | 0) : null;

// ...and putting the crew back where the change leaves them. A build starting is
// what makes spare hands into builders, and a build landing is what makes them
// spare again -- neither is a thing this file can do, and both have to happen on
// the frame it changes or the site stands there with nobody at it.
let staffHook = () => {};
export const setStaff = fn => { staffHook = fn; };

// And who lays the ground when the order the yard was bought in changes. Same
// shape as `setStaff` and for the same reason: this file knows what happened
// and nothing about where anything stands, and world.js knows the walk. Wired
// in game.js, which is the one file that already imports both.
let groundHook = () => {};
export const setGround = fn => { groundHook = fn; };

// And who says so when one lands. The lab puts a mark over its door -- a piece
// of research is worked on behind it, so the bar everybody else watches is not
// the announcement there. One hook, wired in game.js beside the rest.
let doneHook = () => {};
export const setDone = fn => { doneHook = fn; };

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

// --- the ground a site's work is on ---------------------------------------------
// One answer, and everything that has to know reads it: the barriers and the
// tape drawn round a build, the bar hung over it, and the patch the builder
// swings its hammer across.
//
// It used to be three answers. `siteFoot` in render.js fenced the ground and
// widened the settlement by the room about to go up; `buildFoot` in crew.js
// looked the same slot up in `S.placed` and got the whole reserved street; the
// bar had a table of its own. So the tape, the body and the bar could each be
// somewhere different, and on the settlement they were: the builder hammered
// off to the left of the zone it was fencing.
//
// A station IS its own box. The yard's slot is whatever is being put up there,
// which the row itself names.
const YARD_ROW_SITE = {
  house: 'house', unlockshack: 'shack', unlockouthouse: 'outhouse', unlockschool: 'school',
  unlockquarry: 'quarry', unlockfarm: 'farm',
  unlocklab: 'lab', unlockcasino: 'casino', unlocktower: 'tower', unlockscrub: 'scrub',
  unlockapothecary: 'apothecary'
};

// The shack is in it so its bar has a roof to hang over: `barSpot` reads the
// site's box, and a site missing here answered null -- so the rock's rows were
// worked at the hut with no bar anywhere while they were.
const SITE_BOX = { quarry, farm, scrub, tower, bench, lab, apothecary, school, shack };

// Every room the settlement will have once the one going up lands -- one more
// than today's count, the same way `nextHouseAt` in house.js asks.
const risingRooms = () => {
  const today = S.crew > 0 ? S.crew + 1 : 0;
  return houseRooms(today + (S.crew > 0 ? 1 : 2));
};
let houseRooms = () => [];
export const setRooms = fn => { houseRooms = fn; };

// `which` names one particular work on the yard, for a yard holding several at
// once (wave7b-build): the fence, the bar and the builder for the SECOND thing
// going up must all stand on the second thing's ground, not the head work's.
// Left out, it is the head work, which is what every one-work caller means.
export function siteBox(site, which = null) {
  const box = SITE_BOX[site];
  if (box) return { x: box.x, w: box.w, y: box.y, h: box.h };
  if (site !== 'yard') return null;
  const w = which || workAt(site);
  if (!w) return null;
  // The settlement is the one thing that does not arrive at its full size: it
  // grows a room at a time, so the ground it covers is the rooms it will have
  // once this one lands rather than the street reserved for all of them.
  if (w.key === 'house') {
    const rooms = risingRooms();
    if (rooms.length) {
      const left = Math.min(...rooms.map(r => r.x));
      const right = Math.max(...rooms.map(r => r.x)) + HOUSE_CUBE;
      const top = Math.min(...rooms.map(r => r.y));
      return { x: left, w: right - left, y: top, h: S.groundY - top };
    }
  }
  // A row that knows its own ground says so. The machines are yard rows whose
  // thing is not a placed site -- the belt is a run from the rock's right edge
  // to the pit's lip -- and without this they fell through to the guess below,
  // which centered the belt's bar on `w.at`: the tail of the run, inside the
  // boulder. The row's `box` is the machine's own extent, so the bar lands over
  // the middle of what is being built. (feedback6 item 6)
  const boxed = rowFor(w.key)?.box?.();
  if (boxed) return boxed;
  const placed = S.placed && S.placed[YARD_ROW_SITE[w.key]];
  if (placed) return { x: placed.x, w: placed.w, y: placed.y, h: placed.h };
  // A yard row this table does not know about yet: a guess centred on where the
  // row said it would stand, rather than nothing at all.
  const x = w.at ?? S.cx;
  return { x: x - P * 6, w: P * 12 };
}

// --- what is on the go --------------------------------------------------------
// One work per site at a time, and the rest wait in line. The cut builds one
// thing at a time, and so do the plots, the school, the scrubbing house and the
// tower -- but you may buy the next before this one lands. "One work per site,
// and it is not a queue" stood here for a year, on the argument that waiting is
// a decision; the decision was always the spend, and the wait was a board you
// came back to on a timer. See DESIGN.md, "The queue".
// Everything at a site, oldest first: the ones being built and the ones behind
// them. The save, the report and the count on a card mean this whole list.
export const worksAt = site => S.works?.[site] || [];
// The front of it, being built now: as many as the site has room for -- one,
// everywhere, unless a site says otherwise -- and these are the only ones that
// get hands, a bar, a fence or a body walking over.
export const onTheGo = site => worksAt(site).slice(0, roomAt(site));
// ...and the rest, in the order they will be built, at nought until then.
export const inLine = site => worksAt(site).slice(roomAt(site));
// The one at the front of it. Every caller that asks about "the" work at a site
// -- the rising building, the bar over the yard, the row on a board -- is asking
// about a site with room for one, where this is the whole of what is being built.
export const workAt = site => worksAt(site)[0] || null;
export const workOn = key => SITES.flatMap(worksAt).find(w => w && w.key === key) || null;
export const busyAt = site => worksAt(site).length > 0;
// Where a work stands in its site's list, counting the front as one -- so the
// first behind it is 2, which is what "in line (2)" on its row means. Nought for
// a work the site does not have.
export const placeOf = (site, key) => worksAt(site).findIndex(w => w.key === key) + 1;
// Whether a work is waiting rather than being built.
export const waiting = (site, key) => placeOf(site, key) > roomAt(site);
// Whether the site is building as much as it can. The board used to grey every
// other row on this; now it is only what says where a new work goes.
export const fullAt = site => worksAt(site).length >= roomAt(site);

// how far along it is, 0..1 -- for a bar over the site
export const progressOf = w => (w && w.of > 0 ? Math.min(1, w.done / w.of) : 0);
export const progressAt = site => progressOf(workAt(site));
// ...and one particular work's, by key, for a site with several on the go --
// each rising building is clipped to ITS work's progress, not the head's.
export const progressOfKey = (site, key) =>
  progressOf(worksAt(site).find(w => w.key === key) || null);

// What is left of a work, in milliseconds, at the rate it is actually going.
//
// With nobody on it that is the one-body figure rather than for ever: a row
// saying "never" is a row that reads as broken, and the honest thing to tell you
// is how long it would take if you put somebody on it -- which is the decision
// the number is there to inform.
export const leftAt = (site, key = null) => {
  const list = worksAt(site);
  const w = key ? list.find(x => x.key === key) || list[0] : list[0];
  if (!w) return 0;
  // A hand's worth, at this site's own pace. The lab's ladder makes its people
  // quicker at research, and a clock on a lab row that quoted the yard's plain
  // effort would be quoting somebody else's day.
  const rate = Math.max(1, handsAt(site)) * effortAt(site);
  return Math.max(0, (w.of - w.done) * 1000 / rate);
};

// and whether anybody is actually on it, for the row to say so
export const stalled = site => busyAt(site) && handsAt(site) < 1;

// Start one -- or put it in line, if the site is already building as much as
// it can. Either way it is paid for now and built in its turn.
// A place claims its ground in the walk. Idempotent: a place already in the
// order is left where it is, so the order is the order things were BOUGHT and
// never shuffles under a yard that is standing.
function reserve(key) {
  const opened = OPENS_PLACE[key] || (key === 'house' ? 'house' : null);
  if (!opened || S.buildOrder.includes(opened)) return;
  S.buildOrder = [...S.buildOrder, opened];
  groundHook();
}

export function start(site, u, at) {
  if (!site) return false;
  const was = fullAt(site);
  (S.works[site] ||= []).push({ key: u.key, done: 0, of: workFor(u), at: at ?? null });
  // The ground is spoken for the moment it is paid for, not when the thing
  // lands on it.
  //
  // The walk is laid out in the order places were bought (`siteOrder` in
  // world.js), and a place that had been paid for but not finished was not in
  // that order yet -- so it was laid down at the *end* of the walk, which is
  // where the barriers went up, where the builder stood, and where the bar
  // hung. The moment it finished it took its real slot and the whole building
  // jumped across the yard. The farm was the one you could not miss.
  //
  // Reserved here, the zone and the finished building are the same ground by
  // construction, and there is nothing left to teleport.
  reserve(u.key);
  // A site that was already building as much as it could has nothing new
  // starting: the work is in line, and `started` is said for it when it reaches
  // the front (see `stepWorks`). The staff hook is still asked, because a card
  // has a name to add.
  if (!was) SITE_SAYS[site]?.started?.();
  staffHook();
  S.dirty = true;
  return true;
}

// Take a work out of the line, unbuilt. Only a waiting one: a work being built
// has hands on it and a bar over it, and is committed. What is handed back for
// it is the row's business (`buy` in upgrades.js), not this file's.
export function pullOut(site, key) {
  if (!waiting(site, key)) return false;
  const list = worksAt(site);
  list.splice(list.findIndex(w => w.key === key), 1);
  staffHook();
  S.dirty = true;
  return true;
}

// Put one down unfinished, with nothing built and nothing handed back. The lab
// alone offers this -- a piece of research you have changed your mind about --
// and it is here rather than in lab.js because dropping a work is works.js's
// business whoever asks for it.
export function abandonAt(site, key = null) {
  const list = worksAt(site);
  // A site with nothing on it has nothing to put down -- and `0` for "the first
  // one" of an empty list is a truthy index that splices nothing and answers
  // yes, which is a caller in a `while` that never ends.
  if (!list.length) return false;
  const i = key ? list.findIndex(w => w.key === key) : 0;
  if (i < 0) return false;
  list.splice(i, 1);
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
    const list = worksAt(site);
    if (!list.length) continue;
    const hands = handsAt(site);
    // Only the front of the line is worked. The ones behind it stand at nought
    // -- no share of the hands, however many there are -- until one lands and
    // the next steps up.
    const going = Math.min(list.length, roomAt(site));
    // The hands are shared out over what is on the go rather than every piece
    // getting the whole gang. Two benches with one scholar between them is one
    // scholar's work being done, spread over both -- which is what a person
    // moving between two benches looks like from outside.
    const each = hands / going;
    // wave7b-build: a builder-manned site does not spread its hands over the
    // queue -- a body is at ONE work (see `slotFor` in crew/builders.js), so
    // each work moves by the hands actually at it, and a queued build with
    // nobody at it stands at nought instead of creeping along at a fraction.
    // The lab keeps the spread: a scholar between two benches is one scholar's
    // work being done over both, which is what that looks like from outside.
    const manned = builderManned(site);
    const effort = effortAt(site);
    // Backwards, because a finished work is spliced out of the list it is being
    // walked.
    for (let i = going - 1; i >= 0; i--) {
      const w = list[i];
      const own = manned ? handsOn(site, w.key) : null;
      const share = own != null ? Math.min(1, own) : each;
      // Nobody there, nothing done. That is the whole of the mechanic: an empty
      // cut builds nothing however long you leave it.
      if (share > 0) w.done += share * effort * (dt / 1000);
      // ...but a work that is already through lands whether or not anybody is
      // standing there this frame. The last body walking off on the frame the
      // work completes is not a reason to leave a finished thing unbuilt, and a
      // check that fills the work in and asks for it (see `__finish`) is asking
      // for exactly this.
      if (w.done < w.of) continue;
      // The thing comes down on its ground. Asked before the splice, because
      // where a yard work stands is read off the work itself.
      const box = siteBox(site, w);
      sfx('wood', { x: box ? box.x + box.w / 2 : (w.at ?? S.cx), big: true, cls: 'punct' });
      list.splice(i, 1);
      // The row's own `buy` is what a finished work does -- which for a row that
      // opens a place is the view gliding to the thing that has just been put
      // up, and that is the whole of the announcement.
      rowFor(w.key)?.buy();
      // And the yard remembers it broke this ground, so that this place stands
      // where it was bought relative to the rest rather than where the fixed
      // table always put it. Laid again HERE, on the frame the order changes:
      // left for the next walk to notice it was left for the next reload, since
      // `layPiles` answers from a cached key and nothing in that key had moved.
      // Ordinarily already done, at the moment it was paid for -- see `reserve`
      // in `start`. Kept for the work that was already on the go when a save
      // written before that was loaded, which has ground reserved for nobody.
      reserve(w.key);
      // What just landed, for the yard to say so. The lab has always put a mark
      // up when a piece of research came out from behind its door; every other
      // site has a bar you were watching. Kept here so the announcing is the
      // works' business rather than each station's.
      doneHook(site, w.key);
      // The next in line is on the go from this frame: it is told it has
      // started, exactly as it would have been had it been bought into an empty
      // site, and the builder this landing freed takes it (`siteFor` in
      // crew/builders.js picks the emptiest work being built).
      if (list.length >= roomAt(site)) SITE_SAYS[site]?.started?.();
      staffHook();
      S.dirty = true;
    }
  }
}

// --- the mark a finished work leaves -------------------------------------------
// What a site does when one of its works lands, which is not what the row does:
// the row's own `buy` is the rung going up. This is the announcing. It was the
// lab's alone -- its work happened behind a door -- but a rung landing anywhere
// usually lands while you are looking somewhere else, so every site leaves the
// same tick over its building until its board is read. Wired in game.js through
// `setDone`.
//
// It lived in lab.js, and moved here with the lab's deletion: a mark over a
// station is a fact about a site, and sites are this file's business.
//
// The yard's own builds are the exception: a building arriving is its own
// announcement -- it is standing there -- and a tick centered on the camera (the
// yard has no box until something is rising) said nothing.
export function workFinished(site, key) {
  if (site !== 'yard') S.siteDone[site] = key;
}

// what finished at a site, in the words the row used
export const doneName = site => {
  const u = rowFor(S.siteDone[site]);
  return u ? `${u.name} done` : 'work done';
};

// and reading that station's board is what clears its mark
export function markDoneSeen(site) {
  if (!S.siteDone[site]) return;
  delete S.siteDone[site];
  S.dirty = true;
}
