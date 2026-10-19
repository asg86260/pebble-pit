// ---------------------------------------------------------------- the level
// The game's camera: it only slides sideways. Depth is parallax -- a thing
// at depth z slides SP(z) cells for every cell the camera moves: 1 for the
// near layer at ZN (the union's camp in C), less for anything farther, more
// for the floor at your feet. Its screen x is where the fixed perspective
// view puts it (GX + X*F/z, X in floor units), less CAMX*SP(z).
const ZT = zAt(HOR + 6), ZN = ZT / 2, SOUL = 0.22, PARA = 1;
const SP = z => (ZN / z) ** PARA;
let CAMX = 0;
const sx = (X, z) => GX + X * F / z - CAMX * SP(z);
const Xof = (x0, z) => (x0 - GX) * z / F;          // the X that sits at screen x0 when the camera is at 0
// A camp: its leader's screen x at camera 0, the depth of its foot, its
// drawn size, and its crowd's wedge -- half-width in floor units at its back
// row and its front, and the depths of those rows.
const camp = (x0, z, s, hb, hf, zb, zf) => ({ x0, z, s, hb, hf, zb, zf, X: Xof(x0, z) });
const LAYOUT = {
  // A, as built: everything on the throne's old layer (foot at row 98),
  // the camps 24 cells of cloud apart.
  a: { union: camp(92, ZT, 1, 6.6, 1.4, ZT * 0.93, 1.5), god: camp(258, ZT, 1, 10, 1.9, ZT * 0.95, 1.5),
       shops: { z: ZT, s: 1, x0: [-330, -250, -170, -95] }, cam: [-430, 160], compare: 0 },
  // C: the workshops and the union's camp on the near layer (speed 1);
  // God's camp far back on the cloud sea, three times the near layer's
  // distance (speed 1/3). He is drawn at 0.8 of his size in A -- at that
  // distance, a giant seen from far off. His crowd
  // stops well short of the camera, leaving open cloud for the long walk.
  c: { union: camp(60, ZN, 2, 4.3, 1.4, ZN * 0.93, 2.5), god: camp(280, ZN * 3, 0.8, 13, 7, ZN * 3 * 0.96, ZT * 0.9),
       shops: { z: ZN, s: 1.6, x0: [-330, -225, -120] }, cam: [-260, 340], compare: 0 } };
// Sliding right, the near camp leaves to the left three times as fast as the
// far one, so the gap between them only grows. Going back to the pan's
// start it shrinks, and the two would meet where the camera puts them both
// at screen x 1.5*280 - 0.5*60 = 390 -- off the right edge, so on screen the
// union's camp is always left of God's and never passes in front of him.
const SHOPS = [[48, 34], [40, 46], [56, 30], [36, 40]];
const L = () => LAYOUT[st.take];
function setCam() { const [a, b] = L().cam, k = st.pan === 'auto' ? (1 - Math.cos(tick * 0.012)) / 2 : st.cam; CAMX = lerp(a, b, k); }

// draw a shape authored in cells about (0, foot) at scale s, at screen (sx, fy)
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
  lip(Math.round(x - 76 * s - 3), Math.round(x + 76 * s + 3), Math.round(fy + 1), 2.4 * Math.max(0.8, s), T.mid, 77);
}
const UINK = () => st.theme === 'dark' ? '#9a9a9a' : FEAT;
function podiumAt(x, fy, s) {
  const ink = UINK(), C = (dx, dy, w, h, c) => cellS(x, fy, s, dx, dy, w, h, c);
  C(-11, -10, 22, 10, ink); C(-9, -8, 18, 6, T.paper);
  for (const yy of [-6, -3]) C(-9, yy, 18, 1, ink);
  for (let i = 0; i < 18; i += 2) C(-9 + i, -8 + Math.round(i * 6 / 18), 2, 1, ink);
  for (const dx of [-9, 1]) { C(dx, -19, 8, 9, FEAT); C(dx + 1, -18, 6, 7, GOD); }
  lip(Math.round(x - 13 * s), Math.round(x + 13 * s), Math.round(fy + 1), 2 * s, T.mid, 41);
}
function workshop(x, fy, w, h, k, sc) {
  w = Math.round(w * sc); h = Math.round(h * sc);
  const ink = st.theme === 'dark' ? '#5a5a5a' : '#757575';
  cell(x - w / 2, fy - h, w, h, ink); cell(x - w / 2 + 2, fy - h + 2, w - 4, h - 2, T.pale);
  cell(x - w / 2 - 2, fy - h - 2, w + 4, 2, ink);
  for (let i = 0; i < Math.floor((w - 8) / 8); i++) cell(x - w / 2 + 5 + i * 8, fy - h + 6, 4, 5, ink);
  cell(x - 4, fy - 10, 8, 10, ink);
  cell(x + w / 2 - 10, fy - h - 10 - k % 3, 4, 8, ink);
  lip(Math.round(x - w / 2 - 2), Math.round(x + w / 2 + 2), Math.round(fy + 1), 2.2, T.mid, k * 7);
}

// A camp's crowd, G1's: rows from its back to its front, packed so the full
// crowd hides the cloud; each row slides at its own depth's speed. God's
// crowd empties from the front as support rises; the union's fills from it.
const FADE = new Map(); let lastTick = null, stepping = false;
function campSouls(c, id, fill, out, lead) {
  const rows = []; let yf = Math.min(H + 3, yAt(c.zf));
  // the union's crowd stands in loose rows of separate souls, as mocked
  // for it; God's is packed
  const loose = id === 2;
  while (yf > yAt(c.zb)) { const z = zAt(yf); rows.push(z); yf -= Math.max(1, Math.max(2, SOUL * F / z) * (loose ? 1.15 : 0.7)); }
  rows.reverse();
  const pitch = SOUL * (loose ? 1.45 : 0.94);
  rows.forEach((z, r) => {
    const kf = (z - c.zf) / Math.max(1e-6, c.zb - c.zf), hw = lerp(c.hf, c.hb, kf);
    for (let i = Math.floor(-hw / pitch) - 1; i <= Math.ceil(hw / pitch) + 1; i++) {
      const xl = (i + (r & 1) * 0.5) * pitch; if (Math.abs(xl) > hw + hsh(r, id) * 0.5) continue;
      // the wedge runs from the leader toward the camera's line of sight at camera 0
      // a camp's crowd is on its camp's layer and slides with it as one
      const X = c.X * (z / c.z) + xl, cx = GX + X * F / z - CAMX * SP(c.z);
      const n = Math.max(2, Math.round(SOUL * F / z)), yfs = Math.round(yAt(z));
      if (cx < -20 || cx > W + 20) continue;
      if (yfs - n < lead.fy + 1 && Math.abs(cx - lead.x) < (id === 1 ? 80 : 16) * c.s + 2 + n / 2) continue;
      if (id === 1 && Math.abs(xl) * F / z < 4 + n) continue;
      const front = 1 - kf, v = fill > 0 ? sup() * 2 - kf * 1.0 - hsh(i, r + 9) * 0.6 - 0.2 : (1 - sup()) * 1.9 - front * 0.8 - hsh(i, r + 9) * 0.6 + 0.35;
      const want = v > 0 ? 1 : 0, key = id * 1e6 + r * 1000 + i;
      const was = FADE.get(key), a = was == null || !stepping ? want : was + clamp(want - was, -0.25, 0.25);
      FADE.set(key, a); if (a <= 0.01) continue;
      out.push({ id, r, i, z, x0: Math.round(cx - n / 2), yf: yfs - (n >= 5 && hsh(i, r, 77) < 0.4 ? 1 : 0), n, a: Math.min(1, a) });
    }
  });
}
// how each kind of soul is filled: God's in his two greys; the union's
// small far ones solid ink, their nearer ones a mid body under a cap of ink,
// a cell deep -- so the front of the union's crowd reads dark at the top
// and light in the mass, and God stays the darkest, most solid thing
function soulPaint(s) {
  if (s.id === 1 || s.grey) { const c = st.theme === 'dark' ? ((s.i + s.r) & 1 ? '#4a4a4a' : '#5f5f5f') : ((s.i + s.r) & 1 ? T.mid : '#8a8a8a'); cell(s.x0, s.yf - s.n, s.n, s.n, c); return; }
  const ink = UINK();
  if (s.n < 5) { cell(s.x0, s.yf - s.n, s.n, s.n, ink); return; }
  const cap = Math.max(1, Math.round(s.n / 6));
  cell(s.x0, s.yf - s.n, s.n, s.n, st.theme === 'dark' ? '#5a5a5a' : T.mid); cell(s.x0, s.yf - s.n, s.n, cap, ink);
}
function drawSoul(s) {
  g.globalAlpha = s.a;
  soulPaint(s);
  if (s.flag) flag(s.x0 + s.n, s.yf - s.n, s.n);
  if (s.open && s.n >= 4) lip(s.x0 - 1, s.x0 + s.n + 1, s.yf + Math.max(1, Math.round(s.n * 0.15)), Math.max(1.6, s.n * 0.4), s.n >= 6 ? T.ink : T.mid, s.id * 9973 + s.r * 1000 + s.i, Math.max(1.6, (s.n + 2) / 3.2));
  g.globalAlpha = 1;
}
const FISTB = ['.X.X.X.', 'XXXXXXX', 'XXXXXX.', '.XXXX..', '..XXX..'];
function flag(x, top, n) {
  const ink = UINK(), u = Math.max(1, Math.round(n / 5)), ph = 2 * n, fw = n >= 5 ? 7 * u : Math.max(2, Math.round(n * 1.3)), fh = n >= 5 ? 5 * u + 2 : Math.max(1, n - 1);
  cell(x, top - ph + n, 1, ph, ink);
  for (let i = 0; i < fw; i++) { const d = Math.round(Math.sin(i / 3 - tick * 0.5) * (u > 1 ? 1 : 0)); cell(x + 1 + i, top - ph + n + d, 1, fh, ink); }
  if (n >= 5) FISTB.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') cell(x + 1 + i * u, top - ph + n + 1 + j * u, u, u, T.paper); }));
}
// The walk: carriers leave the union's crowd with a flag and plant it among
// God's crowd; a won soul drifts back now and then. A carrier is a point on
// the floor moving from one camp to the other; its screen x slides at the
// speed of the depth it has reached, so in C it shrinks and slows as it
// recedes. The trodden way is drawn the same way, a dash every few steps.
function walkers(out) {
  const Lo = L(), U = Lo.union, G = Lo.god, C = st.take === 'c';
  const za = C ? 3.2 : lerp(U.zf, U.zb, 0.35), zb2 = C ? G.zf * 1.05 : lerp(G.zf, G.zb, 0.35);
  const a = { X: U.X * za / U.z + lerp(U.hf, U.hb, (za - U.zf) / (U.zb - U.zf)) * 0.7, Z: za };
  const b = { X: G.X * zb2 / G.z - lerp(G.hf, G.hb, (zb2 - G.zf) / (G.zb - G.zf)) * 0.45, Z: zb2 };
  const dist = Math.hypot(b.X - a.X, b.Z - a.Z), dur = Math.round(dist / 0.03);
  const put = (from, to, u, isFlag, k, grey) => {
    const X = lerp(from.X, to.X, u), z = lerp(from.Z, to.Z, u);
    const n = Math.max(2, Math.round(SOUL * F / z)), x = sx(X, z), bob = Math.round(Math.abs(Math.sin(u * dur * 0.4)) * Math.max(1, n * 0.15));
    out.push({ id: 9, r: k, i: 0, z, x0: Math.round(x - n / 2), yf: Math.round(yAt(z)) - bob, n, a: Math.min(1, u / 0.06, (1 - u) / 0.06), flag: isFlag, open: true, grey });
  };
  for (let k = 0; k < 6; k++) put(a, b, ((tick + k * dur / 6) % dur) / dur, true, k, false);
  { const u = ((tick + dur * 0.4) % (dur * 1.3)) / dur; if (u < 1) put(b, a, u, false, 7, true); }
  for (let k = 1; k < 40; k++) {
    const u = k / 40, X = lerp(a.X, b.X, u), z = lerp(a.Z, b.Z, u), w = Math.max(1, Math.round(SOUL * 1.2 * F / z));
    out.push({ z: z + 0.5, dash: [Math.round(sx(X, z) - w / 2), Math.round(yAt(z)), w] });
  }
  for (let k = 0; k < 7; k++) {
    const z = lerp(G.zb * 0.97, G.zf, hsh(k, 51) * 0.85), hw = lerp(G.hf, G.hb, (z - G.zf) / (G.zb - G.zf));
    const X = G.X * z / G.z + (hsh(k, 52) - 0.5) * 2 * hw * 0.85, n = Math.max(2, Math.round(SOUL * F / z));
    out.push({ z: z - 0.01, flagAt: [Math.round(sx(X, z)), Math.round(yAt(z)) - n, n] });
  }
}
function level() {
  stepping = lastTick != null && Math.abs(tick - lastTick) <= 2; lastTick = tick;
  const Lo = L(), items = [], Sh = Lo.shops;
  Sh.x0.forEach((x0, k) => { const x = Math.round(sx(Xof(x0, Sh.z), Sh.z)); items.push({ z: Sh.z * 1.02, draw: () => workshop(x, Math.round(yAt(Sh.z)), SHOPS[k][0], SHOPS[k][1], k, Sh.s) }); });
  const lead = c => ({ x: Math.round(sx(c.X, c.z)), fy: Math.round(yAt(c.z)), s: c.s });
  const lu = lead(Lo.union), lg = lead(Lo.god);
  items.push({ z: Lo.union.z, draw: () => podiumAt(lu.x, lu.fy, lu.s) });
  items.push({ z: Lo.god.z, draw: () => throneAt(lg.x, lg.fy, lg.s) });
  const souls = [];
  campSouls(Lo.union, 2, 1, souls, lu);
  campSouls(Lo.god, 1, -1, souls, lg);
  const here = new Set(souls.filter(s => s.a > 0.5).map(s => s.id * 1e6 + s.r * 1000 + s.i));
  for (const s of souls) { const j = s.r & 1 ? s.i + 1 : s.i - 1; s.open = !(here.has(s.id * 1e6 + (s.r + 1) * 1000 + s.i) && here.has(s.id * 1e6 + (s.r + 1) * 1000 + j)); }
  walkers(souls);
  for (const s of souls) items.push({ z: s.z, draw: s.dash ? () => cell(s.dash[0], s.dash[1], s.dash[2], 1, T.mid) : s.flagAt ? () => flag(...s.flagAt) : () => drawSoul(s) });
  items.sort((p, q2) => q2.z - p.z).forEach(it => it.draw());
}
