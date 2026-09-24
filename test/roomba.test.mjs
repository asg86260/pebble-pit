// The janitors' roombas (DESIGN.md, "The janitors' roomba").
//
// What is checked is the owner's vote: "it cleans everything. one janitor
// needed to control the roombas. buy up to 3 roombas. emit pollution." A
// roomba is bought off the closet's board, up to three, and stands on its slot
// of the dock; it drives to the mess on the open yard, poop and the sky's muck
// alike, and carries it home in its bin, where the one janitor left tips it in
// at the closet's door -- nothing leaves the yard any other way; with nobody at
// the closet the roombas sit docked; they smoke; they are never crew; and a
// reload leaves each where it was with what it had in its bin.

import { group, ok, state, run, runUntil, buyNow } from './helpers.mjs';
import { P, ROOMBA_MAX, ROOMBA_W, KIT_OUT } from '../src/config.js';
import { S, outhouse } from '../src/state.js';
import { dockX, binOf } from '../src/crew/roomba.js';
import { onOpenYard, poopCols } from '../src/smog.js';

const row = key => window.__rows().find(r => r.key === key);
const soot = () => state().smog.skyKinds?.mach || 0;
const bots = () => S.roombaBots || [];

// The closet up with one cap, a janitor on it, spare hands to build with and
// the coins to pay.
function closet() {
  window.__reset();
  window.__crew(0, 3);
  window.__loo();
  window.__air({ janitors: 1, haze: 0, muck: 0 });
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 90000 });
}

// Poop on the open yard either side of the closet: only a janitor or a roomba
// may shift it, and the janitor minding the roombas leaves the open yard to
// them, so every grain of it that goes, goes by roomba.
const c0 = () => Math.floor((outhouse.x + outhouse.w / 2) / P);
function poopOut(every = 9, deep = 2) {
  const from = c0() - 80, to = c0() + 100;
  window.__poopSet(c => (c > from && c < to && c % every === 0 && onOpenYard(c)) ? deep : 0);
}
const openPoop = () => { const q = poopCols(); let n = 0; for (let c = 0; c < q.length; c++) if (q[c] && onOpenYard(c)) n += q[c]; return n; };
const allPoop = () => poopCols().reduce((n, v) => n + (v || 0), 0);
const binned = kind => bots().reduce((n, r) => n + (r[kind] | 0), 0);

group('a roomba is sold on the closet\'s board, up to three, and each stands on its own slot', async () => {
  closet();
  const oneCap = row('roomba');
  S.looPosts = 2;
  window.__air({ janitors: 2 });
  const twoCaps = row('roomba');
  const people = S.workers.length;
  const first = buyNow('roomba');
  run(2);
  const s1 = state();
  const b0 = bots()[0];
  const second = buyNow('roomba'), third = buyNow('roomba');
  const fourth = window.__buy('roomba');
  run(1);
  const top = row('roomba');
  return [
    ok(!oneCap?.shown && twoCaps?.shown, 'the row waits on the closet\'s second cap',
       `one cap ${!!oneCap?.shown}, two ${!!twoCaps?.shown}`),
    ok(first && s1.roombas === 1 && s1.roombaBots.length === 1, 'buying one puts a roomba in the yard',
       `${s1.roombas} owned, ${s1.roombaBots.length} in the yard`),
    ok(b0 && Math.abs(b0.x - dockX(0)) < 1 && b0.goal === 'dock', 'on its slot of the dock',
       `${b0?.x} against ${dockX(0)}, ${b0?.goal}`),
    ok(s1.janitors === 1, 'and the closet is down to the one janitor who minds it', `${s1.janitors}`),
    ok(S.workers.length === people && !S.workers.some(w => w.roomba), 'nobody on the crew is it'),
    ok(second && third && !fourth && S.roombas === ROOMBA_MAX, 'three and no more',
       `${S.roombas} owned; a fourth ${fourth ? 'sold' : 'refused'}`),
    ok(bots().every((r, i) => Math.abs(r.x - dockX(i)) < 1), 'each on its own slot',
       bots().map(r => Math.round(r.x)).join(', ')),
    ok(top && top.rung === ROOMBA_MAX, 'and the row reads its end', `${top?.rung}`),
    ok(row('tuneroomba')?.shown, 'with a ladder of red for the three of them')
  ];
});

group('the roombas drive to the mess and carry it home, and the tender tips it in at the door', async () => {
  closet();
  S.looPosts = 2;
  buyNow('roomba'); buyNow('roomba');
  run(1);
  poopOut();
  // and the sky's muck on the open yard too: "it cleans everything"
  const from = c0() - 60, to = c0() + 80;
  window.__muckSet(c => (c > from && c < to && c % 5 === 0 && onOpenYard(c)) ? 1 : 0);
  const poop0 = openPoop(), all0 = allPoop();
  const soot0 = soot();
  let out = 0, loaded = 0, muckIn = 0, strayed = 0, leaked = 0;
  // From its cap stand, left of the closet, to the far end of the dock.
  const span = [outhouse.x - KIT_OUT.outhouse - P * 2, dockX(ROOMBA_MAX - 1) + ROOMBA_W * P + P * 4];
  for (let i = 0; i < 90; i++) {
    run(0.5);
    for (const r of bots()) {
      if (Math.abs(r.x - dockX(bots().indexOf(r))) > P * 20) out++;
      if (binOf(r) > 0 && r.goal !== 'dock') loaded++;
    }
    muckIn = Math.max(muckIn, binned('muck'));
    const j = S.workers.find(w => w.type === 'janitor');
    if (j && (j.x < span[0] || j.x > span[1])) strayed++;
    // Every grain of poop is on the ground, in a bin, or gone in at the door:
    // never more on the ground and in the bins than there was.
    if (allPoop() + binned('poop') > all0) leaked++;
    if (!openPoop() && !binOf(bots()[0]) && !binOf(bots()[1]) && i > 10) break;
  }
  const soot1 = soot();
  return [
    ok(poop0 > 0, 'there is poop on the open yard', `${poop0}`),
    ok(out > 0, 'they drove out to it', `${out} samples out`),
    ok(loaded > 0, 'and drove with it in their bins', `${loaded} samples laden`),
    ok(muckIn > 0, 'the sky\'s muck goes in the bin too', `${muckIn} at most`),
    ok(openPoop() === 0, 'the open yard is clean of it', `${poop0} -> ${openPoop()}`),
    ok(bots().every(r => binOf(r) === 0 && r.goal === 'dock'), 'and they are home, emptied',
       bots().map(r => `${r.goal} ${binOf(r)}`).join('; ')),
    ok(leaked === 0, 'nothing grew on the way', `${leaked} samples`),
    ok(strayed === 0, 'the janitor minding them kept to the closet and the dock', `${strayed} samples`),
    ok(soot1 > soot0, 'and they smoked while they worked', `${soot0} -> ${soot1}`)
  ];
});

group('with nobody at the closet the roombas sit on the dock', async () => {
  closet();
  S.looPosts = 2;
  buyNow('roomba');
  run(1);
  window.__air({ janitors: 0 });
  run(2);
  poopOut();
  const poop0 = openPoop();
  run(20);
  const idle = { poop: openPoop(), x: bots()[0].x, goal: bots()[0].goal, bin: binOf(bots()[0]) };
  window.__air({ janitors: 1 });
  runUntil(() => openPoop() < poop0, 60);
  return [
    ok(idle.poop === poop0 && idle.goal === 'dock' && Math.abs(idle.x - dockX(0)) < 1 && !idle.bin,
       'nobody minding: it stays home and the mess stays put',
       `${poop0} -> ${idle.poop}, ${idle.goal} at ${Math.round(idle.x)}`),
    ok(openPoop() < poop0, 'and it goes out once there is a janitor at the closet', `${poop0} -> ${openPoop()}`)
  ];
});

group('a reload leaves each roomba where it was, with what was in its bin', async () => {
  closet();
  S.looPosts = 2;
  buyNow('roomba');
  run(1);
  poopOut(5, 3);
  runUntil(() => bots()[0].goal !== 'dock' && binOf(bots()[0]) > 0 &&
                 Math.abs(bots()[0].x - dockX(0)) > P * 10, 40);
  const was = { x: bots()[0].x, bin: binOf(bots()[0]), poop: bots()[0].poop };
  window.__reload();
  const now = bots()[0];
  return [
    ok(was.bin > 0, 'it was out with something in its bin', `${was.bin}`),
    ok(now && Math.abs(now.x - was.x) <= P, 'it is where it was', `${Math.round(was.x)} -> ${Math.round(now?.x)}`),
    ok(now && binOf(now) === was.bin && now.poop === was.poop, 'with the same bin', `${was.bin} -> ${now && binOf(now)}`),
    ok(S.roombas === 1 && bots().length === 1, 'and still one of it')
  ];
});
