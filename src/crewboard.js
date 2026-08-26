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
import { HOUSE_COLS, HOUSE_CUBE } from './config.js';
import { mainlyAt } from './crew.js';
import { JOB_OF as JOBS_AT } from './upgrades.js';
import { follow, atStation } from './world.js';
import { indoors } from './lab.js';
import { inHouse as inScrubHouse } from './scrubhouse.js';
import { now } from './clock.js';
import { POINT_MS } from './config.js';
import { WORKER, SHARD_CELL, SPORE_CELL, findKind } from './config.js';

// The block, as a rectangle to stand near. Worked out from a full base rather
// than from what is built, like everything else about this place: the plot is
// the plot whether there are two rooms on it or twenty.
export function houseRect() {
  const stack = cubes();
  const top = stack.length ? Math.min(...stack.map(c => c.y)) : S.groundY;
  return { x: houseLeft(), y: top,
           w: HOUSE_COLS * HOUSE_CUBE, h: S.groundY - top };
}

// Where a body is, in the words the yard would use. Not its job -- its job is on
// the card, and the whole point of standing at the house is to find the one who
// is somewhere you did not expect.
//
// Every job the yard can put somebody on has a line here. One that did not --
// the scrubbing house was added without one -- read as `undefined` on its row,
// which is the board saying it does not know where one of its own people is.
const AT = { miners: 'on the rock', haulers: 'at the pit', quarriers: 'in the quarry',
             farmhands: 'at the farm plots', labbers: 'in the lab',
             scrubbers: 'at the scrubbing house' };

export function whereIs(w) {
  if (w.lifted) return 'in your hand';
  if (w.falling) return 'in mid-air';
  if (w.inside) return 'at home';
  // Through a door is not the same as standing at one, and it is the answer to
  // "where is it" for the two jobs that have a door: a body you cannot see is a
  // body the board has to account for, or you go looking for them in the yard.
  if (indoors(w)) return 'inside the lab';
  if (inScrubHouse(w)) return 'inside the scrubbing house';

  // Standing on it beats what it is doing on it. A miner between swings, one
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
const DOES = { miners: 'mining the rock', quarriers: 'quarrying',
               farmhands: 'farming', labbers: 'researching',
               scrubbers: 'clearing the air', haulers: 'transporting' };
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

export function card(w) {
  const mins = Math.floor((w.lived || 0) / 60000);
  const does = DOES[mainlyAt(w)] || 'transporting';
  return [
    w.name || 'somebody',
    row('age', mins < 1 ? 'new today' : `${mins} min`),
    row('favorite', does),
    row('mined', tally(w.mined)),
    row('quarried', tally(w.quarried)),
    row('farmed', tally(w.farmed)),
    row('stored', tally(w.stored)),
    // Only the ones whose job is carrying. A miner's hands are always empty
    // between swings, and a row that says nothing every time you read it is a
    // row that trains you to stop reading.
    ...(JOBS_AT[w.type] === 'haulers' ? [row('carrying', cargo(w))] : [])
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
  S.dirty = true;
}

// One row per body, in the order they were taken on, so the list is the same
// list every time you open it and the name you are looking for stays put.
//
// A row is not a purchase and has no price: where the cost would go it says
// where that body is, which is the one number on this board that moves. Clicking
// it takes the view to them -- a list of names is a list of names, and the thing
// you actually want after reading one is to go and look at them.
export function crewRows() {
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

// No headings: this is one list of people, and cutting it up by job would put
// the same body under a different word every time it was moved.
export const crewSections = () => [{ title: 'the crew', keys: S.workers.map((_, i) => `who${i}`) }];
