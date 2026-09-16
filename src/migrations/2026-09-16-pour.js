// The casino became the pour: a pot is a stake of pebbles held for, with
// `n` the pebbles landed and spent and `owed` what the purse has still to
// pay; `paying` is a count a kind. A pot from the plinko's day was a chip of
// one coin already taken from the purse, its `n` the grains the picture
// showed rather than anything spent, and it stood in the hopper or, won, in
// the tray waiting to be banked. What was staked is the player's: a dust
// stake still standing in the hopper comes back as the pour's stake, the
// way a save mid-hand does; a pot in any other coin, or one already won and
// standing in the tray, is paid out of the foot for the crew to carry, since
// there is no chip and no bank button left to take it with.
export default {
  since: '2026-09-16',
  v: 2,
  says: 'a pot is pebbles held for; a won or foreign pot is paid out',
  apply(s) {
    const pot = s.pot;
    if (!pot || !pot.cur || 'owed' in pot) return;
    const stake = Math.max(0, Math.round(+pot.stake) || 0);
    if (pot.cur === 'dust' && pot.where !== 'tray') {
      s.pot = { cur: 'dust', stake, n: stake, owed: 0, where: 'hopper' };
      return;
    }
    const left = s.paying && typeof s.paying.left === 'object' && s.paying.left
      ? s.paying.left
      : { dust: Math.round(+(s.paying && s.paying.left)) || 0, spore: 0, shard: 0, spark: 0 };
    const kind = ['spore', 'shard', 'spark'].includes(pot.cur) ? pot.cur : 'dust';
    left[kind] = (Math.round(+left[kind]) || 0) + stake;
    s.paying = { left, grains: Math.max(1, Math.round(+(s.paying && s.paying.grains)) || 1) };
    s.pot = null;
  }
};
