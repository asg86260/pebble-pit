// Every part of the game, one press away: the one list of scenes.
//
// A scene stands a fresh yard at some place in the story -- the cut being
// worked by machine, the apothecary with four pots on the boil, the rift half
// grown -- so that a part of the game can be looked at, played and broken
// without playing the hour up to it. Two things want a scene: the shot tool
// (`tools/look.mjs`, which writes one to a png) and the held sheet (which puts
// a button under each part's heading -- see scenesheet.js). Both read this
// list; neither keeps one of its own. Before this file there were two lists
// that could not see each other, ninety scenes as strings in the shot tool and
// a handful of beats as buttons on the dev panel, which is the same defect the
// boards had before UPGRADES was the one list a row is on.
//
// A scene is a fact about the game, not about either tool, so it lives with
// the game. Nothing here ships: the sheet and the handles are imported from
// main.js's `import.meta.env.DEV` block, and the node tier reads the list
// through the same `window.__` handles the checks use (hooks.js), so a scene
// is exactly what you would have typed into the console.
//
// Each entry:
//   about  which part of the game it is about -- one of ABOUT, and
//          test/scenes.test.mjs is red for a scene under any other name
//   say    one plain sentence, the button's tooltip and the shot tool's --list
//   run    the setup. Always from `__reset()`: a scene is a place in the
//          story, not whatever yard was standing when the button was pressed.
//   page   true for a scene that needs the page -- a real pointer event, a
//          button clicked, a frame waited for -- which the node yard has not
//          got. Those are covered by the shot; the rest run in the node check.
//
// The comments over the scenes explain WHY each is set up as it is -- the sky
// that has to fall into place for eight seconds, the flag shot partway through
// its hoist. They are the valuable part; they moved here with the scenes.

import { S } from './state.js';
import { JOB, TYPE } from './jobs.js';
import { PROP_FROM, NET_COST, ARCH_COST, JACK_COST, DOME_BILL, LADDER } from './config.js';

// The parts, in the order the sheet reads them.
export const ABOUT = [
  'the story', 'the rock', 'the crew', 'the bench', 'the cut', 'the plots',
  'the apothecary', 'the school', 'the house and the sky', 'the tower',
  'the casino', 'the pit and the rift', 'the shields', 'the endgame'
];

const st = () => window.__state();

// A yard that can afford anything, with every site full: what most of the
// scenes about a machine or a board stand on.
const rich = () => {
  window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 }); window.__tip(90000);
};

// The lip bought out: every rung of the crew's own gear and a cart for every
// pair of hands, which is what the belt is gated behind. `__fullSites` does the
// same for the cut, the field and the rock, but carrying has no site to fill.
const lip = () => {
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  window.__school({ carters: 6 });
};

// A sky to look at, at whatever level the scene sets. The camera on the middle
// of the works, so the yard is in shot under it.
//
// Each of these runs eight seconds after setting the level, and that is not
// padding: `fillSky` mints a wound-up sky at the *top* of the window and the
// band eases each speck down to its own slot over `SMOG_SINK`. Shot on the next
// frame, every scene came out heavy at the top and thin at the ground -- a
// picture of a sky still falling into place, which read exactly like a bug in
// the thing being looked at.
const skyAt = haze => {
  rich(); window.__look(st().rockLeftX - 300);
  window.__air({ haze }); window.__fast(8);
};

// wave6-sky (item 5): the storm at its four moments. A brim sky is certain to
// break at the next look, so each scene fills the sky and runs the clock to
// the part of the storm it is named for. The waits are loops on the yard's own
// readout rather than counted seconds, so the scenes survive retuning.
const untilBrewing = () => { for (let i = 0; i < 90 && !st().smog.brewing; i++) window.__fast(1); };
const untilRaining = () => { for (let i = 0; i < 120 && !st().smog.raining; i++) window.__fast(1); };

// A pointer put on a spot of the yard, for the scenes about what a hover does.
// Not a hook: standing at a thing is what opens it, and there is no handle that
// puts the mark up, nor should there be.
const hover = (x, y) => {
  const s = st();
  document.getElementById('c').dispatchEvent(new PointerEvent('pointermove', {
    clientX: (x - s.camX) * s.zoom, clientY: (y - s.camY) * s.zoom,
    pointerId: 1, isPrimary: true, button: 0, buttons: 0, bubbles: true }));
};

// The shields, beat by beat: the row on the bench, the thing going up a piece
// at a time, and the rock reaching the finished one. Each is a fresh yard with
// the coin for that shield already in hand. The five run one per coin, so a
// scene about any of them needs all five in hand -- there is no point standing
// the yard at the jack with no sparks in the hole. The story is a chain -- each
// row is offered only once the one before has failed -- so a scene about the
// fourth shield stands the yard where the first three have already been
// through. Nothing is skipped that a player would see; what is skipped is the
// waiting.
const SHIELD_ORDER = ['props', 'net', 'arch', 'jack', 'dome'];
const shieldYard = () => {
  window.__reset();
  window.__crew(2, 1, 0, 0, 0, 1);   // and one who can fly, for the dome
  window.__jump(PROP_FROM);
  window.__give(60000);
  window.__grant({ shards: ARCH_COST * 3, spores: NET_COST * 3, sparks: JACK_COST * 3 });
  // ...and the dome's whole bill, three times over, which is the dearest ask
  // in the game and is priced in everything: the dust through the pit, the
  // rest through the grant.
  for (const [money, n] of DOME_BILL) {
    if (money === 'dust') window.__give(n * 3);
    else window.__grant({ [money + 's']: n * 3 });
  }
};
const shieldBuilt = kind => {
  shieldYard();
  S.shieldsDone = SHIELD_ORDER.slice(0, SHIELD_ORDER.indexOf(kind));
  S.quarryOpen = S.farmOpen = S.towerOpen = S.meteorOpen = true;
  window.__buy(kind);
  // run the build through rather than skipping it: the work is done by a lent
  // body at the site (works.js), only faster than watching
  for (let i = 0; i < 900; i++) {
    const sh = st().shield;
    if (sh && sh.laid >= sh.pieces) break;
    window.__fast(1);
  }
};

export const SCENES = {
  // --- the story --------------------------------------------------------------
  opening: { about: 'the story', say: 'the intro, from the top',
    run: () => window.__reset(true) },
  // the two of them out of the door and on their way to the spot
  leaving: { about: 'the story', say: 'the opening, the pair walking out of the house',
    run: () => window.__reset(true) },
  // the one beat after the first rock: it is mined out, and somebody goes over
  reunion: { about: 'the story', say: 'the first rock mined out, and somebody comes over',
    run: () => { window.__reset(); window.__crew(1, 0); window.__give(50); window.__next(); } },
  landing: { about: 'the story', say: 'the second rock coming down on a yard with a crew',
    run: () => { window.__reset(); window.__crew(2, 1); window.__next(); } },
  // wave-release, track B. The opening half a second into the one left
  // standing getting up -- the beat the view eases back out over. With the
  // full picture the view is still close and on its way; under reduced motion
  // it is already the yard's own framing from the first frame of the beat, and
  // the body and the rock are exactly where they are in the other shot.
  introup: { about: 'the story', say: 'the opening, the one left standing getting up',
    run: () => { window.__motion(false); window.__reset(true); window.__fast(12.5); } },
  introstill: { about: 'the story', say: 'the same beat under reduced motion',
    run: () => { window.__motion(true); window.__reset(true); window.__fast(12.5); } },
  // and the loop shown, a few seconds in: the full picture chases the grain,
  // the still seat sits between the rock and the mouth of the hole
  introshow: { about: 'the story', say: 'the opening, the loop being shown',
    run: () => { window.__motion(false); window.__reset(true); window.__fast(18); } },
  introshowstill: { about: 'the story', say: 'the loop shown, under reduced motion',
    run: () => { window.__motion(true); window.__reset(true); window.__fast(18); } },

  // --- the rock ---------------------------------------------------------------
  // The hill, and the ram driving into it.
  rock: { about: 'the rock', say: 'the hill, and the ram driving into it',
    run: () => { rich(); window.__buy('ram'); window.__finish(); window.__jump(6);
                 window.__look(st().rockLeftX - 200); } },
  // The gang's hut off the rock's left flank, with the helmets on the stand
  // outside it and the bench out behind. The ram is bought and the rock jumped
  // on, because the clearance between the hut's wall and a parked ram at a big
  // boulder is the one thing about this layout that arithmetic cannot settle.
  shack: { about: 'the rock', say: 'the shack beside a big rock, the ram parked',
    run: () => { rich(); window.__school({ breakers: 3 }); window.__shack(); window.__buy('ram');
                 window.__finish(); window.__jump(8); window.__fast(6); window.__look(st().shackX - 400); } },
  // The shack against the rock, at both ends of the rock's growth: the walk
  // leaves it exactly the room `rockSize` needs off its flank and no more, so
  // these two are what "no more" looks like at boulder one and at the ceiling.
  // Jumped and then run, the same as `shack`: RICH leaves the first rock still
  // falling and nine cores tearing the rift, and neither of those is a flank to
  // stand a hut against.
  shackrock: { about: 'the rock', say: 'the shack against rock one',
    run: () => { rich(); window.__school({ breakers: 3 }); window.__shack(); window.__jump(1);
                 window.__fast(6); window.__look(st().shackX - 200); } },
  shackrockbig: { about: 'the rock', say: 'the shack against the biggest rock',
    run: () => { rich(); window.__school({ breakers: 3 }); window.__shack(); window.__jump(30);
                 window.__fast(6); window.__look(st().shackX - 200); } },
  shackboard: { about: 'the rock', say: "the shack's board",
    run: () => { rich(); window.__school({ breakers: 3 }); window.__shack(); window.__board('shack'); } },
  // The swing multiplier on the go: a spare hand at the hut, the bar over its
  // roof, nobody standing in the middle of the boulder.
  shackwork: { about: 'the rock', say: 'a rung being fitted at the shack',
    run: () => { rich(); window.__school({ breakers: 3 }); window.__shack(); window.__invest();
                 window.__buy('rockhandspeed'); window.__fast(6); window.__look(st().shackX - 400); } },
  // The rock's own flank: the hill, the hut beside it and the bench beyond,
  // with the ground between them. A picture of spacing, so the camera sits on
  // the rock's left edge and lets the walk run out to the left of it.
  flank: { about: 'the rock', say: 'the hill, the hut and the bench, with the ground between', page: true,
    run: () => { window.__reset(); window.__crew(3, 1); window.__shack(); window.__give(100); window.__fast(2);
                 requestAnimationFrame(() => {
                   document.getElementById('raise').click();
                   window.__fast(40); window.__look(st().benchX - 120);
                 }); } },
  // ...and the same, six rocks in: the hut has scooted out to keep its
  // clearance off a broader rock, and the bench has not moved.
  flankgrown: { about: 'the rock', say: 'the same flank six rocks in', page: true,
    run: () => { window.__reset(); window.__crew(3, 1); window.__shack(); window.__give(100); window.__fast(2);
                 requestAnimationFrame(() => {
                   document.getElementById('raise').click();
                   window.__fast(40);
                   for (let i = 0; i < 5; i++) { window.__next(); window.__fast(6); }
                   window.__look(st().benchX - 120);
                 }); } },
  // Dust lying on the hill itself, which is ground now: grains dropped over the
  // crest come to rest on the mined outline and lie there until a rockhand
  // throws them on the heap. Nobody is mining in this one, so it stays put to
  // be looked at.
  crest: { about: 'the rock', say: 'dust lying on the crest',
    run: () => { window.__reset(); window.__jump(6); window.__fast(2);
                 const s = st();
                 for (let c = 6; c < s.gw - 6; c++) window.__pileRock(s.rockLeftX + c * 6 + 3, 3);
                 window.__fast(1); window.__look(st().rockLeftX - 180); } },
  // The bare strip in front of the hill, which is where dust was never allowed
  // to lie. Grains are tipped straight onto the ground either side of the rock.
  apron: { about: 'the rock', say: 'the bare strip in front of the hill',
    run: () => { rich(); window.__jump(4);
                 const x = st().rockLeftX;
                 for (let d = -260; d < 260; d += 12) window.__pile(x + d, 60);
                 window.__fast(4); window.__look(st().rockLeftX - 340); } },
  // A core, for the glow around it. It is the one thing in the yard drawn from
  // a snapped middle rather than a corner, so it is the one thing where being
  // half a cell out shows. Centered on the core itself, not on a landmark near
  // it -- at the zoom this wants, "near" is off the edge of the crop.
  core: { about: 'the rock', say: 'a core, and the glow around it',
    run: () => { rich(); window.__drop(); window.__fast(3);
                 const c = st().coreItem || { x: st().coreHome.x };
                 window.__look(c.x - window.innerWidth / 2); } },
  // F4 (item 19): crits landing. The roll is forced on and the rockhands are
  // left to work, so every swing in shot is a crit -- a ring going out, the
  // specks the blow threw, and the fountain of real dust over the top of it. A
  // single swing by hand is no good here: the runner gives every scene a second
  // before the shot and a ring is over in a third of one, so the yard has to
  // be making them while the picture is taken.
  crit: { about: 'the rock', say: 'every swing a crit',
    run: () => { window.__reset(); window.__crew(3, 0);
                 window.__levels({ pickLevel: 5, rockhandSpeedLevel: 5, rockhandPickLevel: 5 });
                 window.__crit(true); window.__fast(6); window.__look(st().rockLeftX - 260); } },
  // F4 (item 21): the celebration. A rock is taken off and the gang have the
  // ground to themselves for five seconds -- which is now straight jumps and
  // nothing else, so what a still frame should show is bodies at different
  // heights over one line of ground rather than a row of squares wandering
  // sideways. Each body rolls its own tempo, so no two are at the same height.
  dance: { about: 'the rock', say: 'the celebration after a rock comes off',
    run: () => { window.__reset(); window.__crew(3, 4); window.__fast(3);
                 window.__next(); window.__fast(1.2); window.__look(st().rockLeftX - 300); } },

  // --- the crew ---------------------------------------------------------------
  // Bodies, wearing everything the school sells, standing where you can see them.
  crew: { about: 'the crew', say: 'the crew, hats and all',
    run: () => { window.__reset(); window.__crew(3, 2, 2, 2);
                 window.__school({ breakers: 3, blasters: 2, growers: 2, carters: 2 });
                 window.__loo(); window.__assign(JOB.JANITOR, 1); window.__fast(20);
                 window.__look(st().rockLeftX - 420); } },
  // The settlement at a size where it has gone up several storeys: a crew of
  // twenty is twenty-one rooms, which is three full courses and a part of a
  // fourth, so both the square sides and the unfinished top show in one shot.
  house: { about: 'the crew', say: 'the house, several storeys up',
    run: () => { window.__reset(); window.__crew(6, 5, 5, 4); window.__fast(2);
                 window.__look(st().houses.door - 400); } },
  // The question mark a held body says. Hovered for real -- the pause and the
  // mark come off `pointermove` in pointer.js, and there is no hook that puts
  // the mark up -- so the camera is put on the body first and the pointer sent
  // to where it then stands. In a frame, not now: the runner turns a whole
  // second of clock after a scene and the hold is only nine hundred
  // milliseconds, so a hover sent from here would have lapsed by the time of
  // the shot -- and the body would have walked out from under it besides.
  asking: { about: 'the crew', say: 'a body hovered, saying its question mark', page: true,
    run: () => { window.__reset(); window.__crew(3, 2, 2, 2);
                 window.__school({ breakers: 3, blasters: 2, growers: 2, carters: 2 });
                 window.__fast(20);
                 requestAnimationFrame(() => {
                   const d = st().crewDetail[0].split('|');
                   const wx = Number(d[2]), wy = Number(d[7].slice(1));
                   window.__look(wx - 400 / st().zoom);
                   hover(wx, wy);
                 }); } },
  // The assignment ring (wave7b-assign): a body held over the farm, so the
  // station under it wears the steady solid ring while the offer auras breathe
  // around it. The held body hangs off the cursor; __hold is the same lift.
  // A smaller crew than RICH's: the rich yard fills every plot, and a full
  // station is exactly the one that must NOT ring.
  assign: { about: 'the crew', say: 'a body held over the farm, the ring on',
    run: () => { window.__reset(); window.__crew(3, 3, 2, 2); window.__give(50000);
                 window.__levels({ plotLevel: 4 }); window.__fast(1);
                 const fs = st().farmShed;
                 window.__hold(0, fs.x + fs.w / 2, fs.y + fs.h / 2);
                 window.__look(fs.x - 60); } },
  // The belt, which is the one machine that is long rather than tall: a run of
  // trestles from the rock to the lip, its tender standing at the hole end, and
  // the ground under it being swept into it. Bought and running -- it has no
  // switch anywhere in the game: a machine runs when somebody is standing at
  // it. Deliberately not built on RICH: that tips ninety thousand dust into the
  // hole, and a full hole stops the belt exactly as it stops a gang, so the
  // scene came out with a stopped-station triangle over an empty band. It gets
  // the coins and the sites it needs and leaves the hole room to take what the
  // belt brings.
  belt: { about: 'the crew', say: 'the belt running from the rock to the lip',
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 999, shards: 999, spores: 999 }); lip();
                 window.__buy('ram'); window.__finish(); window.__buy('belt'); window.__finish();
                 window.__jump(4); window.__fast(12); window.__clearFloor();
                 window.__look(st().pitX - 620); } },
  // The two marks that hang under a station: the stopped triangle and the
  // offer diamond. Both want a station whose pile has filled and which has
  // something to sell, so the yard is run for a while with nobody to carry
  // anything away.
  marks: { about: 'the crew', say: 'the stopped triangle and the offer diamond',
    run: () => { rich(); window.__assign('carters', -9); window.__fast(240);
                 window.__look(st().farmX - 300); } },
  // The outhouse, its roster and its stand. The caps are the one hat in the
  // yard nobody buys -- the shed simply has two of them -- so this is where you
  // look to see that a stock reads the same as a trade: a stand outside the
  // door with a cap on it and a figure over it, one body gone to fetch one, and
  // the post's ordinary two lines under the shed.
  loo: { about: 'the crew', say: 'the outhouse, its stand and its janitor',
    run: () => { window.__reset(); window.__crew(0, 3); window.__loo();
                 window.__assign(JOB.JANITOR, 1); window.__fast(30); window.__look(st().outhouseX - 260); } },
  // The outhouse with its board up: the shed with the moon on the door, the
  // broom standing beside it, and the janitor's own rungs on the sheet. The
  // shed has to be up first -- the board arrives with the building.
  looboard: { about: 'the crew', say: "the outhouse's board",
    run: () => { window.__reset(); window.__crew(3, 2); window.__loo();
                 window.__give(20000); window.__board('outhouse');
                 const s = st(); window.__look(s.outhouseX + 21 - s.viewW / 2); } },
  // The block's board: the door through to the people, the row that puts
  // another one up, and the gear the crew own that stands out in the yard --
  // the belt, its tuning and the multiplier over their pace. What they carry
  // and how fast they walk is not on it; that is fitted at the workbench and
  // sold there, so this is the shot for whether the sheet still reads as a
  // board with the four rungs gone off it.
  // `page`: the camera reads `houses` off the page's snapshot, which the node
  // yard's has not got.
  houseboard: { about: 'the crew', say: "the crew's board", page: true,
    run: () => { rich(); window.__board('house'); window.__look(st().houses[0].x - 320); } },
  // Two bodies under a tonic each, standing with the crew.
  apothbuff: { about: 'the crew', say: 'bodies under tonics, standing',
    run: () => { window.__reset(); window.__crew(3, 2, 2, 2);
                 window.__school({ breakers: 3, blasters: 2, growers: 2, carters: 2 });
                 window.__loo(); window.__assign(JOB.JANITOR, 1); window.__fast(20);
                 window.__dose(TYPE.ROCK, 'brace'); window.__dose(TYPE.JANITOR, 'strong');
                 window.__look(st().rockLeftX - 420); } },
  // F4 (item 6): the same buff on bodies that are WALKING, which is where it
  // used to come apart -- the plume was let go into the yard, so a body
  // trailed it behind in a streak as long as its pace and pointing whichever
  // way it was going. Haulers cross the whole yard between the rock and the
  // lip, so a shot of the run catches them going both ways at once, and the
  // one under two tonics says the two colors still read apart while it moves.
  buffwalk: { about: 'the crew', say: 'bodies under tonics, walking',
    run: () => { window.__reset(); window.__crew(2, 5);
                 window.__dose(TYPE.HAUL, 'brace'); window.__dose(TYPE.HAUL, 'strong');
                 window.__dose(TYPE.ROCK, 'stew'); window.__fast(12); window.__look(st().pitX - 620); } },

  // --- the bench --------------------------------------------------------------
  // The call to build the bench, standing over the bare patch it will go on.
  // The first thing a player is ever asked to press -- see raise.js -- so this
  // is a picture of an empty yard with one button in it.
  call: { about: 'the bench', say: 'the call to build the bench',
    run: () => { window.__reset(); window.__crew(1); window.__give(100); window.__fast(2);
                 window.__look(st().benchX - 380); } },
  // ...and the same patch nine seconds after it was pressed: the fence, the
  // tape, the bar, the one body swinging at it, and as much of the bench as
  // has actually gone up.
  benchup: { about: 'the bench', say: 'the bench going up', page: true,
    run: () => { window.__reset(); window.__crew(1); window.__give(100); window.__fast(2);
                 requestAnimationFrame(() => {
                   document.getElementById('raise').click();
                   window.__fast(12); window.__look(st().benchX - 380);
                 }); } },
  // Track F3 (wave5). The bench, which is the longest board in the game: every
  // heading, the pips under every ladder, and the clocks in the bills of the
  // rows that have to be built. This is the shot for the pips and for the
  // clock icon -- both of them are three or four pixels of a row, and this is
  // the only place several of each stand together to be compared.
  bench: { about: 'the bench', say: "the bench's board, every heading",
    run: () => { rich(); window.__board('bench'); } },
  // The bench's own rows are fitted at the bench: one body, carrying, walks
  // over and stands there under the bar while strength is fitted.
  fitting: { about: 'the bench', say: 'a rung being fitted at the bench',
    run: () => { window.__reset(); window.__crew(0, 1); window.__grant({ dust: 9000 });
                 window.__fast(2); window.__buy('carry'); window.__fast(3); window.__look(st().benchX - 300); } },
  // The queue card, top-left: three rungs bought at the bench in a row, the
  // first being fitted with its pips, the two behind it waiting as plain names.
  queue: { about: 'the bench', say: 'the queue card, with a line at the bench', page: true,
    run: () => { window.__reset(); window.__crew(0, 1); window.__grant({ dust: 9000 });
                 window.__fast(2); window.__buy('carry'); window.__buy('auto'); window.__buy('haulcarry');
                 window.__fast(3); window.__look(st().benchX - 300); } },
  // A building going up: the lab half out of the ground, its barriers and tape
  // round it, and the builder hammering at it throwing grit off each blow.
  // Bought and then deliberately NOT finished -- `__finish` is what most scenes
  // call, and it is the one thing that would skip the whole of what this scene
  // is for. It is shot partway through instead, which is the only state the
  // rise, the tape and the hammer exist in.
  build: { about: 'the bench', say: 'a building half out of the ground',
    run: () => { rich(); window.__buy('unlockapothecary'); window.__fast(35);
                 window.__look(st().apothecaryX - 380); } },
  // The same, later: far enough on that the building is most of the way up,
  // to see the clip actually moving rather than to trust one frame of it.
  build2: { about: 'the bench', say: 'the same building most of the way up',
    run: () => { rich(); window.__buy('unlockapothecary'); window.__fast(70);
                 window.__look(st().apothecaryX - 380); } },
  // Something being built. Everything past the bench is worked through by the
  // hands at the site now (see works.js), so a purchase has a middle: a bar
  // over the place, filling while the gang is there and stopped while it is not.
  building: { about: 'the bench', say: 'a machine being built, the bar over the site',
    run: () => { rich(); window.__buy('jaw'); window.__fast(9); window.__look(st().quarryX - 260); } },
  // ...and how the row reads while it is going on: greyed, saying what it is
  // doing, with the clock in its bill counting down what is left.
  buildboard: { about: 'the bench', say: 'a row read while its work is on the go',
    run: () => { rich(); window.__buy('jaw'); window.__fast(4); window.__board('quarry'); } },
  // The offer aura (wave7-ui): a rich yard where every open board has
  // something affordable, so the stations breathe their dashed outline. Shot
  // at the lab, with the bench in frame too.
  aura: { about: 'the bench', say: 'every station breathing its offer aura',
    run: () => { rich(); window.__give(50000); window.__fast(1); window.__look(st().farmShed.x - 60); } },
  // The offer flag on the house-and-bench cluster. No big __give here: filling
  // the hole tears it, and the tear cutscene's camera overrides __look for
  // every frame after, which frames every shot on the rift instead.
  flag: { about: 'the bench', say: 'the offer flag up over the bench',
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 5000 });
                 window.__fast(2); window.__look(4930); } },
  // The raise, caught halfway. A flag does not appear: the mast slides out of
  // the roofline over FLAG_RAISE_MS and the cloth is run up it over
  // FLAG_HOIST_MS. Both scenes set a yard that can afford nothing, then pay
  // for it in a frame -- the grant has to land AFTER the runner's own second of
  // clock, or the raise is long over by the shot -- and turn the handle by
  // just enough that the next frame drawn is the middle of the move. The draw
  // reads its own clock, so the fraction is exactly the number of seconds
  // asked for here, not whatever the machine happened to manage.
  flagraise: { about: 'the bench', say: 'the flag halfway through its raise', page: true,
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__fast(2); window.__look(4930);
                 requestAnimationFrame(() => {
                   window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 5000 });
                   window.__fast(0.3);
                 }); } },
  flaghoist: { about: 'the bench', say: 'the flag halfway up its mast', page: true,
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__fast(2); window.__look(4930);
                 requestAnimationFrame(() => {
                   window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 5000 });
                   window.__fast(0.95);
                 }); } },
  // The two shacks, side by side in one frame: the field's with its trough
  // and the cut's with the timber over its door. Nothing else in the list
  // frames both -- `quarry` and `farm` each look at the work rather than at
  // the shed beside it -- and the whole question about a shack is whether it
  // reads as a different building from the other one.
  shacks: { about: 'the bench', say: "the cut's shed and the field's, side by side",
    run: () => { rich(); window.__look(st().farmShed.x - 60); } },
  // The same frame with a work on the go at both sites: a bench being cut and
  // a plot being broken, so each shack has its bar over it. This is the scene
  // for where a site's bar hangs -- `quarry` and `farm` finish their builds,
  // so neither ever shows one.
  sitebars: { about: 'the bench', say: 'a bar over each shed, both sites at work',
    run: () => { window.__reset(); window.__crew(3, 3, 3, 3);
                 window.__grant({ dust: 99999, shards: 999, spores: 9999, sparks: 999 });
                 window.__buy('unlockquarry'); window.__finish();
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('quarrybench'); window.__buy('farmplot'); window.__fast(6);
                 window.__look(st().farmShed.x - 60); } },
  // A finished work's tick, over a station that is not the lab: the quarry's
  // bench lands and the shack wears the mark until its board is read.
  donemark: { about: 'the bench', say: "a finished work's tick over the shed",
    run: () => { window.__reset(); window.__crew(3, 3);
                 window.__grant({ dust: 99999, shards: 99, spores: 9999, cores: 9 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockquarry'); window.__finish();
                 window.__buy('quarrybench'); window.__finish(); window.__fast(2);
                 window.__look(st().quarryX - 300); } },
  // The noticeboard, between the work bench and the front doors, with a
  // record pinned to it. The board fills with slips as the record does, so the
  // two shots worth having are a yard that has only just started and one that
  // has done a great deal. Neither tier can see any of this -- how many slips
  // are up, whether the newest stands proud of the rest, whether the thing
  // reads as a board you walk up to rather than as another shed with the door
  // left off. The shot is the check.
  notices: { about: 'the bench', say: 'the noticeboard on a yard just started',
    run: () => { window.__reset(); window.__crew(1); window.__give(400); window.__fast(4);
                 window.__look(st().noticesX - 440); window.__fast(6); } },
  notices2: { about: 'the bench', say: 'the noticeboard on a yard that has done a lot',
    run: () => { window.__reset(); window.__crew(1); window.__jump(30); window.__tip(90000); window.__fast(6);
                 window.__look(st().noticesX - 440); window.__fast(6); } },
  // A board, open, with everything on it.
  boards: { about: 'the bench', say: 'a board open with everything on it',
    run: () => { rich(); window.__board('tower'); } },

  // --- the cut ----------------------------------------------------------------
  // The cut, worked by machine: the jaw on the floor of it and the hoist over.
  quarry: { about: 'the cut', say: 'the cut, the jaw and the hoist',
    run: () => { rich(); window.__buy('jaw'); window.__finish(); window.__look(st().quarryX - 220); } },
  // The jaw's smoke, well into its climb: run the machine half a minute so
  // the plume has puffs at every age, then look at the air over the cut. What
  // this is for is the shape of the climb -- a cone that dissolves, not a
  // column. (wave7-sky, A1.)
  plume: { about: 'the cut', say: "the jaw's plume, well into its climb",
    run: () => { rich(); window.__buy('jaw'); window.__finish(); window.__fast(30);
                 window.__look(st().quarryX - 220); } },
  // The two grounds' own sheets, which are what "a place and two ladders"
  // looks like: a place row, one yield card and one speed card, with the pips
  // under each saying where on its twelve-rung ladder the card sits. The shot
  // for the card names and their gain lines -- neither tier can see a word of it.
  quarryboard: { about: 'the cut', say: "the cut's board",
    run: () => { rich(); window.__board('quarry'); } },

  // --- the plots --------------------------------------------------------------
  // The plots, and the tractor crossing them.
  farm: { about: 'the plots', say: 'the plots, and the tiller crossing them',
    run: () => { rich(); window.__buy('tiller'); window.__finish(); window.__look(st().farmX - 200); } },
  farmboard: { about: 'the plots', say: "the plots' board",
    run: () => { rich(); window.__board('farm'); } },
  // And the far end of the same two ladders, which is where the bills get
  // interesting: band four asks for every coin the yard makes and band two for
  // two of them, so this is the shot for a deep bill fitting in a row.
  laddersdeep: { about: 'the plots', say: "the plots' board, deep on both ladders",
    run: () => { rich(); window.__invest(); window.__levels({ cropLevel: 9, tendLevel: 4 }); window.__board('farm'); } },
  // One hand on the whole row. This is the shot the row is *for*: a single
  // body stooping over one plot with the other six visibly coming on behind
  // it, rather than one stalk and six patches of bare dirt.
  keeper: { about: 'the plots', say: 'one farmhand keeping seven plots',
    run: () => { window.__reset(); window.__crew(0, 0, 0, 1);
                 window.__levels({ plotLevel: 6, tendLevel: 6 }); window.__fast(70); window.__look(st().farmX - 200); } },

  // --- the apothecary ---------------------------------------------------------
  // The apothecary: the cauldron on its fire, a stirrer at it, and steam off
  // the pot to say it is on the boil. The farm is opened first (the pot stands
  // right past it), the pot set to a tonic, and a body put on it -- so the
  // scene is a pot being worked, which is the only state the steam exists in.
  apothecary: { about: 'the apothecary', say: 'a pot on the boil, a stirrer at it',
    run: () => { window.__reset(); window.__crew(0, 1, 0, 2);
                 window.__grant({ cores: 3, dust: 8000, spores: 3000, shards: 300 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__pot('stew'); window.__assign(JOB.STIR, 1); window.__fast(16);
                 window.__look(st().apothecaryX - 400); } },
  // The apothecary with an upgrade on the go: the site's own bar, which hangs
  // over the hut -- the building -- not over the middle of the plot.
  apothbar: { about: 'the apothecary', say: 'a rung on the go, the bar over the hut',
    run: () => { window.__reset(); window.__crew(0, 1, 0, 2);
                 window.__grant({ cores: 3, dust: 60000, spores: 3000, shards: 300 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__buy('brewdoses'); window.__fast(4); window.__look(st().apothecaryX - 300); } },
  // A keeper claimed to the hut: "another pot" on the go with a stirrer on a
  // keep-brewing pot and stock on the shelf, so the body that would otherwise
  // be out dealing is stood at the hut under the bar and its pot is cold.
  potwork: { about: 'the apothecary', say: 'a keeper claimed to the hut for another pot',
    run: () => { window.__reset(); window.__crew(2, 4, 0, 3);
                 window.__grant({ cores: 3, dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__brews(5); window.__assign(JOB.STIR, 1); window.__pot('stew'); window.__fast(40);
                 window.__buy('anotherpot'); window.__fast(14); window.__look(st().apothecaryX - 300); } },
  // Four pots, each bought after the five batches that offer the next.
  // The pot row up close: four boiling pots with their bars up, for where the
  // bar hangs against the steam. Same setup as `apothpots`, camera on the pots
  // instead of the building.
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
  // Track F1: the whole building at its widest -- the hut, the bookshelf with
  // stock standing on all three shelves, and four pots each on a brew of its
  // own, so the flames read as three different colors side by side. This is
  // the shot the rework is for.
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
  // The rack of stock, stocked, with the camera on it and the pots left cold
  // -- four fires burning beside it are four things pulling the eye off the
  // thing being looked at. Mixed on purpose: a full plank, a couple, and one
  // over the cap, so one shot carries both readings the rack has to make --
  // bottles you count, and the numeral that takes over once there are more of
  // them than the plank can stand. See `drawShelves` in render/apothecary.js.
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
  // The apothecary's board, which is the building's figures and nothing about
  // what any one pot is brewing -- that is set at the pot now. Three sections:
  // how the place is run, how well it runs, and how deep each recipe goes.
  apothboard: { about: 'the apothecary', say: "the apothecary's board",
    run: () => { window.__reset(); window.__crew(1, 4, 0, 2);
                 window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
                 window.__buy('unlockfarm'); window.__finish();
                 window.__buy('unlockapothecary'); window.__finish();
                 window.__look(st().apothecaryX - 320); window.__board('apothecary'); } },
  // The picker at the pot (item 17): the cursor standing at the second
  // cauldron, its list of brews dropped open over it as swatches. No press --
  // a real pointermove on the canvas at the pot's own spot, because standing
  // at a pot is what opens it. A press opens it too; that path is the
  // touchscreen's, and the browser check covers it.
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

  // --- the school -------------------------------------------------------------
  // A trade mid-teaching: the school with its own bar over it, and a body at
  // it. The one site that had no bar at all while its rows were the yard's.
  schoolbar: { about: 'the school', say: 'a trade being taught, the bar over the school',
    run: () => { window.__reset(); window.__crew(3, 3);
                 window.__grant({ dust: 99999, shards: 99, cores: 9 });
                 window.__buy('unlockschool'); window.__finish();
                 window.__buy('breaker'); window.__fast(4); window.__look(st().schoolX - 300); } },
  schoolboard: { about: 'the school', say: "the school's board",
    run: () => { rich(); window.__school({ breakers: 3, carters: 1 }); window.__board('school'); } },
  // The shelf outside the school: a taught hat waiting to be carried to its
  // stand, with nobody free to carry it. (critics A8)
  shelf: { about: 'the school', say: 'a taught hat waiting on the shelf', page: true,
    run: () => { window.__reset(); window.__crew(2, 1); window.__give(100); window.__fast(2);
                 document.getElementById('raise').click(); window.__fast(20);
                 window.__grant({ shards: 100000, dust: 40000 }); window.__school({ open: true });
                 window.__crew(2, 0); window.__buy('breaker'); window.__finish(); window.__fast(2);
                 window.__look(st().schoolX - 400); } },
  // Every trade's hat on a body, at the kit stand.
  kit: { about: 'the school', say: 'every hat the school sells, worn',
    run: () => { window.__reset(); window.__crew(3, 3, 3, 3);
                 window.__school({ open: true, breakers: 3, carters: 3, blasters: 3, growers: 3 });
                 window.__fast(20); window.__look(st().schoolX - 300); } },

  // --- the house and the sky --------------------------------------------------
  // The house working: a filthy sky over it, a body inside, and no river of
  // haze leaning toward the roof -- what a mouth looks like now is a few cells
  // drawn in over the hood, and nothing in the sky is moved at all.
  scrubbing: { about: 'the house and the sky', say: 'the house scrubbing a filthy sky',
    run: () => { rich(); window.__air({ open: true, haze: 2600, purifiers: 1 }); window.__fast(25);
                 window.__look(st().scrubX - 300); } },
  // A balloon moored at the mast with nobody in it.
  moored: { about: 'the house and the sky', say: 'a balloon moored at the mast',
    run: () => { rich(); window.__air({ open: true }); window.__fast(2);
                 window.__buy('balloon'); window.__fast(2); window.__look(st().scrubX - 220); } },
  // ...and one crewed and out over the yard.
  // `page` on the two with a craft in the air: the camera reads `craft` off the
  // page's snapshot, which the node yard's has not got.
  balloon: { about: 'the house and the sky', say: 'a balloon crewed and out over the yard', page: true,
    run: () => { rich(); window.__air({ open: true, haze: 1800 }); window.__fast(2);
                 window.__buy('balloon'); window.__air({ purifiers: 2 }); window.__fast(30);
                 window.__look(st().craft[0].x - 380); } },
  // A rider stepping out: taken off the purifiers while it was up, so it is
  // on its way down under an umbrella and the craft is on its way out of the
  // window.
  brolly: { about: 'the house and the sky', say: 'a rider stepping out under an umbrella', page: true,
    run: () => { rich(); window.__air({ open: true, haze: 1600 }); window.__fast(2);
                 window.__buy('balloon'); window.__air({ purifiers: 2 }); window.__fast(35);
                 window.__look(st().craft[0].x - 400);
                 window.__air({ purifiers: 0 }); window.__fast(2.2); } },
  // The sky at four levels. The haze has the whole window now rather than a
  // strip along the top of it -- see DESIGN.md, "The sky is the band".
  sky0: { about: 'the house and the sky', say: 'a clear sky', run: () => skyAt(0) },
  sky1: { about: 'the house and the sky', say: 'a light sky', run: () => skyAt(900) },
  sky2: { about: 'the house and the sky', say: 'a heavy sky', run: () => skyAt(2100) },
  sky3: { about: 'the house and the sky', say: 'a sky at the brim', run: () => skyAt(4200) },
  rainbrew: { about: 'the house and the sky', say: "the storm brewing up",
    run: () => { skyAt(4200); untilBrewing(); window.__fast(9); } },
  raindrizzle: { about: 'the house and the sky', say: 'the drizzle',
    run: () => { skyAt(4200); untilRaining(); window.__fast(2); } },
  rain: { about: 'the house and the sky', say: 'the full pour',
    run: () => { skyAt(4200); untilRaining(); window.__fast(18); } },
  raintaper: { about: 'the house and the sky', say: 'the taper at the end of the storm',
    run: () => { skyAt(4200); untilRaining();
                 for (let i = 0; i < 90 && st().smog.haze > 700; i++) window.__fast(1); } },
  // The wind, seen. Dust, haze and a flag in one frame, because the whole
  // claim is that the three of them lean together -- if they do not, that is
  // the bug and it is visible in one picture. The clock is seeded (`__seed`
  // restarts it), and the two times are not round numbers or guesses: they
  // are where the wind actually is strongest each way inside the first eighty
  // seconds, found by running wind.js. That matters, because the field almost
  // never reaches its own peak -- the lull envelope sees to that -- so a shot
  // at a time that merely sounded windy is a shot of a lull. Compare the pair
  // side by side; one shot of weather says nothing, because there is nothing
  // in it to be weather against.
  gustR: { about: 'the house and the sky', say: 'the wind at its strongest, blowing right',
    run: () => { window.__seed(1); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 5000 });
                 window.__air({ haze: 2100 }); window.__fast(64.5); window.__look(st().rockLeftX - 300); } },
  gustL: { about: 'the house and the sky', say: 'the wind at its strongest, blowing left',
    run: () => { window.__seed(1); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 5000 });
                 window.__air({ haze: 2100 }); window.__fast(50); window.__look(st().rockLeftX - 300); } },

  // --- the tower --------------------------------------------------------------
  // The far end of the walk: the tower, the star beside it and the ground
  // under the star, which is where item 10 put them. The star wants the meteor
  // open or there is nothing up there to look at.
  westend: { about: 'the tower', say: 'the tower, the star and the ground under it',
    run: () => { rich(); window.__meteor(); window.__fast(3); window.__look(st().towerX - 420); } },
  // The tower with its offer flag up. The flag's own scene, because the tower
  // is the one station whose stand box is wider than the thing the pole stands
  // on: shaft plus turret, so the middle of the box is nowhere near the point.
  // Calling the meteor down pans the camera off to it, and the harness runs a
  // second of the yard after the scene -- so a camera set here has wandered by
  // the time the shot is taken. Pin it every frame instead.
  towerflag: { about: 'the tower', say: "the tower's offer flag", page: true,
    run: () => { rich(); window.__meteor(); window.__fast(3);
                 const x = st().towerX - 361;
                 const pin = () => { window.__look(x); requestAnimationFrame(pin); }; pin(); } },
  towerboard: { about: 'the tower', say: "the tower's board",
    run: () => { rich(); window.__board('tower'); } },

  // --- the casino -------------------------------------------------------------
  // The pot on the ground beside the wheel: a hundred staked, so the heap reads
  // at a glance, with the wheel going round for it.
  casino: { about: 'the casino', say: 'a hundred on the table, the wheel going',
    run: () => { window.__reset(); window.__casino(true); window.__give(6000); window.__chip(1);
                 window.__buy('stakedust'); window.__fast(3);
                 window.__look(st().casinoX - 380); } },
  // A hand just settled, either way: the wheel is played until the wanted
  // answer comes up, and the shot is a beat after the stop -- the sign on its
  // strobe and the fountain in the air, or the sign dark and the pot lifting.
  casinowin: { about: 'the casino', say: 'a win: the strobe and the fountain',
    run: () => { window.__reset(); window.__casino(true); window.__give(6000); window.__chip(1);
                 for (let i = 0; i < 12; i++) {
                   if (st().pot) { window.__buy('bank'); window.__fast(3); }
                   window.__buy('stakedust');
                   for (let f = 0; f < 600 && (st().pouring || st().spinning); f++) window.__fast(1 / 60);
                   if (st().hand && st().hand.won) break;
                 }
                 window.__fast(0.1);
                 window.__look(st().casinoX - 380); } },
  casinoloss: { about: 'the casino', say: 'a loss: the sign goes dark and the pot lifts off',
    run: () => { window.__reset(); window.__casino(true); window.__give(6000); window.__chip(1);
                 for (let i = 0; i < 12; i++) {
                   if (st().pot) { window.__buy('bank'); window.__fast(3); }
                   window.__buy('stakedust');
                   for (let f = 0; f < 600 && (st().pouring || st().spinning); f++) window.__fast(1 / 60);
                   if (st().hand && !st().hand.won) break;
                 }
                 window.__look(st().casinoX - 380); } },

  // --- the pit and the rift ---------------------------------------------------
  // The books over the pit: the measured rate for every currency the yard has
  // met. It is run for a minute first, because a rate is a thing that takes
  // time to be true -- a board opened on a yard one frame old reads noughts.
  books: { about: 'the pit and the rift', say: 'the books over the pit',
    run: () => { rich(); window.__fast(60); window.__board('stats'); window.__look(st().pitX - 300); } },
  // The tearing: a hole filled past the brim gives way, and everything in it
  // goes at once. Half a second in, which lands this one in the middle of the
  // gulp, which is the part worth looking at. Not `rich()`: its `__tip` fills
  // the hole and tears it during the setup, so the scene would open on a yard
  // that had already had the moment.
  tear: { about: 'the pit and the rift', say: 'the hole giving way',
    run: () => { window.__reset(); window.__crew(3, 3, 5, 7); window.__fullSites();
                 window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
                 window.__meteor(); window.__give(60000); window.__fast(0.5); window.__look(st().pitX - 300); } },
  rift: { about: 'the pit and the rift', say: 'the rift, torn and fed',
    run: () => { rich(); window.__meteor(); window.__rift(); window.__give(60000); window.__give(12000);
                 window.__fast(4); window.__look(st().pitX - 260); } },
  // The torn era, half way along: the disc grown well past its born size,
  // hanging over the mouth and eating what the yard throws at it.
  grown: { about: 'the pit and the rift', say: 'the disc half grown',
    run: () => { rich(); window.__meteor(); window.__tear(400000); window.__give(30000);
                 window.__fast(3); window.__look(st().pitX - 300); } },
  // The rim, as close as the camera will come. `grown` looks at the pit, which
  // puts the disc small and off to one side -- fine for the hole in its yard,
  // not enough to read the shape of the outline. This asks for the camera as
  // far right as it goes; the pan clamps at the end of the world, so the disc
  // sits against the right edge however much further you ask for, and
  // `--zoom 2` is the closest look that still holds the whole of the rim.
  rim: { about: 'the pit and the rift', say: 'the rim, as close as the camera comes',
    run: () => { rich(); window.__meteor(); window.__tear(400000); window.__give(30000);
                 window.__fast(3); window.__look(st().pitX - 155); } },
  // The drowning: a disc at its full size crosses the threshold and gives
  // way; a second before the shot lands this mid-liquefy, with the cutscene's
  // own camera on it.
  drown: { about: 'the pit and the rift', say: 'the disc giving way and drowning',
    run: () => { rich(); window.__meteor(); window.__tear(999500); window.__give(30000); window.__fast(0.6); } },

  // --- the shields ------------------------------------------------------------
  // Each shield: raised and built through, and the rock reaching it (`!`),
  // and the beat the whole arc is for -- the dome up, a rock on the way, and
  // somebody still under the spot it is coming down on. The `!` scenes run
  // the crew's five-second dance through, so the shot is the rock meeting the
  // shield with the cutscene's camera on it rather than the dance before it.
  ...Object.fromEntries(SHIELD_ORDER.flatMap(k => [
    [k, { about: 'the shields', say: `the ${k}, built`, run: () => shieldBuilt(k) }],
    [`${k}!`, { about: 'the shields', say: `the rock reaching the ${k}`,
                run: () => { shieldBuilt(k); window.__next(); window.__fast(4.5); } }]
  ])),
  rescue: { about: 'the shields', say: 'the dome up, a rock coming, somebody under it',
    run: () => { shieldBuilt('dome'); S.buried = true; window.__next(); window.__fast(4.5); } },

  // --- the endgame ------------------------------------------------------------
  // Everything at once, every machine running, for the shape of the whole thing.
  yard: { about: 'the endgame', say: 'the whole works, every machine running',
    run: () => { rich(); lip(); window.__buy('jaw'); window.__finish(); window.__buy('tiller'); window.__finish();
                 window.__buy('ram'); window.__finish(); window.__buy('belt'); window.__finish(); window.__fast(6);
                 window.__look(st().pitX - 400); } },
  // The endgame yard: every machine standing, the ram driven up its ladder,
  // the belt running, the rift torn. What the pass in DESIGN.md is about.
  endgame: { about: 'the endgame', say: 'the endgame yard, everything driven up its ladder',
    run: () => { rich(); lip(); window.__buy('jaw'); window.__buy('tiller');
                 window.__buy('ram'); window.__buy('belt'); window.__jump(30);
                 window.__machine('ram', { driven: true });
                 for (let i = 0; i < 12; i++) { window.__buy('tuneram'); window.__buy('tunebelt'); }
                 window.__meteor(); window.__give(60000); window.__buy('rift');
                 for (let i = 0; i < 14; i++) window.__buy('riftrate');
                 window.__fast(20); window.__look(st().pitX - 700); } }
};

// The names under each part, in ABOUT's order -- what the sheet draws and what
// `look --list` prints.
export const byPart = () =>
  ABOUT.map(about => [about, Object.keys(SCENES).filter(k => SCENES[k].about === about)]);
