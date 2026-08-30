// The kit: one hat, one table, one answer.
//
// A hat used to be four facts kept in four places -- which trade owns it
// (`TRADE_OF` in upgrades.js), which jobs go and fetch one (`KIT_JOBS` in
// crew.js), which shape it is (`KIT_MARK` in roster.js), and how tall it stands
// on a stand (`HAT_TALL` in render.js) -- and every new hat had to be added to
// all four or it went half-missing. The janitor's cap is what that cost looked
// like: it was in the shape table and in none of the others, so it existed only
// because `drawWorkers` had a branch that drew it by name, and no other part of
// the game believed in it. A hat that one function knows about is not a hat, it
// is a picture that function draws.
//
// So: one row per hat, holding everything anybody asks about one. Add a row and
// the yard picks it up whole -- it is drawn on the head that wears it, put out
// on the stand at its station, counted on the roster, fetched and handed in on
// the errand, and shaken off when somebody turns its owner upside down. Nothing
// has to be told twice.
//
//   mark    which picture it is, in sprites.js
//   trade   the count on S that owns them, or null for a hat nobody buys
//   tall    how far it stands above the head, for the count over its stand
//   innate  worn by every body on that job, with nothing to buy and no errand:
//           the job *is* the hat. See `wearing`.
import { P } from './config.js';

export const KIT = {
  miners:    { mark: 'helmet', trade: 'breakers',   tall: P },
  quarriers: { mark: 'lamp',   trade: 'blasters',   tall: P * 2 },
  farmhands: { mark: 'brim',   trade: 'growers',    tall: P * 2 },
  haulers:   { mark: 'cart',   trade: 'carters',    tall: 0 },
  // Not a doubling but a licence: no hat, no flying. See wizard.js.
  wizards:   { mark: 'point',  trade: 'wizardHats', tall: P * 3 },
  // The one hat nobody buys. A janitor is the only body in the yard wearing
  // something the school does not sell, and it wears it because it is a janitor
  // -- so it is `innate`, and every rule below reads that off the table rather
  // than off a branch somewhere that names it.
  janitors:  { mark: 'cap',    trade: null,         tall: P, innate: true }
};

// What job a body is doing, from what it is. Here rather than in upgrades.js so
// that `wearing` -- which has to go from a body to its own kit -- can be
// answered without the kit importing the shop and the shop importing the kit.
export const JOB_OF = { miner: 'miners', hauler: 'haulers', quarrier: 'quarriers',
                        farmhand: 'farmhands', labber: 'labbers',
                        scrubber: 'scrubbers', janitor: 'janitors', wizard: 'wizards' };

// The four tables the rest of the game used to keep by hand, now read off the
// one above. They are still exported under their old names because they are
// still the right questions to ask -- what has changed is that there is one
// place that answers them.
export const TRADE_OF = Object.fromEntries(
  Object.entries(KIT).filter(([, k]) => k.trade).map(([job, k]) => [job, k.trade]));

// A job with a hat somebody has to walk over and pick up. Innate kit is not on
// this list: there is nothing to fetch and nothing to hand in.
export const KIT_JOBS = Object.keys(TRADE_OF);

export const KIT_MARK = Object.fromEntries(
  Object.entries(KIT).map(([job, k]) => [job, k.mark]));

// How far a hat reaches above whatever it is sitting on, so a count can stand
// clear of it. Asked by mark rather than by job, because the stand knows what it
// is holding rather than who is coming for it.
export const HAT_TALL = Object.fromEntries(
  Object.values(KIT).map(k => [k.mark, k.tall]));

// What a body has on. The single answer, and the only one anybody should ask.
//
// Bought kit is asked of the *kit* -- which station the thing came off -- and
// never of the job the body is doing, because those two differ for the length of
// a walk: somebody taken off the rock is a hauler as far as the books are
// concerned and is still carrying the rock's helmet, and reading it as a hauler
// put a cart behind it for the whole of that walk.
//
// Innate kit is the other way about, and has to be: there is no `trained` flag
// to read because there was never anything to pick up. The body's own job wears
// it, always, and takes it off nowhere.
export function wearing(w) {
  if (!w) return null;
  if (w.trained) return KIT[w.kitOf]?.mark || null;
  const own = KIT[JOB_OF[w.type]];
  return own && own.innate ? own.mark : null;
}

// Whether a hat is one the yard hands out. Everything that walks a body to a
// stand, counts what is spare, or shakes one off a head asks this first, so a
// hat that is part of the body is never fetched, never counted as stock, and
// never falls off.
export const boughtKit = job => !!(KIT[job] && KIT[job].trade);
