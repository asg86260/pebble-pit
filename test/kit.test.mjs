// The kit: one hat, one table, one count of it.
//
// A hat belongs to the station, not to the head under it, and everything that
// follows from that sentence is checked here. The two things that kept going
// wrong were a hat being *counted* in one place while it sat on a head
// somewhere else, and a hat being *drawn* by a rule that only some kinds of body
// went through -- so the checks are about the books and about the table, which
// are the two places the drawing and the errand both read from.

import { group, ok, state, run } from './helpers.mjs';
import { KIT, KIT_JOBS, KIT_MARK, TRADE_OF, boughtKit } from '../src/kit.js';

const detail = () => state().crewDetail.map(d => {
  const [t, goal, x, c, k, p, w] = d.split('|');
  return { t, kit: w.slice(1) };
});
const roster = () => state().roster;

group('the kit table is the only list of hats there is', async () => {
  window.__reset();

  // Every job with a hat has a shape for it, and every shape belongs to a job.
  // These used to be three separate tables in three files, and the janitor was
  // in one of them -- which is why its cap was drawn by a branch that named it
  // and believed in by nothing else.
  const jobs = Object.keys(KIT);
  const noMark = jobs.filter(j => !KIT_MARK[j]);
  const fetched = KIT_JOBS.slice().sort();
  const traded = Object.keys(TRADE_OF).sort();

  return [
    ok(noMark.length === 0, 'every hat in the table has a shape', noMark.join(' ')),
    // One list, not two that have to be kept level. A job is fetched for exactly
    // when there is something to fetch, which is the same fact as having a trade.
    ok(fetched.join() === traded.join(),
       'and the jobs that send somebody for a hat are the jobs that sell one',
       `${fetched.join(' ')} against ${traded.join(' ')}`),
    // The janitor's cap: in the same table as the rest, marked as the one kind
    // nobody buys, so no code anywhere has to know its name.
    ok(!!KIT.janitors && KIT.janitors.innate && !boughtKit('janitors'),
       'and a hat that is the job rather than a doubling on it says so in the table',
       JSON.stringify(KIT.janitors))
  ];
});

group('a hat is counted where it actually is', async () => {
  window.__reset();
  window.__crew(3, 3, 0, 0);
  window.__school({ breakers: 3 });
  run(10);

  const wearing = () => detail().filter(b => b.kit !== '-');
  const worn = () => roster().find(r => r.job === 'miners');

  const atWork = worn();
  // Everybody off the rock. The helmets stay at the rock -- that is the whole
  // point of the kit belonging to the station -- and until they have been
  // carried back they are on heads, not on the stand.
  window.__assign('miners', -3);
  run(0.2);
  const midWalk = worn();
  run(20);
  const settled = worn();
  const strays = detail().filter(b => b.kit !== '-' && b.kit !== b.t);

  return [
    ok(atWork.hats === 3 && atWork.worn === 3, 'three helmets, three heads',
       `${atWork.hats}/${atWork.worn}`),
    // The bug this is for: `worn` used to be counted off the job a body was on,
    // so the moment somebody was moved to carrying, the rock stopped counting
    // the helmet on its head and offered it to the next body along. One helmet,
    // two heads, and a count that said everything was fine.
    ok(midWalk.hats >= midWalk.worn,
       'and never more heads wearing them than there are helmets',
       `${midWalk.hats} helmets, ${midWalk.worn} worn`),
    ok(settled.worn === 0, 'they are handed back in when the rock is empty',
       `${settled.worn} still out`),
    ok(strays.length === 0, 'and nobody is left walking about in somebody else\'s',
       JSON.stringify(strays))
  ];
});

group('kit finds its way home however the walk is interrupted', async () => {
  window.__reset();
  window.__crew(3, 3, 0, 0);
  window.__school({ breakers: 3, growers: 2 });
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  run(12);

  // Churn: bodies moved on and off jobs while the yard is busy, so plenty of
  // hat-carrying walks get abandoned half way. The errand is a list of legs and
  // a list of legs is dropped the moment anything more urgent happens -- which
  // is why the rule cannot only live in the errand. `stepKit` reasserts it.
  for (let n = 0; n < 8; n++) {
    window.__assign('miners', n % 2 ? 2 : -2);
    window.__assign('farmhands', n % 2 ? -1 : 1);
    window.__muckSet(c => (c % 5 === 0 ? 2 : 0));
    run(3);
  }
  run(30);                                  // and time to put everything straight

  const strays = detail().filter(b => b.kit !== '-' && b.kit !== b.t);
  const over = roster().filter(r => r.hats < r.worn);

  return [
    ok(over.length === 0, 'no station ever has more of its kit worn than it owns',
       JSON.stringify(over.map(r => [r.job, r.hats, r.worn]))),
    ok(strays.length === 0,
       'and after the churn nobody is wearing kit for a job they are not on',
       JSON.stringify(strays))
  ];
});
