// The books' three sheets: income, the sky and the crew (DESIGN.md, "the books
// grow three sheets"). Every figure on them is read off the yard, so each check
// compares the board against the yard it reads, not against a number worked
// out here.

import { group, ok, run, yard } from './helpers.mjs';
import { STATS_UPGRADES, STATS_SECTIONS } from '../src/stats.js';
import { bookTrend } from '../src/income.js';
import { refund } from '../src/pit.js';
import { airSides } from '../src/smog.js';
import { showPanel, hud } from '../src/board.js';

const row = key => STATS_UPGRADES.find(u => u.key === key);
const text = v => String(v).replace(/<[^>]+>/g, '').trim();

// --- income ---------------------------------------------------------------------
// A steady yard reads level, and one that has doubled reads up. The level half
// is the one that went wrong in the building: a relative change on eight ore a
// minute is a lump either side of the edge, and it flipped between two arrows.
group('a rate wears an arrow that says which way it is going', async () => {
  window.__reset();
  window.__crew(2, 2);
  run(150);
  const steady = bookTrend('dust');

  window.__crew(8, 8);
  run(60);
  const faster = bookTrend('dust');
  const said = text(row('ratedust').price());

  return [
    ok(steady === 0, 'a yard doing the same thing reads level', String(steady)),
    ok(faster > 0, 'and one that took on hands reads up', String(faster)),
    ok(/▲/.test(said), 'on the board, as the air board draws it', said)
  ];
});

// Lifetime income is the rate's sum over the whole game: a refund is kept out of
// it for the same reason it is kept out of the rate, and it survives a reload.
group('what the yard has earned is kept, and a refund is not in it', async () => {
  window.__reset();
  window.__fullSites();
  window.__crew(3, 3, 3, 0);
  run(90);
  const before = { ...yard.S.earnedTotal };
  refund('shard', 400, 0, 0);
  const afterRefund = yard.S.earnedTotal.shard || 0;
  run(30);
  const grew = yard.S.earnedTotal.shard || 0;
  window.__reload();

  return [
    ok((before.shard || 0) > 0, 'ore has been earned', String(before.shard)),
    ok(afterRefund === (before.shard || 0), 'a bill handed back is not added',
       `${before.shard} -> ${afterRefund}`),
    ok(grew > afterRefund, 'and the quarry goes on adding to it', `${afterRefund} -> ${grew}`),
    ok((yard.S.earnedTotal.shard || 0) === grew, 'and it comes back after a reload',
       `${grew} -> ${yard.S.earnedTotal.shard}`)
  ];
});

// --- the sky ----------------------------------------------------------------------
// The countdown, the two sides and the arrow are off the same minute, so they
// cannot tell three different stories.
group('the sky sheet agrees with itself', async () => {
  window.__reset();
  window.__fullSites();
  window.__crew(4, 4, 4, 0);
  window.__machine('jaw', { bought: true });
  yard.S.seenAir = true;
  run(90);
  const { up, down } = airSides();
  const due = text(row('skydue').price());
  const arrows = text(row('skytrend').price());
  const shares = STATS_UPGRADES.filter(u => /^sky(mach|dust|shard|spore)$/.test(u.key) && u.show())
    .map(u => +text(u.price()).replace('%', ''));
  const sum = shares.reduce((a, b) => a + b, 0);

  return [
    ok(up > down, 'the yard is putting up more than the house takes', `${up.toFixed(2)} vs ${down.toFixed(2)}`),
    ok(/▲/.test(arrows), 'so the arrow is up', arrows),
    ok(!/not at this rate/.test(due), 'and the sky has a time to full', due),
    ok(shares.length >= 1 && Math.abs(sum - 100) <= shares.length, 'and what dirtied it adds up to the sky',
       shares.join(' + '))
  ];
});

// --- the crew ---------------------------------------------------------------------
// Heads by job and heads by what they are doing are two ways of counting the
// same bodies, so each sums to the crew; the best hand is a body with the most.
group('the crew sheet counts every body once, each way', async () => {
  window.__reset();
  window.__fullSites();
  window.__crew(3, 3, 3, 2);
  run(60);
  const shown = STATS_UPGRADES.filter(u => u.show());
  const sum = prefix => shown.filter(u => u.key.startsWith(prefix)).reduce((n, u) => n + +text(u.price()), 0);
  const bodies = yard.S.workers.length;
  const top = Math.max(...yard.S.workers.map(w => w.mined || 0));
  const best = text(row('bestmined').price());
  const holder = yard.S.workers.find(w => (w.mined || 0) === top);

  return [
    ok(sum('crew') === bodies, 'the jobs add up to the crew', `${sum('crew')} of ${bodies}`),
    ok(sum('now') === bodies, 'and so do what they are doing', `${sum('now')} of ${bodies}`),
    ok(top > 0 && holder && best.startsWith(holder.name), 'the best on the rock is the one with the most off it',
       `${best} (top ${top})`)
  ];
});

// --- the board ----------------------------------------------------------------------
// Four headings, in the order the design gives them, drawn through the board.
group('the books draw four sheets', async () => {
  window.__reset();
  window.__fullSites();
  window.__crew(3, 3, 3, 0);
  yard.S.seenAir = true;
  run(60);
  showPanel('stats', true);
  hud();
  const rows = [...document.getElementById('statsshop').children];
  const heads = rows.filter(r => r.dataset.sect).map(r => r.dataset.sect);
  const dust = rows.find(r => r.dataset.key === 'ratedust');
  const note = dust ? dust.querySelector('.note') : null;
  showPanel(null, true);

  return [
    ok(heads.join(' | ') === STATS_SECTIONS.map(s => s.title).join(' | '), 'every sheet has its heading, in order',
       heads.join(' | ')),
    ok(note && /in the last minute/.test(note.textContent), 'and a rate says its sum under it',
       note ? note.textContent : 'no note')
  ];
});
