# Steam store art

Regenerate everything drawn with `node tools/steam-art.mjs` (`--capsules` or
`--icons` for half, `--sheet` for a contact sheet in `shots/`). It needs only
the headless shell playwright already keeps; no dev server.

| Files | What | Upload in Steamworks |
| --- | --- | --- |
| `capsules/header_920x430.png` | Header capsule | Store Page Assets, Header Capsule |
| `capsules/small_462x174.png` | Small capsule | Store Page Assets, Small Capsule |
| `capsules/main_1232x706.png` | Main capsule | Store Page Assets, Main Capsule |
| `capsules/vertical_748x896.png` | Vertical capsule | Store Page Assets, Vertical Capsule |
| `capsules/library-capital_600x900.png` | Library capsule | Library Assets, Library Capsule |
| `capsules/library-hero_3840x1240.png` | Library hero, no title | Library Assets, Library Hero |
| `capsules/library-logo_1280x720.png` | Library logo, transparent | Library Assets, Library Logo |
| `screenshots/*.png` | Five 1920x1080 store screenshots, copied from `docs/mocks/steam-capsules/` | Store Page Assets, Screenshots |
| `achievements/ACH_*.png` | Unlocked icon, 256x256 | Stats & Achievements, each achievement's icon |
| `achievements/ACH_*_locked.png` | Locked icon (grey outline), 256x256 | Same achievement, locked icon |

`node tools/steam-achievements.mjs` prints the achievement table with the
`hidden` column and the two icon file names. The hidden ones are `STEAM_HIDDEN`
in that file: gotout, rifttorn, drowned, rift1e6, star, firsthat.

## Icons still wearing a borrowed glyph

These stand in with another drawing and need new ones drawn in `glyphs.html`;
`tools/steam-art/picks.mjs` says which glyph each borrows and why. Once a
drawing exists, point the pick at it and rerun `--icons`.

gotout, holefull, lived1h, nobodyhired, underminute, everyjob, bird, wholelot,
lifted, dizzy, muckrain
