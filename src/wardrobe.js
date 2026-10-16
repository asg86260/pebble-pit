// The two of them: who they are, and what they wear (DESIGN.md, "What the two
// of them wear"; the owner's vote on docs/mocks/pair-wardrobe-2026-10-16).
//
// Who they are is two names, `S.pairIds`: the uid of the body that is the
// sqhusband and the one that is the sqwife, each written down when that body
// first appears -- him as the opening's survivor (intro.js, `begin`), the
// one who goes back to dig her out; her as the body she becomes at her
// rescue. A name is kept for as long as that body is one of the crew: the
// snatch takes these two (snatch.js), the deep's first station is hers, and
// the finale walks them home. A save written before names were kept is given
// two by `keepPair`, the same rule that mends a name whose body is gone: him
// the oldest body in the yard, her the first station's fighter once she is
// in the deep, else the oldest body that is not him.
//
// What they wear is five slots an outfit, every one with nothing as its first
// item, as rows of data here; render/wardrobe.js draws them and
// wardrobepage.js is the picker. No DOM and no drawing in this file.

import { S } from './state.js';
import { WARD_NONE_ODDS } from './config.js';

// --- the items ---------------------------------------------------------------------
// Every item a row: `key` (what the save holds), `name` (its message), and
// what it is drawn from. Head items are whole cells on the body's top --
// `rows` with their bottom row on it, `ox` cells in from the body's left
// (centered when not given) -- or `rects`, world pixels off the body's
// top-left, drawn facing right and mirrored for a body facing left.
export const HEAD = [
  { key: 'none', name: 'ward-none' },
  { key: 'bow', name: 'ward-bow', rows: ['##.##', '#####', '##.##'] },
  { key: 'top-hat', name: 'ward-top-hat', rows: ['.###.', '.###.', '#####'] },
  { key: 'crown', name: 'ward-crown', rows: ['#.#.#', '#####'] },
  { key: 'flower', name: 'ward-flower', rows: ['.#.', '#.#', '.#.', '.#.'] },
  { key: 'sprout', name: 'ward-sprout', rows: ['##.##', '..#..'] },
  { key: 'ears', name: 'ward-ears', rows: ['#.#'] },
  { key: 'antenna', name: 'ward-antenna', rows: ['..#', '.#.', '.#.'], ox: 0 },
  { key: 'beanie', name: 'ward-beanie', rows: ['.#.', '###', '###'] },
  { key: 'beret', name: 'ward-beret', rows: ['..#.', '####'], ox: -1 },
  { key: 'tiara', name: 'ward-tiara', rows: ['.#.', '#.#'] },
  // a band across the top of the square, and its two ends out the back
  { key: 'headband', name: 'ward-headband', rects: [[0, 4, 18, 2], [-6, 2, 6, 2], [-4, 6, 4, 2]] },
  // a cell out each side of the top row
  { key: 'pigtails', name: 'ward-pigtails', rects: [[-6, 2, 6, 6], [18, 2, 6, 6]] },
  { key: 'mohawk', name: 'ward-mohawk', rows: ['#', '#'] },
];

// Faces: marks on the white middle, a grid of WARD_GRID by WARD_GRID units
// drawn facing right; '#' the ink, 'g' the grey.
export const FACE = [
  { key: 'none', name: 'ward-none' },
  { key: 'eyes', name: 'ward-eyes', grid: ['', '', '...#.#.'] },
  { key: 'sleepy', name: 'ward-sleepy', grid: ['', '', '..##.##'] },
  { key: 'smile', name: 'ward-smile', grid: ['', '', '...#.#.', '', '..#...#', '...###.'] },
  { key: 'glasses', name: 'ward-glasses', grid: ['', '###.###', '#.###.#', '###.###'] },
  { key: 'round-glasses', name: 'ward-round-glasses', grid: ['', '.#...#.', '#.###.#', '.#...#.'] },
  { key: 'shades', name: 'ward-shades', grid: ['', '#######', '###.###'] },
  { key: 'monocle', name: 'ward-monocle', grid: ['', '.....#.', '..#.#.#', '.....#.', '......#', '......#'] },
  { key: 'eyepatch', name: 'ward-eyepatch', grid: ['', '#####..', '..#.###', '....###'] },
  { key: 'mustache', name: 'ward-mustache', grid: ['', '', '...#.#.', '..#...#', '..#####'] },
  { key: 'freckles', name: 'ward-freckles', grid: ['', '', '...#.#.', '...g.g.', '..g.g..'] },
  { key: 'blush', name: 'ward-blush', grid: ['', '', '...#.#.', '..gg.gg'] },
];

// Neck: marks on the lower half of the middle, and for the scarves a tail out
// the back. The necklace and the bandana were cut at the vote ("they look
// like underwear").
export const NECK = [
  { key: 'none', name: 'ward-none' },
  { key: 'scarf', name: 'ward-scarf', grid: ['', '', '', '#######'], tail: 'solid' },
  { key: 'checked-scarf', name: 'ward-checked-scarf', grid: ['', '', '', '#g#g#g#'], tail: 'check' },
  { key: 'striped-scarf', name: 'ward-striped-scarf', grid: ['', '', '', '#.#.#.#'], tail: 'stripe' },
  { key: 'bowtie', name: 'ward-bowtie', grid: ['', '', '', '', '..#...#', '..#####', '..#...#'] },
  { key: 'tie', name: 'ward-tie', grid: ['', '', '', '....#..', '...###.', '...###.', '....#..'] },
  { key: 'collar', name: 'ward-collar', grid: ['', '', '', '###.###', '.#...#.'] },
  { key: 'medal', name: 'ward-medal', grid: ['', '', '', '..#.#..', '...#...', '..###..', '..###..'] },
];

// Back: off the side away from the way the body faces, drawn by key
// (render/wardrobe.js, `BACKS`), since most of them move.
export const BACK = [
  { key: 'none', name: 'ward-none' },
  { key: 'cape', name: 'ward-cape' },
  { key: 'short-cape', name: 'ward-short-cape' },
  { key: 'backpack', name: 'ward-backpack' },
  { key: 'small-pack', name: 'ward-small-pack' },
  { key: 'cat-tail', name: 'ward-cat-tail' },
  { key: 'bushy-tail', name: 'ward-bushy-tail' },
  { key: 'balloon', name: 'ward-balloon' },
  { key: 'flag', name: 'ward-flag' },
];

// Patterns over the white middle, as rects in world pixels off its top-left
// (the middle is fourteen pixels square on a standing body); `tone` the ink
// they are drawn in, and `dark` for a fill dark enough that the marks over it
// are drawn in the paper instead.
const lines = (along) => [2, 6, 10].map(d => (along ? [d, 0, 2, 14] : [0, d, 14, 2]));
const dots = () => {
  const out = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out.push([1 + i * 4 + (j % 2) * 2, 2 + j * 4, 2, 2]);
  return out;
};
const diagonal = () => {
  const out = [];
  for (let k = -12; k < 14; k += 6) for (let i = 0; i < 7; i++) {
    const y = i * 2 + k;
    if (y >= 0 && y < 14) out.push([i * 2, y, 2, 2]);
  }
  return out;
};
export const PATTERN = [
  { key: 'plain', name: 'ward-plain' },
  { key: 'overalls', name: 'ward-overalls', rects: [[0, 8, 14, 6], [2, 0, 2, 8], [10, 0, 2, 8]] },
  { key: 'stripes', name: 'ward-stripes', rects: lines(false) },
  { key: 'tall-stripes', name: 'ward-tall-stripes', rects: lines(true) },
  { key: 'dots', name: 'ward-dots', rects: dots() },
  { key: 'diagonal', name: 'ward-diagonal', rects: diagonal() },
  { key: 'quarters', name: 'ward-quarters', rects: [[0, 0, 7, 7], [7, 7, 7, 7]] },
  { key: 'pale', name: 'ward-pale', rects: [[0, 0, 14, 14]], tone: 'pale' },
  { key: 'grey', name: 'ward-grey', rects: [[0, 0, 14, 14]], tone: 'grey', dark: true },
  { key: 'black', name: 'ward-black', rects: [[0, 0, 14, 14]], dark: true },
];

// The slots, in the picker's order, each with its message.
export const SLOTS = [
  { key: 'head', name: 'ward-slot-head', items: HEAD },
  { key: 'face', name: 'ward-slot-face', items: FACE },
  { key: 'neck', name: 'ward-slot-neck', items: NECK },
  { key: 'back', name: 'ward-slot-back', items: BACK },
  { key: 'pattern', name: 'ward-slot-pattern', items: PATTERN },
];
const SLOT = Object.fromEntries(SLOTS.map(s => [s.key, s]));
export const itemOf = (slot, key) => SLOT[slot]?.items.find(i => i.key === key) || null;
// The slot's "nothing": the first row, whatever it is called.
export const bareOf = slot => SLOT[slot].items[0];

// --- the outfits -------------------------------------------------------------------
export const WHO = ['her', 'him'];
// The two they start in, outfits 1 and 2 of the mock's eight: a bow and a top
// hat, two different outlines over any crowd, so both are findable from the
// first frame without the picker ever being opened.
export const DEFAULTS = {
  her: { head: 'bow', face: 'eyes', neck: 'scarf', back: 'none', pattern: 'plain' },
  him: { head: 'top-hat', face: 'monocle', neck: 'bowtie', back: 'none', pattern: 'plain' },
};
// An outfit made whole: every slot an item that exists, the default where
// it does not (an old save, or an item since cut).
export function wholeOutfit(o, who) {
  const out = {};
  for (const s of SLOTS) {
    const k = o && typeof o[s.key] === 'string' ? o[s.key] : null;
    out[s.key] = k && itemOf(s.key, k) ? k : DEFAULTS[who][s.key];
  }
  return out;
}
export const outfitOf = who => (S.outfits && S.outfits[who]) || DEFAULTS[who];

// One slot stepped along its list, wrapping, nothing first.
export function stepItem(who, slot, by) {
  const items = SLOT[slot].items, cur = outfitOf(who)[slot];
  const i = Math.max(0, items.findIndex(it => it.key === cur));
  wear(who, { [slot]: items[(i + by + items.length) % items.length].key });
}
export function wear(who, change) {
  S.outfits = { ...S.outfits, [who]: wholeOutfit({ ...outfitOf(who), ...change }, who) };
}
// A roll for the one being dressed only, so a good outfit on the other is
// not lost; nothing is WARD_NONE_ODDS times as likely as any one item. The
// page's own chance, not the run's: a press on a menu is no part of how the
// yard plays out.
export function rollOutfit(who, roll = Math.random) {
  const out = {};
  for (const s of SLOTS) {
    const n = s.items.length - 1, r = roll() * (n + WARD_NONE_ODDS);
    out[s.key] = r < WARD_NONE_ODDS ? s.items[0].key : s.items[1 + Math.min(n - 1, Math.floor(r - WARD_NONE_ODDS))].key;
  }
  wear(who, out);
}

// --- who they are --------------------------------------------------------------------
const uidNum = u => (typeof u === 'string' && u[0] === 'u' ? +u.slice(1) || 0 : 0);
export const pairBody = who => {
  const u = S.pairIds && S.pairIds[who];
  return u ? S.workers.find(w => w.uid === u) || null : null;
};
// Which of the two a body is, or null for anybody else.
export function whoIs(w) {
  const ids = S.pairIds;
  if (!w || !w.uid || !ids) return null;
  return ids.her === w.uid ? 'her' : ids.him === w.uid ? 'him' : null;
}
// The body that is one of them, named as the moment it appears.
export function namePair(who, w) {
  if (!w || !w.uid) return;
  const other = who === 'her' ? 'him' : 'her';
  S.pairIds = { ...S.pairIds, [who]: w.uid, [other]: S.pairIds[other] === w.uid ? null : S.pairIds[other] };
}

// Whether each of them should be a body of the crew now. He is from the
// end of the opening until the snatch takes him (then he is in the belly,
// and after the kill the finale's to walk, never crew again). She is from
// her rescue until the finale takes her off the crew; through the snatch
// itself both are held off the crew by the beat, which knows them.
const himCrew = () => S.beatsDone.includes('show') && !S.snatched && !S.finale && !S.retired;
const herCrew = () => !!S.rescued && !S.retired && !(S.finale && !S.finale.her);

// Any body that can be one of them: not a forklift's seat or a machine, a
// body of the crew with a name.
const oldest = (pool, not = null) => {
  let best = null;
  for (const w of pool) {
    if (!w.uid || w.uid === not) continue;
    if (!best || uidNum(w.uid) < uidNum(best.uid)) best = w;
  }
  return best;
};

// The names mended: a name nobody answers to given to the body that best
// stands for it, and a name let go once its owner is not crew any more.
// Asked whenever the crew is stood (`syncWorkers`) and once a save is back,
// so it is right before anything reads it; a check on every frame would be
// the same answer.
export function keepPair() {
  if (S.snatch) return;
  const ids = { her: null, him: null, ...(S.pairIds || {}) };
  if (!himCrew()) { if (S.snatched || S.finale || S.retired) ids.him = null; }
  else if (!S.workers.some(w => w.uid === ids.him)) {
    const yard = S.workers.filter(w => !w.deepHome);
    ids.him = oldest(yard.length ? yard : S.workers, ids.her)?.uid || null;
  }
  if (!herCrew()) { if (S.retired || S.finale) ids.her = null; }
  else if (S.finale && S.finale.her) ids.her = S.finale.her;
  else if (!S.workers.some(w => w.uid === ids.her)) {
    const st = S.snatched && S.stations && S.stations[0];
    const fighter = st && st.fighter ? S.workers.find(w => w.uid === st.fighter) : null;
    const deep = S.snatched ? S.workers.filter(w => w.deepHome) : [];
    ids.her = (fighter || oldest(deep.length ? deep : S.workers, ids.him))?.uid || null;
  }
  if (ids.her && ids.her === ids.him) ids.her = null;
  if (ids.her !== S.pairIds?.her || ids.him !== S.pairIds?.him) S.pairIds = ids;
}

// --- the save --------------------------------------------------------------------------
// Read last of all (persist.js, `SAVERS`), so the names are mended against a
// yard that is wholly back.
export const SAVE = {
  fields: ['pairIds', 'outfits', 'dressOffered'],
  write(out) {
    out.pairIds = { her: S.pairIds?.her || null, him: S.pairIds?.him || null };
    out.outfits = { her: outfitOf('her'), him: outfitOf('him') };
    out.dressOffered = !!S.dressOffered;
  },
  read(s) {
    const ids = s.pairIds || {};
    S.pairIds = { her: typeof ids.her === 'string' ? ids.her : null, him: typeof ids.him === 'string' ? ids.him : null };
    S.outfits = { her: wholeOutfit(s.outfits?.her, 'her'), him: wholeOutfit(s.outfits?.him, 'him') };
    S.dressOffered = s.dressOffered !== false;
    keepPair();
  },
  blank() {
    S.pairIds = { her: null, him: null };
    S.outfits = { her: { ...DEFAULTS.her }, him: { ...DEFAULTS.him } };
    S.dressOffered = false;
  }
};
