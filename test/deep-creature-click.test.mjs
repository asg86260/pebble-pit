// A click on one of the deep's creatures (DESIGN.md, "The deep's zones"):
// the birds' handful, and each kind's own reaction (the owner's picks off
// docs/mocks/creature-clicks-2026-10-13.html: the school's flash-turn and
// bolt, every other kind its A). The handful sinks as loose scales and is
// money only once a gatherer has carried it to the crusher; the reaction
// plays in held poses over the creature's path and leaves it on that path,
// and nothing pops: not at the click, not at the end, not across a save
// read back. The stream's creatures are clicked the same way, and their
// reactions never move a meal.
//
// `startleFauna` and `startleStream` are the calls the pointer makes in the
// deep (input.js); the pointer's own way there is the browser tier's
// (selftest/deep.js).

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { FAUNA, FAUNA_REACT, FAUNA_POSES, FAUNA_STARTLE, FAUNA_SCALES, BIRD_DUST, P, FLOW_REACT, FLOW_KINDS,
         MEAL_SWIM_S } from '../src/config.js';
import { deepBed } from '../src/state.js';
import { POPULATION, COLS, startleFauna, faunaUnder, faunaReport, faunaAt, floorRowAt } from '../src/deep/fauna.js';
import { streamReport, startleStream } from '../src/deep/flow.js';
import { poseAt, STEP } from '../src/deep/react.js';
import { mealNow, nowS, BITE_BEFORE } from '../src/deep/meals.js';
import { deepX0, deepTop, hopperRect } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;
const gatherers = () => S.workers.filter(w => w.type === 'gatherer');

// The deep with one gatherer and nothing else to make scales: no fighter,
// so every scale on the floor is a creature's.
function deep() {
  window.__crew(0, 4);
  window.__deepCrew({ spare: 1 });
  window.__view('deep');
  run(0.5);
}
// The stream swims only once the snatch has opened the way down, and is
// drawn with the camera down there.
function deepStream() {
  window.__snatch({ played: true });
  deep();
  run(3);
}

// A creature well inside the deep, clear of both ends, to aim at; and clear
// of the crusher's hopper, where a scale let go falls straight in.
const clear = f => {
  const h = hopperRect(), mid = h.x + h.w / 2;
  return f.inside && f.cx > 40 && f.cx < COLS - 40 && Math.abs(f.x - mid) > P * 60;
};
const target = (want = () => true) => faunaReport().find(f => !f.bolting && !f.reacting && clear(f) && want(f));
const within = f => f.x > deepX0() && f.x < deepX0() + COLS * P;
// What a creature holds when it is not reacting, as the report writes it.
const HOME = [undefined, false, 1, undefined, undefined, false, false].join();
const shedBy = fn => { const n = S.sinking.length; const r = fn(); return { r, shaken: S.sinking.length - n }; };

// A reaction off its table, frame by frame: where it starts, how far it ever
// stands off home, and where it ends.
function walk(R) {
  let off = 0, last = null;
  for (let s = 0; s < R.end + 0.5; s += STEP / 2) {
    const p = poseAt(R, s);
    const away = Math.abs(p.dx) + Math.abs(p.dy) + (p.pose != null) + p.turn + p.vflip + (p.lights != null) + p.halo
      + Math.abs(p.spacing - 1) + (p.clock != null) + (p.gain > 0) + (p.knot > 0) + (p.mouths != null);
    off = Math.max(off, away);
    if (s >= R.end) last = p;
  }
  return { off, home: last && last.dx === 0 && last.dy === 0 && last.pose == null && !last.turn && !last.vflip
    && last.lights == null && last.clock == null && !last.knot && last.mouths == null && last.spacing === 1 };
}

group('every kind has its own reaction, and each ends home', async () => {
  const kinds = FAUNA.map(r => r.kind);
  const zone = kinds.map(k => ({ k, R: FAUNA_REACT[k] }));
  const missing = zone.filter(z => !z.R).map(z => z.k);
  const plays = zone.filter(z => z.R && !z.R.bolt).map(z => ({ k: z.k, ...walk(z.R) }));
  const stream = FLOW_REACT.map((R, k) => ({ k, ...walk(R) }));
  const poses = zone.flatMap(z => (z.R && z.R.pose ? z.R.pose.map(p => p[1]) : [])).filter(p => typeof p === 'string');
  return [
    ok(!missing.length, 'every kind in the table has one, those switched off too', missing.join(' ')),
    ok(FAUNA_REACT.school.bolt && Object.values(FAUNA_REACT).filter(R => R.bolt).length === 1, 'the school alone bolts'),
    ok(plays.every(p => p.off > 0), 'each moves or changes its drawing', plays.filter(p => !p.off).map(p => p.k).join(' ')),
    ok(plays.every(p => p.home), 'and is home by its end', plays.filter(p => !p.home).map(p => p.k).join(' ')),
    ok(FLOW_REACT.length === FLOW_KINDS && stream.every(p => p.off > 0 && p.home), 'the stream\'s eight the same',
       stream.filter(p => !p.off || !p.home).map(p => p.k).join(' ')),
    ok(poses.every(p => FAUNA_POSES[p]), 'and every pose a reaction holds is drawn', poses.filter(p => !FAUNA_POSES[p]).join(' '))
  ];
});

// Every creature swimming, clicked the player's way (the pointer's call),
// one at a time, each followed frame by frame through its reaction.
group('a click on each creature plays its own reaction and drops a handful; it never jumps, and rejoins its path', async () => {
  deep();
  const out = [];
  for (const c of POPULATION) {
    if (FAUNA_REACT[c.kind].bolt) continue;
    // wait for it to be somewhere it can be clicked
    let f = null;
    runUntil(() => (f = faunaReport()[c.i], clear(f) && !f.reacting), 120);
    // one that never swims may stand out past the deep's ends, where no click reaches
    if (!clear(f)) { if (c.v) out.push({ kind: c.kind, why: 'never in reach' }); continue; }
    const { r: hit, shaken } = shedBy(() => startleFauna(f.x, f.y));
    const R = FAUNA_REACT[c.kind];
    let was = faunaReport()[c.i], worst = 0, played = 0, moved = 0, off = false;
    const t0 = now() / 1000;
    for (let i = 0; i < Math.ceil((R.end + 0.5) * 60); i++) {
      run(1 / 60);
      const r = faunaReport()[c.i], base = faunaAt(c, now() / 1000, floorRowAt);
      if (r.reacting) played++;
      // its own swim between two frames is under a cell; the rest is the
      // reaction's held step, the biggest in its table
      worst = Math.max(worst, Math.abs(Math.round(r.cx) - Math.round(was.cx)) + Math.abs(r.cy - was.cy));
      if (r.reacting) moved = Math.max(moved, Math.abs(r.cx - base.x) + Math.abs(r.cy - base.y) + (r.held !== HOME) + (r.dir !== base.dir));
      if (!r.reacting && now() / 1000 - t0 > R.end) off = off || Math.abs(r.cx - base.x) > 1e-9 || r.cy !== base.y;
      was = r;
    }
    out.push({ kind: c.kind, hit, shaken, played, moved, worst, off, end: R.end });
  }
  const say = out.map(o => o.why ? `${o.kind}: ${o.why}` : `${o.kind}: hit ${o.hit}, ${o.shaken} scales, ${o.played} frames, off ${o.moved}, step ${o.worst}`).join('; ');
  const STEP_MAX = 7;   // the lantern's dart, six cells in a held step, and its swim
  return [
    ok(out.length >= POPULATION.filter(c => c.v && !FAUNA_REACT[c.kind].bolt).length && out.every(o => o.hit), 'every one of them is there to be clicked', say),
    ok(out.every(o => o.shaken === FAUNA_SCALES && FAUNA_SCALES === BIRD_DUST), "each shakes loose the bird's handful", say),
    ok(out.every(o => Math.abs(o.played / 60 - o.end) < 0.1), 'each plays its reaction for its length', say),
    ok(out.every(o => o.moved > 0), 'and is not on its path the while: it moves or holds a pose', say),
    ok(out.every(o => o.worst <= STEP_MAX), 'never a jump bigger than a held step', say),
    ok(out.every(o => !o.off), 'and after, it is back on its own path', say)
  ];
}, { reload: false });

group('a creature mid-reaction cannot be clicked again until it is done', async () => {
  deep();
  const f = target(g => g.kind !== 'school');
  const c = POPULATION[f.i];
  startleFauna(f.x, f.y);
  const r0 = c.r0;
  run(0.3);
  const mid = faunaReport()[f.i];
  const under = faunaUnder(mid.x, mid.y);
  const { r: again, shaken } = shedBy(() => (under === c ? startleFauna(mid.x, mid.y) : false));
  const same = c.r0 === r0;
  runUntil(() => !faunaReport()[f.i].reacting, 10);
  const back = faunaReport()[f.i];
  const after = shedBy(() => startleFauna(back.x, back.y));
  return [
    ok(mid.reacting, 'it is in its reaction', f.kind),
    ok(under !== c && !again && shaken === 0 && same, 'a click on it finds nothing, and nothing is shed', `${under && under.kind} ${shaken}`),
    ok(after.r && after.shaken === FAUNA_SCALES && c.r0 > r0, 'once it is done, the next click plays it again')
  ];
}, { reload: false });

// The school's reaction is a bolt (the owner's B): the whole shoal turns
// as one and holds, then streaks off the nearer end in held poses.
group('a click on the school: it turns as one, holds, and bolts off the deep; its handful is carried to the crusher', async () => {
  deep();
  let f = null;
  runUntil(() => (f = target(g => g.kind === 'school')), 120);
  const c = POPULATION[f.i];
  const scales = S.scales, lying = deepBed.n, sinking = S.sinking.length;
  const hit = startleFauna(f.x, f.y);
  const shaken = S.sinking.length - sinking;
  const from = S.sinking.slice(sinking).map(s => ({ x: s.x, y: s.y }));
  const turned = faunaReport()[f.i];
  run(FAUNA_REACT.school.hold - 2 / 60);
  const held = faunaReport()[f.i];
  const step = Math.ceil(FAUNA_STARTLE.pace / FAUNA_STARTLE.rate) + 1;
  let was = held, worst = 0, frames = 0, gone = false;
  while (frames < 60 * 30) {
    run(1 / 60); frames++;
    const r = faunaReport()[f.i];
    worst = Math.max(worst, Math.abs(r.cx - was.cx));
    was = r;
    if (!r.inside) { gone = true; break; }
  }
  const landed = runUntil(() => S.sinking.length === sinking, 30);
  const onFloor = deepBed.n - lying, banked = S.scales - scales;
  let carried = 0;
  for (let i = 0; i < 60 * 90 && S.scales - scales < shaken; i++) {
    run(1 / 60);
    carried = Math.max(carried, ...gatherers().map(w => w.carry || 0));
  }
  return [
    ok(hit, 'the click landed on it', `${f.kind} at ${Math.round(f.x)},${Math.round(f.y)}`),
    ok(shaken === FAUNA_SCALES, "it shakes loose the bird's handful", `${shaken} of ${FAUNA_SCALES}`),
    ok(from.every(s => Math.abs(s.x - f.x) <= P && Math.abs(s.y - f.y) <= P), 'from where it was', from.map(s => `${Math.round(s.x)},${Math.round(s.y)}`).join(' ')),
    ok(turned.dir === c.ddir && Math.abs(held.cx - turned.cx) < 1, 'turned on the click to face its way, and held there', `${turned.dir} ${c.ddir}, ${held.cx - turned.cx}`),
    ok(gone, 'then it leaves the deep', `${frames} frames, at ${was.cx}`),
    ok(worst <= step, 'a held pose at a time, never a jump', `${worst} cells in a frame, ${step} at most`),
    ok(landed && onFloor >= shaken, 'the handful sinks to the floor', `${onFloor} lying`),
    ok(banked === 0, 'none of it is counted while it lies there', `${banked}`),
    ok(carried > 0, 'a gatherer carries it', `${carried} at most in arms`),
    ok(S.scales - scales >= shaken, 'and it is counted once it reaches the crusher', `${S.scales - scales}`)
  ];
}, { reload: false });

group('a click on empty water does nothing', async () => {
  deepStream();
  let spot = null;
  for (let gx = 10; gx < COLS - 10 && !spot; gx += 7) for (let gy = 4; gy < 120 && !spot; gy += 5) {
    const x = deepX0() + gx * P, y = deepTop() + gy * P;
    if (!faunaUnder(x, y) && !streamReport().some(s => Math.max(s.l - x, 0, x - s.r, s.top - y, y - s.bot) <= P * 6)) spot = { x, y };
  }
  const sinking = S.sinking.length, before = faunaReport().map(f => f.bolting || f.reacting);
  const hit = startleFauna(spot.x, spot.y) || startleStream(spot.x, spot.y);
  return [
    ok(!hit, 'no creature there, nothing startled'),
    ok(S.sinking.length === sinking, 'and no scales shaken loose', `${S.sinking.length - sinking}`),
    ok(faunaReport().every((f, i) => (f.bolting || f.reacting) === before[i]), 'and nobody reacts')
  ];
});

// The school comes back in at the end it left, swimming, clickable again.
group('the bolted school comes back: in at the end it left, swimming, and clickable again', async () => {
  deep();
  let f = null;
  runUntil(() => (f = target(g => g.kind === 'school')), 120);
  startleFauna(f.x, f.y);
  const c = POPULATION[f.i];
  const step = Math.ceil(FAUNA_STARTLE.pace / FAUNA_STARTLE.rate) + 1;
  let was = faunaReport()[f.i], worst = 0, back = false;
  for (let i = 0; i < 60 * 180 && !back; i++) {
    run(1 / 60);
    const r = faunaReport()[f.i];
    if (r.inside && was.inside) worst = Math.max(worst, Math.abs(r.cx - was.cx));
    back = !r.bolting && within(r);
    was = r;
  }
  const r = faunaReport()[f.i];
  const again = back && startleFauna(r.x, r.y);
  return [
    ok(back, 'it swims back into the deep', `${c.kind}, back at ${c.back.toFixed(1)}s`),
    ok(worst <= step, 'never jumping inside it', `${worst} cells in a frame`),
    ok(again, 'and can be startled again')
  ];
}, { reload: false });

// A save read back on the clock that wrote it: a reaction under way carries
// on from the pose it was in.
group('read back mid-reaction, a creature carries on from where it was: nothing teleports', async () => {
  deepStream();
  const f = target(g => g.kind !== 'school');
  startleFauna(f.x, f.y);
  run(0.4);
  const before = faunaReport()[f.i];
  const s = streamReport().find(g => g.clickable && g.near);
  if (s) startleStream(s.x, s.y);
  run(0.3);
  const sBefore = s && streamReport().find(g => g.key === s.key);
  const fMid = faunaReport()[f.i];
  window.__reload();
  const after = faunaReport()[f.i];
  const sAfter = s && streamReport().find(g => g.key === s.key);
  return [
    ok(before.reacting && fMid.reacting, 'it was mid-reaction', f.kind),
    ok(after.reacting && after.cx === fMid.cx && after.cy === fMid.cy && after.pose === fMid.pose, 'and is in the same pose after the reload',
       `${fMid.cx},${fMid.cy} ${fMid.pose} then ${after.cx},${after.cy} ${after.pose}`),
    ok(s && sBefore.reacting && sAfter && sAfter.reacting && Math.abs(sAfter.x - sBefore.x) < P && sAfter.y === sBefore.y,
       'a stream creature too', s ? `${sBefore.x},${sBefore.y} then ${sAfter && sAfter.x},${sAfter && sAfter.y}` : 'none to click')
  ];
}, { reload: false });

group('a new game finds every creature home', async () => {
  deep();
  const f = target(g => g.kind !== 'school');
  startleFauna(f.x, f.y);
  run(0.3);
  const was = faunaReport()[f.i].reacting;
  window.__seed(7);
  return [
    ok(was, 'it was reacting'),
    ok(POPULATION.every(c => c.t0 < 0 && c.r0 < 0), 'and after a new game nobody is')
  ];
}, { reload: false });

// --- the stream ---------------------------------------------------------------
// Every near creature swimming past, clicked until each of the eight kinds
// has been: its handful and its reaction, and it swims on along its path.
group('a click on a stream creature: its handful and its own reaction, near and far, every kind', async () => {
  deepStream();
  const seen = new Map(), far = [];
  for (let k = 0; k < 60 * 6 && seen.size < FLOW_KINDS; k++) {
    for (const s of streamReport()) {
      if (!s.clickable || (s.near ? seen.has(s.kind) : far.length) || !within(s)) continue;
      const { r: hit, shaken } = shedBy(() => startleStream(s.x, s.y));
      const now0 = streamReport().find(g => g.key === s.key);
      run(FLOW_REACT[s.kind].end * 0.4);
      const mid = streamReport().find(g => g.key === s.key);
      const entry = { kind: s.kind, hit, shaken, reacting: now0 && now0.reacting, mid: mid && mid.reacting };
      if (s.near) seen.set(s.kind, entry); else far.push(entry);
      break;
    }
    run(1);
  }
  const all = [...seen.values()], say = all.map(e => `${e.kind}: ${e.hit} ${e.shaken} ${e.reacting}`).join('; ');
  return [
    ok(seen.size === FLOW_KINDS, 'every one of the eight kinds came by and was clicked', [...seen.keys()].join(' ')),
    ok(all.every(e => e.hit && e.shaken === FAUNA_SCALES), "each shakes loose the bird's handful", say),
    ok(all.every(e => e.reacting && e.mid), 'and plays its reaction', say),
    ok(far.length && far[0].hit && far[0].shaken === FAUNA_SCALES && far[0].reacting, 'a far crossing too', JSON.stringify(far[0] || null))
  ];
}, { reload: false });

// The meals are picked off the near stream on the stream's clock; a click's
// reaction is picture only, so every meal lands when it was due, and the one
// about to turn for the mouth is let be.
group('stream meals still arrive on time, however the stream is clicked', async () => {
  deepStream();
  window.__serpent({ stage: 0, wound: 0 });
  S.mealT = 0; S.mealI = null;
  const due = mealNow();
  const land = nowS() + due.toLand;
  let clicks = 0, refused = null, at = null;
  const meal0 = S.meal;
  for (let f = 0; f < 60 * (due.toLand + 5) && S.meal === meal0; f++) {
    yard.fast(1 / 60);
    // every half second, click everything there is to click
    if (f % 30 === 0) for (const s of streamReport()) if (s.clickable && startleStream(s.x, s.y)) clicks++;
    // the meal, once its turn is nearer than its reaction is long, is not clickable
    const m = mealNow();
    if (!refused && m.toLand - BITE_BEFORE - MEAL_SWIM_S < FLOW_REACT[m.kind].end && m.toLand > BITE_BEFORE + MEAL_SWIM_S) {
      const s = streamReport().find(g => g.key === 'n' + m.i);
      refused = s ? { clickable: s.clickable, took: startleStream(s.x, s.y) && streamReport().find(g => g.key === s.key).reacting && s.key } : { gone: true };
    }
    if (S.meal !== meal0) at = nowS();
  }
  return [
    ok(clicks > 3, 'the stream was clicked', `${clicks} clicks`),
    ok(S.meal === meal0 + 1, 'the meal landed', `${meal0} then ${S.meal}`),
    ok(at != null && Math.abs(at - land) <= 2 / 60, 'when it was due', `due ${land.toFixed(3)}, landed ${at && at.toFixed(3)}`),
    ok(refused && !refused.gone && !refused.clickable && !refused.took, 'and the creature it was could not be clicked near its turn', JSON.stringify(refused))
  ];
}, { reload: false });
