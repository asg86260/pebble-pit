// Seven fangs' worth and no more (the owner, 2026-10-16): the floor holds
// FIGHT_STATIONS_MAX stations and the first is free, so once the stations
// standing, the fangs held and the fangs on their way would fill every slot,
// the serpent drops none -- not at a break, not at the kill, not at any
// endless level after it. A fang already falling finishes its fall.
//
// The story and the levels are beaten by the hand on the belly, as a player
// would; the setup it is not about (the snatch, a strong first station, a
// gatherer, the depth knob) goes through the hooks.
import { group, ok, run } from './helpers.mjs';
import { S } from '../src/state.js';
import { now } from '../src/clock.js';
import { SERPENT_PHASES, SERPENT_WOUND, FIGHT_STATIONS_MAX } from '../src/config.js';
import { depthAt } from '../src/deep/depth.js';
import { clickDeep } from '../src/deep/serpent.js';
import { recoilLen } from '../src/deep/phases.js';
import { coilAt, bellySeg } from '../src/deep/place.js';
import { buildOffer } from '../src/deep/buildbutton.js';
import { pressBuild } from './party-press.mjs';

const LAST = SERPENT_PHASES - 1;
const FRAME = 1 / 60;
const LEVELS = 12;
const strong = (kind, cls) => ({ kind, cls, rung: 8 });
const scaled = async (k, fn) => {
  const was = SERPENT_WOUND[0] / 5970;
  window.__tune('SERPENT_WOUND_SCALE', k);
  try { return await fn(); } finally { window.__tune('SERPENT_WOUND_SCALE', was); }
};
const clickBelly = () => { const p = coilAt(bellySeg(), now()); return clickDeep(p.x, p.y); };

// Every fang that enters the water, counted as the party's promise going up
// a frame: a station laid spends a fang and a fang crushed was loose, so only
// a drop raises stations + held + loose. Read off the yard, not the fang
// objects, which a reload stands up anew.
const promised = () => S.stations.length + (S.fangs | 0) + S.fangsLoose.length;
function watcher() {
  const w = { drops: 0, most: 0, was: promised() };
  w.look = () => {
    const p = promised();
    if (p > w.was) w.drops += p - w.was;
    w.was = p;
    w.most = Math.max(w.most, p);
  };
  return w;
}
const frameUntil = (fn, limit, look) => {
  for (let f = 0; f < limit * 60; f++) { look(); if (fn()) return true; run(FRAME); }
  look();
  return fn();
};
// A bar one short of empty, emptied by the hand, then played out to the
// serpent's next defense or level.
function beatBar(look) {
  const stage = S.serpentStage, level = S.serpentLevel;
  window.__serpent({ wound: depthAt(S.serpentStage) - 1 });
  const hit = frameUntil(() => {
    if (S.serpentStage !== stage || S.recoilT != null || S.serpentFreed) return true;
    clickBelly();
    return false;
  }, 5, look);
  if (S.recoilT != null) frameUntil(() => S.recoilT == null && S.serpentLevel > level, recoilLen() + 2, look);
  else frameUntil(() => !S.breakT && S.breakT !== 0, 30, look);
  return hit;
}

async function playthrough(build, party = [strong('altar', 'brawler')]) {
  window.__snatch({ played: true });
  window.__party({ stations: party });
  window.__deepCrew({ spare: 2 });                     // a gatherer for the fangs, a hand to build
  const w = watcher(), start = promised();
  const look = () => {
    w.look();
    if (build && S.fangs > 0 && buildOffer().shown) { pressBuild(); window.__finish(); }
  };
  // The story: four defenses broken by the hand, the kill, its sheet put down.
  for (let s = 0; s < SERPENT_PHASES && !S.serpentFreed; s++) beatBar(look);
  frameUntil(() => S.beat.sheet === 'freedsheet', 600, look);
  window.__skipBeat('sheet');
  const back = frameUntil(() => S.serpentLevel === 2, 120, look);
  // The endless levels, each bar emptied by the hand, every fang let land.
  for (let L = 0; L < LEVELS; L++) beatBar(look);
  frameUntil(() => S.fangsLoose.length === 0, 240, look);
  return { back, start, level: S.serpentLevel, drops: w.drops, most: w.most, ledger: (S.fangsDropped | 0) + (S.killFangs | 0),
           stations: S.stations.length, held: S.fangs, loose: S.fangsLoose.length };
}

group(`a party that never builds is dropped six fangs over the story and ${LEVELS} levels, and no more`, async () => scaled(0.1, async () => {
  const r = await playthrough(false);
  return [
    ok(r.back && r.level >= 2 + LEVELS - 1, 'the story beaten and the levels climbed', JSON.stringify(r)),
    ok(r.drops === FIGHT_STATIONS_MAX - 1 && r.ledger === FIGHT_STATIONS_MAX - 1,
       'six fangs dropped, the floor\'s seven less the free one', JSON.stringify(r)),
    ok(r.most <= FIGHT_STATIONS_MAX, 'never more promised than the floor holds', JSON.stringify(r))
  ];
}));

group(`a party that builds every fang stands seven stations, and no fang drops after`, async () => scaled(0.1, async () => {
  const r = await playthrough(true);
  return [
    ok(r.back && r.level >= 2 + LEVELS - 1, 'the story beaten and the levels climbed', JSON.stringify(r)),
    ok(r.stations === FIGHT_STATIONS_MAX && r.held === 0 && r.loose === 0, 'seven stations stand, nothing held', JSON.stringify(r)),
    ok(r.drops === FIGHT_STATIONS_MAX - 1, 'six fangs dropped in all', JSON.stringify(r)),
    ok(r.most <= FIGHT_STATIONS_MAX, 'never more promised than the floor holds', JSON.stringify(r))
  ];
}));

// The breaks' fangs are held to the same room as the kills': a party that
// already stands six when the story's serpent breaks is dropped one, not three.
group('a party standing six before the story is dropped one fang, at the first break, and none after', async () => scaled(0.1, async () => {
  const SIX = [strong('altar', 'brawler'), strong('armory', 'ranger'), strong('spire', 'mage'),
               strong('circle', 'sapper'), strong('well', 'monk'), strong('altar', 'sword')];
  const r = await playthrough(false, SIX);
  return [
    ok(r.back && r.level >= 2 + LEVELS - 1, 'the story beaten and the levels climbed', JSON.stringify(r)),
    ok(r.start === 6 && r.drops === 1 && r.held === 1, 'one fang dropped and held', JSON.stringify(r)),
    ok(r.most <= FIGHT_STATIONS_MAX, 'never more promised than the floor holds', JSON.stringify(r))
  ];
}));
