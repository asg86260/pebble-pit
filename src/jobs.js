// The yard's vocabulary: every job there is, the worker type that does it, and
// how each is said out loud.
//
// This file imports nothing but the words (lang.js, itself a leaf), on
// purpose: config.js prices jobs, state.js counts them, kit.js hats them, so
// a table all of them read has to sit under all of them. A misspelled key
// here is `undefined` and wrong loudly, where a bare string is a comparison
// that is false forever.

import { msg } from './lang.js';

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
  BUILD:   'builder',
  // The deep's (docs/wave-party.md): a fighter at a station the player built,
  // and the hands that gather its floor.
  FIGHTER: 'fighter',
  GATHER:  'gatherer',
  // The deep's own builders: its spare hands putting up its works, never the
  // yard's (DESIGN.md, "Two crews and a portal").
  DELVE:   'delver'
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
  BUILD:   'builders',
  FIGHT:   'fighters',
  GATHER:  'gatherers',
  DELVE:   'delvers'
});

// The deep's jobs, apart: a body down the shaft is out of reach of anything in
// the yard that walks out to the crew (a tonic, a notice for every post). One
// job: which station a fighter stands at, and what it does there, is the
// station's (deep/party.js), not the job's.
export const DEEP_JOBS = Object.freeze([JOB.FIGHT]);
// The gatherers are not put on: they are haulers lent to the deep while scales
// lie on its floor (`rebalance` in staffing.js), the way builders are lent to
// a build. Down there all the same, so a deep type below.
export const YARD_JOBS = Object.freeze(Object.values(JOB).filter(j => !DEEP_JOBS.includes(j) && j !== JOB.GATHER && j !== JOB.DELVE));

// Built from the two tables rather than written a third time, so a job added
// above cannot be forgotten here. Keyed alike but for the fighter, whose
// body is a noun and whose job a verb.
const JOB_KEY = k => (k === 'FIGHTER' ? 'FIGHT' : k);
export const JOB_OF = Object.freeze(Object.fromEntries(
  Object.keys(TYPE).map(k => [TYPE[k], JOB[JOB_KEY(k)]])));

// And back: what to put a body on so that it is doing a given job.
export const TYPE_OF = Object.freeze(Object.fromEntries(
  Object.keys(TYPE).map(k => [JOB[JOB_KEY(k)], TYPE[k]])));

// The deep's jobs as what a body IS, for the questions asked of a body rather
// than of a count: which half of the works it belongs in.
export const DEEP_TYPES = Object.freeze([...DEEP_JOBS.map(j => TYPE_OF[j]), TYPE.GATHER, TYPE.DELVE]);
export const isDeepType = type => DEEP_TYPES.includes(type);

// How a job is SAID. Nothing prints a raw key. The keys stay `rockhands` and
// `quarriers` -- saves and hooks quote them.
const SAID = Object.freeze({
  [JOB.ROCK]: msg('job-rockhands'), [JOB.HAUL]: msg('job-haulers'), [JOB.QUARRY]: msg('job-quarriers'),
  [JOB.FARM]: msg('job-farmhands'), [JOB.SCHOLAR]: msg('job-scholars'), [JOB.PURIFY]: msg('job-purifiers'),
  [JOB.STIR]: msg('job-stirrers'), [JOB.JANITOR]: msg('job-janitors'), [JOB.WIZARD]: msg('job-wizards'),
  [JOB.BUILD]: msg('job-builders'), [JOB.FIGHT]: msg('job-fighters'), [JOB.GATHER]: msg('job-gatherers'),
  [JOB.DELVE]: msg('job-delvers')
});
export const jobSaid = job => SAID[job] || job || '';

// The acts beyond the yard keep crews of their own, out of reach of everything
// above: act 3's members at their posts (`S.after.bodies`) and hell's ghosts
// (`S.hell.bodies`). Their words are spelled here all the same, because some of
// them are the yard's words too, and a bare `'hauler'` cannot say whose it is.
export const AFTER_JOB = Object.freeze({
  AGITATE: 'agitator',
  CUT:     'woodcutter',
  HAUL:    TYPE.HAUL,
  SAW:     'sawyer',
  CHIP:    'feeder',
  PULP:    'pulper',
  JOIN:    'joiner',
  CARRY:   'carrier',
  PRINT:   'printer',
  PASTE:   'paster',
  // A member raising a station off the shack, or the pair down off the
  // pedestal: bought by no post of its own.
  BUILD:   'builder'
});

export const HELL_JOB = Object.freeze({
  MINE:  'miner',
  STOKE: 'stoker',
  HAUL:  TYPE.HAUL,
  SMITH: 'smith',
  // The wall gang: miners taken off their faces while a barrier can be worked.
  GANG:  'gang'
});
