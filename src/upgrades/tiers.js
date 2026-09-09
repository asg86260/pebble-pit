// One ladder, sold as four cards -- built once here and used four times.
//
// The farm and the quarry each sell a yield ladder and a speed ladder, twelve
// rungs apiece in four bands of three, and each band is its own card with its
// own name and its own bill. That is sixteen cards, and sixteen hand-written
// rows would be sixteen places for the price rule, the pip count and the band
// gate to drift apart -- a constant a case is the bug rather than the fix. So a
// ladder is one call and a table of four lines, and a new band is a line in the
// table.
//
// What a band actually is: a name, and the coins it adds to the bill. Everything
// else -- what the row measures, what a rung is worth, which board draws it --
// belongs to the ladder rather than to the card, which is why the unit and the
// gain line stay the same down all four. See DESIGN.md, "What the two grounds
// sell".

import { S } from '../state.js';
import { RUNGS, TIER_BAND, TIER_BANDS, TIER_OWN, TIER_RUNGS, WORK_BASE, WORK_STEP } from '../config.js';
import { rungCost, DUST_PER } from '../upgrades.js';
import { STEP, levelOf, workFor, finish } from '../mult.js';

// What a rung of a twelve costs, from what the first one costs.
//
// `rungCost` is half again a rung over five rungs, which is about six and a half
// times across the whole of a ladder -- and that span is the thing worth
// keeping, not the exponent, which was written for a ladder of five. Spreading
// the same span over twelve rungs is `rungCost` asked for a fractional level,
// which it answers perfectly well: the ends of the ladder are where they were
// and the steps between them are finer. The alternative -- 1.6 twelve times
// over -- is a hundred and seventy times the first price at the top, which is a
// row nobody can buy rather than a ladder anybody climbs.
export const tierCost = (first, lvl) =>
  rungCost(first, (RUNGS - 1) * lvl / (TIER_RUNGS - 1));

// Where a ladder stands: its own field up to nine rungs, and the multiplier
// over it after that. The multiplier is `levelOf`, so it is clamped on read and
// a save carrying more of one than the band has room for reads as a finished
// band.
export const tierLevel = (field, multKey) =>
  Math.min(TIER_OWN, S[field] || 0) + levelOf(multKey);

// What a rung is worth, as a factor: `per` again of itself for each of the
// ladder's own rungs, and then the multiplier's quarter again for each of the
// last three. Both grounds' yields climb through this, so the farm's flat extra
// spore a cut and the quarry's bigger handful a dig are the same arithmetic over
// different bases rather than two rules that have to be kept in step.
export const tierGain = (lvl, per) =>
  (1 + per * Math.min(TIER_OWN, lvl)) * Math.pow(STEP, Math.max(0, lvl - TIER_OWN));

// The four cards of one ladder.
//
//   field    the level field on S the first nine rungs climb
//   multKey  the `S.mult` field the last three climb
//   value    what the ladder is worth at a ladder level -- the from/to
//   first    what rung one costs, in dust
//   bands    four lines: a key, a name, the coins the bill adds, and an
//            optional gate of the band's own
export function tierRows({ field, multKey, unit, pct, value, first,
                           site, board, show, after, bands }) {
  const level = () => tierLevel(field, multKey);
  // The card you can see. The last band stays on the board once it is finished,
  // saying "done", the way every other finished ladder in the game does.
  const shown = () => Math.min(TIER_BANDS - 1, Math.floor(level() / TIER_BAND));

  return bands.map((band, i) => {
    const top = i === TIER_BANDS - 1;
    return {
      key: band.key,
      name: band.name,
      unit, pct,
      // Every rung of every one of these is a piece of work bodies stand and
      // finish at the place that sells it -- which is what the last band was
      // when it was the lab's, and what the speed rungs already were.
      kind: 'rung', site, board,
      // The rung within the band, and three of them however far up the ladder
      // the band sits. That is what makes a card readable: three pips, always.
      rung: () => Math.max(0, Math.min(TIER_BAND, level() - i * TIER_BAND)),
      rungs: () => TIER_BAND,
      from: () => value(level()),
      to: () => value(level() + 1),
      // The dust price of the rung, and the band's coins at what that dust is
      // worth. `billOf` only adds dust to a bill that names none, so naming it
      // here is what stops the conversion being done twice.
      bill: () => {
        const dust = tierCost(first, level());
        return [['dust', dust],
                ...band.coins.map(c => [c, Math.max(1, Math.round(dust / DUST_PER[c]))])];
      },
      // What it asks of somebody's time. The last band keeps the research
      // curve it had as a lab row; the rest climb with the ladder rather than
      // with the rung inside the card, or a band-three rung would be as quick
      // to put up as a band-one one.
      work: top ? () => workFor(band.key)
                : () => Math.round(WORK_BASE.rung * Math.pow(WORK_STEP, level())),
      buy: top ? () => finish(band.key)
               : () => { S[field]++; after?.(); },
      show: () => show() && shown() === i && (band.gate ? band.gate() : true)
    };
  });
}
