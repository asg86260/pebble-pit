# The shelf's glyphs: an inventory

Every row that draws as a tile on a shelf (DESIGN.md, "The shelf") wants
one small sprite: the **object**, never the effect -- a sack, not "carry
more". Eight cells square in the sprite alphabet (`'#'` rows, `sprites.js`),
drawn at `SHELF_GLYPH_CELL` screen pixels a cell, black, centered on its ink
by `glyphs.js`. The stroke that marks the rung is painted round it by the
builder, so a glyph is drawn plain.

Read off the boards on 2026-09-14 (`__rows`, every `*_SECTIONS`). The books
are a ledger and want none. Sixty-one rows; forty-one drawings, because the
rest are a drawing already in `sprites.js` or a drawing plus a **badge** -- a
three-by-three mark in the bottom-right corner that says *tune*, *another*
or *which coin* without a second picture.

## Reuse before drawing

| already drawn        | where                     | serves                                              |
|----------------------|---------------------------|-----------------------------------------------------|
| `MACHINE_MARK.jaw`   | sprites.js                | `jaw`, and `tunejaw` with the wrench badge          |
| `MACHINE_MARK.ram`   | sprites.js                | `ram`, `tuneram`                                    |
| `MACHINE_MARK.tiller`| sprites.js                | `tiller`, `tunetiller`                              |
| `HATS.helmet`        | sprites.js                | `breaker`, `rockhandspeed` (with a swing arc)       |
| `HATS.lamp`          | sprites.js                | `blaster`                                           |
| `HATS.brim`          | sprites.js                | `grower`                                            |
| `HATS.point`         | sprites.js                | `wizard`, the four enchantments (with a coin badge) |
| `HATS.cap`           | sprites.js                | `loopost`                                           |

The marks are drawn at the body's scale (three cells wide) and want
redrawing at eight; the shapes are settled.

Badges (three-by-three, bottom-right): **wrench** (tune the machine),
**plus** (another one of a thing), and the **coin** marks -- dust square,
crop hexagon, ore triangle, spark cross -- for the rows that are about one
coin.

## The bench

| key              | name                       | kind    | the object                                           |
|------------------|----------------------------|---------|------------------------------------------------------|
| `props`          | wooden barrier             | goal    | three planks, nailed                                 |
| `net`            | the net                    | goal    | a net, mesh                                          |
| `arch`           | cut the arch               | goal    | a stone arch                                         |
| `askwizards`     | maybe the wizards would know? | sign | the pointed hat with a question mark                 |
| `carry`          | carry amount               | ladder  | a sack, tied                                         |
| `auto`           | hold to mine               | one-off | a lever, pulled                                      |
| `speed`          | auto swing                 | ladder  | a pick mid-swing, with its arc                       |
| `pick`           | pick damage                | ladder  | a pick head                                          |
| `critchance`     | crit chance                | ladder  | a four-point spark                                   |
| `critmult`       | crit damage                | ladder  | a rock, cracked through                              |
| `haulcarry`      | hauler carry               | ladder  | a sack with a strap                                  |
| `haulpace`       | hauler speed               | ladder  | a boot                                               |
| `carter`         | carter                     | kit     | the cart                                             |
| `belt`           | the belt                   | machine | the belt: two wheels and a band (`MACHINE_MARK` has none) |
| `tunebelt`       | tune the belt              | one-off | the belt + wrench badge                              |
| `unlockquarry`   | build the quarry           | build   | the hoist frame                                      |
| `unlockfarm`     | build the farm             | build   | a furrow with a sprout                               |
| `unlockapothecary` | build the apothecary     | build   | the pot                                              |
| `unlockcasino`   | build the casino           | build   | a die                                                |
| `unlockshack`    | build the shack            | build   | the hut                                              |
| `unlockouthouse` | build the janitor's closet | build   | a bucket and mop                                     |
| `unlocktower`    | build the tower            | build   | the tower                                            |
| `unlockscrub`    | build the scrubbing house  | build   | a house with a fan in its wall                       |

A build's glyph is the station's own object, so it can be the same drawing
the station's board leads with once it is up (the pot, the hut, the tower).

## The house and the closet

| key        | name            | kind    | the object                       |
|------------|-----------------|---------|----------------------------------|
| `crewlist` | who lives here  | door    | a door, ajar                     |
| `house`    | another house   | one-off | a house + plus badge             |
| `loopost`  | another cap     | one-off | `HATS.cap` + plus badge          |

## The shack

| key             | name               | kind    | the object                          |
|-----------------|--------------------|---------|-------------------------------------|
| `rockhandpick`  | digger pick damage | ladder  | a pick head (shares `pick`)         |
| `rockhandspeed` | swing speed        | ladder  | a pick mid-swing (shares `speed`)   |
| `breaker`       | breaker            | kit     | `HATS.helmet`                       |
| `ram`           | the ram            | machine | `MACHINE_MARK.ram`                  |
| `tuneram`       | tune the ram       | one-off | the ram + wrench badge              |

## The quarry

| key           | name           | kind    | the object                        |
|---------------|----------------|---------|-----------------------------------|
| `quarrybench` | another shovel | one-off | a shovel + plus badge             |
| `seam`        | ore yield      | ladder  | an ore lump, faceted              |
| `quarrypace`  | mining speed   | ladder  | a pick mid-swing (shares `speed`) |
| `jaw`         | the drill      | machine | `MACHINE_MARK.jaw`                |
| `tunejaw`     | tune the drill | one-off | the drill + wrench badge          |

## The farm

| key          | name           | kind    | the object                      |
|--------------|----------------|---------|---------------------------------|
| `farmplot`   | another plot   | one-off | a furrow with a sprout + plus   |
| `crop`       | crop yield     | ladder  | an ear of crop                  |
| `tend`       | farming speed  | ladder  | a hoe                           |
| `tiller`     | the tiller     | machine | `MACHINE_MARK.tiller`           |
| `tunetiller` | tune the tiller| one-off | the tiller + wrench badge       |

## The apothecary

| key              | name               | kind    | the object                              |
|------------------|--------------------|---------|-----------------------------------------|
| `potkeep`        | keep brewing       | picker  | the pot, steaming                       |
| `potprefer`      | give tonics to     | picker  | a bottle handed over (a hand and a vial)|
| `anotherpot`     | another pot        | one-off | the pot + plus badge                    |
| `bufflength`     | brew concentration | ladder  | a flask, half full                      |
| `brewdoses`      | batch size         | ladder  | three vials in a row                    |
| `potency-stew`   | hearty stew        | ladder  | a bowl with a spoon                     |
| `potency-brace`  | bracing tonic      | ladder  | a vial + spark badge (crit)             |
| `potency-strong` | strong brew        | ladder  | a vial + dust badge (carry)             |
| `potency-swift`  | speed brew         | ladder  | a vial + a boot badge... or the boot    |
| `potency-gleam`  | mana brew          | ladder  | a vial + star                           |

The five potencies are one vial drawing with five badges, or five
drawings; the badge route keeps the row of five reading as one family.

## The tower

| key           | name                  | kind    | the object                            |
|---------------|-----------------------|---------|---------------------------------------|
| `wizard`      | train a wizard        | one-off | `HATS.point`                          |
| `wizspeed`    | quicker casting       | ladder  | a wand                                |
| `wizpower`    | heavier bolts         | ladder  | a bolt (zigzag)                       |
| `spelldrive`  | speed the machines    | one-off | a scroll + wrench badge               |
| `spellluck`   | enrich the quarry     | one-off | a scroll + ore badge                  |
| `spellthrift` | cheapen the houses    | one-off | a scroll + a house                    |
| `spellsweep`  | quicken the janitors  | one-off | a scroll + cap badge                  |
| `dome`        | conjure the barrier   | one-off | the dome's arc over a rock            |

## The scrubbing house

| key        | name         | kind    | the object              |
|------------|--------------|---------|-------------------------|
| `fan`      | fan power    | ladder  | a fan, four blades      |
| `balloon`  | the balloon  | ladder  | the balloon on its line |
| `recycler` | the recycler | one-off | a bin with a loop on it |

## The casino

| key          | name          | kind     | the object                  |
|--------------|---------------|----------|-----------------------------|
| `chip`       | chips         | dial     | a stack of chips            |
| `stakedust`  | stake pebbles | decision | a chip + dust badge         |
| `stakeshard` | stake ore     | decision | a chip + ore badge          |
| `stakespore` | stake crops   | decision | a chip + crop badge         |
| `bank`       | bank it       | decision | a sack with a coin going in |
| `ride`       | spin again    | decision | two dice                    |

## The count

- 61 rows on tiles.
- 8 drawings already in `sprites.js` (redrawn at eight cells).
- 3 shared within the list (pick head, pick mid-swing, the pot).
- 4 badges (wrench, plus, coin x4 counted as one family).
- **41 new drawings**, of which the eight builds double as their stations'
  own marks.

## How they are drawn

On `shelf.html`, the glyph bench: every glyph at one and four times, under
its name, beside its neighbors on the plank -- a glyph is judged against the
one next to it. `GLYPHS` in `glyphs.js` is the table; `glyphFor` maps a key
to a drawing or a drawing-plus-badge, so a row never names a picture in its
own file. Placeholders (the crate, the hat, the shield) stay until the real
one lands, and a shelf full of crates is the to-do list.
