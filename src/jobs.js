// The yard's vocabulary: every job there is, the worker type that does it, and
// how each is said out loud.
//
// This file imports nothing, on purpose: config.js prices jobs, state.js
// counts them, kit.js hats them, so a table all of them read has to sit under
// all of them. A misspelled key here is `undefined` and wrong loudly, where a
// bare string is a comparison that is false forever.

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
  BUILD:   'builder'
});

// What a body DOES. The roster's key, the kit table's key, and the field the
// save counts people in -- so a word, not a phrase, whatever it is said as.
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
  BUILD:   'builders'
});

// Built from the two tables rather than written a third time, so a job added
// above cannot be forgotten here.
export const JOB_OF = Object.freeze(Object.fromEntries(
  Object.keys(TYPE).map(k => [TYPE[k], JOB[k]])));

// And back: what to put a body on so that it is doing a given job.
export const TYPE_OF = Object.freeze(Object.fromEntries(
  Object.keys(TYPE).map(k => [JOB[k], TYPE[k]])));

// How a job is SAID, where the key is not already the words. Nothing prints a
// raw key. The keys stay `rockhands` and `quarriers` -- saves and hooks quote
// them.
const SAID = Object.freeze({ [JOB.ROCK]: 'diggers', [JOB.QUARRY]: 'miners', [JOB.PURIFY]: 'air purifiers' });
export const jobSaid = job => SAID[job] || job || '';
