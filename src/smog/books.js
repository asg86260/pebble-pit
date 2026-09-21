import { P, RAIN_FIRST_S, SCRUB_CATCH, SMOG_CAP, SMOG_PER_MOTE, SMOG_RAIN_AT } from '../config.js';
import { S } from '../state.js';
import { DROPS, SKY, climbing, intake, raining, resetDrift, scrubbing } from './band.js';
import { resetGullet } from './house.js';
import { cols, muckCols, muckLeft, plotMuck, poopLeft, quarryMuck, rockMuck, yardMuck } from './layer.js';
import { EMBERS, LEDGER, dryFor, resetRain, stormLen } from './rain.js';
import { clearSky, cloudR, moteX, moteY } from './sky.js';
import { spread } from './vents.js';

// --- the books ------------------------------------------------------------------------
// What the yard has put up since the last reading, counted at the source.
// Inferred from the change in the haze it reads equal to the scrubbing the
// moment the house starts winning, and the net sits at nought however many
// bodies you move. Rain and the house are not production and are not counted.
let made = 0;
// An imported `let` is read-only, so the tally has a door of its own.
export const countMade = add => { made += add; };
let mark = { at: 0, rate: 0, drew: 0 };

// What the house has actually taken, counted at the mouth as motes go down
// the throat. Not `scrubRate()`: a rating is in motes a second against a
// fouling in haze a second, and it goes on quoting the full figure while the
// house stands clogged or the sky is too thin to reach.
let drew = 0;
export const countDrew = () => { drew += 1; };

// A minute of them, kept as a ring and averaged: a direction taken off one
// second of the yard flips every second or two when the house is nearly
// keeping up.
const WINDOW = 60;
const net = new Array(WINDOW).fill(0);
let filled = 0, oldest = 0;

export function sampleAir(t) {
  if (t - mark.at < 1000) { return; }
  const gone = (t - mark.at) / 1000;
  const rate = mark.at ? made / gone : 0;
  // In haze a second, the same unit as the fouling, so the difference between
  // the two columns means something.
  const took = mark.at ? (drew / gone) * SMOG_PER_MOTE : 0;
  mark = { at: t, rate, drew: took };
  made = 0;
  drew = 0;
  if (!mark.at) return;
  net[oldest] = rate - took;
  oldest = (oldest + 1) % WINDOW;
  filled = Math.min(WINDOW, filled + 1);
}

// what the sky has been doing, on average, for the last minute
export function airTrend() {
  if (!filled) return 0;
  let sum = 0;
  for (let i = 0; i < filled; i++) sum += net[i];
  return sum / filled;
}
const fouling = () => mark.rate;
// What the house took out over the last second, not what its fan is rated at.
const scrubbed = () => mark.drew;

export function airReadout() {
  const net = fouling() - scrubbed();
  return {
    haze: Math.round(S.haze),
    at: SMOG_RAIN_AT,
    cap: SMOG_CAP,
    share: Math.min(1, S.haze / SMOG_CAP),
    fouling: +(fouling() * 60).toFixed(1),
    scrubbing: +(scrubbed() * 60).toFixed(1),
    // blank when the house is winning, which is the number worth playing for
    dueMs: net <= 0 ? null : Math.round(((SMOG_CAP - S.haze) / net) * 1000),
    dryFor: dryFor === Infinity ? null : +dryFor.toFixed(1)
  };
}

// How bunched up the sky is: the fullest strip against what a strip would hold
// if the whole lot were spread perfectly evenly, so one is a flat haze. Over
// every strip, not just the occupied ones: over those it moves the wrong way,
// because emptying strips lifts the average of whatever is left. Measured off
// the motes themselves, so it is a check on the picture and not on the
// intention.
const STRIP = P * 7;

function strips() {
  const span = Math.max(P, S.worldW || 0);
  const n = Math.max(2, Math.ceil(span / STRIP));
  const out = new Array(n).fill(0);
  // The band and not the plumes: a column of specks climbing off the rock is a
  // clump that has not had its chance to spread yet.
  for (const m of SKY) if (!m.up) out[((Math.floor(moteX(m) / STRIP) % n) + n) % n]++;
  return out;
}

export function clumpiness() {
  const b = strips();
  const total = b.reduce((x, y) => x + y, 0);
  if (!total) return 0;
  return +(Math.max(...b) / (total / b.length)).toFixed(2);
}

export const skyBins = () => strips().filter(Boolean).length;

// how much of the sky the house has hold of: specks inside a few cells of the
// mouth, on their way down the throat
export function drawnIn() {
  if (!S.scrubOpen) return 0;
  const to = intake();
  let n = 0;
  for (const m of SKY) if (Math.hypot(moteX(m) - to.x, moteY(m) - to.y) < SCRUB_CATCH) n++;
  return n;
}

export function smogReport() {
  // the tint is drawn straight off this, so a check can see whether a dirty
  // sky knows what dirtied it
  const kinds = {};
  for (const m of SKY) kinds[m.kind || 'none'] = (kinds[m.kind || 'none'] || 0) + 1;
  return { sky: SKY.length, skyKinds: kinds,
           // Haze the sky cannot account for. Nought by construction (the
           // number is worked out from the specks) and still reported, because
           // a number drifting above the specks it stands for is a sky that
           // rains itself empty while the number is still over the line.
           owed: +(S.haze - SKY.length * SMOG_PER_MOTE).toFixed(1),
           // finely enough that a check can see the band lean: the wind moves
           // a settled mote a pixel or two over a second, which whole pixels
           // would swallow
           skyX: spread(SKY.filter(m => !m.up), 200).map(m => +moteX(m).toFixed(2)),
           puffs: climbing(), drops: DROPS.length, trend: airTrend(),
           // Motes the draught has hold of: near the mouth and plainly coming.
           caught: drawnIn(), clumpiness: clumpiness(), skyBins: skyBins(),
           cloudR: cloudR(),
           raining: raining(), rains: S.rains, recycled: S.recycled,
           // a strike in the sky: how many cells it is, or 0 for none
           bolt: S.bolt ? S.bolt.cells.length : 0, embers: EMBERS.length,
           // the storm's front and its heft, so a check can watch a brew-up
           brewing: S.stormFor >= 0, stormFor: S.stormFor, heft: S.stormHeft,
           rainDue: S.rainDue, stormLen: stormLen(), rainFor: S.rainFor, left: S.stormLeft,
           // what the shower has landed and laid, by kind of drop
           landed: { ...LEDGER },
           purifiers: S.purifiers, scrubOpen: S.scrubOpen, recycler: S.recycler,
           muck: { rock: rockMuck(), cut: quarryMuck(), plot: plotMuck(),
                   yard: yardMuck(), all: muckLeft(),
                   cols: muckCols().filter(Boolean).length },
           poop: poopLeft(),
           ...airReadout() };
}

export function seedSmog() {
  made = 0;
  // A new yard has been dry for ever. Each file puts its own counter back,
  // because each owns the `let` behind it.
  resetRain();
  S.stormFor = -1;
  // The first front of a new yard is on the clock from the start.
  S.rainDue = RAIN_FIRST_S;
  S.stormHeft = 1;
  net.fill(0);
  filled = 0;
  oldest = 0;
  mark = { at: 0, rate: 0, drew: 0 };
  drew = 0;
  resetGullet();
  clearSky();
  resetDrift();
  DROPS.length = 0;
  EMBERS.length = 0;
  S.bolt = null;
  S.muck = [];
}
