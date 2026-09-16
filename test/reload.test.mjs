// What a refresh may not do.
//
// A reload is the one moment the whole yard is written down and read back, and
// anything the writing forgets is destroyed. It reads as the yard standing about
// -- the crew come back empty-handed with a floor they had already swept, so
// there is nothing to fetch until the rock gives up something new -- and the
// dust is gone as well as the minute.
//
// Loaded from a real save rather than a yard built by hand, because what makes
// this bite is a played yard's shape: fifteen carters keep the floor clear, so
// at any moment most of the dust in flight is in somebody's hands.

import { readFileSync } from 'node:fs';
import { group, ok, state, run, runUntil, yard } from './helpers.mjs';

const { stake, canStake, letGo, canLet, bank, canBank, pot } = await import('../src/casino.js');
const { dugShare } = await import('../src/quarry.js');
const { boulderAlive } = await import('../src/rock.js');
const { doseLive, doseLeftMs } = await import('../src/apothecary.js');

const player = () =>
  readFileSync(new URL('./fixtures/player-yard.json', import.meta.url), 'utf8');

const held = () => yard.S.workers.reduce((n, w) => n + (w.carry || 0), 0);
const hands = () => yard.S.workers.filter(w => w.carry > 0).length;

group('a refresh does not empty the crew\'s hands', async () => {
  localStorage.setItem('boulder-clicker/v4', player());
  yard.restore();
  // Long enough for the carters to be mid-errand, which for this yard is most
  // of the time: the floor is swept and the dust is in transit.
  run(25);

  const wasHeld = held(), wasHands = hands(), wasBanked = state().stored;
  window.__reload();                 // persist + restore, the two calls a page load makes
  const nowHeld = held(), nowHands = hands();

  // and it goes on working rather than standing about
  let dead = 0;
  for (let i = 0; i < 10; i++) { const a = state().stored; run(1); if (state().stored === a) dead++; }

  return [
    ok(wasHands > 0, 'somebody was carrying something to begin with',
       `${wasHands} pairs of hands, ${wasHeld} grains`),
    ok(nowHands === wasHands && nowHeld === wasHeld,
       'and they still are afterwards',
       `${wasHands}/${wasHeld} before, ${nowHands}/${nowHeld} after`),
    ok(state().stored >= wasBanked, 'nothing was banked twice over',
       `${wasBanked} -> ${state().stored}`),
    ok(dead <= 2, 'and the yard keeps banking through the reload',
       `${dead} of ten seconds with nothing banked`)
  ];
});

// And the other half of coming back: a body picks up where it was, rather than
// being handed the one goal a factory-fresh body gets. Everybody used to come
// back on `goal: 'to'` -- "walk to your station" -- which for a quarrier already
// standing on the floor of the cut meant walking to the head of the ladder and
// climbing back down a hole it was already in.
group('a refresh does not send the gang back down the ladder', async () => {
  localStorage.setItem('boulder-clicker/v4', player());
  yard.restore();
  const gang = () => yard.S.workers.filter(w => w.type === 'quarrier');
  const digging = () => gang().filter(w => w.goal === 'work').length;
  // Down there and digging, with most of the bench still to take out -- caught
  // early in a dig rather than at a fixed second: a fixed forty seconds landed
  // on the frame the gang climbed out for the refill, and a gang at the top of
  // its ladder finishes a bench in well under the six seconds watched below.
  run(10);
  runUntil(() => digging() === gang().length && dugShare() < 0.2, 120);
  run(1);
  const wasY = gang().map(w => Math.round(w.y));
  const wasDigging = digging();

  window.__reload();
  const stillDigging = digging();
  const nowY = gang().map(w => Math.round(w.y));

  // and it does not take them a walk to get going again
  let worst = 0;
  for (let i = 0; i < 6; i++) { run(1); worst = Math.max(worst, wasDigging - digging()); }

  return [
    ok(wasDigging > 0, 'the cut was being worked to begin with', `${wasDigging} at the face`),
    ok(stillDigging === wasDigging, 'and it still is the frame after a reload',
       `${wasDigging} before, ${stillDigging} after`),
    ok(nowY.every((y, i) => Math.abs(y - wasY[i]) <= 1), 'nobody was lifted out of the cut',
       `${wasY.join(',')} -> ${nowY.join(',')}`),
    ok(worst <= 1, 'and none of them downs tools to walk anywhere',
       `${worst} stopped digging at once`)
  ];
});

// --- and the three things a refresh used to take off you ----------------------

// A pot you have taken is money. `bank()` empties the table on the frame you
// press it and pays the winnings into the hole one flying grain at a time, so
// for the second and a half in between the whole of it lives in `S.paying` --
// and `S.paying` was the one field in that building nobody wrote down. A refresh
// during the arc came back on a cleared payout and an empty sky, and four
// thousand dust was simply gone.
group('a refresh in the middle of a payout does not eat the pot', async () => {
  const S = yard.S;
  window.__crew(2, 4);
  window.__casino(true);
  window.__tip(2000);
  run(1);
  S.chip = 2;
  // A hand pays at least half of what went down, so one is enough: the stake
  // into the hopper, let go, and the tray standing. The check is not about the
  // odds, only about what is in the tray being taken whole.
  if (canStake('dust')) stake('dust');
  runUntil(() => canLet(), 30);
  letGo();
  const spun = runUntil(() => canBank(), 30);
  const won = pot(), before = S.stored;
  bank();
  run(0.4);                                    // grains off the heap, most still in the air
  const owed = S.paying && S.paying.left, air = S.tableAir.length;

  window.__reload();
  const back = S.paying && S.paying.left;
  run(8);                                      // and let the sand finish its trip
  const paid = S.stored - before;

  return [
    ok(spun && won > 0, 'there was a pot to take', `${won}`),
    ok(air > 0 && owed < won, 'and the reload caught it in the air',
       `${air} grains flying, ${owed} of ${won} still on the table`),
    ok(back === won, 'the whole of it is still owed the moment the page comes back',
       `${won} banked, ${back} owed`),
    ok(paid >= won, 'and the hole is paid every last grain of it',
       `${won} taken, ${paid} landed`)
  ];
// One particular hand across more than five seconds, and a reload of its own
// in the middle: the harness's would put the pot back in the hopper.
}, { reload: false });

// The depth of the cut was written down and the stone left in it was not. So a
// save read back mid-dig came up with a part-dug floor and `quarryOwed` at
// nought -- and the one line that lays a fresh seam only fires on ground nobody
// has broken into, which a part-dug floor is not. Every remaining swing of that
// bench turned up nothing.
//
// The reload here is deliberately colder than `__reload`: `restore` never wrote
// this field at all, so a persist-and-restore in one process left the live
// number standing and the bug invisible. A page that has just loaded has a
// nought there, and that is what is put back before the save is read.
group('a refresh mid-dig does not empty the seam', async () => {
  const S = yard.S;
  window.__crew(0, 0, 3, 0);                   // quarriers, and the bench they work
  window.__levels({ benchLevel: 0, quarryPaceLevel: 10 });
  run(2);
  const going = runUntil(() => dugShare() > 0.2, 120);
  // What the ground gave up, counted where the game counts it: every body keeps
  // a tally of the stone it has brought out. The pile is the wrong place to
  // look -- a shard found on the last swing is still lying in the yard waiting
  // for a pair of hands when the bench is finished and the next seam is laid.
  const dugOut = () => S.workers.reduce((n, w) => n + (w.quarried || 0), 0);
  const owed = S.quarryOwed, had = dugOut(), dug = dugShare();

  S.dirty = true;
  window.__reload();
  S.quarryOwed = 0;                            // what a freshly loaded page has
  yard.restore();
  const back = S.quarryOwed;

  // Worked to the end of this bench and no further. `fillQuarry` lays a fresh
  // seam behind a finished dig, and a check that ran on past it would be paid by
  // the next bench and never notice this one paid nothing -- which is exactly
  // how the bug went unseen. So the run stops the moment the ground is laid
  // again.
  let found = 0;
  for (let i = 0; i < 1200; i++) {
    run(0.25);
    found = dugOut() - had;
    if (found >= owed || dugShare() < dug) break;
  }

  return [
    ok(going && owed > 0 && dug > 0.1, 'the bench was part dug with stone still in it',
       `${(dug * 100) | 0}% out, ${owed} shards still in`),
    ok(back === owed, 'and the ground still holds it after the page comes back',
       `${owed} owed, ${back} after`),
    ok(found >= owed, 'so the rest of the dig pays what it always paid',
       `${found} found of ${owed} owed`)
  ];
});

// Whether the rock still owes you its core was worked out again on the way back
// in -- `boulderAlive() || !(coreLoose || heldCore)` -- and that question only
// knows two of the three places a core can be. A core in a hauler's hands is
// neither lying on the ground nor on the cursor, so a save written with the rock
// dead and the core walking to the hole came back saying the rock still owed
// one, and `stepCore` dropped a second on the next frame.
//
// The save is built rather than played into, and it is worth saying why. The
// next rock is put up the moment the core is *clear*, and a core in somebody's
// hands counts as clear -- so in a running yard the rock is almost always back
// before a hauler has hold of one. Forty rock deaths on the player's own save
// never once produced this moment. What it is really about is what a save means:
// so a real save is taken at the moment the rock dies, and the one thing that
// cannot be played into -- the core being in a pair of hands rather than on the
// ground -- is moved across in the save itself. Both shapes are checked: the
// save that carries the flag, and the older save that has to be guessed at.
group('a refresh does not hand you a second core', async () => {
  const S = yard.S;
  const KEY = 'boulder-clicker/v4';
  const out = [];

  for (const old of [false, true]) {
    window.__seed(20250830);
    window.__crew(2, 6);
    window.__jump(5);                          // the first rock with a core in it
    run(2);
    window.__next();                           // the last of it goes, the core drops
    // A frame at a time: the next rock is in the air within a second of the
    // last (ROCK_GAP_MS), and a whole-second stride lands past it with the rock
    // alive again -- which is not the moment this save is about.
    for (let i = 0; i < 20 * 60 && !(S.coreItem && S.coreItem.rest); i++) run(1 / 60);
    S.dirty = true;
    window.__reload();                         // and that moment is written down

    const sv = JSON.parse(localStorage.getItem(KEY));
    sv.core = null;                            // the core is not on the ground...
    sv.coreLoose = false;
    sv.who.find(w => w.type === 'hauler').hasCore = true;   // ...it is being carried
    if (old) delete sv.coreBuried;             // a save from before the flag was written
    localStorage.setItem(KEY, JSON.stringify(sv));

    S.coreItem = null;                         // what a freshly loaded page has
    S.heldCore = false;
    yard.restore();

    const carried = S.workers.filter(w => w.hasCore).length;
    const buried = S.coreBuried, alive = boulderAlive();
    const was = S.cores;
    run(12);
    const cores = S.cores - was + S.workers.filter(w => w.hasCore).length + (S.coreItem ? 1 : 0);
    const what = old ? 'an old save' : 'a save';

    out.push(
      ok(carried === 1 && !alive, `${what} comes back with the rock dead and the core in hand`,
         `${carried} carrying, rock ${alive ? 'alive' : 'dead'}`),
      ok(!buried, `${what} does not say the rock still owes a core`, `coreBuried ${buried}`),
      ok(cores === 1, `${what} gives one core out of one rock`, `${cores} cores`));
  }
  return out;
});

// A tonic is a thing you paid crop and a reagent for, and it runs on a clock. A
// refresh used to drink it: the dose lived on the body and the body's record did
// not carry it, so everybody came back sober however much of the buff was left.
//
// The clock is the catch -- `until` is a moment, and the moment starts again
// when the page does -- so what is written down is how much is LEFT. Bought the
// player's way: the pot is set, a stirrer walks a dose out and deals it, and
// only then is the yard written down and read back.
group("a refresh does not drink the crew's tonic", async () => {
  window.__reset();
  window.__crew(0, 1, 0, 2);
  window.__grant({ cores: 3, dust: 8000, spores: 3000, shards: 300 });
  window.__buy('unlockfarm'); window.__finish();
  window.__buy('unlockapothecary'); window.__finish();
  window.__pot('stew');
  window.__assign('stirrers', 1);
  const dealt = runUntil(() => yard.S.workers.some(w => doseLive(w)), 200);
  const before = yard.S.workers.filter(w => doseLive(w));
  const wasOn = before.length;
  const leftBefore = before[0] ? doseLeftMs(before[0]) : 0;

  window.__reload();
  run(0.1);
  const after = yard.S.workers.filter(w => doseLive(w));

  return [
    ok(dealt && wasOn > 0, 'a body is under a tonic before the refresh', `${wasOn}`),
    ok(after.length === wasOn, 'and is still under it after', `${wasOn} -> ${after.length}`),
    ok(after[0] && after[0].doses.some(d => d.tonic === 'stew'),
       'wearing the same tonic',
       after[0] && after[0].doses.map(d => d.tonic).join(',')),
    // Not topped back up to full, and not run down to nothing: what was left is
    // what is left.
    ok(after[0] && Math.abs(doseLeftMs(after[0]) - leftBefore) < 2000,
       'with what was left of it still left',
       `${Math.round(leftBefore)}ms -> ${after[0] ? Math.round(doseLeftMs(after[0])) : 0}ms`)
  ];
});

// The quarry's yield ladder was on the by-hand save list with no hand behind
// it, so every rung bought came back nought on the next load and the player
// bought "ore yield" again after every refresh. Bought the way a player does,
// off the quarry's board, and read the way a fresh page does -- the field
// blanked before the save is read -- so a save that forgot it is a red line
// here rather than a bug report.
group('a refresh keeps the ore yield you bought', async () => {
  const S = yard.S;
  window.__reset();
  window.__crew(0, 0, 3, 0);
  window.__grant({ dust: 1e7, shards: 1e5, spores: 1e5 });
  run(1);
  const bought = window.__buy('seam'); window.__finish();
  run(1);
  const before = S.seamLevel;

  S.dirty = true;
  window.__reload();
  S.seamLevel = 0;                             // what a freshly loaded page has
  yard.restore();

  return [
    ok(bought && before > 0, 'a rung of ore yield was bought off the board', `${before}`),
    ok(S.seamLevel === before, 'and it is still bought after the refresh', `${before} -> ${S.seamLevel}`)
  ];
});
