// Somewhere for the crew to come from.
//
// A body used to be hired out of a menu and appear at its work, which made the
// crew a number rather than people: nowhere they came from, nowhere they went at
// the end of it. So the payroll stands in the yard now as a thing you can look
// at -- a room per body, on the bare ground between the bench and the rock, with
// the door a new hire walks out of.
//
// It is one settlement rather than a row of huts, and that is the whole of the
// drawing. Rooms in a course share their walls; a roof goes only where there is
// sky over the room; a door goes only where somebody could walk out of it, and
// the storeys above get windows instead. It spreads along the ground before it
// climbs, and gives up a room every other storey as it goes, so what it leaves
// is a stepped profile rather than a block with a flat side.
//
// Nothing here can be clicked, hovered or opened, and it holds no state of its
// own: `S.crew` says everything about it there is to say, and every wobble in it
// is worked out from a room's number rather than from anything random.

import { P, ROCK_CLEAR, HOUSE_TO, HOUSE_CUBE, HOUSE_COLS, HOUSE_LINE } from './config.js';
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

// How many rooms stand in course c. The place was built by adding a room at a
// time to what was already standing, so a course is never wider than the one
// holding it up, and it gives up a room every other storey as it climbs.
//
// That taper is the whole shape of the thing. Left to go straight up it becomes
// a tenement -- thirty bodies made a seven-storey block with a flat side -- and a
// tenement is a building, not a settlement. Narrowing as it rises spreads the
// crew along the ground first and leaves a stepped profile behind, which is what
// a place that grew a room at a time actually looks like.
const courseWide = c => Math.max(1, HOUSE_COLS - Math.floor(c / 2));

// Every room, bottom course first and left to right within a course. Rooms in a
// course touch, which is the point: they share their walls, so what stands there
// is one settlement with rooms in it rather than a stack of separate huts. What
// moves is the courses -- each one sits a room off the one below when there is
// slack to do it with, and never hangs out over thin air.
export function cubes() {
  const n = S.crew;
  if (n <= 0) return [];                      // nobody hired: there is nothing here

  const courses = [];
  for (let placed = 0, c = 0; placed < n; c++) {
    const take = Math.min(courseWide(c), n - placed);
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

// The settlement is drawn as one thing, not as a pile of things.
//
// It was a stack of complete little huts first, each with its own four walls and
// its own roof, and it read as exactly that: boxes that happened to be touching.
// What makes a place look built-onto rather than stacked up is that the parts
// share: a wall between two rooms is one wall, a roof only goes where there is
// weather above, and a door only goes where somebody could walk out of it. So
// nothing here draws a room -- it draws the edges of the whole settlement, and
// what is inside those edges is rooms.
export function drawHouses(ctx) {
  const rooms = cubes();
  if (!rooms.length) return;
  const C = HOUSE_CUBE;
  const room = (x, y) => rooms.some(r => r.x === x && r.y === y);

  // The mass, in white. Everything after this is a line drawn on top of it, and
  // the sky and the ground must not show through the middle of a building.
  ctx.fillStyle = '#fff';
  for (const r of rooms) ctx.fillRect(r.x, r.y, C, C);

  ctx.fillStyle = '#000';
  const T = HOUSE_LINE;
  const post = (x, y) => ctx.fillRect(x - T / 2, y, T, C);      // an upright
  const beam = (x, y, w) => ctx.fillRect(x, y - T / 2, w, T);   // and a level run

  // Walls, each one drawn once however many rooms it stands between: the left
  // wall always, the right only where nothing carries on. That is the whole
  // difference between a settlement and a row of boxes -- neighbours hold each
  // other up instead of standing back to back with two walls between them.
  for (const r of rooms) {
    post(r.x, r.y);
    if (!room(r.x + C, r.y)) post(r.x + C, r.y);
    if (!room(r.x, r.y + C)) beam(r.x, r.y + C, C);             // a floor over open air
    if (room(r.x, r.y - C)) beam(r.x, r.y, C);                  // the floor of the one above
  }

  // Roofs, only where there is sky over the room. A course with another course
  // on top of it has a floor, not a roof, and drawing a roof under a floor is
  // what made the old stack read as separate huts piled up. Each one leans its
  // own way and hangs over its walls, so the skyline is a run of tin sheets at
  // odds with each other rather than one flat lid.
  ctx.lineWidth = T;
  ctx.strokeStyle = '#000';
  for (const r of rooms) {
    if (room(r.x, r.y - C)) continue;
    const lift = r.lean > 0 ? [T, 0] : [0, T];
    ctx.beginPath();
    ctx.moveTo(r.x - P / 2, r.y + lift[0]);
    ctx.lineTo(r.x + C + P / 2, r.y + lift[1]);
    ctx.stroke();
  }

  // A door where somebody could actually use one, which is the ground floor, and
  // not on every room: a settlement has fewer ways in than it has rooms. The
  // rooms above get a window instead, which is the only thing in the picture
  // that says the upper storeys are lived in rather than piled on.
  for (const r of rooms) {
    const ground = r.y + C === S.groundY;
    if (ground && r.lean > 0) ctx.fillRect(r.x + P, r.y + C - P * 2, P, P * 2);
    else if (!ground && r.lean > 0) ctx.fillRect(r.x + P, r.y + P, P, P);
  }

  // And a ladder up the end of it, from the ground to the second storey. It is
  // the one part that is not a wall or a hole in one: what it says is that the
  // place is used -- somebody climbs that to get home -- and it ties the courses
  // together into one address instead of two floors that happen to be stacked.
  const upper = rooms.filter(r => r.y + C * 2 <= S.groundY);
  if (upper.length) {
    const foot = Math.min(...rooms.map(r => r.x)) - P;
    const top = S.groundY - C * 2;
    ctx.fillRect(foot, top, T, C * 2);
    ctx.fillRect(foot + P, top, T, C * 2);
    for (let y = top + P; y < S.groundY; y += P) ctx.fillRect(foot, y - T / 2, P, T);
  }

  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
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
