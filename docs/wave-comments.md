# The comment pass

**This document is canon. Subagents: do not redesign; implement.** This is
seam 7 of "The second pass" in DESIGN.md, approved 2026-09-15 with the
owner's rule: **keep only what is needed to derive the logic.**

Base: branch `worktree-cleanup-survey` on origin. Every track resets to it
first and branches from the commit that carries this document.

The exemplar is commit `09f72cd` (`src/upgrades.js`, 1178 lines to 639,
zero code changed). Read that diff before touching anything; it is the
register and the bar.

---

## The rule

A comment stays only if a reader with the code and **no git history** would
need it to work out why a line is the way it is. Compress what stays to the
sentence that carries the reason.

**Keep** (compressed):

- The module header: what this file is and the one rule it enforces, in a
  few lines. No history in it.
- An invariant or contract: "`S.haulers` is set here and nowhere else".
- An ordering constraint: "before `smog`, which reads this frame's dirt".
- A trap: something that looks wrong and is right, or looks safe and is not,
  with the concrete failure in one clause. "`fillRect` takes a top-left" is
  the pattern.
- What a non-obvious condition or number means.
- A pointer to the function or file that owns a rule, when the reader has
  to go there.
- Section rulers (`// --- the kit ---`) and one-line trailing notes that say
  what a line means.

**Drop:**

- History: "it used to be", "was", "became", "replaced", dates, "decided
  2026-...", wave/track/feedback/critic/item references ("F4", "C1 in
  wave-feedback3.md", "critics 2026-09-10, C9", "#14").
- Alternatives considered and rejected. If the rejection is itself a trap
  the next reader would fall into, keep it as one sentence.
- Anything that restates the line under it.
- Duplicated paragraphs (same words twice in a file).
- The design argument -- why the feature exists, what it costs the player,
  how it reads. That lives in DESIGN.md; a pointer is enough where needed.
- Essays. If a comment is longer than the function it sits over, it is
  history or design, not derivation.

No quota. Most files will lose a third to a half of their comment lines;
some (config/, verify.js) may lose less because a number's reason *is* the
derivation. The test is the rule above, not a percentage.

## What may not change

- **No non-comment line changes.** Not a space, not a blank line inside
  code, not a string, not a name. `node tools/comments-check.mjs
  origin/worktree-cleanup-survey` strips comments from both sides and diffs
  the code; it must print `0 with code changes` before you commit. If it
  names a file, fix the file. It caught a no-break space retyped as a plain
  space in the exemplar; that is the kind of thing it is for.
- Strings and template literals are code, even when they hold prose (check
  names in selftest/, scene names, notice text, tooltip words).
- Trailing comments may be shortened or removed but never moved to another
  line.
- American English, as the house style says.
- Do not add comments. This pass only removes and compresses.
- Do not touch files outside your track (below).

## Process

1. `git fetch origin && git reset --hard origin/worktree-cleanup-survey`
2. Read the exemplar: `git show 09f72cd -- src/upgrades.js`
3. One file at a time: read the whole file, rewrite its comments, then
   `node --check <file>`.
4. When the track is done: `node tools/comments-check.mjs
   origin/worktree-cleanup-survey` in the foreground. Paste its output in
   the report.
5. Commit everything on your track in one commit titled
   `The comment pass: <track name>`, ending with the attribution line the
   harness gives you, and push to branch `comments-<track letter>`.

No tests. The pass is prose-only by construction and the checker is the
proof; CLAUDE.md says a prose-only edit needs no run. Do not start a dev
server.

## Ownership

Disjoint. A track owns the files listed and touches nothing else.

| track | owns |
|---|---|
| **A** the yard's records | `src/persist.js` `src/state.js` `src/hooks.js` `src/report.js` `src/verify.js` `src/save.js` `src/scenes.js` `src/scenesheet.js` `src/dev.js` `src/console.js` `src/main.js` `src/settings.js` `src/prefs.js` `src/idb.js` `src/version.js` `src/crash.js` `src/copyout.js` `src/record.js` `src/stats.js` `src/notices.js` `src/catalog.js` `src/title.js` |
| **B** the crew | `src/crew/` (every file) `src/crew.js` `src/jobs.js` `src/kit.js` `src/tidy.js` `src/hands.js` |
| **C** the stations | `src/quarry.js` `src/farm.js` `src/works.js` `src/apothecary.js` `src/potpick.js` `src/casino.js` `src/press.js` `src/slots.js` `src/machines.js` `src/house.js` `src/shack.js` `src/outhouse.js` `src/scrubhouse.js` `src/mult.js` `src/roster.js` `src/crewboard.js` `src/route.js` |
| **D** the boards and the sky's props | `src/board.js` `src/shop.js` `src/input.js` `src/raise.js` `src/queue.js` `src/toast.js` `src/tween.js` `src/upgrades/` (every file) `src/glyphs.js` `src/sprites.js` `src/skip.js` `src/skiphint.js` `src/tower.js` `src/wizard.js` `src/meteor.js` `src/shield.js` |
| **E** the drawing | `src/render.js` `src/render/` (every file) `src/painter.js` `src/fade.js` `src/puff.js` `src/grit.js` `src/shock.js` `src/crit.js` |
| **F** the ground and the frame | `src/world.js` `src/pit.js` `src/rock.js` `src/game.js` `src/grid.js` `src/dust.js` `src/rift.js` `src/core.js` `src/break.js` `src/clock.js` `src/rng.js` `src/intro.js` `src/cutscene.js` `src/ending.js` `src/balloon.js` `src/audio.js` |
| **G** the numbers | `src/config.js` `src/config/` (every file) |
| **H** the sky and the browser checks | `src/smog.js` `src/smog/` (every file) `src/air.js` `src/airboard.js` `src/weather.js` `src/wind.js` `src/selftest.js` `src/selftest/` (every file) |

Not in this wave: `test/`, `tools/`, `docs/`, `*.html`, `*.css`,
`src/upgrades.js` (done).

A note for **G**: a config comment that says what a number is and why it is
that number is derivation and stays. What goes is the story of the numbers
it used to be.

A note for **H**: in `selftest/`, the check's name is a string and stays;
comments inside a check that narrate what the check does are restating it
and go; a comment saying *why* a check waits for a frame or sets a hook is
a trap and stays.

## Report

Fixed shape, nothing else:

1. Files touched, one line each: `path  before -> after lines`.
2. The pasted output of `node tools/comments-check.mjs
   origin/worktree-cleanup-survey`.
3. The branch pushed.
4. Anything you were unsure whether to keep, one line each, with what you
   did.
