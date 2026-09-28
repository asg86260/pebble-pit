// A station's board (DESIGN.md, "A fighter branches at rung 4"): the empty
// lot's question, then the ladder as a tree of pips over the rows that buy
// it, read off what the page draws (`railsOf`) and pressed where the player
// presses (`pressKind`, `pressBuy`, `pressReset` are the lot's rows, a rung's
// row and the Reset). The base unit climbs three rungs with no class; the
// fork asks for a path, a row a class, and buying one closes the other
// branch; Reset hands back what was paid and stands the base unit again; a
// class that needs company waits for a second station; and two stations of
// one kind keep a ladder each.
//
// The stations are stood up by `__party`: the setup these checks are not
// about. The pointer's own presses are the browser group `rails`
// (src/selftest/deep.js).

import { group, ok, yard } from './helpers.mjs';
import { LADDER, CLASSES, PAIRS, FORK_RUNG, FIRST_KINDS, rungDust } from '../src/config.js';
import { railsOf, pressKind, pressBuy, pressReset } from '../src/deep/rails.js';
import { classLadder, rungBill } from '../src/deep/rows.js';
import { press } from '../src/deep/buildbutton.js';
import { stationById } from '../src/deep/party.js';
import { purse } from '../src/words.js';
import { pressBuild } from './party-press.mjs';

const S = yard.S;

// A party stood up after the snatch, built, one station a kind, at the next
// slots, with nothing bought on any board.
const stand = (...kinds) => {
  window.__party({ stations: kinds.map(kind => ({ kind, cls: null, rung: 0 })) });
  return S.stations;
};
// A purse to spend: scales on the crusher and every coin the bands add.
const flush = () => {
  window.__scales(99999);
  window.__grant({ dust: 1e8, shards: 1e6, sparks: 1e5 });
};
// A rung's row, and the Reset, pressed.
const buy = (st, cls = null) => pressBuy(st.id, cls);
const reset = st => pressReset(st.id);
const climbBase = st => { for (let r = 1; r < FORK_RUNG; r++) buy(st); };
const wallet = () => ({ scale: purse('scale'), dust: purse('dust'), shard: purse('shard'), spark: purse('spark') });

group("an empty lot's board asks what goes up; a pick sends the builders", async () => {
  window.__snatch({ played: true });
  const id = press();
  const lot = railsOf(id);
  const open = lot.kinds.filter(k => k.open).map(k => k.kind);
  const altar = lot.kinds.find(k => k.kind === 'altar');
  const shut = pressKind(id, 'well');
  const picked = pressKind(id, 'altar');
  const st = stationById(id);
  return [
    ok(lot.lot && lot.ask === 'What goes up here?', 'the lot asks what goes up here', lot.ask),
    ok(JSON.stringify(open) === JSON.stringify(FIRST_KINDS), 'the first lot offers the three starting kinds', JSON.stringify(open)),
    ok(altar.name === 'Fighter' && altar.sub.includes('Brawler or Swordsman'), 'each a base unit, saying what it forks into',
       `${altar.name}: ${altar.sub}`),
    ok(!shut, 'a kind not offered cannot be picked'),
    ok(picked && st.kind === 'altar' && !st.built, 'a pick names the station, and it is put up by hand', JSON.stringify(st))
  ];
});

group('the base unit climbs three rungs; the fork asks for a path and closes the other', async () => {
  const [st] = stand('altar', 'spire');
  flush();
  const blank = railsOf('s1');
  const asked = rungDust('brawler', 0);
  const tag = blank.rows[0].bill;
  climbBase(st);
  const fork = railsOf('s1');
  const early = st.cls, earlyRung = st.rung;
  const wrong = buy(st);
  buy(st, 'sword');
  const took = railsOf('s1');
  const arm = cls => took.tree.arms.find(a => a.cls === cls);
  return [
    ok(blank.who === 'Fighter' && blank.rows.length === 1 && blank.rows[0].label === 'Fighter 1',
       'a new station is its base unit, one row to climb', JSON.stringify(blank.rows.map(r => r.label))),
    ok(tag.length === 1 && tag[0][0] === 'scale' && tag[0][1] === asked, "its tag is the ladder's first rung, scales alone",
       JSON.stringify(tag)),
    ok(blank.tree.base.length === FORK_RUNG - 1 && blank.tree.arms.every(a => a.pips.length === LADDER - FORK_RUNG + 1),
       "the tree: the base unit's pips, then each branch's"),
    ok(early === null && earlyRung === FORK_RUNG - 1, 'three rungs climbed with no class taken', `${early} ${earlyRung}`),
    ok(fork.ask && fork.rows.map(r => r.label).join() === 'Become a Brawler,Become a Swordsman',
       'at the fork the board asks for a path, a row a class', JSON.stringify(fork.rows.map(r => r.label))),
    ok(!wrong, 'and buys nothing without one named'),
    ok(st.cls === 'sword' && st.rung === FORK_RUNG, 'the Swordsman row takes the Swordsman at rung 4', `${st.cls} ${st.rung}`),
    ok(arm('brawler').gone && !arm('sword').gone, 'and the other branch closes',
       JSON.stringify(took.tree.arms.map(a => [a.cls, a.gone]))),
    ok(took.rows.length === 1 && took.rows[0].label === 'Swordsman 5', 'the row moves on up the same ladder', took.rows[0]?.label)
  ];
});

group('Reset hands back exactly what was paid and stands the base unit again', async () => {
  const [st] = stand('armory');
  flush();
  const before = wallet();
  climbBase(st);
  buy(st, 'ranger');
  const spent = wallet();
  const climbed = st.rung;
  const sinking = S.sinking.length;
  reset(st);
  const after = wallet();
  const back = railsOf('s1');
  // Scales go back into the water they were lifted out of and sink to the
  // bed; every other coin comes home at once.
  const coins = w => ({ dust: w.dust, shard: w.shard, spark: w.spark });
  return [
    ok(climbed === FORK_RUNG && spent.scale < before.scale, 'the Scout and then the Ranger were climbed, in scales',
       `rung ${climbed}, ${before.scale} -> ${spent.scale}`),
    ok(JSON.stringify(coins(after)) === JSON.stringify(coins(before)), 'Reset gives every coin back',
       `${JSON.stringify(before)} -> ${JSON.stringify(after)}`),
    ok(S.sinking.length - sinking === before.scale - spent.scale, 'and every scale back into the water',
       `${S.sinking.length - sinking} of ${before.scale - spent.scale}`),
    ok(st.cls === null && st.rung === 0 && back.who === 'Scout', 'the station is its base unit again',
       `${st.cls} ${st.rung} ${back.who}`),
    ok(back.tree.arms.every(a => !a.gone) && back.tree.base.every(p => !p.on), 'with the whole tree open',
       JSON.stringify(back.tree.arms.map(a => a.gone))),
    ok(!back.reset.can, 'and nothing left for Reset to do')
  ];
});

group("the Bard's branch waits for a second station, and opens with it", async () => {
  const [st] = stand('spire');
  flush();
  climbBase(st);
  const one = railsOf('s1');
  const bard = one.rows.find(r => r.cls === 'bard');
  const refused = buy(st, 'bard');
  // A second station, bought off the build button with a break's fang.
  window.__party({ fangs: 1 });
  pressBuild('altar');
  window.__finish();
  const two = railsOf('s1').rows.find(r => r.cls === 'bard');
  return [
    ok(bard.locked && !bard.can && /second station/.test(bard.sub), 'with one station the Bard waits for a second',
       JSON.stringify(bard)),
    ok(one.tree.arms.find(a => a.cls === 'bard').locked, 'her branch in the tree says so too'),
    ok(!refused && st.cls === null, 'and cannot be bought'),
    ok(!two.locked && two.can, 'a second station opens her', JSON.stringify(two))
  ];
});

group('two stations of one kind keep a ladder each', async () => {
  const [a, b] = stand('altar', 'altar');
  flush();
  climbBase(a);
  buy(a, 'brawler');
  buy(b);
  const one = railsOf('s1'), two = railsOf('s2');
  const rungOf = (st, cls) => classLadder(st, cls).rung();
  return [
    ok(a.cls === 'brawler' && a.rung === FORK_RUNG, 'the first altar forked to the Brawler', `${a.cls} ${a.rung}`),
    ok(b.cls === null && b.rung === 1, 'the second climbed its Fighter one rung', `${b.cls} ${b.rung}`),
    ok(rungOf(a, 'brawler') === FORK_RUNG && rungOf(b, 'brawler') === 1, 'each ladder at its own rung',
       `${rungOf(a, 'brawler')} ${rungOf(b, 'brawler')}`),
    ok(one.rows[0].label === 'Brawler 5' && two.rows[0].label === 'Fighter 2', 'each row climbs its own',
       `${one.rows[0].label} / ${two.rows[0].label}`),
    ok(JSON.stringify(rungBill('s1', 'brawler')) !== JSON.stringify(rungBill('s2', null)),
       'and each is priced from its own rung', `${JSON.stringify(rungBill('s1', 'brawler'))} vs ${JSON.stringify(rungBill('s2', null))}`)
  ];
});

group('every class has a ladder of eight, priced in scales at its foot', async () => {
  const [st] = stand('altar');
  const bad = [];
  for (const cls of Object.keys(CLASSES)) {
    const card = classLadder({ ...st, cls: null }, cls);
    const bill = card.bill().filter(([, n]) => n > 0);
    if (card.rungs() !== LADDER || bill.length !== 1 || bill[0][0] !== 'scale') bad.push(`${cls} ${card.rungs()} ${JSON.stringify(bill)}`);
  }
  const kinds = Object.keys(PAIRS).filter(k => PAIRS[k].length !== 2);
  return [ok(bad.length === 0, 'ten ladders, eight rungs each, scales first', bad.join('; ')),
          ok(kinds.length === 0, 'and every kind offers two classes', kinds.join(','))];
});

group('each pip says what it is, one short line', async () => {
  stand('spire');
  const pipOf = (r, cls = null) => {
    const t = railsOf('s1').tree;
    return (cls ? t.arms.find(a => a.cls === cls).pips : t.base).find(p => p.r === r).line;
  };
  const base = pipOf(2);
  const move = pipOf(4, 'mage'), cap = pipOf(8, 'mage'), rung = pipOf(6, 'mage');
  const locked = pipOf(4, 'bard');
  window.__party({ fangs: 1 });
  pressBuild('altar');
  window.__finish();
  const opened = pipOf(4, 'bard');
  const lines = [base, move, cap, rung, locked, opened];
  return [
    ok(/^Apprentice 2: /.test(base), 'a base rung names the base unit and its number', base),
    ok(/^Widening: /.test(move), 'rung 4 names the move', move),
    ok(/^Burn through: /.test(cap), 'rung 8 the capstone', cap),
    ok(/^Mage 6: /.test(rung), 'another rung its number', rung),
    ok(/second station/.test(locked), 'a locked branch says when it opens', locked),
    ok(!/second station/.test(opened), 'and opens with a second station', opened),
    ok(lines.every(l => !l.includes('\n') && l.length < 60), 'each one short line', lines.join(' | '))
  ];
});
