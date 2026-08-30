// The tower's own two ladders. The wizards were the one trade with nothing to
// buy for them: everything on the ground can be made quicker or stronger, and
// the thing standing between you and every spark in the game could only be made
// faster by hiring another body and buying it a hat.

import { yard, group, ok, state, run, runUntil, openSites } from './helpers.mjs';

group('the tower sells casting speed and heavier bolts', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0, 0, 0, 0, 2);           // two wizards, which opens the sky
  window.__grant({ sparks: 999, shards: 400, spores: 400 });
  window.__tip(20000);
  run(3);

  const rows = () => window.__rows().filter(r => r.shown).map(r => r.key);
  const before = state();
  const offered = rows();

  const fast = window.__buy('wizspeed');
  const hard = window.__buy('wizpower');
  const after = state();

  window.__crew(0, 0);
  return [
    ok(offered.includes('wizspeed') && offered.includes('wizpower'),
       'both rows are on the tower once red has been seen',
       offered.filter(k => k.startsWith('wiz')).join(',')),
    ok(fast && hard, 'and both can be bought'),
    ok(after.wizSpeed === 1 && after.wizPower === 1,
       'each one climbs its own rung',
       `speed ${after.wizSpeed}, power ${after.wizPower}`),
    ok(after.wizBite === 2, 'and a heavier bolt takes two cells of the star',
       `${before.wizBite} -> ${after.wizBite}`),
    ok(after.wizMs < before.wizMs, 'and a quicker one goes more often',
       `${before.wizMs}ms -> ${after.wizMs}ms`)
  ];
});

// A star comes apart quicker with the ladders bought than without them, measured
// rather than asserted.
group('a bought-up tower takes a star apart quicker', async () => {
  const strip = (speed, power) => {
    window.__reset();
    openSites();
    window.__crew(0, 0, 0, 0, 0, 2);
    window.__levels({ wizSpeedLevel: speed, wizPowerLevel: power });
    window.__clearFloor();
    run(6);
    const before = state().meteor;
    for (let i = 0; i < 40; i++) { run(0.5); window.__clearFloor(); }
    return before - state().meteor;
  };
  const bare = strip(0, 0);
  const kitted = strip(3, 3);
  window.__crew(0, 0);
  return [
    ok(bare > 0, 'two wizards take a star apart', `${bare} cells`),
    ok(kitted > bare, 'and a bought-up tower takes it apart faster',
       `${bare} -> ${kitted} cells`)
  ];
});
