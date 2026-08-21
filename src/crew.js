// The crew: who they are, where they stand and what they do with their hands.
//
// Miners take the rock off in layers; workers carry dust to the pit. A new kind
// of worker is a new `type` and a new branch in updateWorkers -- and, when the
// quarry and the farm arrive, its own file.

import { P, WORKER, CORE_SIZE, CORE_CELL, HAUL_MS, DANCE_BEAT, HAUL_EMPTY } from './config.js';
import { S, floor, pit, bench } from './state.js';
import { at, put, colOf, bottomY } from './grid.js';
import { blocked, standOn, rockLeft, yardLeft } from './world.js';
import { boulderAlive, knockOff, rockTopY, cellPos, depthOf, refreshRockTops } from './rock.js';
import { spawnChip, spawnSpoil, bell } from './dust.js';
import { depthShade } from './grid.js';
import { bankDust } from './pit.js';
import { minerMs, haulCap, haulSpeed, scoopMs, minerBite } from './upgrades.js';
import { stepQuarrier, newQuarrier } from './quarry.js';
import { stepFarmhand, newFarmhand } from './farm.js';
import { now } from './clock.js';

// The crew take the hill off in layers. A miner does not stand in one spot and
// bore a shaft: it walks the top layer, striking the rock under its feet as it
// goes, so the crest comes off as a row and the next row is exposed underneath.
// It turns at the ends of the layer and turns before walking into a mate, so the
// gang works back and forth across the rock like a line of men on a bench.
const MINE_BAND = 3;      // cells below the peak still counted as the top layer
const ROAM_RANGE = 420;   // how far an idle worker will wander for no reason
const ROAM_PACE = 0.45;   // and how slowly it goes about it
const MINER_WALK = 0.5;   // pixels a frame along the row


export function findPeak() {
  S.peakRow = S.gh;
  for (let c = 0; c < S.gw; c++) {
    if (S.rockTops[c] >= 0 && S.rockTops[c] < S.peakRow) S.peakRow = S.rockTops[c];
  }
}

const inBand = c =>
  c >= 0 && c < S.gw && S.rockTops[c] >= 0 && S.rockTops[c] <= S.peakRow + MINE_BAND;

const colAtX = x => Math.max(0, Math.min(S.gw - 1, Math.round((x - rockLeft()) / P)));

// the nearest column that is still part of the working layer
export function nearestInBand(from) {
  for (let d = 0; d < S.gw; d++) {
    if (inBand(from - d)) return from - d;
    if (inBand(from + d)) return from + d;
  }
  return from;
}

// somebody already working the stretch this one is about to walk into
export function elbowed(w, x) {
  for (const o of S.workers) {
    if (o === w || o.type !== 'miner') continue;
    if ((o.x - w.x) * w.dir <= 0) continue;             // behind it: not in the way
    if (Math.abs(o.x - x) < WORKER * 1.2) return true;
  }
  return false;
}

export function syncWorkers() {
  const want = { miner: S.miners, hauler: S.haulers, quarrier: S.quarriers,
                 farmhand: S.farmhands };
  // Bodies are moved between jobs, not bought and sold, so one that is stood
  // down is usually one that has just been put on something else. Whatever it
  // was carrying goes on the ground at its feet: every pixel is worth one dust
  // wherever it came from, and losing a load to a reshuffle would break that.
  const keep = [], stood = [];
  for (const w of S.workers) (want[w.type]-- > 0 ? keep : stood).push(w);
  for (const w of stood) {
    for (let i = 0; i < (w.carry || 0); i++)
      spawnChip(w.x + WORKER / 2, S.groundY - WORKER, bell() * 0.5, -1.2, w.load?.[i] || 1);
    if (w.hasCore) {
      S.coreItem = { x: w.x, y: S.groundY - CORE_SIZE, vx: 0, vy: -1, rest: false };
      if (S.coreTaker === w) S.coreTaker = null;
    }
  }
  S.workers = keep;

  // count what is missing first: pushing while re-reading the length only ever
  // creates half of them
  const have = t => S.workers.filter(w => w.type === t).length;
  const needMiners = S.miners - have('miner');
  for (let i = 0; i < needMiners; i++) {
    S.workers.push({
      type: 'miner', next: 0, lunge: 0,
      x: rockLeft() + Math.random() * S.gw * P, y: S.cy,
      dir: Math.random() < 0.5 ? -1 : 1,
      ph: Math.random() * Math.PI * 2,        // where in its wobble it starts
      sp: 0.5 + Math.random() * 0.9,          // how fast it sways
      wob: 0.05 + Math.random() * 0.10,       // how far it drifts round its seat
      rw: 0.4 + Math.random() * 0.9           // how much it drifts in and out
    });
  }
  const needSpelunkers = S.quarriers - have('quarrier');
  for (let i = 0; i < needSpelunkers; i++) S.workers.push(newQuarrier());

  const needFarmhands = S.farmhands - have('farmhand');
  for (let i = 0; i < needFarmhands; i++) S.workers.push(newFarmhand());

  const needHaulers = S.haulers - have('hauler');
  for (let i = 0; i < needHaulers; i++) {
    S.workers.push({
      type: 'hauler', x: rockLeft() + Math.random() * (pit.x - rockLeft()), y: 0,
      carry: 0, next: 0, goal: 'seek', claim: -1, roamTo: null
    });
  }

  // number the miners off so they can be spaced evenly round the rock, and
  // stagger the new ones through the swing cycle so the crew never hits as one
  let slot = 0;
  for (const w of S.workers) {
    if (w.type !== 'miner') continue;
    w.slot = slot++;
    if (!w.next) w.next = now() + minerMs() * (w.slot / Math.max(1, S.miners));
  }
}

// The nearest column of dust that nobody else has set off for. One column, one
// worker: without that, every worker in the yard works out the same answer and
// the whole line turns round for a single grain behind them, then turns round
// again when the first of them picks it up.
function nearestDust(x, taken) {
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const from = Math.max(0, Math.min(last, colOf(floor, x)));
  for (let d = 0; d <= last; d++) {
    for (const c of [from - d, from + d]) {
      // Anything in a column is worth fetching, barred or not: a barred column
      // normally holds nothing, and when it does hold something -- a shard set
      // down at the beds -- somebody should still go out and get it.
      if (c < 0 || c > last || taken.has(c)) continue;
      if (at(floor, c, 0)) return c;
    }
  }
  return -1;
}

// Something that is not dust is worth crossing the yard for: it is one grain and
// it is worth a whole shard. Workers take the nearest column of anything, so
// without this a shard out at the beds waits for the whole yard to be swept
// clean first -- which, in a yard with a working crew, is never.
function nearestMark(w, taken) {
  let best = -1, bestD = Infinity;
  for (const m of S.floorMarks) {
    const c = colOf(floor, m.x);
    if (c < 0 || c >= floor.cols || taken.has(c) || !at(floor, c, 0)) continue;
    const d = Math.abs(m.x - w.x);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

// the columns already spoken for this frame
function claims() {
  const taken = new Set();
  for (const w of S.workers) if (w.type === 'hauler' && w.claim >= 0) taken.add(w.claim);
  return taken;
}

export function topGrain(c) {
  for (let r = floor.rows - 1; r >= 0; r--) if (at(floor, c, r)) return r;
  return -1;
}

export function updateWorkers(now, dt) {
  if (S.miners > 0) findPeak();
  const taken = claims();
  if (!S.coreItem || S.heldCore || !S.coreItem.rest) S.coreTaker = null;
  for (const w of S.workers) {
    if (w.type === 'miner') {
      // The rock is off. The crew take five on the bare ground: a hop on the
      // spot, each one a beat behind the last, so it reads as a line of them
      // rather than one animation played five times. It runs until the next
      // rock has come down, so nobody is caught mid-hop underneath it.
      if (now < S.danceUntil || S.rockFall > 0) {
        const beat = now / 1000 * DANCE_BEAT + w.slot * 0.5;
        const hop = Math.abs(Math.sin(beat * Math.PI));
        w.y = standOn(S.groundY) - Math.round(hop * 2) * P;
        w.x += Math.sin(beat * Math.PI * 0.5) * 0.4;
        w.lunge = 0;
        w.next = now + minerMs();              // nobody swings at nothing
        continue;
      }

      // The crew climb the hill and work it from the top down. Each one keeps a
      // stretch of the crest to itself, stands on whatever rock is left there and
      // sinks with it as the rock goes; when its stretch is bare it ambles along
      // to the nearest that is not.
      // The rock's pile is full. The crew stand where they are until it has
      // been carried away: dust with nowhere to go used to roll into the pit,
      // which banks it for nothing and leaves the haulers with no job.
      if (S.pileFull.rock) {
        w.y = standOn(rockTopY(colAtX(w.x + WORKER / 2)));
        w.lunge *= 0.82;
        w.next = now + minerMs();
        continue;
      }

      const t = now / 1000;

      // Walk the layer, turning at its ends and before walking into a mate. A
      // miner that finds itself off the layer -- because the rest of the gang
      // took the row down around it, or because it was hired onto a flank --
      // climbs back to it rather than standing there boring a shaft.
      const here = colAtX(w.x + WORKER / 2);
      if (!inBand(here)) {
        const back = nearestInBand(here);
        if (back !== here) w.dir = Math.sign(back - here);
        w.x += w.dir * MINER_WALK * 2.5;              // brisk, it has ground to make up
      } else {
        const step = w.x + w.dir * MINER_WALK;
        if (inBand(colAtX(step + WORKER / 2)) && !elbowed(w, step)) w.x = step;
        else w.dir = -w.dir;
      }

      const col = colAtX(w.x + WORKER / 2);
      const surf = rockTopY(col);
      w.lunge *= 0.82;
      // it bobs on its feet, and drops into the swing
      w.y = standOn(surf + Math.sin(t * w.sp + w.ph) * 1.2 + w.lunge * P * 1.4);

      if (boulderAlive() && now >= w.next && S.rockTops[col] >= 0) {
        knockOff(w.x + WORKER / 2, surf + P / 2, minerBite());     // bite what it stands on
        w.lunge = 1;
        w.next = now + minerMs() * (0.85 + Math.random() * 0.3);    // never quite in time
      }
      continue;
    }

    if (w.type === 'quarrier') { stepQuarrier(w, now); continue; }
    if (w.type === 'farmhand') { stepFarmhand(w, now, dt); continue; }

    // hauler: fetch a loose core if there is one, else scoop dust, then tip it
    // all over the ledge
    if ((w.goal === 'seek' || w.goal === 'idle') &&
        S.coreItem && S.coreItem.rest && !S.heldCore && !w.hasCore &&
        (!S.coreTaker || S.coreTaker === w)) {
      S.coreTaker = w;
      if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }   // the core comes first
      const target = S.coreItem.x + CORE_SIZE / 2 - WORKER / 2;
      const pace = haulSpeed() * HAUL_EMPTY;
      w.x += Math.sign(target - w.x) * Math.min(pace, Math.abs(target - w.x));
      if (Math.abs(target - w.x) < P * 2) {
        S.coreItem = null;
        S.coreTaker = null;
        w.hasCore = true;
        w.goal = 'dump';
        S.dirty = true;
      }
      continue;
    }

    if (w.x > pit.x - WORKER) w.x = pit.x - WORKER;
    w.y = standOn(S.groundY);

    if (w.goal === 'seek') {
      // It keeps the column it set off for until that column is bare. Picking
      // the nearest one afresh every frame is what made the crew swarm.
      if (w.claim >= 0 && !at(floor, w.claim, 0)) { taken.delete(w.claim); w.claim = -1; }
      if (w.claim < 0) {
        const c = nearestMark(w, taken);                  // a find first, if there is one
        const pick = c >= 0 ? c : nearestDust(w.x, taken);
        if (pick >= 0) { w.claim = pick; taken.add(pick); }
      }
      if (w.claim < 0) { w.goal = w.carry ? 'dump' : 'idle'; continue; }
      const c = w.claim;
      const target = floor.x + c * P;
      // hands free, so it moves; a load is what slows it down
      const pace = haulSpeed() * HAUL_EMPTY;
      w.x += Math.sign(target - w.x) * Math.min(pace, Math.abs(target - w.x));
      // It scoops what is under it, not what its left edge is exactly on. The
      // last two columns before the lip sit further right than a worker is
      // allowed to stand, so a worker that had to be standing on them stood at
      // the lip for ever with the dust a hand's width away.
      const under = target >= w.x - P && target <= w.x + WORKER;
      if (under && now >= w.next) {
        const r = topGrain(c);
        if (r >= 0) {
          (w.load ||= []).push(at(floor, c, r));
          put(floor, c, r, 0);
          w.carry++;
          w.next = now + scoopMs();
          S.dirty = true;
        }
      }
      if (w.carry >= haulCap()) {
        if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
        w.goal = 'dump';
      }
    } else if (w.goal === 'dump') {
      const target = pit.x - WORKER;                 // the lip, where they can stand
      w.x += Math.sign(target - w.x) * Math.min(haulSpeed(), Math.abs(target - w.x));
      if (Math.abs(target - w.x) < P) {
        if (w.hasCore) {
          S.coreItem = { x: pit.x + P * 2, y: S.groundY - CORE_SIZE, vx: 1.1, vy: -1.2, rest: false };
          w.hasCore = false;
          S.dirty = true;
        }
        // a proper toss off the lip, so it arcs out over the edge
        for (let i = 0; i < w.carry; i++) {
          spawnChip(w.x + WORKER / 2, S.groundY - WORKER - P,
                    2 + Math.random() * 1.4 + bell() * 0.3,
                    -(2.4 + Math.random() * 1.6),
                    w.load?.[i] || 1);
        }
        w.carry = 0;
        w.load = [];
        w.goal = 'seek';
        S.dirty = true;
      }
    } else {
      // Nothing to fetch and nothing to carry. Rather than standing to
      // attention they amble: a spot to stroll to, a stand about when they get
      // there, then another. A yard at rest should read as at rest, not as
      // switched off.
      if (nearestDust(w.x, taken) >= 0) { w.goal = 'seek'; continue; }
      if (w.roamTo === null || w.roamTo === undefined) {
        if (now >= (w.restUntil || 0)) {
          const lo = yardLeft(), hi = pit.x - WORKER;
          const near = w.x + (Math.random() - 0.5) * ROAM_RANGE;
          w.roamTo = Math.max(lo, Math.min(hi, near));
        }
      } else {
        const d = w.roamTo - w.x;
        w.x += Math.sign(d) * Math.min(haulSpeed() * ROAM_PACE, Math.abs(d));
        if (Math.abs(d) < 1) {
          w.roamTo = null;
          w.restUntil = now + 500 + Math.random() * 3000;
        }
      }
    }
  }
}

// a white circle with a black edge. It paints rather than clears, so it never
// eats the dust or the ground line behind it
