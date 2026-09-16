// Somewhere for the crew to come from: a room per body, with the door a new
// hire walks out of. One block, the same width on every storey. Nothing here
// can be clicked or opened, and it holds no state of its own: `S.crew` says
// everything, and every wobble is worked out from a room's number, never from
// anything random.

import { P, ROCK_CLEAR, HOUSE_TO, HOUSE_CUBE, HOUSE_COLS, HOUSE_FLIP_MS, HOUSE_SHUT,
         HOUSE_CURTAIN, HOUSE_PUFF_MS, DOOR_W, DOOR_H } from './config.js';
import { S, bench } from './state.js';
import { puff } from './puff.js';
import { rockLeft } from './world.js';
import { rand } from './rng.js';
import { beatDone } from './beats.js';

// The middle of the plot, off the same walk that places everything else, and
// it never moves.
export const houseCx = () => {
  const spot = S.placed && S.placed.house;
  return spot ? Math.round((spot.x + spot.w / 2) / P) * P
              : Math.round((S.cx + HOUSE_TO) / P) * P;
};

// The far edge of the plot, whether anybody lives on it or not: the quarry's
// spoil stops here even on a day when the crew is nobody. Worked out from a
// full base, so the ground the shacks will stand on is not already under sand.
export const houseLeft = () =>
  Math.round((houseCx() - HOUSE_COLS * HOUSE_CUBE / 2) / P) * P;

// A fixed width, and it has to be fixed: a base that grew with the crew
// rebuilt the place on every hire, and the one thing hiring should visibly do
// (add a room) was the one thing you could not see. Room seventeen stands
// where room seventeen stands whether the crew is eighteen or eighty.
const courseWide = () => HOUSE_COLS;

// Every room, bottom course first and left to right within a course. Rooms
// in a course touch, so what stands is one settlement rather than huts.
//
// The first body gets two rooms: room zero is the doorway and has no window,
// the rooms after it are the ones with people in them, so there is one
// window a body from the first. The two stand before anybody is hired,
// because the opening is two bodies walking out of this door. Only a yard
// that has had its opening and has nobody in it (the checks get there; the
// game does not) has no house.
export const roomsToday = () =>
  S.crew > 0 ? S.crew + 1 : (beatDone('show') ? 0 : 2);

export function cubes(nOverride) {
  const n = nOverride != null ? nOverride : roomsToday();
  if (n <= 0) return [];                      // nobody hired: there is nothing here

  // Worked out from a full base rather than from what is standing, so the
  // settlement fills its plot from one end instead of sliding as it grows.
  const foot = Math.round((houseCx() - HOUSE_COLS * HOUSE_CUBE / 2) / P) * P;

  // Every course starts at the same edge and is as wide as the one below;
  // courses set a room off each other made the whole place restless as it
  // grew.
  const out = [];
  for (let i = 0, c = 0, placed = 0; i < n; i++) {
    if (i - placed === courseWide(c)) { placed = i; c++; }   // that course is full
    out.push({ x: foot + (i - placed) * HOUSE_CUBE, y: S.groundY - (c + 1) * HOUSE_CUBE, i });
  }
  return out;
}

// The spawn point for a new hire. Nothing in this file moves anybody; this is
// only the address.
export function doorAt() {
  return { x: Math.round((houseCx() - HOUSE_COLS * HOUSE_CUBE / 2) / P) * P + HOUSE_CUBE / 2 };
}

// Where the *next* hire's room will stand, for a builder to walk to. Asks
// `cubes` for one more than today's count, never mutates `S.crew` to peek: a
// peek that forgot to put the count back is a hire that happened twice. The
// first hire adds two rooms, and the spot offered is the later of the two.
export function nextHouseAt() {
  const rooms = cubes(roomsToday() + (S.crew > 0 ? 1 : 2));
  const added = rooms[rooms.length - 1];
  return added ? Math.round((added.x + HOUSE_CUBE / 2) / P) * P : houseCx();
}

// The door in room zero, and one window dead in the middle of every room after
// it: a pure function of a room's number, never of its neighbors, so a hire
// never rearranges the wall. When the only thing that changes is one more
// room like the last, the change is the room.
export function holes() {
  const C = HOUSE_CUBE;
  return cubes().map(r => r.i === 0
    // DOOR_W by DOOR_H, the one way in every building shares.
    ? { x: r.x + P, y: r.y + C - P * DOOR_H, w: P * DOOR_W, h: P * DOOR_H, door: true, i: r.i }
    : { x: r.x + P * 2, y: r.y + P * 2, w: P * 2, h: P * 2, i: r.i });
}

// On top of the left-hand column: the one thing here allowed to move as the
// settlement grows, because going up with it is what a chimney does.
export function chimneyAt() {
  const rooms = cubes();
  if (!rooms.length) return null;
  const left = Math.min(...rooms.map(r => r.x));
  const top = Math.min(...rooms.filter(r => r.x === left).map(r => r.y));
  return { x: left + P * 2, y: top };
}

// --- who is in ----------------------------------------------------------------
// A light in a window means somebody is behind it and nothing else. Bodies
// with nothing to carry knock off and come here (crew.js), so a lit wall is a
// yard standing idle. Rooms are lit from the bottom up, in the order built;
// room zero is the doorway, so there is exactly one window a body.
export const homeCount = () => S.workers.filter(w => w.inside).length;
export const lit = i => i > 0 && i <= homeCount();

// One lit window changes its mind every so often. Which one walks the
// settlement by the golden ratio: a whole-number stride shares a factor with
// the room count sooner or later (seven in fourteen picked the same two
// windows forever). Only rooms with somebody in them, because a curtain across
// a dark room is a change nobody can see.
const GOLDEN = 0.6180339887;

export function stepShutters(now) {
  const home = homeCount();
  // a curtain across an empty room is nothing; drop any that are left over from
  // when somebody lived in it
  if (S.shutters.some(i => !lit(i))) S.shutters = S.shutters.filter(lit);
  if (home < 2 || now < S.shutterAt) return;
  S.shutterAt = now + HOUSE_FLIP_MS;

  // Either one more goes across, or the one that has been across longest comes
  // back, so the number of them stays about where it was.
  const want = Math.max(1, Math.round(home * HOUSE_SHUT));
  if (S.shutters.length >= want) { S.shutters.shift(); return; }
  for (let k = 0; k < 8; k++) {
    const i = 1 + Math.floor(((S.shutterN++ * GOLDEN) % 1) * home);
    if (!S.shutters.includes(i)) { S.shutters.push(i); return; }
  }
}

export function stepHouse(now) {
  stepShutters(now);
  const at = chimneyAt();
  // The hearth is lit by whoever is sitting at it: the chimney and the windows
  // have to agree.
  if (!at || !homeCount() || now < S.houseSmokeAt) return;
  S.houseSmokeAt = now + HOUSE_PUFF_MS * (0.6 + rand() * 0.8);
  // Flagged, because the lab's chimney means research is being worked on and
  // a check reads it. Two chimneys, one list, and only one is a signal.
  puff(at.x + P, at.y - P * 4, { flag: 'house' });
}

// --- drawing -----------------------------------------------------------------

// A solid black mass with a few white holes knocked in it, like every building
// here. Outlined rooms with walls and props read as grey lace at 1x, where a
// cell is five screen pixels; everything that survived is visible at 1x.
export function drawHouses(ctx) {
  const rooms = cubes();
  if (!rooms.length) return;
  const C = HOUSE_CUBE;
  const room = (x, y) => rooms.some(r => r.x === x && r.y === y);
  // The mass. Everything after this is a hole knocked back out of it.
  ctx.fillStyle = '#000';
  for (const r of rooms) ctx.fillRect(r.x, r.y, C, C);

  // The eaves: a lip over whatever has sky above it, hanging half a cell past
  // the end of a run of rooms. It is the only thing that says roof rather
  // than top edge.
  for (const r of rooms) {
    if (room(r.x, r.y - C)) continue;
    const over = P / 2;
    const l = room(r.x - C, r.y) ? 0 : over;
    const w = C + l + (room(r.x + C, r.y) ? 0 : over);
    ctx.fillRect(r.x - l, r.y - P / 2, w, P / 2);
  }

  // The chimney, drawn with the mass because it is part of the building.
  const flue = chimneyAt();
  ctx.fillRect(flue.x, flue.y - P * 4, P * 2, P * 4);
  ctx.fillRect(flue.x - P / 2, flue.y - P * 4, P * 3, P);

  // The holes. The doorway is always a hole: a way in, not a light. A window
  // is white when somebody is behind it and grey when not, and grey is also
  // what a drawn curtain looks like; either way the color says whether there
  // is anything to see.
  for (const h of holes()) {
    ctx.fillStyle = h.door ? '#fff'
      : lit(h.i) && !S.shutters.includes(h.i) ? '#fff'
      : HOUSE_CURTAIN;
    ctx.fillRect(h.x, h.y, h.w, h.h);
  }

  ctx.fillStyle = '#000';
}

// What is standing on the plot and how much room it has either side, for the
// checks. The clearances are worked out here because where the bench ends and
// the apron starts is this module's problem, not a copy a check should hold.
export function houseReport() {
  const cs = cubes();
  const left = cs.length ? Math.min(...cs.map(c => c.x)) : null;
  const right = cs.length ? Math.max(...cs.map(c => c.x)) + HOUSE_CUBE : null;
  return {
    cubes: cs.length,
    home: homeCount(),
    lights: holes().filter(h => !h.door && lit(h.i) && !S.shutters.includes(h.i)).length,
    cube: HOUSE_CUBE,
    left, right,
    top: cs.length ? Math.min(...cs.map(c => c.y)) : null,
    base: cs.length ? Math.max(...cs.map(c => c.y)) + HOUSE_CUBE : null,
    foot: S.groundY,
    door: doorAt().x,
    holes: holes().map(h => `${h.x},${h.y},${h.h}`),
    // the bench stands between the block and the rock, so the block clears
    // the bench and the bench clears the apron
    ofBench: right === null ? null : Math.round(bench.x - right),
    ofApron: right === null ? null : Math.round(rockLeft() - ROCK_CLEAR - right),
    benchOfApron: Math.round(rockLeft() - ROCK_CLEAR - (bench.x + bench.w)),
    plotLeft: houseLeft(),
    cells: cs.map(c => `${c.x},${c.y}`)
  };
}
