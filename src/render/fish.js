// The owner's eight creatures (docs/mocks/heal-bestiary-2026-09-30.html),
// seen through the rift (render/riftlife.js): drawn cell by cell from a local
// frame, x running back from the front tip and y down. They swam the deep as
// the serpent's meal stream until the meal became its constrict.

import { GREYS, PURPLES } from './deeptones.js';
import { FLOW_KINDS, FLOW_LENGTHS } from '../config.js';

// The mock's tones, on the deep's own ramps.
const G = [4, 6, 8, 9, 10, 11].map(i => GREYS[i]);
const Pu = [2, 3, 4, 5, 7, 9, 10, 11, 11].map(i => PURPLES[i]);
const BLACK = GREYS[0];
const unit = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };

const ell = (put, cx, cy, rx, ry, tone) => {
  for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) put(x, y, tone(x, y, d));
    }
};
const SP = [
  { name: 'Lantern angler', L: FLOW_LENGTHS[0], bob: t => Math.sin(t * 2.4) * 1.6,
    draw(put, t) {
      const flick = Math.sin(t * 9), jaw = Math.sin(t * 6) > 0.3 ? 1 : 0;
      ell(put, 6.5, 0, 6, 3.2, (x, y, d) => y > 1 ? G[1] : d > 0.7 ? G[3] : G[2]);
      for (let x = 0; x <= 4; x++) put(x, 2 + jaw, G[1]);
      for (const x of [0, 2, 4]) put(x, 1, G[5]);
      for (let i = 0; i < 4; i++) { put(11 + i, Math.round(flick * i * 0.4) - 1, G[2]); put(11 + i, Math.round(flick * i * 0.4) + 1, G[1]); }
      put(12, Math.round(flick * 1.6), G[2]);
      put(8, -4, G[1]); put(9, -4, G[1]);
      put(4, -1, G[5]); put(3, -1, G[0]);
      const bulb = Pu[6 + Math.round(Math.sin(t * 5) + 1)];
      for (const [x, y] of [[9, -3], [8, -4], [6, -5], [4, -6], [2, -6], [1, -5]]) put(x, y, G[1]);
      put(0, -5, bulb); put(0, -4, bulb); put(-1, -5, Pu[8]); put(-1, -4, bulb);
    } },
  { name: 'Ribbon eel', L: FLOW_LENGTHS[1], bob: t => 0,
    draw(put, t) {
      for (let i = 0; i < 26; i++) {
        const amp = 0.6 + i * 0.09, yy = Math.round(Math.sin(i / 2.4 - t * 7) * Math.min(2.6, amp)), th = i < 3 ? 2 : i < 18 ? 1.5 : 1;
        put(i, yy, Pu[i < 3 ? 7 : 6]);
        if (th >= 1.5) put(i, yy + 1, Pu[i % 4 < 2 ? 8 : 7]);
        if (i > 3 && i < 21 && i % 2 === 0) put(i, yy - 1, Pu[4]);
        if (i < 3) put(i, yy - 1, Pu[6]);
      }
      put(1, Math.round(Math.sin(1 / 2.4 - t * 7) * 0.7) - 1, G[5]);
      put(-1, Math.round(Math.sin(-t * 7) * 0.6), G[5]);
    } },
  { name: 'Glass jelly', L: FLOW_LENGTHS[2], bob: t => Math.sin(t * 1.5) * 3,
    draw(put, t) {
      const pulse = Math.sin(t * 3.2), rx = 5 + pulse * 0.8, ry = 4 - pulse * 0.9;
      for (let x = 0; x <= 6; x++) {
        const w = ry * Math.sqrt(Math.max(0, 1 - ((rx - x) / rx) ** 2));
        for (let y = -Math.round(w); y <= Math.round(w); y++)
          put(x, y, Math.abs(y) >= Math.round(w) || x === 0 ? G[5] : G[3 + ((x + y) & 1)]);
      }
      for (let j = 0; j < 3; j++) put(2 + j * 1.5, Math.round(Math.sin(t * 3 + j * 2) * 1.4), Pu[Math.sin(t * 4 + j * 2.1) > 0 ? 8 : 6]);
      for (let j = -2; j <= 2; j++)
        for (let x = 7; x < 18; x++) put(x, Math.round(j * 0.9 + Math.sin((x - 7) / 1.6 - t * 4 + j) * (0.6 + (x - 7) * 0.12)), (x + j) % 3 ? G[2] : G[1]);
      for (let x = 7; x < 12; x++) for (const o of [-1, 1]) put(x, o + Math.round(Math.sin(x - t * 3)), Pu[5]);
    } },
  { name: 'Skull fish', L: FLOW_LENGTHS[3], bob: t => Math.sin(t * 0.9) * 1,
    draw(put, t) {
      const chat = Math.sin(t * 11) > 0 ? 1 : 0, sway = x => Math.round(Math.sin(x / 3.2 - t * 5) * 1.2);
      ell(put, 4.5, -0.5, 4.3, 3.6, (x, y, d) => d > 0.72 ? G[5] : G[4]);
      for (let x = 0; x <= 2; x++) { put(x, 0, G[4]); put(x, 1, G[4]); }
      ell(put, 3.6, -1, 1.7, 1.6, () => G[0]);
      put(3, -1, G[5]);
      for (const x of [0, 1, 2, 3, 4]) put(x, 2, x % 2 ? G[5] : G[2]);
      for (let x = 0; x <= 5; x++) { put(x, 3 + chat, G[3]); if (x % 2 === 0) put(x, 2 + chat, G[5]); }
      for (let x = 7; x < 20; x++) put(x, sway(x), x % 2 ? G[4] : G[3]);
      for (let x = 8; x <= 14; x += 2) for (const o of [-2, -1, 1, 2]) put(x, sway(x) + o, o === -1 || o === 1 ? G[3] : G[2]);
      for (const o of [-2, -1, 1, 2]) put(19 + (Math.abs(o) === 2 ? 1 : 0), sway(19) + o, G[3]);
    } },
  { name: 'Wandering eye', L: FLOW_LENGTHS[4], bob: t => Math.sin(t * 2.6) * 2,
    draw(put, t) {
      const blink = (t % 1.7) < 0.22 ? (t % 1.7) / 0.22 : 0, lid = Math.round(Math.sin(blink * Math.PI) * 7);
      ell(put, 4, 0, 4.2, 4.2, (x, y, d) => d > 0.8 ? G[3] : G[5]);
      ell(put, 2.4, 0, 2.2, 2.2, () => Pu[8]);
      ell(put, 2.4, 0, 1.4, 1.4, () => Pu[6]);
      ell(put, 2.2, 0, 0.7, 0.7, () => BLACK);
      put(3, -1, G[5]);
      for (const [x, y] of [[6, -2], [7, 0], [6, 2], [5, -3]]) put(x, y, Pu[4]);
      for (let y = -5; y < -5 + lid; y++) for (let x = -1; x <= 9; x++) if (((x - 4) / 4.6) ** 2 + (y / 4.6) ** 2 <= 1) put(x, y, G[2]);
      for (let i = 0; i < 16; i++) put(8 + i, Math.round(Math.sin(i / 2 - t * 5) * (0.8 + i * 0.1)), Pu[Math.max(1, 6 - (i >> 2))]);
    } },
  { name: 'Spiral drifter', L: FLOW_LENGTHS[5], bob: t => Math.sin(t * 1.8) * 1.5,
    draw(put, t) {
      const rot = t * 2.6;
      ell(put, 7, 0, 4.6, 4.6, (x, y, d) => {
        const r = Math.hypot(x - 7, y), ang = Math.atan2(y, x - 7) - rot;
        const turn = ((ang / (Math.PI * 2) + r / 1.7) % 1 + 1) % 1;
        return d > 0.8 ? G[5] : turn < 0.35 ? G[1] : turn < 0.7 ? G[3] : G[4];
      });
      ell(put, 1.6, 1, 2.6, 1.6, () => Pu[5]);
      ell(put, 1.2, 1, 1.4, 0.8, () => Pu[6]);
      const w = Math.sin(t * 5);
      put(-1, -1 + Math.round(w), Pu[7]); put(-2, -2 + Math.round(w * 1.5), Pu[6]);
      put(-1, 2 - Math.round(w), Pu[7]); put(-2, 3 - Math.round(w * 1.5), Pu[6]);
      put(1, 0, G[5]);
    } },
  { name: 'Many-mouthed blob', L: FLOW_LENGTHS[6], bob: t => Math.sin(t * 2.2) * 2,
    draw(put, t) {
      const lobes = [[7, 0, 4.4 + Math.sin(t * 3) * 0.7, 3.6], [3.5, -1, 3 + Math.sin(t * 4 + 1) * 0.6, 2.8], [10.5, 1, 3.2 + Math.sin(t * 3.5 + 2) * 0.6, 3], [6, 2.4, 2.6 + Math.sin(t * 5 + 3) * 0.5, 2.4]];
      // Indexed, not destructured: this is asked a thousand times a frame,
      // and a destructured array is an iterator made each time.
      const inside = (x, y) => {
        for (const l of lobes) if (((x - l[0]) / l[2]) ** 2 + ((y - l[1]) / l[3]) ** 2 <= 1) return true;
        return false;
      };
      for (let x = -1; x < 16; x++) for (let y = -6; y <= 6; y++) {
        if (!inside(x, y)) continue;
        const rim = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1);
        put(x, y, rim ? Pu[7] : Pu[4 + ((x * 3 + y * 5) & 1) + (unit(x * 7 + y) > 0.8 ? 1 : 0)]);
      }
      [[3, 0, 0], [7, -2, 1.7], [9, 2, 3.1], [5, 3, 4.4], [12, 0, 5.2]].forEach(([x, y, ph]) => {
        const open = Math.max(0, Math.sin(t * 3 + ph)) * 1.4;
        if (open > 0.3) { put(x, y, BLACK); if (open > 0.8) put(x, y + 1, BLACK); put(x + 1, y, G[5]); }
      });
      for (let x = 0; x < 15; x += 2) if (unit(x + Math.floor(t * 6)) > 0.5) { put(x, -5 - (unit(x) > 0.5 ? 1 : 0), Pu[6]); put(x, 5 + (unit(x + 3) > 0.5 ? 1 : 0), Pu[6]); }
    } },
  { name: 'Toothed ring', L: FLOW_LENGTHS[7], bob: t => 0,
    draw(put, t) {
      ell(put, 5, 0, 5.2, 5.2, (x, y, d) => d > 0.72 ? G[3] : d > 0.32 ? G[2] : BLACK);
      for (let i = 0; i < 12; i++) { const a = t * 5 + i * Math.PI / 6; put(5 + Math.cos(a) * 5.6, Math.sin(a) * 5.6, G[5]); }
      for (let i = 0; i < 8; i++) { const a = -t * 7 + i * Math.PI / 4; put(5 + Math.cos(a) * 2.6, Math.sin(a) * 2.6, G[4]); }
      put(5, 0, G[0]);
    } },
];

if (SP.length !== FLOW_KINDS) throw new Error('fish: FLOW_KINDS is the creatures drawn here');

// The same eight seen through the rift (render/riftlife.js): one drawn into
// any `put` at its own clock `t`, in the deep's drawn tones, and its bob.
export const drawKind = (k, put, t) => SP[k].draw(put, t);
export const bobOf = (k, t) => SP[k].bob(t);
