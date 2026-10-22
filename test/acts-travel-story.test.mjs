// Acts 3 and 4's beats, played from their triggers (actbeats.js; DESIGN.md,
// "Acts 3 and 4", "The story, beat by beat"). Act 3 starts the way a player
// starts it, by the go-on card over the house (call 7: what the card's click
// calls, `sayGoOn`); the house falls with the two of them indoors, their souls
// walk up the cloud stair to heaven's gates and rise through them, the camera
// riding up with them into the afterlife. The union's last gate (Track A's, stood here by its
// scaffold fact, `S.after.gate`) plays the strike through to the road; the
// pair walk down it as ghosts. Each beat fires once, in order, from its own
// trigger, never a cut and never twice.
import { group, ok, run, runUntil, yard } from './helpers.mjs';

const S = yard.S;
const { AFTER_GATES, ACT_GOON_WAIT_S, ACT_GOON_FADE_S } = await import('../src/config.js');
const { sayGoOn, goOnDue, goOnAlpha } = await import('../src/actbeats.js');
const { beatDone } = await import('../src/beats.js');
const { placeAt } = await import('../src/ghosts.js');
const { portalFree } = await import('../src/portals.js');

const inOrder = keys => keys.every((k, i) => i === 0 || S.beatsDone.indexOf(keys[i - 1]) < S.beatsDone.indexOf(k))
  && keys.every(k => S.beatsDone.includes(k));
const once = keys => keys.every(k => S.beatsDone.filter(d => d === k).length === 1);

group('act 3: go on, the house falls, the souls rise into the afterlife, and the strike opens the road', async () => {
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('home');
  run(0.5);
  const early = sayGoOn();                                  // the card is still fading in
  // (a reload, which the harness makes every five seconds, starts the card's wait again)
  runUntil(() => goOnAlpha() >= 1, 4 * (ACT_GOON_WAIT_S + ACT_GOON_FADE_S));
  const due = goOnDue();
  const said = sayGoOn();
  // the camera's place every second, to see it never jumps past a ripple
  const views = [];
  const opened = runUntil(() => { views.push(S.view); return beatDone('refuse'); }, 240);
  const act3 = { house: S.acts.house, view: S.view, pair: S.acts.pair && { at: S.acts.pair.at, mode: S.acts.pair.mode, place: placeAt(S.acts.pair.y) },
                 after: !!S.after };
  // Track A's strike, as its scaffold fact: the last gate reached.
  S.after.gate = AFTER_GATES.length;
  const walked = runUntil(() => beatDone('haunt'), 400);
  const act4 = { view: S.view, mode: S.acts.pair.mode, place: placeAt(S.acts.pair.y), hell: portalFree('hell'), heaven: portalFree('heaven') };
  window.__actsOn(null);
  const story = ['house-fall', 'arrive', 'meet-god', 'refuse', 'strike', 'unmask', 'hell-told', 'ghost-road', 'haunt'];
  return [
    ok(!early && due && said, 'the go-on card answers once it has faded in, and only then', `${early} ${due} ${said}`),
    ok(opened && inOrder(story.slice(0, 4)), 'the fall plays through the opening, in order', S.beatsDone.join(' ')),
    ok(act3.house === 'fallen' && act3.view === 'after' && act3.pair.place === 'after' && act3.pair.at === 'pedestal' && act3.after,
       'the house is under the rock, the souls stand up on the pedestal in the camp, and the camera is with them', JSON.stringify(act3)),
    ok(walked && inOrder(story) && once(story), 'the strike plays through to the road, and the pair come down it, each beat once', S.beatsDone.join(' ')),
    ok(act4.view === 'yard' && act4.mode === 'ghost' && act4.place === 'yard' && act4.hell && act4.heaven,
       'back on the yard as ghosts, both portals the player\'s', JSON.stringify(act4))
  ];
});

group('the walls and the cage play from hell\'s barriers, each once and in order', async () => {
  window.__actsOn(true);
  window.__crew(2, 2);
  S.portalOpen = true;
  window.__actsAt('act4');
  const { BARRIER_BLOWS, HELL_TIERS } = await import('../src/config.js');
  // Track B's barriers, as their scaffold fact: every wall's blows taken.
  for (let i = 0; i < HELL_TIERS.length - 1; i++) S.hell.blows[i] = BARRIER_BLOWS[i];
  const walls = HELL_TIERS.slice(0, -1).map((_, i) => `wall-${i + 1}`);
  const fell = runUntil(() => walls.every(beatDone), 120);
  const before = beatDone('unchain');
  S.hell.blows[HELL_TIERS.length - 1] = BARRIER_BLOWS[HELL_TIERS.length - 1];
  const freed = runUntil(() => beatDone('alive'), 600);
  const pair = S.acts.pair;
  window.__actsOn(null);
  return [
    ok(fell && inOrder(walls) && once(walls), 'each wall\'s fall plays once, in order', S.beatsDone.join(' ')),
    ok(!before && freed && inOrder(['unchain', 'alive']), 'the cage\'s fall frees God, and then their lives come back', S.beatsDone.join(' ')),
    ok(pair.mode === 'alive' && pair.rims === 8 && placeAt(pair.y) === 'hell', 'alive, in hell, at the cage they walked to', JSON.stringify(pair)),
    ok(!!S.acts.mansion, 'and the mansion\'s job is standing from the cage\'s fall')
  ];
});

// Heaven's road is walked (the owner's take A, 2026-10-19): the two of them
// go up the cloud stair to the gates and through them, and come back down
// the same way, every frame a step from the last, the second on the walk
// behind the first, and the gates standing open as they go through. The gates
// are the portal (the owner, later that day): going through, a body fades
// into the gateway at one end and out of it at the other, and that is the one
// move a frame may make past a step, and only while it cannot be seen.
const { pairBodies, threshold, stairFoot, campX, passAlpha } = await import('../src/ghosts.js');
const { gatesOpen, portalEnd } = await import('../src/portals.js');
const { floorAt } = await import('../src/after/place.js');
const { P, WORKER, GHOST_GAP } = await import('../src/config.js');
// What a walk did, frame by frame: the most either body moved in one, the
// farthest the two stood apart, whether each stood at the gates' threshold and
// at the stair's foot, and whether the gates stood open with the first at them.
// The pair is read afresh each frame: the harness's reloads put a new one in
// its place.
function walkWatch() {
  const w = { jump: 0, apart: 0, top: [false, false], foot: [false, false], open: false, through: 0 };
  let was = null, wasSeen = 1;
  return {
    w,
    see() {
      const b = pairBodies();
      if (!b) return;
      const t = threshold(), f = stairFoot(), seen = passAlpha();
      // the hop between the two gateways, unseen at both ends of it
      const ends = [portalEnd('heaven', 'yard'), portalEnd('heaven', 'after')];
      const atGate = q => ends.some(e => Math.abs(q.x + WORKER / 2 - e.x) < GHOST_GAP + P && Math.abs(q.y + WORKER - e.feet) < P);
      const hop = was && seen < 0.2 && wasSeen < 0.2 && b.every(atGate) && was.every(atGate);
      if (hop && b.some((q, i) => Math.hypot(q.x - was[i].x, q.y - was[i].y) > MOST)) w.through++;
      b.forEach((q, i) => {
        if (Math.hypot(q.x - t.x, q.y - t.y) < 1) w.top[i] = true;
        if (Math.hypot(q.x - f.x, q.y - f.y) < 1) w.foot[i] = true;
        if (was && !hop) w.jump = Math.max(w.jump, Math.hypot(q.x - was[i].x, q.y - was[i].y));
      });
      wasSeen = seen;
      w.apart = Math.max(w.apart, Math.hypot(b[0].x - b[1].x, b[0].y - b[1].y));
      if (Math.abs(b[0].x - t.x) < P * 4 && Math.abs(b[0].y - t.y) < P * 4 && gatesOpen() === 1) w.open = true;
      was = b;
    }
  };
}
// A frame's walk is at most the pace, called and hurried: a jump past that is a teleport.
const MOST = P * 4;
group('heaven\'s road up: the souls up the cloud stair at the fall and through the gates, walked', async () => {
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('home');
  runUntil(() => goOnAlpha() >= 1, 4 * (ACT_GOON_WAIT_S + ACT_GOON_FADE_S));
  sayGoOn();
  const up = walkWatch();
  for (let i = 0; i < 60 * 120 && !(S.acts?.pair?.at === 'rise' && S.view === 'after'); i++) { run(1 / 60); up.see(); }
  const rising = { at: S.acts.pair.at, place: placeAt(S.acts.pair.y), view: S.view, ...up.w };
  runUntil(() => beatDone('house-fall'), 60);
  window.__actsOn(null);
  return [
    // the second stops a step short on the bank and follows the first in
    ok(rising.foot.every(Boolean) && rising.top[0],
       'at the fall both souls walk onto the stair at its foot, and up it to the gates', JSON.stringify(rising)),
    ok(rising.open && rising.through === 1 && rising.at === 'rise' && rising.place === 'after' && rising.view === 'after',
       'and through the open gates, once and unseen between, onto the cloud floor, the camera with them', JSON.stringify(rising)),
    ok(rising.jump < MOST && rising.apart <= GHOST_GAP + 1, 'every frame a step from the last, the second a step behind', JSON.stringify(rising))
  ];
});
group('heaven\'s road down: the ghosts down through the gates and the cloud stair to the ruin, walked', async () => {
  window.__actsOn(true);
  window.__crew(2, 2);
  // from the camp along the cloud floor to the gates, as the haunt sends them;
  // the camp stands on its shelves of cloud now, so on the ground there
  window.__actsAt('road');
  S.beatsDone.push('haunt');
  Object.assign(S.acts.pair, { x: campX(), y: floorAt(campX()) - WORKER, mode: 'ghost', at: null, top: 0, route: null, then: null, face: Math.sign(threshold().x - campX()) || 1 });
  window.__sendPair('down');
  const down = walkWatch();
  for (let i = 0; i < 60 * 240 && S.acts.pair.at !== 'down'; i++) { run(1 / 60); down.see(); }
  const p = S.acts.pair;
  const came = { at: p.at, place: placeAt(p.y), ...down.w };
  window.__actsOn(null);
  return [
    ok(came.at === 'down' && came.place === 'yard' && came.top[0] && came.foot.every(Boolean) && came.open && came.through === 1,
       'the ghosts come down through the open gates and the whole stair to the ruin', JSON.stringify(came)),
    ok(came.jump < MOST && came.apart <= GHOST_GAP + 1, 'walked, every frame, the second a step behind', JSON.stringify(came))
  ];
});
