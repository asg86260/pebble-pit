// Act 3's crowds, God and the camera's zoom (render/aftercrowd.js, view.js's
// afterlife camera; the round 3 crowd mock, docs/mocks/act3-crowd-2026-10-18).
// The drawing is asked through a sheet that counts what it is told to fill:
// no check here can see a picture, so what is checked is what a picture costs
// and what it is drawn from. The crowd's shape is set through the act's hook
// (`__afterCrowd`), the setup these checks are not about; a slot set to 9 is
// a member already gone, with no walk.
import { group, ok, run, yard } from './helpers.mjs';
import { CROWD_FILES, CROWD_PITCH, CROWD_X0, CROWD_NEAR_RATE, STRIKE_SHARE, AFTER_FLOOR_MARGIN, GOD_FAR } from '../src/config.js';
import { afterFloor } from '../src/after/place.js';
import { stepAfter } from '../src/after/index.js';
import { paintOn } from '../src/render/ctx.js';
import { drawAfterCrowd, drawCampCrowd, crowdDrawn, glareAlpha, oursMass, arrived } from '../src/render/aftercrowd.js';
import { afterEnd, godScaleAt } from '../src/view.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const up = () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  run(1);
};
// A crowd of `n`, a soul's rim by `fn(i)`, stood up in place of the seeded one.
function crowd(n, fn = () => 0) {
  let s = '';
  for (let i = 0; i < n; i++) s += String(fn(i));
  S.after.rims = s;
}
// One frame of both crowds drawn on a sheet that counts its fills and blits.
function draw() {
  let fills = 0;
  const g = new Proxy({}, {
    get: (o, k) => (k === 'fillRect' || k === 'drawImage' ? () => { fills++; } : k in o ? o[k] : () => ({})),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  paintOn({ getContext: () => g, width: S.W, height: S.H }, () => { drawCampCrowd(); drawAfterCrowd(); });
  return fills;
}
// The window's middle put on `x`, and the frame it is framed on.
const lookAt = x => { window.__look(x - S.viewW / 2); run(1 / 30); };

group('a big crowd draws only its files in view, and costs the frame what a small one does', async () => {
  up();
  crowd(1200);
  lookAt(CROWD_X0 + CROWD_FILES * CROWD_PITCH / 2);
  draw(); run(1);
  const small = draw();
  crowd(24000, i => (i % 7 === 0 ? 9 : i % 5 === 0 ? 2 : 0));
  run(1); draw(); run(1);
  const big = draw();
  const d = crowdDrawn();
  const most = Math.ceil(S.viewW / (CROWD_PITCH * CROWD_NEAR_RATE[1])) + 4;
  window.__actsOn(null);
  return [
    ok(d.files <= Math.min(CROWD_FILES, most), 'each row walks only the files in view', `${d.files} files of ${CROWD_FILES}, ${most} at most`),
    ok(big < small * 1.5 + 50, 'twenty times the crowd is about the same fills', `${small} -> ${big}`),
    ok(big < 6000, 'and a bounded few thousand at most', `${big}`)
  ];
});

group('a 24,000-soul crowd steps and draws under a millisecond a frame', async () => {
  up();
  crowd(24000, i => (i % 9 === 0 ? 9 : i % 4 === 0 ? 1 : 0));
  lookAt(CROWD_X0 + CROWD_FILES * CROWD_PITCH * 0.6);
  run(1); draw();
  const FR = 300;
  const t0 = performance.now();
  for (let k = 0; k < FR; k++) { stepAfter({ now: 0, dt: 1000 / 60 }); draw(); }
  const ms = (performance.now() - t0) / FR;
  window.__actsOn(null);
  return [ok(ms < 1, `the afterlife's step and both crowds' drawing with 24000 souls stay under a millisecond a frame`, `${ms.toFixed(3)} ms`)];
});

group('the view zooms toward the throne, and the camp end stays at the place\'s own zoom', async () => {
  up();
  lookAt(CROWD_X0 - 200);
  const camp = S.zoom;
  lookAt(CROWD_X0 + (afterEnd() - CROWD_X0) * 0.5);
  const mid = S.zoom;
  lookAt(afterEnd());
  const end = S.zoom, endTop = S.camY, restTop = afterFloor() + AFTER_FLOOR_MARGIN - S.viewH;
  const cx = S.camX + S.viewW / 2;
  // Held there frame after frame: the middle is the one fact the zoom reads.
  run(1);
  const held = Math.abs(S.camX + S.viewW / 2 - cx) < 1 && S.zoom === end;
  lookAt(CROWD_X0 - 200);
  const back = S.zoom;
  window.__actsOn(null);
  return [
    ok(end > camp * 1.5, 'the zoom at the throne end is well past the camp end\'s', `${camp.toFixed(3)} -> ${mid.toFixed(3)} -> ${end.toFixed(3)}`),
    ok(mid >= camp && mid < end, 'gentle through the crowd, the dive at the far end'),
    ok(endTop < restTop - 1, 'and the view lifts toward the top of the throne', `${endTop.toFixed(0)} over ${restTop.toFixed(0)}`),
    ok(held, 'it holds where it is'),
    ok(back === camp, 'and lets go coming back', `${back}`)
  ];
});

// God far off from the camp: small on the horizon there, growing as the
// view pans, whole at the throne end where the dive meets him face to face.
group('God is small and far from the camp, and grows to his full size at the throne end', async () => {
  up();
  const at = x => { lookAt(x); return godScaleAt(S.camX + S.viewW / 2); };
  const camp = at(CROWD_X0 - 200), front = at(CROWD_X0), mid = at(CROWD_X0 + (afterEnd() - CROWD_X0) * 0.5), end = at(afterEnd());
  window.__actsOn(null);
  return [
    ok(camp === GOD_FAR && front === GOD_FAR, 'from the camp and the crowd\'s front, his far size', `${camp} / ${front}`),
    ok(mid > camp && mid < end, 'growing across the pan', `${camp} -> ${mid.toFixed(3)} -> ${end}`),
    ok(end === 1, 'whole at the throne end', `${end}`)
  ];
});

group('a reload stands the crowd back as it was, and draws it the same', async () => {
  up();
  crowd(24000, i => (i % 11 === 0 ? 9 : i % 6 === 0 ? 3 : 0));
  run(1);
  lookAt(CROWD_X0 + 300);
  draw(); run(2); draw();
  yard.persist();
  const rims = S.after.rims, was = crowdDrawn();
  window.__reload();
  run(1 / 30); draw(); run(3); draw();
  const now = crowdDrawn();
  window.__actsOn(null);
  return [
    ok(S.after.rims.length === rims.length && S.after.rims.slice(0, 4000) === rims.slice(0, 4000), 'every soul\'s rim comes back from the save', `${S.after.rims.length} souls`),
    ok(Math.abs(now.souls - was.souls) <= 2, 'and the near rows draw the same souls', `${was.souls} -> ${now.souls}`)
  ];
});

group('our crowd grows with the share walked out', async () => {
  up();
  const n = 24000;
  const at = share => {
    crowd(n, i => (i < n * share ? 9 : 0));
    lookAt(CROWD_X0 - 300);
    for (let k = 0; k < 40; k++) { run(0.25); draw(); }
    return { arrived: arrived(), souls: crowdDrawn().ours, mass: oursMass() };
  };
  const a = at(0.001), b = at(0.2), c = at(STRIKE_SHARE);
  window.__actsOn(null);
  return [
    ok(a.arrived < b.arrived && b.arrived < c.arrived, 'the members arrived rise with the share', `${a.arrived} ${b.arrived} ${c.arrived}`),
    ok(a.souls > 0 && a.souls < b.souls && a.mass === 0, 'a handful at the start, its near rows only', `${a.souls} souls, mass ${a.mass}`),
    ok(b.mass > 0 && b.mass < c.mass && c.mass >= 0.99, 'then its mass, full at the strike', `${b.mass.toFixed(2)} -> ${c.mass.toFixed(2)}`)
  ];
});

group('God\'s glare dims as support rises, gone at the strike\'s share', async () => {
  up();
  const n = 4000;
  const at = share => { crowd(n, i => (i < n * share ? 9 : 0)); run(1 / 30); return glareAlpha(); };
  const shares = [0, 0.2, 0.4, 0.6, STRIKE_SHARE, 0.9];
  const alphas = shares.map(at);
  window.__actsOn(null);
  const falling = alphas.every((v, i) => i === 0 || v <= alphas[i - 1]);
  return [
    ok(alphas[0] === 1, 'full before anyone has walked out', alphas.map(v => v.toFixed(2)).join(' ')),
    ok(falling && alphas[2] < alphas[1], 'falling as support rises, continuously'),
    ok(alphas[4] === 0 && alphas[5] === 0, 'and zero at the strike\'s share')
  ];
});
