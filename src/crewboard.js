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

import { S } from './state.js';
import { cubes, houseLeft } from './house.js';
import { HOUSE_CUBE } from './config.js';
import { JOB_OF as JOBS_AT, HOUSE_ROW } from './upgrades.js';
import { follow, atStation } from './world.js';
import { showCrewList } from './board.js';
import { inHouse as inScrubHouse } from './scrubhouse.js';
import { now } from './clock.js';
import { POINT_MS } from './config.js';
import { WORKER } from './config.js';
import { JOB } from './jobs.js';

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
             farmhands: 'at the farm plots',
             purifiers: 'at the scrubbing house',
             janitors: 'clearing up' };

export function whereIs(w) {
  if (w.lifted) return 'in your hand';
  if (w.falling) return 'in mid-air';
  if (w.inside) return 'at home';
  // Through a door is not the same as standing at one, and it is the answer to
  // "where is it" for the two jobs that have a door: a body you cannot see is a
  // body the board has to account for, or you go looking for them in the yard.
  if (inScrubHouse(w)) return 'inside the scrubbing house';

  // Standing on it beats what it is doing on it. A rockhand between swings, one
  // stood about on a break, one that has just been put down -- all of them are
  // on the rock, because that is the answer to "where is it". Carrying is the
  // exception: a hauler is at home everywhere, so for that one the doing is the
  // only thing that says anything.
  const job = JOBS_AT[w.type];
  if (job !== JOB.HAUL && atStation(job, w.x + WORKER / 2)) return AT[job] || 'in the yard';

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
// Rows, not a sentence. A card you have to read is a card you read once; a card
// laid out in a column is one you can glance at with somebody in your hand and
// take in without stopping. The tip is monospace, so a label padded to a fixed
// width is a column -- the same trick the shop rows use, done with spaces
// because this is one text node and not five.
const LABEL = 10;
const NL = String.fromCharCode(10);
const row = (label, value) => `${label.padEnd(LABEL)}${value}`;

// One line a goal. `goal` is the word the yard's own steppers set on a body --
// there is no second state machine here to fall out of step with them, which is
// the whole reason this reads off `goal` rather than off a guess made from
// where the body happens to be standing.
const NOW = { seek: 'looking for pebbles', dump: 'tipping a load',
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

// wave7-crew, item 17: three lines and no more. The card used to carry the
// favorite, the heading, four tallies and the cargo, and a card that long is a
// card you stop reading -- the crew list is where a biography belongs. What a
// hover answers is who this is and what it is doing this second.
export function card(w) {
  const mins = Math.floor((w.lived || 0) / 60000);
  return [
    w.name || 'somebody',
    row('age', mins < 1 ? 'new today' : `${mins} min`),
    row('doing', doing(w))
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
// Nothing the crew *use* is sold here any more. Their ladders -- strength,
// speed, the harness, the boots -- were here once and went back to the bench,
// and the belt, its tuning and the multiplier over their pace have followed:
// the house is where you put a roof up and take somebody on, and a shelf of
// machinery beside that was a second kind of thing on a sheet that only needs
// one. The haulers' whole kit is one heading on the bench now, where your own
// is. See `SECTIONS` in upgrades.js.
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

// Two headings: what you can build, and who is already living in it. The people
// are not cut up by job -- that would put the same body under a different word
// every time it was moved -- but a purchase is not a person, and a row you can
// spend dust on sitting unlabelled next to one is a row you press by accident.
//
// The second heading is still here now that the names have moved off this board:
// the sheet that opens off it wears the same word at the top, which is how a
// submenu says which heading it came out of.
export const crewSections = () => [
  { title: 'the crew', keys: [CREW_ROW.key] },
  { title: 'housing', keys: [HOUSE_ROW.key] }
];
