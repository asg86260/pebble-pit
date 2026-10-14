// Which shelf drawing each achievement wears: [glyph, badge, coin, borrowed-because].
// A ladder's rungs (rock0..rock3) share the entry for their key minus its
// trailing digits and are told apart by their rung mark (`rungOf`). A
// `borrowed-because` marks a drawing that does not exist yet: the glyph named
// stands in, and the owner draws the real one in glyphs.html.
export const PICK = {
  firstgrain: ['sack', 'dust'], firstrock: ['pickhead'], gotout: ['sqwife'],
  firsthire: ['house', 'plus'], firstshard: ['ore', null, 'shard'], firstspore: ['ear', null, 'spore'], firstspark: ['spark', null, 'spark'],
  holefull: ['hole'],
  rifttorn: ['portal'], drowned: ['portal', 'plus'], star: ['star', null, 'spark'], firsthat: ['hat', 'star'],
  firstbrew: ['pot'], firsttrade: ['helmet'], alltrades: ['helmet', 'up'], allbuilt: ['hut', 'star'],
  rock: ['cracked'], pebble: ['sack', 'dust'], crew: ['door', 'plus'], ore: ['ore', 'up', 'shard'],
  rift1e6: ['portal', 'dust'], brew100: ['vial', 'up'],
  lived1h: ['boot', null, null, 'no clock or hourglass; the boot stands in'],
  nobodyhired: ['door', null, null, 'no drawing of an empty payroll; the empty door stands in'],
  ownhand: ['swing'], nevertouched: ['lever'],
  underminute: ['bolt', null, null, 'no clock; the bolt stands in for speed'],
  everyjob: ['ledger', 'star'],
  tablebeaten: ['chip', 'up'], tableruin: ['die'],
  bird: ['bird'],
  wholelot: ['bird', 'plus'],
  catchall: ['swing', 'star'],
  lifted: ['lift', null, null, 'no hand; the lift (a forklift) stands in, and reads wrong'],
  shookload: ['sack'], hatoff: ['brim'],
  dizzy: ['spark', 'star', null, 'no dizzy mark; the spark stands in, and reads as the red coin'],
  muckrain: ['smog'],
  serpent: ['blade', 'up', null, 'no serpent on the shelf; the blade stands in'],
  allstations: ['shield', 'plus', null, 'no drawing of the party\'s floor; the shield stands in']
};
const base = key => PICK[key] ? key : key.replace(/\d+$/, '');
export const pickOf = key => PICK[base(key)];
// A rung's place on its ladder, { at, of }, counted over the catalog's own
// keys; null for a key that is not a rung.
export const rungOf = (key, keys) => {
  const b = base(key);
  if (b === key) return null;
  const rungs = keys.filter(k => base(k) === b && k !== b).sort((x, y) => +x.slice(b.length) - +y.slice(b.length));
  return { at: rungs.indexOf(key), of: rungs.length };
};
