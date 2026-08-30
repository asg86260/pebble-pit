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

import { P, ROCK_CLEAR, HOUSE_TO, HOUSE_CUBE, HOUSE_COLS, HOUSE_FLIP_MS, HOUSE_SHUT,
         HOUSE_CURTAIN, HOUSE_PUFF_MS, DOOR_W, DOOR_H } from './config.js';
import { S, bench } from './state.js';
import { puff } from './puff.js';
import { rockLeft } from './world.js';

// The middle of the plot, and it never moves. The rock grows leftwards into
// this ground as the game goes on, so what the block has to fit is the room
// left at the biggest rock -- 240px between the bench and the apron -- and not
// the room it has at rock one.
export const houseCx = () => Math.round((S.cx + HOUSE_TO) / P) * P;

// The far edge of the plot, whether anybody lives on it or not. The quarry's
// spoil stops here: a pile is allowed to run to the next thing along the ground,
// and the next thing along is where the crew live even on a day when the crew is
// nobody. Worked out from a full base, like the block itself, so the ground the
// shacks will stand on is not somewhere the sand is already sitting.
export const houseLeft = () =>
  Math.round((houseCx() - HOUSE_COLS * HOUSE_CUBE / 2) / P) * P;

// How many rooms stand in course c: the base, losing one a storey, never fewer
// than three. A fixed sequence, and it has to be fixed.
//
// It was worked out from the size of the crew for a while -- a wider base for
// more bodies, so the whole silhouette spread as you hired. That looked better
// standing still and was wrong in motion: taking somebody on rebuilt the place.
// Rooms moved, windows moved, the door moved, and the one thing hiring should
// obviously do -- add a room -- was the one thing you could not see happen.
// Building is additive. Room seventeen stands where room seventeen stands
// whether the crew is eighteen or eighty.
const courseWide = c => Math.max(3, HOUSE_COLS - c);

// Every room, bottom course first and left to right within a course. Rooms in a
// course touch, which is the point: they share their walls, so what stands there
// is one settlement with rooms in it rather than a stack of separate huts. What
// moves is the courses -- each one sits a room off the one below when there is
// slack to do it with, and never hangs out over thin air.
// The first body gets two rooms, not one: the doorway and a room to live in.
//
// A settlement of one used to be a single cube with a door punched in it and no
// window anywhere, which reads as a shed rather than as somewhere anybody lives
// -- and the first thing hiring did was give that shed a window, which is a
// strange thing for hiring to do. Room zero is the way in and has always been
// the doorway; the rooms after it are the ones with people in them. So there is
// one window a body from the very first, and building stays what it was: a hire
// is a room, and room seventeen stands where room seventeen stands.
export function cubes() {
  const n = S.crew > 0 ? S.crew + 1 : 0;
  if (n <= 0) return [];                      // nobody hired: there is nothing here

  // The left edge of the ground course, and it never moves: it is worked out
  // from a full base rather than from what is standing, so the settlement fills
  // its plot from one end instead of sliding along it as it grows.
  const foot = Math.round((houseCx() - HOUSE_COLS * HOUSE_CUBE / 2) / P) * P;

  // Every course starts at the same edge and is shorter than the one below, so
  // the settlement steps back from one side and stands square on the other.
  // Courses used to sit a room off each other, which looked hand-built standing
  // still and made the whole place restless as it grew: with everything else
  // held still, the wobble was the only thing moving, and it read as a fault.
  const out = [];
  for (let i = 0, c = 0, placed = 0; i < n; i++) {
    if (i - placed === courseWide(c)) { placed = i; c++; }   // that course is full
    out.push({ x: foot + (i - placed) * HOUSE_CUBE, y: S.groundY - (c + 1) * HOUSE_CUBE, i });
  }
  return out;
}

// The ground in front of the block: the spawn point for a newly hired body, so
// that somebody taken on steps out of the place the crew live and walks to the
// work rather than appearing at it. Nothing in this file moves anybody -- the
// walk belongs to the crew, and this is only the address.
export function doorAt() {
  return { x: Math.round((houseCx() - HOUSE_COLS * HOUSE_CUBE / 2) / P) * P + HOUSE_CUBE / 2 };
}

// Where the holes go: the door in the first room built, and one window dead in
// the middle of every room after it. A pure function of a room's number and
// nothing else -- not of its neighbours, not of how many people live here.
//
// Every room the same, on purpose. Two rooms in three used to have a window and
// the third went blank, which gave the wall some life to look at and made every
// hire a small rearrangement to read: a new room, and the pattern of dark and
// light along the course shifted with it. When the only thing that changes is
// one more room exactly like the last one, the change is the room.
export function holes() {
  const C = HOUSE_CUBE;
  return cubes().map(r => r.i === 0
    // A doorway wider than the body that walks out of it. A door somebody plainly
    // could not fit through is the fastest way to make a building read as a model
    // of a building. This one was the yard's only honest door for a long while
    // and the rest have been brought to it: DOOR_W by DOOR_H is what it always
    // was, named in config.js now so the school, the lab, the casino and the
    // scrubbing house are the same way in.
    ? { x: r.x + P, y: r.y + C - P * DOOR_H, w: P * DOOR_W, h: P * DOOR_H, door: true, i: r.i }
    : { x: r.x + P * 2, y: r.y + P * 2, w: P * 2, h: P * 2, i: r.i });
}

// The chimney stands on the top of the left-hand column, so it rises with the
// building the way a flue does when another storey goes on under it. It is the
// one thing here that is allowed to move as the settlement grows, because going
// up with it is what a chimney does.
export function chimneyAt() {
  const rooms = cubes();
  if (!rooms.length) return null;
  const left = Math.min(...rooms.map(r => r.x));
  const top = Math.min(...rooms.filter(r => r.x === left).map(r => r.y));
  return { x: left + P * 2, y: top };
}

// A puff off it, now and then. It goes into the same list the lab's chimney uses
// -- one thing in this game knows how smoke rises, and it is not this file.
// --- who is in ----------------------------------------------------------------
// A light in a window means somebody is behind it, and that is the only thing it
// is allowed to mean. Bodies with nothing to carry knock off and come here (see
// crew.js), so the front of the settlement is a reading of how much of the crew
// is out at work: a lit wall is a yard standing idle, and a dark one is
// everybody out on the ground where you can see them.
//
// Rooms are lit from the bottom up, in the order they were built, because a
// scatter of lit rooms would read as a pattern somebody chose. Room zero is the
// doorway and is not a window -- so there is exactly one window a body, and a
// yard with everybody home is a front with every light on.
export const homeCount = () => S.workers.filter(w => w.inside).length;
export const lit = i => i > 0 && i <= homeCount();

// One lit window changes its mind, every so often -- somebody pulling something
// across it. Which one walks round the settlement rather than being drawn out of
// a hat, and it walks by the golden ratio: a whole-number stride shares a factor
// with the room count sooner or later -- a stride of seven in fourteen rooms
// picked the same two windows for ever -- and this one lands somewhere new
// whatever the crew has grown to.
//
// It only ever touches rooms with somebody in them. A curtain across a dark room
// is a change nobody can see, and it would spend the walk's turns on windows
// that are already grey.
const GOLDEN = 0.6180339887;

export function stepShutters(now) {
  const home = homeCount();
  // a curtain across an empty room is nothing; drop any that are left over from
  // when somebody lived in it
  if (S.shutters.some(i => !lit(i))) S.shutters = S.shutters.filter(lit);
  if (home < 2 || now < S.shutterAt) return;
  S.shutterAt = now + HOUSE_FLIP_MS;

  // Either one more goes across, or the one that has been across longest comes
  // back: one window changes, and the number of them stays about where it was.
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
  // The hearth is lit by whoever is sitting at it. A chimney smoking over an
  // empty house is the building claiming somebody is in when the windows say
  // otherwise, and the two have to agree or neither is worth looking at.
  if (!at || !homeCount() || now < S.houseSmokeAt) return;
  S.houseSmokeAt = now + HOUSE_PUFF_MS * (0.6 + Math.random() * 0.8);
  // Marked as the crew's, because the lab's chimney means something specific --
  // that research is being worked on -- and a check reads it. Two chimneys, one
  // list, and only one of them is a signal.
  puff(at.x + P, at.y - P * 4, { flag: 'house' });
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
  // The mass. Everything after this is a hole knocked back out of it.
  ctx.fillStyle = '#000';
  for (const r of rooms) ctx.fillRect(r.x, r.y, C, C);

  // The eaves: a lip over whatever has sky above it, hanging half a cell past
  // the end of a run of rooms. It is the only thing that says roof rather than
  // top edge, and because a course steps back as it climbs, the lips step with
  // it -- which is the whole of the ramshackle now, and it survives being small.
  for (const r of rooms) {
    if (room(r.x, r.y - C)) continue;
    const over = P / 2;
    const l = room(r.x - C, r.y) ? 0 : over;
    const w = C + l + (room(r.x + C, r.y) ? 0 : over);
    ctx.fillRect(r.x - l, r.y - P / 2, w, P / 2);
  }

  // The chimney: a stack on the top of the left-hand column with a lip on it,
  // drawn with the mass because it is part of the building rather than something
  // standing on it.
  const flue = chimneyAt();
  ctx.fillRect(flue.x, flue.y - P * 4, P * 2, P * 4);
  ctx.fillRect(flue.x - P / 2, flue.y - P * 4, P * 3, P);

  // The holes, and every one of them dead in the middle of its room.
  //
  // They used to be chosen from wherever there was wall to spare -- against a
  // shared wall if the room had a neighbour, in the middle if it did not. Which
  // meant a room's window depended on its neighbours, so building a room moved
  // the window in the room beside it, and two rooms punching against the wall
  // between them made one window two cells wide. Reading anything about a room
  // off the rooms around it is what made the place shuffle every time somebody
  // was hired.
  //
  // The middle asks nothing of anybody: cells of wall clear on every side, the
  // same cells whether the room is the end of the settlement or buried in it,
  // and never touching its neighbour's however the courses step. Nothing here
  // can grow into anything else, which is the whole point of it.
  //
  // And they are the one part of this that moves. A settlement of people who are
  // all out at work is a shape; a curtain going across, a room going dark and
  // somebody crossing the light is the difference between a building and a place
  // with anybody in it. Nothing here is random -- a room's beat comes off its own
  // number -- and none of it is fast: it is meant to be caught out of the corner
  // of the eye rather than watched.
  // The doorway is always a hole -- it is a way in, not a light. A window is
  // white when there is somebody behind it and grey when there is not, and grey
  // is also what a drawn curtain looks like, which is the right answer both
  // times: what the colour says is whether there is anything to see.
  for (const h of holes()) {
    ctx.fillStyle = h.door ? '#fff'
      : lit(h.i) && !S.shutters.includes(h.i) ? '#fff'
      : HOUSE_CURTAIN;
    ctx.fillRect(h.x, h.y, h.w, h.h);
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
    home: homeCount(),
    lights: holes().filter(h => !h.door && lit(h.i) && !S.shutters.includes(h.i)).length,
    cube: HOUSE_CUBE,
    left, right,
    top: cs.length ? Math.min(...cs.map(c => c.y)) : null,
    base: cs.length ? Math.max(...cs.map(c => c.y)) + HOUSE_CUBE : null,
    foot: S.groundY,
    door: doorAt().x,
    holes: holes().map(h => `${h.x},${h.y},${h.h}`),
    // the bench stands between the block and the rock now, so the block clears
    // the bench and the bench clears the apron
    ofBench: right === null ? null : Math.round(bench.x - right),
    ofApron: right === null ? null : Math.round(rockLeft() - ROCK_CLEAR - right),
    benchOfApron: Math.round(rockLeft() - ROCK_CLEAR - (bench.x + bench.w)),
    plotLeft: houseLeft(),
    cells: cs.map(c => `${c.x},${c.y}`)
  };
}
