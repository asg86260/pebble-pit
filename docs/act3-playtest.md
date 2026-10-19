# Act 3 playtest notes

What to know before playing act 3 (the afterlife, the union). It is behind
`AFTERLIFE_ON`, and a dev build turns that on, so `npm run dev` and
`play.html` reach it.

## Getting in

1. Open the dev panel (backtick), go to the **scenes** tab, find **the acts**.
2. **act3-start**: a rich yard just after act 2's finale. The two of them are
   home and the **go on** card is up over the house. Click it and act 3
   starts from the beginning.
3. **act3-mid**: the opening already played. The saw mill, chipper and
   workshop are standing with their posts filled, a fifth of God's yard has
   walked out, and the axe is in hand. The paper mill and the press are
   still to buy.

The other act 3 scenes are for looking at, not playing: `act3-pedestal`
(the climb onto the pedestal), `act3-speech-warned`, `act3-speech-held`,
`act3-wardens`, plus the older `after-*` ones.

A scene replaces the save in that tab. Use `save a copy` first if you want
your own yard back.

## How it plays

- **The opening**: the house falls, the souls rise through the tear, they
  meet God, and they refuse. Each beat is a letterboxed cutscene with a
  caption. A click or holding space speeds a beat up. Nothing gets cut.
  After the refusal the two of them climb onto the pedestal, and six
  members walk out of God's yard to the camp.
- **Rebel** is the act's own coin. Pop the speech bubbles rising off the
  pair (a big one pays five lines), or click the pair. Rebel drifts down to
  the pile at the pedestal's foot and only counts once it lands.
- **The yard pays too**: every bill also takes dust, crops, ore or sparks
  from the yard, which keeps running underneath. The coins fly up through a
  thin patch in the cloud floor.
- **Hand work**: click a station to open its card, then make the motion on
  the card's big part. The faster you go, the more it does, up to a cap.

| station | the hand's motion | what it turns into what | its card sells |
|---|---|---|---|
| pedestal | pop bubbles | speech into rebel | bigger speech, agitator posts |
| grove (tree) | drag the saw back and forth (axe needed) | tree into logs; the stump stays | the axe, plots, faster growth, bigger trees, stump removal, woodcutter and hauler posts |
| grove (stump) | hold the grip up for one root at a time, or yank it as it wobbles | stump out, sapling in | |
| shack | none | builds every other station; a member raises it piece by piece, or the pair do if the camp is empty | the five stations |
| saw mill | spin the flywheel | log into timber and sawdust | second blade, bigger heap, sawyer posts |
| sawdust heap | drag a load to the edge (a fling tips up to three) | tips sawdust through the notch while there's no paper mill | |
| chipper | hold the feed down | log into sawdust | second drum, wider spout, feeder posts |
| paper mill | stir the vat | sawdust into paper | bigger vat, drying line, pulper posts |
| workshop | tap the nails | timber into signs | second bench, bigger sign, joiner and carrier posts |
| press | pull the bar down | paper into posters | bigger stack, bigger poster, printer and paster posts |

- **Posts**: buying a post on a card sends a member from the camp to stand
  there. With nobody waiting, the post stays empty until someone arrives.
- **Winning souls**: carriers plant signs in the crowd, and a sign inks the
  rims round it all the way. Pasters put posters on the fence, and a poster
  inks its file halfway. Once a soul's rim is fully inked it walks out to
  our crowd behind the camp.
- **The gates**, by how much of God's yard has walked out:
  - the meeting, at 12 members;
  - the slowdown, at 40%: the speech comes twice as often and there are
    more wardens;
  - the strike, at 80%.
- **God's pushback**:
  - The throne's speech comes every 150 s. Its band of files is framed for
    6 s first, then washed white, and every half-won soul in the band goes
    back to pale. Any sign in the band is knocked askew until a carrier
    straightens it.
  - Wardens walk down from the throne to tear posters off the fence and
    carry signs back up.
- **The strike** plays once the last gate is reached, then **the
  unmasking**, then Satan's line and the stair down (hell, act 4).

## Placeholder

- **Art**: God and Satan are a block throne with a glare. The strike and
  the unmasking are a caption over the throne, with no drawing of their
  own yet. The pair on the pedestal are plain squares.
- **Words**: every word is a plain label in `locales/en.ftl`, waiting for
  your wording.
- **Numbers**: every number is a default for the pacing tool (another
  track is on it).
- **Sound**: act 3 has none.

## Known rough edges

- **Boards** (track C, 2026-10-18): a station's board opens in the yard's
  sheet through `openAfterBoard(key)` (after/rows.js), which Track A's plain
  click on a station calls; until that click is wired, `__openAfterBoard('mill')`
  from the console opens one. Bills buy through the board and show the act's
  coins as marks.
- **The first stretch is slow.** With the starting six members, one plot
  and one woodcutter, the first signs win few souls. In the end-to-end
  check, the meeting comes about 25 minutes in and the strike about an
  hour in, even with rebel for the chain handed over. The first members
  also have to fill every post themselves.
- **The pedestal hand-off**: as the two of them fade into the pedestal's
  squares, the second one is a cell off its square.
- **Act 3 beats**: the letterbox now lifts the camera so the floor shows,
  but part of the cloud floor can still sit under the foot band.
- Bubbles in the air are lost on a reload (they are a moment, not a
  holding). Rebel already falling is kept.
