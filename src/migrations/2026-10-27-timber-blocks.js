// Act 3's goods are blocks since 2026-10-27 (DESIGN.md, "Act 3's goods are
// blocks, and bodies carry every one", "The numbers" and "Saves"): a log saws
// into three 2x2 timber blocks where it made six timber, and every timber
// bill halved with it, so a save's timber is halved here, on the raw object,
// to keep what it buys. A save past the timber pile's brim keeps the brim
// when the pile is stood up, the rest laid on the floor beside it
// (after/piles.js, `stand`).
const obj = v => v && typeof v === 'object' && !Array.isArray(v);

export default {
  since: '2026-10-27',
  v: 30,
  says: 'act 3\'s timber is counted in blocks, three a log: a save\'s timber is halved',
  apply(s) {
    const a = s.after;
    if (!obj(a) || !obj(a.stock)) return;
    a.stock.timber = Math.floor((+a.stock.timber || 0) / 2);
  }
};
