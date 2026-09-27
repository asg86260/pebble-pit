# The serpent's fighters: every branch, what it does, what it plays with

*Design, not built. The detail of "Fighters in slots" in DESIGN.md. Asked by
the owner 2026-09-26: "before we build i want to fully detail out the
branches, what they do and how they interact with eachother."*

The owner's calls, 2026-09-26:

- One fighter a station. **Every fighter starts as the same base fighter**;
  the station makes them what they are.
- Each station's fighter specs into **a branching tree**. **Respecs are
  free.** The spec **belongs to the station**, not the fighter.
- **Four fighters** at most (the sqwife, then a slot for each fang from the
  first three phases), five stations: one always stands empty.
- **Fighters fight on their own**; the click is a strike on top.

Every number here is a first pass for the ladder book, written so the
shapes can be argued before the values are.

---

## 1. How a station's tree works

A fighter who swims to a station takes up its **style**: the altar's fists,
the well's lance, the armory's grenade, the circle's sigil, the spire's beam.
That is rung 0, the base fighter at that station.

The station has **one ladder of eight rungs** (`LADDER`), bought with coins
like every ladder (`tierRows`, `named` bands, a written table in `LADDERS`:
scales; then scales and dust; then scales, dust and ore; then a spark on the
top band). The rungs are the station's **depth**. What the rungs *do* is the
**branch**:

```
                    rung 0: the station's style
                              |
            +-----------------+-----------------+
            |                 |                 |
        branch I          branch II        branch III       <- pick one, free to change
            |                 |                 |
     rungs 1-3: its stat grows
            |
     rung 4: KEYSTONE -- the branch's new mechanic
            |
     rungs 5-7: its stat grows
            |
     rung 8: CAPSTONE -- a fork, pick A or B, free to change
```

- **Pick one branch** a station. The other two show on the board, shut.
- **Free respec.** Changing branch or capstone costs nothing and takes the
  fighter a moment at the station (they are seen changing kit; nothing pops).
  The rungs bought stay: they are the station's depth, read by whichever
  branch is chosen. So respeccing is a tactic for a phase, not a loss.
- **The spec belongs to the station.** A fighter who swims to another
  station takes up *that* station's depth and branch.
- **One bill for the ladder, not three.** Since the rungs serve every
  branch, the station's eight rungs are bought once. Exploring the tree is
  free; deepening it costs.

Why this shape: a keystone at rung 4 is where a branch stops being a number
and becomes a way of fighting; a fork at rung 8 is a last choice about what
the party needs. Two choices a station, free to change, is enough to make
four stations a build without making it a spreadsheet.

---

## 2. The words the branches are written in

Every interaction below goes through one of these. Nothing talks to another
station directly; it leaves a **status** on the serpent or a **length** of
it, and other stations read the status. That is what keeps fifteen branches
from being a hundred special cases.

| term | what it is | made by | lasts |
|---|---|---|---|
| **blow** | one hit that lands whole: a punch, a grenade's burst (with Concussion), a crush, the star | fists, crush, star | -- |
| **tick** | damage that lands a little at a time: a bleed, a beam | lance, beam | -- |
| **length** | a fifth of the coil (`SPLIT_LENGTHS`), the unit a status sits on, in every phase | -- | -- |
| **Stunned** | the serpent seizes; **its heal stops** | a blow worth `STUN_SHARE` of the phase's depth (C + D) | `STUN_BASE_S`, longer for a bigger blow, to `STUN_MAX_S` |
| **Chipped** | a bite out of a length's hide; **takes more from everything** | a blow's bite (C), Shrapnel, Breaker | `CHIP_S` |
| **Bleeding** | a lance's ticks on a length | lance | its bleed's time |
| **Held** | a length that **cannot thrash or heal** | sigils, Harpoon | its hold's time |
| **Lit** | a length the dark does not hide (the fading phase hits it whole) | beam, Flare | while lit |
| **heal cut** | the heal is slower everywhere | sigils, Curse, Drag | while it stands |

**The rules that stop loops**

1. **Only blows stun.** Ticks never do: a bleed or a beam cannot start a
   stun, however big. Payouts of ticks (Rupture) are ticks.
2. **A stun does not stack.** A new stun while one is running sets the time
   left to the longer of the two, and never past `STUN_MAX_S`.
3. **After a stun, a short grace** (`STUN_GRACE_S`) where no stun can start,
   so a party cannot hold the heal off forever. *(The sky rule's cousin: the
   serpent is beatable if you invest, never trivial.)*
4. **Amps add, then multiply once.** Every "takes more" (Chipped, Lit with
   Lantern, Tether...) adds into one amp a length, capped at `AMP_MAX`
   (+100%), applied once to each hit.
5. **Heal cuts add, capped** at `HEAL_CUT_MAX` (80%). A stun is the only way
   to stop the heal outright.

---

## 3. The phases, and which branch answers each station's bad one

Each station does **half** in one phase, whole in the rest (`SERPENT_DEFENSE`
rewritten, no walls). One branch's keystone lifts it:

| phase | what it does | whose bad phase | the answer |
|---|---|---|---|
| **bare** | only heals | the circle (nothing to hold that matters) | Crushing |
| **warded** | a shimmer blows glance off | the altar | Brute (a haymaker breaks through) |
| **splitting** | heals as five lengths, each on its own | the well, the spire | Barbed; Fork |
| **fading** | an unlit length takes half | the armory | Flare |

---

## 4. The stations

Base numbers are per fighter at rung 0. "Stat" is what rungs 1-3 and 5-7
raise, each about +15% on the last.

### The altar: fists

*Base:* a punch every 1 s where the coil is nearest. Blows; a punch alone
stuns only the bare coil, late in its ladder.
*The click* is a punch.

**I. Brute -- make the stuns.** Stat: blow damage.
- *Keystone, Haymaker:* every fifth punch is a haymaker, ×4 damage, one
  blow. A haymaker is not glanced by the ward (the altar's answer to the
  warded phase).
- *Capstone A, Aftershock:* stuns this fighter starts last +50%.
- *Capstone B, Shatter:* a haymaker on a stunned serpent does ×2, and ends
  the stun. A cash-in: trade the heal-stop for one enormous blow.

**II. Flurry -- feed the party.** Stat: punch rate.
- *Keystone, Knock Loose:* each punch sheds +1 scale. The economy branch:
  every other station's rungs come sooner.
- *Capstone A, Frenzy:* punch rate +50% while the serpent is stunned.
- *Capstone B, Pickpocket:* a punch on a Chipped length sheds ×3 scales.

**III. Breaker -- open the hide.** Stat: chip size.
- *Keystone, Open Wound:* every punch Chips its length, and Chipped lasts ×2.
- *Capstone A, Splinter:* a Chip spreads to the lengths either side.
- *Capstone B, Expose:* a Chipped length is not warded -- for everyone. The
  party's answer to the warded phase, not just the altar's.

### The well: lance

*Base:* a lance thrown every 3 s; it sticks in a length and bleeds for 6 s.
Up to three lances in at once. Ticks: never stuns.
*The click* throws a lance where it lands.

**I. Barbed -- cover the coil.** Stat: bleed damage.
- *Keystone, Barbs:* a bleed also ticks on the lengths either side, at half.
  The well's answer to splitting: every length that heals on its own bleeds.
- *Capstone A, Hemorrhage:* a bleed on a Chipped length ticks ×2.
- *Capstone B, Chain:* a new lance moves the oldest bleed to the length that
  has none, so the bleeds spread themselves over all five.

**II. Deep -- cash in the stun.** Stat: bleed time.
- *Keystone, Open Veins:* bleeds tick ×2 while the serpent is Stunned.
- *Capstone A, Rupture:* when a stun starts, every bleed pays out what it
  had left at once (a tick, so it cannot stun).
- *Capstone B, Long Cuts:* bleeds do not run down while the serpent is
  Stunned.

**III. Harpoon -- pin it.** Stat: lances in at once.
- *Keystone, Pin:* a length with a lance in it is Held.
- *Capstone A, Tether:* a Held length takes +25% from blows.
- *Capstone B, Drag:* each pinned length cuts the heal 5%.

### The armory: grenade

*Base:* a grenade every 6 s; its burst's rings hit every length they cross.
Each length's hit is its own (not one blow, so it stuns only with
Concussion).
*The click* throws a grenade.

**I. Shrapnel -- chip everything.** Stat: burst reach.
- *Keystone, Shrapnel:* every length the burst crosses is Chipped.
- *Capstone A, Cluster:* the burst throws three bomblets that burst again at
  40%.
- *Capstone B, Needles:* the shrapnel stays in as a short bleed on every
  length it chipped (it reads as a lance's bleed: Hemorrhage, Open Veins,
  Knot all apply).

**II. Concussion -- stun from range.** Stat: burst damage.
- *Keystone, Concuss:* the whole burst is one blow, and it needs only three
  quarters of the stun's share to stun.
- *Capstone A, Ringing:* grenades come twice as fast while the serpent is
  Stunned.
- *Capstone B, Depth Charge:* a burst on a Held length does ×2.

**III. Flare -- light it up.** Stat: how long a length stays Lit.
- *Keystone, Flare:* every length the burst crosses is Lit. The armory's
  answer to fading.
- *Capstone A, Magnesium:* a Lit length takes +20% from everything.
- *Capstone B, Afterglow:* Lit lasts ×3 and a Lit length cannot thrash.

### The circle: sigil

*Base:* a circle drawn under the coil every 8 s; the length over it is Held
for 6 s and heals 12% slower everywhere while it stands; the circle grinds
it for a little. Up to three circles. The only station whose base is mostly
support: its base damage is the grind.
*The click* draws a circle where it lands.

**I. Binding -- starve the heal.** Stat: circles at once.
- *Keystone, Seal:* each circle's heal cut ×2.
- *Capstone A, Knot:* while three or more circles stand, bleeds tick +50%.
- *Capstone B, Lockdown:* a stun lasts +1 s for every circle standing (still
  capped).

**II. Crushing -- hit hard, slowly.** Stat: crush damage.
- *Keystone, Crush:* when a circle's hold ends it crushes the length: one
  blow, big enough to stun. The circle's answer to the bare phase.
- *Capstone A, Grind:* the crush Chips the length, and its neighbors.
- *Capstone B, Implode:* the crush on a Lit length does ×2.

**III. Resonance -- make every blow count.** Stat: hold time.
- *Keystone, Resonance:* any blow on a Held length does +30%.
- *Capstone A, Anchor:* while any length is Held, a stun lasts +30%.
- *Capstone B, Echo:* a circle drawn under a bleed doubles its time.

### The spire: beam

*Base:* a beam held on one length, ticking; it Lights what it touches
(`BEAM_LIGHT`). Ticks: never stuns.
*The click* moves the beam to where it lands.

**I. Lantern -- the light as a weapon.** Stat: light width.
- *Keystone, Lantern:* a Lit length takes +15% from everything.
- *Capstone A, Searchlight:* the beam sweeps the whole coil every 8 s,
  lighting all of it as it passes. The party's answer to fading.
- *Capstone B, Glare:* a Lit length heals half as fast.

**II. Curse -- the heal itself.** Stat: heal cut.
- *Keystone, Hex:* the beam's curse cuts the heal, stacking with the
  circle's under the one cap.
- *Capstone A, Wither:* a stun leaves a 20% heal cut behind it for 10 s.
- *Capstone B, Doom:* the beam ticks ×2 while the serpent is Stunned.

**III. Fork -- two at once.** Stat: beam damage.
- *Keystone, Fork:* two beams, on two lengths. The spire's answer to
  splitting.
- *Capstone A, Prism:* a beam through a Lit length splits to its neighbors.
- *Capstone B, Conduit:* a beam on a length with a lance in it ticks that
  bleed ×2 as well.

---

## 5. Who feeds whom

Rows make a status, columns spend it. A mark is a branch that turns the
status into damage or time.

| makes ↓ / spends → | altar | well | armory | circle | spire |
|---|---|---|---|---|---|
| **Stunned** (altar: Brute; armory: Concussion; circle: Crushing; the star) | Shatter, Frenzy | Open Veins, Rupture, Long Cuts | Ringing | Lockdown, Anchor | Doom, Wither |
| **Chipped** (altar: Breaker; armory: Shrapnel; circle: Grind) | Pickpocket, Expose | Hemorrhage | -- | -- | -- |
| **Held** (circle: base; well: Harpoon) | -- | -- | Depth Charge | Resonance | -- |
| **Lit** (spire: base; armory: Flare) | -- | -- | Magnesium | Implode | Lantern, Prism |
| **Bleeding** (well: base; armory: Needles) | -- | Barbs, Chain | -- | Knot, Echo | Conduit |
| **heal cut** (circle: base; spire: Curse; well: Drag) | -- | -- | -- | Seal | Hex |

Every station both makes something and spends something, so no station is
only a battery, and every status has at least two makers, so no party is
locked out of a plan because one station is the empty one.

---

## 6. Parties it makes

Four fighters, five stations: one left out each time.

- **Stun-lock** -- altar (Brute, Aftershock), armory (Concussion, Ringing),
  circle (Binding, Lockdown), well (Deep, Open Veins). The heal is off most
  of the fight; the bleeds and blows land while it is. Leaves out the spire,
  so the fading phase is at half until the player respecs the armory to
  Flare for it -- the respec is the plan.
- **Shred** -- altar (Breaker, Expose), armory (Shrapnel, Needles), well
  (Barbed, Hemorrhage), circle (Resonance). Everything Chipped, everything
  bleeding. Strong through the ward (Expose) and the split (Barbs).
- **Starve** -- circle (Binding, Seal), spire (Curse, Hex), well (Harpoon,
  Drag), altar (Flurry). The heal never gets going; slow, cheap, and the
  scales pile up from Flurry.
- **Light** -- spire (Lantern, Searchlight), armory (Flare, Magnesium),
  circle (Crushing, Implode), altar (Brute). The fading phase's party.
- **The first fighter alone** -- any station breaks the bare coil; the
  sqwife at the altar on Brute is the one a player will likely find first.

---

## 7. What it needs from the build

- **Per-length state** (`S.lengths`: chip, held, lit, bleeds), saved or
  ephemeral per field, in state.js's lists.
- **One hit path** (`strike` in deep/serpent.js) that asks the amps and the
  phase, and marks blows vs ticks.
- **The stun** (C + D), built first, with `STUN_GRACE_S`.
- **The boards:** one ladder a station, a branch picker (three rows, one
  open), a capstone picker at rung 8; the fighter's slot on the pods' board.
- **Checks:** one feature file a station, each winning a phase on its own
  branch; one file for the interactions -- a Chip seen by Hemorrhage, a stun
  seen by Open Veins -- bought the player's way.

## 8. Open for the owner

1. **Is the station's ladder one ladder for all three branches** (above:
   rungs bought once, the branch free), or does each branch climb its own
   ladder (three times the bills, and a respec means the other branches are
   still at the foot)? Recommended: one ladder. Free respec only means
   something if the other branch is as deep as this one.
2. **The grace after a stun** (rule 3). Without it, a stun-lock party stops
   the heal outright forever. Recommended: keep it, a few seconds.
3. **The click in each style.** Above, the click is always the station's own
   attack where the sqwife is. Should the click be the sqwife's wherever she
   stands, or always a punch?
