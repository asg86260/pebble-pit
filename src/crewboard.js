// The house board: who lives here.
//
// Every other board in this game sells you something. This one sells nothing --
// it is the one place that is only a list of people, which is what the house is.
// You walk up to where the crew live and it tells you who they are, where each
// of them is standing right now, and what each of them has done since the day
// they were taken on.
//
// It is built out of the same rows as the shop for the same reason the school is:
// a row with a name on the left, a word on the right and something to say when
// you hover it is a shape this game already has, and a second one invented for
// this would read as a different game's menu.

import { S, floor, pit, outhouse } from './state.js';
import { cubes, houseLeft } from './house.js';
import { HOUSE_CUBE } from './config.js';
import { mainlyAt } from './crew.js';
import { JOB_OF as JOBS_AT, HOUSE_ROW } from './upgrades.js';
import { follow, atStation, rockLeft } from './world.js';
import { doseName, doseLeftMs, doseLive } from './apothecary.js';
import { showCrewList, standRect } from './board.js';
import { indoors } from './lab.js';
import { onTheMove } from './air.js';
import { inHouse as inScrubHouse } from './scrubhouse.js';
import { now } from './clock.js';
import { POINT_MS } from './config.js';
import { P, WORKER, SHARD_CELL, SPORE_CELL, findKind } from './config.js';

// The block, as a rectangle to stand near: what is actually built, on a plot
// that never moves.
//
// The left edge is the plot's, worked out from a full base, because the
// settlement fills its ground from one end and must not slide along it as it
// grows -- see `cubes`. Everything else is the rooms themselves. The height
// always was: a rectangle up to the sky over a settlement two rooms high would
// be a stand reaching into the air the boards hang in. The width was not, and
// it should have been the same rule -- a plot eight rooms wide with three rooms
// on it put the middle of the block out over bare ground, so the arrow that
// says there is something on this board pointed at the dirt beside the house
// rather than at the house.
export function houseRect() {
  const stack = cubes();
  const top = stack.length ? Math.min(...stack.map(c => c.y)) : S.groundY;
  const left = houseLeft();
  // The ground course is the widest -- every course above it is shorter -- so
  // the far side of the block is the far side of whichever room reaches furthest.
  const right = stack.length ? Math.max(...stack.map(c => c.x)) + HOUSE_CUBE : left;
  return { x: left, y: top, w: right - left, h: S.groundY - top };
}

// Where a body is, in the words the yard would use. Not its job -- its job is on
// the card, and the whole point of standing at the house is to find the one who
// is somewhere you did not expect.
//
// Every job the yard can put somebody on has a line here. One that did not --
// the scrubbing house was added without one -- read as `undefined` on its row,
// which is the board saying it does not know where one of its own people is.
const AT = { rockhands: 'on the rock', haulers: 'at the pit', quarriers: 'in the quarry',
             farmhands: 'at the farm plots', scholars: 'in the lab',
             purifiers: 'at the scrubbing house',
             janitors: 'clearing up' };

export function whereIs(w) {
  if (w.lifted) return 'in your hand';
  if (w.falling) return 'in mid-air';
  if (w.inside) return 'at home';
  // Through a door is not the same as standing at one, and it is the answer to
  // "where is it" for the two jobs that have a door: a body you cannot see is a
  // body the board has to account for, or you go looking for them in the yard.
  if (indoors(w)) return 'inside the lab';
  if (inScrubHouse(w)) return 'inside the scrubbing house';

  // Standing on it beats what it is doing on it. A rockhand between swings, one
  // stood about on a break, one that has just been put down -- all of them are
  // on the rock, because that is the answer to "where is it". Carrying is the
  // exception: a hauler is at home everywhere, so for that one the doing is the
  // only thing that says anything.
  const job = JOBS_AT[w.type];
  if (job !== 'haulers' && atStation(job, w.x + WORKER / 2)) return AT[job] || 'in the yard';

  if (w.resting) return 'on a break';
  if (w.walking) return 'on the way';
  return AT[job] || 'in the yard';
}

// What it would say it does, not where it happens to be. A body is one of five
// things all day, and the one it has been the longest is the one worth naming.
// A line a job, for the same reason: a body who has spent all day in the
// scrubbing house does not have a favourite of `undefined`, and it does not
// have one of `transporting` either.
const DOES = { rockhands: 'mining the rock', quarriers: 'quarrying',
               farmhands: 'farming', scholars: 'researching',
               purifiers: 'clearing the air',
               janitors: 'shovelling', haulers: 'transporting' };
const tally = n => Math.round(n || 0).toLocaleString('en-US');

// Rows, not a sentence. A card you have to read is a card you read once; a card
// laid out in a column is one you can glance at with somebody in your hand and
// take in without stopping. The tip is monospace, so a label padded to a fixed
// width is a column -- the same trick the shop rows use, done with spaces
// because this is one text node and not five.
const LABEL = 10;
const NL = String.fromCharCode(10);
const row = (label, value) => `${label.padEnd(LABEL)}${value}`;

// What is in its hands right now. A core outranks dust because a body carrying
// one is doing something you would want to know about.
// What is in its hands, as the mark and the number -- the same shorthand the
// counter uses, so a card and the counter say the same thing the same way. A
// core outranks dust because a body carrying one is worth knowing about.
// A load is a stack of grains, and the grains are not all the same thing: a
// hauler that swept the yard is carrying dust and whatever the sites turned up
// in it. Rolling that to one number lost the shard in the middle of it, so each
// kind is counted and named by its own mark -- the same marks the counter uses,
// so the card and the counter say the same thing the same way.
const KIND_MARK = [[0, '■'], [SHARD_CELL, '▲'], [SPORE_CELL, '⬢']];

function cargo(w) {
  const held = new Map();
  for (const v of w.load || []) {
    const k = findKind(v);
    held.set(k, (held.get(k) || 0) + 1);
  }
  // a body with a count but no list of what is in it is carrying plain dust
  if (!held.size && w.carry) held.set(0, Math.round(w.carry));

  const out = KIND_MARK.filter(([k]) => held.get(k))
                       .map(([k, mark]) => `${mark} ${tally(held.get(k))}`);
  if (w.hasCore) out.push('◯ 1');
  return out.length ? out.join('  ') : 'nothing';
}

// --- what it is up to, and where it is going -----------------------------------
// `favorite` above is what a body has done all day; these two are this second.
// Both were readable off the yard by watching, and only by watching: the crew
// all look the same and half of them are walking at any moment, so "why is that
// one going that way" had no answer short of following it across the yard.
//
// A destination is an x -- `routeTo` is a number -- and a number is not an
// answer to "where is it going". So a place is named the way the yard already
// names places: the buildings by the same rects that decide where you stand to
// open their boards, the rest by the ground itself.
const NAMED = { bench: 'the bench', school: 'the school',
                casino: 'the casino', tower: 'the tower' };

// The stations a job is *at*, asked with the yard's own question. `atStation`
// is what says whether a body counts as being at its work, spans and all --
// the farm is its plots and not just its shed, the quarry is the cut -- so a
// place named any other way here would disagree with the board about where
// somebody is standing the moment a plot was bought.
const JOB_PLACE = [['rockhands', 'the rock'], ['quarriers', 'the quarry'],
                   ['farmhands', 'the farm'], ['scholars', 'the lab'],
                   ['purifiers', 'the scrubbing house']];

function placeAt(x) {
  for (const [job, name] of JOB_PLACE) if (atStation(job, x)) return name;
  for (const key in NAMED) {
    const r = standRect(key);
    if (r && x > r.x - P * 6 && x < r.x + r.w + P * 6) return NAMED[key];
  }
  if (S.outhouseOpen && x > outhouse.x - P * 4 && x < outhouse.x + outhouse.w + P * 4)
    return 'the closet';
  const h = houseRect();
  if (h.w && x > h.x - P * 4 && x < h.x + h.w + P * 4) return 'the houses';
  if (x > pit.x - P * 4 && x < pit.x + pit.w + P * 4) return 'the hole';
  return 'the yard';
}

// One line a goal. `goal` is the word the yard's own steppers set on a body --
// there is no second state machine here to fall out of step with them, which is
// the whole reason this reads off `goal` rather than off a guess made from
// where the body happens to be standing.
const NOW = { seek: 'looking for dust', dump: 'tipping a load',
              muck: 'shovelling up mess', cut: 'working the cut',
              work: 'working the cut', up: 'climbing out', down: 'climbing down',
              tend: 'tending a plot', home: 'heading home', idle: 'nothing much',
              in: 'inside', aloft: 'up in the balloon' };

function doing(w) {
  // The four that outrank any goal: a body in your hand, in the air, on a break
  // or through its own front door is not doing its job whatever the stepper
  // last wrote on it.
  if (w.lifted) return 'in your hand';
  if (w.falling) return 'in mid-air';
  if (w.brk || w.resting) return 'on a break';
  if (w.inside) return 'at home';
  if (w.goal === 'to') return 'walking there';
  // At a site: what is being put up says more than the word "working". The
  // bench is the one site where the thing being built is not a place.
  if (w.goal === 'at') return w.site === 'bench' ? 'fitting kit at the bench' : 'building';
  return NOW[w.goal] || DOES[JOBS_AT[w.type]] || 'working';
}

// Where the walk ends, when there is something to name. A destination is an x,
// and every job keeps its own: a route remembers what it was a route to, and
// the jobs that walk without one (a hauler's day is walking) are heading for
// the grain they claimed or the lip they tip it over. Read off the fields the
// steppers already set, so there is no second copy of anybody's plans here to
// fall out of step with the first.
function targetOf(w) {
  if (w.route && w.routeTo != null) return w.routeTo;
  if (w.goal === 'dump') return pit.x;
  if (w.goal === 'seek' && w.claim >= 0) return floor.x + w.claim * P;
  if (w.goal === 'muck' && w.muckAt != null) return w.muckAt;
  if (w.goal === 'home') return houseRect().x;
  return w.routeTo ?? null;
}

// Moving, asked of the yard rather than guessed from a goal: `onTheMove` is the
// same test the dust makes before it kicks up at somebody's feet. A goal says
// what a body is trying to do and not whether its feet are going anywhere -- a
// hauler scooping a column and a hauler crossing the yard to reach it are both
// 'seek' -- and the card should say "staying put" for the first.
const walking = w => !w.lifted && !w.falling && onTheMove(w);

const heading = w => {
  if (!walking(w)) return 'staying put';
  const to = targetOf(w);
  // Moving with nothing named to move towards -- a farmhand ambling the last
  // few cells to the next plot. Saying so beats naming the ground it is
  // standing on and beats claiming it has stopped.
  return to == null ? 'on the move' : placeAt(to);
};

export function card(w) {
  const mins = Math.floor((w.lived || 0) / 60000);
  const does = DOES[mainlyAt(w)] || 'transporting';
  return [
    w.name || 'somebody',
    row('age', mins < 1 ? 'new today' : `${mins} min`),
    row('favorite', does),
    // This second, above the day's tally: what you hover a moving body to
    // find out is what it is doing now, not what it has done since breakfast.
    row('doing', doing(w)),
    row('heading', heading(w)),
    row('mined', tally(w.mined)),
    row('quarried', tally(w.quarried)),
    row('farmed', tally(w.farmed)),
    row('stored', tally(w.stored)),
    // Only the ones whose job is carrying. A rockhand's hands are always empty
    // between swings, and a row that says nothing every time you read it is a
    // row that trains you to stop reading.
    ...(JOBS_AT[w.type] === 'haulers' ? [row('carrying', cargo(w))] : []),
    // What it is under, and how long it has left. The mark on the body across
    // the yard says *that* a tonic is on it; this row is where you read the
    // *what*. Only a body actually under one gets the row -- see the apothecary.
    ...(doseLive(w) ? [row('under', `${doseName(w)}, ${Math.ceil(doseLeftMs(w) / 1000)}s`)] : [])
  ].join(NL);
}

// Taking the view to somebody, and saying which one they are when it gets
// there. The view on its own is not an answer: a dozen bodies of the same size
// doing the same thing, and the one you asked for somewhere among them. So the
// one you asked for wears an arrow for a few seconds.
//
// And the view goes with them rather than to where they were: half this crew is
// walking at any moment, and a hauler asked for at the pit is at the rock by
// the time the glide gets there. The view keeps pace for as long as the arrow
// is up, so the two of them say the same thing -- that one, there.
function point(w) {
  follow(w);
  w.pointed = now() + POINT_MS;
  // and the list has done its job, so it folds away.
  //
  // Picking a name is the end of reading the list, not a step in it: the view
  // leaves for wherever that body is working, and a sheet of names left standing
  // over the walk is a sheet about a place you are no longer looking at. The
  // board it came out of stays -- you may want the next name -- and it closes on
  // its own once the pointer follows the view away from the house.
  showCrewList(false);
  S.dirty = true;
}

// One row per body, in the order they were taken on, so the list is the same
// list every time you open it and the name you are looking for stays put.
//
// A row is not a purchase and has no price: where the cost would go it says
// where that body is, which is the one number on this board that moves. Clicking
// it takes the view to them -- a list of names is a list of names, and the thing
// you actually want after reading one is to go and look at them.

// The one thing this board sells. It is the only purchase in the game that is
// made where the thing bought appears: the settlement is drawn straight off the
// headcount, so putting another house up and taking somebody on are one act, and
// standing at the houses to do it is the game showing you what your dust bought.
//
// Two rows, and only two: what you can put up, and the way through to who is
// already in it. The board used to be the buy row with the whole crew poured out
// underneath it, which is fine at four bodies and nonsense at twenty -- a column
// of names taller than the window, standing on the ground the house is standing
// on, with the one row you can actually press hiding at the top of it. The names
// are a list you go and read; the block is a thing you buy.
// The way through to the people is at the *top* of the sheet and the thing you
// buy is at the bottom, which is the wrong way round to read and the right way
// round to use. The board comes out above the house and the cursor arrives from
// the house, so whatever is on the bottom row is what the cursor crosses first
// -- and with the door down there, every walk up to the block to put another one
// up went through the settlement on the way and threw the sheet open sideways.
// A row that only puts a list up is a fine thing to have to reach for; a row you
// came to press is not.
export function crewRows() {
  return [CREW_ROW, HOUSE_ROW];
}

// The door through to them. It is priced like the rows below it are -- where the
// cost would go it says how many there are, which is the number you would have
// counted off the list anyway, and now do not have to.
const CREW_ROW = {
  key: 'crewlist',
  name: 'who lives here',
  // Hovering it is what opens the list, because hovering is what opens
  // everything else in this game: you walk up to a station and its board comes
  // out. The press is here for a finger, which cannot hover -- and it shuts the
  // list again, because a finger has no way to walk away from one either.
  over: () => showCrewList(true),
  buy: () => showCrewList(!S.crewListOpen),
  price: () => String(S.crew),
  dead: () => false,
  show: () => true,
  from: null,
  unit: null,
  cost: () => 0
};

// The people, as the rows of the sheet that opens off that. Their own list and
// their own heading, so neither this nor the board it hangs off has to know what
// is on the other one.
export const crewList = () => people();

export const crewListSections = () => [
  { title: 'the crew', keys: S.workers.map((_, i) => `who${i}`) }
];

// The people are their own list, so the buy row above can be added without this
// having to know about it.
function people() {
  return S.workers.map((w, i) => ({
    key: `who${i}`,
    name: w.name || 'somebody',
    note: () => card(w),
    price: () => whereIs(w),
    dead: () => false,
    show: () => true,
    buy: () => point(w),
    from: null,
    unit: null,
    cost: () => 0
  }));
}

// Two headings: what you can put up, and who is already living in it. The people
// are not cut up by job -- that would put the same body under a different word
// every time it was moved -- but a purchase is not a person, and a row you can
// spend dust on sitting unlabelled next to one is a row you press by accident.
//
// The second heading is still here now that the names have moved off this board:
// the sheet that opens off it wears the same word at the top, which is how a
// submenu says which heading it came out of.
export const crewSections = () => [
  { title: 'the crew', keys: [CREW_ROW.key] },
  { title: 'the block', keys: [HOUSE_ROW.key] }
];
