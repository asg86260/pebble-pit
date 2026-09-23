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

import { S } from './state.js';
import { JOB, TYPE } from './jobs.js';
import { PROP_FROM, NET_COST, ARCH_COST, DOME_BILL, DOME_WORK, DOME_RINGS, DOME_FADE_MS, LADDER, TIER_OWN, MACHINE_TUNE_RUNGS, LAND_HOP_MS, INTRO_CHAT_MS } from './config.js';
import { dropMs } from './rock.js';
import { now } from './clock.js';
import { COIL_SEGS } from './config.js';
import { mouthX, spotX, coilAt, bellySeg } from './deep/place.js';
import { goDeep } from './view.js';

// The parts, in the order the sheet reads them.
export const ABOUT = [
  'the story', 'the rock', 'the crew', 'the bench', 'the cut', 'the plots',
  'the apothecary', 'the kit', 'the house and the sky', 'the tower',
  'the casino', 'the pit and the rift', 'the shields', 'the endgame', 'the deep'
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
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999, cores: 9, dust: RICH_DUST });
};

const sphereAt = secs => {
  rich();
  window.__crew(0, 8, 0, 0, 0, 3);
  window.__levels({ wizSpeedLevel: 5, wizPowerLevel: 5 });
  window.__fast(20);
  window.__meteor();
  window.__buy('sphere');
  window.__fast(secs);
  const pin = () => { window.__look(st().towerX - 420); requestAnimationFrame(pin); }; pin();
};

// The lip bought out, which is what the belt is gated behind; `__fullSites`
// does the same for the other stations, but carrying has no site to fill.
const lip = () => {
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  window.__kit({ carters: 6 });
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
// The second half (docs/wave-serpent.md). Every scene stands the real deep up:
// the snatch played through, the fight set at a stage, the doors and hands
// asked for, and then the yard's clock run until the bodies have swum to their
// work and the weapons are in the water. Nothing is drawn that the game did
// not put there.

// A yard the serpent has come for: every site built, the snatch behind it, the
// fight at `stage`, scales on the floor, the hands asked for, and the view.
function deepYard({ stage = 0, wound = 0, open = [], crew = {}, scales = 400, loose = 0, view = 'deep', run = 20 } = {}) {
  rich();
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
  for (const k of open) S[k + 'Open'] = true;
  window.__deepCrew({ brawlers: 1, ...crew });
  window.__scales(scales);
  if (loose) window.__looseScales(loose);
  window.__serpent({ stage, wound });
  window.__view(view);
  // Long enough to swim from the station to the coil. The hands may break
  // the defense on the way, so the fight is set again once they are at it.
  window.__fast(run);
  window.__serpent({ stage, wound });
}

const lookDeep = x => window.__look(x - S.viewW / 2);
const beltSeg = f => Math.round(f * (COIL_SEGS - 1));

// The sqwife at the coil, a stage's look on the serpent.
const stageScene = (stage, wound, open, crew = {}) => () => {
  deepYard({ stage, wound, open, crew });
  lookDeep(coilAt(bellySeg() - 4, now()).x);
};

// The snatch as it plays: both facts true, and the clock run until the beat
// reaches the phase named. The shot tool runs a second more after a scene,
// and the take is shorter than that, so the scene stops at the start of the
// phase before the one to be seen.
const snatchAt = phase => () => {
  rich();
  window.__fullSites();
  window.__snatch();
  for (let i = 0; i < 60 * 60 && S.snatch?.phase !== phase; i++) window.__fast(1 / 60);
};

const deepScenes = {
  snatch: { about: 'the deep', say: 'the snatch: the serpent up out of the abyss at the shaft, him in its jaws',
    run: snatchAt('rise') },
  'snatch-take': { about: 'the deep', say: 'the snatch: the serpent going back under with him',
    run: snatchAt('take') },
  // A fresh deep: the altar, the bed barely begun, the sqwife at the coil.
  deep: { about: 'the deep', say: 'the deep, fresh: the sqwife at the coil, him in its belly', run: stageScene(0, 20, []) },
  'deep-wound': { about: 'the deep', say: 'the bare coil with the wound held most of the way open',
    run: stageScene(0, 52, []) },
  'deep-warded': { about: 'the deep', say: 'the second defense: the ward shimmering over the scales, lances in it',
    run: stageScene(1, 300, ['well'], { lancers: 3 }) },
  'deep-split': { about: 'the deep', say: 'the third defense: the coil in lengths, grenades bursting, sigils drawn',
    run: stageScene(2, 1500, ['well', 'font', 'circle'], { grenadiers: 2, scribes: 2 }) },
  'deep-fading': { about: 'the deep', say: 'the fourth defense: the coil faded but where a beam lights it',
    run: stageScene(3, 8000, ['well', 'font', 'circle', 'spire'], { warlocks: 2 }) },
  'deep-arms': { about: 'the deep', say: 'every weapon at work: fists, lances, grenades, sigils, beams, the star',
    run: () => {
      deepYard({ stage: 1, wound: 450, open: ['well', 'font', 'circle', 'spire', 'star'],
                 crew: { brawlers: 2, lancers: 2, grenadiers: 2, scribes: 1, warlocks: 1 }, run: 30 });
      // The star called now, so it is on its way down in the shot.
      S.starAt = 0;
      window.__fast(1.5);
      lookDeep(coilAt(beltSeg(0.5), now()).x);
    } },
  // The crusher at the deep's left end, haulers lent down to it carrying the
  // floor's scales and tossing them over the lip.
  crusher: { about: 'the deep', say: 'the crusher: gatherers tossing scales into the hopper, the rollers turning',
    run: () => {
      deepYard({ crew: { brawlers: 2 }, loose: 900, run: 12 });
      lookDeep(spotX('crusher') + S.viewW * 0.3);
    } },
  // The floor thick with scales and the gatherers at work on it.
  gathering: { about: 'the deep', say: 'gatherers scooping the floor\'s loose scales, loads overhead',
    run: () => {
      deepYard({ crew: { brawlers: 2 }, loose: 2500, run: 6 });
      lookDeep(spotX('altar'));
    } },
  // The pods at the deep's far end, a stack of them, some of their people home.
  pods: { about: 'the deep', say: "the pods: the deep's houses, stacked at its far end",
    run: () => {
      deepYard({ open: ['well', 'font', 'circle', 'spire'], run: 2 });
      for (let i = 0; i < 7; i++) { window.__scales(99999); window.__buy('pod'); window.__finish(); }
      window.__fast(4);
      lookDeep(spotX('pods') - S.viewW * 0.2);
    } },
  // Every station on the floor at once, the camera on the middle of them.
  'deep-all': { about: 'the deep', say: 'the whole deep, every station standing',
    run: () => {
      deepYard({ stage: 1, wound: 300, open: ['well', 'font', 'circle', 'spire'],
                 crew: { brawlers: 1, lancers: 1, grenadiers: 1, scribes: 1, warlocks: 1 } });
      lookDeep(spotX('font'));
    } },
  // The fourth break: the belly open and him coming out of it.
  'deep-freed': { about: 'the deep', say: 'the fourth break: the belly open and him swimming out',
    run: () => {
      deepYard({ stage: 3, open: ['well', 'font', 'circle', 'spire'] });
      window.__serpent({ stage: 4 });
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
    } }
};

export const SCENES = {
  // --- the story --------------------------------------------------------------
  opening: { about: 'the story', say: 'the intro, from the top',
    run: () => window.__reset(true) },
  leaving: { about: 'the story', say: 'the opening, the pair walking out of the house',
    run: () => window.__reset(true) },
  reunion: { about: 'the story', say: 'the first rock mined out, and somebody comes over',
    run: () => { window.__reset(); window.__crew(1, 0); window.__give(50); window.__next(); } },
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
  // The clearance between the hut's wall and a parked ram at a big boulder is
  // the one thing about this layout arithmetic cannot settle.
  shack: { about: 'the rock', say: 'the shack beside a big rock, the ram parked',
    run: () => { rich(); window.__kit({ breakers: 3 }); window.__shack(); window.__buy('ram');
                 window.__finish(); window.__jump(8); window.__fast(6); window.__look(st().shackX - 400); } },
  // Both ends of the rock's growth: the walk leaves the hut exactly the room
  // `rockSize` needs and no more. Jumped and then run, because `rich` leaves
  // the first rock still falling and nine cores tearing the rift.
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
  apron: { about: 'the rock', say: 'the bare strip in front of the hill',
    run: () => { rich(); window.__jump(4);
                 const x = st().rockLeftX;
                 for (let d = -260; d < 260; d += 12) window.__pile(x + d, 60);
                 window.__fast(4); window.__look(st().rockLeftX - 340); } },
  // The core is the one thing drawn from a snapped middle rather than a
  // corner, so it is where being half a cell out shows. Centered on the core
  // itself: at the zoom this wants, a landmark near it is off the crop.
  core: { about: 'the rock', say: 'a core, and the glow around it',
    run: () => { rich(); window.__drop(); window.__fast(3);
                 const c = st().coreItem || { x: st().coreHome.x };
                 window.__look(c.x - window.innerWidth / 2); } },
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
  crew: { about: 'the crew', say: 'the crew, hats and all',
    run: () => { window.__reset(); window.__crew(3, 2, 2, 2);
                 window.__kit({ breakers: 3, blasters: 2, growers: 2, carters: 2 });
                 window.__loo(); window.__assign(JOB.JANITOR, 1); window.__fast(20);
                 window.__look(st().rockLeftX - 420); } },
  // Twenty-one rooms is three full courses and part of a fourth, so both the
  // square sides and the unfinished top show in one shot.
  house: { about: 'the crew', say: 'the house, several storeys up',
    run: () => { window.__reset(); window.__crew(6, 5, 5, 4); window.__fast(2);
                 window.__look(st().houses.door - 400); } },
  // Hovered for real, since the mark comes off `pointermove` in pointer.js.
  // In a frame, not now: the runner turns a second of clock after a scene and
  // the hold is only nine hundred milliseconds, so a hover sent from here
  // would have lapsed by the shot.
  asking: { about: 'the crew', say: 'a body hovered, saying its question mark', page: true,
    run: () => { window.__reset(); window.__crew(3, 2, 2, 2);
                 window.__kit({ breakers: 3, blasters: 2, growers: 2, carters: 2 });
                 window.__fast(20);
                 requestAnimationFrame(() => {
                   const d = st().crewDetail[0].split('|');
                   const wx = Number(d[2]), wy = Number(d[7].slice(1));
                   window.__look(wx - 400 / st().zoom);
                   hover(wx, wy);
                 }); } },
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
  // `page`: the camera reads `houses` off the page's snapshot, which the node
  // yard's has not got.
  houseboard: { about: 'the crew', say: "the crew's board", page: true,
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
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, cores: 9, dust: 5000 });
                 window.__fast(2); window.__look(4930); } },
  // The mast slides out over FLAG_RAISE_MS and the cloth runs up it over
  // FLAG_HOIST_MS. The grant has to land after the runner's own second of
  // clock, or the raise is long over by the shot; the draw reads its own
  // clock, so the fraction is exactly the seconds asked for here.
  flagraise: { about: 'the bench', say: 'the flag halfway through its raise', page: true,
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__fast(2); window.__look(4930);
                 requestAnimationFrame(() => {
                   window.__grant({ sparks: 9999, shards: 9999, spores: 9999, cores: 9, dust: 5000 });
                   window.__fast(0.3);
                 }); } },
  flaghoist: { about: 'the bench', say: 'the flag halfway up its mast', page: true,
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__fast(2); window.__look(4930);
                 requestAnimationFrame(() => {
                   window.__grant({ sparks: 9999, shards: 9999, spores: 9999, cores: 9, dust: 5000 });
                   window.__fast(0.95);
                 }); } },
  // Nothing else frames both sheds, and the whole question about a shack is
  // whether it reads as a different building from the other one.
  shacks: { about: 'the bench', say: "the cut's shed and the field's, side by side",
    run: () => { rich(); window.__look(st().farmShed.x - 60); } },
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
                 window.__grant({ dust: 99999, shards: 99, spores: 9999, cores: 9 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockquarry'); window.__finish();
                 window.__buy('quarrybench'); window.__finish(); window.__fast(2);
                 window.__look(st().quarryX - 300); } },
  donestack: { about: 'the bench', say: 'two rungs landed and ticked, one going up over them, one in line',
    run: () => { window.__reset(); window.__crew(3, 3);
                 window.__grant({ dust: 99999, shards: 999, spores: 9999, cores: 9 });
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
  // The opening lands a core and a hire within its first seconds, so a yard
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
                 window.__grant({ cores: 9, dust: 90000, spores: 999, shards: 999 });
                 window.__board('quarry'); } },
  farmboardmid: { about: 'the plots', say: "the plots' board, two plots broken and four to go",
    run: () => { window.__reset(); window.__crew(2, 3, 3, 3);
                 window.__grant({ cores: 9, dust: 90000, spores: 999, shards: 999 });
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
                 window.__grant({ cores: 3, dust: 8000, spores: 3000, shards: 300 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__pot('stew'); window.__assign(JOB.STIR, 1); window.__fast(16);
                 window.__look(st().apothecaryX - 400); } },
  // The site's bar hangs over the hut, not over the middle of the plot.
  apothbar: { about: 'the apothecary', say: 'a rung on the go, the bar over the hut',
    run: () => { window.__reset(); window.__crew(0, 1, 0, 2);
                 window.__grant({ cores: 3, dust: 60000, spores: 3000, shards: 300 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__buy('brewdoses'); window.__fast(4); window.__look(st().apothecaryX - 300); } },
  // A stirrer on a keep-brewing pot with stock on the shelf, so the body that
  // would otherwise be out dealing is stood at the hut under the bar.
  potwork: { about: 'the apothecary', say: 'a keeper claimed to the hut for another pot',
    run: () => { window.__reset(); window.__crew(2, 4, 0, 3);
                 window.__grant({ cores: 3, dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__brews(5); window.__assign(JOB.STIR, 1); window.__pot('stew'); window.__fast(40);
                 window.__buy('anotherpot'); window.__fast(14); window.__look(st().apothecaryX - 300); } },
  // Four pots, each bought after the five batches that offer the next. Same
  // setup as `apothpots`, camera on the pots for where the bar hangs against
  // the steam.
  potbars: { about: 'the apothecary', say: 'four pots boiling, bars up, up close',
    run: () => { window.__reset(); window.__crew(1, 4, 0, 2);
                 window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__brews(5);
                 window.__buy('anotherpot'); window.__finish();
                 window.__buy('anotherpot'); window.__finish();
                 window.__buy('anotherpot'); window.__finish();
                 window.__assign(JOB.STIR, 4);
                 window.__pot('stew'); window.__pot('brace', 1); window.__pot('strong', 2); window.__pot('stew', 3);
                 window.__fast(30); window.__look(st().apothecaryX + 60); } },
  // Four pots each on a brew of its own, so the flames read as three colors
  // side by side.
  apothpots: { about: 'the apothecary', say: 'the whole building at its widest',
    run: () => { window.__reset(); window.__crew(1, 4, 0, 2);
                 window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__brews(5);
                 window.__buy('anotherpot'); window.__finish();
                 window.__buy('anotherpot'); window.__finish();
                 window.__buy('anotherpot'); window.__finish();
                 window.__assign(JOB.STIR, 4);
                 window.__pot('stew', 0); window.__pot('brace', 1);
                 window.__pot('strong', 2);   // and the fourth left unset, for the empty block
                 window.__fast(50); window.__look(st().apothecaryX - 320); } },
  // Pots left cold so nothing pulls the eye off the rack. A full plank, a
  // couple, and one over the cap, so one shot carries both readings the rack
  // makes: bottles you count, and the numeral once there are more than the
  // plank can stand (`drawShelves` in render/apothecary.js).
  apothshelf: { about: 'the apothecary', say: 'the rack of stock, pots cold',
    run: () => { window.__reset(); window.__crew(1, 4, 0, 2);
                 window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
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
                 window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__look(st().apothecaryX - 320); window.__board('apothecary'); } },
  // A real pointermove at the pot's own spot, because standing at a pot is
  // what opens it; the press path is the touchscreen's, and the browser check
  // covers it.
  apothpick: { about: 'the apothecary', say: 'the picker open at the second pot', page: true,
    run: () => { window.__reset(); window.__crew(1, 4, 1, 2);
                 window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000, sparks: 20 });
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
                 window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000, sparks: 20 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__pot('stew', 0);
                 window.__look(st().apothecaryX - 200);
                 const b = window.__potSpot(0); hover(b.x + b.w / 2, b.y + b.h / 2); } },

  // --- the kit ----------------------------------------------------------------
  // The props have fallen, which is what opens the rock's kit.
  hatbar: { about: 'the kit', say: 'a helmet being made, the bar over the shack',
    run: () => { window.__reset(); window.__crew(3, 3); window.__jump(PROP_FROM);
                 window.__give(3000); window.__grant({ shards: 99, cores: 9 });
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
  // The camera held up so the strip under the ground is in the picture.
  liftroster: { about: 'the kit', say: 'the carry roster: bodies, carts, and the forklifts under them',
    run: () => { rich(); lip(); window.__kit({ drivers: 2 }); window.__fast(20);
                 const s = st(); window.__look(s.houses.door - s.viewW / 2);
                 S.camLockY = S.groundY - S.viewH * 0.35; } },
  liftstand: { about: 'the kit', say: 'the garage by the bench with all three forklifts inside, the yard clean',
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
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, cores: 9, dust: 5000 });
                 window.__air({ haze: 2100 }); window.__fast(64.5); window.__look(st().rockLeftX - 300); } },
  gustL: { about: 'the house and the sky', say: 'the wind at its strongest, blowing left',
    run: () => { window.__seed(1); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, cores: 9, dust: 5000 });
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
                 const pin = () => { window.__look(x); requestAnimationFrame(pin); }; pin(); } },
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
                 window.__grant({ sparks: 9999, shards: 9999, spores: 9999, cores: 9 });
                 window.__meteor(); window.__give(60000); window.__fast(0.5); window.__look(st().pitX - 300); } },
  rift: { about: 'the pit and the rift', say: 'the rift, torn and fed',
    run: () => { rich(); window.__meteor(); window.__rift(); window.__give(60000); window.__give(12000);
                 window.__fast(4); window.__look(st().pitX - 260); } },
  grown: { about: 'the pit and the rift', say: 'the disc half grown',
    run: () => { rich(); window.__meteor(); window.__tear(400000); window.__give(30000);
                 window.__fast(3); window.__look(st().pitX - 300); } },
  // The pan clamps at the end of the world, so the disc sits against the
  // right edge however much further you ask for; `--zoom 2` is the closest
  // look that still holds the whole rim.
  rim: { about: 'the pit and the rift', say: 'the rim, as close as the camera comes',
    run: () => { rich(); window.__meteor(); window.__tear(400000); window.__give(30000);
                 window.__fast(3); window.__look(st().pitX - 155); } },
  // A second before the shot lands this mid-liquefy, with the cutscene's own
  // camera on it.
  drown: { about: 'the pit and the rift', say: 'the disc giving way and drowning',
    run: () => { rich(); window.__meteor(); window.__tear(999500); window.__give(30000); window.__fast(0.6); } },

  // --- the shields ------------------------------------------------------------
  // The `!` scenes run the crew's five-second dance through, so the shot is
  // the rock meeting the shield rather than the dance before it.
  shieldrow: { about: 'the shields', say: "the bench's board with a shield on offer", page: true,
    run: () => { shieldYard(); window.__board('bench'); } },
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
  // The dome on offer: the three before it have failed and the tower is
  // opened to it, so the board wears the wide goal card and the corner pins
  // it (`fillPin` in shop.js).
  domeoffer: { about: 'the shields', say: "the dome on offer on the tower's board, pinned in the corner",
    run: () => { shieldYard(); window.__answered('props', 'net', 'arch');
                 S.quarryOpen = S.farmOpen = true; window.__meteor();
                 window.__board('tower'); window.__fast(12); } },
  // The star is left up so the shot proves the beams draw with one burning.
  'dome+': { about: 'the shields', say: 'the wizard called off the star, flat out for the dome',
    run: () => { domeCast(2.5); window.__look(st().shield.x - 1500); } },
  'dome~': { about: 'the shields', say: 'the dome being cast: the wizard over it, pouring',
    run: () => { domeCast(6); window.__look(st().shield.x - 260); } },
  // Proves the dome is refit for the rock that actually reaches it
  // (`refitShield`, from `makeBoulder`) rather than sized once at the pour.
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
  saved: { about: 'the shields', say: 'the end of the story: the sheet after the rescue',
    run: () => { shieldBuilt('dome'); S.buried = true; window.__next(); window.__fast(45); } },

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

  ...deepScenes
};

// The names under each part, in ABOUT's order.
export const byPart = () =>
  ABOUT.map(about => [about, Object.keys(SCENES).filter(k => SCENES[k].about === about)]);
