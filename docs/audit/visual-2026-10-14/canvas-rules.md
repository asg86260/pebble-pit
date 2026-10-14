# The drawn game's rules, as they stand (canvas audit, 2026-10-14)

What the canvas already mostly does, written down so the exceptions in
`canvas.json` have something to be exceptions *to*. Each rule says how
consistently it is followed today. Evidence crops are in `canvas/`. This is an
audit: no game code was changed.

## 1. Palette, and what each color means

| color | meaning | where it lives | followed |
|---|---|---|---|
| **ink `#000` / paper `#fff`** | mass and holes. "White keeps, black takes": doorways, mouths and throats are white; mass is black. | `LIGHT_INK/LIGHT_PAPER` (config/view.js:20), about 280 literal `'#000'`/`'#fff'` in render code | **Very consistent.** Render files almost never write any other literal (the inventory found about 10 in all of src/render). |
| **yard greys `SHADES`** (6, `#8a8a8a` to `#111`) | how deep the rock or dust was. Dust only. | config/view.js:17, `shadeOf`/`shadeNear`/`depthShade` in grid.js | **Mostly.** Dust, rock, heaps and the sphere use them. But four more grey ramps (FINALE_GREYS, AIR_TINTS dust, PAPER, cloud greys) and a cluster of one-off mid greys (`#8a8a8a`/`#8c8c8c`/`#8f8f8f`/`#909090`) do the job of "inactive/empty" (C06). |
| **the deep's greys `ABYSS_TONES`** (12, faintly blue, black to white) | everything in the abyss and the deep. Drawn inverted (deeptones.js `seen`). | config/rift.js:164 | **Consistent** inside the deep and the rift. |
| **coin colors `FIND_COLOR`** (4 tones each) | what a site gave up: blue = quarry shard, green = farm spore, red = the meteor's spark. Flat and strong, not pastel. | config/view.js:61-67, `SHELF_INK`, style.css | **Strongly followed for the coins themselves.** A rung's tint stroke on a station glyph is the coin it costs (`pile-mark-red-outline.png`). Broken by the tonics' own near-copies (C05), the filter dial's traffic light (C04) and the smog fringe's red (C08). |
| **red** | the star and everything it gives: crust, fire, corona, sparks. "Red is the stuff." | `FIND_COLOR[SPARK_CELL]`, sky.js | **Followed**, except that the spark's *shape* differs by surface (C01). |
| **purple** (`MAGIC_TONES`, `ABYSS_MAGIC_TONES`) | what the wizards emit: magic. "Purple is the magic moving it." | config/view.js:59, config/rift.js:170 | **The weakest rule.** Seven meanings (C02) and four separate purple families (C03). |
| **sky tints `SMOG_TINTS`, `AIR_TINTS`** | which works dirtied the sky: brown dust, blue shard, green spore, soot. | config/air.js | Consistent. |
| **muck browns** | the outhouse's muck and the acid wash | config/weather.js:147-148 | Consistent. |

**Fades.** The deep's written rule is "no alpha: a thing fades by being painted
in a darker tone of its own family" (config/rift.js:167). The deep's world
(fauna, fish, riftlife, the level-up, fireworks) keeps it. Its HUD, bodies and
rift twinkle do not (C25). The yard fades by `globalAlpha` throughout, which
makes off-palette pastels (C09).

**Over the frame.** press.js lays scanlines and a radial vignette over
everything (C07). It is the only gradient in the game.

## 2. Grid

- **Everything sits on `P = 6`**, with positions snapped by `Math.round(x / P) * P`.
  Rings are put down cell by cell (`cell()` in marks.js, `ring()` in kits.js).
  **Followed in the large majority of drawing.** Of about 100 fractional-`P`
  expressions in render code, most are centering arithmetic (`- P / 2` on a
  center) that lands on whole cells.
- **Exceptions that land off-grid:**
  - half-cell eaves and caps on the house, sheds and noticeboard. The shack and garage use full-cell lids, and noticeboard.js wrongly calls the half cell "the eave every building wears" (C11).
  - P-1 comic marks, the 1.5-cell mooring stake and the half-cell basket weave (C12).
  - the deep giant's half cells (C13).
  - glyph-stack drift in whole pixels (C29).
- **Screen-space HUD has its own pixel:**
  - NUM_FONT at 2 px a font pixel
  - status icons at 3 px
  - the counter's 9-px marks

  These are deliberate, but there are three of them (C14, C15).

## 3. Line and outline

- **A body is a hollow square:** white fill, a 2-px black rule inset 1 px
  (`strokeRect(x + 1, y + 1, w - 2, h - 2)`). Crew, carts, forklifts, the
  finale's crew and the count card all do it this way (9 sites). **Consistent.**
- **The thin line in the world is 2 px (`P / 3`):** ground line, pit outline,
  ladder rails, tape, antenna, sight ring, board edges and the done tick's
  halo. **Mostly.** Exceptions are the 1-px build ghost and hold ring (C19)
  and boards that center the rule on their edge (C17).
- **Rings and slopes are cells, not strokes:** flag waves, tower rings, sphere
  halo, ram wheel, belt ramp, shield braces and filter needle. **Mostly.** Five
  anti-aliased strokes and arcs remain (C18), plus the vector warning
  triangle (C16) and the counter marks (C15).
- **Over-station marks are solid ink on cells** (done tick, building glyph,
  choose mark). The warning triangle is the one hollow, vector mark (C16).

## 4. Per-cell variation

- **Material is never one tone.**
  - Dust carries its shade per grain.
  - Rock is depth-shaded.
  - Sky motes take a tint from `SMOG_TINTS` plus an ink weight.
  - Clouds have lit, body and shade tones.
  - The sphere's plates are hashed.
  - The deep's props, plinths, domes, pods and floor are hash-grained (`PLINTH_TONES`, `DOME_TONES`).

  **Followed for the ground, the sky and the whole deep.**
- **Yard buildings are flat ink silhouettes.** Tower, shack, sheds, filter,
  casino, houses, garage, bench and machines (`drawSprite` can only draw `#000`
  and `#fff`). house.js and shack.js state this as the grammar, but the
  apothecary and the finale house grain theirs, so the rule is unwritten and
  split (C20).
- **Remaining flat masses of material:** the muck band, the darkest dust rung
  across a heap's core, the star's crust and the cauldrons (C21).

## 5. Motion

- **Bodies travel at a constant pace, on whole pixels.** Nothing teleports.
  **Followed.**
- **Attacks and impacts are held poses with a smear on the quickest frame**
  (serpent recoil, near-death, power-up, the fighters' contacts, level-up,
  fireworks). **Followed in the deep's fight.** The fighters ease between
  contacts and hold only near them.
- **The deep's world flows:** sways, interference and drift are continuous
  sines snapped to cells. **Consistent.**
- **Where the same act moves differently** (C22-C24, C27):
  - creature flinches: held, eased, or stepped
  - five hops in five styles
  - the jaw opening four ways
  - balloons eased in play but held in the finale
- **Flash and shake** survive in the yard (lightning flash, shield strain
  shake, camera shake, dizzy wobble). Only the camera shake goes through the
  reduced-motion gate (C26).
- **The helpers are copied, not shared:** about 14 smoothsteps and six held-step
  quantizers (C28).

## 6. Store art

The capsules are crisp, hand-drawn cells. The screenshots are 5/3-scaled game
renders (C30). The icons are the real shelf glyphs, but ladders repeat (C31).
The capsules' palette, title font and rock are the tool's own (C32, C33).
