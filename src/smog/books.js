import { P, SCRUB_CATCH, SMOG_CAP, SMOG_PER_MOTE, SMOG_RAIN_AT } from '../config.js';
import { S } from '../state.js';
import { DROPS, SKY, climbing, drift, intake, raining, resetDrift, scrubbing } from './band.js';
import { gullet, resetGullet } from './house.js';
import { cols, muckCols, muckLeft, plotMuck, poopLeft, quarryMuck, rockMuck, yardMuck } from './layer.js';
import { dryFor, rainOdds, resetRain } from './rain.js';
import { clearSky, cloudR, moteX, moteY } from './sky.js';
import { spread } from './vents.js';

// --- the books ------------------------------------------------------------------------
// What the yard has put up since the last reading, counted as it goes in rather
// than worked back out of the total.
//
// It used to be inferred: the change in the haze, plus what the house took out,
// floored at nought so a downpour did not read as the yard un-mining a rock. Every
// part of that is defensible and the whole is wrong the moment the house starts
// winning -- the haze falls, the floor clamps the difference to nought, and what
// is left is exactly the scrubbing rate. So fouling always read equal to
// scrubbing, the two cancelled, and the one number this board exists to show sat
// at nought however many bodies you moved.
//
// Counted at the source there is nothing to infer and nothing to correct for.
// Rain can take what it likes out of the sky and the house can take what it likes:
// neither is production, and this only counts production.
let made = 0;
// Counted from the vent that made it: an imported `let` is read-only, so the
// tally has a door of its own rather than being added to from over there.
export const countMade = add => { made += add; };
let mark = { at: 0, rate: 0, drew: 0 };

// And what the house has actually taken, counted the same way: at the mouth, as
// motes go down the throat. It used to be quoted rather than counted -- the
// board showed `scrubRate()`, which is what the fan is *rated* at, and a rating
// is not a measurement. Two things were wrong with it at once. It was in motes a
// second where the fouling beside it was in haze a second, so the house's column
// read about twice what it was worth against the yard's; and it went on quoting
// the full figure while the house stood clogged, or while the sky was too thin
// to have anything within reach of the draught. A board that says you are
// winning while the band thickens over your head is worse than no board.
let drew = 0;
// Counted at the mouth that took it, through a door for the same reason.
export const countDrew = () => { drew += 1; };

// A minute of them, kept as a ring and averaged.
//
// The reading is a direction, and a direction taken off one second of the yard
// flickers: a gang whose swings happen to land together reads as losing and the
// same gang a second later reads as winning, so a house that is very nearly
// keeping up puts an arrow on the board that flips every second or two. That is
// not a reading, it is a nervous tic. Over a minute the answer is the answer.
const WINDOW = 60;
const net = new Array(WINDOW).fill(0);
let filled = 0, oldest = 0;

export function sampleAir(t) {
  if (t - mark.at < 1000) { return; }
  const gone = (t - mark.at) / 1000;
  const rate = mark.at ? made / gone : 0;
  // In haze a second, the same unit the fouling is in, so the two columns on the
  // board are the same kind of thing and the difference between them means
  // something.
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
    // The brim as well as the line. A sky at the line only *might* rain; a sky
    // at the brim is going to, on the next look -- which is the difference the
    // sampling makes, and the number a check winds to when it wants weather.
    cap: SMOG_CAP,
    share: Math.min(1, S.haze / SMOG_CAP),
    fouling: +(fouling() * 60).toFixed(1),
    scrubbing: +(scrubbed() * 60).toFixed(1),
    // blank when the house is winning, which is the number worth playing for
    dueMs: net <= 0 ? null : Math.round(((SMOG_CAP - S.haze) / net) * 1000),
    // What a look at the sky would say right now, and how long it has been dry.
    // The board shows how far off the line is; these are the two numbers behind
    // the fact that reaching it is not the same as it raining.
    odds: +rainOdds().toFixed(3),
    dryFor: dryFor === Infinity ? null : +dryFor.toFixed(1)
  };
}

// How bunched up what is up there is: the fullest bin against the average. A
// number for the thing you can watch happening, so a check can watch it too.
// The fullest bin against what a bin would hold if the sky were spread perfectly
// evenly. One is a flat haze; the higher it goes the more the sky is bunched into
// one place. Over every bin, not just the ones with something in: over the
// occupied ones it moves the wrong way, because emptying bins lifts the average
// of whatever is left.
// How bunched up what is up there is: the fullest strip of sky against what a
// strip would hold if the whole lot were spread perfectly evenly. One is a flat
// haze. Measured off the motes themselves rather than off anything the placing
// keeps, so it is a check on the picture and not on the intention.
const STRIP = P * 7;

function strips() {
  const span = Math.max(P, S.worldW || 0);
  const n = Math.max(2, Math.ceil(span / STRIP));
  const out = new Array(n).fill(0);
  // The band, and not the plumes on their way into it: what this measures is
  // how evenly the sky has spread, and a column of specks climbing off the rock
  // is a clump that has not had its chance to spread yet.
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
  // what the sky is made of, by where it came from: the tint is drawn straight
  // off this, so a check can see whether a dirty sky knows what dirtied it
  const kinds = {};
  for (const m of SKY) kinds[m.kind || 'none'] = (kinds[m.kind || 'none'] || 0) + 1;
  return { sky: SKY.length, skyKinds: kinds,
           // Haze the sky cannot account for: the number, less what is actually
           // overhead and what is still on its way up. It belongs at nothing.
           // A number drifting above the specks it stands for is a band thinner
           // than the readout claims and, once the gap is wide enough, a sky
           // that rains itself empty while the number is still over the line
           // and starts another shower on the very next frame.
           // Haze the sky cannot account for. It is nought by construction now
           // -- the number is worked out from the specks -- and it is still
           // reported, because it is the one reading that would catch this
           // coming apart again.
           owed: +(S.haze - SKY.length * SMOG_PER_MOTE).toFixed(1),
           // where the first few of them are, finely enough that a check can see
           // the band lean: the wind moves a settled mote a pixel or two over a
           // second, which whole pixels would swallow
           skyX: spread(SKY.filter(m => !m.up), 200).map(m => +moteX(m).toFixed(2)),
           puffs: climbing(), drops: DROPS.length, trend: airTrend(),
           // Motes the draught has hold of: near the mouth and plainly coming.
           // It used to be a list of specks on a scripted curve into the hood;
           // there is no such list any more, because there is no such errand --
           // the sky itself is what comes in.
           caught: drawnIn(), clumpiness: clumpiness(), skyBins: skyBins(),
           cloudR: cloudR(),
           raining: raining(), rains: S.rains, recycled: S.recycled,
           // a strike in the sky: how many cells it is, or 0 for none
           bolt: S.bolt ? S.bolt.cells.length : 0,
           // the storm's front and its wash, so a check can watch a brew-up
           brewing: S.stormFor >= 0, stormFor: S.stormFor,
           purifiers: S.purifiers, scrubOpen: S.scrubOpen, recycler: S.recycler,
           muck: { rock: rockMuck(), cut: quarryMuck(), plot: plotMuck(),
                   yard: yardMuck(), all: muckLeft(),
                   cols: muckCols().filter(Boolean).length },
           poop: poopLeft(),
           ...airReadout() };
}

export function seedSmog() {
  made = 0;
  // A new yard has been dry for ever: the first shower waits on the sky and on
  // nothing else. Each of the other files puts its own counter back, because
  // each of them owns the `let` behind it.
  resetRain();
  // No storm on the way and no wash over the band: both are facts about a run.
  S.stormFor = -1;
  net.fill(0);
  filled = 0;
  oldest = 0;
  mark = { at: 0, rate: 0, drew: 0 };
  drew = 0;
  resetGullet();
  clearSky();
  // The band's shared creep, back to where a mote made now would read it. It is
  // a fact about a run, like the clock and the seed.
  resetDrift();
  DROPS.length = 0;
  S.muck = [];
}
