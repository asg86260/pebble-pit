// Acts 3 and 4's beats, played from their triggers (actbeats.js; DESIGN.md,
// "Acts 3 and 4", "The story, beat by beat"). Act 3 starts the way a player
// starts it, by the go-on card over the house (call 7: what the card's click
// calls, `sayGoOn`); the house falls with the two of them indoors, their souls
// rise straight up through the tear and the camera follows them into the
// afterlife by the ripple. The union's last gate (Track A's, stood here by its
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
                 after: !!S.after, shut: (await import('../src/actbeats.js')).boardsShut() };
  // Track A's strike, as its scaffold fact: the last gate reached.
  S.after.gate = AFTER_GATES.length;
  const walked = runUntil(() => beatDone('haunt'), 400);
  const act4 = { view: S.view, mode: S.acts.pair.mode, place: placeAt(S.acts.pair.y), hell: portalFree('hell'), heaven: portalFree('heaven'),
                 shut: (await import('../src/actbeats.js')).boardsShut() };
  window.__actsOn(null);
  const story = ['house-fall', 'arrive', 'meet-god', 'refuse', 'strike', 'unmask', 'hell-told', 'ghost-road', 'haunt'];
  return [
    ok(!early && due && said, 'the go-on card answers once it has faded in, and only then', `${early} ${due} ${said}`),
    ok(opened && inOrder(story.slice(0, 4)), 'the fall plays through the opening, in order', S.beatsDone.join(' ')),
    ok(act3.house === 'fallen' && act3.view === 'after' && act3.pair.place === 'after' && act3.pair.at === 'camp' && act3.after,
       'the house is under the rock, the souls stand at the camp in the cloud, and the camera is with them', JSON.stringify(act3)),
    ok(act3.shut, 'and the yard\'s boards are shut while they are up there'),
    ok(walked && inOrder(story) && once(story), 'the strike plays through to the road, and the pair come down it, each beat once', S.beatsDone.join(' ')),
    ok(act4.view === 'yard' && act4.mode === 'ghost' && act4.place === 'yard' && act4.hell && act4.heaven && !act4.shut,
       'back on the yard as ghosts, both portals the player\'s, the boards open again', JSON.stringify(act4))
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
