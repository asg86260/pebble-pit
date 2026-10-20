// ---------------------------------------------------------------- the level
// The game's camera: it only slides sideways, and depth is parallax. The
// cloud floor slides row by row at its depth's speed; everything standing
// on it is on a flat layer that slides as one: the workshops and the union's
// camp at 1, God's camp at 1/3. A thing's x is where it stands with the
// camera at 0, less CAMX times its layer's speed.
const ZT = zAt(HOR + 6), ZN = ZT / 2, SOUL = 0.22;
const SP = z => ZN / z;
let CAMX = 0;
const NEAR = 1, FAR = 1 / 3;
const CAMR = [-260, 340];
function setCam() { const k = st.pan === 'auto' ? (1 - Math.cos(tick * 0.012)) / 2 : st.cam; CAMX = lerp(CAMR[0], CAMR[1], k); }
const lx = (x0, sp) => x0 - CAMX * sp;

// The camps, with the camera at 0: the union's leader at x 60 on the near
// layer, God at x 280 on the far one, his foot on row 97.
const U = { x0: 60, fy: 104, s: 2 }, G = { x0: 280, fy: 97, s: 0.8 };
const SHOPS = [[-330, 48, 34], [-225, 40, 46], [-120, 56, 30]];

// tones of the new ground: one flat tone per shape
// the platform's top is paper, never the cloud's pale; its risers are mid
const TOP = () => st.theme === 'dark' ? '#666666' : '#fff';
const RISE = () => st.theme === 'dark' ? '#3a3a3a' : '#757575';
const CLOUD = () => T.paper;
const cellS = (x, fy, s, dx, dy, w, h, c) => {
  const x0 = Math.round(x + dx * s), y0 = Math.round(fy + dy * s), x1 = Math.round(x + (dx + w) * s), y1 = Math.round(fy + (dy + h) * s);
  cell(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0), c);
};
function throneAt(x, fy, s) {
  const ink = st.theme === 'dark' ? '#4a4a4a' : FEAT, C = (dx, dy, w, h, c) => cellS(x, fy, s, dx, dy, w, h, c);
  C(-30, -74, 60, 36, ink); C(-36, -48, 72, 8, ink);
  for (let k = 0, y = -40; y < 0; k++, y += 4) C(-40 - 4 * k, y, 80 + 8 * k, Math.min(4, -y), ink);
  C(-22, -90, 44, 42, FEAT); C(-20, -88, 40, 40, GOD);
  for (const ox of [6, 24]) { C(-20 + ox, -74, 10, 2, FEAT); C(-17 + ox, -72, 4, 2, FEAT); }
  C(-8, -62, 2, 2, FEAT); C(-6, -60, 12, 2, FEAT); C(6, -62, 2, 2, FEAT);
  const cr = st.theme === 'dark' ? GOD : FEAT;
  C(-21, -94, 42, 2, cr); for (const px of [2, 10, 19, 28, 36]) C(-20 + px, -98, 2, 4, cr);
}
const UINK = () => st.theme === 'dark' ? '#9a9a9a' : FEAT;
function podiumAt(x, fy, s) {
  const ink = UINK(), C = (dx, dy, w, h, c) => cellS(x, fy, s, dx, dy, w, h, c);
  C(-11, -10, 22, 10, ink); C(-9, -8, 18, 6, T.paper);
  for (const yy of [-6, -3]) C(-9, yy, 18, 1, ink);
  for (let i = 0; i < 18; i += 2) C(-9 + i, -8 + Math.round(i * 6 / 18), 2, 1, ink);
  for (const dx of [-9, 1]) { C(dx, -19, 8, 9, FEAT); C(dx + 1, -18, 6, 7, GOD); }
}
function workshop(x, fy, w, h, k, sc) {
  w = Math.round(w * sc); h = Math.round(h * sc);
  const ink = st.theme === 'dark' ? '#5a5a5a' : '#757575';
  cell(x - w / 2, fy - h, w, h, ink); cell(x - w / 2 + 2, fy - h + 2, w - 4, h - 2, T.pale);
  cell(x - w / 2 - 2, fy - h - 2, w + 4, 2, ink);
  for (let i = 0; i < Math.floor((w - 8) / 8); i++) cell(x - w / 2 + 5 + i * 8, fy - h + 6, 4, 5, ink);
  cell(x - 4, fy - 10, 8, 10, ink);
  cell(x + w / 2 - 10, fy - h - 10 - k % 3, 4, 8, ink);
}

// Cloud lapping an edge: round white tops side by side along row `base`,
// no line -- one tone, the cloud's own.
function lapUp(x0, x1, base, h, seed, r0) {
  x0 = Math.round(x0); x1 = Math.round(x1);
  const rb = r0 || Math.max(2, h * 1.6), n = Math.max(1, Math.round((x1 - x0) / (1.4 * rb))), step = (x1 - x0) / n;
  for (let b = 0; b <= n; b++) {
    const c = x0 + b * step + (hsh(seed, b) - 0.5) * step * 0.5, hb = h * lerp(0.7, 1.15, hsh(seed, b, 3)), rr = rb * lerp(0.8, 1.2, hsh(seed, b, 4));
    for (let x = Math.floor(c - rr); x <= Math.ceil(c + rr); x++) {
      const u = (x + 0.5 - c) / rr; if (Math.abs(u) >= 1 || x < 0 || x >= W) continue;
      const t = Math.round(hb * Math.sqrt(1 - u * u)); if (t >= 1) cell(x, base - t, 1, t + 1, CLOUD());
    }
  }
}
// A flat platform: a top from row yb (its back edge) to yf (its front),
// half-width hb at the back and hf at the front, and below the front a rise
// of `steps` steps, each two rows deep and four cells wider a side. P3's
// plateaus have no rise: their rim dissolves into billows instead.
// billows hanging below row `top`, in `tone`: the rim of a plateau that is
// cloud at its edge
function lapDown(x0, x1, top, h, seed, tone) {
  x0 = Math.round(x0); x1 = Math.round(x1);
  const rb = Math.max(2, h * 1.5), n = Math.max(1, Math.round((x1 - x0) / (1.3 * rb))), step = (x1 - x0) / n;
  for (let b = 0; b <= n; b++) {
    const c = x0 + b * step + (hsh(seed, b) - 0.5) * step * 0.5, hb = h * lerp(0.6, 1.2, hsh(seed, b, 3)), rr = rb * lerp(0.8, 1.25, hsh(seed, b, 4));
    for (let x = Math.floor(c - rr); x <= Math.ceil(c + rr); x++) {
      const u = (x + 0.5 - c) / rr; if (Math.abs(u) >= 1 || x < 0 || x >= W) continue;
      const t = Math.round(hb * Math.sqrt(1 - u * u)); if (t >= 1) cell(x, top, 1, t, tone);
    }
  }
}
// A flat platform: a top from row yb (its back edge) to yf (its front),
// half-width hb at the back and hf at the front; below the front a rise of
// `steps` steps, each three rows (a tread and two of riser) and four cells
// wider a side, with cloud lapping its foot. A plateau (`skirt`) has no
// rise: its rim hangs down as billows of its own tone and the cloud bites
// into its edge.
function platform(x, yb, yf, hb, hf, steps, seed, skirt) {
  // the side face the camera can see (the one toward the middle of the
  // screen), a riser running down the top's slanted edge to the front
  const side = x > GX ? -1 : 1, D = 3;
  for (let y = yb; y < yf + D; y++) { const k = clamp((y - yb) / Math.max(1, yf - yb), 0, 1), hw = Math.round(lerp(hb, hf, k)); cell(side < 0 ? x - hw - 3 : x + hw, y, 3, 1, RISE()); }
  for (let y = yb; y < yf; y++) { const k = (y - yb) / Math.max(1, yf - yb), hw = Math.round(lerp(hb, hf, k)); cell(x - hw, y, 2 * hw, 1, TOP()); }
  let y = yf;
  if (!skirt) {
    // A stepped plinth, the throne base's family: the top's own front
    // riser, then `steps` steps, each a deep tread (2 rows) over a deep riser
    // (4 rows) and STEPW cells wider a side than the one above it, so each
    // step's end shows as a corner of tread over riser.
    const STEPW = 12;
    cell(x - hf, y, 2 * hf, 4, RISE()); y += 4;
    for (let k = 0; k < steps; k++) { const hw = hf + STEPW * (k + 1); cell(x - hw, y, 2 * hw, 2, TOP()); cell(x - hw, y + 2, 2 * hw, 4, RISE()); y += 6; }
    // the cloud sea laps up over the lowest step: billows of the floor's own
    // drawing, of every size, set irregularly along the foot
    const hs = hf + STEPW * steps + 12;
    for (let i = 0; i < 16; i++) {
      const c = x - hs + 2 * hs * (i + 0.2 + hsh(seed, i) * 0.6) / 16, h = lerp(2.5, 9, hsh(seed, i, 2) ** 1.5), up = Math.round(hsh(seed, i, 3) * 3);
      lip(Math.round(c - h * 1.8), Math.round(c + h * 1.8), y + 2 - up, h, T.mid, seed * 31 + i, h * 1.1);
    }
  } else {
    lapDown(x - hf - 4, x + hf + 4, yf, 5, seed, TOP());
    for (let k = 0; k <= 4; k++) { const yy = Math.round(lerp(yb, yf, k / 4)), hw = lerp(hb, hf, k / 4); lapDown(x - hw - 6, x - hw + 2, yy, 3, seed + k + 10, TOP()); lapDown(x + hw - 2, x + hw + 6, yy, 3, seed + k + 30, TOP()); }
    lapUp(x - hf - 8, x + hf + 8, yf + 6, 3, seed + 60, 4);
  }
}

// A crowd standing on a flat top: rows from yb to yf, souls n0..n1 cells,
// filling the top's width less a margin, clear of the leader's base. God's
// is drawn at a giant's scale -- his souls are bigger than true distance
// would make them, so his camp reads as a crowd round the throne.
const FADE = new Map(); let lastTick = null, stepping = false;
function topCrowd(id, x, yb, yf, hb, hf, n0, n1, lead, fill, out, gap) {
  let r = 0;
  for (let y = yf; y > yb; r++) {
    const k = (y - yb) / Math.max(1, yf - yb), n = Math.max(2, Math.round(lerp(n0, n1, k))), hw = lerp(hb, hf, k) - 3, pitch = n + gap;
    let i = 0;
    for (let cx = x - hw + ((r & 1) * pitch) / 2; cx < x + hw - n; cx += pitch, i++) {
      if (y - n < lead.fy + 1 && Math.abs(cx + n / 2 - lead.x) < lead.half + n / 2 + 2) continue;
      if (id === 1 && Math.abs(cx + n / 2 - lead.x) < 4 + n / 2 && y > lead.fy) continue;
      const v = fill > 0 ? sup() * 2 - (1 - k) * 1.0 - hsh(i, r + 9) * 0.6 - 0.2 : (1 - sup()) * 1.9 - k * 0.8 - hsh(i, r + 9) * 0.6 + 0.35;
      const want = v > 0 ? 1 : 0, key = id * 1e6 + r * 1000 + i;
      const was = FADE.get(key), a = was == null || !stepping ? want : was + clamp(want - was, -0.25, 0.25);
      FADE.set(key, a); if (a <= 0.01) continue;
      out.push({ id, r, i, x0: Math.round(cx + (gap ? (hsh(i, r, 5) - 0.5) * gap : 0)), yf: y - (gap && hsh(i, r, 6) < 0.4 ? 1 : 0), n, a: Math.min(1, a), ord: y });
    }
    y -= Math.max(1, Math.round(n * (gap ? 1.1 : 0.75)));
  }
}
// God's souls in his two greys; the union's small ones solid ink, bigger
// ones a mid body under a cap of ink
function soulPaint(s) {
  if (s.id === 1 || s.grey) { const c = st.theme === 'dark' ? (s.r & 1 ? '#262626' : '#3a3a3a') : (s.r & 1 ? T.mid : '#8a8a8a'); cell(s.x0, s.yf - s.n, s.n, s.n, c); return; }
  const ink = UINK();
  if (s.n < 5) { cell(s.x0, s.yf - s.n, s.n, s.n, ink); return; }
  cell(s.x0, s.yf - s.n, s.n, s.n, st.theme === 'dark' ? '#5a5a5a' : T.mid); cell(s.x0, s.yf - s.n, s.n, Math.max(1, Math.round(s.n / 6)), ink);
}
const FISTB = ['.X.X.X.', 'XXXXXXX', 'XXXXXX.', '.XXXX..', '..XXX..'];
function flag(x, top, n) {
  const ink = UINK(), u = Math.max(1, Math.round(n / 7)), ph = Math.round(1.8 * n), fw = n >= 7 ? 7 * u + 2 : Math.max(2, Math.round(n * 0.9)), fh = n >= 7 ? 5 * u + 2 : Math.max(1, Math.round(n * 0.7));
  cell(x, top - ph + n, 1, ph + Math.round(n * 0.2), ink);
  for (let i = 0; i < fw; i++) { const d = Math.round(Math.sin(i / 3 - tick * 0.5) * (u > 1 ? 1 : 0)); cell(x + 1 + i, top - ph + n + d, 1, fh, ink); }
  if (n >= 7) FISTB.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') cell(x + 2 + i * u, top - ph + n + 1 + j * u, u, u, T.paper); }));
}
function drawSoul(s) {
  g.globalAlpha = s.a; soulPaint(s);
  if (s.flag) flag(s.x0 + s.n, s.yf - s.n, Math.min(s.n, 7));
  g.globalAlpha = 1;
}

// The union's crowd standing on the clouds themselves (P1): G1's crowd on
// the near layer, with G1's lip of cloud at the front souls' feet.
function cloudCrowd(out, lead) {
  const rows = []; let yf = H + 3; const zb = ZN * 0.93, zf = 2.5;
  yf = Math.min(H + 3, yAt(zf));
  while (yf > yAt(zb)) { const z = zAt(yf); rows.push(z); yf -= Math.max(1, Math.max(2, SOUL * F / z) * 1.15); }
  rows.reverse();
  const X0 = (U.x0 - GX) * ZN / F, pitch = SOUL * 1.45;
  rows.forEach((z, r) => {
    const kf = (z - zf) / (zb - zf), hw = lerp(1.4, 4.3, kf);
    for (let i = Math.floor(-hw / pitch) - 1; i <= Math.ceil(hw / pitch) + 1; i++) {
      const xl = (i + (r & 1) * 0.5) * pitch; if (Math.abs(xl) > hw) continue;
      const cx = GX + (X0 * z / ZN + xl) * F / z - CAMX * NEAR, n = Math.max(2, Math.round(SOUL * F / z)), y = Math.round(yAt(z));
      if (y - n < lead.fy + 1 && Math.abs(cx - lead.x) < 16 * U.s + 2 + n / 2) continue;
      const v = sup() * 2 - kf - hsh(i, r + 9) * 0.6 - 0.2, key = 2e6 + r * 1000 + i, want = v > 0 ? 1 : 0;
      const was = FADE.get(key), a = was == null || !stepping ? want : was + clamp(want - was, -0.25, 0.25);
      FADE.set(key, a); if (a <= 0.01) continue;
      out.push({ id: 2, r, i, x0: Math.round(cx - n / 2), yf: y, n, a: Math.min(1, a), ord: y, cloud: true });
    }
  });
}
function cloudLip(s) {
  if (s.n >= 4) lip(s.x0 - 1, s.x0 + s.n + 1, s.yf + Math.max(1, Math.round(s.n * 0.15)), Math.max(1.6, s.n * 0.4), s.n >= 6 ? T.ink : T.mid, 2e6 + s.r * 1000 + s.i, Math.max(1.6, (s.n + 2) / 3.2));
}

// the walk between the camps: a point moving in depth from the union's
// camp to God's, its x sliding at the speed of the depth it has reached
function walk(out, a, b, stage) {
  // the cloud leg takes the first 70% of a carrier's trip; then it climbs
  // onto the stage's front and walks out across the top to its own planting
  // spot, where it fades as the flag is planted
  const dur = 560, LEG = 0.7, P = u => { const z = lerp(a.z, b.z, u), X = lerp(a.X, b.X, u); return { x: GX + X * F / z - CAMX * SP(z), y: Math.round(yAt(z)), n: Math.max(2, Math.round(SOUL * 0.9 * F / z)) }; };
  const spot = k => { const ky = hsh(k, 71), y = Math.round(lerp(stage.yb + 8, stage.yf - 3, ky)), hw = lerp(stage.hb, stage.hf, (y - stage.yb) / (stage.yf - stage.yb)) - 8;
    const side = hsh(k, 72) < 0.5 ? -1 : 1, x = stage.x + side * lerp(stage.half + 4, hw, hsh(k, 73)); return { x, y, n: Math.round(lerp(4, 8, (y - stage.yb) / (stage.yf - stage.yb))) }; };
  for (let k = 0; k < 6; k++) {
    const t = tick + k * dur / 6, trip = Math.floor(t / dur), u = (t % dur) / dur;
    let p, a1 = Math.min(1, u / 0.05);
    if (u < LEG) p = P(u / LEG);
    else {
      const e = P(1), sp = spot(k * 101 + trip), v = (u - LEG) / (1 - LEG), w = Math.min(1, v / 0.75);
      // up the steps: rise from the foot to the top's front edge, then out
      const front = { x: e.x, y: stage.yf - 1, n: e.n }, q = w < 0.15 ? w / 0.15 : 1, r = w < 0.15 ? 0 : (w - 0.15) / 0.85;
      p = w < 0.15 ? { x: e.x, y: Math.round(lerp(e.y, front.y, q)), n: e.n } : { x: lerp(front.x, sp.x, r), y: Math.round(lerp(front.y, sp.y, r)), n: Math.round(lerp(front.n, sp.n, r)) };
      if (v > 0.75) a1 = 1 - (v - 0.75) / 0.25;
    }
    out.push({ id: 9, r: k, i: 0, x0: Math.round(p.x - p.n / 2), yf: p.y, n: p.n, a: Math.max(0, a1), flag: true, ord: p.y + 0.1 });
  }
  { const u = ((tick + dur * 0.4) % (dur * 1.3)) / dur; if (u < 1) { const p = P(1 - u); out.push({ id: 9, r: 7, i: 0, x0: Math.round(p.x - p.n / 2), yf: p.y, n: p.n, a: Math.min(1, u / 0.06, (1 - u) / 0.06), grey: true, ord: p.y + 0.1 }); } }
}

function level() {
  stepping = lastTick != null && Math.abs(tick - lastTick) <= 2; lastTick = tick;
  const take = st.take, items = [], add = (ord, draw) => items.push({ ord, draw });
  const gx = Math.round(lx(G.x0, FAR)), ux = Math.round(lx(U.x0, NEAR));
  const gl = { x: gx, fy: G.fy, half: 76 * G.s }, ul = { x: ux, fy: U.fy, half: 16 * U.s };
  // God's platform: P1 a great stepped dais, P2 a dais the size of his camp,
  // P3 a plateau whose rim is cloud
  // the top is cheated deep, as the crowd is cheated big, so it reads as a
  // stage seen from above: a trapezoid wider at the front
  const GP = { p1: [90, 122, 100, 135, 2], p2: [90, 120, 80, 125, 2] }[take];
  add(92, () => platform(gx, GP[0], GP[1], GP[2], GP[3], GP[4], 77, take === 'p3'));
  add(G.fy, () => throneAt(gx, G.fy, G.s));
  const souls = [];
  topCrowd(1, gx, GP[0] + 1, GP[1] - 1, GP[2], GP[3], 4, 8, gl, -1, souls, 2);
  // the planted flags among God's rows
  // the planted flags, spread across the stage either side of the throne
  [[-0.85, 0.75], [-0.5, 0.35], [0.45, 0.55], [0.8, 0.2]].forEach(([fx, fy]) => { const y = Math.round(lerp(GP[0] + 6, GP[1] - 2, fy)), hw = lerp(GP[2], GP[3], (y - GP[0]) / (GP[1] - GP[0])) - 6, x = gx + fx * hw, n = Math.round(lerp(7, 10, fy)); souls.push({ flagAt: [Math.round(x), y - n, n], ord: y + 0.05 }); });
  // the union's camp: P1 on the clouds, P2 on its own small platform, P3 on
  // its own cloud-skirted plateau; the workshops on a platform in P2 and P3
  if (take === 'p1') { add(U.fy, () => podiumAt(ux, U.fy, U.s)); cloudCrowd(souls, ul); }
  else {
    add(101, () => platform(ux + 10, 101, 118, 70, 95, take === 'p2' ? 3 : 0, 41, take === 'p3'));
    add(U.fy, () => podiumAt(ux, U.fy, U.s));
    topCrowd(2, ux + 10, 106, 118, 70, 95, 5, 8, ul, 1, souls, 3);
  }
  SHOPS.forEach(([x0, w, h], k) => {
    const x = Math.round(lx(x0, NEAR));
    if (take !== 'p1' && k === 0) add(99, () => platform(Math.round(lx(-225, NEAR)), 100, 107, 150, 165, take === 'p2' ? 2 : 0, 5, take === 'p3'));
    add(104.5, () => workshop(x, 104, w, h, k, 1.6));
  });
  // the way: from the front of the union's camp back to the front of God's
  const zU = take === 'p1' ? 4.2 : zAt(116);
  const footY = GP[1] + 4 + 6 * GP[4] + 1, zF = zAt(footY);
  walk(souls, { z: zU, X: (ux + 60 + CAMX * SP(zU) - GX) * zU / F }, { z: zF, X: (gx - GP[3] * 0.55 + CAMX * SP(zF) - GX) * zF / F }, { x: gx, yb: GP[0], yf: GP[1], hb: GP[2], hf: GP[3], half: gl.half });
  // for the walk's ends to be fixed on their layers they are recomputed from
  // the camera each frame; the floor of the way is the cloud between
  const here = new Set(souls.filter(s => s.a > 0.5 && s.cloud).map(s => s.r * 1000 + s.i));
  for (const s of souls) {
    if (s.draw) { add(s.ord, s.draw); continue; }
    if (s.flagAt) { add(s.ord, () => flag(...s.flagAt)); continue; }
    if (s.cloud) { const j = s.r & 1 ? s.i + 1 : s.i - 1; s.open = !(here.has((s.r + 1) * 1000 + s.i) && here.has((s.r + 1) * 1000 + j)); }
    add(s.ord, () => { drawSoul(s); if (s.cloud && s.open) cloudLip(s); });
  }
  items.sort((p, q2) => p.ord - q2.ord).forEach(it => it.draw());
}
