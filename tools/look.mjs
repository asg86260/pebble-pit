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
  // Bodies, wearing everything the school sells, standing where you can see them.
  crew: `window.__reset(); window.__crew(3,2,2,2);
         window.__school({breakers:3,blasters:2,growers:2,carters:2});
         window.__loo(); window.__assign('janitors',1); window.__fast(20);
         window.__look(window.__state().rockLeftX - 420);`,

  // The cut, worked by machine: the jaw on the floor of it and the hoist over.
  quarry: `${RICH} window.__buy('jaw'); window.__finish(); window.__look(window.__state().quarryX - 220);`,

  // A building going up: the lab half out of the ground, its barriers and tape
  // round it, and the builder hammering at it throwing grit off each blow.
  //
  // Bought and then deliberately NOT finished -- `__finish` is what every other
  // scene here calls, and it is the one thing that would skip the whole of what
  // this scene is for. It is shot partway through instead, which is the only
  // state the rise, the tape and the hammer exist in.
  build: `${RICH} window.__buy('unlocklab'); window.__fast(35);
          window.__look(window.__state().labX - 380);`,

  // The same, later: far enough on that the building is most of the way up, to
  // see the clip actually moving rather than to trust one frame of it.
  build2: `${RICH} window.__buy('unlocklab'); window.__fast(70);
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

  // One hand on the whole row. This is the shot the row is *for*: a single body
  // stooping over one plot with the other six visibly coming on behind it,
  // rather than one stalk and six patches of bare dirt.
  keeper: `window.__reset(); window.__crew(0,0,0,1);
           window.__levels({plotLevel:6, tendLevel:6}); window.__fast(70);
           window.__look(window.__state().farmX - 200);`,

  // The hill, and the ram driving into it.
  rock: `${RICH} window.__buy('ram'); window.__finish(); window.__jump(6);
         window.__look(window.__state().rockLeftX - 200);`,

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
  // crest come to rest on the mined outline and lie there until a miner throws
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

  // The closet, its roster and its stand. The caps are the one hat in the yard
  // nobody buys -- the shed simply has two of them -- so this is where you look
  // to see that a stock reads the same as a trade: a stand outside the door with
  // a cap on it and a figure over it, one body gone to fetch one, and the post's
  // ordinary two lines under the shed.
  loo: `window.__reset(); window.__crew(0,3); window.__loo();
        window.__assign('janitors',1); window.__fast(30);
        window.__look(window.__state().outhouseX - 260);`,

  // A board, open, with everything on it.
  boards: `${RICH} window.__board('tower');`,

  // The rift: the black hole standing in the air over the near end of the pit,
  // the crater it has eaten in the pile under it, and the grains being pulled
  // round it on their way in. The hole is filled past the brim first so the rift
  // has something to eat, and widened before the dust goes in: a widening is
  // paid in dust, and paid out of the very pile the scene is about.
  // The camera is on the lip, so the ground line the disc breaks is in shot.
  rift: `${RICH} window.__meteor(); window.__give(60000);
         window.__levels({riftLevel: 6}); window.__give(12000);
         window.__fast(4); window.__look(window.__state().pitX - 260);`,

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
  scrubbing: `${RICH} window.__air({open:true, haze:2600, scrubbers:1}); window.__fast(25);
              window.__look(window.__state().scrubX - 300);`,
  // A rider stepping out: taken off the scrubbers while it was up, so it is on
  // its way down under an umbrella and the craft is on its way out of the window.
  brolly: `${RICH} window.__air({open:true, haze:1600}); window.__fast(2);
          window.__buy('balloon'); window.__air({scrubbers:2}); window.__fast(35);
          (c => window.__look(c.x - 400))(window.__state().craft[0]);
          window.__air({scrubbers:0}); window.__fast(2.2);`,
  moored: `${RICH} window.__air({open:true}); window.__fast(2);
           window.__buy('balloon'); window.__fast(2);
           window.__look(window.__state().scrubX - 220);`,
  balloon: `${RICH} window.__air({open:true, haze: 1800}); window.__fast(2);
            window.__buy('balloon'); window.__air({scrubbers:2}); window.__fast(30);
            window.__look(window.__state().craft[0].x - 380);`,

  // The sky at four levels. The haze has the whole window now rather than a
  // strip along the top of it -- see DESIGN.md, "The sky is the band".
  sky0: `${SKYAT} window.__air({haze: 0}); window.__fast(8);`,
  sky1: `${SKYAT} window.__air({haze: 900}); window.__fast(8);`,
  sky2: `${SKYAT} window.__air({haze: 2100}); window.__fast(8);`,
  sky3: `${SKYAT} window.__air({haze: 4200}); window.__fast(8);`
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
