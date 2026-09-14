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
// Halved again, and this time the house was halved with it. A yard with all
// three machines going put a full sky up every two and a half minutes, which is
// a downpour before the crew have finished shovelling the last one -- the mess
// never came off the ground because the weather never let it. What was wrong was
// the *pace* of the whole cycle and not the balance inside it, so the fix is to
// slow the cycle rather than to make the sky cheaper: this and SCRUB_PULL came
// down together, and RECYCLE_PER and SCRUB_PER_MUCK came down with them so the
// house gives back the same dust a second it always did. Fouling against
// scrubbing is the number that decides whether the house is worth buying, and it
// is exactly what it was -- see "the air" in DESIGN.md. What changed is that the
// sky now takes twice as long to fill, and a rain is a thing that happens to you
// every several minutes instead of every couple.
export let SMOG_PER_DUST = 0.08;
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

// --- when it breaks -----------------------------------------------------------
// A sky over the line does not come down on the frame it crosses it. The yard
// takes a *sample* of what is overhead every few seconds and asks whether it
// rains, and the answer is a roll rather than a comparison -- so two skies that
// crossed the line at the same moment do not break at the same moment, and you
// cannot stand under a full band counting frames to the drop.
//
// It was a comparison, and what a comparison gives you is a stopwatch: the haze
// hit a fixed number and it rained, every time, at the same number, which made
// the weather a progress bar with a cloud drawn on it. It is a threat now. A
// filthy sky means it is *likely* to rain, and how likely is how filthy.
export const SMOG_SAMPLE = 5;        // seconds between one look at the sky and the next
// The chance a sample brings it down with the sky just over the line. About one
// in eight, so a yard that has just crossed waits the better part of a minute on
// average -- and it is an average and not a wait, so sometimes it opens on you
// straight away.
// How hard the rain's odds bend against how full the sky is. The chance is the
// share of the cap raised to this, so a lightly dirty yard is very nearly never
// rained on and a filthy one is rained on constantly -- one curve, no line.
//
// Against a five-second sample and a minute's dry between showers: a
// quarter-full sky is a shower about once an hour and a half, a half-full one
// about one in three minutes, three-quarters about one in ninety seconds, and a
// brimming one rains the moment RAIN_GAP lets it.
//
// **This is a balance lever, not a look.** It used to be impossible to rain
// below SMOG_RAIN_AT at all, so every bit of sky cleared under that line was
// cleared by the scrubbing house or not at all. Rain takes down the whole sky it
// breaks on, so a bend that is too gentle has the weather doing the house's job
// for it -- and the house is meant to be the thing you invest in. Bent this hard,
// a yard that is losing badly gets rained on and a yard that is merely dirty
// does not.
export let SMOG_RAIN_BEND = 5;
// ...and the odds climb the further over the line it is, reaching certainty at
// the brim. A sky held at the cap is going to rain on the next look, which is
// what keeps the ceiling from being a place a yard can park under for ever.
// The floor under all of it: a minute of dry between one shower and the next.
//
// Without it the yard rained on itself. A shower takes down the sky it broke on
// and nothing else -- everything the works put up while it was falling is still
// there when it stops -- so a long shower over a busy yard ended with the band
// already back over the line and the next one started on the following frame.
// Two rains with a frame between them is one rain that stuttered, and no amount
// of shovelling gets ahead of it. Weather has gaps in it.
export const RAIN_GAP = 60;          // seconds of dry before another may break
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
//
// **And three times again**, now that the haze has the whole sky rather than a
// thirteen-cell strip of it. The same specks spread over four times the height
// is a quarter of the sky it used to be, which is not a haze; so there are three
// times as many, and every "per mote" number below is multiplied by three with
// it. Nothing about the balance moves: the same haze buys the same muck out of
// the house, the same dust out of the recycler and the same length of shower.
// The only thing that changes is how much sky one speck stands for.
export const SMOG_PER_MOTE = 0.16;
// How long a speck takes to fade once a mouth has taken it. What this is for is
// the *absence* of popping, not an effect -- and at 420 it was still a flicker:
// under half a second is quick enough that a speck going out reads as a cell
// blinking off, which is the one thing nothing in this sky may do. It eases out
// over well over a second now, to nothing.
export const SMOG_GO_MS = 1400;
// And a ceiling on how many can be fading at once. Four mouths at a full fan is
// a couple of hundred specks a second, each now fading for well over a second --
// so the working population sits near three hundred. The cap is generous
// against that and exists so a pathological rate cannot grow a list nobody
// bounded; past it a speck is dropped without its fade, which is why the cap
// must stay far above what play produces. Rain is the heaviest producer now --
// every mote a brim shower takes thins out where it stood, at some six hundred
// and fifty a second against a fade of well over one -- so the ceiling sits
// clear above that.
export const GOING_CAP = 2400;
// How quickly a fading speck's own drift eases off, and how hard the wind leans
// one that a mouth has just taken. Both small: it is finishing a movement, not
// starting one.
export const GOING_EASE = 1.1;
export const SMOG_GO_LEAN = 0.30;
export const SMOG_TOP = 2;           // cells below the top of the window the band starts
// How deep the band is, as a floor under it rather than a depth: the haze fills
// the sky from SMOG_TOP down to this many cells above the ground line.
//
// It was thirteen cells -- a strip along the top of the window with clean air
// under it -- and the whole of this change is that it is not a strip any more.
// The specks, the slots, the spread, the sway, the settling and the plume that
// feeds them are all exactly what they were; there is simply four times as much
// sky for them to be in. See DESIGN.md, "The sky is the band".
export const SMOG_FLOOR = 3;
// Cells below the top of the window the clouds may start at. Their own number
// now: they used to sit below the haze strip, and there is no below the haze any
// more -- see `band` in weather.js.
export const CLOUD_TOP = 6;
export const SMOG_BAND = 13;         // kept for the clouds; see CLOUD_TOP
// SMOG_SPREAD_MIN / SMOG_SPREAD_RATE / SMOG_SPREAD_MAX are gone (wave6-sky,
// item 4). They anchored each settled mote to the stack that made it, inside a
// stretch that took minutes to open -- which is what banded the haze over the
// machines. A settled mote's place across the sky is now its slot alone,
// uniform over the whole band from the frame it arrives: the haze is a total
// over the yard, and it does not remember which machine made it.
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

// How far a speck of haze is smeared along the wind at full gust, in screen
// pixels -- the sky's own reach, stated in the sky's own units, because how far
// a thing smears depends on the thing. The shape of the bend is shared (`gust`
// in wind.js); the reach is not, and pretending it was would have meant reading
// the dust's number in the sky's units.
export let HAZE_STREAK = 5;
export const SMOG_DRIFT = 0.06;      // and the whole lot creeps along on the wind

// How fast a puff climbs, in world pixels a frame, and how much one may differ
// from the next.
//
// This is the number that decides whether a plume reads as smoke or as sparks,
// and it is the one that was actually at fault when specks were seen streaking
// up the window. It was 0.55 with half again on top -- so the quickest speck went
// nearly twice the pace of the slowest, left it behind, and drew the eye
// straight up. Slower, and much closer together: the plume rises as a body.
//
// A mote climbs all the way to the height it is going to live at -- see
// `stepPuffs` -- so this also sets how long one is in the air on the way up.
// About half the sky is the average trip, which at this pace is eight seconds or
// so; a speck bound for the very top takes twice that, and takes it calmly.
// Measured by the size of the climbing population, which at a steady rate is the
// birth rate times the length of the climb: about three hundred and thirty
// specks on their way up over a yard running three machines.
export const PUFF_UP = 0.40;
export const PUFF_UP_GIVE = 0.14;
export const PUFF_UP_FLOOR = 0.20;   // and the crawl it never slows below
// How long a mote takes to come up to weight in the band, or go out of it, in
// ms. It was 900, and at nine tenths of a second a speck joining the band read
// as popping in: the eye catches an arrival that quick as an event. Everything
// in this sky fades from and to nothing, slowly enough that no single frame of
// the fade is noticeable.
export const PUFF_FADE = 2400;
// How long a plume is a plume. A speck used to climb visibly all the way to its
// slot -- for one bound near the top of the window, most of the sky -- and a
// column of smoke crossing the whole view reads as an event, not as exhaust.
// After this many seconds of climb it thins out where it is over PLUME_THIN,
// and its mote joins the band at its own height, coming up to weight there
// (see `stepPuffs`). The dirt is identical either way; only the journey is cut.
// Lengthened from 2.0, then again from 3.5: at three and a half the smoke gave
// out about halfway up, so the stacks read as venting at the works rather than
// feeding the sky. Five and a half carries the top of a plume well up into the
// band before the thinning starts.
export const PLUME_LIFE = 5.5;
// And the thinning itself takes its time. At 1.2 the last of a plume went out
// in about a second, which the eye reads as the smoke being switched off; over
// two and a half it dies the way it climbed -- gradually, all the way to
// nothing.
export const PLUME_THIN = 2.5;
// (There is no cap on how many specks may be climbing at once. There was, and
// past it the next mote was put straight into the band -- which read as
// pollution appearing out of nothing in the middle of the sky. A thick plume is
// what a busy yard looks like.)
// Grains a second across the whole yard. Enough that a rain lays a layer over
// everything rather than freckling it: a shower you have to go looking for is
// not a thing that happened to your works.
// Cut from 2925 (wave6-sky, item 5): at the old rate a brim sky drained in
// about nine seconds, which is a bucket tipped over rather than weather. At
// 650 a brim sky is about forty seconds of shower, and a lighter one is
// proportionally shorter. The muck a shower leaves is duration-independent
// (motes times RAIN_MARK), so the longer storm costs the yard exactly what the
// short one did -- it only lasts long enough to be weather.
export let RAIN_PER_S = 650;        // per mote: a sky of more specks takes more of them a second
// RAIN_RAMP is gone (wave6-sky, item 5): the squared come-on is replaced by the
// storm envelope below -- a brew-up of darkness, a drizzle, the peak, a taper.

// --- wave6-sky: the shape of a storm -------------------------------------------
// A storm is an event with a front and a tail, not a switch. When the break
// roll succeeds the sky does not open at once: it *brews* for STORM_BREW_S --
// a quiet delay before the first drop -- then a drizzle at a fifth of the
// rate, a smoothstep up to the full pour, and a taper at the end (see `pour`
// in smog/rain.js) so the shower trails off instead of cutting. There used to
// be a black wash darkening the band through the brew; it was cut -- the sky
// itself is the warning, and a pane of darkness over it read as a screen
// effect rather than as weather.
export let STORM_BREW_S = 20;       // seconds of brewing before the first drop
export let RAIN_DRIZZLE_S = 6;      // seconds of drizzle before the pour comes on
export let RAIN_RISE_S = 6;         // and how long the smoothstep up to full takes
export const RAIN_TAPER_AT = 0.25;  // taper once this share of the marked sky is left
export const RAIN_TAPER_FLOOR = 0.1; // and never below this share of the rate
// How a drop moves, in pixels a frame. It falls at one speed: rain is at its
// terminal velocity long before it is anywhere you can see it, so a drop that
// went on gaining speed all the way down the window -- and these did, under a
// gravity constant, from a walk at the top to a dive at the ground -- read as
// something being dropped rather than as rain. The give is how much one drop
// may differ from the next, either way about the middle; a shower where every
// drop kept exact pace was a curtain sliding down. It is wide, because the
// speed is also the depth -- see RAIN_DASH_MIN.
export let RAIN_FALL = 6.5;
export let RAIN_FALL_GIVE = 4;
// How far the wind carries a drop sideways at a full gust. A drop is light and
// goes where the air goes, so the whole sheet leans together and swings with
// the gust; the dash is drawn along the way its drop is actually going --
// straight down in a lull, slanted in a blow.
export let RAIN_LEAN = 2.2;
// How long a dash is, in cells, from the slowest drop to the fastest. A streak
// is how far a drop goes while the eye holds it, so the fast ones are the long
// ones -- and since the fast ones are the near ones, the shower gets a depth
// to it: short flecks far off, long strokes close in. Every dash one length
// was a stencil.
export const RAIN_DASH_MIN = 2;
export const RAIN_DASH_MAX = 5;
// Lightning. Weather only: a strike costs the yard nothing and touches no
// body, it is the storm being seen. It comes with the pour -- the odds a
// second scale with the square of the storm envelope, so a drizzle almost
// never flashes and the full pour does about every BOLT_EVERY_S seconds.
export let BOLT_EVERY_S = 9;        // mean seconds between strikes at full pour
export const BOLT_LIFE_S = 0.3;     // how long the bolt hangs in the sky, fading out
export const BOLT_FLASH_S = 0.05;   // and for how much of that the whole window inverts
// The bolt's shape, in cells: it comes down BOLT_STEP cells a segment and jogs
// up to BOLT_JOG cells sideways each one, with a shorter fork off it somewhere
// between the two shares of its length, running BOLT_FORK_LEN segments.
export const BOLT_STEP = 2;
export const BOLT_JOG = 2;
export const BOLT_KINK = 0.35;      // the chance a segment changes its jog, else it keeps going
export const BOLT_FORK_AT = [0.3, 0.6];
export const BOLT_FORK_LEN = 4;
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
export const RAIN_MARK = 0.1667;
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
// How much of a swing is left while a body is still thrown into it. A lean is
// drawn as a pose -- out for the first part of the swing, back on its cell for
// the rest -- rather than eased pixel by pixel the way a stoop is: a stoop
// easing up reads as a body straightening, but a body sliding back sideways a
// pixel a frame, three and a half times a second, is a body vibrating. Above
// this the lean is drawn at its full throw; below it, not at all.
export const LEAN_HOLD = 0.5;

// The scrubbing house: a place with nobody in it does nothing at all.
// The front of the scrubbing house, in cells. These live here rather than in the
// drawing because the drawing is not the only thing that depends on them: the
// recycler's grain is released from the cell under the chute's lip, and a chute
// drawn off one number while the grain leaves from another is a spout that misses
// its own spout the first time either is touched.
// The way in is DOOR_W by DOOR_H like every other way in -- see there. It is
// named here only because the courses of foot under the works have to be deep
// enough to hold it.

// wave7-sky (A1): each climbing puff wanders sideways on its own seed, so the
// plume opens into a cone as it rises instead of standing as a vertical band.
// Amplitude in world pixels a second; the sine on the mote's own seed keeps two
// puffs from ever wandering in step.
export let PUFF_WANDER = 14;

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const SKY_KNOBS = [
  { key: 'SMOG_PER_DUST', label: 'soot a grain', min: 0, max: 1.5, step: 0.02,
    get: () => SMOG_PER_DUST, set: v => { SMOG_PER_DUST = v; } },
  { key: 'SMOG_RAIN_BEND', label: 'rain bend', min: 1, max: 8, step: 0.1,
    get: () => SMOG_RAIN_BEND, set: v => { SMOG_RAIN_BEND = v; } },
  // wave6-sky: the storm's own knobs
  { key: 'RAIN_PER_S', label: 'rain rate', min: 100, max: 3000, step: 25,
    get: () => RAIN_PER_S, set: v => { RAIN_PER_S = v; } },
  { key: 'STORM_BREW_S', label: 'storm brew', min: 0, max: 60, step: 1,
    get: () => STORM_BREW_S, set: v => { STORM_BREW_S = v; } },
  { key: 'RAIN_DRIZZLE_S', label: 'drizzle', min: 0, max: 20, step: 0.5,
    get: () => RAIN_DRIZZLE_S, set: v => { RAIN_DRIZZLE_S = v; } },
  { key: 'RAIN_RISE_S', label: 'rain rise', min: 0.5, max: 20, step: 0.5,
    get: () => RAIN_RISE_S, set: v => { RAIN_RISE_S = v; } },
  { key: 'RAIN_FALL', label: 'rain speed', min: 1, max: 12, step: 0.25,
    get: () => RAIN_FALL, set: v => { RAIN_FALL = v; } },
  { key: 'RAIN_FALL_GIVE', label: 'rain spread', min: 0, max: 8, step: 0.25,
    get: () => RAIN_FALL_GIVE, set: v => { RAIN_FALL_GIVE = v; } },
  { key: 'RAIN_LEAN', label: 'rain lean', min: 0, max: 6, step: 0.1,
    get: () => RAIN_LEAN, set: v => { RAIN_LEAN = v; } },
  { key: 'BOLT_EVERY_S', label: 'lightning every', min: 1, max: 60, step: 1,
    get: () => BOLT_EVERY_S, set: v => { BOLT_EVERY_S = v; } },
  // wave7-sky
  { key: 'PUFF_WANDER', label: 'puff wander', min: 0, max: 40, step: 1,
    get: () => PUFF_WANDER, set: v => { PUFF_WANDER = v; } }
];
