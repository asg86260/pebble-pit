// The tower's own two ladders. The wizards were the one trade with nothing to
// buy for them: everything on the ground can be made quicker or stronger, and
// the thing standing between you and every spark in the game could only be made
// faster by hiring another body and buying it a hat.

import { yard, group, ok, state, run, runUntil, openSites, buyBuilt } from './helpers.mjs';

group('the tower sells casting speed and heavier bolts', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0, 0, 0, 0, 2);           // two wizards, which opens the sky
  window.__grant({ sparks: 999, shards: 400, spores: 400, dust: 40000 });
  window.__tip(20000);
  run(3);

  const rows = () => window.__rows().filter(r => r.shown).map(r => r.key);
  const before = state();
  const offered = rows();

  // Both are rungs past the bench, so both are built rather than had: the two
  // wizards standing at the tower are what finishes them. See works.js.
  const fast = buyBuilt('wizspeed');
  const hard = buyBuilt('wizpower');
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

// The tower reaching into the yard rather than into its own tower. Spells are
// one-offs rather than rungs, because that is what a spell is: a ladder is
// something you grind, and "the machines run half again as fast" is worth more
// than five rungs of nine per cent.
group('the tower can enchant the rest of the yard', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 0, 0, 0, 1);
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__tip(30000);
  run(2);

  const offered = window.__rows().filter(r => r.shown).map(r => r.key);
  const beforeRate = state().machines.jaw.rate;
  const beforeSeam = state().seam;

  // An enchantment is laid rather than bought, and the wizards lay it -- so one
  // at a time, with the tower's own body working it through. See works.js.
  const drove = buyBuilt('spelldrive');
  const blessed = buyBuilt('spellluck');
  const after = state();

  const gone = window.__rows().filter(r => r.shown).map(r => r.key);
  window.__crew(0, 0);
  return [
    ok(offered.filter(k => k.startsWith('spell')).length >= 4,
       'four enchantments on the tower once red has been seen',
       offered.filter(k => k.startsWith('spell')).join(',')),
    ok(drove && blessed, 'and they can be laid on the yard'),
    ok(after.spells.includes('drive') && after.spells.includes('luck'),
       'the yard remembers which', after.spells.join(',')),
    ok(after.machines.jaw.rate > beforeRate * 1.4,
       'a quickened machine works half again as fast',
       `${beforeRate} -> ${after.machines.jaw.rate}`),
    ok(after.seam > beforeSeam,
       'and a blessed cut turns up more stone', `${beforeSeam} -> ${after.seam}`),
    ok(!gone.includes('spelldrive'),
       'and a spell already laid is not offered twice')
  ];
});
