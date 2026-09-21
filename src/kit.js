// The kit: one hat, one table, one answer.
//
// One row per hat, holding everything anybody asks about one: it is drawn on
// the head that wears it, put out on the stand at its station, counted on the
// roster, fetched on the errand, and shaken off when its owner is turned
// upside down.
//
//   mark    which picture it is, in sprites.js
//   trade   the count on S that owns them -- a hat a kit row sells
//   stock   or: how many the station simply has, for a hat that comes with the
//           building rather than off a shelf (the janitor's cap)
//   set     for a trade, what counts as a *full set* -- the number a machine
//           waits for before it will stand at the station
//   max     how many the station will ever own, the ceiling the board draws
//           pips against. Absent means no ceiling: the wizard's point (a
//           license, not a doubling) and the carter's cart (the belt runs one
//           line; everything off it is still walked, so another cart is
//           always worth buying).
//   tall    how far it stands above the head, for the count over its stand
//
// Every row says where its hats come from exactly once: `trade` or `stock`,
// never both and never neither. `stockOf` does not care which answered.
import { P, LOO_POSTS, KIT_MAX } from './config.js';
import { S } from './state.js';
import { JOB } from './jobs.js';

export const KIT = {
  [JOB.ROCK]:    { mark: 'helmet', trade: 'breakers', tall: P,     set: KIT_MAX, max: KIT_MAX },
  [JOB.QUARRY]: { mark: 'lamp',   trade: 'blasters', tall: P * 2, set: KIT_MAX, max: KIT_MAX },
  [JOB.FARM]: { mark: 'brim',   trade: 'growers',  tall: P * 2, set: KIT_MAX, max: KIT_MAX },
  // A set of three, and no ceiling over it: see the note on `max` above. The
  // cart is no hat: on its stand it is the box, two cells high, standing on
  // its wheel (`drawCartBox`, render/crew.js), so the count clears the box.
  // `up` is the one second rung in the table: a forklift is a cart with an
  // engine under it, worn by a carter and counted on `S.drivers`, and every
  // question about it is asked of this row (`liftsOf`, `driving`, `spareLifts`).
  [JOB.HAUL]:   { mark: 'cart',   trade: 'carters',  tall: P * 2, set: KIT_MAX,
                  up: { mark: 'lift', trade: 'drivers', tall: P * 3 } },
  // Not a doubling but a license: no hat, no flying. See wizard.js.
  [JOB.WIZARD]:   { mark: 'point',  trade: 'wizardHats', tall: P * 3 },
  // The one hat nobody buys: the shed hangs one on the stand for every post it
  // opens. A stock rather than a trade is the only difference from the rows
  // above; it is still fetched, walked home and shaken off like a helmet.
  [JOB.JANITOR]:  { mark: 'cap',    stock: () => S.outhouseOpen ? (S.looPosts ?? LOO_POSTS) : 0, tall: P }
};

// Handed on from here because this is where the rest of the game asks for
// them. jobs.js imports nothing, so nothing rings.
export { JOB_OF, TYPE_OF, jobSaid } from './jobs.js';

// Whether a job has kit at all -- somewhere its hats come from.
export const hasKit = job => !!(KIT[job] && (KIT[job].trade || KIT[job].stock));

// How many hats the station owns, whichever way it came by them; `hats` in
// upgrades.js is this function. A trade with a ceiling is clamped here rather
// than only at the counter, because an old save or a hook can set the count
// outright; clamped at the one place that reads it, every count downstream
// agrees.
export const stockOf = job => {
  if (!hasKit(job)) return 0;
  const k = KIT[job];
  if (k.stock) return k.stock();
  const n = S[k.trade] || 0;
  return k.max ? Math.min(k.max, n) : n;
};

// The ceiling, for the board that sells them: `Infinity` for the ones with no
// end.
export const kitMaxOf = job => (KIT[job] && KIT[job].max) || Infinity;

// A *full set* is the machine's question, not the board's: how much kit a
// station owns before the jaw, the ram, the tiller or the belt will stand at
// it. It is not the ceiling, because the cart row has none and gating the belt
// on infinity would never offer it.
export const kitSetOf = job =>
  (KIT[job] && (KIT[job].set || KIT[job].max)) || Infinity;

// `TRADE_OF` is the bought rows only: the shop's question is which counter on
// S a trade adds to, and a hat the outhouse hands out has no counter.
export const TRADE_OF = Object.fromEntries(
  Object.entries(KIT).filter(([, k]) => k.trade).map(([job, k]) => [job, k.trade]));

// Every job with a hat somebody has to walk over and pick up, which is every
// row in the table. Asks "has this job kit?" rather than "does a kit row sell
// it?", so the next hat that comes with a building is fetched unasked.
export const KIT_JOBS = Object.keys(KIT).filter(hasKit);

export const KIT_MARK = Object.fromEntries(
  Object.entries(KIT).map(([job, k]) => [job, k.mark]));

// Keyed by mark rather than by job, because the stand knows what it is holding
// rather than who is coming for it.
export const HAT_TALL = Object.fromEntries(
  Object.values(KIT).flatMap(k => [[k.mark, k.tall], ...(k.up ? [[k.up.mark, k.up.tall]] : [])]));

// What a body has on. Asked of the *kit* (which station the thing came off)
// and never of the job the body is doing: somebody taken off the rock is a
// hauler on the books and is still carrying the rock's helmet for the length
// of the walk. A bare head is a head that has not been to a stand yet. A
// driver's answer is the lift: the cart is under it.
export function wearing(w) {
  if (!w || !w.trained) return null;
  const k = KIT[w.kitOf];
  if (!k) return null;
  return w.lift && k.up ? k.up.mark : k.mark;
}

// --- the forklift ------------------------------------------------------------
// The engine is bolted to a cart, so a lift is only ever on a body that is
// wearing the cart it went on to, and comes off with it (`drop`, `flingHat`).
// The counts are the cart's shape again: owned, worn, lying loose, spare.
export const LIFT = KIT[JOB.HAUL].up;
export const liftsOf = () => S[LIFT.trade] || 0;
export const driving = () => S.workers.filter(w => w.trained && w.lift).length;
export const looseLifts = () => S.workers.filter(w => w.hatOff && w.hatOff.lift).length;
export const spareLifts = () => Math.max(0, liftsOf() - driving() - looseLifts());

// Whether there is a row on the shop board for the hat.
export const boughtKit = job => !!(KIT[job] && KIT[job].trade);
