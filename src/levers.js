// The casino's controls, on the building itself: the arm beside the funnel,
// and the panel of buttons under the bins' feet. No board -- the bet is set
// on the machine's face and the arm plays it, so the building says what it
// does where it does it. See DESIGN.md, "The machine".
//
// Owns where each control stands, whether it is live, what working it does,
// and the hit test; render/casino.js draws them off `leverShape` and
// `panelLayout`.

import { P, ARM_LENGTH, ARM_BOSS, ARM_SWING, LEVER_HIT, LEVER_SWING_MS,
         BUTTON_PRESS_MS, PANEL_ROWS, PANEL_ROWS_N, PANEL_GAP, PANEL_COINS, WINDOW_DIGITS, CASINO_CHIPS } from './config.js';
import { S, casino } from './state.js';
import { canLet, letGo, canBank, bank, canPick, pickCoin, pickChip, coinOpen, chipCovered, sameBet, canSame } from './casino.js';
import { now } from './clock.js';
import { coarse } from './prefs.js';

// The arm: which wall it is on, how far down the building its boss sits, and
// the two halves of a decision -- may it, and do it. It stands on the head's
// right wall, the top-right thing on the machine.
export const LEVERS = [
  { key: 'casino-gate', name: 'the arm', kind: 'arm',
    side: 'right', row: () => 4, live: canLet, pull: letGo }
];

// The panel, left to right: the coins, the chips, the window, same bet, the
// sack. Each button says what it wears (`face`) and how wide its recess is,
// in cells -- the glyph plus a cell of air each side -- so the row is as
// wide as its words and no wider. `live` is whether it may be pressed,
// `on` whether it is the chosen one.
const chipLabel = c => c === 'all' ? 'ALL' : c === 1000 ? '1k' : String(c);
const COIN_NAME = { dust: 'pebbles', spore: 'crops', shard: 'ore', spark: 'sparks' };
export const BUTTONS = [
  ...PANEL_COINS.map(cur => ({
    key: `coin-${cur}`, name: COIN_NAME[cur], row: 0,
    face: { mark: cur }, w: 5 + 2 * PANEL_GAP,
    shown: () => coinOpen(cur), live: () => canPick(), on: () => S.coin === cur, pull: () => pickCoin(cur)
  })),
  ...CASINO_CHIPS.map((chip, i) => ({
    key: `chip-${chipLabel(chip).toLowerCase()}`, name: chip === 'all' ? 'all in' : String(chip), row: 0,
    face: { word: chipLabel(chip) }, w: wordCells(chipLabel(chip)) + 2 * PANEL_GAP,
    shown: () => true, live: () => canPick() && chipCovered(chip), on: () => S.chip === i, pull: () => pickChip(i)
  })),
  { key: 'window', name: null, row: 1, face: { window: true }, w: WINDOW_DIGITS * 4 + 5 + 2 * PANEL_GAP,
    shown: () => true, live: () => true, on: () => false, pull: null },
  { key: 'same', name: 'same bet', row: 1, face: { glyph: 'again' }, w: 8 + 2 * PANEL_GAP,
    shown: () => true, live: canSame, on: () => false, pull: sameBet },
  { key: 'bank', name: 'bank', row: 1, face: { glyph: 'sack' }, w: 8 + 2 * PANEL_GAP,
    shown: () => true, live: canBank, on: () => false, pull: bank }
];

// The digit face is three cells a figure and a cell of air between (the
// sign's, see render/casino.js); 'k' and the letters are the same width.
function wordCells(word) { return word.length * 3 + (word.length - 1); }

// Where each button stands in the head: the shown ones laid left to right,
// rims shared, each row centered on the front -- one row, or two with the
// coins and chips above and the window, same bet and the sack below (the
// rows share their rim too). Returns [{ button, x, y, w, h }] in world
// pixels, the box being the recess plus its rim.
export function panelLayout() {
  const out = [];
  for (let r = 0; r < PANEL_ROWS_N; r++) {
    const shown = BUTTONS.filter(b => b.shown() && (PANEL_ROWS_N === 1 || b.row === r));
    const cells = shown.reduce((n, b) => n + b.w + 1, 1);
    const left = casino.x + Math.floor((casino.w / P - cells) / 2) * P;
    const y = casino.y + P + r * (PANEL_ROWS + 1) * P;
    let x = left;
    for (const b of shown) {
      out.push({ button: b, x, y, w: (b.w + 2) * P, h: (PANEL_ROWS + 2) * P });
      x += (b.w + 1) * P;
    }
  }
  return out;
}

// Where a control's pivot is, in the world: on the wall, `row` cells down
// from the roof, and which way it reaches out. The arm's pivot stands out
// from the wall on its boss, so the stem rises beside the funnel's wall
// rather than along it.
export function leverAt(l) {
  const dir = l.side === 'left' ? -1 : 1;
  const wall = l.side === 'left' ? casino.x : casino.x + casino.w;
  const x = wall + (l.kind === 'arm' ? dir * ARM_BOSS * P : 0);
  return { x, y: casino.y + l.row() * P, dir, wall };
}

// How far along its motion a control is, from the moment it was worked.
const since = key => S.leverPulled && S.leverPulled.key === key ? now() - S.leverPulled.at : Infinity;

// The arm's shape to draw: its angle from straight up, swinging down
// through `ARM_SWING` over `LEVER_SWING_MS` and back up over twice that,
// and lying at the bottom of the swing when dead.
export function leverShape(l) {
  const live = l.live();
  const t = since(l.key) / LEVER_SWING_MS;
  // the pull itself is drawn black to the bottom of the swing whether or
  // not the hand it let go has already made the arm dead; a dead arm then
  // lies where the pull left it
  const k = t < 1 ? t : !live ? 1 : t < 3 ? 1 - (t - 1) / 2 : 0;
  return { live: live || t < 1, angle: ARM_SWING * k };
}

// A button's state to draw: live, chosen, or pressed this beat.
export const buttonShape = b => ({ live: b.live(), on: b.on(), pressed: since(b.key) < BUTTON_PRESS_MS });

// The box a pointer has to be in. The arm's is the whole of its swing, the
// loudest target on the building; a button's is its recess and rim. Each
// opens out to `LEVER_HIT` cells on a phone so a thumb can find it, and the
// arm's takes in a cell of the wall, since the pivot stands on it.
export function leverBox(l) {
  const { y, dir, wall } = leverAt(l);
  const grow = coarse() ? LEVER_HIT : 0;
  let out = ARM_LENGTH + ARM_BOSS + 2, up = ARM_LENGTH + 2, down = Math.ceil(ARM_LENGTH * Math.sin(ARM_SWING - Math.PI / 2)) + 2;
  out = Math.max(out, grow); up = Math.max(up, grow); down = Math.max(down, grow / 2);
  const left = dir < 0 ? wall - out * P : wall - P;
  return { x: left, y: y - up * P, w: (out + 1) * P, h: (up + down) * P };
}
function grown(box) {
  const min = (coarse() ? LEVER_HIT : 0) * P;
  const w = Math.max(box.w, min), h = Math.max(box.h, min);
  return { x: box.x - (w - box.w) / 2, y: box.y - (h - box.h) / 2, w, h };
}
const inBox = (b, x, y) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;

export function leverUnder(x, y) {
  if (!S.casinoOpen) return null;
  for (const l of LEVERS) if (inBox(leverBox(l), x, y)) return l;
  return null;
}
export function buttonUnder(x, y) {
  if (!S.casinoOpen) return null;
  for (const at of panelLayout()) if (at.button.pull && inBox(grown(at), x, y)) return at.button;
  return null;
}

// Work one, by key: true when it was live and did its thing. The same call
// the pointer makes, so a check that pulls the arm pulls it the player's way.
export function pullLever(key) {
  const l = LEVERS.find(x => x.key === key);
  if (!l || !S.casinoOpen || !l.live()) return false;
  l.pull();
  S.leverPulled = { key, at: now() };
  return true;
}
export function pressButton(key) {
  const b = BUTTONS.find(x => x.key === key);
  if (!b || !S.casinoOpen || !b.pull || !b.shown() || !b.live()) return false;
  b.pull();
  S.leverPulled = { key, at: now() };
  return true;
}

// A click or a tap on a control.
export function leverHit(x, y) {
  const l = leverUnder(x, y);
  if (l) { pullLever(l.key); return true; }
  const b = buttonUnder(x, y);
  if (b) { pressButton(b.key); return true; }
  return false;
}

// What a hover names: the buttons, by what they do, and nothing else.
export const controlName = (x, y) => buttonUnder(x, y)?.name || null;
