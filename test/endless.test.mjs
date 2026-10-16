// The endless serpent (DESIGN.md, "Endless serpent"): after the story's kill
// the serpent comes back once, on its last defense at level 2, and stays
// there; each bar emptied is a level -- the rear, the near-death and the
// power-up (the level ticking as its first mote lands, the bar a notch a
// mote), then the bar full again 1.1 times as deep -- and drops a fang until
// every slot stands.
//
// The setup a check is not about goes through the hooks (the snatch, a party
// at its rungs, the dev panel's depth knob, a fight at a level); the level
// and the wound never do in the check that is about them: the fighters' own
// blows empty the bars, and the recoils raise the level.
import { readFileSync, readdirSync } from 'node:fs';
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { now } from '../src/clock.js';
import { SERPENT_PHASES, SERPENT_WOUND, MECHANICS, KILL_REFORM_S, FIGHT_STATIONS_MAX, STUN_SHARE, FANG_BREAKS,
         RECOIL, POWERUP } from '../src/config.js';
import { depthAt } from '../src/deep/depth.js';
import { strike, clickDeep, woundK, onRecoil } from '../src/deep/serpent.js';
import { cradled, orbOn, recoilLen, recoiling, recoilTickAt, powerFill } from '../src/deep/phases.js';
import { bellyAt, coilAt, bellySeg } from '../src/deep/place.js';
import { stationById } from '../src/deep/party.js';
import { buildOffer } from '../src/deep/buildbutton.js';
import { objective } from '../src/objectives.js';
import { pressBuild } from './party-press.mjs';

const LAST = SERPENT_PHASES - 1;
const FRAME = 1 / 60;
const strong = (kind, cls) => ({ kind, cls, rung: 8 });
const FOUR = [strong('altar', 'brawler'), strong('armory', 'ranger'), strong('spire', 'mage'), strong('circle', 'sapper')];
// The dev panel's depth knob, for a level that is minutes rather than hours
// of game time; always put back, since a knob outlives the group.
const scaled = async (k, fn) => {
  const was = SERPENT_WOUND[0] / 5970;
  window.__tune('SERPENT_WOUND_SCALE', k);
  try { return await fn(); } finally { window.__tune('SERPENT_WOUND_SCALE', was); }
};
// The player's click on the coil over the belly: a punch.
const clickBelly = () => { const p = coilAt(bellySeg(), now()); return clickDeep(p.x, p.y); };
// One frame at a time until `fn` holds, up to `limit` game seconds.
const frameUntil = (fn, limit) => {
  for (let f = 0; f < limit * 60; f++) { if (fn()) return true; run(FRAME); }
  return fn();
};
// A level's bar one short of empty, emptied by the hand: the recoil's first frame.
const emptyByHand = () => {
  window.__serpent({ wound: depthAt(LAST) - 1 });
  return frameUntil(() => { if (S.recoilT != null) return true; clickBelly(); return false; }, 2);
};

group('after the story\'s kill it comes back once, on its last defense at level 2, and the party climbs it a bar a level', async () => scaled(0.1, async () => {
  window.__snatch({ played: true });
  // Two stations: the story's three breaks bring five, so its kill's fang and
  // level 2's fill the floor and level 3's has no slot left to drop for.
  window.__party({ stations: [FOUR[0], FOUR[2]] });
  window.__deepCrew({ spare: 1 });                     // a gatherer for the fangs
  // Every recoil's first frame, heard from the serpent itself.
  const recoils = [];
  const stop = onRecoil(level => recoils.push({ level, at: now(), wound: S.serpentWound, depth: depthAt(LAST), stage: S.serpentStage }));
  try {
    // The story's serpent, broken by the party alone, its kill played and its
    // sheet put down with the button.
    const killed = runUntil(() => S.serpentFreed, 1800);
    const sheet = runUntil(() => S.beat.sheet === 'freedsheet', 600);
    window.__skipBeat('sheet');
    const back = frameUntil(() => S.serpentLevel === 2, KILL_REFORM_S + 1);
    const returned = { level: S.serpentLevel, stage: S.serpentStage, freed: S.serpentFreed, woundK: woundK() };
    const crew2 = S.crew;
    // Two bars, nothing but the fight. Watched every second for a defense
    // other than the last (verify.js watches every frame), and each level's
    // tick to the frame.
    const stages = new Set();
    let hushed = 0, sheets = 0, story = 0, freedAgain = 0;
    const watch = () => {
      stages.add(S.serpentStage);
      if (S.hush > 0) hushed++;
      if (S.beat.sheet) sheets++;
      if (S.beat.yard === 'freed' || S.beat.yard === 'finale') story++;
      if (S.serpentFreed) freedAgain++;
    };
    const levels = [];
    for (const L of [2, 3]) {
      const emptied = runUntil(() => { watch(); return S.serpentLevel > L || S.recoilT != null; }, 1800);
      const ev = recoils[recoils.length - 1];
      let ticked = null, ended = null, notchAt = null;
      frameUntil(() => { watch(); if (S.serpentLevel === L + 1) { ticked = now(); notchAt = powerFill(); return true; } return false; }, recoilLen() + 1);
      // Past the tick it plays on, a notch of the bar a mote, to the let-go.
      const notches = [];
      frameUntil(() => {
        watch();
        if (S.recoilT == null) { ended = now(); return true; }
        notches.push(powerFill());
        return false;
      }, recoilLen() + 1);
      levels.push({ L, emptied, ev, held: ev && ticked != null ? (ticked - ev.at) / 1000 : null,
                    len: ev && ended != null ? (ended - ev.at) / 1000 : null, notchAt,
                    climbs: notches.every((f, i) => f != null && (i === 0 || f >= notches[i - 1])), lastNotch: notches[notches.length - 1],
                    after: { level: S.serpentLevel, stage: S.serpentStage, woundK: woundK(), depth: depthAt(LAST) } });
    }
    const wantDepth = L => Math.round(SERPENT_WOUND[LAST] * 1.1 ** (L - 1));
    // a frame of blows can land after the level's own frame
    const full = levels.every(l => l.after.woundK < 0.05);
    return [
      ok(killed && sheet && back, 'the story\'s serpent killed, its sheet put down, it comes back', `${killed} ${sheet} ${back}`),
      ok(returned.level === 2 && returned.stage === LAST && !returned.freed && returned.woundK === 0,
         'at level 2, on its last defense, its bar full', JSON.stringify(returned)),
      ok(levels.every(l => l.emptied && l.ev && l.ev.level === l.L && l.ev.stage === LAST && l.ev.wound === l.ev.depth),
         'the party\'s blows empty the bar at levels 2 and 3, on the last defense', JSON.stringify(levels.map(l => l.ev))),
      ok(Math.abs(recoilLen() - 3.31) < 1e-9, 'the rear, the near-death and the power-up are the mock\'s 3.31 s', `${recoilLen()}`),
      ok(levels.every(l => l.held != null && Math.abs(l.held - recoilTickAt()) <= FRAME + 1e-6 && l.notchAt === 1 / POWERUP.motes),
         'each empty bar ticks the level as the power-up\'s first mote lands, a notch of the bar',
         JSON.stringify(levels.map(l => [l.held, l.notchAt]))),
      ok(levels.every(l => l.len != null && Math.abs(l.len - recoilLen()) <= FRAME + 1e-6 && l.climbs && l.lastNotch === 1),
         'and plays on, the bar climbing a notch a mote to full, for the whole length',
         JSON.stringify(levels.map(l => [l.len, l.climbs, l.lastNotch]))),
      ok(levels.every(l => l.after.level === l.L + 1 && l.after.stage === LAST && l.after.depth === wantDepth(l.L + 1)),
         'onto the next level, still the last defense, 1.1 times as deep', JSON.stringify(levels.map(l => l.after))),
      ok(full, 'its bar full again', JSON.stringify(levels.map(l => l.after.woundK))),
      ok(stages.size === 1 && stages.has(LAST) && freedAgain === 0, 'never on another defense, never down again',
         `${[...stages]} freed ${freedAgain}`),
      ok(S.serpentBest === 4, 'the best with it', `${S.serpentBest}`),
      ok(S.beatsDone.filter(k => k === 'freed' || k === 'finale').length === 2 && story === 0,
         'the kill\'s beat and the finale ran once, on the story\'s kill only', `${S.beatsDone.join()} / ${story}`),
      ok(hushed === 0 && sheets === 0 && S.crew === crew2, 'no hush, no sheet, nobody joining or leaving past it',
         `${hushed} hushed, ${sheets} with a sheet, crew ${crew2} then ${S.crew}`),
      ok(S.killFangs === 2 && S.stations.length + S.fangs + S.fangsLoose.length === FIGHT_STATIONS_MAX,
         'a fang for the story\'s kill and for level 2, none for level 3 with every slot promised',
         `${S.killFangs} from kills; ${S.stations.length} stations, ${S.fangs} held, ${S.fangsLoose.length} loose`),
      ok(S.won.includes('serpent0') && !S.won.includes('serpent1'), 'the return is a notice, level 5 not yet',
         S.won.filter(k => k.startsWith('serpent')).join())
    ];
  } finally { stop(); }
}));

group('a level is 1.1 times as deep, the recoil holds the hit, and only depth.js reads the table', async () => {
  window.__snatch({ played: true });
  window.__deepCrew({ spare: 0 });
  window.__serpent({ level: 7, stage: 0, wound: 0 });
  const set = { stage: S.serpentStage };
  const rows = [];
  for (let s = 0; s <= LAST; s++) rows.push({ s, d: depthAt(s, 7), want: Math.round(SERPENT_WOUND[s] * 1.1 ** 6) });
  // One short of the depth leaves the bar standing; one more by hand empties it.
  const d = depthAt(LAST), p = bellyAt(now());
  window.__serpent({ wound: 0 });
  strike('punch', d - 1, p.x, p.y);
  run(FRAME);
  const stood = S.recoilT == null && S.serpentLevel === 7;
  const emptied = frameUntil(() => { if (S.recoilT != null) return true; clickBelly(); return false; }, 2);
  // Held: nothing lands and nothing heals through it.
  const during = { level: S.serpentLevel, stage: S.serpentStage, wound: S.serpentWound };
  const landed = strike('punch', 1000, p.x, p.y);
  run(RECOIL.snap + RECOIL.hold / 2);
  const held = { wound: S.serpentWound, recoiling: recoiling(), orb: !!orbOn() };
  // And past the tick, the motes still coming: the new level's bar is not hit.
  run(recoilTickAt() + 0.2 - S.recoilT);
  const landedLate = strike('punch', 1000, p.x, p.y);
  const late = { level: S.serpentLevel, wound: S.serpentWound, recoiling: recoiling() };
  // The same stunning blow at level 1 and level 7.
  const stunOf = level => {
    window.__serpent({ level, stage: LAST, wound: 0 });
    S.serpentStun = S.serpentGrace = 0;
    strike('punch', depthAt(LAST, 1) * STUN_SHARE * 4, p.x, p.y, null, 0, { stun: 1 });
    return S.serpentStun;
  };
  const at7 = stunOf(7), at1 = stunOf(1);
  // Nothing outside depth.js indexes the level-1 table.
  const read = dir => readdirSync(new URL(`../src/${dir}`, import.meta.url))
    .filter(f => f.endsWith('.js')).map(f => [`${dir}/${f}`, readFileSync(new URL(`../src/${dir}/${f}`, import.meta.url), 'utf8')]);
  const files = [...read('deep'), ...read('render'), ['verify.js', readFileSync(new URL('../src/verify.js', import.meta.url), 'utf8')]];
  const indexing = files.filter(([f, src]) => f !== 'deep/depth.js' && /SERPENT_WOUND\s*\[/.test(src)).map(([f]) => f);
  return [
    ok(set.stage === LAST, 'a level past the story is set on the last defense, whatever the stage asked', JSON.stringify(set)),
    ok(rows.every(r => r.d === r.want), 'depthAt at level 7 is the table times 1.1 to the sixth', JSON.stringify(rows)),
    ok(stood, 'one short of it leaves the bar standing', `${S.recoilT} ${S.serpentLevel}`),
    ok(emptied && during.level === 7 && during.stage === LAST && during.wound === d,
       'and one more empties it into a recoil, no break', JSON.stringify(during)),
    ok(landed === 0 && held.wound === d && held.recoiling && !held.orb, 'through the recoil nothing lands and nothing heals',
       `${landed} ${JSON.stringify(held)}`),
    ok(landedLate === 0 && late.level === 8 && late.wound === 0 && late.recoiling,
       'nor on the next level while the power-up plays on', `${landedLate} ${JSON.stringify(late)}`),
    ok(at7 > 0 && Math.abs(at7 - at1) < 1e-9, 'the same blow stuns as long at level 7 as at 1', `${at7} ${at1}`),
    ok(!indexing.length, 'and only depth.js indexes SERPENT_WOUND', indexing.join())
  ];
});

group('the orb keeps the hit points of level one at every level', async () => {
  window.__snatch({ played: true });
  window.__party({ stations: FOUR });
  runUntil(() => S.workers.filter(w => w.station).every(w => w.goal === 'fight' || w.goal === null), 30);
  const M = MECHANICS[LAST], worth = M.hp * SERPENT_WOUND[LAST];
  // The seconds a blow of a quarter of the level-1 share takes off it: the
  // orb's time is its health, so this is how hard it is to break.
  const orbAt = level => {
    window.__serpent({ level, stage: LAST, wound: 0 });
    S.orb = null;
    S.mechAt = M.every - M.last - 0.5;               // half a second short of its turn
    run(0.6);
    const o = orbOn();
    if (!o) return null;
    const left = o.left, p = bellyAt(now());
    strike('punch', worth / 4, p.x, p.y);
    return { max: o.max, took: left - o.left };
  };
  const at1 = orbAt(1), at7 = orbAt(7);
  return [
    ok(at1 && at1.max === M.last && Math.abs(at1.took - M.last / 4) < 1e-6, 'at level 1 a quarter of the share takes a quarter of its time', JSON.stringify(at1)),
    ok(at7 && at7.max === at1.max && Math.abs(at7.took - at1.took) < 1e-9 && depthAt(LAST, 7) > depthAt(LAST, 1),
       'and at level 7 the same, though the defense is deeper', `${JSON.stringify(at7)} against ${JSON.stringify(at1)}`)
  ];
});

group('an emptied bar drops a fang that builds a fifth station; with every slot promised, none', async () => {
  window.__snatch({ played: true });
  window.__party({ stations: FOUR });
  window.__deepCrew({ spare: 2 });                     // a gatherer, and a hand for the fifth
  window.__serpent({ level: 2 });
  S.killFangs = 1;                                     // the story kill's fang, had before this setup
  emptyByHand();
  const dropped = { loose: S.fangsLoose.length, kills: S.killFangs, recoil: S.recoilT != null };
  const carried = runUntil(() => S.fangs === 1, 120);
  const pressed = pressBuild();
  const s5 = stationById('s5');
  const laid = s5 && s5.slot === 4;
  const raised = runUntil(() => stationById('s5')?.built, 120);
  // Seven standing: an emptied bar drops nothing.
  window.__seed(20250831);
  window.__verify(true);
  window.__snatch({ played: true });
  window.__party({ stations: [...FOUR, strong('well', 'monk'), strong('altar', 'sword'), strong('armory', 'assassin')] });
  window.__serpent({ level: 3 });
  const k7 = S.killFangs;
  emptyByHand();
  run(1);
  const full = { loose: S.fangsLoose.length, kills: S.killFangs - k7, offer: buildOffer().shown,
                 notice: S.won.includes('allstations') };
  // Six standing and a fang unspent: the fang held promises the last slot.
  window.__seed(20250832);
  window.__verify(true);
  window.__snatch({ played: true });
  window.__party({ stations: [...FOUR, strong('well', 'monk'), strong('altar', 'sword')], fangs: 1 });
  window.__serpent({ level: 3 });
  const k6 = S.killFangs;
  emptyByHand();
  run(1);
  const held = { loose: S.fangsLoose.length, kills: S.killFangs - k6 };
  return [
    ok(dropped.recoil && dropped.loose === 1 && dropped.kills === 2, 'the emptied bar drops a fang from the belly',
       JSON.stringify(dropped)),
    ok(carried, 'carried to the crusher', `fangs ${S.fangs}`),
    ok(pressed && laid, 'the build button lays s5 on the fifth slot', JSON.stringify(s5)),
    ok(raised, 'and a delver raises it'),
    ok(FIGHT_STATIONS_MAX === 7 && full.loose === 0 && full.kills === 0 && !full.offer,
       'with seven standing an emptied bar drops none', JSON.stringify(full)),
    ok(full.notice, 'and every slot standing is a notice', JSON.stringify(full)),
    ok(held.loose === 0 && held.kills === 0, 'nor with six standing and a fang held', JSON.stringify(held))
  ];
});

group('a reload mid-recoil, before and after the tick, and mid-level keeps the level and the stage', async () => {
  window.__snatch({ played: true });
  window.__party({ stations: FOUR });
  window.__serpent({ level: 3 });
  emptyByHand();
  const started = now();
  // On the brink: the cracks run, the level not yet up.
  run(recoilTickAt() - 0.6);
  const before = { level: S.serpentLevel, stage: S.serpentStage, recoilT: S.recoilT };
  window.__reload();
  const mid = { level: S.serpentLevel, stage: S.serpentStage, recoilT: S.recoilT };
  let tickedAt = null;
  frameUntil(() => { if (S.serpentLevel === 4) { tickedAt = now(); return true; } return false; }, recoilLen() + 1);
  const held = tickedAt == null ? null : (tickedAt - started) / 1000;
  // Among the motes: the level up, the bar part full.
  run(0.4);
  const motes = { level: S.serpentLevel, recoilT: S.recoilT, fill: powerFill() };
  window.__reload();
  const back = { level: S.serpentLevel, recoilT: S.recoilT, fill: powerFill() };
  let endedAt = null;
  frameUntil(() => { if (S.recoilT == null) { endedAt = now(); return true; } return false; }, recoilLen());
  const len = endedAt == null ? null : (endedAt - started) / 1000;
  run(3);
  const level = { level: S.serpentLevel, stage: S.serpentStage, best: S.serpentBest };
  window.__reload();
  const after = { level: S.serpentLevel, stage: S.serpentStage, best: S.serpentBest, recoilT: S.recoilT };
  return [
    ok(mid.level === 3 && mid.stage === LAST && Math.abs(mid.recoilT - before.recoilT) < 1e-9,
       'read back before the tick: level 3, the last defense, as far into the recoil', `${JSON.stringify(before)} ${JSON.stringify(mid)}`),
    ok(held != null && Math.abs(held - recoilTickAt()) <= FRAME + 1e-6, 'and the level ticks when it would have',
       `${held} against ${recoilTickAt()}`),
    ok(motes.level === 4 && back.level === 4 && Math.abs(back.recoilT - motes.recoilT) < 1e-9 && back.fill === motes.fill
       && motes.fill > 0 && motes.fill < 1,
       'read back among the motes: level 4, never ticked twice, the bar as full', `${JSON.stringify(motes)} ${JSON.stringify(back)}`),
    ok(len != null && Math.abs(len - recoilLen()) <= FRAME + 1e-6, 'and it ends when it would have', `${len} against ${recoilLen()}`),
    ok(after.level === 4 && after.stage === LAST && after.best === 4 && after.recoilT == null &&
       level.level === after.level, 'read back mid-level: level 4, the last defense', `${JSON.stringify(level)} ${JSON.stringify(after)}`)
  ];
});

// Saves from before: the player's two-crews yard (its beats are past the
// kill) stood where the builds before this left the serpent, and loaded
// through the migrations. Its moments are an older page's, ahead of this
// one's clock.
const oldSave = (fields, v) => {
  const raw = JSON.parse(readFileSync(new URL('./fixtures/two-crews.json', import.meta.url), 'utf8'));
  Object.assign(raw, { fangs: 0, fangsDropped: FANG_BREAKS, fangsLoose: [] }, fields);
  if (v != null) raw.saveV = v;
  for (const k of Object.keys(fields)) if (fields[k] === undefined) delete raw[k];
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(raw));
  yard.restore();
};

group('an old save in the old loop is put on the last defense at its level', async () => {
  // fighting the split at level 3
  oldSave({ serpentLevel: 3, serpentBest: 3, killFangs: 2, serpentStage: 2, serpentWound: 1000, serpentFreed: false,
            freedAt: null, reformAt: null }, 19);
  const fighting = { level: S.serpentLevel, stage: S.serpentStage, wound: S.serpentWound, recoilT: S.recoilT };
  run(1);
  const on = { level: S.serpentLevel, stage: S.serpentStage };
  // down after a kill at level 3, gathering
  oldSave({ serpentLevel: 3, serpentBest: 3, killFangs: 3, serpentStage: SERPENT_PHASES, serpentWound: 0, serpentFreed: true,
            freedAt: 9e8, reformAt: 9.1e8 }, 19);
  const down = { level: S.serpentLevel, stage: S.serpentStage, freed: S.serpentFreed, recoilT: S.recoilT, woundK: woundK() };
  const landed = frameUntil(() => S.serpentLevel === 4, recoilLen() + 1);
  return [
    ok(fighting.level === 3 && fighting.stage === LAST && fighting.wound === 0 && fighting.recoilT == null,
       'fighting a middle defense at level 3, it loads on the last at level 3, whole', JSON.stringify(fighting)),
    ok(on.level === 3 && on.stage === LAST, 'and stays there', JSON.stringify(on)),
    ok(down.level === 3 && down.stage === LAST && !down.freed && down.recoilT === 0 && down.woundK === 1,
       'down after a kill at level 3, it loads mid-recoil on the last, the bar empty', JSON.stringify(down)),
    ok(landed && S.serpentStage === LAST && S.killFangs === 3, 'and lands on level 4 with no fang owed twice',
       `level ${S.serpentLevel} fangs ${S.killFangs}`)
  ];
});

group('an old save past the story\'s kill comes back on the last defense at level 2, its fang carried in', async () => {
  oldSave({ serpentStage: SERPENT_PHASES, serpentFreed: true, serpentWound: 0, freedAt: 9e8, reformAt: 9.1e8,
            serpentLevel: undefined, serpentBest: undefined, killFangs: undefined });
  const loaded = { level: S.serpentLevel, best: S.serpentBest, kills: S.killFangs, stage: S.serpentStage, freed: S.serpentFreed };
  const done0 = S.beatsDone.slice().sort().join();
  let story = 0, abyss = 0;
  run(FRAME);
  const risen = { level: S.serpentLevel, stage: S.serpentStage, loose: S.fangsLoose.length, kills: S.killFangs };
  const carried = runUntil(() => {
    if (S.beat.yard === 'finale' || S.beat.yard === 'freed') story++;
    if (S.beat.camera === 'abyss') abyss++;
    return S.fangs === 1;
  }, 180);
  return [
    ok(loaded.level === 1 && loaded.best === 1 && loaded.kills === 0 && loaded.stage === SERPENT_PHASES && loaded.freed,
       'it loads at the story\'s serpent, down', JSON.stringify(loaded)),
    ok(risen.level === 2 && risen.stage === LAST, 'and comes back at level 2 on its last defense on its first frame', JSON.stringify(risen)),
    ok(risen.loose === 1 && risen.kills === 1, 'the story kill\'s fang drops from the belly as it does', JSON.stringify(risen)),
    ok(carried, 'and is carried to the crusher', `fangs ${S.fangs}`),
    ok(!/sqhusband/.test(objective() || ''), 'the objective line does not come back', objective()),
    ok(!cradled(), 'nobody is in the belly'),
    ok(story === 0 && abyss === 0 && S.beatsDone.slice().sort().join() === done0,
       'neither the finale nor the abyss plays again', `${story} ${abyss}`)
  ];
});
