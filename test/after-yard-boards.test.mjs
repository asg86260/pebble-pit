// The owner, 2026-10-20: "if youre on the surface, you should be able to open
// boards." Heaven's gates take the player down to the yard at any time in
// act 3, so the yard's rows must sell there, with the house fallen.
import { group, ok, run, runUntil, yard } from './helpers.mjs';

const S = yard.S;
const { portalAt, portalEnd, throughPortal } = await import('../src/portals.js');
const { gliding } = await import('../src/view.js');
const { goOnAlpha, sayGoOn } = await import('../src/actbeats.js');
const { beatDone } = await import('../src/beats.js');

group('down on the yard in act 3, a yard row can be bought', async () => {
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('home');
  runUntil(() => goOnAlpha() >= 1, 60);
  sayGoOn();
  runUntil(() => beatDone('refuse') && S.view === 'after' && !gliding(), 300);
  const e = portalEnd('heaven', S.view);
  const key = portalAt(e.x, (e.top + e.feet) / 2);
  const down = key === 'heaven' && throughPortal(key);
  const landed = runUntil(() => S.view === 'yard' && !gliding(), 30);
  window.__machineGates();
  window.__grant({ dust: 5e6, shards: 5000, spores: 5000, sparks: 5000 });
  run(1);
  const bought = window.__buy('jaw');
  window.__actsOn(null);
  return [
    ok(down && landed, 'the gates take the camera down to the yard', `${down} ${S.view}`),
    ok(S.acts && S.acts.house === 'fallen', 'with the house fallen', String(S.acts && S.acts.house)),
    ok(bought, 'and a yard row bought through its shop row')
  ];
}, { reload: false });
