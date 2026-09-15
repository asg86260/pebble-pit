// One ladder, sold as one card -- built once here and used by every board.
//
// The farm and the quarry each sell a yield ladder and a speed ladder, four
// rungs apiece, and each rung is a band with its own bill. Hand-written, that
// is four rows to a ladder and four places for the price rule, the pip count
// and the band gate to drift apart -- a constant a case is the bug rather than
// the fix. So a ladder is one call and a table of a few lines, and a new band
// is a line in the table.
//
// Every other ladder in the yard is the same shape a rung shorter: three bands
// (`LADDER` rungs), dust only on the first, dust and crops on the second,
// dust, crops and ore on the third. That is the house rule (CLAUDE.md,
// "Decided"), so a ladder here names its bands and says nothing about coins
// unless it has a reason to: `BAND_COINS` is the default. The grounds' fourth
// band asks everything the yard makes, sparks included, and it is a rung of
// the same field as the three before it -- it was a multiplier sold as a card
// of its own once, and DESIGN.md, "The spark band is the top of the ladder",
// says why it is not any more.
//
// What a band actually is: a name, and the coins it adds to the bill. Everything
// else -- what the row measures, what a rung is worth, which board draws it --
// belongs to the ladder rather than to the card, which is why the unit and the
// gain line stay the same down every card. See DESIGN.md, "What the two grounds
// sell" and "Every ladder is sold in bands".

import { S } from '../state.js';
import { TIER_BAND, TIER_RUNGS, LADDER_BANDS, BAND_COINS, WORK_BASE, WORK_STEP, LADDERS, rungDust } from '../config.js';
import { DUST_PER, coinsOpen, coinNeeds } from './price.js';

// What a rung costs is written down, a rung at a time, in config/rungs.js --
// the dust, with the band's coins at the coins' rates on top. It was a first
// cost raised by a rate a rung, and the rate was a knob about the whole
// ladder when what wanted moving was one rung of it.

// Where a ladder stands, clamped on read: a save from when the ladders were
// longer may hold any level at all, and it reads as a finished ladder rather
// than as a rung nothing on the board can draw.
export const tierLevel = (field, top = TIER_RUNGS) => Math.min(top, S[field] || 0);

// A ladder's bands, from one name: the thing it upgrades. A band used to carry
// a name of its own (compost, fertilizer, hybrid seed), and across thirty
// cards the invented words hid what the ladder was for; then a numeral (II,
// III), which was a second counter beside the pips. The ladder is one card now
// and the name is the description, once (2026-09-12). The band keys stay --
// `carry`, `carry2`, `carry3` -- because `S.seenRows` and works in saves quote
// the first, and the others are how a band is addressed in a table.
export const named = (key, name, n = LADDER_BANDS) =>
  Array.from({ length: n }, (_, i) => ({ key: i ? `${key}${i + 1}` : key, name }));

// The one card of one ladder.
//
//   field    the level field on S the ladder's rungs climb
//   level    where the ladder stands, and `climb` how a rung is taken --
//            for a ladder kept somewhere other than one field on S (the
//            apothecary's potency, one per tonic). Both default to `field`
//   value    what the ladder is worth at a ladder level -- the from/to; the
//            dust a rung costs is LADDERS[key].dust, keyed by the first band
//   follows  the key of a row this ladder continues -- `chained` in
//            upgrades.js keeps every card off the board until that row is done
//   bands    one line a band: a key, a name, optionally the coins the bill
//            adds (BAND_COINS by position otherwise) and a gate of the
//            band's own. The bands are drawn as ONE card, every rung on it
//            in a group a band (see `group` below); the first band's key and
//            name are the card's.
export function tierRows({ field, level: at, climb, unit, pct, does, value,
                           site, board, show, after, follows, keep, bands }) {
  const rungs = TIER_BAND * bands.length;
  const level = at || (() => tierLevel(field, rungs));
  const step = climb || (() => { S[field]++; });

  // The bands, as one card. It used to be a card a band, the name changing as
  // you climbed -- compost, then fertilizer, then hybrid seed -- and a numeral
  // did the same job once the names became descriptions: "hauler speed II"
  // over a band's pips is two counters for one position on the ladder. One
  // card, its pips in a group a band, the bill deepening as the groups fill:
  // the whole ladder in a glance, and the groups ARE the bands (the card
  // bench, cards.html, is where this was settled).
  const bandAt = () => Math.min(bands.length - 1, Math.floor(Math.min(rungs - 1, level()) / TIER_BAND));
  const coinsAt = () => { const b = bands[bandAt()]; return b.coins || BAND_COINS[bandAt()] || []; };
  const card = {
    key: bands[0].key,
    name: bands[0].name,
    unit, pct, does, keep,
    after: follows,
    // Every rung of every one of these is a piece of work bodies stand and
    // finish at the place that sells it.
    kind: 'rung', site, board,
    rung: () => Math.min(rungs, level()),
    rungs: () => rungs,
    group: TIER_BAND,
    from: () => value(level()),
    to: () => value(level() + 1),
    // The dust price of the rung, and the band's coins at what that dust is
    // worth. `billOf` only adds dust to a bill that names none, so naming it
    // here is what stops the conversion being done twice.
    bill: () => {
      const dust = rungDust(bands[0].key, level());
      return [['dust', dust],
              ...coinsAt().map(c => [c, Math.max(1, Math.round(dust / DUST_PER[c]))])];
    },
    // What it asks of somebody's time, climbing with the ladder.
    work: () => Math.round(WORK_BASE.rung * Math.pow(WORK_STEP, level())),
    buy: () => { step(); after?.(); },
    // ...and never while the band's bill names a coin the yard cannot yet get.
    // When the bands were a card each, the card simply left the board until
    // the plots were broken. The ladder is one card now, and a card that left
    // took the three rungs you had bought with it -- which read as the board
    // losing your purchases. So it stays, greyed, and says what it waits on
    // where the price would go: `waits` is the words, `dead` keeps a press
    // from doing anything (see `fill` in shop.js and `coinNeeds`). A price in
    // a coin the yard has not met is still never shown -- that is the part of
    // the old rule that holds.
    waits: () => coinNeeds(coinsAt()),
    dead: () => !coinsOpen(coinsAt()),
    show: () => show() && (bands[bandAt()].gate ? bands[bandAt()].gate() : true)
  };
  return [card];
}
