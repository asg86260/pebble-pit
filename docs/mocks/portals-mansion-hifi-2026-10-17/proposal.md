# Proposed addition to DESIGN.md, "Acts 3 and 4: the afterlife and hell"

*Not yet in DESIGN.md: text to append to the acts section once the owner has
voted on the mock in this folder (index.html, round 2). Every player-facing
word in the mock is a placeholder.*

---

**The portals and the mansion (proposed, 2026-10-17, from the owner's
"there should be portals to heaven and portals to hell" and "the game ends
with the squares getting a massive mansion to live in after freeing God").**

**A portal is the camera's, never a body's.** Each new place gets a standing
portal, as the deep has the wizards' portal: a way the player clicks and the
view ripples through, with the pointing hand at both ends until the first
round trip is made, then faded by opacity. That click is the only place the
ripple appears. No body ever goes through a portal: carriers, ghosts and the
freed souls walk the road, every step of it, so nothing teleports and the
carry keeps its length.

**Heaven's portal (H-A recommended).** A tear opens over the house's ruin
when the throne is empty and stays open after act 3, the way between the
yard and the union's camp. It is the wizards' portal's opposite: a white
mouth in the white sky, a soft cloud rim, a slow fringe whose every cell
eases on and off, and purple motes drawn up into it. A stair of cloud lets
down from its lower lip to the yard floor beside the rock, steps two cells
tall with an ink rim under each tread; the ghosts walk it. H-B, an upright
lens with a beam of light, is kept for the vote, but it has no road of its
own (the carriers would still need H-A's stair) and it reads as a white
flame, which is hell's signifier. Cloud, stair, motes and the calm fringe
are heaven's alone.

**Hell's portal (L-A recommended).** Burned open by Satan going ahead of
them (beat 8): a wide slit of white heat in the deep's floor that throws
its light up onto the deep above it. Black veins flow through it, its lip is
rock lit from below, embers rise and thin, a few purple cells sit on the
seam for Satan's magic, and there is no red. Its hand only appears from the
descent (beat 11). The carriers walk across the deep's floor and climb down
a cut ladder through the slit and back up it. L-B, a crater burned into the
yard by the ruin, is kept for the vote as **camera only**: the carriers never
use it, so the carry's length stands. The under-lit lip, the veins and the
embers are hell's alone.

**Amendments to beats 9, 11 and 16 and to the carry:**

- **Beat 9 (`ghost-road`):** the road down from the afterlife is a stair and a
  glide. The ghosts walk the stair from the tear to the yard floor beside the
  ruin; the player's view takes the portal's glide. (Replaces "a stair of
  cloud from the empty throne down to the yard, landing at the house's ruin"
  as the only way: the stair stays, landing beside the ruin, and the portal
  is added for the camera.)
- **Beat 11 (`descend`):** the way to hell is still the pit, the abyss, the
  deep and down through the deep's floor, on foot, now through the slit Satan
  burned there and down its cut ladder. The slit's portal is the camera's way
  between the deep and hell's first chamber, and its hand appears with this
  beat.
- **The carry ("the walk is the whole road, yard to hell"):** unchanged in
  length. Neither portal shortens it, because no body uses a portal; L-B in
  particular is camera only.
- **Beat 16 (`home-again`) needs rewriting** for whichever mansion wins. It
  says the builders put the house up again on its old ground. With the mansion,
  the builders take the mansion as a standing job from the cage's fall
  (beat 14), work it through the last stretch, and it tops out as the pair
  reach the gate. (Under C the old house is rebuilt on its old ground too, as
  the mansion's gatehouse.)

**The ending.** Freed, God gives them their lives back (beat 15): each rim
piece fades from grey to black in turn, and the outfit darkens with them. The
mansion is built by the player's own builders, however many there are. They
first carry the scaffold in pole by pole. Then they carry every piece from a
named pile (A: the rock that killed them; B and C: the yard's heaps), climbing
at the poles and along the planks, bottom course first, so it rises floor by
floor. At the top-out they carry the poles back out. The walk home is the
finale's: the crew fall in behind in two files. The ending is quieter than
the finale: one volley of fireworks at the gate, the crew drift back to work
because everything keeps running, and the freed souls walk down the stair
from the still-open tear and stand on the ground. The last held shot is the
pair walking to the bench under the door and sitting, then a window lighting,
then the sheet.

Three mansions, three silhouettes, each with something of theirs in view:

- **A, the manor of the rock:** towers, wings and a gate, built from the
  rock, with the old bench under the door.
- **B, the house, grown:** the old house at three times its size, with its
  door grown into the entrance.
- **C, the hall of every line:** a massive eight-floor block with a window
  for every line, and the old house rebuilt in front as its gatehouse.

**Renderer cost.** The ripple should snapshot the far place to an offscreen
canvas once when the glide starts and draw it through the circle; it should
not redraw the far place every frame. The mansion should be cached on its own
canvas and redrawn only when a piece is set.

**Calls for the owner:**

- H-A or H-B.
- L-A or L-B.
- Which mansion.
- Whether the tear stays open in the last scene.
- What the end sheet says.
- Whether generation ticks are whole cells (as drawn here, so nothing is
  finer than a cell) or the two-pixel marks the lineage design names.
