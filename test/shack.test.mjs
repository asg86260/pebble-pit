// The rockhands get a building, and the rock's rows move into it.
//
// The gang was the one trade in the yard with no roof: their two ladders, the
// multiplier over their swing and their machine were all sold from the work
// bench, because the rock had no board of its own to hang. It has one now --
// see "The shack at the rock" in DESIGN.md -- and these are the four things
// that has to be true of it: the row is on the bench, pressing it builds a
// building, the rows land on its board and leave the bench's, and the helmets
// come off the middle of the rock.

import { group, ok, P, runUntil, state, yard } from './helpers.mjs';
import { SECTIONS, UPGRADES } from '../src/upgrades.js';
import { shackRows, shackSections } from '../src/shack.js';
import { standRect, STATIONS } from '../src/board.js';
import { buildBoard } from '../src/shop.js';
import { kitX } from '../src/world.js';
import { JOB } from '../src/jobs.js';
import { rockSize } from '../src/rock.js';
import { SHACK_DUST } from '../src/config.js';
import { SHACK_GEAR } from '../src/shack.js';

const keysOn = id => [...document.getElementById(id).children]
  .map(c => c.dataset.key).filter(Boolean);

const S = yard.S;

// --- bought the way a player buys it -------------------------------------------
// Through the bench row, with its price and its rules, and then built by
// somebody walking to the site. Nothing in this group sets `shackOpen`.
group('the shack is put up from the bench, and somebody walks out to build it', async () => {
  window.__reset();
  window.__crew(3, 2);                          // a gang to want a hut for
  window.__give(20000);
  buildBoard('bench');
  const offered = keysOn('shop');

  const pressed = window.__buy('unlockshack');
  const going = () => Object.values(state().works || {}).flat()
                            .some(w => w && w.key === 'unlockshack');
  const started = going();
  // Somebody has to turn up and swing at it: a work with nobody on it waits.
  const came = runUntil(() => (S.workers || []).some(w => w.type === 'builder'), 60);
  const built = runUntil(() => !going(), 120);
  const open = state().shackOpen;
  const stand = standRect('shack');             // read before the reset takes it away

  window.__reset();
  return [
    ok(offered.includes('unlockshack'), 'a yard with a gang is offered the shack',
       offered.join(',') || 'nothing'),
    ok(pressed, 'and the row can be pressed'),
    ok(started, 'which starts a work rather than standing a building up at once'),
    ok(came, 'a builder walks out to it'),
    ok(built && open, 'and the hut is standing when the work is done'),
    ok(!!stand, 'with a board to read at it'),
    ok(STATIONS.includes('shack'), 'and it is one of the yard\'s stations',
       STATIONS.join(','))
  ];
});

// --- offered when it is within reach, and not before -----------------------------
// The rule every door on the bench follows: a price you have no idea is coming
// is a price you cannot save for. It is the money that gates this one -- the
// yard starts with a pair of hands, so the crew clause is only ever false in a
// save that has none.
group('the shack is offered once its price is within reach', async () => {
  window.__reset();
  buildBoard('bench');
  const broke = keysOn('shop');

  window.__give(SHACK_DUST);
  buildBoard('bench');
  const flush = keysOn('shop');

  window.__reset();
  return [
    ok(!broke.includes('unlockshack'), 'an empty hole is not offered a hut',
       broke.join(',') || 'nothing'),
    ok(flush.includes('unlockshack'), 'and the row arrives with the dust for it',
       flush.join(','))
  ];
});

// --- whose board the rows are on -------------------------------------------------
group('the rock\'s rows are sold at the shack and not at the bench', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__give(200000);
  window.__grant({ shards: 200, spores: 200 });
  window.__shack(true);

  buildBoard('bench');
  const onBench = keysOn('shop');
  const benchNames = new Set(SECTIONS.flatMap(x => x.keys));
  buildBoard('shack');
  const onShack = keysOn('shackshop');
  const shackNames = new Set(shackSections().flatMap(x => x.keys));

  window.__reset();
  return [
    ok(SHACK_GEAR.every(k => !onBench.includes(k) && !benchNames.has(k)),
       'no row about the rock is on the bench, by name or on the sheet',
       onBench.join(',')),
    ok(onShack.includes('rockhandspeed'),
       'the gang\'s swing is on the shack\'s board', onShack.join(',')),
    ok(shackRows().every(u => shackNames.has(u.key)),
       'and every row it holds is named by its own section',
       shackRows().map(u => u.key).join(',')),
    ok(UPGRADES.some(u => u.key === 'unlockshack'),
       'while the row that puts it up stays on the bench, where it can be pressed'),
    ok(shackRows().every(u => UPGRADES.includes(u)),
       'the rows are the same objects the game prices and builds, not copies')
  ];
});

// --- bought at the shack, the player's way ---------------------------------------
// The point of the move is that the ladder is climbed standing at the rock, so
// the check climbs a rung of it through the shack's own row.
group('a rung of the gang\'s ladder is bought at the hut', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__give(200000);
  window.__grant({ shards: 200, spores: 200 });
  window.__shack(true);

  const was = S.rockhandSpeedLevel;
  buildBoard('shack');
  const pressed = window.__buy('rockhandspeed');
  window.__finish();                            // a rung past the bench is built too
  const now = S.rockhandSpeedLevel;

  window.__reset();
  return [
    ok(pressed, 'the row on the shack\'s board answers to a press'),
    ok(now === was + 1, 'and the gang swing faster for it', `${was} -> ${now}`)
  ];
});

// --- the helmets come off the rock ------------------------------------------------
group('the gang\'s helmets hang at the hut, not in the middle of the rock', async () => {
  window.__reset();
  window.__crew(3, 2);
  const before = kitX(JOB.ROCK);
  const rockAt = S.cx;

  window.__shack(true);
  const after = kitX(JOB.ROCK);
  const shackX = state().shackX;

  window.__reset();
  return [
    ok(before < rockAt, 'before the hut, the stand is off the rock\'s own flank',
       `${Math.round(before)} vs rock at ${Math.round(rockAt)}`),
    ok(after < before, 'and it moves out to the hut once there is one',
       `${Math.round(before)} -> ${Math.round(after)}`),
    ok(Math.abs(after - shackX) < 60, 'which is where the hut is standing',
       `stand ${Math.round(after)}, shack ${shackX}`)
  ];
});

// --- the yard made room, and the rock did not pay for it ---------------------------
// The shack stands where the bench used to and the bench moved out behind it.
// The rock is measured off whatever building is nearest it rather than off the
// bench by name, which is the whole reason that move is free -- so the biggest
// rock there is still stops short of the wall.
group('the walk moved out to make room, and the rock is the size it was', async () => {
  window.__reset();
  const s = state();
  const shackRight = s.shackX + s.shackW;

  // The biggest boulder the game has, measured rather than driven to: what the
  // rule answers is the subject here, and forty rocks of waiting is not.
  const was = S.boulderNo;
  S.boulderNo = 40;
  const widest = rockSize().w * P;
  S.boulderNo = was;
  const leftEdge = S.cx - widest / 2;

  window.__reset();
  return [
    ok(s.shackOpen === false, 'the ground is reserved before anything is bought'),
    ok(shackRight < S.cx, 'and the hut stands left of the rock',
       `${shackRight} vs ${S.cx}`),
    ok(s.benchX < s.shackX, 'with the bench out behind it',
       `bench ${s.benchX}, shack ${s.shackX}`),
    ok(leftEdge > shackRight,
       "the biggest rock still stops short of the hut's wall",
       `rock edge ${Math.round(leftEdge)}, hut ${shackRight}`)
  ];
});

// --- a save carries it -------------------------------------------------------------
group('a yard with the hut up and the ladder climbed survives a reload', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__give(200000);
  window.__grant({ shards: 200, spores: 200 });
  window.__shack(true);
  window.__buy('rockhandspeed');
  window.__finish();
  const was = { open: S.shackOpen, rung: S.rockhandSpeedLevel };

  window.__reload();
  const back = { open: S.shackOpen, rung: S.rockhandSpeedLevel };
  const stand = standRect('shack');

  window.__reset();
  return [
    ok(was.open && was.rung > 0, 'a yard with the hut up and a rung bought',
       JSON.stringify(was)),
    ok(back.open === was.open && back.rung === was.rung,
       'comes back with both', JSON.stringify(back)),
    ok(!!stand, 'and the hut standing to read them at')
  ];
});
