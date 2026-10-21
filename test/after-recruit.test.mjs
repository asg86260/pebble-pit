// Act 3's workers are bought with rebel (DESIGN.md, "Act 3's workers are
// bought with rebel"; the owner, 2026-10-21): a soul a sign inks full pays
// rebel, landed on the pile, and waits in God's yard; the pedestal's recruit
// row buys the front won soul out to the podium, and the roster's + puts it
// to work; the gates read the share won, hired or not.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { RIM_PIECES, CROWD_FILES, AFTER_SIGN_INK_S, AFTER_WON_REBEL, AFTER_RECRUIT_COST0, AFTER_RECRUIT_RATE, MEET_MEMBERS, AFTER_FIRST_MEMBERS } from '../src/config.js';
import { afterRow } from '../src/after/rows.js';
import { rimOf, OUT_RIM } from '../src/after/union.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const walking = () => S.after.bodies.filter(b => b.state === 'out').length;

// The act begun with its free members, the throne's speech and the
// agitators' rebel held off: each is another check's.
function up() {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  S.after.speech = { next: 1e9, f0: 0, held: null };
  run(1);
  S.after.bodies = []; S.after.camp = 0;
}
// A sign standing in God's crowd at (f, r), as a carrier plants one.
const plant = (f, r) => S.after.signs.push({ id: 7700 + f, f, r, askew: false, pull: null, big: false, age: 0 });

group('a soul a sign inks full pays rebel where it lands and waits in God\'s yard', async () => {
  up();
  // Every soul a piece short, behind the free members' front file.
  window.__afterCrowd((i, v) => (i >= CROWD_FILES && i < CROWD_FILES * 3 ? RIM_PIECES - 1 : v), true);
  const r0 = read().rebel, u0 = read().union, s0 = read().support;
  plant(20, 2);
  run(AFTER_SIGN_INK_S + 0.1);
  const won = read().ready, early = read().rebel - r0;
  runUntil(() => read().motes === 0, 20);
  const paid = read().rebel - r0;
  window.__actsOn(null);
  return [
    ok(won > 0 && walking() === 0 && read().union === u0, 'the souls it closes are won, and nobody walks out', `${won} won, ${walking()} walking`),
    ok(paid === won * AFTER_WON_REBEL && early < paid, 'each pays its rebel, counted where the motes land', `${early} early, ${paid} landed for ${won}`),
    ok(read().support > s0, 'the share won rises, hired or not', `${s0.toFixed(4)} -> ${read().support.toFixed(4)}`)
  ];
});

group('the recruit row buys the front won soul out to the podium, and the + puts it to work', async () => {
  up();
  window.__afterGrant({ rebel: 1000 });
  const none = window.__buy('after-recruit');
  const dead = afterRow('after-recruit').dead();
  window.__afterCrowd((i, v) => (i >= CROWD_FILES && i < CROWD_FILES + 3 ? RIM_PIECES : v), true);
  const r0 = read().rebel, ready0 = read().ready, front = S.after.rims.indexOf(String(RIM_PIECES));
  const first = window.__buy('after-recruit');
  const r1 = read().rebel;
  const second = window.__buy('after-recruit');
  const r2 = read().rebel;
  const out = rimOf(front) === OUT_RIM && read().ready === ready0 - 2 && read().union === 2 + AFTER_FIRST_MEMBERS;
  const arrived = runUntil(() => walking() === 0 && S.after.bodies.filter(b => b.job == null && b.state === 'work').length === 2, 120);
  const put = window.__afterPress('woodcutter', 1);
  runUntil(() => S.after.bodies.some(b => b.job === 'woodcutter' && b.on), 120);
  window.__actsOn(null);
  return [
    ok(!none && !!dead, 'with nobody won the row is dead', `${none} ${dead}`),
    ok(first && second && out, 'bought, the front won souls leave their slots and walk out', `${first} ${second} ${rimOf(front)} ${read().ready} ${read().union}`),
    ok(r0 - r1 === AFTER_RECRUIT_COST0 && r1 - r2 === Math.round(AFTER_RECRUIT_COST0 * AFTER_RECRUIT_RATE), 'paid in rebel, each dearer than the last', `${r0 - r1}, ${r1 - r2}`),
    ok(arrived, 'they arrive at the podium idle'),
    ok(put && S.after.bodies.some(b => b.job === 'woodcutter'), 'and the + under the forestry shack puts one to work')
  ];
});

group('the meeting opens on souls won, before any is hired', async () => {
  up();
  window.__afterCrowd((i, v) => (i >= CROWD_FILES && i < CROWD_FILES + MEET_MEMBERS ? RIM_PIECES : v), true);
  run(1);
  const gate = read().gate, hired = read().union;
  window.__actsOn(null);
  return [ok(gate >= 1 && hired < MEET_MEMBERS, 'the meeting is reached on the won alone', `gate ${gate}, ${hired} hired`)];
});
