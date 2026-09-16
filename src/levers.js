// The casino's controls, on the building itself: the arm beside the funnel,
// and the panel of buttons under the bins' feet. No board -- the bet is set
// on the machine's face and the arm plays it, so the building says what it
// does where it does it. See DESIGN.md, "The machine".
//
// Owns where each control stands, whether it is live, what working it does,
// and the hit test; render/casino.js draws them off `leverShape` and
// `panelLayout`.

import { P, HOPPER_H, GATE_H, wordCells, ARM_LENGTH, ARM_BOSS, ARM_SWING, LEVER_HIT, LEVER_SWING_MS, BUTTON_PRESS_MS,
         PANEL_COINS, CASINO_CHIPS, MARK_CELLS, GLYPH_CELLS, WINDOW_CELLS, CAP_PAD, DIGIT_H,
         DECK_GROUP_GAP, DECK_BUTTON_GAP, DECK_PAD, GROUP_H, LABEL_ROWS, GROUP_LABELS, CASINO_DECK } from './config.js';
import { S, casino } from './state.js';
import { canLet, letGo, canBank, bank, canPick, pickCoin, pickChip, coinOpen, chipCovered, sameBet, canSame } from './casino.js';
import { now } from './clock.js';
import { coarse } from './prefs.js';

// The arm: which wall it is on, how far down the building its boss sits, and
// the two halves of a decision -- may it, and do it. It stands on the deck's
// right wall, under the funnel's rim.
export const LEVERS = [
  { key: 'casino-gate', name: 'the arm', kind: 'arm',
    side: 'right', row: () => HOPPER_H - 2, live: canLet, pull: letGo }
];

// The deck's buttons, in their groups: COIN, BET with the window, PLAY.
// Each says what it wears (`face`) and how wide and tall its face is, in
// cells; the cap round it is the face and a pad. `live` is whether it may be
// pressed, `on` whether it is the chosen one.
const chipLabel = c => c === 'all' ? 'ALL' : c === 1000 ? '1k' : String(c);
const COIN_NAME = { dust: 'pebbles', spore: 'crops', shard: 'ore', spark: 'sparks' };
export const BUTTONS = [
  ...PANEL_COINS.map(cur => ({
    key: `coin-${cur}`, name: COIN_NAME[cur], group: 0,
    face: { mark: cur }, w: MARK_CELLS, h: MARK_CELLS,
    shown: () => coinOpen(cur), live: () => canPick(), on: () => S.coin === cur, pull: () => pickCoin(cur)
  })),
  ...CASINO_CHIPS.map((chip, i) => ({
    key: `chip-${chipLabel(chip).toLowerCase()}`, name: chip === 'all' ? 'all in' : String(chip), group: 1,
    face: { word: chipLabel(chip) }, w: wordCells(chipLabel(chip)), h: DIGIT_H,
    shown: () => true, live: () => canPick() && chipCovered(chip), on: () => S.chip === i, pull: () => pickChip(i)
  })),
  { key: 'window', name: null, group: 1, face: { window: true }, w: WINDOW_CELLS - 2 * CAP_PAD, h: DIGIT_H + 2, tall: true,
    shown: () => true, live: () => true, on: () => false, pull: null },
  { key: 'same', name: 'same bet', group: 2, face: { glyph: 'again' }, w: GLYPH_CELLS, h: GLYPH_CELLS,
    shown: () => true, live: canSame, on: () => false, pull: sameBet },
  { key: 'bank', name: 'bank', group: 2, face: { glyph: 'sack' }, w: GLYPH_CELLS, h: GLYPH_CELLS,
    shown: () => true, live: canBank, on: () => false, pull: bank }
];


// Where the deck's band stands on the building: under the funnel's floor.
export const deckTop = () => casino.y + (HOPPER_H + GATE_H) * P;

// Where each group and each cap stands. The groups are laid left to right
// with `DECK_GROUP_GAP` between and the row centered on the front; inside a
// group the caps stack two rows deep, two to a row for the coins and the
// chips, one for same bet over the sack, and the window stands beside the
// chips across both rows. A coin the yard has not handed out has no cap,
// and the coins close up over it. Returns { groups: [{ label, x, y, w, h }],
// caps: [{ button, x, y, w, h }] } in world pixels; a cap's box is its face
// and pad.
const GROUP_COLS = [2, 2, 1];
export function deckLayout() {
  const groups = [], caps = [];
  if (!CASINO_DECK) return { groups, caps };
  const capW = b => (b.w + 2 * CAP_PAD) * P, capH = b => (b.h + 2 * CAP_PAD) * P;
  const plan = g => {
    const cols = GROUP_COLS[g];
    const grid = BUTTONS.filter(b => b.group === g && b.shown() && !b.tall);
    const tall = BUTTONS.filter(b => b.group === g && b.shown() && b.tall);
    const colW = [], rowH = [];
    grid.forEach((b, i) => {
      colW[i % cols] = Math.max(colW[i % cols] || 0, capW(b));
      rowH[Math.floor(i / cols)] = Math.max(rowH[Math.floor(i / cols)] || 0, capH(b));
    });
    const gridW = colW.reduce((n, w) => n + w, 0) + (colW.length - 1) * DECK_BUTTON_GAP * P;
    const gridH = rowH.reduce((n, h) => n + h, 0) + (rowH.length - 1) * DECK_BUTTON_GAP * P;
    const tallW = tall.reduce((n, b) => n + DECK_BUTTON_GAP * P + capW(b), 0);
    // never narrower than its label wants; the caps stand centered in it
    const w = Math.max(gridW + tallW + 2 * (DECK_PAD + 1) * P, (wordCells(GROUP_LABELS[g]) + 2) * P);
    return { cols, grid, tall, colW, rowH, gridW, gridH, tallW, w };
  };
  const plans = [0, 1, 2].map(plan);
  const cells = plans.reduce((n, p) => n + p.w, 0) + 2 * DECK_GROUP_GAP * P;
  let x = casino.x + Math.floor((casino.w / P - cells / P) / 2) * P;
  const y = deckTop() + P;
  plans.forEach((p, g) => {
    const h = GROUP_H * P;
    groups.push({ label: GROUP_LABELS[g], x, y, w: p.w, h });
    // the grid, centered on the recess's height, its rows and columns
    // aligned on the widest and tallest of each
    const top = y + P + Math.floor((GROUP_H - 2 - p.gridH / P) / 2) * P;
    let ry = top;
    p.grid.forEach((b, i) => {
      const c = i % p.cols, r = Math.floor(i / p.cols);
      if (c === 0 && i) ry += p.rowH[r - 1] + DECK_BUTTON_GAP * P;
      const inset = x + Math.floor((p.w - p.gridW - p.tallW) / 2 / P) * P;
      const cx = inset + p.colW.slice(0, c).reduce((n, w) => n + w + DECK_BUTTON_GAP * P, 0);
      caps.push({ button: b, x: cx + Math.floor((p.colW[c] - capW(b)) / 2 / P) * P, y: ry + Math.floor((p.rowH[r] - capH(b)) / 2 / P) * P, w: capW(b), h: capH(b) });
    });
    // and the window, standing beside the grid across both rows
    let tx = x + Math.floor((p.w - p.gridW - p.tallW) / 2 / P) * P + p.gridW;
    for (const b of p.tall) {
      tx += DECK_BUTTON_GAP * P;
      caps.push({ button: b, x: tx, y: top, w: capW(b), h: p.gridH });
      tx += capW(b);
    }
    x += p.w + DECK_GROUP_GAP * P;
  });
  return { groups, caps };
}
export const panelLayout = () => deckLayout().caps;

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
  // held down: the arm at the bottom of its swing, black, for as long as
  // the hand is on it ("The pour": the stake pours while it is held)
  if (S.leverHeld === l.key) return { live: true, angle: ARM_SWING };
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
