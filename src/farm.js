// The farm: plots out past the quarry.
//
// Nothing grows in them on its own. A farmhand stands at a plot and tends it, and
// it comes on while tended; when it is ripe it is cut and a spore rises off it.
// So the crop is the crew's attention -- the same trade the quarry asks for, in a
// different shape: the quarry spends a worker's *time away*, the farm spends a
// worker *standing still*.

import { PLOT_COST, PLOT_RATE, FARM_PLOTS_MAX, TILLER_BILL } from './config.js';
import { P, WORKER, FARM_GAP, FARM_H, TEND_BASE, TEND_FLOOR, FARM_WALK, CUT_MS, TEND_STOOP, SPORE_CELL, someFind }
  from './config.js';
import { foul, throughPlotMuck } from './smog.js';
import { FARM_FOUL } from './config.js';
import { S, farm } from './state.js';
import { walkY, plotCount, resite } from './world.js';
import { defineMachine, buyMachine, canBuy } from './machines.js';
import { rebalance } from './upgrades.js';
import { mult } from './lab.js';
import { spawnSpoil } from './dust.js';

// how long one plot takes to come on, at this level of tending
export const tendMs = (lvl = S.tendLevel) =>
  Math.max(400, Math.round(Math.max(TEND_FLOOR, TEND_BASE * Math.pow(0.82, lvl)) / mult('tend')));

export const tendRate = (lvl = S.tendLevel) => 60000 / tendMs(lvl);   // plots a minute

export const plotX = i => farm.x + i * FARM_GAP;
export const plotTop = i => S.groundY - FARM_H * S.plots[i];

// The plot as it stands. Plots are broken one at a time, so this grows and the
// plots already in the ground are left exactly as they were: a plot you had
// half-tended when you paid for the next one is a plot still half-tended.
export function plantPlots() {
  const n = plotCount();
  while (S.plots.length < n) S.plots.push(0);
  while (S.plotTone.length < n) S.plotTone.push(0);
  if (S.plots.length > n) S.plots.length = n;
  if (S.plotTone.length > n) S.plotTone.length = n;
}

export function newFarmhand() {
  plantPlots();
  return {
    type: 'farmhand', goal: 'to', plot: 0, quarryAt: 0, stoopAt: 0, lunge: 0,
    bob: Math.random() * Math.PI * 2,      // its own rhythm, so a row of them is not a chorus
    x: plotX(0), y: 0, carry: 0
  };
}

// the plot most worth walking to: the one furthest along that nobody else has
function pickPlot(w) {
  let best = -1, most = -1;
  for (let i = 0; i < S.plots.length; i++) {
    if (S.workers.some(o => o !== w && o.type === 'farmhand' && o.plot === i)) continue;
    if (S.plots[i] > most) { most = S.plots[i]; best = i; }
  }
  return best < 0 ? w.plot : best;
}

// Cut, and the spore drops beside the plot and lies in the dust until somebody
// carries it to the pit.
// Cut, and the spore leaves from the tip of the stalk it grew on -- the same
// one that has been sitting there since it ripened, in the same tone.
function cut(i, x) {
  const tone = S.plotTone[i] || someFind(SPORE_CELL);
  spawnSpoil(x, plotTop(i) - P, tone, 'farm');
  S.plots[i] = 0;
  S.plotTone[i] = 0;
}

// one farmhand, one frame
export function stepFarmhand(w, now, dt) {
  plantPlots();
  // a plot that is not there any more -- a save from a wider plot -- is not a
  // plot anybody can stand at
  if (w.plot >= S.plots.length) { w.plot = pickPlot(w); w.goal = 'to'; }
  w.y = walkY(w.x + WORKER / 2);

  if (w.goal === 'to') {
    // stand beside the plot, not on top of it, so the crop can be seen growing
    const target = plotX(w.plot) - WORKER - P * 2;
    const d = target - w.x;
    w.x += Math.sign(d) * Math.min(FARM_WALK, Math.abs(d));
    if (Math.abs(d) < 1) w.goal = 'tend';
    return;
  }

  // standing over it, bringing it on -- unless the last crop is still lying in
  // the pile behind, in which case there is no sense cutting another
  // It works the plot rather than standing to attention beside it: it stoops over
  // it on its own rhythm and shifts its weight between times. Whether the farm
  // is producing and whether it looks tended are two different questions.
  w.lunge *= 0.84;
  if (now >= w.stoopAt) {
    w.lunge = 1;
    w.stoopAt = now + TEND_STOOP * (0.75 + Math.random() * 0.6);
  }
  w.x = plotX(w.plot) - WORKER - P * 2 + Math.sin(now / 620 + w.bob) * P * 0.9;

  if (S.pileFull.farm) { w.resting = true; return; }
  w.resting = false;
  const i = w.plot;

  // bringing it on. The moment it is ripe a spore forms at the tip of the stalk
  // and stays there: it is a thing that grew, and it should be seen to have
  // grown before anybody takes it away.
  if (S.plots[i] < 1) {
    // a grower brings a plot on twice as fast
    S.plots[i] = Math.min(1, S.plots[i] + dt / tendMs() * (w.trained ? 2 : 1));
    if (S.plots[i] >= 1) {
      S.plotTone[i] = someFind(SPORE_CELL);
      w.quarryAt = now + CUT_MS;
      S.dirty = true;
    }
    return;
  }

  // then it is taken off, from exactly where it grew
  if (!w.quarryAt) w.quarryAt = now + CUT_MS;         // walked up to one already ripe
  if (now < w.quarryAt) return;
  // a smothered plot is dug out before it is picked: the muck is on top of the
  // crop, not beside it
  if (throughPlotMuck(1) < 1) { w.quarryAt = now + CUT_MS; return; }
  cut(i, plotX(i));
  w.farmed = (w.farmed || 0) + 1;
  foul(FARM_FOUL, plotX(i), S.groundY - P * 2, 'spore');
  w.quarryAt = 0;
  w.plot = pickPlot(w);
  w.goal = 'to';
}


// --- what the plots sell -----------------------------------------------------
// The same move the quarry made, for the same reason: you break the next bit of
// ground standing on the ground you are breaking. The row that opens the farm
// stays on the bench, because there is nowhere to walk to until it is bought.
export const FARM_UPGRADES = [
  {
    key: 'farmplot',
    // Breaking ground is what it takes; a plot is what you get.
    name: 'new plot',
    from: () => plotCount(),
    to: () => plotCount() + 1,
    cost: () => Math.round(PLOT_COST * Math.pow(PLOT_RATE, S.plotLevel)),
    currency: 'spore',
    buy: () => { S.plotLevel++; resite(); },
    show: () => S.farmOpen && plotCount() < FARM_PLOTS_MAX
  },
  {
    // The last thing the plots ever sell, once every furrow is broken.
    key: 'tiller',
    name: 'the tiller',
    bill: () => TILLER_BILL,
    buy: () => { buyMachine('tiller'); rebalance(); },
    show: () => S.farmOpen && canBuy('tiller', () => plotCount() >= FARM_PLOTS_MAX)
  },
  {
    key: 'tend',
    // "tending" was the truest word for it -- a farmhand tends a plot and this is
    // how fast -- and it was the odd one out on a board where every other rate
    // says speed. One word meaning one thing beats five words each meaning it
    // slightly better.
    name: 'speed',
    unit: 'plots/min',
    pct: true,
    from: () => tendRate(),
    to: () => tendRate(S.tendLevel + 1),
    cost: () => Math.round(4 * Math.pow(1.7, S.tendLevel)),
    currency: 'spore',
    buy: () => S.tendLevel++,
    show: () => S.farmOpen && tendMs() > TEND_FLOOR
  }
];

export const FARM_SECTIONS = [
  { title: 'the farm', keys: ['farmplot', 'tend', 'tiller'] }
];


// --- the tiller -----------------------------------------------------------------
// The one machine that travels. It crawls the plot line end to end, bringing
// each plot on and cutting it where it grew -- the same pair of jobs a farmhand
// does, through the same two calls, one plot at a time.
//
// It travels because the farm is a *row* and not a place: a machine parked at
// one end of seven plots working the far one by remote would be the only thing
// in this yard that reached. So the tiller walks its own line, and its tender
// walks with it: the tender's spot is derived off the tiller's x every frame,
// which means pulling the tender away for a mess stops the tiller where it
// stands rather than leaving it crawling on unattended. That is the
// idles-until-somebody-is-standing-there rule applied to a station that moves,
// and it costs one comparison in the runner.
//
// Its index is derived from where it has got to, never stored: a plot bought
// mid-crawl resites the farm, and a remembered index would be a machine working
// a furrow that had moved out from under it.
export const tillerAt = () => {
  const n = plotCount();
  if (n < 1) return farm.x;
  // Where along the row it is, worked out from the plot it is due to work next:
  // the least ripe one, which is the one a hand would have picked too.
  let want = 0, low = Infinity;
  for (let i = 0; i < n; i++) {
    const v = S.plots[i] == null ? 0 : S.plots[i];
    if (v < low) { low = v; want = i; }
  }
  return plotX(want) - WORKER - P * 2;
};

const tillerPlot = () => {
  const n = plotCount();
  let want = 0, low = Infinity;
  for (let i = 0; i < n; i++) {
    const v = S.plots[i] == null ? 0 : S.plots[i];
    if (v < low) { low = v; want = i; }
  }
  return want;
};

defineMachine('tiller', {
  job: 'farmhands',
  type: 'farmhand',
  at: tillerAt,
  y: () => walkY(tillerAt() + WORKER / 2) - P,
  // A unit of the farm's work is a slice of tending, so the beat is short and
  // the bite is small -- the plot comes on by the same fraction a hand would
  // have brought it on in that time, times what the machine is worth.
  ms: rate => Math.max(30, tendMs() / 40 / Math.max(0.01, rate)),
  ready: () => !S.pileFull.farm && plotCount() > 0,
  bite: tender => {
    plantPlots();
    const i = tillerPlot();
    if (i == null || i >= S.plots.length) return false;
    if (S.plots[i] < 1) {
      S.plots[i] = Math.min(1, S.plots[i] + 1 / 40);
      if (S.plots[i] >= 1) S.plotTone[i] = someFind(SPORE_CELL);
      S.dirty = true;
      return true;
    }
    // Ripe: taken off from exactly where it grew, through the farm's own `cut`,
    // so the pile, the pile mark and the tone all keep working untouched.
    if (throughPlotMuck(1) < 1) return false;
    cut(i, plotX(i));
    if (tender) tender.farmed = (tender.farmed || 0) + 1;
    foul(FARM_FOUL, plotX(i), S.groundY - P * 2, 'spore');
    S.dirty = true;
    return true;
  }
});
