// The index: every thing a player can look up, in the order the book lists
// them (DESIGN.md, "The index"; docs/knowledge-index.md is where each was
// read off the code).
//
// THE TEXTS ARE DRAFTS, for the owner to edit. Every word a player reads in
// the index is in locales/en.ftl, under "## Index" (`idx-<key>-name`,
// `idx-<key>-text`): change it there and the book says it.
//
// key    the entry's own key: what `S.seen` and `S.indexRead` hold
// group  where it sits in the table (GROUPS, in that order); the list is flat,
//        no heading is drawn
// name   the name the game already shows for it
// glyph  a drawing in GLYPHS (src/glyphs.js), `mark:<coin>` for a coin's
//        mark, or null where nobody has drawn one yet (none is shown)
// met    when the player has met it, as a fact the save already holds
//        (met.js reads it):
//          'start'          from the first frame
//          'seen'           only `S.seen`, written where the thing first happens
//          '<field>'        a field on S, met once it is true or above nought
//          'tally:<name>'   a count in `S.tally` above nought
//          'machine:<key>'  that machine bought
//          'shield:<kind>'  that barrier raised
//          'beat:<key>'     that beat played
// serpent  true for the deep's half, listed only where the serpent is on

import { TYPE, JOB, jobSaid } from '../jobs.js';
import { msg } from '../lang.js';
import { storyLine } from '../wardrobe.js';

// The table's order, one run per group; nothing draws a heading for them.
export const GROUPS = ['materials', 'yard', 'sky', 'places', 'crew', 'story'];

export const INDEX = [
  // --- materials ---
  { key: 'dust', group: 'materials', name: msg('idx-dust-name'), glyph: 'mark:dust', met: 'start',
    text: msg('idx-dust-text') },
  { key: 'shard', group: 'materials', name: msg('idx-shard-name'), glyph: 'mark:shard', met: 'seenShard',
    text: msg('idx-shard-text') },
  { key: 'spore', group: 'materials', name: msg('idx-spore-name'), glyph: 'mark:spore', met: 'seenSpore',
    text: msg('idx-spore-text') },
  { key: 'spark', group: 'materials', name: msg('idx-spark-name'), glyph: 'mark:spark', met: 'seenSpark',
    text: msg('idx-spark-text') },
  { key: 'scale', group: 'materials', name: msg('idx-scale-name'), glyph: 'mark:scale', met: 'seenScale', serpent: true,
    text: msg('idx-scale-text') },
  { key: 'crit', group: 'materials', name: msg('idx-crit-name'), glyph: 'cracked', met: 'seen',
    text: msg('idx-crit-text') },

  // --- the yard ---
  { key: 'rock', group: 'yard', name: msg('idx-rock-name'), glyph: null, met: 'start',
    get text() { return storyLine('idx-rock-text-who', 'idx-rock-text', 'sqouse'); } },
  { key: 'pit', group: 'yard', name: msg('idx-pit-name'), glyph: 'hole', met: 'start',
    text: msg('idx-pit-text') },
  { key: 'rift', group: 'yard', name: msg('idx-rift-name'), glyph: null, met: 'riftOpen',
    text: msg('idx-rift-text') },
  { key: 'abyss', group: 'yard', name: msg('idx-abyss-name'), glyph: null, met: 'drowned',
    text: msg('idx-abyss-text') },
  { key: 'muck', group: 'yard', name: msg('idx-muck-name'), glyph: 'muck', met: 'tally:muckRains',
    text: msg('idx-muck-text') },
  { key: 'poop', group: 'yard', name: msg('idx-poop-name'), glyph: 'poop', met: 'seen',
    text: msg('idx-poop-text') },
  { key: 'bird', group: 'yard', name: msg('idx-bird-name'), glyph: 'bird', met: 'seen',
    text: msg('idx-bird-text') },
  { key: 'house', group: 'yard', name: msg('idx-house-name'), glyph: 'house', met: 'crew',
    text: msg('idx-house-text') },

  // --- the sky ---
  { key: 'pollution', group: 'sky', name: msg('idx-pollution-name'), glyph: 'smog', met: 'seenAir',
    text: msg('idx-pollution-text') },
  { key: 'star', group: 'sky', name: msg('idx-star-name'), glyph: null, met: 'meteorOpen',
    text: msg('idx-star-text') },
  { key: 'balloon', group: 'sky', name: msg('idx-balloon-name'), glyph: 'balloon', met: 'filterOpen',
    text: msg('idx-balloon-text') },
  { key: 'recycler', group: 'sky', name: msg('idx-recycler-name'), glyph: null, met: 'filterOpen',
    text: msg('idx-recycler-text') },

  // --- places ---
  { key: 'bench', group: 'places', name: msg('idx-bench-name'), glyph: 'bench', met: 'seenBench',
    text: msg('idx-bench-text') },
  { key: 'shack', group: 'places', name: msg('idx-shack-name'), glyph: 'hut', met: 'shackOpen',
    text: msg('idx-shack-text') },
  { key: 'stats', group: 'places', name: msg('idx-stats-name'), glyph: 'ledger', met: 'banked',
    text: msg('idx-stats-text') },
  { key: 'farm', group: 'places', name: msg('idx-farm-name'), glyph: 'furrow', met: 'farmOpen',
    text: msg('idx-farm-text') },
  { key: 'quarry', group: 'places', name: msg('idx-quarry-name'), glyph: 'hoist', met: 'quarryOpen',
    text: msg('idx-quarry-text') },
  { key: 'apothecary', group: 'places', name: msg('idx-apothecary-name'), glyph: 'pot', met: 'apothecaryOpen',
    text: msg('idx-apothecary-text') },
  { key: 'tower', group: 'places', name: msg('idx-tower-name'), glyph: 'tower', met: 'towerOpen',
    text: msg('idx-tower-text') },
  { key: 'casino', group: 'places', name: msg('idx-casino-name'), glyph: 'die', met: 'casinoOpen',
    text: msg('idx-casino-text') },
  { key: 'outhouse', group: 'places', name: msg('idx-outhouse-name'), glyph: 'bucket', met: 'outhouseOpen',
    text: msg('idx-outhouse-text') },
  { key: 'filter', group: 'places', name: msg('idx-filter-name'), glyph: null, met: 'filterOpen',
    text: msg('idx-filter-text') },
  { key: 'ram', group: 'places', name: msg('idx-ram-name'), glyph: 'ram', met: 'machine:ram',
    text: msg('idx-ram-text') },
  { key: 'jaw', group: 'places', name: msg('idx-jaw-name'), glyph: 'jaw', met: 'machine:jaw',
    text: msg('idx-jaw-text') },
  { key: 'tiller', group: 'places', name: msg('idx-tiller-name'), glyph: 'tiller', met: 'machine:tiller',
    text: msg('idx-tiller-text') },
  { key: 'belt', group: 'places', name: msg('idx-belt-name'), glyph: 'belt', met: 'machine:belt',
    text: msg('idx-belt-text') },
  { key: 'sphere', group: 'places', name: msg('idx-sphere-name'), glyph: 'sphere', met: 'machine:sphere',
    text: msg('idx-sphere-text') },
  { key: 'roomba', group: 'places', name: msg('idx-roomba-name'), glyph: 'roomba', met: 'machine:roomba',
    text: msg('idx-roomba-text') },
  { key: 'driver', group: 'places', name: msg('idx-driver-name'), glyph: 'lift', met: 'drivers',
    text: msg('idx-driver-text') },
  { key: 'props', group: 'places', name: msg('idx-props-name'), glyph: 'planks', met: 'shield:props',
    text: msg('idx-props-text') },
  { key: 'net', group: 'places', name: msg('idx-net-name'), glyph: 'net', met: 'shield:net',
    text: msg('idx-net-text') },
  { key: 'arch', group: 'places', name: msg('idx-arch-name'), glyph: 'arch', met: 'shield:arch',
    text: msg('idx-arch-text') },
  { key: 'dome', group: 'places', name: msg('idx-dome-name'), glyph: 'dome', met: 'shield:dome',
    text: msg('idx-dome-text') },
  { key: 'deep', group: 'places', name: msg('idx-deep-name'), glyph: null, met: 'portalOpen', serpent: true,
    text: msg('idx-deep-text') },
  { key: 'portal', group: 'places', name: msg('idx-portal-name'), glyph: 'portal', met: 'portalOpen', serpent: true,
    text: msg('idx-portal-text') },
  { key: 'crusher', group: 'places', name: msg('idx-crusher-name'), glyph: null, met: 'seenScale', serpent: true,
    text: msg('idx-crusher-text') },
  { key: 'pods', group: 'places', name: msg('idx-pods-name'), glyph: null, met: 'pods', serpent: true,
    text: msg('idx-pods-text') },

  // --- crew ---
  { key: TYPE.HAUL, group: 'crew', name: jobSaid(JOB.HAUL), glyph: null, met: 'start',
    text: msg('idx-haul-text') },
  { key: TYPE.ROCK, group: 'crew', name: msg('idx-rockcrew-name'), glyph: null, met: JOB.ROCK,
    text: msg('idx-rockcrew-text') },
  { key: TYPE.QUARRY, group: 'crew', name: msg('idx-quarrycrew-name'), glyph: null, met: JOB.QUARRY,
    text: msg('idx-quarrycrew-text') },
  { key: TYPE.FARM, group: 'crew', name: msg('idx-farmcrew-name'), glyph: null, met: JOB.FARM,
    text: msg('idx-farmcrew-text') },
  { key: TYPE.PURIFY, group: 'crew', name: msg('idx-purify-name'), glyph: null, met: JOB.PURIFY,
    text: msg('idx-purify-text') },
  { key: TYPE.STIR, group: 'crew', name: msg('idx-stir-name'), glyph: 'pot', met: JOB.STIR,
    text: msg('idx-stir-text') },
  { key: TYPE.JANITOR, group: 'crew', name: jobSaid(JOB.JANITOR), glyph: 'cap', met: JOB.JANITOR,
    text: msg('idx-janitor-text') },
  { key: TYPE.WIZARD, group: 'crew', name: jobSaid(JOB.WIZARD), glyph: 'point', met: JOB.WIZARD,
    text: msg('idx-wizard-text') },
  { key: TYPE.BUILD, group: 'crew', name: jobSaid(JOB.BUILD), glyph: null, met: JOB.BUILD,
    text: msg('idx-build-text') },
  { key: 'breaker', group: 'crew', name: msg('idx-breaker-name'), glyph: 'helmet', met: 'breakers',
    text: msg('idx-breaker-text') },
  { key: 'carter', group: 'crew', name: msg('idx-carter-name'), glyph: 'cart', met: 'carters',
    text: msg('idx-carter-text') },
  { key: 'blaster', group: 'crew', name: msg('idx-blaster-name'), glyph: 'lamp', met: 'blasters',
    text: msg('idx-blaster-text') },
  { key: 'grower', group: 'crew', name: msg('idx-grower-name'), glyph: 'brim', met: 'growers',
    text: msg('idx-grower-text') },
  { key: 'brews', group: 'crew', name: msg('idx-brews-name'), glyph: 'vial', met: 'brews',
    text: msg('idx-brews-text') },
  { key: 'party', group: 'crew', name: jobSaid(JOB.FIGHT), glyph: null, met: JOB.FIGHT, serpent: true,
    text: msg('idx-party-text') },

  // --- the story ---
  { key: 'sqwife', group: 'story', get name() { return storyLine('idx-sqwife-name-who', 'idx-sqwife-name', 'sqouse'); }, glyph: 'sqwife', met: 'start',
    get text() { return storyLine('idx-sqwife-text-who', 'idx-sqwife-text', 'sqouse'); } },
  { key: 'notices', group: 'story', name: msg('idx-notices-name'), glyph: 'trophy', met: 'won',
    text: msg('idx-notices-text') },
  { key: 'serpent', group: 'story', name: msg('idx-serpent-name'), glyph: null, met: 'beat:snatch', serpent: true,
    text: msg('idx-serpent-text') },
];
