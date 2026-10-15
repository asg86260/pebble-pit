// The pointing hands at the portal (render/shaftway.js) say it is there and
// clickable; once the player has gone down it and come back up by their own
// hand they fade out and stay gone, across a reload, with the portal itself
// still the click and the stop. The way there is view.js's, as the pointer and
// the pad both take it (input.js, pad.js); the pointer's own is the browser
// tier's `deep:` group.

import { group, ok, run, yard } from './helpers.mjs';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const { goDeep, goUp } = await import('../src/view.js');
const { VIEW_GLIDE_S, SHAFT_HAND_FADE_S } = await import('../src/config.js');
const { arrowShown, arrowBox, onShaftArrow } = await import('../src/render/shaftway.js');
const { onPortal } = await import('../src/render/portal.js');
const { portalCircle, deepPortal } = await import('../src/deep/place.js');
const { stopById } = await import('../src/stops.js');

group('the hands fade after the round trip, not after one way, and stay gone', async () => {
  window.__crew(3, 3, 5, 7);
  window.__snatch({ played: true });
  S.beatsDone.push('abyss');
  run(2);
  const before = { shown: arrowShown(), alpha: S.portalHand };
  // Down: the way is one half of the trip.
  goDeep();
  run(VIEW_GLIDE_S + 3);
  const below = { view: S.view, alpha: S.portalHand, round: S.portalRound };
  // Up: now it is a round trip. The fade starts on arrival and runs its time.
  goUp();
  run(VIEW_GLIDE_S + 0.2);
  const mid = S.portalHand;
  run(SHAFT_HAND_FADE_S / 2);
  const half = S.portalHand;
  run(SHAFT_HAND_FADE_S + 1);
  const gone = { alpha: S.portalHand, shown: arrowShown() };
  // A reload keeps it gone.
  yard.persist();
  const raw = localStorage.getItem(KEY);
  window.__seed(1);
  localStorage.setItem(KEY, raw);
  yard.restore();
  run(0.5);
  const c = portalCircle(), b = arrowBox(false);
  const clickOnPortal = onPortal(c.x, c.y);
  const stopYard = stopById('way:portal:yard'), stopArrow = stopById('way:arrow:yard');
  S.view === 'yard' && goDeep();
  run(VIEW_GLIDE_S + 0.5);
  const d = deepPortal();
  return [
    ok(before.shown && before.alpha === 1, 'the hand stands at full strength before any trip', JSON.stringify(before)),
    ok(below.view === 'deep' && below.alpha === 1 && !below.round, 'one way down is not enough: the hand is still whole', JSON.stringify(below)),
    ok(mid > 0 && mid < 1, 'coming back up starts the fade, not a cut', String(mid)),
    ok(half < mid && half > 0, 'it is a fade over time, not a step', `${mid} -> ${half}`),
    ok(gone.alpha === 0 && !gone.shown, 'and when it is spent the hands are gone', JSON.stringify(gone)),
    ok(S.portalRound && S.portalHand === 0, 'a reload keeps them gone', `${S.portalRound} ${S.portalHand}`),
    ok(!onShaftArrow(b.x + 1, b.y + 1) && !stopArrow, 'the hand takes no click and is no stop once gone'),
    ok(clickOnPortal && stopYard, 'but the portal is still the click and the stop at the yard end'),
    ok(S.view === 'deep' && onPortal(d.x, d.y), 'and still takes the view down, and its deep end is still clickable', S.view)
  ];
});
