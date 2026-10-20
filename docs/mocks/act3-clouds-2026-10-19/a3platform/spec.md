# God's stage (P1), build spec

Source of truth: `index.html` / `world.js` in this folder, which is a mock and not game code. All numbers below are in cells on the 334x161 grid at the owner's window; the horizon is row 92.

## The layer and its slide
- God's camp is one flat layer: the stage, the throne, his crowd, the planted flags, and carriers once they are on the stage.
- The whole layer slides at **1/3** of the camera, the far-layer speed in campgap2. The stage is a flat card, so nothing on it skates.
- The cloud sea under it still slides row by row at each row's depth speed (G1 floor). The math cloud ranges slide slower than any floor row.
- The union's camp and the workshops are on the near layer (speed 1) and stand on the clouds with the G1 lip, unchanged.

## Geometry (screen rows; x relative to the throne's centre gx)
- **The top is a trapezoid, cheated deep.**
  - It runs from row 90 (back edge) to row 122 (front edge).
  - Half-width is 100 at the back and 135 at the front.
  - At that depth the honest top would be about 6 rows; it is drawn 32 deep, the same cheat as the giant crowd, so it reads as a stage seen from above.
- **The throne** stands at the back, with its foot on row 97, drawn at 0.8 of its old size.
- **The front face is a stepped plinth,** in the throne base's family:
  - First the top's own front riser: 4 rows of riser tone, at the front width.
  - Then 2 steps. Each step is a 2-row tread (top tone) over a 4-row riser, and is **12 cells wider a side** than the one above. Each step's end therefore shows as a corner of tread over riser.
  - The plinth's foot is about row 138.
- **Side face:** a 3-cell strip in the riser tone runs down the top's slanted edge, on the side facing the screen centre, so the stage's corner reads against the cloud.

## Tones (one flat tone per shape, no outlines except God's)
| | top | risers / side face | God's souls (alternate by row) | cloud |
|---|---|---|---|---|
| light | paper #fff | mid #757575 | #757575 / #8a8a8a | floor as G1 (paper / pale #d6d6d6) |
| dark | ink #666666 | mid #3a3a3a | #262626 / #3a3a3a | floor as G1 (#121212 / #262626) |

The top is never the cloud's pale. In dark mode the stage is the lightest flat mass after God himself, and the souls are darker than the stage they stand on.

## The crowd on the stage
- **Rows** run from the back edge to the front. Soul size grows from **4 cells at the back to 8 at the front**, a giant's scale bigger than true distance.
- **Gaps:** souls in a row are 2 cells apart. Each row steps back by about 1.1× its soul size, so the paper top shows between rows. Each soul is jittered up to ±1 cell across and lifted 1 row now and then.
- **Clear zones:** the throne's base footprint and an aisle up the middle are kept clear.
- **Support:** as support rises, souls leave from the **front** first, fading over about a second. The empty front of the stage is the "floor shows where the crowd thins" read.
- **No cloud lip on God's souls:** standing on a flat top reads as grounded.

## Flags
- **Shape:** a paper fist on ink cloth (7 by 5 fist, each cell u = n/7), a 1-cell ink pole running about 1.8n tall into the crowd.
- **Planted flags:** 4, spread across the stage either side of the throne, 7–10 cells tall, front ones bigger.
- **Carriers' flags** are capped at n = 7.

## Carriers
- **Cloud leg:** the first 70% of a carrier's trip is across the cloud from the union's crowd to the plinth's foot, near its left front corner. On this leg x uses each depth's own slide speed, so carriers shrink and slow as they go.
- **Climb:** for the next 15% of the stage leg the carrier rises straight up the plinth face to the top's front edge.
- **Spread:** it then walks across the top to its own planting spot. Spots are seeded per carrier and per trip, anywhere on the top clear of the throne, so carriers fan out instead of piling up at the corner. Its size goes from its front-edge size to the size of the spot's row.
- **Plant:** it fades out over the last quarter of the stage leg, at the spot.
- **Won souls** walk the cloud leg in reverse, in grey.

## What replaces the floor lip
- **At the plinth's foot:** 16 billows of the floor's own drawing (white body, line along the top in mid), set irregularly along the foot.
  - Heights run 2.5–9 rows, skewed small, each pushed up 0–3 rows.
  - Width is about 3.6× height.
  - They lap up over the lowest riser, so there is no ruled line where stage meets cloud.
- **On the stage:** no lip under souls or the throne.
- **Off the stage:** the union's camp keeps G1's lip at its front souls' feet, since they stand on cloud.
