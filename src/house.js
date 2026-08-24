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
  // Which face a room wears, read off where it stands rather than off a counter:
  // a room keeps the same one from frame to frame, and its neighbour does not
  // wear it too. Five is a prime against both of the strides in here, so the
  // pattern never lines up with a course or a column.
  const tell = (r, salt) => (Math.round(r.x / P) * 7 + Math.round(r.y / P) * 11 + salt * 3) % 5;

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
  // not on every room: a settlement has fewer ways in than it has rooms.
  for (const r of rooms) {
    if (r.y + C === S.groundY && r.lean > 0) ctx.fillRect(r.x + P, r.y + C - P * 2, P, P * 2);
  }

  // What the upper storeys have instead of doors, and it is not one window over
  // and over. A room is three cells square, so there is only ever one mark's
  // worth of room in it -- the variety has to come from *which* mark, not from
  // where it sits. A window, a window down on the floor, a vent, a wall with
  // nothing in it at all, and one room in five with two things going on.
  //
  // Which one a room gets is read off where it stands rather than off a counter,
  // so a room keeps its face from frame to frame, and two side by side do not
  // wear the same one.
  for (const r of rooms) {
    if (r.y + C === S.groundY) continue;
    const slit = (x, y) => ctx.fillRect(x, y + (P - T) / 2, P, T);
    switch (tell(r, 0)) {
      case 0: ctx.fillRect(r.x + P, r.y + P, P, P); break;              // a window
      case 1: ctx.fillRect(r.x + P, r.y + P * 2, P, P); break;          // one down at the floor
      case 2: slit(r.x + P, r.y + P); break;                            // a vent
      case 3: break;                                                    // shuttered, nobody in
      default: ctx.fillRect(r.x + P, r.y + P, P, P); slit(r.x + P, r.y + P * 2);
    }
  }

  // Roofs are where a shanty keeps its things. Only rooms with sky over them can
  // carry any, only some of them do, and no two next to each other carry the
  // same -- a barrel for water, a stovepipe, or an aerial. This is the one part
  // of the drawing that is not architecture, and it is what stops the top edge
  // reading as the top edge of a diagram.
  for (const r of rooms) {
    if (room(r.x, r.y - C)) continue;
    const top = r.y - (r.lean > 0 ? 0 : T);
    switch (tell(r, 1)) {
      case 0:                                                           // a water barrel
        ctx.fillRect(r.x + P, top - P, P, P);
        ctx.fillStyle = '#fff';
        ctx.fillRect(r.x + P, top - P + (P - T) / 2, P, T);             // its hoop
        ctx.fillStyle = '#000';
        break;
      case 1:                                                           // a stovepipe
        ctx.fillRect(r.x + P * 2, top - P * 2, T, P * 2);
        ctx.fillRect(r.x + P * 2 - T, top - P * 2, P, T);
        break;
      case 2:                                                           // an aerial
        ctx.fillRect(r.x + P, top - P * 2, T, P * 2);
        ctx.fillRect(r.x + P - T, top - P * 2, P, T);
        ctx.fillRect(r.x + P - T, top - P, P, T);
        break;
    }
  }

  // Where a course steps back, the roof it left behind is a terrace, and a
  // terrace somebody uses has a rail on it and a way up off it. Both together
  // are what makes the upper storeys look lived on rather than looked at.
  for (const r of rooms) {
    if (room(r.x, r.y - C)) continue;
    if (!room(r.x + C, r.y - C)) continue;         // nothing steps up off this one
    const rail = r.y - P * 2;
    ctx.fillRect(r.x + T, rail, C - T * 2, T);                          // the rail
    ctx.fillRect(r.x + T, rail, T, P * 2);                              // and its two posts
    ctx.fillRect(r.x + C - T * 2, rail, T, P * 2);
    ladder(ctx, r.x + C - P, r.y - C, C);                               // up to the next storey
  }

  // And the ladder up the end of it, from the ground to the second storey. What
  // it says is that the place is used -- somebody climbs that to get home -- and
  // it ties the courses into one address rather than floors that happen to be
  // stacked.
  const left = Math.min(...rooms.map(r => r.x));
  if (rooms.some(r => r.y + C * 2 <= S.groundY)) ladder(ctx, left - P, S.groundY - C * 2, C * 2);

  // Props against the end walls. Everything else here is upright or level, and a
  // place thrown up out of what was lying about leans on something: two diagonals
  // are the whole of it, and they are the only lines in the picture that are
  // neither.
  if (rooms.some(r => r.y + C * 2 <= S.groundY)) {
    const right = Math.max(...rooms.map(r => r.x)) + C;
    ctx.lineWidth = T;
    for (const [x, d] of [[left, -1], [right, 1]]) {
      ctx.beginPath();
      ctx.moveTo(x + d * P * 2, S.groundY);
      ctx.lineTo(x, S.groundY - C);
      ctx.stroke();
    }
  }

  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
}

// A ladder: two rails and the rungs between them, drawn from a height down to
// whatever it is standing on.
function ladder(ctx, x, top, tall) {
  const T = HOUSE_LINE;
  ctx.fillRect(x, top, T, tall);
  ctx.fillRect(x + P, top, T, tall);
  for (let y = top + P; y < top + tall; y += P) ctx.fillRect(x, y - T / 2, P, T);
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
