// A look at the yard, in about ten seconds.
//
//   node tools/look.mjs crew          # the crew, hats and all
//   node tools/look.mjs quarry        # the cut, the jaw and the hoist
//   node tools/look.mjs farm          # the plots and the tiller
//   node tools/look.mjs rock          # the hill and the ram
//   node tools/look.mjs yard          # the whole works, machines running
//   node tools/look.mjs crew,farm     # several at once
//   node tools/look.mjs crew --out x  # somewhere other than shots/
//   node tools/look.mjs crew --zoom 4 # crop to the middle and blow it up
//
// It wants a dev server; set GAME to it (`GAME=http://localhost:5233/`).
//
// Why this exists: most of what gets changed in this game is *drawing*, and the
// two test tiers have almost nothing to say about drawing. Waiting four minutes
// for a suite that cannot see a hat, to find out whether a hat sits right, is
// the slowest possible way to answer the question -- and the answer was always
// going to be "look at it" anyway.
//
// So: scenes. Each one sets the yard up the way you would have to set it up by
// hand, points the camera at the thing, and writes a png. Nothing here is a
// check and nothing here passes or fails. It is a window.
//
// It needs a dev server (`npm run dev`, or set GAME) and drives the same
// headless shell `tools/headless.mjs` uses, so there is nothing to install.

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

// Each scene is one expression, run in the page. `__` handles are the same ones
// the checks use -- see hooks.js -- so a scene is exactly what you would type
// into the console.
const RICH = `window.__reset(); window.__crew(3,3,5,7); window.__fullSites();
  window.__grant({sparks:999,shards:999,spores:999,cores:9}); window.__tip(90000);`;

// The lip bought out: every rung of the crew's own gear and a cart for every
// pair of hands, which is what the belt is gated behind. `__fullSites` does the
// same for the cut, the field and the rock, but carrying has no site to fill.
const LIP = `window.__levels({haulCarryLevel:5, haulPaceLevel:5, harnessLevel:5,
  bootsLevel:5}); window.__school({carters:6});`;

// A sky to look at, at whatever level the scene sets. The camera on the middle
// of the works, so the yard is in shot under it.
//
// Each of these runs eight seconds after setting the level, and that is not
// padding: `fillSky` mints a wound-up sky at the *top* of the window and the
// band eases each speck down to its own slot over `SMOG_SINK`. Shot on the next
// frame, every scene came out heavy at the top and thin at the ground -- a
// picture of a sky still falling into place, which read exactly like a bug in
// the thing being looked at.
const SKYAT = `${RICH} window.__look(window.__state().rockLeftX - 300);`;


const SCENES = {
  // The call to build the bench, standing over the bare patch it will go on.
  // The first thing a player is ever asked to press -- see raise.js -- so this
  // is a picture of an empty yard with one button in it.
  call: `window.__reset(); window.__crew(1); window.__give(100); window.__fast(2);
         window.__look(window.__state().benchX - 380);`,

  // ...and the same patch nine seconds after it was pressed: the fence, the
  // tape, the bar, the one body swinging at it, and as much of the bench as has
  // actually gone up.
  benchup: `window.__reset(); window.__crew(1); window.__give(100); window.__fast(2);
            requestAnimationFrame(() => {
              document.getElementById('raise').click();
              window.__fast(12);
              window.__look(window.__state().benchX - 380);
            });`,

  // Bodies, wearing everything the school sells, standing where you can see them.
  crew: `window.__reset(); window.__crew(3,2,2,2);
         window.__school({breakers:3,blasters:2,growers:2,carters:2});
         window.__loo(); window.__assign('janitors',1); window.__fast(20);
         window.__look(window.__state().rockLeftX - 420);`,

  // The question mark a held body says. Hovered for real -- the pause and the
  // mark come off `pointermove` in pointer.js, and there is no hook that puts
  // the mark up -- so the camera is put on the body first and the pointer sent
  // to where it then stands.
  asking: `window.__reset(); window.__crew(3,2,2,2);
           window.__school({breakers:3,blasters:2,growers:2,carters:2});
           window.__fast(20);
           // In a frame, not now: the runner turns a whole second of clock after
           // a scene and the hold is only nine hundred milliseconds, so a hover
           // sent from here would have lapsed by the time of the shot -- and the
           // body would have walked out from under it besides. The camera and the
           // pointer are both put on the body as that frame opens.
           requestAnimationFrame(() => {
             const d = window.__state().crewDetail[0].split('|');
             const wx = Number(d[2]), wy = Number(d[7].slice(1));
             window.__look(wx - 400 / window.__state().zoom);
             const s = window.__state();
             document.getElementById('c').dispatchEvent(new PointerEvent('pointermove', {
               clientX: (wx - s.camX) * s.zoom, clientY: (wy - s.camY) * s.zoom,
               pointerId: 1, isPrimary: true, button: 0, buttons: 0, bubbles: true }));
           });`,

  // The cut, worked by machine: the jaw on the floor of it and the hoist over.
  quarry: `${RICH} window.__buy('jaw'); window.__finish(); window.__look(window.__state().quarryX - 220);`,

  // The jaw's smoke, well into its climb: run the machine half a minute so the
  // plume has puffs at every age, then look at the air over the cut. What this
  // is for is the shape of the climb -- a cone that dissolves, not a column.
  // (wave7-sky, A1.)
  plume: `${RICH} window.__buy('jaw'); window.__finish(); window.__fast(30);
          window.__look(window.__state().quarryX - 220);`,

  // The offer aura (wave7-ui): a rich yard where every open board has something
  // affordable, so the stations breathe their dashed outline. Shot at the lab,
  // with the bench in frame too.
  aura: `${RICH} window.__give(50000); window.__fast(1);
         window.__look(window.__state().farmShed.x - 60);`,

  // The offer flag on the house-and-bench cluster. No big __give here: filling
  // the hole tears it, and the tear cutscene's camera overrides __look for
  // every frame after, which frames every shot on the rift instead.
  flag: `window.__reset(); window.__crew(3,3,5,7); window.__fullSites();
         window.__grant({sparks:999,shards:999,spores:999,cores:9,dust:5000});
         window.__fast(2); window.__look(4930);`,

  // The raise, caught halfway. A flag does not appear: the mast slides out of
  // the roofline over FLAG_RAISE_MS and the cloth is run up it over
  // FLAG_HOIST_MS. Both scenes set a yard that can afford nothing, then pay for
  // it in a frame -- the grant has to land AFTER the runner's own second of
  // clock, or the raise is long over by the shot -- and turn the handle by just
  // enough that the next frame drawn is the middle of the move. The draw reads
  // its own clock, so the fraction is exactly the number of seconds asked for
  // here, not whatever the machine happened to manage.
  flagraise: `window.__reset(); window.__crew(3,3,5,7); window.__fullSites();
              window.__fast(2); window.__look(4930);
              requestAnimationFrame(() => {
                window.__grant({sparks:999,shards:999,spores:999,cores:9,dust:5000});
                window.__fast(0.3);
              });`,

  flaghoist: `window.__reset(); window.__crew(3,3,5,7); window.__fullSites();
              window.__fast(2); window.__look(4930);
              requestAnimationFrame(() => {
                window.__grant({sparks:999,shards:999,spores:999,cores:9,dust:5000});
                window.__fast(0.95);
              });`,

  // The assignment ring (wave7b-assign): a body held over the farm, so the
  // station under it wears the steady solid ring while the offer auras breathe
  // around it. The held body hangs off the cursor; __hold is the same lift.
  // A smaller crew than RICH's: the rich yard fills every plot, and a full
  // station is exactly the one that must NOT ring.
  assign: `window.__reset(); window.__crew(3,3,2,2); window.__give(50000);
           window.__levels({plotLevel: 4}); window.__fast(1);
           var fs = window.__state().farmShed;
           window.__hold(0, fs.x + fs.w / 2, fs.y + fs.h / 2);
           window.__look(fs.x - 60);`,

  // A building going up: the lab half out of the ground, its barriers and tape
  // round it, and the builder hammering at it throwing grit off each blow.
  //
  // Bought and then deliberately NOT finished -- `__finish` is what every other
  // scene here calls, and it is the one thing that would skip the whole of what
  // this scene is for. It is shot partway through instead, which is the only
  // state the rise, the tape and the hammer exist in.
  build: `${RICH} window.__buy('unlockapothecary'); window.__fast(35);
          window.__look(window.__state().apothecaryX - 380);`,

  // The same, later: far enough on that the building is most of the way up, to
  // see the clip actually moving rather than to trust one frame of it.
  build2: `${RICH} window.__buy('unlockapothecary'); window.__fast(70);
           window.__look(window.__state().apothecaryX - 380);`,

  // wave7b-build: the build yard proper -- the construction bench open, a
  // second post bought, two builders hired, and the lab and the school rising
  // AT ONCE, each with its own fence, bar and hammering body. Shot mid-rise
  // for the same reason `build` is.
  build3: `${RICH} window.__jump(2); window.__buy('unlockbuildbench'); window.__finish();
           window.__buy('buildposts'); window.__assign('builders',1);
           window.__assign('builders',1);
           window.__buy('unlocklab'); window.__buy('unlockschool');
           window.__fast(30); window.__look(window.__state().labX - 700);`,

  // ...and the trestle itself, with a build queued and NO builder hired: the
  // fenced footprint standing with its bar empty is the picture of waiting.
  build4: `${RICH} window.__jump(2); window.__buy('unlockbuildbench'); window.__finish();
           window.__buy('unlocklab'); window.__fast(20);
           window.__look(window.__state().labX - 380);`,

  // The plots, and the tractor crossing them.
  farm: `${RICH} window.__buy('tiller'); window.__finish(); window.__look(window.__state().farmX - 200);`,

  // The apothecary: the cauldron on its fire, a stirrer at it, and steam off the
  // pot to say it is on the boil. The farm is opened first (the pot stands right
  // past it), the pot set to a tonic, and a body put on it -- so the scene is a
  // pot being worked, which is the only state the steam exists in.
  apothecary: `window.__reset(); window.__crew(0, 1, 0, 2);
    window.__grant({ cores: 3, dust: 8000, spores: 3000, shards: 300 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    window.__pot('stew'); window.__assign('stirrers', 1);
    window.__fast(16);
    window.__look(window.__state().apothecaryX - 400);`,

  // The apothecary with an upgrade on the go: the site's own bar, which hangs
  // over the hut -- the building -- not over the middle of the plot.
  apothbar: `window.__reset(); window.__crew(0, 1, 0, 2);
    window.__grant({ cores: 3, dust: 60000, spores: 3000, shards: 300 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    window.__buy('brewspeed'); window.__fast(4);
    window.__look(window.__state().apothecaryX - 300);`,

  // The pot row up close: four boiling pots with their bars up, for where the
  // bar hangs against the steam. Same setup as `apothpots`, camera on the pots
  // instead of the building.
  potbars: `window.__reset(); window.__crew(1, 4, 0, 2);
    window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    window.__brews(5);               // a second pot is only offered after five batches
    window.__buy('anotherpot'); window.__finish();
    window.__buy('anotherpot'); window.__finish();
    window.__buy('anotherpot'); window.__finish();
    window.__assign('stirrers', 4);
    window.__pot('stew'); window.__pot('brace', 1); window.__pot('strong', 2); window.__pot('stew', 3);
    window.__fast(30);
    window.__look(window.__state().apothecaryX + 60);`,

  // Track F1: the whole building at its widest -- the hut, the bookshelf with
  // stock standing on all three shelves, and four pots each on a brew of its
  // own, so the flames read as three different colours side by side. This is the
  // shot the rework is for.
  apothpots: `window.__reset(); window.__crew(1, 4, 0, 2);
    window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    window.__brews(5);               // a second pot is only offered after five batches
    window.__buy('anotherpot'); window.__finish();
    window.__buy('anotherpot'); window.__finish();
    window.__buy('anotherpot'); window.__finish();
    window.__assign('stirrers', 4);
    window.__pot('stew', 0); window.__pot('brace', 1);
    window.__pot('strong', 2);   // and the fourth left unset, for the empty block
    window.__fast(50);
    window.__look(window.__state().apothecaryX - 320);`,

  // The rack of stock, stocked, with the camera on it and the pots left cold --
  // four fires burning beside it are four things pulling the eye off the thing
  // being looked at. Mixed on purpose: a full plank, a couple, and one over the
  // cap, so one shot carries both readings the rack has to make -- bottles you
  // count, and the numeral that takes over once there are more of them than the
  // plank can stand. See `drawShelves` in render/apothecary.js.
  apothshelf: `window.__reset(); window.__crew(1, 4, 0, 2);
    window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    window.__brews(5);               // a second pot is only offered after five batches
    window.__buy('anotherpot'); window.__finish();
    window.__buy('anotherpot'); window.__finish();
    window.__buy('anotherpot'); window.__finish();
    window.__stock('stew', 5); window.__stock('brace', 12);
    window.__stock('strong', 999);
    window.__fast(3); window.__look(window.__state().apothecaryX - 320);`,

  // The apothecary's board, which is the building's figures and nothing about
  // what any one pot is brewing -- that is set at the pot now. Three sections:
  // how the place is run, how well it runs, and how deep each recipe goes.
  apothboard: `window.__reset(); window.__crew(1, 4, 0, 2);
    window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    window.__look(window.__state().apothecaryX - 320);
    window.__board('apothecary');`,

  // The picker at the pot (item 17): the cursor standing at the second cauldron,
  // its list of brews dropped open over it as swatches. No press -- a real
  // pointermove on the canvas at the pot's own spot, because standing at a pot is
  // what opens it and there is no hook that puts the list up, nor should there
  // be. A press opens it too; that path is the touchscreen's, and the browser
  // check covers it.
  apothpick: `window.__reset(); window.__crew(1, 4, 0, 2);
    window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    window.__brews(5);               // a second pot is only offered after five batches
    window.__buy('anotherpot'); window.__finish();
    window.__buy('anotherpot'); window.__finish();
    window.__pot('stew', 0); window.__pot('brace', 1);
    window.__look(window.__state().apothecaryX - 200);
    (() => {
      const s = window.__state(), b = window.__potSpot(1);
      const x = (b.x + b.w / 2 - s.camX) * s.zoom;
      const y = (b.y + b.h / 2 - s.camY) * s.zoom;
      const c = document.getElementById('c');
      c.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y,
        pointerId: 1, isPrimary: true, button: 0, buttons: 0, bubbles: true }));
    })();`,

  apothbuff: `window.__reset(); window.__crew(3,2,2,2);
         window.__school({breakers:3,blasters:2,growers:2,carters:2});
         window.__loo(); window.__assign('janitors',1); window.__fast(20);
         window.__dose('rockhand', 'brace'); window.__dose('janitor', 'strong');
         window.__look(window.__state().rockLeftX - 420);`,

  // F4 (item 6): the same buff on bodies that are WALKING, which is where it
  // used to come apart -- the plume was let go into the yard, so a body trailed
  // it behind in a streak as long as its pace and pointing whichever way it was
  // going. Haulers cross the whole yard between the rock and the lip, so a shot
  // of the run catches them going both ways at once, and the one under two
  // tonics says the two colours still read apart while it moves.
  buffwalk: `window.__reset(); window.__crew(2, 5);
         window.__dose('hauler', 'brace'); window.__dose('hauler', 'strong');
         window.__dose('rockhand', 'stew'); window.__fast(12);
         window.__look(window.__state().pitX - 620);`,

  // F4 (item 21): the celebration. A rock is taken off and the gang have the
  // ground to themselves for five seconds -- which is now straight jumps and
  // nothing else, so what a still frame should show is bodies at different
  // heights over one line of ground rather than a row of squares wandering
  // sideways. Each body rolls its own tempo, so no two are at the same height.
  dance: `window.__reset(); window.__crew(3, 4); window.__fast(3);
          window.__next(); window.__fast(1.2);
          window.__look(window.__state().rockLeftX - 300);`,

  // F4 (item 19): crits landing. The roll is forced on and the rockhands are
  // left to work, so every swing in shot is a crit -- a ring going out, the
  // specks the blow threw, and the fountain of real dust over the top of it. A
  // single swing by hand is no good here: the runner gives every scene a second
  // before the shot and a ring is over in a third of one, so the yard has to be
  // making them while the picture is taken.
  crit: `window.__reset(); window.__crew(3, 0); window.__levels({pickLevel: 5,
         rockhandSpeedLevel: 5, rockhandPickLevel: 5});
         window.__crit(true); window.__fast(6);
         window.__look(window.__state().rockLeftX - 260);`,

  // One hand on the whole row. This is the shot the row is *for*: a single body
  // stooping over one plot with the other six visibly coming on behind it,
  // rather than one stalk and six patches of bare dirt.
  keeper: `window.__reset(); window.__crew(0,0,0,1);
           window.__levels({plotLevel:6, tendLevel:6}); window.__fast(70);
           window.__look(window.__state().farmX - 200);`,

  // The hill, and the ram driving into it.
  rock: `${RICH} window.__buy('ram'); window.__finish(); window.__jump(6);
         window.__look(window.__state().rockLeftX - 200);`,

  // The gang's hut off the rock's left flank, with the helmets on the stand
  // outside it and the bench out behind. The ram is bought and the rock jumped
  // on, because the clearance between the hut's wall and a parked ram at a big
  // boulder is the one thing about this layout that arithmetic cannot settle.
  shack: `${RICH} window.__school({breakers:3}); window.__shack(); window.__buy('ram'); window.__finish(); window.__jump(8);
          window.__fast(6); window.__look(window.__state().shackX - 400);`,

  // Everything at once, every machine running, for the shape of the whole thing.
  yard: `${RICH} ${LIP} window.__buy('jaw'); window.__finish(); window.__buy('tiller'); window.__finish();
         window.__buy('ram'); window.__finish(); window.__buy('belt'); window.__finish(); window.__fast(6);
         window.__look(window.__state().pitX - 400);`,

  // The belt, which is the one machine that is long rather than tall: a run of
  // trestles from the rock to the lip, its tender standing at the hole end, and
  // the ground under it being swept into it. Bought and running -- it has no
  // switch anywhere in the game: a machine runs when somebody is standing at it.
  // Deliberately not built on RICH: that tips ninety thousand dust into the hole,
  // and a full hole stops the belt exactly as it stops a gang, so the scene came
  // out with a stopped-station triangle over an empty band. It gets the coins and
  // the sites it needs and leaves the hole room to take what the belt brings.
  belt: `window.__reset(); window.__crew(3,3,5,7); window.__fullSites();
         window.__grant({sparks:999, shards:999, spores:999}); ${LIP}
         window.__buy('ram'); window.__finish(); window.__buy('belt'); window.__finish();
         window.__jump(4); window.__fast(12);
         window.__clearFloor();
         window.__look(window.__state().pitX - 620);`,

  // The two marks that hang under a station: the stopped triangle and the offer
  // diamond. Both want a station whose pile has filled and which has something
  // to sell, so the yard is run for a while with nobody to carry anything away.
  marks: `${RICH} window.__assign('carters', -9); window.__fast(240);
          window.__look(window.__state().farmX - 300);`,

  // The bare strip in front of the hill, which is where dust was never allowed
  // to lie. Grains are tipped straight onto the ground either side of the rock.
  apron: `${RICH} window.__jump(4);
          (x => { for (let d = -260; d < 260; d += 12) window.__pile(x + d, 60); })
            (window.__state().rockLeftX);
          window.__fast(4); window.__look(window.__state().rockLeftX - 340);`,

  // Dust lying on the hill itself, which is ground now: grains dropped over the
  // crest come to rest on the mined outline and lie there until a rockhand throws
  // them on the heap. Nobody is mining in this one, so it stays put to be looked
  // at.
  crest: `window.__reset(); window.__jump(6); window.__fast(2);
          (s => { for (let c = 6; c < s.gw - 6; c++) window.__pileRock(s.rockLeftX + c * 6 + 3, 3); })
            (window.__state());
          window.__fast(1); window.__look(window.__state().rockLeftX - 180);`,

  // A core, for the glow around it. It is the one thing in the yard drawn from a
  // snapped middle rather than a corner, so it is the one thing where being half
  // a cell out shows.
  // Centred on the core itself, not on a landmark near it -- at the zoom this
  // wants, "near" is off the edge of the crop.
  core: `${RICH} window.__drop(); window.__fast(3);
         (c => window.__look(c.x - window.innerWidth / 2))(window.__state().coreItem
           || { x: window.__state().coreHome.x });`,

  // The outhouse, its roster and its stand. The caps are the one hat in the yard
  // nobody buys -- the shed simply has two of them -- so this is where you look
  // to see that a stock reads the same as a trade: a stand outside the door with
  // a cap on it and a figure over it, one body gone to fetch one, and the post's
  // ordinary two lines under the shed.
  loo: `window.__reset(); window.__crew(0,3); window.__loo();
        window.__assign('janitors',1); window.__fast(30);
        window.__look(window.__state().outhouseX - 260);`,

  // --- Track F2: the yard's furniture ---------------------------------------
  // The two shacks, side by side in one frame: the field's with its trough and
  // the cut's with the timber over its door. Nothing else in the list frames
  // both -- `quarry` and `farm` each look at the work rather than at the shed
  // beside it -- and the whole question about a shack is whether it reads as a
  // different building from the other one.
  shacks: `${RICH} window.__look(window.__state().farmShed.x - 60);`,

  // The same frame with a work on the go at both sites: a bench being cut and a
  // plot being broken, so each shack has its bar over it. This is the scene for
  // where a site's bar hangs -- `quarry` and `farm` finish their builds, so
  // neither ever shows one.
  sitebars: `window.__reset(); window.__crew(3,3,3,3);
    window.__grant({dust:99999, shards:999, spores:9999, sparks:999});
    window.__buy('unlockquarry'); window.__finish();
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('quarrybench'); window.__buy('farmplot'); window.__fast(6);
    window.__look(window.__state().farmShed.x - 60);`,

  // A finished work's tick, over a station that is not the lab: the quarry's
  // bench lands and the shack wears the mark until its board is read.
  donemark: `window.__reset(); window.__crew(3,3);
    window.__grant({dust:99999, shards:99, spores:9999, cores:9});
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockquarry'); window.__finish();
    window.__buy('quarrybench'); window.__finish(); window.__fast(2);
    window.__look(window.__state().quarryX - 300);`,

  // A trade mid-teaching: the school with its own bar over it, and a body at
  // it. The one site that had no bar at all while its rows were the yard's.
  schoolbar: `window.__reset(); window.__crew(3,3);
    window.__grant({dust:99999, shards:99, cores:9});
    window.__buy('unlockschool'); window.__finish();
    window.__buy('breaker'); window.__fast(4);
    window.__look(window.__state().schoolX - 300);`,

  // The far end of the walk: the tower, the star beside it and the ground under
  // the star, which is where item 10 put them. The star wants the meteor open or
  // there is nothing up there to look at.
  westend: `${RICH} window.__meteor(); window.__fast(3);
            window.__look(window.__state().towerX - 420);`,

  // The outhouse with its board up: the shed with the moon on the door, the
  // broom standing beside it, and the janitor's own rungs on the sheet. The
  // shed has to be up first -- the board arrives with the building.
  looboard: `window.__reset(); window.__crew(3,2); window.__loo();
             window.__give(20000); window.__board('outhouse');
             (s => window.__look(s.outhouseX + 21 - s.viewW / 2))(window.__state());`,

  // The tower with its offer flag up. The flag's own scene, because the tower is
  // the one station whose stand box is wider than the thing the pole stands on:
  // shaft plus turret, so the middle of the box is nowhere near the point. The
  // camera is set *after* the run -- __fast lets it drift back to the crew, and
  // a scene about a roof wants the roof in shot.
  // Calling the meteor down pans the camera off to it, and the harness runs a
  // second of the yard after the scene -- so a camera set here has wandered by
  // the time the shot is taken. Pin it every frame instead.
  towerflag: `${RICH} window.__meteor(); window.__fast(3);
              (x => { const pin = () => { window.__look(x);
                        requestAnimationFrame(pin); }; pin(); })
              (window.__state().towerX - 361);`,

  // A board, open, with everything on it.
  boards: `${RICH} window.__board('tower');`,

  // The three boards whose headings name a trade or a purchase rather than a
  // place -- the shack's "rock miners", the house's "housing" and "crew gear",
  // the school's four trades. Headings are the only thing these shots are for,
  // and no suite can read one, so they are shot rather than asserted.
  // The shack against the rock, at both ends of the rock's growth: the walk
  // leaves it exactly the room `rockSize` needs off its flank and no more, so
  // these two are what "no more" looks like at boulder one and at the ceiling.
  // Jumped and then run, the same as the `shack` scene above: RICH leaves the
  // first rock still falling and nine cores tearing the rift, and neither of
  // those is a flank to stand a hut against.
  shackrock: `${RICH} window.__school({breakers:3}); window.__shack(); window.__jump(1);
              window.__fast(6); window.__look(window.__state().shackX - 200);`,
  shackrockbig: `${RICH} window.__school({breakers:3}); window.__shack(); window.__jump(30);
                 window.__fast(6); window.__look(window.__state().shackX - 200);`,

  shackboard: `${RICH} window.__school({breakers:3}); window.__shack(); window.__board('shack');`,
  houseboard: `${RICH} window.__crew(3,2,2,2); window.__board('house');`,
  schoolboard: `${RICH} window.__school({breakers:3,carters:1}); window.__board('school');`,

  // Track F3 (wave5). The bench, which is the longest board in the game: every
  // heading, the pips under every ladder, and the clocks in the bills of the
  // rows that have to be built. This is the shot for the pips and for the clock
  // icon -- both of them are three or four pixels of a row, and this is the only
  // place several of each stand together to be compared.
  bench: `${RICH} window.__board('bench');`,

  // The block's board: the door through to the people, the row that puts
  // another one up, and the gear the crew own that stands out in the yard --
  // the belt, its tuning and the multiplier over their pace. What they carry
  // and how fast they walk is not on it; that is fitted at the workbench and
  // sold there, so this is the shot for whether the sheet still reads as a
  // board with the four rungs gone off it.
  houseboard: `${RICH} window.__board('house');
               window.__look(window.__state().houses[0].x - 320);`,

  // And the books over the pit: the measured rate for every currency the yard
  // has met. It is run for a minute first, because a rate is a thing that takes
  // time to be true -- a board opened on a yard one frame old reads noughts.
  books: `${RICH} window.__fast(60); window.__board('stats');
          window.__look(window.__state().pitX - 300);`,

  // The abyss: the drowned pit's liquid standing under the brim, the plank
  // over the mouth, and the grains diving to the surface. The hole is filled
  // past the brim first so the abyss has something to eat, and widened before
  // the dust goes in: a widening is paid in dust, and paid out of the very
  // pile the scene is about. The camera is on the lip, so the air between the
  // brim and the surface is in shot.
  // The pot on the ground beside the wheel. The table's own plot of sand is
  // measured off whatever stands next along on the casino's right, and it once
  // came back one column wide -- a hundred-grain stake put twenty grains down
  // and the rest were simply not there. A stake this size is a heap you can
  // read the width of at a glance, which is what the scene is for.
  casino: `window.__reset(); window.__casino(true); window.__give(6000);
           window.__buy('stakedust'); window.__fast(3);
           window.__look(window.__state().casinoX - 380);`,

  rift: `${RICH} window.__meteor(); window.__rift(); window.__give(60000);
         window.__give(12000);
         window.__fast(4); window.__look(window.__state().pitX - 260);`,

  // The torn era, half way along: the disc grown well past its born size,
  // hanging over the mouth and eating what the yard throws at it.
  grown: `${RICH} window.__meteor(); window.__tear(400000); window.__give(30000);
          window.__fast(3); window.__look(window.__state().pitX - 300);`,

  // The rim, as close as the camera will come. `grown` looks at the pit, which
  // puts the disc small and off to one side -- fine for the hole in its yard,
  // not enough to read the shape of the outline. This asks for the camera as
  // far right as it goes; the pan clamps at the end of the world, so the disc
  // sits against the right edge however much further you ask for, and `--zoom 2`
  // is the closest look that still holds the whole of the rim.
  rim: `${RICH} window.__meteor(); window.__tear(400000); window.__give(30000);
        window.__fast(3); window.__look(window.__state().pitX - 155);`,


  // The drowning: a disc at its full size crosses the threshold and gives
  // way; the runner's second before the shot lands this mid-liquefy, with
  // the cutscene's own camera on it.
  drown: `${RICH} window.__meteor(); window.__tear(999500); window.__give(30000);
          window.__fast(0.6);`,

  // The tearing: a hole filled past the brim gives way, and everything in it
  // goes at once. No `__fast` of its own -- the runner gives every scene a
  // second before the shot, which lands this one in the middle of the gulp,
  // which is the part worth looking at.
  // Not `${RICH}`: its `__tip` fills the hole and tears it during the setup, so
  // the scene would open on a yard that had already had the moment.
  tear: `window.__reset(); window.__crew(3,3,5,7); window.__fullSites();
         window.__grant({sparks:999,shards:999,spores:999,cores:9});
         window.__meteor(); window.__give(60000); window.__fast(0.5);
         window.__look(window.__state().pitX - 300);`,

  // The endgame yard: every machine standing, the ram driven up its ladder, the
  // belt running, the rift torn. What the pass in DESIGN.md is about.
  endgame: `${RICH} ${LIP} window.__buy('jaw'); window.__buy('tiller');
         window.__buy('ram'); window.__buy('belt'); window.__jump(30);
         window.__machine('ram', {driven:true}); window.__tune && 0;
         for (let i = 0; i < 12; i++) { window.__buy('tuneram'); window.__buy('tunebelt'); }
         window.__meteor(); window.__give(60000); window.__buy('rift');
         for (let i = 0; i < 14; i++) window.__buy('riftrate');
         window.__fast(20); window.__look(window.__state().pitX - 700);`,

  // Something being built. Everything past the bench is worked through by the
  // hands at the site now (see works.js), so a purchase has a middle: a bar over
  // the place, filling while the gang is there and stopped while it is not.
  building: `${RICH} window.__buy('jaw'); window.__fast(9);
             window.__look(window.__state().quarryX - 260);`,
  // The bench's own rows are fitted at the bench: one body, carrying, walks
  // over and stands there under the bar while strength is fitted.
  fitting: `window.__reset(); window.__crew(0,1); window.__grant({dust:9000});
            window.__fast(2); window.__buy('carry'); window.__fast(3);
            window.__look(window.__state().benchX - 300);`,
  // ...and how the row reads while it is going on: greyed, saying what it is
  // doing, with the clock in its bill counting down what is left.
  buildboard: `${RICH} window.__buy('jaw'); window.__fast(4);
               window.__board('quarry');`,

  // The scrubbing house with a balloon over it: one moored at the mast with
  // nobody in it, and one crewed and out over the yard.
  // The house working: a filthy sky over it, a body inside, and no river of haze
  // leaning towards the roof -- what a mouth looks like now is a few cells drawn
  // in over the hood, and nothing in the sky is moved at all.
  scrubbing: `${RICH} window.__air({open:true, haze:2600, purifiers:1}); window.__fast(25);
              window.__look(window.__state().scrubX - 300);`,
  // A rider stepping out: taken off the purifiers while it was up, so it is on
  // its way down under an umbrella and the craft is on its way out of the window.
  brolly: `${RICH} window.__air({open:true, haze:1600}); window.__fast(2);
          window.__buy('balloon'); window.__air({purifiers:2}); window.__fast(35);
          (c => window.__look(c.x - 400))(window.__state().craft[0]);
          window.__air({purifiers:0}); window.__fast(2.2);`,
  moored: `${RICH} window.__air({open:true}); window.__fast(2);
           window.__buy('balloon'); window.__fast(2);
           window.__look(window.__state().scrubX - 220);`,
  balloon: `${RICH} window.__air({open:true, haze: 1800}); window.__fast(2);
            window.__buy('balloon'); window.__air({purifiers:2}); window.__fast(30);
            window.__look(window.__state().craft[0].x - 380);`,

  // The sky at four levels. The haze has the whole window now rather than a
  // strip along the top of it -- see DESIGN.md, "The sky is the band".
  // The wind, seen. Dust, haze and a flag in one frame, because the whole claim
  // is that the three of them lean together -- if they do not, that is the bug
  // and it is visible in one picture.
  //
  // The clock is seeded (`__seed` restarts it), and the two times are not round
  // numbers or guesses: they are where the wind actually is strongest each way
  // inside the first eighty seconds, found by running wind.js. That matters,
  // because the field almost never reaches its own peak -- the lull envelope
  // sees to that -- so a shot at a time that merely sounded windy is a shot of
  // a lull. Compare the pair side by side; one shot of weather says nothing,
  // because there is nothing in it to be weather against.
  gustR: `window.__seed(1); window.__crew(3,3,5,7); window.__fullSites();
          window.__grant({sparks:999,shards:999,spores:999,cores:9,dust:5000});
          window.__air({haze: 2100}); window.__fast(64.5);
          window.__look(window.__state().rockLeftX - 300);`,
  gustL: `window.__seed(1); window.__crew(3,3,5,7); window.__fullSites();
          window.__grant({sparks:999,shards:999,spores:999,cores:9,dust:5000});
          window.__air({haze: 2100}); window.__fast(50);
          window.__look(window.__state().rockLeftX - 300);`,

  sky0: `${SKYAT} window.__air({haze: 0}); window.__fast(8);`,
  sky1: `${SKYAT} window.__air({haze: 900}); window.__fast(8);`,
  sky2: `${SKYAT} window.__air({haze: 2100}); window.__fast(8);`,
  sky3: `${SKYAT} window.__air({haze: 4200}); window.__fast(8);`,

  // wave6-sky (item 5): the storm at its four moments. A brim sky is certain to
  // break at the next look, so each scene fills the sky and runs the clock to
  // the part of the storm it is named for: the brew-up's darkness, the drizzle,
  // the full pour, and the taper at the end. The waits are loops on the yard's
  // own readout rather than counted seconds, so the scenes survive retuning.
  rainbrew: `${SKYAT} window.__air({haze: 4200});
    (() => { for (let i = 0; i < 90 && !window.__state().smog.brewing; i++) window.__fast(1); })();
    window.__fast(9);`,
  raindrizzle: `${SKYAT} window.__air({haze: 4200});
    (() => { for (let i = 0; i < 120 && !window.__state().smog.raining; i++) window.__fast(1); })();
    window.__fast(2);`,
  rain: `${SKYAT} window.__air({haze: 4200});
    (() => { for (let i = 0; i < 120 && !window.__state().smog.raining; i++) window.__fast(1); })();
    window.__fast(18);`,
  raintaper: `${SKYAT} window.__air({haze: 4200});
    (() => { for (let i = 0; i < 120 && !window.__state().smog.raining; i++) window.__fast(1); })();
    (() => { for (let i = 0; i < 90 && window.__state().smog.haze > 700; i++) window.__fast(1); })();`
};

const args = process.argv.slice(2);
const outAt = args.indexOf('--out');
const out = outAt >= 0 ? args[outAt + 1] : 'shots';
const zoomAt = args.indexOf('--zoom');
const zoom = zoomAt >= 0 ? args[zoomAt + 1] : null;
const plain = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out' && args[i - 1] !== '--zoom');
const want = (plain[0] || 'yard').split(',').map(s => s.trim()).filter(Boolean);

mkdirSync(out, { recursive: true });

for (const name of want) {
  const scene = SCENES[name];
  if (!scene) {
    console.log(`no scene "${name}". there is: ${Object.keys(SCENES).join(', ')}`);
    continue;
  }
  const file = `${out}/${name}.png`;
  const r = spawnSync(process.execPath,
    // Set the scene, run a second of the yard so everything that animates is
    // somewhere sensible, then wait for two frames to actually paint. Without
    // that wait the shot is taken between the state change and the draw, and
    // every scene came out a blank white page.
    ['tools/headless.mjs', '--shot', file,
      `(() => { ${scene} window.__fast(1);
        return new Promise(r => requestAnimationFrame(
          () => requestAnimationFrame(() => r(1)))); })()`],
    { encoding: 'utf8', env: { ...process.env, ...(zoom ? { ZOOM: zoom } : {}) } });
  const bad = /EXCEPTION[^\n]*/.exec(r.stdout || '');
  console.log(bad ? `${name}: ${bad[0]}` : `${name}: ${file}`);
}
