# Saves: the floor, the shape number, and the migrations

## The floor

A save this game reads was written by **v0.1.1 (2026-09-12, the first public
build) or later**. Every such save carries `build` -- `{ version, hash, date }`,
written by `blob()` in persist.js; a dev build's stamp is
`{ version: '', hash: 'dev', date: '' }` and counts as above the floor.

A save with no `build` at all was written before the floor and has never been
on a player's machine. It is not read: `isSave` (save.js) refuses it, `load`
puts it aside under `BROKEN_KEY` exactly as it does an unreadable blob,
`S.broken` says so, and the settings sheet's SAVE A COPY hands the blob back as
a file. Nothing is ever silently discarded. The date of the floor is
`SAVE_FLOOR` in `config/saves.js`.

## The shape number

`blob()` writes `saveV: SAVE_V` (`config/saves.js`, today `2`). Every
migration carries `v`, the `SAVE_V` it raises a save to, and runs only on a
save whose `saveV` is below it. A save with no `saveV` is "everything before
today" and gets every migration in the list. Dates are not the key, because a
dev build has no date.

So the list is: the migrations from the floor to the day `saveV` was first
written, all with `v: 1`; and every migration written since with
`v: 2, 3, ...`, each raising `SAVE_V` by one as it lands.

## Adding a migration

One file in `src/migrations/`, named by its date and its subject
(`2026-09-15-beats.js`), exporting one object:

```js
export default {
  since: '2026-09-15',        // the day the shape changed
  v: 2,                       // the SAVE_V it raises the save to
  says: 'the six story flags became the set of beats',
  apply(s) { ... }            // the raw save object, in place; returns nothing
};
```

`apply` reads the old fields off `s` and writes the new ones on the raw
object, before `restore()` reads a single field; it deletes what it folded.
It may import config for a constant and a table that imports nothing
(`jobs.js`); it imports nothing that evaluates the yard, with the one
exception the beats migration makes for `BEATS`. Then: one line in
`src/migrations/index.js`, in date order, and `SAVE_V` up by one.

`restore()` after that reads today's shape and nothing else -- no
"a save from before X" branch ever goes in persist.js again.

`test/save-floor.test.mjs` holds the rule: the list is in date order, every
`v` is at most `SAVE_V`, a save with no `saveV` gets every migration and one
at `SAVE_V` gets none.

## Archiving a migration

Delete its file and its line in `index.js`. A migration may go once every
save it could apply to is below the floor: when the floor moves up to a build
that already wrote the new shape, everything dated before that build goes.
The fixtures in `test/fixtures/` are re-saved in today's shape when the floor
moves, the way they were at the first floor (the base tree loads each once,
`persist()` writes it, the blob goes back over the file).
