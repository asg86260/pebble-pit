// The one list of scenes: a scene stands a fresh yard at some place in the
// story so a part of the game can be looked at without playing the hour up
// to it. The shot tool (`tools/look.mjs`) and the dev panel (scenesheet.js)
// both read this list. Nothing here ships: it is imported from main.js's
// `import.meta.env.DEV` block, and a scene runs through the same `window.__`
// handles the checks use (hooks.js).
//
// Each entry:
//   about  one of ABOUT; test/scenes.test.mjs is red for any other name
//   say    one plain sentence, the button's tooltip and the shot tool's --list
//   run    the setup, always from `__reset()`
//   page   true for a scene that needs the page (a real pointer event, a
//          button clicked, a frame waited for), which the node yard has not
//          got; those are covered by the shot, the rest by the node check
//
// The comments over the scenes say why each is set up as it is.

import { S, floor } from './state.js';
import { addGrain, bottomY } from './grid.js';
import { JOB, TYPE, AFTER_JOB } from './jobs.js';
import { P, PROP_FROM, NET_COST, ARCH_COST, DOME_BILL, DOME_WORK, DOME_RINGS, DOME_FADE_MS, LADDER, TIER_OWN, MACHINE_TUNE_RUNGS, LAND_HOP_MS, INTRO_CHAT_MS } from './config.js';
import { dropMs, ramX } from './rock.js';
import { buriedAt } from './intro.js';
import { rockLeft, clampCam } from './world.js';
import { now, advance } from './clock.js';
import { COIL_SEGS, SNATCH_ALONE_MS, SNATCH_LEAP_MS, PAIRS, CLASSES, FORK_RUNG, MECHANICS, LEVELUP_S, LEVELUP_BURST_S, KILL, KILL_REFORM_S, SERPENT_PHASES, RECOIL, NEARDEATH, POWERUP, rungValue,
         MEAL_LEAD_S, MEAL_WARN_S, ORB_BOLT_S, MEAL_GULP_S, MEAL_SWALLOW_S } from './config.js';
import { depthAt } from './deep/depth.js';
import { strike, clickDeep } from './deep/serpent.js';
import { mouthX, portalX, spotX, coilAt, bellySeg, slotX, crusherRect, deepFloor, deepX0 } from './deep/place.js';
import { sweep } from './hands.js';
import { windowS, startMeal, landAt } from './deep/meals.js';
import { startleFauna, faunaWhen } from './deep/fauna.js';
import { nextWave } from './render/deepwave.js';
import { skyMoment, skyWatch } from './render/aftercrowd.js';
import { buildStation, nextSlot } from './deep/party.js';
import { lookAt } from './deep/rails.js';
import { press as pressBuildButton } from './deep/buildbutton.js';
import { lay } from './deep/statuses.js';
import { worksAt, progressOf, markDoneSeen } from './works.js';
import { SAVE as CREW_SAVE } from './crew/records.js';
import { goDeep, goUp, poseGlide } from './view.js';
import { floorAt, stationX0, stationBox, signBox, soulX, afterFloor, afterOpenX, workshopsX1, unionJoinAt, campEdges, plotX, groundOf, AP } from './after/place.js';
import { godFront } from './after/sky.js';
// The window's middle at the camera's last window over act 3: God in it,
// his stage square under him.
const godView = () => godFront();
import { CROWD_X0, CROWD_FILES, AFTER_COIN_UNDER_S, STRIKE_SHARE, AFTER_PODIUM_CLIMB, AFTER_PLANT_S, AFTER_PILES } from './config.js';
import { millView, bedWants } from './after/mill.js';
import { gestureDown, gestureMove, gestureUp, partsOf } from './after/gestures.js';
import { STEPS } from './game.js';
import { demoHand } from './render/aftercues.js';
import { siteLoads } from './after/build.js';
import { dropSpot, goodsRead } from './after/piles.js';
import { stripOf as groundStrip, units as groundUnits, counted as groundCounted } from './after/ground.js';
import { afterGround } from './state.js';
import { FINALE_HOUSE_W, APOTH_POTS_MAX } from './config.js';
import { houseX } from './home.js';
import { goOnAlpha } from './actbeats.js';
import { forceMotion, motionForcedNow } from './prefs.js';
import { stopById } from './stops.js';
import { INDEX } from './config/index.js';
import { ABYSS_AT, RIFTLIFE_SPEED, RIFTLIFE_COIL, DEEP_W } from './config.js';
import { riftCenter, riftRadius } from './rift.js';
import { hold } from './input.js';
import { showPane, offerDress } from './settings.js';
import { namePair, wear, pairBody } from './wardrobe.js';
import { lockForCheck } from './wardrobepage.js';
import { freedBody } from './snatch.js';
import { fillControls } from './controls.js';
import { setFeedbackUrl } from './feedback.js';
import { loadKind } from './carry.js';

// The held sheet up on settings, turned to a tab by its button.
const settingsTab = t => {
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  document.getElementById('settingsbtn').click();
  document.querySelector(`#held .settabs button[data-tab="${t}"]`).click();
};

// The parts, in the order the sheet reads them.
export const ABOUT = [
  'the story', 'the rock', 'the crew', 'the bench', 'the cut', 'the plots',
  'the apothecary', 'the kit', 'the house and the sky', 'the tower',
  'the casino', 'the pit and the rift', 'the shields', 'the endgame', 'the deep',
  'the acts'
];

const st = () => window.__state();

// A yard that can afford anything, with every site full. The dust is granted,
// not tipped: `__tip` walks each grain past the first few thousand across the
// whole heap to find room, and the hole holds fewer than this, so tipping the
// rest would tear the rift for real with its cutscene over the scene. A grant
// pours the rest through a rift that is simply open.
const RICH_DUST = 90000;
const rich = () => {
  window.__reset(); window.__crew(3, 3, 5, 7); window.__machineGates();
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: RICH_DUST });
};

// A yard with most of the index met: the rich yard, a storm's muck and the
// sky seen, and the four things only `S.seen` remembers. Read up to the
// tower, so the dots fall on what came after it.
const indexYard = () => {
  rich();
  S.tally.muckRains = 1; S.seenAir = true; S.rains = 3;
  S.seenShard = S.seenSpore = S.seenSpark = true;
  for (const k of ['crit', 'poop', 'bird', 'lightning']) if (!S.seen.includes(k)) S.seen.push(k);
  window.__fast(1);
  S.indexRead = ['dust', 'shard', 'spore', 'spark', 'rock', 'pit', 'house', TYPE.HAUL, 'sqwife'];
};
const pressI = () => dispatchEvent(new KeyboardEvent('keydown', { key: 'i', code: 'KeyI', bubbles: true }));
// The house board's row to the two of you (crewboard.js), pressed.
// The crowd of the `pair` scene, the two of them in what is handed in.
function dressedPair(outfits) {
  const was = window.__outfits;
  window.__outfits = outfits;
  try { SCENES.pair.run(); } finally { window.__outfits = was; }
}
function pairDoor() {
  lockForCheck(null);                 // a stand-in lock left by 'wardrobe-locked'
  window.__board('house');
  document.querySelector('#crewshop button[data-key="pairpage"]')?.click();
}
// A new yard's steps (wardrobepage.js) stood at step `n`, the two of them
// named and given roles first, and each step before it passed by its next.
const whoSteps = n => {
  lockForCheck(null);
  window.__reset(); window.__fast(1);
  S.dressOffered = false;
  window.__self('you', { name: 'ada', role: 'wife' });
  wear('you', { head: 'beret', face: 'round-glasses', neck: 'striped-scarf', back: 'cape', pattern: 'stripes' });
  if (n >= 2) window.__self('sqouse', { name: 'bram', role: 'ouse' });
  offerDress(true);
  for (let i = 0; i < n; i++) document.getElementById('wardnext').click();
};
// The sqouse named for a story line's shot: `window.__whoName` and
// `window.__whoRole`, else a name and the neutral role.
const whoNamed = () => window.__self('sqouse', { name: window.__whoName ?? 'bram', role: window.__whoRole || 'ouse' });
const indexPick = key => document.querySelector(`#index .it[data-key="${key}"]`)?.click();

// The quarry bought with nothing else open past the farm, eight seconds into
// going up: one builder at it, and its tile on the bench.
const quarryGoingUp = () => {
  window.__reset(); window.__crew(4); S.quarryOpen = false; S.farmOpen = true;
  window.__answered('props', 'net');
  window.__grant({ dust: 99999, shards: 999, spores: 9999, sparks: 999 });
  window.__buy('unlockquarry'); window.__fast(8);
};

// Holding the camera on a spot against whatever pans it (a meteor called down
// sends it off to the star): every frame the page draws, for long enough to
// take a shot and no longer. A pin that ran for ever held every later scene
// on this one's spot, and in the node yard, where a frame is a timer, it kept
// the process alive after its checks were done, so a sweep never finished.
const PIN_FRAMES = 240;
// A pin outlives the scene that set it by up to PIN_FRAMES, so a check that
// stands a scene and goes on would have its camera held under it: the next
// group's `newRun` lets go (`__unpin`).
let pinned = 0; // page: a scene's camera pin, a dev handle's; no save or new game owns it
function pinCamera(x) {
  if (typeof window.__scene !== 'function') return;     // the page's alone
  let left = PIN_FRAMES;
  const mine = ++pinned;
  const pin = () => { if (mine !== pinned) return; window.__look(x); if (--left > 0) requestAnimationFrame(pin); };
  pin();
}
if (typeof window !== 'undefined') window.__unpin = () => { pinned++; };

const sphereAt = secs => {
  rich();
  window.__crew(0, 8, 0, 0, 0, 3);
  window.__levels({ wizSpeedLevel: 5, wizPowerLevel: 5 });
  window.__fast(20);
  window.__meteor();
  window.__buy('sphere');
  window.__fast(secs);
  window.__look(st().towerX - 420);
  pinCamera(st().towerX - 420);
};

// The lip bought out, which is what the belt is gated behind; `__fullSites`
// does the same for the other stations, but carrying has no site to fill.
const lip = () => {
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  window.__kit({ carters: 6 });
};

// A surface yard some way in, for store shots: a crew at every site with hats
// on, the shack and the outhouse up, the third rock down, and the bench raised
// through its own call. `then` frames it once the bench is standing.
const steamYard = then => {
  window.__reset(); window.__crew(5, 4, 4, 6);
  window.__kit({ breakers: 3, blasters: 2, growers: 2, carters: 2 });
  window.__levels({ benchLevel: 3, plotLevel: 6 });
  window.__loo(); window.__assign(JOB.JANITOR, 1); window.__shack(); window.__jump(3);
  window.__give(100); window.__fast(2);
  requestAnimationFrame(() => {
    document.getElementById('raise').click();
    window.__fast(40); window.__nocine(); then();
  });
};

// The closet with its caps and its tender, and `n` roombas bought through
// their row and built. The haulers are the spare hands that build them.
const roombaYard = (n = 3) => {
  window.__reset(); window.__crew(0, 3); window.__loo(); S.looPosts = 2;
  window.__air({ janitors: 1, haze: 0, muck: 0 });
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 90000 });
  for (let i = 0; i < n; i++) { window.__buy('roomba'); window.__finish(); }
  window.__fast(1);
};
// The camera held on the first roomba out, every frame the page draws for as
// long as `pinCamera` would hold a spot: it drives faster than a shot is taken.
function followRoomba() {
  const r = S.roombaBots.find(b => b.goal === 'out') || S.roombaBots[0];
  const at = () => window.__look(r.x - S.viewW / 2);
  at();
  if (typeof window.__scene !== 'function') return;     // the page's alone
  let left = PIN_FRAMES;
  const pin = () => { at(); if (--left > 0) requestAnimationFrame(pin); };
  pin();
}
// The camera's middle on the dock's middle, so a zoomed shot is of the dock.
const lookAtDock = () => {
  const s = st(), b = s.roombaBots;
  const mid = b.length ? (b[0].x + b[b.length - 1].x) / 2 : s.outhouseX;
  window.__look(mid - s.viewW / 2);
};
// Muck a cell or two deep in runs along the open yard either side of the
// closet, and a patch of poop every so often, as a front and a crew leave it.
const dirty = () => {
  const c0 = Math.floor(st().outhouseX / P);
  window.__muckSet(c => (c > c0 - 90 && c < c0 + 110 && (c * 7) % 11 < 6) ? 1 + ((c * 13) % 5 === 0) : 0);
  window.__poopSet(c => (c > c0 - 90 && c < c0 + 110 && c % 17 === 0) ? 2 : 0);
};

// A patch of poop every so often across the stretch in front of the camera.
const messPoop = () => {
  const c0 = Math.floor((st().camX + st().viewW / 2) / P);
  window.__poopSet(c => (c > c0 - 60 && c < c0 + 60 && c % 23 === 0) ? 2 : 0);
};

// Where the hauler with the most in its arms is standing, off the snapshot's
// crew lines, for a look at a load on the road.
const ladenHauler = () => {
  const hs = st().crewDetail.filter(d => d[0] === 'h').map(d => d.split('|'))
                            .filter(d => d[5] === 'pyard');
  hs.sort((a, b) => +b[3].slice(1) - +a[3].slice(1));
  return hs.length ? +hs[0][2] : st().pitX;
};

// A sky at whatever level the scene sets. The eight seconds are not padding:
// `fillSky` mints the sky at the top of the window and each speck eases down
// to its slot over `SMOG_SINK`, so shot at once it reads as a bug in the thing
// being looked at.
const skyAt = haze => {
  rich(); window.__look(st().rockLeftX - 300);
  window.__air({ haze }); window.__fast(8);
};

// The rain is on a clock of its own, so a scene that wants weather brings
// the next front forward at a heft; the waits are loops on the yard's own
// readout rather than counted seconds, so the scenes survive retuning.
const untilBrewing = (heft = 1) => { window.__front(heft); for (let i = 0; i < 90 && !st().smog.brewing; i++) window.__fast(1); };
const untilRaining = (heft = 1) => { untilBrewing(heft); for (let i = 0; i < 120 && !st().smog.raining; i++) window.__fast(1); };

const firstMuck = (rockhands, haulers) => {
  window.__reset(); window.__crew(rockhands, haulers); window.__fast(3);
  window.__air({ haze: 4200 }); untilRaining();
  for (let i = 0; i < 120 && st().smog.raining; i++) window.__fast(1);
  for (let i = 0; i < 300 && st().beat.camera !== 'firstmuck'; i++) window.__fast(0.1);
};

// A pointer put on a spot of the yard. Not a hook: standing at a thing is
// what opens it, and there is no handle that puts the mark up.
const hover = (x, y) => {
  const s = st();
  document.getElementById('c').dispatchEvent(new PointerEvent('pointermove', {
    clientX: (x - s.camX) * s.zoom, clientY: (y - s.camY) * s.zoom,
    pointerId: 1, isPrimary: true, button: 0, buttons: 0, bubbles: true }));
};

// A fresh yard with the coin for every shield in hand. The story is a chain
// (each row is offered once the one before has failed), so a scene about a
// later shield stands the yard where the earlier ones have been through.
const SHIELD_ORDER = ['props', 'net', 'arch', 'dome'];
// A fresh yard with the props on offer and a small purse (the story's card
// scenes).
const cardYard = dust => {
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(dust);
};
const shieldYard = () => {
  window.__reset();
  window.__crew(2, 1, 0, 0, 0, 1);   // and one who can fly, for the dome
  window.__jump(PROP_FROM);
  window.__give(60000);
  window.__grant({ shards: ARCH_COST * 3, spores: NET_COST * 3 });
  // The dome's bill is priced in everything: the dust through the pit, the
  // rest through the grant.
  for (const [money, n] of DOME_BILL) {
    if (money === 'dust') window.__give(n * 3);
    else window.__grant({ [money + 's']: n * 3 });
  }
};
// The dome mid-cast, `secs` after it was bought: a hatted wizard up at the
// star, then the dome bought out from under it.
const domeCast = secs => {
  shieldYard();
  S.shieldsDone = SHIELD_ORDER.slice(0, 3);
  S.quarryOpen = S.farmOpen = S.towerOpen = S.meteorOpen = true;
  window.__wizardHat(); window.__fast(30);
  window.__buy('dome'); window.__fast(secs);
};
const shieldBuilt = kind => {
  shieldYard();
  S.shieldsDone = SHIELD_ORDER.slice(0, SHIELD_ORDER.indexOf(kind));
  S.quarryOpen = S.farmOpen = S.towerOpen = S.meteorOpen = true;
  window.__buy(kind);
  // The build is run through rather than skipped: the work is done by a lent
  // body at the site (works.js).
  for (let i = 0; i < 900; i++) {
    const sh = st().shield;
    if (sh && sh.laid >= sh.pieces) break;
    window.__fast(1);
  }
};

// --- the deep ---------------------------------------------------------------
// The second half (docs/wave-serpent.md, docs/wave-party.md). Every scene
// stands the real deep up: the snatch played through, the fight set at a
// stage, the party asked for (`__party`: its stations built, a fighter seated
// at each, the class and rung set), and then the yard's clock run until the
// fighters have swum to their work and their shots are in the water. Nothing
// is drawn that the game did not put there.

// A yard the serpent has come for: every site built, the snatch behind it,
// the sqwife back down there as the deep's one resident (`__crew` sends the
// whole crew up top), `spare` residents more, the party, the fight at
// `stage` with its wound held at `wound`, a share of its depth, scales on
// the floor, and the view; at `level`, the serpent risen that many times
// less one, its depths that level's.
function deepYard({ stage = 0, wound = 0, party = [], fangs = 0, spare = 0, scales = 400, loose = 0,
                    view = 'deep', run = 20, level = 1 } = {}) {
  if (level > 1) stage = SERPENT_PHASES - 1;   // past the story it is only ever on its last
  rich();
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
  window.__deepCrew({ spare: 1 + spare });
  if (party.length || fangs) window.__party({ stations: party, fangs });
  // A gatherer by the crusher with a party standing, so a fang a break drops
  // is carried by its own hand and no fighter leaves its work in the shot.
  if (party.length) window.__deepCrew({ spare: 1 });
  window.__scales(scales);
  if (loose) window.__looseScales(loose);
  window.__serpent({ level, stage });
  window.__serpent({ stage, wound: wound * depthAt(stage) });
  window.__view(view);
  // Long enough to swim from the pods to the stations and the coil. A party
  // at its top rungs breaks a defense in seconds, so the fight is set again
  // every half second on the way, and once more when they are at it.
  for (let s = 0; s < run; s += 0.5) {
    window.__fast(Math.min(0.5, run - s));
    window.__serpent({ stage, wound: wound * depthAt(stage) });
  }
}

const lookDeep = x => window.__look(x - S.viewW / 2);

// A creature clicked and held `at` seconds into its reaction: the deep set
// up with no fight to scatter it, the camera on it, the click the pointer's
// call, and the moment held against the second the shot tool runs after
// (`__holdShot`). `window.__reactAt` moves the moment, for a strip of them;
// `window.__reactSpot()` is where it is on the glass, to crop a shot to.
const REACT_AT = { school: 0.3, jelly: 0.5, lantern: 0.2, siphon: 0.6, angler: 0.5, dumbo: 0.6, tripod: 0.5,
                   amphipod: 0.17, snail: 0.17 };
// Clear of the coil, which is drawn in front of the zones' creatures.
const clearOfCoil = (x, y, cells) => {
  for (let i = 0; i < COIL_SEGS; i++) { const p = coilAt(i, now()); if (Math.hypot(p.x - x, p.y - y) < P * cells) return false; }
  return true;
};
function reactScene(find, click, at, again, kind = null) {
  deepYard({ run: 2 });
  // The swimmers take turns, so a kind may be many minutes off: the clock is
  // turned on to when it is next on the deep rather than run there.
  const when = kind && faunaWhen(kind, now() / 1000, { inset: 70 });
  if (when) advance((when - now() / 1000) * 1000);
  let f = null;
  for (let i = 0; i < 300 && !(f = find()); i++) window.__fast(0.5);
  if (!f) return;
  lookDeep(f.x);
  f = find() || f;
  click(f);
  const want = window.__reactAt ?? at;
  if (want > 0) window.__fast(want);
  window.__reactSpot = () => {
    const g = again(f);
    return g && { x: (g.x - S.camX) * S.zoom, y: (g.y - S.camY) * S.zoom };
  };
  window.__holdShot();
}
const beltSeg = f => Math.round(f * (COIL_SEGS - 1));

// A floor slot's middle, and the lowest slot no station stands on, as the
// build button reads it.
const slotAt = slotX;
const freeSlot = () => Math.max(0, nextSlot());
// The station a class is sold at, off the pairs table.
const KIND_OF = Object.fromEntries(Object.entries(PAIRS).flatMap(([kind, cs]) => cs.map(c => [c, kind])));
// Where the fighter at a station is now, or its station while it has none.
const lookAtStation = i => {
  const st = S.stations[i];
  if (!st) return lookDeep(slotAt(freeSlot()));
  const w = S.workers.find(b => b.station === st.id);
  lookDeep(w ? w.x : slotAt(st.slot));
};
const cast = (cls, rung = 8) => ({ kind: KIND_OF[cls], cls, rung });

// A stage's look on the serpent, the party asked for at the coil.
const stageScene = (stage, wound, stations = []) => () => {
  deepYard({ stage, wound, party: stations });
  lookDeep(coilAt(bellySeg() - 4, now()).x);
};

// A meal caught at its moment (deep/meals.js): `at(g)` seconds into it once
// the scene's second of yard has run, the camera on the head (or the belly),
// and the moment held against the frames the shot tool runs (`__holdShot`).
// Null `at`: the window a moment short of the meal, left to run.
const mealScene = (at, atBelly = false) => () => {
  deepYard({ stage: 1, wound: 0.4, party: [cast('ranger', 0)] });
  lookDeep(atBelly ? coilAt(bellySeg() - 6, now()).x : coilAt(0, now()).x - 60);
  S.mealGo = null;
  if (!at) { S.mealT = windowS() - MEAL_LEAD_S - 2; return; }
  S.mealT = windowS() - MEAL_LEAD_S;
  startMeal(now());
  // through the beats a frame at a time, so the creature is taken and the
  // haul timed as play does them (the moment is asked again each frame: a
  // beat after the haul is not known until the haul is)
  while (S.mealGo && S.mealGo.t < at(S.mealGo) - 1 / 60) window.__fast(1 / 60);
  window.__holdShot();
};
const REEL_AT = () => MEAL_WARN_S + ORB_BOLT_S;   // the haul starts

// The lash is a second long, shorter than a shot takes, so its moment is
// held on the page's frames for a few seconds (as the glide's is, below).
const mechScene = (stage, into, stations, seg = null, pin = false) => () => {
  stageScene(stage, 0.3, stations)();
  const m = MECHANICS[stage];
  S.mechAt = m.every - m.last - Math.max(0, into) - 0.05;
  window.__fast(Math.max(0, -into) + 0.05);
  if (seg != null) lookDeep(coilAt(seg, now()).x);
  if (!pin) return;
  const at = S.mechAt, until = performance.now() + 4000;
  const hold = () => { if (performance.now() < until && S.serpentStage === stage) { S.mechAt = at; requestAnimationFrame(hold); } };
  hold();
};

// A phase's break, held `at` seconds in (deep/phases.js).
const breakScene = (stage, at, stations) => () => {
  stageScene(stage, 0, stations)();
  S.breakT = at;
  const until = performance.now() + 4000;
  const hold = () => { if (performance.now() < until && S.serpentStage === stage) { S.breakT = at; requestAnimationFrame(hold); } };
  hold();
};

// The constrict's orb in frame: the strongest station's fighter.
const lookAtOrb = () => {
  const w = S.orb && S.workers.find(o => o.station === S.orb.st);
  if (w) lookDeep(w.x);
};

// The snatch as it plays: both facts true, and the clock run until the beat
// reaches the phase named. The shot tool runs a second more after a scene,
// and the take is shorter than that, so the scene stops at the start of the
// phase before the one to be seen.
// Act 3's chain stood up the way the cards sell it (after/rows.js): the
// afterlife begun by the dev travel, a block of the crowd made members (the
// setup a scene is not about) and run on until they have walked out to the
// camp, rebel and timber granted, the stations bought on the shack and run on
// until they stand, then the posts and the upgrades bought row by row;
// `slow` carries the crowd past the slowdown and buys its branch.
// Act 3's bills take the yard's coins too (DESIGN.md, "The yard pays too"): the
// yard given enough of each for every row a scene buys, the setup no shot is about.
// Enough of the yard's coins for every act-3 bill a scene buys, at the paced
// prices (config/after.js, the pacing pass): the scales from the ore band on.
const yardPurse = () => window.__grant({ dust: 2e6, spores: 5e5, shards: 5e5, scales: 3e4, sparks: 5e4 });
// Act 3's members put on their jobs as a player puts them: the + on each
// job's roster, a seat bought on the station's board first where the job's
// seats are full. A job named twice is two members.
const staffAfter = jobs => {
  for (const j of jobs) if (!window.__afterPress(j, 1)) { buyAfter(`after-seat-${j}`); window.__afterPress(j, 1); }
};
// Station `key`'s round part (`ring`, the saw mill's wheel) taken hold of
// where it stands and turned at `rev` turns a second for `frames` frames,
// the press held (after/gestures.js).
function handTurn(key, ring, rev, frames) {
  const w = window.__gestureParts(key)[ring], rx = w.r || w.rx, ry = w.r || w.ry;
  const at = a => [w.x + Math.cos(a) * rx, w.y + Math.sin(a) * ry];
  window.__gesture('down', ...at(0));
  for (let f = 1; f <= frames; f++) { window.__gesture('move', ...at(f / 60 * rev * 2 * Math.PI)); window.__fast(1 / 60); }
}
// The grove's first tree, the saw lying across its trunk taken and sawn back and
// forth `strokes` times at a stroke a `per` seconds, the press held at the
// end of the last; framed on the plot.
function handSaw(strokes, per = 0.5) {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  window.__afterSaw(); window.__fast(0.5);
  const b = window.__gestureParts('tree', 0).sawBox, x0 = b.x + P * 2, y = b.y + b.h / 2;
  window.__gesture('down', x0, y);
  const frames = Math.round(strokes * per * 60);
  for (let f = 1; f <= frames; f++) { window.__gesture('move', x0 + Math.sin(f / 60 / per * Math.PI) * P * 6, y); window.__fast(1 / 60); }
  window.__look(0); window.__holdShot();
}
// The timber pile topped up to its brim, before each act 3 bill that names
// timber: it holds no more (after/piles.js), so a setup buying several rows
// grants it again between them.
const timberUp = () => window.__afterGrant({ timber: AFTER_PILES.timber.brim });
// An act 3 row bought with the timber for it, and its timber carried to its
// station, so the row has landed.
const buyAfter = key => { timberUp(); const bought = window.__buy(key); carried(); return bought; };
function afterChain(slow) {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  // Won in blocks of files rather than from the front back, so the shot
  // shows the field emptying in patches and the ink round them.
  window.__afterCrowd(slow ? (i, v) => ((Math.floor((i % 40) / 5) + Math.floor(i / 160)) % 2 ? 9 : v)
                           : (i, v) => (i < 40 ? 8 : v));
  for (let k = 0; k < 90 && window.__afterRead().walking > 0; k++) window.__fast(1);
  S.after.camp += slow ? 30 : 0;   // the members a patchy field sent out, without their walk
  window.__afterGrant({ rebel: 9000, timber: slow ? 160 : 40, logs: 12 }); yardPurse();
  // In waves, each needing the one before: the saw mill, then the workshop
  // that stands on it.
  const waves = [['mill'], ['workshop']];
  for (const wave of waves) {
    for (const st of wave) window.__buy(`after-build-${st}`);
    for (let k = 0; k < 300 && wave.some(st => !window.__afterRead().built.includes(st)); k++) window.__fast(1);
  }
  const A = AFTER_JOB;
  staffAfter([A.CUT, A.CUT, A.CUT, A.SAW, A.JOIN, A.JOIN]);
  for (const u of ['after-plot', 'after-plot', 'after-stumps', 'after-blade', 'after-bench']) buyAfter(u);
}

// Track A: the workshop standing with timber for its blanks, `taps` nails
// tapped by hand in order, then `after` seconds more; framed on the shed.
function handNails(taps, after) {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  for (const k of ['mill', 'workshop']) if (!S.after.built.includes(k)) S.after.built.push(k);
  window.__afterGrant({ timber: 30, benchtimber: 8, signs: 2 });
  const b = stationBox('workshop');
  window.__look(b.x + b.w / 2 + P * 10 - S.viewW / 2); window.__fast(0.5);
  const nails = window.__gestureParts('workshop').nails;
  for (let k = 0; k < taps; k++) { const n = nails[Math.floor(k / 2)]; window.__gesture('down', n.x + n.w / 2, n.y + n.h / 2); window.__gesture('up'); window.__fast(0.25); }
  window.__fast(after);
  window.__holdShot();
}

// Track A: the workshop ordered with the saw mill standing beside its spot,
// four members in the camp to carry it, run on until `until(site)` holds
// (null: never ordered), framed on the spot.
function afterSite(until) {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  for (const k of ['mill']) if (!S.after.built.includes(k)) S.after.built.push(k);
  for (let k = 0; k < 90 && window.__afterRead().walking > 0; k++) window.__fast(1);
  S.after.camp = 4;
  window.__afterGrant({ rebel: 400, timber: 40 }); yardPurse();
  if (until) {
    window.__buy('after-build-workshop');
    for (let k = 0; k < 2400 && !(S.after.raising.workshop && until(S.after.raising.workshop)); k++) window.__fast(0.1);
  }
  const b = stationBox('workshop');
  window.__look(b.x + b.w / 2 - S.viewW / 2); window.__holdShot();
}

// Act 3's crowds and God at a point of the pan (track C, render/aftercrowd.js):
// a crowd of 24,000 with patches walked out and a few rims inking, three
// signs in the near rows, and the camera's middle `pan` of the way from the
// pedestal to the throne end (null: on the pedestal, both crowds in frame).
function afterMass(pan) {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  const n = 24000, F = CROWD_FILES;
  const rims = new Array(n);
  for (let i = 0; i < n; i++) {
    const f = i % F, r = Math.floor(i / F), h = ((f * 7919 + r * 104729) % 997) / 997;
    const patch = (Math.floor(f / 6) + Math.floor(r / 40)) % 3 === 0 && h < 0.55;
    rims[i] = patch ? '9' : h < 0.12 ? String(1 + Math.floor(h * 40) % 5) : '0';
  }
  S.after.rims = rims.join('');
  for (const [f, r] of [[8, 1], [27, 3], [16, 0]]) S.after.signs.push({ id: 90000 + f, f, r, askew: false, pull: null, big: false });
  window.__fast(2);
  const ped = CROWD_X0 - P * 20;
  const cx = pan == null ? ped : CROWD_X0 + (godView() - CROWD_X0) * pan;
  window.__look(cx - S.viewW / 2); window.__fast(1); window.__holdShot();
}

// Track B: the sky at `share` of the way to the strike (a crowd of 4,000,
// that many walked out with no walk), signs standing along God's
// yard, the camera `pan` of the way along the dive. `what` stands a rally or
// a roar going on: the clock turned to the moment one is out across the sky.
function heavenAt(share, pan = 0, what = null) {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  const n = 4000, gone = Math.round(n * share * STRIKE_SHARE);
  S.after.rims = Array.from({ length: n }, (_, i) => (i < gone ? '9' : '0')).join('');
  S.after.speech = { next: S.after.t + 1e6, target: null, burnt: null };
  for (const [f, r] of [[4, 1], [14, 3], [24, 0], [34, 2]]) S.after.signs.push({ id: 94000 + f, f, r, askew: false, pull: null, big: false, age: 0 });
  const t = S.after.t;
  // A rally falls every 7.5 s or so, a roar every 6.5 (render/aftercrowd.js).
  const wait = what === 'rally' ? 7.5 - (t % 7.5) + 1.2 : what === 'roar' ? 6.5 - ((t - 2.5) % 6.5) + 0.8 : 2;
  window.__fast(wait);
  const a = afterOpenX(), cx = a + (godView() - a) * pan;
  window.__look(cx - S.viewW / 2); window.__fast(1 / 30); window.__holdShot();
}

// The sky a tenth of the way to the strike, its clock run on a tick at a
// time until `want` says his turns and his talk are at the moment, held.
function heavenTurn(want) {
  heavenAt(0.1);
  window.__holdShot(0);
  for (let k = 0; k < 2400 && !want(skyMoment()); k++) window.__fast(0.25);
  window.__holdShot();
}

// Act 3's level in its three zones (DESIGN.md, "The level, the two crowds and
// the flags"): a crowd of 4,000 `share` of the way to the strike, signs in
// both planes of God's crowd (a plane's ranks: SKY_SIGN_RANKS), the camera
// on `at` -- 'works' the workshops' end, 'union' the
// pedestal where the act opens, 'god' God's crowd, or a world x. With `won`,
// a member beside the first sign walks out and the clock runs on `won`
// seconds into its soul's way round the sign and across to the union's camp.
const LEVEL_SIGNS = [[16, 12], [6, 30], [27, 14], [34, 24]];
function levelAt(share, at, won = null) {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  const n = 4000, gone = Math.round(n * share * STRIKE_SHARE);
  S.after.rims = Array.from({ length: n }, (_, i) => (i < gone ? '9' : '0')).join('');
  S.after.speech = { next: S.after.t + 1e6, target: null, burnt: null };
  for (const [f, r] of LEVEL_SIGNS) S.after.signs.push({ id: 96000 + f, f, r, askew: false, pull: null, big: false, age: 0 });
  // The workshops standing, so their zone is seen with its stations.
  for (const k of ['mill', 'workshop']) if (!S.after.built.includes(k)) S.after.built.push(k);
  window.__fast(2);
  const cx = () => (at === 'works' ? workshopsX1() - S.viewW * 0.3 : at === 'union' ? afterOpenX() : at === 'god' ? godView() : at);
  window.__look(cx() - S.viewW / 2); window.__fast(1 / 30);
  if (won != null) {
    skyWatch();
    const [f, r] = LEVEL_SIGNS[0];
    window.__afterCrowd((i, v) => (i === (r + 1) * CROWD_FILES + f ? 8 : v));
    window.__fast(1 / 60);
    skyWatch();
    window.__fast(won);
    window.__look(cx() - S.viewW / 2); window.__fast(1 / 60);
  }
  window.__holdShot();
}

// The pair's podium at rung `n` (0 the soapbox) with the union's crowd at
// `share` of the way to the strike, framed on the union's camp; with `into`,
// the rung just bought and its building that share of the way through; with
// `hop`, a line of their speech just gone up, the near rows hopping.
function podiumAt(n, share, into = null, hop = false) {
  levelAt(share, 'union');
  S.after.ups['after-podium'] = n;
  S.after.upAt['after-podium'] = into == null ? S.after.t - 1e3 : S.after.t - into * AFTER_PODIUM_CLIMB.s;
  if (hop) S.after.shout = S.after.t - 0.1;
  window.__fast(1 / 30); window.__holdShot();
}

const snatchAt = (phase, into = 0, pin = false) => () => {
  rich();
  window.__fullSites();
  window.__snatch();
  for (let i = 0; i < 60 * 60 && S.snatch?.phase !== phase; i++) window.__fast(1 / 60);
  for (let i = 0; i < into; i++) window.__fast(1 / 60);
  // A rise is half a second and a take a beat, quicker than a shot is
  // taken, so the moment is held on the page's frames for a few seconds.
  if (!pin) { window.__holdShot(); return; }
  window.__holdShot();
  const sn = S.snatch, y = sn?.headY, carried = sn?.carried, until = performance.now() + 4000;
  const hold = () => {
    if (!sn || S.snatch !== sn || performance.now() > until) return;
    sn.at = now(); sn.headY = y; sn.phase = phase; sn.carried = carried;
    requestAnimationFrame(hold);
  };
  requestAnimationFrame(hold);
};

// The kill caught `a` seconds after the fourth break (or, with null, `back`
// seconds into gathering itself again after the sheet), held for the shot.
const killAt = (a, back = KILL_REFORM_S * 0.5) => () => {
  deepYard({ stage: SERPENT_PHASES - 1, party: [cast('brawler', 8), cast('mage', 8)] });
  window.__serpent({ stage: SERPENT_PHASES - 1, wound: depthAt(SERPENT_PHASES - 1) });
  window.__fast(1 / 60);
  if (a == null) {
    for (let i = 0; i < 60 * 120 && S.beat.sheet !== 'freedsheet'; i++) window.__fast(1 / 60);
    window.__skipBeat('sheet');
    window.__fast(back);
    window.__view('deep');                     // the finale left the camera in the yard
  } else window.__fast(a);
  lookDeep(coilAt(bellySeg(), now()).x);
  window.__holdShot();
};

// A level's bar emptied past the story (DESIGN.md, "Endless serpent"): level 3
// on its last defense one short of empty, the last of it by the hand, and
// `a` seconds into the recoil (the rear, the near-death, the power-up), held
// for the shot, between the head and the belly so the head and the wound are
// both in it.
function recoilAt(a) {
  deepYard({ level: 3, party: [cast('brawler', 8), cast('mage', 8)] });
  window.__serpent({ wound: depthAt(SERPENT_PHASES - 1) - 1 });
  for (let i = 0; i < 60 * 3 && S.recoilT == null; i++) {
    const p = coilAt(bellySeg(), now());
    clickDeep(p.x, p.y);
    window.__fast(1 / 60);
  }
  if (a > 1 / 60) window.__fast(a - 1 / 60);
  lookDeep(coilAt(0, now()).x + S.viewW / 4);
  window.__holdShot();
  S.still = true;
}
// The seconds into it each part starts, read off the config as phases.js does.
const REAR_S = RECOIL.snap + RECOIL.hold, BRINK_S = REAR_S + NEARDEATH.crack, POWER_S = BRINK_S + NEARDEATH.brink;

// The finale (finale.js): a yard with a crew of every kind on it -- the gang,
// haulers and carters, the cut, the plots, the janitors, the wizards -- and a
// party at the last defense, struck down by the last blow and run until the
// finale reaches `phase`, then `into` seconds more, the moment held for the
// shot. With `phase` 'after', the sheet put down and the yard run on: the two
// of them at the house. `onHouse` turns the held camera onto the house, for a
// moment of the build the walk's own camera is not looking at.
const finaleAt = (phase, into = 0, onHouse = false) => () => {
  rich();
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(3, 6, 3, 4, 2, 2);
  window.__kit({ carters: 3 });
  window.__air({ janitors: 2 });
  window.__deepCrew({ spare: 2 });
  window.__party({ stations: [cast('sword', 8), cast('ranger', 6)] });
  // and a gatherer at the crusher, the one who will take up her gear
  window.__deepCrew({ spare: 1 });
  window.__serpent({ stage: SERPENT_PHASES - 1, wound: 0 });
  window.__view('deep');
  window.__fast(12);
  window.__serpent({ stage: SERPENT_PHASES - 1, wound: 0 });
  const p = coilAt(bellySeg(), now());
  strike('punch', depthAt(SERPENT_PHASES - 1), p.x, p.y);
  if (phase === 'kill') { window.__fast(0.05); return; }
  const at = () => phase === 'after' ? S.beat.sheet === 'freedsheet' : S.finale && S.finale.phase === phase;
  for (let i = 0; i < 60 * 120 && !at(); i++) window.__fast(1 / 60);
  if (phase === 'after') { window.__skipBeat('sheet'); window.__fast(3); }
  for (let i = 0; i < into * 60; i++) window.__fast(1 / 60);
  window.__holdShot();
  // the walk's own camera would take it back on the page's next frame: held still
  if (onHouse) { S.still = true; S.camX = 0; clampCam(); }
};

// A yard past the snatch with her at the free first station, on the yard
// at the portal, and the way down taken with full motion for the one call
// that starts it (a headless browser asks for reduced motion, which makes the
// ripple a cut), run on to its tail.
function firstTrip() {
  rich();
  window.__fullSites();
  window.__crew(0, 4);
  window.__snatch({ played: true });
  for (let i = 0; i < 60 * 30 && S.workers.some(w => w.falling); i++) window.__fast(1 / 60);
  window.__view('yard');
  window.__look(portalX() - S.viewW / 2);
  const was = motionForcedNow();
  forceMotion(false);
  goDeep();
  forceMotion(was);
  for (let i = 0; i < 60 * 3 && S.viewFade < 0.75 && S.viewTo; i++) window.__fast(1 / 60);
}

// A glide caught at `k` of the way and held there (`poseGlide`): the first
// real frame after a long setup would otherwise carry it to its end before
// the shot.
const glideAt = (to, k) => () => {
  deepYard({ view: to === 'deep' ? 'yard' : 'deep', run: 2 });
  // A glide under reduced motion is a cut, and a headless browser asks for
  // reduced motion: full motion for the one call that starts it, and the
  // preference as it was straight after.
  const was = motionForcedNow();
  forceMotion(false);
  if (to === 'deep') goDeep(); else goUp();
  forceMotion(was);
  S.viewFade = k;
  poseGlide();
};

// Every prop on the floor (deep/props.js), four stations a scene, the most a
// party holds: a base unit's flag beside classes at rung 4 and rung 8, so
// one shot holds a prop plain and lit and the flag beside them. The serpent
// is left unwounded at the first stage so the ranged stay at their posts.
const PROP_SCENES = {
  'party-props-a': [{ kind: 'altar', cls: null, rung: 0 }, cast('brawler', 4), cast('sword', 8), cast('monk', 8)],
  'party-props-b': [cast('martial', 4), cast('ranger', 8), cast('assassin', 8), cast('hexer', 8)],
  'party-props-c': [cast('sapper', 8), cast('mage', 8), cast('bard', 8), cast('hexer', 4)],
  // the Mage's candle twice plain and twice lit, so the flames are seen out of step
  'party-props-mage': [cast('mage', 4), cast('mage', 4), cast('mage', 8), cast('mage', 8)]
};

const deepScenes = {
  snatch: { about: 'the deep', say: 'the snatch: the serpent up out of the abyss at the shaft, him in its jaws',
    run: snatchAt('rise', 13, true) },
  'snatch-take': { about: 'the deep', say: 'the snatch: the serpent going back under with him',
    run: snatchAt('take', 0, true) },
  // The portal in the abyss's surface (DESIGN.md, "Two crews and a portal"):
  // opening before the head comes up, and closing as she leaps in after him.
  'snatch-portal': { about: 'the deep', say: 'the snatch: the whirlpool opening in the surface',
    run: snatchAt('open') },
  'snatch-leap': { about: 'the deep', say: 'the snatch: the portal closing, and the sqwife leaping in after him',
    run: () => {
      snatchAt('close')();
      // The shot comes a second after the scene: the closing set back so the
      // second lands mid-leap, at the beat's own pace.
      S.snatch.hurry = 1;
      S.snatch.at = now() - (SNATCH_ALONE_MS + SNATCH_LEAP_MS * 0.4 - 1000);
    } },
  // The snatch behind it, the story's line sending the player to the wizards.
  aftersnatch: { about: 'the deep', say: 'the story\'s line after the snatch: talk to the wizards',
    run: () => { rich(); window.__fullSites(); window.__crew(0, 4); window.__snatch({ played: true, portal: false });
                 window.__answered('props', 'net', 'arch'); window.__meteor(); window.__view('yard'); window.__fast(2); } },
  // A wizard out over the middle of the pit, pouring the portal.
  'portal-pour': { about: 'the deep', say: 'a wizard over the pit, pouring the portal',
    run: () => { rich(); window.__fullSites(); window.__crew(0, 4); window.__snatch({ played: true, portal: false });
                 window.__answered('props', 'net', 'arch'); window.__meteor();
                 window.__wizardHat(1); window.__assign(JOB.WIZARD, 1); window.__view('yard');
                 window.__grant({ dust: 1e7 }); window.__fast(20); window.__buy('portal'); window.__fast(13); window.__look(portalX() - S.viewW / 2); } },
  // The wizards' portal, conjured and held open, the hand beside it.
  portal: { about: 'the deep', say: 'the wizards\' portal held open over the abyss, the way down',
    run: () => { rich(); window.__fullSites(); window.__snatch({ played: true });
                 window.__view('yard'); window.__look(portalX() - S.viewW / 2); } },
  // The same after a round trip through it: the hands have faded and gone.
  'portal-hand-gone': { about: 'the deep', say: 'the portal after the player has been down and back up: no hand beside it',
    run: () => { rich(); window.__fullSites(); window.__snatch({ played: true });
                 S.portalDown = S.portalRound = true; S.portalHand = 0;
                 window.__view('yard'); window.__look(portalX() - S.viewW / 2); } },
  // Its other end in the deep, hanging in the water, the hand under it.
  'deep-portal': { about: 'the deep', say: 'the portal\'s deep end, the way back up to the yard',
    run: () => { rich(); window.__fullSites(); window.__snatch({ played: true }); window.__view('deep'); } },
  // The first trip down (abyssintro.js): the way down taken, caught on the
  // ripple's tail, so the shot's second runs into the push onto the belly
  // and a capture stepped on from here has the whole scene.
  'abyss-intro': { about: 'the deep', say: 'the first trip down: the ripple ending, the camera about to push in on him in the cage',
    run: () => firstTrip() },
  // And after it: the scene played out, the camera handed back, her at her
  // station and the serpent's bar back.
  'abyss-intro-after': { about: 'the deep', say: 'after the first trip down: the scene played out, her at her station, the bar back',
    run: () => {
      firstTrip();
      for (let i = 0; i < 60 * 30 && !S.beatsDone.includes('abyss'); i++) window.__fast(1 / 60);
      window.__fast(0.5);
    } },
  'glide-up-in': { about: 'the deep', say: "going up, a third in: the deep drawing back into its end of the portal",
    run: glideAt('yard', 0.35) },
  // The deep with the whole yard shouting over its head: a boulder landed for
  // real a few frames ago (the shouts, and the knock the deep must not feel)
  // and half the yard's bodies squatting. None of it shows. The deep's camera
  // only looks up into the yard's lowest rows on a window taller than the
  // deep, so shoot it with `WINDOW=1600,1100`: at 800 by 600 it is a pass
  // whatever the drawing does.
  'deep-hush': { about: 'the deep', say: "the deep just after a boulder lands, the yard shouting and squatting: nothing of it shows, nothing shakes (WINDOW=1600,1100)",
    run: () => { rich(); window.__fullSites(); window.__crew(4, 4); window.__snatch({ played: true });
                 window.__view('deep');
                 window.__fast(2);
                 const was = S.landAt;
                 window.__next();
                 for (let i = 0; i < 600 && S.landAt === was; i++) window.__fast(1 / 60);
                 let n = 0;
                 for (const w of S.workers) if (w.y < S.worldH && n++ % 2) w.say = { mark: 'loo', until: now() + 60000 }; } },
  // A fresh deep: the free first station that stands from the snatch, her
  // Recruit at it, and a gatherer by the crusher.
  deep: { about: 'the deep', say: 'the deep, fresh: her Recruit at the free first station, him in its belly',
    run: stageScene(0, 0.33) },
  // The glide between the halves, caught at a point of it (`glideAt`): just
  // past the turn going down is the deep's side of the hand-over, and the
  // same point going up is the yard's side, so the two shots should be one
  // picture of the liquid.
  'glide-down-turn': { about: 'the deep', say: 'going down, just past the turn: the deep over the liquid, barely faded in',
    run: glideAt('deep', 0.52) },
  'glide-up-turn': { about: 'the deep', say: 'going up, just past the turn: the pit\'s liquid from the yard\'s side',
    run: glideAt('yard', 0.52) },
  'glide-down-in': { about: 'the deep', say: 'going down, a quarter in: the camera shifting onto the abyss',
    run: glideAt('deep', 0.25) },
  'glide-down-fade': { about: 'the deep', say: 'going down, the deep fading in over the water as the camera opens out',
    run: glideAt('deep', 0.8) },
  // The ends of it: the head and its slim neck, and the long taper of the tail.
  'serpent-head': { about: 'the deep', say: 'the serpent\'s head and the neck behind it',
    run: () => { deepYard({}); lookDeep(coilAt(4, now()).x + S.viewW * 0.25); } },
  'serpent-tail': { about: 'the deep', say: 'the serpent\'s tail, tapering to its tip',
    run: () => { deepYard({}); lookDeep(coilAt(COIL_SEGS - 8, now()).x); } },
  // The four defenses, each with fighters of the classes that suit it.
  'deep-wound': { about: 'the deep', say: 'the bare coil with the wound held most of the way open, a Brawler at it',
    run: stageScene(0, 0.87, [cast('brawler', 1)]) },
  'deep-warded': { about: 'the deep', say: 'the second defense: the ward shimmering over the scales, a Ranger\'s arrows in it',
    run: stageScene(1, 0.33, [cast('ranger', 2), cast('mage', 4)]) },        // the Mage the highest: it resists magic
  'deep-scout': { about: 'the deep', say: 'the Scout, the armory base unit at rung 0, shooting its arrow',
    run: () => { deepYard({ stage: 1, wound: 0.33, party: [cast('ranger', 0)] }); lookAtStation(0); } },
  'deep-split': { about: 'the deep', say: 'the third defense: the coil in lengths, a Sapper\'s charges bursting, a Hexer\'s hex on it',
    run: stageScene(2, 0.25, [cast('sapper', 4), cast('hexer', 4), cast('brawler', 6)]) },   // the Brawler the highest: plates
  'deep-barrier': { about: 'the deep', say: 'the barrier under the coil soaking up a Sapper\'s charges, the Sapper the highest rung',
    run: stageScene(2, 0.25, [cast('sapper', 6), cast('hexer', 4)]) },
  'deep-fading': { about: 'the deep', say: 'the fourth defense: the coil faded, a Mage\'s beam held on it',
    run: stageScene(3, 0.27, [cast('mage', 4), cast('monk', 4)]) },
  'deep-meal': { about: 'the deep', say: 'the window a moment short of a meal: the comb about to light for the nearest creature',
    run: mealScene(null) },
  'comb-timer': { about: 'the deep', say: 'halfway through the window: the comb, the meal\'s timer, half lit from the head',
    run: () => { mealScene(null)(); S.mealT = (windowS() - MEAL_LEAD_S + MEAL_WARN_S) / 2 - 1; } },
  'meal-bolts': { about: 'the deep', say: 'the meal bolts off the lit comb, the orb closed round the nearest creature',
    run: mealScene(() => MEAL_WARN_S + 0.3) },
  'meal-reel': { about: 'the deep', say: 'the meal orb hauled in on its bolts, halfway to the jaws',
    run: mealScene(g => REEL_AT(g) + 1.2) },
  'meal-gulp': { about: 'the deep', say: 'the shrunken orb going into the open jaws',
    run: mealScene(g => landAt(g) - MEAL_SWALLOW_S - MEAL_GULP_S + 0.15) },
  'meal-swallow': { about: 'the deep', say: 'the swallow running down the neck after the meal',
    run: mealScene(g => landAt(g) - MEAL_SWALLOW_S * 0.5, true) },
  'meal-land': { about: 'the deep', say: 'the lump landed at the belly, purple crosses rising off the body',
    run: mealScene(g => landAt(g) + 0.6, true) },
  // A phase's mechanic (deep/phases.js) caught at its moment: the turn set
  // `into` seconds short of the thing itself (negative: that far into it).
  'phase-taut': { about: 'the deep', say: 'the warning before the lash: the coil drawn up, its tail lifted',
    run: mechScene(2, 0.3, [cast('brawler', 8), cast('sword', 8)], COIL_SEGS - 8, true) },
  'phase-lash': { about: 'the deep', say: 'the lash running down the coil, melee fighters thrown off it',
    run: mechScene(2, -0.6, [cast('brawler', 8), cast('sword', 8)], Math.round(COIL_SEGS * 0.55), true) },
  'break-dive': { about: 'the deep', say: 'the first break: the coil stepping down under the floor',
    run: breakScene(1, 0.6, [cast('brawler', 4), cast('ranger', 4)]) },
  'break-rise': { about: 'the deep', say: 'back up from the first break in the ward: the bar refilling, the phase boxes coming up',
    run: breakScene(1, 2.9, [cast('brawler', 4), cast('ranger', 4)]) },
  'break-roar': { about: 'the deep', say: 'a later break: jaws wide, the bump halfway down, the new hide behind it',
    run: breakScene(2, 1.2, [cast('brawler', 8), cast('sword', 8)]) },
  'level-up': { about: 'the deep', say: 'a fighter just bought a rung: the abyssal corkscrew climbing round it',
    run: () => {
      stageScene(0, 0.3, [cast('ranger', 3), cast('brawler', 3)])();
      const st = S.stations[0], until = performance.now() + 4000;
      const hold = () => { if (performance.now() < until) { st.lvlAt = now() - 700; requestAnimationFrame(hold); } };
      hold();
      const w = S.workers.find(o => o.uid === st.fighter);
      if (w) lookDeep(w.x);
    } },
  'level-up-burst': { about: 'the deep', say: "the level-up's end: the corkscrew's tongues flown out as embers",
    run: () => {
      stageScene(0, 0.3, [cast('ranger', 3), cast('brawler', 3)])();
      const st = S.stations[0], until = performance.now() + 4000;
      const hold = () => { if (performance.now() < until) { st.lvlAt = now() - (LEVELUP_S + LEVELUP_BURST_S * 0.35) * 1000; requestAnimationFrame(hold); } };
      hold();
      const w = S.workers.find(o => o.uid === st.fighter);
      if (w) lookDeep(w.x);
    } },
  'phase-orb-warn': { about: 'the deep', say: 'the constrict coming: two seconds before the cast, the strongest fighter in frame',
    run: () => { mechScene(4, 2, [cast('brawler', 8), cast('ranger', 6), cast('mage', 4), cast('monk', 2)])();
                 const w = S.workers.find(o => o.station === S.stations[0].id); if (w) lookDeep(w.x); } },
  'phase-orb-cast': { about: 'the deep', say: 'the constrict: the comb lit, the bolts leaving it for the strongest fighter',
    run: () => { mechScene(4, -0.2, [cast('brawler', 8), cast('ranger', 6), cast('mage', 4), cast('monk', 2)])(); lookAtOrb(); } },
  'phase-orb': { about: 'the deep', say: 'the constrict: a fighter held in the orb, its bar over its head',
    run: () => { mechScene(4, -2, [cast('brawler', 8), cast('ranger', 6), cast('mage', 4), cast('monk', 2)])(); lookAtOrb(); } },
  'phase-sink': { about: 'the deep', say: 'the sink in the fading phase: the coil dimmed into the abyss under its veil',
    run: mechScene(3, -3, [cast('mage', 4), cast('monk', 4)]) },
  // Reading the fight: the numbers off the blows and the heal's purple `+`
  // off the belly, mid-fight, with a held beam's second summed.
  'deep-numbers': { about: 'the deep', say: 'the fight\'s numbers: each blow\'s damage rising off the coil, the heal\'s +N in purple',
    run: () => {
      deepYard({ stage: 1, wound: 0.5, run: 30,
                 party: [cast('brawler', 6), cast('ranger', 4), cast('sapper', 3), cast('mage', 2)] });
      window.__fast(2);
      window.__serpent({ stage: 1, wound: 0.5 * depthAt(1) });
      // Between the fists and the belly, so a narrow window has both the
      // blows' white and the heal's purple.
      const fist = S.hits.find(h => h.weapon === 'brawler');
      const belly = coilAt(bellySeg(), now()).x;
      lookDeep(fist ? (fist.x + belly) / 2 : belly);
    } },
  // Blows land (DESIGN.md, "Blows land: the burst and the stun"). A Ranger's
  // aimed shot at rung 8 stuns: the coil held, a ring running over its head,
  // the bar's pip held open, no `+` off the belly. The split coil, deep
  // enough that the arrows before the fifth do not break it.
  'deep-stun': { about: 'the deep', say: 'a Ranger\'s aimed shot has stunned the coil: held still, a ring over its head, the heal stopped',
    run: () => {
      deepYard({ stage: 2, wound: 0.25, party: [cast('ranger', 8)] });
      for (let i = 0; i < 60 * 30 && !(S.serpentStun > 0); i++) window.__fast(1 / 60);
      // On the head, where the ring stands, as serpent-head frames it.
      lookDeep(coilAt(4, now()).x + S.viewW * 0.25);
    } },
  // Three blows just landed on the split coil, no stun left over so the
  // bites are read on a coil at its sway: a Brawler's blow out of the top
  // edge with its scales bursting up, a Sapper's charge from under, and a
  // click on the top edge, the smallest.
  'deep-chip': { about: 'the deep', say: 'fresh bites out of the hide -- a Brawler\'s, a Sapper\'s, a click\'s -- and the scales bursting off them',
    run: () => {
      deepYard({ stage: 2, wound: 0.25, party: [cast('brawler', 8)] });
      const t = now(), seg = i => coilAt(bellySeg() + i, t);
      const blow = seg(-9), burst = seg(-3), fist = seg(3);
      strike('brawler', rungValue('brawler', 8) * 4, blow.x, blow.y);
      strike('sapper', rungValue('sapper', 8) * 3, burst.x, burst.y, {});
      clickDeep(fist.x, fist.y - P);
      S.serpentStun = S.serpentGrace = 0;
      lookDeep(seg(-3).x);
    } },
  // The crusher at the deep's left end, haulers lent down to it carrying the
  // floor's scales and tossing them over the lip.
  crusher: { about: 'the deep', say: 'the crusher: gatherers tossing scales into the hopper, the fire burning up',
    run: () => {
      deepYard({ spare: 3, loose: 900, run: 12 });
      window.__look(deepX0());   // the deep's left end, where the card stands clear of the furnace
    } },
  // Your hand in the deep: a handful swept off the floor beside the crusher
  // and held over the furnace's door, on the pointer as the yard's dust is.
  'deep-grab': { about: 'the deep', say: 'a handful of scales off the floor, held on the pointer over the furnace',
    run: () => {
      deepYard({ run: 4 });
      window.__looseScales(2500);
      window.__levels({ carryLevel: 6 });
      const c = crusherRect();
      S.dragging = true;
      for (let i = 0; i < 6; i++) sweep(c.x + c.w + P * (6 + i * 2), deepFloor() - P);
      S.mouse = { x: c.x + c.w / 2, y: c.y + c.h * 0.6 };
      window.__look(deepX0());   // the deep's left end, where the card stands clear of the furnace
    } },
  // A storm over the yard and a strike at its flash while the view is in the
  // deep: under the water none of it shows.
  'deep-storm': { about: 'the deep', say: 'the deep while the yard has a storm and a strike: no rain, no flash',
    run: () => {
      deepYard({});
      untilRaining();
      window.__fast(14);
      window.__strike(9, 9);
    } },
  // The floor thick with scales and the gatherers at work on it.
  gathering: { about: 'the deep', say: 'gatherers scooping the floor\'s loose scales, loads overhead',
    run: () => {
      deepYard({ spare: 3, loose: 2500, run: 6 });
      lookDeep(slotAt(0));
    } },
  // The deep's crew at rest: six hands on no station by the crusher on a
  // bare floor, strolling, floating and hopping about its ground
  // (deep/rest.js). A still catches each in its own phase; shoot it again for
  // others.
  'deep-rest': { about: 'the deep', say: 'the deep\'s crew at rest: gatherers on a bare floor, strolling, floating, hopping',
    run: () => {
      deepYard({ spare: 6, run: 30 });
      window.__look(deepX0());   // the deep's left end, where the card stands clear of the furnace
    } },
  // The pods between the crusher and the stations, a stack of them, some of
  // their people home.
  pods: { about: 'the deep', say: 'the pods: the deep\'s houses, stacked between the crusher and the stations',
    run: () => {
      deepYard({ run: 2 });
      for (let i = 0; i < 7; i++) { window.__scales(99999); window.__buy('pod'); window.__finish(); }
      window.__fast(4);
      lookDeep(spotX('pods') - S.viewW * 0.2);
    } },
  // The pods' own board up over them, the next pod priced in scales.
  'pods-board': { about: 'the deep', say: 'the pods\' board: another pod, priced in scales',
    run: () => {
      deepYard({ run: 2 });
      window.__scales(99999);
      lookDeep(spotX('pods'));
      window.__board('pods');
    } },
  // A station just built: its Recruit at work, and its board asking the first
  // choice, the Recruit's own tree with the Scout looked at (voted R2).
  'recruit-board': { about: 'the deep', say: 'a new station: its Recruit at work, its board asking which fighter it becomes',
    run: () => {
      deepYard({ stage: 1, run: 2, party: [{ kind: null }] });
      window.__scales(99999);
      lookAtStation(0);
      lookAt(S.stations[0].id, 'armory');
      window.__board(S.stations[0].id);
    } },
  // A Recruit's light punch, up under the coil over its new station.
  'recruit': { about: 'the deep', say: 'a Recruit up under the coil, throwing its one light punch',
    run: () => {
      deepYard({ stage: 1, wound: 0.33, run: 3, party: [{ kind: null }] });
      lookAtStation(0);
    } },
  // The mark over a station whose Recruit waits on its first choice, the
  // build's done check already read.
  'recruit-mark': { about: 'the deep', say: "the hand over a new station whose Recruit waits on its first choice",
    run: () => {
      deepYard({ stage: 1, wound: 0.33, run: 3, party: [{ kind: null }] });
      markDoneSeen(S.stations[0].id);
      lookAtStation(0);
    } },
  // A Fighter at the fork: each specialist's row with its move and capstone.
  'fork-board': { about: 'the deep', say: "the Fighter's board at the fork: each specialist's move and capstone, statuses named",
    run: () => {
      deepYard({ stage: 1, run: 2, party: [{ kind: 'altar', cls: null, rung: 3 }] });
      window.__scales(99999);
      lookAtStation(0);
      window.__board(S.stations[0].id);
    } },
  // A station's board with a class taken: the rail climbed, the other folded.
  'armory-board': { about: 'the deep', say: 'the armory\'s board: a Ranger three rungs up her rail, the Assassin\'s folded away',
    run: () => {
      deepYard({ stage: 1, run: 2, party: [cast('ranger', 3)] });
      window.__scales(99999);
      lookAtStation(0);
      window.__board(S.stations[0].id);
    } },
  // Her at the first station in the deep, dressed in the deep's inks, a
  // second station beside her.
  'pair-deep': { about: 'the deep', say: 'her at the first station, dressed, in the deep',
    run: () => {
      deepYard({ stage: 0, wound: 0.33, party: [cast('sword', 2), cast('ranger', 2)] });
      // the hooks' party seats whoever is spare; in play the snatch seats her
      namePair('sqouse', S.workers.find(w => w.uid === S.stations[0].fighter));
      lookAtStation(0);
    } },
  // The kill's meeting on the deep's floor: him out of the belly and walked
  // to her, both dressed in the deep's inks, cheering.
  'pair-meet': { about: 'the deep', say: 'him out of the belly beside her on the deep floor, both dressed',
    run: () => {
      deepYard({ stage: SERPENT_PHASES - 1, party: [cast('sword', 8)] });
      namePair('sqouse', S.workers.find(w => w.uid === S.stations[0].fighter));
      window.__serpent({ stage: SERPENT_PHASES });
      for (let i = 0; i < 60 * 60 && !(freedBody() && freedBody().cheering); i++) window.__fast(1 / 60);
      const him = freedBody();
      if (him) lookDeep(him.x);
    } },
  // The same with an aura on each (render/wardaura.js): the rain cloud on
  // you, the most rects, and the embers on your sqouse, the only purple, for
  // the deep's palette check; `window.__auras` ({ you, sqouse }) to try others.
  'pair-deep-aura': { about: 'the deep', say: 'the two of them on the deep floor in a rain cloud and embers',
    run: () => {
      SCENES['pair-meet'].run();
      const a = window.__auras || {};
      wear('you', { aura: a.you || 'rain-cloud' }); wear('sqouse', { aura: a.sqouse || 'embers' });
      window.__fast(1);
    } },
  // The meeting in the gold set, and in the lamp, for the deep's palette
  // check (gold is the one hue it lets in) and the light on the black.
  'pair-deep-gold': { about: 'the deep', say: 'the two of them on the deep floor in the gold set',
    run: () => {
      SCENES['pair-meet'].run();
      wear('you', { head: 'gold-crown', aura: 'gold-halo' }); wear('sqouse', { neck: 'gold-scarf', back: 'gold-cape' });
      window.__fast(1);
    } },
  'pair-deep-lamp': { about: 'the deep', say: 'the two of them on the deep floor, you in the lamp, its light on the black, your sqouse in the comb',
    run: () => {
      SCENES['pair-meet'].run();
      wear('you', { head: 'lamp' }); wear('sqouse', { head: 'serpent-comb' });
      window.__fast(1);
    } },
  // The same, in everything the wardrobe draws in its greys, for the deep's
  // palette check: the checked scarf, the freckles, over a filled pattern (its
  // greys the pale).
  'pair-deep-greys': { about: 'the deep', say: 'her at the first station in the wardrobe greys, in the deep',
    run: () => {
      deepYard({ stage: 1, wound: 0.33, party: [cast('sword', 2), cast('ranger', 2)] });
      namePair('sqouse', S.workers.find(w => w.uid === S.stations[0].fighter));
      wear('sqouse', { head: 'crown', face: 'freckles', neck: 'checked-scarf', back: 'cape', pattern: 'filled' });
      lookAtStation(0);
    } },
  // Every station the floor holds at once, the camera on the middle of them.
  'deep-all': { about: 'the deep', say: 'the whole deep floor, four stations standing, a fighter at each',
    run: () => {
      deepYard({ stage: 1, wound: 0.33,
                 party: [cast('brawler', 2), cast('ranger', 2), cast('sapper', 2), cast('mage', 2)] });
      lookDeep((slotAt(0) + slotAt(3)) / 2);
    } },
  // The swell (render/deepwave.js): the clock turned on to just before the
  // next medium or strong wave's middle reaches the window's middle, a
  // second's run of the shot tool short of it (`window.__waveLead` seconds
  // ahead, for a film from further off).
  'deep-wave': { about: 'the deep', say: 'a wave of the swell about to cross the window\'s middle, pushing the stars and silt right',
    run: () => {
      deepYard({ stage: 1, wound: 0.33,
                 party: [cast('brawler', 2), cast('ranger', 2), cast('sapper', 2), cast('mage', 2)] });
      lookDeep((slotAt(0) + slotAt(3)) / 2);
      const lead = window.__waveLead ?? 1.3, mid = (S.camX + S.viewW / 2) / P;
      const w = nextWave(mid, now() / 1000 + lead, 1);
      if (w) advance(w.at * 1000 - lead * 1000 - now());
    } },
  'deep-seven': { about: 'the deep', say: 'every slot on the deep floor taken: three, the middle one, three',
    run: () => {
      deepYard({ stage: 1, wound: 0.33,
                 party: [cast('brawler', 2), cast('ranger', 2), cast('sapper', 2), cast('mage', 2),
                         cast('hexer', 2), cast('monk', 2), cast('bard', 2)] });
      lookDeep((slotAt(0) + slotAt(3)) / 2);
    } },
  // The deep's full height: the zones' tint and their creatures from the
  // portal down to the floor, a fight on, the camera on the deep's middle.
  'deep-zones': { about: 'the deep', say: 'the deep top to bottom: three swimmers taking turns through every kind, each wandering the whole height',
    run: () => {
      deepYard({ stage: 1, wound: 0.33,
                 party: [cast('brawler', 2), cast('ranger', 2), cast('sapper', 2), cast('mage', 2)] });
      lookDeep(deepX0() + DEEP_W / 2);
    } },
  // Creatures darting from a lash and from a break (DESIGN.md, "The deep's
  // zones"): the scene stops just before the fright, the camera on the
  // coil's middle, so a still-driven film shows the water at rest, the
  // scare, and the creatures easing home.
  'deep-scatter-lash': { about: 'the deep', say: 'the lash a half second off, the coil in frame, the creatures round it about to dart',
    run: () => {
      deepYard({ stage: 2, wound: 0.3, party: [cast('brawler', 2), cast('ranger', 2)] });
      S.mechAt = MECHANICS[2].every - MECHANICS[2].last - 0.55;
      lookDeep(coilAt(Math.round(COIL_SEGS * 0.5), now()).x);
    } },
  'deep-scatter-break': { about: 'the deep', say: 'a defense a hair from breaking, the coil in frame, the creatures round it about to scatter',
    run: () => {
      deepYard({ stage: 1, wound: 0.3, party: [cast('brawler', 2), cast('ranger', 2)] });
      S.serpentWound = depthAt(1) - 0.01;
      lookDeep(coilAt(Math.round(COIL_SEGS * 0.5), now()).x);
    } },
  // A creature's reaction to a click (the owner's picks,
  // docs/mocks/creature-clicks-2026-10-13.html), held at its moment: a zone
  // kind's by name.
  ...Object.fromEntries(Object.entries(REACT_AT).map(([kind, at]) => [`deep-react-${kind}`, {
    about: 'the deep', say: `a ${kind} clicked, ${at}s into its reaction`,
    run: () => reactScene(() => window.__fauna().find(f => f.kind === kind && f.inside && !f.bolting && !f.reacting
                                                          && f.cx > 0 && f.cx < DEEP_W / P - 12 && clearOfCoil(f.x, f.y, 16)),
                          f => startleFauna(f.x, f.y), at, f => window.__fauna()[f.i], kind) }])),
  ...Object.fromEntries(Object.entries(PROP_SCENES).map(([name, party]) => [name, {
    about: 'the deep', say: `four stations' props: ${party.map(o => (o.cls || 'flag') + ' ' + o.rung).join(', ')}`,
    run: () => {
      deepYard({ stage: 0, run: 4, party });
      lookDeep((slotAt(0) + slotAt(3)) / 2);
    } }])),
  // A station going up down there: a delver at the first slot, the silt off
  // each blow sinking back to the floor. The pick is the build button's.
  'deep-build': { about: 'the deep', say: 'a delver hammering at the altar going up, silt stirred up off each blow',
    run: () => {
      deepYard({ stage: 1, run: 2 });
      buildStation('altar');
      for (let i = 0; i < 60 * 120 && !S.workers.some(w => w.type === TYPE.DELVE && w.jigAt != null
                                                       && w.y > S.groundY); i++) window.__fast(1 / 60);
      window.__fast(1);
      lookDeep(slotAt(0));
    } },
  // The kill as it plays (snatch.js, config KILL), each moment held for the shot.
  'deep-kill-start': { about: 'the deep', say: 'the kill: the last blow, just landed', run: killAt(0.05) },
  'deep-kill': { about: 'the deep', say: 'the kill: the serpent limp, sinking to the floor', run: killAt(KILL.last + KILL.limp * 0.6) },
  'deep-kill-apart': { about: 'the deep', say: 'the kill: the hide coming apart into motes, tail first', run: killAt(KILL.last + KILL.limp + KILL.apart * 0.5) },
  'deep-kill-out': { about: 'the deep', say: 'the kill: him out on the floor, walking to her', run: killAt(KILL.last + KILL.limp + KILL.apart + 1) },
  'deep-kill-reform': { about: 'the deep', say: 'after the kill: the serpent gathering itself again, head first', run: killAt(null) },
  // The endless serpent (DESIGN.md, "Endless serpent"): six bars emptied
  // past the story's, on its last defense, its level after the bar, with no
  // pips and no cage of ribs at the belly.
  'deep-endless': { about: 'the deep', say: 'the serpent at level 7: on its last defense, its level after the bar, no pips, no ribs',
    run: () => {
      deepYard({ level: 7, wound: 0.4,
                 party: [cast('brawler', 6), cast('ranger', 6), cast('sapper', 5), cast('mage', 5)] });
      lookDeep(coilAt(bellySeg(), now()).x);
    } },
  // A level-25 serpent's numbers, said short: the constrict nearly broken
  // when its window runs out, so the meal's heal reads +16xk under the belly
  // and the blows over it read in k.
  'deep-endless-25': { about: 'the deep', say: 'the serpent at level 25: its heal under the belly said short, +16xk, the blows in k',
    run: () => {
      deepYard({ level: 25, stage: SERPENT_PHASES - 1, wound: 0.9, run: 10,
                 party: [cast('brawler', 8), cast('ranger', 8), cast('sapper', 8), cast('mage', 8)] });
      for (let i = 0; i < 60 * 60; i++) {
        window.__fast(1 / 60);
        if (S.hits.some(h => h.weapon === 'heal')) break;
        // held short of breaking, so the window runs out on a deep wound; never
        // pulled back while stunned, since a stunned serpent does not heal
        // (verify.js)
        const d = depthAt(SERPENT_PHASES - 1);
        if (S.serpentWound < 0.85 * d || (S.serpentWound > 0.95 * d && !(S.serpentStun > 0))) S.serpentWound = 0.9 * d;
      }
      window.__fast(0.2);
      lookDeep(coilAt(bellySeg(), now()).x);
      // held, the page's own frames too: the heal's number is under the belly
      // for under a second before it goes into the bar
      window.__holdShot();
      S.still = true;
    } },
  // The return, once: the story's sheet put down, the serpent gathered
  // again, at level 2 on its last defense.
  'deep-endless-rise': { about: 'the deep', say: 'after the story\'s kill, the serpent back: level 2 on its last defense, no pips, no ribs',
    run: killAt(null, KILL_REFORM_S + 0.6) },
  // A level's bar emptied: the near-death (the cracks run, the brink, the
  // light coming through), the power-up's motes, and the next level at rest.
  'deep-neardeath-cracks': { about: 'the deep', say: 'a level\'s bar emptied: out of the rear, the cracks run over the whole body, the head down',
    run: () => recoilAt(REAR_S + NEARDEATH.crack - 0.02) },
  'deep-neardeath-brink': { about: 'the deep', say: 'on the brink: crazed snout to tail, the focus lines closed in to their last step',
    run: () => recoilAt(BRINK_S + NEARDEATH.brink - 0.02) },
  'deep-neardeath-light': { about: 'the deep', say: 'the light comes through: the cracks lit from the belly out, the lines purple, the first motes crossing',
    run: () => recoilAt(POWER_S + POWERUP.lightStep * (POWERUP.lightSteps - 1) + 0.01) },
  'deep-powerup-motes': { about: 'the deep', say: 'the deep drawn in: motes crossing to the hide, the coil wound tight, level 4 and the bar a notch a mote',
    run: () => recoilAt(POWER_S + POWERUP.len * 0.55) },
  'deep-powerup-done': { about: 'the deep', say: 'just past it: level 4, the bar full, the coil whole and at rest',
    run: () => recoilAt(POWER_S + POWERUP.len + POWERUP.letGo + 0.25) },
  // The finale (finale.js), a moment of each of its parts.
  'finale-kill': { about: 'the deep', say: 'the finale from the top: a full yard, the last blow just landed', run: finaleAt('kill') },
  'finale-gear': { about: 'the deep', say: 'the finale: her gear going back onto her station in held steps, him beside her', run: finaleAt('hang', 0.4) },
  'finale-heir': { about: 'the deep', say: "the finale: one of the deep's crew taking up her gear at the station", run: finaleAt('heir', 0.2) },
  'finale-portal': { about: 'the deep', say: 'the finale: the two of them at the portal, the ring ringing out', run: finaleAt('ring', 0.35) },
  'finale-parade': { about: 'the deep', say: 'the finale: the walk down the yard, the crew falling in behind, hopping, fireworks', run: finaleAt('walk', 14) },
  'finale-build': { about: 'the deep', say: "the finale: the builders putting the house up at the yard's end while the pair walk", run: finaleAt('walk', 16, true) },
  'finale-arrive': { about: 'the deep', say: 'the finale: the pair at the door of the finished house, the crowd behind', run: finaleAt('arrive', 0.3) },
  'finale-door': { about: 'the deep', say: 'the finale: the door open on the lit room, her going in', run: finaleAt('in', 1.2) },
  'finale-light': { about: 'the deep', say: 'the finale: the door shut, the window lit, the heart over the house', run: finaleAt('light', 0.6) },
  'finale-after': { about: 'the deep', say: 'after the finale: the two of them come out of the house to the bench', run: finaleAt('after', 1.2) },
  'finale-after-bench': { about: 'the deep', say: 'after the finale: the two of them sat on the bench by the door, for good', run: finaleAt('after', 6) },
  'finale-after-casino': { about: 'the deep', say: "after the finale: the house and its bench at the yard's left end, clear of the open casino",
    run: () => { finaleAt('after', 6)(); window.__casino(true); S.still = true; S.camX = 0; clampCam(); } },
  // The fourth break: the belly open and him coming out of it.
  'deep-freed': { about: 'the deep', say: 'the fourth break: the belly open and him swimming out',
    run: () => {
      deepYard({ stage: SERPENT_PHASES - 1, party: [cast('brawler', 8), cast('mage', 8)] });
      window.__serpent({ stage: SERPENT_PHASES });
      for (let i = 0; i < 60 * 30 && S.beat.yard !== 'freed'; i++) window.__fast(1 / 60);
      window.__fast(1.5);
      lookDeep(coilAt(bellySeg(), now()).x);
    } },
  // Going down, a fifth of the way through the glide: the camera closing on
  // the surface at the shaft, the frame darkening. Held there, from the
  // first frame the page draws, since a glide is the page's clock as well.
  'deep-glide': { about: 'the deep', say: 'the glide down: the camera closing on the surface, going dark', page: true,
    run: () => {
      deepYard({ view: 'yard', run: 2 });
      window.__motion(false);
      window.__look(mouthX() - S.viewW / 2);
      requestAnimationFrame(() => {
        goDeep();
        const hold = () => { if (S.viewTo) { S.viewFade = 0.22; requestAnimationFrame(hold); } };
        hold();
      });
    } },

  // --- wave party: STATE ---
  // The party (docs/wave-party.md), each stood up by `__party` and run until
  // the fighters are at work.
  // Just after the snatch: no station, the build button over the first slot
  // offering the three starting kinds, the sqwife treading water.
  'party-start': { about: 'the deep', say: 'just after the snatch: no station yet, the build button over the first slot',
    run: () => { deepYard({ run: 4 }); lookDeep(slotAt(freeSlot())); } },
  'party-one': { about: 'the deep', say: 'one station: a Brawler at the altar, four rungs up, her Haymaker open',
    run: () => { deepYard({ party: [cast('brawler', 4)] }); lookAtStation(0); } },
  'party-four': { about: 'the deep', say: 'a full party: a Brawler, a Ranger, a Sapper and a Mage, each at rung 8',
    run: () => {
      deepYard({ stage: 1, wound: 0.33, run: 30,
                 party: [cast('brawler'), cast('ranger'), cast('sapper'), cast('mage')] });
      lookDeep((slotAt(0) + slotAt(3)) / 2);
    } },
  // `crew-sight` in the deep: the deep's own layers veil and ring its bodies.
  'deep-sight': { about: 'the deep', say: 'the right button held in the deep: the water veiled behind the crew, each body ringed',
    run: () => {
      deepYard({ stage: 1, wound: 0.33, run: 30, party: [cast('brawler'), cast('ranger')] });
      lookDeep((slotAt(0) + slotAt(1)) / 2);
      S.crewSight = 0;
      window.__holdShot();
    } },
  // Anthem is the Bard's rung 4; the Ranger is the fighter she lifts.
  'party-bard': { about: 'the deep', say: 'a Bard singing her Anthem over a Ranger, the Ranger\'s shots Inspired',
    run: () => { deepYard({ party: [cast('ranger', 4), cast('bard', 4)] }); lookAtStation(1); } },
  // A phase broken for real by a fighter, and the fang it drops caught
  // sinking before a gatherer carries it.
  'party-fang': { about: 'the deep', say: 'a fang sinking through the water after a break',
    run: () => {
      deepYard({ party: [cast('brawler', 8)] });
      window.__serpent({ stage: 0, wound: Math.max(0, depthAt(0) - 1) });
      for (let i = 0; i < 60 * 60 && !S.fangsLoose.length; i++) window.__fast(1 / 60);
      window.__fast(0.4);
      const f = S.fangsLoose[0];
      lookDeep(f && Number.isFinite(f.x) ? f.x : coilAt(bellySeg(), now()).x);
    } },
  // The altar's board up with no class taken: the pip tree, blank, over the
  // Fighter's first row.
  'party-rails': { about: 'the deep', say: 'the altar\'s board at rung 0: the pip tree over the Fighter\'s first row',
    run: () => {
      deepYard({ run: 2, party: [{ kind: 'altar', cls: null, rung: 0 }] });
      window.__scales(99999);
      lookAtStation(0);
      window.__board(S.stations[0].id);
    } },
  // The same board at the fork: the base unit's three pips lit, and a row a
  // class under "choose a path".
  'party-fork': { about: 'the deep', say: 'the altar\'s board at the fork: choose a path, Brawler or Swordsman',
    run: () => {
      deepYard({ run: 2, party: [{ kind: 'altar', cls: null, rung: FORK_RUNG - 1 }, { kind: 'spire', cls: null, rung: 0 }] });
      window.__scales(99999);
      lookAtStation(0);
      window.__board(S.stations[0].id);
    } },
  // The build button pressed: an empty lot staked out at the first slot and
  // its board asking what goes up there.
  'party-lot': { about: 'the deep', say: 'an empty lot, its board asking what goes up there',
    run: () => {
      deepYard({ run: 2 });
      lookDeep(slotAt(freeSlot()));
      pressBuildButton();
    } },
  'party-button': { about: 'the deep', say: 'a fang held: the build button over the next free slot, wearing the fang\'s mark',
    run: () => { deepYard({ party: [cast('brawler', 2)], fangs: 1, run: 6 }); lookDeep(slotAt(freeSlot())); } },
  // The plate in the furnace's brick over the door: the fangs held (FANG_PLATE).
  'fang-plate': { about: 'the deep', say: 'two fangs held: the plate over the furnace\'s door reads fang x 2',
    run: () => { deepYard({ party: [cast('brawler', 2)], fangs: 2, run: 6 }); window.__look(deepX0()); } },
  // The last fang spent on a station: the plate stays, its words in the mortar's grey.
  'fang-plate-none': { about: 'the deep', say: 'the last fang spent: the plate over the door dimmed at x 0',
    run: () => {
      deepYard({ party: [cast('brawler', 2)], fangs: 1, run: 4 });
      pressBuildButton();
      window.__fast(2);
      window.__look(deepX0());
    } },
  // A fang carried to the hopper, a moment from going in: the plate's count
  // cross-fades up and its frame catches the light (a GIF's opening frame).
  'fang-plate-arrive': { about: 'the deep', say: 'a fang carried to the furnace: the plate counts it, its frame catching the light',
    run: () => {
      deepYard({ party: [cast('brawler', 8)], fangs: 1 });
      window.__serpent({ stage: 0, wound: Math.max(0, depthAt(0) - 1) });
      // carried, a few seconds short of the hopper
      const c = crusherRect(), near = f => f.held && f.x < c.x + c.w + P * 30;
      for (let i = 0; i < 90 * 60 && !S.fangsLoose.some(near); i++) window.__fast(1 / 60);
      window.__look(deepX0());
    } },
  // Every status the serpent can wear, at once: a Swordsman's Bleeding, a
  // Sapper's Exposed, a Hexer's Weakened and Held, laid long so the shot
  // catches all four whatever the fighters' timing.
  'party-statuses': { about: 'the deep', say: 'the serpent wearing every status at once: Bleeding, Exposed, Held',
    run: () => {
      deepYard({ stage: 2, wound: 0.25, party: [cast('sword', 4), cast('sapper', 4), cast('hexer', 8)] });
      for (const [key, k] of [['bleed', 0.5], ['exposed', 0.25], ['held', 1]]) lay(key, k, 30);
      lookDeep(coilAt(bellySeg() - 4, now()).x);
    } },
  // A station going up, half built: its scaffold at the second slot, the
  // delver at it, a Brawler fighting at the first.
  'party-scaffold': { about: 'the deep', say: 'a station mid-build: its scaffold at the next slot, a delver at work on it',
    run: () => {
      deepYard({ stage: 1, wound: 0.33, run: 4, party: [cast('brawler', 2)], fangs: 1 });
      buildStation('spire');
      const w = () => worksAt(S.stations[1]?.id)[0];
      for (let i = 0; i < 60 * 180 && !(w() && progressOf(w()) >= 0.5); i++) window.__fast(1 / 60);
      lookDeep(slotAt(S.stations[1].slot));
    } },
  // Each class at its capstone, alone but for the Bard, who needs somebody to
  // sing to and gets a Brawler.
  ...Object.fromEntries(Object.keys(CLASSES).map(cls => [`class-${cls}`, {
    about: 'the deep', say: `a ${CLASSES[cls].name} at rung 8: the kit, the rung-4 mark, the rung-8 touch, the attack`,
    run: () => {
      deepYard({ stage: 1, wound: 0.33, party: cls === 'bard' ? [cast('bard'), cast('brawler')] : [cast(cls)] });
      lookAtStation(0);
    } }]))
};

const rescueSheet = on => () => {
  window.__reset();
  window.__crew(2, 1);
  window.__serpentOn(on);
  // drowned, so with the half on the snatch follows the sheet
  if (on) window.__rift();
  S.rescued = true; S.buried = false; S.buriedMs = 20 * 60 * 1000;
};

export const SCENES = {
  // --- the story --------------------------------------------------------------
  opening: { about: 'the story', say: 'the intro, from the top',
    run: () => window.__reset(true) },
  // The first step's checklist under its line, the first item ticked.
  storyquest: { about: 'the story', say: "the story's card on the first step, its checklist one item in",
    run: () => { window.__reset(); S.handChipped = true; S.seenDrag = false; S.banked = 0; window.__fast(1); } },
  leaving: { about: 'the story', say: 'the opening, the pair walking out of the house',
    run: () => window.__reset(true) },
  reunion: { about: 'the story', say: 'the first rock mined out, and somebody comes over',
    run: () => { window.__reset(); window.__crew(1, 0); window.__give(50); window.__next(); } },
  // The rescue's sheet, as the story leaves it: the sqwife out after twenty
  // minutes under, with the second half following it or not (ending.js).
  'rescue-sheet': { about: 'the story', say: 'the rescue sheet, with the second half on: the story goes on',
    run: rescueSheet(true) },
  'rescue-sheet-off': { about: 'the story', say: 'the rescue sheet, with the second half off: the end of the story',
    run: rescueSheet(false) },
  digging: { about: 'the story', say: 'between rocks, somebody digging at the one in the ground',
    run: () => { window.__reset(); window.__crew(3, 1); window.__jump(3); window.__next(); window.__fast(1.2); window.__look(S.cx - S.viewW / 2); } },
  landing: { about: 'the story', say: 'the second rock coming down on a yard with a crew',
    run: () => { window.__reset(); window.__crew(2, 1); window.__next(); } },
  // The first rock's landing hops nobody (the opening owns that beat,
  // `landRock`), so rock two is stood and cleared and rock three comes down
  // on the dance. The shot tool runs a second of yard after a scene and the
  // whole fall is shorter than that, so this stops before the rock is let go,
  // with a second less half a hop less the fall (`dropMs`) of dance left: the
  // frame shot has every body at the peak.
  'landing^': { about: 'the story', say: 'a rock down on a yard with a crew, caught at the top of the hop',
    run: () => {
      window.__reset(); window.__crew(2, 1); window.__jump(2); window.__next();
      // The dance is called on the frame after the rock goes.
      for (let i = 0; i < 60 && !(S.danceUntil > now()); i++) window.__fast(1 / 60);
      const lead = 1000 - LAND_HOP_MS / 2 - dropMs();
      for (let i = 0; i < 600 && S.rockFall <= 0 && S.danceUntil - now() > lead; i++) window.__fast(1 / 60);
    } },
  // The beat the view eases back out over: with the full picture the view is
  // still on its way; under reduced motion it is already the yard's framing.
  // The first rock halfway down: the one it is coming down on is still stood
  // there, and the other is already in the air. The whole fall is shorter than
  // the second the shot tool runs after a scene, so this stops in the chat,
  // with a second less half the fall (`dropMs`) of talking left.
  introfall: { about: 'the story', say: 'the opening, the first rock on its way down',
    run: () => {
      window.__motion(false); window.__reset(true);
      for (let i = 0; i < 1800 && S.beat.yard !== 'chat'; i++) window.__fast(1 / 60);
      const lead = 1000 - dropMs() / 2;
      for (let i = 0; i < 900 && INTRO_CHAT_MS - (now() - S.introAt) > lead; i++) window.__fast(1 / 60);
    } },
  introup: { about: 'the story', say: 'the opening, the one left standing getting up',
    run: () => { window.__motion(false); window.__reset(true); window.__fast(12.5); } },
  introstill: { about: 'the story', say: 'the same beat under reduced motion',
    run: () => { window.__motion(true); window.__reset(true); window.__fast(12.5); } },
  introshow: { about: 'the story', say: 'the opening, the loop being shown',
    run: () => { window.__motion(false); window.__reset(true); window.__fast(18); } },
  introshowstill: { about: 'the story', say: 'the loop shown, under reduced motion',
    run: () => { window.__motion(true); window.__reset(true); window.__fast(18); } },

  // --- the rock ---------------------------------------------------------------
  rock: { about: 'the rock', say: 'the hill, and the ram driving into it',
    run: () => { rich(); window.__buy('ram'); window.__finish(); window.__jump(6);
                 window.__look(st().rockLeftX - 200); } },
  // The ram's cutter wheel, framed for `--zoom 4`: boring into the face, and
  // parked with its tender taken off, the wheel standing still.
  ramwheel: { about: 'the rock', say: 'the ram boring into the face, its cutter wheel turning',
    run: () => { rich(); window.__buy('ram'); window.__finish(); window.__jump(6);
                 for (let i = 0; i < 1800 && now() - (S.machines.ram.workedAt || 0) > 100; i++) window.__fast(1 / 60);
                 window.__fast(0.4);
                 window.__look(ramX() + P * 15 - S.viewW / 2); window.__holdShot(); } },
  ramparked: { about: 'the rock', say: 'the ram parked off the face, idle, its wheel still',
    run: () => { rich(); window.__buy('ram'); window.__finish(); window.__jump(6); window.__fast(4);
                 window.__crew(0, 0, 0); window.__machine('ram', { bought: true }); window.__fast(3);
                 window.__look(ramX() + P * 15 - S.viewW / 2); } },
  // The clearance between the hut's wall and a parked ram at a big boulder is
  // the one thing about this layout arithmetic cannot settle.
  shack: { about: 'the rock', say: 'the shack beside a big rock, the ram parked',
    run: () => { rich(); window.__kit({ breakers: 3 }); window.__shack(); window.__buy('ram');
                 window.__finish(); window.__jump(8); window.__fast(6); window.__look(st().shackX - 400); } },
  // A ram strike rung queued: its glyph floats over the shack, not the boulder.
  ramrung: { about: 'the rock', say: 'a ram strike rung in line: its glyph over the shack',
    run: () => { rich(); window.__kit({ breakers: 3 }); window.__shack(); window.__buy('ram');
                 window.__finish(); window.__jump(8); window.__fast(6); window.__buy('tuneram');
                 window.__fast(0.5); window.__look(st().shackX - 400); } },
  // Mined away over her drop spot but not finished: she is behind the rock
  // and shows exactly where its cells are gone.
  rockhalf: { about: 'the rock', say: 'the rock mined away over the one buried, the rest standing',
    run: () => { window.__reset(); window.__crew(3, 1); window.__jump(3); window.__fast(1);
                 const at = buriedAt(), g = Math.floor((at.x - rockLeft()) / P);
                 for (const row of S.boulder) for (let x = g - 3; x <= g + 5; x++) if (x >= 0 && x < row.length && x !== g + 1) row[x] = 0;
                 window.__fast(0.2); window.__look(S.cx - S.viewW / 2); window.__holdShot(); } },
  // The whole rock over her, her calls over it. Nobody is mining: strike it
  // (`__swing(1)` a second) to keep her calling.
  sqwifecalls: { about: 'the rock', say: 'the one buried under a whole rock, ready to call while it is struck',
    run: () => { window.__reset(); window.__crew(3, 1); window.__jump(3); window.__fast(1);
                 window.__look(S.cx - S.viewW / 2); } },
  // Both ends of the rock's growth: the walk leaves the hut exactly the room
  // `rockSize` needs and no more. Jumped and then run, because `rich` leaves
  // the first rock still falling and its grant tearing the rift.
  shackrock: { about: 'the rock', say: 'the shack against rock one',
    run: () => { rich(); window.__kit({ breakers: 3 }); window.__shack(); window.__jump(1);
                 window.__fast(6); window.__look(st().shackX - 200); } },
  shackrockbig: { about: 'the rock', say: 'the shack against the biggest rock',
    run: () => { rich(); window.__kit({ breakers: 3 }); window.__shack(); window.__jump(30);
                 window.__fast(6); window.__look(st().shackX - 200); } },
  shackboard: { about: 'the rock', say: "the shack's board",
    run: () => { rich(); window.__kit({ breakers: 3 }); window.__shack(); window.__board('shack'); } },
  // The machine's own ladder: three rungs of red, a pip each, beside the two
  // banded ladders it used to be the odd one out among.
  tunerow: { about: 'the rock', say: "the ram's own ladder, one rung up its three",
    run: () => { rich(); window.__kit({ breakers: 3 }); window.__shack(); window.__buy('ram'); window.__finish();
                 window.__grant({ sparks: 99999, dust: 9000000 });
                 window.__buy('tuneram'); window.__finish();
                 window.__board('shack'); } },
  shackwork: { about: 'the rock', say: 'a rung being fitted at the shack',
    run: () => { rich(); window.__kit({ breakers: 3 }); window.__shack(); window.__invest();
                 window.__buy('rockhandspeed'); window.__fast(6); window.__look(st().shackX - 400); } },
  // A picture of spacing, so the camera sits on the rock's left edge and lets
  // the walk run out to the left of it.
  flank: { about: 'the rock', say: 'the hill, the hut and the bench, with the ground between', page: true,
    run: () => { window.__reset(); window.__crew(3, 1); window.__shack(); window.__give(100); window.__fast(2);
                 requestAnimationFrame(() => {
                   document.getElementById('raise').click();
                   window.__fast(40); window.__look(st().benchX - 120);
                 }); } },
  // Six rocks in the hut has scooted out to keep its clearance, and the bench
  // has not moved.
  flankgrown: { about: 'the rock', say: 'the same flank six rocks in', page: true,
    run: () => { window.__reset(); window.__crew(3, 1); window.__shack(); window.__give(100); window.__fast(2);
                 requestAnimationFrame(() => {
                   document.getElementById('raise').click();
                   window.__fast(40);
                   for (let i = 0; i < 5; i++) { window.__next(); window.__fast(6); }
                   window.__look(st().benchX - 120);
                 }); } },
  // Nobody is mining in this one, so the dust on the crest stays put.
  crest: { about: 'the rock', say: 'dust lying on the crest',
    run: () => { window.__reset(); window.__jump(6); window.__fast(2);
                 const s = st();
                 for (let c = 6; c < s.gw - 6; c++) window.__pileRock(s.rockLeftX + c * 6 + 3, 3);
                 window.__fast(1); window.__look(st().rockLeftX - 180); } },
  // The button held on a heap out along the strip, hold to toss bought and its
  // reach topped: handfuls in the air on their way to the hole. Held from here
  // rather than through the glass, since a scene has no pointer to hold.
  tossing: { about: 'the bench', say: 'a held hand throwing at the hole',
    run: () => { window.__reset(); window.__fast(1); S.autoToss = true;
                 window.__levels({ carryLevel: 4, tossSpeedLevel: 5, tossReachLevel: LADDER });
                 const x = st().pitX - 300;
                 for (let d = -60; d < 60; d += 12) window.__pile(x + d, 40);
                 window.__fast(1);
                 S.mouse = { x, y: S.groundY - 12 }; S.dragging = true; S.nextToss = 0;
                 window.__look(x - 340); } },
  // The build section's unlock tiles with some of each bill in the purse:
  // about half the dust in, the crops and ore not yet.
  unlockbars: { about: 'the bench', say: 'the unlock tiles on the bench, each coin of a bill filling as it comes in',
    run: () => { window.__reset(); window.__crew(4); S.quarryOpen = false; S.farmOpen = false;
                 window.__answered('props', 'net');
                 window.__grant({ dust: 6000, shards: 2, spores: 1 }); window.__fast(2);
                 window.__spend(st().stored - 300); window.__fast(1);
                 window.__board('bench');
                 setTimeout(() => document.querySelector('#shop button[data-key^="unlock"]')?.scrollIntoView({ block: 'center' }), 300); } },
  apron: { about: 'the rock', say: 'the bare strip in front of the hill',
    run: () => { rich(); window.__jump(4);
                 const x = st().rockLeftX;
                 for (let d = -260; d < 260; d += 12) window.__pile(x + d, 60);
                 window.__fast(4); window.__look(st().rockLeftX - 340); } },
  // The roll is forced on and the rockhands left to work: the runner gives
  // every scene a second before the shot and a ring is over in a third of
  // one, so the yard has to be making crits while the picture is taken.
  crit: { about: 'the rock', say: 'every swing a crit',
    run: () => { window.__reset(); window.__crew(3, 0);
                 window.__levels({ pickLevel: 5, rockhandSpeedLevel: 5, rockhandPickLevel: 5 });
                 window.__crit(true); window.__fast(6); window.__look(st().rockLeftX - 260); } },
  // A still frame should show bodies at different heights over one line of
  // ground; each body rolls its own tempo.
  dance: { about: 'the rock', say: 'the celebration after a rock comes off',
    run: () => { window.__reset(); window.__crew(3, 4); window.__fast(3);
                 window.__next(); window.__fast(1.2); window.__look(st().rockLeftX - 300); } },

  // --- the crew ---------------------------------------------------------------
  // The two of them in the yard's crowd (wardrobe.js): a dozen haulers and
  // carters carrying between the rock and the hole, two of the haulers named
  // the pair, so they are found by what they wear alone;
  // `window.__outfits` an outfit pair ({ you, sqouse }) to try others.
  pair: { about: 'the crew', say: 'the two of them dressed, carrying among the haulers and the carters',
    run: () => {
      window.__reset(); window.__crew(3, 12);
      window.__kit({ breakers: 3, carters: 3 });
      S.buried = false;
      const haul = S.workers.filter(w => w.type === TYPE.HAUL && !w.trained);
      namePair('you', haul[1]); namePair('sqouse', haul[2]);
      if (window.__outfits) for (const k of ['sqouse', 'you']) if (window.__outfits[k]) wear(k, window.__outfits[k]);
      window.__fast(12);
      window.__look((pairBody('sqouse').x + pairBody('you').x) / 2 - S.viewW / 2);
    } },
  // The same crowd, the two of them in auras (render/wardaura.js): the rain
  // cloud and the embers, or `window.__auras` ({ you, sqouse }).
  'pair-aura': { about: 'the crew', say: 'the two of them in auras, carrying among the haulers and the carters',
    run: () => {
      const a = window.__auras || {}, was = window.__outfits;
      window.__outfits = { you: { ...(window.__outfits?.you || {}), aura: a.you || 'rain-cloud' },
                           sqouse: { ...(window.__outfits?.sqouse || {}), aura: a.sqouse || 'embers' } };
      try { SCENES.pair.run(); } finally { window.__outfits = was; }
    } },
  // The same crowd in the expansion's pieces (wardrobe.js; the owner's vote
  // on docs/mocks/wardrobe-expansion-2026-10-16): the gold set, two of the
  // station hats, and the lamp's light ahead of you.
  'pair-gold': { about: 'the crew', say: 'the two of them in the gold set among the haulers and the carters',
    run: () => dressedPair({ you: { head: 'gold-crown', aura: 'gold-halo', face: 'eyes' },
                             sqouse: { neck: 'gold-scarf', back: 'gold-cape' } }) },
  'pair-hats': { about: 'the crew', say: 'the two of them in station hats, a wizard\'s point and a sun hat',
    run: () => dressedPair({ you: { head: 'wizard-hat' }, sqouse: { head: 'sun-hat' } }) },
  'pair-comb': { about: 'the crew', say: 'you in the serpent comb, your sqouse in the diving bowl',
    run: () => dressedPair({ you: { head: 'serpent-comb' }, sqouse: { head: 'diving-bowl' } }) },
  'pair-lamp': { about: 'the crew', say: 'you in the lamp, its light ahead of you, your sqouse in the helmet',
    run: () => dressedPair({ you: { head: 'lamp' }, sqouse: { head: 'helmet' } }) },
  crew: { about: 'the crew', say: 'the crew, hats and all',
    run: () => { window.__reset(); window.__crew(3, 2, 2, 2);
                 window.__kit({ breakers: 3, blasters: 2, growers: 2, carters: 2 });
                 window.__loo(); window.__assign(JOB.JANITOR, 1); window.__fast(20);
                 window.__look(st().rockLeftX - 420); } },
  // The seat pips under the cut and the plots: three of five at the cut, two
  // of them lamped, the plots full, and three spare hands to send.
  seats: { about: 'the crew', say: 'the cut three of five, two lamped; the plots full',
    run: () => { window.__reset(); window.__crew(1, 3, 3, 7);
                 window.__levels({ benchLevel: 3, plotLevel: 6 }); window.__kit({ blasters: 2 });
                 window.__fast(20); window.__look(st().quarryX - 260); } },
  // Two hats worn and three spare: every pip in the specialists row wears its brim.
  seatsspare: { about: 'the crew', say: 'the cut with two hats worn and three spare, each in its own pip',
    run: () => { window.__reset(); window.__crew(1, 2, 2, 7);
                 window.__levels({ benchLevel: 3, plotLevel: 6 }); window.__kit({ blasters: 5 });
                 window.__fast(20); window.__look(st().quarryX - 260); } },
  // The same, a moment after + at the cut: one body on its way over.
  seatswalk: { about: 'the crew', say: 'one more sent to the cut, on its way',
    run: () => { window.__reset(); window.__crew(1, 3, 3, 7);
                 window.__levels({ benchLevel: 3, plotLevel: 6 }); window.__kit({ blasters: 2 });
                 window.__fast(20); window.__assign(JOB.QUARRY, 1); window.__look(st().quarryX - 260); } },
  // The plots with a sun hat waiting on its stand: the growers' counter
  // beside the plain hands', a grey ring in each that nobody stands in.
  seatsfarm: { about: 'the crew', say: 'the plots: two growers at work, a hat waiting, the plain seats empty',
    run: () => { window.__reset(); window.__crew(1, 3, 0, 5);
                 window.__levels({ plotLevel: 6 }); window.__kit({ growers: 3 });
                 window.__fast(20); window.__assign(JOB.FARM, -3); window.__fast(10);
                 window.__look(st().farmX - 200); S.camLockY = S.groundY - S.viewH * 0.35; } },
  // The house's and the garage's counters at their widest, six a row and +N
  // under each: the ground GARAGE_CLEAR keeps between them.
  seatswide: { about: 'the crew', say: 'the house and the garage counters at their widest',
    run: () => { rich(); lip(); window.__crew(4, 40); window.__kit({ carters: 30, drivers: 14 }); window.__fast(20);
                 const s = st(); window.__look(s.houses.door - s.viewW / 2 + 60);
                 S.camLockY = S.groundY - S.viewH * 0.35; } },
  // The tower's floor plan is its hats: one counter, all specialists, with a
  // hat waiting indoors.
  seatstower: { about: 'the crew', say: 'the tower: three wizards at work, a fourth hat waiting',
    run: () => { rich(); window.__meteor(); window.__crew(2, 2, 0, 0, 0, 3); window.__wizardHat(1);
                 window.__fast(20);
                 window.__fast(5); window.__look(st().towerX - 560); S.camLockY = S.groundY - S.viewH * 0.35; } },
  // Twenty-one rooms is three full courses and part of a fourth, so both the
  // square sides and the unfinished top show in one shot.
  house: { about: 'the crew', say: 'the house, several storeys up',
    run: () => { window.__reset(); window.__crew(6, 5, 5, 4); window.__fast(2);
                 window.__look(st().houses.door - 400); } },
  // Three bought at once: one going up, two in line behind it, each with a bar.
  housequeue: { about: 'the crew', say: 'three houses bought at once, the first going up',
    run: () => { window.__reset(); window.__crew(3, 2, 2, 1); window.__grant({ dust: RICH_DUST });
                 window.__buy('house'); window.__buy('house'); window.__buy('house');
                 window.__fast(20); window.__look(st().houses.door - 400); } },
  // The right button held over the yard (input.js sets `crewSight` on the
  // press): the yard veiled pale behind the crew, each body ringed.
  'crew-sight': { about: 'the crew', say: 'the right button held: the yard veiled behind the crew, each body ringed',
    run: () => { window.__reset(); window.__crew(3, 2, 2, 2);
                 window.__kit({ breakers: 3, blasters: 2, growers: 2, carters: 2 });
                 window.__fast(20);
                 S.crewSight = 0;
                 window.__holdShot(); } },
  // A smaller crew than `rich`'s: the rich yard fills every plot, and a full
  // station is exactly the one that must not ring.
  assign: { about: 'the crew', say: 'a body held over the farm, the ring on',
    run: () => { window.__reset(); window.__crew(3, 3, 2, 2); window.__give(50000);
                 window.__levels({ plotLevel: 4 }); window.__fast(1);
                 const fs = st().farmShed;
                 window.__hold(0, fs.x + fs.w / 2, fs.y + fs.h / 2);
                 window.__look(fs.x - 60); } },
  // Not built on `rich`: a full hole stops the belt exactly as it stops a
  // gang, so the scene would be a stopped-station triangle over an empty
  // band.
  belt: { about: 'the crew', say: 'the belt running from the rock to the lip',
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 30000 }); lip();
                 window.__buy('ram'); window.__finish(); window.__buy('belt'); window.__finish();
                 window.__jump(4); window.__fast(12); window.__clearFloor();
                 window.__look(st().pitX - 620); } },
  // The head over the drowned hole: the load pouring off the end of the band
  // into the abyss. The rift is torn so the hole never fills and the band
  // never has a reason to stand.
  beltdrop: { about: 'the crew', say: 'the belt head pouring its load into the abyss',
    run: () => { rich(); lip(); window.__buy('ram'); window.__finish(); window.__buy('belt'); window.__finish(); window.__jump(30);
                 window.__meteor(); window.__give(60000); window.__buy('rift');
                 window.__fast(12); window.__look(st().pitX - 400); } },
  // The head's ramp itself, lightly loaded, so the steps and the band's marks
  // running up them are not buried under the pour.
  beltramp: { about: 'the crew', say: "the belt head's ramp, a light load going up it",
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 30000 }); lip();
                 window.__buy('ram'); window.__finish(); window.__buy('belt'); window.__finish();
                 window.__jump(4); window.__fast(12); window.__clearFloor(); window.__fast(3);
                 window.__look(st().pitX - 400); } },
  // The tail of the belt at the rock: where the rockhands' spoil should
  // come down on the band.
  belttail: { about: 'the crew', say: 'the rockhands throwing spoil on to the belt at the rock',
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 30000 }); lip();
                 window.__buy('ram'); window.__finish(); window.__buy('belt'); window.__finish();
                 window.__jump(4); window.__fast(12);
                 window.__look(st().rockX - 250); } },
  // Both marks want a station whose pile has filled and which has something
  // to sell, so the yard runs a while with nobody to carry anything away.
  marks: { about: 'the crew', say: 'the stopped triangle and the offer diamond',
    run: () => { rich(); window.__assign('carters', -9); window.__fast(240);
                 window.__look(st().farmX - 300); } },
  // The caps are the one hat nobody buys (the shed simply has two), so this
  // is where a stock has to read the same as a trade.
  loo: { about: 'the crew', say: 'the outhouse, its stand and its janitor',
    run: () => { window.__reset(); window.__crew(0, 3); window.__loo();
                 window.__assign(JOB.JANITOR, 1); window.__fast(30); window.__look(st().outhouseX - 260); } },
  // The shed has to be up first: the board arrives with the building.
  looboard: { about: 'the crew', say: "the outhouse's board",
    run: () => { window.__reset(); window.__crew(3, 2); window.__loo();
                 window.__give(20000); window.__board('outhouse');
                 const s = st(); window.__look(s.outhouseX + 21 - s.viewW / 2); } },
  // The quarry stands because the cap is priced in ore.
  loocap: { about: 'the crew', say: "the janitor's second cap being fitted at the closet",
    run: () => { window.__reset(); window.__crew(3, 2); window.__loo(); S.quarryOpen = true;
                 window.__give(20000); window.__grant({ shards: 30 }); window.__buy('loopost');
                 window.__fast(4); window.__look(st().outhouseX - 260); } },
  // The roombas, bought through their row the way a player does: the closet
  // up with both its caps, one janitor posted (the tender they run on), the
  // three built on their slots. A dirty stretch of open yard either side of
  // the closet, the weather's muck and a few patches of poop, so there is
  // something to drive to.
  roomba: { about: 'the crew', say: 'three roombas out on a dirty yard, taking in muck and poop, their tender at the closet',
    run: () => { roombaYard(); dirty(); window.__fast(2.5); followRoomba(); } },
  // Home and full: the yard dirtied well past what three bins hold, run long
  // enough for them to fill and drive back, and the tender caught tipping one.
  roombadock: { about: 'the crew', say: 'the roombas home on their dock, the tender tipping a bin in at the closet door',
    run: () => { roombaYard(); dirty(); window.__fast(16); lookAtDock(); } },
  // The row and its ladder on the closet's board, one roomba owned.
  roombarow: { about: 'the crew', say: "the roomba row on the closet's board, with its suction ladder",
    run: () => { roombaYard(1); window.__board('outhouse');
                 const s = st(); window.__look(s.outhouseX + 21 - s.viewW / 2); } },
  // `page`: the camera reads `houses` off the page's snapshot, which the node
  // yard's has not got.
  // A dev build has no worker: the scene points the form at a made-up one so
  // the page is drawn; nothing is sent.
  feedback: { about: 'the story', say: 'the feedback page off the pause sheet, words typed, the tick on', page: true,
    run: () => {
      setFeedbackUrl('https://feedback.invalid'); hold(true); showPane('feedback');
      const box = document.querySelector('#fbform textarea');
      box.value = 'the crew stand still by the quarry'; box.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#fbform .tick')?.click();
    } },
  houseboard:{ about: 'the crew', say: "the crew's board", page: true,
    run: () => { rich(); window.__board('house'); window.__look(st().houses.door - 400); } },
  // The door hovered the way a pointer does it, since nothing but a hover
  // opens the list.
  crewlist: { about: 'the crew', say: 'the crew list, in its window', page: true,
    run: () => { rich(); window.__crew(6, 5, 5, 4); window.__board('house'); window.__look(st().houses.door - 400);
                 document.querySelector('#crewshop button[data-key="crewlist"]')?.click(); } },
  apothbuff: { about: 'the crew', say: 'bodies under tonics, standing',
    run: () => { window.__reset(); window.__crew(3, 2, 2, 2);
                 window.__kit({ breakers: 3, blasters: 2, growers: 2, carters: 2 });
                 window.__loo(); window.__assign(JOB.JANITOR, 1); window.__fast(20);
                 window.__dose(TYPE.ROCK, 'brace'); window.__dose(TYPE.JANITOR, 'strong');
                 window.__look(st().rockLeftX - 420); } },
  // Haulers cross the whole yard, so a shot of the run catches the plume on
  // bodies going both ways at once; the one under two tonics says the two
  // colors still read apart while it moves.
  buffwalk: { about: 'the crew', say: 'bodies under tonics, walking',
    run: () => { window.__reset(); window.__crew(2, 5);
                 window.__dose(TYPE.HAUL, 'brace'); window.__dose(TYPE.HAUL, 'strong');
                 window.__dose(TYPE.ROCK, 'stew'); window.__fast(12); window.__look(st().pitX - 620); } },
  // Run to the frame the stirrer is nearly at the wizard, so the shot is the
  // two of them meeting.
  manabrew: { about: 'the crew', say: 'a wizard coming down off the ring for its strong brew',
    run: () => { rich(); window.__crew(3, 3, 5, 7, 0, 2);
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__pot('strong'); window.__assign(JOB.STIR, 1);
                 for (let i = 0; i < 240 * 60; i++) {
                   window.__fast(1 / 60);
                   const s = st();
                   if (s.doseMeeting) break;
                 }
                 window.__look(st().meteorX - st().viewW / 2); } },
  manabrewup: { about: 'the crew', say: 'a dosed wizard back on the ring, plume and all',
    run: () => { rich(); window.__crew(3, 3, 5, 7, 0, 2);
                 // Dosed on the ground, before the climb: a dose is never
                 // handed to a body in the sky (verify.js, rule 11).
                 window.__dose(TYPE.WIZARD, 'strong'); window.__fast(30);
                 window.__look(st().meteorX - st().viewW / 2); } },

  // --- the bench --------------------------------------------------------------
  call: { about: 'the bench', say: 'the call to build the bench',
    run: () => { window.__reset(); window.__crew(1); window.__give(100); window.__fast(2);
                 window.__look(st().benchX - 380); } },
  benchup: { about: 'the bench', say: 'the bench going up', page: true,
    run: () => { window.__reset(); window.__crew(1); window.__give(100); window.__fast(2);
                 requestAnimationFrame(() => {
                   document.getElementById('raise').click();
                   window.__fast(12); window.__look(st().benchX - 380);
                 }); } },
  // The shot for the pips and the clock icon: the only place several of each
  // stand together to be compared.
  bench: { about: 'the bench', say: "the bench's board, every heading",
    run: () => { rich(); window.__board('bench'); } },
  // The toss rows open once you have dragged: hold to toss, then its two ladders.
  tossboard: { about: 'the bench', say: "the bench's board with the throwing rows on it",
    run: () => { rich(); S.seenDrag = true; window.__board('bench'); } },
  tossboardheld: { about: 'the bench', say: "the bench's board with hold to toss bought",
    run: () => { rich(); S.seenDrag = S.autoToss = true; window.__board('bench'); } },
  filterboard: { about: 'the house and the sky', say: "the air filter's board, its gauge on top",
    run: () => { rich(); window.__air({ open: true, haze: 0.5 }); S.seenAir = true; window.__board('filter'); } },
  fitting: { about: 'the bench', say: 'a rung being fitted at the bench',
    run: () => { window.__reset(); window.__crew(0, 1); window.__grant({ dust: 9000 });
                 window.__fast(2); window.__buy('carry'); window.__fast(3); window.__look(st().benchX - 300); } },
  queue: { about: 'the bench', say: 'the queue card, with a line at the bench', page: true,
    run: () => { window.__reset(); window.__crew(0, 1); window.__grant({ dust: 9000 });
                 window.__fast(2); window.__buy('carry'); window.__buy('auto'); window.__buy('haulcarry');
                 window.__fast(3); window.__look(st().benchX - 300); } },
  // One row queued again (DESIGN.md, "The same row, queued again"): three
  // rungs of the carry ladder and two houses, the bench's board open on the
  // carry card with its refund strip, the queue card in the corner.
  queuerepeat: { about: 'the bench', say: 'a row queued three times: the refund and another strip, the dotted pips, the queue card a line a run', page: true,
    run: () => { rich(); window.__fast(2);
                 for (let i = 0; i < 3; i++) window.__buy('carry');
                 window.__buy('house'); window.__buy('house');
                 window.__fast(2); window.__board('bench'); } },
  queuetop: { about: 'the bench', say: 'a ladder queued to its top, its first rung part built under a hand', page: true,
    run: () => { rich(); S.autoToss = true; window.__fast(2);
                 while (window.__buy('reach')) {}
                 window.__fast(1.5); window.__board('bench'); } },
  // Deliberately not `__finish`ed: partway through is the only state the
  // rise, the tape and the hammer exist in.
  build: { about: 'the bench', say: 'a building half out of the ground',
    run: () => { rich(); window.__buy('unlockapothecary'); window.__fast(35);
                 window.__look(st().apothecaryX - 380); } },
  build2: { about: 'the bench', say: 'the same building most of the way up',
    run: () => { rich(); window.__buy('unlockapothecary'); window.__fast(70);
                 window.__look(st().apothecaryX - 380); } },
  building: { about: 'the bench', say: 'a machine being built, the bar over the site',
    run: () => { rich(); window.__buy('jaw'); window.__fast(9); window.__look(st().quarryX - 260); } },
  // The shovel's ink sits left of its grid: the shot that says a lopsided
  // drawing still hangs centred over its shed.
  buildbench: { about: 'the bench', say: 'a bench being built, the shovel centred over the shed',
    run: () => { window.__reset(); window.__crew(3, 3, 3, 3);
                 window.__grant({ dust: 99999, shards: 999, spores: 9999, sparks: 999 });
                 window.__buy('unlockquarry'); window.__finish();
                 window.__buy('quarrybench'); window.__fast(6); window.__look(st().quarryX - 480); } },
  buildboard: { about: 'the bench', say: 'a row read while its work is on the go',
    run: () => { rich(); window.__buy('jaw'); window.__fast(30); window.__board('quarry'); } },
  // A place going up, read on the bench's own tile: the glyph rising with the
  // hand beside it throwing its chips.
  buildtile: { about: 'the bench', say: 'the quarry tile on the bench while the quarry goes up',
    run: () => { quarryGoingUp(); window.__board('bench'); } },
  // The crew written down and read back mid-build, the way a refresh does it:
  // the builder comes back to its hammer, and the tile's hand with it.
  buildtilereload: { about: 'the bench', say: 'the quarry tile after a refresh mid-build',
    run: () => { quarryGoingUp(); const o = {}; CREW_SAVE.write(o); CREW_SAVE.read(o);
                 window.__fast(1); window.__board('bench'); } },
  // The whole crew is stood down after the work has some cells up: a station
  // with no gang is helped by a lent builder, so standing down the quarriers
  // alone stalls it only for the length of a walk.
  buildstalled: { about: 'the bench', say: 'a build stalled: the glyph stopped part-built, the clock stopped',
    run: () => { rich(); window.__buy('jaw'); window.__fast(20); window.__crew(0, 0, 0, 0); window.__fast(3); window.__board('quarry'); } },
  aura: { about: 'the bench', say: 'every station breathing its offer aura',
    run: () => { rich(); window.__give(50000); window.__fast(1); window.__look(st().farmShed.x - 60); } },
  // No big `__give` here: filling the hole tears it, and the tear cutscene's
  // camera overrides `__look` for every frame after.
  flag: { about: 'the bench', say: 'the offer flag up over the bench',
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 5000 });
                 window.__fast(2); window.__look(4930); } },
  // The mast slides out over FLAG_RAISE_MS and the cloth runs up it over
  // FLAG_HOIST_MS. The grant has to land after the runner's own second of
  // clock, or the raise is long over by the shot; the draw reads its own
  // clock, so the fraction is exactly the seconds asked for here.
  flagraise: { about: 'the bench', say: 'the flag halfway through its raise', page: true,
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__fast(2); window.__look(4930);
                 requestAnimationFrame(() => {
                   window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 5000 });
                   window.__fast(0.3);
                 }); } },
  flaghoist: { about: 'the bench', say: 'the flag halfway up its mast', page: true,
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__fast(2); window.__look(4930);
                 requestAnimationFrame(() => {
                   window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 5000 });
                   window.__fast(0.95);
                 }); } },
  // Nothing else frames both sheds, and the whole question about a shack is
  // whether it reads as a different building from the other one.
  shacks: { about: 'the bench', say: "the cut's shed and the field's, side by side",
    run: () => { rich(); window.__look(st().farmShed.x - 60); } },
  farmshed: { about: 'the bench', say: "the field's shed with its barn roof, the cut's and the bench in the same view",
    run: () => { rich(); window.__fullSites(); window.__look(st().farmShed.x - 160); } },
  // The scene for where a site's bar hangs; `quarry` and `farm` finish their
  // builds, so neither ever shows one.
  sitebars: { about: 'the bench', say: 'a bar over each shed, both sites at work',
    run: () => { window.__reset(); window.__crew(3, 3, 3, 3);
                 window.__grant({ dust: 99999, shards: 999, spores: 9999, sparks: 999 });
                 window.__buy('unlockquarry'); window.__finish();
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('quarrybench'); window.__buy('farmplot'); window.__fast(6);
                 window.__look(st().farmShed.x - 60); } },
  donemark: { about: 'the bench', say: "a finished work's glyph, ticked, at the foot of the shed's stack",
    run: () => { window.__reset(); window.__crew(3, 3);
                 window.__grant({ dust: 99999, shards: 99, spores: 9999 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockquarry'); window.__finish();
                 window.__buy('quarrybench'); window.__finish(); window.__fast(2);
                 window.__look(st().quarryX - 300); } },
  donestack: { about: 'the bench', say: 'two rungs landed and ticked, one going up over them, one in line',
    run: () => { window.__reset(); window.__crew(3, 3);
                 window.__grant({ dust: 99999, shards: 999, spores: 9999 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockquarry'); window.__finish();
                 window.__buy('quarrybench'); window.__finish();
                 window.__buy('quarrypace'); window.__finish();
                 window.__buy('quarrybench'); window.__buy('quarrypace'); window.__fast(4);
                 window.__look(st().quarryX - 500); } },
  // The board fills with slips as the record does, so the two shots worth
  // having are a yard just started and one that has done a great deal.
  notices: { about: 'the bench', say: 'the noticeboard on a yard just started',
    run: () => { window.__reset(); window.__crew(1); window.__give(400); window.__fast(4);
                 window.__look(st().noticesX - 440); window.__fast(6); } },
  notices2: { about: 'the bench', say: 'the noticeboard on a yard that has done a lot',
    run: () => { window.__reset(); window.__crew(1); window.__jump(30); window.__grant({ dust: RICH_DUST }); window.__fast(6);
                 window.__look(st().noticesX - 440); window.__fast(6); } },
  // The opening lands a notice and a hire within its first seconds, so a yard
  // just started has a toast up by the shot.
  toast: { about: 'the bench', say: "a notice's card said out loud at the top edge",
    run: () => { window.__reset(); window.__crew(1); window.__fast(2); } },
  boards: { about: 'the bench', say: 'a board open with everything on it',
    run: () => { rich(); window.__board('tower'); } },
  // The phone's board: a sheet from the bottom (DESIGN.md, "Boards as bottom
  // sheets"), shot with WINDOW=390,844. `__coarse(true)` stands the page up
  // as a phone without writing the preference; a scene after this one puts
  // it back. The bench at its fullest, and the two tallest boards.
  phonebench: { about: 'the bench', say: 'the bench as a bottom sheet, on a phone', page: true,
    run: () => { rich(); window.__coarse(true); window.__board('bench'); } },
  phonehouse: { about: 'the bench', say: "the crew's board as a bottom sheet", page: true,
    run: () => { rich(); window.__coarse(true); window.__board('house'); } },
  phoneshack: { about: 'the bench', say: "the shack's board as a bottom sheet", page: true,
    run: () => { rich(); window.__coarse(true); window.__kit({ breakers: 3 }); window.__shack(); window.__board('shack'); } },
  phoneyard: { about: 'the bench', say: 'the yard on a phone: the hop arrows, the grab bar, the fullscreen button', page: true,
    run: () => { rich(); window.__coarse(true); window.__look(st().benchX - 600); } },
  // A picture of the card's width: the deepest bills beside the pips.
  benchdeep: { about: 'the bench', say: 'the bench with its ladders on their third cards',
    run: () => { rich(); window.__grant({ shards: 99999, spores: 99999, dust: 9000000 });
                 window.__levels({ carryLevel: 7, speedLevel: 4, pickLevel: 8, critChanceLevel: 7,
                                   haulCarryLevel: 6, haulPaceLevel: 8 });
                 window.__buy('auto'); window.__board('bench'); } },

  // --- the cut ----------------------------------------------------------------
  quarry: { about: 'the cut', say: 'the cut, the jaw and the hoist',
    run: () => { rich(); window.__buy('jaw'); window.__finish(); window.__look(st().quarryX - 220); } },
  // A minute in, so the gang is spread along a course and the pockets show
  // (DESIGN.md, "The cut is worked in pockets").
  cutgang: { about: 'the cut', say: 'five on the face by hand, blasters among them',
    run: () => { window.__reset(); window.__crew(2, 0, 5, 0); window.__fullSites(); window.__grant({ dust: RICH_DUST });
                 window.__fast(60); window.__look(st().quarryX - 220); } },
  // Three bodies rather than five: five at this pace have the cut out before
  // the opening has let go of the camera.
  cutgangdeep: { about: 'the cut', say: 'three on the face, well up the pace ladder',
    run: () => { window.__reset(); window.__crew(2, 0, 3, 0); window.__fullSites(); window.__grant({ dust: RICH_DUST });
                 window.__levels({ quarryPaceLevel: TIER_OWN }); window.__fast(60); window.__look(st().quarryX - 220); } },
  // Half a minute, so the plume has puffs at every age.
  plume: { about: 'the cut', say: "the jaw's plume, well into its climb",
    run: () => { rich(); window.__buy('jaw'); window.__finish(); window.__fast(30);
                 window.__look(st().quarryX - 220); } },
  quarryboard: { about: 'the cut', say: "the cut's board",
    run: () => { rich(); window.__board('quarry'); } },

  // --- the plots --------------------------------------------------------------
  farm: { about: 'the plots', say: 'the plots, and the tiller crossing them',
    run: () => { rich(); window.__buy('tiller'); window.__finish(); window.__look(st().farmX - 200); } },
  // Part way down the place ladders; `rich` fills every site, which folds
  // both rows away.
  quarryboardmid: { about: 'the cut', say: "the cut's board, a bench taken out and three to go",
    run: () => { window.__reset(); window.__crew(2, 3, 3, 3);
                 window.__grant({ dust: 90000, spores: 999, shards: 999 });
                 window.__board('quarry'); } },
  farmboardmid: { about: 'the plots', say: "the plots' board, two plots broken and four to go",
    run: () => { window.__reset(); window.__crew(2, 3, 3, 3);
                 window.__grant({ dust: 90000, spores: 999, shards: 999 });
                 window.__board('farm'); } },
  farmboard: { about: 'the plots', say: "the plots' board",
    run: () => { rich(); window.__board('farm'); } },
  // The shot for a deep bill fitting in a row.
  laddersdeep: { about: 'the plots', say: "the plots' board, deep on both ladders",
    run: () => { rich(); window.__invest(); window.__levels({ cropLevel: TIER_OWN, tendLevel: 4 }); window.__board('farm'); } },
  // A single body over one plot with the other six visibly coming on behind
  // it, rather than one stalk and six patches of bare dirt.
  keeper: { about: 'the plots', say: 'one farmhand keeping seven plots',
    run: () => { window.__reset(); window.__crew(0, 0, 0, 1);
                 window.__levels({ plotLevel: 6, tendLevel: 6 }); window.__fast(70); window.__look(st().farmX - 200); } },

  // --- the apothecary ---------------------------------------------------------
  // The farm is opened first (the pot stands right past it), the pot set to
  // a tonic and a body put on it: a pot being worked is the only state the
  // steam exists in.
  apothecary: { about: 'the apothecary', say: 'a pot on the boil, a stirrer at it',
    run: () => { window.__reset(); window.__crew(0, 1, 0, 2);
                 window.__grant({ dust: 8000, spores: 3000, shards: 300 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__pot('stew'); window.__assign(JOB.STIR, 1); window.__fast(16);
                 window.__look(st().apothecaryX - 400); } },
  // The site's bar hangs over the hut, not over the middle of the plot.
  apothbar: { about: 'the apothecary', say: 'a rung on the go, the bar over the hut',
    run: () => { window.__reset(); window.__crew(0, 1, 0, 2);
                 window.__grant({ dust: 60000, spores: 3000, shards: 300 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__buy('brewdoses'); window.__fast(4); window.__look(st().apothecaryX - 300); } },
  // A stirrer on a keep-brewing pot with stock on the shelf, so the body that
  // would otherwise be out dealing is stood at the hut under the bar.
  potwork: { about: 'the apothecary', say: 'a keeper claimed to the hut for another pot',
    run: () => { window.__reset(); window.__crew(2, 4, 0, 3);
                 window.__grant({ dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__brews(5); window.__assign(JOB.STIR, 1); window.__pot('stew'); window.__fast(40);
                 window.__buy('anotherpot'); window.__fast(14); window.__look(st().apothecaryX - 300); } },
  // Three pots, each bought after the five batches that offer the next. Same
  // setup as `apothpots`, camera on the pots for where the bar hangs against
  // the steam.
  potbars: { about: 'the apothecary', say: 'three pots boiling, bars up, up close',
    run: () => { window.__reset(); window.__crew(1, 4, 0, 2);
                 window.__grant({ dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__brews(5);
                 window.__buy('anotherpot'); window.__finish();
                 window.__buy('anotherpot'); window.__finish();
                 window.__assign(JOB.STIR, 3);
                 window.__pot('stew'); window.__pot('brace', 1); window.__pot('strong', 2);
                 window.__fast(30); window.__look(st().apothecaryX + 60); } },
  // Three pots each on a brew of its own, so the flames read as three colors
  // side by side.
  apothpots: { about: 'the apothecary', say: 'the whole building at its widest',
    run: () => { window.__reset(); window.__crew(1, 4, 0, 2);
                 window.__grant({ dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__brews(5);
                 window.__buy('anotherpot'); window.__finish();
                 window.__buy('anotherpot'); window.__finish();
                 window.__assign(JOB.STIR, 3);
                 window.__pot('stew', 0); window.__pot('brace', 1);
                 window.__pot('strong', 2);
                 window.__fast(50); window.__look(st().apothecaryX - 320); } },
  // Pots left cold so nothing pulls the eye off the rack. A full plank, a
  // couple, and one over the cap, so one shot carries both readings the rack
  // makes: bottles you count, and the numeral once there are more than the
  // plank can stand (`drawShelves` in render/apothecary.js).
  apothshelf: { about: 'the apothecary', say: 'the rack of stock, pots cold',
    run: () => { window.__reset(); window.__crew(1, 4, 0, 2);
                 window.__grant({ dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__brews(5);
                 window.__buy('anotherpot'); window.__finish();
                 window.__buy('anotherpot'); window.__finish();
                 window.__buy('anotherpot'); window.__finish();
                 window.__stock('stew', 5); window.__stock('brace', 12); window.__stock('strong', 999);
                 window.__fast(3); window.__look(st().apothecaryX - 320); } },
  apothboard: { about: 'the apothecary', say: "the apothecary's board",
    run: () => { window.__reset(); window.__crew(1, 4, 0, 2);
                 window.__grant({ dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__look(st().apothecaryX - 320); window.__board('apothecary'); } },
  // A real pointermove at the pot's own spot, because standing at a pot is
  // what opens it; the press path is the touchscreen's, and the browser check
  // covers it.
  apothpick: { about: 'the apothecary', say: 'the picker open at the second pot', page: true,
    run: () => { window.__reset(); window.__crew(1, 4, 1, 2);
                 window.__grant({ dust: 60000, spores: 9000, shards: 3000, sparks: 20 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__brews(5);
                 window.__buy('anotherpot'); window.__finish();
                 window.__buy('anotherpot'); window.__finish();
                 window.__pot('stew', 0); window.__pot('brace', 1);
                 window.__look(st().apothecaryX - 200);
                 const b = window.__potSpot(1); hover(b.x + b.w / 2, b.y + b.h / 2); } },
  // The "for" section lists the trades that stand and none that do not.
  apothpickone: { about: 'the apothecary', say: 'the picker at a pot before the quarry: rockhands and farmhands, nobody else', page: true,
    run: () => { window.__reset(); window.__crew(1, 4, 0, 2);   // no quarrier: the cut stays shut
                 window.__grant({ dust: 60000, spores: 9000, shards: 3000, sparks: 20 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__pot('stew', 0);
                 window.__look(st().apothecaryX - 200);
                 const b = window.__potSpot(0); hover(b.x + b.w / 2, b.y + b.h / 2); } },

  // --- the kit ----------------------------------------------------------------
  // The props have fallen, which is what opens the rock's kit.
  hatbar: { about: 'the kit', say: 'a helmet being made, the bar over the shack',
    run: () => { window.__reset(); window.__crew(3, 3); window.__jump(PROP_FROM);
                 window.__give(3000); window.__grant({ shards: 99 });
                 S.shieldsDone = ['props']; window.__shack();
                 window.__buy('breaker'); window.__fast(4); window.__look(st().shackX - 200); } },
  // The four boards the kit is sold on.
  kitshack: { about: 'the kit', say: "the breaker on the shack's board",
    run: () => { rich(); S.shieldsDone = ['props']; window.__kit({ breakers: 1 }); window.__shack();
                 window.__board('shack'); } },
  kitquarry: { about: 'the kit', say: "the blaster on the cut's board",
    run: () => { rich(); S.shieldsDone = ['props', 'net', 'arch']; window.__kit({ blasters: 1 });
                 window.__board('quarry'); } },
  kitfarm: { about: 'the kit', say: "the grower on the plots' board",
    run: () => { rich(); S.shieldsDone = ['props', 'net']; window.__kit({ growers: 1 });
                 window.__board('farm'); } },
  // The drill and the tiller on their boards, greyed short of their set of
  // hats, and the drill again with the set bought.
  drillshort: { about: 'the kit', say: "the drill greyed on the cut's board, three blasters short",
    run: () => { rich(); window.__machineGates(); window.__kit({ blasters: 2, growers: 0, learned: true });
                 window.__board('quarry'); } },
  tillershort: { about: 'the kit', say: "the tiller greyed on the plots' board, five growers short",
    run: () => { rich(); window.__machineGates(); window.__kit({ blasters: 0, growers: 0, learned: true });
                 window.__board('farm'); } },
  drillset: { about: 'the kit', say: "the drill for sale with its five blasters bought",
    run: () => { rich(); window.__machineGates(); window.__kit({ learned: true });
                 window.__board('quarry'); } },
  tillerset: { about: 'the kit', say: "the tiller for sale with its five growers bought",
    run: () => { rich(); window.__machineGates(); window.__kit({ learned: true });
                 window.__board('farm'); } },
  kitbench: { about: 'the kit', say: 'the carter on the bench, beside the belt',
    run: () => { rich(); S.shieldsDone = ['props']; window.__kit({ carters: 2 });
                 window.__board('bench'); } },
  // Bought through the row; they roll off the stand by themselves, and the
  // run is long enough for a laden drive or two.
  forklift: { about: 'the kit', say: 'three forklifts on the road with nobody aboard, smoking',
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 30000 }); lip();
                 for (let i = 0; i < 3; i++) { window.__buy('driver'); window.__finish(); }
                 window.__fast(30);
                 const l = st().lifts.find(k => k.carry) || st().lifts[0];
                 window.__look((l ? l.x : ladenHauler()) - st().viewW / 2); } },
  // The forklift's two ladders on the bench, sold from rung five.
  liftboard: { about: 'the kit', say: "the bench's board with a forklift bought: its two ladders, four pips each",
    run: () => { rich(); lip(); window.__kit({ drivers: 1 }); window.__fast(2); window.__board('bench'); } },
  // The camera held up so the strip under the ground is in the picture.
  liftroster: { about: 'the kit', say: 'the carriers under the house and the forklifts under the garage',
    run: () => { rich(); lip(); window.__kit({ drivers: 2 }); window.__fast(20);
                 const s = st(); window.__look(s.houses.door - s.viewW / 2);
                 S.camLockY = S.groundY - S.viewH * 0.35; } },
  // Thirty haulers, four of them carting, and three forklifts: the carriers'
  // counter past its twelve, and the garage with its own counter.
  carriers: { about: 'the kit', say: 'thirty haulers, four carts and three forklifts: the house and the garage counters',
    run: () => { rich(); window.__crew(3, 30); window.__kit({ carters: 4, drivers: 3 }); window.__fast(20);
                 const s = st(); window.__look(s.houses.door - s.viewW / 2 + 60);
                 S.camLockY = S.groundY - S.viewH * 0.35; } },
  // Eighteen on the rock, three of them breakers: the diggers' counter past twelve.
  diggers: { about: 'the kit', say: "eighteen on the rock, three breakers: the diggers' counter",
    run: () => { rich(); window.__crew(18, 2); window.__kit({ breakers: 3 }); window.__fast(20);
                 const s = st(); window.__look(s.rockLeftX - s.viewW / 2);
                 S.camLockY = S.groundY - S.viewH * 0.35; } },
  liftstand: { about: 'the kit', say: 'the garage by the house with all three forklifts inside, the yard clean',
    // The floor cleared and nobody working, so nothing falls to fetch and all
    // three stay in the garage.
    run: () => { window.__reset(); window.__crew(0, 0); window.__fullSites(); window.__crew(0, 0);
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 30000 }); lip();
                 for (let i = 0; i < 3; i++) { window.__buy('driver'); window.__finish(); }
                 window.__clearFloor(); window.__fast(3);
                 window.__look(st().benchX - 180 - st().viewW / 2); } },
  driverrow: { about: 'the kit', say: 'the forklift row on the bench, beside the carts',
    run: () => { rich(); S.shieldsDone = ['props']; lip(); window.__board('bench'); } },
  kit: { about: 'the kit', say: 'every hat there is, worn',
    run: () => { window.__reset(); window.__crew(3, 3, 3, 3);
                 window.__kit({ breakers: 3, carters: 3, blasters: 3, growers: 3 });
                 window.__fast(20); window.__look(st().shackX - 300); } },

  // --- the house and the sky --------------------------------------------------
  // The balloons are what take the sky down: two up among the clouds, each
  // drawing a stream out of its cloud.
  filtering: { about: 'the house and the sky', say: 'the balloons filtering a filthy sky',
    run: () => { rich(); window.__air({ open: true, haze: 2600 }); window.__fast(2);
                 window.__buy('balloon'); window.__finish(); window.__buy('balloon'); window.__finish();
                 window.__air({ purifiers: 2 }); window.__fast(14);
                 window.__look(st().filterX - 200); } },
  // The house just finished, with its own balloon rising from the first post.
  filterballoon: { about: 'the house and the sky', say: 'the air filter just built, its balloon going up',
    run: () => { rich(); window.__crew(0, 0, 1, 1); window.__machine('ram', { bought: true });
                 S.crew += 4; window.__air({ rains: 1, haze: 2600 }); S.seenAir = true; window.__fast(2);
                 window.__buy('unlockfilter'); window.__finish(); window.__fast(5);
                 window.__look(st().filterX - 200); } },
  // The shed and its dial at three readings (DESIGN.md, "The air filter").
  filterclean: { about: 'the house and the sky', say: 'the air filter under a clean sky',
    run: () => { rich(); window.__air({ open: true, haze: 0 }); window.__fast(20);
                 window.__look(st().filterX - 300); } },
  filterhalf: { about: 'the house and the sky', say: 'the air filter reading a half sky',
    run: () => { rich(); window.__air({ open: true, haze: 1400, muck: 0 }); window.__fast(20);
                 window.__look(st().filterX - 300); } },
  filterbrim: { about: 'the house and the sky', say: 'the air filter reading a sky at the brim',
    run: () => { rich(); window.__air({ open: true, haze: 4200, muck: 0 }); window.__fast(20);
                 window.__look(st().filterX - 300); } },
  moored: { about: 'the house and the sky', say: 'a balloon moored at the mast',
    run: () => { rich(); window.__air({ open: true }); window.__fast(2);
                 window.__buy('balloon'); window.__finish(); window.__fast(2); window.__look(st().filterX - 220); } },
  filterboard: { about: 'the house and the sky', say: "the air filter's board",
    run: () => { rich(); window.__air({ open: true }); window.__fast(2);
                 window.__buy('balloon'); window.__finish(); window.__board('filter');
                 window.__look(st().filterX - 300); } },
  // `page` on the two with a craft in the air: the camera reads `craft` off
  // the page's snapshot, which the node yard's has not got.
  balloon: { about: 'the house and the sky', say: 'a balloon crewed and out over the yard', page: true,
    run: () => { rich(); window.__air({ open: true, haze: 1800 }); window.__fast(2);
                 window.__buy('balloon'); window.__finish(); window.__air({ purifiers: 2 }); window.__fast(30);
                 window.__look(st().craft[0].x - 380); window.__fast(3); } },
  // A rider under the stew and the strong brew: the plume goes up off the
  // basket among the clouds, not off the post it is held at.
  balloondose: { about: 'the house and the sky', say: 'a dosed rider, its plume off the basket', page: true,
    run: () => { rich(); window.__air({ open: true, haze: 1800 }); window.__fast(2);
                 window.__buy('balloon'); window.__finish(); window.__air({ purifiers: 2 }); window.__fast(30);
                 window.__dose(TYPE.PURIFY, 'stew'); window.__dose(TYPE.PURIFY, 'strong');
                 window.__look(st().craft[0].x - 380); window.__fast(3); } },
  // The sky at four levels (DESIGN.md, "The sky is the band").
  sky0: { about: 'the house and the sky', say: 'a clear sky', run: () => skyAt(0) },
  sky1: { about: 'the house and the sky', say: 'a light sky', run: () => skyAt(900) },
  sky2: { about: 'the house and the sky', say: 'a heavy sky', run: () => skyAt(2100) },
  sky3: { about: 'the house and the sky', say: 'a sky at the brim', run: () => skyAt(4200) },
  rainbrew: { about: 'the house and the sky', say: "the storm brewing up, the clouds half swelled",
    run: () => { skyAt(4200); untilBrewing(); window.__fast(20); } },
  cloudswell: { about: 'the house and the sky', say: 'a heavy front at the end of its brew, no rain yet',
    run: () => { skyAt(0); untilBrewing(); window.__fast(37); } },
  cloudlight: { about: 'the house and the sky', say: 'a light front: a few larger clouds, a light shower',
    run: () => { skyAt(0); untilRaining(0.3); window.__fast(6); } },
  cleanrain: { about: 'the house and the sky', say: 'a full storm over a clean sky: water, no acid',
    run: () => { skyAt(0); untilRaining(); window.__fast(18); } },
  acidrain: { about: 'the house and the sky', say: 'the same storm over a brim sky: the wash among the water',
    run: () => { skyAt(4200); untilRaining(); window.__fast(18); } },
  // The mess tags (messtags.js): the acid storm's muck down through the
  // rain itself, and a few patches of the crew's own poop by the rock that
  // nobody but a janitor may shift, so both cards are up with the crew
  // sweeping under them.
  messtags: { about: 'the house and the sky', say: "the muck and poop tags over a yard the storm has dirtied",
    run: () => { skyAt(4200); untilRaining(); window.__fast(18); messPoop(); window.__fast(1); } },
  // The same with a notice's card up, which the tags stand under. Replaying
  // the record is the one way to put a notice up on a yard that has earned
  // them all already.
  messtoast: { about: 'the house and the sky', say: "the mess tags standing under a notice's card",
    run: () => { skyAt(4200); untilRaining(); window.__fast(18); messPoop(); S.wonShown = 0; window.__fast(1); } },
  raindrizzle: { about: 'the house and the sky', say: 'the drizzle',
    run: () => { skyAt(4200); untilRaining(); window.__fast(2); } },
  rain: { about: 'the house and the sky', say: 'the full pour',
    run: () => { skyAt(4200); untilRaining(); window.__fast(18); } },
  // The three sheets against each other, scrolled well off the seed so the
  // backdrop ones have slid behind the near one: fine pale flecks far off,
  // long coarse strokes close in, and a cloud in front of everything but the
  // sheet that lands (DESIGN.md, "The rain has depth too").
  raindepth: { about: 'the house and the sky', say: 'the pour in three sheets: fine and pale far, coarse and dark near',
    run: () => { skyAt(4200); untilRaining(); window.__fast(18); window.__look(st().shackX - 900); window.__fast(1.5); } },
  lightning: { about: 'the house and the sky', say: 'a bolt over the pour',
    run: () => { skyAt(4200); untilRaining(); window.__fast(14); window.__strike(9, 0); } },
  lightningflash: { about: 'the house and the sky', say: 'the flash of a strike',
    run: () => { skyAt(4200); untilRaining(); window.__fast(14); window.__strike(9, 9); } },
  raintaper: { about: 'the house and the sky', say: 'the taper at the end of the storm',
    run: () => { skyAt(4200); untilRaining();
                 for (let i = 0; i < 90 && st().smog.rainFor < st().smog.stormLen - 4; i++) window.__fast(1); } },
  // The first muck's scene (firstmuck.js): a filthy first storm let run to
  // its last drop, then the yard left to send somebody, and the scene caught
  // as it starts. Rockhands alone, the early yard, so one is sent off the
  // rock; the second has haulers, whose own clear-up picks the body.
  firstmuck: { about: 'the house and the sky', say: 'the first muck after the first storm: a rockhand sent for it',
    run: () => firstMuck(3, 0) },
  'firstmuck-hauler': { about: 'the house and the sky', say: 'the first muck after the first storm: a hauler goes for it',
    run: () => firstMuck(2, 2) },
  cloudsettle: { about: 'the house and the sky', say: 'the clouds settling after the shower',
    run: () => { skyAt(0); untilRaining();
                 for (let i = 0; i < 120 && st().smog.raining; i++) window.__fast(1);
                 window.__fast(12); } },
  // Dust, haze and a flag in one frame, because the claim is that the three
  // lean together. The clock is seeded, and the two times are where the wind
  // actually is strongest each way inside the first eighty seconds, found by
  // running wind.js: the lull envelope means a time that merely sounds windy
  // is a shot of a lull. Compare the pair side by side.
  gustR: { about: 'the house and the sky', say: 'the wind at its strongest, blowing right',
    run: () => { window.__seed(1); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 5000 });
                 window.__air({ haze: 2100 }); window.__fast(64.5); window.__look(st().rockLeftX - 300); } },
  gustL: { about: 'the house and the sky', say: 'the wind at its strongest, blowing left',
    run: () => { window.__seed(1); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 5000 });
                 window.__air({ haze: 2100 }); window.__fast(50); window.__look(st().rockLeftX - 300); } },

  // --- the tower --------------------------------------------------------------
  // The star wants the meteor open or there is nothing up there to look at.
  westend: { about: 'the tower', say: 'the tower, the star and the ground under it',
    run: () => { rich(); window.__meteor(); window.__fast(3); window.__look(st().towerX - 420); } },
  // The tower's stand box is wider than the thing the pole stands on. Calling
  // the meteor down pans the camera off to it and the harness runs a second
  // more, so a camera set once has wandered by the shot: pin it every frame.
  towerflag: { about: 'the tower', say: "the tower's offer flag", page: true,
    run: () => { rich(); window.__meteor(); window.__fast(3);
                 const x = st().towerX - 361;
                 window.__look(x);
                 pinCamera(x); } },
  // The things the enchantments are about (a machine, the closet) stand, so
  // every spell row does.
  towerboard: { about: 'the tower', say: "the tower's board",
    run: () => { rich(); window.__meteor(); window.__loo();
                 window.__machine('ram', { bought: true }); window.__board('tower'); } },

  // The sphere: a ring of three up at the star, the tower's ladders topped, the
  // sphere bought from its row and poured for `secs`. Twenty seconds before
  // the purchase gets them up there; a fresh star, since a topped ring has
  // stripped the first by then.
  sphererising: { about: 'the tower', say: 'the ring pouring the sphere round the star, half closed',
    run: () => sphereAt(20) },
  sphere: { about: 'the tower', say: 'the sphere closed, one wizard tending it, sparks falling',
    run: () => sphereAt(60) },
  // Ten seconds on from `sphere`: the same shell turned a fifth of the way
  // round, for looking at the two side by side.
  sphereturned: { about: 'the tower', say: 'the sphere ten seconds later, turned on its axis',
    run: () => sphereAt(70) },
  spheretopped: { about: 'the tower', say: 'the sphere with its three rungs: most seams covered over',
    run: () => { sphereAt(60); S.machines.sphere.tune = 3; } },

  // --- the casino -------------------------------------------------------------
  // The table stood up, the arm held and let go, the sign tapped: the same
  // calls a press and a tap make.
  //   window.__casinoStakes(dust)    the casino open, dust in the hole
  //   window.__casinoStake(n)        ...and the arm held until the stake is n, let go, the pour settled
  //   window.__casinoHand()          ...and the sign tapped, the hand played out to the pay run out
  // The marquee at rest: the casino open, nothing staked, no hand just
  // played -- every other bulb, the sets swapping on the slow beat.
  casinoidle: { about: 'the casino', say: 'the sign idle: CASINO, every other bulb lit',
    run: () => { window.__casinoStakes(6000); window.__fast(0.5); window.__look(st().casinoX - 380); } },
  // The hold: the arm down, the stake raining into the funnel, the sign
  // counting it up, the bulbs chasing.
  casinopour: { about: 'the casino', say: 'the arm pulled to the bottom: the stake pouring into the funnel, the sign counting',
    run: () => { window.__casinoStakes(6000); window.__holdArm(true, 1); window.__fast(1.5);
                 window.__look(st().casinoX - 380); } },
  // ...and pushed to the top: the stake pouring back out to the purse, the
  // sign counting down, the chase running the other way.
  casinopush: { about: 'the casino', say: 'the arm pushed to the top: the stake pouring back to the purse',
    run: () => { window.__casinoStakes(6000); window.__casinoStake(1500); window.__holdArm(true, -1); window.__fast(0.8);
                 window.__look(st().casinoX - 380); } },
  // The stake standing, the arm let go: the sign ready, on the count and on
  // the words, the sparkle on the bulbs; and the sign pressed.
  casinosignready: { about: 'the casino', say: 'the sign ready: the count on it, the sparkle on the bulbs',
    run: () => { window.__signFace(0); window.__casinoStakes(6000); window.__casinoStake(200); window.__fast(0.2);
                 window.__look(st().casinoX - 380); } },
  casinosignwords: { about: 'the casino', say: 'the sign ready, on the words: DROP IT',
    run: () => { window.__signFace(1); window.__casinoStakes(6000); window.__casinoStake(200); window.__fast(0.2);
                 window.__look(st().casinoX - 380); } },
  casinosigntwin: { about: 'the casino', say: 'the sign ready with the twin chase instead of the sparkle',
    run: () => { window.__signFace(0); window.__readyLights('twin'); window.__casinoStakes(6000); window.__casinoStake(200); window.__fast(0.2);
                 window.__look(st().casinoX - 380); } },
  casinosignpressed: { about: 'the casino', say: 'the sign tapped: the board down, the figures grey, the floor opening',
    run: () => { window.__casinoStakes(6000); window.__casinoStake(200); window.__tapSign(); window.__fast(0.05);
                 window.__look(st().casinoX - 380); } },
  // A hand mid-cascade: the pile draining into the throat, the pebbles on the
  // pegs with the first in the bins, the sign running down.
  casino: { about: 'the casino', say: 'the sign tapped: the pile draining, the pebbles on the pegs',
    run: () => { window.__casinoStakes(6000); window.__casinoStake(200); window.__tapSign(); window.__fast(0.9);
                 window.__look(st().casinoX - 380); } },
  // The bins paying, middle outward: a foot inverted for the bin on its beat,
  // the box counting up, its pebbles falling through the foot and out.
  casinopaying: { about: 'the casino', say: 'the bins paying out of the foot, a bin a beat',
    run: () => { window.__casinoStakes(6000); window.__casinoStake(200); window.__tapSign();
                 for (let f = 0; f < 1200 && !(st().drop && st().drop.stage === 'pay'); f++) window.__fast(1 / 60);
                 window.__look(st().casinoX - 380); } },
  // A hand just paid: the pay heaped in the tray in its own kinds, standing
  // its beat, the box saying the multiple and the change.
  casinopourout: { about: 'the casino', say: 'the pay heaped in the tray, in its own kinds',
    run: () => { window.__casinoStakes(6000); window.__casinoStake(1000); window.__tapSign();
                 for (let f = 0; f < 3600 && !(st().tray > 0 && st().toTray === 0 && !st().drop); f++) window.__fast(1 / 60);
                 window.__look(st().casinoX - 300); } },
  // ...and the tray flying it out of the hatch into the hole.
  casinopaid: { about: 'the casino', say: 'the tray flying the pay out of the hatch into the hole',
    run: () => { window.__casinoStakes(6000); window.__casinoStake(1000); window.__tapSign();
                 for (let f = 0; f < 3600 && !(st().toHole > 0); f++) window.__fast(1 / 60);
                 window.__fast(0.6); window.__look(st().casinoX - 300); } },
  // A win: hands are played until one pays more than it took, and the shot is
  // a beat after -- the strobe on the sign and the fountains in the air.
  casinowin: { about: 'the casino', say: 'a win: the strobe and the fountains',
    run: () => { window.__casinoStakes(60000);
                 for (let i = 0; i < 12; i++) {
                   window.__casinoStake(500); window.__casinoHand();
                   for (let f = 0; f < 400 && (st().paying || st().tableAir); f++) window.__fast(1 / 60);
                   window.__clearFloor();
                   if (st().hand && st().hand.won) break;
                 }
                 window.__fast(0.4);
                 window.__look(st().casinoX - 380); } },

  // --- the pit and the rift ---------------------------------------------------
  // Run for a minute first: a board opened on a yard one frame old reads
  // noughts.
  books: { about: 'the pit and the rift', say: 'the books over the pit',
    run: () => { rich(); window.__fast(60); window.__board('stats'); window.__look(st().pitX - 300); } },
  // The picker (wardrobepage.js), opened by its row on the house's board; the
  // board with that row on it; and the same page as a new yard offers it,
  // before the opening walks out.
  wardrobe: { about: 'the story', say: 'the picker on the held sheet, opened from the house board', page: true,
    run: () => { window.__fast(1); pairDoor(); } },
  'house-pair': { about: 'the story', say: 'the house board, its row to the two of you on top',
    run: () => { rich(); window.__crew(6, 5, 5, 4); window.__fast(1); window.__board('house'); window.__look(st().houses.door - 400); } },
  'wardrobe-offer': { about: 'the story', say: 'the picker offered at a new yard, before the opening', page: true,
    run: () => { window.__reset(); window.__fast(1); S.dressOffered = false; offerDress(true); } },
  // The picker's grid with a few head items locked by a stand-in lock (the
  // wardrobe's own are another branch's), one tried on the close-up and
  // another's lock said under the grid as a hover says it.
  'wardrobe-locked': { about: 'the story', say: 'the picker with locked head items, one tried on, another hovered', page: true,
    run: () => {
      window.__fast(1);
      const lock = { kind: 'scene', id: 'scene', name: 'a stand-in lock', note: 'the wardrobe names what opens it' };
      pairDoor();
      lockForCheck((slot, key) => (slot === 'head' && ['crown', 'beret', 'mohawk', 'headband'].includes(key) ? lock : null));
      wear('you', { head: 'none' });
      document.getElementById('ward-tile-head-crown')?.click();
      document.getElementById('ward-tile-head-beret')?.dispatchEvent(new PointerEvent('pointerenter'));
    } },
  // Who you are (DESIGN.md): a new yard's four steps, the two of them named
  // and given roles by the steps' own calls, each step stood by its next.
  // And the first with a pad seen, off Steam: the letter grid.
  'who-build': { about: 'the story', say: 'a new yard\'s first step: build who you are, named', page: true,
    run: () => whoSteps(0) },
  'who-confirm': { about: 'the story', say: 'a new yard\'s second step: confirm your square', page: true,
    run: () => whoSteps(1) },
  'who-sqouse': { about: 'the story', say: 'a new yard\'s third step: build your sqouse, named', page: true,
    run: () => whoSteps(2) },
  'who-both': { about: 'the story', say: 'a new yard\'s last step: the two of you', page: true,
    run: () => whoSteps(3) },
  'who-pad': { about: 'the story', say: 'a new yard\'s first step on a pad, off Steam: the letter grid', page: true,
    run: () => { whoSteps(0); S.padOn = true; } },
  // The page once the steps are behind a yard: the name and the role still
  // open to change.
  'who-settings': { about: 'the story', say: 'the two of you off the house board, mid-game, the name and the role editable', page: true,
    run: () => { window.__reset(); window.__fast(1); S.dressOffered = true;
                 window.__self('you', { name: 'Ada', role: 'wife' }); window.__self('sqouse', { name: 'Bram', role: 'ouse' });
                 pairDoor(); } },
  // A few of the story's lines with the two of them named: the first step's
  // card, the rescue's sheet, the index's entry. `window.__whoRole` the
  // sqouse's role ('wife', 'ouse', 'husband'), `window.__whoName` its name
  // ('' for none).
  'who-card': { about: 'the story', say: 'the story card naming your sqouse',
    run: () => { window.__reset(); whoNamed(); window.__fast(1); } },
  'who-saved': { about: 'the shields', say: 'the rescue sheet naming your sqouse',
    run: () => { window.__reset(); window.__fast(1); whoNamed(); S.rescued = true; S.buried = false; S.buriedMs = 252000; } },
  'who-index': { about: 'the story', say: 'the index open on your sqouse, named', page: true,
    run: () => { indexYard(); whoNamed(); pressI(); indexPick('sqwife'); } },
  // The controls tab of the settings sheet, turned to by its tab.
  controlspage: { about: 'the story', say: 'the controls page on the held sheet', page: true,
    run: () => { dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
                 document.getElementById('settingsbtn').click();
                 document.querySelector('#held .settabs button[data-tab="controls"]').click(); } },
  // The same page once a pad has been seen: its column and its rows drawn in,
  // as pad.js's first press draws them.
  controlspad: { about: 'the story', say: 'the controls page with a pad seen', page: true,
    run: () => { fillControls(document.getElementById('controlslist'), true);
                 dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
                 document.getElementById('settingsbtn').click();
                 document.querySelector('#held .settabs button[data-tab="controls"]').click(); } },
  // The settings sheet on each of its other tabs (settingstabs.js).
  settingsgraphics: { about: 'the story', say: 'the settings on the held sheet, the graphics tab', page: true,
    run: () => settingsTab('graphics') },
  settingsaudio: { about: 'the story', say: 'the settings on the held sheet, the audio tab', page: true,
    run: () => settingsTab('audio') },
  settingslanguage: { about: 'the story', say: 'the settings on the held sheet, the language tab', page: true,
    run: () => settingsTab('language') },
  // The index (indexpage.js): a mid-game yard with most things met, the book
  // opened by its key and muck picked; a few entries still unread, so their
  // dots show. On a phone (WINDOW=390,844) the list, then muck pushed over it.
  index: { about: 'the story', say: 'the index on the held sheet, open on muck', page: true,
    run: () => { indexYard(); pressI(); indexPick('muck'); } },
  // The same book scrolled down to the places and to the crew, for their icons.
  indexplaces: { about: 'the story', say: 'the index open on the farm, among the places', page: true,
    run: () => { indexYard(); pressI(); indexPick('farm'); } },
  indexcrew: { about: 'the story', say: 'the index open on its last crew entry', page: true,
    run: () => { indexYard(); pressI(); [...document.querySelectorAll('#index .it')].filter(el => INDEX.find(e => e.key === el.dataset.key)?.group === 'crew').pop()?.click(); } },
  indexphone: { about: 'the story', say: 'the index on a phone: the list', page: true,
    run: () => { indexYard(); window.__coarse(true); pressI(); } },
  indexphoneentry: { about: 'the story', say: 'the index on a phone: muck pushed over the list', page: true,
    run: () => { indexYard(); window.__coarse(true); pressI(); indexPick('muck'); } },
  // The saves page of the held sheet, opened by its button, and the same page
  // with the open slot's delete pressed: the confirm open under its row.
  // Nothing is answered, so no slot is touched.
  savespage: { about: 'the story', say: 'the saves page on the held sheet', page: true,
    run: () => { dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
                 document.getElementById('slotsbtn').click(); } },
  savesask: { about: 'the story', say: 'the saves page, a delete asking', page: true,
    run: () => { dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
                 document.getElementById('slotsbtn').click();
                 document.querySelector('#slots .del:not(.none)')?.click(); } },
  // Every sheet of the books: long enough for the arrows (two windows of
  // record), and a machine putting soot up so the sky sheet has a story.
  booksall: { about: 'the pit and the rift', say: 'every sheet of the books in their window, arrows and all',
    run: () => { rich(); S.seenAir = true; window.__machine('jaw', { bought: true }); window.__fast(150);
                 window.__look(st().pitX - 300); window.__window('books'); } },
  // Half a second in lands this in the middle of the gulp. Not `rich()`: its
  // grant opens the rift during the setup, so the scene would open on a yard
  // that had already had the moment.
  tear: { about: 'the pit and the rift', say: 'the hole giving way',
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999 });
                 window.__meteor(); window.__give(60000); window.__fast(0.5); window.__look(st().pitX - 300); } },
  // The tear's cutscene from its start: past the first rock (its reunion would
  // hold the yard otherwise), the gulp not yet taken.
  'tear>': { about: 'the pit and the rift', say: 'the hole filled past its brim, the tear scene from its start',
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__jump(3); window.__fullSites();
                 window.__meteor(); window.__give(60000); } },
  // The drowning's cutscene from its start, the pit one gulp short of drowned.
  'drown>': { about: 'the pit and the rift', say: 'the disc about to give way, the drowning scene from its start',
    run: () => { rich(); window.__meteor(); window.__tear(ABYSS_AT - 500); window.__give(30000); } },
  rift: { about: 'the pit and the rift', say: 'the rift, torn and fed',
    run: () => { rich(); window.__meteor(); window.__rift(); window.__give(60000); window.__give(12000);
                 window.__fast(4); window.__look(st().pitX - 260); } },
  grown: { about: 'the pit and the rift', say: 'the disc half grown',
    run: () => { rich(); window.__meteor(); window.__tear(ABYSS_AT * 0.4); window.__give(30000);
                 window.__fast(3); window.__look(st().pitX - 300); } },
  // The pan clamps at the end of the world, so the disc sits against the
  // right edge however much further you ask for; `--zoom 2` is the closest
  // look that still holds the whole rim.
  rim: { about: 'the pit and the rift', say: 'the rim, as close as the camera comes',
    run: () => { rich(); window.__meteor(); window.__tear(ABYSS_AT * 0.4); window.__give(30000);
                 window.__fast(3); window.__look(st().pitX - 155); } },
  // A second before the shot lands this mid-liquefy, with the cutscene's own
  // camera on it.
  drown: { about: 'the pit and the rift', say: 'the disc giving way and drowning',
    run: () => { rich(); window.__meteor(); window.__tear(ABYSS_AT - 500); window.__give(30000); window.__fast(0.6); } },
  // The rescue had with the pit still solid: its sheet put down, the hole is
  // owed the rest of the arc (`owedArc` in rift.js). Run on for twenty-odd
  // seconds to watch the tear, the swell and the drowning.
  'abyss-owed': { about: 'the pit and the rift', say: 'rescued before the pit drowned: the tear, the swell, the drowning',
    run: () => { window.__reset(); window.__crew(3, 3); window.__give(20000); window.__fast(1);
                 S.rescued = true; S.buried = false; window.__fast(1 / 60); window.__skipBeat('sheet');
                 window.__look(st().pitX - 300); } },

  // The serpent showing itself on the drowned pit's surface (glimpse.js),
  // one scene a kind, forced up so the moment named lands in the middle of
  // the window (where `--zoom` crops), caught a second short of it for the
  // shot tool's second. `back` is how far it has travelled by then, in cells.
  ...Object.fromEntries([['hump', 5.2, 7, 'the coil\'s back rolling along the surface'],
                         ['fin', 4.6, 18, 'the crest crossing like a fin, the bow wave ahead'],
                         ['watcher', 5.5, 0, 'the top of the head, the eye open on the nearest body']]
    .map(([kind, into, back, say]) => [`glimpse-${kind}`, { about: 'the pit and the rift', say: `a glimpse: ${say}`,
      run: () => { window.__reset(); window.__crew(2, 3); window.__rift(); window.__fast(1);
                   window.__look(st().pitX + 120);
                   const mid = Math.round((S.camX + S.viewW / 2) / P);
                   window.__glimpse(kind, { into, x: mid - back, dir: 1 }); } }])),

  // Life seen through the torn rift (riftlife.js), one scene a kind at the
  // grown disc and again just torn, where the same crossing is a keyhole.
  // Each is forced in so its moment is at the middle of the window a second
  // on, when the shot tool takes it: `at(R)` is how far in that is, from the
  // disc's radius in cells.
  ...Object.fromEntries([
    ['shoal', 'a shoal of dark shapes crossing far off', { d: 0, n: 4, y: 0 },
     R => (R + 1 + 7) / RIFTLIFE_SPEED[0]],
    ['creature', 'one of the deep\'s creatures nearer, in its own tones', { d: 2, of: 0, y: 0 },
     R => (R + 1 + 5) / RIFTLIFE_SPEED[2]],
    ['coil', 'the serpent far off: a length of his coil sliding past', { y: 0 },
     R => (R * 1.5 + RIFTLIFE_COIL.coil.enter) / RIFTLIFE_COIL.coil.v],
    ['crest', 'the serpent nearer: his crest along the bottom of the window', {},
     R => (R * 1.3 + RIFTLIFE_COIL.crest.enter) / RIFTLIFE_COIL.crest.v],
    ['eye', 'the serpent\'s eye at the window, looking', {}, () => 4.2],
  ].flatMap(([kind, say, pin, at]) => [['', 'grown', ABYSS_AT * 0.85], ['-torn', 'just torn', 0]]
    .map(([tail, size, ate]) => [`riftlife-${kind}${tail}`, { about: 'the pit and the rift',
      say: `through the rift, ${size}: ${say}`,
      run: () => { window.__reset(); window.__crew(2, 3); window.__tear(ate); window.__fast(2);
                   window.__look(riftCenter().x - S.viewW / 2);
                   window.__riftLife(kind, { ...pin, dir: 1, into: Math.max(0, at(riftRadius() / P) - 1) }); } }]))),

  // --- the shields ------------------------------------------------------------
  // The `!` scenes run the crew's five-second dance through, so the shot is
  // the rock meeting the shield rather than the dance before it.
  shieldrow: { about: 'the shields', say: "the bench's board with a shield on offer", page: true,
    run: () => { shieldYard(); window.__board('bench'); } },
  shieldbuilding: { about: 'the shields', say: "the bench's board with the first shield ordered and waiting its turn, with the strip to cancel it", page: true,
    run: () => { shieldYard(); S.quarryOpen = S.farmOpen = S.towerOpen = S.meteorOpen = true;
                 window.__buy('house'); window.__buy('props'); window.__fast(2); window.__board('bench'); } },
  ...Object.fromEntries(SHIELD_ORDER.flatMap(k => [
    [k, { about: 'the shields', say: `the ${k}, built`, run: () => shieldBuilt(k) }],
    // Built through once so the yard is right, then finished a second time
    // by hand, because the built loop steps by whole seconds and a wave is
    // gone in less than one.
    [`${k}^`, { about: 'the shields', say: `the ${k} standing finished, the fanfare on it`,
                run: () => {
                  shieldBuilt(k);
                  if (k === 'dome') {
                    S.shield.laid = DOME_RINGS - 1;
                    S.shield.poured = DOME_WORK * (S.shield.laid / DOME_RINGS);
                    for (let i = 0; i < 1200 && S.shield.laid < DOME_RINGS; i++) window.__fast(1 / 60);
                  } else {
                    S.shield = null;
                    window.__buy(k);
                    window.__finish();
                  }
                  window.__fast(0.15);
                  window.__look(S.shield.x + S.shield.w / 2 - S.viewW / 2);
                } }],
    [`${k}!`, { about: 'the shields', say: `the rock reaching the ${k}`,
                run: () => { shieldBuilt(k); window.__next(); window.__fast(4.5); } }],
    // The same rock as it is let go, for a capture stepped on from here that
    // has the whole answer, the camera's way in included.
    [`${k}>`, { about: 'the shields', say: `the rock let go over the ${k}, the answer's scene from its start`,
                run: () => { shieldBuilt(k); window.__next(); } }],
    // A frame at a time until the rock is a dozen cells over the top, so the
    // answer itself is still to come: the dome's burst is over in a second.
    [`${k}*`, { about: 'the shields', say: `the rock just over the ${k}, the answer still to come`,
                run: () => {
                  shieldBuilt(k); window.__next();
                  const over = () => S.groundY - S.rockFall <= S.groundY - (S.shield.h + 12) * P;
                  for (let i = 0; i < 60 * 30 && S.shield && (!(S.rockFall > 0) || over()); i++) window.__fast(1 / 60);
                  if (S.shield) window.__look(S.shield.x + S.shield.w / 2 - S.viewW / 2);
                  window.__holdShot();
                } }],
    // Halfway through the labor, for what hangs over the site and how much of
    // the shield stands: the dome has no labor from the ground (`dome~`).
    ...(k === 'dome' ? [] : [[`${k}~`, { about: 'the shields', say: `the ${k} half-built, the picture over it`,
                run: () => {
                  shieldYard();
                  S.shieldsDone = SHIELD_ORDER.slice(0, SHIELD_ORDER.indexOf(k));
                  S.quarryOpen = S.farmOpen = S.towerOpen = S.meteorOpen = true;
                  window.__buy(k);
                  const halfway = () => {
                    const w = (S.works.yard || []).find(w => w.key === k);
                    return !w || w.done >= w.of / 2;
                  };
                  for (let i = 0; i < 900 && !halfway(); i++) window.__fast(1);
                  window.__look(S.cx - S.viewW / 2);
                } }]])
  ])),
  // The shield on the story's card (objbarrier.js), a scene a shape: on
  // offer short of the dust, on offer with it, waiting its turn behind a
  // house with the cancel up, and going up with the bar filling. A small
  // purse each, since a pit filled past its brim tears and the tear's scene
  // takes the card off the screen.
  propsoffer: { about: 'the shields', say: "the props on offer on the story's card, short of the dust",
    run: () => { cardYard(200); window.__fast(1); } },
  propsready: { about: 'the shields', say: "the props on offer on the story's card, paid for and the buy lit",
    run: () => { cardYard(2000); window.__fast(1); } },
  propsqueued: { about: 'the shields', say: "the props bought behind a house: the card's bar at nought and its cancel",
    run: () => { cardYard(20000); window.__buy('house'); window.__buy('props'); window.__fast(1); } },
  propsrising: { about: 'the shields', say: "the props going up: the card's bar part filled",
    run: () => { cardYard(2000); window.__buy('props'); window.__fast(12); } },
  farmstep: { about: 'the shields', say: "the props down: the story's card sells the farm, no line over it",
    run: () => { cardYard(2000); window.__answered('props'); window.__fast(4); } },
  // The props on offer with a notice up (the record replayed, as `messtoast`
  // does): on a phone the notice stands under the card rather than on it.
  propstoast: { about: 'the shields', say: "the props on the story's card with a notice up, which seats itself under it on a phone",
    run: () => { cardYard(200); S.wonShown = 0; window.__fast(1); } },
  // The same step before the bench offers the farm: the goal and its bill
  // stand on the card with the buy dimmed.
  farmgoal: { about: 'the shields', say: "the props down, short of the farm's dust: the farm the card's goal, its buy dimmed",
    run: () => { cardYard(100); window.__answered('props'); window.__fast(4); } },
  // The dome on offer: the three before it have failed and the tower stands,
  // so the story's card sells it, four coins, two of them met.
  domeoffer: { about: 'the shields', say: "the dome on offer on the story's card, four coins",
    run: () => { cardYard(20000); window.__crew(2, 1, 0, 0, 0, 1);
                 window.__answered('props', 'net', 'arch'); window.__meteor();
                 const half = Object.fromEntries(DOME_BILL.filter(([m]) => m !== 'dust').map(([m, n], k) => [m + 's', k ? n / 2 : n]));
                 window.__grant(half); window.__fast(2); } },
  domeboard: { about: 'the shields', say: "the tower's board with the dome on offer: its goal card first",
    run: () => { cardYard(300000); window.__crew(2, 1, 0, 0, 0, 1);
                 window.__answered('props', 'net', 'arch'); window.__meteor(); window.__board('tower'); } },
  // The star is left up so the shot proves the beams draw with one burning.
  'dome+': { about: 'the shields', say: 'the wizard called off the star, flat out for the dome',
    run: () => { domeCast(2.5); window.__look(st().shield.x - 1500); } },
  'dome~': { about: 'the shields', say: 'the dome being cast: the wizard over it, pouring',
    run: () => { domeCast(6); window.__look(st().shield.x - 260); } },
  // Proves the dome is refit for the rock that actually reaches it
  // (`refitShield`, from `makeBoulder`) rather than sized once at the pour.
  // The widest shield standing over the biggest rock, the shack beside it:
  // the bare ground between the shield's far leg and the hut's wall.
  shieldflank: { about: 'the shields', say: 'the dome over the biggest rock, the shack beside it',
    run: () => { shieldBuilt('dome'); window.__shack(); S.boulderNo = 40; window.__next(); window.__fast(8);
                 window.__look(st().shackX - 150); } },
  'dome!!': { about: 'the shields', say: 'the dome met by a rock ten rocks later, refit for it',
    run: () => { shieldBuilt('dome'); S.boulderNo += 10; window.__next(); window.__fast(4.5); } },
  // Frame by frame to the first frame of the fade, because the set-down is
  // slow and the fade is short.
  'dome-': { about: 'the shields', say: 'the dome fading out after the rescue, halfway gone',
    run: () => { shieldBuilt('dome'); S.buried = true; window.__next();
                 for (let i = 0; i < 60 * 120 && !(S.shield && S.shield.fading); i++) window.__fast(1 / 60);
                 window.__fast(DOME_FADE_MS / 2000); } },
  // The crew dig between rocks, so the dig is put back to nought once the
  // rock is in the air and nobody can.
  buried: { about: 'the shields', say: 'somebody in the ground, packed in, before anybody digs',
    run: () => { shieldBuilt('dome'); S.buried = true; window.__next(); window.__fast(4.5); S.buriedDug = 0; } },
  rescue: { about: 'the shields', say: 'the dome up, a rock coming, somebody under it',
    run: () => { shieldBuilt('dome'); S.buried = true; window.__next(); window.__fast(4.5); } },
  'rescue!': { about: 'the shields', say: 'the rock held on the dome, and the digging out under it',
    run: () => { shieldBuilt('dome'); S.buried = true; window.__next(); window.__fast(10); } },
  // A busy crew under the dome, the rock about to leave the sky: run on to
  // watch the rest walk out of the shot and back after (stage.js).
  'rescue-stage': { about: 'the shields', say: 'the rescue with a busy crew: everybody but the pair walks out of the shot',
    run: () => { shieldBuilt('dome'); window.__crew(4, 8, 0, 0, 0, 1); window.__fast(3);
                 S.buried = true; window.__next(); } },
  // The whole ending on a working yard: the ram on the rock and the belt
  // running when the rescue rock is let go, so a capture stepped on from here
  // shows what keeps working behind the dome, the dig, the sheet and the snatch.
  'ending-busy': { about: 'the shields', say: 'the ending on a working yard: ram and belt running, a big crew, then the snatch',
    run: () => { shieldBuilt('dome'); window.__machine('ram', { bought: true }); window.__machine('belt', { bought: true });
                 window.__crew(6, 10, 0, 0, 0, 1); window.__fast(4); S.buried = true; window.__next(); } },
  saved: { about: 'the shields', say: 'the end of the story: the sheet after the rescue',
    run: () => { shieldBuilt('dome'); S.buried = true; window.__next(); window.__fast(45); } },

  // --- the store page ---------------------------------------------------------
  // Shots for a store page: a working surface yard with nothing past it --
  // no rich grant (it opens the rift), no tower, no shields. The bench is
  // raised through its own call, so these need the page.
  steamhome: { about: 'the crew', say: 'store shot: the house, the bench, the shack and the rock, everyone at work', page: true,
    run: () => { steamYard(() => window.__look(st().houses.left + 150)); } },
  steamrock: { about: 'the rock', say: 'store shot: the rock and the hole, dust going over the lip', page: true,
    run: () => { steamYard(() => window.__look(st().shackX - 60)); } },
  steamsites: { about: 'the cut', say: 'store shot: the plots and the cut side by side, hands at both', page: true,
    run: () => { steamYard(() => window.__look(st().farmX - 120)); } },
  steamstorm: { about: 'the house and the sky', say: 'store shot: a bolt over the pour, the crew still at the rock', page: true,
    run: () => { steamYard(() => { window.__air({ haze: 4200 }); untilRaining(); window.__fast(14);
                                   window.__look(st().houses.left + 150); window.__strike(9, 0); window.__holdShot(); }); } },
  steamboard: { about: 'the plots', say: "store shot: the farm's board open over the plots and the cut", page: true,
    run: () => { steamYard(() => { window.__look(st().farmX - 120); window.__board('farm'); }); } },

  // --- the endgame ------------------------------------------------------------
  yard: { about: 'the endgame', say: 'the whole works, every machine running',
    run: () => { rich(); lip(); window.__buy('jaw'); window.__finish(); window.__buy('tiller'); window.__finish();
                 window.__buy('ram'); window.__finish(); window.__buy('belt'); window.__finish(); window.__fast(6);
                 window.__look(st().pitX - 400); } },
  endgame: { about: 'the endgame', say: 'the endgame yard, everything driven up its ladder',
    run: () => { rich(); lip(); window.__buy('jaw'); window.__buy('tiller');
                 window.__buy('ram'); window.__buy('belt'); window.__jump(30);
                 window.__machine('ram', { driven: true });
                 for (let i = 0; i < MACHINE_TUNE_RUNGS; i++) { window.__buy('tuneram'); }
                 window.__meteor(); window.__give(60000); window.__buy('rift');
                 for (let i = 0; i < 14; i++) window.__buy('riftrate');
                 window.__fast(20); window.__look(st().pitX - 700); } },
  // `__everything` walks the boards the way a player would, so a row added
  // tomorrow is bought here tomorrow. The shields are set first because
  // their rows are offered one at a time as the one before fails, and a
  // board walk cannot wait for a rock to fall. Framed on the rock end, which
  // every ladder changed most.
  everything: { about: 'the endgame', say: 'the actual endgame: everything bought, every ladder topped',
    run: () => { rich(); lip(); window.__crew(6, 5, 5, 7, 3, 3);
                 window.__grant({ sparks: 999999, shards: 999999, spores: 9999999, dust: 90000000 });
                 S.shieldsDone = SHIELD_ORDER.slice(0, 3); S.towerOpen = S.meteorOpen = true;
                 window.__everything(); window.__fast(20);
                 // A yard this far up its ladders breaks a rock a beat after it
                 // lands, and `look.mjs` runs a second more before the shot, so
                 // the scene ends a third of a second after a break: the next
                 // rock is just down, or just dropping, when that second is up.
                 for (let i = 0; i < 100 && st().rock > 0; i++) window.__fast(0.05);
                 window.__fast(0.35);
                 window.__look(st().rockLeftX - 500); } },
  // A thirty-hour yard, which is where the frame rate was reported: the
  // endgame above, every slot in the deep taken with the serpent up, the rock
  // in the tens of thousands and a crew of a hundred and seventy, the hands
  // over the endgame's going to whatever the yard shares them out to.
  // tools/node/late-perf.mjs times it.
  late: { about: 'the endgame', say: 'a thirty-hour yard: everything bought, seven stations in the deep, 170 crew',
    run: () => { SCENES.everything.run();
                 window.__snatch({ played: true });
                 window.__deepCrew({ spare: 3 });
                 window.__party({ stations: ['brawler', 'ranger', 'sapper', 'mage', 'hexer', 'monk', 'bard']
                                  .map(c => cast(c, 2)) });
                 window.__serpent({ level: 1, stage: 1 });
                 window.__jump(31621);
                 S.crew += Math.max(0, 170 - S.crew);
                 window.__deepCrew({ spare: 0 });   // shares the new hands out
                 window.__view('yard');
                 window.__fast(10);
                 window.__look(st().rockLeftX - 500); } },

  // A pad's focus (DESIGN.md, "Controller support"): the corner brackets on
  // a station, on a board's row and on the coil, each reached by presses
  // through `__pad` the way a player's thumb gets there, the camera given a
  // moment after each hop to arrive.
  'pad-yard': { about: 'the rock', say: "a pad's focus on the quarry, the brackets a cell clear of its shed",
    run: () => { rich(); window.__fullSites(); padTo('st:quarry'); } },
  'pad-board': { about: 'the bench', say: "a pad's focus on the farm's board, on its second row",
    run: () => { rich(); padTo('st:farm'); window.__pad.press('a'); window.__fast(0.3);
                 window.__pad.press('down'); } },
  'pad-deep': { about: 'the deep', say: "a pad's focus up from a station onto the coil, in the deep's purple",
    run: () => { stageScene(0, 0.33)(); padTo(null);
                 padTo(window.__pad.stops().find(s => s.startsWith('st:') && s !== 'st:crusher' && s !== 'st:pods'));
                 window.__pad.press('up'); } },

  ...deepScenes,

  // --- the acts (acts.js; DESIGN.md, "Acts 3 and 4") ---------------------------
  // Each act's place stood up empty: the scaffold's placeholder backdrop, the
  // act's facts blank, the yard and the deep running on underneath. The
  // switches handed back to the build, which in a dev build stands both.
  'after-empty': { about: 'the acts', say: 'the afterlife, empty: the placeholder cloud floor, nothing built on it',
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1); } },
  'hell-empty': { about: 'the acts', say: 'hell, empty: the placeholder black hollow and its floor, nothing built in it',
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('hell'); window.__fast(1); } },
  // Act 4's loop on its placeholder art (hell/; render/hell.js): the landing
  // at work, a barrier half down, and the cage room at the end of the run.
  // The ghosts take twenty seconds to come down the road, so each runs on.
  'hell-forge': { about: 'the acts', say: 'hell\'s landing at work: miners at the seam, a lit furnace, the smith at the anvil, brimstone off the vent',
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('hell');
                 window.__hell({ brimstone: 24, bars: { dross: 5 }, ore: { dross: 4 }, rungs: { hellmuster: 4 },
                                 vents: { 0: { crust: 8 } },
                                 furnaces: { 0: { fuel: 8, lit: true, warm: 1, hopper: { dross: 6 }, tray: { dross: 2 } } } });
                 window.__fast(32); } },
  'hell-wall': { about: 'the acts', say: 'hell\'s rubble half down: the wall gang swinging, spoil falling and carried to the heap',
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('hell');
                 window.__hell({ tool: 1, gang: 3, blows: { 0: 60 }, rungs: { hellmuster: 5 }, faces: { 0: { tool: 1 } },
                                 walls: { 0: { tool: 1, loose: 3, heap: 14 } },
                                 furnaces: { 0: { fuel: 6, lit: true, warm: 1 } } });
                 window.__fast(32); } },
  'hell-cage': { about: 'the acts', say: 'hell\'s cage room: the run open behind, the cage half cut, God hanging inside',
    run: () => { window.__reset(); window.__actsOn(null);
                 window.__hell({ tool: 5, chamber: 4, gang: 4, blows: { 0: 120, 1: 200, 2: 320, 3: 480, 4: 350 },
                                 rungs: { hellmuster: 8 }, seams: { 0: 9, 1: 7, 2: 5, 3: 3, 4: 1 },
                                 walls: { 4: { tool: 5, heap: 20 } } });
                 window.__goPlace('hell'); window.__fast(80); } },
  // Act 3's loop on its placeholder drawings (after/; track A): the chain
  // bought row by row and run, framed on the camp; the crowd half won, framed
  // on God's yard; the grove with a tree coming down.
  'after-chain': { about: 'the acts', review: 'act 3: shops and block piles', stage: 'built: the real build on branches a3-station-shop and a3-pile-plots -- not on main yet; lands when you sign it off', option: 'the camp, nothing open: try it', say: "the afterlife's chain running: logs to the saw mill, timber, signs going out",
    run: () => { afterChain(false); window.__fast(90); window.__look(stationX0('mill') - P * 4); window.__holdShot(); } },
  'after-crowd': { about: 'the acts', say: "the afterlife's crowd half walked out: signs out, the rims inking round them",
    run: () => { afterChain(true); window.__fast(120); window.__look(soulX(0) - P * 20); window.__holdShot(); } },
  'after-grove': { about: 'the acts', say: "the afterlife's grove: four plots, a tree coming down, a stump half dug, a sapling, logs lying",
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      window.__afterGrant({ rebel: 2000, timber: 300 }); yardPurse();
      for (let k = 0; k < 3; k++) buyAfter('after-plot');
      window.__afterSaw();
      // The plots stood, the setup the shot is not about: a grown tree, one
      // half grown, and a stump.
      window.__afterPlant(1, 1); window.__afterPlant(2, 0.5);
      Object.assign(S.after.plots[3], { stump: true });
      window.__fast(3);
      const t = window.__afterTrees()[0];
      for (let k = 0; k < 8; k++) window.__afterClick(t.x, t.y);
      const st = window.__afterTrees()[3];
      window.__afterClick(st.sx, st.sy);
      window.__fast(0.4); window.__look(0); window.__holdShot();
    } },
  // Act 3's hand work in the world (after/gestures.js; track A): the
  // stations of the chain standing, nobody at a post, the saw mill's
  // flywheel taken hold of and spun where it stands.
  'after-hands': { about: 'the acts', say: "the afterlife's hand work: the saw mill's flywheel spun by hand where it stands, a log going through",
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      for (const k of ['mill', 'workshop']) if (!S.after.built.includes(k)) S.after.built.push(k);
      window.__afterGrant({ logs: 6, timber: 8 });
      window.__afterSaw();
      window.__look(stationX0('mill') - P * 20);
      window.__fast(0.5);
      handTurn('mill', 'wheel', 1.6, 90);
      window.__holdShot();
    } },

  // The grove's hand work: the saw icon over a grown tree; the handsaw put
  // on it and mid-cut, its kerf half open; a stump lifted half out by hand,
  // its shovel faded under the hand.
  'after-saw-icon': { about: 'the acts', say: "the grove's grown tree with its saw icon over it, waiting to be clicked",
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1); window.__afterSaw(); window.__fast(0.6);
                 window.__look(0); window.__holdShot(); } },
  'after-saw': { about: 'the acts', say: "the handsaw on the grove's tree, dragged back and forth, its kerf half open",
    run: () => handSaw(6) },
  'after-fall': { about: 'the acts', say: "the grove's tree sawn through, coming down whole about its cut",
    run: () => { handSaw(9); window.__fast(0.5); window.__holdShot(); } },
  'after-dig': { about: 'the acts', say: "a stump with its shovel icon, dragged half up out of the ground by hand, its roots showing",
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      Object.assign(S.after.plots[0], { grow: null, stump: true, dug: 0 });
      window.__look(0); window.__fast(0.5);
      const g = window.__gestureParts('stump', 0).stump, x = g.x + g.w / 2, y = g.y + g.h / 2;
      window.__gesture('down', x, y);
      for (let f = 1; f <= 30; f++) { window.__gesture('move', x, y - f * 2); window.__fast(1 / 60); }
      window.__fast(0.3);
      window.__holdShot();
    } },
  // The same stump taken hold of and pulled up past the strain, and never let
  // go: the scene runs on through every root to the stump coming free.
  'after-pull': { about: 'the acts', say: "a stump pulled by hand and held, straining root by root until it rips out",
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      Object.assign(S.after.plots[0], { grow: null, stump: true, dug: 0 });
      window.__look(0); window.__fast(0.5);
      const g = window.__gestureParts('stump', 0).stump, x = g.x + g.w / 2, y = g.y + g.h / 2;
      window.__gesture('down', x, y);
      for (let f = 1; f <= 30; f++) { window.__gesture('move', x, y - f * 2); window.__fast(1 / 60); }
    } },
  // The pedestal: the pair mid-line over the rebel pile, motes on their way
  // down, and the idle members behind them at their own lines.
  // The camp mid-act with every station standing and members on its jobs:
  // the yard's roster under each station, the grove's three under the
  // forestry shack, `at` the station framed (the camp's middle by default).
  'after-roster': { about: 'the acts', say: "act 3's rosters: under each station its jobs' sprite, pips, minus and plus; the idle at the podium",
    run: (at = 'workshop') => {
      act3Mid();
      window.__fast(30);
      const b = stationBox(at);
      pinCamera(b.x + b.w / 2 - S.viewW / 2);
      window.__look(b.x + b.w / 2 - S.viewW / 2);
      window.__fast(1 / 60);
      window.__holdShot();
    } },
  'after-roster-grove': { about: 'the acts', say: "act 3's roster at the grove: the woodcutter's, under the forestry shack",
    run: () => SCENES['after-roster'].run('forestry') },
  // The carry: the yard's carry bought well up, so the woodcutters and the
  // sawyer fetching walk under stacks of logs, a log taking two of its slots.
  'after-carry': { about: 'the acts', review: 'act 3: shops and block piles', stage: 'built: the real build on branches a3-station-shop and a3-pile-plots -- not on main yet; lands when you sign it off', option: 'logs carried as blocks', say: "act 3's goods carried the yard's way: logs carried in a stack, as many as the yard's carry holds",
    run: () => {
      act3Mid();
      S.haulCarryLevel = 6;           // after the yard is stood up, which sets its own
      window.__afterGrant({ grovelogs: 40 });
      window.__fast(90);              // the walk from the podium
      // Held on a body walking a stack of logs.
      const under = () => S.after.bodies.find(w => loadKind(w) === 'log' && w.carry >= 1);
      for (let k = 0; k < 600 && !under(); k++) window.__fast(0.1);
      window.__fast(1);
      const h = under(), mid = h ? h.x : stationBox('forestry').x;
      pinCamera(mid - S.viewW / 2);
      window.__look(mid - S.viewW / 2);
      window.__fast(1 / 60);
      window.__holdShot();
    } },
  // Goods by hand (hands.js, the yard's sweep): the act-3-mid camp framed on
  // the forestry shack and the saw mill, logs on the shack's pile and the
  // yard's carry bought a rung; with `at` (0 over the shack's pile, 1 over
  // the mill's; null for nothing in the hand) logs swept off the shack's
  // pile (`__afterHand`) and carried that far along, up over the shack's
  // roof as a cursor carries them (`handPath`), and with `letGo` let go
  // there, caught a moment into their fall.
  'after-hand-carry': { about: 'the acts', say: "act 3's goods by hand: logs swept off the forestry shack's pile, carried over the shack toward the saw mill's",
    run: (at = 0.5, letGo = false) => {
      act3Mid();
      S.carryLevel = Math.max(S.carryLevel, 2);
      window.__afterGrant({ grovelogs: 6 });
      // let go over the saw mill's pile, it is bare, so they have room on it
      if (letGo) window.__afterGrant({ logs: -window.__afterRead().logs });
      const from = window.__afterPile('forestry', 'grovelogs'), to = window.__afterPile('mill', 'logs');
      to.y -= P * 12;
      pinCamera((from.x + to.x) / 2 - S.viewW / 2);
      window.__look((from.x + to.x) / 2 - S.viewW / 2);
      if (at != null) {
        S.mouse = { ...from };
        window.__afterHand(from.x, from.y, 'press');
        const p = handPath(from, to, at);
        S.mouse = { ...p };
        // held still there before the let-go: a drop, not a flick
        if (letGo) S.trail = [];
        window.__afterHand(p.x, p.y, letGo ? 'drop' : 'move');
        if (letGo) window.__fast(0.25);
      }
      window.__fast(1 / 60);
      window.__holdShot();
    } },
  'after-hand-drag': { about: 'the acts', review: 'act 3: one resource system', supersedes: ['act 3: workers carry every block', 'act 3: picking up goods', 'act 3: shops and block piles'],stage: 'built: the real build on branch res-step4 -- not on main yet; lands when you sign it off', branch: 'res-step4', option: 'D one hand, dragged and caught', say: "the one hand dragging logs off the forestry shack's pile, carried over the shack, held by weight as dust is",
    run: () => SCENES['after-hand-carry'].run(0.5) },
  'after-hand-piles': { about: 'the acts', review: 'act 3: picking up goods', stage: 'built: the real build on branches a3-goods-sweep and a3-hand-weight -- not on main yet; lands when you sign it off', option: 'A try it: press and hold on a pile', say: "act 3's goods by hand: the forestry shack's and the saw mill's log piles, nothing in the hand yet",
    run: () => SCENES['after-hand-carry'].run(null) },
  'after-hand-take': { about: 'the acts', review: 'act 3: picking up goods', stage: 'built: the real build on branches a3-goods-sweep and a3-hand-weight -- not on main yet; lands when you sign it off', option: 'B held over the shack', say: "act 3's goods by hand: logs swept off the forestry shack's pile, held over it",
    run: () => SCENES['after-hand-carry'].run(0) },
  'after-hand-set': { about: 'the acts', review: 'act 3: picking up goods', stage: 'built: the real build on branches a3-goods-sweep and a3-hand-weight -- not on main yet; lands when you sign it off', option: 'C let go over the mill pile', say: "act 3's goods by hand: let go over the saw mill's pile, the logs falling onto it",
    run: () => SCENES['after-hand-carry'].run(1, true) },
  // Act 3's one ground (DESIGN.md, "One resource system for every act"):
  // eight logs taken off the forestry shack's pile one at a time and let go
  // on one spot of open floor past the camp, each landing on the
  // heap the last ones made and rolling off it by the heap rule -- a mound a
  // log a step, never a tower, and no log drawn through another.
  'after-ground-heap': { about: 'the acts', review: 'act 3: one resource system', supersedes: ['act 3: workers carry every block', 'act 3: picking up goods', 'act 3: shops and block piles'],stage: 'built: the real build on branch res-step4 -- not on main yet; lands when you sign it off', branch: 'res-step4', option: 'A one ground, one heap rule', say: 'eight logs let go on one spot of open floor past the pedestal, heaped as a mound by the one rule a pile heaps by',
    run: () => {
      act3Mid();
      S.carryLevel = Math.max(S.carryLevel, 2);
      S.after.crew = {};
      window.__afterGrant({ grovelogs: 8 });
      // nobody idle to carry them home while they are watched
      S.after.bodies = S.after.bodies.filter(w => w.job); S.after.camp = 0;
      // the first flat stretch of open floor past the camp's far edge
      const flat = x => [-1, 1].every(k => Math.abs(floorAt(x + k * AP * 16) - floorAt(x)) < 1);
      let x = campEdges()[1] + AP * 48;
      while (!flat(x) && x < afterGround.x + afterGround.cols * AP) x += AP;
      const spot = { x, y: floorAt(x) - P * 30 };
      for (let k = 0; k < 8; k++) {
        const from = topBlock('grovelogs');
        S.trail = []; S.mouse = { ...from };
        window.__afterHand(from.x, from.y, 'press');
        S.trail = []; S.mouse = { ...spot };
        window.__afterHand(spot.x, spot.y, 'drop');
        window.__fast(1.2);
      }
      window.__fast(2);
      pinCamera(x - S.viewW / 2);
      window.__look(x - S.viewW / 2);
      window.__still(true); window.__holdShot();
    } },
  // A held hand's weight by size (hands.js, `handHolds`, HAND_SWAY): a full
  // carry swept off each pile and held still over it, so the drift is all
  // there is to see.
  'after-hand-log': { about: 'the acts', review: 'act 3: picking up goods', stage: 'built: the real build on branches a3-goods-sweep and a3-hand-weight -- not on main yet; lands when you sign it off', option: 'D a log: one, heavy', say: "a hand on the forestry shack's logs at a full carry: one log, hanging nearly still under the pointer",
    run: () => handWeight('grovelogs') },
  'after-hand-timber': { about: 'the acts', review: 'act 3: picking up goods', stage: 'built: the real build on branches a3-goods-sweep and a3-hand-weight -- not on main yet; lands when you sign it off', option: 'E timber: a quarter of the hand', say: "a hand on the saw mill's timber at a full carry: a quarter-hand of planks, swinging less than dust",
    run: () => handWeight('timber') },
  'hand-dust': { about: 'the bench', say: 'a full hand of dust swept off the floor, drifting round the pointer',
    run: () => {
      window.__reset(); window.__fast(1);
      S.carryLevel = LADDER;
      const x = floor.x + floor.cols * P / 2, y = bottomY(floor) - P / 2;
      for (let i = 0; i < 80; i++) addGrain(floor, x);
      S.mouse = { x, y: y - P * 10 };
      for (let k = 0; k < 6 && S.held < 20; k++) sweep(x, y);
      window.__look(x - S.viewW / 2);
      window.__holdShot();
    } },
  'after-pedestal': { about: 'the acts', say: 'the pair on the pedestal mid-speech, rebel falling to the pile, idle members behind them agitating',
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      S.after.camp = 3; window.__afterGrant({ rebel: 200 }); yardPurse();
      window.__fast(45);
      const at = window.__afterPair();
      for (let k = 0; k < 4; k++) { window.__afterClick(at.x, at.y); window.__fast(0.15); }
      window.__look(stationX0('pedestal') - S.viewW / 2); window.__holdShot();
    } },
  // The camp: a block of the crowd walking out across God's yard to the
  // camp's ground, the first already standing on their spots, empty posts.
  'after-camp': { about: 'the acts', say: "members walking out of God's yard to the camp, the first on their spots, builders raising the saw mill",
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      window.__afterCrowd((i, v) => (i < 80 ? 8 : v));
      window.__afterGrant({ rebel: 400 }); yardPurse();
      window.__buy('after-build-mill');
      window.__fast(14); window.__look(stationX0('mill') - P * 4); window.__holdShot();
    } },
  // Act 3's place and station art (track A, 2026-10-18; the mocks in
  // docs/mocks/act3-place-2026-10-18 and act3-stations-2026-10-18): every
  // station standing and worked at its post, its piles counted, framed on
  // the left of the camp and then on the right.
  'after-camp-art': { about: 'the acts', say: "the camp's stations polished and working: the grove's pines, the saw mill's wheel, piles counted",
    run: () => { afterChain(true); window.__afterGrant({ logs: 4, timber: 6 }); window.__fast(60); window.__look(stationX0('mill') - P * 30); window.__holdShot(); } },
  'after-camp-art-2': { about: 'the acts', say: "the camp's right half: the workshop's hammer, the shack, the cloud pillar and the pair's bubbles",
    run: () => { afterChain(true); window.__afterGrant({ timber: 12 }); window.__fast(60); window.__look(stationX0('workshop') - P * 4); window.__holdShot(); } },
  // The shack ordering: the saw mill bought, its glyph filling over the shack
  // as the builders raise it a piece at a time.
  'after-shack': { about: 'the acts', say: 'the construction shack ordering the saw mill: its glyph filling over the shack a piece at a time',
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      window.__afterCrowd((i, v) => (i < 12 ? 8 : v));
      for (let k = 0; k < 90 && window.__afterRead().walking > 0; k++) window.__fast(1);
      window.__afterGrant({ rebel: 400 }); yardPurse();
      window.__buy('after-build-mill');
      for (let k = 0; k < 80 && !(S.after.raising.mill && S.after.raising.mill.n >= 2); k++) window.__fast(0.5);
      window.__look(stationX0('shack') - S.viewW / 2); window.__holdShot();
    } },
  // The yard paying (DESIGN.md, "The yard pays too"): the saw bought on the
  // grove's card, its dust come up out of the thin patch as motes and arcing
  // over to the grove.
  'after-coins': { about: 'the acts', say: "the yard's coins up through the thin patch in the cloud floor, arcing to the station bought",
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      window.__afterGrant({ rebel: 400 }); yardPurse();
      window.__buy('after-saw');
      window.__fast(AFTER_COIN_UNDER_S + 0.5);
      window.__look(stationX0('pedestal') - S.viewW / 2); window.__holdShot();
    } },

  // A log swept off the forestry shack's pile and let go over the saw mill's
  // timber mound: it lies on the mound among the planks as a log, counted for
  // no pile, until a member carries it home (DESIGN.md, "One resource system
  // for every act", section 1).
  'after-offkind': { about: 'the acts', review: 'act 3: one resource system', supersedes: ['act 3: workers carry every block', 'act 3: picking up goods', 'act 3: shops and block piles'],stage: 'built: the real build on branch res-step4 -- not on main yet; lands when you sign it off', branch: 'res-step4', option: 'B a log over the wrong pile', say: 'a log let go over the timber mound lies on the mound among the planks, not beside it',
    run: () => {
      act3Mid();
      S.carryLevel = Math.max(S.carryLevel, 2);
      window.__afterGrant({ grovelogs: 6, timber: 8 });
      const from = window.__afterPile('forestry', 'grovelogs'), to = window.__afterPile('mill', 'timber');
      to.x = dropSpot('timber').at;                  // over the mound's peak, where its blocks are set down
      to.y -= P * 12;
      pinCamera((from.x + to.x) / 2 - S.viewW / 2);
      window.__look((from.x + to.x) / 2 - S.viewW / 2);
      S.mouse = { ...from };
      window.__afterHand(from.x, from.y, 'press');
      S.mouse = { ...to };
      S.trail = [];
      window.__afterHand(to.x, to.y, 'drop');
      window.__fast(1.5);
      window.__holdShot();
    } },

  // --- track A of the act-3 build: the camp (docs/wave-act3-build.md) ---------------
  // A station ordered on the shack (docs/mocks/act3-unbuilt-2026-10-18, pile
  // a): the empty spot between its neighbors, members carrying its loads
  // onto it, the pile whole, and a band going up off it.
  'after-site-empty': { about: 'the acts', say: "an unbuilt station's spot: open floor between its neighbors, nothing drawn",
    run: () => afterSite(null) },
  'after-site-carry': { about: 'the acts', say: 'the workshop ordered: members carrying its planks and blocks onto its spot',
    run: () => afterSite(() => siteLoads('workshop') >= 3) },
  'after-site-pile': { about: 'the acts', review: 'act 3: one resource system', supersedes: ['act 3: workers carry every block', 'act 3: picking up goods', 'act 3: shops and block piles'],stage: 'built: the real build on branch res-step4 -- not on main yet; lands when you sign it off', branch: 'res-step4', option: 'C a station going up is a strip', say: "the workshop's pile whole on its spot, the two builders beside it",
    run: () => afterSite(r => r.whole != null) },
  'after-site-band': { about: 'the acts', say: 'the workshop going up a band at a time, the pile shrinking',
    run: () => afterSite(r => r.n >= 2) },

  // The UPGRADES buttons over the camp's rosters (roster.js), framed as the
  // review that chose them was: the chain bought, the saw mill four-fifths
  // across the window, the workshop's and the forestry shack's buttons in
  // view beside its own.
  'after-shopbtn': { about: 'the acts', branch: 'a3-shop-button', review: 'act 3: a shop button by the worker count', stage: 'built: the real build on branch a3-shop-button -- not on main yet; lands when you sign it off', option: 'the built button', say: "The real UPGRADES button: press it to open the station's shop, again to put it away; clicking or hovering the station opens nothing.",
    run: () => {
      afterChain(false);
      window.__fast(20);
      const b = stationBox('mill'), mid = b.x + b.w * 0.8;
      pinCamera(mid - S.viewW / 2); window.__look(mid - S.viewW / 2);
    } },
  // Track a3-logs: the chain staffed, the forestry shack's pile stocked, run
  // until an idle member is carrying logs to the saw mill and a cut is
  // falling out of the saw's right side onto its timber pile; framed on the
  // mill from its log pile to its timber pile.
  'after-log-flow': { about: 'the acts', review: 'act 3: shops and block piles', stage: 'built: the real build on branches a3-station-shop and a3-pile-plots -- not on main yet; lands when you sign it off', option: 'saw mill piles', say: "the saw mill kept fed: an idle member carrying logs to its pile, a cut falling out of the saw's right side onto the timber",
    run: () => {
      afterChain(false);
      window.__afterGrant({ grovelogs: 60 });
      const b = stationBox('mill');
      const near = w => w.errand === AFTER_JOB.HAUL && loadKind(w) === 'log' && w.target === 'mill' && w.x > b.x - P * 40 && w.x < b.x;
      const falling = () => millView().out.length > 0;
      for (let k = 0; k < 6000 && !(S.after.bodies.some(near) && falling()); k++) window.__fast(1 / 30);
      const mid = b.x + b.w / 2 - P * 10;
      pinCamera(mid - S.viewW / 2);
      window.__look(mid - S.viewW / 2);
      window.__still(true); window.__holdShot();
    } },
  // The chain run and every pile topped up, framed from the forestry shack's
  // log pile to the workshop's signs, a member carrying while it holds: every
  // good in the four tones its units were born with.
  'after-goods': { about: 'the acts', say: "every good in its own colors: logs, timber and signs, each unit one of its good's four tones",
    run: () => {
      afterChain(false);
      window.__fast(20);
      window.__afterGrant({ grovelogs: 20, logs: -20 });     // the mill's pile bare, so a member hauls
      window.__fast(2);
      const lo = window.__afterPile('forestry', 'grovelogs').x, hi = window.__afterPile('mill', 'timber').x;
      const carrying = () => S.after.bodies.some(w => loadKind(w) === 'log' && w.x > lo + P * 12 && w.x < hi - P * 30);
      for (let k = 0; k < 1800 && !carrying(); k++) window.__fast(1 / 30);
      window.__afterGrant({ grovelogs: 20, logs: 4, timber: 40, signs: 4, benchtimber: 8 });   // room left for the load on its way
      window.__fast(1 / 60);
      const x = lo - P * 30;
      pinCamera(x); window.__look(x);
    } },

  // The workshop (docs/mocks/act3-workshop-2026-10-18, roof A): nails tapped
  // by hand, two driven flush, one half in; and a sign just done, standing
  // in the rack outside.
  'after-nails': { about: 'the acts', say: "the workshop's sign blank on the bench, two nails tapped flush and one half in, the pips over the door to match",
    run: () => handNails(5, 0.2) },
  'after-sign-carry': { about: 'the acts', say: "a sign just nailed, standing in the rack outside the workshop",
    run: () => handNails(8, 0.9) },

  // The pair's bubbles: sent up at uneven gaps in mixed sizes, a symbol in each.
  'after-bubbles': { about: 'the acts', say: "the pair's speech bubbles rising off the pillar at uneven gaps, small, middling and big, a symbol in each",
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(14);
                 window.__look(stationX0('pedestal') - S.viewW / 2); window.__holdShot(); } },
  // The saw mill bought on the shack with nobody waiting in the camp: the
  // pair stay up on the pillar speaking (they never come down to build), and
  // the site waits for a member (after/build.js, `fillBuilders`).
  'after-pair-build': { about: 'the acts', say: 'the saw mill bought with the camp empty: the pair still up on the pillar, speaking',
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(2);
                 window.__afterGrant({ rebel: 9000, timber: 40 }); yardPurse(); S.after.camp = 0;
                 window.__buy('after-build-mill'); window.__fast(8);
                 const b = S.after.bodies.find(w => w.pair === 0);
                 window.__look((b ? b.x : stationX0('pedestal')) - S.viewW / 2); window.__holdShot(); } },

  // Act 3's crowds, God and the camera's zoom (track C): the camp end with
  // both crowds in frame, the middle of God's crowd, and the dive's end.
  'after-crowd-mass': { about: 'the acts', say: "the afterlife's two crowds: ours behind the camp, God's near rows and mass, God far off on the horizon",
    run: () => afterMass(null) },
  'after-crowd-mass-mid': { about: 'the acts', say: "God's crowd from its middle: the near rows shrinking into the mass, the zoom just starting",
    run: () => afterMass(0.5) },
  'after-crowd-mass-throne': { about: 'the acts', say: 'the pan at its end: the dive on the top of the throne, God hazed no longer',
    run: () => afterMass(1) },

  // --- track B: the sky (render/aftercrowd.js, docs/mocks/act3-skycrowd-2026-10-18) ---
  // God's crowd filling the sky at a share of the way to the strike, the
  // camera where the act opens or `pan` of the way on to the end of the dive.
  'heaven-10': { about: 'the acts', say: "God's crowd filling the sky, a tenth of the way to the strike: every band full, God over them",
    run: () => heavenAt(0.1) },
  'heaven-50': { about: 'the acts', say: "God's crowd half way to the strike: the far bands speckled and sunk",
    run: () => heavenAt(0.5) },
  'heaven-90': { about: 'the acts', say: "God's crowd nine tenths of the way to the strike: a low scatter of the near band, the rays nearly gone",
    run: () => heavenAt(0.9) },
  'heaven-100': { about: 'the acts', say: "the strike's share won: a thin low scatter left, no rays",
    run: () => heavenAt(1) },
  'heaven-pan': { about: 'the acts', say: 'the camera half way along the dive toward God',
    run: () => heavenAt(0.1, 0.5) },
  'heaven-zoom': { about: 'the acts', say: "the dive's end: God's face pulled to the window's middle, zoomed in",
    run: () => heavenAt(0.1, 1) },
  'heaven-rally': { about: 'the acts', say: 'a rally off a sign: its ring climbing through every band, the near souls with their arms up',
    run: () => heavenAt(0.1, 0, 'rally') },
  'heaven-roar': { about: 'the acts', say: "God's roar, a proclamation: his mouth open on a syllable, its wave out across the crowd, the souls hopping as it reaches them",
    run: () => heavenAt(0.1, 0, 'roar') },
  'heaven-unmasked': { about: 'the acts', say: 'God unmasked, once the unmask beat has played: the horns, the lids lifted into slits, the smile gone',
    run: () => { heavenAt(0.1, 1, 'roar'); if (!S.beatsDone.includes('unmask')) S.beatsDone.push('unmask'); window.__fast(1 / 30); } },
  // The flat sky's turns (DESIGN.md, "The sky, redrawn flat"): the clock run
  // on to God glaring round the crowd.
  'heaven-glare': { about: 'the acts', say: 'God glaring round the crowd: the cone from his lit eyes to a round spot on the crowd',
    run: () => heavenTurn(m => m.glare === 1) },
  // Act 3's level in three zones (DESIGN.md, "The level, the two crowds and
  // the flags"): the workshops with open sky behind them, the union's camp
  // with God's crowd off past it, God's crowd with its flags, and a soul a
  // sign has won on its way round the sign and across.
  'level-works': { about: 'the acts', say: "the workshops' end: the stations under open sky, no crowd behind them",
    run: () => levelAt(0.1, 'works') },
  'level-union': { about: 'the acts', say: "the union's camp where the act opens: the pair on their pedestal, God's crowd off past it",
    run: () => levelAt(0.1, 'union') },
  'level-union-mid': { about: 'the acts', say: "the union's camp at two fifths of the way to the strike: its crowd filling in from the front",
    run: () => levelAt(0.4, 'union') },
  'podium-1': { about: 'the acts', say: "the pair's podium, rung 1: the soapbox", run: () => podiumAt(0, 0.3) },
  'podium-2': { about: 'the acts', say: "the pair's podium, rung 2: crates stacked two high with a plank", run: () => podiumAt(1, 0.4) },
  'podium-3': { about: 'the acts', say: "the pair's podium, rung 3: the plank stage with the fist banner", run: () => podiumAt(2, 0.55) },
  'podium-4': { about: 'the acts', say: "the pair's podium, rung 4: the cloud plinth", run: () => podiumAt(3, 0.75) },
  'podium-5': { about: 'the acts', say: "the pair's podium, rung 5: the Greek cloud column", run: () => podiumAt(4, 0.9) },
  'podium-climb': { about: 'the acts', say: "the plank stage going up where the crates stood, a course at a time, the crates fading", run: () => podiumAt(2, 0.55, 0.55) },
  'union-hop': { about: 'the acts', say: "a line of the pair's speech just gone up: the union's near rows hopping a cell", run: () => podiumAt(1, 0.5, null, true) },
  'level-union-high': { about: 'the acts', say: "the union's camp at seven tenths of the way to the strike: God's crowd sunk and drawn back toward his camp",
    run: () => levelAt(0.7, 'union') },
  'level-pan': { about: 'the acts', say: "half way along the pan: the union's camp gone left, God's camp far back on the cloud sliding in at a third of the speed",
    run: () => levelAt(0.1, (afterOpenX() + godView()) / 2) },
  'level-god': { about: 'the acts', say: "God's camp in the clouds: the throne in the cloud floor, his crowd standing in it round the base, the fist flags planted among them",
    run: () => levelAt(0.1, 'god') },
  'level-god-high': { about: 'the acts', say: "God's camp at seven tenths of the way to the strike: his crowd emptied from the front",
    run: () => levelAt(0.7, 'god') },
  // God talking (the owner, 2026-10-20): the clock run on to just before a
  // loud phrase, so the shot's second lands among its syllables' waves out
  // across the crowd (and a film from here starts on its first).
  'level-god-talk': { about: 'the acts', say: "God talking to his crowd: his mouth open on a syllable, its wave rippling out through the rows, each soul hopping as it arrives",
    run: () => {
      levelAt(0.1, 'god');
      window.__holdShot(0);
      for (let k = 0; k < 800; k++) { const m = skyMoment(); if (m && m.glare === 0 && m.next < 0.3) break; window.__fast(0.1); }
      window.__look(godView() - S.viewW / 2); window.__fast(1 / 60);
      window.__holdShot();
    } },
  'level-carry': { about: 'the acts', say: "the chain running: a carrier with a sign over the cloud, climbing the stage's plinth or out on its top",
    run: () => {
      afterChain(true);
      const a = campEdges()[1], on = w => loadKind(w) === 'sign' && w.x > a + (CROWD_X0 - a) * 0.5;
      for (let k = 0; k < 2400 && !S.after.bodies.some(on); k++) window.__fast(0.25);
      window.__look((afterOpenX() + godView()) / 2 - S.viewW / 2); window.__fast(1 / 30); window.__holdShot();
    } },
  'level-plant': { about: 'the acts', say: "a carrier planting its flag on God's stage: the carried sign fading out as the planted flag fades in",
    run: () => {
      afterChain(true);
      // a carrier at its spot, a moment short of planting; the shot comes a
      // second on, the planting drawn as it happens
      const at = w => loadKind(w) === 'sign' && w.target && typeof w.target === 'object' && w.t >= AFTER_PLANT_S - 0.7;
      for (let k = 0; k < 24000 && !S.after.bodies.some(at); k++) window.__fast(0.05);
      window.__look(godView() - S.viewW / 2); window.__fast(1 / 30);
    } },
  'level-won-orbit': { about: 'the acts', say: 'a soul a sign has won, darkened to ink, half way round its turn and a half about the flag',
    run: () => levelAt(0.1, 'god', 4.5) },
  'level-won-drift': { about: 'the acts', say: "a won soul half way across from God's crowd to the union's camp",
    run: () => levelAt(0.1, (godView() + unionJoinAt().x) / 2, 17) },

  // --- the acts' connective tissue (actbeats.js, portals.js, mansion.js) --------
  // Each off a yard past the snatch with the wizards' portal up and a crew to
  // borrow, stood at its point of the acts' story (`__actsAt`).
  'portal-heaven': { about: 'the acts', say: 'heaven\'s gates on their cloud bank up the stair left of the ruin, shut, the hand beside them, the rock on the ruin',
    run: () => { actsYard('act4'); window.__fast(2); pinCamera(0); window.__holdShot(); } },
  'portal-heaven-up': { about: 'the acts', say: 'heaven\'s gates from behind, standing on the cloud floor',
    run: () => { actsYard('road'); S.beatsDone.push('haunt'); S.acts.pair.mode = 'ghost'; window.__goPlace('after'); window.__fast(2); window.__holdShot(); } },
  // Heaven's gates at work (portals.js, render/gates.js): pressed and half
  // sunk, before the ripple; the two of them walking up the
  // stair as souls at the house's fall; the two coming down it as ghosts.
  'gates-opening': { about: 'the acts', say: 'heaven\'s gates pressed: the leaves sinking into the cloud from the middle out, the ripple still to come',
    run: () => { actsYard('act4'); window.__fast(2); pinCamera(0); window.__pressPortal('heaven'); window.__fast(0.65); window.__still(true); window.__holdShot(); } },
  'gates-climb': { about: 'the acts', say: 'the house\'s fall: the two of them as souls walking up the cloud stair to the gates, the gates opening as they come',
    run: () => {
      actsYard('home');
      for (let i = 0; i < 60 * 30 && !window.__goOn(); i++) window.__fast(1 / 60);
      for (let i = 0; i < 60 * 90 && !(S.acts?.pair?.route === 'climb' && S.acts.pair.leg >= 18); i++) window.__fast(1 / 60);
      window.__holdShot();
    } },
  'gates-road': { about: 'the acts', say: 'the ghost road: the two of them out of the gates and walking down the cloud stair',
    run: () => {
      actsYard('road');
      S.beatsDone.push('haunt');
      const p = S.acts.pair;
      Object.assign(p, { x: window.__gateWalk().x, y: afterFloor() - P * 3, mode: 'ghost', at: null, top: 0, route: null, then: null });
      window.__sendPair('down', 1);
      window.__view('yard');
      for (let i = 0; i < 60 * 90 && !(p.route === 'down' && p.leg >= 14); i++) window.__fast(1 / 60);
      pinCamera(0);
      window.__holdShot();
    } },
  'after-pair': { about: 'the acts', say: 'act 3 as it stands after the refusal: the pair as souls at the foot of the cloud pillar',
    run: () => { actsYard('fallen'); window.__goPlace('after'); window.__fast(2); window.__look(stationX0('pedestal') - S.viewW / 2); window.__holdShot(); } },
  'portal-hell': { about: 'the acts', say: 'hell\'s white-hot slit in the deep\'s floor, and its hand',
    run: () => { actsYard('act4'); window.__view('deep'); window.__fast(2); window.__holdShot(); } },
  // The yard's left end at its most crowded, for the map's no-overlap rule
  // (test/no-overlap.test.mjs stands the same yard): every site open and every
  // pot bought, so the casino has stepped as far left as it goes, with the
  // house standing and heaven's stair and gates beside it; and the same with
  // the mansion on the house's ground.
  'home-end': { about: 'the acts', say: 'the yard\'s left end at its widest: the house, heaven\'s stair and gates, the casino with every pot bought',
    run: () => { widestYard(); window.__actsAt('act4'); window.__fast(2); window.__nocine(); window.__view('yard'); window.__fast(2); pinCamera(0); window.__holdShot(); } },
  'home-end-mansion': { about: 'the acts', say: 'the yard\'s left end at its widest with the mansion built: the mansion, heaven\'s stair and gates, the casino',
    run: () => { widestYard(); window.__actsAt('mansion', 999); for (let i = 0; i < 4; i++) { window.__fast(2); window.__nocine(); } window.__view('yard'); window.__fast(1); pinCamera(0); window.__holdShot(); } },
  // The deep's left end with hell's slit open in its floor, the crusher, the
  // pods and the first stations beside it.
  'deep-slit': { about: 'the acts', say: 'the deep\'s left end with hell\'s slit open: the slit, the crusher, the pods and the first stations',
    run: () => { SCENES.late.run(); window.__actsOn(null); window.__actsAt('act4'); window.__fast(2); window.__nocine(); window.__view('deep'); window.__fast(2); window.__look(deepX0()); window.__holdShot(); } },
  'house-fall': { about: 'the acts', say: 'the house\'s fall: the rock out of the sky over the house, the two of them indoors',
    run: () => {
      actsYard('home');
      for (let i = 0; i < 60 * 20 && !window.__goOn(); i++) window.__fast(1 / 60);
      for (let i = 0; i < 60 * 40 && !(window.__actFall() && window.__actFall().rock >= 0.5); i++) window.__fast(1 / 60);
      window.__holdShot();
    } },
  // Ways into act 3 for a playtest, from the dev panel's scenes tab: the
  // start just past act 2's finale, and the middle of the camp's build.
  'act3-start': { about: 'the acts', say: 'act 3 start: just past act 2\'s finale, the two of them home, the go-on card up over the house -- press it to begin act 3',
    run: () => {
      actsYard('home');
      for (let i = 0; i < 60 * 30 && goOnAlpha() < 1; i++) window.__fast(1 / 60);
      pinCamera(houseX() + FINALE_HOUSE_W * P / 2 - S.viewW / 2);
    } },
  // The act 3 intro just through the tear (wave shot, track A): the ripple
  // landed in the afterlife, the shot held on the cloud floor where the two of
  // them will come up, the bands full, the zoom the yard's.
  'act3-rise': { about: 'the acts', say: 'act 3\'s rise just through the tear: the afterlife framed on the patch of cloud floor the two of them come up through',
    run: () => {
      actsYard('home');
      for (let i = 0; i < 60 * 30 && !window.__goOn(); i++) window.__fast(1 / 60);
      for (let i = 0; i < 60 * 60 && !(S.view === 'after' && S.viewTo == null); i++) window.__fast(1 / 60);
      window.__fast(1);
      window.__holdShot();
    } },
  // The opening played from the go-on card's press to the refusal's last
  // phase: the two of them up the pillar's face onto the pedestal, the
  // road's drawing of them fading off over the pedestal's own.
  'act3-pedestal': { about: 'the acts', say: 'the refusal\'s end: the two of them climbing up onto the pedestal, where the speech is theirs from then on',
    run: () => {
      actsYard('home');
      for (let i = 0; i < 60 * 30 && !window.__goOn(); i++) window.__fast(1 / 60);
      for (let i = 0; i < 60 * 400 && !(S.acts?.pair?.route === 'pedestal' && S.acts.pair.leg >= 2); i++) window.__fast(1 / 60);
      window.__fast(0.6);
      window.__holdShot();
    } },
  'act3-mid': { about: 'the acts', say: 'act 3 mid: the camp built (saw mill, workshop, posts filled), a fifth of God\'s yard walked out, the saw handed over',
    run: act3Mid },
  // Track C: each of act 3's boards open in the yard's sheet over the act-3-mid
  // camp, as a plain click on its station opens it, the station framed so
  // the board stands beside it (after/rows.js `openAfterBoard`).
  // The pedestal's recruit row live: souls won in God's yard waiting to be
  // hired (DESIGN.md, "Act 3's workers are bought with rebel").
  'act3-recruit': { about: 'the acts', say: "act 3's pedestal board with souls won and waiting: the recruit row's count of ready and idle",
    run: () => { act3Board('pedestal'); window.__afterCrowd((i, v) => (i >= CROWD_FILES * 2 && i < CROWD_FILES * 2 + 12 ? 8 : v), true); window.__holdShot(); } },
  ...Object.fromEntries(['shack', 'grove', 'pedestal', 'mill', 'workshop', 'crowd'].map(key =>
    [`act3-board-${key}`, { about: 'the acts', ...(key === 'crowd' ? {} : { review: 'act 3: shops and block piles', stage: 'built: the real build on branches a3-station-shop and a3-pile-plots -- not on main yet; lands when you sign it off', option: `${key} board open` }), say: `act 3's ${key} board open in the yard's sheet, its shelves, bills in the act's marks`,
      run: () => act3Board(key) }])),
  // God's pushback as drawn (render/aftercrowd.js): the throne's speech
  // warned, his gaze settled on a sign with the corner marks closing in; then
  // the sign burning away.
  'act3-speech-warned': { about: 'the acts', say: "the throne's speech warned: God's gaze settled on a sign, the corner marks closing in on it",
    run: () => pushback('warned') },
  'act3-speech-burn': { about: 'the acts', say: "the throne's speech fallen: the sign it was aimed at charring and burning away, embers rising",
    run: () => pushback('burn') },
  'mansion': { about: 'the acts', say: 'the mansion going up on the house\'s ground: the scaffold, a floor and a half set, the rock half broken up',
    run: () => { actsYard('mansion', 34); window.__fast(3); pinCamera(0); window.__holdShot(); } },
  'mansion-end': { about: 'the acts', say: 'the mansion finished, the two of them in, the freed souls down the stair in their files',
    run: () => {
      actsYard('mansion', 999);
      Object.assign(S.acts.pair, { at: 'door', inside: 1 });
      S.acts.house = 'mansion';
      S.acts.mansion.done = true;
      S.acts.mansion.G = 9;
      window.__fast(1); pinCamera(0); window.__holdShot();
    } },
  ...carriedScenes()
};

// A yard for the acts' scenes: rich, past the snatch with the wizards'
// portal, a crew with spare hands, stood at `point` (`__actsAt`).
// The endgame yard with every site open and every pot bought, the yard at its
// widest, and the acts on: the setup the home-end scenes are not about.
function widestYard() {
  SCENES.everything.run();
  for (const k of ['casino', 'filter', 'apothecary', 'outhouse', 'tower', 'meteor']) S[k + 'Open'] = true;
  S.seenBench = true;
  S.apothPots = APOTH_POTS_MAX;
  window.__fullSites();
  window.__actsOn(null);
}

function actsYard(point, pieces = 0) {
  window.__reset();
  window.__actsOn(null);
  rich();
  window.__crew(2, 4);
  window.__snatch({ played: true });
  window.__actsAt(point, pieces);
  window.__view('yard');
}

// Act 3 half way: the opening played (`__actsAt('fallen')`, the two of them
// up on the pedestal), the saw handed over and its beat had, the saw mill and
// the workshop raised off the shack, posts bought and filled, a fifth of the
// crowd made members and walked out to the camp (the setup the scene is not
// about), the yard rich for the bills still to come.
// The way a cursor carries goods by hand from pile a to pile b, `t` of the
// way along: up over whatever stands between, `HAND_ARC` art cells at its
// height. The scenes' and the shots' path only; the hand in play goes
// wherever the pointer does.
const HAND_ARC = 16;
const handPath = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - Math.sin(Math.PI * t) * HAND_ARC * AP });
// A full carry swept off act 3's pile `what` and lifted a little over it.
function handWeight(what) {
  act3Mid();
  S.carryLevel = LADDER;
  window.__afterGrant(what === 'timber' ? { timber: 12 } : { grovelogs: 6 });
  const p = window.__afterPile(null, what);
  pinCamera(p.x - S.viewW / 2);
  window.__look(p.x - S.viewW / 2);
  S.mouse = { ...p };
  for (let k = 0; k < 4; k++) window.__afterHand(p.x, p.y, 'press');
  // off to the side, clear of the pile-full mark over a pile at its brim
  S.mouse = { x: p.x + AP * 18, y: p.y - AP * 10 };
  window.__afterHand(S.mouse.x, S.mouse.y, 'move');
  window.__fast(1 / 60);
  window.__holdShot();
}
// The middle of pile `what`'s highest block on act 3's ground: where a
// player presses to take one off it.
function topBlock(what) {
  const s = groundStrip(what), us = groundUnits().filter(u => u.c0 >= s.c0 && u.c0 < s.c1 && groundCounted(u));
  const u = us.reduce((b, q) => (q.r0 > b.r0 ? q : b));
  return { x: afterGround.x + (u.c0 + u.z / 2) * AP, y: afterGround.y + (afterGround.rows - u.r0 - u.z / 2) * AP };
}
function act3Mid() {
  actsYard('fallen');
  if (!S.beatsDone.includes('saw')) S.beatsDone.push('saw');
  S.after.sawBought = true; window.__afterSaw();
  window.__afterCrowd((i, v) => (i % CROWD_FILES < 8 && i < CROWD_FILES * 30 ? 8 : v));
  for (let k = 0; k < 120 && window.__afterRead().walking > 0; k++) window.__fast(1);
  window.__afterGrant({ rebel: 600, timber: 20, logs: 6 });
  for (const wave of [['mill'], ['workshop']]) {
    for (const st of wave) window.__buy(`after-build-${st}`);
    for (let k = 0; k < 300 && wave.some(st => !window.__afterRead().built.includes(st)); k++) window.__fast(1);
  }
  const A = AFTER_JOB;
  staffAfter([A.CUT, A.CUT, A.CUT, A.SAW, A.JOIN, A.JOIN]);
  for (const u of ['after-plot', 'after-plot']) buyAfter(u);
  window.__goPlace('after');
  window.__fast(20);
  // between the workshop and the pedestal, the camp's middle
  pinCamera((stationX0('workshop') + stationX0('pedestal')) / 2 - S.viewW / 2);
}

// Track C: the act-3-mid camp, framed on one station (the crowd's front for
// the crowd), and that station's board opened as its click opens it. Rebel
// and timber enough for some tiles and short of others, so both edges show.
function act3Board(key) {
  act3Mid();
  window.__afterGrant({ rebel: 200, timber: 40 });
  window.__fast(1);
  // A station's board runs out beside it toward its board's spot (after/
  // stations.js `boardAnchor`): the station framed at the window's far side
  // from that spot, so the board has the room.
  const g = key === 'grove' ? 'forestry' : key, b = key === 'crowd' ? null : stationBox(g);
  const right = b && signBox(g).x >= b.x + b.w / 2;
  const mid = key === 'crowd' ? soulX(6) : right ? b.x - P * 4 + S.viewW / 2 : b.x + b.w + P * 4 - S.viewW / 2;
  pinCamera(mid - S.viewW / 2);
  window.__look(mid - S.viewW / 2);
  window.__fast(1 / 60);
  window.__openAfterBoard(key, key === 'crowd' ? { x: mid, y: afterFloor() - P * 30 } : null);
  window.__holdShot();
}

// God's pushback at a moment (`what`: 'warned', 'burn'): the opening
// played, the crowd half won in its front files, a sign among the files,
// the speech aimed at the sign, the camera where
// the act opens.
function pushback(what) {
  actsYard('fallen');
  window.__goPlace('after');
  const A = S.after;
  window.__afterCrowd((i, v) => (i % CROWD_FILES < 24 ? 3 + (i * 7) % 4 : v));
  A.signs.push({ id: 92000, f: 4, r: 1, askew: false, pull: null, big: false, age: 0 });
  A.speech = { next: A.t + 1e6, target: null, burnt: null };
  window.__fast(0.5);
  A.speech = { next: A.t + (what === 'warned' ? 3 : 0.6), target: { kind: 'sign', id: 92000 }, burnt: null };
  window.__fast(what === 'warned' ? 0.1 : 1.6);
  window.__holdShot();
  pinCamera(afterOpenX() - S.viewW / 2);
}

// Wake the checks' pad and hop it along the stops until it is on `id` (or,
// for null, wherever it lands in this half).
// The hops are made under reduced motion, so the camera is there at once and
// no yard time passes for a beat to start in; the preference is put back.
function padTo(id) {
  const pad = window.__pad, was = motionForcedNow();
  forceMotion(true);
  pad.on();
  pad.press('b');
  // A press toward it along whichever way it lies further, the other way if
  // that goes nowhere; off the coil by going down.
  for (let i = 0; i < 24 && id && pad.focus() !== id; i++) {
    const f = pad.focus() || '';
    if (f.startsWith('coil|')) { pad.press('down'); continue; }
    const a = stopById(f)?.r, b = stopById(id)?.r;
    if (!a || !b) break;
    const dx = b.x + b.w / 2 - a.x - a.w / 2, dy = b.y + b.h / 2 - a.y - a.h / 2;
    const h = dx < 0 ? 'left' : 'right', v = dy < 0 ? 'up' : 'down';
    const [first, then] = Math.abs(dx) >= Math.abs(dy) ? [h, v] : [v, h];
    pad.press(first);
    if (pad.focus() === f) pad.press(then);
  }
  forceMotion(was);
}

// The names under each part, in ABOUT's order.
export const byPart = () =>
  ABOUT.map(about => [about, Object.keys(SCENES).filter(k => SCENES[k].about === about)]);

// track B: carried goods
// Act 3's goods carried by bodies (DESIGN.md, "Act 3's goods are blocks, and
// bodies carry every one"): the workshop's timber walked to it off the
// mound, a sign carried out of its rack, a bought row's timber carried to
// its station.
// Every bought row's timber carried to its station, the clock turned until
// none is still on its way (after/build.js, the orders).
function carried() {
  for (let k = 0; k < 2400 && S.after && S.after.orders.length; k++) window.__fast(0.25);
}
// The clock turned a frame at a time until a body is as `see` says, then
// framed on it and held still, so the shot is that frame.
function carryShot(see) {
  for (let k = 0; k < 9000 && !S.after.bodies.some(see); k++) window.__fast(1 / 30);
  const w = S.after.bodies.find(see), x = (w ? w.x : stationBox('workshop').x) - S.viewW / 2;
  pinCamera(x); window.__look(x);
  window.__still(true); window.__holdShot();
}
const pastMill = w => { const m = stationBox('mill'); return w.x > m.x + m.w + P * 6; };
function carriedScenes() {
  return {
    'after-bench-walk': { about: 'the acts', branch: 'a3-bodies-carry', review: 'act 3: workers carry every block', stage: 'built: the real build on branch a3-bodies-carry -- not on main yet; lands when you sign it off', option: 'A timber to the bench', say: "the workshop's timber walked to it off the timber mound, a load of blocks overhead, its rack beside the shed",
      run: () => {
        afterChain(false);
        window.__afterGrant({ benchtimber: -window.__afterRead().benchtimber, signs: -window.__afterRead().signs }); timberUp();
        carryShot(w => loadKind(w) === 'plank' && !w.pick && (w.target === 'workshop' || w.job === AFTER_JOB.JOIN) && pastMill(w));
      } },
    'after-sign-out': { about: 'the acts', branch: 'a3-bodies-carry', review: 'act 3: workers carry every block', stage: 'built: the real build on branch a3-bodies-carry -- not on main yet; lands when you sign it off', option: 'B a sign carried out', say: 'a sign carried out of the workshop\'s rack toward the crowd, the rack a block short',
      run: () => {
        afterChain(false);
        window.__afterGrant({ signs: 3 });
        const ws = stationBox('workshop');
        carryShot(w => loadKind(w) === 'sign' && w.x > ws.x + ws.w + P * 12 && w.x < ws.x + ws.w + P * 40);
      } },
    'after-order-carry': { about: 'the acts', branch: 'a3-bodies-carry', review: 'act 3: workers carry every block', stage: 'built: the real build on branch a3-bodies-carry -- not on main yet; lands when you sign it off', option: 'C a bill carried', say: "a timber bill bought: its blocks carried off the timber mound to the workshop, the row waiting on them",
      run: () => {
        afterChain(false);
        yardPurse(); timberUp(); window.__buy('after-signreach');
        carryShot(w => w.errand === AFTER_JOB.ORDER && loadKind(w) === 'plank' && !w.pick && pastMill(w));
      } },
    'after-order-board': { about: 'the acts', branch: 'a3-bodies-carry', review: 'act 3: workers carry every block', stage: 'built: the real build on branch a3-bodies-carry -- not on main yet; lands when you sign it off', option: 'D the board waiting', say: "the workshop's board with a timber row ordered: the row waiting on its blocks, saying it is going up",
      run: () => {
        act3Board('workshop');
        yardPurse(); timberUp(); window.__buy('after-signreach');
        window.__fast(0.2); window.__openAfterBoard('workshop'); window.__holdShot();
      } }
  };
}
// track A: saw mill
// The saw mill's machine, a stage a scene (after/mill.js): a sawyer put on
// through the roster, logs on its pile, run until `done`, then held there
// and framed on the mill from its log pile to its timber mound.
import { saw as millSaw, blockAt as millBlockAt } from './after/mill.js';
import { AFTER_MILL } from './config.js';
function millStage(done, grant = {}) {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  window.__afterCrowd((i, v) => (i < 2 ? 8 : v));
  for (let k = 0; k < 90 && window.__afterRead().walking > 0; k++) window.__fast(1);
  if (!S.after.built.includes('mill')) S.after.built.push('mill');
  window.__afterGrant({ logs: 4, timber: 6, ...grant });
  window.__afterPress(AFTER_JOB.SAW);
  for (let k = 0; k < 60 * 90 && !done(); k++) window.__fast(1 / 60);
  const b = stationBox('mill'), x = b.x + b.w / 2 + P * 4 - S.viewW / 2;
  pinCamera(x); window.__look(x);
  window.__still(true); window.__holdShot();
}
// The hand at the saw mill, played by the real hand a player has (hands.js's
// sweep and release, the wheel's gesture in after/gestures.js) on the game's
// own clock, so the bench and the shot tool see the same loop: press on the
// log pile, carry the log to the bed, let go, take the wheel and turn it
// until the log is cut and its blocks are out, rest, and stand it again.
// A cursor is drawn where the hand is (render/aftercues.js, `demoHand`).
const MILL_HAND = { look: 0.5, carry: 1.3, set: 0.7, reach: 0.6, spinMax: 14, tail: 1.2, rest: 1.2, turnsPerS: 2 };
function millHandDemo() {
  const mine = S.after;
  let ph = 'look', t = 0, from = null, to = null, ang = 0;
  const wheel = () => partsOf('mill').wheel;
  const rim = a => ({ x: wheel().x + Math.cos(a) * wheel().r, y: wheel().y + Math.sin(a) * wheel().r });
  const goTo = (p, pose) => { demoHand.x = p.x; demoHand.y = p.y; demoHand.pose = pose; S.mouse = { x: p.x, y: p.y }; };
  const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
  const go = next => { ph = next; t = 0; };
  const pile = () => window.__afterPile('mill', 'logs');
  const idx = STEPS.findIndex(q => q.name === 'millhand');
  if (idx >= 0) STEPS.splice(idx, 1);
  STEPS.push({ name: 'millhand', step: c => {
    if (!S.after || S.after !== mine) { demoHand.pose = null; STEPS.splice(STEPS.findIndex(q => q.name === 'millhand'), 1); return; }
    const dt = c.dt / 1000, M = MILL_HAND;
    t += dt;
    if (ph === 'look') {
      const p = pile(); goTo({ x: p.x, y: p.y - P * 4 }, 'point');
      if (t >= M.look) { goTo(p, 'grab'); S.trail = []; window.__afterHand(p.x, p.y, 'press'); from = p; to = bedWants() || { x: from.x + P * 14, y: from.y - P * 2 }; go('carry'); }
    } else if (ph === 'carry') {
      const k = Math.min(1, t / M.carry), e = k * k * (3 - 2 * k), p = lerp(from, to, e);
      p.y -= Math.sin(e * Math.PI) * P * 5;
      goTo(p, 'grab'); window.__afterHand(p.x, p.y, 'move');
      if (k >= 1) { go('set'); S.trail = []; }
    } else if (ph === 'set') {
      if (t < M.set * 0.4) goTo(to, 'grab');
      else if (S.held) { S.trail = []; window.__afterHand(to.x, to.y, 'drop'); goTo(to, 'point'); }
      if (t >= M.set) { from = to; to = rim(0); go('reach'); }
    } else if (ph === 'reach') {
      const k = Math.min(1, t / M.reach), e = k * k * (3 - 2 * k);
      goTo(lerp(from, to, e), k < 1 ? 'point' : 'grab');
      if (k >= 1) { ang = 0; gestureDown(to.x, to.y); go('spin'); }
    } else if (ph === 'spin') {
      ang += dt * M.turnsPerS * 2 * Math.PI;
      const p = rim(ang); goTo(p, 'grab'); gestureMove(p.x, p.y);
      if ((t > 1 && !millSaw().bed) || t >= M.spinMax) { gestureUp(p.x, p.y); go('tail'); }
    } else if (ph === 'tail') {
      const sw = millSaw(), p = rim(ang);
      goTo({ x: p.x + P * 6, y: p.y + P * 8 }, 'point');
      if (t >= M.tail && !sw.out.length) go('rest');
    } else if (ph === 'rest') {
      if (t >= M.rest) {
        // stood again: the pile and the mounds as they began
        S.after.saw = null;
        const r = window.__afterRead();
        window.__afterGrant({ logs: 4 - r.logs, timber: 6 - r.timber });
        go('look');
      }
    }
  } });
}
const millTrip = (ph, k) => () => { const tr = millSaw().trip; return !!tr && tr.ph === ph && tr.t >= k; };
Object.assign(SCENES, {
  'after-mill-carry': { about: 'the acts', branch: 'a3-mill-machine', review: 'act 3: the saw mill machine', stage: 'built: the real build on branch a3-mill-machine -- not on main yet; lands when you sign it off', option: 'A carry', say: "the sawyer out of the treadwheel, carrying the top log off the saw mill's pile round to the bed",
    run: () => millStage(millTrip('carry', 0.4)) },
  'after-mill-set': { about: 'the acts', branch: 'a3-mill-machine', review: 'act 3: the saw mill machine', stage: 'built: the real build on branch a3-mill-machine -- not on main yet; lands when you sign it off', option: 'B set', say: "the log swung over and set down on the saw mill's bed, a puff off both ends",
    run: () => millStage(() => { const tr = millSaw().trip; return !!tr && tr.ph === 'set' && tr.down && tr.t >= AFTER_MILL.set_s - AFTER_MILL.held + 0.05; }) },
  'after-mill-cut': { about: 'the acts', branch: 'a3-mill-machine', review: 'act 3: the saw mill machine', stage: 'built: the real build on branch a3-mill-machine -- not on main yet; lands when you sign it off', option: 'C cut', say: "the saw mid-cut: the blade at its foot, chips thrown, the log shortened into it and a timber block growing past it",
    run: () => millStage(() => { const s = millSaw(); return !!s.bed && s.bed.cut === 1 && s.hitAt != null && S.after.t - s.hitAt > 0.08 && S.after.t - s.hitAt < 0.12; }) },
  'after-mill-chute': { about: 'the acts', branch: 'a3-mill-machine', review: 'act 3: the saw mill machine', stage: 'built: the real build on branch a3-mill-machine -- not on main yet; lands when you sign it off', option: 'D chute', say: "cut blocks riding the bed out and down the chute onto the timber mound",
    run: () => millStage(() => millSaw().out.some(o => { const p = millBlockAt(o.a); return p.x > AFTER_MILL.chute.x0 + 2 && p.x < AFTER_MILL.chute.x1; })) },
  'after-mill-hand': { about: 'the acts', branch: 'a3-mill-machine', review: 'act 3: the saw mill machine', stage: 'built: the real build on branch a3-mill-machine -- not on main yet; lands when you sign it off', option: 'F by hand', say: "With nobody at the saw, you do it yourself: pick a log off the pile, drop it on the bed, then turn the wheel to cut it.",
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      if (!S.after.built.includes('mill')) S.after.built.push('mill');
      window.__afterGrant({ logs: 4, timber: 6 });
      window.__fast(0.5);
      const b = stationBox('mill'), x = b.x + b.w / 2 + P * 4 - S.viewW / 2;
      pinCamera(x); window.__look(x);
      millHandDemo();
    } },
  'after-mill-brim': { about: 'the acts', say: "a cut block tossed off the chute's foot onto a timber mound nearly at its brim",
    run: () => millStage(() => millSaw().out.some(o => { const p = millBlockAt(o.a); return p.x > AFTER_MILL.chute.x1 - 0.5; }), { timber: 15 }) }
});

// track A: the grove rebuilt (DESIGN.md, "Act 3's grove, rebuilt"): the
// real game's grove at rest beside the forestry shack and its seed basket,
// a tree growing row by row, and a tree sawn down by hand caught as its crown
// breaks and its trunk's logs hop apart. Framed as the signed-off mock's
// scenes were (after-grove-mock-*, the first plot's line less `at`), so the
// two shoot side by side.
// Framed on the first plot's line less `at`; the notices the scene's grants
// earned (act 1's firsts, "the first ore") hushed, since play never shows
// them up here.
const groveAt = at => { const x = plotX(0) - at; pinCamera(x); window.__look(x); S.wonShown = S.wonSeq | 0; };
Object.assign(SCENES, {
  'after-grove-rest': { about: 'the acts', say: "the grove at rest: a grown oak beside the forestry shack, its seed basket on the shack's far side with five acorns in it",
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1); groveAt(300); window.__fast(0.5); window.__holdShot(); } },
  'after-grove-basket-3': { about: 'the acts', say: 'the seed basket by the forestry shack holding three acorns, the bottom row alone',
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1); window.__afterGrant({ seeds: -2 }); groveAt(300); window.__fast(0.5); window.__holdShot(); } },
  'after-grove-basket-1': { about: 'the acts', say: 'the seed basket by the forestry shack holding its last acorn',
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1); window.__afterGrant({ seeds: -4 }); groveAt(300); window.__fast(0.5); window.__holdShot(); } },
  'after-grove-basket-0': { about: 'the acts', say: 'the seed basket by the forestry shack, empty',
    run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1); window.__afterGrant({ seeds: -5 }); groveAt(300); window.__fast(0.5); window.__holdShot(); } },
  'after-grove-grow': { about: 'the acts', say: "a second plot's oak growing row by row from the ground up, the trunk first and then the crown, beside a grown one",
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      window.__afterGrant({ rebel: 2000 }); yardPurse(); buyAfter('after-plot');
      window.__afterPlant(1, 0.72);
      groveAt(420); window.__fast(0.5); window.__holdShot();
    } },
  'after-grove-fell': { about: 'the acts', say: "an oak sawn down by hand, landed: its crown breaking into clumps that scatter and fade, its trunk's four logs hopping apart",
    run: () => {
      window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
      const b = window.__gestureParts('tree', 0).sawBox, x0 = b.x + P * 2, y = b.y + b.h / 2;
      window.__gesture('down', x0, y);
      for (let f = 1; f <= 600 && S.after.plots[0].fall == null; f++) { window.__gesture('move', x0 + Math.sin(f / 30 * Math.PI) * P * 6, y); window.__fast(1 / 60); }
      window.__gesture('up', x0, y);
      for (let f = 0; f < 600 && !(S.after.plots[0].fell != null && S.after.t - S.after.plots[0].fell >= 0.62); f++) window.__fast(1 / 60);
      groveAt(520); window.__holdShot();
    } }
});

// track B: the saw (DESIGN.md, "Act 3's grove, rebuilt", calls 7 to 9): the
// woodcutter felling the first oak with the hand saw, W-2 with heft, and the
// hand doing it itself, F1, the saw lying across the trunk and no icon. Framed
// as the signed-off mock's scenes were (after-grove-mock-w2h and -f1, the
// first plot's line 520 px in), so the two shoot side by side. Each has a
// `-start` twin stopped where the work begins, for a take of the whole felling.
import { handSawAt, gestureView as sawView } from './after/gestures.js';
import { GESTURE_SAW_AMP } from './config.js';
const handRec = () => (sawView() || []).find(q => q.key === 'tree');
// The woodcutter put on through its roster with the saw handed over, run
// until it stands at the tree (`start`), or on until a bite has just landed
// with the cut half through.
function woodcutterStage(start) {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  window.__afterCrowd((i, v) => (i < 2 ? 8 : v));
  for (let k = 0; k < 90 && window.__afterRead().walking > 0; k++) window.__fast(1);
  window.__afterGrant({ rebel: 2000 }); yardPurse();
  window.__afterSaw();
  staffAfter([AFTER_JOB.CUT]);
  const w = () => S.after.bodies.find(b => b.job === AFTER_JOB.CUT);
  const bit = () => !!w()?.bite && S.after.t - w().bite.at >= 0.05 && S.after.t - w().bite.at < 0.07;
  for (let k = 0; k < 60 * 90 && !(w()?.sawing && (start || (S.after.plots[0].chops >= 4 && bit()))); k++) window.__fast(1 / 60);
  groveAt(520);
  window.__still(true); window.__holdShot();
}
// F1 played by the hand a player has, on the game's own clock: the ghost hand
// teaches the stroke on the saw's grip, then the hand reaches it, presses and
// drags it end to end until the tree goes over, lets go and watches it break.
function sawHandDemo() {
  const mine = S.after;
  let ph = 'teach', t = 0, at = null;
  const goTo = (p, pose) => { demoHand.x = p.x; demoHand.y = p.y; demoHand.pose = pose; S.mouse = { x: p.x, y: p.y }; };
  const go = next => { ph = next; t = 0; };
  const idx = STEPS.findIndex(q => q.name === 'sawhand');
  if (idx >= 0) STEPS.splice(idx, 1);
  STEPS.push({ name: 'sawhand', step: c => {
    if (!S.after || S.after !== mine) { demoHand.pose = null; STEPS.splice(STEPS.findIndex(q => q.name === 'sawhand'), 1); return; }
    const dt = c.dt / 1000, p = S.after.plots[0], g = handSawAt(0, 0).grip;
    t += dt;
    if (ph === 'teach') { if (t >= 1.6) { at = { x: g.x + P * 4, y: g.y - P * 4 }; go('reach'); } }
    else if (ph === 'reach') {
      const k = Math.min(1, t / 0.4), e = k * k * (3 - 2 * k);
      goTo({ x: at.x + (g.x - at.x) * e, y: at.y + (g.y - at.y) * e }, k < 1 ? 'point' : 'grab');
      if (k >= 1) { gestureDown(g.x, g.y); go('saw'); }
    } else if (ph === 'saw') {
      // end to end and back each second, a little past the saw's swing (the
      // mock's pace: an end each half second)
      const x = g.x + Math.sin(t * 2 * Math.PI) * GESTURE_SAW_AMP * 1.1;
      gestureMove(x, g.y);
      goTo(handSawAt(0, handRec()?.s || 0).grip, 'grab');
      if (p.fall != null) { gestureUp(x, g.y); goTo({ x: demoHand.x, y: demoHand.y - P * 3 }, 'point'); go('watch'); }
    } else if (ph === 'watch' && t >= 0.4) demoHand.pose = null;
  } });
}
function sawStage(start) {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  groveAt(520);
  sawHandDemo();
  const bit = () => { const d = handRec()?.dust?.at(-1); return !!d && S.after.t - d.at >= 0.05 && S.after.t - d.at < 0.07; };
  if (!start) for (let k = 0; k < 60 * 30 && !(S.after.plots[0].chops >= 5 && bit()); k++) window.__fast(1 / 60);
  window.__still(true); window.__holdShot();
}
Object.assign(SCENES, {
  'after-grove-woodcutter': { about: 'the acts', say: "the woodcutter sawing the oak down with the hand saw: the push bitten home, the body leant in, sawdust thrown from the kerf and fading as it falls",
    run: () => { woodcutterStage(false); } },
  'after-grove-woodcutter-start': { about: 'the acts', say: "the woodcutter just come to the oak with the hand saw, about to fell it, for a take of the whole felling",
    run: () => { woodcutterStage(true); } },
  'after-grove-saw': { about: 'the acts', say: "you saw the oak down yourself: the hand saw dragged across the trunk a log's height up, sawdust flying from the cut",
    run: () => { sawStage(false); } },
  'after-grove-saw-start': { about: 'the acts', say: "the hand saw lying across the grown oak, the faint hand showing the stroke, for a take of the whole felling by hand",
    run: () => { sawStage(true); } }
});

// Track C: the stump pulled (DESIGN.md, "Act 3's grove, rebuilt", call 10;
// after/stump.js, render/after/stump.js), framed as the signed-off mock's
// F3a-1 was (the first plot's line less 300). `after-grove-stump` plays the
// hand on the game's own clock, through the real gesture and the one hand: a
// press on the stump, dragged up and held, each root giving at the strain,
// the stump out in the hand, carried off and let go, landing as a log; then
// the stump stood again. The cursor is drawn on the stump as the mock drew
// it (render/aftercues.js, `demoHand`); the drag itself runs on up past it,
// as a real pointer does. The review scene is the woodcutter's pull, never
// mocked: stump removal bought, the woodcutter at the stump, the stump stood
// again each time its log is home.
const STUMP_HAND = { look: 1.2, reach: 0.5, drag: 120, dragMax: 80, carry: 1.3, carryX: 14, carryUp: 4, rest: 1.6 };
const restump = () => Object.assign(S.after.plots[0], { grow: null, stump: true, dug: 0, fell: null, fall: null });
const stumpStep = (name, step) => {
  const mine = S.after, idx = STEPS.findIndex(q => q.name === name);
  if (idx >= 0) STEPS.splice(idx, 1);
  STEPS.push({ name, step: c => {
    if (!S.after || S.after !== mine) { demoHand.pose = null; STEPS.splice(STEPS.findIndex(q => q.name === name), 1); return; }
    step(c.dt / 1000);
  } });
};
function stumpHandDemo() {
  let ph = 'look', t = 0, from = null;
  const top = () => { const b = partsOf('stump', 0).stump; return { x: b.x + b.w / 2, y: b.y + AP / 2 }; };
  const goTo = (p, pose) => { demoHand.x = p.x; demoHand.y = p.y; demoHand.pose = pose; S.mouse = { x: p.x, y: p.y }; };
  const go = next => { ph = next; t = 0; };
  stumpStep('stumphand', dt => {
    t += dt;
    const M = STUMP_HAND, g = top();
    if (ph === 'look') {
      if (t >= M.look) go('reach');
    } else if (ph === 'reach') {
      const k = Math.min(1, t / M.reach), e = k * k * (3 - 2 * k);
      goTo({ x: g.x + AP * 8 * (1 - e), y: g.y - AP * 8 * (1 - e) }, k < 1 ? 'point' : 'grab');
      if (k >= 1) { gestureDown(g.x, g.y); go('pull'); }
    } else if (ph === 'pull') {
      gestureMove(g.x, g.y - Math.min(M.dragMax, t * M.drag));
      const rec = (window.__gestureView() || []).find(r => r.key === 'stump');
      if (S.after.plots[0].stump) goTo({ x: g.x, y: g.y - (rec ? rec.lift : 0) }, 'grab');
      else { from = { x: S.mouse.x, y: S.mouse.y }; go('carry'); }
    } else if (ph === 'carry') {
      const k = Math.min(1, t / M.carry), e = k * k * (3 - 2 * k);
      goTo({ x: from.x - e * AP * M.carryX, y: from.y - Math.sin(Math.PI * k) * AP * M.carryUp }, 'grab');
      window.__afterHand(S.mouse.x, S.mouse.y, 'move');
      if (k >= 1) { S.trail = []; gestureUp(S.mouse.x, S.mouse.y); window.__afterHand(S.mouse.x, S.mouse.y, 'drop'); S.dragging = false; goTo(S.mouse, 'point'); go('rest'); }
    } else if (ph === 'rest') {
      goTo({ x: S.mouse.x, y: S.mouse.y - 20 * dt }, 'point');
      if (t >= M.rest) { demoHand.pose = null; restump(); go('look'); }
    }
  });
}
// The stump stood with nothing lying round it and the act's coins to buy with.
function stumpStage() {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  window.__afterGrant({ rebel: 3000 }); yardPurse();
  restump();
  groveAt(300);
}
Object.assign(SCENES, {
  'after-grove-stump': { about: 'the acts', say: "a stump pulled by hand: taken by the block itself and dragged up, the soil cracking, the next root pulling taut, each snapping with a held jerk and a throw of dirt that falls and fades; out, the stump is a log in the hand, carried off and let go",
    run: () => { stumpStage(); window.__fast(0.2); stumpHandDemo(); window.__fast(2.4); window.__holdShot(); } },
  'after-grove-stump-woodcutter': { about: 'the acts',
    say: "With stump removal bought, the woodcutter pulls the stump the way your hand does: it takes hold of the block, heaves it up, leans back while a root strains, each snap jerks the stump a cell and throws dirt; with the last it swings the stump-log onto its head and carries it to the shack's pile.",
    run: () => {
      stumpStage();
      buyAfter('after-stumps');
      for (let k = 0; k < 120 && window.__afterRead().walking > 0; k++) window.__fast(1);
      window.__afterPress('woodcutter');
      const w = () => S.after.bodies.find(b => b.job === AFTER_JOB.CUT);
      for (let f = 0; f < 240 * 10 && !(w() && w().pull && w().pull.ph === 'heave'); f++) window.__fast(0.1);
      // stood again once the last log is home, so the pull plays on
      stumpStep('stumppull', () => { const b = w(); if (!S.after.plots[0].stump && b && !b.load.length && !b.dig) restump(); });
      window.__holdShot();
    } }
});

// Track D: seeds (DESIGN.md, "Act 3's grove, rebuilt"): a woodcutter planting
// from the basket, a seed bought and carried in from heaven's gates, and a
// felled crown dropping an acorn that a member carries home. Framed as the
// signed-off mock's scenes were (after-grove-mock-a1, -s2, -s3a), so they
// shoot side by side. Each is run as a player's yard would run it: the
// members walked out, the rows bought through `__buy`.
import { clearPlot, chopTree } from './after/grove.js';
import { lying } from './after/ground.js';
import { TREE_CHOPS } from './config.js';
const grovePeople = n => {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  window.__afterCrowd((i, v) => (i < n ? 8 : v));
  for (let k = 0; k < 90 && window.__afterRead().walking > 0; k++) window.__fast(1);
  yardPurse(); window.__afterGrant({ rebel: 2000 });
};
// Frames until a fact holds, at most `s` seconds of the game.
const until = (fact, s = 90) => { for (let f = 0; f < s * 60 && !fact(); f++) window.__fast(1 / 60); };
const basketAt = () => window.__afterPile('forestry', 'seeds');
Object.assign(SCENES, {
  'after-grove-plant': { about: 'the acts', say: "a woodcutter plants: it took an acorn out of the seed basket, carried it to the bare plot and set it in; the acorn is sinking into the soil and the basket is an acorn short",
    run: () => {
      grovePeople(3);
      S.after.plots = []; clearPlot();   // the grove's one plot bare, for the woodcutter to plant
      window.__afterPress(AFTER_JOB.CUT, 1);
      until(() => S.after.plots[0].seed != null);
      S.after.plots[0].seed = S.after.t;   // the sink begun: a still caught while the acorn is going in
      window.__fast(0.3);
      groveAt(300); window.__holdShot();
    } },
  'after-grove-seeds': { about: 'the acts', say: "a seed bought on the grove's board: a member has walked in from heaven's gates with the one acorn and stands at the seed basket, which is two acorns short",
    run: () => {
      grovePeople(3);
      window.__afterGrant({ seeds: -3 });
      window.__buy('after-seeds');
      until(() => S.after.bodies.some(b => loadKind(b) === 'acorn' && Math.abs(b.x - basketAt().x) < P * 10));
      groveAt(300); window.__holdShot();
    } },
  'after-grove-selfseed': { about: 'the acts', say: "self-seeding bought, an oak sawn down and its crown broken: an acorn fell out of it and lies on the logs until a member carries it to the seed basket",
    run: () => {
      grovePeople(3);
      window.__afterGrant({ seeds: -4 });
      buyAfter('after-selfseed');
      S.after.ups['after-selfseed'] = 4;   // the last rung's chance, so the first fall drops one
      for (let k = 0; k < TREE_CHOPS; k++) chopTree(0, true);
      window.__fast(0.1);
      until(() => lying().some(q => q.kind === 'acorn' && q.at != null && S.after.t - q.at > 0.7), 20);
      groveAt(420); window.__holdShot();
    } }
});

// The woodcutter's whole round on one plot, for a take of the loop: the saw,
// stump removal and faster growth bought, the plot bare, the woodcutter put on.
// It plants from the basket, the oak grows, it saws it down, the logs are
// carried home, it pulls the stump and carries that home, and plants again.
Object.assign(SCENES, {
  'after-grove-loop': { about: 'the acts', say: "the woodcutter's whole round on one plot: plant, grow, saw it down, the logs carried home, the stump pulled and carried, plant again",
    run: () => {
      grovePeople(3);
      // the saw bought, and handed over without its beat (the act's opening is
      // not played here, so the beat would wait on it)
      buyAfter('after-saw'); buyAfter('after-stumps'); buyAfter('after-grow');
      window.__afterSaw();
      S.after.plots = []; clearPlot();
      window.__afterPress(AFTER_JOB.CUT, 1);
      groveAt(360);
    } }
});
// The forestry shack's stump house, built (render/after/stations.js), for the
// owner beside the mock it came from: the grove at rest, framed as the mock
// was, its stovepipe smoking.
SCENES['after-cabin'] = { about: 'the acts', review: 'act 3: the cabin, built', option: 'A the stump house',
  stage: 'built: cabin-stump, not on main yet', branch: 'cabin-stump', supersedes: ['act 3: the cabin'],
  say: "the forestry shack as the stump house: a sawn stump with an arched door, a round window and a shelf fungus in its bark, the stovepipe smoking",
  run: () => { window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1); groveAt(300); window.__fast(0.5); } };
// The ghost acorn over a bare plot (render/aftercues.js, `drawPlantCue`): a
// grown oak on the first plot and a bare second plot beside it, so only the
// bare one is marked. The hand plays on the game's own clock: empty a while
// (the mark at the cue's ink), then it presses an acorn off the basket and
// carries it over the bare bed (the mark darkened), lets it go and it is
// planted (the mark fades out); then the plot is cleared and the mark fades
// back in. The `-held` twin stops with the acorn held over the bed.
const plantHereYard = () => {
  window.__reset(); window.__actsOn(null); window.__goPlace('after'); window.__fast(1);
  window.__afterGrant({ rebel: 2000 }); yardPurse(); buyAfter('after-plot');
  const basket = window.__afterPile('forestry', 'seeds'), x = (plotX(1) + basket.x) / 2 - S.viewW / 2;
  pinCamera(x); window.__look(x);
  window.__fast(1); S.wonShown = S.wonSeq | 0;
  return basket;
};
const plantHereBed = () => ({ x: plotX(1), y: groundOf('grove') - AP * 12 });
function plantHereDemo(basket) {
  let ph = 'look', t = 0;
  const goTo = (p, pose) => { demoHand.x = p.x; demoHand.y = p.y; demoHand.pose = pose; S.mouse = { x: p.x, y: p.y }; };
  const go = next => { ph = next; t = 0; };
  const ease = k => k * k * (3 - 2 * k);
  stumpStep('planthere', dt => {
    t += dt;
    const bed = plantHereBed();
    if (ph === 'look') { demoHand.pose = null; if (t >= 2.5) go('reach'); }
    else if (ph === 'reach') {
      const k = ease(Math.min(1, t / 0.5));
      goTo({ x: basket.x + AP * 6 * (1 - k), y: basket.y - AP * 8 * (1 - k) }, k < 1 ? 'point' : 'grab');
      if (t >= 0.5) { window.__afterHand(basket.x, basket.y, 'press'); go('carry'); }
    } else if (ph === 'carry') {
      const k = ease(Math.min(1, t / 1.4)), p = { x: basket.x + (bed.x - basket.x) * k, y: basket.y + (bed.y - basket.y) * k - Math.sin(Math.PI * k) * AP * 6 };
      goTo(p, 'grab'); window.__afterHand(p.x, p.y, 'move');
      if (t >= 1.4) go('hover');
    } else if (ph === 'hover') {
      goTo(bed, 'grab'); window.__afterHand(bed.x, bed.y, 'move');
      if (t >= 1.2) { S.trail = []; window.__afterHand(bed.x, bed.y, 'drop'); S.dragging = false; goTo(bed, 'point'); go('rest'); }
    } else if (ph === 'rest') {
      goTo({ x: bed.x, y: bed.y - 20 * Math.min(t, 1) }, 'point');
      if (t >= 1) demoHand.pose = null;
      if (t >= 3) { Object.assign(S.after.plots[1], { grow: null, seed: null, stump: false, dug: 0, fall: null, fell: null, chops: 0 }); go('look'); }
    }
  });
}
Object.assign(SCENES, {
  'after-grove-plant-here': { about: 'the acts', say: "A ghost acorn bobs over each bare plot an acorn can go in: faint while your hand is empty, darker while it holds an acorn, fading out once one is planted.",
    run: () => { plantHereDemo(plantHereYard()); } },
  'after-grove-plant-here-held': { about: 'the acts', say: 'the ghost acorn over the bare plot, darkened while the hand holds an acorn over the bed',
    run: () => {
      const basket = plantHereYard(), bed = plantHereBed();
      window.__afterHand(basket.x, basket.y, 'press');
      for (let k = 1; k <= 10; k++) { const x = basket.x + (bed.x - basket.x) * k / 10, y = basket.y + (bed.y - basket.y) * k / 10; window.__afterHand(x, y, 'move'); window.__fast(0.1); }
      demoHand.x = bed.x; demoHand.y = bed.y; demoHand.pose = 'grab'; S.mouse = { x: bed.x, y: bed.y };
      window.__fast(1); window.__holdShot();
    } }
});

// The grove's real build for the owner, one review (review.html#grove-built):
// every real grove scene says where it is built, and nine stand as its
// options, putting away the four mock reviews they came out of.
const GROVE_BUILT = { stage: 'built: grove-integrate, not on main yet', branch: 'grove-integrate' };
const GROVE_OPTIONS = [
  ['after-grove-rest', 'A rest'], ['after-grove-grow', 'B grow'], ['after-grove-woodcutter', 'C the woodcutter fells'],
  ['after-grove-saw', 'D F1 hand saw'], ['after-grove-stump', 'E stump by hand'], ['after-grove-stump-woodcutter', 'F the woodcutter pulls a stump'],
  ['after-grove-plant', 'G plant'], ['after-grove-seeds', 'H seeds/basket'], ['after-grove-selfseed', 'I self-seed'],
  ['after-grove-plant-here', 'J plant here']
];
for (const key of Object.keys(SCENES)) if (key.startsWith('after-grove-') && !key.startsWith('after-grove-mock')) Object.assign(SCENES[key], GROVE_BUILT);
for (const [key, option] of GROVE_OPTIONS) Object.assign(SCENES[key], { review: 'grove: built', option,
  supersedes: ['grove: layout, growth, the fall', 'grove: planting and seeds', 'grove: the woodcutter', 'grove: by hand'] });
