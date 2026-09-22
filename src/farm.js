// The farm: plots out past the quarry.
//
// Nothing grows on its own. A farmhand works the row (most of its tending
// goes into the plot it stands over, the rest over the others) and a ripe plot
// is cut for a spore. What a hand is worth is one plot's worth of tending in
// the time one plot takes, however many plots that is spread across.

import { PLOT_COST, PLOT_SPORES, PLOT_RATE, FARM_PLOTS0, FARM_PLOTS_MAX, TILLER_BILL, SPELL_GMO, rungValue } from './config.js';
import { P, WORKER, FARM_GAP, FARM_H, FARM_WALK, CUT_MS, TEND_STOOP, TEND_HERE, SPORE_CELL, someFind }
  from './config.js';
import { throughPlotMuck } from './smog.js';

import { S, farm, floor } from './state.js';
import { walkY, plotCount, resite, pileAt } from './world.js';
import { climbTo, keepTo, stepRoute, ways } from './route.js';
import { defineMachine, buyMachine, canBuy } from './machines.js';
import { rebalance } from './staffing.js';
import { kitFull, commutePace } from './levels.js';
import { frames } from './clock.js';
import { spelled } from './tower.js';
import { tuneRow } from './machines.js';
import { MACHINE_TUNE, LADDER } from './config.js';
import { spriteW, spriteH, stackCol, seatCol, roofRow, TILLER } from './sprites.js';
import { tierRows, tierLevel } from './upgrades/tiers.js';
import { spawnSpoil, critToss } from './dust.js';
import { critRoll } from './crit.js';
import { critBoost, speedBoost, stronger } from './apothecary.js';
import { at, put, topRow, colOf, bottomY } from './grid.js';
import { tidyStep } from './tidy.js';
import { rand } from './rng.js';
import { registerRows } from './works.js';
import { JOB, TYPE } from './jobs.js';

// Where the two farm ladders stand, clamped to their length.
export const tendLadder = () => tierLevel('tendLevel');
export const cropLadder = () => tierLevel('cropLevel');

// The ladder is written in plots a minute (config/rungs.js); the gap is sixty
// thousand over that, floored where the animation stops reading.
export const tendRate = (lvl = tendLadder()) => rungValue('tend', lvl);   // plots a minute
export const tendMs = (lvl = tendLadder()) => Math.max(400, Math.round(60000 / tendRate(lvl)));

// Whole spores off the list: a cut drops spores, and half a spore is not a
// thing the yard can draw.
export const cropYield = (lvl = cropLadder()) =>
  Math.max(1, Math.round(rungValue('crop', lvl)));

// What actually comes off a stalk when it is cut: that, with the gmo spell
// over it. Multiplied here, at the one place the amount is decided, so the
// board's ladder still says what a rung is worth on its own.
export const cropSpores = () =>
  Math.max(1, Math.round(cropYield() * (spelled('gmo') ? SPELL_GMO : 1)));

export const plotX = i => farm.x + i * FARM_GAP;
export const plotTop = i => S.groundY - FARM_H * S.plots[i];

// Plots are broken one at a time, and the plots already in the ground are
// left exactly as they were.
export function plantPlots() {
  const n = plotCount();
  while (S.plots.length < n) S.plots.push(0);
  while (S.plotTone.length < n) S.plotTone.push(0);
  if (S.plots.length > n) S.plots.length = n;
  if (S.plotTone.length > n) S.plotTone.length = n;
}

// The plots, on the save (persist.js, `SAVERS`): how far along each is, as
// hundredths, and the spore standing ripe on it.
export const SAVE = {
  fields: ['plots', 'plotTone'],
  write(out) {
    out.plots = S.plots.map(b => Math.round(b * 100));
    out.plotTone = [...S.plotTone];
  },
  read(s) {
    if (Array.isArray(s.plots)) S.plots = s.plots.map(b => (+b || 0) / 100);
    if (Array.isArray(s.plotTone)) S.plotTone = s.plotTone.map(v => +v || 0);
  },
  blank() {
    S.plots = [];
    S.plotTone = [];
  }
};

export function newFarmhand() {
  plantPlots();
  return {
    type: TYPE.FARM, goal: 'to', plot: 0, quarryAt: 0, stoopAt: 0, lunge: 0,
    bob: rand() * Math.PI * 2,      // its own rhythm, so a row of them is not a chorus
    x: plotX(0), y: 0, carry: 0
  };
}

// One hand, one frame of tending, spread over the row. The share is exact: a
// full complement (one hand a plot, which `pickPlot` arranges and
// `capOf('farmhands')` allows) gives each plot TEND_HERE from the body in
// front of it plus an even cut of the rest from every other body, one whole
// share. One hand on seven plots brings all seven on at a seventh of the pace:
// slower, never dead.
function tend(w, dt) {
  const n = S.plots.length;
  if (!n) return;
  const share = dt / tendMs() * (w.trained ? 2 : 1);       // a grower is worth two
  // With one furrow there is no rest of the row to spread over.
  const here = n > 1 ? share * TEND_HERE : share;
  const spill = n > 1 ? share * (1 - TEND_HERE) / (n - 1) : 0;
  for (let k = 0; k < n; k++) {
    if (S.plots[k] >= 1) continue;
    S.plots[k] = Math.min(1, S.plots[k] + (k === w.plot ? here : spill));
    // Ripe, wherever it ripened: the spore forms at the tip of the stalk and
    // waits to be cut, so a plot that came on down the row is not cut by
    // nobody.
    if (S.plots[k] >= 1) { S.plotTone[k] = someFind(SPORE_CELL); }
  }
}

// The strip the plots stand on, as a patch the one tidying rule can work
// (tidy.js). Its own ground and never a column that is already somebody's
// heap: the farm's heap is a few cells right of the last plot, and a hand
// that tidied that would lift the crop it had just thrown there all day. The
// book it is handed is the haulers' own book of floor claims, so a hand and a
// hauler never set off for the same column.
export const farmPatch = () => ({
  key: 'farm',
  cols: floor.cols,
  colOf: x => colOf(floor, x),
  xOf: c => floor.x + c * P + P / 2,
  peek: c => {
    const x = floor.x + c * P;
    // A furrow's width either end: `farm.w` is measured stalk to stalk, and a
    // hand stands beside a plot rather than on it, so read to the pixel the
    // ground is one grain short, the one at the last plot's own foot.
    if (x + P <= farm.x - FARM_GAP || x >= farm.x + farm.w + FARM_GAP || pileAt(x)) return 0;
    const r = topRow(floor, c);
    return r < 0 ? 0 : at(floor, c, r);
  },
  take: c => {
    const r = topRow(floor, c);
    if (r < 0) return 0;
    const v = at(floor, c, r);
    put(floor, c, r, 0);
    return v;
  },
  yOf: c => bottomY(floor) - (topRow(floor, c) + 1) * P
});

// the plot most worth walking to: the one furthest along that nobody else has
function pickPlot(w) {
  let best = -1, most = -1;
  for (let i = 0; i < S.plots.length; i++) {
    if (S.workers.some(o => o !== w && o.type === TYPE.FARM && o.plot === i)) continue;
    if (S.plots[i] > most) { most = S.plots[i]; best = i; }
  }
  return best < 0 ? w.plot : best;
}

// Cut: the spores leave from the tip of the stalk, in the tone it has worn
// since it ripened, and lie in the dust until carried. Returns how many came
// off: the yield ladder's answer times the crit's, since the farm has no fixed
// seam and a crit ADDS. Each extra one is real dust, banked like any other. A
// crit does not add pollution; nothing here does.
function cut(i, x, w) {
  const tone = S.plotTone[i] || someFind(SPORE_CELL);
  // A bracing tonic on this hand lifts its crit chance; nobody else's.
  const crit = critRoll(critBoost(w));
  // A strong brew is a bigger cut (`stronger`).
  const got = stronger(w, cropSpores()) * crit;
  for (let n = 0; n < got; n++) {
    if (crit > 1) critToss(x, plotTop(i) - P, tone, 'farm', crit);
    else spawnSpoil(x, plotTop(i) - P, tone, 'farm');
  }
  S.plots[i] = 0;
  S.plotTone[i] = 0;
  return got;
}

// one farmhand, one frame
export function stepFarmhand(w, now, dt, c = null) {
  plantPlots();
  // a plot that is not there any more -- a save from a wider plot -- is not a
  // plot anybody can stand at
  if (w.plot >= S.plots.length) { w.plot = pickPlot(w); w.goal = 'to'; }
  // Through the climber, never a bare assignment: a body handed back from
  // anything that held it off the ground (the celebration latches its own y as
  // the floor) would drop four cells in one frame. `climbTo` takes at most a
  // cell a frame (route.js).
  w.y = climbTo(w, walkY(w.x + WORKER / 2));

  if (w.goal === 'to') {
    // stand beside the plot, not on top of it, so the crop can be seen growing
    const target = plotX(w.plot) - WORKER - P * 2;
    const d = target - w.x;
    // From further than the row itself this is a trip, by route at a trip's
    // pace: FARM_WALK is the amble from one plot to the next, and used for a
    // whole commute it is a crawl straight over the mouth of the hole with no
    // ladder. The route puts the crossing on the ladders.
    if (Math.abs(d) > P * 12) {
      if (keepTo(w, target, ways().yard) && stepRoute(w, commutePace())) return;
      w.route = null;
    }
    // Times the frame, like every other pace in the yard (`frames` in
    // clock.js), or a thirty-hertz machine ambles at half speed while the
    // tending clock keeps perfect time.
    w.x += Math.sign(d) * Math.min(FARM_WALK * frames(), Math.abs(d));
    if (Math.abs(d) < 1) w.goal = 'tend';
    return;
  }

  // Standing over it: stoops on its own rhythm and shifts its weight between
  // times. Whether the farm is producing and whether it looks tended are two
  // different questions.
  if (now >= w.stoopAt) {
    w.lunge = 1;
    w.stoopAt = now + TEND_STOOP * (0.75 + rand() * 0.6);
  }
  w.x = plotX(w.plot) - WORKER - P * 2 + Math.sin(now / 620 + w.bob) * P * 0.9;

  if (S.pileFull.farm) { w.resting = true; return; }
  w.resting = false;
  const i = w.plot;

  // A hearty stew makes this hand's own action faster (apothecary.js).
  tend(w, dt * speedBoost(w));
  // It picks up after itself while it works; what it costs is the stooping,
  // which is time a hand standing at a plot has anyway.
  tidyStep(w, farmPatch(), c && c.taken, now);
  if (S.plots[i] < 1) return;

  // The wait is the same whether it ripened under this body's hands or came
  // on while the body was down the row.
  if (!w.quarryAt) w.quarryAt = now + CUT_MS / speedBoost(w);
  if (now < w.quarryAt) return;
  // a smothered plot is dug out before it is picked: the muck is on top of the
  // crop, not beside it
  if (throughPlotMuck(1) < 1) { w.quarryAt = now + CUT_MS / speedBoost(w); return; }
  w.farmed = (w.farmed || 0) + cut(i, plotX(i), w);
  w.quarryAt = 0;
  w.plot = pickPlot(w);
  w.goal = 'to';
}


// --- what the plots sell -----------------------------------------------------
// The row that opens the farm stays on the bench, because there is nowhere to
// walk to until it is bought. The two ladders sell the two questions a ground
// can answer, what one go is worth and how often a go happens (DESIGN.md,
// "What the two grounds sell").
const FARM_YIELD = tierRows({
  field: 'cropLevel',
  unit: 'spores/cut',
  value: lvl => cropYield(lvl),
  site: 'farm', board: 'farm',
  show: () => S.farmOpen,
  bands: [
    { key: 'crop',    name: 'crop yield',     coins: [] },
    { key: 'crop2',   name: 'crop yield',  coins: ['spore'] },
    { key: 'crop3',   name: 'crop yield', coins: ['spore', 'shard'] },
    // The spark rung. `restore` still knows the old key, `labcrop`.
    { key: 'crop4',   name: 'crop yield', coins: ['shard', 'spore', 'spark'] }
  ]
});

const FARM_SPEED = tierRows({
  field: 'tendLevel',
  unit: 'plots/min', pct: true, does: 'tend',
  value: lvl => tendRate(lvl),
  site: 'farm', board: 'farm',
  show: () => S.farmOpen,
  bands: [
    { key: 'tend',    name: 'farming speed',     coins: [] },
    { key: 'tend2',   name: 'farming speed',  coins: ['spore'] },
    { key: 'tend3',   name: 'farming speed', coins: ['spore', 'shard'] },
    { key: 'tend4',   name: 'farming speed', coins: ['shard', 'spore', 'spark'] }
  ]
});

export const FARM_UPGRADES = [
  ...FARM_YIELD,
  ...FARM_SPEED,
  {
    key: 'farmplot',
    // A place, broken by the hands that work the row. See works.js.
    kind: 'place', site: 'farm',
    name: 'another plot',
    // What the from/to is counting, so the gain reads "1 -> 2 plots".
    unit: 'plots',
    from: () => plotCount(),
    to: () => plotCount() + 1,
    // A ladder as far as the tile is concerned: a pip a plot the ground can
    // be broken into. The work climbs with it, as the cut's benches do
    // (quarry.js, `quarrybench`).
    rung: () => S.plotLevel,
    rungs: () => FARM_PLOTS_MAX - FARM_PLOTS0,
    // Dust and the farm's own crop, not shards: the plots open *before* the
    // cut, so pricing them in shards is a row you cannot buy and cannot see
    // why. The cut keeps its spores, because the farm is standing by the time
    // you get there.
    bill: () => [['dust', Math.round(PLOT_COST * Math.pow(PLOT_RATE, S.plotLevel))],
                 ['spore', Math.round(PLOT_SPORES * Math.pow(PLOT_RATE, S.plotLevel))]],
    buy: () => { S.plotLevel++; resite(); },
    show: () => S.farmOpen && plotCount() < FARM_PLOTS_MAX
  },
  {
    // Gated like the ram: both of the plots' ladders topped and a hat on every
    // grower (`canBuy`), not the last furrow.
    key: 'tiller',
    kind: 'machine', site: 'farm',
    name: 'the tiller',
    bill: () => TILLER_BILL,
    buy: () => { buyMachine('tiller'); rebalance(); },
    show: () => S.farmOpen && canBuy('tiller',
                                      () => S.tendLevel >= LADDER && S.cropLevel >= LADDER,
                                      () => kitFull(JOB.FARM))
  },

  // The tiller's ladder, three rungs of red like the rest.
  tuneRow('tiller', 'tiller pace',
          () => `the tiller works ${MACHINE_TUNE}x faster`, 'farm')
];

// Two headings: who works the plots (the grower's brims lodge here from
// upgrades/rows-kit.js, see `lodgers`), and what a plot pays. Every card of
// both ladders is named; only the band you are on answers `true` to `show`.
export const FARM_SECTIONS = [
  { title: JOB.FARM, keys: ['farmplot', 'grower', 'tiller', 'tunetiller'] },
  { title: 'the crop',  keys: ['crop', 'tend'] }
];


// --- the tiller -----------------------------------------------------------------
// The one machine that travels: it crawls the plot line end to end, bringing
// each plot on and cutting it where it grew, through the same two calls a
// farmhand uses. Its tender walks with it (the tender's spot is derived off
// the tiller's x every frame), so pulling the tender away stops the tiller
// where it stands.
//
// Its index is derived from where it has got to, never stored: a plot bought
// mid-crawl resites the farm, and a remembered index would be a machine
// working a furrow that had moved out from under it.
export const tillerAt = () => {
  if (plotCount() < 1) return farm.x;
  // Not snapped to a plot: a tractor is between furrows as often as on one.
  const n = plotCount();
  const a = plotX(0) - WORKER - P * 2, b = plotX(n - 1) - WORKER - P * 2;
  return a + (b - a) * tillerRun();
};

// The run is a clock, the machine's x follows it, and the plot it works is
// the one it is over. A tiller that picked the least ripe plot brought all
// seven to ripe and cut none of them.
export const tillerRun = () => {
  const n = plotCount();
  if (n < 2) return 0;
  // Up the row and back down it, so it is always somewhere and never jumps.
  const k = (S.tillerAt || 0) % 2;
  return k < 1 ? k : 2 - k;
};

// Which way it is pointing: 1 up the row, -1 back down it. Read off the same
// clock the position is, so the turn happens at exactly the frame the travel
// does.
export const tillerWay = () => {
  if (plotCount() < 2) return 1;              // standing still: it faces the row
  return ((S.tillerAt || 0) % 2) < 1 ? 1 : -1;
};

const tillerPlot = () => {
  const n = plotCount();
  return Math.max(0, Math.min(n - 1, Math.round(tillerRun() * (n - 1))));
};

// A column of the picture, in cells off its left edge, mirrored when the
// tractor turns. The one place that knows how the flip works, so the seat, the
// chimney and the drawing cannot disagree about which end is the front.
export const tillerCol = c => tillerWay() < 0 ? spriteW(TILLER) - 1 - c : c;

// The same mirror for the driver, which is a body wide rather than a cell:
// mirroring its *left* edge like a point hangs it off the back of the tractor
// by the two cells it is wider.
const tillerSeatCol = () =>
  tillerWay() < 0 ? spriteW(TILLER) - WORKER / P - seatCol(TILLER) : seatCol(TILLER);

// The top-left of the picture, which is what both the seat and the chimney
// measure off: the ground under the tractor, less its height.
const tillerTop = x =>
  Math.round((walkY(x + WORKER / 2) + WORKER) / P) * P - spriteH(TILLER) * P;

defineMachine('tiller', {
  job: JOB.FARM,
  type: TYPE.FARM,
  at: tillerAt,
  y: () => walkY(tillerAt() + WORKER / 2) - P,
  // Where the driver sits: on the deck at the end away from the chimney, over
  // the big wheel and behind the column, read off the picture (`seatCol`,
  // `roofRow`) as the drill's and the ram's are. A column named by hand sat
  // the driver on the bonnet, facing the exhaust, with the wheel behind it.
  // Registered with the machine rather than kept in the drawing, so the
  // simulation does not import the renderer to find out where a body goes.
  seat: () => {
    const x = Math.round(tillerAt());
    return { x: x + tillerSeatCol() * P,
             y: tillerTop(x) + roofRow(TILLER) * P - WORKER };
  },
  // The top of the exhaust, mirrored with the tractor when it turns.
  stack: () => {
    const x = Math.round(tillerAt());
    return { x: x + tillerCol(stackCol(TILLER)) * P, y: tillerTop(x) };
  },
  // A unit of the farm's work is a slice of tending: short beat, small bite.
  ms: rate => tendMs() / 40 / Math.max(0.01, rate),
  ready: () => !S.pileFull.farm && plotCount() > 0,
  bite: tender => {
    plantPlots();
    // The run moves on; where it is drawn, which furrow it works and where
    // its tender stands are all read off this one number.
    const n = Math.max(1, plotCount());
    S.tillerAt = ((S.tillerAt || 0) + 1 / (n * 40)) % 2;

    // A tractor going up a field brings the whole field on: the furrow under
    // it fastest, the rest more slowly.
    for (let k = 0; k < n && k < S.plots.length; k++) {
      if (S.plots[k] < 1) S.plots[k] = Math.min(1, S.plots[k] + 1 / (40 * n));
      if (S.plots[k] >= 1 && !S.plotTone[k]) S.plotTone[k] = someFind(SPORE_CELL);
    }

    const i = tillerPlot();
    if (i == null || i >= S.plots.length) return false;
    if (S.plots[i] < 1) {
      S.plots[i] = Math.min(1, S.plots[i] + 1 / 40);
      if (S.plots[i] >= 1) S.plotTone[i] = someFind(SPORE_CELL);
      return true;
    }
    // Through the farm's own `cut`, so the pile, the pile mark and the tone
    // all keep working untouched.
    if (throughPlotMuck(1) < 1) return false;
    cut(i, plotX(i));
    if (tender) tender.farmed = (tender.farmed || 0) + 1;
    return true;
  }
});

// So a work coming back out of a save knows which row it belongs to
// (`registerRows` in works.js).
registerRows(FARM_UPGRADES);
