// The scrubbing house: its hood open to the sky and the bellows breathing under
// it. Extracted verbatim from render.js; behavior unchanged. Owns drawScrub and
// its private hood/leaf constants. The shared primitives (ctx, withRise,
// risingPlace) come from render.js, the core module.

import { DOOR_H, DOOR_W, P, SCRUB_ARM, SCRUB_CHUTE, SCRUB_FOLDS } from '../config.js';
import { inScrub } from '../scrubhouse.js';
import { S, floor, scrub } from '../state.js';
import { ctx, risingPlace, withRise } from '../render.js';

// The scrubbing house: a hood open to the sky, and a bellows breathing under it.
//
// It is the only building in the yard that takes anything in at the top --
// everything else has a door -- because what this one takes comes out of the
// sky. The hood is the whole of that: five courses of black wall flaring open at
// the haze, each one stepping a cell out from the one below it, so the building
// is widest where it meets the air and narrowest where it stands. Every other
// thing on this ground is the other way up. The settlement steps back as it
// rises, the lab's chimney is under half the body under it, the school's belfry
// a tenth of its front, the casino a block that is the same block all the way to
// the roof. A shape that opens upward is a shape that takes from up there, and
// there is only one of them.
//
// Four cells of wall and not two. Two was a wall leaning at forty five degrees
// that measured one and a half cells through -- thinner than the lab's flue,
// thinner than the settlement's chimney, the thinnest structural member in the
// yard, and carrying the single sentence this building exists to say. At four it
// measures the same through as the lab's chimney does, which is the weight
// everything else here is drawn at, and the top course is two runs of four cells
// standing against the haze rather than two ticks of linework in it.
//
// Five courses of it and not four. At four the notch in the sky stopped at five
// cells across and the last of the taper had to be finished in white, inside the
// tower, where it was two courses of paint on a black face and gone from a few
// feet away -- a splayed collar rather than a funnel. At five the mouth closes to
// three cells in the silhouette itself: eleven, nine, seven, five, three. The
// blocked-out shape is the whole of what you can see of any building here from
// the far end of the ground, so the one sentence this building says has to be
// said in it.
//
// What it had was a body with a stack on it and a square punched in the front,
// which is drawLab's construction with the chimney slid to the middle -- and
// that square was a wide hole with something turning in it, a few dozen cells
// along the same walk from a casino which is a wide hole with something turning
// in it. Then it was a notch cut down into the top of a block, which was the
// right idea drawn the wrong way round: a notch that narrows and stops is a
// bevelled roof. Then it was a rack of four slots with blocks riding in them,
// which is the school's front drawn larger -- narrow openings ranked across a
// black face, symmetric about the middle, a stub on the roof -- and one-cell
// piers between two-cell voids go to grey at any distance, so the band read as a
// single white bar with something moving in it, which is the casino a third
// time. The mouth is mass now, and it closes the whole way, from eleven cells of
// sky to one, whether there is anybody in there or not. What a building IS
// cannot depend on whether it is working.
//
// What it is DOING is one thing and not a row of things, and it is not an
// aperture at all: a bellows, hung from the head of a shaft that stands dead on
// the middle column, under the point of the throat. Five cells across in a shaft
// seven wide, so there is a clear cell of white down either side of it however
// it is folded -- the blades welded themselves to the housing and the plungers
// filled their slots edge to edge, and a black thing touching black wall on both
// sides is not an object in a shaft, it is a bridge across one. The jambs beside
// the shaft are two cells and the tower is eleven, so black outweighs white
// across the working band in every pose the thing has. A mass with holes in it,
// which is how every building here is built, and never a white box with lines
// round it.
//
// A bellows because it is the one machine that is unmistakably about air, and
// because of the way it moves. Everything else in this yard that works moves by
// going somewhere: the wheel turns, the bar fills, the plunger slides, the arm
// swings. A thing photographed on its way somewhere looks exactly like the same
// thing stopped there -- that is the answer the fan never gave, a fan halted at
// some angle being precisely a fan caught mid-turn, so the picture of the empty
// house was the picture of the worked one. A bellows does not travel. It changes
// its own proportions. Shut, it is a solid tongue of four courses hanging off
// the head of the shaft; open, it is four leaves with air between them; and
// there is no instant you can catch it at where those are the same picture.
//
// It opens a fold at a time, from the mount downward, because a fold is a whole
// cell and this yard has no half ones -- the whole of it stretching evenly would
// be four leaves each moving a third of a cell. So the fold under the mount goes
// first, then the one under that, then the last, and the wave runs down the
// folds of one object instead of along a rank of four pumps. That is the reading
// the rack was after, got out of a single thing.
//
// Shut is rest, and only rest. Under work the count of open folds runs one, two,
// three, two, and never reaches nought: there is always air in it while there is
// a hand on it. So there is no frame of the working bellows that is the frame of
// the idle one, which is the whole trouble with a signal made of nothing
// happening. And it settles rather than snaps -- when the last body leaves, the
// folds close one at a time down to shut (scrubhouse.js stepScrub) rather than
// the picture cutting to the parked pose. A machine that stops is a machine you
// watch stop.
//
// One bellows for any number of bodies, and it beats faster with each of them up
// to four, which is the cap the lab's chimney smokes on. One leaf to a body
// reads beautifully up to four and then lies: nothing caps this roster the way a
// bench caps the quarry or a plot caps the plot, and a fifth body pulls another five
// and a half motes a second out of the sky off a front that has not changed by a
// cell. The count is written under the building on its roster. What the building
// says is how hard it is being worked, which a rate can say honestly at any
// number.
//
// Every edge is a whole cell off the building's own corner, which world.js snaps
// to the lattice. It was laid out in fractions of w and h -- a body top at 2.6
// cells, a fan hub at 7.54 -- and a quarter-cell edge antialiases, which made
// this the one building in the game with grey on it.
const HOOD = 5;          // courses of hood standing against the sky, above the tower
const HOOD_WALL = 4;     // and cells of black through each of its two walls
const BAY = 8;           // courses of shaft the bellows hangs in
const LEAF = 5;          // and cells across every leaf of it, in a shaft LEAF + 2 wide
// see config.js: the mechanic reads these two as well, so they live there
const CHUTE = SCRUB_CHUTE;
export function drawScrub() {
  const rising = risingPlace() === 'scrub';
  if (!S.scrubOpen && !rising) return;
  const { x, y, w, h } = scrub;
  withRise(rising, x, S.groundY, w, h, () => {
  const on = inScrub() > 0;
  const across = Math.round(w / P), down = Math.round(h / P);
  const throatMid = (across - 1) / 2;      // the middle column, wanted before the shaft is
  const c = (n) => x + P * n;                        // cell n across the front
  const r = (n) => y + P * n;                        // and cell n down it

  ctx.fillStyle = '#000';
  // The hood, drawn as its two walls rather than as a block with the mouth
  // painted white back out of it. Over sky those are the same picture -- the
  // paper is already white and drawing white on it changes nothing -- so the only
  // part worth spending a rect on is the part that is actually there. Four cells
  // thick, stepping in one a course, which is a wall leaning at forty five
  // degrees drawn as the cells it would be built from.
  for (let i = 0; i < HOOD; i++) {
    ctx.fillRect(c(i), r(i), P * HOOD_WALL, P);
    ctx.fillRect(c(across - HOOD_WALL - i), r(i), P * HOOD_WALL, P);
  }
  // The tower: exactly as wide as the hood has come down to, so the walls land on
  // it rather than beside it and the two are one object.
  const towerL = HOOD - 1;
  ctx.fillRect(c(towerL), r(HOOD), P * (across - towerL * 2), h - P * HOOD);

  // The throat: the same taper carried on past the last course of hood and cut
  // white out of the tower's head -- eleven cells of sky, nine, seven, five,
  // three, and then the one cell that is the hole itself. It comes to a point and
  // goes in, which is what a funnel does, and that last cell, dead on the middle
  // column, is where the caught motes end (smog.js intake()). One line of
  // arithmetic runs the whole taper from the top course to the point, so the
  // mouth and the hole cannot fall out of step: the wall stops being drawn where
  // the tower starts, and the same inner edge goes on closing.
  //
  // Open while somebody is drawing through it, shut when nobody is -- the only
  // part of this building that is a different shape empty than worked, and it is
  // one cell, on purpose. What the house IS is the hood, and the hood is mass and
  // closes the whole way whichever it is; all that changes is whether there is a
  // hole at the end of it. It is also the far end of the thread of motes, so a
  // thread that arrives finds something to arrive at rather than a black face.
  // A mote is let go once it is within a cell or two of the hole (smog.js
  // pull()), and every cell it can be let go in is inside this building -- the
  // throat of the hood above it, the wall of the tower below -- so a thread that
  // ends early ends inside the mouth. It used to end in the air over a roof tab
  // that touched the building nowhere.
  //
  // Under it, it was going to fan out into a course of white across the head of
  // the works, to draw the route from the mouth to them. That is a white T laid
  // hard against a front that already has one big hole in it, and the pair read
  // as two shelves rather than as one thing feeding another. What happens between
  // the mouth and the works happens inside the building, which is the same
  // bargain the lab makes with its door.
  //
  // One cell, on the middle column, and it is always open. It was a loop carrying
  // the taper on for as many courses as the arithmetic allowed, which sounds
  // general and is not: at this width the first turn already closes the gap to a
  // single cell and the second breaks, so the loop ran once and drew the one cell
  // it now draws plainly.
  //
  // And it does not blink. It was white while somebody was drawing through it and
  // black when nobody was, which put the whole of the building's state into one
  // cell -- a cell with white on three sides of it, so opening it extended a notch
  // rather than knocking a hole in anything, at the far end of the longest walk in
  // the game. The bellows says whether this place is working. A second, worse
  // telling of the same fact is not redundancy, it is noise.
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(throatMid), r(HOOD), P, P);

  // The shaft, and the bellows in it. It starts one whole solid course below the
  // point of the throat: without that course the hole at the end of the funnel
  // would open straight into the top of the shaft, and a hole opening into a hole
  // is one tall opening rather than a mouth over a works.
  //
  // Everything on the front is worked out from the middle column, which an odd
  // front has and an even one does not. The shaft is LEAF + 2 wide about it, the
  // door is DOOR_W wide beside it, and the throat closes on to it, so the building
  // has one axis and everything that goes into it goes in on that axis: the sky
  // at the top, the crew at the bottom, the works between the two.
  const mid = (across - 1) / 2;
  const head = HOOD + 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(mid - (LEAF + 1) / 2), r(head), P * (LEAF + 2), P * BAY);

  // The folds. A cell at a time, like the lab bar: half a cell of travel is a
  // leaf drawn across a fraction of a device pixel, which is the one thing the
  // yard never does. So the bellows opens a fold at a time from the mount
  // downward and the count of open folds is the whole of the animation --
  // scrubhouse.js keeps it, because a clock kept in the draw loop runs at double
  // speed the moment anything draws the yard twice in a frame.
  //
  // The triangle is what makes it breathe: going shut takes as long as opening,
  // where a bellows that snapped back would be a thing that teleports once a
  // second. Worked, it never lets the count reach nought -- there is always air
  // in it while there is a hand on it -- so the one pose that means nobody is
  // home is a pose the working cycle cannot show. Idle it is four courses of
  // solid black hanging off the head of the shaft, with white down both sides of
  // it and four clear courses under its foot: a tongue in a shaft, which is a
  // thing that could move, and not a window, which is a thing that could not.
  //
  // The shaft is deep enough for the whole of the stroke and one cell over, so
  // the foot of the bellows never lands on the floor of its own shaft. A plate
  // sitting flush on a floor has no floor left under it to sit on. It holds a
  // beat at the shut end, where the count is one twice running, which is where a
  // bellows dwells anyway: the hand is at the bottom of the push.
  //
  // A leaf is one cell thick, which is thinner than anything this building is
  // allowed to be built out of -- four cells through the hood wall, two through
  // the jambs -- and that is the difference between a member and a moving part. A
  // fold of a bellows carries nothing. It is thin because a fold is thin.
  const k = Math.floor(S.pumpAt) % (SCRUB_FOLDS * 2);
  const fold = k <= SCRUB_FOLDS ? k : SCRUB_FOLDS * 2 - k;
  const open = on ? Math.max(1, fold) : fold;
  ctx.fillStyle = '#000';
  for (let i = 0; i <= SCRUB_FOLDS; i++)
    ctx.fillRect(c(mid - (LEAF - 1) / 2), r(head + i + Math.min(i, open)), P * LEAF, P);

  // The way in. A purifier walks the length of the yard to get here and has to
  // arrive somewhere -- the settlement gives a body a P*4 doorway explicitly so
  // that a building does not read as a model of a building, the school's stands
  // open, the casino has one because somebody goes in -- and before this there
  // was nowhere on the front for a body to go, so a purifier crossed the ground
  // and evaporated against the most solid column of it.
  //
  // DOOR_W by DOOR_H, which is the way in at the school, the lab, the casino and
  // the crew's own rooms as well: what a door is measured against is a body, and
  // a body is the same body wherever it is walking. See config.js.
  //
  // This is the one front in the yard an even door cannot centre on. Everything
  // here is worked out from the middle column, and a four-cell door about a
  // single column lands half a cell to one side of it -- three world units, at
  // the foot, under a tower whose axis has not moved. The alternative was an odd
  // door everywhere, which would have thrown the school, the lab and the house
  // off the lattice instead to keep this one on it.
  //
  // Four courses of foot under the works, which config.js is holding the extra
  // course for: the door stands on the ground and stops one course short of the
  // shaft, so there is still a solid course between the way in and the works.
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(mid - DOOR_W / 2 + 1), r(down - DOOR_H), P * DOOR_W, P * DOOR_H);
  ctx.fillStyle = '#000';

  // The recycler, drawn at the end of the process rather than at the start of it:
  // what it catches used to go in and stop, and now some of it comes back out as
  // dust on the ground beside the building. So it is a chute: an arm out of the
  // near wall, two courses deep, cantilevered clear of the building and turning a
  // cell down at its end. The lip is what makes it a chute rather than a buttress
  // -- a shelf that runs into the floor is part of the floor -- and it is what
  // the left-hand silhouette gains: something that overhangs, and points at the
  // ground where the grain lands.
  //
  // Mass hung off the wall, not a hole cut into it. Every version of this upgrade
  // that was white disappeared: a square laid over ground the building had
  // already painted white showed as a two-pixel nick, and a mouth cut at the foot
  // ran into the bottom of the works and turned them into a shaft with the end
  // knocked out. Black on sky at the one corner where this building has nothing
  // is a change you can see from where the rest of the yard is read.
  //
  // Both halves of it are measured off the wall it hangs on and off the cell the
  // grain leaves from, and off nothing else. The arm is CHUTE cells long because
  // that is what it takes to cross the empty box beside the tower's face and come
  // out one cell past the corner the hood's flare comes down to: an arm that
  // stopped level with that corner would be a foot growing under the overhang,
  // which is a building getting bigger rather than a building growing a spout.
  // It ends over the cell smog.js releases the grain from (outlet()), which is
  // the only number in this that is not ours to choose. The lip drops from that
  // same end rather than from a course counted off the building, so the two
  // cannot come apart if the shaft is ever a course deeper. Under the whole of it
  // is daylight, and under the lip one clear cell of it before the ground.
  //
  // It sits on the courses of foot, clear below the shaft, so what it is bolted
  // to is the full width of solid wall. Hung level with the works, a two-course
  // arm had a one-course jamb to be bolted to and nothing else.
  //
  // It was a post standing a cell proud of the roof, which is the lab's flue and
  // the settlement's chimney said in the same three cells, and in this yard a
  // thing standing out of a roof means something going OUT into the sky. This one
  // means the opposite.
  //
  // Hung a course higher than it first was, and its lip measured off its own
  // underside rather than off the bottom of the box. Two things were wrong with
  // the old arithmetic. A body is three courses tall and stands on the bottom
  // three, so an arm two courses off the ground left one clear course and every
  // purifier the house was given walked out from under it with its head inside
  // the chute -- daylight underneath is true of paper and false of anything that
  // walks. It hangs off the foot of the building and the courses of daylight
  // wanted under it, which is the thing that actually decides where it goes. It
  // used to be measured off the door, which decides nothing about it, so widening
  // the way in by a course swung the arm down into the crew.
  //
  // Old note, kept because the shape of the mistake is worth keeping: the arm was
  // measured off the door while the lip was measured off
  // the foot, so they met only because two sums happened to agree: widen the door
  // by a course and the lip detaches and hangs in the air by itself.
  if (!S.recycler) return;
  ctx.fillStyle = '#000';
  const end = c(towerL) - P * CHUTE;
  const armTop = down - SCRUB_ARM - 2;
  ctx.fillRect(end, r(armTop), P * CHUTE, P * 2);
  ctx.fillRect(end, r(armTop + 2), P, P);
  });
}
