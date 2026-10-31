// The build sign (src/buildsign.js): a signboard staked in an empty lot that
// buys the lot's first build, in every place that has one. It is its board's
// row out in the world, so each check holds it to the board: it stands
// exactly when the row is listed (the row's own `show` behind its one-way
// `once`, read through `revealed` in shop.js, and the board itself up), it
// goes while the build is in the works, it greys where the row greys. It
// wears the station's name and says nothing on a hover. Every buy here is the sign's own press, at the
// sign's middle, as a pointer makes it (`signPress`, the press input.js asks);
// the hooks only set up what a check is not about.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { SHACK_DUST, UNLOCK_SHOW } from '../src/config.js';
import { signs, signMid, signPress } from '../src/buildsign.js';
import { revealed } from '../src/shop.js';
import { UPGRADES, building, take } from '../src/upgrades.js';
import { afterRow } from '../src/after/rows.js';
import { boardOf } from '../src/boardrows.js';
import { built, raising } from '../src/after/levels.js';
import { station } from '../src/stations.js';
import { shopBoxOf } from '../src/roster.js';
import { footprints } from '../src/footprints.js';
import { msg } from '../src/lang.js';
import { AFTER_JOB } from '../src/jobs.js';

const S = yard.S;
const shackRow = () => UPGRADES.find(u => u.key === 'unlockshack');
const signOf = (key, place) => signs(place).find(s => s.key === key) || null;
// A press on a sign's middle, as the pointer makes it.
const pressSign = (key, place) => { const at = signMid(key, place); return !!at && signPress(at.x, at.y); };

const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
function up() {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 5e6, spores: 1e6, shards: 1e6 });
  run(1);
}

group('the shack\'s sign stands exactly when its row is on the bench: not before the reveal, from it on, kept past a spend', async () => {
  window.__reset();
  window.__crew(2);
  S.seenBench = true;
  const reveal = Math.ceil(SHACK_DUST * UNLOCK_SHOW);
  window.__give(reveal - 1);
  run(0.2);
  const before = { sign: !!signOf('shack', 'yard'), row: revealed(shackRow()) };
  window.__give(1);
  run(0.2);
  const at = { sign: !!signOf('shack', 'yard'), row: revealed(shackRow()) };
  take('dust', 20);
  run(0.2);
  const spent = { sign: !!signOf('shack', 'yard'), row: revealed(shackRow()), stored: S.stored };
  const s = signOf('shack', 'yard');
  // with the bench not yet standing, its rows are on no board
  S.seenBench = false;
  const benchless = !!signOf('shack', 'yard');
  return [
    ok(!before.sign && !before.row, `under ${UNLOCK_SHOW * 100}% of its price, neither the row nor the sign`, JSON.stringify(before)),
    ok(at.sign && at.row, 'at it, both', JSON.stringify(at)),
    ok(spent.sign && spent.row && spent.stored < reveal, 'and spent back under it, both stay', JSON.stringify(spent)),
    ok(s && s.state === 'short' && s.bill.every(c => c.short), 'short of its price, the sign says so coin by coin', JSON.stringify(s && s.bill)),
    ok(s && s.name === msg('station-shack.sign').toUpperCase() && s.name === 'SHACK', 'it wears the station\'s name', s && s.name),
    ok(!benchless, 'and no sign while the bench, its board, is not up')
  ];
});

group('pressed, the shack\'s sign pays once, hides while the hut goes up, and a builder walks out and raises it', async () => {
  window.__reset();
  window.__crew(3, 2);
  S.seenBench = true;
  window.__give(SHACK_DUST * 3);
  run(0.5);
  const stood = !!signOf('shack', 'yard');
  const had = S.stored;
  const pressed = pressSign('shack', 'yard');
  const paid = had - S.stored;
  const works = building(shackRow());
  const hidden = !signOf('shack', 'yard');
  const again = pressSign('shack', 'yard');
  const paidOnce = had - S.stored === paid;
  const walked = runUntil(() => S.workers.some(w => w.type === 'builder'), 60);
  const rose = runUntil(() => S.shackOpen, 180);
  run(1);
  return [
    ok(stood && pressed, 'the sign stands and takes the press'),
    ok(paid === SHACK_DUST && works, 'the press pays its price and starts the build', `paid ${paid}, building ${works}`),
    ok(hidden, 'the sign goes while it is in the works'),
    ok(!again && paidOnce, 'so a second press is nobody\'s and pays nothing', `again ${again}, paid ${had - S.stored}`),
    ok(walked, 'a builder walks out to it'),
    ok(rose && !signOf('shack', 'yard'), 'and the hut stands, with no sign left', `open ${S.shackOpen}`)
  ];
});

group('act 3: the saw mill\'s sign is its shack row; the workshop\'s greys with its row; each wears its station\'s name', async () => {
  up();
  window.__afterGrant({ rebel: 30 });
  run(0.2);
  const mill = afterRow('after-build-mill'), shop = afterRow('after-build-workshop');
  const listed = boardOf('after-shack').rows().filter(u => revealed(u)).map(u => u.key);
  const m = signOf('after-mill', 'after'), w = signOf('after-workshop', 'after');
  const rebel0 = S.after.rebel;
  const lockedPress = pressSign('after-workshop', 'after');
  const lockedPaid = S.after.rebel !== rebel0 || raising('workshop');
  // the mill short of rebel: greyed on that coin alone, not locked
  const short = m && m.state === 'short' && m.bill.find(c => c.coin === 'rebel').short && !m.bill.find(c => c.coin === 'dust').short;
  window.__afterGrant({ rebel: 100 });
  run(0.2);
  const ok2 = signOf('after-mill', 'after')?.state;
  return [
    ok(listed.includes(mill.key) && listed.includes(shop.key) && !!m && !!w, 'both rows are listed on the shack\'s board, and both lots wear a sign', listed.join(' ')),
    ok(w.state === 'locked' && shop.dead(), 'the workshop\'s sign greys while its row is dead', w.state),
    ok(m.name === 'SAW MILL' && w.name === 'WORKSHOP', 'each wears its station\'s name', `${m.name} / ${w.name}`),
    ok(lockedPress && !lockedPaid, 'a press on it is the sign\'s, and buys nothing', `rebel ${rebel0} -> ${S.after.rebel}`),
    ok(short, 'the saw mill\'s, short of rebel, greys that coin alone', JSON.stringify(m && m.bill)),
    ok(ok2 === 'ok', 'and with the rebel, it can be bought', String(ok2))
  ];
});

group('act 3: pressed, the saw mill\'s sign pays once, hides while it goes up, and the camp\'s builders raise it', async () => {
  up();
  window.__afterGrant({ rebel: 200 });
  run(0.2);
  const rebel0 = S.after.rebel;
  const pressed = pressSign('after-mill', 'after');
  const paid = rebel0 - S.after.rebel;
  const going = raising('mill');
  const hidden = !signOf('after-mill', 'after');
  const again = pressSign('after-mill', 'after');
  const paidOnce = rebel0 - S.after.rebel === paid;
  const walked = runUntil(() => (S.after.bodies || []).some(o => o.job === AFTER_JOB.BUILD), 120);
  const rose = runUntil(() => built('mill'), 480);    // the builders' walks at the art's scale: about 361 s
  run(0.5);
  const workshop = signOf('after-workshop', 'after');
  return [
    ok(pressed && paid === 40 && going, 'the press pays the saw mill\'s rebel and starts it going up', `paid ${paid}, raising ${going}`),
    ok(hidden, 'the sign goes while it is going up'),
    ok(!again && paidOnce, 'so a second press is nobody\'s and pays nothing'),
    ok(walked, 'a builder of the camp walks to it'),
    ok(rose && !signOf('after-mill', 'after'), 'the saw mill stands, with no sign left'),
    ok(workshop && workshop.state !== 'locked', 'and the workshop\'s sign is no longer greyed', workshop && workshop.state)
  ];
}, { reload: false });   // follows one raise across minutes: a save writes it as an order

group('act 3: a station not yet built has no UPGRADES button and no board; built, it has both', async () => {
  up();
  const closedOpen = station('after-workshop').open(), closedBtn = shopBoxOf('after-workshop');
  S.after.built.push('workshop');
  run(0.5);
  const builtOpen = station('after-workshop').open(), builtBtn = shopBoxOf('after-workshop');
  return [
    ok(!closedOpen && !closedBtn, 'closed: no button, and no board to open', JSON.stringify(closedBtn)),
    ok(builtOpen && !!builtBtn, 'built: its button and its board', JSON.stringify(builtBtn)),
    ok(!signOf('after-workshop', 'after'), 'and no sign')
  ];
});

group('the deep: a fang held, the next free slot wears a sign; pressed, the fang is spent and the station laid there', async () => {
  window.__reset();
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
  window.__deepCrew({ spare: 1 });
  window.__party({ stations: [{ kind: 'altar', cls: 'brawler', rung: 2 }], fangs: 1 });
  window.__view('deep');
  run(2);
  const s = signOf('s2', 'deep');
  const fangs = S.fangs, n = S.stations.length;
  const pressed = pressSign('s2', 'deep');
  run(0.2);
  return [
    ok(!!s && s.bill.length === 1 && s.bill[0].coin === 'fang' && s.state === 'ok' && s.name === 'STATION', 'a sign over the next slot, STATION over a fang', JSON.stringify(s && [s.name, s.bill])),
    ok(pressed && S.fangs === fangs - 1 && S.stations.length === n + 1, 'pressed, one fang spent and a station laid', `${fangs} -> ${S.fangs}, ${n} -> ${S.stations.length}`),
    ok(!signs('deep').length, 'and with no fang left, no sign')
  ];
});

// That nothing else touches a sign's ground is verify.js's overlap rule,
// watched on every frame of every group here; this holds where it stands.
group('a sign stands centered on its lot where that is clear, on the floor, its ground claimed as the lot\'s', async () => {
  window.__reset();
  window.__crew(2);
  S.seenBench = true;
  window.__give(SHACK_DUST);
  run(0.2);
  const mid = s => s.box.x + s.box.w / 2, lotMid = s => s.lot.x + s.lot.w / 2;
  const shack = signOf('shack', 'yard'), shackFoot = footprints('yard').find(o => o.id === 'shack');
  up();
  const mill = signs('after').find(s => s.id === 'mill'), millFoot = footprints('after').find(o => o.id === 'mill');
  const claims = (s, f) => !!f && f.rects.some(r => r.x === s.box.x && r.y === s.box.y && r.w === s.box.w);
  return [
    ok(!!shack && Math.abs(mid(shack) - lotMid(shack)) <= 3 && shack.box.y + shack.box.h === S.groundY,
       'the shack\'s sign is centered on its lot, its post\'s foot on the ground', JSON.stringify(shack && [shack.box, shack.lot])),
    ok(claims(shack, shackFoot), 'and its ground is the lot\'s'),
    ok(!!mill && mill.box.x >= mill.lot.x && mill.box.x + mill.box.w <= mill.lot.x + mill.lot.w, 'the saw mill\'s stands inside its drawing',
       JSON.stringify(mill && [mill.box, mill.lot])),
    ok(claims(mill, millFoot), 'and its ground is the saw mill\'s')
  ];
});
