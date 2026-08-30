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

const SCENES = {
  // Bodies, wearing everything the school sells, standing where you can see them.
  crew: `window.__reset(); window.__crew(3,2,2,2);
         window.__school({breakers:3,blasters:2,growers:2,carters:2});
         window.__loo(); window.__assign('janitors',1); window.__fast(20);
         window.__look(window.__state().rockLeftX - 420);`,

  // The cut, worked by machine: the jaw on the floor of it and the hoist over.
  quarry: `${RICH} window.__buy('jaw'); window.__look(window.__state().quarryX - 220);`,

  // The plots, and the tractor crossing them.
  farm: `${RICH} window.__buy('tiller'); window.__look(window.__state().farmX - 200);`,

  // The hill, and the ram driving into it.
  rock: `${RICH} window.__buy('ram'); window.__jump(6);
         window.__look(window.__state().rockLeftX - 200);`,

  // Everything at once, every machine running, for the shape of the whole thing.
  yard: `${RICH} window.__buy('jaw'); window.__buy('tiller'); window.__buy('ram');
         window.__look(window.__state().pitX - 400);`,

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

  // A core, for the glow around it. It is the one thing in the yard drawn from a
  // snapped middle rather than a corner, so it is the one thing where being half
  // a cell out shows.
  // Centred on the core itself, not on a landmark near it -- at the zoom this
  // wants, "near" is off the edge of the crop.
  core: `${RICH} window.__drop(); window.__fast(3);
         (c => window.__look(c.x - window.innerWidth / 2))(window.__state().coreItem
           || { x: window.__state().coreHome.x });`,

  // A board, open, with everything on it.
  boards: `${RICH} window.__board('tower');`
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
