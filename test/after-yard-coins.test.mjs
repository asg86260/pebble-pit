// Act 3's bills take the yard's coins too (DESIGN.md, "The yard pays too",
// the owner, 2026-10-18): every row up here is bought through `__buy` as a
// player buys it, the yard's coins come off the yard's own purse, and they
// fly -- up off the yard's pile to the thin patch in the cloud floor, then out
// of it as motes to the station bought. The setup a check is not about goes
// through the hooks: the dev travel up with the act's opening beats marked
// played, and coins granted (`__grant` the yard's, `__afterGrant` the act's).
import { group, ok, run, yard } from './helpers.mjs';
import { AFTER_BUILDS, AFTER_UPGRADES, AFTER_COIN_UNDER_S, AFTER_COIN_LIFE_S, AFTER_COIN_STAGGER_S,
         AFTER_COIN_MOTES } from '../src/config.js';
import { patchAt, afterTag, afterRow } from '../src/after/rows.js';
import { coinAt } from '../src/render/aftercoins.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const up = () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  run(1);
};
const billOf = (bill, coin) => (bill.find(([c]) => c === coin) || [, 0])[1];
const MILL = AFTER_BUILDS.mill.bill;

group('a shack station costs the yard\'s dust as well as rebel, and buying it takes both', async () => {
  up();
  window.__afterGrant({ rebel: billOf(MILL, 'rebel') });
  window.__grant({ dust: billOf(MILL, 'dust') * 3 });
  const dust0 = S.stored, rebel0 = S.after.rebel;
  const bought = window.__buy('after-build-mill');
  const dust1 = S.stored, rebel1 = S.after.rebel;
  window.__actsOn(null);
  return [
    ok(billOf(MILL, 'dust') > 0 && billOf(MILL, 'rebel') > 0, 'the saw mill\'s bill names rebel and dust', JSON.stringify(MILL)),
    ok(bought, 'bought through the shack\'s row'),
    ok(dust0 - dust1 === billOf(MILL, 'dust'), 'the yard\'s purse drops by the bill\'s dust', `${dust0} -> ${dust1}`),
    ok(rebel0 - rebel1 === billOf(MILL, 'rebel'), 'and the camp\'s rebel by its rebel', `${rebel0} -> ${rebel1}`)
  ];
});

group('short of a yard coin, the buy refuses and takes nothing', async () => {
  up();
  window.__afterGrant({ rebel: 1000 });
  window.__grant({ dust: billOf(MILL, 'dust') - 1 });
  const dust0 = S.stored, rebel0 = S.after.rebel;
  const tag = afterTag(afterRow('after-build-mill'));
  const bought = window.__buy('after-build-mill');
  window.__actsOn(null);
  return [
    ok(!bought, 'a dust short, the saw mill is not bought'),
    ok(S.stored === dust0 && S.after.rebel === rebel0, 'and neither purse moved', `${dust0} -> ${S.stored}, ${rebel0} -> ${S.after.rebel}`),
    ok(/class="short"><i class="dust">/.test(tag) && /class="have">rebel/.test(tag),
      'the card says which coin is short, the dust in the yard\'s mark', tag)
  ];
});

group('a spark-band upgrade needs a spark', async () => {
  up();
  const bill = AFTER_UPGRADES['after-tree'].bills[0];
  window.__afterGrant({ rebel: billOf(bill, 'rebel'), timber: billOf(bill, 'timber') });
  window.__grant({ dust: billOf(bill, 'dust'), spores: billOf(bill, 'spore'), shards: billOf(bill, 'shard') });
  const without = window.__buy('after-tree');
  window.__grant({ sparks: billOf(bill, 'spark') });
  const sparks0 = S.sparks;
  const withIt = window.__buy('after-tree');
  window.__actsOn(null);
  return [
    ok(billOf(bill, 'spark') > 0, 'bigger trees ask a spark', JSON.stringify(bill)),
    ok(!without, 'refused with every coin but the spark'),
    ok(withIt && sparks0 - S.sparks === billOf(bill, 'spark'), 'bought once the spark is there, the sparks taken', `${sparks0} -> ${S.sparks}`)
  ];
});

group('the yard\'s coins fly: up off the pile to the patch, then out of it to the station', async () => {
  up();
  window.__afterGrant({ rebel: 100 });
  window.__grant({ dust: 2000 });
  const paid0 = S.paid.length;
  window.__buy('after-build-mill');
  const patch = patchAt();
  const lifted = S.paid.slice(paid0).filter(m => m.tx === patch.x && m.ty === patch.y).length;
  const motes = S.after.coins.length;
  const at = () => S.after.coins.map(m => coinAt(m, S.after.t));
  const before = at().filter(Boolean).length;
  run(AFTER_COIN_UNDER_S + 0.3);
  const mid = at().filter(Boolean);
  const station = S.after.coins[0].tx;
  run(AFTER_COIN_LIFE_S + AFTER_COIN_MOTES * AFTER_COIN_STAGGER_S + 0.5);
  const landed = at().every(p => p === null);
  window.__actsOn(null);
  return [
    ok(lifted > 0, 'the yard\'s grains lift off its pile bound for the thin patch', `${lifted} grains`),
    ok(motes > 0 && motes <= AFTER_COIN_MOTES, 'and motes are stamped to come out of it', `${motes} motes`),
    ok(before === 0, 'none is out of the cloud on the frame of the purchase'),
    ok(mid.length > 0 && mid.every(p => p.y <= patch.y), 'a moment on, motes are up out of the patch', `${mid.length} out`),
    ok(Math.abs(station - (patch.x)) > 0, 'bound for the station, not the patch'),
    ok(landed, 'and every one has landed after its flight')
  ];
});

group('a reload mid-flight stands every mote back where it was', async () => {
  up();
  window.__afterGrant({ rebel: 100 });
  window.__grant({ dust: 2000 });
  window.__buy('after-build-mill');
  run(AFTER_COIN_UNDER_S + 0.5);
  yard.persist();
  const want = JSON.stringify(S.after.coins);
  const pos = S.after.coins.map(m => coinAt(m, S.after.t));
  window.__reload();
  const back = JSON.stringify(S.after.coins);
  const pos2 = S.after.coins.map(m => coinAt(m, S.after.t));
  const moved = pos.filter((p, i) => (p === null) !== (pos2[i] === null) || (p && Math.hypot(p.x - pos2[i].x, p.y - pos2[i].y) > 1));
  window.__actsOn(null);
  return [
    ok(pos.some(Boolean), 'motes are in the air when the save is written'),
    ok(back === want, 'the motes come back from the save', `${back.length} vs ${want.length}`),
    ok(moved.length === 0, 'each where it was', `${moved.length} moved`)
  ];
});
