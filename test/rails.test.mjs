// A station's rails (docs/wave-party.md, "The rails"; test plan, "Checks"):
// the two classes a station offers, a rail of eight each, read off what the
// page draws (`railsOf`) and pressed where the player presses (`view`,
// `pressBuy`, `pressReset` are the plate, the Buy and the Reset). Looking at a
// class takes nothing; the first rung bought takes the class and folds the
// other rail; Reset hands back what was paid and unfolds them; a class that is
// not open says so until a second station stands; and two stations of one
// kind keep a ladder each.
//
// The stations are stood up on `S` directly: the setup these checks are not
// about. The pointer's own presses are the browser group `rails`
// (src/selftest/deep.js).

import { group, ok, yard } from './helpers.mjs';
import { LADDER, CLASSES, PAIRS, rungDust } from '../src/config.js';
import { railsOf, view, hover, pressBuy, pressReset, viewing } from '../src/deep/rails.js';
import { classLadder, rungBill } from '../src/deep/rows.js';
import { purse } from '../src/words.js';

const S = yard.S;

// until merge: `__party` (STATE) stands a party up; until then the stations
// are written onto S by hand, built, one a kind, at the next slots.
const stand = (...kinds) => {
  S.stations = kinds.map((kind, i) => ({ id: `s${i + 1}`, kind, slot: i, built: true,
                                         cls: null, rung: 0, paid: [], fighter: null }));
  S.stationsBuilt = kinds.length;
  return S.stations;
};
// A purse to spend: scales on the crusher and every coin the bands add.
const flush = () => {
  window.__scales(99999);
  window.__grant({ dust: 1e8, shards: 1e6, sparks: 1e5 });
};
// until merge: CREW's `buyRung` and `resetStation` are stubs in the skeleton.
// Where the stub left the station as it was, what the party will do is done
// here instead, from the party's own words (docs/wave-party.md, "The party
// module"); once CREW lands, the station has already moved and these do
// nothing.
const boughtByHand = (st, cls) => {
  const bill = rungBill(st.id, cls);
  st.cls = cls; st.rung++;
  st.paid = [...st.paid, ...bill];
  for (const [coin, n] of bill) {
    if (coin === 'scale') S.scales -= n; else if (coin === 'dust') S.stored -= n;
    else if (coin === 'shard') S.shards -= n; else if (coin === 'spark') S.sparks -= n;
  }
};
const resetByHand = st => {
  for (const [coin, n] of st.paid) {
    if (coin === 'scale') S.scales += n; else if (coin === 'dust') S.stored += n;
    else if (coin === 'shard') S.shards += n; else if (coin === 'spark') S.sparks += n;
  }
  Object.assign(st, { cls: null, rung: 0, paid: [] });
};
// The Buy and the Reset, pressed; where the stub moved nothing, by hand.
const buy = st => {
  const was = st.rung, cls = railsOf(st.id).buy.cls;
  pressBuy(st.id);
  if (st.rung === was && cls) boughtByHand(st, cls);            // until merge
};
const reset = st => {
  const was = st.rung;
  pressReset(st.id);
  if (st.rung === was && was > 0) resetByHand(st);               // until merge
};
const wallet = () => ({ scale: purse('scale'), dust: purse('dust'), shard: purse('shard'), spark: purse('spark') });

group('viewing a class takes nothing; the first rung bought takes it and folds the other', async () => {
  const [st] = stand('altar', 'spire');
  flush();
  const blank = railsOf('s1');
  view('s1', 'brawler');
  const looked = railsOf('s1');
  const stillBlank = st.cls === null && st.rung === 0;
  const tag = looked.buy.bill;
  const asked = rungDust('brawler', 0);
  buy(st);
  const took = railsOf('s1');
  const plate = cls => took.plates.find(p => p.cls === cls);
  return [
    ok(blank.plates.length === 2 && blank.plates.every(p => !p.folded && !p.dim),
       'a blank station shows both classes, neither faded', JSON.stringify(blank.plates)),
    ok(blank.buy.label === 'pick a class' && !blank.buy.can, 'and Buy asks for a class first', blank.buy.label),
    ok(stillBlank, 'viewing a class does not take it', `${st.cls} ${st.rung}`),
    ok(looked.plates.find(p => p.cls === 'sword').dim && !looked.plates.find(p => p.cls === 'brawler').dim,
       'the other class fades while one is viewed', JSON.stringify(looked.plates)),
    ok(!looked.plates.some(p => p.folded), 'but nothing folds'),
    ok(looked.buy.label === 'Buy Brawler 1', 'Buy names what it buys', looked.buy.label),
    ok(tag.length === 1 && tag[0][0] === 'scale' && tag[0][1] === asked,
       "its tag is the ladder's first rung, scales alone", JSON.stringify(tag)),
    ok(st.cls === 'brawler' && st.rung === 1, 'the first rung bought takes the class', `${st.cls} ${st.rung}`),
    ok(plate('sword').folded && !plate('brawler').folded, 'and the other rail folds away', JSON.stringify(took.plates)),
    ok(plate('brawler').on && plate('brawler').lit === 1, 'the taken rail lights its rung'),
    ok(took.buy.label === 'Buy Brawler 2', 'Buy moves on up the same ladder', took.buy.label),
    ok(!viewing('s1') || viewing('s1').cls === 'brawler', 'and the view is put away or on the class taken')
  ];
});

group('Reset hands back exactly what was paid and unfolds the rails', async () => {
  const [st] = stand('armory');
  flush();
  const before = wallet();
  view('s1', 'ranger');
  for (let i = 0; i < 3; i++) buy(st);
  const spent = wallet();
  const climbed = st.rung;
  reset(st);
  const after = wallet();
  const back = railsOf('s1');
  return [
    ok(climbed === 3 && spent.scale < before.scale, 'three rungs of the ranger were bought, in scales',
       `rung ${climbed}, ${before.scale} -> ${spent.scale}`),
    ok(JSON.stringify(after) === JSON.stringify(before), 'Reset gives every coin back',
       `${JSON.stringify(before)} -> ${JSON.stringify(after)}`),
    ok(st.cls === null && st.rung === 0, 'the station is blank again', `${st.cls} ${st.rung}`),
    ok(back.plates.every(p => !p.folded && !p.on && !p.lit), 'and both rails stand unfolded', JSON.stringify(back.plates)),
    ok(!back.reset.can, 'with nothing left for Reset to do')
  ];
});

group('a locked class says it opens with a second station, and opens with it', async () => {
  const [st] = stand('altar');
  S.stationsBuilt = 1;
  const one = railsOf('s1');
  const sword = one.plates.find(p => p.cls === 'sword');
  const viewed = view('s1', 'sword'), seen = viewing('s1');
  // until merge: the second station lands through `stationLanded` (CREW).
  S.stations.push({ id: 's2', kind: 'well', slot: 1, built: true, cls: null, rung: 0, paid: [], fighter: null });
  S.stationsBuilt = 2;
  const two = railsOf('s1');
  view('s1', 'sword');
  const buy = railsOf('s1').buy;
  return [
    ok(sword.locked && !one.plates.find(p => p.cls === 'brawler').locked,
       'with one station the altar offers the Brawler alone', JSON.stringify(one.plates)),
    ok(!viewed && !seen, 'the locked Swordsman cannot be viewed'),
    ok(two.plates.every(p => !p.locked), 'a second station opens both', JSON.stringify(two.plates)),
    ok(buy.cls === 'sword' && buy.label === 'Buy Swordsman 1', 'and the Swordsman can be bought', buy.label),
    ok(st.cls === null, 'looking at it took nothing')
  ];
});

group('two stations of one kind keep a ladder each', async () => {
  const [a, b] = stand('altar', 'altar');
  flush();
  view('s1', 'brawler');
  for (let i = 0; i < 4; i++) buy(a);
  view('s2', 'sword');
  buy(b);
  const one = railsOf('s1'), two = railsOf('s2');
  const rungOf = (st, cls) => classLadder(st, cls).rung();
  return [
    ok(a.cls === 'brawler' && a.rung === 4, 'the first altar climbed the Brawler to 4', `${a.cls} ${a.rung}`),
    ok(b.cls === 'sword' && b.rung === 1, 'the second took the Swordsman', `${b.cls} ${b.rung}`),
    ok(rungOf(a, 'brawler') === 4 && rungOf(b, 'brawler') === 0, "the second altar's Brawler is at its foot",
       `${rungOf(a, 'brawler')} ${rungOf(b, 'brawler')}`),
    ok(one.buy.label === 'Buy Brawler 5' && two.buy.label === 'Buy Swordsman 2', 'each Buy climbs its own',
       `${one.buy.label} / ${two.buy.label}`),
    ok(JSON.stringify(rungBill('s1', 'brawler')) !== JSON.stringify(rungBill('s2', 'sword')),
       'and each is priced from its own rung', `${JSON.stringify(rungBill('s1', 'brawler'))} vs ${JSON.stringify(rungBill('s2', 'sword'))}`)
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

group('the panel is one line: the class, a rung, the move, the capstone', async () => {
  stand('spire');
  S.stationsBuilt = 2;
  hover('s1', 'mage', 4);
  const move = railsOf('s1').line;
  hover('s1', 'mage', 8);
  const cap = railsOf('s1').line;
  hover('s1', 'mage', 2);
  const rung = railsOf('s1').line;
  hover('s1', 'bard');
  const alone = railsOf('s1').line;
  hover('s1', null);
  return [
    ok(/^Widening: /.test(move), 'rung 4 names the move', move),
    ok(/^Burn through: /.test(cap), 'rung 8 the capstone', cap),
    ok(/^Mage 2: /.test(rung), 'another rung its number', rung),
    ok(/no one else to sing to/.test(alone), 'and the Bard, with nobody else fighting, says so', alone),
    ok([move, cap, rung, alone].every(l => !l.includes('\n') && l.length < 60), 'each one short line')
  ];
});
