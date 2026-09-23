// One ladder, sold as one card -- built once here and used by every board.
//
// A band is a name and the coins it adds to the bill; `BAND_COINS` is the
// default, the house rule (CLAUDE.md, "Decided"). Everything else -- what the
// row measures, what a rung is worth, which board draws it -- belongs to the
// ladder. See DESIGN.md, "Every ladder is sold in bands". A rung's dust is
// written a rung at a time in config/rungs.js.

import { S } from '../state.js';
import { TIER_BAND, TIER_RUNGS, LADDER_BANDS, BAND_COINS, SCALE_BAND_COINS, WORK_BASE, WORK_STEP, rungDust } from '../config.js';
import { DUST_PER, coinsOpen, coinNeeds } from './price.js';

// The coins each band adds, by the coin a ladder leads with: the yard's
// ladders lead with dust, the deep's with scales (config/deepboard.js).
const LEAD_BANDS = { dust: BAND_COINS, scale: SCALE_BAND_COINS };
// What a coin is worth in dust, dust itself included, for turning the lead
// coin's amount into a band coin's.
const perDust = c => (c === 'dust' ? 1 : DUST_PER[c]);

// Clamped on read: a save from a longer ladder may hold any level, and it
// reads as a finished ladder rather than a rung nothing can draw.
export const tierLevel = (field, top = TIER_RUNGS) => Math.min(top, S[field] || 0);

// A ladder's bands from one name. The band keys are `carry`, `carry2`,
// `carry3`: `S.seenRows` and works in saves quote the first, and the others
// are how a band is addressed in a table.
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
//   lead     the coin the ladder's written table (the `dust` column of
//            LADDERS) is paid in: 'dust' for the yard, 'scale' for the deep.
//            The band coins are the lead's amount at the coins' rates
//   bands    one line a band: a key, a name, optionally the coins the bill
//            adds (the lead's band coins by position otherwise) and a gate of
//            the band's own. The bands are drawn as ONE card, every rung on it
//            in a group a band (see `group` below); the first band's key and
//            name are the card's.
export function tierRows({ field, level: at, climb, unit, pct, does, value,
                           site, board, show, after, follows, keep, bands, lead = 'dust' }) {
  const rungs = TIER_BAND * bands.length;
  const level = at || (() => tierLevel(field, rungs));
  const step = climb || (() => { S[field]++; });

  // One card, its pips in a group a band, the bill deepening as the groups
  // fill: the groups ARE the bands.
  const bandAt = () => Math.min(bands.length - 1, Math.floor(Math.min(rungs - 1, level()) / TIER_BAND));
  const coinsAt = () => { const b = bands[bandAt()]; return b.coins || LEAD_BANDS[lead][bandAt()] || []; };
  // Every coin the next rung asks, the lead included: a scale is not a coin
  // the yard has from the first frame, as dust is.
  const asked = () => [lead, ...coinsAt()];
  const card = {
    key: bands[0].key,
    name: bands[0].name,
    unit, pct, does, keep, lead,
    after: follows,
    // Every rung is a piece of work finished at the place that sells it.
    kind: 'rung', site, board,
    rung: () => Math.min(rungs, level()),
    rungs: () => rungs,
    group: TIER_BAND,
    from: () => value(level()),
    to: () => value(level() + 1),
    // `billOf` only adds dust to a bill that names none, so naming it here is
    // what stops the conversion being done twice. A band of a scale ladder
    // that asks no dust names none at nought, which `billOf` leaves off.
    bill: () => {
      const amount = rungDust(bands[0].key, level());
      const coins = coinsAt();
      return [[lead, amount],
              ...coins.map(c => [c, Math.max(1, Math.round(amount * perDust(lead) / perDust(c)))]),
              ...(lead !== 'dust' && !coins.includes('dust') ? [['dust', 0]] : [])];
    },
    work: () => Math.round(WORK_BASE.rung * Math.pow(WORK_STEP, level())),
    buy: () => { step(); after?.(); },
    // While the band's bill names a coin the yard cannot yet get, the card
    // stays (the rungs bought are on it), greyed, with its price up: `waits`
    // is the reason in words, `dead` stops the press (`refresh` in shop.js,
    // `coinNeeds`).
    waits: () => coinNeeds(asked()),
    dead: () => !coinsOpen(asked()),
    show: () => show() && (bands[bandAt()].gate ? bands[bandAt()].gate() : true)
  };
  return [card];
}
