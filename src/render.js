// The painting order, and the loop that walks it.
//
// `LAYERS` is the picture back to front, one entry a layer; moving a layer is
// moving one line. An entry is `{ name, draw }` plus an optional `when` for a
// layer that is only in the picture some of the time, and an optional `dim`
// for one the crew switch fades or hides. Every draw lives in `src/render/`; this file
// draws nothing.

import { CREW_FADE, P, MAGIC_TONES, RIPPLE_RINGS, RIPPLE_GAP, GREY, AFTER_TONES } from './config.js';
import { crewView } from './prefs.js';
import { ctx, canvas, paintOn } from './render/ctx.js';
import { inkMode, onTheme } from './ink.js';
import { drawAir, drawAirNear } from './air.js';
import { drawBirds, drawClouds } from './weather.js';
import { held as heldState } from './reset.js';

import { drawApothecary, drawBrewSteam, drawPotLabels } from './render/apothecary.js';
import { drawBalloonPosts } from './render/balloon.js';
import { drawWorkBars } from './render/bars.js';
import { drawBuildSites, drawGrit, drawSilt } from './render/buildsites.js';
import { drawYardArrow, drawDeepArrow } from './render/shaftway.js';
import { drawPortal, drawDeepPortal } from './render/portal.js';
import { drawCasino, drawCasinoMark, drawPotPile, drawSparks } from './render/casino.js';
import { drawPaid, drawAbyss, drawRift, drawRockSand } from './render/cores.js';
import { drawKitStandCounts, drawRosterBadgeCounts, drawStockCounts } from './render/counts.js';
import { drawCount } from './render/counter.js';
import { drawBench, drawDroppedHats, drawBuried, drawIntro, drawKitStands,
         drawPointed, drawRosterBodies, drawSays, drawWorkers, drawForklifts, drawGarage, drawHeld, drawSightVeil, drawDeepSight, drawPlaceSight } from './render/crew.js';
import { drawCursor } from './render/cursor.js';
import { drawPadMark } from './render/padmark.js';
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
import { ripple, deepCamera, canGoDown, gliding, glidingBy } from './view.js';
import { drawThrough, warmRipple } from './render/ripple.js';
import { drawSerpent, drawSerpentDiving, drawSnatch, drawFreed, drawOrb, drawBarrier, drawFocusLines, drawMeal, drawMealUnder } from './render/serpent.js';
import { drawDeepZones, drawDeepFauna } from './render/fauna.js';
import { drawFightNumbers } from './render/fightnums.js';
import { drawStationStatuses, clearStatusTiles } from './render/statusicons.js';
import { drawSerpentBar, barShown } from './render/serpentbar.js';
import { drawCharge } from './render/charge.js';
import { drawFighters, drawShots } from './render/arms.js';
import { drawLevelUpBack, drawLevelUpFront } from './render/levelup.js';   // track RENDER, docs/wave-party.md
import { drawSinking, drawLifting, drawIntoCrusher } from './render/scales.js';
import { drawFireworks, drawHungKits, drawFinaleDeep, drawFinaleYard } from './render/finale.js';
import { drawHome } from './render/home.js';
import { drawActsYard, drawActsDeep, drawActsAfter, drawActsHell, drawActBodies, drawActCaption, drawActsGates } from './render/portals.js';
import { drawMansion } from './render/mansion.js';
import { drawRoadSky, roadUp } from './render/road.js';
import { drawAfterBackdrop, drawAfterGrove, drawAfterCamp, drawAfterMembers, drawAfterSky, drawAfterCounts, drawAfterRoster } from './render/after.js';
import { drawFrontLip } from './render/after/ground.js';
import { drawAfterCrowd, drawSkyCrowd } from './render/aftercrowd.js';
import { drawAfterCues } from './render/aftercues.js';
import { drawAfterCoins } from './render/aftercoins.js';
import { drawHellBackdrop, drawHellChambers, drawHellSeams, drawHellForge, drawHellBarriers, drawHellCage } from './render/hell.js';
import { S } from './state.js';
import { recede, frontLayers } from './cutscene.js';
import { ridingRoad, bandWorld } from './shot.js';
import { afterUnder } from './acts.js';
import { wash, setPass, backInk, byInk, hudInk, drawLetterbox } from './render/recede.js';

// The drawing side's public surface: the rest of the game imports every one of
// these from render.js and has no business knowing which file each is in.
export { canvas, ctx } from './render/ctx.js';
export { cell, drawCoin, drawMark } from './render/marks.js';
export { risingPlaces, rising, withRise } from './render/rise.js';
export { bar, barSpot, drawWorkBars } from './render/bars.js';
export { drawBuildSites, drawGrit } from './render/buildsites.js';
export { drawGrid, drawGroundLine, drawPit, drawPitOutline } from './render/ground.js';
export { drawDoneMarks, doneMarkAt, overDoneMark } from './render/donemarks.js';
export { drawCursor } from './render/cursor.js';
export { CAULDRON, CAULDRON_BREW_ROW, drawApothecary } from './render/apothecary.js';
export { drawMuck, drawPuffs, drawRain, drawRainBack, drawSmog } from './render/smog.js';
export { drawOuthouse, drawTower, drawTowerWaves } from './render/tower.js';
export { drawShack } from './render/shack.js';
export { drawFilter } from './render/filter.js';
export { casinoMarkAt, drawCasino, drawCasinoMark, drawPotPile, drawSparks } from './render/casino.js';
export { drawSky } from './render/sky.js';
export { drawPaid, drawAbyss, drawRift } from './render/cores.js';
export { drawCount } from './render/counter.js';
export { drawBelt, drawDrill, drawRam, drawRunSwitch, drawTiller } from './render/machines.js';
export { drawPileMarks, overPileMark, pileMarkAt } from './render/pilemarks.js';
export { drawSmoke } from './render/stations.js';
export { drawBridge, drawCut, drawFarm, drawFarmShed, drawQuarry, drawQuarryShed } from './render/sites.js';
export { drawBench, drawBody, drawCart, drawDroppedHats, drawHat, drawBuried, drawIntro, drawKitStands,
         drawPointed, drawSays, drawWorkers } from './render/crew.js';

// --- the painting order -------------------------------------------------------
//
// Back to front. `world` and `screen` are spaces, not pictures: what is drawn
// between `world` and its `world:done` is in the yard and zooms and shakes with
// it; what comes after `screen` is in screen pixels. The space is as much a
// part of the order as the depth, so both are in the list.
const ALL = ['yard', 'deep', 'after', 'hell'];
const YARD_DEEP = ['yard', 'deep'];
const ROAD = ['yard', 'after'];   // the road between them: drawn by both
const LAYERS = [
  { name: 'page', in: ALL, draw: clearPage },

  // The sky goes down first: clouds and birds are the far end of everything.
  { name: 'world', in: ALL, draw: enterSky },
  // The rain out of the far sheets goes down before the clouds, not after:
  // it is scenery and never lands (DESIGN.md, "The rain has depth too"), and
  // drawn over them a far drop crosses a cloud nearer than itself, which is
  // the one thing the depth is for. The sheet that does land is the `rain`
  // entry far below, in front of the yard, where the whole shower used to be.
  { name: 'rain behind', draw: drawRainBack },
  { name: 'clouds', draw: drawClouds },
  // The road up to heaven over the yard's own window: its clouds and the
  // cloud floor's underside, seen only by the rise riding up it (render/road.js).
  { name: 'road sky', draw: drawRoadSky },
  { name: 'birds', draw: drawBirds },
  { name: 'world:done', in: ALL, draw: leaveWorld },

  // The dust hangs in front of the clouds: it is weather in the yard, not
  // something on the horizon.
  { name: 'air', draw: drawAir },

  { name: 'world', in: ALL, draw: enterWorld },
  // The finale's sky (render/finale.js): the fireworks far off over the
  // walk, and the volley and the heart over the house. Behind the yard.
  { name: 'fireworks', draw: drawFireworks },
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

  { name: 'buried', draw: drawBuried },          // the one under the rock, which stands in front of her
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
  { name: 'pile marks', in: YARD_DEEP, draw: drawPileMarks },   // and a bar over anything that has stopped for a full one
  { name: 'auras', draw: drawAuras },            // the hold-a-body ring; offers fly flags, painted far earlier
  { name: 'build sites', in: YARD_DEEP, draw: drawBuildSites }, // fenced off, for as long as it is under way
  { name: 'grit', draw: drawGrit },              // and the chips off the hammer, in FRONT of the walls
  { name: 'rise landings', draw: stepRiseLandings }, // a puff and a knock, the frame a rising place lands
  { name: 'tower waves', draw: drawTowerWaves }, // the tower pouring, while it is making a hat
  { name: 'casino mark', draw: drawCasinoMark }, // and which way the last hand at the table went
  { name: 'kit stands', draw: drawKitStands },   // and the kit put out ready at each of them
  { name: 'garage', draw: drawGarage },           // where the forklifts go when there is nothing to fetch
  { name: 'home', draw: drawHome },               // the two of them's house at the left end, and its woodpile (render/home.js)
  { name: 'mansion', draw: drawMansion },         // and the mansion raised on its ground at the end (render/mansion.js)
  { name: 'acts-yard', draw: drawActsYard },      // heaven's cloud stair, bank and light, the rock on the ruin, the go-on card (render/portals.js)
  { name: 'dropped hats', draw: drawDroppedHats, dim: 1 },// and any that has been shaken off somebody
  // Act 3's afterlife (render/after.js), drawn only with the camera up there,
  // back to front: the page and the cloud floor, God's crowd filling the sky
  // with God over it (render/aftercrowd.js), the sky's clouds, the grove and
  // the camp, and the members walking and working over all of it, God's gaze
  // and his bubbles last.
  { name: 'after backdrop', in: 'after', draw: drawAfterBackdrop },
  { name: 'after heaven', in: 'after', draw: drawSkyCrowd },     // God's crowd filling the sky, God, the tithe line, the signs (render/aftercrowd.js)
  { name: 'after sky', in: 'after', draw: drawAfterSky },
  { name: 'after grove', in: 'after', draw: drawAfterGrove },
  { name: 'after camp', in: 'after', draw: drawAfterCamp },
  { name: 'after crowd', in: 'after', draw: drawAfterCrowd },
  { name: 'after sight', in: 'after', draw: drawPlaceSight },   // the right button held: the camp behind its members veiled, each ringed
  { name: 'after members', in: 'after', draw: drawAfterMembers },
  { name: 'after lip', in: 'after', draw: drawFrontLip },       // the billows along the path's front, over the members' feet (render/after/ground.js)
  { name: 'after roster', in: 'after', draw: drawAfterRoster },   // who is on each job, under its station, on the yard's roster
  { name: 'after coins', in: 'after', draw: drawAfterCoins },  // the yard's coins out of the thin patch to the station bought (render/aftercoins.js)
  { name: 'after cues', in: 'after', draw: drawAfterCues },     // the hand work's ghost hands, gauges and crit marks (render/aftercues.js)
  // The acts' connective tissue up there (render/portals.js): heaven's tear in
  // the cloud floor, and the souls and ghosts walking the road.
  { name: 'acts-after', in: 'after', draw: drawActsAfter },
  { name: 'acts-after-bodies', in: 'after', draw: () => drawActBodies('after') },
  // Act 4's hell (render/hell.js), the same: drawn only with the camera down there.
  { name: 'hell backdrop', in: 'hell', draw: drawHellBackdrop },
  { name: 'hell chambers', in: 'hell', draw: drawHellChambers },
  { name: 'hell seams', in: 'hell', draw: drawHellSeams },
  { name: 'hell forge', in: 'hell', draw: drawHellForge },
  { name: 'hell barriers', in: 'hell', draw: drawHellBarriers },
  { name: 'hell cage', in: 'hell', draw: drawHellCage },
  { name: 'acts-hell', in: 'hell', draw: drawActsHell },
  { name: 'acts-hell-bodies', in: 'hell', draw: () => drawActBodies('hell') },
  // The deep (render/deep.js), back to front, drawn only while the camera is
  // down there: the roof and the underside of the surface, the water, the
  // floor, the scales lying on it and its stations, then the serpent and
  // everything in the water with it. Before the roster, so a deep station's
  // post stands on the deep's floor like any other.
  // The zones' tint first: the water's field leaves its dark cells unpainted,
  // so the tint shows through them and the field's lit cells lie over it.
  { name: 'deep zones', in: 'deep', draw: drawDeepZones },
  { name: 'deep water', in: 'deep', draw: drawDeepWater },
  { name: 'deep motes', in: 'deep', draw: drawDeepMotes },
  // The zones' creatures, in the world in front of the far stream and behind
  // the portal, the stations, the serpent and the bar, so nothing fought or
  // read is ever under one.
  { name: 'deep fauna', in: 'deep', draw: drawDeepFauna },
  { name: 'deep portal', in: 'deep', draw: drawDeepPortal }, // the way up, hanging in the water behind it all
  { name: 'focus lines', in: 'deep', draw: drawFocusLines },  // the serpent on the brink: rays in the water, behind the floor and all on it
  { name: 'deep floor', in: 'deep', draw: drawDeepFloor },
  { name: 'acts-deep', in: 'deep', draw: drawActsDeep },      // hell's white-hot slit in the floor (render/portals.js)
  { name: 'serpent diving', in: 'deep', draw: drawSerpentDiving },   // the first break's dive, behind the stations and the bed
  // The scales, then the stations standing in front of them: the bed can
  // heap forty cells deep, and a station buried in its own coin could not
  // be found to be paid at.
  { name: 'deep bed', in: 'deep', draw: drawDeepBed },
  { name: 'into crusher', draw: drawIntoCrusher }, // behind the furnace, dropping into its funnel
  { name: 'deep stations', in: 'deep', draw: drawDeepStations },
  { name: 'hung kit', in: 'deep', draw: drawHungKits },  // a station's gear hung up on it, with nobody wearing it
  { name: 'meal gulped', in: 'deep', draw: drawMealUnder },   // the meal's orb going into the jaws, behind the head
  { name: 'serpent', in: 'deep', draw: drawSerpent },
  { name: 'barrier', in: 'deep', draw: drawBarrier },  // the explosive resist, floating under the coil
  { name: 'meal', in: 'deep', draw: drawMeal },   // the meal's bolts and its orb with the creature in it, in front of the serpent
  { name: 'deep sight', in: 'deep', draw: drawDeepSight },   // the right button held: the deep behind its crew veiled, each ringed
  { name: 'swimmers', in: 'deep', draw: drawSwimmers },
  // The fighters in front of the coil they strike and the swimmers passing,
  // and what leaves them -- arrows, beams, charges, hexes, notes -- over all
  // of the fighters (track RENDER, docs/wave-party.md).
  { name: 'level-up back', in: 'deep', draw: drawLevelUpBack },   // the blaze's turns behind the fighter
  { name: 'charge', in: 'deep', draw: drawCharge },   // her speed lines in the first trip down, behind her
  { name: 'party', in: 'deep', draw: drawFighters },
  { name: 'freed', in: 'deep', draw: drawFreed },   // him out of the serpent, walking to her
  { name: 'finale deep', in: 'deep', draw: drawFinaleDeep },  // and the two of them after, her gear coming off, the way up
  { name: 'acts-deep-bodies', in: 'deep', draw: () => drawActBodies('deep') },   // the ghosts on the road down
  { name: 'orb', in: 'deep', draw: drawOrb },       // the constrict's bolts and orb round a fighter
  { name: 'level-up front', in: 'deep', draw: drawLevelUpFront },
  { name: 'shots', in: 'deep', draw: drawShots },
  { name: 'sinking', in: 'deep', draw: drawSinking },        // the scales still in the water, in front of it all
  { name: 'lifting', in: 'deep', draw: drawLifting },
  { name: 'deep arrow', in: 'deep', draw: drawDeepArrow },   // the way up, under the deep's end of the portal
  { name: 'silt', in: 'deep', draw: drawSilt },              // off a builder's blows down there, in the water with the rest
  // What a station is putting up and what it has finished hang over it in
  // front of the deep's domes as well as the yard's roofs: behind them, the
  // stack over a station on the deep's floor was inside its own dome.
  { name: 'work bars', in: YARD_DEEP, draw: drawWorkBars },     // and whatever else the yard is putting up
  { name: 'done marks', in: YARD_DEEP, draw: drawDoneMarks },   // a tick over any station that finished something
  { name: 'sight veil', draw: drawSightVeil },   // the right button held: the yard behind the crew veiled pale
  { name: 'roster', in: YARD_DEEP, draw: drawRosterBodies },    // who is working here, under the place they work
  { name: 'intro', draw: drawIntro },            // the two of them, or whoever is under the rock
  { name: 'forklifts', draw: drawForklifts },   // behind the crew, who walk in front of the machines
  { name: 'workers', draw: drawWorkers, dim: 1 },
  { name: 'brew steam', draw: drawBrewSteam },   // off the pots, on the crew's plane: in front of the buildings
  { name: 'says', in: YARD_DEEP, draw: drawSays, dim: 1 },      // and what any of them stood about is saying
  { name: 'finale', draw: drawFinaleYard },      // the two of them, down the yard and at its end for good
  { name: 'acts-bodies', draw: () => drawActBodies('yard') },   // the souls and ghosts on the road, the mansion's gathering (render/portals.js)
  { name: 'acts-road-bodies', in: ROAD, draw: () => drawActBodies('road') },   // and the two of them up the road between the yard and the cloud floor
  { name: 'acts-gates', draw: drawActsGates },   // heaven's gates over them, so they go in behind the posts and the crest (render/gates.js)
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
  { name: 'held', in: ALL, draw: drawHeld, dim: 1 },      // the body in your hand, in front of all of it
  { name: 'pointed', in: YARD_DEEP, draw: drawPointed },        // and an arrow over whoever you just asked for by name
  { name: 'cursor', in: ALL, draw: drawCursor },
  // A scene holding the yard: everything so far washed back toward the page,
  // and the layers the scene is about painted over it at full ink
  // (render/recede.js). Before the deep is turned over, so its background
  // settles toward the liquid as the yard's does toward the page.
  { name: 'recede', in: ALL, draw: wash },
  // Last in the world, over everything the deep drew: the negative of it.
  { name: 'deep invert', in: 'deep', draw: drawDeepInvert },
  // What the blows did and what the heal took back, over the finished deep
  // and not turned over with it: their tones are written as seen, so each
  // fades against the picture actually behind it, whichever way the deep was
  // turned (render/fightnums.js). Still in the world, for the deep's camera.
  { name: 'fight numbers', in: 'deep', draw: drawFightNumbers },
  { name: 'status posts', in: 'deep', draw: drawStationStatuses },   // and what is on each fighter, up a post at its station
  // A pad's focus (render/padmark.js): over every body and mark it can stand
  // on, in both halves, and after the deep is turned so its purple is the
  // purple seen.
  { name: 'pad focus', in: YARD_DEEP, draw: drawPadMark },
  { name: 'world:done', in: ALL, draw: leaveWorld },

  { name: 'air near', draw: drawAirNear },       // the nearest dust passes in front of the yard, not behind it

  // The roster's counts are in screen pixels so the digits stay sharp, but
  // moved with the yard rather than pinned to the window: the number belongs
  // to the badge beside it, shake and all.
  { name: 'screen', in: ALL, draw: enterScreen },
  { name: 'roster counts', in: ALL, draw: drawRosterBadgeCounts },
  { name: 'kit counts', in: ALL, draw: drawKitStandCounts },   // and how many are waiting on each stand
  { name: 'stock count', in: ALL, draw: drawStockCounts },     // and how many doses stand ready on the apothecary table
  { name: 'after counts', in: ALL, draw: drawAfterCounts },    // and how much lies on each of the afterlife's piles
  { name: 'pot labels', in: ALL, draw: drawPotLabels },        // the brew each pot is set to, as a color block under it

  { name: 'counter', in: ALL, draw: drawCount },          // last, and in screen pixels: it is read, not looked at
  { name: 'serpent bar', in: ALL, draw: drawSerpentBar, when: barShown },  // and in the deep, what the defense up has left
  // The scene's bands, over everything that is read: they step in over the
  // counter rather than it vanishing under them.
  { name: 'letterbox', in: ALL, draw: drawLetterbox },
  { name: 'acts-caption', in: ALL, draw: drawActCaption },  // an act beat's placeholder line, in the band (render/portals.js)

  // A strike's instant, a dark pane over the finished frame. In screen pixels
  // it would be shared with the deep, which is under water and has no sky.
  { name: 'flash', in: ALL, draw: drawFlash, when: () => S.view === 'yard' },

  { name: 'press', in: ALL, draw: pressFrame },           // and then the filter, over the finished frame
];

export { LAYERS };

// The deep's fish are bystanders to every scene: they fade out with the
// haulers while one holds.
const FISH = new Set(['deep fauna', 'meal gulped', 'meal']);
// The layers after the wash that are still the yard's background: drawn at
// the receded share of their ink rather than washed.
const AFTER_WASH = new Set(['fight numbers', 'status posts', 'air near', 'pot labels']);
// The yard's reading, which is in no scene: faded right out while one holds,
// on the recede's own number (render/recede.js, `hudInk`).
const HUD = new Set(['pile marks', 'roster', 'after roster', 'roster counts', 'kit counts', 'stock count', 'after counts', 'counter']);
// Bodies of either kind in one layer: drawn behind the wash and again over
// it, each body sorted by `bodyInk`.
const MIXED = new Set(['workers', 'says', 'swimmers', 'party']);

// The landing page's picture (main.js, `demo`) is the yard to be looked at
// and not read: the layers a player reads off the picture are left out of it.
const READING = new Set(['pad focus', 'offer flags', 'paid', 'pile marks', 'auras', 'work bars', 'done marks',
                         'casino mark', 'roster', 'after roster', 'pointed', 'cursor', 'roster counts', 'kit counts',
                         'stock count', 'after counts', 'pot labels', 'counter', 'fight numbers', 'status posts', 'serpent bar']);
let picture = false;            // page: the landing page draws the yard as a picture
export const asPicture = on => { picture = on; };

// Which places a layer draws in is its `in` (see LAYERS): a name, or a list
// of names, from the places there are -- 'yard', 'deep', 'after', 'hell' -- and
// the yard when it says nothing. Each act's layers are tagged with their own
// place and nothing else; the layers the yard and the deep share carry both,
// and the ones pinned to the window or in screen pixels (`PINNED`, and
// everything after 'screen') carry all four. A glide draws whichever half the
// camera is in at that moment (view.js moves it at the black).
const SCREEN_FROM = LAYERS.findIndex(l => l.name === 'screen');
const drawsIn = (layer, place) => (layer.in || 'yard') === place || (Array.isArray(layer.in) && layer.in.includes(place));
// A layer both the yard and the deep draw stands over something in the world
// and is cut to its own half (`PINNED` ones are not).
const shared = layer => drawsIn(layer, 'yard') && drawsIn(layer, 'deep');
const actPlace = place => place === 'after' || place === 'hell';
const inHalf = drawsIn;

// Of the shared layers, the ones pinned to the window rather than standing
// over something in the world: the spaces, the pointer, the counter and the
// frame's own finish. Every other shared layer is cut at the shaft's middle
// (frame.js, `clipToHalf`), so what it draws over the yard never shows in the
// deep and the other way about -- "off the glass in the other half" does not
// hold on a window taller than the deep.
// The body in your hand goes where the pointer goes, so it is the pointer's.
const PINNED = new Set(['page', 'world', 'world:done', 'screen', 'recede', 'held', 'cursor', 'counter', 'serpent bar',
                        'flash', 'press']);
const halfLine = () => (S.worldH + deepTop()) / 2;

// One half, every layer that belongs to it, with whatever camera is standing.
// While a scene holds the yard the layers it is about are held back from the
// first pass and painted after the wash (`recede`), in their own order.
// `from` and `to` take a stretch of the list (the world, or the glass), and
// `skip` names layers left for later.
function drawHalf(place, from = 0, to = LAYERS.length, skip = null) {
  const held = recede() > 0;
  const front = held ? frontLayers() : null;
  const later = [];
  for (let i = from; i < to; i++) {
    const layer = LAYERS[i];
    if (skip && skip.has(layer.name)) continue;
    if (!inHalf(layer, place)) continue;
    if (picture && READING.has(layer.name)) continue;
    if (layer.when && !layer.when()) continue;
    if (held && (front.has(layer.name) || MIXED.has(layer.name))) later.push(i);
    if (held && front.has(layer.name)) continue;
    if (held && layer.name === 'recede') {
      drawLayer(layer, i, place);
      setPass('front');
      for (const j of later) drawLayer(LAYERS[j], j, place);
      setPass('back');
      continue;
    }
    const ink = !held ? 1 : FISH.has(layer.name) ? byInk() : HUD.has(layer.name) ? hudInk()
              : AFTER_WASH.has(layer.name) ? backInk() : 1;
    if (ink <= 0) continue;
    if (ink < 1) ctx.globalAlpha = ink;
    drawLayer(layer, i, place);
    if (ink < 1) ctx.globalAlpha = 1;
  }
}

// The dark page's map a layer is drawn in (ink.js): the deep's whole half in
// the deep's own, act 3's own layers in its own spread, and the rest turned
// over between the dark page's paper and ink. On the light page every map is
// the identity.
const mapOf = (layer, place) => place === 'deep' ? 'deep' : READING.has(layer.name) ? 'line' : layer.in === 'after' ? 'after' : 'yard';

function drawLayer(layer, i, place) {
  // A `dim` layer is the crew's own plane, and the corner's crew switch
  // takes ink out of it, or takes it out of the picture, so the buildings
  // behind a late yard's crowd can be read (prefs.js, `crewView`). Only the
  // picture: the bodies still walk and work where nobody is drawing them.
  // The alpha is put back the same frame: nothing else is ever drawn faint.
  const view = layer.dim ? crewView() : 'show';
  if (view === 'hide') return;
  inkMode(mapOf(layer, place));
  const faint = view === 'fade';
  // Cut at the shaft's middle in the yard and the deep; an act's place draws
  // none of the layers the cut is for (`inHalf`).
  const cut = shared(layer) && !PINNED.has(layer.name) && !actPlace(place);
  if (cut) clipToHalf(place === 'deep', halfLine());
  const was = ctx.globalAlpha;
  if (faint) ctx.globalAlpha = was * CREW_FADE;
  layer.draw();
  inkMode('yard');   // and back, so whatever draws between frames (a sheet's pictures) is in the yard's
  if (cut) ctx.restore();
  if (faint) ctx.globalAlpha = was;
}

// The half on screen, and in a glide the deep through the ripple out of the
// portal (view.js, `ripple`): drawn a second time with the deep's own
// camera, through the leading ring (render/ripple.js), so neither half's
// camera moves while the other shows through; then the rings themselves over
// both. With no glide, the ripple is readied while the page is idle -- not on
// the landing page's picture, which never goes down.
//
// The far place is not drawn a frame at a time: it is painted once, on the
// glide's first frame, with its own camera onto a sheet the window's size,
// and the ring shows that frozen picture (the owner's portals review,
// 2026-10-17): one pass of the layers a frame, whichever two places the
// ripple joins (view.js, `ripple`: the deep or an act's place).
//
// The frame is drawn in two stretches of the list. The world, at the drawn
// zoom (`S.zoom`, always a whole cell): straight onto the glass when that is
// the zoom on the glass, else onto one sheet scaled up sharp onto the glass
// (`scaledWorld`). Then the glass -- the counts, the counter, the bands --
// in screen pixels at the zoom on the glass, so whatever stands over a thing
// in the world stands over it as shown. The bands and the beat's line go on
// last of all, over the ripple too: a scene's letterbox is up for the whole
// hold, the way through a portal included. The flash and the press stay over
// the bands, as they were.
const GLASS = new Set(['letterbox', 'acts-caption', 'flash', 'press']);
export function draw() {
  clearStatusTiles();
  if (Math.abs(S.zoomShow - S.zoom) > 1e-9) scaledWorld(drawWorld);
  else drawWorld();
  onGlass(() => drawHalf(S.view, SCREEN_FROM, LAYERS.length, GLASS));
  const rip = ripple();
  if (!rip) { if (!picture) warmRipple(canWarm, drawDeepUnseen); }
  else if (rip.r > 0) {
    const far = farPicture(rip);
    const d = S.dpr;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(rip.cx * d, rip.cy * d, rip.r * d, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(far, 0, 0);
    ctx.restore();
    drawRipples(rip);
  }
  onGlass(() => {
    for (let i = SCREEN_FROM; i < LAYERS.length; i++) {
      const layer = LAYERS[i];
      if (GLASS.has(layer.name) && (!layer.when || layer.when())) drawLayer(layer, i, S.view);
    }
  });
}

// The world in the window. While the rise rides up the road (actbeats.js)
// the window climbs out of the yard and into the afterlife with no ripple
// between, so which of the two it shows is read off where it stands, not off
// the place it is in: under the cloud floor's underside the yard (its sky,
// the road's clouds and the underside with it), over it the afterlife, and
// both while what shows between the bands straddles that line -- the yard
// first, then the afterlife cut off at the line over it. Every other frame
// is the place on screen alone.
const NO_PAGE = new Set(['page']);
function drawWorld() {
  if (!ridingRoad() || !roadUp() || (S.view !== 'yard' && S.view !== 'after')) { drawHalf(S.view, 0, SCREEN_FROM); return; }
  const line = afterUnder(), band = bandWorld() * S.hush;
  const top = S.camY + band, bottom = S.camY + S.viewH - band;
  if (bottom <= line) { asView('after', () => drawHalf('after', 0, SCREEN_FROM)); return; }
  asView('yard', () => drawHalf('yard', 0, SCREEN_FROM));
  if (top >= line) return;
  asView('after', () => {
    clipToHalf(false, line);
    try { drawHalf('after', 0, SCREEN_FROM, NO_PAGE); } finally { ctx.restore(); }
  });
}
// `S.view` read as `place` for the length of `fn`, the camera left as it is.
function asView(place, fn) {
  const was = S.view;
  S.view = place;
  try { fn(); } finally { S.view = was; }
}

// The glass's layers read `S.zoom` to stand a thing over the world: for their
// length it is the zoom on the glass.
function onGlass(fn) {
  const drawn = S.zoom;
  S.zoom = S.zoomShow;
  try { fn(); } finally { S.zoom = drawn; }
}

// A zoom on its way between two whole sizes (DESIGN.md, "Zooming is
// smooth"): the world drawn at the whole size at or under it onto one sheet
// the glass's size, and the corner of it the window shows scaled up onto the
// glass in one nearest-neighbor blit. Nothing is drawn at a fractional size,
// so no seam opens between two cells; the moment the zoom lands this is
// skipped and the frame is drawn straight, pin sharp.
let sheet = null;               // cache: a scratch canvas, sized to the glass on every use
function scaledWorld(fn) {
  if (!sheet) sheet = document.createElement('canvas');
  if (sheet.width !== canvas.width || sheet.height !== canvas.height) {
    sheet.width = canvas.width;
    sheet.height = canvas.height;
  }
  // Pinned off on every use: a resized sheet's context has it back on, and a
  // pattern laid at a scale is filtered into a grey fringe.
  sheet.getContext('2d').imageSmoothingEnabled = false;
  paintOn(sheet, fn);
  const k = S.zoomShow / S.zoom;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, 0, 0, sheet.width / k, sheet.height / k, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

// The far place's picture for glide `rip.no`, painted once. The yard's knock
// is the yard's (world.js, `stepShake`): the far place is drawn still.
let frozen = null;              // held: the far place painted for glide `no`; the glide count is no key across yards
heldState('render-frozen', () => { frozen = null; });
onTheme(() => { frozen = null; });   // and painted in the page's inks
function farPicture(rip) {
  const c = frozen ? frozen.c : document.createElement('canvas');
  if (frozen && frozen.no === rip.no && c.width === canvas.width && c.height === canvas.height) return c;
  c.width = canvas.width;
  c.height = canvas.height;
  paintOn(c, () => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#000';
    asPlace(rip.inner, rip.cam, () => drawHalf(rip.inner, 0, LAYERS.length, GLASS));
    ctx.restore();
  });
  frozen = { no: rip.no, c };
  return c;
}

// A place's camera standing for the length of `fn`, and the one on screen put back.
function asPlace(place, cam, fn) {
  const keep = { view: S.view, camX: S.camX, camY: S.camY, zoom: S.zoom, zoomShow: S.zoomShow, viewW: S.viewW, viewH: S.viewH,
                 shakeX: S.shakeX, shakeY: S.shakeY };
  Object.assign(S, cam, { zoomShow: cam.zoom, view: place, shakeX: 0, shakeY: 0 });
  try { fn(); } finally { Object.assign(S, keep); }
}

// The deep's camera standing for the length of `fn`, and the yard's put back.
function asDeep(fn) {
  const keep = { view: S.view, camX: S.camX, camY: S.camY, zoom: S.zoom, zoomShow: S.zoomShow, viewW: S.viewW, viewH: S.viewH,
                 shakeX: S.shakeX, shakeY: S.shakeY };
  const cam = deepCamera();
  Object.assign(S, cam, { zoomShow: cam.zoom, view: 'deep', shakeX: 0, shakeY: 0 });
  try { fn(); } finally { Object.assign(S, keep); }
}

// The ripple can be readied while the yard is on screen with the way down
// open and nothing under way.
const canWarm = () => S.view === 'yard' && canGoDown() && !gliding();

// The deep's own layers, unseen, for the ripple's sake (render/ripple.js,
// `warmRipple`): the ones that paint an image once or run the most code the
// first time. Not the motes, which are stepped as they are drawn.
const UNSEEN = LAYERS.filter(l => ['page', 'world', 'world:done'].includes(l.name) ||
                                  (l.in === 'deep' && l.name !== 'deep motes'));
function drawDeepUnseen() {
  asDeep(() => { for (const layer of UNSEEN) if (!layer.when || layer.when()) layer.draw(); });
}

// The rings: the leading one bright, three more following it in darker
// purples, each a ring of cells on the screen's own cell grid.
// Through heaven's gates the rings are act 3's own four tones, ink leading, as
// the gates are (render/gates.js); every other way's are the magic purples.
const HEAVEN_RINGS = [AFTER_TONES.ink, AFTER_TONES.mid, AFTER_TONES.mid, AFTER_TONES.pale].map(i => GREY[i]);
function drawRipples(rip) {
  const tones = glidingBy() === 'heaven' ? HEAVEN_RINGS : MAGIC_TONES;
  const cell = P * S.zoom;
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  for (let n = 0; n < RIPPLE_RINGS; n++) {
    const r = rip.r - n * cell * RIPPLE_GAP;
    if (r <= 0) continue;
    ctx.fillStyle = tones[Math.min(tones.length - 1, n)];
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
//
// Both are seated in every place, not only the deep: each decides for itself
// whether it shows, and the one place it must hear that it does not is
// whichever place is up when it should fade out. A layer naming no place
// draws in the yard alone, which kept the button from ever showing in the
// deep it is for.
import { seatRails } from './deep/rails.js';
import { seatBuildButton } from './deep/buildbutton.js';
LAYERS.push({ name: 'rails', in: ALL, draw: seatRails }, { name: 'build button', in: ALL, draw: seatBuildButton });
