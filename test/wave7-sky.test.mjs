// Wave 7, track A: the sky's plume, the reunion and the pit gang's spacing. One
// group per item, each from a fresh game. (A4, the buried square's core errand,
// went with the square being lodged in the ground: it cannot walk anywhere.)

import { group, ok, run, runUntil, state, yard, P, WORKER } from './helpers.mjs';

const { skyMote, foul } = await import('../src/smog/vents.js');
const { SKY } = await import('../src/smog/band.js');
const { nearestMuck, muckCols, MUCK_ELBOW, colAt } = await import('../src/smog/layer.js');
// `surfaceUnder`, not `walkY`. The ground line does not know the rock is there
// (see the note over `surfaceUnder` in crew/body.js): a body standing perfectly
// well on the hill's face reads as five cells of air when it is measured against
// the yard's floor, which is what this check used to do. `surfaceUnder` asks the
// way the body is actually on -- the yard, a working, or the hill -- and a body
// genuinely hovering over open yard still answers with the floor, so the fault
// this is here to catch is caught as squarely as it ever was.
const { surfaceUnder } = await import('../src/crew/body.js');

// --- A1: motes fade in, and the plume is born wide -----------------------------
group('wave7 A1: a mote is born at nothing and comes up to weight', () => {
  const checks = [];
  const m = skyMote(100, 100);
  checks.push(ok(m.fade === 0, 'a fresh mote is born at fade 0', `fade ${m.fade}`));
  checks.push(ok(typeof m.seed === 'number', 'and carries its own wander seed'));

  // A machine's dirt goes up as puffs; nothing else's does. Enough grains for a
  // handful of puffs, at one x, so the birth scatter can be read off them.
  const before = SKY.length;
  const ventX = 900;
  foul(400, ventX, yard.S.groundY - 60, 'mach');
  const born = SKY.slice(before);
  checks.push(ok(born.length >= 10, 'a heavy foul puts up a plume of puffs',
    `${born.length} born`));
  checks.push(ok(born.every(p => p.fade === 0), 'every puff is born invisible'));
  // The foot of the plume is eight cells of scatter now, not three: at least
  // one of a dozen puffs lands outside the old +/-9px band.
  const spread = Math.max(...born.map(p => Math.abs(p.x - ventX)));
  checks.push(ok(spread > P * 1.6, 'the birth scatter is wider than the old band',
    `widest ${spread.toFixed(1)}px from the vent`));

  // And they come up to weight over the climb rather than popping to it.
  run(0.5);
  const early = born.filter(p => !p.gone).map(p => p.fade);
  checks.push(ok(early.length > 0 && early.every(f => f > 0 && f < 1),
    'half a second in, every puff is mid-fade', `fades ${early.slice(0, 3).map(f => f.toFixed(2))}`));
  run(4);
  const later = born.filter(p => !p.gone && p.age <= 5.5).map(p => p.fade);
  checks.push(ok(later.every(f => f === 1), 'and at full weight well before the plume thins'));
  return checks;
});

// --- A2: nobody rises during the reunion ---------------------------------------
group('wave7 A2: the first-rock reunion has no bodies in the air', () => {
  const checks = [];
  // The player's route to the beat: hire rock hands and let them finish the
  // first rock. The reunion arms itself the moment the last of it goes.
  window.__crew(3);
  window.__levels({ pickLevel: 8 });          // the walk is the subject, not the mining
  const mined = runUntil(() => state().rock <= 0, 420);
  checks.push(ok(mined, 'the crew mine out the first rock'));
  const met = runUntil(() => yard.S.intro === 'meet', 30);
  checks.push(ok(met, 'and the reunion begins'));

  // Through the whole meeting, no body that is not mid-walk is ever off its
  // footing: they duck aside and stand instead of jigging under the camera.
  let rose = null;
  for (let i = 0; i < 60 && yard.S.intro === 'meet'; i++) {
    run(0.1);
    for (const w of yard.S.workers) {
      if (w.walking || w.inside || w.floating) continue;
      // `surfaceUnder` answers with a body's TOP edge, which is what `w.y` is.
      const stood = surfaceUnder(w);
      if (stood - w.y > 1.5)
        rose = `worker at x ${w.x.toFixed(0)} is ${(stood - w.y).toFixed(1)}px up`;
    }
  }
  checks.push(ok(!rose, 'no standing body leaves the ground during the meeting', rose || ''));
  checks.push(ok(yard.S.intro !== 'meet', 'and the meeting ends on its own'));
  return checks;
});

// jig never latches a walking body's foot: handed a walker, the dance engine
// declines the frame instead of freezing the walk's y as the ground.
group('wave7 A2: the dance never latches a walking body', () => {
  const checks = [];
  window.__crew(2, 2);
  runUntil(() => yard.S.workers.length >= 2, 20);
  // A rock finishing starts a celebration while some bodies are still walking;
  // through it, no walking body may ever hold a dance mark.
  window.__next();
  let latched = null;
  for (let i = 0; i < 80; i++) {
    run(0.1);
    for (const w of yard.S.workers)
      if (w.walking && w.jigAt != null) latched = `a walking body holds jigAt ${w.jigAt}`;
  }
  checks.push(ok(!latched, 'no walking body ever holds a dance mark', latched || ''));
  return checks;
});

// --- A3: pit spacing gets variance, claims stay exclusive ----------------------
group('wave7 A3: muck claims are jittered per body and never shared', () => {
  const checks = [];
  // A wide, uniform strip of mess, laid by hand: this group is about how the
  // claims are handed out, not about the weather that usually lays it.
  const m = muckCols();
  const c0 = colAt(yard.S.cx) - 120;
  for (let c = c0; c < c0 + 240; c++) m[c] = 2;

  const hands = ['Alma', 'Bertram', 'Cleo', 'Dov', 'Edda', 'Fife']
    .map(name => ({ name, type: 'worker' }));
  const wx = yard.S.cx;
  const taken = new Set();
  const picks = hands.map(h => nearestMuck(wx, taken, h)).filter(x => x != null).map(colAt);
  checks.push(ok(picks.length === hands.length, 'every hand is granted a column'));
  checks.push(ok(new Set(picks).size === picks.length,
    'no two hands ever hold the same column', picks.join(', ')));

  // The gaps are uneven: sorted, at least two different spacings show up.
  const sorted = [...picks].sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((c, i) => c - sorted[i]);
  checks.push(ok(new Set(gaps).size > 1, 'the gang stands at uneven gaps', gaps.join(', ')));
  // Old behavior was a picket line at exactly MUCK_ELBOW + 1 everywhere.
  checks.push(ok(!gaps.every(g => g === MUCK_ELBOW + 1),
    'and not on the old picket line', `all ${gaps[0]}`));

  // Stable per body: the same hand asked twice from a clean slate picks the
  // same column -- the jitter is who it is, not a fresh roll.
  const again = colAt(nearestMuck(wx, new Set(), hands[0]));
  const first = colAt(nearestMuck(wx, new Set(), hands[0]));
  checks.push(ok(again === first, 'a body\'s jitter is stable across frames',
    `${again} then ${first}`));

  for (let c = c0; c < c0 + 240; c++) m[c] = 0;   // leave the yard clean
  return checks;
});

group('wave7 A3: a rained-on yard never doubles a claim (the player\'s route)', () => {
  const checks = [];
  window.__crew(0, 6);
  window.__air({ haze: state().smog.cap });
  runUntil(() => state().smog.raining, 90);
  runUntil(() => !state().smog.raining, 120);
  let doubled = null;
  for (let i = 0; i < 60; i++) {
    run(0.5);
    const claims = yard.S.workers.map(w => w.muckAt).filter(c => c != null);
    if (new Set(claims).size !== claims.length) doubled = `frame ${i}: ${claims.join(', ')}`;
  }
  checks.push(ok(!doubled, 'no two shovelling bodies ever hold one column', doubled || ''));
  return checks;
});
