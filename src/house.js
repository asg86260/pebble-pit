// Somewhere for the crew to come from.
//
// A body used to be hired out of a menu and appear at its work, which made the
// crew a number rather than people: nowhere they came from, nowhere they went
// at the end of it. So the payroll now stands in the yard as a thing you can
// look at -- one cube per body, stacked into a block on the bare ground between
// the bench and the rock.
//
// It is not drawn as a cottage on purpose. A roof, a door and a window would be
// a picture of housing; what makes this housing is that it goes up when you take
// somebody on, so the block *is* the headcount and reading it is the same act as
// counting the crew. Nothing here can be clicked, hovered or opened, and it
// holds no state of its own: `S.crew` says everything about it there is to say.

import { P, ROCK_CLEAR, HOUSE_TO, HOUSE_CUBE, HOUSE_COLS, HOUSE_JOINT } from './config.js';
import { S, bench } from './state.js';
import { rockLeft } from './world.js';

// The middle of the plot, and it never moves. This is the narrowest strip of
// ground in the yard and it does not get any wider as the game goes on: the rock
// grows leftwards until it is a hand's width off the bench, so at the biggest
// rock there are ten cells of bare ground here and no more. The block is sized
// to fit that rather than the room it has at rock one, which is why it is four
// cubes across and not eight.
export const houseCx = () => Math.round((S.cx + HOUSE_TO) / P) * P;

// How wide the block stands, in cubes, for a crew of n. It fills out along the
// ground and squares itself off as it goes, so four bodies live in a two by two
// rather than in a row of four one cube high -- a single course of cubes on the
// ground line reads as a kerb, not as somewhere anybody lives. Once it is
// HOUSE_COLS across there is no more room beside it and it can only go up.
const wide = n => Math.min(HOUSE_COLS, Math.ceil(Math.sqrt(n)));

// Every cube in the block, bottom course first. The bottom course stands on the
// ground line and the block is centred on its plot, so it grows away from the
// bench and the rock at the same rate and stays clear of both.
export function cubes() {
  const n = S.crew;
  if (n <= 0) return [];                      // nobody hired: there is nothing here
  const cols = wide(n);
  const left = houseCx() - cols * HOUSE_CUBE / 2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols), col = i % cols;
    out.push({ x: left + col * HOUSE_CUBE, y: S.groundY - (row + 1) * HOUSE_CUBE });
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

export function drawHouses(ctx) {
  const cs = cubes();
  if (!cs.length) return;

  ctx.fillStyle = '#000';
  for (const c of cs) ctx.fillRect(c.x, c.y, HOUSE_CUBE, HOUSE_CUBE);

  // Then the joints, painted back over the block. Without them a full stack is
  // one black rectangle, and a rectangle is a monolith rather than somewhere a
  // dozen people live -- the cubes have to be countable or the block says
  // nothing the number under the rock does not say better. They go only between
  // two cubes that are both there, so the outside of the block stays a clean
  // silhouette against the ground.
  //
  // A hairline, like the ground line, rather than a cell wide. A cell is the
  // unit this yard is *built* of, and a cell of white between every cube read as
  // scaffolding standing in front of the thing rather than as the joint between
  // two walls.
  const has = (x, y) => cs.some(c => c.x === x && c.y === y);
  ctx.fillStyle = '#fff';
  for (const c of cs) {
    if (has(c.x + HOUSE_CUBE, c.y))
      ctx.fillRect(c.x + HOUSE_CUBE - HOUSE_JOINT / 2, c.y, HOUSE_JOINT, HOUSE_CUBE);
    if (has(c.x, c.y - HOUSE_CUBE))
      ctx.fillRect(c.x, c.y - HOUSE_JOINT / 2, HOUSE_CUBE, HOUSE_JOINT);
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
