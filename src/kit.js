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
//   trade   the count on S that owns them -- a hat the school sells, one at a
//           time, so the count is what you have bought
//   stock   or: how many the station simply has, for a hat that comes with the
//           building rather than off a shelf. See the janitor's cap.
//   max     and, for a trade, how many of it the station will ever own. The
//           school's four are capped at `KIT_MAX`; the wizard's point is not,
//           because it is a licence to fly rather than a doubling, and the tower
//           brews as many as you have the patience for.
//   tall    how far it stands above the head, for the count over its stand
//
// Every row says where its hats come from, and says it exactly once: `trade` or
// `stock`, never both and never neither. `stockOf` is the one question the rest
// of the game asks -- "how many does this station own" -- and it does not care
// which of the two answered it.
import { P, LOO_POSTS, KIT_MAX } from './config.js';
import { S } from './state.js';

export const KIT = {
  miners:    { mark: 'helmet', trade: 'breakers',   tall: P,     max: KIT_MAX },
  quarriers: { mark: 'lamp',   trade: 'blasters',   tall: P * 2, max: KIT_MAX },
  farmhands: { mark: 'brim',   trade: 'growers',    tall: P * 2, max: KIT_MAX },
  haulers:   { mark: 'cart',   trade: 'carters',    tall: 0,     max: KIT_MAX },
  // Not a doubling but a licence: no hat, no flying. See wizard.js.
  wizards:   { mark: 'point',  trade: 'wizardHats', tall: P * 3 },
  // The one hat nobody buys -- and it used to be the one hat nobody walked for
  // either. It was `innate`: worn by every janitor from the moment it was put on
  // the job, appearing on the head out of nothing. Which is the same trick the
  // cap was in trouble for before, one level up -- a hat that arrives without a
  // walk is a hat that belongs to nowhere, and everything in this file is the
  // sentence "a hat belongs to the station".
  //
  // So it belongs to the outhouse, and the closet hangs one on the stand for
  // every post it opens. That is a station with a *stock* rather than a station
  // with a trade -- nobody sells these, the shed simply has them -- and it is
  // the only difference between this row and the five above it. Everything else
  // is a helmet's life: it waits on a stand, somebody walks over and puts it on,
  // it walks home when that body is taken off the job, and it falls in the dirt
  // if you pick the body up and shake it.
  janitors:  { mark: 'cap',    stock: () => S.outhouseOpen ? LOO_POSTS : 0, tall: P }
};

// What job a body is doing, from what it is. Here rather than in upgrades.js so
// that `wearing` -- which has to go from a body to its own kit -- can be
// answered without the kit importing the shop and the shop importing the kit.
export const JOB_OF = { miner: 'miners', hauler: 'haulers', quarrier: 'quarriers',
                        farmhand: 'farmhands', labber: 'labbers',
                        scrubber: 'scrubbers', janitor: 'janitors', wizard: 'wizards' };

// And back again: what to put a body on so that it is doing a given job. The
// same table read the other way about, because there is now one move that needs
// it -- somebody picking a knocked-off hat up off the ground takes the job with
// it, and the job is what the hat says. A second hand-written list of the same
// eight pairs is the exact bug this file exists to stop.
export const TYPE_OF = Object.fromEntries(
  Object.entries(JOB_OF).map(([type, job]) => [job, type]));

// Whether a job has kit at all -- somewhere its hats come from. What every
// consumer below is really asking before it counts, draws, fetches or checks.
export const hasKit = job => !!(KIT[job] && (KIT[job].trade || KIT[job].stock));

// How many hats the station owns, whichever way it came by them. This is the
// only place in the game that knows there are two ways, and it is deliberately
// the smallest thing in the file: `hats` in upgrades.js is this function under
// the name the rest of the game calls it by.
//
// A trade with a ceiling is clamped here rather than only at the counter,
// because the counter is not the only way the number moves: a save written
// before the ceiling existed, and every test hook that sets a count outright,
// arrive with whatever they arrive with. Clamped at the one place that reads it,
// a station can never own more hats than the game says exist -- and every count
// downstream of this, on the stand, on the roster and in the machine's arithmetic,
// agrees without being told.
export const stockOf = job => {
  if (!hasKit(job)) return 0;
  const k = KIT[job];
  if (k.stock) return k.stock();
  const n = S[k.trade] || 0;
  return k.max ? Math.min(k.max, n) : n;
};

// And the ceiling itself, for the board that sells them: how many of this
// station's hats there are to buy, or `Infinity` for the one that has no end.
export const kitMaxOf = job => (KIT[job] && KIT[job].max) || Infinity;

// The four tables the rest of the game used to keep by hand, now read off the
// one above. They are still exported under their old names because they are
// still the right questions to ask -- what has changed is that there is one
// place that answers them.
//
// `TRADE_OF` is the bought rows only, and that is a narrower list than "every
// job with a hat" now. It is the shop's question -- which counter on S does this
// trade add to -- and a hat the closet hands out has no such counter.
export const TRADE_OF = Object.fromEntries(
  Object.entries(KIT).filter(([, k]) => k.trade).map(([job, k]) => [job, k.trade]));

// A job with a hat somebody has to walk over and pick up, which is every row in
// the table: a hat is somewhere, and a body gets it by going to where it is.
//
// This used to be the traded rows and nothing else, because the cap was worn
// rather than fetched. It is the whole table again -- but it asks the question
// it means (has this job kit?) rather than the question that happened to give
// the same answer (does the school sell it?), so the next hat that comes with a
// building is fetched without a line being changed here.
export const KIT_JOBS = Object.keys(KIT).filter(hasKit);

export const KIT_MARK = Object.fromEntries(
  Object.entries(KIT).map(([job, k]) => [job, k.mark]));

// How far a hat reaches above whatever it is sitting on, so a count can stand
// clear of it. Asked by mark rather than by job, because the stand knows what it
// is holding rather than who is coming for it.
export const HAT_TALL = Object.fromEntries(
  Object.values(KIT).map(k => [k.mark, k.tall]));

// What a body has on. The single answer, and the only one anybody should ask.
//
// It is asked of the *kit* -- which station the thing came off -- and never of
// the job the body is doing, because those two differ for the length of a walk:
// somebody taken off the rock is a hauler as far as the books are concerned and
// is still carrying the rock's helmet, and reading it as a hauler put a cart
// behind it for the whole of that walk.
//
// There is no second case any more. Every hat in the yard is on a head because
// that head walked to a stand and picked it up, so `trained` and `kitOf` say the
// whole of it, and a bare head is a head that has not been over yet.
export function wearing(w) {
  if (!w || !w.trained) return null;
  return KIT[w.kitOf]?.mark || null;
}

// Whether a hat is one the school sells. Not "is this one fetched" -- they all
// are -- but "is there a row on the shop board for it", which is the one
// question left that the two kinds of row answer differently.
export const boughtKit = job => !!(KIT[job] && KIT[job].trade);
