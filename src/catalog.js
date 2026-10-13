// The catalog of notices: what each is called and what earns it, in words.
//
// Name and note only, no reach into the yard: the landing page reads this off
// a save with no game booted, and importing the game would drag the boards'
// DOM into a page that has none. The predicates live in notices.js, joined by
// key. The note says what you did, never a remark about it (DESIGN.md).

import { NOTICE_ROCKS, NOTICE_PEBBLES, NOTICE_CREW, NOTICE_ORE, NOTICE_SERPENT } from './config.js';
import { msg } from './lang.js';

// Built from the config tables so the count on the board and the thresholds
// cannot drift apart.
const ladder = (prefix, list, name, note) =>
  list.map((n, i) => ({ key: prefix + i, name: name(n, i), note: note(n, i) }));

export const SAY = ['10', '25', '50', '100'];
export const PEBBLE_SAY = ['10k', '100k', '1m',
                           '10m', '100m'];
export const CREW_SAY = ['5', '10', '25', '50'];

export const CATALOG = [
  // --- what happens on its own -------------------------------------------------
  { key: 'firstgrain', name: msg('ach-firstgrain-name'), note: msg('ach-firstgrain-note') },
  { key: 'firstrock', name: msg('ach-firstrock-name'), note: msg('ach-firstrock-note') },
  { key: 'gotout', name: msg('ach-gotout-name'), note: msg('ach-gotout-note') },
  { key: 'firsthire', name: msg('ach-firsthire-name'), note: msg('ach-firsthire-note') },
  { key: 'firstshard', name: msg('ach-firstshard-name'), note: msg('ach-firstshard-note') },
  { key: 'firstspore', name: msg('ach-firstspore-name'), note: msg('ach-firstspore-note') },
  { key: 'firstspark', name: msg('ach-firstspark-name'), note: msg('ach-firstspark-note') },
  { key: 'holefull', name: msg('ach-holefull-name'), note: msg('ach-holefull-note') },
  { key: 'rifttorn', name: msg('ach-rifttorn-name'), note: msg('ach-rifttorn-note') },
  { key: 'drowned', name: msg('ach-drowned-name'), note: msg('ach-drowned-note') },
  { key: 'star', name: msg('ach-star-name'), note: msg('ach-star-note') },
  { key: 'firsthat', name: msg('ach-firsthat-name'), note: msg('ach-firsthat-note') },
  { key: 'firstbrew', name: msg('ach-firstbrew-name'), note: msg('ach-firstbrew-note') },
  { key: 'firsttrade', name: msg('ach-firsttrade-name'), note: msg('ach-firsttrade-note') },
  { key: 'alltrades', name: msg('ach-alltrades-name'), note: msg('ach-alltrades-note') },
  { key: 'allbuilt', name: msg('ach-allbuilt-name'), note: msg('ach-allbuilt-note') },

  // --- numbers, for the long tail ----------------------------------------------
  ...ladder('rock', NOTICE_ROCKS,
            (n, i) => msg('ach-rocks-name', { n: SAY[i] }),
            (n, i) => msg(i === SAY.length - 1 ? 'ach-rocks-note-last' : 'ach-rocks-note', { n: SAY[i] })),
  ...ladder('pebble', NOTICE_PEBBLES,
            (n, i) => msg('ach-pebbles-name', { n: PEBBLE_SAY[i] }),
            (n, i) => msg('ach-pebbles-note', { n: PEBBLE_SAY[i] })),
  ...ladder('crew', NOTICE_CREW,
            (n, i) => msg('ach-crew-name', { n: CREW_SAY[i] }),
            (n, i) => msg('ach-crew-note', { n: CREW_SAY[i] })),
  ...ladder('ore', NOTICE_ORE,
            (n, i) => i === 0 ? msg('ach-ore0-name') : msg('ach-ore1-name'),
            (n, i) => msg('ach-ore-note', { n: i === 0 ? '1k' : '10k' })),
  // The endless serpent's (DESIGN.md, "Endless serpent"): the names and notes
  // are the owner's to write, placeholders until then.
  ...ladder('serpent', NOTICE_SERPENT,
            n => msg('ach-serpent-name', { n }),
            n => msg('ach-serpent-note', { n })),
  { key: 'allstations', name: msg('ach-allstations-name'), note: msg('ach-allstations-note') },
  { key: 'rift1e6', name: msg('ach-rift1e6-name'), note: msg('ach-rift1e6-note') },
  { key: 'brew100', name: msg('ach-brew100-name'), note: msg('ach-brew100-note') },
  { key: 'lived1h', name: msg('ach-lived1h-name'), note: msg('ach-lived1h-note') },

  // --- feats you would have to set out for --------------------------------------
  { key: 'nobodyhired', name: msg('ach-nobodyhired-name'), note: msg('ach-nobodyhired-note') },
  { key: 'ownhand', name: msg('ach-ownhand-name'), note: msg('ach-ownhand-note') },
  { key: 'nevertouched', name: msg('ach-nevertouched-name'), note: msg('ach-nevertouched-note') },
  { key: 'underminute', name: msg('ach-underminute-name'), note: msg('ach-underminute-note') },
  { key: 'everyjob', name: msg('ach-everyjob-name'), note: msg('ach-everyjob-note') },
  { key: 'tablebeaten', name: msg('ach-tablebeaten-name'), note: msg('ach-tablebeaten-note') },
  { key: 'tableruin', name: msg('ach-tableruin-name'), note: msg('ach-tableruin-note') },

  // --- things you do with your hands ---------------------------------------------
  { key: 'bird', name: msg('ach-bird-name'), note: msg('ach-bird-note') },
  { key: 'wholelot', name: msg('ach-wholelot-name'), note: msg('ach-wholelot-note') },
  { key: 'catchall', name: msg('ach-catchall-name'), note: msg('ach-catchall-note') },
  { key: 'lifted', name: msg('ach-lifted-name'), note: msg('ach-lifted-note') },
  { key: 'shookload', name: msg('ach-shookload-name'), note: msg('ach-shookload-note') },
  { key: 'hatoff', name: msg('ach-hatoff-name'), note: msg('ach-hatoff-note') },
  { key: 'dizzy', name: msg('ach-dizzy-name'), note: msg('ach-dizzy-note') },   // the owner's
  { key: 'muckrain', name: msg('ach-muckrain-name'), note: msg('ach-muckrain-note') }
];
