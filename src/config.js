// Every number that decides how the game looks and plays, and nothing that
// changes while it runs. If you are tuning the game, it is all in here.

import { rand } from './rng.js';

export const P = 6;              // pixel size, in world units
// How big a cell is drawn, in screen pixels. This is the whole of the zoom: the
// picture never scales to fit a window, so this is the size the game is, and
// turning it down shows more yard at once rather than rearranging anything.
// A cell still has to be a whole number of *device* pixels, so the screen's own
// ratio is rounded against this rather than against P.
export let CELL = 5;
export const TARGET = 1000000;   // dust in the hole: the whole point
// The place is built once and never moves. The pit floor sits on the bottom of
// the viewport, the ground line a fixed height above it, and the rock, the bench
// and the lip keep their distances. A bigger window is only more sky and more
// ground: the ground runs a long way either side of everything.
// The height the game asks for. The picture never scales to fit, so this is not
// a breakpoint -- it is what the yard needs to show the sky the rock and the
// rock stands in, the ground, and the whole depth of the pit. A shorter window
// loses sky off the top, which is the part with nothing in it, and eventually
// the top of the rock. It does not rearrange and it does not shrink.
export const SKY = 1998;         // world above the ground line, so any window has sky
// Every world coordinate below is a whole number of cells away from the last,
// SKY included. That is not tidiness: a cell is a whole number of device
// pixels, so a world position that is half a cell off lands the rock's rows
// between device pixels and the canvas antialiases a hairline into every
// seam between them. 1998 is 333 cells; 2000 was not a whole number of any.
// Every site stands on the one ground line, measured out from the rock. The
// world runs away to the left as sites are unlocked, so walking further out is
// the progression. The pit is the one fixed end, out to the right.
// Every station piles to its right, into a strip of ground of its own, and each
// strip has a size. So the world reads right to left from the hole everything
// ends up in: the pit; the rock's own spoil; the rock; the bench you buy at,
// stood just off its flank; then the quarry and what comes up it, the farm and
// its plots' crop, and the lab at the far end.
// The thing in the sky is the meteor, and it has its reason to be there now: it
// was benched for want of one -- it shed sparks nobody had a use for, and a
// thing that hangs over the yard doing nothing raises a question the game
// cannot answer. What it needed was somebody to go and work it, and that is
// what the tower is for. See meteor.js.
// Rock centre to the thing in the sky. Out past the tower, at the far end of the
// walk: the tower is what calls it down and what makes the body that can reach
// it, so the two of them belong within sight of each other -- and a wizard
// coming out of the tower door with its hat on has a few steps to take rather
// than the length of the yard. It used to hang over the middle of the works,
// which put it above the quarry for no reason anybody could have told you.
export const TO_SKY = -3468;
export const SKY_UP = 460;       // and how far above the ground line it hangs
export const SKY_R = 46;
export const TO_FARM = -2106;    // rock centre to the near edge of the farm
export const TO_QUARRY = -1434;  // rock centre to the mouth of the quarry
// The bench stands just off the rock's left flank, between it and the quarry:
// the thing you buy at is the first thing out from the rock, and everything the
// cores open up lies further out again.
//
// The bench is the nearer of the two. It used to stand out past the crew's
// block, with the shacks in the gap between it and the apron -- the same strip
// of ground, in the other order. Where somebody lives is further from the rock
// than where they buy a pick: you walk out through the yard to the houses and
// back in to the bench, rather than past your own front door to get to the shop.
// The strip is the same width and the two things standing in it have changed
// places.
//
// The bench sits in the middle of what is left: sixty pixels of bare ground to
// the crew's block on one side and sixty to the rock's apron on the other. It
// stood hard against the houses with all the slack on the rock's side, which
// read as the bench having been pushed out of the way rather than stood
// somewhere. What that costs is rock: the biggest rock is measured off the
// bench -- it keeps a hand's width clear of it and stops growing there -- so
// moving the bench out brings the last rock in with it, from 76 cells across to
// 60. The yard reading right is worth the sixteen cells.
export const TO_BENCH = -336;    // rock centre to the bench
export const BENCH_W = P * 12;   // and how wide it stands
export const TO_LAB = -2334;     // rock centre to the lab, at the far end
// --- the opening --------------------------------------------------------------
// Two squares stood on the bare ground talking, and then a rock. Long enough
// that you read it as two people rather than as a loading screen, short enough
// that nobody sits through it twice -- and it only ever happens once, on a game
// that has never been played. See intro.js.
// It is slow, and it is meant to be. The whole of it is over in twenty seconds
// and it only ever happens once, and what it is buying is the rest of the game
// having a reason in it -- so nothing in here is hurried.
export const INTRO_ZOOM = 2.4;    // how far in the view starts
export const INTRO_CHAT_MS = 9000;   // two of them, talking, before anything happens
export const INTRO_HEART_MS = 1900;  // and how often one of them says the other thing
export const INTRO_DOWN_MS = 2200;   // flat on its back after the rock lands
export const INTRO_UP_MS = 3400;     // and up, staring at it, while the view pulls out
// How long the crew stare at a rock that has just landed on the spot where one
// of their own is. The same beat the opening gives the body it threw clear, cut
// short: by the second rock it is a thing that happens rather than a thing that
// has just happened for the first time.
export const LAND_SAY_MS = 1600;
export const INTRO_BEAT = 900;    // between one of them saying something and the other
export const INTRO_APART = 20;    // and how far apart they stand, in world pixels
export const INTRO_HURL = 4.2;    // how hard the one left standing is thrown back
// And then it shows you the loop rather than telling you: a few swings at the
// rock, and one grain of it thrown into the hole. What is being shown is where
// dust goes, not how much of it there is -- and it is one throw rather than the
// walk it used to be, because the first half-minute of a game is not the place
// to watch somebody cross a yard twice. See `show` in intro.js.
export const INTRO_SHOW_DUST = 3;   // grains knocked off before it downs tools
export const INTRO_SHOW_MAX = 45000; // however long that takes, it is over by then
// --- and the second act -------------------------------------------------------
// The first rock comes off and they are together for a moment. It happens once,
// after the first one and never again: a beat you are shown twice is a beat, a
// beat you are shown every time is a loading screen. What it buys is the shape
// of the whole game in one go -- you got them out, and it did not last.
export const MEET_IN_MS = 1200;   // pulling back in on the two of them
export const MEET_MS = 5200;      // and how long they have
export const PART_MS = 2600;      // the rock again, and the view letting go

// --- the casino ---------------------------------------------------------------
// The last thing on the ground, out past the lab. It is the far end of the walk
// on purpose: it is the one place in the yard that makes nothing, and a place
// that makes nothing should be a place you went to.
// --- the air, and what it costs -----------------------------------------------
// Every grain taken out of the ground puts a mote of it into the sky. The sky
// holds them, they gather, and past a point the sky gives them back -- all at
// once, all over the yard, as muck. It is the only thing in this game that makes
// the works worse, and it is caused by the one thing you do most.
// Motes into the sky per grain taken out. It was a third of this, which read fine
// in a check that winds the number up by hand and was hopeless in play: a working
// crew took twenty minutes to dirty the sky enough for the yard to offer them a
// scrubbing house and an hour and a half to see a single rain. A cost nobody
// meets is not a cost. It scales with the crew, which is the right way round --
// a bigger works fouls faster, so the sky is a thing that gets worse as you grow
// rather than a timer running underneath you.
// This and the four constants marked "the same 3.56" below move together. Rain
// used to break at 900; moving it to 3200 on its own did not make the sky
// thicker, it only moved the finish line -- the yard fouled at the old rate, so
// the band sat at a dozen specks and rain was an hour and a half away. Thicker
// means more up there in the same time, so everything measured against the sky
// scaled by the same 3200/900: what a swing puts up, what the house pulls down,
// what comes out of its back, and how fast a rain empties it. The cycle keeps
// the length it was tuned to and the sky it fills is three and a half times the
// sky. Change one of the five and you are changing the balance, not the density.
// What one grain of work puts in the sky.
//
// Cut hard, and deliberately: at 0.64 a yard of ordinary bodies doing ordinary
// work filled the sky on its own, and the sky filling up is supposed to be what
// *industry* does. Hand labour should barely mark it. What this buys is room for
// the machinery to be the dirty thing, which is the shape the whole system was
// written for -- see "the air" in DESIGN.md.
export let SMOG_PER_DUST = 0.16;
export const QUARRY_FOUL = 2;        // a shard out of the quarry is a hole full of it
export const FARM_FOUL = 1;          // and turning a plot over lifts some too
// The sky has to get properly filthy before it comes down. It used to break at
// nine hundred, which a working yard reaches before the haze is thick enough to
// look like anything -- so the rain arrived while the sky was still a scatter of
// specks, and the thing it was supposed to be a consequence of was never on
// screen long enough to be read as a cause. It is a long way up now: the sky
// darkens, keeps darkening, and *then* it rains.
export const SMOG_RAIN_AT = 3200;    // and this many of them up there brings it down
export const SMOG_CAP = 4200;        // never more than this in the sky at once
// The sky is motes, not banks: there is nothing here that says how many clouds
// there are or what shape they are, because nobody draws one. What is up there is
// however the motes have arranged themselves.
// Haze each mote in the sky stands for -- so this is really how *many* specks a
// dirty sky is made of, and that is what decides whether you can see one.
//
// The band is spread evenly over the whole world on purpose (see SMOG_SPREAD_MAX
// and the check that it lies as a haze over everything, not in knots), and the
// window shows an eighth of the world. At 1.2 a full sky was two and a half
// thousand motes, three hundred of them on screen, filling a band of two and a
// half thousand cells about a tenth of the way up at a tenth of an ink -- which
// is nothing, and at the haze an hour of ordinary work actually reaches it was
// six specks. The sky was invisible at every level anybody plays at.
//
// Two and a half times the specks for the same dirt. Everything that counts
// motes rather than haze scales with it -- what the house's filters fill with,
// what the recycler hands back, how fast a rain empties the sky, and how much
// dirt one drop carries down -- all marked "per mote" below.
export const SMOG_PER_MOTE = 0.48;
export const SMOG_TOP = 2;           // cells below the top of the window the band starts
export const SMOG_BAND = 13;         // and how deep it is: room to bunch up in
// How the haze spreads: not by anything travelling, but by the stretch of sky a
// mote is placed within opening out under it as it ages. A few pixels a second
// each, which is slow enough that you never catch one moving.
export const SMOG_SPREAD_MIN = 90;   // the stretch a mote lands within
export const SMOG_SPREAD_RATE = 22;  // pixels a second that stretch opens by
export const SMOG_SPREAD_MAX = 9000; // and as wide as it ever gets: the whole yard
export const SMOG_SINK = 5;          // seconds to settle from the band's underside to its height
// How far a gust lifts the band as it goes through it. This was a wander -- a
// sine on each mote's own phase, so the haze shimmered in place like television
// snow -- and it is a lean now: the whole band rises a little on a wind from one
// side and settles again as it drops, together.
//
// Height only. Sideways is the drift below, and it is the drift because it has
// to be a speed rather than an offset: a sideways offset that grows with the
// wind runs *backwards* whenever a gust is dying, and the yard was caught with
// its smoke going left while its dust went right in the same frame -- which is
// exactly the two-winds fault all of this exists to be rid of.
export const SMOG_LIFT = 4;          // world pixels the band rises on a full wind
export const SMOG_GIVE = 0.15;       // how far one mote may differ from the next, either way
export const PUFF_LEAN_WIND = 26;    // world pixels a second a climbing puff is carried
export const SMOG_DRIFT = 0.06;      // and the whole lot creeps along on the wind

export const PUFF_FADE = 900;        // how long a mote takes to go out at the top, or come up
// (There is no cap on how many specks may be climbing at once. There was, and
// past it the next mote was put straight into the band -- which read as
// pollution appearing out of nothing in the middle of the sky. A thick plume is
// what a busy yard looks like.)
// Grains a second across the whole yard. Enough that a rain lays a layer over
// everything rather than freckling it: a shower you have to go looking for is
// not a thing that happened to your works.
export const RAIN_PER_S = 975;      // per mote: a sky of more specks takes more of them a second
// How long a shower takes to come on, in seconds. A sky over the line used to
// open at full rate on the first frame: a clear yard, and then sixteen hundred
// drops in the air a quarter of a second later, which reads as a bucket tipped
// over rather than as weather. It comes on the way rain comes on -- a few spots,
// then more of them, then the whole of it -- and the rate is squared across the
// ramp so the first second is a scatter you notice rather than a downpour.
//
// It is the front of the shower and not the whole of it: a shower runs until the
// sky it is made of is empty, so a bigger sky still rains for longer, and this
// only sets how long it takes to get going.
export const RAIN_RAMP = 3;
export const RAIN_GRAV = 0.09;       // muck comes down light: it is not falling rock
// The share of what lands that leaves a mark. The whole sky falls either way --
// every mote is a drop you can watch come down -- and this is how much of it is
// filth rather than water.
//
// Half. It was a ninth, back when the sky was a tenth of the specks it holds
// now and the number was picked to keep the layer the same depth it had always
// been; the effect of that was a full shower laying about seven hundred and
// fifty cells over thirteen hundred columns, which is a smear you walk through
// rather than weather that costs you anything. At a half a full sky lays a few
// thousand, the crew are on shovels for several minutes after one, and a rain
// is the thing it was always meant to be: the bill for a dirty sky.
export const RAIN_MARK = 0.5;
export const MUCK_MAX = 6;           // and never stacks deeper than this in a column

// What a spare pair of hands shifts, in cells a second. Clearing is not free and
// it is not slow: it is the shift the rain cost you.
// How far a dropped unit of mess will look for a lower spot, and how much taller
// than its neighbour a column of it may stand before it topples. Between them
// they are the angle a heap of it rests at -- the same thing the sand does, for
// the same reason: it is drawn out of the same cells and should stand the same
// way.
export const MESS_SLUMP = 3;
export const MESS_ANGLE = 2;
export const MUCK_SWEEP = 3.5;       // grains a second a spare pair of hands shifts
// ...and it comes off a cell at a time, on a swing, at that rate.
//
// The shovelling used to be a rate poured in every frame with the body's lunge
// held at full: a shape vibrating over a heap that shrank continuously, which is
// not somebody working, it is a progress bar wearing a hat. The rock has had the
// right answer since the beginning -- walk up, swing, a cell comes off, swing
// again -- and there is no reason the mess should read differently from the
// stone.
export const MUCK_SWING = Math.round(1000 / MUCK_SWEEP);

// How a swing settles. Whoever swings sets a body's lunge to 1 and this eases it
// back to nothing over about a fifth of a second.
//
// It used to be eased inside each work branch that happened to remember, which
// meant every branch that did not -- a janitor walking from one patch of muck to
// the next, a body on a route, anybody a stage took the frame off -- carried the
// last swing's lunge pinned at full for the whole of it. A janitor read as a body
// stamped a cell into the ground, dragged along at that depth, and popped back up
// when it arrived. It is one number now, eased once a frame for everybody in
// `updateWorkers`, so a swing settles wherever the body spends the next frame.
export const LUNGE_EASE = 0.84;

// The scrubbing house: a place with nobody in it does nothing at all.
// The front of the scrubbing house, in cells. These live here rather than in the
// drawing because the drawing is not the only thing that depends on them: the
// recycler's grain is released from the cell under the chute's lip, and a chute
// drawn off one number while the grain leaves from another is a spout that misses
// its own spout the first time either is touched.
// The way in is DOOR_W by DOOR_H like every other way in -- see there. It is
// named here only because the courses of foot under the works have to be deep
// enough to hold it.
export const SCRUB_CHUTE = 5;        // cells the recycler arm reaches out from the wall
export const SCRUB_ARM = 3;          // courses of daylight kept under it: a body is three

export const SCRUB_PULL = 19.5;      // motes a second, per body in it -- the same 3.56
// The draught the house makes while it is manned. It is not a hand picking
// specks out of the band any more: the fan pulls on the whole sky, hardest near
// the mouth and fainter the further out you are, so the haze leans towards the
// house from one end of the world to the other, and what streams in comes off
// the part of it that has been dragged nearest.
//
// It bends where a mote is *placed* rather than pushing it about. The fan runs
// for minutes at a time and a force that accumulated would empty the band into
// the wall; a lean is a thing the sky holds while the fan is on and lets go of
// when it stops. Falls off with distance, so a bank twice as far away leans half
// as far.
// Pixels a second, per body inside, that the draught moves a speck -- and it is
// nearly the same wherever the speck is. A pull that fell off with distance left
// the far end of the band creeping a pixel a second while the near end tore in;
// what a fan in a still room actually does is move all the air, and that is what
// the sky should read as: everything sliding one way at once.
//
// It quickens close to the mouth, where the last of a journey is a thing being
// swallowed rather than carried.
export const SCRUB_DRAG = 34;
export const SCRUB_NEAR = 300;      // and within this much of the mouth it turns down and quickens
// and how many it can have in the air at once, so the stream reads as a stream
// rather than as the whole band arriving in a lump
// Where the draught stops being a pull and becomes a swallow: a speck this near
// the mouth is in it.
export const SCRUB_GRIP = 22;
// The draught you can see even when there is nothing in the air to be pulled.
//
// A fan with a clean sky over it was a building doing nothing: the suction is
// only visible when there is filth to drag, and a machine you cannot tell is
// running is a machine you stop believing in. So it moves the air as well, and
// the air is drawn -- a few faint specks a second falling in from all round the
// hood, which are not pollution, are worth nothing, and are counted nowhere.
//
// Very faint on purpose. What this says is "this thing is pulling", and it has
// to say it without ever being mistaken for the haze it is pulling.
export const DRAUGHT_PER_S = 18;     // specks a second, per body inside
export const DRAUGHT_FROM = 190;     // how far out they come in from
export const DRAUGHT_PACE = 96;      // and pixels a second they close at
export const DRAUGHT_INK = 0.55;     // against the haze's own weight
export const SCRUB_REACH = 1.1;      // seconds a caught mote takes to come in, over the
                                     // top of the house and down the middle of it
// How far either side of the fan a climbing puff is close enough to be taken.
// Generous, because a plume goes up in a column and the house wants the whole of
// it, not the one mote that happened to line up with the throat.
export const SCRUB_CATCH = 260;
// What the house puts out of the back before the recycler is fitted: the filters
// have to be emptied somewhere, and the crew shovel it like any other mess.
export const SCRUB_PER_MUCK = 90;   // motes caught per load out of the back -- per mote
export const SCRUB_MUCK = 1;        // and how much a load is, in cells deep
// The house's own ladder, and the reason it needs one now.
//
// It was built to answer hand labour, which dirties the sky slowly. A machine
// dirties it a great deal harder and never stops for a cigarette -- and there
// are three of them -- so a house that could only ever pull at the rate it was
// built with is a house that stops being an answer the moment the yard is worth
// having one. A bigger fan is what keeps it in the argument.
export const FAN_COST = 18;          // shards for the first rung
export const FAN_RATE = 1.75;        // and how much steeper each one gets
export const RECYCLE_SHARDS = 24;    // and what turns catching into keeping
export const RECYCLE_TONE = 4;      // the shade it comes back around: ordinary dust, give or take one
export const RECYCLE_PER = 28;      // motes caught per grain of dust it gives back -- per mote

export const TO_SCRUB = -2586;       // past the lab, at the quiet end of the walk
// Nineteen cells across and nineteen down, which is the hood and the tower
// together: the tower is the eleven cells the hood has flared down to, and the
// four either side of it at the top are wall with sky behind them. Odd across on
// purpose -- the taper closes to one cell dead on the middle column, and on an
// even front it would close to two beside the middle or one off it, and there
// would be no middle column for the shaft and the door to stand on either.
//
// The twenty down is the front read off in order and nothing else: five courses
// of hood, the course the throat closes in, a solid course under it, eight of
// shaft for the bellows, a solid course under that, and four of foot for the
// door to stand in. Change any of those in render.js and this has to move with
// it -- which is why they are all named there, where the shape is.
//
// It was nineteen while the door was three courses. The door is DOOR_H now like
// every other door, and the extra course had to come from somewhere: taken out of
// the foot, the way in would have opened straight into the floor of the bellows'
// shaft, and a hole opening into a hole is one tall opening rather than a mouth
// over a works. So the building is a course taller instead. It grows upward --
// scrub.y is the ground less the height -- and the chute and the outlet are both
// measured off the foot, so neither of them moves.
export const SCRUB_W = P * 19;
export const SCRUB_H = P * 20;
// The bellows on its front: how many folds it has, and how fast they go. One
// bellows whoever is in there -- it is a machine running or a machine stopped,
// not a tally -- but it beats faster with every body up to four, which is the cap
// the lab's chimney smokes on. Nothing caps this roster the way a bench caps the
// cut, so one fold to a body would read right up to four and lie from five on,
// and the roster written under the building already carries the number.
export const SCRUB_FOLDS = 3;
export const SCRUB_PUMP = 3.2;       // folds a second, at one body in the house

// The scrubbing house wants more elbow room on this side than the standard gap
// gives it. Every building along the walk sits about a hundred and seventy from
// its neighbour, which is right for two plain sheds -- but the hood flares out
// as it goes up, the muck comes out of the back on this side, and the sky bends
// down through exactly this stretch on its way into the mouth. Three things in
// one gap read as the two buildings touching. So this one is doubled, and the
// room is found by widening the world's left end rather than by shuffling
// anything on the other side up against the lab: GROUND_LEFT and everything out
// past the casino move by the same amount, so the far end of the walk keeps the
// margin it had and only this gap changes.
export const TO_CASINO = -3078;
// Past the casino: the far end of the walk, and the last thing on the ground.
// Everything else out here was bought with what the yard digs; this one is
// bought with the thing the yard cannot make.
//
// It sits in the margin the world already keeps at its left-hand end, rather
// than pushing the whole yard right to make room. The rock is 2,880 from the
// left edge and the casino is the last building before it, so what is left is a
// narrow strip -- which suits the one building that is narrow and tall.
// The outhouse: a shed on the bare ground between the training grounds and the
// rooms the crew live in. It goes where the crew *are* rather than out at the
// quiet end with the lab and the table -- somewhere you would put one.
//
// Two cells by three and a bit: the smallest thing anybody builds in this yard,
// because that is how big it needs to be.
// Centred in that strip, with about a hundred pixels of bare ground either
// side. It was wedged into ninety-six between the two of them, eighteen clear
// on one side, which read as a thing squeezed in after the fact -- which it was.
export const TO_OUTHOUSE = -756;
export const OUTHOUSE_W = P * 7;
export const OUTHOUSE_H = P * 10;
// How many janitors the closet opens a place for -- and, because the caps hang
// on the stand outside it, how many caps there are. One number for both: a post
// with no cap to go with it would be a body sent to a job with nothing to pick
// up. Two, because unlike the shed jobs this one is not a room with a bench in
// it -- it is the whole yard, and a yard this long is more ground than one pair
// of hands keeps up with. See `capOf` in upgrades.js and the janitors' row in
// kit.js, which both read this.
export const LOO_POSTS = 2;

// Far enough past the casino to read as its own place rather than the next unit
// along: the gaps between the buildings out here run about a hundred and fifty,
// and this one was eighteen.
export const TO_TOWER = -3324;
export const TOWER_W = P * 13;
// The main shaft, of those thirteen: the tall half with the pointed roof on it,
// with the little turret making up the rest off its right-hand side. It is here
// rather than inside the drawing because the bar that says how far along a hat
// is has to stand over the *spire* and not over the middle of the whole
// building -- the turret is two and a half cells of the width and pulls the
// middle off the point -- and two places working that out from the same number
// is the only way they agree.
export const TOWER_SHAFT = 8;
export const TOWER_H = P * 34;       // tall and thin: the one building that goes up
// Twenty-six across, and it was eighteen. The wheel is set by the height rather
// than the width -- it is as big as the block is short, and widening the block
// does not grow it -- so at eighteen the doorway at the far end of the front was
// cut straight through the rim, and a way in that runs into the works is the
// fault the scrubbing house's chute was moved off the door to avoid.
//
// Twenty-six is what the front actually has to hold, added up rather than tried:
// half a wheel and the white disc it is set in is thirteen cells from the middle
// of the block, then a clear cell, then the four of DOOR_W, then two of wall to
// the corner. Anything less and the two touch -- twenty-four looks like it works
// and does not, because the disc stands a cell proud of the rim all the way
// round and that cell is easy to leave out of the sum.
//
// It makes this the widest thing on the ground, ahead of the school's twenty,
// which suits the one building here that produces nothing.
export const CASINO_W = P * 26;
export const CASINO_H = P * 12;
// --- what the yard is bought with ---------------------------------------------
// Every building used to cost cores, and a core is one whole rock. So the
// opening was four rocks of watching a number climb to three with nothing to do
// about it but swing, and the rarest thing in the game was spent on doors.
//
// Dust buys the yard now: it is the thing you are making, it arrives constantly,
// and an expensive door is one you can see yourself walking towards. A core buys
// the one thing you cannot get any other way -- see the tower.
// The plots come before the quarry. Food makes bodies and stone makes tools, and a
// body has to exist before its tool means anything -- so green is strength and
// blue is gear, in that order.
// What the two grounds cost to open, and they are back to being cores.
//
// "A core opens places" is the sentence the whole tier table is built on, and
// for a while these two were the exception -- priced in dust, because they came
// early and a core felt like a lot to ask. What that actually bought was two
// places you could stumble into without noticing, on a currency that was already
// pouring in, and a fourth tier whose one job -- buildings -- had two of its
// buildings taken off it.
//
// A core is one rock finished. Two of them for the two grounds is a real bill
// paid in the one thing you can only get by seeing a boulder all the way to the
// bottom, and it makes opening the plots something you went and earned rather
// than something that happened while you were looking elsewhere.
export const FARM_CORES = 1;       // the plots, and the first thing a core buys
export const QUARRY_CORES = 2;     // and the cut, once the plots are feeding it
// Still here, and still what the *dust* half of a bill is measured against:
// every place above tier one is priced in its own coin and in dust both, so the
// rock never stops being worth digging. See DESIGN.md, "A rung costs the tier's
// currency and dust, both."
export const FARM_DUST = 600;      // the plots, and the first real bill
export const QUARRY_DUST = 1800;   // the quarry
export const SCRUB_DUST = 3500;    // the scrubbing house
export const LAB_DUST = 5000;      // the lab
export const CASINO_DUST = 15000;  // and the table, which makes nothing
export const OUTHOUSE_DUST = 900;  // and somewhere for the crew to go
// A row shows once you are within this much of affording it. Nothing here is
// revealed by a counter passing a mark nobody can see, and a price you have no
// idea is coming is a price you cannot save for.
export const UNLOCK_SHOW = 0.5;

// The rock the first core is in. There is no reason for one to turn up in the
// first thing you break, before there is anywhere for it to go: four rocks of
// the yard being a yard, and then something comes out of one that never has
// before.
export const CORE_FROM = 5;

// --- the tower ----------------------------------------------------------------
// What a core is for. The only thing in the game bought with one, and the only
// thing bought with all four at once: a core out of the rock, the dust the yard
// makes, the stone the quarry gives up and the crop off the plots. Everything the
// operation does, on one row.
// --- the meteor, and the wizards who work it ------------------------------------
// The second thing a core buys, and the only one that buys a *place*: the tower
// calls the meteor down out of the far sky and it hangs there over the yard,
// grey rind and a red middle, until somebody who can reach it goes and works it.
//
// Cores, because a core is the one thing the rock gives up that nothing else
// does, and calling a rock out of the sky should cost the rarest thing on the
// ground.
export const METEOR_CORES = 3;
export const METEOR_DUST = 6000;
// How much of the meteor is core, as a share of the radius. The rind is dust and
// the middle is the red -- so it is a dig you can see the end of: the grey
// shrinks, and one day there is red showing through it.
export const METEOR_CORE = 0.44;
// Sparks a cell of it is worth: the crust, and then the fire under it. The crust
// paid dust for a while, on the reasoning that a rind is rock -- but it is a
// star, the whole of it is hot, and grey grains coming out of a red thing was
// the picture arguing with itself. Everything it sheds is the red now, and the
// core is worth more of it because the core is what you dug down for.
export const METEOR_SPARKS = 1;
export const METEOR_CORE_SPARKS = 3;
// The sky no longer refills itself on a clock. What comes next is summoned --
// see SUMMON_MS -- so an empty sky is a job rather than a wait, and a yard with
// nobody in the air stays empty until somebody is put back in it.

// A wizard is a hat, like every other trade in this yard -- it is just the one
// hat nobody can do the job without. The tower makes them one at a time and
// takes its time over it: dust, stone and crop go in, and a while later there is
// a hat on the stand.
export const WIZ_DUST = 4000;
export const WIZ_SHARDS = 40;
export const WIZ_SPORES = 40;
export const WIZ_RATE = 1.7;         // and each one after the first
export const WIZ_BREW_MS = 120000;   // how long the tower is at it
// What a wizard does once it is up there: a bolt at the star, this often.
export const WIZ_MS = 1100;
// The tower's own two ladders, and the sky's first.
//
// The wizards were the one trade with nothing to buy for them. Everything on the
// ground can be made quicker or stronger, and the thing standing between you and
// every spark in the game -- how fast a star comes apart -- could only be made
// faster by hiring another body and buying it a hat. So: how often a bolt goes,
// and how much of the star it takes when it lands.
// --- what the tower does for the rest of the yard --------------------------------
// Spells, and they are deliberately not another ladder.
//
// Everything else the tower sells is about the tower: a wizard, a faster bolt, a
// heavier one. What was missing is the tower having anything to do with the
// ground -- so these are one-off enchantments laid on *other* stations, bought
// once each, each one a plain statement about somewhere else in the yard.
//
// One-offs rather than rungs because that is what a spell is. A ladder is a
// thing you grind; an enchantment is a thing that is either on the yard or not,
// and the sentence "the machines run half again as fast" is worth more than five
// rungs of nine per cent.
export const SPELLS = [
  { key: 'drive',  name: 'quicken the machines', spark: 45,
    note: 'every machine in the yard works half again as fast' },
  { key: 'luck',   name: 'bless the cut',        spark: 35,
    note: 'a dig turns up a quarter again as much stone' },
  { key: 'thrift', name: 'raise the houses',     spark: 30,
    note: 'a house costs half what it did' },
  { key: 'sweep',  name: 'hasten the janitors',  spark: 25,
    note: 'a janitor shovels and walks at twice the pace' }
];
export const SPELL_DRIVE = 1.5;      // what each one is worth
export const SPELL_LUCK = 1.25;
export const SPELL_THRIFT = 0.5;
export const SPELL_SWEEP = 2;

export const WIZ_SPEED_COST = 12;    // sparks for the first rung of either
export const WIZ_POWER_COST = 16;
export const WIZ_LADDER_RATE = 1.8;  // and how much steeper each one gets
// It does not touch the thing. A body hanging against the rind with its arms in
// it was a miner on a rock four hundred feet up; what it does instead is circle
// the star at a distance and throw magic at it, which is the one thing in this
// yard that is allowed to happen at range -- it is the whole of what the hat is
// for.
export const WIZ_SPIN = 0.42;        // radians a second it goes round
export const BOLT_PACE = 2.4;        // pixels a frame a bolt travels
// And how far out the ring is, past the rind: far enough that the star is a
// thing they are working on rather than a thing they are standing in.
export const WIZ_ORBIT = 62;
// The trail a flying body leaves under it: magic coming off the hat, a speck at
// a time, drifting down and going out. It is the only thing in this game that
// says a body is being *carried* rather than standing on something.
export const WIZ_TRAIL_MS = 55;      // one speck this often, per body
export const WIZ_TRAIL_LIFE = 900;   // and this long before it is gone
// Calling one down. Once the tower has taught the sky the trick, it is the
// wizards who do it: they hang in a ring round the empty spot and pour light
// into the middle of it until there is something there. One body takes about
// this long; two take half of it, because it is the same work shared.
export const SUMMON_MS = 42000;
export const SUMMON_FLASH = 900;     // and how long the sky keeps the flash
// And what the arrival does to the view. Less than a rock landing -- that is a
// hundred tons hitting the ground twenty feet away and this is a star lighting
// four hundred feet up -- but the one thing in the sky that should be felt on
// the ground as well as seen.
export const SUMMON_SHAKE = 9;
// What the tower does while it is making a hat: rings of light going out from
// the spire, one after another, in the wizards' own purple. Three of them in the
// air at once at this spacing reads as a thing pulsing rather than a thing that
// blinked once.
export const TOWER_WAVE_MS = 2200;   // seconds a ring takes to go out
export const TOWER_WAVE_N = 3;       // and how many are on their way at once
export const TOWER_WAVE_R = 96;      // how far one gets before it is spent
export const WIZ_RISE = 1.4;         // pixels a frame it floats, up or down
export const WIZ_BOB = 2.2;          // and how far it drifts as it hangs there

// --- what the star looks like ---------------------------------------------------
// It is a star, not a stone. The crust is black and dead and the core under it is
// fire, so a corona stands off it from the first moment and the thing gets
// visibly hotter as the crust is taken off: the rays redden as the fire is
// uncovered, which is the same fact the counter is about to be told.
export const RAY_N = 16;             // rays around it
export const RAY_MIN = 2;            // cells long at their shortest
export const RAY_MAX = 5;            // and at their longest
export const RAY_BEAT = 1.7;         // seconds for one breath of the corona
export const CORE_FLICK = 260;       // ms a core cell holds a tone before it shifts

// How near the meteor a wizard works from: it hangs off the rind rather than
// inside it, so what it is taking apart is not behind it.
export const WIZ_STANDOFF = 16;

// A core and a thousand dust, and nothing else.
//
// It asked for all four at once, which is the only price in the game that does
// -- and a bill with four lines on it is a row you have to study rather than
// read. It also said the wrong thing: the row's own note is "what a core is
// for", and a core that costs a core *and* a thousand of everything else is not
// what a core is for, it is what the end of the game is for.
export const TOWER_CORES = 1;
export const TOWER_DUST = 1000;

// Putting a stake down *is* the spin. There was a version where the pot opened
// at half and climbed back to the stake over half a minute, and it was a puzzle
// rather than a bet: you put something down and then watched a number go up,
// which is neither gambling nor anything you could explain to somebody watching.
//
// So: the chip goes down, the wheel goes round, and it is doubled or it is gone.
// If it came off, the pot is sitting there and you decide again -- bank it, or
// put the whole of it back on. Even money on any one spin and ruinous kept up,
// which is the whole of what a casino is: no spin is a bad bet and taking them
// all ends at nothing. When to stop is the game.
// A spin is the one moment in this game you are meant to sit and watch, so it
// is given the room to be watched: the wheel winds up, runs, and drags itself
// down to a stop, and the board gets out of the light while it does. Under two
// seconds it read as a flicker and the answer arrived before you had looked up.
export const CASINO_SPIN_MS = 2600;
// The wheel is cut into eight, half bare and half filled -- which is the odds
// written on the thing itself rather than a percentage on a row, and at even
// money they alternate all the way round, which is what a wheel looks like. The
// pointer at the top is what it lands on, so a spin is not a number arriving, it
// is a wheel stopping somewhere you can see. Six turns is enough that nobody can
// follow a slice round and know the answer early.
//
// Black and white, not red and green. Colour in this yard means one thing --
// what a site gave up -- and a wheel painted in traffic lights was the first
// thing here that used it for mood. It does not need it: the grammar is already
// on the page.
//
// White keeps and black takes, which is the way round the rest of the yard reads.
// Every hole a thing comes out of here is white -- the doorways in all six
// buildings, the mouth of the quarry, the throat of the scrubbing house -- and
// black is the mass that has nothing behind it. So a white slice under the
// pointer is an opening and the pot comes back through it, and a black one is
// solid wall. It was the other way about, on the argument that a filled cell is
// a thing and white is the absence of one; that reading is fine on its own and
// it was the only place in the game where black was the good news.
export const CASINO_SLICES = 8;
export const CASINO_WIN_SLICES = 4;  // of them, and the rest are filled
export const CASINO_TURNS = 6;       // whole turns before it comes to rest
export const CASINO_LOSE = '#000';   // wall, and the pot stops there
export const CASINO_KEEP = '#fff';   // a way through, and it comes back
// Four slices in eight, and it is written that way rather than as a number: the
// odds are what the wheel *is*, so the wheel is the definition and this reads
// off it. A wheel that said one thing and paid another would be the one
// dishonest object in the yard.
//
// Even money, and that is the whole of the house's edge -- which sounds like no
// edge at all until you notice that a fair double-or-nothing taken for ever ends
// at nothing with certainty. There is no spin here that is a bad bet and no
// sequence of them that is a good one. When to stop is the only decision, and
// nothing about the odds will make it for you.
export const CASINO_ODDS = CASINO_WIN_SLICES / CASINO_SLICES;
export const CASINO_KNOCK = 9;       // what the stop does to the view
export const CASINO_WIN_KNOCK = 16;  // and what it does when it came off
// Winnings coming down are confetti rather than gravel: they drift, because a
// shower that arrives in three frames is a flicker and the point of it is to be
// watched landing on the heap.
// (`SPARK_` once, before the sky took the word back: these are the table's own
// grains in the air, and nothing to do with what comes off the meteor.)
export const TABLE_LIFE = 2.6;       // seconds a chip is in the air
export const TABLE_GRAV = 0.05;
export const CASINO_WHEEL = 0.35;    // radians a second it idles round at
// What goes on the table. Four chips and one of them is everything you have:
// the size of the bet is most of what a bet feels like, and a stake worked out
// for you as a share of your holdings is a stake nobody chose. `all` is the one
// that is not a number, and it is the one the whole thing is for.
export const CASINO_CHIPS = [10, 100, 1000, 'all'];
// How long a settled hand stands over the building saying which way it went. A
// wheel that stopped and told you nothing is a wheel you have to have been
// watching, and the yard already has a mark for news you missed -- the lab's
// tick. This is the same idea with two answers.
export const CASINO_SAY_MS = 4000;
// The school stands on the bare ground between the quarry's spoil and the crew's
// own front doors, which is the stretch everybody walks twice a shift. Where you
// go to learn a trade is on the way to work, and it is the last thing on this
// side that is about people rather than about rock.
// Pushed further out to open the strip the outhouse stands in. The block of
// rooms cannot come the other way to make that room -- it is sixty pixels off
// the bench and the bench is sixty off the apron, and the bench sits centred
// between them on purpose -- so the ground between the school and the front
// doors is the only ground there is to give.
export const TO_SCHOOL = -918;   // rock centre to the middle of the school
export const SCHOOL_W = P * 20;
export const SCHOOL_H = P * 10;
// The lab, which had no numbers of its own: it was two literals in world.js and
// a handful of fractions of them in the drawing. Sixteen across and twelve down
// now, and it was fourteen by ten -- the smallest thing on the ground by both
// measures, standing between a twenty-cell school and an eighteen-cell casino
// and reading as a shed beside them. It keeps the casino's height, which is what
// makes the two of them the same building at different jobs, and stays under the
// school's width, because the school is the long low one and the lab is the tall
// one. Even across, so the way in centres on the lattice.
export const LAB_W = P * 16;
export const LAB_H = P * 12;
export const LAB_FLUE = 4;       // courses of it standing against the sky, above the body
// What the school costs to build, and what a trade costs once it is up. Shards,
// all of it: the quarry starts giving them up long before the lab is a thing you
// could afford, and a currency you cannot spend reads as scenery.
export const SCHOOL_COST = 4;    // shards to build it
// And what a trade costs once it is up. A helmet was two shards, which is about
// four minutes of one body in the quarry: cheap enough that kitting the whole yard
// out was something you did on the way past rather than something you saved for.
// A trade doubles what a body does at the thing it does, for good and for free
// from then on, and nothing else in the game gives that much away -- so it is
// priced like the decision it is. A thousand is a quarry running for a long
// while, which is what makes the first one worth choosing between the four.
// A thousand was priced against a cut that gave up shards far faster than this
// one does. Two bodies in the quarry bank about two shards a minute, so a
// thousand is seven hours of it -- a price nobody was ever going to pay, which
// makes the school scenery and the shard a currency you cannot spend all over
// again. Twenty is about ten minutes of a working cut for the first, and the
// rate below still doubles-and-a-bit it every time.
export let TRADE_COST = 20;    // and for the first of any one trade
export const TRADE_RATE = 1.6;   // each one after that
// The lip is as close to the rock as the rock's own spoil will allow, and not a
// cell further out. What has to fit between the apron and the lip is one full
// pile and a sweep of bare ground: 1400 grains at the angle sand stands at wants
// a base of 62 cells, and the biggest rock's apron reaches 204px out, so the
// strip runs to 576 and the lip stands 60 past that.
//
// It used to be 840, with the strip 372 wide and the rest of it bare. That gap
// was ground you dragged dust across by hand -- the first pile in the game is
// cleared with the cursor, before there is anybody hired to carry anything --
// and it was the length of the yard for no reason: nothing stands in it, nothing
// happens in it, and the pile it separates from the hole is the pile going into
// the hole. Closing it does not make the pit smaller or the pile smaller. It
// takes out the walk.
export const TO_LEDGE = 636;     // rock centre to the lip of the pit
// The rock is the only thing left on this side, so the ground the bench and the
// lab used to stand on is its spoil's now: the pile runs out towards the lip and
// stops a sweep short of it, rather than ending in a stretch of bare ground.
export const ROCK_PILE_TO = 576; // and how far right the rock's own spoil may reach
export const PILE_GAP = 0;       // bare ground kept between a pile and the next station
// And bare ground kept between a station and the *start* of its own pile, so
// the heap stands off the thing that made it instead of burying it. The farm
// clears its last plot; the quarry clears the far ramp of the bridge, which
// comes down well past the mouth. The rock has ROCK_CLEAR for the same job.
// The farm's own heap has to clear its fence, not just its last plot, which is
// why this is more than FARM_GATE rather than measured off the plots.
export const PILE_STANDOFF = { farm: P * 9, quarry: P * 12 };
// Ground running away to the left of everything. This is what the town has to
// spread into: every building out that way is placed as an offset back from the
// rock, so the last one along was standing four cells from the end of the world
// with the casino almost against its wall. Widened so the far end of the walk
// has somewhere to be.

// --- where everything stands ----------------------------------------------------
//
// The yard laid out as a list of requirements rather than a list of answers.
//
// Every site used to carry its own `TO_` offset: a distance from the rock,
// measured once by hand and then true only for as long as nothing either side
// of it changed. Two lists had to agree -- these offsets, and the pile strips in
// `refreshPiles` -- and they agreed only because whoever wrote them had picked
// numbers that happened to leave room. When they stopped agreeing, `heap()`
// clamped the far end of a strip against a neighbour it had not placed, and a
// strip came back with its end left of its start. A yard with an inverted strip
// hangs at boot, which is what the first attempt at this did.
//
// So: each site declares only what it owns, and placement is a walk.
//
//   w         its own widest FUTURE self, not its width today. The farm reserves
//             room for every plot it will ever have, so breaking new ground
//             never shoves the lab along. This is what "required spacing for
//             future growth" means.
//   standoff  bare ground between the site and the near end of its own heap.
//   pile      whose heap that is, or null for a site that makes nothing. The
//             heap's WIDTH is never declared -- it is `heapBase(key) * P`, the
//             width that key's own limit needs at `BANK_SLOPE`, so the ground
//             reserved and the ground used cannot disagree.
//   gap       bare ground between this site's leftmost extent and whatever comes
//             next along. This is the number that says "do not build on top of
//             me", and it is the only spacing anybody has to think about when
//             adding a station.
//   side      which side of the site its heap lies on. 'right' means towards the
//             rock, which is where a body throwing already aims. The scrubbing
//             house is the exception: its spout is on the left wall, so a strip
//             laid the usual way round would put the heap inside the building.
//
// In yard order, walking LEFT from the rock -- which is the order you meet them
// in as the cores open them, and the order they are read out in here.
//
// Adding a station is a row. Its spot is reserved from the moment the table
// names it, whether or not it has been bought, so "place it in the next open
// spot" is true by construction rather than by arithmetic at purchase time.
export const SITES = [
  { key: 'bench',    w: () => BENCH_W,                     standoff: 0,  pile: null,     gap: 60 },
  { key: 'house',    w: () => HOUSE_COLS * HOUSE_CUBE,     standoff: 0,  pile: null,     gap: 102 },
  { key: 'outhouse', w: () => OUTHOUSE_W,                  standoff: 0,  pile: null,     gap: 102 },
  { key: 'school',   w: () => SCHOOL_W,                    standoff: 0,  pile: null,     gap: 96 },
  { key: 'quarry',   w: () => QUARRY_W,                    standoff: PILE_STANDOFF.quarry, pile: 'quarry', gap: 234 },
  { key: 'farm',     w: () => (FARM_PLOTS_MAX - 1) * FARM_GAP, standoff: PILE_STANDOFF.farm, pile: 'farm', gap: 132 },
  { key: 'lab',      w: () => LAB_W,                       standoff: 0,  pile: null,     gap: 138 },
  { key: 'scrub',    w: () => SCRUB_W,                     standoff: P,  pile: 'scrub',  gap: 210, side: 'left' },
  { key: 'casino',   w: () => CASINO_W,                    standoff: 0,  pile: null,     gap: 168 },
  { key: 'tower',    w: () => TOWER_W,                     standoff: 0,  pile: null,     gap: 66 }
];

// The bare ground between the rock's centre and the far edge of the first site
// along. Measured from `S.cx` rather than from the rock's edge, because the rock
// changes size and the yard does not rearrange itself around it.
export const TO_FIRST_SITE = 264;

export const GROUND_LEFT = 3678;
export const ROCK_W = 44;        // the rock is a hill: this wide in cells at rock 1
export const ROCK_H = 20;        // and this tall
export const ROCK_GROW_W = 3;    // each rock is a little broader than the last
export const ROCK_GROW_H = 1.4;  // and a little higher
export const ROCK_SINK = 0;      // its foot sits on the ground line, like everything else
export const ROCK_SKY = 520;     // sky kept clear above the ground line, for the rock
// Rocks go on for ever, so they must stop growing at some point or rock ninety
// would fill the sky. They plateau at about what the twelfth was.
export const ROCK_W_MAX = 92;
export const ROCK_H_MAX = 42;
export const ROCK_CLEAR = 24;    // bare ground kept either side of the rock, so the spoil stands off it
// A bank may stand this many cells high per cell of distance from the apron.
// Without it the apron is a cliff the sand cannot slump over, and the bank
// stands up against the rock as a sheer wall however tall it gets. 1.5 is the
// angle the sand finds on its own, so both faces of a heap read the same.
// How deep dust may lie on ground that is nobody's pile. Enough that anything you
// put down stays put and settles like sand; not enough that the bare yard becomes
// somewhere to store it.
//
// A `let`, and a row in TUNABLE, because it is now the ceiling on a great deal
// more ground than it used to be: the rock's clearance and the whole run out
// past the left-hand end of the yard are bare ground like any other, and how
// deep a scatter reads across all of it is a thing to look at rather than guess.
export let LOOSE_DEEP = 3;

export let BANK_SLOPE = 1.5;
// The hole is given, not dug. It is PIT_W_MAX across and PIT_H down from the
// first frame -- the hole the yard has always been drawn around.
//
// It used to be bought a dig at a time, from a scrape to the whole thing, and
// that made a hole in the ground the ceiling on everything else in the game:
// what you could hold was what you had dug, so every price was really a
// statement about how much pit you had bought first, and a row you could not
// afford was as often a row you had nowhere to put. The pit is scenery with a
// number in it. Making it the gate on the things the game is actually about was
// the tail wagging the dog.
//
// PIT_H is what the world reserves under the ground line, and the floor of the
// window sits on it.
export const PIT_H = 276;        // the pit is one fixed hole, in world pixels: this deep
// And this much room above the brim. Once the hole itself is full the pile keeps
// going, heaping up over the mouth rather than stopping dead at the ground line
// -- but only over the mouth: it is the same plot of sand, which is only as wide
// as the hole, so it can rise but it can never get out onto the ground.
export const PIT_HEAP = 150;
// And how the surplus lies. Inside the hole the pile is level, because a hole
// fills up. Above the brim it is a heap: highest at the lip, where it is tipped
// in, leaning away down the length of the hole. Without that it fills the near
// end to the very top and stops dead, which is a wall rather than a pile.
export const PIT_HEAP_SLOPE = 0.12;   // rows of surplus lost per column along
export const PIT_W_MAX = 3600;   // and this wide, six hundred cells of it
// What a grain in the pile is drawn at. A grain is always one dust; adding finer
// sizes here lets the pile settle to them as it fills, which is how the hole
// could be made to hold a million. For now it stays one size: dust in the pit
// looks like dust everywhere else, and the hole fully dug out holds 27,600.
// Three sizes, and the hole only settles to a finer one when somebody has paid
// for it -- see `packPit`. A grain is a whole number of pixels because
// everything in this game is: six, then three, then two. Each step is the same
// dust in a smaller grain, so the hole holds the square of what the grain shrank
// by -- four times at three pixels, and nine at two.
//
// This is what red is for. The core of the star comes down as sparks, and what
// they buy is a wizard pressing the pile: the one thing in the yard that is
// plainly magic acting on the one thing in the yard that is plainly dirt. The
// paint store is still coming and is a secondary effect of the same resource.
export const PIT_GRAINS = [P, 3, 2];
// what each pressing costs, in sparks, in the order they are bought
export const PACK_SPARKS = [40, 140];
export const PIT_PAD = 18;       // cells of ground past its far edge, so you can see the end
export const FLOOR_MARGIN = 12;  // gap under the pit floor, at the bottom of the window
// how many device pixels we are willing to fill a frame, before backing the
// resolution off. A phone at three to one is about three million.
// A `let`, because it is one of the dials -- it sat in TUNABLE as a `const` with
// no way in or out of the switches, so its slider read nothing and wrote nothing.
// One row with its own pair of accessors is what caught it.
export let DEVICE_PIXELS = 9e6;
// cells of sand any one grid is allowed to look at in a frame. The ground can
// hold a hundred thousand and the pit a million; walking either every frame is
// the most expensive thing in the game, and settling a band at a time is free
export const SETTLE_BUDGET = 40000;
export const MAX_DEPTH = 6;      // sheets of rock a boulder can be thick
// A cell holds how much rock is still stacked there. Thick rock is dark, and it
// pales as you dig through it; an empty cell is the white page showing through.
// These stay grey on purpose: shade is how deep the rock was, and it is not
// free to mean anything else. Colour in this game belongs to the things that
// never came off the rock.
export const SHADES = ['#8a8a8a', '#757575', '#5f5f5f', '#464646', '#2c2c2c', '#111111'];
// Cells above the shades are not dust. They heap and are carried exactly like
// it -- a shard on the ground is a grain in the same plot, and a worker scooping
// a column picks it up without knowing what it is -- but they are counted as
// themselves when they land in the pit, and the pile draws them as their mark.
// How big a thing that is not dust is drawn, in world pixels. It occupies one
// cell and collides as one, but a cell is five screen pixels and a triangle five
// pixels across is a smudge -- so it is drawn a little larger than its cell,
// with the page showing through behind it. That white surround is what keeps two
// of them side by side readable as two things rather than one shape.
// A thing that is not dust is one cell, exactly like a grain of dust, because it
// *is* a grain of dust as far as the ground is concerned -- it falls, heaps,
// slumps, is scooped and is carried by the same code, and differs only in the
// mark drawn on it and what it is worth when it lands in the pit. Two systems
// that both mean "a thing in a pile" is one system too many, and every rule they
// did not share was a bug waiting: the ceiling, the lattice, the repose angle.
export const MARK_SIZE = P;
export const CORE_CELL = SHADES.length + 1;   // a core sitting in a pile, among the dust

// Each kind of find gets a run of cell values rather than one, because each
// grain carries its own tone: a heap of shards is a speckle of blues the way a
// heap of dust is a speckle of greys. The tone has to live in the cell and not
// be worked out from where the cell is -- a grain slides as the heap settles,
// and a grain that changed colour on its way down a slope would be a mess.
export const FIND_TONES = 4;
export const SHARD_CELL = CORE_CELL + 1;                  // and the three after it
export const SPORE_CELL = SHARD_CELL + FIND_TONES;
export const SPARK_CELL = SPORE_CELL + FIND_TONES;
export const FIND_TOP = SPARK_CELL + FIND_TONES - 1;

// And one cell that is not a grain at all: the rock a plot of sand is dug into.
//
// The cut in the quarry is a plot of sand whose floor moves -- it is the top of
// whatever has not been dug out yet, one height per column, and it goes down as
// the gang work. A grid's `ceiling` cannot say that: a ceiling counts up from
// the bottom of the plot, and the bottom of the cut is the deepest the hole will
// ever be, so a ceiling would stand the dust at the bottom of a hole nobody has
// dug and leave rock hanging over it.
//
// So the rock is *in* the plot, as cells, which is what it is. Undug ground
// fills its column from the floor of the grid upwards; dust lands on top of it
// and falls further the frame a cell is taken out from under it, without the
// sand being told that a quarry exists. The painter has no colour for it, so it
// draws as nothing and the quarry's own drawing shows through -- see painter.js,
// "anything the painter does not have a colour for is left clear".
export const ROCK_CELL = FIND_TOP + 1;

// The first colour in the game, and the reason it goes here first: everything
// the *ground* makes is a grey, because grey is how deep the rock was. The
// things the sites give up are not dust and never came off the rock, so they are
// the one thing a colour can mean something about. And a solid coloured cell
// tiles a heap exactly the way a grey one does -- a triangle fills half its cell
// however neatly it stacks, so a heap of them is half air by geometry.
//
// Flat and strong, not pastel: this is a game of flat shapes on white paper.
// What the wizards throw, and what comes off them while they fly. Purple, and
// the only purple in the game: everything else in the sky is the star -- its
// crust, its fire, the sparks it sheds -- and that is red. So the rule reads at
// a glance and never has to be explained. Red is the stuff; purple is the magic
// moving it.
export const MAGIC_TONES = ['#9b5de5', '#8244d8', '#6a2fbe', '#4e2090'];

export const FIND_COLOR = {
  [SHARD_CELL]: ['#5b83e0', '#3f68d4', '#2f5fd0', '#2748a4'],   // the quarry: a cold blue
  [SPORE_CELL]: ['#57c074', '#3aa957', '#2e9e4b', '#227b3a'],   // the farm: green, it grew
  // The meteor's core: red, and the only red in the game. The quarry is cold and
  // the plots are alive; this came out of the sky and is still hot.
  [SPARK_CELL]: ['#e8503a', '#d93a25', '#c62d1c', '#9c2214']
};

// which kind a cell belongs to, and one of that kind with a tone of its own
export const findKind = v =>
  v >= SHARD_CELL && v <= FIND_TOP ? SHARD_CELL + Math.floor((v - SHARD_CELL) / FIND_TONES) * FIND_TONES : 0;
export const someFind = base => base + Math.floor(rand() * FIND_TONES);
export let GRAV = 1;
// What a knocked-loose grain does on its way off. It is a blow, not a delivery:
// a pop off the face and a little sideways from the hit, and where it comes down
// is wherever the ground is under it when it gets there.
// How far the haze comes apart into colour at the edge of the view. A lens does
// this and a flat black rectangle does not, which is the point: the sky is the
// one thing in this yard drawn as a field rather than as objects, and a hair of
// red one side and cyan the other is enough to say it is being looked *through*.
// Nothing at the middle of the window, most at the edges, like the glass it is
// pretending to be.
//
export let HAZE_CA = 1.7;        // pixels of separation, at the edge of the view
// --- throwing somebody --------------------------------------------------------
// A body let go of used to drop straight down, however you were moving when you
// let go: the one thing in the yard that fell out of the air with no regard for
// the hand that had hold of it. It is thrown now, off the same flick the dust
// is thrown with.
//
// Gentler than dust, because a person is heavier than a grain and because a
// body flung the length of the yard is a body with a very long walk back.
// A flick of the cursor, in the grain it lets go of. These were in hands.js and
// are here so they can be turned while the game is running: how hard a throw
// feels is the sort of thing that has to be tried rather than reasoned about.
//
// They were tuned when a throw was pixels a *frame*, so on a screen drawing a
// hundred and sixty-five of them a throw went nearly three times as far as it
// was written to. Now that the yard moves on the clock (see `frames`), the same
// numbers are the same throw everywhere -- which is correct, and reads as weak
// to a hand used to the old one. So they are raised: half again on the flick,
// and half again on the cap.
export let THROW = 13;           // cursor pixels a millisecond, in pixels a frame
export let THROW_MAX = 26;       // and the hardest a grain will ever leave your hand
export let HURL = 0.55;        // share of the cursor's flick a body takes
export const HURL_MAX = 9;       // and the fastest it will ever leave your hand
export const HURL_DRAG = 0.995;  // air against it on the way

// Shaking one about. Back and forth over a short window is a shake rather than a
// throw, and what it earns is a moment of not knowing which way is up.
// Changes of direction that count as a shaking. Four was a quick waggle --
// easy to do by accident while just carrying somebody about -- and everything
// the body owned came off for it. Eight is a deliberate, sustained rattling:
// you have to mean it. Nothing at all comes loose until the shaking is half
// established (see `shedLoad`'s gate), so the first few turns cost nothing.
// A knob, because how hard "shaken" should be is a matter of feel.
export let SHAKE_TURNS = 8;
export const SHAKE_WINDOW = 700;   // inside this long, in ms
export const SHAKE_SHED = 2;       // grains shaken loose at every change of direction
// What a shaken-loose grain leaves the hands with. It falls -- it is a chip like
// every other loose thing in this yard, on the same arc and under the same
// gravity -- so all it needs is a shove, and the shove is the shaking itself.
// `SHAKE_FLING` is the share of the hand's own travel each grain takes, so
// waving somebody about hard throws their load further than jiggling them does;
// `SHAKE_SCATTER` is the spread on top of that, which is what makes it a
// spray rather than a line; and it comes out upward first, the way anything
// flung out of a moving pair of hands does.
// How far a mess will slide looking for ground that holds it, in cells. Past
// this it stays where it is: a slope that long is not a bank beside something,
// it is the yard, and a mess sliding a hundred cells to find a footing would be
// a mess crossing the works on its own.
export const MESS_SLIDE = 14;
export const SHAKE_FLING = 0.06;   // share of the hand's travel a shed grain takes
export const SHAKE_SCATTER = 1.1;  // and the spread either side of it
export const SHAKE_LIFT = 1.4;     // it comes out upwards before it comes down
export const DIZZY_MS = 2000;      // and how long the stars last afterwards
// A shaken body drops what it was holding, hat and all, and stands there seeing
// stars before it gathers itself. How far it wobbles while it does.
export const WOBBLE = P / 2;       // pixels either side of where it landed
export const WOBBLE_BEAT = 11;     // radians a second -- unsteady, not a shiver

// --- nature ------------------------------------------------------------------
// A body works all day and now and then it has to stop. It puts down what it is
// doing, says so, goes, and gets back to work -- and what it leaves is the same
// muck the sky rains down, so the crew have to shovel it like any other mess.
// The yard makes its own work, which is the joke and also the point: a bigger
// crew is more hands and a bigger mess.
// Rare, and properly scattered. Every ten minutes or so per body, give or take
// half of that -- often enough that you see it happen and remember the yard is
// staffed by people, rare enough that it is never the thing you are dealing
// with. A whole crew is still one of them every couple of minutes between them,
// which is plenty.
// How long a janitor leans on one spot before wandering to another. Waiting for
// somebody to make a mess is most of its day, so it is the idle you see most of
// in this yard, and it is worth more than standing still.
// How fast a body ambles when it is not going anywhere in particular, in pixels
// per frame. It is its own number and NOT a fraction of the walking pace, which
// is what it used to be: an idling janitor chased its new leaning-spot at nearly
// half of a commute -- a hundred pixels a second -- so it stood dead still for
// several seconds and then scooted a few cells in a blink. Stuck, then vibrating,
// which is exactly how it read. An amble is a speed, not a discount on walking,
// and raising the crew's boots should not make loitering frantic.
export const IDLE_PACE = 0.28;
export const JANITOR_PROP = 7000;
export let LOO_EVERY = 600000;   // how often a body is about due, on average
export const LOO_SPREAD = 0.55;  // and how much that wanders, either side
export const LOO_MS = 1700;      // how long it takes
// Muck is a depth in cells and never stacks past MUCK_MAX, which is six. This
// was fifty-five -- nine times deeper than the sky can rain -- so one body
// leaving one behind buried a column and took the whole crew a minute to shift.
export const LOO_MUCK = 2;       // and how much is left behind

export let SPOIL_POP = 3.2;    // how hard a grain comes off, before the scatter
export const SPOIL_SPIN = 0.5;   // and how much of that is a coin toss
export let SPOIL_SIDE = 1.3;   // how far sideways the blow throws it
export const BRUSH = 3;          // sweep radius, in cells
export const CORE_SIZE = P * 3;  // a core is a square this big
export const MINE_DELAY = 260;   // pause before a held click starts auto-mining
export let MINE_BASE = 460;    // gap between held hits at speed level 0
export const MINE_FLOOR = 75;    // fastest the pick will ever swing (13.3 px/s)
export const CAP_BASE = 1;       // pixels you can carry at level 0
export const CAP_STEP = 1;       // extra capacity per upgrade
// How many rungs there are on every ladder in the game.
//
// One number, because "how far along is this" should be one question with one
// answer wherever it is asked: five on the strength, five on the swing, five on
// the pickaxe. What changes between them is what a rung costs and what it is
// bought with, which is the tier -- see "The ladder" in DESIGN.md.
export const RUNGS = 5;

// And how many of one trade a station will ever own. A shorter ladder than the
// rest on purpose: kit is the one thing you buy that a *body* has to wear, so
// its ceiling is the answer to "how many of this station's hands are the good
// ones" rather than "how far up is this number". Three of five on the rock,
// three of five in the cut -- enough that a full set is worth finishing and
// short enough that finishing it is a thing you do rather than a thing you keep
// paying for.
//
// It is also what makes the machines arrive. A machine is gated behind a full
// set -- see `kitFull` -- and a full set used to mean a hat for every pair of
// hands the station could hold, which is a bill that grows with the station and
// a gate that receded as you walked at it. A set is three now, and the ram, the
// jaw, the tiller and the belt are things you can actually get to.
export const KIT_MAX = 3;
export const WORKER = P * 3;     // worker square size

// How far either way loitering may take a body from the post it is minding, and
// -- out of the same number -- how far off its post it has to be before it
// counts as having *left*, which is the only thing a walk back is for. They are
// written here together because they are one measurement, and here rather than
// beside IDLE_PACE because the second of them is a body wide.
//
// They were two numbers and they disagreed. The idle picks a new spot to lean on
// up to five cells either way and sways a cell on top of that; the walk back to
// the post fired at anything over a body's width, which is three. So the
// loitering did exactly what it is for, ambled out past three cells, and was
// yanked back inside by a single frame of commute -- fifteen frames at
// IDLE_PACE and then a fourteen-pixel snap, over and over, for as long as you
// watched. That is not a janitor drifting about its shed, it is a janitor on a
// rubber band; and the only reason it was hard to name is that the snap is one
// frame and your eye reads it as a stutter rather than as a walk.
//
// So the mark a walk fires at is everything the idle can honestly do -- the
// wander, the sway on top of it, and a body's width of slack -- and the two
// cannot drift apart again, because the second is written as the sum of the
// first and the things that ride on it.
export const IDLE_ROAM = P * 5;
export const AT_POST = IDLE_ROAM + P + WORKER;

// One doorway, for every building in the yard that has one.
//
// They were all different: two cells by three at the school, three by three at
// the scrubbing house, three by five at the casino, four by four at the crew's
// own rooms, and nothing at all on the lab. Six buildings, five answers, and the
// school's was small enough that a body walking into it looked like a body
// walking into a wall. A door is the one part of a building that is measured
// against a person rather than against the building, so it is the one part that
// has no business changing from building to building: it is what tells you how
// big the rest of it is.
//
// Four wide and four tall, and both numbers are the body. A body is three cells
// square and stands on the bottom three courses, so three of anything is exactly
// a body and no more -- a door a body fills to the edges reads as a slot it was
// squeezed through. One cell of clearance each way is a way in: a cell of daylight
// either side, and a cell over the head, which is also where a hat goes.
//
// Even on purpose. Every front here is an even number of cells across except the
// scrubbing house's, so an even door centres on the lattice at the school, at the
// lab and in a room of the crew's house, and lands half a cell off the scrubbing
// house's middle column -- which is one building out of five, at its foot, three
// world units, under a tower whose own axis is unmoved. An odd door would have
// put three of the five off instead.
export const DOOR_W = 4;         // cells across a way in, everywhere in the yard
export const DOOR_H = 4;         // and courses tall
export let MINER_BASE = 1100;  // a hired miner starts slower than your own pick
export const MINER_FLOOR = 260;  // fastest a miner can swing
// The yard runs from the mouth of the quarry to the lip of the pit, and heaped to
// the brim it holds about 10,100 grains -- the slope of the banks decides it,
// and it was measured, not guessed. The crew down tools a little short of that,
// so a chip is never told there is nowhere to put it. Two rocks' worth of spoil
// on the ground and everybody stops: another body on the rock is more dust
// lying about, and somebody still has to move it.
// What a pile may hold before the station behind it stops. The rock's strip
// holds a bit over two thousand grains at this slope, so it stops well short of
// physically full -- a chip is never told there is nowhere to put it, and a rock
// is more than one pile's worth, so a body on the rock is only worth having if
// somebody is carrying. The sites deal in ones, so theirs are counted in ones.
// A site's strip is 420px, which is 35 bodies across and holds about 300 of them
// heaped. Twelve was a guess and it was a bad one: a station that stops after
// twelve is a station that is stopped nearly all the time. These are the same
// fraction of what the ground actually holds as the rock's is.
//
// The rock's own was 1400 and is half that now. A pile that big is most of a
// rock lying on the ground: it took a long time to build, a long time to clear,
// and for most of that time the yard was one enormous heap with a stopped gang
// standing over it. Seven hundred fills sooner, so the crew find their level
// sooner and the ground beside the rock reads as a working bank rather than as
// a second hill. It costs nothing: the limit is when the miners *wait*, not how
// much dust the game will ever give you.
// The scrubbing house is in here now, and it is the reason the recycler stopped
// spraying the yard. Its spout paid on to bare ground, and bare ground takes a
// scatter and no more -- so every grain it made walked outward looking for a
// column with room and ended up somewhere down the walk. Dust the house makes
// heaps under the house, like everything else in this yard, and when the heap is
// full the house stops until somebody carries it away.
// The sky is in here too. What the wizards knock off the star falls four hundred
// pixels and lands under it, and until it had a strip of its own it landed on
// bare ground -- which takes a scatter and no more, so a star's worth of sparks
// spread themselves along the walk a grain at a time instead of heaping where
// they fell. It is a station like any other: it piles, and when the pile is full
// the wizards stop until somebody has carried it away.
export const PILE_LIMIT = { rock: 700, quarry: 180, farm: 180, scrub: 140, sky: 260 };
// And what the back of it may leave lying before it stops, with no recycler on:
// cells of muck over the ground the spout reaches. It is the same rule wearing
// the other coat -- a house nobody clears up after fills its own yard and jams.
export const SCRUB_CLOG = 26;
// There is no hysteresis on a full pile, and it turns out there should not be.
// Any at all is a chore: at 0.95 you had to clear seventy grains before anybody
// picked up a pick again, and a sweep of the brush lifts a handful. A station
// stops when its pile is full and starts the moment there is room for one more,
// so at the limit the crew mine exactly as fast as the crew carry. That is not
// a stutter, it is the yard finding its level.
export const HAUL_MS = 110;      // gap between grains a hauler scoops at pace 0
// Hauler walking speed carrying a load, px per frame.
//
// Was 0.9, which is 54 pixels a second: most of a minute to cross a yard four
// thousand wide, before anything is bought. A body that slow does not read as
// somebody walking to work, it reads as somebody who has been paused. The whole
// ladder above it is unchanged -- every multiplier still multiplies this -- so
// what moved is where the ladder starts, not how far it goes.
export let HAUL_BASE = 1.4;
export const HAUL_EMPTY = 1.6;   // and how much quicker it walks with its hands free

// --- between rocks ----------------------------------------------------------
// The last pixel of a boulder is the end of a long job, so it gets a beat. The
// crew take five on the bare ground, and the next rock comes down out of the sky
// rather than being there the next time you look.
export let DANCE_MS = 5000;    // how long the crew celebrate a finished rock
// Hops a second at the base rate, which each move then takes its own multiple of
// -- see MOVES in crew.js. It was 2.6, which is a bounce every three hundred and
// eighty milliseconds: too quick to read as a body doing something and quick
// enough to read as a body juddering. A dance you can count is a dance.
export const DANCE_BEAT = 1.5;
// How fast a dancing body travels, in world pixels a frame at the tuned rate --
// the same units every other pace in this file is in, so it is comparable with
// them: a brisk amble, quicker than loitering (IDLE_PACE) and well under a
// commute. It used to be six hundredths of a cell a frame with no frame time in
// it at all, which is a thirtieth of this and got slower the better your screen.
export const JIG_PACE = 1.5;
// How far up a new rock starts. It used to be this number flat, and this number
// is most of the way up a window rather than off the top of one -- so the rock
// appeared out of nothing in the middle of the sky and fell the second half of
// the way. It comes in over the top edge now, which means the drop is measured
// against the window rather than being one number: a tall window has to be
// cleared by more than a short one. This is the least it will ever be, for a
// window so short that the top edge is nearer than this.
export const ROCK_DROP = 620;    // world pixels above its place that a new rock starts
export const ROCK_DROP_CLEAR = 72;  // and how far above the top edge it waits, out of sight
// How long a body stays pointed at after you pick its name off the house board.
// Long enough to find it on a screen with a dozen of them moving, short enough
// that it is gone before you have stopped looking for it.
export const POINT_MS = 3200;

export const DROP_GRAV = 0.7;    // a boulder comes down heavier than a chip does
export const JOLT_GRAINS = 30;   // grains the landing shakes off the banks
// And the view is knocked about by it. A rock coming down out of the sky used
// to arrive in silence: a few grains hopped off the banks and nothing else in
// the yard admitted anything had happened. The view rocks and settles, which is
// the only thing in the game that says how heavy the thing is.
export let SHAKE_LAND = 15;      // world pixels the landing throws the view
export const SHAKE_RATE = 0.9;   // radians a frame it rocks through
export const SHAKE_DECAY = 0.87; // and how much of the throw is left each frame
// Nothing is standing under it when it lands. The crew get out of the footprint
// while the last rock's celebration is on, and a body still in it once the rock
// is in the air walks out at a pace nobody walks anywhere else.
export const DUCK_PACE = 2.4;    // pixels a frame out from under a falling rock
// A stopped crew is not a frozen crew. When the pile is full the miners stand
// down and shift about on the spot -- slowly, and nothing like the dance, which
// is three hops a second.
export const IDLE_BEAT = 0.9;    // radians a second a stood-down miner sways through
export const IDLE_STRIDE = 0.37; // and how much slower it paces than it sways

// --- breaks -------------------------------------------------------------------
// What a body does during the standing about. None of it makes, spends or moves
// anything, and none of it ever happens to somebody who was working: a break is
// only ever taken by a body that had already stopped. See break.js.
//
// The gap between them is long, and most of the time nothing happens at all. A
// yard where everybody is always smoking is a yard where nobody is ever just
// standing there, and the standing there is the thing this is decorating rather
// than replacing -- so a body that has been about a while gets a *chance* at a
// break rather than a turn at one, and a stopped crew is mostly a stopped crew
// with one of them, now and then, doing something.
export const BREAK_WAIT = 24000;  // typical gap before a stood-about body gets a turn
export const BREAK_ODDS = 0.35;   // and how often a turn comes to anything
export const BREAK_LIFE = 6000;   // roughly how long one lasts
export const BREAK_BEAT = 900;    // between a puff, a note or a word
export const BREAK_NEAR = 96;     // world pixels: how far a conversation carries

// --- the quarry ---------------------------------------------------------------
// A mouth in the ground away to the left. Crew walk in, are gone a while, and
// come back out with a shard. The trip time is the whole of the mechanic: it is
// what an upgrade shortens, and what makes sending somebody in a decision.
export const QUARRY_W = 156;       // the mouth, in world pixels
export const QUARRY_H = 126;      // and how deep the first cut goes
// How many bodies a cut holds, and how it comes to hold more.
//
// A fresh quarry is two benches of standing room and no more, so the third body
// you want down there is a thing you have to buy rather than a slider you drag.
// What buys it is a shard -- the quarry paying for its own next bench is the
// whole reason to open the quarry at all, and it is a place growing rather than
// a number going up: every bench taken out is another step down the wall you
// can see from the rim.
export const QUARRY_BENCH0 = 2;    // bodies a fresh quarry has room for
export const QUARRY_BENCH_MAX = 5; // and the deepest it is ever worked

// --- the machines ---------------------------------------------------------------
// What a machine is worth, as a multiple of the complement its station could
// hold by hand. See `handsOf` and DESIGN.md's "The machines".
//
// This is a dial to be **measured**, not believed, and the number here is a
// guess until a check has measured it. The reason is that hands spend a great
// deal of their day *walking* -- CUT_STEP from cell to cell across the floor of
// the cut, along the plot line, up and down the face -- and a machine that
// stands in one place does not. So a machine ticking at one and a half times the
// station's clock is worth rather more than one and a half hands, and by how
// much depends on how far apart the work is, which is not a thing you can reason
// out from here. The honest form of this number is whatever a node check that
// runs a machine against a real gang of five says it should be.
export let MACHINE_GAIN = 1.5;
// Soot off the stack, per unit of the station's work -- not per minute. A
// machine is the sky's only producer (`foul` refuses everything else), so this
// one dial *is* the pollution rate, and the compounding is what makes it so
// easy to get wrong: a machine is also many times as quick as the hands it
// replaced, so at 1.6 per unit the sky went from a slow brown to pinned in a
// couple of minutes of jaw, and the smoke was the whole game. Well under one:
// an engine that smokes, at a pace the scrubbing house and the rain can argue
// with. The runner charges it in one place, off the stack -- see `stepMachines`
// -- which is why this is not three trebled constants at four call sites.
export let MACHINE_FOUL = 0.4;
// The rock's complement, which is the one a machine cannot read off the station.
// `capOf('miners')` is `Infinity` and rightly so -- a rock is as long as it is,
// and there is no floor plan to run out of. But the ram still has to be worth
// something, and "worth as much as whatever gang you happen to have on it" is a
// machine that gets better the less you need it.
//
// Five, because five is what a crest holds before bodies start being elbowed
// round the shoulder of it and the sixth is working the far side on its own. It
// is a number in config.js with its reasoning over it, which is where every
// number in this game lives -- what the rule against per-case constants forbids
// is a bare 5 inlined in the shared runner.
export const ROCK_GANG = 5;

// How often a machine's stack puffs, and how big the puff is. The lab's chimney
// (HOUSE_PUFF_MS) and the cigarette's 0.55 are the two precedents; a machine sits
// between them -- more often than a hearth, bigger than a cigarette.
// The most units of its station's work a machine will do in one frame. A machine
// quicker than a frame does several, or the frame becomes the rate and the gain
// dial stops meaning anything -- but a tab left in the background for a minute
// should not come back and take the whole quarry out on the frame it wakes.
export const MACHINE_MAX_BEATS = 8;
// How long after its last unit of work a machine still reads as running. A beat
// lands on one frame in three at best, so "is it working" has to be a moment
// rather than a frame or the drawing strobes.
export const MACHINE_IDLE_MS = 600;
export const MACHINE_PUFF_MS = 1500;
export const MACHINE_PUFF_S = 1.15;

// A puff is a handful of motes let go together, not one square.
//
// Every chimney in this game used to emit a single mote on a short timer, which
// at any distance reads as a dotted line rather than as smoke -- a thing
// ticking, not a thing billowing. A real puff arrives all at once and comes
// apart on the way up, so: several motes on the same beat, spread a little,
// sized a little differently, drifting a little differently, and a longer wait
// between one puff and the next.
export const PUFF_MOTES = 3;         // motes let go together
export const PUFF_SPREAD = 0.8;      // how far apart they start, in cells

// What the three of them cost.
//
// Every machine is priced in sparks, which is what makes them the last thing in
// the game, and then in **the two ground currencies its own station does not
// produce**. The jaw works the cut and the cut makes shards, so the jaw is not
// priced in shards; the ram works the rock and the rock makes dust, so the ram
// is not priced in dust; the tiller works the plots and the plots make spores.
//
// That is one rule rather than three prices, and it says something true: a
// machine is paid for by the rest of the yard. A station that could buy its own
// machine out of its own output is a station whose machine is really just a
// bigger version of itself, and the purchase stops being a decision about where
// the whole works is going.
//
// A `bill` is what a row with more than one coin on it uses -- see `billOf`.
// The tower has been the only such row in the game; these are the first that are
// priced in sparks at all, which means they are also the first exercise
// `takeCoreCells` has ever had.
export const JAW_BILL    = [['spark', 30], ['dust', 2000], ['spore', 25]];
export const RAM_BILL    = [['spark', 50], ['shard', 40], ['spore', 30]];
export const TILLER_BILL = [['spark', 20], ['dust', 1200], ['shard', 18]];
// The belt is the one machine not priced away from its own station's coin,
// because carrying does not *have* a coin: a hauler makes nothing, it moves what
// everybody else made. So it is priced in all three grounds, which is the truest
// thing a price can say about a thing the whole yard uses.
export const BELT_BILL = [['spark', 40], ['shard', 30], ['spore', 30]];
// The rock's notional gang was five; the lip's is what a full crew of carriers
// looks like, which is rather more -- carrying is the job everybody falls back
// to, so at any moment most of the yard is doing it.
export const LIP_GANG = 6;
export const QUARRY_DEEPEN = P * 4;  // how much further down each one goes
export const BENCH_COST = 3;       // shards for the first of them
export const BENCH_RATE = 1.7;     // and how much steeper each one gets
// It is a worked cut, not a hole somebody cut with a square. Both walls come
// down in benches and the floor they leave is uneven, which is what months of
// working a face does to one. The shape is a pattern rather than a scatter: a
// quarry that reshuffled itself every frame would be a different quarry every
// time you looked at it, so this is worked out once and kept.
// Each bench is [how far in, how far down], as a share of the mouth. The drops
// are normalised, so they always land the last one exactly on the floor.
export const QUARRY_NEAR_BENCH = [[0.00, 0.30], [0.05, 0.22], [0.03, 0.20], [0.03, 0.28]];
export const QUARRY_FAR_BENCH = [[0.00, 0.36], [0.04, 0.24], [0.03, 0.22], [0.02, 0.18]];
export const QUARRY_FLOOR_STEP = 4;   // cells of floor per stretch
export const QUARRY_FLOOR_JAG = [0, 1, 2, 1, 0, 2, 1, 0];  // and cells of relief on each
// How often a quarrier swings, as opposed to how often the face gives anything
// up. They were the same number, so at pace 0 a worker hit the rock once every
// eleven seconds and stood there the rest of the time. A quarry should look
// busy whether or not it is being productive.
export const QUARRY_SWING = 620;
export const QUARRY_SHUFFLE = 0.35;   // and how fast it works along the face
export let QUARRY_BASE = 11000;  // a shard off the face at pace 0
// --- what the quarry is for ------------------------------------------------------
// Shards used to trickle: a quarrier swung, and every so often one came off the
// face and went over the rim, for ever, at a steady rate. Which made blue a tap
// rather than a find -- and a tap is a number going up, not a thing you went and
// got.
//
// So a cut is a *job*: full of dirt, worked down through, and the ground falls
// back in behind the last one out. Deeper cut, more stone in it. What that first
// bought was a seam at the bottom -- dig the lot out, then stand there and throw
// a handful over the rim -- and that overshot in the other direction. A minute
// of swinging that pays on its last frame is a loading bar with people drawn on
// it, and the pile outside only ever moved while nobody was digging.
//
// What is here now is the middle of the two: the stone is *in the ground*,
// scattered through the cells of the cut, and a swing either turns some up or
// does not. A dig is still a bounded thing you finish, and still worth exactly
// CUT_SEAM a bench -- see `findShards`, which deals the scatter rather than
// rolling it, so the amount never drifts and a dig never ends owing you any.
// The swinging in one dig, at pace nought. What a dig actually takes is this
// plus the walking between cells, which is real and is meant to be: a cut is
// worked by people crossing it, not by a number filling.
export let CUT_DIG_MS = 16000;   // to get from the surface to the bottom, at pace 0
// Three, not two.
//
// Blue was the thing everybody waited on. A plot comes on by itself while you
// watch and a dig has to be worked out end to end for its handful, so green
// arrived in a steady trickle and blue in lumps that were a long way apart -- and
// with the two grounds now paying for each other (the cut is deepened with
// spores and the plots are broken with shards) the slower of the two sets the
// pace of both. Half again per bench is the smallest change that fixes it
// without touching what a dig *is*.
export const CUT_SEAM = 3;         // shards in the ground, per bench of depth
export const QUARRY_FLOOR = 2200;  // the quickest a trip will ever be
export const QUARRY_WALK = 1.1;    // a quarrier's walking speed, px per frame
// And how fast it steps between the cells of its own face, which is a different
// thing: crossing the yard is a journey and shifting along a course you are
// working is a shuffle. Slower than walking, because that is what it is -- a
// body with a pick moving a pace and a half to the next bit of ground.
//
// It was three times a walking pace once, and double that for a blaster, which
// made the fastest thing in the yard a man in a hole. That number came from
// wanting a dig to take a certain time, which is no reason for anything in the
// world to move at a speed: a dig takes as long as digging takes. What makes it
// affordable is that a body picks a cell from the few nearest it, so the walks
// are a pace or two and a slow pace costs almost nothing.
export let CUT_STEP = 0.6;

// --- the farm ---------------------------------------------------------------
// Plots out past the quarry. Nothing grows in them on its own: a farmhand stands
// at a plot and tends it, and it grows while tended. So the crop is the crew's
// attention, which is the same trade the quarry asks for in a different shape.
// The plots are broken one at a time, and a plot is a place for one body: the
// same bargain the quarry makes, in the shape the farm makes it. One comes with
// the ground; the rest are broken with what the ground gives up.
//
// One rather than three, because breaking the ground should buy you a plot and
// not a farm: three plots standing there on the day you pay for it is most of the
// place handed over, and the row that breaks the next one is then an upgrade to
// something that already works rather than the way the place gets built.
export const FARM_PLOTS0 = 1;     // plots the ground comes with
export const FARM_PLOTS_MAX = 7;  // and the whole plot, once it is all broken
export const PLOT_COST = 90;      // dust for the first plot after it
export const PLOT_RATE = 1.7;     // and how much steeper each one gets
export const FARM_GAP = 42;      // world pixels between one plot and the next
export const FARM_H = 54;        // how tall a ripe stalk stands
// Bare ground kept between the end plot and the post that brackets it. A fence
// standing right against the crop reads as a crop growing through a fence: the
// plot wants a margin, the way a picture wants one.
export const FARM_GATE = P * 6;
export let TEND_BASE = 9000;   // to bring one plot on at tending 0
export const TEND_FLOOR = 1800;
export const FARM_WALK = 1.1;
// How much of a hand's tending stays on the plot it is standing over. The rest
// goes over the other plots, evenly.
//
// A hand is worth one plot's worth of tending in the time one plot takes, and
// that has not changed -- the farm's pace is its headcount and nothing else.
// What this splits is where the work *lands*. All of it used to land under the
// body, so a farm with one hand on it was one stalk and six patches of bare
// dirt: the row read as abandoned rather than as slow, and a single hand felt
// like a wasted assignment instead of a cheap one.
//
// Half and half. Enough in front of the body that the plot it is working is
// plainly the one coming on -- the crop is still the crew's attention, and you
// can see where the attention is -- and enough over the row that nothing in it
// is standing still. It is a share of the same one plot's worth either way, so
// a full complement, one hand to each plot, puts a whole share on every plot
// between them and lands exactly where the old one-hand-one-plot rule did.
export const TEND_HERE = 0.5;
// A ripe plot is not cut the instant it ripens. The spore forms at the tip of
// the stalk and sits there long enough to be seen, and the farmhand takes it
// off from exactly where it grew.
// How often a farmhand stoops over the plot it is working. Like the quarry, this
// is nothing to do with how fast the crop comes on: a farm should look tended
// whether or not anything is ripening this second.
// --- the lab ----------------------------------------------------------------
// Research is not bought, it is *worked*. Paying for it starts it; what finishes
// it is bodies standing in the lab, and nothing else -- an empty lab makes no
// progress at all, however much you have paid. So the lab competes for the crew
// with the rock, the quarry and the plots, which is the only real question this
// game asks.
export const LAB_EFFORT = 1;      // a worker does one second of work a second
export let LAB_WORK = 45;         // and this many worker-seconds finishes a piece
// What a bench costs, and how much steeper each one gets. The lab's own ladder:
// it is the one building that never made itself quicker, so every piece of
// research took exactly as long as the first one did however far into a run you
// were -- and the lab is the thing standing between you and every other
// multiplier in the game.
export const BENCH_KIT_COST = 8;
export const BENCH_KIT_RATE = 1.8;
// And the second bench: a lab that can look into two things at once, with a body
// at each. It is a *place*, not a rung -- see `capOf` -- and it is the only
// thing in the game that widens a station that has always held one.
export const LAB_ROOM_COST = 14;
// The crew go *inside* the lab, so there is nothing to watch. What tells you it
// is being worked is the chimney: it smokes while somebody is in there on a
// piece of research, and harder the more of them there are. An idle lab, or a
// lab with research paid for and nobody in it, does not smoke at all.
export const SMOKE_MS = 380;      // between puffs, with one body in there
export const SMOKE_LIFE = 2.4;    // seconds a puff lasts
export const SMOKE_RISE = 0.4;    // and how fast it goes up

// --- the sky ----------------------------------------------------------------
// Clouds and birds, and nothing else up there. They are the far end of the
// parallax the dust already does close up, and they are deliberately faint: a
// cloud is two greys well lighter than the lightest rock shade, because the six
// shades mean depth of rock and nothing in the sky is allowed to borrow them.
// The pale drifting clouds, back on.
//
// They went off when the smog arrived, on the grounds that two kinds of cloud in
// one sky is one kind too many. What settled that argument was the smog turning
// into what it is now: a thin even haze along the very top of the window. That
// leaves the whole middle of the sky empty, and an empty sky with nothing
// crossing it is the still picture the clouds were put in to break up in the
// first place. They keep clear of the haze -- see `band` in `weather.js` -- so
// the two are layered rather than mixed: your smoke overhead, the weather below
// it, and neither one pretending to be the other.
export const CLOUDS_ON = true;
export const CLOUDS_WANTED = 5;   // how many are kept in the strip of sky in view
// The muck the rain leaves. A third earth colour beside the quarry's cold blue
// and the farm's green -- and deliberately the drab one: both of those are
// saturated because they are worth something, and this is worth nothing. It reads
// as spoil rather than as a resource you have not learned about yet.
//
// It was grey for a while, on the rule that the yard has no colour outside the
// resource marks. That rule was already not true -- there is blue in the quarry and
// green on the plots -- and grey cost more than it saved: a pile of dust here is a
// block of grey cells, so grey muck lying on a pile read as more of the pile,
// which is the one thing it must never read as.
export const MUCK_TONE = '#7a6047';
export const MUCK_SKIN = '#57402c';     // and the top course, so the layer has a lid
// What a body left smells, and the yard says so: a couple of flies over it and a
// wisp coming off it. Only over what a body left -- what the weather drops is
// dirty and not rotten, and giving both of them flies would take away the one
// thing that tells the two layers apart at a glance.
export const FLIES_PER = 2;          // over a column that gets them
// ...and one column in this many does. Flies belong to a HEAP, not to a cell:
// two over every column of a patch thirty wide is sixty flies, which is a black
// wall rather than a suggestion of a smell.
export const FLY_EVERY = 5;
export const FLY_ORBIT = P * 1.7;    // how far one strays from the column
export const FLY_BEAT = 3.1;         // radians a second it goes round at
export const STINK_RISE = 26;        // pixels a second a wisp climbs
export const STINK_LIFE = 2.4;       // seconds before it has gone
export const STINK_EVERY = 3;        // one column in this many gets one

export const CLOUD_TONE = '#efefef';
export const CLOUD_UNDER = '#e3e3e3';   // the bottom bar, so a cloud has an underside
export const CLOUD_DRIFT = 0.05;  // world pixels a frame, before its depth is taken off
export const BIRD_TONE = '#5f5f5f';
export const BIRD_GAP = 26000;    // milliseconds between one lot of birds and the next
export const BIRD_FLOCK = 4;      // at most this many in a lot
// A bird can be clicked, and shakes a few grains loose as it bolts. It is the
// one thing in the sky you can touch, and the amount is deliberately small: it
// is a thing to notice, not a thing to farm -- they cross when they cross, and
// no upgrade has anything to say about them.
export const BIRD_REACH = P * 5;  // how near the click has to be, in world pixels
export const BIRD_DUST = 5;       // grains shaken loose
export const BIRD_BOLT = 1.5;     // and how much the rest of the lot quicken
export const BIRD_SPEED = 1.6;    // world pixels a frame: a lot crosses the view in about a quarter of a minute

export const TEND_STOOP = 780;
export let CUT_MS = 700;

// --- the air ----------------------------------------------------------------
// Nothing stands in the background of this game: no hills, no clouds, no
// furniture of any kind. So the dust hanging in the air is load-bearing rather
// than decorative -- it is the only thing the view has to move against, and the
// only thing keeping a yard nobody is working in from reading as a still
// picture.
//
// It hangs in three bands at different distances. One number sets everything
// about a band at once, because that is what distance does: the far ones are
// pale, small, slow, and barely take the camera's movement at all; the near
// ones are darker, bigger, and sweep past. Splitting those apart only lets a
// band drift out of agreement with itself.
export const AIR_BANDS = [
  //  take: the share of the camera's movement the band takes, 1 being the yard itself
  { take: 0.20, size: 1, pace: 0.35, share: 0.44, front: false },
  { take: 0.46, size: 2, pace: 0.62, share: 0.36, front: false },
  // the near band is drawn *over* the world rather than behind it, which is the
  // whole of why the yard has any depth: dust passes in front of the rock
  { take: 0.90, size: 3, pace: 1.00, share: 0.20, front: true }
];
// A mote is the colour of whatever kicked it up. The yard's own dust is grey,
// what hangs over the quarry is the shard's blue and what comes off the plots is
// the spore's green -- so the far end of the yard reads as its own place from
// across the world, before you can make out anything standing in it.
//
// One tone per band, in the same order: a mote further back is paler, whatever
// it is made of, because that is what makes the bands read as depth rather than
// as three sizes of speck. The colours are the pale end of the same two hues the
// shards and spores are drawn in, so the air over a site and the stuff that
// comes out of it are plainly the same material.
// And the same three for the sky. What a station puts into the air is the colour
// of what it is digging up, exactly as the dust hanging over it is -- so a dirty
// sky says *which part of the works* is dirtying it, and the answer is a glance
// rather than a readout.
//
// Darker and duller than the motes, because these are drawn at a tenth of the
// ink and against the light: the same hues, pushed down until they read as smoke
// with a cast in it rather than as coloured confetti.
// More saturated than they look like they should be. These are laid down at a
// tenth of an ink, and alpha flattens a hue towards the paper it is on: a navy
// that reads as navy on its own reads as grey at 0.13, which is exactly the
// nothing this was added to avoid.
// Four of each, and a speck keeps the one it was born with for its whole life.
// One flat colour a kind meant a band of six thousand specks was three colours
// of paint laid perfectly evenly, which reads as a printed tone rather than as
// air: what makes a haze look like haze is that no two bits of it are quite the
// same. The spread stays inside the hue -- these are four dusts, not four
// colours -- so a bank still reads as one thing from across the yard.
//
// The air over the yard has had exactly this since it was written (see
// AIR_TINTS below); the sky was the one place still painting flat.
// --- the band's own movement --------------------------------------------------
// A sky made of slots is even because it is built even, and it costs nothing:
// every mote is put where its slot says and nothing is simulated. What it is
// not is alive -- a perfectly even lattice, held still, reads as printed tone.
//
// A fluid was tried and reverted. It looked right and it was measured at over a
// millisecond a frame on five thousand specks -- eight trig calls per mote per
// frame -- which on a machine that is not fill-rate bound is the frame.
//
// So the band stirs in *lanes*. A dozen offsets are worked out once a frame, and
// each mote reads the one its slot lands on. That is a dozen sines a frame
// rather than forty thousand, and it cannot clump for exactly the reason the
// creep cannot: a lane is a translation, and a translation moves specks without
// moving them apart. What it buys is the band sliding over itself -- near lanes
// and far lanes out of step -- instead of hanging there as one sheet.
export const SWAY_LANES = 12;        // how many pieces the band drifts in
export const SWAY_X = 16;            // pixels either way, sideways
export const SWAY_Y = 8;             // and up and down, which is the smaller motion
// How fast a lane goes through its swing, in radians a second: about fifteen
// seconds end to end. Slower than this and the arithmetic is right while the
// picture is still a photograph -- at a hundred-second swing the band moves a
// pixel a second, which is a thing you can measure and not a thing you can see.
export const SWAY_PACE = 0.42;

export const SMOG_TINTS = {
  dust:  ['#2b2b2b', '#3a3733', '#232830', '#332b2b'],
  shard: ['#1436b8', '#2444c4', '#0f2c9c', '#2a3fa8'],
  spore: ['#12703a', '#1c8046', '#0d6032', '#237a48'],
  // What comes off a machine's stack is soot, and soot is grey.
  //
  // It used to go up as the station's own kind -- the jaw's extra dirt was blue,
  // because the cut's dust is blue -- and a sky going blue because you bought a
  // machine said the wrong thing twice over. Stone dust off a face is blue
  // because it is stone; what an engine puts up is what an engine puts up
  // wherever it stands, and it is the one thing in the sky that is nobody's
  // resource. A shade darker than the rock's dust, because it is dirtier.
  mach:  ['#1e1e1e', '#282828', '#161616', '#232323']
};

export const AIR_KINDS = ['dust', 'shard', 'spore'];
export const AIR_TINTS = {
  dust:  ['#dedede', '#c2c2c2', '#a6a6a6'],
  shard: ['#ccd8f4', '#a8bce9', '#8aa2dc'],
  spore: ['#cfe8d7', '#a4d2b2', '#80bf93']
};
export const AIR_FLOOR = 95;      // motes over a bare yard, before anything is lying about
export const AIR_PER_DUST = 22;   // and one more for every this much dust on the ground
export const AIR_CAP = 420;       // however much is lying about
export const AIR_RISE = 0.10;     // screen pixels a mote climbs in a frame
export const AIR_SINK = 0.06;     // and the heavier grit that goes the other way
export const AIR_GRIT = 0.16;     // the share of the air that is that grit
export const AIR_SITE = 0.35;     // share of new motes that come off an open site in view
export const AIR_SITE_UP = P * 10;  // and how high above the ground line they are born
// What the dust makes of the wind. `AIR_LEAN` is the whole of a mote's sideways
// travel now: there used to be a wobble on top of it, a cosine on each mote's
// own phase and its own period, and that wobble was the reason the air read as
// static rather than as weather. Half a dozen specks in the same square inch
// each going a different way is noise however slow you make it. What is left is
// one wind and a mote's share of it -- see `wind.js`.
export const AIR_LEAN = 0.34;     // screen pixels a mote is carried in a frame, at full wind and pace 1
// And how far a mote is allowed to differ from the mote beside it. Small on
// purpose: a fifth either way is enough that the field does not move like a
// sheet of card, and not enough that any two of them ever plainly disagree.
export const AIR_GIVE = 0.18;
// Grit is the heavy half of the air -- it sinks instead of climbing -- so it
// takes less of the wind than the fine stuff floating past it. Without this the
// only difference between a grain of grit and a speck of dust was which way it
// went up and down, and a wind that carries both equally is a wind blowing
// through a field with no weight in it.
export const AIR_GRIT_LEAN = 0.65;
// What a hand going through the air does to it. The field already leans on a
// wind that never quite settles; this is a local one, made by the cursor, that
// dies away behind it. Standing still does nothing -- it is the movement that
// stirs, so a pointer parked in the middle of the yard leaves the air alone.
// Barely there on purpose. It was strong enough that the dust visibly obeyed the
// pointer, which makes it a toy you are playing rather than air you are moving
// through: what is wanted is the suspicion that the room noticed you.
export let AIR_STIR = 0.04;       // how hard a fast cursor drags a mote along
export const AIR_STIR_R = 78;     // how far the wake reaches, in screen pixels
export const AIR_STIR_CAP = 1.1;  // the fastest the draught will carry one
export const AIR_STIR_EASE = 3.0; // and how quickly it dies, share a second

// The same hand through the smoke, and fainter again: a mote of haze weighs
// nothing and hangs a long way off, so what a cursor going past does to it is
// stir it, not sweep it.
//
// It was doing far too much. A hand crossing the band opened a hole in it you
// could steer -- a bank of weather being pushed about like a pile of sand -- and
// what the draught is meant to say is only that the air is *there*: a stir you
// notice at the edge of your eye and cannot use for anything. A third of the
// push, half the reach, and a quarter of the furthest it will ever move one.
export const SMOKE_STIR = 0.007;   // how hard the cursor moves smoke
export const SMOKE_STIR_R = 70;    // how far it reaches, in world pixels
export const SMOKE_STIR_CAP = 3;   // and the furthest a mote is ever pushed

// A plume takes it harder than the band does.
//
// These are one number for both, and the number is the band's: it was turned
// right down because a hand through the haze was throwing the whole sky about.
// But the band is settled air a long way up and a plume is smoke climbing off a
// swing an arm's length away -- the one thing in the sky your hand is actually
// near -- and at the band's figure a cursor went through a plume and nothing
// happened at all. So the climb gets its own, four times as hard and allowed to
// carry twice as far, which is still a nudge rather than a gust: what it looks
// like is smoke bending round something moving through it.
export const PLUME_STIR = 0.028;
export const PLUME_STIR_R = 90;
export const PLUME_STIR_CAP = 7;
export const SMOKE_STIR_EASE = 2.4;   // and how quickly it eases back

// How far a puff drifts sideways for every pixel it climbs. A tenth: enough that
// a plume leans and opens a little instead of going up as one straight cylinder,
// not so much that it fans out across the sky. It is a share of the climb rather
// than a speed, so a puff ends up about a tenth of its own height off the column
// it left, however fast it got there.
export const PLUME_LEAN = 0.1;
export const AIR_LOW = 0.6;       // share of the air that hangs low, near the ground
export const AIR_LOW_BAND = 260;  // how far above the ground line "low" reaches

// --- the wind ------------------------------------------------------------------
// One wind over the whole yard, worked out in `wind.js` and leaned on by the
// dust, the settled haze and the smoke still climbing. It used to be three
// separate things -- a gust in the dust, a wander in the haze, a sway in the
// puffs -- each on its own periods and, worse, each mote on its own phase, so
// two specks a hand's breadth apart went opposite ways at the same instant.
// That is not a windy day, it is static.
//
// The number here is a share rather than a distance: 1 is the wind the yard was
// tuned for, and every field turns it into its own pixels. So the knob on the
// panel is "how windy is it", one lever over the lot, rather than three that
// have to be kept in step by hand.
export let WIND = 1;
export const WIND_MS = 9000;      // the slower of the swings the wind is made of
// How deep the lulls are. A sum of sines at unrelated periods never repeats,
// which is most of what was wanted, but it is always about as strong as it ever
// gets -- it swaps direction rather than dropping. A slow envelope over the top
// takes it down to a third and back, so a gust arrives out of quiet air and
// dies away again, which is the part you actually recognise as weather.
export const WIND_LULL = 0.45;

// --- turning the knobs ------------------------------------------------------
// One dial, one row, one home.
//
// A handful of these numbers are `let` rather than `const` so a dev panel can
// move them while the game is running. Modules import the binding, not a copy,
// so a change here is a change everywhere the moment it is made -- which is the
// whole point: the way to find a good number is to sit with the game and push it
// about. That is why the `let`s stay exactly where they are, up in the tracks
// they belong to, next to the comments that explain them.
//
// What used to be spread out was everything *else* about a dial. A knob was four
// facts kept in four places -- the `export let` itself, a row in the panel's
// list, a case in the getter's switch, and a case in the setter's switch -- and
// a new one had to be added to all four or it went half-missing, with nothing
// said about it. DEVICE_PIXELS is what that cost looked like: it was in the list
// and in neither switch, so the panel drew it a slider that read nothing and
// wrote its value into a pile limit that did not exist. A dial the panel shows
// and the game does not hear is not a dial, it is a picture of one.
//
// So: one row per knob, holding everything anybody asks about one -- what it is
// called, what it is called *on screen*, how far it goes and in what steps, and
// the one pair of lines that reads and writes the binding. The pair is the
// irreducible cost of a live binding: nothing but an assignment in this file can
// move an imported `let`. But it is written once, beside the row it belongs to,
// and a row without it is a syntax nobody can miss rather than a slider that
// quietly lies.
//
// Nothing outside this file writes them. `tune` is the only door in, it will not
// open on a key that has no row, and the panel builds itself out of TUNABLE
// rather than knowing any of them by name.
//
//   key     the name, for the panel's own bookkeeping and for `__tune`
//   label   what the panel calls it
//   min     the ends of the slider, and how far one nudge of it moves
//   max
//   step
//   layout  the yard has to be measured again after this one moves
//   get     read the binding
//   set     write it -- and anything else that has to happen when it moves
export const TUNABLE = [
  { key: 'CELL', label: 'zoom', min: 3, max: 10, step: 1, layout: true,
    get: () => CELL, set: v => { CELL = v; } },
  // The one dial that is about the frame rate rather than the game, and it is
  // here because the frame rate is a pixel count: this yard fills pixels, it
  // does not think -- measured, its own work is under a twentieth of a frame and
  // the picture costs the rest, scaling exactly with the size of the window.
  //
  // What it caps is the *backing store*, so it only does anything on a screen
  // that reports more than one device pixel to the css pixel. On a plain
  // monitor the ratio is already one and turning this down changes nothing;
  // on a laptop at two, halving the budget is halving the work.
  { key: 'DEVICE_PIXELS', label: 'pixels a frame', min: 1e6, max: 12e6, step: 5e5, layout: true,
    get: () => DEVICE_PIXELS, set: v => { DEVICE_PIXELS = v; } },
  { key: 'BANK_SLOPE', label: 'pile slope', min: 0.4, max: 4, step: 0.1,
    get: () => BANK_SLOPE, set: v => { BANK_SLOPE = v; } },
  { key: 'LOOSE_DEEP', label: 'scatter depth', min: 1, max: 12, step: 1,
    get: () => LOOSE_DEEP, set: v => { LOOSE_DEEP = v; } },
  { key: 'GRAV', label: 'gravity', min: 0.1, max: 1.5, step: 0.05,
    get: () => GRAV, set: v => { GRAV = v; } },
  { key: 'AIR_STIR', label: 'cursor draught', min: 0, max: 2, step: 0.02,
    get: () => AIR_STIR, set: v => { AIR_STIR = v; } },
  { key: 'WIND', label: 'the wind', min: 0, max: 3, step: 0.05,
    get: () => WIND, set: v => { WIND = v; } },
  { key: 'SMOG_PER_DUST', label: 'soot a grain', min: 0, max: 1.5, step: 0.02,
    get: () => SMOG_PER_DUST, set: v => { SMOG_PER_DUST = v; } },
  { key: 'HAZE_CA', label: 'haze fringe', min: 0, max: 6, step: 0.1,
    get: () => HAZE_CA, set: v => { HAZE_CA = v; } },
  { key: 'LOO_EVERY', label: 'nature calls', min: 4000, max: 300000, step: 1000,
    get: () => LOO_EVERY, set: v => { LOO_EVERY = v; } },
  { key: 'HURL', label: 'throw a body', min: 0, max: 2, step: 0.05,
    get: () => HURL, set: v => { HURL = v; } },
  { key: 'THROW', label: 'throw dust', min: 2, max: 40, step: 1,
    get: () => THROW, set: v => { THROW = v; } },
  { key: 'THROW_MAX', label: 'hardest throw', min: 4, max: 80, step: 1,
    get: () => THROW_MAX, set: v => { THROW_MAX = v; } },
  { key: 'SPOIL_POP', label: 'spoil pop', min: 0.5, max: 8, step: 0.1,
    get: () => SPOIL_POP, set: v => { SPOIL_POP = v; } },
  { key: 'SPOIL_SIDE', label: 'spoil spread', min: 0, max: 5, step: 0.1,
    get: () => SPOIL_SIDE, set: v => { SPOIL_SIDE = v; } },
  { key: 'TRADE_COST', label: 'a trade costs', min: 2, max: 4000, step: 2,
    get: () => TRADE_COST, set: v => { TRADE_COST = v; } },
  { key: 'MINE_BASE', label: 'your swing', min: 60, max: 1200, step: 20,
    get: () => MINE_BASE, set: v => { MINE_BASE = v; } },
  { key: 'MINER_BASE', label: 'miner swing', min: 60, max: 2000, step: 20,
    get: () => MINER_BASE, set: v => { MINER_BASE = v; } },
  { key: 'HAUL_BASE', label: 'carry pace', min: 0.2, max: 6, step: 0.1,
    get: () => HAUL_BASE, set: v => { HAUL_BASE = v; } },
  { key: 'CUT_DIG_MS', label: 'a dig takes', min: 3000, max: 120000, step: 1000,
    get: () => CUT_DIG_MS, set: v => { CUT_DIG_MS = v; } },
  { key: 'MACHINE_GAIN', label: 'a machine is worth', min: 0.5, max: 6, step: 0.1,
    get: () => MACHINE_GAIN, set: v => { MACHINE_GAIN = v; } },
  { key: 'MACHINE_FOUL', label: 'soot a machine unit', min: 0, max: 12, step: 0.1,
    get: () => MACHINE_FOUL, set: v => { MACHINE_FOUL = v; } },
  { key: 'CUT_STEP', label: 'pace along a face', min: 0.1, max: 3, step: 0.05,
    get: () => CUT_STEP, set: v => { CUT_STEP = v; } },
  { key: 'QUARRY_BASE', label: 'quarry pace', min: 200, max: 20000, step: 200,
    get: () => QUARRY_BASE, set: v => { QUARRY_BASE = v; } },
  { key: 'TEND_BASE', label: 'tending', min: 200, max: 20000, step: 200,
    get: () => TEND_BASE, set: v => { TEND_BASE = v; } },
  { key: 'CUT_MS', label: 'time to cut', min: 0, max: 3000, step: 50,
    get: () => CUT_MS, set: v => { CUT_MS = v; } },
  { key: 'LAB_WORK', label: 'research effort', min: 5, max: 300, step: 5,
    get: () => LAB_WORK, set: v => { LAB_WORK = v; } },
  { key: 'DANCE_MS', label: 'the dance', min: 0, max: 12000, step: 250,
    get: () => DANCE_MS, set: v => { DANCE_MS = v; } },
  { key: 'SHAKE_LAND', label: 'landing shake', min: 0, max: 40, step: 1,
    get: () => SHAKE_LAND, set: v => { SHAKE_LAND = v; } },
  { key: 'SHAKE_TURNS', label: 'a shaking is', min: 2, max: 16, step: 1,
    get: () => SHAKE_TURNS, set: v => { SHAKE_TURNS = v; } },
  // The piles are fields of one object rather than bindings of their own, so
  // their pairs read and write a field. Same row, same door.
  { key: 'PILE_LIMIT.rock', label: 'rock pile holds', min: 50, max: 3000, step: 50,
    get: () => PILE_LIMIT.rock, set: v => { PILE_LIMIT.rock = v; } },
  { key: 'PILE_LIMIT.quarry', label: 'quarry pile holds', min: 4, max: 400, step: 4,
    get: () => PILE_LIMIT.quarry, set: v => { PILE_LIMIT.quarry = v; } },
  { key: 'PILE_LIMIT.farm', label: 'farm pile holds', min: 4, max: 400, step: 4,
    get: () => PILE_LIMIT.farm, set: v => { PILE_LIMIT.farm = v; } },
  { key: 'PILE_LIMIT.scrub', label: 'house pile holds', min: 4, max: 400, step: 4,
    get: () => PILE_LIMIT.scrub, set: v => { PILE_LIMIT.scrub = v; } },
  { key: 'PILE_LIMIT.sky', label: 'star pile holds', min: 4, max: 600, step: 4,
    get: () => PILE_LIMIT.sky, set: v => { PILE_LIMIT.sky = v; } }
];

// The rows, by key. Asking for a knob that has no row is worth hearing about:
// it used to come back `undefined`, and setting one wrote the value into a pile
// limit nobody had named.
const KNOB = new Map(TUNABLE.map(t => [t.key, t]));
const knob = key => {
  const t = KNOB.get(key);
  if (!t) throw new Error(`no such knob: ${key}`);
  return t;
};

export const tuned = key => knob(key).get();

export function tune(key, v) {
  const t = knob(key);
  t.set(v);
  return t.get();
}
// --- Track HOUSE -------------------------------------------------------------
// Where the crew live: a shack per body, on the bare ground out past the bench,
// between it and the quarry. The block is sized to the room it has at the
// *biggest* rock rather than at rock one, because the rock grows leftwards into
// this ground as the game goes on and the shacks may not be standing in it when
// it does. Its far edge is where the quarry's spoil has to stop.
export const HOUSE_TO = -504;      // rock centre to the middle of the plot
// How often one window in the settlement opens or closes its curtain. One, and
// the whole place, not one each.
//
// Every window used to run its own cycle: a curtain drawing across, a pause, a
// figure crossing the light. None of it read. A window is two cells wide, so
// anything animated *inside* one has two frames to do it in -- full, half, gone
// -- and two frames is not a curtain closing, it is a flicker. Worse, twenty
// rooms on twenty cycles meant several were always mid-something, and a wall of
// small things changing at once is the definition of busy.
//
// So nothing moves inside a window now: it is open or it is curtained, in one
// step, and one window in the settlement changes every this often. Something is
// always subtly different from the last time you looked, and you never catch two
// of them at it.
export const HOUSE_FLIP_MS = 8000;
// And how much of the settlement has its curtains across at any one time. Left
// to itself the walk only ever shut windows, so the place drifted towards every
// curtain drawn and sat there: a wall of grey is as uniform as a wall of white,
// and takes two minutes to get boring in. A third keeps the front mixed.
export const HOUSE_SHUT = 0.3;
// A drawn curtain. Not black: a window that goes black is a window that vanishes
// into the wall, and a wall full of holes that keep opening and shutting is the
// busiest thing on screen. Grey says the window is still there and somebody has
// pulled something across it.
export const HOUSE_CURTAIN = '#8f8f8f';
// How often the chimney puffs. It is a hearth, not a furnace: the lab smokes
// steadily because work is being done in it, and this says something quieter --
// that somebody is in.
export const HOUSE_PUFF_MS = 5200;
// --- knocking off -------------------------------------------------------------
// How long a body with nothing to carry will hang about the yard before it goes
// home. Long, and staggered per body: the point is a yard that empties over a
// minute or two while there is nothing to do, not a crew that downs tools
// together the instant the last grain is lifted. They come straight back out
// the moment there is dust on the ground.
// It has to be longer than a break's turn comes round, or the yard empties
// before anybody has stood in it long enough to light anything -- knocking off
// and taking five are the same idle stretch, and this is the far end of it.
export const HOME_AFTER = 60000;  // idle before a body knocks off
export const HOME_WALK = 1.15;    // and how fast it walks there, px per frame
// A room is twice the body that lives in it. It was exactly one body across for
// a while, which meant a door -- a third of a room -- was half the width of the
// worker walking out of it, and the whole settlement read as a doll's house
// parked next to people it could not have held.
export const HOUSE_CUBE = P * 6;
// How wide the settlement may stand, in rooms. Six at the size a room is now is
// 216px, and it stands in a strip it shares with the bench: twelve pixels of
// bare ground to the bench on one side and the quarry's spoil on the other.
export const HOUSE_COLS = 6;
// --- Track TRAVEL: a body walks to its work ---------------------------------

// Moving somebody between jobs is not sacking one and hiring another: the same
// body walks over, and this is the pace it goes at.
//
// It was 0.9 first, which was a tax nobody had costed: the yard is 3600px
// across, so the lab to the pit was a sixty-five second walk and moving one body
// was a minute of watching it.
//
// It is the crew's own legs now, and this is the floor under them: whatever a
// body walks at with its hands free, or this, whichever is quicker. A pace
// upgrade is a pace upgrade -- a crew you have paid to make quick that still
// ambles across the yard when you move it is the upgrade not applying to the
// one trip you are actually watching. The floor is what stops the other end of
// it: at level nothing the crew's own pace is slower than this, and a walk that
// got *longer* because nothing had been bought yet is a walk nobody would read
// as a body going somewhere.
// Raised with it, and by the same proportion, so the two keep the relationship
// the comment above describes: an empty body still walks at this floor rather
// than at its carrying speed, and a walk still never gets longer for having
// bought nothing.
export const COMMUTE_PACE = 3.9;
// Near enough to have arrived. A station is a place rather than a pixel, and a
// body made to land exactly on one would shuffle on the spot for ever.
export const COMMUTE_SLOP = P * 2;
// How fast a body gets down into the quarry and back out of it again. Going to work
// somewhere else starts with getting up to the level of the ground, and it has
// to be the same number at both ends of that trip or a quarrier climbs out
// faster than it climbed in.
export const CLIMB_PACE = QUARRY_WALK * 2;
// How long a lab with nothing to research keeps somebody standing in it before
// they let themselves out and go back to carrying dust.
//
// Twenty seconds, not four. Four was long enough to prove the rule and far too
// short to play with: staffing the lab and then starting the work is the
// obvious order to do it in, and the walk over is twenty seconds by itself, so
// a body sent to an empty lab turned round and left before the player could open
// the board and pay for anything. This is the grace to get the work started.
export const LAB_IDLE_MS = 20000;
// --- Track PILES ------------------------------------------------------------
// How wide a station's own heap stands, in cells. A pile you cannot read is a
// number you have to go and look up: 180 grains along seventy cells lie two
// deep, and two deep looks the same at a quarter full as at the limit. So a
// site's strip is only as wide as its limit needs. At a slope of BANK_SLOPE a
// triangular heap of n grains wants a base of about sqrt(4n / slope) cells --
// the area of a triangle, read backwards -- and a strip that wide fills to a
// crest just as the limit is reached.
//
// Rounded up, and that rounding is also the headroom. A column may not stand at
// a fraction of a cell, so every one of them holds a little more than the ideal
// triangle wants: 180 grains go into 187 cells of room here, which leaves the
// half-dozen still in the air when the station stops somewhere to land.
//
// The rock is not in here on purpose. Its spoil is a long bank of dust running
// out to the lip of the pit, and a bank is what it should look like.
export const heapBase = key => Math.ceil(Math.sqrt(4 * PILE_LIMIT[key] / BANK_SLOPE));
// --- Track PRESS ------------------------------------------------------------
// The filter over the finished frame. See press.js for what each one is, and why
// these three are drawn in 2D rather than through a shader -- the pass that used
// to do this cost twenty milliseconds a frame on a large window, and none of it
// was the shading.
//
// A whisper of scanline, and enough falloff at the edges to put the page in a
// room rather than on a light box. The point of both is that the yard reads as
// coming off a screen rather than out of a printer, and neither may argue with a
// picture made of whole black pixels -- so both numbers are small on purpose,
// and the look is the pair of them rather than either one.
export const PRESS_MIX = { scanlines: 0.2, vignette: 0.15 };
