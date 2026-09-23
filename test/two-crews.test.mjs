// Two crews and a portal (DESIGN.md): the yard and the deep are two crews on
// one clock and one purse. The deep starts with the sqwife alone, grows only
// by its pods, builds its own works with its own hands, and nobody crosses
// between the halves. The player's way down is the wizards' portal. Every
// move here is made the player's way -- a row bought, a roster pressed, a
// body picked up -- and the deep itself is set up with the hooks.

import { group, ok, run, runUntil, state } from './helpers.mjs';
import { S } from '../src/state.js';
import { WORKER } from '../src/config.js';
import { rosterHit } from '../src/roster.js';
import { belowYard } from '../src/route.js';
import { deepFloor, deepTop } from '../src/deep/place.js';
import { goDeep } from '../src/view.js';

const post = key => state().roster.find(p => p.key === key);
const press = (key, which) => { const p = post(key); return !!p && rosterHit(p[which][0], p[which][1]); };
const below = () => S.workers.filter(w => belowYard(w));

// A yard past the snatch: every site built, the sqwife gone after him.
function twoCrews(portal = true) {
  window.__fullSites();
  window.__crew(0, 4);
  window.__snatch({ played: true, portal });
  run(1);
}

group("after the snatch the deep's crew is the sqwife alone, and a yard hire stays in the yard", async () => {
  twoCrews();
  runUntil(() => below().length === 1 && !below()[0].falling, 30);
  const deep0 = below().map(w => w.name);
  window.__grant({ dust: 1e7 });
  const bought = window.__buy('house');
  window.__finish();
  let down = 0;
  for (let f = 0; f < 60 * 20; f++) {
    run(1 / 60);
    if (below().some(w => !deep0.includes(w.name))) down++;
  }
  return [
    ok(deep0.length === 1 && S.deepCrew === 1 && S.brawlers === 1, "the deep's one hand, at the altar", `${deep0.length} below`),
    ok(S.pods === 1, 'living in the first pod', `pods ${S.pods}`),
    ok(bought, 'a room is bought'),
    ok(down === 0, 'and the new hand never goes down', `${down} frames with a stranger below`)
  ];
});

group("a pod is built by the deep's own hand, and its body is the deep's", async () => {
  twoCrews();
  runUntil(() => below().length === 1 && !below()[0].falling, 30);
  const yard = S.workers.filter(w => !belowYard(w)).map(w => w.name);
  window.__scales(99999);
  const bought = window.__buy('pod');
  let delver = null, offAltar = false, yardDown = false;
  for (let f = 0; f < 60 * 240 && S.pods < 2; f++) {
    run(1 / 60);
    const d = S.workers.find(w => w.type === 'delver');
    if (d) delver = { name: d.name, below: belowYard(d) };
    if (S.brawlers === 0) offAltar = true;
    if (S.workers.some(w => yard.includes(w.name) && belowYard(w))) yardDown = true;
  }
  run(5);
  return [
    ok(bought, 'the altar sells a pod'),
    ok(delver && delver.below, 'a deep builder puts it up, down there', JSON.stringify(delver)),
    ok(offAltar, 'with nobody spare, the sqwife leaves the altar to build it'),
    ok(!yardDown, "and none of the yard's hands went down"),
    ok(S.pods === 2 && S.deepCrew === 2 && below().length === 2, "the pod's body is the deep's", `pods ${S.pods}, deep ${S.deepCrew}`),
    ok(S.brawlers === 1, 'and she is back at the altar', `brawlers ${S.brawlers}`)
  ];
});

// A body thrown in the deep sinks there (crew/falls.js, `sink`): it never
// jumps, never leaves the deep, lands on the deep's floor and goes back to
// its work from there. It used to be stood on the yard's ground the frame it
// was let go of.
group('a hand thrown in the deep sinks to its floor and stays down there', async () => {
  const { lift, drop } = await import('../src/crew/pointer.js');
  twoCrews();
  runUntil(() => below().length === 1 && !below()[0].falling && !below()[0].walking, 60);
  const w = below()[0];
  lift(w);
  w.x -= 120; w.y -= 200;                 // carried up into the water and off to one side
  drop(w);
  let jump = 0, left = false, at = { x: w.x, y: w.y }, landed = false;
  for (let f = 0; f < 60 * 30; f++) {
    run(1 / 60);
    const b = S.workers.find(o => o.name === w.name);
    jump = Math.max(jump, Math.hypot(b.x - at.x, b.y - at.y));
    at = { x: b.x, y: b.y };
    if (b.y + WORKER <= deepTop()) left = true;
    if (!b.falling && Math.abs(b.y + WORKER - deepFloor()) < 2) landed = true;
  }
  const back = S.workers.find(o => o.name === w.name);
  return [
    ok(!left, 'it never came up out of the deep'),
    ok(jump < WORKER, 'it never jumped', `${jump.toFixed(1)}px in a frame`),
    ok(landed, "it came to rest on the deep's floor"),
    ok(back.type === 'brawler' && belowYard(back), 'and it is still the altar\'s, down there')
  ];
}, { reload: false });

// The way down is the wizards' portal: until it is conjured the view stays
// in the yard and there is no arrow; bought on the tower's board, a wizard
// flies out over the middle of the pit and pours it, and then the view can
// go down.
group("a wizard flies out and summons the portal, and only then does the view go down", async () => {
  const { whatIsAt } = await import('../src/input.js');
  const { arrowBox, onShaftArrow } = await import('../src/render/shaftway.js');
  twoCrews(false);
  window.__answered('props', 'net', 'arch');
  window.__meteor();
  window.__wizardHat(1);
  window.__assign('wizards', 1);
  goDeep();
  run(3);
  const before = S.view;
  const noArrow = !onShaftArrow(...(b => [b.x + b.w / 2, b.y + b.h / 2])(arrowBox(false)));
  window.__grant({ dust: 1e8, shards: 1e6, spores: 1e6, sparks: 1e6 });
  const bought = window.__buy('portal');
  const { portalX } = await import('../src/deep/place.js');
  const { abyssLine } = await import('../src/pit.js');
  let poured = false, over = false;
  runUntil(() => {
    const w = S.workers.find(o => o.portalPour);
    if (w) { poured = true; if (Math.abs(w.x + WORKER / 2 - portalX()) < WORKER && w.y < abyssLine()) over = true; }
    return S.portalOpen;
  }, 120);
  const arrow = (b => whatIsAt(b.x + b.w / 2, b.y + b.h / 2))(arrowBox(false));
  const portal = whatIsAt(portalX(), abyssLine());
  goDeep();
  run(3);
  return [
    ok(before === 'yard' && noArrow, 'before the portal the view stays up, and there is no arrow', before),
    ok(bought, 'the tower sells the portal'),
    ok(poured && over && S.portalOpen, 'a wizard flies out over the middle of the pit and pours it'),
    ok(arrow === 'down to the deep', 'then the arrow at it says the way down', `${arrow}`),
    ok(portal === 'the portal — down to the deep', 'and so does the portal itself', `${portal}`),
    ok(S.view === 'deep', 'and the view goes down', S.view)
  ];
}, { reload: false });

// A rock caught by the shields is the yard's: everybody up there looks up
// and shouts, and the deep's crew, under the abyss, never hears it.
group("a rock caught by the shields makes the yard shout, not the deep", async () => {
  window.__fullSites();
  window.__crew(2, 4);                    // rockhands, so the rock is worked and the next one comes
  window.__answered('props', 'net', 'arch');
  window.__snatch({ played: true });
  window.__deepCrew({ spare: 3 });
  let yardShout = false, deepShout = false;
  for (let f = 0; f < 60 * 240 && !yardShout; f++) {
    run(1 / 60);
    if (S.workers.some(w => !belowYard(w) && w.say?.mark === 'bang')) yardShout = true;
    if (below().some(w => w.say?.mark === 'bang')) deepShout = true;
  }
  run(0.5);
  if (below().some(w => w.say?.mark === 'bang')) deepShout = true;
  return [
    ok(yardShout, 'the yard shouts when it lands'),
    ok(!deepShout, 'and the deep does not')
  ];
}, { reload: false });
