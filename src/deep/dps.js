// The fight's damage a second, by who did it: the reading the furnace's
// hover draws (render/dpstip.js; DESIGN.md, "The furnace's dps").
//
// Every hit goes through one door (`strike` in deep/serpent.js), which hands
// what it did here with its weapon and its striker. A hit with a striker is
// that fighter's station's. A bleed's tick names only its weapon, so it is
// the station's whose class strikes with that weapon, or the class's when no
// station of it stands. Anything else (the click) is "you". Each is bucketed
// a second of game clock at a time over the last DPS_SPAN_S, so `__fast`
// fills it as play does.
//
// Nothing here is saved: a minute of history is a reading of the fight now,
// and a load starts it over. The buckets are the module's, cleared with a
// new game (`held`).

import { S } from '../state.js';
import { DPS_BIN_S, DPS_SPAN_S, DPS_NOW_S, SERPENT_PHASES, CLASSES } from '../config.js';
import { now } from '../clock.js';
import { held } from '../reset.js';
import { msg } from '../lang.js';
import { depthAt } from './depth.js';
import { windowS } from './meals.js';
import { stationById, classOf } from './party.js';

// Two buckets past the span: the one filling, and one sliding off the edge.
export const BINS = Math.round(DPS_SPAN_S / DPS_BIN_S) + 2;
const NOW_BINS = Math.max(1, Math.round(DPS_NOW_S / DPS_BIN_S));

// `first` is the bucket of the source's first hit since the history began.
const make = () => ({ sums: new Float64Array(BINS), stamps: new Int32Array(BINS).fill(-1), first: null });
const total = make();
const bySource = new Map();   // a source's key -> its buckets
held('deep-dps', () => {
  total.sums.fill(0); total.stamps.fill(-1); total.first = null;
  bySource.clear();
});

export const binOf = t => Math.floor(t / 1000 / DPS_BIN_S);
const put = (s, k, done) => {
  const i = k % BINS;
  if (s.stamps[i] !== k) { s.stamps[i] = k; s.sums[i] = 0; }
  s.sums[i] += done;
  if (s.first == null) s.first = k;
};

// Whose a hit is. `tick` is a held thing's tick, which carries no striker
// when it is a bleed left on the coil.
export function sourceOf(weapon, by, tick) {
  if (by && by.station) return `st:${by.station}`;
  if (!tick) return 'you';
  const st = S.stations?.find(s => classOf(s)?.hit === weapon);
  if (st) return `st:${st.id}`;
  const cls = Object.keys(CLASSES).find(k => CLASSES[k].hit === weapon);
  return cls ? `cls:${cls}` : 'you';
}

// A hit's damage into its second's bucket, the total's and its source's.
export function feed(done, weapon, by, tick) {
  if (!(done > 0)) return;
  const k = binOf(now());
  put(total, k, done);
  const key = sourceOf(weapon, by, tick);
  let s = bySource.get(key);
  if (!s) bySource.set(key, s = make());
  put(s, k, done);
}

// The rate of bucket `k`, damage a second; nought for a second nothing landed in.
export const rateAt = (s, k) => (k >= 0 && s.stamps[k % BINS] === k ? s.sums[k % BINS] / DPS_BIN_S : 0);
// The mean over `n` whole buckets ending at bucket `k`.
export const meanTo = (s, k, n) => { let v = 0; for (let j = 0; j < n; j++) v += rateAt(s, k - j); return v / n; };

// The window the numbers are read over: the last DPS_NOW_S of whole seconds,
// as game-clock ms [from, to). The second still filling is not in it.
export function nowWindow() {
  const k = binOf(now());
  return { from: (k - NOW_BINS) * DPS_BIN_S * 1000, to: k * DPS_BIN_S * 1000 };
}
// The whole seconds a source's mean is taken over: the window, or the part of
// it since the source's first hit, so a fighter that joined twenty seconds
// ago is its twenty seconds' pace and not a third of it. Nought before its
// first second has finished.
function secsOf(s) {
  const k0 = binOf(now());
  if (s.first == null) return 0;
  return Math.max(0, k0 - Math.max(k0 - NOW_BINS, s.first)) * DPS_BIN_S;
}
// A source's damage a second: what it did in the window over its seconds in it.
function nowOf(s) {
  const secs = secsOf(s), k0 = binOf(now());
  if (!(secs > 0)) return 0;
  let v = 0;
  for (let k = k0 - NOW_BINS; k < k0; k++) v += rateAt(s, k) * DPS_BIN_S;
  return v / secs;
}

// The party's damage a second: every row's summed, each at its own pace, so
// a fighter just come counts at its rate and the total is the rows' sum.
export const totalDps = () => sources().reduce((v, r) => v + r.dps, 0);
export const totalSeries = () => total;

// The pace that opens the wound to its depth inside one window: the rule the
// total is held against. Nought past the last defense.
export const breakPace = () => (S.serpentStage < SERPENT_PHASES ? depthAt(S.serpentStage) / windowS() : 0);

function nameOf(key) {
  if (key === 'you') return msg('hover-furnace-you');
  if (key.startsWith('cls:')) return CLASSES[key.slice(4)]?.name || '';
  const st = stationById(key.slice(3));
  return (st && classOf(st)?.name) || '';
}

// Everyone with a hit in the window: { key, name, dps, secs, series }, `secs`
// the seconds its dps is the mean over, in the party's slot order, then a
// class's ticks, then the hand.
export function sources() {
  const k0 = binOf(now());
  const slot = key => {
    if (key === 'you') return 1e6;
    if (key.startsWith('cls:')) return 1e5;
    const i = S.stations.findIndex(st => `st:${st.id}` === key);
    return i < 0 ? 1e4 : i;
  };
  const live = [...bySource].filter(([, s]) => {
    for (let j = 1; j <= NOW_BINS; j++) if (rateAt(s, k0 - j) > 0) return true;
    return false;
  });
  return live.sort((a, b) => slot(a[0]) - slot(b[0]))
    .map(([key, s]) => ({ key, name: nameOf(key), dps: nowOf(s), secs: secsOf(s), series: s }));
}
