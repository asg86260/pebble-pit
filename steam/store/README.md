# Steam store art

Regenerate everything drawn with `node tools/steam-art.mjs`: the capsules and
the icons, with only the headless shell playwright already keeps and no dev
server. Name parts to do less (`--capsules`, `--icons`). `--shots` retakes the
screenshots from the game and wants a dev server
(`GAME=http://localhost:<n>/`). `--sheet` writes `sheets/` to look at.
`--check` prints each file's color count and its share of lone pixels. The run
fails if two icons are the same picture. How the art keeps the game's rules
is in `docs/design-language/store.md`.

| Files | What | Upload in Steamworks |
| --- | --- | --- |
| `capsules/header_920x430.png` | Header capsule | Store Page Assets, Header Capsule |
| `capsules/small_462x174.png` | Small capsule | Store Page Assets, Small Capsule |
| `capsules/main_1232x706.png` | Main capsule | Store Page Assets, Main Capsule |
| `capsules/vertical_748x896.png` | Vertical capsule | Store Page Assets, Vertical Capsule |
| `capsules/library-capital_600x900.png` | Library capsule | Library Assets, Library Capsule |
| `capsules/library-hero_3840x1240.png` | Library hero, no title | Library Assets, Library Hero |
| `capsules/library-logo_1280x720.png` | Library logo, transparent | Library Assets, Library Logo |
| `capsules/library-logo-white_1280x720.png` | Library logo in white, transparent, for a dark hero | Library Assets, Library Logo (in place of the black one) |
| `screenshots/*.png` | Five 1920x1080 store screenshots, taken from the scenes `steamhome`, `steamrock`, `steamsites`, `steamstorm` and `steamboard` | Store Page Assets, Screenshots |
| `achievements/ACH_*.png` | Unlocked icon, 256x256 | Stats & Achievements, each achievement's icon |
| `achievements/ACH_*_locked.png` | Locked icon (grey outline), 256x256 | Same achievement, locked icon |
| `sheets/*.png` | Contact sheets of every capsule and icon | Not uploaded |

`node tools/steam-achievements.mjs` prints the achievement table with the
`hidden` column and the two icon file names. The hidden ones are listed in
`STEAM_HIDDEN` in that file.

## Icons still wearing a borrowed glyph

These icons stand in with another drawing; each needs a new one drawn in
`glyphs.html`. `tools/steam-art/picks.mjs` says which glyph each one borrows
and why. Once a drawing exists, point the pick at it and rerun `--icons`.

lived1h, nobodyhired, underminute, lifted, dizzy, serpent, allstations
