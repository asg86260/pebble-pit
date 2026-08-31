// The farm: plots out past the quarry.
//
// Nothing grows in them on its own. A farmhand works the row -- most of its
// tending goes into the plot it is standing over, the rest over the others -- and
// when a plot is ripe it is cut and a spore rises off it. So the crop is the
// crew's attention -- the same trade the quarry asks for, in a different shape:
// the quarry spends a worker's *time away*, the farm spends a worker *standing
// still*. What a hand is worth is one plot's worth of tending in the time one
// plot takes, however many plots that is spread across.

import { PLOT_COST, PLOT_RATE, FARM_PLOTS_MAX, TILLER_BILL } from './config.js';
import { P, WORKER, FARM_GAP, FARM_H, TEND_BASE, TEND_FLOOR, FARM_WALK, CUT_MS, TEND_STOOP, TEND_HERE, SPORE_CELL, someFind }
  from './config.js';
import { throughPlotMuck } from './smog.js';
import { FARM_FOUL } from './config.js';
import { S, farm } from './state.js';
import { walkY, plotCount, resite } from './world.js';
import { defineMachine, buyMachine, canBuy } from './machines.js';
import { rebalance, kitFull } from './upgrades.js';
import { mult } from './lab.js';
import { spawnSpoil } from './dust.js';
import { rand } from './rng.js';

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
    bob: rand() * Math.PI * 2,      // its own rhythm, so a row of them is not a chorus
    x: plotX(0), y: 0, carry: 0
  };
}

// One hand, one frame of tending, spread over the row.
//
// It used to be one line inside the runner, and the line put the whole of a
// hand's work into the plot under it. That is what made a lone farmhand feel
// like nothing: six plots of bare dirt beside the one it happened to be at, for
// as long as you left it there. A keeper walking a farm all day waters what it
// passes; this is that.
//
// The share is exact, so nothing at the top of the ladder moves. A full
// complement is one hand to each plot -- which is what `pickPlot` arranges and
// what `capOf('farmhands')` allows -- and each of those plots then takes
// TEND_HERE from the body in front of it plus an even cut of the rest from every
// other body, which comes to one whole share. That is precisely where the old
// rule landed. What changed is the bottom: one hand on seven plots brings all
// seven on at a seventh of the pace. Slower, which is why you assign more than
// one; never dead, which is why assigning one is worth doing.
function tend(w, dt) {
  const n = S.plots.length;
  if (!n) return;
  const share = dt / tendMs() * (w.trained ? 2 : 1);       // a grower is worth two
  // With one furrow broken there is no rest of the row to spread over, and the
  // whole share stays where the body is standing.
  const here = n > 1 ? share * TEND_HERE : share;
  const spill = n > 1 ? share * (1 - TEND_HERE) / (n - 1) : 0;
  for (let k = 0; k < n; k++) {
    if (S.plots[k] >= 1) continue;
    S.plots[k] = Math.min(1, S.plots[k] + (k === w.plot ? here : spill));
    // Ripe, wherever it ripened. The spore forms at the tip of the stalk and
    // stands there until somebody walks over and takes it off -- a plot that
    // came on down the row is a plot waiting to be cut, not a plot cut by
    // nobody.
    if (S.plots[k] >= 1) { S.plotTone[k] = someFind(SPORE_CELL); S.dirty = true; }
  }
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
    w.stoopAt = now + TEND_STOOP * (0.75 + rand() * 0.6);
  }
  w.x = plotX(w.plot) - WORKER - P * 2 + Math.sin(now / 620 + w.bob) * P * 0.9;

  if (S.pileFull.farm) { w.resting = true; return; }
  w.resting = false;
  const i = w.plot;

  // bringing the row on, this plot first. The moment one is ripe a spore forms
  // at the tip of the stalk and stays there: it is a thing that grew, and it
  // should be seen to have grown before anybody takes it away.
  tend(w, dt);
  if (S.plots[i] < 1) return;

  // then it is taken off, from exactly where it grew. The wait is the same
  // whether it ripened under this body's hands or came on while the body was
  // further down the row.
  if (!w.quarryAt) w.quarryAt = now + CUT_MS;
  if (now < w.quarryAt) return;
  // a smothered plot is dug out before it is picked: the muck is on top of the
  // crop, not beside it
  if (throughPlotMuck(1) < 1) { w.quarryAt = now + CUT_MS; return; }
  cut(i, plotX(i));
  w.farmed = (w.farmed || 0) + 1;
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
    // Dust, not shards.
    //
    // The rule is that a station is not bought deeper with the thing it makes,
    // and the first go at that had the two grounds paying for each other: the
    // cut deepened with spores, the plots broken with shards. Half right. The
    // plots open *before* the cut, so pricing them in shards priced the earlier
    // place in a currency the later one has not started making yet -- a row you
    // cannot buy and cannot see why.
    //
    // The cut keeps its spores, because the farm really is standing by the time
    // you get there. The plots take dust, which the rock has been making since
    // the first swing.
    currency: 'dust',
    buy: () => { S.plotLevel++; resite(); },
    show: () => S.farmOpen && plotCount() < FARM_PLOTS_MAX
  },
  {
    // The last thing the plots ever sell, once every furrow is broken.
    key: 'tiller',
    name: 'the tiller',
    bill: () => TILLER_BILL,
    buy: () => { buyMachine('tiller'); rebalance(); },
    show: () => S.farmOpen && canBuy('tiller', () => plotCount() >= FARM_PLOTS_MAX,
                                      () => kitFull('farmhands'))
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
    cost: () => Math.round(150 * Math.pow(1.7, S.tendLevel)),
    currency: 'dust',
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
  if (plotCount() < 1) return farm.x;
  // Between the two ends of the row, wherever the run has got to. Not snapped to
  // a plot: a tractor is between furrows as often as it is on one.
  const n = plotCount();
  const a = plotX(0) - WORKER - P * 2, b = plotX(n - 1) - WORKER - P * 2;
  return a + (b - a) * tillerRun();
};

// Which furrow it is on. A ripe one first, then the least ripe.
//
// The "least ripe" half on its own was the whole of it to begin with, and it was
// wrong in a way that took a check to see: the moment a plot came ripe it stopped
// being the least ripe, so the tiller moved on and left it standing. It brought
// all seven furrows to ripe and cut none of them. A hand does not work like that
// -- it stays at its plot until the crop is off -- and neither should this.
// Which furrow it is over. A tractor does not choose a plot -- it works the row,
// end to end, and whatever is under it when it passes gets worked.
//
// It picked the plot it wanted and stood at it before, which is what a *hand*
// does. What that lost is the thing a tractor is: something that crosses the
// whole farm, and whose position is the reason a plot came on rather than a
// consequence of it. So the run is a clock, the machine's x follows the run, and
// the plot it works is simply the one it is over.
export const tillerRun = () => {
  const n = plotCount();
  if (n < 2) return 0;
  // Up the row and back down it, so it is always somewhere and never jumps.
  const k = (S.tillerAt || 0) % 2;
  return k < 1 ? k : 2 - k;
};

const tillerPlot = () => {
  const n = plotCount();
  return Math.max(0, Math.min(n - 1, Math.round(tillerRun() * (n - 1))));
};

defineMachine('tiller', {
  job: 'farmhands',
  type: 'farmhand',
  at: tillerAt,
  y: () => walkY(tillerAt() + WORKER / 2) - P,
  // A unit of the farm's work is a slice of tending, so the beat is short and
  // the bite is small -- the plot comes on by the same fraction a hand would
  // have brought it on in that time, times what the machine is worth.
  ms: rate => tendMs() / 40 / Math.max(0.01, rate),
  ready: () => !S.pileFull.farm && plotCount() > 0,
  bite: tender => {
    plantPlots();
    // The run moves on. This is the tractor crossing the farm, and everything
    // else about it -- where it is drawn, which furrow it works, where its
    // tender stands -- is read off this one number.
    const n = Math.max(1, plotCount());
    S.tillerAt = ((S.tillerAt || 0) + 1 / (n * 40)) % 2;

    // What it does to the row it is crossing. A tractor going up a field brings
    // the whole field on, not the one furrow it happens to be over. A hand keeps
    // the row too, now, for the same reason a farm should never look abandoned
    // -- so what the machine is for is not the shape of the work but the amount
    // of it: seven furrows' worth of keeping without seven bodies to keep them.
    // The furrow under it comes on fastest; the rest come on with it, more
    // slowly.
    for (let k = 0; k < n && k < S.plots.length; k++) {
      if (S.plots[k] < 1) S.plots[k] = Math.min(1, S.plots[k] + 1 / (40 * n));
      if (S.plots[k] >= 1 && !S.plotTone[k]) S.plotTone[k] = someFind(SPORE_CELL);
    }

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
      S.dirty = true;
    return true;
  }
});
