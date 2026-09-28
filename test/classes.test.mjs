// The ten classes (docs/wave-party.md, "Classes"): one group a class. Each
// is bought at its station the player's way -- the board's rows, rung by
// rung, the class taken at the fork (DESIGN.md, "A fighter branches at rung
// 4") -- and is followed at work: its attack alone breaks the bare coil
// (every class but the Bard, who does no damage), its rung-4 move happens,
// and its rung-8 capstone.
//
// The party itself is the setup: stations stood up with a fighter at each.
// That a fang buys a station and a pod resident swims to it is CREW's
// (party.test.mjs); that the rails fold and Reset refunds is BOARD's.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { CLASSES, PAIRS, SERPENT_DEFENSE, STUN_MAX_S, HASTE, FORK_RUNG } from '../src/config.js';
import { climb, reset, openEveryClass } from './party-press.mjs';
import { shots } from '../src/deep/arms.js';
import { rungWorth, stationOf, stationX } from '../src/deep/classes.js';
import { has, level, hasted, inspiredK } from '../src/deep/statuses.js';

const S = yard.S;

// A party stood up after the snatch: a station of each kind asked for, built,
// with a fighter at it, and nobody else in the deep striking. Every class is
// open, as a second station opens them: which one stands alone is the check.
// A gatherer stands by the crusher, so the fang a break drops is carried by
// a hand of its own and no fighter leaves its work to fetch it.
function party(kinds) {
  window.__snatch({ played: true });
  window.__serpent({ stage: 0, wound: 0 });
  window.__party({ stations: kinds.map(kind => ({ kind, cls: null, rung: 0 })) });
  window.__deepCrew({ spare: 1 });
  openEveryClass();
}

// Climb station `i`'s rail for `cls` to rung `n`: its Buy pressed a rung at
// a time, with the coin to pay for it.
const buyTo = (i, cls, n) => climb(S.stations[i].id, cls, n);

const fighterAt = i => S.workers.find(w => w.station === S.stations[i].id);

// Frame by frame for `s` seconds: every pose a fighter starts, every stun,
// every hit of each kind, and the stage.
function watch(s, i = 0, each = () => {}) {
  const seen = { moves: [], poses: [], stuns: 0, stunMost: 0, hits: new Map(), stage: S.serpentStage, shots: new Set() };
  let pose = null, stunned = false;
  // Only hits struck during the watch: a number still up from before is not its.
  const hits = new Set(S.hits);
  for (let f = 0; f < s * 60; f++) {
    run(1 / 60);
    const w = fighterAt(i);
    if (w && w.pose && w.pose !== pose && w.pose.move) { pose = w.pose; seen.moves.push(pose.move); seen.poses.push(pose); }
    if (S.serpentStun > 0 && !stunned) seen.stuns++;
    stunned = S.serpentStun > 0;
    seen.stunMost = Math.max(seen.stunMost, S.serpentStun);
    for (const h of S.hits) if (!hits.has(h)) { hits.add(h); seen.hits.set(h, h.done); }
    for (const sh of shots) seen.shots.add(sh.kind);
    seen.stage = Math.max(seen.stage, S.serpentStage);
    if (each(f) === true) break;
  }
  return seen;
}
const count = (list, m) => list.filter(x => x === m).length;

// Alone at its first rung -- 1 for the class its kind's base unit fights as,
// the fork's for the other -- against the bare coil at its heal: broken
// inside `limit`.
function breaksAlone(kind, cls, limit = 120) {
  party([kind]);
  const first = PAIRS[kind][0] === cls ? 1 : FORK_RUNG;
  buyTo(0, cls, first);
  const broke = runUntil(() => S.serpentStage >= 1, limit);
  return ok(broke, `a ${CLASSES[cls].name} alone at rung ${first} breaks the bare coil`,
            `stage ${S.serpentStage}, wound ${S.serpentWound.toFixed(1)}`);
}

group("a station with no class fights as its base unit, its pair's first class", async () => {
  party(['altar']);
  const w = fighterAt(0);
  const seen = watch(10);
  return [
    ok(w && stationOf(w) === S.stations[0], 'the fighter is tied to its station'),
    ok(S.stations[0].cls === null && S.stations[0].rung === 0, 'the station has taken no class'),
    ok(seen.moves.includes('punch'), 'and its Fighter punches, as the Brawler does', seen.moves.join(' ')),
    ok(S.serpentWound > 0, 'and wounds the serpent', `${S.serpentWound}`)
  ];
});

group('Brawler: punches break the bare coil; a haymaker every 4th from rung 4, stunning from rung 8', async () => {
  const alone = breaksAlone('altar', 'brawler');
  // Against the fading coil, where no haymaker is worth more than the
  // share: every stun is the move's own length, not stretched by its size.
  window.__serpent({ stage: 3, wound: 0 });
  buyTo(0, 'brawler', 4);
  const four = watch(12);
  const hay = count(four.moves, 'haymaker'), punch = count(four.moves, 'punch');
  window.__serpent({ stage: 3, wound: 0 });
  buyTo(0, 'brawler', 8);
  S.serpentGrace = 0;
  const eight = watch(12);
  return [
    alone,
    ok(hay >= 2 && punch >= 3 * hay - 3 && punch <= 3 * hay + 3, 'at rung 4 every 4th punch is a haymaker',
       four.moves.join(' ')),
    ok(four.stuns === 0, 'which does not stun yet', `${four.stuns} stuns`),
    ok(eight.stuns >= 1 && eight.stunMost <= STUN_MAX_S, 'at rung 8 the haymaker stuns',
       `${eight.stuns} stuns, ${eight.stunMost.toFixed(2)} s at most`)
  ];
});

// The hits of one kind a watch saw, as what each finally came to.
const done = (seen, weapon) => [...seen.hits.keys()].filter(h => h.weapon === weapon).map(h => h.done);
const near = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));

group('Swordsman: the whirlwind lands each cut at three spots; at rung 8 every 3rd cut lands twice and bleeds', async () => {
  const alone = breaksAlone('altar', 'sword');
  const cls = CLASSES.sword;
  window.__serpent({ stage: 0, wound: 0 });
  let bledEarly = false;
  const base = watch(3, 0, () => { bledEarly = bledEarly || has('bleed'); });
  window.__serpent({ stage: 3, wound: 0 });
  // Windows counted in cuts, not seconds, so a retuned pace still sees enough.
  const four = watch(6 * cls.every);
  const v4 = rungWorth(cls, 4) * SERPENT_DEFENSE.sword[3];
  // A whirlwind's cut is one number: its three spots summed. The bleed's
  // ticks are numbers of their own, far smaller.
  const cuts = done(four, 'sword').filter(d => d > v4);
  buyTo(0, 'sword', 8);
  let bled = false;
  const eight = watch(8 * cls.every, 0, () => { bled = bled || has('bleed'); });
  const twice = eight.poses.filter(p => p.twice).length, whirls = eight.poses.length;
  return [
    alone,
    ok(!bledEarly && base.moves.includes('whirl'), 'below rung 8 a cut does not bleed', base.moves.join(' ')),
    // The first is the cut in hand when the rung was bought.
    ok(four.moves.length >= 4 && four.moves.slice(1).every(m => m === 'whirl'), 'at rung 4 every cut is a whirlwind',
       four.moves.join(' ')),
    ok(cuts.length >= 3 && cuts.every(d => near(d, v4 * cls.whirl.spots * cls.whirl.x)),
       'landing at three spots, summed', JSON.stringify(cuts.slice(0, 4))),
    ok(twice >= 2 && Math.abs(twice - whirls / cls.capEvery) <= 1, 'at rung 8 every 3rd cut lands twice', `${twice} of ${whirls}`),
    ok(bled, 'and leaves the serpent Bleeding')
  ];
});

// Follows the chi row, which fills across more than five seconds and which
// no save keeps.
group('Monk: palm waves fill chi, a full row is a stunning chi palm; faster at 4, longer at 8', async () => {
  const alone = breaksAlone('well', 'monk', 150);
  window.__serpent({ stage: 3, wound: 0 });
  const base = watch(13);
  buyTo(0, 'monk', 4);
  const four = watch(13);
  const stun4 = four.stunMost;
  buyTo(0, 'monk', 8);
  S.serpentGrace = 0;
  const eight = watch(13);
  // The palms between two chi palms, each whole run a watch saw: the count a
  // row takes, whatever the window's phase.
  const gaps = m => {
    const at = m.moves.map((v, i) => (v === 'chi' ? i : -1)).filter(i => i >= 0);
    return at.slice(1).map((i, n) => i - at[n] - 1);
  };
  return [
    alone,
    ok(base.shots.has('palm') && count(base.moves, 'chi') >= 1, 'palms fly from the well and a full row is a chi palm',
       base.moves.join(' ')),
    ok(gaps(base).length && gaps(four).length && Math.max(...gaps(four)) < Math.min(...gaps(base)),
       'at rung 4 chi fills twice as fast', `${gaps(base)} palms between chi palms, then ${gaps(four)}`),
    ok(four.stuns >= 1, 'a chi palm stuns', `${four.stuns}`),
    ok(eight.stunMost > stun4, 'and at rung 8 it stuns longer', `${stun4.toFixed(2)} then ${eight.stunMost.toFixed(2)}`)
  ];
}, { reload: false });

group('Martial Artist: thrusts fill a row, a full row is a finisher; Flow fills it faster; at 8 it Hastes the party', async () => {
  const alone = breaksAlone('well', 'martial');
  const pp = CLASSES.martial.pips;
  window.__serpent({ stage: 3, wound: 0 });
  const base = watch(4);
  const fin = seen => count(seen.moves, 'finisher') / Math.max(1, seen.moves.length);
  // A row without Flow is a finisher every max/fill + 1 moves; with it, sooner.
  const plainShare = 1 / (pp.max / pp.fill + 1);
  const hastedAt4 = hasted(fighterAt(0));
  buyTo(0, 'martial', 8);
  let fast = false;
  watch(4, 0, () => { if (hasted(fighterAt(0))) fast = true; });
  return [
    alone,
    ok(count(base.moves, 'finisher') >= 1 && count(base.moves, 'thrust') >= 4, 'thrusts, then a finisher', base.moves.join(' ')),
    ok(fin(base) > plainShare + 0.02, 'Flow, hers from the fork, fills the row in fewer thrusts',
       `${fin(base).toFixed(2)} of her moves finishers, ${plainShare.toFixed(2)} without it`),
    ok(!hastedAt4 && fast, 'at rung 8 a finisher Hastes her', `${hastedAt4} then ${fast}`)
  ];
});

group('Ranger: arrows from over the head; every 5th aimed at rung 4, and stunning at rung 8', async () => {
  const alone = breaksAlone('armory', 'ranger');
  const cls = CLASSES.ranger;
  window.__serpent({ stage: 3, wound: 0 });
  let over = 0, under = 0;
  const base = watch(4, 0, () => {
    for (const s of shots) if (s.kind === 'arrow' && s.x === s.x0) (s.y0 < fighterAt(0).y ? over++ : under++);
  });
  buyTo(0, 'ranger', 4);
  const four = watch(10);
  const aimed = count(four.moves, 'aimed'), plain = count(four.moves, 'shoot');
  buyTo(0, 'ranger', 8);
  S.serpentGrace = 0;
  const eight = watch(10);
  return [
    alone,
    ok(base.shots.has('arrow') && over > 0 && under === 0, 'arrows leave from over her head', `${over} over, ${under} under`),
    ok(aimed >= 2 && Math.abs(plain - aimed * (cls.aimed.every - 1)) <= cls.aimed.every, 'at rung 4 every 5th is aimed',
       four.moves.join(' ')),
    ok(four.stuns === 0, 'and at rung 4 an aimed shot does not stun', `${four.stuns}`),
    ok(eight.stuns >= 1, 'at rung 8 it does', `${eight.stuns}`)
  ];
});

group('Assassin: daggers travel while she holds still; x3 on a stunned coil; Execution at 4, the last tenth at 8', async () => {
  const alone = breaksAlone('armory', 'assassin');
  const cls = CLASSES.assassin;
  window.__serpent({ stage: 3, wound: 0 });
  // Her drift while she stabs, a frame at a time, once she is up at the coil.
  runUntil(() => fighterAt(0).goal === 'fight', 30);
  let drift = 0, px = fighterAt(0).x, py = fighterAt(0).y;
  const base = watch(5, 0, () => {
    const w = fighterAt(0);
    drift = Math.max(drift, Math.hypot(w.x - px, w.y - py));
    px = w.x; py = w.y;
  });
  const plain = rungWorth(cls, S.stations[0].rung) * SERPENT_DEFENSE.assassin[3];
  const hits = done(base, 'assassin');
  // A stunned serpent, held so for the watch: the stun is the setup here.
  const stunned = () => { S.serpentStun = 3; S.serpentGrace = 0; };
  stunned();
  const onStun = done(watch(4, 0, stunned), 'assassin');
  const v4 = rungWorth(cls, 4) * SERPENT_DEFENSE.assassin[3];
  window.__serpent({ stage: 3, wound: 0 });
  S.serpentStun = 0;
  // The wound held where each check wants it, before the watch and on every
  // frame of it.
  const at = wound => { const set = () => { S.serpentWound = wound; }; set(); return set; };
  const shallow = done(watch(4, 0, at(0)), 'assassin');
  const deep = done(watch(4, 0, at(15000)), 'assassin');
  buyTo(0, 'assassin', 8);
  let bled = false;
  watch(4, 0, () => { at(0)(); bled = bled || has('bleed'); });
  return [
    alone,
    ok(base.shots.has('dagger') && hits.length >= 2, 'her daggers travel to the hide', [...base.shots].join(' ')),
    ok(drift < 1, 'while she holds nearly still', `${drift.toFixed(2)}px a frame at most`),
    ok(hits.every(d => near(d, plain)), 'a plain stab', JSON.stringify(hits)),
    // Execution is hers from the fork: each stab grows a little with the
    // wound the last ones opened.
    ok(onStun.length >= 1 && onStun.every(d => Math.abs(d / (plain * cls.stunnedX) - 1) < 0.02),
       'x3 on a stunned serpent', JSON.stringify(onStun)),
    // Half the phase's depth open: x1.5, less the frame's heal before it lands.
    ok(shallow.length >= 1 && shallow.every(d => near(d, v4)) && deep.length >= 1
       && deep.every(d => Math.abs(d / (v4 * 1.5) - 1) < 1e-3),
       'at rung 4 stabs grow with the wound', `${JSON.stringify(shallow)} then ${JSON.stringify(deep)}`),
    ok(bled, 'at rung 8 her daggers leave the serpent Bleeding')
  ];
});

group('Hexer: a hex strikes; it Weakens the heal from rung 4; from rung 8 it stops the heal and Exposes', async () => {
  const alone = breaksAlone('circle', 'hexer');
  const cls = CLASSES.hexer;
  window.__serpent({ stage: 1, wound: 0 });
  let weakEarly = false;
  const base = watch(6, 0, () => { if (has('weakened') || has('held') || has('exposed')) weakEarly = true; });
  buyTo(0, 'hexer', 4);
  let weak = 0, heldAt4 = false;
  watch(6, 0, () => { weak = Math.max(weak, level('weakened')); if (has('held')) heldAt4 = true; });
  buyTo(0, 'hexer', 8);
  let held = false, exposed = false;
  watch(6, 0, () => { if (has('held')) held = true; if (has('exposed')) exposed = true; });
  return [
    alone,
    ok(base.shots.has('hex') && !weakEarly, 'a base hex strikes and lays nothing', `${[...base.shots]}`),
    ok(weak === cls.weaken.k && !heldAt4, 'at rung 4 it Weakens the heal', `${weak} ${heldAt4}`),
    ok(held && exposed, 'at rung 8 it stops the heal and Exposes', `${held} ${exposed}`)
  ];
});

group('Sapper: thrown charges burst; at 4 a charge sticks, ticks and blows x3 and stuns; at 8 two at once', async () => {
  const alone = breaksAlone('circle', 'sapper');
  const cls = CLASSES.sapper;
  window.__serpent({ stage: 3, wound: 0 });
  const base = watch(8);
  buyTo(0, 'sapper', 4);
  let stuck = 0;
  const four = watch(14, 0, () => { stuck = Math.max(stuck, shots.filter(s => s.stuck).length); });
  const blows = done(four, 'sapper');
  const v4 = rungWorth(cls, 4) * SERPENT_DEFENSE.sapper[3] * cls.stickyX;
  buyTo(0, 'sapper', 8);
  S.serpentGrace = 0;
  let two = 0;
  watch(10, 0, () => { two = Math.max(two, shots.filter(s => s.stuck).length); });
  return [
    alone,
    ok(base.shots.has('charge') && base.moves.includes('throw'), 'a charge is thrown', [...base.shots].join(' ')),
    ok(stuck === 1, 'at rung 4 it sticks to the hide', `${stuck}`),
    ok(blows.some(d => near(d, v4)), 'and blows as one blow x3', JSON.stringify(blows)),
    ok(four.stuns >= 1, 'that stuns', `${four.stuns} stuns`),
    ok(two === 2, 'at rung 8 two are stuck at once', `${two}`)
  ];
});

// Follows one beam from its start to its finishing blow; a save keeps no beam.
group('Mage: a held beam ticks, then a finishing blow; it widens at 4 and burns through at 8', async () => {
  const alone = breaksAlone('spire', 'mage');
  const cls = CLASSES.mage;
  window.__serpent({ stage: 3, wound: 0 });
  let beamed = false;
  const base = watch(8, 0, () => { if (fighterAt(0).beam) beamed = true; });
  buyTo(0, 'mage', 4);
  let widest = 0;
  watch(8, 0, () => { const b = fighterAt(0).beam; if (b) widest = Math.max(widest, b.width); });
  // The split, where a Mage is halved -- until her beam burns through.
  window.__serpent({ stage: 2, wound: 0 });
  const tick = seen => [...seen.hits.keys()].filter(h => h.weapon === 'mage' && h.key).map(h => h.done);
  const half = Math.max(...tick(watch(6)));
  buyTo(0, 'mage', 8);
  let burn = 0;
  const through = Math.max(...tick(watch(6, 0, () => { const b = fighterAt(0).beam; if (b) burn = Math.max(burn, b.burn); })));
  const grew = rungWorth(cls, 8) / rungWorth(cls, 4);
  return [
    alone,
    ok(beamed && count(base.moves, 'finish') >= 1, 'she holds a beam and ends it on a finishing blow', base.moves.join(' ')),
    ok(widest > 0.9, 'at rung 4 the beam widens as she holds it', `${widest}`),
    ok(through > half * grew * 1.8 && burn > 0.9, 'at rung 8 it burns through the phase that halves it',
       `${half.toFixed(1)} then ${through.toFixed(1)}, burn ${burn}`)
  ];
}, { reload: false });

group('Bard: no damage; with another the Anthem doubles her boost, and at 8 her song Hastes them too', async () => {
  party(['spire', 'armory']);
  buyTo(0, 'bard', 4);
  // The Bard strikes nothing of her own: every hit is the armory's Scout's.
  const hits = new Set(S.hits);
  run(6);
  const quiet = S.hits.filter(h => !hits.has(h) && h.weapon !== 'heal').every(h => h.weapon === 'ranger');
  window.__serpent({ stage: 3, wound: 0 });
  const v = rungWorth(CLASSES.ranger, 0) * SERPENT_DEFENSE.ranger[3];
  run(0.5);
  const anthem = done(watch(4, 1), 'ranger');
  const k4 = rungWorth(CLASSES.bard, 4) * CLASSES.bard.anthemX;
  const slowAt4 = !hasted(fighterAt(1));
  buyTo(0, 'bard', 8);
  run(1);
  const quick = hasted(fighterAt(1));
  // She stops: her station's class goes, and she is the spire's Apprentice again.
  reset(S.stations[0].id);
  run(1);
  const gone = !hasted(fighterAt(1)) && inspiredK(fighterAt(1)) === 0;
  // Two arrows landing close together are one number, so each is read as a
  // whole number of Inspired arrows; the first watch may start on an arrow
  // that was loosed before the rung.
  const arrows = (list, unit) => list.filter(d => near(d / unit, Math.round(d / unit))).length;
  return [
    ok(quiet, 'a Bard deals no damage of her own'),
    ok(arrows(anthem, v * (1 + k4)) >= anthem.length - 1 && anthem.length >= 3,
       "another fighter's hits are Inspired, the Anthem's double", JSON.stringify(anthem)),
    ok(slowAt4 && quick, 'at rung 8 her song Hastes the others', `${slowAt4} ${quick}`),
    ok(gone, 'and both go once she stops singing')
  ];
});
group('a Bard alone gives nothing', async () => {
  party(['spire']);
  buyTo(0, 'bard', 8);
  run(8);
  return [
    ok(fighterAt(0).goal === 'sing', 'she sings', fighterAt(0).goal),
    ok(S.serpentWound === 0 && !S.workers.some(w => inspiredK(w) > 0), 'to nobody, and nothing is struck',
       `${S.serpentWound}`)
  ];
});
