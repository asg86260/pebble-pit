// Which shelf drawing each achievement wears: [glyph, badge, coin, borrowed-because].
// A ladder's rungs (rock0..rock3) share the entry for their key minus its
// trailing digits. A `borrowed-because` marks a drawing that does not exist
// yet: the glyph named stands in, and the owner draws the real one in
// glyphs.html.
export const PICK = {
  firstgrain: ['sack', 'dust'], firstrock: ['pickhead'], gotout: ['door', null, null, 'nothing for her or for getting out; the door stands in'],
  firsthire: ['house', 'plus'], firstshard: ['ore', null, 'shard'], firstspore: ['ear', null, 'spore'], firstspark: ['spark', null, 'spark'],
  holefull: ['bucket', null, null, 'no drawing of the pit itself; the toss bucket stands in'],
  rifttorn: ['portal'], drowned: ['portal', 'plus'], star: ['star', null, 'spark'], firsthat: ['hat', 'star'],
  firstbrew: ['pot'], firsttrade: ['helmet'], alltrades: ['helmet', 'up'], allbuilt: ['hut', 'star'],
  rock: ['cracked'], pebble: ['sack', 'dust'], crew: ['door', 'plus'], ore: ['ore', 'up', 'shard'],
  rift1e6: ['portal', 'dust'], brew100: ['vial', 'up'],
  lived1h: ['boot', null, null, 'no clock or hourglass; the boot stands in'],
  nobodyhired: ['pickhead', null, null, 'no drawing of an empty payroll; the pick stands in'],
  ownhand: ['swing'], nevertouched: ['lever'],
  underminute: ['bolt', null, null, 'no clock; the bolt stands in for speed'],
  everyjob: ['crate', 'plus', null, 'no drawing of a full roster; the crate stands in'],
  tablebeaten: ['chip', 'up'], tableruin: ['die'],
  bird: ['crate', null, null, 'no bird on the shelf (the yard draws birds as a three-cell chevron)'],
  wholelot: ['crate', 'plus', null, 'no bird on the shelf'],
  catchall: ['swing', 'star'],
  lifted: ['lift', null, null, 'no hand; the lift (a forklift) stands in, and reads wrong'],
  shookload: ['sack'], hatoff: ['brim'],
  dizzy: ['spark', null, null, 'no dizzy mark; the spark stands in, and reads as the red coin'],
  muckrain: ['balloon', null, null, 'no cloud or rain on the shelf; the balloon stands in'],
  serpent: ['blade', 'up', null, 'no serpent on the shelf; the blade stands in'],
  allstations: ['shield', 'plus', null, 'no drawing of the party\'s floor; the shield stands in']
};
export const pickOf = key => PICK[key] || PICK[key.replace(/\d+$/, '')];
