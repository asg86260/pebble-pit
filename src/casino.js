// The casino: the one place in the yard that makes nothing.
//
// Everywhere else, a thing you buy does something for ever after. This takes
// what you have and hands some of it back, and the whole of it is a decision you
// keep making rather than a purchase you make once.
//
// **One table, one pot, and putting a chip down is the spin.** You pick how much
// -- ten, a hundred, a thousand, or everything you have -- and which of dust,
// shards or spores it comes out of, and the wheel goes round: half of it doubles
// what you put down and half of it takes it. That is the whole of it, and it is one
// gesture, because putting something on a table and then pressing a second thing
// to find out what happened to it is a form rather than a bet.
//
// If it came off, the pot is sitting there and you decide again:
//
//   bank it       take it and walk out
//   spin again    half it doubles, half it is gone
//
// Even money, and that is the whole of the house's edge -- which sounds like no
// edge at all until you notice that a fair double-or-nothing taken for ever ends
// at nothing with certainty. No spin here is a bad bet and no run of them is a
// good one. When to stop is the game, it is the only decision in it, and nothing
// about the odds will make it for you. It is also the only thing in this yard
// you can actually lose.
//
// It is a building with a wheel in it: a block with one big round hole knocked
// out, which turns slowly while there is a pot sitting on the table and is spun
// in earnest while a ride is being settled. Everything you need to read is the
// wheel and two rows.

import { CASINO_ODDS, CASINO_SPIN_MS, CASINO_SLICES, CASINO_WIN_SLICES, CASINO_TURNS,
         CASINO_WHEEL, CASINO_KNOCK,
         CASINO_WIN_KNOCK, SPARK_LIFE, SPARK_GRAV, CASINO_CHIPS, CASINO_SAY_MS,
         P, SHADES, SHARD_CELL, SPORE_CELL, someFind } from './config.js';
import { S, pit, casino, table } from './state.js';
import { makePainter } from './painter.js';
import { addGrain, resizeGrid, settleSome, topRow, at, put, bottomY, surfaceY } from './grid.js';
import { shakeView } from './world.js';
import { now } from './clock.js';
import { spend, bankDust, takeCoreCells, pitRoom } from './pit.js';
import { buildShop } from './shop.js';

// What is on the table right now, and nothing about it moves on its own: a pot
// is what the last spin left, until the next one.
export const pot = () => S.pot ? S.pot.n : 0;

// A spin is being settled: the wheel is going and nothing you press does
// anything until it stops. It is a second and a bit of nothing you can do, which
// is exactly what a wheel is for.
export const spinning = () => now() < S.spinUntil;

// --- the chip -----------------------------------------------------------------
// How much goes down is chosen, not worked out for you. Four chips, and the last
// of them is not a number: `all` is everything you are holding of whatever you
// stake, and it is the one the whole place is really for.
export const purseOf = cur =>
  cur === 'shard' ? S.shards : cur === 'spore' ? S.spores : S.stored;

export const chip = () => CASINO_CHIPS[Math.max(0, Math.min(CASINO_CHIPS.length - 1, S.chip))];
export const chipName = () => (chip() === 'all' ? 'all in' : String(chip()));

// A chip you cannot cover is a chip you cannot put down, so the row goes pale
// rather than quietly staking less than it says.
export const stakeOf = cur => chip() === 'all' ? purseOf(cur) : chip();

export function pickChip(d) {
  S.chip = Math.max(0, Math.min(CASINO_CHIPS.length - 1, S.chip + d));
  S.dirty = true;
  buildShop();
}

// Everything in this game ends up in the hole and the hole has a limit, so a
// pot has to have somewhere to land before it can be taken. That is checked
// when you go to bank it, not when you put the stake down: a pot the hole will
// not take *stays on the table* until it will, the same as a core the hole
// refuses waits on the ground by the lip. Nothing here is ever lost to a rule
// about sand, and a full hole is a reason to dig rather than a hand you lose.
export const canBank = () => !!S.pot && !spinning() && !S.paying && pitRoom() >= pot();

export const canStake = cur =>
  S.casinoOpen && !S.pot && !spinning() && !S.paying && stakeOf(cur) > 0 && purseOf(cur) >= stakeOf(cur);

// The chip goes down and the wheel goes round -- one gesture, not two. Putting
// something on the table and then having to press a second thing to find out
// what happened to it is a form to fill in, not a bet.
export function stake(cur) {
  if (!canStake(cur)) return;
  const n = stakeOf(cur);
  if (cur === 'dust') spend(n);
  else if (cur === 'shard') { S.shards -= n; takeCoreCells(n, SHARD_CELL); }
  else if (cur === 'spore') { S.spores -= n; takeCoreCells(n, SPORE_CELL); }
  S.pot = { cur, stake: n, n };
  spin();
}

// --- taking it, or not --------------------------------------------------------

// Taking it is not a number moving from one counter to another. The pot is sand
// on the ground at the far end of the yard and the hole is at the other end, so
// what banking looks like is the whole of it going over: grain by grain, off the
// heap, up over the works in a long arc, and down into the hole where everything
// else in this game ends up.
//
// It is one for one. Every grain that leaves the heap is a grain you watch fly
// and a grain the hole counts when it lands -- nothing is added at this end and
// nothing arrives that did not set off.
export function bank() {
  if (!canBank()) return;
  S.paying = { cur: S.pot.cur, left: pot() };
  S.pot = null;
  S.hand = null;                                 // taken: there is nothing to report
  S.dirty = true;
  buildShop();
}

// One frame of it: grains lifted off the top of the heap and thrown across the
// yard. The rate is the same as everything else here -- however much there is,
// it is away in about a second and a half.
const FLIGHT_MS = 1700;

function payOutStep(dt) {
  const p = S.paying;
  let n = Math.min(p.left, Math.max(1, Math.ceil(p.left * (dt / TRICKLE_MS))));
  const find = potShade(p.cur);
  while (n-- > 0 && p.left > 0) {
    let x = potAt().x, y = S.groundY - P, v = find ? someFind(find) : 4;
    const c = topmostColumn();                   // off the heap if there is any left
    if (c >= 0) {
      const r = topRow(table, c);
      if (r >= 0) {
        v = at(table, c, r);
        x = table.x + c * P;
        y = bottomY(table) - (r + 1) * P;
        put(table, c, r, 0);
      }
    }
    p.left--;
    S.sparks.push({
      x, y, s: v, t: 0,
      // Not a ballistic lob: the hole is three thousand pixels away and the arc
      // that gets there under gravity is one that leaves the sky. This is a
      // thrown line with a hump in it, which is what a long throw looks like.
      arc: { x0: x, y0: y, x1: pit.x + Math.random() * Math.min(700, pit.w),
             y1: S.groundY - P * 2, k: 0, high: P * 30 + Math.random() * P * 30 }
    });
  }
  if (p.left < 1) { S.paying = null; S.dirty = true; }
}

// Put the whole of it back on. Same wheel, same even money, and the pot is twice
// what it was or it is nothing.
export const ride = () => { if (S.pot && !spinning()) spin(); };

// What it lands on is decided now and shown in a second: a wheel that decided
// when it stopped would be a wheel you could watch for a tell, and the spin is
// a beat rather than a simulation.
// Which slices are which. They are dealt out so the bare ones are spread round
// the wheel rather than sitting in one block: a wheel with a quarter of it blank
// in one piece is a wheel you can see the answer coming on.
export const sliceKeeps = i => (i * CASINO_WIN_SLICES) % CASINO_SLICES < CASINO_WIN_SLICES;

// The wheel does not free-run and then get told the answer. The answer is picked
// first and the wheel is *aimed* at it: six whole turns and then a slice of the
// right colour under the pointer. So what you are watching is the thing itself
// deciding, which is the only way a wheel is worth having.
function spin() {
  S.hand = null;                                 // the last one is old news now
  S.spinWon = Math.random() < CASINO_ODDS;

  // a slice of the colour it is going to land on, picked at random among them
  const want = [];
  for (let i = 0; i < CASINO_SLICES; i++) if (sliceKeeps(i) === S.spinWon) want.push(i);
  const slice = want[Math.floor(Math.random() * want.length)];
  const step = (Math.PI * 2) / CASINO_SLICES;
  // the pointer is at the top, so the wheel has to turn until that slice's
  // middle is under it
  const land = -(slice + 0.5) * step - Math.PI / 2;

  S.spinFrom = S.wheel;
  S.spinTo = S.spinFrom + CASINO_TURNS * Math.PI * 2 +
             ((land - S.spinFrom) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  S.spinAt = now();
  S.spinUntil = S.spinAt + CASINO_SPIN_MS;
  S.dirty = true;
  buildShop();
}

// Where the wheel is this frame. It comes off its mark quickly and drags itself
// down to a stop, which is the shape every wheel has and the reason a spin is
// worth watching: the last half-turn is the slow one, and by then you can read
// which way it is going to go.
function wheelAt(dt) {
  if (!spinning()) {
    if (S.spinUntil) return S.spinTo;            // exactly on its mark
    return S.wheel + (S.pot ? CASINO_WHEEL : 0) * (dt / 1000);
  }
  const k = Math.min(1, (now() - S.spinAt) / CASINO_SPIN_MS);
  const ease = 1 - Math.pow(1 - k, 3.4);         // out-cubic and a bit
  return S.spinFrom + (S.spinTo - S.spinFrom) * ease;
}

// --- the pot, standing on the ground ------------------------------------------
// What is on the table is a heap beside the building, and it is **the pot**: one
// grain, one of whatever was staked. Not a drawing of a heap sized to look about
// right -- a real bed of sand, settled by the same code the yard and the hole
// use, so a thousand on the table is a thousand grains lying there and doubling
// it is visibly twice the sand.
//
// It goes down beside the building and walks *left* past it as it fills, because
// that is where the empty ground is: `addGrain` already looks outward for the
// nearest column that will take one, and the casino's own footprint is barred,
// so a big enough pot flows round the building on its own.
//
// The bed holds what the ground holds and no more, which is the same rule the
// hole keeps -- a pile shows what you have, up to the brim.
export const potAt = () => ({
  x: Math.round((casino.x + casino.w + P * 6) / P) * P,
  y: Math.round(S.groundY / P) * P
});

// The ground the pot may not stand on: the building itself.
const underCasino = c => {
  const x = table.x + c * P;
  return x + P > casino.x && x < casino.x + casino.w;
};

// How high a heap on the table may stand. Sand here stands up steeply, so
// without a ceiling a pot poured on one spot goes up as a spire and off the top
// of the window instead of out along the ground -- which is the one thing about
// a pile you are meant to be able to read at a glance. Capped, it does what a
// heap against a wall does: it reaches its height and then walks sideways.
const TABLE_HIGH = 44;               // cells, well inside the sky you can see

export function wireTable() {
  if (!table.painter) table.painter = makePainter(table);
  table.onPut = table.painter.mark;
  table.blocked = underCasino;
  table.ceiling = () => TABLE_HIGH;
  table.repose = true;                 // a heap on the ground stands up
  resizeGrid(table);
}

// How much sand should be lying there: the pot, or as much of it as the ground
// will hold. The bed is wide but it is not endless, and a pot bigger than the
// far end of the yard can take is the one place here that is not one for one --
// so it is found out rather than guessed. The first grain the ground refuses
// sets the mark, and clearing the bed forgets it again.
export const tableWant = () => Math.min(pot(), table.capped ?? Infinity);

// --- the trickle --------------------------------------------------------------
// Sand does not arrive all at once. It comes down out of the sky and piles up,
// and the pile growing is the thing worth watching -- so the bed is walked
// towards what the pot says rather than set to it.
//
// The rate is worked out from how far there is to go, so ten grains trickle and
// twenty thousand pour, and either is issued over about a second and a half.
//
// **Every grain is seen.** There was a cap on how many could be in the air at
// once, with the rest put straight into the bed, and it was a lie of exactly the
// kind this game does not tell: the pile is the pot, so the pile arriving has to
// be the pot arriving. What is left is a backstop far above anything a real hand
// reaches, so a pot the size of the whole hole cannot make the frame into a
// slideshow -- and it is the one place here that is not one for one, which is
// why it is written down.
const TRICKLE_MS = 1500;
const IN_AIR = 24000;

// Grains already on their way down count as arrived for the purpose of deciding
// how many more to send. Without that the trickle keeps issuing sand for sand
// that is already in the air, and the heap ends up a handful over the pot.
const airborne = () => S.sparks.reduce((n, k) => n + (k.lands ? 1 : 0), 0);

function trickleIn(dt, cur) {
  const want = tableWant();
  const have = table.n + airborne();
  let n = Math.min(want - have, Math.max(1, Math.ceil((want - have) * (dt / TRICKLE_MS))));
  const find = potShade(cur);
  const at = potAt();
  while (n-- > 0) {
    const shade = find ? someFind(find) : 1 + Math.floor(Math.random() * SHADES.length);
    if (S.sparks.length < IN_AIR) {
      S.sparks.push({
        x: at.x + (Math.random() - 0.5) * P * 20,
        // Out of the sky, but out of the sky a little way up rather than out of
        // the top of the bed: the grid stands eighty cells tall, and a grain
        // starting up there spends two seconds falling before it is anything to
        // look at. This is high enough to read as coming down and near enough
        // that the heap grows while you are watching it.
        y: S.groundY - P * 30 - Math.random() * P * 14,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.9 + Math.random() * 0.8,
        t: 0, s: shade, lands: true
      });
    // and the ones that are not worth a falling square still go in across a
    // spread of ground rather than all down one column
    } else if (!addGrain(table, at.x + (Math.random() - 0.5) * P * 20, table.blocked, shade)) {
      table.capped = table.n;
      break;
    }
  }
}

// And going the other way: grains lifted off the top of the heap, one at a time,
// each of them fading out on its way up. A pot that vanished in a frame was a
// number being set to zero; this is it *leaving*.
function drainOut(dt) {
  const want = tableWant();
  let n = Math.min(table.n - want, Math.max(1, Math.ceil((table.n - want) * (dt / TRICKLE_MS))));
  while (n-- > 0) {
    const c = topmostColumn();
    if (c < 0) break;
    const r = topRow(table, c);
    if (r < 0) break;
    const v = at(table, c, r);
    put(table, c, r, 0);
    if (S.sparks.length < IN_AIR) S.sparks.push({
      x: table.x + c * P,
      y: bottomY(table) - (r + 1) * P,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(0.3 + Math.random() * 0.5),
      up: true, fade: true,            // it goes, and it goes by fading out
      t: 0, s: v
    });
  }
}

// The tallest column with anything in it, so a heap comes apart from the top
// rather than being eaten from one end. Where it starts looking walks, so the
// same side is not always the one that goes first.
let drainAt = 0;
function topmostColumn() {
  let best = -1, high = -1;
  for (let i = 0; i < table.cols; i++) {
    const c = (drainAt + i) % table.cols;
    const r = topRow(table, c);
    if (r > high) { high = r; best = c; }
  }
  drainAt = (drainAt + 7) % table.cols;
  return best;
}

export function stepTable(dt) {
  if (!S.casinoOpen || !table.grid) return;
  if (table.capped != null && table.n < table.capped) table.capped = null;   // room again
  if (S.paying) payOutStep(dt);
  else if (table.n + airborne() < tableWant()) trickleIn(dt, S.pot?.cur);
  else if (table.n > tableWant()) drainOut(dt);
  settleSome(table, 6000);
}

// The tone the heap is made of, which is the tone of whatever was staked.
export const potShade = cur =>
  cur === 'shard' ? SHARD_CELL : cur === 'spore' ? SPORE_CELL : 0;

// One frame of the grains in the air: they rise, they fall, they land in the
// bed or they fade out.
export function stepSparks(dt) {
  for (let i = S.sparks.length - 1; i >= 0; i--) {
    const k = S.sparks[i];
    if (!k.up) k.vy += SPARK_GRAV;
    k.x += k.vx;
    k.y += k.vy;
    k.t += dt / 1000;
    // and they are gone when they reach the ground rather than falling through
    // it: a chip is not dust, it lands on nothing and it is worth nothing, but
    // it is still a thing in a yard with a floor.
    // A grain on its way to the hole: along its arc, and into the pile when it
    // gets there. This is the one that is actually worth something.
    if (k.arc) {
      const a = k.arc;
      a.k = Math.min(1, a.k + dt / FLIGHT_MS);
      k.x = a.x0 + (a.x1 - a.x0) * a.k;
      k.y = a.y0 + (a.y1 - a.y0) * a.k - Math.sin(a.k * Math.PI) * a.high;
      if (a.k >= 1) {
        bankDust(a.x1, k.s);
        S.sparks.splice(i, 1);
      }
      continue;
    }

    // A grain coming down out of the sky is one of the pot arriving: it stops
    // being a thing in the air and becomes a grain in the bed, which is what
    // makes the heap grow as you watch rather than appear.
    if (k.lands) {
      const c = Math.max(0, Math.min(table.cols - 1, Math.round((k.x - table.x) / P)));
      if (k.y >= surfaceY(table, c)) {
        // the ground would not take it: that is as much as this bit of yard
        // holds, and the rest of the pot stays a number on the board
        if (!addGrain(table, k.x, table.blocked, k.s)) table.capped = table.n;
        S.sparks.splice(i, 1);
      }
      continue;
    }
    // A rising one goes until its time is up, because what it is doing is
    // leaving; a plain falling one is scenery and stops at the ground.
    if (k.t > SPARK_LIFE || (!k.up && k.y >= S.groundY - P)) S.sparks.splice(i, 1);
  }
}

// The wheel turns while there is a pot on the table and spins while a ride is
// being settled. It is the whole of the signal: the rows say what the numbers
// are and this says whether anything is happening.
export function stepCasino(dt) {
  if (!S.casinoOpen) return;
  stepSparks(dt);
  const fast = spinning();
  S.wheel = wheelAt(dt);
  if (!fast && S.spinUntil) {                    // it has just come to rest
    S.spinUntil = 0;
    const cur = S.pot?.cur;
    const was = S.pot?.n || 0;
    if (S.spinWon) S.pot = { ...S.pot, n: was * 2 };
    else S.pot = null;
    // the stop is felt as well as seen -- and a win is felt harder
    shakeView(S.spinWon ? CASINO_WIN_KNOCK : CASINO_KNOCK);
    // What happens to the sand is the bed's business now: it walks itself towards
    // whatever the pot says, raining in or lifting off. See `stepTable`.
    // and it says which way it went, for a few seconds, over the building --
    // a wheel that stopped and told you nothing is a wheel you had to have been
    // watching, and you are usually somewhere else in the yard.
    S.hand = { won: S.spinWon, n: S.spinWon ? pot() : 0, cur, at: now() };
    S.dirty = true;
    buildShop();
  }
  if (S.hand && now() - S.hand.at > CASINO_SAY_MS) { S.hand = null; S.dirty = true; }
}

// what the yard should be showing over the building, if anything
export const saying = () => S.hand ? (S.hand.won ? 'won' : 'lost') : null;

// --- the board ---------------------------------------------------------------
// Three rows to put something down and two to decide what happens to it, and
// never both sets at once: a table with a pot on it is not a table you can
// stake at.
//
// A stake row is priced like any other row on any other board -- a mark and a
// number -- because that is exactly what it is: this much, out of your hands,
// now. The two decisions are not priced at all, so they carry what they would
// pay instead, which is the number the decision is actually about.
const STAKES = [
  { key: 'stakedust', name: 'stake', cur: 'dust' },
  { key: 'stakeshard', name: 'stake', cur: 'shard' },
  { key: 'stakespore', name: 'stake', cur: 'spore' }
];

const seen = cur => cur === 'shard' ? S.seenShard : cur === 'spore' ? S.seenSpore : true;

export const CASINO_UPGRADES = [
  // How much goes down, on a dial rather than as four rows a currency. It is the
  // one row on this board that spends nothing, exactly like the roster's job
  // rows: a setting between two buttons, not a purchase.
  {
    key: 'chip',
    name: 'chips',
    dial: true,
    value: chipName,
    less: () => pickChip(-1),
    more: () => pickChip(1),
    lo: () => S.chip <= 0,
    hi: () => S.chip >= CASINO_CHIPS.length - 1,
    show: () => S.casinoOpen && !S.pot && !spinning() && !S.paying
  },
  // A stake is written like a price -- a mark and a number, this much out of
  // your hands, now -- but it is not a purchase and it does not go through the
  // buying machinery: `stake` takes what it takes, and the row is dead when it
  // could not.
  ...STAKES.map(t => ({
    key: t.key,
    name: t.name,
    price: () => `${MARKOF(t.cur)} ${stakeOf(t.cur)}`,
    cost: () => stakeOf(t.cur),
    currency: t.cur,
    dead: () => !canStake(t.cur),
    buy: () => stake(t.cur),
    // A row for a currency you have never seen is a row naming a thing you have
    // not met, which is the one rule every board in this game keeps.
    show: () => S.casinoOpen && !S.pot && !spinning() && !S.paying && seen(t.cur)
  })),
  {
    key: 'bank',
    name: 'bank it',
    price: () => `${MARKOF(S.pot?.cur)} ${pot()}`,
    cost: () => 0,
    // the wheel is going, or the hole would not take it: either way the pot
    // stays where it is
    dead: () => !canBank(),
    buy: bank,
    show: () => S.casinoOpen && !!S.pot
  },
  {
    key: 'ride',
    name: 'spin again',
    // What it is worth if it comes off, which is the number the decision is
    // about. The odds are not written anywhere: they are the same every time,
    // and a percentage on a row would turn a wheel into a spreadsheet.
    //
    price: () => `${MARKOF(S.pot?.cur)} ${pot() * 2}`,
    cost: () => 0,
    dead: spinning,
    buy: ride,
    show: () => S.casinoOpen && !!S.pot
  }
];

// the mark of whatever is on the table, written the way the boards write marks
const MARKOF = cur => `<i class="${cur || 'dust'}"></i>`;

export const CASINO_SECTIONS = [
  { title: 'the table', keys: ['chip', 'stakedust', 'stakeshard', 'stakespore'] },
  { title: 'the pot', keys: ['bank', 'ride'] }
];
