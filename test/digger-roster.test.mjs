// The diggers' roster stands centered under the rock, before the shack is
// bought and after: the shack's own board and roster are its own, and the
// post for the rock's job does not follow it.

import { group, ok, run, yard } from './helpers.mjs';
import { P } from '../src/config.js';
import { rosterReport, posts } from '../src/roster.js';

const S = yard.S;
const mid = () => { const r = rosterReport().find(q => q.key === 'mine'); return r && (r.span[0] + r.span[1]) / 2; };

group('the diggers stand under the rock, and keep to it once the shack is bought', async () => {
  window.__reset();
  window.__crew(3, 6, 3, 3);
  run(2);
  const before = mid();
  window.__grant({ dust: 1e9, shards: 1e7, spores: 1e7, sparks: 1e6 });
  const bought = window.__buy('unlockshack');
  window.__finish();
  run(3);
  const after = mid();
  return [
    ok(before != null && Math.abs(before - S.cx) <= P, 'before the shack the roster is under the rock', `${before} against ${S.cx}`),
    ok(bought && S.shackOpen, 'the shack is bought through its row'),
    ok(after != null && Math.abs(after - S.cx) <= P, 'after the shack the roster is still under the rock', `${after} against ${S.cx}`),
    ok(posts().some(p => p.key === 'mine'), 'the post is the rock\'s')
  ];
});
