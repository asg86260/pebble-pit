// Heaven's gates are a way back down at any time in act 3 (the owner,
// 2026-10-19: "it should take you back down always"), not only once the
// strike has opened the road. The act played from the go-on card to the pair
// on the pedestal; then a press on the gates where the pointer lands one
// (portals.js `portalAt`, then `throughPortal`, as input.js does) takes the
// camera down to the yard, and a press on the yard's end brings it back up.
import { group, ok, run, runUntil, yard } from './helpers.mjs';

const S = yard.S;
const { portalAt, portalEnd, throughPortal, portalFree } = await import('../src/portals.js');
const { gliding } = await import('../src/view.js');
const { goOnAlpha, sayGoOn } = await import('../src/actbeats.js');
const { beatDone } = await import('../src/beats.js');

// A press on the gates of the place on screen, through the pointer's own hit test.
function pressGates() {
  const e = portalEnd('heaven', S.view);
  const key = portalAt(e.x, (e.top + e.feet) / 2);
  return key === 'heaven' && throughPortal(key);
}

group('mid-act, a press on heaven\'s gates takes you down to the yard, and one on the yard\'s brings you back', async () => {
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('home');
  runUntil(() => goOnAlpha() >= 1, 60);
  sayGoOn();
  const up = runUntil(() => beatDone('refuse') && S.view === 'after' && !gliding(), 300);
  const free = portalFree('heaven');
  const down = pressGates();
  const landed = runUntil(() => S.view === 'yard' && !gliding(), 30);
  const back = pressGates();
  const returned = runUntil(() => S.view === 'after' && !gliding(), 30);
  const struck = beatDone('strike');
  window.__actsOn(null);
  return [
    ok(up, 'the act plays from the go-on card to the pair on the pedestal', S.beatsDone.join(' ')),
    ok(free, 'the gates are the player\'s from the arrival on'),
    ok(down && landed, 'a press on the gates up there takes the camera down to the yard', `${down} ${S.view}`),
    ok(back && returned, 'and a press on the yard\'s gates brings it back up', `${back} ${S.view}`),
    ok(!struck, 'all of it mid-act, before the strike')
  ];
}, { reload: false });
