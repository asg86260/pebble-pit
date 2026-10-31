// The save's shape, as a number. `blob()` (persist.js) writes it as `saveV`,
// and a migration (src/migrations/) names the `SAVE_V` it raises a save to
// and runs only on saves below it. Raise it by one when a migration is
// written, never otherwise (docs/saves.md).
export const SAVE_V = 35;

// Save slots: three yards, one open at a time (DESIGN.md, "Save slots"). Here
// rather than in save.js so the cloud's worker, which cannot load save.js,
// reads the same number.
export const SLOTS = 3;

// The floor: the day of the first public build, v0.1.1. A save with no
// `build` stamp was written before it, has never been on a player's machine,
// and is not read (docs/saves.md).
export const SAVE_FLOOR = '2026-09-12';

// How much newer another page's claim may be than this page's yard before
// this page stands aside (persist.js): a page going away names its last write
// at once, and the database has it a moment later, so the page after reads
// the write before. One autosave and some, in milliseconds.
export const CLAIM_SLACK_MS = 2000;

// The save mark (savemark.js): a landed save is shown at most this often, for
// this long, or the mark would be lit every second the autosave runs.
export const SAVE_MARK_EVERY_S = 10;
export const SAVE_MARK_SHOW_MS = 1200;
