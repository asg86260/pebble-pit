# The index's icons

Each entry in the index (`INDEX` in `src/config/index.js`) shows an icon
borrowed from `GLYPHS` (`src/glyphs.js`). The rule, from the pass on
2026-10-11: **an icon is a picture of the entry itself**, something the
player would recognize from the game.

- A drawing made for one shop row may stand for the thing that row is about
  (`planks` for the wooden barrier, `ram` for the ram).
- A drawing made for a stat or upgrade does not stand for the station or
  body that upgrade belongs to (the pick-speed swing is not the miners).
- No two entries share a drawing (`test/index.test.mjs` checks this; the
  coin marks are the exception).
- Where nothing that exists depicts the entry, it gets **no icon**
  (`glyph: null`) instead of a misleading one.

Totals: 69 entries. 53 kept (5 coin marks, 29 drawings, 19 that already had
none), 1 changed to a different drawing, 15 changed to none. 34 entries now
have no icon.

## Entry by entry

| entry | icon | call | reason |
|---|---|---|---|
| pebbles | `mark:dust` | keep | the coin's own mark |
| ore | `mark:shard` | keep | the coin's own mark |
| crops | `mark:spore` | keep | the coin's own mark |
| sparks | `mark:spark` | keep | the coin's own mark |
| scales | `mark:scale` | keep | the coin's own mark |
| crits | `cracked` | keep | drawn for crit size, which is about the crit; borderline, now unshared |
| the boulder | none | was `cracked` | the crit-size burst, shared with crits; no boulder drawing exists |
| the hole | none | keep | nothing drawn |
| the rift | none | was `portal` | the portal's whirlpool, shared with the abyss and the portal |
| the abyss | none | was `portal` | same whirlpool; the abyss is not the portal |
| muck | none | keep | nothing drawn |
| poop | none | keep | nothing drawn |
| birds | none | keep | nothing drawn |
| the house | `house` | keep | drawn for the house row |
| pollution | none | keep | nothing drawn |
| clouds | none | keep | nothing drawn |
| rain | none | keep | nothing drawn |
| lightning | none | was `bolt` | the bolt was drawn for wizard power, a spell, not the storm |
| the star | none | was `star` | that star was drawn for the spells; the sky's star is a rock |
| balloon | `balloon` | keep | drawn for the balloon row |
| the recycler | none | was `lever` | the lever is auto-toss and the casino's let-go, not the recycler |
| the bench | none | keep | nothing drawn |
| the shack | `hut` | keep | drawn for the shack's own unlock |
| the books | none | keep | nothing drawn |
| the farm | `furrow` | keep | drawn for the farm's unlock |
| the quarry | `hoist` | keep | drawn for the quarry's unlock |
| the apothecary | `pot` | keep | drawn for the apothecary's unlock |
| the tower | `tower` | keep | drawn for the tower's unlock |
| the casino | `die` | keep | drawn for the casino's unlock |
| the janitor's closet | `bucket` | keep | drawn for the closet's unlock |
| the air filter | none | was `balloon` | the balloon is the balloon entry's; the filter station is undrawn |
| the ram | `ram` | keep | drawn for the ram |
| the drill | `jaw` | keep | drawn for the drill |
| the tiller | `tiller` | keep | drawn for the tiller |
| the belt | `belt` | keep | drawn for the belt |
| the sphere | `sphere` | keep | drawn for the sphere |
| the roombas | `roomba` | keep | drawn for the roomba |
| forklift | `lift` | keep | drawn for the forklift |
| wooden barrier | `planks` | keep | drawn for the props |
| the net | `net` | keep | drawn for the net |
| the arch | `arch` | keep | drawn for the arch |
| the barrier | `dome` | keep | drawn for the dome |
| the deep | none | keep | nothing drawn |
| the portal | `portal` | keep | drawn for the portal; now the whirlpool's only wearer |
| the crusher | none | keep | nothing drawn |
| the pods | none | keep | nothing drawn (the pod row borrows `house`, which the house wears) |
| haulers | none | was `sack` | the sack is the carry upgrade, not the body |
| diggers | none | was `pickhead` | the pick upgrade, a tool, not the body |
| miners | none | was `swing` | the pick-speed swing |
| farmers | none | was `hoe` | the tending upgrade's tool |
| air purifiers | none | was `balloon` | the balloon, shared, and not a body |
| apothecary (keeper) | none | was `pot` | the pot is the apothecary place's |
| janitors | `cap` | keep | the janitor's cap, drawn for the row that sells another |
| wizards | `point` | keep | the wizard's hat, drawn for the row that summons one |
| builders | none | was `shovel` | the quarry bench's shovel |
| breaker | `helmet` | keep | the hat itself |
| carter | `cart` | keep | the cart itself |
| blaster | `lamp` | keep | the hat itself |
| grower | `brim` | keep | the hat itself |
| brews | `vial` | was `bowl` | a brew walks out as a vial (the keeper holds one up); the bowl is only the stew |
| fighters | none | was `fist` | the brawler's weapon, one class of ten |
| sqwife | none | keep | nothing drawn |
| objective | none | keep | nothing drawn |
| achievements | none | keep | nothing drawn |
| you saved your sqwife | none | keep | nothing drawn |
| scenes | none | keep | nothing drawn |
| sqhusband | none | keep | nothing drawn |
| the serpent | none | keep | nothing drawn |

## Needs a drawing

Entries now without an icon, with an idea for each. Draw them in
`glyphs.html`, add them to `GLYPHS`, then name them in `INDEX`.

- **the boulder**: a round rock with a chip out of one shoulder.
- **the hole**: a dark pit seen from the side, a few pebbles in the bottom.
- **the rift**: a jagged tear hanging over the hole's lip.
- **the abyss**: the hole's mouth filled to the brim with black, with no bottom line.
- **muck**: a low heap with drips falling onto it.
- **poop**: the yard's little coiled pile.
- **birds**: a bird in flight, two wing strokes and a body.
- **pollution**: a scatter of motes over a smokestack puff.
- **clouds**: a cloud, flat bottom and lumpy top.
- **rain**: a cloud with three dropping lines.
- **lightning**: a zigzag bolt coming out of a cloud (unlike the wizard's bolt).
- **the star**: the rock in the sky, with a few rays.
- **the recycler**: the filter's return chute, an arrow turning back into a bin.
- **the bench**: your workbench, a tabletop on two legs with a tool on it.
- **the books**: the noticeboard, a board on a post with lines of writing.
- **the air filter**: the filter station itself, a housing with a fan grille.
- **the deep**: water lines with something below them.
- **the crusher**: two jaws closing on a scale.
- **the pods**: the deep's pod, a round house with a porthole.
- **haulers**: a body with a sack over its shoulder.
- **diggers**: a body mid-swing with a pick.
- **miners**: a body with a lamp hat climbing a ladder.
- **farmers**: a body bent over a sprout.
- **air purifiers**: a body with a mask.
- **apothecary (keeper)**: a body stirring a pot.
- **builders**: a body carrying a plank.
- **fighters**: a body with a raised fist and a shield, any class.
- **sqwife**: the sqwife's own head, as drawn in the yard.
- **objective**: an arrow pointing forward to a flag.
- **achievements**: a ribbon or medal.
- **you saved your sqwife**: the sqwife with a heart over her.
- **scenes**: a film frame, or a clapperboard.
- **sqhusband**: the sqhusband's head.
- **the serpent**: a coiled serpent's head and two loops.
