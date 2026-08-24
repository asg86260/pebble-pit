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

import { P, ROCK_CLEAR, HOUSE_TO, HOUSE_CUBE, HOUSE_COLS, HOUSE_WONK, HOUSE_LINE } from './config.js';
import { S, bench } from './state.js';
import { rockLeft } from './world.js';

// The middle of the plot, and it never moves. The rock grows leftwards into
// this ground as the game goes on, so what the block has to fit is the room
// left at the biggest rock -- 240px between the bench and the apron -- and not
// the room it has at rock one.
export const houseCx = () => Math.round((S.cx + HOUSE_TO) / P) * P;

// How wide the block stands, in cubes, for a crew of n. It fills out along the
// ground and squares itself off as it goes, so four bodies live in a two by two
// rather than in a row of four one cube high -- a single course of cubes on the
// ground line reads as a kerb, not as somewhere anybody lives. Once it is
// HOUSE_COLS across there is no more room beside it and it can only go up.
const wide = n => Math.min(HOUSE_COLS, Math.ceil(Math.sqrt(n)));

// How far shack i sits off true, and which way its roof leans. The same every
// time for the same shack: a stack that reshuffled itself between frames would
// be a stack nobody could look at. This is the whole of the ramshackle -- there
// is no randomness in this file, and none anywhere near the drawing.
const wonk = i => ((i * 7 + 3) % 3) - 1;

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
    out.push({ x: left + col * HOUSE_CUBE + wonk(i) * HOUSE_WONK,
               y: S.groundY - (row + 1) * HOUSE_CUBE,
               lean: wonk(i + 1) || 1 });     // which way the roof falls, never flat
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

// Bottom course first, so a shack higher up laps over the roof of the one it is
// standing on. That overlap is most of why a stack reads as piled rather than
// as a grid: the top edge of a lower hut disappears under its neighbour the way
// it would if somebody had built the second one on top of the first.
export function drawHouses(ctx) {
  for (const c of cubes()) shack(ctx, c);
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
}

// One shack: white walls, a leaning roof with the eaves hanging over, and a
// door. It is drawn in outline rather than filled because a solid black square
// is what the rock is made of and what a worker used to be -- and because a
// stack of filled squares is a wall, while a stack of walls with roofs on is a
// row of huts. The roof is what says which it is, so every shack has one and no
// two in a row lean the same way.
function shack(ctx, s) {
  const w = HOUSE_CUBE;

  // Walls, filled white first: a shack behind this one must not show through
  // it, or the stack turns to lattice.
  ctx.fillStyle = '#fff';
  ctx.fillRect(s.x, s.y, w, w);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = HOUSE_LINE;
  ctx.strokeRect(s.x + 1, s.y + 1, w - 2, w - 2);

  // The roof: a bar across the top that hangs over both walls, dropped a pixel
  // at one end. A tin sheet thrown over a hut is never square to it, and the
  // overhang is what keeps a course of them from reading as one long wall.
  const drop = HOUSE_LINE;
  ctx.beginPath();
  ctx.moveTo(s.x - P / 2, s.y + (s.lean > 0 ? drop : 0));
  ctx.lineTo(s.x + w + P / 2, s.y + (s.lean > 0 ? 0 : drop));
  ctx.stroke();

  // And a door, on whichever side the roof is not falling towards, so the two
  // marks on a shack are never stacked on each other.
  ctx.fillStyle = '#000';
  const door = s.lean > 0 ? s.x + P : s.x + w - P * 2;
  ctx.fillRect(door, s.y + w - P * 1.5, P, P * 1.5);
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
