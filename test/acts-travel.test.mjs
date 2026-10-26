// The acts' two portals (portals.js; DESIGN.md, "Acts 3 and 4", "The portals
// and the mansion"): heaven's between the yard and the afterlife, hell's
// between the deep and hell. Each is taken the way a player takes it -- a
// press on its ring or its gates, which is what the pointer and the pad both
// call (input.js, pad.js: `portalAt` then `throughPortal`) -- and each goes by
// the ripple, never a cut: the place left stays on screen while the ring grows
// or closes, and the camera lands framed on the far end. Heaven's gates sink
// open smoothly before the ripple, stand open a beat, and rise shut the same
// way after the camera has come through. The hands beside each fade after the round trip.
// A reload in the middle of a glide lands in the nearer place, never between.
import { group, ok, run, runUntil, yard } from './helpers.mjs';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const { VIEW_GLIDE_S, ACT_HAND_FADE_S, ACT_GATES_SINK_S, ACT_GATES_STAND_S, ACT_GATES_HOLD_S } = await import('../src/config.js');
const { portalAt, portalEnd, throughPortal, handShown, portalFree, gatesOpen } = await import('../src/portals.js');
// The most of the sink one frame may make: a share more is a jump.
const MOST = 1 / 60 / ACT_GATES_SINK_S + 1e-9;
const { ripple, gliding } = await import('../src/view.js');
const { stopById } = await import('../src/stops.js');

// A press on the ring of `key` at the end standing in the place on screen.
function press(key) {
  const e = portalEnd(key, S.view);
  const at = portalAt(e.x, e.y);
  return at === key && throughPortal(at);
}
const centered = (key, place) => Math.abs(S.camX + S.viewW / 2 - portalEnd(key, place).x) <= S.viewW / 2;

group("heaven's portal: the yard and the afterlife, by the ripple, both ways", async () => {
  window.__actsOn(true);
  window.__crew(2, 1);
  window.__actsAt('act4');
  window.__view('yard');
  run(1);
  const before = { free: portalFree('heaven'), hand: handShown('heaven'), stop: !!stopById('act:heaven:yard'), shut: gatesOpen() };
  const went = press('heaven');
  // the leaves, a frame at a time until the ripple starts: never back, never
  // more than a frame's share of the sink at once (no held steps, no jump),
  // and no ripple before they have stood open ACT_GATES_STAND_S
  const opens = [gatesOpen()];
  let early = false, open = 0;
  for (let i = 0; i < 60 * 3 && !gliding(); i++) {
    run(1 / 60); opens.push(gatesOpen());
    if (opens.at(-2) >= 1) open += 1 / 60;
    if (gliding() && open < ACT_GATES_STAND_S - 1e-6) early = true;
  }
  const opening = { went, early, open, back: opens.some((v, i) => i && v < opens[i - 1]),
                    jumps: opens.some((v, i) => i && v - opens[i - 1] > MOST), between: opens.filter(v => v > 0 && v < 1).length };
  run(1 / 60);
  const mid = { view: S.view, gliding: gliding(), rip: ripple(), open: gatesOpen() };
  run(VIEW_GLIDE_S + 0.5);
  const up = { view: S.view, centered: centered('heaven', 'after'), stop: !!stopById('act:heaven:after') };
  const back = press('heaven');
  runUntil(() => gliding(), 3);
  const midBack = { view: S.view, gliding: gliding(), rip: ripple() };
  run(VIEW_GLIDE_S + 0.1);
  const down = { view: S.view, centered: centered('heaven', 'yard'), open: gatesOpen() };
  // and shut behind the camera, the same sink the other way
  const closing = [gatesOpen()];
  for (let i = 0; i < 60 * (ACT_GATES_HOLD_S + ACT_GATES_SINK_S + 1); i++) { run(1 / 60); closing.push(gatesOpen()); }
  const shut = { end: gatesOpen(), up: closing.some((v, i) => i && v > closing[i - 1]),
                 jumps: closing.some((v, i) => i && closing[i - 1] - v > MOST), between: closing.filter(v => v > 0 && v < 1).length };
  run(ACT_HAND_FADE_S + 1);
  const hand = { shown: handShown('heaven'), hand: S.acts.portals.heaven.hand };
  window.__actsOn(null);
  return [
    ok(before.free && before.hand && before.stop, 'with the road open the portal is the player\'s: a ring, a hand, a stop', JSON.stringify(before)),
    ok(before.shut === 0 && opening.went && !opening.early && !opening.back && !opening.jumps && opening.between >= ACT_GATES_SINK_S * 60 - 2,
       'a press sinks the gates open smoothly, a frame\'s share at a time, and nothing goes through before they have stood open', JSON.stringify(opening)),
    ok(mid.view === 'yard' && mid.gliding && mid.rip && mid.rip.inner === 'after' && mid.rip.r > 0 && mid.open === 1,
       'then the ripple: the yard stays on screen and the afterlife shows through it out of the open gates', JSON.stringify(mid)),
    ok(up.view === 'after' && up.centered && up.stop, 'and the camera lands up there, on the portal\'s far end', JSON.stringify(up)),
    ok(back && midBack.view === 'yard' && midBack.gliding && midBack.rip && midBack.rip.inner === 'after',
       'back down: the yard put back first, the afterlife closing over it onto the ring', JSON.stringify({ back, ...midBack })),
    ok(down.view === 'yard' && down.centered && down.open === 1, 'and the camera is on the gates in the yard, still open', JSON.stringify(down)),
    ok(shut.end === 0 && !shut.up && !shut.jumps && shut.between >= ACT_GATES_SINK_S * 60 - 2, 'which then rise shut the same way', JSON.stringify(shut)),
    ok(!hand.shown && hand.hand === 0, 'the round trip made, the hand has faded and stays gone', JSON.stringify(hand))
  ];
});

group("hell's portal: the deep and hell, by the ripple; a reload mid-glide lands in the nearer place", async () => {
  window.__actsOn(true);
  window.__crew(2, 1);
  S.portalOpen = true;
  window.__actsAt('act4');
  window.__view('deep');
  run(1);
  const went = press('hell');
  run(1 / 60);
  const mid = { view: S.view, gliding: gliding(), inner: ripple() && ripple().inner };
  run(VIEW_GLIDE_S + 0.5);
  const there = { view: S.view, centered: centered('hell', 'hell') };
  // away and back again, with a reload while the ring is closing
  press('hell');
  run(VIEW_GLIDE_S / 3);
  yard.persist();
  const saved = JSON.parse(localStorage.getItem(KEY)).view;
  // a fresh page: no glide under way (S.viewTo is this session's)
  S.viewTo = null; S.viewFade = 0;
  yard.restore();
  run(1 / 60);
  const reloaded = { saved, view: S.view, gliding: gliding() };
  run(1);
  window.__actsOn(null);
  return [
    ok(went && mid.view === 'deep' && mid.gliding && mid.inner === 'hell', 'a press on the slit ripples: the deep stays, hell shows through', JSON.stringify({ went, ...mid })),
    ok(there.view === 'hell' && there.centered, 'and lands in hell on the portal\'s end', JSON.stringify(there)),
    ok(reloaded.saved === 'deep' && reloaded.view === 'deep' && !reloaded.gliding, 'a reload mid-glide is in the deep, not between', JSON.stringify(reloaded))
  ];
});

group('in act 3 heaven\'s gates are the player\'s, and hell\'s portal is not before its beat', async () => {
  window.__actsOn(true);
  window.__crew(2, 1);
  window.__actsAt('fallen');
  window.__view('yard');
  run(1);
  const e = portalEnd('heaven', 'yard');
  const heaven = { free: portalFree('heaven'), at: portalAt(e.x, e.y), went: throughPortal('heaven') };
  S.portalOpen = true;
  window.__view('deep');
  const hell = { free: portalFree('hell'), went: throughPortal('hell') };
  run(1);
  window.__actsOn(null);
  return [
    // the owner, 2026-10-19: the gates take you back down at any time in act 3
    ok(heaven.free && heaven.at === 'heaven' && heaven.went, 'in act 3 a press on the yard\'s gates goes through them', JSON.stringify(heaven)),
    ok(!hell.free && !hell.went && S.view === 'deep', 'and hell\'s is not there to press', JSON.stringify(hell))
  ];
});

// The gates come after the house: while it stands there is nothing on the
// cloud (no stair, no bank, no gates, nothing to press); they are let down,
// fading in, only once the rock has smashed it (the owner, 2026-10-20).
group('heaven\'s gates are not there while the house stands, and fade in after it is smashed', async () => {
  const { sayGoOn, goOnAlpha } = await import('../src/actbeats.js');
  const { portalOpenK } = await import('../src/portals.js');
  const { ACT_GOON_WAIT_S, ACT_GOON_FADE_S, ACT_PORTAL_OPEN_S } = await import('../src/config.js');
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('home');
  window.__view('yard');
  runUntil(() => goOnAlpha() >= 1, 4 * (ACT_GOON_WAIT_S + ACT_GOON_FADE_S));
  sayGoOn();
  const e = portalEnd('heaven', 'yard');
  const before = { frames: 0, there: 0, pressable: 0 }, after = { first: null, jump: 0, whole: false };
  let was = 0;
  for (let i = 0; i < 60 * 90 && !after.whole; i++) {
    run(1 / 60);
    const k = portalOpenK('heaven');
    if (S.acts.house === 'standing') {
      before.frames++;
      if (k > 0) before.there++;
      if (portalAt(e.x, e.y)) before.pressable++;
    } else {
      if (k > 0 && after.first == null) after.first = k;
      after.jump = Math.max(after.jump, k - was);
      if (k >= 1) after.whole = true;
    }
    was = k;
  }
  window.__actsOn(null);
  return [
    ok(before.frames > 0 && before.there === 0 && before.pressable === 0, 'while the house stands the gates are not there and nothing is pressed', JSON.stringify(before)),
    ok(after.whole && after.first < 0.05 && after.jump <= 1 / 60 / ACT_PORTAL_OPEN_S + 1e-3, 'after its fall they fade in, never popping', JSON.stringify(after))
  ];
});
