// The rockhands get a building, and the rock's rows move into it.
//
// The gang was the one trade in the yard with no roof: their two ladders, the
// multiplier over their swing and their machine were all sold from the work
// bench, because the rock had no board of its own to hang. It has one now --
// see "The shack at the rock" in DESIGN.md -- and these are the four things
// that has to be true of it: the row is on the bench, pressing it builds a
// building, the rows land on its board and leave the bench's, and the helmets
// come off the middle of the rock.

import { group, ok, P, run, runUntil, state, yard, WORKER } from './helpers.mjs';
import { SECTIONS, UPGRADES } from '../src/upgrades.js';
import { shackRows, shackSections } from '../src/shack.js';
import { standRect, STATIONS } from '../src/board.js';
import { buildBoard } from '../src/shop.js';
import { kitX } from '../src/world.js';
import { JOB } from '../src/jobs.js';
import { rockSize, rockWidthAt } from '../src/rock.js';
import { ROCK_FLANK_CLEAR, SHACK_CLEAR, SHACK_SCOOT, RAM_CLEAR } from '../src/config.js';
import { RAM_REACH } from '../src/rock.js';
import { spriteW, RAM } from '../src/sprites.js';
import { SHACK_DUST } from '../src/config.js';
import { SHACK_GEAR } from '../src/shack.js';
import { workAt } from '../src/works.js';
import { barSpot } from '../src/render/bars.js';
import { TYPE } from '../src/jobs.js';
import { shack } from '../src/state.js';

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

  // The biggest boulder the game has, set rather than driven to: what the
  // rule answers is the subject here, and forty rocks of waiting is not. The
  // hut is given the seconds it takes to scoot out to its slot for it -- the
  // hut stands off the rock that is here, and moves as they grow (see
  // `shackSpot`, world.js) -- and the rock's cap is measured off the slot.
  S.boulderNo = 40;
  run(20);
  const widest = rockSize().w * P;
  const leftEdge = S.cx - widest / 2;
  const slotRight = S.placed.shack.x + S.placed.shack.w;
  const hutRight = shack.x + shack.w;

  window.__reset();
  return [
    ok(s.shackOpen === false, 'the ground is reserved before anything is bought'),
    ok(shackRight < S.cx, 'and the hut stands left of the rock',
       `${shackRight} vs ${S.cx}`),
    ok(s.benchX < s.shackX, 'with the bench out behind it',
       `bench ${s.benchX}, shack ${s.shackX}`),
    ok(leftEdge > slotRight,
       "the biggest rock still stops short of the hut's slot",
       `rock edge ${Math.round(leftEdge)}, slot ${slotRight}`),
    // The hut stands its own clearance off the biggest rock, short of the slot:
    // the slot's extra room is the ram's parking space, not the hut's.
    ok(leftEdge > hutRight && hutRight >= slotRight,
       'and the hut has scooted out to make room for it, no further than its slot',
       `rock edge ${Math.round(leftEdge)}, hut ${hutRight}, slot ${slotRight}`)
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

// --- and its rows are worked at the hut, by the gang ---------------------------
// The rows moved onto the shack's board and went on being `site: 'bench'`, so
// a pick bought at the hut was fitted at the bench by whoever was spare. It is
// the quarry's rule now: the work claims one rockhand, who walks to the shack
// and stands there while the bar fills, and the bar fills only then.
group('a rock row bought at the shack is worked at the shack, by a rockhand', async () => {
  window.__reset();
  window.__crew(3, 0);
  window.__shack();
  window.__give(50000);
  runUntil(() => S.workers.filter(w => w.type === TYPE.ROCK && w.goal !== 'to').length === 3, 90);

  const bought = window.__buy('rockhandspeed');
  const claimed = () => S.workers.filter(w => w.onBuild === 'shack');
  run(0.5);
  const nClaimed = claimed().length;
  const beforeArrive = workAt('shack')?.done ?? -1;

  const inShack = w => w.x + WORKER > shack.x && w.x < shack.x + shack.w;
  const arrived = runUntil(() => claimed().some(w => w.atShed && inShack(w)), 60);
  const atStart = workAt('shack')?.done ?? -1;
  run(4);
  const later = workAt('shack')?.done ?? atStart + 999;
  const working = S.workers.filter(w => w.type === TYPE.ROCK && !w.onBuild).length;
  const nowhereElse = !workAt('bench');

  const landed = runUntil(() => !workAt('shack'), 300);
  const released = runUntil(() => claimed().length === 0, 10);
  const level = S.rockhandSpeedLevel;

  return [
    ok(bought, 'the row is bought like a player buys it'),
    ok(nowhereElse, 'and nothing of it is at the bench'),
    ok(nClaimed === 1, 'exactly one rockhand is claimed', `${nClaimed}`),
    ok(beforeArrive === 0, 'the bar does not move before it is at the hut', `${beforeArrive}`),
    ok(arrived, 'the claimed body stands at the shack'),
    ok(later > atStart, 'the bar advances while it stands there', `${atStart} -> ${later}`),
    ok(working === 2, 'the other two go on at the rock', `${working}`),
    ok(landed && released, 'the work lands and the claim clears'),
    ok(level === 1, 'and the rung is bought', `${level}`)
  ];
});

// And the multiplier over the rung, the same way. It was `site: 'yard'` --
// every ladder was -- with no ground of its own, so `siteBox` guessed the
// middle of the rock and a spare builder went and stood in the boulder to fit
// it. A row on the shack's board is worked at the shack, by the gang. And the
// bar hangs over the hut while it is: the shack was not in works.js's box
// table, so `barSpot` had nowhere to put one.
group('the swing multiplier bought at the shack is worked there too, under a bar over the hut', async () => {
  window.__reset();
  window.__fullSites();
  window.__invest();
  window.__grant({ shards: 900, dust: 90000, spores: 900, cores: 9 });
  window.__crew(2, 0);
  runUntil(() => S.workers.filter(w => w.type === TYPE.ROCK && w.goal !== 'to').length === 2, 90);

  const bought = window.__buy('labswing');
  const w = workAt('shack');
  const spot = w && barSpot('shack', w);
  const overHut = !!spot && spot.x >= shack.x && spot.x <= shack.x + shack.w && spot.y < shack.y;
  const nowhereElse = !workAt('yard') && !workAt('bench');
  const claimed = () => S.workers.filter(o => o.onBuild === 'shack');
  const inShack = o => o.x + WORKER > shack.x && o.x < shack.x + shack.w;
  const arrived = runUntil(() => claimed().some(o => o.atShed && inShack(o)), 60);
  const landed = runUntil(() => !workAt('shack'), 400);
  const level = S.mult?.swing ?? 0;

  return [
    ok(bought, 'the row is bought like a player buys it'),
    ok(!!w && w.key === 'labswing', "and the work is the shack's", w ? w.key : 'no work'),
    ok(nowhereElse, "not the yard's or the bench's"),
    ok(overHut, 'its bar hangs over the hut', JSON.stringify({ spot, shack: { ...shack } })),
    ok(arrived, 'a rockhand stands at the shack to fit it'),
    ok(landed && level > 0, 'and it lands', `${level}`)
  ];
});

// --- the hut stands off THIS rock, and scoots over for the next -----------------
// Its slot in the walk is where it stands at the biggest rock there will ever
// be, which is what the rock's growth is capped against; the hut itself stands
// ROCK_FLANK_CLEAR off the rock that is here, and slides out toward its slot
// as each broader one comes down. Watched, not teleported: the positions
// sampled while it moves are between the two spots, and it never goes past
// the slot.
group('the shack stands off the rock that is here, and scoots out for the next', async () => {
  window.__reset();
  window.__crew(3, 0);
  window.__shack();
  window.__jump(1);
  run(1);
  const one = S.boulderNo, x1 = shack.x;
  const edge1 = S.cx - (rockWidthAt(one) / 2) * P;
  const off1 = edge1 - (x1 + shack.w);

  // A few rocks on: mined out and the next one down, the way it happens.
  const seen = [];
  for (let i = 0; i < 4; i++) {
    window.__next();
    for (let t = 0; t < 30; t++) { run(0.1); seen.push(shack.x); }
  }
  const later = S.boulderNo, xN = shack.x;
  const offN = S.cx - (rockWidthAt(later) / 2) * P - (xN + shack.w);
  const slot = S.placed.shack.x;
  // Gradual: no single tenth of a second moved it further than the scoot pace.
  const jumps = seen.slice(1).filter((x, i) => Math.abs(x - seen[i]) > SHACK_SCOOT * 0.1 + 0.01);
  const monotone = seen.every((x, i) => !i || x <= seen[i - 1]);
  const kit = kitX(JOB.ROCK);

  return [
    ok(later > one, 'rocks came and went', `${one} -> ${later}`),
    ok(off1 === SHACK_CLEAR, 'at rock one the hut stands the clearance off the rock',
       `${off1}px, clearance ${SHACK_CLEAR}`),
    ok(xN < x1, 'and has moved out by the time a broader rock is down', `${x1} -> ${xN}`),
    ok(offN === SHACK_CLEAR, 'to the same clearance off the new one', `${offN}px`),
    ok(!jumps.length, 'sliding, never jumping', jumps.slice(0, 3).join(', ')),
    ok(monotone, 'and only ever outward'),
    ok(xN >= slot, 'never past its slot in the walk', `${xN} vs slot ${slot}`),
    ok(kit < xN, "and the gang's kit stand went with it", `${kit} vs hut ${xN}`)
  ];
});

// --- the ram wants the ground between the hut and the rock ---------------------
// The ram parks off the face and keeps RAM_CLEAR behind it, and the slot the
// walk reserves is what it parks against at the biggest rock -- so the slot's
// clearance is the ram's parking space, held here against the ram's real
// width rather than trusted. And a hut standing six cells off the rock is a hut
// under the machine, so buying the ram scoots it back behind the parking space.
group('the hut stands behind the ram once there is one, and the slot always did', async () => {
  window.__reset();
  window.__crew(3, 0);
  window.__shack();
  window.__jump(1);
  run(1);
  const before = shack.x;
  window.__machine('ram', { bought: true, on: false });
  run(15);
  const after = shack.x;
  const edge = S.cx - (rockWidthAt(S.boulderNo) / 2) * P;
  const parked = edge - P * (RAM_REACH + spriteW(RAM));     // the ram's tail, at a fresh face
  return [
    ok(ROCK_FLANK_CLEAR >= RAM_CLEAR + P * spriteW(RAM),
       'the slot leaves the ram its parking space at the biggest rock',
       `${ROCK_FLANK_CLEAR}px against ${RAM_CLEAR + P * spriteW(RAM)}`),
    ok(after < before, 'buying the ram moves the hut out', `${before} -> ${after}`),
    ok(after + shack.w + RAM_CLEAR <= parked, 'clear of where the ram parks',
       `hut to ${after + shack.w}, ram from ${parked}`)
  ];
});
