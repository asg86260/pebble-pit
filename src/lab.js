// The lab: where shards and spores and a body's time turn into pace.
//
// The bench sells you *more* -- another worker, another body on the rock. The
// lab sells you *faster*, across the whole operation at once, and it is the only
// place a multiplier lives.
//
// Nothing here is bought outright. Paying starts a piece of research; what
// finishes it is somebody standing in the lab doing the work, and an empty lab
// makes no progress at all however much you have paid. So the lab competes for
// the crew with the rock, the quarry and the beds, which is the one real
// question this game asks: who is doing what. Everything it sells is a rate: a pixel of rock is
// still worth exactly one dust wherever it came from, which is a rule the game
// keeps, so growth has to come from doing the same work sooner.

import { S, lab } from './state.js';
import { assign, idle } from './upgrades.js';
import { walkY } from './world.js';
import { now } from './clock.js';
import { P, WORKER, FARM_WALK, LAB_EFFORT, LAB_WORK, LAB_IDLE_MS,
         SMOKE_MS, SMOKE_LIFE, SMOKE_RISE } from './config.js';

// Each level is a quarter again on top. Four ladders, deliberately few: three
// currencies and a wall of percentages is where cozy turns into a spreadsheet.
export const STEP = 1.25;

// each multiplier stands on its own
export const mult = k =>
  Math.pow(STEP, S.mult[k] || 0);

// what a piece of research asks of the crew, in worker-seconds
export const workFor = key => Math.round(LAB_WORK * Math.pow(1.35, S.mult[FIELD[key]] || 0));

const FIELD = { labswing: 'swing', labhaul: 'haul', labcave: 'quarry', labtend: 'tend' };

// Start one. Only one at a time: a lab does one thing at a time.
//
// And it calls back whoever let themselves out. A body that walked out of an
// empty lab did so because there was nothing to do in it; the moment there is,
// the reason it left has gone. Making you walk back to the roster and put the
// same people back in is asking you to undo something the game did on its own.
//
// Only the ones the lab itself sent home, and only if they are still spare: a
// body you have since put on the rock stays on the rock.
export function begin(key) {
  if (S.research) return;
  S.research = { key, done: 0 };
  while (S.labLeft > 0 && idle() > 0) { assign('labbers', 1); S.labLeft--; }
  S.labLeft = 0;
  S.dirty = true;
}

// how far along it is, 0..1
export const progress = () =>
  S.research ? Math.min(1, S.research.done / workFor(S.research.key)) : 0;

// Nothing in the game takes a body off the lab, so a lab that has finished its
// research is a room of people standing about in it for good. They let
// themselves out: after LAB_IDLE_MS of nothing to work on, one walks out and
// goes back to carrying dust, and the next one waits its turn, so a lab empties
// as people drifting off rather than as a room emptying in a frame.
//
// The clock only runs on somebody who is actually inside. A body still crossing
// the yard to get there has not spent a moment doing nothing yet, and turning it
// round halfway is not a decision anybody watching would recognise.
//
// And it is remembered. Starting a new piece of research calls back exactly the
// bodies the lab let out -- see `begin`. It used not to, on the grounds that
// being staffed without asking is a surprise; but the lab emptying itself was
// the game's own tidying, and making you go and undo it before anything can
// happen is a chore rather than a decision.
function letIdleGo() {
  if (S.research || !S.workers.some(indoors)) { S.labIdleAt = 0; return; }
  if (!S.labIdleAt) { S.labIdleAt = now(); return; }
  if (now() - S.labIdleAt < LAB_IDLE_MS) return;
  S.labIdleAt = 0;
  S.labLeft++;                     // remembered, so starting something fetches it back
  assign('labbers', -1);
}

// One frame of it. Nothing happens without bodies in the lab -- that is the
// whole of the mechanic, and why the row says nothing is moving when it is not.
export function stepLab(dt) {
  letIdleGo();
  const on = inLab();
  if (!S.research || !on) return;
  S.research.done += on * LAB_EFFORT * (dt / 1000);
  if (S.research.done < workFor(S.research.key)) return;
  const key = S.research.key;
  S.mult[FIELD[key]]++;
  S.research = null;
  S.labDone = key;                 // a mark over the lab until somebody looks
  cough();                         // and one last plume off the chimney
  S.dirty = true;
}

// The chimney stops the moment the work is done, which is a signal made of
// nothing happening. So finishing gets a puff of its own: a plume already
// strung out up the sky, so it reads as the last of it rather than the start.
const DONE_PUFFS = 8;
function cough() {
  for (let i = 0; i < DONE_PUFFS; i++) S.smoke.push({
    x: lab.x + lab.w * 0.28 + (Math.random() - 0.5) * P * 2,
    y: lab.y - i * P,
    drift: (Math.random() - 0.5) * 0.35,
    t: i * SMOKE_LIFE / (DONE_PUFFS * 1.6)
  });
}

// what finished, in the words the row used
export const doneName = () => {
  const u = LAB_UPGRADES.find(x => x.key === S.labDone);
  return u ? `${u.name} done` : 'research done';
};

// and reading it is what clears the mark
export function markLabSeen() {
  if (!S.labDone) return;
  S.labDone = null;
  S.dirty = true;
}

// A body in the lab walks to the door and goes in. There is nothing to watch
// after that, on purpose: what a lab looks like from outside is a chimney.
export function newLabber() {
  return {
    type: 'labber', goal: 'to',
    x: lab.x, y: 0
  };
}

// the door, and who is through it
export const labDoor = () => lab.x + lab.w * 0.62;
export const indoors = w => w.type === 'labber' && w.goal === 'in';

// How many are actually in there working. It is not `S.labbers`: that counts
// everybody the lab has been given, and one of them may still be halfway across
// the yard on its way over. Nobody does the work until they are through the door.
export const inLab = () => S.workers.filter(indoors).length;

// A puff off the chimney, and only when there is someone in there working on
// something. The chimney is the whole of the signal, because the crew are inside
// where you cannot see them.
export function stepSmoke(now, dt) {
  const on = inLab();
  if (S.research && on && now >= S.smokeAt) {
    S.smoke.push({
      x: lab.x + lab.w * 0.28 + (Math.random() - 0.5) * P,
      y: lab.y,
      drift: (Math.random() - 0.5) * 0.25,
      t: 0
    });
    S.smokeAt = now + SMOKE_MS / Math.min(4, on);
  }
  for (let i = S.smoke.length - 1; i >= 0; i--) {
    const p = S.smoke[i];
    p.t += dt / 1000;
    p.y -= SMOKE_RISE;
    p.x += p.drift;
    if (p.t > SMOKE_LIFE) S.smoke.splice(i, 1);
  }
}

export function stepLabber(w) {
  if (w.goal === 'in') return;                 // through the door, out of sight

  w.y = walkY(w.x + WORKER / 2);
  const d = labDoor() - WORKER / 2 - w.x;
  if (Math.abs(d) < 1) { w.goal = 'in'; return; }
  w.x += Math.sign(d) * Math.min(FARM_WALK, Math.abs(d));
}

export const LAB_UPGRADES = [
  // Who is standing in it, on the board that belongs to it. The bench can move
  // bodies about too, but the lab is where you are when you start a piece of
  // research, and walking back to the bench to staff it is a walk for nothing.
  {
    key: 'labcrew',
    name: 'in the lab',
    job: 'labbers',
    count: () => S.labbers,
    spare: () => idle(),
    less: () => assign('labbers', -1),
    more: () => assign('labbers', 1),
    show: () => true
  },
  {
    key: 'labswing',
    name: 'swing speed',
    from: () => `x${mult('swing').toFixed(2)}`,
    to: () => `x${(mult('swing') * STEP).toFixed(2)}`,
    cost: () => Math.round(3 * Math.pow(1.9, S.mult.swing)),
    currency: 'shard',
    buy: () => begin('labswing'),
    show: () => true
  },
  {
    key: 'labhaul',
    name: 'carry speed',
    from: () => `x${mult('haul').toFixed(2)}`,
    to: () => `x${(mult('haul') * STEP).toFixed(2)}`,
    cost: () => Math.round(4 * Math.pow(1.9, S.mult.haul)),
    currency: 'shard',
    buy: () => begin('labhaul'),
    show: () => true
  },
  {
    key: 'labcave',
    name: 'quarry pace',
    from: () => `x${mult('quarry').toFixed(2)}`,
    to: () => `x${(mult('quarry') * STEP).toFixed(2)}`,
    cost: () => Math.round(3 * Math.pow(1.9, S.mult.quarry)),
    currency: 'spore',
    buy: () => begin('labcave'),
    show: () => true
  },
  {
    key: 'labtend',
    name: 'bed pace',
    from: () => `x${mult('tend').toFixed(2)}`,
    to: () => `x${(mult('tend') * STEP).toFixed(2)}`,
    cost: () => Math.round(4 * Math.pow(1.9, S.mult.tend)),
    currency: 'spore',
    buy: () => begin('labtend'),
    show: () => true
  }

];

export const LAB_SECTIONS = [
  { title: 'the crew', keys: ['labcrew'] },
  { title: 'the work', keys: ['labswing', 'labhaul'] },
  { title: 'the ground', keys: ['labcave', 'labtend'] }
];

// --- the books --------------------------------------------------------------
// A rate nobody can see is a rate nobody can weigh a purchase against. These are
// smoothed, because a raw per-second count of something that arrives in lumps
// reads as noise.

// What the books watch. All of these only ever go up: a rate is what the
// operation *made*, and reading it off the balance meant a big purchase showed
// as forty thousand dust a minute of negative production.
const WATCH = ['banked', 'shards', 'spores', 'cores'];
const EASE = 0.25;                         // how fast the reading follows reality

export const rates = { banked: 0, shards: 0, spores: 0, cores: 0 };
let last = null, lastAt = 0;

// after a reset the books are meaningless: a counter going to zero is not a
// negative rate
export function resetRates() {
  last = null;
  for (const k of WATCH) rates[k] = 0;
}

export function sampleRates(now) {
  if (!last) { last = snapshot(); lastAt = now; return; }
  const dt = now - lastAt;
  if (dt < 500) return;                    // often enough to feel live, rarely enough to be steady

  const nowVals = snapshot();
  for (const k of WATCH) {
    const perMin = (nowVals[k] - last[k]) * 60000 / dt;
    rates[k] += (perMin - rates[k]) * EASE;
    if (Math.abs(rates[k]) < 0.001) rates[k] = 0;
  }
  last = nowVals;
  lastAt = now;
}

const snapshot = () => ({ banked: S.banked, shards: S.shards, spores: S.spores, cores: S.cores });


