// The house board: who lives here.
//
// The one board that is a list of people rather than a shop, built out of the
// same rows as the shop so it reads as the same game's menu.

import { S } from './state.js';
import { inBasket } from './balloon.js';
import { houseRect } from './house.js';
import { JOB_OF as JOBS_AT } from './levels.js';
import { HOUSE_ROW } from './upgrades.js';
import { follow, atStation } from './world.js';
import { showWindow, closeWindow } from './modal.js';
import { now } from './clock.js';
import { POINT_MS } from './config.js';
import { WORKER } from './config.js';
import { JOB } from './jobs.js';
import { minding } from './crew/tenders.js';

// Where a body is, in the yard's words. Every job needs a line here: one
// without reads as `undefined` on its row.
const AT = { rockhands: 'on the rock', haulers: 'at the pit', quarriers: 'in the quarry',
             farmhands: 'at the farm plots',
             purifiers: 'at the air filter',
             janitors: 'clearing up' };

const WHERE = { lifted: 'in your hand', falling: 'in mid-air', home: 'at home',
                basket: 'up in a balloon', yard: 'in the yard',
                resting: 'on a break', walking: 'on the way' };
// Every place a body can be said to be, so the crew window can make its
// column as wide as the longest of them (`fitCrewColumn` in shop.js).
export const WHERE_WORDS = [...Object.values(WHERE), ...Object.values(AT)];

export function whereIs(w) {
  if (w.lifted) return WHERE.lifted;
  if (w.falling) return WHERE.falling;
  if (w.inside) return WHERE.home;
  // Up in a balloon is not standing anywhere: a body you cannot see in the
  // yard is a body the board has to account for.
  if (inBasket(w)) return WHERE.basket;

  // Standing on it beats what it is doing on it. A hauler is the exception:
  // it is at home everywhere, so only the doing says anything.
  const job = JOBS_AT[w.type];
  if (job !== JOB.HAUL && atStation(job, w.x + WORKER / 2)) return AT[job] || WHERE.yard;

  if (w.resting) return WHERE.resting;
  if (w.walking) return WHERE.walking;
  return AT[job] || WHERE.yard;
}

// A line a job, or a body reads a favorite of `undefined`.
const DOES = { rockhands: 'digging the rock', quarriers: 'mining the quarry',
               farmhands: 'farming', scholars: 'researching',
               purifiers: 'clearing the air',
               janitors: 'shoveling', haulers: 'transporting' };
// The tip is monospace, so a label padded to a fixed width is a column; done
// with spaces because this is one text node.
const LABEL = 10;
const NL = String.fromCharCode(10);
const row = (label, value) => `${label.padEnd(LABEL)}${value}`;

// One line a goal, read off the word the yard's own steppers set, so there is
// no second state machine to fall out of step with them.
const NOW = { seek: 'looking for pebbles', dump: 'tipping a load',
              muck: 'shoveling up mess', cut: 'digging in the quarry',
              work: 'digging in the quarry', up: 'climbing out', down: 'climbing down',
              tend: 'tending a plot', home: 'heading home', idle: 'nothing much',
              in: 'inside', aloft: 'up in the balloon' };

export function doing(w) {
  // These outrank any goal: the stepper's last word is stale for all four.
  if (w.lifted) return 'in your hand';
  if (w.falling) return 'in mid-air';
  if (w.brk || w.resting) return 'on a break';
  if (w.inside) return 'at home';
  // The tender stage is above the job and writes no goal, so a body minding
  // the belt still carries whatever goal it had before (`minding`).
  const m = minding(w);
  if (m) return `minding ${m.name}`;
  if (w.goal === 'to') return 'walking there';
  // The bench is the one site where the thing being built is not a place.
  if (w.goal === 'at') return w.site === 'bench' ? 'fitting kit at the bench' : 'building';
  return NOW[w.goal] || DOES[JOBS_AT[w.type]] || 'working';
}

// Three lines and no more: who this is and what it is doing this second. The
// crew list is where a biography belongs.
export function card(w) {
  const mins = Math.floor((w.lived || 0) / 60000);
  return [
    w.name || 'somebody',
    row('age', mins < 1 ? 'new today' : `${mins} min`),
    row('doing', doing(w))
  ].join(NL);
}

// Take the view to somebody and mark which one they are: the view follows
// the body for as long as the arrow is up, because half the crew is walking
// at any moment.
function point(w) {
  follow(w);
  w.pointed = now() + POINT_MS;
  // Picking a name is the end of reading the list: the view leaves for
  // wherever that body is, and the window would stand over the very body it
  // sent you to.
  closeWindow();
}

// Two rows only: the way through to the people at the top, the thing you buy
// at the bottom. The board comes out above the house and the cursor arrives
// from the house, so the bottom row is what the cursor crosses first, and a
// row that only puts a list up is fine to reach for while a row you came to
// press is not. Nothing the crew *use* is sold here; that is the bench
// (`SECTIONS` in upgrades.js).
export function crewRows() {
  return [CREW_ROW, HOUSE_ROW];
}

// The door through to them. Where the cost would go it says how many there are.
const CREW_ROW = {
  key: 'crewlist',
  name: 'who lives here',
  // Pressed, not hovered: the list is a window you sit and read (modal.js),
  // and a window that came up on a pass of the pointer would be in the way.
  buy: () => showWindow('crew'),
  opens: true,
  price: () => String(S.crew),
  dead: () => false,
  show: () => true,
  from: null,
  unit: null,
  cost: () => 0
};

// The people, as the rows of the sheet that opens off that, with their own
// heading so neither sheet has to know what is on the other.
export const crewList = () => people();

export const crewListSections = () => [
  { title: 'the crew', keys: S.workers.map((_, i) => `who${i}`) }
];

// One row per body, in the order they were taken on, so the name you are
// looking for stays put. Where the price would go it says where the body is.
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

// "the crew", not "the houses": both rows are about the people, and the sheet
// that opens off the door wears the same word, which is how a submenu says
// which heading it came out of.
export const crewSections = () => [
  { title: 'the crew', keys: [CREW_ROW.key, HOUSE_ROW.key] }
];
