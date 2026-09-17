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
five-by-five mark in the top-right corner -- says what is being done
to it. So "tune the ram", "another pot" and "strong brew" are the ram, the
pot and the sack (carry) with a plus (more of it, any way), "enrich the
quarry" is the ore lump with a star. One drawing serves a family, the
family reads as one, and a player who knows the sack knows every row that
is about carrying. (The owner's call, 2026-09-14: reuse as far as it goes.)

Seven badges: **plus** (more of it: another one, a machine tuned up, a
tonic of it, or a richer yield -- one mark for all of those), **up** (faster
-- two chevrons), **star** (a spell), and the four coins -- **dust** square,
**crop** hexagon, **ore** triangle, **spark** cross. A drawing never carries
its own mark in the corner; the badge is laid on, so the same drawing serves
the plain row and the badged one.

## The drawings, and every row each one serves

Marked `*` where `sprites.js` already has it at the body's scale (three
cells wide); those are redrawn at eight, the shape settled.

| drawing         | rows                                                                                   |
|-----------------|----------------------------------------------------------------------------------------|
| sack            | `carry`, `haulcarry`, `potency-strong` +plus, `bank` +dust                              |
| pick head       | `pick`, `rockhandpick`                                                                 |
| pick mid-swing  | `speed`, `rockhandspeed`, `quarrypace`                                                 |
| spark (4-point) | `critchance`, `potency-brace` +plus                                                    |
| cracked rock    | `critmult`                                                                             |
| boot            | `haulpace` +up                                                                         |
| lever           | `auto`, `recycler`, `letgo`                                                            |
| cart            | `carter`                                                                               |
| belt            | `belt`                                                                               |
| ram *           | `ram`, `tuneram` +plus, `spelldrive` +star                                           |
| jaw *           | `jaw`, `tunejaw` +plus                                                               |
| tiller *        | `tiller`, `tunetiller` +plus                                                         |
| helmet *        | `breaker` +plus                                                                            |
| lamp hat *      | `blaster` +plus                                                                            |
| brim hat *      | `grower` +plus                                                                             |
| pointed hat *   | `wizard` +plus, `askwizards`                                                           |
| cap *           | `loopost` +plus, `spellsweep` +star                                                    |
| house           | `house` +plus, `spellthrift` +star                                                     |
| door            | `crewlist`                                                                             |
| hoist frame     | `unlockquarry`                                                                         |
| furrow + sprout | `unlockfarm`, `farmplot` +plus                                                         |
| pot             | `unlockapothecary`, `potkeep`, `anotherpot` +plus, `bufflength` +plus|
| die             | `unlockcasino`, `ride`                                                                 |
| hut             | `unlockshack`                                                                          |
| bucket and mop  | `unlockouthouse`                                                                       |
| tower           | `unlocktower`                                                                          |
| fan             | `unlockscrub`, `fan`                                                                   |
| balloon         | `balloon`                                                                              |
| shovel          | `quarrybench` +plus                                                                    |
| ore lump        | `seam` +plus, `spellluck` +star                                                          |
| ear of crop     | `crop` +plus, `spellbloom` +star                                                       |
| hoe             | `tend` +up                                                                             |
| vial            | `brewdoses` +plus                                                                      |
| bowl            | `potency-stew` +plus                                                                   |
| star (5-point)  | `spelldrive`, `spellluck`, `spellbloom`, `spellthrift`, `spellsweep` (with their own first glyph) |
| wand            | `wizspeed` +up                                                                         |
| bolt            | `wizpower`                                                                             |
| dome arc        | `dome`                                                                                 |
| planks          | `props`                                                                                |
| net             | `net`                                                                                  |
| arch            | `arch`                                                                                 |
| chip            | `chip` +plus, `stakedust` +dust, `stakeshard` +ore, `stakespore` +crop                       |

That is every one of the sixty-one.

## What is left to draw

Forty-two drawings in the table; eight exist; **thirty-four new**, and
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
- **scrub** (1): balloon
- **casino** (1): chip
- **the sky** (3): planks, net, arch
- **redrawn at eight** (8): ram, jaw, tiller, helmet, lamp, brim, point, cap

## How they are drawn

On `glyphs.html`, the glyph sheet: every drawing at one, three and six
times, its four rung strokes, and every row that borrows it with its badge;
a drawing named here and not yet in `GLYPHS` is a dashed card. Then
`shelf.html`, for it among its neighbors on the plank -- a glyph is judged
against the one next to it. `GLYPHS` in `glyphs.js` is the table of
drawings, `BADGES` the marks, `GLYPH_OF` this inventory as code (row key to
drawing and badge), and `glyphFor` composes the two; a row never names a
picture in its own file. The crate stands in until the real one lands.
