// A save taken with act 3's saw mill half raised in the old way, two of its
// four bands laid off a pile of carried loads (made from the `after-camp`
// setup on 2026-11-10, before act 3 built through the yard's construction).
// Read today, the half-raised mill is a work on the yard's works, half done:
// its sign does not come back and its bill is not asked again, nothing of
// the old site is left lying or in anybody's arms, and the mill stands once
// a builder has finished it (DESIGN.md, "Act 3 builds through the yard's
// construction", section 5).
import { readFileSync } from 'node:fs';
import { yard, group, ok, runUntil } from './helpers.mjs';
import { workOn, progressOf } from '../src/works.js';
import { units } from '../src/after/ground.js';
import { signs } from '../src/buildsign.js';
import { afterRow } from '../src/after/rows.js';
import { forSale } from '../src/upgrades.js';

group('a station saved half raised in bands is a half-done work, paid for once, and stands', async () => {
  localStorage.setItem('boulder-clicker/v4', readFileSync(new URL('./fixtures/act3-mid-build.json', import.meta.url), 'utf8'));
  yard.restore();
  window.__actsOn(true);
  const S = yard.S;
  const w = workOn('after-build-mill');
  const share = w ? progressOf(w) : -1;
  const sign = signs('after').some(s => s.key === 'after-mill');
  const again = forSale(afterRow('after-build-mill'));
  const loads = units().filter(u => u.kind === 'load').length;
  const old = S.after.bodies.filter(b => b.site === 'mill' || b.phase === 'carry' || b.phase === 'lay').length;
  const stood = runUntil(() => S.after.built.includes('mill'), 240);
  window.__actsOn(null);
  return [
    ok(Math.abs(share - 0.5) < 0.01, 'the mill is a work on the yard\'s works, half done, as its two bands of four were', `${share}`),
    ok(!sign && !again, 'its sign does not come back and its row cannot be bought again', `sign ${sign}, for sale ${again}`),
    ok(loads === 0 && old === 0, 'no load lies on the ground and no body keeps the old site', `${loads} loads, ${old} bodies`),
    ok(stood, 'a builder finishes it and the mill stands')
  ];
});
