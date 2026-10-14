// The weather's muck does not stop the air filter (the owner, 2026-10-14):
// only what the filter itself makes may ever clog it. Nothing clogs it now --
// the shed's own spout, heap and clog went when the balloons took over the
// cleaning (DESIGN.md, "The air filter is the balloons' shed") -- so this is
// the decision pinned for whoever builds the balloons' clog: a dirty shower
// that buries the shed's ground and the yard under a working craft leaves
// the craft up and the sky still coming down.

import { group, ok, state, run, runUntil, buyNow, openSites, makeItRain, yard } from './helpers.mjs';

const S = yard.S;
const P = 6;

// Muck lying on the columns under a stretch of the world.
const muckOver = (from, to) => {
  let n = 0;
  for (let c = Math.floor(from / P); c <= Math.floor(to / P); c++) n += (S.muck && S.muck[c]) || 0;
  return n;
};

group('a dirty shower that mucks the filter and the yard under its balloon does not stop it', async () => {
  window.__reset();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__tip(90000);
  openSites();
  window.__machine('ram', { bought: true });
  S.crew += 4;                    // hands to spare once the places are open
  window.__air({ rains: 1 });
  S.seenAir = true;
  run(2);
  const bought = buyNow('unlockfilter');
  const up = runUntil(() => state().craft[0] && state().craft[0].up, 120);

  // The weather the game's own way: a brim sky and the next front at full
  // heft, rained out to its last drop.
  const rained = makeItRain(180, 1);
  const done = runUntil(() => !state().smog.raining && !state().smog.drops, 240);
  run(1);
  const shed = yard.filter;
  const underShed = muckOver(shed.x - 10 * P, shed.x + shed.w + 10 * P);
  const craft = state().craft[0];
  const underCraft = muckOver(craft.x - 10 * P, craft.x + 10 * P);
  const all = (S.muck || []).reduce((n, v) => n + (v || 0), 0);

  // Then a sky the craft has to work at, with nothing fouling it behind.
  window.__machine('ram', { bought: false });
  window.__air({ haze: Math.round(state().smog.cap / 2) });
  run(1);
  const was = state().smog.haze;
  run(30);
  const after = state();
  return [
    ok(bought && up, 'the filter is bought and its balloon goes up'),
    ok(rained && done, 'a dirty shower falls and finishes'),
    ok(all > 0 && underShed > 0, 'and leaves muck across the yard, the shed\'s ground among it',
       `${all} on the yard, ${underShed} around the shed, ${underCraft} under the craft`),
    ok(after.craft[0].up, 'the balloon is still up and drawing', JSON.stringify(after.craft[0])),
    ok(after.smog.haze < was, 'and the sky still comes down', `${was} -> ${after.smog.haze}`)
  ];
});
