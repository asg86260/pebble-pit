// The two of them: which bodies they are, what they are called, and what
// they wear (DESIGN.md, "What the two of them wear" and "Who you are"; the
// owner's votes on docs/mocks/pair-wardrobe-2026-10-16 and
// docs/mocks/who-you-are-2026-10-16).
//
// Which bodies they are is two uids, `S.pairIds`: `you`, written down as the
// opening's survivor (intro.js, `begin`), the one who goes back to dig the
// other out; `sqouse`, the body the one under the rock becomes at the
// rescue. A uid is kept for as long as that body is one of the crew: the
// snatch takes you (snatch.js), your sqouse leaps after and is the deep's
// first station's, and the finale walks the two of you home. A save written
// before uids were kept is given two by `keepPair`, the same rule that mends
// one whose body is gone: you the oldest body in the yard, your sqouse the
// first station's fighter once in the deep, else the oldest body that is
// not you.
//
// What they are called is a name and a role apiece, `S.selves`, chosen at a
// new yard and kept from the opening on. What they wear is six slots an
// outfit, every one with nothing as its first item, as rows of data here;
// render/wardrobe.js draws them and wardrobepage.js is the page that chooses
// both. No DOM and no drawing in this file.

import { S } from './state.js';
import { WARD_NONE_ODDS, NAME_MAX, NOTICE_TICK_S } from './config.js';
import { msg, msgOr } from './lang.js';
import { CREW_NAMES } from './crew/names.js';
import { HATS } from './sprites.js';
import { JOB } from './jobs.js';
import { stockOf } from './kit.js';
import { CATALOG } from './catalog.js';

// --- the items ---------------------------------------------------------------------
// Every item a row: `key` (what the save holds), `name` (its message), and
// what it is drawn from. Head items are whole cells on the body's top --
// `rows` with their bottom row on it, `ox` cells in from the body's left
// (centered when not given) -- or `rects`, world pixels off the body's
// top-left, drawn facing right and mirrored for a body facing left. `ribbon`
// hangs two tails down the body's back (render/wardrobe.js, `ribbonTails`).
// `draw` for the pieces that move, drawn by key (render/wardheads.js);
// `tone` an ink other than the black (the gold set's gold); `lamp` for a hat
// that casts its light (render/lamplight.js).
//
// `lock` is what opens an item that is not open from the start (the
// owner's picks, 2026-10-16; `itemLock` below): `{ ach }` a notice earned,
// `{ hatOf }` the first of that station's hats the yard owns, `{ fact }` a
// thing that has happened in the yard (`FACTS`); the last two carry `words`,
// the messages for what they wait on. What the two of them start
// in is never locked, so the top hat is open whatever the owner's pick for
// it says: the survivor wears it from the first frame.
export const HEAD = [
  { key: 'none', name: 'ward-none' },
  // a small bow on top, the owner's pick at the redraws (option C)
  { key: 'bow', name: 'ward-bow', rects: [[2, -6, 4, 2], [12, -6, 4, 2], [2, -4, 2, 2], [6, -4, 6, 2], [14, -4, 2, 2],
                                          [2, -2, 4, 2], [12, -2, 4, 2]], ribbon: true },
  { key: 'top-hat', name: 'ward-top-hat', rows: ['.###.', '.###.', '#####'] },
  { key: 'crown', name: 'ward-crown', rows: ['#.#.#', '#####'], lock: { ach: 'gotout' } },
  { key: 'flower', name: 'ward-flower', rows: ['.#.', '#.#', '.#.', '.#.'], lock: { ach: 'firstspore' } },
  { key: 'sprout', name: 'ward-sprout', rows: ['##.##', '..#..'], lock: { ach: 'firstgrain' } },
  { key: 'ears', name: 'ward-ears', rows: ['#.#'] },
  { key: 'antenna', name: 'ward-antenna', rows: ['..#', '.#.', '.#.'], ox: 0 },
  { key: 'beanie', name: 'ward-beanie', rows: ['.#.', '###', '###'] },
  { key: 'beret', name: 'ward-beret', rows: ['..#.', '####'], ox: -1 },
  // a band across the top of the square, and its two ends out the back
  { key: 'headband', name: 'ward-headband', rects: [[0, 4, 18, 2], [-6, 2, 6, 2], [-4, 6, 4, 2]] },
  { key: 'mohawk', name: 'ward-mohawk', rows: ['#', '#'] },
  // the station hats, the crew's own drawings (sprites.js), each opened by
  // the first of them the yard owns
  { key: 'helmet', name: 'ward-helmet', rows: HATS.helmet, lock: { hatOf: JOB.ROCK, words: ['ward-lock-rockhands', 'ward-lock-rockhands-note'] } },
  { key: 'lamp', name: 'ward-lamp', rows: HATS.lamp, lamp: true, lock: { hatOf: JOB.QUARRY, words: ['ward-lock-quarriers', 'ward-lock-quarriers-note'] } },
  { key: 'sun-hat', name: 'ward-sun-hat', rows: HATS.brim, lock: { hatOf: JOB.FARM, words: ['ward-lock-farmhands', 'ward-lock-farmhands-note'] } },
  { key: 'wizard-hat', name: 'ward-wizard-hat', rows: HATS.point, lock: { hatOf: JOB.WIZARD, words: ['ward-lock-wizards', 'ward-lock-wizards-note'] } },
  { key: 'cap', name: 'ward-cap', rows: HATS.cap, lock: { hatOf: JOB.JANITOR, words: ['ward-lock-janitors', 'ward-lock-janitors-note'] } },
  // the expansion's
  { key: 'bird', name: 'ward-bird', draw: true, lock: { ach: 'bird' } },
  { key: 'mortarboard', name: 'ward-mortarboard', draw: true, lock: { ach: 'alltrades' } },
  { key: 'bowler', name: 'ward-bowler', draw: true, lock: { ach: 'hatoff' } },
  { key: 'hard-hat', name: 'ward-hard-hat', draw: true, lock: { ach: 'allbuilt' } },
  { key: 'diving-bowl', name: 'ward-diving-bowl', draw: true, lock: { fact: 'portal', words: ['ward-lock-portal', 'ward-lock-portal-note'] } },
  // the serpent's own comb, in its purple, for the serpent at level 25 (the
  // owner, 2026-10-16): the last rung of its ladder (NOTICE_SERPENT)
  { key: 'serpent-comb', name: 'ward-serpent-comb', draw: true, lock: { ach: 'serpent3' } },
  // the gold set
  { key: 'gold-crown', name: 'ward-gold-crown', rows: ['#.#.#', '#####'], tone: 'gold', lock: { ach: 'freed' } },
];

// Faces: marks on the white middle, a grid of WARD_GRID by WARD_GRID units
// drawn facing right; '#' the ink, 'g' the grey.
export const FACE = [
  { key: 'none', name: 'ward-none' },
  { key: 'eyes', name: 'ward-eyes', grid: ['', '', '...#.#.'] },
  { key: 'sleepy', name: 'ward-sleepy', grid: ['', '', '..##.##'] },
  { key: 'smile', name: 'ward-smile', grid: ['', '', '...#.#.', '', '..#...#', '...###.'] },
  { key: 'glasses', name: 'ward-glasses', grid: ['', '###.###', '#.###.#', '###.###'] },
  { key: 'round-glasses', name: 'ward-round-glasses', grid: ['', '.#...#.', '#.###.#', '.#...#.'], lock: { ach: 'firstspark' } },
  { key: 'shades', name: 'ward-shades', grid: ['', '#######', '###.###'] },
  { key: 'monocle', name: 'ward-monocle', grid: ['', '.....#.', '..#.#.#', '.....#.', '......#', '......#'] },
  { key: 'eyepatch', name: 'ward-eyepatch', grid: ['', '#####..', '..#.###', '....###'] },
  { key: 'mustache', name: 'ward-mustache', grid: ['', '', '...#.#.', '..#...#', '..#####'] },
  { key: 'freckles', name: 'ward-freckles', grid: ['', '', '...#.#.', '...g.g.', '..g.g..'] },
  { key: 'blush', name: 'ward-blush', grid: ['', '', '...#.#.', '..gg.gg'] },
  { key: 'surprised', name: 'ward-surprised', grid: ['', '...#.#.', '...#.#.', '', '...###.', '...#.#.', '...###.'],
    lock: { ach: 'lifted' } },
];

// Neck: marks on the lower half of the middle, and for the scarves a tail out
// the back: a band two rows deep low on the chest, its tail to the floor (the
// owner's pick at the redraws, option B). The necklace and the bandana were
// cut at the vote ("they look like underwear"); the bowtie, tie, collar and
// medal at the item review.
export const NECK = [
  { key: 'none', name: 'ward-none' },
  { key: 'scarf', name: 'ward-scarf', grid: ['', '', '', '', '#######', '#######'], tail: 'solid' },
  { key: 'checked-scarf', name: 'ward-checked-scarf', grid: ['', '', '', '', '#g#g#g#', 'g#g#g#g'], tail: 'check' },
  { key: 'striped-scarf', name: 'ward-striped-scarf', grid: ['', '', '', '', '#.#.#.#', '#.#.#.#'], tail: 'stripe' },
  // the gold set's: the checked scarf with gold for its grey checks
  { key: 'gold-scarf', name: 'ward-gold-scarf', grid: ['', '', '', '', '#g#g#g#', 'g#g#g#g'], tail: 'check', tone: 'gold',
    lock: { ach: 'freed' } },
];

// Back: off the side away from the way the body faces, drawn by key
// (render/wardrobe.js, `BACKS`), since most of them move.
export const BACK = [
  { key: 'none', name: 'ward-none' },
  { key: 'cape', name: 'ward-cape' },
  { key: 'short-cape', name: 'ward-short-cape' },
  { key: 'backpack', name: 'ward-backpack' },
  { key: 'balloon', name: 'ward-balloon' },
  { key: 'flag', name: 'ward-flag' },
  { key: 'moneybag', name: 'ward-moneybag', lock: { ach: 'firstgrain' } },
  { key: 'gold-cape', name: 'ward-gold-cape', lock: { ach: 'freed' } },
];

// Patterns over the white middle, as rects in world pixels off its top-left
// (the middle is fourteen pixels square on a standing body), in the ink;
// `dark` for a fill dark enough that the marks over it are drawn in the paper
// instead.
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
  { key: 'filled', name: 'ward-filled', rects: [[0, 0, 14, 14]], dark: true },
];

// Auras: particles round the body, drawn by key (render/wardaura.js, its
// numbers WARD_AURAS), since every one of them moves. One at a time: the
// owner wanted no second aura slot.
export const AURA = [
  { key: 'none', name: 'ward-none' },
  { key: 'dust-motes', name: 'ward-dust-motes' },
  { key: 'pebble-bits', name: 'ward-pebble-bits' },
  { key: 'bubbles', name: 'ward-bubbles' },
  { key: 'orbiting-pixel', name: 'ward-orbiting-pixel' },
  { key: 'sparkle-glints', name: 'ward-sparkle-glints' },
  { key: 'footprints', name: 'ward-footprints' },
  { key: 'rain-cloud', name: 'ward-rain-cloud' },
  { key: 'falling-petals', name: 'ward-falling-petals' },
  { key: 'scale-swirl', name: 'ward-scale-swirl' },
  { key: 'embers', name: 'ward-embers' },
  { key: 'flies', name: 'ward-flies', lock: { ach: 'muckrain' } },
  { key: 'stink', name: 'ward-stink', lock: { ach: 'nobodyhired' } },
  { key: 'juggling-balls', name: 'ward-juggling-balls', lock: { ach: 'catchall' } },
  { key: 'potion-fizz', name: 'ward-potion-fizz', lock: { ach: 'firstbrew' } },
  { key: 'dizzy-stars', name: 'ward-dizzy-stars', lock: { ach: 'dizzy' } },
  { key: 'shooting-star', name: 'ward-shooting-star', lock: { ach: 'star' } },
  { key: 'flock-overhead', name: 'ward-flock-overhead', lock: { ach: 'wholelot' } },
  { key: 'speed-lines', name: 'ward-speed-lines', lock: { ach: 'underminute' } },
  { key: 'gold-halo', name: 'ward-gold-halo', lock: { ach: 'freed' } },
];

// The slots, in the picker's order, each with its message.
export const SLOTS = [
  { key: 'head', name: 'ward-slot-head', items: HEAD },
  { key: 'face', name: 'ward-slot-face', items: FACE },
  { key: 'neck', name: 'ward-slot-neck', items: NECK },
  { key: 'back', name: 'ward-slot-back', items: BACK },
  { key: 'pattern', name: 'ward-slot-pattern', items: PATTERN },
  { key: 'aura', name: 'ward-slot-aura', items: AURA },
];
const SLOT = Object.fromEntries(SLOTS.map(s => [s.key, s]));
export const itemOf = (slot, key) => SLOT[slot]?.items.find(i => i.key === key) || null;
// The slot's "nothing": the first row, whatever it is called.
export const bareOf = slot => SLOT[slot].items[0];

// --- what opens them -----------------------------------------------------------------
// The things in the yard an item can wait on, other than a notice or a hat.
const FACTS = {
  // the wizards' portal over the abyss stands (wizard.js): the way down
  portal: () => !!S.portalOpen,
};
// A rule read off the yard, as the word it is latched under in
// `S.wardOpened`: a hat's count can fall (the outhouse closes, an old save)
// and a fact can be undone, and an item once opened never closes. A notice
// needs no latch: `S.won` only ever grows.
const latchOf = r => (r.hatOf ? 'hat:' + r.hatOf : r.fact ? 'fact:' + r.fact : null);
const holds = r => (r.ach ? (S.won || []).includes(r.ach)
  : r.hatOf ? stockOf(r.hatOf) >= 1 : r.fact ? !!(FACTS[r.fact] && FACTS[r.fact]()) : true);
const isDefault = (slot, key) => WHO.some(w => DEFAULTS[w][slot] === key);
const ruleOf = (slot, key) => {
  const it = itemOf(slot, key);
  return it && it.lock && !isDefault(slot, key) ? it.lock : null;
};
export function isOpen(slot, key) {
  const r = ruleOf(slot, key);
  if (!r) return true;
  const l = latchOf(r);
  return !!(l && (S.wardOpened || []).includes(l)) || holds(r);
}
// What an item waits on, for the page to say: null for one that is open,
// else its kind, the notice, job or fact it waits on, and a name and a line
// for it (a notice's are its own).
export function itemLock(slot, key) {
  if (isOpen(slot, key)) return null;
  const r = ruleOf(slot, key);
  if (r.ach) {
    const n = CATALOG.find(c => c.key === r.ach);
    return { kind: 'ach', id: r.ach, name: n ? n.name : r.ach, note: n ? n.note : '' };
  }
  const [name, note] = r.words.map(id => msg(id));
  return r.hatOf ? { kind: 'hat', id: r.hatOf, name, note } : { kind: 'fact', id: r.fact, name, note };
}
// Every rule read off the yard that holds now, latched: asked as the
// notices are, twice a second (game.js), and once a save is back.
export function latchOpened() {
  const had = S.wardOpened || [], got = [];
  for (const s of SLOTS) for (const it of s.items) {
    const l = it.lock && latchOf(it.lock);
    if (l && !had.includes(l) && !got.includes(l) && holds(it.lock)) got.push(l);
  }
  if (got.length) S.wardOpened = [...had, ...got];
}
let latched = -Infinity;
export function stepWardrobe(t) {
  if (t >= latched && t - latched < NOTICE_TICK_S * 1000) return;
  latched = t;
  latchOpened();
}

// --- the outfits -------------------------------------------------------------------
// The two of them by the part each plays: `you`, the survivor who digs and
// whom the serpent takes, and `sqouse`, the one under the rock, who leaps
// in after you and is the deep's first fighter. Never by gender: which word
// each answers to is their role (below).
export const WHO = ['you', 'sqouse'];
// The two they start in, outfits 1 and 2 of the mock's eight: a bow and a top
// hat, two different outlines over any crowd, so both are findable from the
// first frame without the picker ever being opened. Each stays on the body
// that wore it before the keys were renamed: the top hat the survivor's.
export const DEFAULTS = {
  you: { head: 'top-hat', face: 'monocle', neck: 'none', back: 'none', pattern: 'plain', aura: 'none' },
  sqouse: { head: 'bow', face: 'eyes', neck: 'scarf', back: 'none', pattern: 'plain', aura: 'none' },
};
// An outfit made whole: every slot an item that exists. A slot never chosen
// (a save from before the slot) takes the default; one holding an item since
// cut takes the slot's bare item, so nobody is dressed in what they did not
// pick.
export function wholeOutfit(o, who) {
  const out = {};
  for (const s of SLOTS) {
    const k = o && typeof o[s.key] === 'string' ? o[s.key] : null;
    out[s.key] = k === null ? DEFAULTS[who][s.key] : itemOf(s.key, k) ? k : bareOf(s.key).key;
  }
  return out;
}
export const outfitOf = who => (S.outfits && S.outfits[who]) || DEFAULTS[who] || DEFAULTS.you;

// One slot stepped along its list, wrapping, nothing first, past what is
// still locked. `wear` itself asks nothing: an outfit a save brings back
// keeps an item that is locked now, so nobody is undressed.
export function stepItem(who, slot, by) {
  const items = SLOT[slot].items, cur = outfitOf(who)[slot], n = items.length;
  let i = Math.max(0, items.findIndex(it => it.key === cur));
  for (let k = 0; k < n; k++) {
    i = (i + by + n) % n;
    if (isOpen(slot, items[i].key)) break;
  }
  wear(who, { [slot]: items[i].key });
}
export function wear(who, change) {
  S.outfits = { ...S.outfits, [who]: wholeOutfit({ ...outfitOf(who), ...change }, who) };
}
// One slot's item at random, of the ones open; nothing is WARD_NONE_ODDS
// times as likely as any one item. The page's own chance, not the run's: a
// press on a menu is no part of how the yard plays out.
function rollItem(s, roll) {
  const open = s.items.slice(1).filter(it => isOpen(s.key, it.key));
  const n = open.length, r = roll() * (n + WARD_NONE_ODDS);
  return r < WARD_NONE_ODDS || !n ? s.items[0].key : open[Math.min(n - 1, Math.floor(r - WARD_NONE_ODDS))].key;
}
export const rollSlot = (who, slot, roll = Math.random) => wear(who, { [slot]: rollItem(SLOT[slot], roll) });
// A roll for the one being dressed only, so a good outfit on the other is
// not lost.
// Every slot back to its bare item (none, or plain): the page's clear.
export function bareOutfit(who) {
  wear(who, Object.fromEntries(SLOTS.map(s => [s.key, bareOf(s.key).key])));
}
export function rollOutfit(who, roll = Math.random) {
  const out = {};
  for (const s of SLOTS) out[s.key] = rollItem(s, roll);
  wear(who, out);
}

// --- what they are called ----------------------------------------------------------
// Each square is a name and a role, `S.selves`. The role is one of three
// words, and the story's lines that name either of them select on it
// (locales/en.ftl, the `$so` key): the one of the three a line names, and
// the pronoun that follows it. A name, when there is one, stands where the
// role word would (`$named`, `$name`); with none the line reads the role
// word, which is today's text for the roles they start with.
export const ROLES = ['wife', 'ouse', 'husband'];
// Today's story: the survivor is the sqhusband, the one under the rock the
// sqwife, so a yard that never opens the page reads exactly as it did.
export const ROLE_START = { you: 'husband', sqouse: 'wife' };
const blankSelf = who => ({ name: '', role: ROLE_START[who] });
export const selfOf = who => (S.selves && S.selves[who]) || blankSelf(who);
export const nameOf = who => selfOf(who).name;
export const roleOf = who => selfOf(who).role;

// A name as the game keeps it: letters (with their marks) and digits of any
// script, space, - and ', runs of space made one, trimmed, and at most
// NAME_MAX characters (counted as a reader counts them, not in UTF-16).
// Nothing else survives, so a name is never markup and never a line break
// when it goes into a line as a Fluent variable.
export function cleanName(raw) {
  if (typeof raw !== 'string') return '';
  const kept = raw.normalize('NFC').replace(/[^\p{L}\p{M}\p{N} '-]/gu, '').replace(/ +/g, ' ').trim();
  return [...kept].slice(0, NAME_MAX).join('').trim();
}
// The same, for a name still being typed: a space at its end is the next
// word starting, not one to trim.
export const typedName = raw => {
  const kept = String(raw || '').normalize('NFC').replace(/[^\p{L}\p{M}\p{N} '-]/gu, '').replace(/ +/g, ' ').replace(/^ /, '');
  return [...kept].slice(0, NAME_MAX).join('');
};

function be(who, change) {
  const cur = selfOf(who);
  const next = { ...cur, ...change };
  S.selves = { ...(S.selves || {}), [who]: { name: cleanName(next.name), role: ROLES.includes(next.role) ? next.role : cur.role } };
  if (!S.selves.you) S.selves.you = blankSelf('you');
  if (!S.selves.sqouse) S.selves.sqouse = blankSelf('sqouse');
}
export function setName(who, raw) { be(who, { name: raw }); }
export function setRole(who, role) { be(who, { role }); }
export function stepRole(who, by) {
  const i = Math.max(0, ROLES.indexOf(roleOf(who)));
  setRole(who, ROLES[(i + by + ROLES.length) % ROLES.length]);
}
export const rollRole = (who, roll = Math.random) => setRole(who, ROLES[Math.floor(roll() * ROLES.length) % ROLES.length]);
// A name off the crew's own list (crew/names.js), one that fits and is not
// the other square's or the one this square has now.
export function rollName(who, roll = Math.random) {
  const other = nameOf(who === 'you' ? 'sqouse' : 'you'), now = nameOf(who);
  const from = CREW_NAMES.filter(n => [...n].length <= NAME_MAX && n !== other && n !== now);
  if (from.length) setName(who, from[Math.floor(roll() * from.length) % from.length]);
}
// The whole square at random: its role and every slot of what it wears. Not
// its name, which is the player's and has its own die (the owner,
// 2026-10-16).
export function rollSquare(who, roll = Math.random) {
  rollRole(who, roll);
  rollOutfit(who, roll);
}

// What a line that names one of them is handed (locales/en.ftl, the story
// lines' `-who` messages): the role key, whether there is a name, and the
// name. `$named` rather than an empty `$name`, since Fluent cannot select on
// an empty string, and a square called "none" must not read as nameless.
export function storyArgs(who) {
  const s = selfOf(who);
  return { so: s.role, named: s.name ? 'yes' : 'no', name: s.name };
}
// A story line about one of them, in the player's language: the line that
// names them where the language has written it, else its older line
// (lang.js, `msgOr`).
export const storyLine = (id, older, who, args = {}) => msgOr(id, older, { ...storyArgs(who), ...args });
// The ribbon on every goal card, wherever the board it hangs on: the
// barrier the story is on, which is saving your sqouse.
export const goalTitle = () => storyLine('goal-title-who', 'goal-title', 'sqouse');
// The name a body answers to on its card and in the crew list: the name the
// player gave, for the two of them, else its own.
export function bodyName(w) {
  const who = whoIs(w);
  return (who && nameOf(who)) || (w && w.name) || '';
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
  return ids.sqouse === w.uid ? 'sqouse' : ids.you === w.uid ? 'you' : null;
}
// The body that is one of them, named as the moment it appears.
export function namePair(who, w) {
  if (!w || !w.uid) return;
  const other = who === 'sqouse' ? 'you' : 'sqouse';
  S.pairIds = { ...S.pairIds, [who]: w.uid, [other]: S.pairIds[other] === w.uid ? null : S.pairIds[other] };
}

// Whether each of them should be a body of the crew now. You are from the
// end of the opening until the snatch takes you (then in the belly, and
// after the kill the finale's to walk, never crew again). Your sqouse is
// from the rescue until the finale takes them off the crew; through the
// snatch itself both are held off the crew by the beat, which knows them.
const youCrew = () => S.beatsDone.includes('show') && !S.snatched && !S.finale && !S.retired;
const sqouseCrew = () => !!S.rescued && !S.retired && !(S.finale && !S.finale.her);

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
  const ids = { sqouse: null, you: null, ...(S.pairIds || {}) };
  if (!youCrew()) { if (S.snatched || S.finale || S.retired) ids.you = null; }
  else if (!S.workers.some(w => w.uid === ids.you)) {
    const yard = S.workers.filter(w => !w.deepHome);
    ids.you = oldest(yard.length ? yard : S.workers, ids.sqouse)?.uid || null;
  }
  // the finale's `her` is the body it walks home as your sqouse (finale.js)
  if (!sqouseCrew()) { if (S.retired || S.finale) ids.sqouse = null; }
  else if (S.finale && S.finale.her) ids.sqouse = S.finale.her;
  else if (!S.workers.some(w => w.uid === ids.sqouse)) {
    const st = S.snatched && S.stations && S.stations[0];
    const fighter = st && st.fighter ? S.workers.find(w => w.uid === st.fighter) : null;
    const deep = S.snatched ? S.workers.filter(w => w.deepHome) : [];
    ids.sqouse = (fighter || oldest(deep.length ? deep : S.workers, ids.you))?.uid || null;
  }
  if (ids.sqouse && ids.sqouse === ids.you) ids.sqouse = null;
  if (ids.sqouse !== S.pairIds?.sqouse || ids.you !== S.pairIds?.you) S.pairIds = { you: ids.you, sqouse: ids.sqouse };
}

// --- the save --------------------------------------------------------------------------
// Read last of all (persist.js, `SAVERS`), so the names are mended against a
// yard that is wholly back.
const readSelf = (s, who) => {
  const o = s && typeof s === 'object' ? s : {};
  return { name: cleanName(o.name), role: ROLES.includes(o.role) ? o.role : ROLE_START[who] };
};
export const SAVE = {
  fields: ['pairIds', 'outfits', 'dressOffered', 'selves', 'wardOpened'],
  write(out) {
    out.pairIds = { you: S.pairIds?.you || null, sqouse: S.pairIds?.sqouse || null };
    out.outfits = { you: outfitOf('you'), sqouse: outfitOf('sqouse') };
    out.dressOffered = !!S.dressOffered;
    out.selves = { you: { ...selfOf('you') }, sqouse: { ...selfOf('sqouse') } };
    out.wardOpened = [...(S.wardOpened || [])];
  },
  read(s) {
    const ids = s.pairIds || {};
    const uid = k => (typeof ids[k] === 'string' ? ids[k] : null);
    S.pairIds = { you: uid('you'), sqouse: uid('sqouse') };
    S.outfits = { you: wholeOutfit(s.outfits?.you, 'you'), sqouse: wholeOutfit(s.outfits?.sqouse, 'sqouse') };
    S.dressOffered = s.dressOffered !== false;
    S.selves = { you: readSelf(s.selves?.you, 'you'), sqouse: readSelf(s.selves?.sqouse, 'sqouse') };
    S.wardOpened = Array.isArray(s.wardOpened) ? s.wardOpened.filter(l => typeof l === 'string') : [];
    keepPair();
    // a save from before the latch: what its yard already owns opens now
    latchOpened();
  },
  blank() {
    S.pairIds = { you: null, sqouse: null };
    S.outfits = { you: { ...DEFAULTS.you }, sqouse: { ...DEFAULTS.sqouse } };
    S.dressOffered = false;
    S.selves = { you: blankSelf('you'), sqouse: blankSelf('sqouse') };
    S.wardOpened = [];
    latched = -Infinity;
  }
};
