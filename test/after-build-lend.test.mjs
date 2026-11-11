// Act 3's builders are chosen by the yard's rule (crew/sitework.js,
// `manSites`): with nobody idle and nobody in the crowd, the member at a post
// nearest the work is lent to it, the loan on the body (`lentFrom`) as the
// yard's is, and once nothing is left to build it goes back to its own post.
import { readFileSync } from 'node:fs';
import { yard, group, ok, runUntil, run } from './helpers.mjs';

group('act 3 lends a posted member to a build with nobody spare, and it goes home', async () => {
  localStorage.setItem('boulder-clicker/v4', readFileSync(new URL('./fixtures/act3-mid-build.json', import.meta.url), 'utf8'));
  yard.restore();
  window.__actsOn(true);
  const S = yard.S;
  // Two woodcutters at the grove, and then nobody else: no idle member, no crowd.
  S.after.crew = { woodcutter: 2 };
  runUntil(() => S.after.bodies.filter(b => b.job === 'woodcutter' && b.on).length >= 2, 60);
  S.after.camp = 0;
  S.after.bodies = S.after.bodies.filter(b => b.job === 'woodcutter');
  for (const b of S.after.bodies) b.errand = null;
  let lent = null;
  runUntil(() => (lent = S.after.bodies.find(b => b.lentFrom)), 30);
  const was = lent && { id: lent.id, from: lent.lentFrom, job: lent.job };
  // A refresh mid-loan: the loan is on the same body afterwards.
  window.__reload();
  const kept = was && S.after.bodies.find(b => b.id === was.id);
  const keptLoan = !!kept && kept.lentFrom === was.from && kept.job === 'builder';
  const stood = runUntil(() => S.after.built.includes('mill'), 300);
  run(5);
  const back = was && S.after.bodies.find(b => b.id === was.id);
  window.__actsOn(null);
  return [
    ok(!!was && was.from === 'woodcutter' && was.job === 'builder', 'a woodcutter is lent to the mill, its loan on the body', JSON.stringify(was)),
    ok(keptLoan, 'a refresh mid-build keeps the loan on the same body', kept && `${kept.job} ${kept.lentFrom}`),
    ok(stood, 'the lent member finishes the mill'),
    ok(!S.after.bodies.some(b => b.lentFrom), 'no loan is left once nothing is left to build'),
    ok(!!back && back.job === was.from, 'the lent member is back at its own post', back && back.job)
  ];
});
