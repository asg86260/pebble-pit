# The serpent's fighters, as classes: research and ten classes

*Design, not built. The owner votes on it at https://claude.ai/artifact/9LFYdaJfrrK7Y3QdmrSkKM (the page's votes are the record). Asked by the owner 2026-09-26: "can you do a round of
research in other rpg type games and different fighitng styles we could
introduce? and then 3 distinct branches for each one? brawler, monk,
martial arts, swords, explosives, magical, debuffs, buff other attackers,
ranger, assasin. im thinking fire emblem type classes." This supersedes the
five station styles of `docs/serpent-branches.md` if the owner takes it; the
tree shape, free respecs, the spec belonging to the station, four fighters
and the loop rules carry over unchanged.*

## 0. Simplified: one ladder a class (the owner, 2026-09-27) -- CANON

"this game isnt really about the fighting or classes. so we should keep it
simple. simpler the better." **This section overrides the branches,
keystones and capstone forks below**; the ten classes, their kits, the
stations and pairs, the fangs and slots, the rails and the refund reset
all stand.

- **Ten classes, one ladder each.** No branches, no capstone forks. Rungs
  1-8 raise the class's numbers; **rung 4** gives its one signature move;
  **rung 8** one capstone, a stronger form of it. The only choice is which
  class stands at a station.
- **The kit grows twice**: a mark at rung 4, a touch at rung 8.
- **The tree**: one rail a class, two a station; it folds to the class
  bought, and the reset refunds it.
- **Statuses trimmed** to what the ten moves use: Stunned, Bleeding,
  Exposed, Held, Weakened on the serpent (all on the whole snake; Lit
  dropped with the Mage's beam, 2026-09-28);
  Inspired and Hasted on fighters. Poisoned, Burning, Marked and Keen go.
- **No "whole coil" effects**: the serpent's lengths only matter to the
  splitting phase's heal, and a status or a blow is on the whole snake.

| class | base | rung 4 | rung 8 |
|---|---|---|---|
| Brawler | heavy punches | **Combos**: every 4th punch is a haymaker, x4 | **Knockout**: the haymaker stuns |
| Swordsman | cuts | **Whirlwind**: each cut lands at three spots | **Weak points**: every 3rd cut lands twice, the second leaving Bleeding |
| Monk | palms build chi; a chi palm stuns | **Deep breath**: chi fills twice as fast | **Still water**: the chi palm stuns longer |
| Martial Artist | quick thrusts charge a finisher | **Flourish**: thrusts charge double | **Rally**: the finisher Hastes the party |
| Ranger | arrows from overhead | **Aimed shot**: every 5th arrow x2 | **Pinning shot**: the aimed shot stuns |
| Assassin | daggers, x3 on a stunned serpent | **Execution**: daggers grow with the wound | **Serrated**: daggers leave Bleeding |
| Sapper | thrown charges | **Sticky bombs**: stuck, ticks down, one big stunning blow | **Pair**: two charges at once |
| Hexer | hexes | **Wither**: hexes Weaken the heal | **Binding**: hexes stop the heal (Held) and lay Exposed |
| Mage | a held beam, then a finishing blow | **Widening**: the beam widens and ramps | **Thermite**: the finishing blow ignores the phases' toughness |
| Bard | sings: the party Inspired (no damage) | **Anthem**: Inspired doubles | **Refrain**: Inspired lingers after the song |

The rungs as changed by the owner's notes on the wording audit
(2026-09-28): the stun moved to the Brawler's capstone, the Swordsman's
bleed to his, the Ranger's aimed shot to x2, the Assassin's capstone to a
bleed, the Hexer's ladder to damage / Weaken / stop-the-heal-and-Expose,
and the Sapper's charge no longer Exposes. Held stops the heal and nothing
else.

---

## 1. What the research found

Six games, each with one idea worth taking. None is copied whole.

**Fire Emblem -- the promotion fork.** A unit starts in a base class and
promotes into one of two advanced classes: a Myrmidon becomes a Swordmaster
or an Assassin, a Fighter a Warrior or a Hero. The base class is the
commitment to a weapon; the promotion is the commitment to a way of using
it. Units fighting beside each other build **supports**, and a supported
pair fights better together. The Dancer's whole job is to give another unit
its turn back. *Taken:* base fighter, then a class at a station, the
station's two classes as a promotion fork; a support class that makes other
fighters act more; pairs that are better together.
([Myrmidon](https://fireemblem.fandom.com/wiki/Myrmidon),
[Swordmaster](https://fireemblem.fandom.com/wiki/Swordmaster),
[class change](https://fireemblemwiki.org/wiki/Class_change))

**Diablo II -- three trees a class.** Every class has exactly three skill
trees, and each tree is a way to play, not a pile of stats: the Assassin's
are Martial Arts (charge-ups and finishers), Traps, and Shadow Disciplines
(buffs and tricks). *Taken:* three branches a class, each a playstyle; the
charge-up-and-finisher shape for the martial artist.
([Assassin skills](https://diablo2.wiki.fextralife.com/Assassin+Skills),
[Maxroll overview](https://maxroll.gg/d2/resources/assassin-overview))

**Darkest Dungeon -- makers and spenders, a party of four.** Four heroes, and
the synergy is statuses: the Occultist **marks** a target and the Arbalest
and Bounty Hunter do far more to marked targets; stunners set up the damage
dealers; the Man-at-Arms buffs the whole party. *Taken:* a party of four
(ours is four fighters already), and every interaction as a status one class
makes and another spends -- the rule `docs/serpent-branches.md` was already
written on, now with a **Mark**.
([Mark](https://darkestdungeon.fandom.com/wiki/Mark),
[class synergies](https://steamcommunity.com/app/262060/discussions/0/487870763311099116/))

**Final Fantasy Tactics -- jobs with a feel.** The Monk hits hard and
restores itself with its own martial arts; the Bard sings party buffs
(haste, regen); the Dancer debuffs every enemy while she dances; the Ninja
doubles its attacks; the Samurai draws a blade's spirit out for area
effects. *Taken:* a monk who is not just a puncher (inner power, tempo);
buffs and debuffs as songs and dances that stand while the fighter keeps
at it.
([FFT jobs](https://finalfantasy.fandom.com/wiki/Final_Fantasy_Tactics_jobs),
[jobs guide](https://www.rpgsite.net/guide/18138-final-fantasy-tactics-the-ivalice-chronicles-jobs-guide))

**World of Warcraft -- three specs, three roles.** Each class has three
specializations and they are often three *roles*: the Monk is Windwalker
(damage), Brewmaster (tank), Mistweaver (support). *Taken:* where a class
has room, one of its branches leans to the party rather than its own hits.

**Hades -- duo boons.** Two gods' boons together unlock a third that belongs
to neither. *Taken, optional:* **duets** -- a named bonus when two
particular classes are both in the party (section 6).

Lessons that shape everything below:

1. **Makers and spenders.** A status one fighter leaves and another cashes
   in is what makes a party more than four damage numbers.
2. **Charge, then spend.** A build-up and a finisher reads as a fighting
   style in a game where nobody presses buttons -- the idle player watches
   the bar fill and the big hit land.
3. **Every class needs a party branch.** In each class one branch helps
   the others, so even a single class has something to say to the party.
4. **A promotion is a commitment, a branch is a tactic.** The class is the
   weapon; the branch is the day's plan; both free to change, but only the
   rungs cost.

---

## 2. The shape: base fighter, station, class, branch

```
  base fighter (every fighter, the sqwife too)
        |
  swims to a station  ->  promotes into one of the station's two classes
        |
  the class's three branches: keystone at rung 4, capstone fork at rung 8
```

Five kinds of station, two classes each, is the Fire Emblem fork on the
deep's floor. **The pairs are the owner's (2026-09-27)**; which building
hosts which pair is a proposal:

| station | what it is | its two classes |
|---|---|---|
| **the altar** | the front line | **Brawler** · **Swordsman** |
| **the well** | the discipline | **Monk** · **Martial Artist** |
| **the armory** | from afar and from the shadow | **Ranger** · **Assassin** |
| **the circle** | the saboteurs | **Hexer** · **Sapper** |
| **the spire** | the abyss's voice | **Mage** · **Bard** |

**A station can be built more than once** (the owner, 2026-09-27: "you can
build more than one of the same, since they have diff branches"). Two
altars can hold a Brawler and a Swordsman, or two Brawlers on two branches.
One fighter a station still; four fighters at most. **Each station is its
own** (the owner: "Each station is independent. Even if it's the same type
of station"): its own ladder of eight, bought for that building, its own
class, branch and capstone. Respec is free: class, branch and capstone.
A second station of a kind costs the same as the first.

---

### How the tree is shown: rails (voted 2026-09-27)

The station's board shows the **whole tree, always**: both classes, all six
branches, every rung, the keystones and the capstone forks
(`docs/mocks/tree-2026-09-27.html`, option 2, "Rails"). One row a branch,
grouped under its class; eight pips along each row reading left to right,
the keystone and the capstone fork as bigger nodes on the rail. A panel
beside the rails writes out the effect of whatever is hovered or last
tapped, so a phone, which has no hover, reads every effect; at phone width
the panel drops under the rails. The rungs bought are lit along the chosen
path.

**The reset is one control: it refunds the whole tree** (the owner: "Let's
make the reset just a full tree reset. Nothing fancy", and "Just refund the
spec tree and keep going"). Every rung bought on the station comes back,
the depth goes to nothing, and the tree is blank again. **Hover and panel
text is concise** (the owner, 2026-09-27): a node's name and what it does in
a few words, nothing about the system. **The rails collapse to the path taken** (option 2b, voted 2026-09-27).
A tap or hover on a class, branch or capstone arm only views it: its line
shows and the other choices fade, but stay. Buying commits: the first rung
bought on a blank tree takes the viewed class and branch, and the other
class and branches fold away; buying rung 8 takes the viewed capstone and
the other arm folds. The Buy button names what it buys (`Buy Pummel 8 ·
B`). Reset tree refunds everything and unfolds the tree blank.

## 3. The words the classes are written in

On the serpent (or a length of it, a fifth of the coil):

| status | what it does | stacks |
|---|---|---|
| **Stunned** | the heal stops. Only a *blow* starts it (C + D) | no; refreshes to the longer |
| **Exposed** | takes +25% from everything (the old Chipped) | no |
| **Marked** | the next hits from certain classes do much more | no; one mark a length |
| **Bleeding** | ticks a while | up to 5 |
| **Burning** | ticks, and spreads to the next length when it ends | up to 3 |
| **Poisoned** | ticks, harder with every stack; cut the heal 3% a stack | up to 10 |
| **Held** | the length cannot thrash or heal | no |
| **Lit** | the fading phase hits it whole | no |
| **Weakened** | the heal is cut (every heal cut adds, capped) | adds |

On a fighter:

| status | what it does |
|---|---|
| **Inspired** | +damage |
| **Hasted** | attacks more often |
| **Keen** | +critical chance (a crit is ×2) |
| **Charged** | the class's own build-up, spent by its finisher |

The loop rules of `docs/serpent-branches.md` hold: only blows stun, stuns do
not stack, a grace after each stun, amps add then multiply once (capped),
heal cuts add (capped). Ticks never stun and never crit.

---

## 4. The ten classes

*The station headings below are the first draft's pairs; the owner re-paired
the classes on 2026-09-27 (section 2). The classes and branches are
unchanged.*

Each: what it is, what it came from, its base attack, and three branches.
*K* is the keystone (rung 4), *A* / *B* the capstone fork (rung 8). One line
each; the numbers are first passes.

### The altar

#### Brawler -- strength. *(FE Fighter/Warrior; DD's stun-dealers)*
Base: a heavy punch every 1.2 s. Blows. The party's stun-maker.

- **Pummel -- the stun.** *K:* every fourth punch is a haymaker ×4 that
  breaks the ward. *A:* stuns you start last +50%. *B:* a haymaker on a
  Stunned serpent does ×2 and ends the stun.
- **Rage -- worse as it goes.** *K:* each punch in a row adds +5% damage,
  up to +60%; a stun resets it. *A:* at full rage, punches Expose. *B:* at
  full rage, the party is Inspired.
- **Bruiser -- open it up.** *K:* every punch Exposes its length. *A:*
  Exposed spreads to the lengths either side. *B:* an Exposed length cannot
  be warded, for everyone.

#### Martial Artist -- technique. *(D2 Martial Arts: charge-ups and finishers; FFT Ninja)*
Base: quick strikes, 3 a second, light. Each strike Charges her (up to 5);
at 5 she spends it on a finisher, a blow of all five together.

- **Flow -- the combo.** *K:* a finisher's charges count double. *A:*
  finishers come at 4 charges. *B:* a finisher Hastes the party for 3 s.
- **Pressure Points -- the precise.** *K:* finishers Mark the length they
  hit. *A:* a finisher on a Marked length stuns at half the share. *B:*
  finishers Weaken (heal cut 10%, 8 s).
- **Counter -- the thrash's answer.** *K:* when the serpent thrashes (the
  splitting phase's ripple), she strikes back at once with a full finisher.
  *A:* a counter Stuns. *B:* each counter Charges the party's other
  fighters' own build-ups by one.

### The well

#### Swordsman -- the blade. *(FE Swordmaster: crits; FFT Samurai: drawn spirit)*
Base: a cut every 1.6 s that leaves a short Bleed. Blows that bleed.

- **Swordmaster -- crits.** *K:* +25% crit; a crit's bleed is doubled.
  *A:* crits on a Stunned serpent always land. *B:* each crit makes her
  Keen, stacking, until she misses a crit.
- **Whirlwind -- the wide cut.** *K:* each cut hits the lengths either
  side. The well's answer to splitting. *A:* every third cut hits every
  length. *B:* cuts spread Bleeding already on a length to its neighbors.
- **Iaido -- the drawn blade.** *K:* she stops cutting to draw for 4 s,
  then one blow of everything the 4 s would have done, ×1.5. *A:* the draw
  stuns at half the share. *B:* the draw Inspires the party for 6 s.

#### Assassin -- the finisher. *(FE Assassin: lethal strike; D2 Shadow; DD Bounty Hunter on Marks)*
Base: a stab every 1.5 s; ×3 on a Marked or Stunned length.

- **Execution -- the kill shot.** *K:* stabs do more the deeper the wound
  (up to ×2 at the break). *A:* the phase's last tenth, her stabs do ×3.
  *B:* a stab that breaks a phase refunds her ladder's last rung (the fang
  comes, and a rung free).
- **Venom -- the slow death.** *K:* each stab Poisons (a stack). *A:* at
  ten stacks, Poison stops the heal as a stun does (no stun, no grace). *B:*
  Poison spreads to the next length when it would fall off.
- **Shadow -- the mark.** *K:* she Marks the length she stabs, and the Mark
  stays after. *A:* a Mark doubles crits for everyone. *B:* she vanishes
  (no stabs) for 3 s, then her next stab is ×6.

### The armory

#### Sapper -- explosives. *(D2 Traps; FFT Chemist; the grenades that stand today)*
Base: a charge thrown every 6 s; its burst hits every length it crosses.

- **Demolition -- the one big boom.** *K:* the whole burst is one blow, and
  stuns at three quarters of the share. *A:* bursts come twice as fast while
  Stunned. *B:* a burst on a Held length ×2.
- **Incendiary -- the fire.** *K:* the burst sets every length it crosses
  Burning. *A:* Burning spreads twice as fast. *B:* a Burning length is Lit.
- **Sticky Charge -- the saboteur's gift.** *K:* a charge is stuck to the hide
  and ticks down; it blows as one blow, bigger the longer it was left,
  and stuns. (Replaces Minefield, the owner 2026-09-27.) *A:* two charges
  stuck at once, set off together. *B:* a charge blown on a stunned
  serpent Exposes it.

#### Ranger -- the shot. *(FE Archer/Sniper; DD Arbalest on Marks; WoW Hunter)*
Base: an arrow every 0.8 s from far off: small blows that never miss.

- **Marksman -- the shot that counts.** *K:* every fifth arrow is aimed, ×5,
  and crits on a Marked length. *A:* an aimed arrow Marks. *B:* an aimed
  arrow stuns at half the share.
- **Volley -- many arrows.** *K:* arrows fly three at a time over three
  lengths. *A:* each arrow that hits a Burning length spreads it. *B:*
  arrows Expose on a Stunned serpent.
- **Warden -- the flare and the net.** *K:* an arrow in a length Lights it.
  The armory's answer to fading. *A:* a net arrow every 10 s Holds a length.
  *B:* Lit lengths take +20% from arrows and beams.

### The circle

#### Hexer -- debuffs. *(DD Occultist; WoW Affliction; FFT Oracle)*
Base: a hex every 5 s on a length: Weakened (heal cut 10%, 8 s), a little
damage.

- **Affliction -- rot.** *K:* hexes Poison as well, 2 stacks. *A:* each
  Poison stack on the serpent is a 1% heal cut more. *B:* when a hex ends,
  it deals what its Poison would have done.
- **Binding -- the circle.** *K:* hexes draw a circle: the length over it is
  Held. *A:* Held lengths take +30% from blows. *B:* a stun lasts +1 s for
  every Held length.
- **Doom -- the mark of death.** *K:* the hex Marks. *A:* hits on a Marked
  length ignore the ward and the fading. *B:* a Mark, when it is spent,
  Weakens for 10 s.

#### Bard -- buffs the others. *(FE Dancer: another turn; FFT Bard; DD Man-at-Arms)*
Base: sings. Every fighter is Inspired (+10%) while she sings. She does no
damage of her own. The only class that makes the party better and nothing
else -- and so she is the one most worth a slot of four in the right
party.

- **Anthem -- more of everything.** *K:* Inspired doubles. *A:* the song's
  Inspiration stays 6 s after she stops (while she changes). *B:* the song
  reaches the star: it falls faster.
- **Tempo -- another turn.** *K:* every fighter is Hasted +20%. *A:* every
  10 s one fighter's build-up is filled (a finisher, a draw, a charge). *B:*
  stuns start by the party last +25%.
- **Requiem -- the dirge.** *K:* the song Weakens the serpent 15%. *A:*
  every tick on the serpent does +25% (bleeds, burns, poison, beams). *B:*
  the dirge stops the heal for 2 s whenever a phase's wound passes a
  quarter.

### The spire

#### Mage -- the abyss outward. *(FE Sage; WoW Fire/Frost; FFT Black Mage)*
Base: a bolt every 2 s, a blow; the bolt Lights where it lands.

- **Pyromancy -- fire.** *K:* bolts set Burning. *A:* Burning ticks ×2 on
  an Exposed length. *B:* a Burning length's fire, when it ends, bursts as a
  blow.
- **Storm -- lightning.** *K:* a bolt jumps to two more lengths. *A:* a
  bolt on a Held length jumps to all of them. *B:* every tenth bolt stuns.
- **Arcane -- the lamp.** *K:* the spire's light sweeps the whole coil
  every 8 s: all Lit. The spire's answer to fading. *A:* Lit lengths take
  +15% from everything. *B:* Lit lengths heal half.

#### Monk -- the abyss inward. *(FFT Monk: hits and restores; WoW Windwalker/Mistweaver; D2 Assassin's charge)*
Base: palm strikes every 1 s that build **chi** (Charged); at full chi a
chi palm, a blow that stuns at three quarters of the share.

- **Windwalker -- the fist of the deep.** *K:* chi fills twice as fast.
  *A:* a chi palm hits every length. *B:* a chi palm on a Stunned serpent
  refills half her chi.
- **Stillness -- the held breath.** *K:* while she meditates between palms,
  the serpent is Weakened 20%. *A:* a stun she starts is not followed by
  the grace. *B:* she shares chi: a chi palm Charges every other fighter.
- **Harmony -- the party's pulse.** *K:* her palms Inspire the fighter who
  hit last. *A:* when any fighter lands a finisher, she gains a full chi.
  *B:* the party's stuns last +30%.

---

## 5. Who feeds whom

| status | made by | spent by |
|---|---|---|
| **Stunned** | Brawler (Pummel), Martial Artist (Pressure Points, Counter), Swordsman (Iaido), Sapper (Demolition), Ranger (Marksman), Mage (Storm), Monk, the star | Brawler (Pummel B), Swordsman (A), Assassin (base), Sapper (Demolition A), Ranger (Volley B), Monk (Windwalker B), Hexer (Binding B) |
| **Marked** | Martial Artist (Pressure Points), Assassin (Shadow), Ranger (Marksman A), Hexer (Doom) | Assassin (base), Ranger (Marksman), Martial Artist (Pressure A), Hexer (Doom A/B) |
| **Exposed** | Brawler (Bruiser, Rage A), Sapper (Minefield B), Ranger (Volley B) | everyone (+25%); Mage (Pyromancy A) |
| **Bleeding** | Swordsman | Swordsman (Whirlwind B), Bard (Requiem A) |
| **Burning** | Sapper (Incendiary), Mage (Pyromancy) | Ranger (Volley A), Mage (Pyromancy A/B), Bard (Requiem A) |
| **Poisoned** | Assassin (Venom), Hexer (Affliction) | Hexer (Affliction A/B), Bard (Requiem A) |
| **Held** | Hexer (Binding), Ranger (Warden A) | Sapper (Demolition B), Hexer (Binding A), Mage (Storm A) |
| **Lit** | Mage (base, Arcane), Ranger (Warden), Sapper (Incendiary B) | Ranger (Warden B), Mage (Arcane A/B); everyone in the fading phase |
| **Weakened** | Hexer, Martial Artist (Pressure B), Monk (Stillness), Bard (Requiem) | -- (it is the payoff) |
| **Inspired / Hasted / Charged** | Bard, Monk (Harmony), Brawler (Rage B), Swordsman (Iaido B), Martial Artist (Flow B, Counter B), Monk (Stillness B) | every fighter |

Every status has at least two makers from two stations, so the empty
station never locks a plan out.

## 6. Parties, and the duets

Four fighters, five stations, one class a station.

- **Execution** -- Hexer (Doom), Assassin (Shadow), Ranger (Marksman),
  Bard (Anthem). Marks everywhere, cashed in by stabs and aimed arrows.
  Leaves the altar empty.
- **Stun-lock** -- Brawler (Pummel), Sapper (Demolition), Monk (Harmony),
  Hexer (Binding). The heal is off; the grace is the only gap. Leaves the
  well empty.
- **Wildfire** -- Mage (Pyromancy), Sapper (Incendiary), Ranger (Volley),
  Bard (Requiem). Everything burning, the dirge feeding every tick.
- **Rot** -- Assassin (Venom), Hexer (Affliction), Bard (Requiem), Brawler
  (Bruiser). Poison stacked to ten, Exposed.
- **The sqwife alone** at any station breaks the bare coil; Brawler on
  Pummel is the plain one to find first.

**Duets** *(optional, Hades's duo boons, Fire Emblem's supports).* A named
bonus when two particular classes are both in the party. A few, to show the
shape:

- *Brawler + Monk, "Iron Palm":* a haymaker fills the Monk's chi.
- *Assassin + Hexer, "Death Sentence":* a Mark from either lasts twice as long.
- *Sapper + Mage, "Firestorm":* a burst on a Burning length stuns.
- *Swordsman + Bard, "Duel Song":* Iaido's draw is 2 s, not 4.
- *Ranger + Martial Artist, "Crossfire":* aimed arrows Charge her.

## 7. Open for the owner

0. **The first fighter's classes** -- answered 2026-09-27: the sqwife picks
   from **three: Brawler, Ranger, Mage**, one class of each of the altar,
   the armory and the spire. **The Bard unlocks after the first fighter**,
   so she never stands alone. **The other classes unlock when a second
   station is bought** (the owner, 2026-09-27: "This will make sure they
   have good damage as the first option"): the first fighter is always
   one of the three damage classes, and every class is open from the
   second station on. **A second station of a kind costs the same as the
   first** ("Don't matter").

1. **Ten classes on five stations, two a station** (above), or ten stations,
   or classes free of stations (the spec the fighter's, which undoes the
   call "the spec belongs to the station")? Recommended: two a station --
   Fire Emblem's fork, five buildings, and the empty station is still a
   choice.
2. **The pairs.** Brawler/Martial Artist, Swordsman/Assassin, Sapper/Ranger,
   Hexer/Bard, Mage/Monk. The Monk could as well sit at the altar; the
   spire keeps the altar about the hand and gives the spire a way to fight
   that is not a spell.
3. **Duets:** in, or kept for later? Recommended: later -- thirty branches is
   already the build; duets are the next layer once the classes play.
4. **The Bard does no damage.** She is only worth a slot in the right party.
   Keep that edge, or give her a small hit so a solo Bard can still break
   the bare coil? Recommended: a small hit, or the rule "any class alone
   breaks the first phase" fails.
