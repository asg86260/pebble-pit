// The crew: who they are, where they stand and what they do with their hands.
//
// Miners take the rock off in layers; workers carry dust to the pit. A new kind
// of worker is a new `type` and a new branch in updateWorkers -- and, when the
// cave and the farm arrive, its own file.

import { P, WORKER, CORE_SIZE, CORE_CELL, HAUL_MS } from './config.js';
import { S, floor, pit, bench } from './state.js';
import { at, put, colOf, bottomY } from './grid.js';
import { blocked, standOn, rockLeft } from './world.js';
import { boulderAlive, knockOff, rockTopY, cellPos, depthOf, refreshRockTops } from './rock.js';
import { spawnChip, spawnSpoil, bell } from './dust.js';
import { depthShade } from './grid.js';
import { bankDust } from './pit.js';
import { minerMs, haulCap, haulSpeed, scoopMs } from './upgrades.js';
import { stepSpelunker, newSpelunker } from './cave.js';
import { stepFarmhand, newFarmhand } from './farm.js';

// The crew take the hill off in layers. A miner does not stand in one spot and
// bore a shaft: it walks the top layer, striking the rock under its feet as it
// goes, so the crest comes off as a row and the next row is exposed underneath.
// It turns at the ends of the layer and turns before walking into a mate, so the
// gang works back and forth across the rock like a line of men on a bench.
const MINE_BAND = 3;      // cells below the peak still counted as the top layer
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
  const want = { miner: S.miners, hauler: S.haulers, spelunker: S.spelunkers,
                 farmhand: S.farmhands };
  S.workers = S.workers.filter(w => want[w.type]-- > 0);       // drop any extras

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
  const needSpelunkers = S.spelunkers - have('spelunker');
  for (let i = 0; i < needSpelunkers; i++) S.workers.push(newSpelunker());

  const needFarmhands = S.farmhands - have('farmhand');
  for (let i = 0; i < needFarmhands; i++) S.workers.push(newFarmhand());

  const needHaulers = S.haulers - have('hauler');
  for (let i = 0; i < needHaulers; i++) {
    S.workers.push({
      type: 'hauler', x: rockLeft() + Math.random() * (pit.x - rockLeft()), y: 0,
      carry: 0, next: 0, goal: 'seek'
    });
  }

  // number the miners off so they can be spaced evenly round the rock, and
  // stagger the new ones through the swing cycle so the crew never hits as one
  let slot = 0;
  for (const w of S.workers) {
    if (w.type !== 'miner') continue;
    w.slot = slot++;
    if (!w.next) w.next = performance.now() + minerMs() * (w.slot / Math.max(1, S.miners));
  }
}

// somewhere worth drilling: sample a few cells and take the thickest rock
function nearestDust(x) {
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const from = Math.max(0, Math.min(last, colOf(floor, x)));
  for (let d = 0; d <= last; d++) {
    for (const c of [from - d, from + d]) {
      if (c < 0 || c > last || blocked(c)) continue;
      if (at(floor, c, 0)) return c;
    }
  }
  return -1;
}

export function topGrain(c) {
  for (let r = floor.rows - 1; r >= 0; r--) if (at(floor, c, r)) return r;
  return -1;
}

export function updateWorkers(now, dt) {
  if (S.miners > 0) findPeak();
  if (!S.coreItem || S.heldCore || !S.coreItem.rest) S.coreTaker = null;
  for (const w of S.workers) {
    if (w.type === 'miner') {
      // The crew climb the hill and work it from the top down. Each one keeps a
      // stretch of the crest to itself, stands on whatever rock is left there and
      // sinks with it as the rock goes; when its stretch is bare it ambles along
      // to the nearest that is not.
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
        knockOff(w.x + WORKER / 2, surf + P / 2);                   // bite what it stands on
        w.lunge = 1;
        w.next = now + minerMs() * (0.85 + Math.random() * 0.3);    // never quite in time
      }
      continue;
    }

    if (w.type === 'spelunker') { stepSpelunker(w, now); continue; }
    if (w.type === 'farmhand') { stepFarmhand(w, now, dt); continue; }

    // hauler: fetch a loose core if there is one, else scoop dust, then tip it
    // all over the ledge
    if ((w.goal === 'seek' || w.goal === 'idle') &&
        S.coreItem && S.coreItem.rest && !S.heldCore && !w.hasCore &&
        (!S.coreTaker || S.coreTaker === w)) {
      S.coreTaker = w;
      const target = S.coreItem.x + CORE_SIZE / 2 - WORKER / 2;
      w.x += Math.sign(target - w.x) * Math.min(haulSpeed(), Math.abs(target - w.x));
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
      const c = nearestDust(w.x);
      if (c < 0) { w.goal = w.carry ? 'dump' : 'idle'; continue; }
      const target = floor.x + c * P;
      w.x += Math.sign(target - w.x) * Math.min(haulSpeed(), Math.abs(target - w.x));
      if (Math.abs(target - w.x) < P && now >= w.next) {
        const r = topGrain(c);
        if (r >= 0) {
          (w.load ||= []).push(at(floor, c, r));
          put(floor, c, r, 0);
          w.carry++;
          w.next = now + scoopMs();
          S.dirty = true;
        }
      }
      if (w.carry >= haulCap()) w.goal = 'dump';
    } else if (w.goal === 'dump') {
      const target = pit.x - WORKER;                 // the lip, where they can stand
      w.x += Math.sign(target - w.x) * Math.min(haulSpeed() * 1.6, Math.abs(target - w.x));
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
      if (nearestDust(w.x) >= 0) w.goal = 'seek';
    }
  }
}

// a white circle with a black edge. It paints rather than clears, so it never
// eats the dust or the ground line behind it
