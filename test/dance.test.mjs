// The celebration, measured a frame at a time.
//
// A rock comes off and the crew have five seconds of the yard to themselves.
// Twice before, that read as vibrating rather than dancing, and both times the
// fix was to the moves -- what a body does -- when the third time round the
// fault turned out not to be in a move at all. It was in the joins between them:
// every move was read off the wall clock and every move has its own height, so
// swapping one for another dropped the body wherever the clock happened to have
// it. Fifteen pixels of height in a single frame, on a body eighteen pixels
// tall, three or four times a celebration each, plus one going in and one coming
// out. Nothing in a still frame is wrong. It is only wrong between two of them.
//
// So this checks the seams and the tempo, which is what a body watching it
// would: how far a body can be moved by one frame of the dance, and how often it
// crosses its own height. Neither is a thing the two tiers could see before --
// a screenshot cannot catch a teleport and a suite that steps a second at a time
// steps straight over one.

import { readFileSync } from 'node:fs';
import { group, ok, run, state, yard, P, WORKER } from './helpers.mjs';
import { DANCE_BUZZ, JIG_PACE } from '../src/config.js';

// Every frame of the next `secs` seconds, per body: where it is, how high, and
// which move it is in the middle of.
// `move` alone will not do for "is this body dancing": a body keeps its mark
// and its move through a fall even on the frames the mess walk is the thing
// moving it, so the field is set on frames the dance did not draw. `jigOn` is
// the frame the dance last ran, which is the question being asked here.
const film = secs => {
  const shot = yard.S.workers.map(() => []);
  for (let f = 0; f < Math.round(secs * 60); f++) {
    run(1 / 60);
    const t = yard.clock.now();
    yard.S.workers.forEach((w, i) =>
      shot[i].push({ x: w.x, y: w.y, foot: w.foot, move: w.jigOn === t ? w.move : null }));
  }
  return shot;
};

group('the dance joins up instead of teleporting', async () => {
  // A yard somebody actually played, so the gang are a real gang: a save has
  // bodies mid-errand, mid-commute and stood about, and every one of them joins
  // the celebration from wherever it was caught. A crew posted by hand are all
  // stood in a row doing the same thing, which is the one arrangement where a
  // bad join is hardest to see.
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8'));
  yard.restore();
  window.__next();                             // the rock goes; the beat starts
  run(1 / 60);                                 // one frame for the yard to notice
  const found = state().dancing;
  const shot = film(7);
  window.__crew(0, 0);

  // A join is any frame where the move a body is in changed -- into the dance,
  // out of it, or from one move to the next. Half a cell is the bar: it is under
  // the stride a body takes anyway, so a join that passes this cannot be seen as
  // a jump. The old dance came in at fifteen pixels of height.
  //
  // Height at every join, and ground only between two moves. A body walks into
  // the dance and walks out of it, and on a yard whose legs have been bought up
  // a stride is thirteen pixels: measuring the ground it covers on the frame it
  // stops walking would be measuring the walk. Its height is another matter --
  // walking or not, a body is on the ground on both sides of that frame or it
  // has jumped.
  //
  // A cell at the edges and half of one in the middle, and the difference is
  // the ground rather than slack. A rockhand celebrates on the bare floor -- it
  // walks out of the footprint to do it -- so the frame it goes back to work is
  // the frame it puts its foot back on the rock, which stands a couple of pixels
  // proud of the floor. That is a body stepping onto something, and it is the
  // rock's height, not the dance's.
  let joins = 0, worst = 0, worstAt = '', edge = 0, edgeAt = '';
  // and the biggest single frame *inside* a move as well, because a move that
  // lurched in the middle would be just as visible and would slip past a check
  // that only looked at the edges.
  let inside = 0;
  for (const body of shot) {
    for (let f = 1; f < body.length; f++) {
      const a = body[f - 1], b = body[f];
      if (!a.move && !b.move) continue;
      const both = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      if (a.move !== b.move) {
        joins++;
        const what = `${a.move || 'still'} -> ${b.move || 'still'}`;
        if (a.move && b.move) {
          if (both > worst) { worst = both; worstAt = what; }
        } else {
          const up = Math.abs(b.y - a.y);
          if (up > edge) { edge = up; edgeAt = what; }
        }
      } else inside = Math.max(inside, both);
    }
  }

  // How often a body crosses its own height. A hop is a body pleased with
  // itself at about one a second; the same hop at two and a half a second, which
  // is what it was, is a body with a fault.
  //
  // A move's own tempo, which means two tops of the SAME move. It used to count
  // any two tops in a row, and that reads the gap across a move change as a
  // tempo: a spin that ends near its top and a step that peaks shortly after are
  // two bounces half a second apart and nothing is going quickly at all. The
  // whole crew dancing simply made that coincidence common -- it came out at
  // 1.88 a second on a hauler whose own moves run at 1.1. What happens at a
  // change of move is what the three join checks above measure, and they measure
  // it properly: half a cell, in the frame it happens.
  let quickest = 0;
  for (const body of shot) {
    const ups = [];
    for (let f = 1; f < body.length - 1; f++) {
      if (!body[f].move) continue;
      // the top of a bounce: as high as this body got before coming back down
      if (body[f].y < body[f - 1].y && body[f].y <= body[f + 1].y) ups.push(f);
    }
    for (let i = 1; i < ups.length; i++) {
      if (body[ups[i]].move !== body[ups[i - 1]].move) continue;
      quickest = Math.max(quickest, 60 / (ups[i] - ups[i - 1]));
    }
  }

  // And nobody is switched off in mid-air. A body only leaves the ground if it
  // can be back down before the yard stops watching, so the last frame of
  // anybody's dance has its feet on it.
  let hanging = 0;
  for (const body of shot) {
    for (let f = 1; f < body.length; f++)
      if (body[f - 1].move && !body[f].move && body[f - 1].y < body[f - 1].foot - 1) hanging++;
  }

  return [
    ok(found, 'a rock came off and the yard celebrated it'),
    ok(joins >= 8, 'the gang went through some moves', `${joins} joins`),
    // Half a cell, or a frame and a half of the pace the dance travels at,
    // whichever is the larger. The bar is about what can be SEEN as a jump, and
    // a body already moving two or three pixels a frame cannot be held to less
    // than it covers anyway -- pinning half a cell made the bar a fact about
    // one value of `JIG_PACE` rather than about the picture.
    ok(worst <= Math.max(P / 2, JIG_PACE * 1.5),
       'and no join between two moves shifts a body more than it walks anyway',
       `worst ${worst.toFixed(2)}px, ${worstAt}`),
    ok(edge <= P, 'nor does going into the dance or coming out of it lift one a cell',
       `worst ${edge.toFixed(2)}px of height, ${edgeAt}`),
    ok(inside <= P / 2, 'and nothing lurches inside a move either',
       `worst ${inside.toFixed(2)}px`),
    // Under the pace that reads as buzzing, which is the thing this is actually
    // about -- see `DANCE_BUZZ`. It was 1.4, which was the tempo of the day
    // written down as a rule, so winding the dance up to something less floaty
    // failed a check about nothing.
    ok(quickest < DANCE_BUZZ, 'and no body crosses its own height fast enough to buzz',
       `quickest ${quickest.toFixed(2)} a second against ${DANCE_BUZZ}, over ${WORKER}px`),
    ok(hanging === 0, 'and nobody is left hanging when the dance is over',
       `${hanging} bodies switched off in the air`)
  ];
}, 20250830);
