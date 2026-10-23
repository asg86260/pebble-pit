// Acts 3 and 4: whether they are on, and where their places are.
//
// DESIGN.md, "Acts 3 and 4: the afterlife and hell (design, not built)". The
// scaffold: two switches, held back the way the deep is (snatch.js,
// `deepOn`), and the two places the camera can stand in beside the yard and
// the deep (`S.view` 'after' and 'hell'). Nothing in this file plays a beat or
// moves a body; the acts' own modules (src/after/, src/hell/) do, once built.
//
// The owner's decisions it stands on (2026-10-17): everything keeps running
// (call 1) -- every place is stepped every frame whether or not it is on
// screen, so the sim never reads the view; act 3 is the union (call 2) and act
// 4 the mine and the forge (call 4's loop). The calls still open are seams,
// not code: what sets off the house's fall (call 7) is `owed('house-fall')`
// below until it is decided.

import { AFTERLIFE_ON, HELL_ON, ACT_ROAD_UNDER } from './config.js';
import { held } from './reset.js';
import { demoOn } from './demo.js';
import { AFTER_PLACE } from './after/place.js';
import { godFront, restW } from './after/sky.js';
import { HELL_PLACE } from './hell/place.js';
import { AFTER_CREW } from './after/bodies.js';
import { HELL_CREW } from './hell/bodies.js';
import { S } from './state.js';

// --- whether -----------------------------------------------------------------
// A released build plays an act only with its switch set (config/after.js,
// config/hell.js), and no build sets either yet. A dev build and the node
// yard (no `import.meta.env`) stand both, so the work on them goes on, the
// rule `deepOn` keeps; the demo never. A check says either way for itself
// (`__actsOn`).
const DEV_BUILD = !import.meta.env || !!import.meta.env.DEV;
let forcedAfter = null, forcedHell = null; // page: a check's switch (`__actsOn`); play never sets it, and a load mid-check must not undo it
export function afterlifeOn() { return !demoOn() && (forcedAfter ?? (AFTERLIFE_ON || DEV_BUILD)); }
// Hell is reached by the afterlife's ghost road, so it is never on without it.
export function hellOn() { return afterlifeOn() && (forcedHell ?? (HELL_ON || DEV_BUILD)); }
export function forceActs(after, hell = after) { forcedAfter = after; forcedHell = hell; }

// --- the places ----------------------------------------------------------------
// The two places, as the camera reads them (view.js, world.js `clampCam`):
// each one's left and right, its top and floor, where across it opens and
// how far its floor stands up off the window's foot. Keyed by `S.view`.
// The afterlife's floor stands as far up off the window's foot as the yard's
// ground does (the pit's depth under it), so crossing over keeps the line a
// body stands on where the eye left it, and the cloud fills under it as the
// pit did. Its right end is half a window past God's stage's front middle,
// so the camera's last window is the one his stage stands square in.
const AFTER_AT_YARD = {
  ...AFTER_PLACE,
  x1: () => godFront() + restW() / 2,
  get margin() { const m = S.worldH - S.groundY; return Number.isFinite(m) && m > 0 ? m : AFTER_PLACE.margin; },
  get crew() { return AFTER_CREW; }
};
// Each place's crew (placebodies.js): its own body list, its JOBS registry,
// its walk and how the hand takes one of its bodies up. Read through a
// getter, since the bodies' modules import the places.
const HELL_AT = { ...HELL_PLACE, get crew() { return HELL_CREW; } };
export const PLACES = { after: AFTER_AT_YARD, hell: HELL_AT };
// The crew whose list holds `w`, or null for one of the yard's.
export const crewHolding = w => {
  for (const pl of Object.values(PLACES)) { const list = pl.crew.list(); if (list && list.includes(w)) return pl.crew; }
  return null;
};
// The cloud floor's underside, as the road up from the yard sees it: past
// the deepest the afterlife's own window ever shows of the cloud under its
// floor, so only the rise riding up the road sees it.
export const afterUnder = () => AFTER_AT_YARD.floor() + AFTER_AT_YARD.margin + ACT_ROAD_UNDER;
export const actPlace = v => PLACES[v] || null;
// Whether a place's act is on: a view into one whose act is off is sent back
// to the yard (view.js, `stepView`).
export const placeOpen = v => (v === 'after' ? afterlifeOn() : v === 'hell' ? hellOn() : false);
export const isActView = v => v === 'after' || v === 'hell';

// --- the beats' triggers -------------------------------------------------------
// Every act beat is a row of BEATS (beats.js) whose trigger is not written
// yet: the house's fall waits on call 7, the gates on the loop, the walls on
// the barriers. Until each is, its trigger is a key owed here, stood up by
// `__actOwe` for a check or a scene, and taken back the frame the beat
// starts. A released build never owes one: nothing calls `owe` but the
// handle.
const OWED = new Set();
export const owe = key => { OWED.add(key); };
export const owed = key => OWED.has(key);
export const paid = key => { OWED.delete(key); };
export const forgetOwed = () => { OWED.clear(); };
held('owed', forgetOwed);
