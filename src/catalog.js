// The catalog of notices: what each is called and what earns it, in words.
//
// Name and note only -- no `when`, no reach into the yard. The record is read
// on the held sheet, where the yard is standing, and on the landing page,
// where nothing is (title.js reads it off a save); a catalog that imported
// the game to name a notice would drag the boards' DOM into a page that has
// none. The predicates live with the game in notices.js and are joined to
// these by key. See DESIGN.md: a record that comments on itself is a record
// you read twice, so the note says WHAT YOU DID, in the words the yard would
// use, and never a remark about it.

import { NOTICE_ROCKS, NOTICE_PEBBLES, NOTICE_CREW, NOTICE_ORE } from './config.js';

// The ladders are built from their tables rather than written out, so the count
// on the board and the thresholds in config.js cannot drift apart.
const ladder = (prefix, list, name, note) =>
  list.map((n, i) => ({ key: prefix + i, name: name(n, i), note: note(n, i) }));

export const SAY = ['ten', 'twenty-five', 'fifty', 'a hundred'];
export const PEBBLE_SAY = ['ten thousand', 'a hundred thousand', 'a million',
                           'ten million', 'a hundred million'];
export const CREW_SAY = ['five', 'ten', 'twenty five', 'fifty'];

export const CATALOG = [
  // --- what happens on its own -------------------------------------------------
  { key: 'firstgrain', name: "makin' money", note: 'throw a pebble into the pit' },
  { key: 'firstrock', name: 'better keep digging', note: 'clear the first rock' },
  { key: 'gotout', name: 'you saved your sqwife', note: 'no more rocks, you did it.' },
  { key: 'firstcore', name: 'something was inside it', note: 'bank a core out of a broken rock' },
  { key: 'firsthire', name: "you've constructed additional pylons", note: 'build another house' },
  { key: 'firstshard', name: 'the first ore', note: 'bring ore up out of the quarry' },
  { key: 'firstspore', name: 'cultivation', note: 'grow your first crop' },
  { key: 'firstspark', name: 'magic in the air', note: 'earn your first spark' },
  { key: 'holefull', name: 'the pit is full', note: 'fill the pit to the brim' },
  { key: 'rifttorn', name: 'the rift torn, storage is solved', note: 'fill the pit causing an inter-dimensional rift' },
  { key: 'drowned', name: 'the rift has gotten bigger', note: 'a whole ocean of inter-dimensional storage.' },
  { key: 'star', name: 'conjure a star', note: 'call a star down from the tower' },
  { key: 'firsthat', name: "you're a wizard squarey", note: 'finish a wizard hat at the tower' },
  { key: 'firstbrew', name: 'hello, potion seller', note: 'brew a batch at the apothecary' },
  { key: 'firsttrade', name: 'first hat', note: 'buy a station its first hat' },
  { key: 'alltrades', name: 'educating the masses', note: 'stock every station with its hat' },
  { key: 'allbuilt', name: 'building complete', note: 'you built everything' },

  // --- numbers, for the long tail ----------------------------------------------
  ...ladder('rock', NOTICE_ROCKS,
            (n, i) => `${SAY[i]} rocks`,
            (n, i) => `clear ${SAY[i]} boulders` +
                      (i === SAY.length - 1 ? ", that's a lot of rocks" : '')),
  ...ladder('pebble', NOTICE_PEBBLES,
            (n, i) => `${PEBBLE_SAY[i]} pebbles`,
            (n, i) => `bank ${PEBBLE_SAY[i]} pebbles`),
  ...ladder('crew', NOTICE_CREW,
            (n, i) => `${CREW_SAY[i]} squares`,
            (n, i) => `hire a crew of ${CREW_SAY[i]}`),
  ...ladder('ore', NOTICE_ORE,
            (n, i) => i === 0 ? 'a thousand ore out of the cut' : 'ten thousand ore',
            (n, i) => `dig ${i === 0 ? 'a thousand' : 'ten thousand'} ore out of the quarry`),
  { key: 'rift1e6', name: 'a million through the rift', note: 'send a million pebbles through the rift' },
  { key: 'brew100', name: 'a hundred batches', note: 'brew a hundred batches' },
  { key: 'lived1h', name: 'an hour on one clock', note: 'keep one body on the payroll for an hour' },

  // --- feats you would have to set out for --------------------------------------
  { key: 'nobodyhired', name: 'nobody hired', note: 'clear a whole boulder with nobody on the payroll' },
  { key: 'ownhand', name: 'your own hand alone', note: 'clear a boulder without a single worker touching it' },
  { key: 'nevertouched', name: 'never touched it', note: 'clear a boulder without swinging at it once yourself' },
  { key: 'underminute', name: 'a rock off in under a minute', note: 'clear a boulder in under a minute' },
  { key: 'everyjob', name: 'every job staffed at once', note: 'put at least one body on every job at once' },
  { key: 'tablebeaten', name: "we're so back", note: 'win 50k in a single spin at the casino' },
  { key: 'tableruin', name: 'time to get a loan', note: 'lose a 50k stake in a single spin at the casino' },

  // --- things you do with your hands ---------------------------------------------
  { key: 'bird', name: 'get off my land', note: 'startle a bird' },
  { key: 'wholelot', name: 'not one of you', note: 'startle every bird in one lot' },
  { key: 'catchall', name: 'juggler', note: 'throw a full hand of dust and catch every grain' },
  { key: 'lifted', name: 'come here you', note: 'pick a worker up' },
  { key: 'shookload', name: 'turn out your pockets', note: 'shake a full load out of a worker' },
  { key: 'hatoff', name: 'hats off', note: 'shake the hat off a worker' },
  { key: 'muckrain', name: 'it never rains but it pours', note: 'stand through a muck rain' }
];
