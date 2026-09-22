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
import { group, ok, run, runUntil, state, yard, openSites, P, WORKER } from './helpers.mjs';
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
  // Back on rock one, which is the only rock that gets a dance now (wave
  // polish, A1); the gang on the crest of rock forty-two come down to it, and
  // are given a moment to land before the beat starts.
  window.__jump(1);
  run(2);
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

// Everybody, including a quarrier on the floor of the cut. `onBridge` kept a
// body on the deck out of the dance -- a body stopped on the ramp danced on a
// slope -- and asked the span alone, which the whole cut is under: every
// quarrier on the floor was "on the bridge" and stood rigid through every
// celebration while the yard paid the pause for it (critics 2026-09-10, A6).
group('the gang on the floor of the cut dance too', async () => {
  window.__reset();
  window.__crew(2, 4, 4);
  window.__fullSites();
  // Rock one is the only rock that gets a dance now (wave polish, A1), and its
  // finish is the reunion unless the reunion is behind it already.
  yard.S.beatsDone.push('meet', 'part');
  const gang = () => yard.S.workers.filter(w => w.type === 'quarrier');
  const floorOf = () => gang().filter(w => w.y + WORKER > yard.S.groundY + 1);
  const down = runUntil(() => floorOf().length === 4, 120);
  window.__next();
  // A jumping body's feet leave the ground line, so who is "on the floor" is
  // read before the dance; who is dancing is the most of the gang ever in it
  // at once over the celebration, sampled every tenth of a second.
  let danced = false, jigging = 0;
  for (let i = 0; i < 40; i++) {
    run(0.1);
    danced = danced || state().dancing;
    jigging = Math.max(jigging, gang().filter(w => w.jigAt != null).length);
  }

  window.__reset();
  return [
    ok(down, 'four quarriers are on the floor of the cut'),
    ok(danced, 'and the yard celebrates'),
    ok(jigging === 4, 'and every one of them is in the dance', `${jigging} of 4`)
  ];
});

// Joined out of a walk: the beat starting while the crew are on their way
// across the yard, which the groups above never arrange. A body stops its
// walk and dances from the height the walk had it at; one still easing up to
// its own surface does not join until it is there (`jig`), which is what
// keeps this under a cell.
group('a body joins the dance out of a commute without a snap', async () => {
  window.__reset();
  openSites();
  window.__fullSites();                        // plots enough for five
  window.__crew(1, 6);
  yard.S.beatsDone.push('meet', 'part');
  run(2);
  window.__assign('farmhands', 5);             // across the yard to the plots
  run(1);
  const walking = yard.S.workers.filter(w => w.walking).length;
  window.__next();
  // Every body, every frame the yard is celebrating; a fall is its own motion.
  let worst = 0, at = '';
  const last = new Map();
  for (let f = 0; f < 6 * 60; f++) {
    run(1 / 60);
    if (!(yard.S.danceUntil > yard.clock.now())) { last.clear(); continue; }
    for (const w of yard.S.workers) {
      const was = last.get(w);
      if (w.falling || w.lifted) { last.delete(w); continue; }
      if (was != null && Math.abs(w.y - was) > worst) {
        worst = Math.abs(w.y - was);
        at = `${w.name} (${w.type}) ${Math.round(was)} -> ${Math.round(w.y)}, move ${w.move}`;
      }
      last.set(w, w.y);
    }
  }
  const dancers = yard.S.workers.filter(w => w.jigOn).length;
  window.__crew(0, 0, 0);
  return [
    ok(walking >= 3, 'the crew are commuting when the rock goes', `${walking} walking`),
    ok(dancers >= 3, 'and they dance', `${dancers} danced`),
    ok(worst <= P + 1e-6, 'and nobody moves more than a cell of height in a frame',
       `worst ${worst.toFixed(2)}px: ${at}`)
  ];
});
