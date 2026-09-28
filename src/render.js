// The painting order, and the loop that walks it.
//
// `LAYERS` is the picture back to front, one entry a layer; moving a layer is
// moving one line. An entry is `{ name, draw }` plus an optional `when` for a
// layer that is only in the picture some of the time, and an optional `dim`
// for one the crew switch fades or hides. Every draw lives in `src/render/`; this file
// draws nothing.

import { CREW_FADE, P, MAGIC_TONES, RIPPLE_RINGS, RIPPLE_GAP } from './config.js';
import { crewView } from './prefs.js';
import { ctx } from './render/ctx.js';
import { drawAir, drawAirNear } from './air.js';
import { drawBirds, drawClouds } from './weather.js';

import { drawApothecary, drawBrewSteam, drawPotLabels } from './render/apothecary.js';
import { drawBalloonPosts } from './render/balloon.js';
import { drawWorkBars } from './render/bars.js';
import { drawBuildSites, drawGrit, drawSilt } from './render/buildsites.js';
import { drawYardArrow, drawDeepArrow } from './render/shaftway.js';
import { drawPortal, drawDeepPortal } from './render/portal.js';
import { drawCasino, drawCasinoMark, drawPotPile, drawSparks } from './render/casino.js';
import { drawCore, drawCoreBehind, drawPaid, drawAbyss, drawRift, drawRockSand } from './render/cores.js';
import { drawKitStandCounts, drawRosterBadgeCounts, drawStockCounts } from './render/counts.js';
import { drawCount } from './render/counter.js';
import { drawBench, drawDroppedHats, drawIntro, drawKitStands,
         drawPointed, drawRosterBodies, drawSays, drawWorkers, drawForklifts, drawGarage, drawHeld } from './render/crew.js';
import { drawCursor } from './render/cursor.js';
import { clearPage, clipToHalf, enterScreen, enterSky, enterWorld, leaveWorld, pressFrame } from './render/frame.js';
import { deepTop } from './deep/place.js';
import { drawFloor, drawGroundLine, drawGroundTexture, drawPit, drawPitOutline } from './render/ground.js';
import { drawRisingHouse, drawSettlement } from './render/houses.js';
import { drawDoneMarks } from './render/donemarks.js';
import { stepRiseLandings } from './render/landings.js';
import { drawBelt, drawDrill, drawRam, drawTiller } from './render/machines.js';
import { drawAuras, drawFlags } from './render/aura.js';
import { drawPileMarks } from './render/pilemarks.js';
import { drawChips, drawRock } from './render/rock.js';
import { drawShield } from './render/shield.js';
import { drawFilter, drawClods } from './render/filter.js';
import { drawShocks } from './render/shock.js';
import { drawBridge, drawCut, drawFarm, drawFarmShed, drawQuarry, drawQuarryShed } from './render/sites.js';
import { drawSky } from './render/sky.js';
import { drawBolt, drawFlash, drawMuck, drawPuffs, drawRain, drawRainBack, drawSmog } from './render/smog.js';
import { drawDoseMotes, drawSmoke } from './render/stations.js';
import { drawNoticeboard } from './render/noticeboard.js';
import { drawOuthouse, drawTower, drawTowerWaves } from './render/tower.js';
import { drawRoombaDock, drawRoombas } from './render/roomba.js';
import { drawShack } from './render/shack.js';
import { drawDeepWater, drawDeepFloor, drawDeepBed, drawDeepStations, drawDeepMotes,
         drawSwimmers, drawDeepInvert } from './render/deep.js';
import { ripple, deepCamera, canGoDown, gliding } from './view.js';
import { drawThrough, warmRipple } from './render/ripple.js';
import { drawSerpent, drawSnatch } from './render/serpent.js';
import { drawFightNumbers } from './render/fightnums.js';
import { drawSerpentBar, barShown } from './render/serpentbar.js';
import { drawFighters, drawShots } from './render/arms.js';   // track RENDER, docs/wave-party.md
import { drawSinking, drawLifting, drawIntoCrusher } from './render/scales.js';
import { S } from './state.js';

// The drawing side's public surface: the rest of the game imports every one of
// these from render.js and has no business knowing which file each is in.
export { canvas, ctx } from './render/ctx.js';
export { cell, drawCircle, drawDiamond, drawMark, drawTriangle } from './render/marks.js';
export { risingPlaces, rising, withRise } from './render/rise.js';
export { bar, barSpot, drawWorkBars } from './render/bars.js';
export { drawBuildSites, drawGrit } from './render/buildsites.js';
export { drawGrid, drawGroundLine, drawPit, drawPitCores, drawPitOutline } from './render/ground.js';
export { drawDoneMarks, doneMarkAt, overDoneMark } from './render/donemarks.js';
export { drawCursor } from './render/cursor.js';
export { CAULDRON, CAULDRON_BREW_ROW, drawApothecary } from './render/apothecary.js';
export { drawMuck, drawPuffs, drawRain, drawRainBack, drawSmog } from './render/smog.js';
export { drawOuthouse, drawTower, drawTowerWaves } from './render/tower.js';
export { drawShack } from './render/shack.js';
export { drawFilter } from './render/filter.js';
export { casinoMarkAt, drawCasino, drawCasinoMark, drawPotPile, drawSparks } from './render/casino.js';
export { drawSky } from './render/sky.js';
export { drawCore, drawCoreAt, drawCoreBehind, drawPaid, drawAbyss, drawRift } from './render/cores.js';
export { drawCount } from './render/counter.js';
export { drawBelt, drawDrill, drawRam, drawRunSwitch, drawTiller } from './render/machines.js';
export { drawPileMarks, overPileMark, pileMarkAt } from './render/pilemarks.js';
export { drawSmoke } from './render/stations.js';
export { drawBridge, drawCut, drawFarm, drawFarmShed, drawQuarry, drawQuarryShed } from './render/sites.js';
export { drawBench, drawBody, drawCart, drawDroppedHats, drawHat, drawIntro, drawKitStands,
         drawPointed, drawSays, drawWorkers } from './render/crew.js';

// --- the painting order -------------------------------------------------------
//
// Back to front. `world` and `screen` are spaces, not pictures: what is drawn
// between `world` and its `world:done` is in the yard and zooms and shakes with
// it; what comes after `screen` is in screen pixels. The space is as much a
// part of the order as the depth, so both are in the list.
const LAYERS = [
  { name: 'page', draw: clearPage },

  // The sky goes down first: clouds and birds are the far end of everything.
  { name: 'world', draw: enterSky },
  // The rain out of the far sheets goes down before the clouds, not after:
  // it is scenery and never lands (DESIGN.md, "The rain has depth too"), and
  // drawn over them a far drop crosses a cloud nearer than itself, which is
  // the one thing the depth is for. The sheet that does land is the `rain`
  // entry far below, in front of the yard, where the whole shower used to be.
  { name: 'rain behind', draw: drawRainBack },
  { name: 'clouds', draw: drawClouds },
  { name: 'birds', draw: drawBirds },
  { name: 'world:done', draw: leaveWorld },

  // The dust hangs in front of the clouds: it is weather in the yard, not
  // something on the horizon.
  { name: 'air', draw: drawAir },

  { name: 'world', draw: enterWorld },
  { name: 'core behind', draw: drawCoreBehind },
  { name: 'ground line', draw: drawGroundLine },
  { name: 'ground texture', draw: drawGroundTexture },
  // The offer flags go down before every building: each pole runs to the
  // ground and the building's silhouette covers its lower run.
  { name: 'offer flags', draw: drawFlags },
  { name: 'quarry', draw: drawQuarry },          // a hole in the ground, so it goes down with the ground
  { name: 'quarry shed', draw: drawQuarryShed }, // the shed beside it, holding its board
  { name: 'cut', draw: drawCut },                // the dust lying in it; after the quarry, or its white columns erase it
  { name: 'bridge', draw: drawBridge },          // and the way across it
  { name: 'drill', draw: drawDrill },            // which the drill stands on
  { name: 'farm', draw: drawFarm },
  { name: 'farm shed', draw: drawFarmShed },     // the shed beside it, holding its board
  { name: 'apothecary', draw: drawApothecary },  // the pot on the fire, standing right past the farm
  { name: 'tiller', draw: drawTiller },
  // The gang's hut, before the ram that parks between it and the rock.
  { name: 'shack', draw: drawShack },
  { name: 'ram', draw: drawRam },                // before the rock, so the hill stands in front of it
  { name: 'belt', draw: drawBelt },              // the road from the rock to the hole
  { name: 'sky', draw: drawSky },
  { name: 'casino', draw: drawCasino },
  { name: 'air filter', draw: drawFilter },
  { name: 'balloon posts', draw: drawBalloonPosts }, // where the filter's balloons moor; the craft are drawn among the clouds
  { name: 'tower', draw: drawTower },
  { name: 'outhouse', draw: drawOuthouse },
  { name: 'roomba dock', draw: drawRoombaDock }, // the closet's charge posts, one a roomba owned
  { name: 'pot pile', draw: drawPotPile },       // what is on the table, as a heap on the ground
  { name: 'sparks', draw: drawSparks },          // and whatever the last spin threw out of it
  { name: 'smoke', draw: drawSmoke },
  { name: 'dose motes', draw: drawDoseMotes, dim: 1 }, // the tonic trailing off a body, at the smoke's depth

  { name: 'rock', draw: drawRock },
  // After the rock, because a shield stands over it; before the crew, who walk
  // in front of everything.
  { name: 'shield', draw: drawShield },
  { name: 'rock sand', draw: drawRockSand },     // and whatever has come down on top of it
  { name: 'chips', draw: drawChips },            // and whatever is in the air off it
  // The ring and specks off a crit go over the chips it threw up: the blow is
  // in front of its own spoil.
  { name: 'shocks', draw: drawShocks },

  // The bench and the settlement go down before the loose stuff: everything
  // lying on the ground (dust, finds, muck) piles up against a wall and buries
  // its foot, rather than stopping dead at it.
  { name: 'bench', draw: drawBench },
  { name: 'noticeboard', draw: drawNoticeboard },  // the record, on the way to the houses
  { name: 'settlement', draw: drawSettlement },  // and the crew are drawn later still, so they walk in front of both
  { name: 'rising room', draw: drawRisingHouse },// the one room still going up, if a hire is under way

  { name: 'floor', draw: drawFloor },
  { name: 'pit', draw: drawPit },
  { name: 'muck', draw: drawMuck },              // and whatever the last rain left on top of the lot
  { name: 'roombas', draw: drawRoombas },        // driving over the mess they take in, under everybody's feet
  { name: 'clods', draw: drawClods },            // and the loads still falling off the air filter's spout
  { name: 'abyss', draw: drawAbyss },            // the drowned pit: the liquid, its ripples and the plank
  { name: 'pit outline', draw: drawPitOutline },
  // The snatch's whirlpool, and the wizards' hole torn through the pit's
  // near wall: after the outline, which would otherwise rule a line down it.
  { name: 'portal', draw: drawPortal },
  { name: 'shaft arrow', draw: drawYardArrow },  // and over it, the way down

  { name: 'paid', draw: drawPaid },
  { name: 'core', draw: drawCore },
  { name: 'pile marks', draw: drawPileMarks },   // and a bar over anything that has stopped for a full one
  { name: 'auras', draw: drawAuras },            // the hold-a-body ring; offers fly flags, painted far earlier
  { name: 'build sites', draw: drawBuildSites }, // fenced off, for as long as it is under way
  { name: 'grit', draw: drawGrit },              // and the chips off the hammer, in FRONT of the walls
  { name: 'rise landings', draw: stepRiseLandings }, // a puff and a knock, the frame a rising place lands
  { name: 'tower waves', draw: drawTowerWaves }, // the tower pouring, while it is making a hat
  { name: 'casino mark', draw: drawCasinoMark }, // and which way the last hand at the table went
  { name: 'kit stands', draw: drawKitStands },   // and the kit put out ready at each of them
  { name: 'garage', draw: drawGarage },           // where the forklifts go when there is nothing to fetch
  { name: 'dropped hats', draw: drawDroppedHats, dim: 1 },// and any that has been shaken off somebody
  // The deep (render/deep.js), back to front, drawn only while the camera is
  // down there: the roof and the underside of the surface, the water, the
  // floor, the scales lying on it and its stations, then the serpent and
  // everything in the water with it. Before the roster, so a deep station's
  // post stands on the deep's floor like any other.
  { name: 'deep water', draw: drawDeepWater },
  { name: 'deep motes', draw: drawDeepMotes },
  { name: 'deep portal', draw: drawDeepPortal }, // the way up, hanging in the water behind it all
  { name: 'deep floor', draw: drawDeepFloor },
  // The scales, then the stations standing in front of them: the bed can
  // heap forty cells deep, and a station buried in its own coin could not
  // be found to be paid at.
  { name: 'deep bed', draw: drawDeepBed },
  { name: 'into crusher', draw: drawIntoCrusher }, // behind the furnace, dropping into its funnel
  { name: 'deep stations', draw: drawDeepStations },
  { name: 'serpent', draw: drawSerpent },
  { name: 'swimmers', draw: drawSwimmers },
  // The fighters in front of the coil they strike and the swimmers passing,
  // and what leaves them -- arrows, beams, charges, hexes, notes -- over all
  // of the fighters (track RENDER, docs/wave-party.md).
  { name: 'party', draw: drawFighters },
  { name: 'shots', draw: drawShots },
  { name: 'sinking', draw: drawSinking },        // the scales still in the water, in front of it all
  { name: 'lifting', draw: drawLifting },
  { name: 'deep arrow', draw: drawDeepArrow },   // the way up, under the deep's end of the portal
  { name: 'silt', draw: drawSilt },              // off a builder's blows down there, in the water with the rest
  // What a station is putting up and what it has finished hang over it in
  // front of the deep's domes as well as the yard's roofs: behind them, the
  // stack over a station on the deep's floor was inside its own dome.
  { name: 'work bars', draw: drawWorkBars },     // and whatever else the yard is putting up
  { name: 'done marks', draw: drawDoneMarks },   // a tick over any station that finished something
  { name: 'roster', draw: drawRosterBodies },    // who is working here, under the place they work
  { name: 'intro', draw: drawIntro },            // the two of them, or whoever is under the rock
  { name: 'forklifts', draw: drawForklifts },   // behind the crew, who walk in front of the machines
  { name: 'workers', draw: drawWorkers, dim: 1 },
  { name: 'brew steam', draw: drawBrewSteam },   // off the pots, on the crew's plane: in front of the buildings
  { name: 'says', draw: drawSays, dim: 1 },      // and what any of them stood about is saying
  { name: 'puffs', draw: drawPuffs },            // what the crew are putting up there right now
  { name: 'smog', draw: drawSmog },              // and what it has gathered into up there
  // The serpent's head over the liquid it came out of, and the one it takes
  // in its jaws, in front of the pair.
  { name: 'snatch', draw: drawSnatch },

  // The rift bends what is behind it, so it must come after everything of the
  // world: painted back with the pit, it warped blank page and read as a plain
  // disc. Nothing that has to stay readable is ever over the pit's near end.
  { name: 'rift', draw: drawRift },              // through the torn era, the disc growing over the mouth
  { name: 'rain', draw: drawRain },              // and whatever is coming down out of it, or going into the house
  { name: 'bolt', draw: drawBolt },              // and a strike, in front of the shower it came with
  { name: 'held', draw: drawHeld, dim: 1 },      // the body in your hand, in front of all of it
  { name: 'pointed', draw: drawPointed },        // and an arrow over whoever you just asked for by name
  { name: 'cursor', draw: drawCursor },
  // Last in the world, over everything the deep drew: the negative of it.
  { name: 'deep invert', draw: drawDeepInvert },
  // What the blows did and what the heal took back, over the finished deep
  // and not turned over with it: their tones are written as seen, so each
  // fades against the picture actually behind it, whichever way the deep was
  // turned (render/fightnums.js). Still in the world, for the deep's camera.
  { name: 'fight numbers', draw: drawFightNumbers },
  { name: 'world:done', draw: leaveWorld },

  { name: 'air near', draw: drawAirNear },       // the nearest dust passes in front of the yard, not behind it

  // The roster's counts are in screen pixels so the digits stay sharp, but
  // moved with the yard rather than pinned to the window: the number belongs
  // to the badge beside it, shake and all.
  { name: 'screen', draw: enterScreen },
  { name: 'roster counts', draw: drawRosterBadgeCounts },
  { name: 'kit counts', draw: drawKitStandCounts },   // and how many are waiting on each stand
  { name: 'stock count', draw: drawStockCounts },     // and how many doses stand ready on the apothecary table
  { name: 'pot labels', draw: drawPotLabels },        // the brew each pot is set to, as a color block under it

  { name: 'counter', draw: drawCount },          // last, and in screen pixels: it is read, not looked at
  { name: 'serpent bar', draw: drawSerpentBar, when: barShown },  // and in the deep, what the defense up has left

  { name: 'flash', draw: drawFlash },            // a strike's instant: the whole finished frame, inverted

  { name: 'press', draw: pressFrame },           // and then the filter, over the finished frame
];

export { LAYERS };

// The landing page's picture (main.js, `demo`) is the yard to be looked at
// and not read: the layers a player reads off the picture are left out of it.
const READING = new Set(['offer flags', 'paid', 'pile marks', 'auras', 'work bars', 'done marks',
                         'casino mark', 'roster', 'pointed', 'cursor', 'roster counts', 'kit counts',
                         'stock count', 'pot labels', 'counter', 'fight numbers', 'serpent bar']);
let picture = false;
export const asPicture = on => { picture = on; };

// The deep's layers, and the ones both halves share: the spaces, the posts,
// the pointer's own marks, and everything in screen pixels. With the camera
// in the deep every other layer is the yard's and is not drawn; in the yard
// the deep's are not. A glide draws whichever half the camera is in at that
// moment (view.js moves it at the black).
const DEEP = new Set(['deep water', 'deep motes', 'deep portal', 'deep floor', 'deep stations', 'deep bed',
                      'serpent', 'swimmers', 'party', 'shots', 'sinking', 'lifting', 'deep arrow', 'silt', 'deep invert',
                      'fight numbers']);
// The marks of work -- the bar over a work on the go, the tape round it, the
// tick when it lands -- and the pile-full marks stand wherever their site
// does, so they are drawn in both halves, each cut to its own (`PINNED`).
const BOTH = new Set(['page', 'world', 'world:done', 'screen', 'roster', 'says', 'held', 'pointed', 'cursor',
                      'work bars', 'build sites', 'done marks', 'pile marks']);
const SCREEN_FROM = LAYERS.findIndex(l => l.name === 'screen');
const shared = (layer, i) => BOTH.has(layer.name) || i > SCREEN_FROM;
const inHalf = (layer, i, deep) =>
  shared(layer, i) || (deep ? DEEP.has(layer.name) : !DEEP.has(layer.name));
// Of the shared layers, the ones pinned to the window rather than standing
// over something in the world: the spaces, the pointer, the counter and the
// frame's own finish. Every other shared layer is cut at the shaft's middle
// (frame.js, `clipToHalf`), so what it draws over the yard never shows in the
// deep and the other way about -- "off the glass in the other half" does not
// hold on a window taller than the deep.
// The body in your hand goes where the pointer goes, so it is the pointer's.
const PINNED = new Set(['page', 'world', 'world:done', 'screen', 'held', 'cursor', 'counter', 'serpent bar',
                        'flash', 'press']);
const halfLine = () => (S.worldH + deepTop()) / 2;

// One half, every layer that belongs to it, with whatever camera is standing.
function drawHalf(deep) {
  for (let i = 0; i < LAYERS.length; i++) {
    const layer = LAYERS[i];
    if (!inHalf(layer, i, deep)) continue;
    if (picture && READING.has(layer.name)) continue;
    if (layer.when && !layer.when()) continue;
    // A `dim` layer is the crew's own plane, and the corner's crew switch
    // takes ink out of it, or takes it out of the picture, so the buildings
    // behind a late yard's crowd can be read (prefs.js, `crewView`). Only the
    // picture: the bodies still walk and work where nobody is drawing them.
    // The alpha is put back the same frame: nothing else is ever drawn faint.
    const view = layer.dim ? crewView() : 'show';
    if (view === 'hide') continue;
    const faint = view === 'fade';
    if (faint) ctx.globalAlpha = CREW_FADE;
    const cut = shared(layer, i) && !PINNED.has(layer.name);
    if (cut) clipToHalf(deep, halfLine());
    layer.draw();
    if (cut) ctx.restore();
    if (faint) ctx.globalAlpha = 1;
  }
}

// The half on screen, and in a glide the deep through the ripple out of the
// portal (view.js, `ripple`): drawn a second time with the deep's own
// camera, through the leading ring (render/ripple.js), so neither half's
// camera moves while the other shows through; then the rings themselves over
// both. With no glide, the ripple is readied while the page is idle -- not on
// the landing page's picture, which never goes down.
export function draw() {
  drawHalf(S.view === 'deep');
  const rip = ripple();
  if (!rip) { if (!picture) warmRipple(canWarm, drawDeepUnseen); return; }
  if (rip.r <= 0) return;
  // The yard's knock is the yard's (world.js, `stepShake`): the deep through
  // the ripple holds still while the yard around it rocks.
  asDeep(() => drawThrough(rip, S.dpr, () => drawHalf(true)));
  drawRipples(rip);
}

// The deep's camera standing for the length of `fn`, and the yard's put back.
function asDeep(fn) {
  const keep = { view: S.view, camX: S.camX, camY: S.camY, zoom: S.zoom, viewW: S.viewW, viewH: S.viewH,
                 shakeX: S.shakeX, shakeY: S.shakeY };
  Object.assign(S, deepCamera(), { view: 'deep', shakeX: 0, shakeY: 0 });
  try { fn(); } finally { Object.assign(S, keep); }
}

// The ripple can be readied while the yard is on screen with the way down
// open and nothing under way.
const canWarm = () => S.view === 'yard' && canGoDown() && !gliding();

// The deep's own layers, unseen, for the ripple's sake (render/ripple.js,
// `warmRipple`): the ones that paint an image once or run the most code the
// first time. Not the motes, which are stepped as they are drawn.
const UNSEEN = LAYERS.filter(l => ['page', 'world', 'world:done'].includes(l.name) ||
                                  (DEEP.has(l.name) && l.name !== 'deep motes'));
function drawDeepUnseen() {
  asDeep(() => { for (const layer of UNSEEN) if (!layer.when || layer.when()) layer.draw(); });
}

// The rings: the leading one bright, three more following it in darker
// purples, each a ring of cells on the screen's own cell grid.
function drawRipples(rip) {
  const cell = P * S.zoom;
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  for (let n = 0; n < RIPPLE_RINGS; n++) {
    const r = rip.r - n * cell * RIPPLE_GAP;
    if (r <= 0) continue;
    ctx.fillStyle = MAGIC_TONES[Math.min(MAGIC_TONES.length - 1, n)];
    const steps = Math.max(12, Math.ceil(Math.PI * 2 * r / cell));
    for (let k = 0; k < steps; k++) {
      const a = k / steps * Math.PI * 2;
      ctx.fillRect(Math.round((rip.cx + Math.cos(a) * r) / cell) * cell,
                   Math.round((rip.cy + Math.sin(a) * r) / cell) * cell, cell, cell);
    }
  }
  ctx.restore();
  ctx.fillStyle = '#000';
}

// --- the party wave, track BOARD (docs/wave-party.md) -----------------------------
// Two things that stand in the deep rather than on a board, seated every frame
// after the picture, in whichever half is up: the open station's rails, laid
// into its board and filled, and the floating button over the next free floor
// slot. Page elements, not paint, and last, so the camera they are seated by
// is the one the frame was drawn with.
import { seatRails } from './deep/rails.js';
import { seatBuildButton } from './deep/buildbutton.js';
LAYERS.push({ name: 'rails', draw: seatRails }, { name: 'build button', draw: seatBuildButton });
