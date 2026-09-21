// The save's shape, as a number. `blob()` (persist.js) writes it as `saveV`,
// and a migration (src/migrations/) names the `SAVE_V` it raises a save to
// and runs only on saves below it. Raise it by one when a migration is
// written, never otherwise (docs/saves.md).
export const SAVE_V = 4;

// The floor: the day of the first public build, v0.1.1. A save with no
// `build` stamp was written before it, has never been on a player's machine,
// and is not read (docs/saves.md).
export const SAVE_FLOOR = '2026-09-12';
