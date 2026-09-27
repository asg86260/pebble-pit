// Track word of docs/wave-class-anims.md: the circle's two classes, the
// Hexer and the Bard, and the statuses they own -- Poisoned, Weakened and
// Held on the serpent, Inspired and Hasted on a fighter. A mock drawn from
// plain cells through the harness, not the game.

import {
  P, FLOOR, GREYS, PURPLES, WHITE, INK, hash, clamp, steps,
  cell, rect, line, ring,
  coilY, coilTop, coilBottom, coilCells, COIL_X0, COIL_X1,
  burst, chip, registerStatus, registerClass,
} from './harness.js';

// --- the statuses ------------------------------------------------------------------
// Each painter is a function of a column range as well as the frame, so a
// scene can lay the status down behind the front that is carrying it along
// the coil, and the painter proper is the same function over the whole body.
// The three serpent statuses sit in three different places so they stack
// legibly: Weakened dulls the hide itself, Poisoned speckles it and bubbles
// off its top, Held clasps it in bands tethered down to the floor.

// Weakened: the heal is cut, so the hide goes dull -- its white steps down a
// tone (two for a deep cut), a darker line drains slowly from the head to the
// tail, and a few grey drops fall off the belly.
function paintWeakened(g, t, s, lv, x0 = COIL_X0, x1 = COIL_X1) {
  const dull = GREYS[lv >= 0.5 ? 9 : 10];
  const drain = COIL_X0 + Math.floor((t * 9) % (COIL_X1 - COIL_X0 + 12)) - 6;
  coilCells(t, s, (cx, cy, edge) => {
    if (cx < x0 || cx > x1 || edge === 'bottom') return;
    const mid = Math.round(coilY(cx, t, s));
    if (cx === drain) cell(g, cx, cy, GREYS[7]);
    else if (cy === mid) cell(g, cx, cy, GREYS[7]);
    else cell(g, cx, cy, dull);
  });
  // the drops: a few columns, each on its own slow clock, falling three cells
  for (let i = 0; i < 7; i++) {
    const cx = COIL_X0 + 3 + Math.floor(hash(i * 5 + 1) * (COIL_X1 - COIL_X0 - 6));
    if (cx < x0 || cx > x1) continue;
    const a = (t * 0.7 + hash(i * 3 + 2)) % 1;
    const y = coilBottom(cx, t, s) + 1 + Math.floor(a * 4);
    cell(g, cx, y, GREYS[[8, 7, 5, 4][Math.floor(a * 4)]]);
  }
}

// Poisoned: purple specks in the hide and purple bubbles rising off its top.
// The stacks (level = stacks / 10) are the count of both, so two stacks read
// as a few and ten as a sickly coil.
function paintPoisoned(g, t, s, lv, x0 = COIL_X0, x1 = COIL_X1) {
  const k = clamp(lv, 0, 1);
  coilCells(t, s, (cx, cy, edge) => {
    if (cx < x0 || cx > x1 || edge === 'bottom') return;
    const h = hash(cx * 7 + cy * 29);
    if (h < 0.05 + 0.2 * k) cell(g, cx, cy, (Math.floor(t * 2 + h * 8) % 3) ? PURPLES[9] : PURPLES[11]);
  });
  const n = 3 + Math.round(12 * k);
  for (let i = 0; i < n; i++) {
    const cx = COIL_X0 + 2 + Math.floor(hash(i * 11 + 4) * (COIL_X1 - COIL_X0 - 4));
    if (cx < x0 || cx > x1) continue;
    const a = (t / 1.6 + hash(i * 7 + 9)) % 1;
    const y = coilTop(cx, t, s) - 1 - Math.floor(a * 4);
    const x = cx + (Math.floor(a * 4) === 2 ? 1 : 0);
    cell(g, x, y, PURPLES[[11, 10, 8, 6][Math.floor(a * 4)]]);
  }
}

// Held: the circle's bands clasp the coil at even spacing, each tethered down
// to the floor by a line of cells that crawls downward -- the coil is pinned,
// it cannot thrash. It does not stack.
const BAND_EVERY = 9;
function paintHeld(g, t, s, lv, x0 = COIL_X0, x1 = COIL_X1) {
  for (let cx = COIL_X0 + 4; cx <= COIL_X1 - 2; cx += BAND_EVERY) {
    if (cx < x0 || cx > x1) continue;
    const top = coilTop(cx, t, s), bot = coilBottom(cx, t, s);
    for (let y = top - 1; y <= bot + 1; y++)
      cell(g, cx, y, y === top - 1 || y === bot + 1 ? PURPLES[11] : PURPLES[9]);
    cell(g, cx - 1, top - 1, PURPLES[8]); cell(g, cx + 1, top - 1, PURPLES[8]);
    cell(g, cx - 1, bot + 1, PURPLES[8]); cell(g, cx + 1, bot + 1, PURPLES[8]);
    const crawl = Math.floor(t * 4) % 3;
    for (let y = bot + 3 + crawl; y < FLOOR - 1; y += 3) cell(g, cx, y, PURPLES[6]);
    rect(g, cx - 1, FLOOR - 1, 3, 1, PURPLES[5]);
  }
}

registerStatus('weakened', { name: 'Weakened', on: 'serpent',
  serpent: (g, t, s, lv) => paintWeakened(g, t, s, lv) });
registerStatus('poisoned', { name: 'Poisoned', on: 'serpent',
  serpent: (g, t, s, lv) => paintPoisoned(g, t, s, lv) });
registerStatus('held', { name: 'Held', on: 'serpent',
  serpent: (g, t, s, lv) => paintHeld(g, t, s, lv) });

// Inspired: +damage, drawn as an upward chevron over the head that bobs a
// cell; doubled (level 1, the Anthem's) it is two chevrons, stacked. Purple,
// because the song is the abyss's.
function chevron(g, cx, cy, tone) {
  cell(g, cx, cy + 1, tone); cell(g, cx + 1, cy, tone); cell(g, cx + 2, cy + 1, tone);
}
registerStatus('inspired', { name: 'Inspired', on: 'fighter',
  fighter(g, t, cx, cy, lv) {
    const bob = Math.floor(t * 2.5) % 2;
    chevron(g, cx, cy - 5 - bob, PURPLES[11]);
    if (lv >= 0.75) chevron(g, cx, cy - 7 - bob, PURPLES[9]);
    // a cell at each shoulder, so it reads as the whole fighter lifted
    cell(g, cx - 1, cy, PURPLES[8]); cell(g, cx + 3, cy, PURPLES[8]);
  } });

// Hasted: attacks more often, drawn as speed lines streaming off the back of
// the body and a cell kicked up at the heel -- sideways and white, where
// Inspired is upward and purple, so the two never read as each other.
registerStatus('hasted', { name: 'Hasted', on: 'fighter',
  fighter(g, t, cx, cy, lv) {
    for (let r = 0; r < 3; r++) {
      const a = (t * 3 + r * 0.37) % 1;
      const x = cx - 2 - Math.floor(a * 5);
      const tone = GREYS[[11, 10, 8, 6, 5][Math.floor(a * 5)]];
      cell(g, x, cy + r, tone); cell(g, x - 1, cy + r, r === 1 ? tone : GREYS[5]);
    }
    const k = Math.floor(t * 8) % 4;
    if (k < 2) cell(g, cx - 1 - k, cy + 2 - k, GREYS[8]);
  } });

// --- shared motion -------------------------------------------------------------------

// A point along a thrown or cast path from a to b over [t0, t0 + dur], lifted
// into an arc by `lift` cells at its middle; null outside it.
function along(t, t0, dur, ax, ay, bx, by, lift = 0) {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return null;
  return { x: ax + (bx - ax) * u, y: ay + (by - ay) * u - lift * 4 * u * (1 - u), u };
}

// A ring drawn a cell at a time round from the top, `frac` of the way: the
// Binding's circle being drawn.
function ringPart(g, cx, cy, r, frac, tone) {
  const n = Math.max(8, Math.ceil(Math.PI * 2 * r));
  for (let k = 0; k < n * frac; k++) {
    const a = -Math.PI / 2 + k / n * Math.PI * 2;
    cell(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, tone);
  }
}

// A status carried along the coil from where it landed: two fronts run out
// to the head and the tail over `span` seconds, each a bright column of cells
// with a dimmer wake, and behind them the status is already laid (`paint` over
// the swept columns). After `span` the scene declares the status and the
// painter carries it whole.
const SPREAD_S = 1.2;
function spread(g, t, s, at, fromX, paints, span = SPREAD_S) {
  const a = t - at;
  if (a < 0 || a >= span) return;
  const reach = (a / span) * Math.max(fromX - COIL_X0, COIL_X1 - fromX);
  const x0 = Math.max(COIL_X0, Math.round(fromX - reach)), x1 = Math.min(COIL_X1, Math.round(fromX + reach));
  for (const p of paints) p(g, t, s, x0, x1);
  for (const [fx, dir] of [[x0, -1], [x1, 1]]) {
    const edge = (fx === COIL_X0 && dir < 0) || (fx === COIL_X1 && dir > 0);
    if (edge && a > span * 0.9) continue;
    [[0, PURPLES[11]], [1, PURPLES[9]], [2, PURPLES[7]]].forEach(([back, tone]) => {
      const x = fx - dir * back;
      for (let y = coilTop(x, t, s) - (back ? 0 : 1); y <= coilBottom(x, t, s) + (back ? 0 : 1); y++) cell(g, x, y, tone);
    });
  }
}

// --- the Hexer ------------------------------------------------------------------------
// Horned hood, a wand. The hex is a small sigil of purple cells floated up to
// the coil; where it lands it bites a little and its curse runs the length of
// the coil both ways. The sigil's shape says the branch: a diamond for the
// plain hex, the same dripping for Affliction, a ring for Binding, a cross
// for Doom.

const HEX_TX = 28;             // the column the hex lands on
const HEX_FLY = 0.9;           // a hex's flight, seconds
const HEX_WIND = 0.4;          // the wand's wind-up before it lets go

function wand(g, me, t, castAt) {
  const a = t - castAt;
  const hot = a >= 0 && a < HEX_WIND + 0.15;
  cell(g, me.x + 3, me.y + 1, GREYS[7]);
  cell(g, me.x + 4, me.y, GREYS[8]);
  cell(g, me.x + 4, me.y - 1, hot ? WHITE : PURPLES[9]);
  if (hot && a < HEX_WIND) {
    const r = 1 + Math.floor((a / HEX_WIND) * 2);
    ring(g, me.x + 4, me.y - 1, r, PURPLES[r === 1 ? 11 : 9]);
  }
}

function sigil(g, x, y, shape, t) {
  const spin = Math.floor(t * 8) % 2;
  if (shape === 'ring') { ring(g, x, y, 1.5, PURPLES[11]); return; }
  if (shape === 'cross') {
    for (const d of [-1, 1]) { cell(g, x + d, y + d, PURPLES[11]); cell(g, x + d, y - d, PURPLES[11]); }
    cell(g, x, y, WHITE); return;
  }
  const pts = spin ? [[0, -1], [1, 0], [0, 1], [-1, 0]] : [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [dx, dy] of pts) cell(g, x + dx, y + dy, PURPLES[11]);
  cell(g, x, y, shape === 'drip' ? PURPLES[9] : INK);
}

// One hex, cast at `castAt`: the wind-up, the flight with a trail, the bite
// where it lands. Returns the landing time.
function hex(g, t, api, castAt, shape) {
  const { me, st } = api;
  const go = castAt + HEX_WIND, land = go + HEX_FLY;
  const tx = HEX_TX, ty = () => coilBottom(tx, land, st) + 1;
  for (let k = 3; k >= 0; k--) {
    const p = along(t - k * 0.06, go, HEX_FLY, me.x + 4, me.y - 2, tx, ty(), 2);
    if (!p) continue;
    if (k === 0) sigil(g, p.x, p.y, shape, t);
    else cell(g, p.x, p.y, PURPLES[[0, 8, 6, 4][k]]);
    if (shape === 'drip' && k === 0) {
      for (let d = 1; d <= 2; d++) {
        const q = along(t - d * 0.12, go, HEX_FLY, me.x + 4, me.y - 2, tx, ty(), 2);
        if (q) cell(g, q.x, q.y + 1 + d, PURPLES[d === 1 ? 9 : 6]);
      }
    }
  }
  const cy = coilBottom(tx, land, st);
  burst(g, t, land, tx, cy, 0.2, 7);
  chip(g, t, land, tx, cy, 0.2, 7);
  const a = t - land;
  if (a >= 0 && a < 0.5) ring(g, tx, cy, 1 + Math.floor(a * 8), PURPLES[a < 0.25 ? 11 : 8]);
  return land;
}
const landOf = castAt => castAt + HEX_WIND + HEX_FLY;

const HEX_LV = 0.35;          // Weakened from a hex, 10% cut
registerClass({
  key: 'hexer', name: 'Hexer', station: 'circle', group: 'word',
  look: 'a horned hood; a short wand, a sigil floated up to the coil',
  hat(g, cx, cy) {
    rect(g, cx, cy - 1, 3, 1, GREYS[7]);
    cell(g, cx - 1, cy - 1, GREYS[9]); cell(g, cx + 3, cy - 1, GREYS[9]);
    cell(g, cx - 1, cy - 2, WHITE); cell(g, cx + 3, cy - 2, WHITE);
  },
  scenes: [
    { name: 'Base', dur: 5,
      about: 'A hex every 5 s: a little damage where it lands, and the whole coil Weakened (heal cut 10%).',
      state(t, api) { if (t >= landOf(0.3) + SPREAD_S) api.status('weakened', HEX_LV); },
      draw(g, t, api) {
        wand(g, api.me, t, 0.3);
        const land = hex(g, t, api, 0.3, 'diamond');
        spread(g, t, api.st, land, HEX_TX, [(g, t, s, a, b) => paintWeakened(g, t, s, HEX_LV, a, b)]);
      } },
    { name: 'Affliction', dur: 8,
      about: 'Keystone: the hex Poisons as well, two stacks a hex; a second hex takes it to four.',
      state(t, api) {
        if (t >= landOf(0.3) + SPREAD_S) { api.status('weakened', HEX_LV); api.status('poisoned', 0.2); }
        if (t >= landOf(4.3) + SPREAD_S) api.status('poisoned', 0.4);
      },
      draw(g, t, api) {
        for (const c of [0.3, 4.3]) {
          wand(g, api.me, t, c);
          const land = hex(g, t, api, c, 'drip');
          const lv = c < 1 ? 0.2 : 0.4;
          spread(g, t, api.st, land, HEX_TX, [
            ...(c < 1 ? [(g, t, s, a, b) => paintWeakened(g, t, s, HEX_LV, a, b)] : []),
            (g, t, s, a, b) => paintPoisoned(g, t, s, lv, a, b)]);
        }
      } },
    { name: 'Binding', dur: 6,
      about: 'Keystone: the hex draws a circle round the coil, and the coil is Held -- clasped and tethered, it cannot thrash or heal.',
      state(t, api) {
        const done = landOf(0.3) + 0.6 + SPREAD_S;
        if (t >= done) { api.status('held', 1); api.status('weakened', HEX_LV); }
      },
      draw(g, t, api) {
        wand(g, api.me, t, 0.3);
        const land = hex(g, t, api, 0.3, 'ring');
        const a = t - land, cy = Math.round(coilY(HEX_TX, t, api.st));
        // the circle, drawn round the coil a cell at a time, then fading down
        if (a >= 0 && a < 0.6) ringPart(g, HEX_TX, cy, 5, a / 0.6, PURPLES[11]);
        else if (a >= 0.6 && a < 0.6 + SPREAD_S) ring(g, HEX_TX, cy, 5, PURPLES[[11, 9, 7, 5][Math.floor((a - 0.6) / SPREAD_S * 4)]]);
        spread(g, t, api.st, land + 0.6, HEX_TX, [
          (g, t, s, a, b) => paintWeakened(g, t, s, HEX_LV, a, b),
          (g, t, s, a, b) => paintHeld(g, t, s, 1, a, b)]);
      } },
    { name: 'Doom', dur: 6,
      about: 'Keystone: the hex Marks the coil -- a death-mark stamped where it lands -- as well as Weakening it.',
      state(t, api) {
        const land = landOf(0.3);
        if (t >= land + 0.6) api.status('marked', 1);
        if (t >= land + 0.6 + SPREAD_S) api.status('weakened', HEX_LV);
      },
      draw(g, t, api) {
        wand(g, api.me, t, 0.3);
        const land = hex(g, t, api, 0.3, 'cross');
        const a = t - land, cy = Math.round(coilY(HEX_TX, t, api.st));
        // the mark stamped: a big cross in a ring that closes onto the spot
        if (a >= 0 && a < 0.6) {
          const r = Math.max(1, 5 - Math.floor(a / 0.6 * 5));
          const tone = a < 0.3 ? INK : PURPLES[11];   // cut into the white hide
          ring(g, HEX_TX, cy, r + 1, PURPLES[9]);
          for (let d = -r; d <= r; d++) { cell(g, HEX_TX + d, cy + d, tone); cell(g, HEX_TX + d, cy - d, tone); }
        }
        spread(g, t, api.st, land + 0.6, HEX_TX, [(g, t, s, a, b) => paintWeakened(g, t, s, HEX_LV, a, b)]);
      } },
  ],
});

// --- the Bard --------------------------------------------------------------------------
// A cap with a plume, a lute. She does no damage: her song is a run of purple
// cells that travels from her to the other fighter (and, in the Requiem, up
// to the coil), and what it does shows on the one it reaches. The other
// fighter throws a stone at the coil on its own clock, so Inspired is seen as
// a bigger bite and Hasted as more of them.

const SONG_AT = 0.2;           // she starts to sing
function lute(g, me, t, rate = 4) {
  rect(g, me.x - 2, me.y + 1, 2, 2, GREYS[7]);
  cell(g, me.x - 3, me.y, GREYS[6]); cell(g, me.x - 4, me.y - 1, GREYS[8]);
  if (Math.floor(t * rate) % 2) cell(g, me.x - 1, me.y + 2, WHITE);
}
// Little ripples off her head: a quarter ring opening up and toward where
// the song goes, one every `every` seconds.
function voice(g, me, t, every = 0.5, dir = 1, tone = PURPLES[10]) {
  const a = (t % every) / every, r = 1 + Math.floor(a * 3);
  const hx = me.x + 1, hy = me.y - 3;
  for (let k = 0; k <= r * 2; k++) {
    const ang = -Math.PI / 2 + (dir > 0 ? 1 : -1) * (k / (r * 2)) * Math.PI / 2;
    cell(g, hx + Math.cos(ang) * r, hy + Math.sin(ang) * r, a < 0.7 ? tone : PURPLES[7]);
  }
}
// The song: a wave of cells running from a to b, drawn only as far as it has
// reached, in travelling pulses. `amp` is its swing, `period` the pulse
// spacing, `lit` how much of each pulse is lit, `speed` cells a second.
function song(g, t, start, ax, ay, bx, by, o = {}) {
  const { amp = 1.5, period = 6, lit = 3, speed = 22, wave = 0.55, tones = [11, 10, 8, 6], phase = 0 } = o;
  const len = Math.hypot(bx - ax, by - ay), n = Math.round(len);
  const reach = (t - start) * speed;
  if (reach <= 0) return 0;
  const nx = -(by - ay) / len, ny = (bx - ax) / len;
  for (let i = 0; i <= n && i <= reach; i++) {
    const ph = ((reach - i + phase) % period + period) % period;
    if (ph >= lit) continue;
    const off = amp * Math.sin(i * wave - t * 5 + phase);
    const tone = PURPLES[tones[Math.min(tones.length - 1, Math.floor(ph / lit * tones.length))]];
    cell(g, ax + (bx - ax) * i / n + nx * off, ay + (by - ay) * i / n + ny * off, tone);
  }
  return clamp(reach / len, 0, 1);
}
const reachedAt = (ax, ay, bx, by, speed = 22) => SONG_AT + Math.hypot(bx - ax, by - ay) / speed;

// The other fighter's stone, thrown at the coil at each time in `times`: it
// flies, it bites, bigger for `k` -- the buffs' effect, seen.
const STONE_TX = 40, STONE_FLY = 0.45;
function stones(g, t, api, times, kOf) {
  const { buddy, st } = api;
  times.forEach((l, i) => {
    const land = l + STONE_FLY, ty = coilBottom(STONE_TX, land, st);
    const p = along(t, l, STONE_FLY, buddy.x + 1, buddy.y - 1, STONE_TX, ty, 3);
    if (p) cell(g, p.x, p.y, WHITE);
    const k = kOf(l);
    burst(g, t, land, STONE_TX, ty, k, 30 + i);
    chip(g, t, land, STONE_TX, ty, k, 30 + i);
  });
}

const B_AX = me => [me.x + 4, me.y - 1];
const B_BX = b => [b.x - 1, b.y - 1];
const ME0 = { x: 17, y: 26 }, BUD0 = { x: 43, y: 26 };  // the harness's places, for state()
const INSPIRE_AT = reachedAt(...B_AX(ME0), ...B_BX(BUD0));
const HASTE_AT = reachedAt(...B_AX(ME0), ...B_BX(BUD0), 34);

registerClass({
  key: 'bard', name: 'Bard', station: 'circle', group: 'word',
  look: 'a cap with a plume; a lute, a song of purple cells to the others',
  hat(g, cx, cy, t) {
    rect(g, cx, cy - 1, 3, 1, GREYS[9]);
    cell(g, cx + 1, cy - 2, GREYS[9]);
    // the plume, back over the right, nodding to the song
    const nod = Math.floor(t * 2) % 2;
    cell(g, cx + 3, cy - 1 - nod, WHITE);
    cell(g, cx + 4, cy - 2, nod ? GREYS[10] : WHITE);
  },
  scenes: [
    { name: 'Base', dur: 6,
      about: 'She sings, and the other fighter is Inspired (+10% damage): its stones bite harder once the song reaches it. No damage of her own.',
      state(t, api) { if (t >= INSPIRE_AT) api.buff('buddy', 'inspired', 0.5); },
      draw(g, t, api) {
        const { me, buddy } = api;
        lute(g, me, t); if (t >= SONG_AT) voice(g, me, t);
        song(g, t, SONG_AT, ...B_AX(me), ...B_BX(buddy));
        stones(g, t, api, [0.5, 1.9, 3.3, 4.7], l => l + STONE_FLY >= INSPIRE_AT ? 0.5 : 0.25);
      } },
    { name: 'Anthem', dur: 6,
      about: 'Keystone: Inspired doubles -- a louder song, two lines of it, and the other fighter lifted twice over.',
      state(t, api) { if (t >= INSPIRE_AT) api.buff('buddy', 'inspired', 1); },
      draw(g, t, api) {
        const { me, buddy } = api;
        lute(g, me, t, 6); if (t >= SONG_AT) { voice(g, me, t, 0.35); voice(g, me, t + 0.17, 0.35, 1, PURPLES[8]); }
        song(g, t, SONG_AT, ...B_AX(me), ...B_BX(buddy), { amp: 2.2 });
        song(g, t, SONG_AT, ...B_AX(me), ...B_BX(buddy), { amp: 2.2, phase: Math.PI, tones: [9, 8, 6] });
        stones(g, t, api, [0.5, 1.9, 3.3, 4.7], l => l + STONE_FLY >= INSPIRE_AT ? 0.75 : 0.25);
      } },
    { name: 'Tempo', dur: 6,
      about: 'Keystone: the other fighter is Hasted (+20%): a quick, clipped song, and its stones come faster once it lands.',
      state(t, api) { if (t >= HASTE_AT) api.buff('buddy', 'hasted', 1); },
      draw(g, t, api) {
        const { me, buddy } = api;
        lute(g, me, t, 10); if (t >= SONG_AT) voice(g, me, t, 0.25);
        song(g, t, SONG_AT, ...B_AX(me), ...B_BX(buddy), { amp: 0, period: 3, lit: 1, speed: 34, tones: [11] });
        // a stone every 1.2 s, then every 0.6 s once Hasted
        stones(g, t, api, [0.2, 1.4, 2.0, 2.6, 3.2, 3.8, 4.4, 5.0], () => 0.25);
      } },
    { name: 'Requiem', dur: 7,
      about: 'Keystone: a dirge -- a slow, low song up to the coil -- and the whole serpent is Weakened (heal cut 15%).',
      state(t, api) {
        const at = reachedAt(21, 25, 24, 18, 8);
        if (t >= at + SPREAD_S) api.status('weakened', 0.5);
      },
      draw(g, t, api) {
        const { me, st } = api;
        lute(g, me, t, 1.5); if (t >= SONG_AT) voice(g, me, t, 1.2, 1, PURPLES[7]);
        const tx = 24, ty = coilBottom(tx, t, st) + 1;
        song(g, t, SONG_AT, me.x + 4, me.y - 1, tx, ty,
          { amp: 1, period: 9, lit: 5, speed: 8, wave: 0.35, tones: [9, 8, 7, 6, 5] });
        const at = reachedAt(21, 25, 24, 18, 8);
        spread(g, t, st, at, tx, [(g, t, s, a, b) => paintWeakened(g, t, s, 0.5, a, b)]);
      } },
  ],
});
