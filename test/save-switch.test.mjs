// Switching saves (the slots on the held sheet): what was in the air, on the
// cursor, in a body's arms or on the saw in the yard you leave is that yard's,
// and none of it may exist in the yard you step into. The owner: "noticed
// when switching saves, some resources get brought over. things in transit?"
//
// Reached the way the sheet reaches it, `__slot` (the same `switchSlot`). The
// goods in flight are put up by hand (the setup this is not about); the claim
// is about the other yard after the switch.
import { group, ok, run, yard } from './helpers.mjs';
import { census } from '../src/conserve.js';
import { afterGround, deepBed } from '../src/state.js';
import { stripBox } from '../src/after/ground.js';
import { track, sweep, release } from '../src/hands.js';
import { AP } from '../src/after/place.js';
import { BLANK, EPHEMERAL } from '../src/state.js';
const { persist } = await import('../src/persist.js');
const { setSlot } = await import('../src/save.js');
const KEY = 'boulder-clicker/v4';
const S = yard.S;

const clean = () => {
  setSlot(1);
  for (const k of [KEY + '/2', KEY + '/3', KEY + '/2.tab', KEY + '/3.tab']) localStorage.removeItem(k);
};

// Everything the yard has in transit, as numbers: a thing that is not zero in
// a yard that never threw it is a leak.
const air = () => ({
  chips: S.chips.length, motes: S.motes.length, held: S.held, belt: S.belt.length,
  paid: S.paid.length, gulped: S.gulped.length, sinking: S.sinking.length,
  lifting: S.lifting.length, trail: S.trail.length, hand: !!S.hand
});
const SAVEDAIR = new Set(['chips', 'belt']);
const goods = (skip = false) => Object.entries(air()).filter(([k, v]) => v && !(skip && SAVEDAIR.has(k))).map(([k, v]) => `${k}=${v}`).join(' ');

function inFlight() {
  for (let i = 0; i < 12; i++) S.chips.push({ x: 400, y: 200, vx: 1, vy: -2, s: 1, land: null });
  S.motes.push({ x: 300, y: 300, a: 0, r: 5, shade: 1 });
  S.held = 40;
  S.trail.push({ x: 1, y: 1, t: 0 });
  S.sinking.push({ x: 500, y: 100, vx: 0, vy: 1, s: 1 });
  S.lifting.push({ x: 500, y: 100 });
}

group('a yard with goods in the air is left behind by a switch to an empty slot', async () => {
  clean();
  window.__crew(3);
  run(10);
  inFlight();
  const had = goods();
  window.__slot(2);
  const into = goods();
  run(3);
  const later = goods();
  window.__slot(1);
  const back = goods(true);
  return [
    ok(had.includes('chips=') && had.includes('held='), 'there was something in the air to leave', had),
    ok(into === '', 'the new yard has nothing from the old one in the air', into),
    ok(later === '', 'and nothing turns up in it after a few seconds', later),
    ok(back === '', 'the first yard comes back with nothing in the air that its save did not carry', back)
  ];
});

group('a yard with goods in the air is left behind by a switch to a played slot', async () => {
  clean();
  window.__crew(2);
  run(10);
  persist();
  window.__slot(2);
  window.__crew(1);
  run(10);
  persist();
  window.__slot(1);
  inFlight();
  window.__slot(2);
  const into = goods();
  run(3);
  return [
    ok(into === '', 'slot 2 has nothing of slot 1 in the air', into),
    ok(census().scale === 0 && census().log === 0, 'and the census counts nothing the yard never had', JSON.stringify(census()))
  ];
});

group('every session array of the old yard is blank after a switch', async () => {
  clean();
  window.__crew(3);
  run(10);
  inFlight();
  window.__slot(2);
  const PAGE = new Set(['W', 'H', 'zoom', 'zoomShow', 'dpr', 'pair', 'viewW', 'viewH', 'worldW', 'worldH', 'cx', 'cy', 'groundY',
    'camY', 'camTo', 'camWas', 'camLockY', 'follow', 'mouse', 'unsaved', 'yielded', 'broken', 'fellBack', 'newerSave',
    'staged', 'build', 'tick', 'lastFrame', 'shopStale', 'fatal', 'placed', 'strips', 'piles', 'pileCount', 'pileFull',
    'floorGrains', 'floorMarks', 'rockTops', 'peakRow', 'settleAt']);
  const dirty = EPHEMERAL.filter(k => !PAGE.has(k) && k in BLANK && Array.isArray(BLANK[k]) && S[k]?.length);
  return [ok(dirty.length === 0, 'no session array of the old yard is standing in the new one', dirty.join(' '))];
});

// Act 3 with a block in the hand, one in the air and a log on the saw bed,
// left for a played yard and back for the first.
const total = c => Object.values(c).reduce((a, b) => a + b, 0);
group('act 3 goods in the hand, in the air and on the saw are not carried into another yard, nor doubled on the way back', async () => {
  clean();
  window.__crew(2);
  run(10);
  persist();
  window.__slot(2);
  window.__crew(1);
  run(10);
  persist();
  window.__slot(1);
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of ['house-fall', 'arrive', 'meet-god', 'refuse']) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  if (!S.after.built.includes('mill')) S.after.built.push('mill');
  S.carryLevel = 3;
  run(1);
  window.__afterGrant({ grovelogs: 6, logs: 2 });
  run(1);
  // one block lifted and still held, one let go and in the air
  const b = stripBox('grovelogs'), p = { x: b.x + b.w / 2, y: b.bottom - b.size * AP / 2 };
  S.dragging = true; S.trail = []; track(p.x, p.y); S.mouse = { ...p }; sweep(p.x, p.y); S.dragging = false;
  S.trail = []; track(p.x, p.y - 200); release(p.x, p.y - 200);
  S.dragging = true; track(p.x, p.y); S.mouse = { ...p }; sweep(p.x, p.y); S.dragging = false;
  run(0.3);
  persist();
  const had = census(), hadAir = goods();
  window.__slot(2);
  const into = census(), intoAir = goods();
  const planks = { blocks: afterGround.grid ? afterGround.blockN : 0, scales: deepBed.n };
  run(3);
  const later = census();
  window.__slot(1);
  const back = census();
  run(3);
  const backLater = census();
  return [
    ok(total(had) > 0 && /motes=|chips=/.test(hadAir), 'there were goods in the act, some of them in transit', JSON.stringify(had) + ' ' + hadAir),
    ok(total(into) === 0, 'the other yard has none of them in its census', JSON.stringify(into)),
    ok(intoAir === '', 'nor in its air or on its cursor', intoAir),
    ok(planks.blocks === 0, 'nor any block on the ground of act 3', JSON.stringify(planks)),
    ok(total(later) === 0, 'and none turn up after a few seconds', JSON.stringify(later)),
    ok(total(back) <= total(had), 'the first yard comes back with no more than it left with', JSON.stringify(back) + ' vs ' + JSON.stringify(had)),
    ok(total(backLater) <= total(had), 'and none are made from nothing once it runs', JSON.stringify(backLater))
  ];
});
