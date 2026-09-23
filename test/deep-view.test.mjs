// The two views (docs/wave-serpent.md, "The two views"): the camera goes down
// into the deep and comes back up by a glide, and the view is the camera's
// and the pointer's alone -- the yard runs the same frames whichever half is
// on the screen. The clicks that start a glide are the browser group `deep`
// (src/selftest/deep.js); here the glide is started the way the click starts
// it, through view.js.

import { group, ok, run, yard } from './helpers.mjs';
import { standing } from './scenes-stand.mjs';

const S = yard.S;
const { goDeep, goUp } = await import('../src/view.js');
const { deepX0, deepX1, deepTop, deepFloor } = await import('../src/deep/place.js');
const { DEEP_SURFACE, VIEW_GLIDE_S, DEEP_FLOOR_MARGIN } = await import('../src/config.js');
const { hopTarget } = await import('../src/hop.js');

// A yard past the snatch: drowned, with a crew at work up top.
function deepYard() {
  window.__crew(3, 3, 5, 7);
  window.__snatch({ played: true });
}

group('going down puts the camera in the deep, and going up brings it back', async () => {
  deepYard();
  run(1);
  const yardCam = { x: S.camX, y: S.camY };
  goDeep();
  const midway = [];
  // The glide is a move, not a cut: the view spends frames between the two.
  for (let i = 0; i < VIEW_GLIDE_S * 60 / 2 - 5; i++) { window.__fast(1 / 60); midway.push(S.view); }
  run(VIEW_GLIDE_S + 1);
  const down = { view: S.view, x: S.camX, y: S.camY, w: S.viewW, h: S.viewH };
  const inside = down.x >= deepX0() && down.x + down.w <= deepX1() && Math.abs(down.y + down.h - (deepFloor() + DEEP_FLOOR_MARGIN)) <= 1;
  const roofShown = down.y <= deepTop() + DEEP_SURFACE;
  goUp();
  run(VIEW_GLIDE_S + 1);
  return [
    ok(midway.every(v => v === 'yard'), 'for the first half of the glide the camera is still in the yard'),
    ok(down.view === 'deep', 'and at the end of it the view is the deep', down.view),
    ok(inside, 'the camera is inside the deep, the floor a band up off the bottom of the window',
       `x ${Math.round(down.x)}..${Math.round(down.x + down.w)} of ${deepX0()}..${deepX1()}, bottom ${Math.round(down.y + down.h)} of ${deepFloor() + DEEP_FLOOR_MARGIN}`),
    ok(roofShown, 'with the underside of the surface on the screen', `top ${Math.round(down.y)}, surface ${deepTop() + DEEP_SURFACE}`),
    ok(S.view === 'yard', 'going up comes back to the yard', S.view),
    ok(Math.abs(S.camY - yardCam.y) < 1, 'with the pit floor on the bottom of the window again',
       `${Math.round(S.camY)} against ${Math.round(yardCam.y)}`)
  ];
});

// The hop glides across the half on screen and never down the shaft: from the
// yard it passes over the deep's stations, from the deep it passes over the
// yard's.
group('a hop keeps to the half on screen', async () => {
  deepYard();
  S.wellOpen = S.fontOpen = true;
  const walk = () => {
    const seen = [];
    let at = S.worldW, to;
    for (let i = 0; i < 40 && (to = hopTarget(-1, at - S.viewW / 2)); i++) { seen.push(to.key); at = to.mid; }
    return seen;
  };
  window.__view('yard');
  const up = walk();
  window.__view('deep');
  const down = walk();
  const DEEP = ['altar', 'well', 'font'];
  return [
    ok(up.length > 0 && !up.some(k => DEEP.includes(k)), 'from the yard, only the yard', up.join(', ')),
    ok(down.length === DEEP.length && down.every(k => DEEP.includes(k)), 'from the deep, only the deep', down.join(', '))
  ];
});

group('a pan in the deep stays in the deep', async () => {
  deepYard();
  window.__view('deep');
  const left = window.__look(-1e6), right = window.__look(1e6);
  return [
    ok(left === Math.round(deepX0()), 'panned all the way left it stops at the deep\'s left edge', `${left}`),
    ok(right + S.viewW <= deepX1() + 1, 'and all the way right at its right edge', `${right + Math.round(S.viewW)} of ${deepX1()}`)
  ];
});

// Everything the sim knows after a stretch of yard, which must not depend on
// where the camera was looking while it ran.
const fingerprint = () => JSON.stringify({
  wound: S.serpentWound, stage: S.serpentStage, scales: S.scales,
  dust: S.dust, rock: S.rock, boulder: S.boulderNo,
  workers: S.workers.map(w => [w.type, Math.round(w.x * 100), Math.round(w.y * 100), w.carry || 0])
});

group('the yard runs the same frames whichever half is on the screen', async () => {
  // The yard's sky is laid out on the yard's window (`skyCam` in view.js),
  // and a window still gliding to where the snatch left it is a different
  // sky from one held still. So the camera is let come to rest first; from
  // there the deep holds the yard's window where it was.
  const from = view => {
    window.__seed(20260923);
    deepYard();
    for (let i = 0; i < 600 && S.camTo != null && Math.abs(S.camTo - S.camX) > 0.5; i++) yard.fast(1 / 60);
    S.camTo = null;
    window.__view(view);
    yard.fast(20);
    return fingerprint();
  };
  const up = from('yard'), down = from('deep');
  return [ok(up === down, 'twenty seconds watched from the deep leave the yard where watching it left it',
             up === down ? '' : `${up.slice(0, 160)}... against ${down.slice(0, 160)}...`)];
}, { reload: false });

// Every scene about the deep stands a yard up, and survives a reload.
standing(['the deep']);
