// The stops: every place a press can be sent to, as one list (DESIGN.md,
// "Controller support", "The stops are one list"). The phone's hop arrows
// (hop.js), the digit keys (input.js) and the pad (pad.js) all walk it, each
// taking the part it wants, so a station that goes up is a stop on all three
// by existing and none of them keeps a list of its own.
//
// A stop is a thing a click already lands on, with its rectangle in world
// units: the rock, every standing station, the way through the portal (its
// arrow and its ring), and in the deep the constrict's orb. Read on the ask,
// never kept, since the yard grows and wears under it.

import { P } from './config.js';
import { S } from './state.js';
import { STATIONS, standRect } from './stations.js';
import { rockDown, rockFootY, rockTopY } from './rock.js';
import { rockLeft } from './world.js';
import { deepTop, portalCircle, deepPortal } from './deep/place.js';
import { arrowBox, arrowShown } from './render/shaftway.js';
import { portalOpenness } from './render/portal.js';
import { orbOn, orbMiddle } from './deep/phases.js';
import { ORB_R } from './config.js';
import { PORTAL_KEYS, PORTALS, portalEnd, portalFree } from './portals.js';
import { gestureStops } from './after/gestures.js';

const mid = r => r.x + r.w / 2;

// The rock's box: its footprint, from its highest standing column down.
export function rockRect() {
  if (!rockDown()) return null;
  let top = rockFootY();
  for (let c = 0; c < S.gw; c++) if (S.rockTops[c] >= 0) top = Math.min(top, rockTopY(c));
  const foot = rockFootY();
  if (top >= foot) return null;
  return { x: rockLeft(), y: top, w: S.gw * P, h: foot - top };
}

// The ring of the portal in either half, as a box, once it stands open.
function portalRect(deep) {
  if (!S.portalOpen || portalOpenness() < 1) return null;
  const c = deep ? deepPortal() : portalCircle();
  return { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 };
}

// Every stop there is, in both halves, unsorted. `half` is 'yard' or
// 'deep' for a stop that stands in one, by where its box is.
function every() {
  const out = [];
  const half = r => (r.y >= deepTop() ? 'deep' : 'yard');
  const rock = rockRect();
  if (rock) out.push({ id: 'rock', kind: 'rock', key: 'rock', r: rock, half: 'yard' });
  for (const row of STATIONS) {
    if (!row.stand || !row.name) continue;
    const r = standRect(row.key);
    if (!r) continue;
    out.push({ id: `st:${row.key}`, kind: 'station', key: row.key, board: !!row.board, r, half: half(r) });
  }
  if (arrowShown()) {
    out.push({ id: 'way:arrow:yard', kind: 'way', key: 'arrow', r: arrowBox(false), half: 'yard' });
    out.push({ id: 'way:arrow:deep', kind: 'way', key: 'arrow', r: arrowBox(true), half: 'deep' });
  }
  for (const deep of [false, true]) {
    const r = portalRect(deep);
    if (r) out.push({ id: `way:portal:${deep ? 'deep' : 'yard'}`, kind: 'way', key: 'portal', r, half: deep ? 'deep' : 'yard' });
  }
  // The acts' portals, an end in each of their places, once the player may
  // take them (portals.js): `half` is the place the end stands in.
  for (const key of PORTAL_KEYS) {
    if (!portalFree(key)) continue;
    for (const place of [PORTALS[key].outer, PORTALS[key].inner]) {
      const e = portalEnd(key, place);
      out.push({ id: `act:${key}:${place}`, kind: 'actway', key, r: { x: e.x - e.r, y: e.y - e.r, w: e.r * 2, h: e.r * 2 }, half: place });
    }
  }
  // Act 3's stations, each worked by its own motion (after/gestures.js): A
  // and the stick work the one under the focus.
  for (const g of gestureStops()) out.push({ id: `ag:${g.key}`, kind: 'gesture', key: g.key, r: g.r, half: 'after' });
  const orb = orbOn(), c = orb && orbMiddle(orb.st);
  if (c) out.push({ id: 'orb', kind: 'orb', key: 'orb', r: { x: c.x - ORB_R * P, y: c.y - ORB_R * P, w: ORB_R * P * 2, h: ORB_R * P * 2 }, half: 'deep' });
  return out;
}

// The stops, left to right by their middles. `half` keeps one half's
// ('yard' or 'deep'); left out, both.
export function stops(half = null) {
  return every().filter(s => !half || s.half === half).sort((a, b) => mid(a.r) - mid(b.r));
}

// One stop by its id, or null once it no longer stands.
export const stopById = id => every().find(s => s.id === id) || null;

// The middle of a stop's box, along the yard.
export const stopMid = s => mid(s.r);
