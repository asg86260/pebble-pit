// The acts' two portals (portals.js; DESIGN.md, "Acts 3 and 4", "The portals
// and the mansion"): heaven's between the yard and the afterlife, hell's
// between the deep and hell. Each is taken the way a player takes it -- a
// press on its ring, which is what the pointer and the pad both call
// (input.js, pad.js: `portalAt` then `throughPortal`) -- and each goes by the
// ripple, never a cut: the place left stays on screen while the ring grows or
// closes, and the camera lands framed on the far end. The hands beside each
// fade after the round trip. A reload in the middle of a glide lands in the
// nearer place, never between.
import { group, ok, run, yard } from './helpers.mjs';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const { VIEW_GLIDE_S, ACT_HAND_FADE_S } = await import('../src/config.js');
const { portalAt, portalEnd, throughPortal, handShown, portalFree } = await import('../src/portals.js');
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
  const before = { free: portalFree('heaven'), hand: handShown('heaven'), stop: !!stopById('act:heaven:yard') };
  const went = press('heaven');
  run(1 / 60);
  const mid = { view: S.view, gliding: gliding(), rip: ripple() };
  run(VIEW_GLIDE_S + 0.5);
  const up = { view: S.view, centered: centered('heaven', 'after'), stop: !!stopById('act:heaven:after') };
  const back = press('heaven');
  run(1 / 60);
  const midBack = { view: S.view, gliding: gliding(), rip: ripple() };
  run(VIEW_GLIDE_S + 0.5);
  const down = { view: S.view, centered: centered('heaven', 'yard') };
  run(ACT_HAND_FADE_S + 1);
  const hand = { shown: handShown('heaven'), hand: S.acts.portals.heaven.hand };
  window.__actsOn(null);
  return [
    ok(before.free && before.hand && before.stop, 'with the road open the portal is the player\'s: a ring, a hand, a stop', JSON.stringify(before)),
    ok(went && mid.view === 'yard' && mid.gliding && mid.rip && mid.rip.inner === 'after' && mid.rip.r > 0,
       'a press starts the ripple: the yard stays on screen and the afterlife shows through the ring', JSON.stringify({ went, ...mid })),
    ok(up.view === 'after' && up.centered && up.stop, 'and the camera lands up there, on the portal\'s far end', JSON.stringify(up)),
    ok(back && midBack.view === 'yard' && midBack.gliding && midBack.rip && midBack.rip.inner === 'after',
       'back down: the yard put back first, the afterlife closing over it onto the ring', JSON.stringify({ back, ...midBack })),
    ok(down.view === 'yard' && down.centered, 'and the camera is on the tear over the ruin', JSON.stringify(down)),
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

group('neither portal is the player\'s before its beat, though a beat may take the camera through', async () => {
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
    ok(!heaven.free && heaven.at === null && !heaven.went, 'in act 3 the tear carries nobody back down by a press', JSON.stringify(heaven)),
    ok(!hell.free && !hell.went && S.view === 'deep', 'and hell\'s is not there to press', JSON.stringify(hell))
  ];
});
