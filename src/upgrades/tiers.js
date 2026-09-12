// One ladder, sold as cards -- built once here and used by every board.
//
// The farm and the quarry each sell a yield ladder and a speed ladder, twelve
// rungs apiece in four bands of three, and each band is its own card with its
// own name and its own bill. That is sixteen cards, and sixteen hand-written
// rows would be sixteen places for the price rule, the pip count and the band
// gate to drift apart -- a constant a case is the bug rather than the fix. So a
// ladder is one call and a table of a few lines, and a new band is a line in
// the table.
//
// Every other ladder in the yard is the same shape a card shorter: three bands,
// nine rungs, dust only on the first card, dust and crops on the second, dust,
// crops and ore on the third, and no multiplier over it. That is the house
// rule now (CLAUDE.md, "Decided"), so a ladder here names its bands and says
// nothing about coins unless it has a reason to: `BAND_COINS` is the default.
//
// What a band actually is: a name, and the coins it adds to the bill. Everything
// else -- what the row measures, what a rung is worth, which board draws it --
// belongs to the ladder rather than to the card, which is why the unit and the
// gain line stay the same down every card. See DESIGN.md, "What the two grounds
// sell" and "Every ladder is sold in bands".

import { S } from '../state.js';
import { RUNGS, TIER_BAND, TIER_OWN, TIER_RUNGS, LADDER_BANDS, BAND_COINS, WORK_BASE, WORK_STEP } from '../config.js';
import { rungCost, DUST_PER } from './price.js';
import { STEP, levelOf, workFor, finish } from '../mult.js';

// What a rung of a long ladder costs, from what the first one costs.
//
// `rungCost` is half again a rung over five rungs, which is about six and a half
// times across the whole of a ladder -- and that span is the thing worth
// keeping, not the exponent, which was written for a ladder of five. Spreading
// the same span over more rungs is `rungCost` asked for a fractional level,
// which it answers perfectly well: the ends of the ladder are where they were
// and the steps between them are finer. The alternative -- 1.6 twelve times
// over -- is a hundred and seventy times the first price at the top, which is a
// row nobody can buy rather than a ladder anybody climbs.
export const tierCost = (first, lvl, rungs = TIER_RUNGS, rate) =>
  rungCost(first, (RUNGS - 1) * lvl / (rungs - 1), rate);

// Where a ladder stands: its own field up to `own` rungs, and the multiplier
// over it after that, if it has one. The multiplier is `levelOf`, so it is
// clamped on read and a save carrying more of one than the band has room for
// reads as a finished band.
export const tierLevel = (field, multKey, own = TIER_OWN) =>
  Math.min(own, S[field] || 0) + (multKey ? levelOf(multKey) : 0);

// What a rung is worth, as a factor: `per` again of itself for each of the
// ladder's own rungs, and then the multiplier's quarter again for each of the
// last three. Both grounds' yields climb through this, so the farm's flat extra
// spore a cut and the quarry's bigger handful a dig are the same arithmetic over
// different bases rather than two rules that have to be kept in step.
export const tierGain = (lvl, per) =>
  (1 + per * Math.min(TIER_OWN, lvl)) * Math.pow(STEP, Math.max(0, lvl - TIER_OWN));

// A ladder's bands, from one name: the thing it upgrades. A band used to carry
// a name of its own (compost, fertilizer, hybrid seed), and across thirty
// cards the invented words hid what the ladder was for; then a numeral (II,
// III), which was a second counter beside the pips. The ladder is one card now
// and the name is the description, once (2026-09-12). The band keys stay --
// `carry`, `carry2`, `carry3` -- because `S.seenRows` and works in saves quote
// the first, and the others are how a band is addressed in a table.
export const named = (key, name, n = LADDER_BANDS) =>
  Array.from({ length: n }, (_, i) => ({ key: i ? `${key}${i + 1}` : key, name }));

// The cards of one ladder.
//
//   field    the level field on S the ladder's own rungs climb
//   multKey  the `S.mult` field the last band climbs -- the grounds' fourth
//            card. Left off, every band is the ladder's own and there is no
//            research card
//   level    where the ladder stands, and `climb` how a rung is taken --
//            for a ladder kept somewhere other than one field on S (the
//            apothecary's potency, one per tonic). Both default to `field`
//   value    what the ladder is worth at a ladder level -- the from/to
//   first    what rung one costs, in dust
//   rate     how much steeper each rung is, over five rungs' worth of the
//            ladder -- RUNG_RATE (1.6) unless the ladder says otherwise
//   follows  the key of a row this ladder continues -- `chained` in
//            upgrades.js keeps every card off the board until that row is done
//   bands    one line a band: a key, a name, optionally the coins the bill
//            adds (BAND_COINS by position otherwise) and a gate of the
//            band's own. The ladder's own bands are drawn as ONE card, with
//            every rung on it in groups of three (see `group` below); the
//            first band's key and name are the card's. A multiplier band is
//            a card of its own after it -- the grounds' research.
export function tierRows({ field, multKey, level: at, climb, unit, pct, does, value,
                           first, rate, site, board, show, after, follows, keep, bands }) {
  const count = bands.length;
  const rungs = TIER_BAND * count;
  // How many rungs are the ladder's own: all of them, unless the last card is
  // the multiplier.
  const own = multKey ? rungs - TIER_BAND : rungs;
  const level = at || (() => tierLevel(field, multKey, own));
  const step = climb || (() => { S[field]++; });

  // The ladder's own bands, as one card. It used to be a card a band, the
  // name changing as you climbed -- compost, then fertilizer, then hybrid seed
  // -- and a numeral did the same job once the names became descriptions:
  // "hauler speed II" over three pips is two counters for one position on a
  // nine-rung ladder. One card, nine pips in three groups, the bill deepening
  // as the groups fill: the whole ladder in a glance, and the groups ARE the
  // bands (the card bench, cards.html, is where this was settled).
  const ownBands = multKey ? bands.slice(0, -1) : bands;
  const bandAt = () => Math.min(ownBands.length - 1, Math.floor(Math.min(own - 1, level()) / TIER_BAND));
  const coinsAt = () => { const b = ownBands[bandAt()]; return b.coins || BAND_COINS[bandAt()] || []; };
  const card = {
    key: ownBands[0].key,
    name: ownBands[0].name,
    unit, pct, does, keep,
    after: follows,
    // Every rung of every one of these is a piece of work bodies stand and
    // finish at the place that sells it.
    kind: 'rung', site, board,
    rung: () => Math.min(own, level()),
    rungs: () => own,
    group: TIER_BAND,
    from: () => value(level()),
    to: () => value(level() + 1),
    // The dust price of the rung, and the band's coins at what that dust is
    // worth. `billOf` only adds dust to a bill that names none, so naming it
    // here is what stops the conversion being done twice.
    bill: () => {
      const dust = tierCost(first, level(), rungs, rate);
      return [['dust', dust],
              ...coinsAt().map(c => [c, Math.max(1, Math.round(dust / DUST_PER[c]))])];
    },
    // What it asks of somebody's time, climbing with the ladder.
    work: () => Math.round(WORK_BASE.rung * Math.pow(WORK_STEP, level())),
    buy: () => { step(); after?.(); },
    show: () => show() && (ownBands[bandAt()].gate ? ownBands[bandAt()].gate() : true)
  };
  if (!multKey) return [card];

  // And the multiplier over it: the grounds' fourth band, a research card of
  // its own that stands once the ladder's own rungs are climbed. It keeps the
  // research curve it had as a lab row and is finished as a BUILD.
  const band = bands[bands.length - 1];
  const research = {
    key: band.key,
    name: band.name,
    unit, pct, does, keep,
    kind: 'rung', site, board,
    rung: () => Math.max(0, level() - own),
    rungs: () => TIER_BAND,
    from: () => value(level()),
    to: () => value(level() + 1),
    bill: () => {
      const dust = tierCost(first, level(), rungs, rate);
      const coins = band.coins || BAND_COINS[bands.length - 1] || [];
      return [['dust', dust], ...coins.map(c => [c, Math.max(1, Math.round(dust / DUST_PER[c]))])];
    },
    work: () => workFor(band.key),
    buy: () => finish(band.key),
    show: () => show() && level() >= own && (band.gate ? band.gate() : true)
  };
  return [card, research];
}
