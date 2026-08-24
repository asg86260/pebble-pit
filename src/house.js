// Somewhere for the crew to come from.
//
// A body used to be hired out of a menu and appear at its work, which made the
// crew a number rather than people: nowhere they came from, nowhere they went at
// the end of it. So the payroll stands in the yard now as a thing you can look
// at -- a room per body, on the bare ground between the bench and the rock, with
// the door a new hire walks out of.
//
// It is one shape rather than a row of huts. It spreads along the ground before
// it climbs and gives up a room every other storey, so what it leaves is a
// stepped profile with a lip over every part of it that has sky above -- and
// that profile, not any detail inside it, is what makes it read as somewhere
// people live rather than as a box.
//
// Nothing here can be clicked, hovered or opened, and it holds no state of its
// own: `S.crew` says everything about it there is to say, and every wobble in it
// is worked out from a room's number rather than from anything random.

import { P, ROCK_CLEAR, HOUSE_TO, HOUSE_CUBE, HOUSE_COLS } from './config.js';
import { S, bench } from './state.js';
import { rockLeft } from './world.js';

// The middle of the plot, and it never moves. The rock grows leftwards into
// this ground as the game goes on, so what the block has to fit is the room
// left at the biggest rock -- 240px between the bench and the apron -- and not
// the room it has at rock one.
export const houseCx = () => Math.round((S.cx + HOUSE_TO) / P) * P;

// Which way a thing at i leans, and where it sits off true. The same every time
// for the same i: a settlement that reshuffled itself between frames would be
// one nobody could look at. This is the whole of the ramshackle -- there is no
// randomness in this file, and none anywhere near the drawing.
const wonk = i => ((i * 7 + 3) % 3) - 1;

// How wide the settlement stands on the ground, for a crew of n: wide enough
// that a pile which loses a room every storey holds all of them. A pile of base
// b holds b + (b-1) + ... = b(b+1)/2, so the base is that read backwards.
//
// The base growing with the crew is what makes the thing look built. A fixed
// base can only add storeys, and a stack of nine, eight, seven is a rectangle
// with a nick out of one corner -- at nine wide, losing a room a storey is a
// change of a ninth and reads as no change at all. Grown from the crew, the
// whole silhouette moves every few hires: it spreads, and the steps stay steep
// enough to see.
const baseWide = n => Math.min(HOUSE_COLS, Math.ceil((Math.sqrt(8 * n + 1) - 1) / 2));

// And how many stand in course c of a pile with that base. A room a storey, down
// to a floor of three: past the point where the plot cannot spread any further
// the pile has to go up, and a tower that tapers to a needle is worse than one
// that stops tapering.
const courseWide = (c, base) => Math.max(Math.max(1, Math.min(3, base - 1)), base - c);

// Every room, bottom course first and left to right within a course. Rooms in a
// course touch, which is the point: they share their walls, so what stands there
// is one settlement with rooms in it rather than a stack of separate huts. What
// moves is the courses -- each one sits a room off the one below when there is
// slack to do it with, and never hangs out over thin air.
export function cubes() {
  const n = S.crew;
  if (n <= 0) return [];                      // nobody hired: there is nothing here

  const base = baseWide(n);
  const courses = [];
  for (let placed = 0, c = 0; placed < n; c++) {
    const take = Math.min(courseWide(c, base), n - placed);
    courses.push(take);
    placed += take;
  }

  // Centred on the plot by its base, so the settlement grows away from the bench
  // and the rock at the same rate and stays clear of both.
  let left = Math.round((houseCx() - courses[0] * HOUSE_CUBE / 2) / P) * P;
  const out = [];
  for (let c = 0; c < courses.length; c++) {
    // A narrower course steps in from the end of the one under it rather than
    // sitting square on it. Only ever by one room, and only when there is a room
    // spare underneath, so every wall lands on something solid.
    if (c > 0 && courses[c] < courses[c - 1] && wonk(c) > 0) left += HOUSE_CUBE;
    for (let k = 0; k < courses[c]; k++) {
      out.push({ x: left + k * HOUSE_CUBE, y: S.groundY - (c + 1) * HOUSE_CUBE,
                 lean: wonk(c + k) || 1, i: out.length });
    }
  }
  return out;
}

// The ground in front of the block: the spawn point for a newly hired body, so
// that somebody taken on steps out of the place the crew live and walks to the
// work rather than appearing at it. Nothing in this file moves anybody -- the
// walk belongs to the crew, and this is only the address.
export function doorAt() {
  return { x: houseCx() };
}

// --- drawing -----------------------------------------------------------------

// The settlement is drawn the way everything else in this yard is drawn: as a
// solid black shape with a few white holes knocked in it.
//
// It was outlined first -- white rooms with black walls, roofs, windows, vents,
// aerials, a ladder, props. At the four times zoom it was drawn at, that read as
// a shanty town. At the size the game is actually played, it read as a patch of
// grey lace: a cell is five screen pixels, so a two-pixel wall and a six-pixel
// window are a scribble, and the whole thing was busier than the rock while
// being the wrong value against it. The rock is a black mass. The bench and the
// lab are black shapes with a notch or two knocked out. A building that is white
// with black lines round it is the only thing in the picture drawn inside out.
//
// So: the mass, a lip along whatever has sky over it, and a hole where a door or
// a window goes. Everything that survived is something you can see at 1x.
export function drawHouses(ctx) {
  const rooms = cubes();
  if (!rooms.length) return;
  const C = HOUSE_CUBE;
  const room = (x, y) => rooms.some(r => r.x === x && r.y === y);
  // Where a room's hole goes, or whether it has one at all. Read off where the
  // room stands rather than off a counter, so it keeps its face between frames.
  //
  // Two thirds of the rooms have one, and they sit in different corners: holes
  // punched in the same spot in every room line up into rows and columns, and a
  // grid of identical windows is a factory. What is wanted is a wall somebody
  // cut a hole in when they needed one.
  const tell = r => Math.round(r.x / P) * 7 + Math.round(r.y / P) * 11;
  const holed = r => tell(r) % 3 !== 0;
  const across = r => [0, P, P * 2][tell(r) % 3];

  ctx.fillStyle = '#000';
  for (const r of rooms) ctx.fillRect(r.x, r.y, C, C);

  // The eaves: a lip over whatever has sky above it, hanging a cell past the end
  // of a run of rooms. It is the only thing that says roof rather than top edge,
  // and because a course steps back as it climbs, the lips step with it -- which
  // is the whole of the ramshackle now, and it survives being small.
  for (const r of rooms) {
    if (room(r.x, r.y - C)) continue;
    const l = room(r.x - C, r.y) ? 0 : P;
    const w = C + l + (room(r.x + C, r.y) ? 0 : P);
    ctx.fillRect(r.x - l, r.y - P / 2, w, P / 2);
  }

  // And the holes, knocked back out in white: a door on the ground where somebody
  // could walk out of one, a window upstairs.
  ctx.fillStyle = '#fff';
  for (const r of rooms) {
    if (!holed(r)) continue;
    if (r.y + C === S.groundY) ctx.fillRect(r.x + P, r.y + C - P * 2, P, P * 2);
    else ctx.fillRect(r.x + across(r), r.y + (tell(r) % 2 ? P : P * 2) - P, P, P);
  }
  ctx.fillStyle = '#000';
}

// what is standing on the plot, and how much room it has left either side, for
// the checks. The clearances are worked out here rather than in the suite
// because where the bench ends and where the rock's apron starts are this
// module's problem, not a fact a check should be holding a copy of.
export function houseReport() {
  const cs = cubes();
  const left = cs.length ? Math.min(...cs.map(c => c.x)) : null;
  const right = cs.length ? Math.max(...cs.map(c => c.x)) + HOUSE_CUBE : null;
  return {
    cubes: cs.length,
    cube: HOUSE_CUBE,
    left, right,
    top: cs.length ? Math.min(...cs.map(c => c.y)) : null,
    base: cs.length ? Math.max(...cs.map(c => c.y)) + HOUSE_CUBE : null,
    foot: S.groundY,
    door: doorAt().x,
    ofBench: left === null ? null : Math.round(left - (bench.x + bench.w)),
    ofApron: right === null ? null : Math.round(rockLeft() - ROCK_CLEAR - right),
    cells: cs.map(c => `${c.x},${c.y}`)
  };
}
