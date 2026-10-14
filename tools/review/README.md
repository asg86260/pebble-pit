# Before and after: the review tools

Every change goes to the owner as pictures: the same shot of the commit before
it and the commit after, side by side, stills for what is drawn and GIFs for
what moves, with approve, deny and a comment on each. Two scripts make it.

```
node tools/review/shoot.mjs --base <ref> --head <ref> --items <items.json> --out <dir>
node tools/review/page.mjs  --items <items.json> --shots <dir> --out <dir>/index.html
```

A review lives in its own folder, `docs/reviews/<date>-<name>/`: the
`items.json`, the shots (`<item>/<n>-before.png|gif`, `-after`), the
`manifest.json` the shooter writes, and `index.html`. Publish the folder with
the Artifact tool: the page as `file_path`, every picture in `files` under its
relative path. Read the verdicts back with `ArtifactData` (`list`, collection
`reviews`, one document an item id: `verdict` is `approve` or `deny`, plus
`comment`).

## shoot.mjs

- `--base` / `--head`: anything git can name (`67baaa3a`, `main`,
  `origin/visual/deep-b4`). Left out, the ones the items file pins (`base`,
  `head`) are used, so a review reshoots against the same two commits however
  far the branches move. Pin a sha in the file, not a branch name. Nothing
  fetches: fetch a remote branch first.
- `--only a,b` reshoots those items and keeps the rest of the manifest.
- Each ref is checked out with `git worktree add --detach` under the system
  temp dir, the main checkout's `node_modules` joined in as a junction (a
  worktree has none of its own), and served by its own vite on a free port.
  One headless, muted shell on a free debugging port with a fresh profile
  takes both sides at once (two origins, so two saves that cannot meet).
- At the end, error or not, both servers and the shell are killed with their
  children, the junction is taken off by itself, and both worktrees are
  removed and pruned. Check `git worktree list` if a run is killed hard.

## items.json

```json
{ "title": "...", "lede": "...", "base": "<sha>", "head": "<sha>",
  "items": [ { "id": "spark-plus", "title": "...", "what": "one line",
               "audit": ["C01"], "shots": [ <capture>, ... ] } ] }
```

A capture of the game or a page:

| field | what |
|---|---|
| `scene` | a name from `src/scenes.js` (`node tools/look.mjs --list`); stood up as `look.mjs` does, through `standScene` in `tools/cdp.mjs` |
| `url` | `play.html` (the default), `index.html`, `cards.html`, any page of the tree |
| `window` | `[w, h]` in CSS px, default `[800, 600]`; under 600 wide is emulated as a phone |
| `wait` | game seconds run after the scene, default 1; 0 for a GIF that starts on the scene's moment |
| `keys` | keys typed through the browser's own input after the scene (`Escape`, `Tab`, `Enter`, arrows) -- a typed Tab lights `:focus-visible`, a script's `focus()` does not |
| `setup` | a JS expression run in the page after the keys (may return a promise) |
| `theme` | `light` or `dark` (`?dark` on the page, and the media query) |
| `crop` | `[x, y, w, h]` of the window, in CSS px |
| `zoom` | scale of what is captured: the crop, else the middle of the window blown up, or under 1 the whole window shrunk |
| `gif` | `{ seconds, fps }`: frames stepped with `__still` and `__fast(1/fps)`, so each is exactly that much game time; `wall: true` films on the wall clock (pages with no yard do so anyway) |
| `keepToasts` | notices are hidden unless the capture is about them |
| `ready` | an expression to wait on instead of the default (the game's dev handles, or a loaded page with its veil lifted) |
| `label` | the caption |

A file at each ref, for things that are not the game (store art):
`{ "file": "steam/store/x.png", "crop": [...], "zoom": 2 }`, or several tiled
into one picture: `{ "files": [...], "cols": 6 }`. A file the base did not have
yet is reported in the manifest and left out of the picture.

Keep a review folder small (under 40 MB): crop stills to the thing, and shrink
a GIF with `zoom` under 1 or a crop.

## The encoders

`pixels.mjs` reads and writes PNG with node's zlib and writes GIF (one
255-color palette for the clip, each frame cut to the box that changed) --
no dependency. A clip with more colors than that, a smeared store shot,
takes its most-used ones and maps the rest to the nearest.
