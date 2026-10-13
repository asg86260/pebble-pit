// The endless serpent (DESIGN.md, "Endless serpent"): after the story's kill
// the serpent gathers itself again and rises a level deeper, 1.1 times the
// depth a level and nothing else; each kill drops a fang until every slot
// stands; a kill after the story's is the kill alone, a pause, the gathering
// and the rise.
//
// The setup a check is not about goes through the hooks (the snatch, a party
// at its rungs, the dev panel's depth knob, a fight at a stage); the level
// and the wound never do in the check that is about them: the fighters' own
// blows break the defenses and the rises raise the level.
import { readFileSync, readdirSync } from 'node:fs';
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { now } from '../src/clock.js';
import { SERPENT_PHASES, SERPENT_WOUND, KILL, KILL_REFORM_S, SERPENT_RISE_PAUSE_S, FIGHT_STATIONS_MAX,
         STUN_SHARE, FANG_BREAKS } from '../src/config.js';
import { depthAt } from '../src/deep/depth.js';
import { strike, clickDeep } from '../src/deep/serpent.js';
import { cradled, breaking } from '../src/deep/phases.js';
import { bellyAt, coilAt, bellySeg } from '../src/deep/place.js';
import { stationById } from '../src/deep/party.js';
import { buildOffer } from '../src/deep/buildbutton.js';
import { objective } from '../src/objectives.js';
import { pressBuild } from './party-press.mjs';

const LAST = SERPENT_PHASES - 1;
const DOWN_S = KILL.last + KILL.limp + KILL.apart + SERPENT_RISE_PAUSE_S + KILL_REFORM_S;
const strong = (kind, cls) => ({ kind, cls, rung: 8 });
const FOUR = [strong('altar', 'brawler'), strong('armory', 'ranger'), strong('spire', 'mage'), strong('circle', 'sapper')];
// The dev panel's depth knob, for a lap that is minutes rather than hours of
// game time; always put back, since a knob outlives the group.
const scaled = async (k, fn) => {
  const was = SERPENT_WOUND[0] / 5970;
  window.__tune('SERPENT_WOUND_SCALE', k);
  try { return await fn(); } finally { window.__tune('SERPENT_WOUND_SCALE', was); }
};
// The player's click on the coil over the belly: a punch.
const clickBelly = () => { const p = coilAt(bellySeg(), now()); return clickDeep(p.x, p.y); };
// One frame at a time until `fn` holds, up to `limit` game seconds.
const frameUntil = (fn, limit) => {
  for (let f = 0; f < limit * 60; f++) { if (fn()) return true; run(1 / 60); }
  return fn();
};

group('the level climbs 1, 2, 3 by killing it, and a kill after the story\'s is the kill alone', async () => scaled(0.1, async () => {
  window.__snatch({ played: true });
  window.__party({ stations: FOUR });
  window.__deepCrew({ spare: 1 });                     // a gatherer for the fangs
  const seen = [S.serpentLevel];
  const note = () => { if (seen[seen.length - 1] !== S.serpentLevel) seen.push(S.serpentLevel); };
  // The story's serpent, broken by the party alone, its kill played and its
  // sheet put down with the button.
  const killed1 = runUntil(() => { note(); return S.serpentFreed; }, 1800);
  const sheet = runUntil(() => { note(); return S.beat.sheet === 'freedsheet'; }, 600);
  window.__skipBeat('sheet');
  const rose2 = frameUntil(() => { note(); return S.serpentLevel === 2; }, KILL_REFORM_S + 1);
  const crew2 = S.crew;
  // The second lap: nothing but the fight, then the kill alone.
  const killed2 = runUntil(() => { note(); return S.serpentFreed; }, 1800);
  const freedAt = S.freedAt;
  let hushed = 0, sheets = 0, story = 0, roseAt = null;
  frameUntil(() => {
    note();
    if (S.hush > 0) hushed++;
    if (S.beat.sheet) sheets++;
    if (S.beat.yard === 'freed' || S.beat.yard === 'finale') story++;
    if (S.serpentLevel === 3) { roseAt = now(); return true; }
    return false;
  }, DOWN_S + 2);
  const down = roseAt == null ? null : (roseAt - freedAt) / 1000;
  return [
    ok(killed1 && sheet && rose2, 'the story\'s serpent killed, its sheet put down, it rises at level 2',
       `${killed1} ${sheet} ${rose2}`),
    ok(killed2 && roseAt != null, 'the second killed by the party and risen again', `${killed2} level ${S.serpentLevel}`),
    ok(JSON.stringify(seen) === '[1,2,3]' && S.serpentBest === 3, 'the level went 1, 2, 3, and the best with it',
       `${JSON.stringify(seen)} best ${S.serpentBest}`),
    ok(S.serpentStage === 0 && !S.serpentFreed, 'risen, it is at its first defense', `stage ${S.serpentStage}`),
    ok(S.beatsDone.filter(k => k === 'freed' || k === 'finale').length === 2 && story === 0,
       'the kill\'s beat and the finale ran once, on the story\'s kill only', `${S.beatsDone.join()} / ${story}`),
    ok(hushed === 0 && sheets === 0, 'no hush and no sheet through the second kill', `${hushed} hushed, ${sheets} with a sheet`),
    ok(S.crew === crew2, 'nobody joined or left on it', `${crew2} then ${S.crew}`),
    ok(down != null && Math.abs(down - DOWN_S) <= 1 / 60 + 1e-6,
       'its down time is the kill, the pause and the gathering, to a frame', `${down} against ${DOWN_S}`),
    ok(S.won.includes('serpent0') && !S.won.includes('serpent1'), 'the first rise is a notice, level 5 not yet',
       S.won.filter(k => k.startsWith('serpent')).join())
  ];
}));

group('a defense is 1.1 times as deep a level, the stun as long, and only depth.js reads the table', async () => {
  window.__snatch({ played: true });
  window.__deepCrew({ spare: 0 });
  const rows = [];
  for (let s = 0; s <= LAST; s++) {
    window.__serpent({ level: 7, stage: s, wound: 0 });
    const d = depthAt(s), p = bellyAt(now());
    strike('punch', d - 1, p.x, p.y);
    run(1 / 60);
    const stood = S.serpentStage === s;
    clickBelly();                                       // and the last of it, by hand
    run(1 / 60);
    rows.push({ s, d, want: Math.round(SERPENT_WOUND[s] * 1.1 ** 6), stood, broke: S.serpentStage === s + 1 });
  }
  // The same stunning blow at level 1 and level 7.
  const stunOf = level => {
    window.__serpent({ level, stage: 0, wound: 0 });
    S.serpentStun = S.serpentGrace = 0;
    const p = bellyAt(now());
    strike('punch', depthAt(0, 1) * STUN_SHARE * 4, p.x, p.y, null, 0, { stun: 1 });
    return S.serpentStun;
  };
  const at7 = stunOf(7), at1 = stunOf(1);
  // Nothing outside depth.js indexes the level-1 table.
  const read = dir => readdirSync(new URL(`../src/${dir}`, import.meta.url))
    .filter(f => f.endsWith('.js')).map(f => [`${dir}/${f}`, readFileSync(new URL(`../src/${dir}/${f}`, import.meta.url), 'utf8')]);
  const files = [...read('deep'), ...read('render'), ['verify.js', readFileSync(new URL('../src/verify.js', import.meta.url), 'utf8')]];
  const indexing = files.filter(([f, src]) => f !== 'deep/depth.js' && /SERPENT_WOUND\s*\[/.test(src)).map(([f]) => f);
  return [
    ok(rows.every(r => r.d === r.want), 'depthAt at level 7 is the table times 1.1 to the sixth', JSON.stringify(rows)),
    ok(rows.every(r => r.stood), 'one short of it leaves every defense standing', JSON.stringify(rows.map(r => r.stood))),
    ok(rows.every(r => r.broke), 'and one more breaks it', JSON.stringify(rows.map(r => r.broke))),
    ok(at7 > 0 && Math.abs(at7 - at1) < 1e-9, 'the same blow stuns as long at level 7 as at 1', `${at7} ${at1}`),
    ok(!indexing.length, 'and only depth.js indexes SERPENT_WOUND', indexing.join())
  ];
});

group('a kill drops a fang that builds a fifth station; with every slot promised, none', async () => {
  window.__snatch({ played: true });
  window.__party({ stations: FOUR });
  window.__deepCrew({ spare: 2 });                     // a gatherer, and a hand for the fifth
  window.__serpent({ level: 2, stage: LAST, wound: depthAt(LAST, 2) - 1 });
  S.killFangs = 1;                                     // the story kill's fang, had before this setup
  clickBelly();
  run(1 / 60);
  const dropped = { loose: S.fangsLoose.length, kills: S.killFangs, freed: S.serpentFreed };
  const carried = runUntil(() => S.fangs === 1, 120);
  const pressed = pressBuild();
  const s5 = stationById('s5');
  const laid = s5 && s5.slot === 4;
  const raised = runUntil(() => stationById('s5')?.built, 120);
  // Seven standing: a kill drops nothing.
  window.__seed(20250831);
  window.__verify(true);
  window.__snatch({ played: true });
  window.__party({ stations: [...FOUR, strong('well', 'monk'), strong('altar', 'sword'), strong('armory', 'assassin')] });
  window.__serpent({ level: 3, stage: LAST, wound: depthAt(LAST, 3) - 1 });
  const k7 = S.killFangs;
  clickBelly();
  run(1);
  const full = { loose: S.fangsLoose.length, kills: S.killFangs - k7, offer: buildOffer().shown,
                 notice: S.won.includes('allstations') };
  // Six standing and a fang unspent: the fang held promises the last slot.
  window.__seed(20250832);
  window.__verify(true);
  window.__snatch({ played: true });
  window.__party({ stations: [...FOUR, strong('well', 'monk'), strong('altar', 'sword')], fangs: 1 });
  window.__serpent({ level: 3, stage: LAST, wound: depthAt(LAST, 3) - 1 });
  const k6 = S.killFangs;
  clickBelly();
  run(1);
  const held = { loose: S.fangsLoose.length, kills: S.killFangs - k6 };
  return [
    ok(dropped.freed && dropped.loose === 1 && dropped.kills === 2, 'the last blow drops a fang from the belly',
       JSON.stringify(dropped)),
    ok(carried, 'carried to the crusher', `fangs ${S.fangs}`),
    ok(pressed && laid, 'the build button lays s5 on the fifth slot', JSON.stringify(s5)),
    ok(raised, 'and a delver raises it'),
    ok(FIGHT_STATIONS_MAX === 7 && full.loose === 0 && full.kills === 0 && !full.offer,
       'with seven standing a kill drops none', JSON.stringify(full)),
    ok(full.notice, 'and every slot standing is a notice', JSON.stringify(full)),
    ok(held.loose === 0 && held.kills === 0, 'nor with six standing and a fang held', JSON.stringify(held))
  ];
});

// A save from before this, past the kill with its sheet put down: the
// player's two-crews yard (its beats are past the kill) stood where the old
// build left a kill -- the stage past the last, freed, the gathering long
// done, no fang held -- and loaded through the migrations. Its moments are
// an older page's, ahead of this one's clock.
group('an old save past the kill rises to level 2 by itself and its fang drops and is carried in', async () => {
  const raw = JSON.parse(readFileSync(new URL('./fixtures/two-crews.json', import.meta.url), 'utf8'));
  Object.assign(raw, { serpentStage: 4, serpentFreed: true, serpentWound: 0, freedAt: 9e8, reformAt: 9.1e8,
                       fangs: 0, fangsDropped: FANG_BREAKS, fangsLoose: [] });
  delete raw.serpentLevel; delete raw.serpentBest; delete raw.killFangs;
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(raw));
  yard.restore();
  const loaded = { level: S.serpentLevel, best: S.serpentBest, kills: S.killFangs, stage: S.serpentStage, freed: S.serpentFreed };
  const done0 = S.beatsDone.slice().sort().join();
  let story = 0, abyss = 0;
  run(1 / 60);
  const risen = { level: S.serpentLevel, stage: S.serpentStage, loose: S.fangsLoose.length, kills: S.killFangs };
  const carried = runUntil(() => {
    if (S.beat.yard === 'finale' || S.beat.yard === 'freed') story++;
    if (S.beat.camera === 'abyss') abyss++;
    return S.fangs === 1;
  }, 180);
  return [
    ok(loaded.level === 1 && loaded.best === 1 && loaded.kills === 0 && loaded.stage === SERPENT_PHASES && loaded.freed,
       'it loads at the story\'s serpent, down', JSON.stringify(loaded)),
    ok(risen.level === 2 && risen.stage === 0, 'and rises to level 2 on its first frame', JSON.stringify(risen)),
    ok(risen.loose === 1 && risen.kills === 1, 'the story kill\'s fang drops from the belly as it does', JSON.stringify(risen)),
    ok(carried, 'and is carried to the crusher', `fangs ${S.fangs}`),
    ok(!/sqhusband/.test(objective() || ''), 'the objective line does not come back', objective()),
    ok(!cradled(), 'nobody is in the belly'),
    ok(story === 0 && abyss === 0 && S.beatsDone.slice().sort().join() === done0,
       'neither the finale nor the abyss plays again', `${story} ${abyss}`)
  ];
});

group('a reload in the pause lands the rise at the same game time', async () => {
  window.__snatch({ played: true });
  window.__party({ stations: FOUR });
  window.__serpent({ level: 2, stage: LAST, wound: depthAt(LAST, 2) - 1 });
  clickBelly();
  run(1 / 60);
  const due = S.freedAt + DOWN_S * 1000;
  run(KILL.last + KILL.limp + KILL.apart + SERPENT_RISE_PAUSE_S / 2);
  window.__reload();
  const back = { level: S.serpentLevel, freed: S.serpentFreed, freedAt: S.freedAt };
  let roseAt = null;
  frameUntil(() => { if (S.serpentLevel === 3) { roseAt = now(); return true; } return false; }, DOWN_S);
  return [
    ok(back.level === 2 && back.freed, 'read back down, at level 2', JSON.stringify(back)),
    ok(roseAt != null && roseAt >= due && roseAt - due <= 1000 / 60 + 1e-6, 'and it rises when it would have',
       `${roseAt} against ${due}`),
    ok(S.serpentBest === 3 && !breaking(), 'at level 3, the best with it', `${S.serpentBest}`)
  ];
});
