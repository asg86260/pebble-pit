// What the deep's boards sell: the weapons' ladders, the doors, and the star.
//
// Five boards, one a station on the deep's floor, each the shape of a yard
// station's: a roster heading for the bodies posted there, then what the
// place sells. Every ladder goes through `tierRows` and leads with scales
// (`lead: 'scale'`): scales alone, then scales and the yard's coins, a spark
// at the top (DESIGN.md, "What the scale buys"). What a rung is worth and
// what it costs is LADDERS in config/rungs.js; this file only says where each
// ladder hangs.
//
// A rung is built at its station by the yard's builders, who go down the
// shaft to it (`DOWN_THERE` in works.js): the site of every row here is the
// station's key, or `deep` for a door, which goes up where its station will
// stand.

import { S } from '../state.js';
import { rungValue, DOOR_BILLS, STAR_SPARKS, STAR_TUNE_SPARKS, STAR_EVERY_S, POD_SCALES0, POD_RATE } from '../config.js';
import { tierRows, named } from '../upgrades/tiers.js';
import { staffDoor, hirePod } from '../staffing.js';
import { open, offered } from '../stations.js';
import { registerRows } from '../works.js';
import { JOB, jobSaid } from '../jobs.js';
import { spotX, standOf } from './place.js';
import { registerBoard } from '../boardrows.js';

// One weapon's ladder, on the board of the station that throws it. The level
// field is the ladder's key and `Level` (state.js), and the rung's value is
// read off the written table by the same key.
const ladder = (key, name, station, o) => tierRows({
  field: key + 'Level',
  lead: 'scale',
  value: lvl => rungValue(key, lvl),
  site: station, board: station,
  show: () => open(station),
  bands: named(key, name),
  ...o
});

// --- the altar: the fists, and every door ------------------------------------
const PUNCH = ladder('punch', 'punch strength', 'altar', { unit: 'dmg', does: 'punch' });
const BRAWL = ladder('brawl', 'punch pace', 'altar', { unit: '/s', pct: true, does: 'punch' });

// A door, cut from the shape `site()` gives a yard door (upgrades/site.js),
// with what differs in the deep: the bill is the doors table (DOOR_BILLS),
// it is sold on the altar and goes up where its station will stand (`at`,
// `box`), and the view does not glide to it, since the place it opens is on
// the same floor as the board that sold it.
const door = ({ key, name, blurb, note, job }) => ({
  key: 'unlock' + key, name, blurb, note,
  kind: 'building', site: 'deep', board: 'altar',
  at: () => spotX(key), box: () => standOf(key),
  bill: () => DOOR_BILLS[key],
  buy: () => { S[key + 'Open'] = true; staffDoor(job); },
  // The gate is the station's row (`after` and `needs` in stations.js).
  show: () => offered(key)
});

const DOORS = [
  door({ key: 'well', name: 'draw the well', job: JOB.LANCE,
         blurb: 'lances that pierce wards',
         note: () => 'a well of black water: lances drawn from it stick in the coil and bleed it' }),
  door({ key: 'font', name: 'raise the font', job: JOB.GRENADE,
         blurb: 'grenades that burst in rings',
         note: () => 'the surface\'s ripples held in a ball: a burst hits every length it crosses' }),
  door({ key: 'circle', name: 'mark the circle', job: JOB.SCRIBE,
         blurb: 'sigils that hold the heal',
         note: () => 'scribes draw circles under the coil, and every circle held cuts its heal' }),
  door({ key: 'spire', name: 'raise the spire', job: JOB.WARLOCK,
         blurb: 'wizards that light the coil',
         note: () => 'a hand takes the robe and channels a beam that strikes the coil and lights it' })
];

// A pod: one more of the crew, living down here (DESIGN.md, "One crew, two
// homes"). Sold on the altar and built at the pods by the builders, a
// steeper price in scales each one, like the yard's rooms.
const POD = {
  key: 'pod', name: 'another pod', kind: 'building', site: 'pods', board: 'altar',
  note: () => 'a capsule on the deep\'s far side: one more of the crew, living down here',
  from: () => S.crew, to: () => S.crew + 1,
  // Scales alone: naming no dust at nought would have `billOf` add its worth.
  bill: () => [['scale', Math.round(POD_SCALES0 * Math.pow(POD_RATE, S.pods || 0))], ['dust', 0]],
  buy: () => { hirePod(); S.shopStale = true; },
  show: () => S.snatched
};

// --- the well, the font, the circle --------------------------------------------
const LANCE = ladder('lance', 'lance bleed', 'well', { unit: 'dmg/s', does: 'bleed' });
const LANCEHOLD = ladder('lancehold', 'lance hold', 'well', { unit: 's', does: 'hold' });
const GRENADE = ladder('grenade', 'grenade burst', 'font', { unit: 'dmg', does: 'burst' });
const GRENADEPACE = ladder('grenadepace', 'grenade pace', 'font', { unit: '/min', pct: true, does: 'throw' });
const SIGIL = ladder('sigil', 'sigil circles', 'circle', { unit: 'circles', does: 'hold' });

// --- the spire, and the star -----------------------------------------------------
const BEAM = ladder('beam', 'beam strength', 'spire', { unit: 'dmg/s', does: 'channel' });
const CURSE = ladder('curse', 'curse the heal', 'spire', { unit: '%', does: 'curse' });

// The deep's machine, bought in sparks by the rule that sparks buy every
// machine. The dust beside the sparks is derived by `billOf`. Put up at the
// spire by its wizards.
const STAR = {
  key: 'callstar', name: 'the called star',
  kind: 'machine', site: 'spire', board: 'spire',
  note: () => 'a star pulled down out of the sky, through the surface and onto the coil',
  bill: () => [['spark', STAR_SPARKS]],
  buy: () => { S.starOpen = true; },
  show: () => open('spire') && !S.starOpen
};

// Its ladder: three rungs of red, like a yard machine's (`tuneRow` in
// machines.js), each calling the star sooner. The bill is the rung you are on,
// clamped at the top so a finished row still has a price to draw.
const STAR_RUNGS = STAR_TUNE_SPARKS.length;
const TUNESTAR = {
  key: 'tunestar', name: 'star pace',
  kind: 'rung', site: 'spire', board: 'spire',
  unit: 's', does: 'a star every',
  from: () => STAR_EVERY_S[Math.min(S.starLevel, STAR_RUNGS)],
  to: () => STAR_EVERY_S[Math.min(S.starLevel + 1, STAR_RUNGS)],
  note: () => 'the wizards call the star down sooner',
  rung: () => Math.min(S.starLevel, STAR_RUNGS),
  rungs: () => STAR_RUNGS,
  bill: () => [['spark', STAR_TUNE_SPARKS[Math.min(S.starLevel, STAR_RUNGS - 1)]]],
  buy: () => { S.starLevel++; },
  show: () => !!S.starOpen
};

// --- the boards ------------------------------------------------------------------
// Each station's rows, keyed by the station, for board.js and shop.js to draw
// and hooks.js to reach.
export const DEEP_ROWS = {
  altar: [...PUNCH, ...BRAWL, ...DOORS, POD],
  well: [...LANCE, ...LANCEHOLD],
  font: [...GRENADE, ...GRENADEPACE],
  circle: [...SIGIL],
  spire: [...BEAM, ...CURSE, STAR, TUNESTAR]
};
export const DEEP_UPGRADES = Object.values(DEEP_ROWS).flat();

// The job posted at each station, whose headcount the roster heading wears.
export const DEEP_JOB_AT = { altar: JOB.BRAWL, well: JOB.LANCE, font: JOB.GRENADE,
                             circle: JOB.SCRIBE, spire: JOB.WARLOCK };

// The roster heading is the job as it is said, and is drawn with nothing
// under it (`roster` in shop.js's `build`): the bodies are put on and taken
// off at the posts on the floor, and the heading is where the board says how
// many are down there.
const roster = station => ({ title: jobSaid(DEEP_JOB_AT[station]), roster: true, keys: [],
                             heads: () => S[DEEP_JOB_AT[station]] || 0 });

export const DEEP_SECTIONS = {
  altar: [roster('altar'),
          { title: 'the fist', keys: ['punch', 'brawl'] },
          { title: 'the deep', keys: DOORS.map(u => u.key) },
          { title: 'the pods', keys: ['pod'] }],
  well: [roster('well'), { title: 'the lance', keys: ['lance', 'lancehold'] }],
  font: [roster('font'), { title: 'the grenade', keys: ['grenade', 'grenadepace'] }],
  circle: [roster('circle'), { title: 'the circle', keys: ['sigil'] }],
  spire: [roster('spire'),
          { title: 'the spire', keys: ['beam', 'curse'] },
          { title: 'the star', keys: ['callstar', 'tunestar'] }]
};

// So a work coming back out of a save knows which row it belongs to.
registerRows(DEEP_UPGRADES);
for (const key of Object.keys(DEEP_ROWS))
  registerBoard(key, { rows: () => DEEP_ROWS[key], sections: () => DEEP_SECTIONS[key] });
