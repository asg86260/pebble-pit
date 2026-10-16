// The house board: who lives here.
//
// The one board that is a list of people rather than a shop, built out of the
// same rows as the shop so it reads as the same game's menu.

import { msg } from './lang.js';
import { S } from './state.js';
import { inBasket } from './balloon.js';
import { houseRect, housed } from './house.js';
import { JOB_OF as JOBS_AT } from './levels.js';
import { HOUSE_ROW } from './upgrades.js';
import { follow, atStation } from './world.js';
import { showWindow, closeWindow } from './modal.js';
import { now } from './clock.js';
import { POINT_MS } from './config.js';
import { WORKER } from './config.js';
import { JOB } from './jobs.js';
import { minding } from './crew/tenders.js';
import { bodyName } from './wardrobe.js';
import { openWardrobe } from './wardrobepage.js';

// Where a body is, in the yard's words. Every job needs a line here: one
// without reads as `undefined` on its row.
const AT = { rockhands: msg('crew-at-rockhands'), haulers: msg('crew-at-haulers'), quarriers: msg('crew-at-quarriers'),
             farmhands: msg('crew-at-farmhands'),
             purifiers: msg('crew-at-purifiers'),
             janitors: msg('crew-at-janitors') };

const WHERE = { lifted: msg('crew-where-lifted'), falling: msg('crew-where-falling'), home: msg('crew-where-home'),
                basket: msg('crew-where-basket'), yard: msg('crew-where-yard'),
                resting: msg('crew-where-resting'), walking: msg('crew-where-walking'), deep: msg('crew-where-deep') };
// Every place a body can be said to be, so the crew window can make its
// column as wide as the longest of them (`fitCrewColumn` in shop.js).
export const WHERE_WORDS = [...Object.values(WHERE), ...Object.values(AT)];

export function whereIs(w) {
  if (w.lifted) return WHERE.lifted;
  if (w.falling) return WHERE.falling;
  if (w.deepHome) return WHERE.deep;
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
const DOES = { rockhands: msg('crew-does-rockhands'), quarriers: msg('crew-does-quarriers'),
               farmhands: msg('crew-does-farmhands'), scholars: msg('crew-does-scholars'),
               purifiers: msg('crew-does-purifiers'),
               janitors: msg('crew-does-janitors'), haulers: msg('crew-does-haulers') };
// The tip is monospace, so a label padded to a fixed width is a column; done
// with spaces because this is one text node.
const LABEL = 10;
const NL = String.fromCharCode(10);
const row = (label, value) => `${label.padEnd(LABEL)}${value}`;

// One line a goal, read off the word the yard's own steppers set, so there is
// no second state machine to fall out of step with them.
const NOW = { seek: msg('crew-now-seek'), dump: msg('crew-now-dump'),
              muck: msg('crew-now-muck'), cut: msg('crew-now-cut'),
              work: msg('crew-now-cut'), up: msg('crew-now-up'), down: msg('crew-now-down'),
              tend: msg('crew-now-tend'), home: msg('crew-now-home'), idle: msg('crew-now-idle'),
              in: msg('crew-now-in'), aloft: msg('crew-now-aloft') };

export function doing(w) {
  // These outrank any goal: the stepper's last word is stale for all four.
  if (w.lifted) return WHERE.lifted;
  if (w.falling) return WHERE.falling;
  if (w.brk || w.resting) return WHERE.resting;
  if (w.inside) return WHERE.home;
  // The tender stage is above the job and writes no goal, so a body minding
  // the belt still carries whatever goal it had before (`minding`).
  const m = minding(w);
  if (m) return msg('crew-minding', { name: m.name });
  if (w.goal === 'to') return msg('crew-now-to');
  // The bench is the one site where the thing being built is not a place.
  if (w.goal === 'at') return w.site === 'bench' ? msg('crew-now-kit') : msg('crew-now-build');
  return NOW[w.goal] || DOES[JOBS_AT[w.type]] || msg('crew-now-working');
}

// Three lines and no more: who this is and what it is doing this second. The
// crew list is where a biography belongs.
export function card(w) {
  const mins = Math.floor((w.lived || 0) / 60000);
  return [
    bodyName(w) || msg('crew-somebody'),
    row(msg('crew-card-age'), mins < 1 ? msg('crew-card-new') : msg('crew-card-mins', { mins })),
    row(msg('crew-card-doing'), doing(w))
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

// The ways through at the top -- to the two of you, then to the people --
// the thing you buy at the bottom. The board comes out above the house and
// the cursor arrives from the house, so the bottom row is what the cursor
// crosses first, and a row that only puts a page up is fine to reach for
// while a row you came to press is not. Nothing the crew *use* is sold here;
// that is the bench (`SECTIONS` in upgrades.js).
export function crewRows() {
  return [PAIR_ROW, CREW_ROW, HOUSE_ROW];
}

// The door through to who the two of you are and what you wear
// (wardrobepage.js), on the held sheet over the yard. The two of them live
// here as the crew do, so it is the house's.
const PAIR_ROW = {
  key: 'pairpage',
  name: msg('ward-title'),
  buy: () => openWardrobe(),
  opens: true,
  price: () => '',
  dead: () => false,
  show: () => true,
  from: null,
  unit: null,
  cost: () => 0
};

// The door through to them. Where the cost would go it says how many there are.
const CREW_ROW = {
  key: 'crewlist',
  name: msg('modal-crew'),
  // Pressed, not hovered: the list is a window you sit and read (modal.js),
  // and a window that came up on a pass of the pointer would be in the way.
  buy: () => showWindow('crew'),
  opens: true,
  price: () => String(housed()),
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
  { title: msg('crew-sect-yard'), keys: whoIn(false) },
  { title: msg('crew-sect-deep'), keys: whoIn(true) }
].filter(sect => sect.keys.length);

// The two crews never cross (DESIGN.md, "Two crews and a portal"), so the
// list keeps them apart, and a heading with nobody under it is dropped.
const whoIn = deep => S.workers.flatMap((w, i) => !!w.deepHome === deep ? [`who${i}`] : []);

// One row per body, in the order they were taken on, so the name you are
// looking for stays put. Where the price would go it says where the body is.
function people() {
  return S.workers.map((w, i) => ({
    key: `who${i}`,
    name: bodyName(w) || msg('crew-somebody'),
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
  { title: msg('crew-sect-crew'), keys: [PAIR_ROW.key, CREW_ROW.key, HOUSE_ROW.key] }
];
