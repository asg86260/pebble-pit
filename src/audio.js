// The sound of the yard -- the seam, before the engine.
//
// This is the stub the wave starts from (docs/wave-desk-sound.md): the five
// exports every caller is written against, counting what it is asked to do
// and doing nothing else. Track B replaces this file wholesale with the
// engine; track C writes its calls against these signatures. Nothing here
// names an AudioContext, and nothing here ever will outside this file.

let awake = false;
const decisions = { fired: 0, dropped: 0, folded: 0,
                    byClass: { hand: 0, fold: 0, punct: 0 },
                    beds: { water: 0, air: 0, rift: 0, hum: 0 } };

// Something physically happened at world x: a pick met stone, a load hit the
// belt, a building landed. `voice` is one of stone, wood, metal, water, air,
// rift; `opts` is { x, hard, big, crit, cls } with cls one of 'hand', 'fold'
// (the default) or 'punct'. Before the first gesture it is a no-op, and
// nothing is queued.
export function sfx(voice, opts = {}) {
  if (!awake) return;
  const cls = opts.cls || 'fold';
  decisions.fired++;
  decisions.byClass[cls] = (decisions.byClass[cls] || 0) + 1;
}

// Once a frame: the beds follow the yard's state.
export function stepAudio(dt) {}

// The first real pointer gesture; until then the browser allows nothing.
export function wakeAudio() { awake = true; }

export function muteAudio(on) {}

// The decision half, for the node tier: what was fired, dropped and folded
// since wake, and where each bed's target stands.
export function audioDecisions() { return decisions; }
