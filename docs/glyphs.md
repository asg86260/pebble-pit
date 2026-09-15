# The shelf's glyphs: an inventory

Every row that draws as a tile on a shelf (DESIGN.md, "The shelf") wants
one small sprite: the **object**, never the effect -- a sack, not "carry
more". Eight cells square in the sprite alphabet (`'#'` rows, `sprites.js`),
drawn at `SHELF_GLYPH_CELL` screen pixels a cell, black, centered on its ink
by `glyphs.js`. The stroke that marks the rung is painted round it by the
builder, so a glyph is drawn plain.

Read off the boards on 2026-09-14 (`__rows`, every `*_SECTIONS`). The books
are a ledger and want none. Sixty-one rows.

## The rule: borrow the object, badge the how

A row borrows the glyph of the thing it is *about*, and a **badge** -- a
three-by-three mark in the bottom-right corner -- says what is being done
to it. So "tune the ram" is the ram with a wrench, "another pot" is the pot
with a plus, "strong brew" is the sack (carry) with a vial, "enrich the
quarry" is the ore lump with a star. One drawing serves a family, the
family reads as one, and a player who knows the sack knows every row that
is about carrying. (The owner's call, 2026-09-14: reuse as far as it goes.)

Eight badges: **wrench** (tune), **plus** (another), **star** (a spell),
**vial** (a tonic), and the four coins -- **dust** square, **crop** hexagon,
**ore** triangle, **spark** cross.

## The drawings, and every row each one serves

Marked `*` where `sprites.js` already has it at the body's scale (three
cells wide); those are redrawn at eight, the shape settled.

| drawing         | rows                                                                                   |
|-----------------|----------------------------------------------------------------------------------------|
| sack            | `carry`, `haulcarry`, `potency-strong` +vial, `bank` +dust                              |
| pick head       | `pick`, `rockhandpick`                                                                 |
| pick mid-swing  | `speed`, `rockhandspeed`, `quarrypace`                                                 |
| spark (4-point) | `critchance`, `potency-brace` +vial                                                    |
| cracked rock    | `critmult`                                                                             |
| boot            | `haulpace`, `potency-swift` +vial                                                      |
| lever           | `auto`                                                                                 |
| cart            | `carter`                                                                               |
| belt            | `belt`, `tunebelt` +wrench                                                             |
| ram *           | `ram`, `tuneram` +wrench, `spelldrive` +star                                           |
| jaw *           | `jaw`, `tunejaw` +wrench                                                               |
| tiller *        | `tiller`, `tunetiller` +wrench                                                         |
| helmet *        | `breaker`                                                                              |
| lamp hat *      | `blaster`                                                                              |
| brim hat *      | `grower`                                                                               |
| pointed hat *   | `wizard`, `askwizards`                                                                 |
| cap *           | `loopost` +plus, `spellsweep` +star                                                    |
| house           | `house` +plus, `spellthrift` +star                                                     |
| door            | `crewlist`                                                                             |
| hoist frame     | `unlockquarry`                                                                         |
| furrow + sprout | `unlockfarm`, `farmplot` +plus                                                         |
| pot             | `unlockapothecary`, `potkeep`, `anotherpot` +plus, `potprefer` +vial                   |
| die             | `unlockcasino`, `ride`                                                                 |
| hut             | `unlockshack`                                                                          |
| bucket and mop  | `unlockouthouse`                                                                       |
| tower           | `unlocktower`                                                                          |
| fan             | `unlockscrub`, `fan`                                                                   |
| balloon         | `balloon`                                                                              |
| bin (recycler)  | `recycler`                                                                             |
| shovel          | `quarrybench` +plus                                                                    |
| ore lump        | `seam`, `spellluck` +star                                                              |
| ear of crop     | `crop`                                                                                 |
| hoe             | `tend`                                                                                 |
| vial            | `bufflength`, `brewdoses` +plus                                                        |
| bowl            | `potency-stew` +vial                                                                   |
| star (5-point)  | `potency-gleam` +vial                                                                  |
| wand            | `wizspeed`                                                                             |
| bolt            | `wizpower`                                                                             |
| dome arc        | `dome`                                                                                 |
| planks          | `props`                                                                                |
| net             | `net`                                                                                  |
| arch            | `arch`                                                                                 |
| chip            | `chip`, `stakedust` +dust, `stakeshard` +ore, `stakespore` +crop                       |

That is every one of the sixty-one.

## What is left to draw

Forty-three drawings in the table; eight exist; **thirty-five new**, and
the eight badges at three-by-three.

By the board they first appear on, so a shelf can be finished at a time:

- **bench** (13): sack, pick head, pick mid-swing, spark, cracked rock,
  boot, lever, cart, belt, hoist frame, furrow, die, hut, bucket and mop,
  tower, fan -- the last seven double as their stations' own marks
- **house** (2): house, door
- **quarry** (2): shovel, ore lump
- **farm** (2): ear of crop, hoe
- **apothecary** (4): pot, vial, bowl, star
- **tower** (3): wand, bolt, dome arc
- **scrub** (2): balloon, bin
- **casino** (1): chip
- **the sky** (3): planks, net, arch
- **redrawn at eight** (8): ram, jaw, tiller, helmet, lamp, brim, point, cap

## How they are drawn

On `shelf.html`, the glyph bench: every glyph at one and four times, under
its name, beside its neighbors on the plank -- a glyph is judged against the
one next to it. `GLYPHS` in `glyphs.js` is the table of drawings, `BADGES`
the marks, and `glyphFor` maps a key to a drawing and an optional badge, so
a row never names a picture in its own file. Placeholders (the crate, the
hat, the shield) stay until the real one lands, and a shelf full of crates
is the to-do list.
