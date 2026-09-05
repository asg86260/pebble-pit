// The yard's vocabulary: every job there is, the worker type that does it, and
// how each is said out loud.
//
// This file imports nothing, on purpose. The names are the most primitive thing
// in the game -- config.js prices jobs, state.js counts them, kit.js hats them,
// and every one of those is upstream of the others -- so a table any of them can
// read has to sit under all of them. Put in kit.js (where JOB_OF used to live)
// it could not be read by config.js without closing a ring.
//
// Why a table at all: the names were written out as bare strings at two hundred
// and twenty-odd call sites, and renaming three of them touched seventy-six
// files. A string is also a thing you can misspell in silence -- `'rockhnd'` is
// a comparison that is simply false forever -- where `TYPE.ROK` is `undefined`
// and wrong loudly, at the first body it is asked about.

// What a body IS. This is `w.type`, and it is what `FACTORY` is keyed on.
export const TYPE = Object.freeze({
  ROCK:    'rockhand',
  HAUL:    'hauler',
  QUARRY:  'quarrier',
  FARM:    'farmhand',
  SCHOLAR: 'scholar',
  PURIFY:  'purifier',
  STIR:    'stirrer',
  JANITOR: 'janitor',
  WIZARD:  'wizard',
  // The training grounds' own body. Every other station's works are done by its
  // gang or by the yard's spare hands; the school had neither -- a post on the
  // boards with nobody through the door. (wave6-sim, item 1)
  TEACH:   'teacher',
  BUILD:   'builder'
});

// What a body DOES. This is the roster's key, the kit table's key, and the field
// the save counts people in -- so it is a word, not a phrase, whatever it is
// said as below.
export const JOB = Object.freeze({
  ROCK:    'rockhands',
  HAUL:    'haulers',
  QUARRY:  'quarriers',
  FARM:    'farmhands',
  SCHOLAR: 'scholars',
  PURIFY:  'purifiers',
  STIR:    'stirrers',
  JANITOR: 'janitors',
  WIZARD:  'wizards',
  TEACH:   'teachers',
  BUILD:   'builders'
});

// From the one to the other. Built from the two tables rather than written out a
// third time, so a job added above cannot be forgotten here.
export const JOB_OF = Object.freeze(Object.fromEntries(
  Object.keys(TYPE).map(k => [TYPE[k], JOB[k]])));

// And back again: what to put a body on so that it is doing a given job. Read
// the same table backwards -- somebody picking a knocked-off hat up off the
// ground takes the job with it, and the job is what the hat says.
export const TYPE_OF = Object.freeze(Object.fromEntries(
  Object.keys(TYPE).map(k => [JOB[k], TYPE[k]])));

// How a job is SAID, where the key is not already the words. A key has to be one
// word -- it is a property name, a save field and a data attribute -- and most
// jobs are one word, so for most of them the key is the answer. The two that are
// not live here, once, rather than as a second spelling written out at every
// board that shows them: a key doubling as its own label is how "labbers"
// survived being read by anybody, and how the haulers came to be called "the
// crew" on one dial and "haulers" everywhere else. Nothing prints a raw key.
const SAID = Object.freeze({ [JOB.ROCK]: 'rock hands', [JOB.PURIFY]: 'air purifiers' });
export const jobSaid = job => SAID[job] || job || '';
