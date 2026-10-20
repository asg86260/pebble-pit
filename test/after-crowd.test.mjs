// Act 3's sky: God's camp far back on the cloud floor, his crowd standing in
// it, and the camera that only slides (render/aftercrowd.js, after/sky.js,
// view.js's afterlife camera; DESIGN.md, "God's camp stands in the clouds",
// "The camps are far apart for the eye"). The drawing is asked through
// a sheet that counts what it is told to fill: no check here can see a
// picture, so what is checked is what a picture costs and what it is drawn
// from. The crowd's shape is set through the act's rims (a slot set to 9 is
// a member already gone, with no walk), the setup these checks are not about.
import { group, ok, run, yard } from './helpers.mjs';
import { STRIKE_SHARE, GOD_RATE, CROWD_X0, CROWD_PITCH, P, UNION_CROWD } from '../src/config.js';
import { afterFloor, afterOpenX, afterX1, soulX, soulY, unionX1, campEdges } from '../src/after/place.js';
// The window's middle at the camera's last window: God in it.
const afterEnd = () => afterX1() - S.viewW / 2;
import { stepAfter } from '../src/after/index.js';
import { paintOn } from '../src/render/ctx.js';
import { drawSkyCrowd, drawAfterCrowd, crowdDrawn, glareAlpha, raysLeft } from '../src/render/aftercrowd.js';
import { drawUnionCrowd, unionDrawn } from '../src/render/after/unioncrowd.js';
import { godMid, walkSeen, stage, stageHalf } from '../src/after/sky.js';

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
  lookAt(afterEnd());
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
  lookAt(afterEnd());
  run(1); draw();
  const FR = 300;
  const t0 = performance.now();
  for (let k = 0; k < FR; k++) { stepAfter({ now: 0, dt: 1000 / 60 }); draw(); }
  const ms = (performance.now() - t0) / FR;
  window.__actsOn(null);
  return [ok(ms < 2, 'the afterlife\'s step and the whole sky\'s drawing with 24000 souls stay within two milliseconds a frame', `${ms.toFixed(3)} ms`)];
});

// God's crowd empties from the front as support rises (DESIGN.md, "God's
// camp stands in the clouds"), so fewer souls stand in view there, and a
// thin scatter at the back stands at the strike.
group('the crowd thins as support rises', async () => {
  up();
  lookAt(afterEnd());
  const at = k => { won(4000, k); run(2); draw(); draw(); return crowdDrawn().souls; };
  const souls = [0.05, 0.3, 0.6, 1].map(at);
  window.__actsOn(null);
  return [
    ok(souls[0] > 100, 'a packed crowd round the throne before anyone has walked out', `${souls[0]}`),
    ok(souls.every((v, i) => i === 0 || v < souls[i - 1]), 'the souls standing fall as support rises, from the front', souls.join(' ')),
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

// The camera only slides (DESIGN.md, "The camps are far apart for the
// eye"): the same zoom and the same height all along the pan, and God, a
// third as fast as the camera, drawn in to the window's middle at its end.
group('the view only slides, God drawn in to the middle at the end of the pan', async () => {
  const out = [];
  for (const [w, h] of [[2000, 967], [800, 600]]) {
    S.W = w; S.H = h;
    up();
    const seen = [afterOpenX() - 200, afterOpenX(), (afterOpenX() + afterEnd()) / 2, afterEnd()].map(x => {
      lookAt(x);
      return { zoom: S.zoom, y: S.camY, x: S.camX, god: godMid(S.camX + S.viewW / 2) };
    });
    const cx = S.camX + S.viewW / 2;
    run(1);
    const held = Math.abs(S.camX + S.viewW / 2 - cx) < 1;
    // His rate: a pan moves him across the window a third as far as it
    // moves the near layer.
    const a = seen[1], b = seen[2], rate = -((b.god - b.x) - (a.god - a.x)) / (b.x - a.x);
    window.__actsOn(null);
    out.push(
      ok(seen.every(v => v.zoom === seen[0].zoom && v.y === seen[0].y), `${w}x${h}: one zoom and one height all along the pan`, seen.map(v => v.zoom.toFixed(3)).join(' ')),
      ok(Math.abs(rate - GOD_RATE) < 0.01, `${w}x${h}: God slides a third as fast as the camera`, rate.toFixed(3)),
      ok(Math.abs(seen[3].god - cx) < 2, `${w}x${h}: and stands in the window's middle at the pan's end`, `${(seen[3].god - cx).toFixed(1)} px off`),
      ok(held, `${w}x${h}: it holds where it is`));
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

// God in the window from where the act opens to the pan's end: at its right
// edge past the union's camp (his camp is past it, DESIGN.md, "The level,
// the two crowds and the flags"), drawn in to its middle along the pan; and
// the union's camp, on the near layer, never comes up level with him: the
// two layers would only meet past the window's right edge.
group("God stands in the window all along the pan toward him, the union's camp always left of him", async () => {
  const out = [];
  for (const [w, h] of [[2000, 967], [800, 600]]) {
    S.W = w; S.H = h;
    up();
    const ks = [0, 0.25, 0.5, 0.75, 1];
    const offs = [], left = [];
    for (const k of ks) {
      lookAt(afterOpenX() + (afterEnd() - afterOpenX()) * k);
      const g = godMid(S.camX + S.viewW / 2);
      offs.push((g - S.camX) / S.viewW);
      left.push(unionX1() < g);
    }
    window.__actsOn(null);
    out.push(ok(offs[0] > 0.6 && Math.abs(offs[4] - 0.5) < 0.01, `${w}x${h}: right of the union's camp where the act opens, in the window's middle at the pan's end`, offs.map(v => v.toFixed(2)).join(' ')),
             ok(offs.every((v, i) => i === 0 || v < offs[i - 1]), `${w}x${h}: drawn in toward the middle along the pan`),
             ok(left.every(Boolean), `${w}x${h}: the union's camp left of him all along`));
  }
  return out;
});

// God's camp stands on a stage (DESIGN.md, "God's camp stands on a stage in
// the clouds"): a carrier's way crosses the cloud, climbs the plinth and
// spreads over the top to its own spot, and nothing on the way teleports --
// a step of the sim's walk is a short step of the drawing, its size too,
// and two signs' carriers end in two places on the stage, not in a knot.
group("a carrier's way onto the stage is unbroken, and carriers spread to their own spots", async () => {
  const out = [];
  up();
  for (const at of [afterOpenX(), afterEnd()]) {
    lookAt(at);
    const cx = S.camX + S.viewW / 2, st = stage(), a = campEdges()[1], fl = afterFloor();
    // across the cloud and up the plinth, a pixel of the sim's walk at a time
    let worst = 0, grow = 0, prev = null;
    for (let x = a - 20; x <= CROWD_X0 + P; x += 1) {
      const v = walkSeen(x, fl, cx);
      if (prev) { worst = Math.max(worst, Math.hypot(v.x - prev.x, v.y - prev.y)); grow = Math.max(grow, Math.abs(v.s - prev.s)); }
      prev = v;
    }
    // then out over the top, the sim's straight line from the yard's edge to a spot
    const to = { x: soulX(30) + P / 2, y: soulY(12) + P * 2 };
    for (let k = 0; k <= 200; k++) {
      const v = walkSeen(CROWD_X0 + P + (to.x - CROWD_X0 - P) * k / 200, fl + (to.y - fl) * k / 200, cx);
      worst = Math.max(worst, Math.hypot(v.x - prev.x, v.y - prev.y)); prev = v;
    }
    const end = prev, gm = godMid(cx);
    const onTop = end.y > st.yb && end.y < st.yf && Math.abs(end.x - gm) < stageHalf(st, end.y);
    const spots = [[4, 2], [20, 30], [34, 8]].map(([f, r]) => walkSeen(soulX(f) + P / 2, soulY(r) + P * 2, cx));
    const apart = spots.every((p, i) => spots.every((q, j) => i === j || Math.hypot(p.x - q.x, p.y - q.y) > 3 * P));
    out.push(ok(worst < 40 && grow <= 2, `camera at ${Math.round(at)}: no step of the way jumps`, `${worst.toFixed(1)} px, size ${grow.toFixed(1)}`),
             ok(onTop, `camera at ${Math.round(at)}: the way ends on the stage's top`, JSON.stringify(end)),
             ok(apart, `camera at ${Math.round(at)}: three signs, three spots`));
  }
  window.__actsOn(null);
  return out;
});

// The union's crowd fills in from the front as support rises (DESIGN.md,
// "The level, the two crowds and the flags"): nobody before anyone has walked
// out, more and more as support rises, and a newcomer walks in rather than
// popping -- a soul due the moment support rises is not yet standing a
// moment later, only once its walk in is done.
group("the union's crowd fills in as support rises, its newcomers walking in", async () => {
  up();
  lookAt(afterOpenX());
  const sheet = fn => paintOn({ getContext: () => new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => ({})), set: (o, k, v) => { o[k] = v; return true; } }), width: S.W, height: S.H }, fn);
  const at = k => { won(4000, k); run(3); sheet(drawUnionCrowd); run(UNION_CROWD.walkS + 1); sheet(drawUnionCrowd); return unionDrawn.souls; };
  const counts = [0, 0.2, 0.5, 0.9].map(at);
  // a step of support, read at once and then once the walk is done
  won(4000, 0.5); run(1 / 30); sheet(drawUnionCrowd); won(4000, 0.7); run(1 / 30); sheet(drawUnionCrowd);
  const now = unionDrawn.souls; run(UNION_CROWD.walkS + 0.5); sheet(drawUnionCrowd);
  const later = unionDrawn.souls;
  window.__actsOn(null);
  return [
    ok(counts[0] === 0, 'nobody before anyone has walked out', counts.join(' ')),
    ok(counts.every((v, i) => i === 0 || v > counts[i - 1]), 'more as support rises', counts.join(' ')),
    ok(later > now, 'newcomers stand only once they have walked in', `${now} -> ${later}`)
  ];
});

group('a reload stands the sky back as it was, and draws it the same', async () => {
  up();
  crowd(24000, i => (i % 11 === 0 ? 9 : i % 6 === 0 ? 3 : 0));
  run(1);
  lookAt(afterEnd());
  draw(); run(2); draw();
  yard.persist();
  const rims = S.after.rims, was = crowdDrawn();
  window.__reload();
  run(1 / 30); draw(); run(3); draw();
  const now = crowdDrawn();
  window.__actsOn(null);
  return [
    ok(S.after.rims.length === rims.length && S.after.rims.slice(0, 4000) === rims.slice(0, 4000), 'every soul\'s rim comes back from the save', `${S.after.rims.length} souls`),
    ok(was.souls > 0 && Math.abs(now.souls - was.souls) <= 2, "and God's crowd draws the same souls", `${was.souls} -> ${now.souls}`)
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
