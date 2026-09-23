// The deep's boards: the scale is a coin, and the deep's ladders lead with it.
//
// Four things a player sees (docs/wave-serpent.md, Track BOARD): a punch rung
// pressed on the altar's board is paid in scales, lifted off the deep's floor
// rather than out of the hole; the ladder's second band adds the yard's dust
// on top of the scales; a door waits for the serpent's stage before it is
// offered; and the scales are on the counter's card and in the purse beside
// an open board once the yard has seen one.
//
// The setup is the snatch played (`__snatch`, then the yard's clock turned
// until it has) and scales laid on the bed (`__grant`, through the serpent's
// `__scales`); what the checks are about -- the rung, the door -- is pressed
// through `__buy`, as a player presses it.

import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { TIER_BAND, rungDust, DUST_PER_SCALE } from '../src/config.js';
import { countLines } from '../src/render/counter.js';
import { purseCoins } from '../src/board.js';

const S = yard.S;
const row = key => window.__rows().find(r => r.key === key);
const coin = (r, money) => (r.bill.find(([m]) => m === money) || [])[1] || 0;

// The snatch played, and a bed of scales to spend.
const down = (scales = 2000) => {
  window.__reset();
  window.__snatch();
  runUntil(() => S.snatched, 120);
  window.__grant({ scales });
  runUntil(() => S.scales >= scales, 30);
  run(0.5);
};

group('a punch rung is paid in scales, lifted off the deep\'s floor', async () => {
  window.__reset();
  run(0.5);
  const hidden = !row('punch').shown;
  down();
  const offered = row('punch');
  const scales = S.scales, dust = S.stored;
  const pressed = window.__buy('punch');
  const paid = scales - S.scales;
  const lifted = S.lifting.length > 0;
  const dustAfter = S.stored;
  window.__finish();
  run(0.5);
  return [
    ok(hidden, 'the altar sells nothing before the snatch'),
    ok(offered.shown, 'and offers the punch once it has played'),
    ok(coin(offered, 'scale') === rungDust('punch', 0) && coin(offered, 'dust') === 0,
       'the first rung asks scales and nothing else', JSON.stringify(offered.bill)),
    ok(pressed, 'the row can be pressed'),
    ok(paid === rungDust('punch', 0), 'the bed gives up exactly the bill', `${scales} -> ${S.scales}`),
    ok(lifted, 'and the scales paid are lifted off it, not counted away'),
    ok(dustAfter === dust, 'the hole is not touched', `${dust} -> ${dustAfter}`),
    ok(S.punchLevel === 1, 'the rung is climbed once its work lands', `punchLevel ${S.punchLevel}`)
  ];
});

group('the second band of a deep ladder adds the yard\'s dust to the scales', async () => {
  down();
  window.__grant({ dust: 1e6 });
  // The first band climbed the way a player climbs it.
  for (let i = 0; i < TIER_BAND; i++) { window.__buy('punch'); window.__finish(); run(0.2); }
  const r = row('punch');
  const scale = rungDust('punch', TIER_BAND);
  const scales = S.scales, dust = S.stored;
  const pressed = window.__buy('punch');
  return [
    ok(S.punchLevel >= TIER_BAND, 'the first band is climbed', `punchLevel ${S.punchLevel}`),
    ok(coin(r, 'scale') === scale, 'the second band still leads with scales', JSON.stringify(r.bill)),
    ok(coin(r, 'dust') === scale * DUST_PER_SCALE, 'and adds dust at the scale\'s rate', JSON.stringify(r.bill)),
    ok(!r.bill.some(([m]) => m === 'shard' || m === 'spark'), 'and nothing past it yet', JSON.stringify(r.bill)),
    ok(pressed && scales - S.scales === scale && dust - S.stored === scale * DUST_PER_SCALE,
       'pressing it takes both', `scales ${scales} -> ${S.scales}, dust ${dust} -> ${S.stored}`)
  ];
});

group('a door is offered on the stage before the one its weapon answers', async () => {
  down(400);
  window.__grant({ dust: 1e6 });
  const bare = row('unlockwell').shown;
  window.__serpent({ stage: 1 });
  run(0.5);
  const warded = row('unlockwell').shown;
  const font = row('unlockfont').shown;
  const pressed = window.__buy('unlockwell');
  window.__finish();
  run(0.5);
  return [
    ok(!bare, 'the well is not offered while the coil is bare'),
    ok(warded, 'and is offered once the wards are up'),
    ok(!font, 'the font waits on the well and the next stage'),
    ok(pressed && S.wellOpen, 'the well opens when its door is bought and built')
  ];
});

group('the scales are on the counter and in the purse', async () => {
  window.__reset();
  run(0.5);
  const before = countLines().some(l => l.cell === 'scale') || purseCoins().some(([m]) => m === 'scale');
  down(300);
  run(2);                                          // the counts run to their figure
  const line = countLines().find(l => l.cell === 'scale');
  const purse = purseCoins().find(([m]) => m === 'scale');
  return [
    ok(!before, 'no scale is shown before the yard has seen one'),
    ok(line && line.text === String(S.scales), 'the counter carries the scales', line ? line.text : 'no line'),
    ok(purse && purse[1] === S.scales, 'and so does the purse', purse ? String(purse[1]) : 'no coin')
  ];
});
