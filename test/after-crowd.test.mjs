// Act 3's sky: God's crowd filling it, God, and the camera's dive toward him
// (render/aftercrowd.js, after/sky.js, view.js's afterlife camera;
// docs/mocks/act3-skycrowd-2026-10-18, round 2). The drawing is asked through
// a sheet that counts what it is told to fill: no check here can see a
// picture, so what is checked is what a picture costs and what it is drawn
// from. The crowd's shape is set through the act's rims (a slot set to 9 is
// a member already gone, with no walk), the setup these checks are not about.
import { group, ok, run, yard } from './helpers.mjs';
import { STRIKE_SHARE, AFTER_FOCUS_AT } from '../src/config.js';
import { afterFloor, afterOpenX, soulX } from '../src/after/place.js';
import { stepAfter } from '../src/after/index.js';
import { paintOn } from '../src/render/ctx.js';
import { drawSkyCrowd, drawAfterCrowd, crowdDrawn, glareAlpha, raysLeft } from '../src/render/aftercrowd.js';
import { afterEnd } from '../src/view.js';
import { godMid, faceY } from '../src/after/sky.js';

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
// The share of the crowd walked out for `k` of the way to the strike.
const won = (n, k) => crowd(n, i => (i < n * k * STRIKE_SHARE ? 9 : 0));
// One frame of the sky drawn on a sheet that counts its fills and blits.
function draw() {
  let fills = 0;
  const g = new Proxy({}, {
    get: (o, k) => (k === 'fillRect' || k === 'drawImage' ? () => { fills++; } : k in o ? o[k] : () => ({})),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  paintOn({ getContext: () => g, width: S.W, height: S.H }, () => { drawSkyCrowd(); drawAfterCrowd(); });
  return fills;
}
// The window's middle put on `x`, and the frame it is framed on.
const lookAt = x => { window.__look(x - S.viewW / 2); run(1 / 30); };

group('a crowd of any size costs the frame the same bounded fills', async () => {
  up();
  crowd(1200);
  lookAt(afterOpenX());
  draw(); run(1);
  const small = draw();
  crowd(24000, i => (i % 7 === 0 ? 9 : i % 5 === 0 ? 2 : 0));
  run(2); draw(); run(1);
  const big = draw();
  window.__actsOn(null);
  return [
    ok(big < small * 1.5 + 50, 'twenty times the crowd is about the same fills', `${small} -> ${big}`),
    ok(big < 8000, 'and a bounded few thousand at most', `${big}`)
  ];
});

group('a 24,000-soul crowd steps and draws in a couple of milliseconds a frame', async () => {
  up();
  crowd(24000, i => (i % 9 === 0 ? 9 : i % 4 === 0 ? 1 : 0));
  lookAt(afterOpenX());
  run(1); draw();
  const FR = 300;
  const t0 = performance.now();
  for (let k = 0; k < FR; k++) { stepAfter({ now: 0, dt: 1000 / 60 }); draw(); }
  const ms = (performance.now() - t0) / FR;
  window.__actsOn(null);
  return [ok(ms < 2, 'the afterlife\'s step and the whole sky\'s drawing with 24000 souls stay within two milliseconds a frame', `${ms.toFixed(3)} ms`)];
});

// The bands sink as support rises, the far one first (DESIGN.md, "The sky,
// redrawn flat") and give up ground toward God's camp, so fewer souls stand
// in view there, and a low strip of the near band stands at the strike.
group('the crowd thins as support rises', async () => {
  up();
  lookAt(soulX(20));
  const at = k => { won(4000, k); run(2); draw(); draw(); const d = crowdDrawn(); return { souls: d.souls, cells: d.cells }; };
  const steps = [0.05, 0.3, 0.6, 1].map(at);
  window.__actsOn(null);
  const souls = steps.map(s => s.souls), cells = steps.map(s => Math.round(s.cells));
  return [
    ok(souls.every((v, i) => i === 0 || v <= souls[i - 1]) && souls[3] < souls[2], 'the near band\'s souls drawn fall as support rises, the near band last', souls.join(' ')),
    ok(cells.every((v, i) => i === 0 || v < cells[i - 1]), 'and the far bands\' cells', cells.join(' ')),
    ok(souls[3] > 0 && souls[3] < souls[0] * 0.4, 'a thin scatter left at the strike', `${souls[3]} of ${souls[0]}`)
  ];
});

// A member walking out of God's yard beside a sign is a soul won by it,
// lifting out of the sky by the sign's flag; one walking out with no sign by
// it raises none.
group('a member won by a sign lifts a soul out of the sky by its flag', async () => {
  up();
  crowd(4000);
  S.after.signs.push({ id: 97000, f: 20, r: 6, askew: false, pull: null, big: false, age: 0 });
  lookAt(soulX(20));
  run(2); draw(); draw();
  const was = crowdDrawn().won;
  window.__afterCrowd((i, v) => (i === 7 * 40 + 20 ? 8 : v));
  run(1 / 30); draw();
  const one = crowdDrawn().won;
  window.__afterCrowd((i, v) => (i === 60 * 40 + 2 ? 8 : v));
  run(1 / 30); draw();
  const far = crowdDrawn().won;
  window.__actsOn(null);
  return [ok(one === was + 1, 'one soul for the one member by the sign', `${was} -> ${one}`),
          ok(far === one, 'and none for a member with no sign by it', `${one} -> ${far}`)];
});

group('the rays fade to nothing at the strike, and the glare with them', async () => {
  up();
  lookAt(afterOpenX());
  const at = k => { won(4000, k); run(2); draw(); return { rays: raysLeft(), glare: glareAlpha() }; };
  const ks = [0, 0.25, 0.5, 0.75, 1];
  const r = ks.map(at);
  window.__actsOn(null);
  const rays = r.map(v => v.rays), glare = r.map(v => v.glare);
  return [
    ok(rays[0] > 0.95, 'the rays full before anyone has walked out', rays.map(v => v.toFixed(2)).join(' ')),
    ok(rays.every((v, i) => i === 0 || v < rays[i - 1]), 'shortening as support rises'),
    ok(rays[4] === 0 && glare[4] === 0, 'and gone at the strike', `${rays[4]} / ${glare[4]}`)
  ];
});

// Panning right of where the act opens turns toward God and goes in on his
// face; the camp end stays at the yard's zoom.
group('the view zooms in toward God, and holds there', async () => {
  const out = [];
  for (const [w, h] of [[2000, 967], [800, 600]]) {
    S.W = w; S.H = h;
    up();
    lookAt(afterOpenX() - 200);
    const camp = S.zoom;
    lookAt(afterOpenX() + (afterEnd() - afterOpenX()) * 0.5);
    const mid = S.zoom;
    lookAt(afterEnd());
    const end = S.zoom;
    const cx = S.camX + S.viewW / 2;
    const faceAt = (faceY() - S.camY) / S.viewH, godOff = Math.abs(godMid(cx) - cx);
    run(1);
    const held = Math.abs(S.camX + S.viewW / 2 - cx) < 1 && S.zoom === end;
    lookAt(afterOpenX() - 200);
    const back = S.zoom;
    window.__actsOn(null);
    out.push(
      ok(end > camp * 1.6, `${w}x${h}: the zoom at the far end is well past the camp's`, `${camp.toFixed(3)} -> ${mid.toFixed(3)} -> ${end.toFixed(3)}`),
      ok(mid > camp && mid < end, `${w}x${h}: going in along the pan`),
      ok(godOff < 2 && Math.abs(faceAt - AFTER_FOCUS_AT) < 0.03, `${w}x${h}: his face pulled to the window's middle`, `${godOff.toFixed(1)} px off, at ${faceAt.toFixed(2)}`),
      ok(held, `${w}x${h}: it holds where it is`),
      ok(back === camp, `${w}x${h}: and lets go coming back`, `${back}`));
  }
  return out;
});

// The camp end framed as the yard is at the same window: a body the size it
// was in the yard, its floor as far up off the window's foot as the yard's
// ground, at a tall window and a short one alike.
group("at the camp end, act 3 is framed at the yard's zoom and the yard's floor height", async () => {
  const out = [];
  for (const [w, h] of [[2000, 967], [800, 600], [800, 400]]) {
    S.W = w; S.H = h;
    window.__actsOn(true);
    window.__view('yard'); run(1 / 30);
    const yz = S.zoom, yFoot = (S.worldH - S.groundY) * S.zoom;
    up();
    lookAt(afterOpenX() - 200);
    const az = S.zoom, aFoot = (S.camY + S.viewH - afterFloor()) * S.zoom;
    window.__actsOn(null);
    out.push(ok(Math.abs(az - yz) < 1e-9, `at ${w}x${h} the camp's zoom is the yard's`, `${yz.toFixed(3)} / ${az.toFixed(3)}`),
             ok(Math.abs(aFoot - yFoot) <= 1, `at ${w}x${h} its floor stands where the yard's ground does`, `${yFoot.toFixed(0)} / ${aFoot.toFixed(0)} px up`));
  }
  return out;
});

// God in the window from where the act opens to the dive's end: at its right
// edge over the union's camp (his camp is past it, DESIGN.md, "The level,
// the two crowds and the flags"), drawn in to its middle along the pan.
group('God stands in the window all along the pan toward him', async () => {
  const out = [];
  for (const [w, h] of [[2000, 967], [800, 600]]) {
    S.W = w; S.H = h;
    up();
    const offs = [0, 0.25, 0.5, 0.75, 1].map(k => {
      lookAt(afterOpenX() + (afterEnd() - afterOpenX()) * k);
      return (godMid(S.camX + S.viewW / 2) - S.camX) / S.viewW;
    });
    window.__actsOn(null);
    out.push(ok(offs.every(v => v > 0.1 && v < 1) && offs.slice(1).every(v => v < 0.9), `${w}x${h}: his middle in the window, at its right edge over the union's camp and well inside past it`, offs.map(v => v.toFixed(2)).join(' ')),
             ok(offs.every((v, i) => i === 0 || v < offs[i - 1]), `${w}x${h}: drawn in toward the middle along the pan`));
  }
  return out;
});

group('a reload stands the sky back as it was, and draws it the same', async () => {
  up();
  crowd(24000, i => (i % 11 === 0 ? 9 : i % 6 === 0 ? 3 : 0));
  run(1);
  lookAt(afterOpenX());
  draw(); run(2); draw();
  yard.persist();
  const rims = S.after.rims, was = crowdDrawn();
  window.__reload();
  run(1 / 30); draw(); run(3); draw();
  const now = crowdDrawn();
  window.__actsOn(null);
  return [
    ok(S.after.rims.length === rims.length && S.after.rims.slice(0, 4000) === rims.slice(0, 4000), 'every soul\'s rim comes back from the save', `${S.after.rims.length} souls`),
    ok(Math.abs(now.souls - was.souls) <= 2, 'and the near band draws the same souls', `${was.souls} -> ${now.souls}`)
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
