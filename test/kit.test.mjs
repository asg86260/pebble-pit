// The kit: one hat, one table, one count of it.
//
// A hat belongs to the station, not to the head under it, and everything that
// follows from that sentence is checked here. The two things that kept going
// wrong were a hat being *counted* in one place while it sat on a head
// somewhere else, and a hat being *drawn* by a rule that only some kinds of body
// went through -- so the checks are about the books and about the table, which
// are the two places the drawing and the errand both read from.

import { group, ok, state, run, yard, WORKER } from './helpers.mjs';
import { KIT, KIT_JOBS, KIT_MARK, TRADE_OF, boughtKit } from '../src/kit.js';
import { DIZZY_MS } from '../src/config.js';

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
  // Exactly one source per row: a hat is bought a trade at a time, or it comes
  // with a building. Neither is a hat from nowhere; both is two counts of the
  // same thing.
  const sources = jobs.filter(j => !!KIT[j].trade === !!KIT[j].stock);

  return [
    ok(noMark.length === 0, 'every hat in the table has a shape', noMark.join(' ')),
    ok(sources.length === 0,
       'and says where its hats come from, exactly once -- a trade or a stock',
       sources.join(' ')),
    // Every row is fetched: a hat is somewhere and a body walks to it. That is
    // NOT the same list as the hats the school sells, and it used to be -- the
    // janitor's cap was worn rather than fetched, so the two questions had one
    // answer and one of them was being asked in the other's name.
    ok(fetched.join() === jobs.slice().sort().join(),
       'every hat in the table is one somebody walks over and picks up',
       `${fetched.join(' ')} against ${jobs.join(' ')}`),
    ok(traded.join() === jobs.filter(j => j !== 'janitors').sort().join(),
       'and the ones the school sells are all of them but the cap',
       traded.join(' ')),
    // The cap: the same table, the same errand, the same stand -- and no trade,
    // because the closet has them rather than sells them.
    ok(!!KIT.janitors && !boughtKit('janitors') && typeof KIT.janitors.stock === 'function',
       'the cap is stock the closet keeps, not a trade the school sells',
       JSON.stringify(Object.keys(KIT.janitors)))
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
  // and time to put everything straight. It used to be thirty seconds, which was
  // a margin big enough to cover the worst yard the chance could build; the run
  // is repeatable now (see SEED in helpers.mjs) and the books are checked on
  // every frame of it besides -- a station wearing more than it has ever owned
  // is rule 3 in src/verify.js -- so what is left here is the one thing that is
  // genuinely a scenario and not an invariant: after the churn, the hats have
  // walked home to the right stations.
  run(12);

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

group('a dropped body keeps the hat it is wearing', async () => {
  window.__reset();
  window.__crew(2, 0, 0, 0);
  window.__school({ breakers: 2 });
  run(10);                                   // hats fetched, gang at work

  // Pick a trained miner up and put it down a long way from the rock -- the
  // player's own gesture, driven through the real lift/drop rather than by
  // poking fields, so the retask that follows is the retask a drop causes.
  const { lift, drop } = await import('../src/crew.js');
  const w = yard.S.workers.find(o => o.type === 'miner' && o.trained);
  lift(w);
  w.x -= 600;                                // carried well off the station
  w.y -= 120;
  drop(w);

  // Walk the whole trip back, sampling every frame: the bug was not the
  // destination -- it always ended up at work in a hat -- it was the DETOUR.
  // A body already wearing the rock's own kit has no business at the stand:
  // it must stay trained the whole way (never lay its hat down), and never
  // arrive at the stand's x while it is walking.
  const kitAt = (await import('../src/world.js')).kitX('miners');
  // Sampled by DESTINATION, not by position: the stand sits between the drop
  // point and the rock, so an honest walk passes its x -- what it must never do
  // is aim at it.
  let bare = 0, aimedAtStand = 0;
  for (let i = 0; i < 60 * 30 && (w.walking || w.falling); i++) {
    run(1 / 60);
    if (!w.trained) bare++;
    if (w.walking && w.walkTo != null && Math.abs(w.walkTo - kitAt) < 6) aimedAtStand++;
  }
  run(2);

  return [
    ok(w.trained && w.kitOf === 'miners', 'it is back at work in its own hat',
       `trained ${w.trained}, kitOf ${w.kitOf}`),
    ok(bare === 0, 'the hat never came off on the way', `${bare} bare frames`),
    ok(aimedAtStand === 0, 'and it never aimed a single step at the stand',
       `${aimedAtStand} frames walking to it`)
  ];
});

// The one hat in the yard nobody buys, walked for like all the rest.
//
// The cap used to be `innate`: put a body on sweeping and it was wearing one, in
// the same frame, wherever it happened to be standing. Which is the thing this
// whole file is against -- a hat that arrives without a walk belongs to no
// station, and there is nothing to take off it either. The closet keeps the caps
// now, one for every post it opens, on a stand outside its door.
group('the closet keeps the caps, and a janitor walks over for one', async () => {
  window.__reset();
  window.__crew(0, 3);                       // three bodies, all on carrying
  window.__air({ haze: 0, muck: 0 });
  window.__loo(true);
  run(1);

  const { kitX } = await import('../src/world.js');
  const stand = kitX('janitors');
  const loo = () => roster().find(r => r.job === 'janitors');

  const shut = loo();                        // the shed open, nobody on the post

  window.__assign('janitors', 1);
  const put = loo();
  const w = yard.S.workers.find(o => o.type === 'janitor');
  const from = w.x;

  // Watched frame by frame, because the whole of the change is in the walk. It
  // must set off bare, aim at the stand, and get there on its own legs.
  let bareFrames = 0, aimed = 0, reached = 0;
  for (let i = 0; i < 60 * 40 && !w.trained; i++) {
    run(1 / 60);
    if (!w.trained) bareFrames++;
    if (w.walking && w.walkTo != null && Math.abs(w.walkTo - stand) < 6) aimed++;
    if (Math.abs(w.x - stand) < WORKER) reached++;
  }
  const capped = loo();
  const got = { at: w.x, trained: w.trained, of: w.kitOf };
  run(4);                                   // and back to the closet with it on

  // Off the job again: the cap is not its own, so it goes back on the stand --
  // and it goes back the way it came, on foot.
  window.__assign('janitors', -1);
  run(20);
  const home = loo();
  const strays = detail().filter(b => b.kit !== '-' && b.kit !== b.t);

  return [
    ok(shut.hats === 2 && shut.worn === 0 && shut.spareKit === 2,
       'the shed opens with both caps out on the stand and nobody in them',
       `${shut.worn} of ${shut.hats} worn`),
    ok(put.n === 1 && put.worn === 0,
       'and a body put on the post starts bare-headed',
       `${put.worn} worn the frame it was assigned`),
    ok(bareFrames > 30, 'it is bare for the whole of a real walk, not a frame or two',
       `${bareFrames} frames`),
    ok(aimed > 0, 'which it spends walking to the stand outside the closet',
       `${aimed} frames aimed at ${Math.round(stand)}`),
    ok(reached > 0 && Math.abs(from - stand) > WORKER * 2,
       'from wherever it was standing to where the caps are',
       `${Math.round(from)} -> ${Math.round(stand)}`),
    ok(got.trained && got.of === 'janitors' && Math.abs(got.at - stand) < WORKER * 2,
       'it puts the cap on at the stand and nowhere else',
       `${got.of} at ${Math.round(got.at)}, stand at ${Math.round(stand)}`),
    ok(capped.worn === 1 && capped.spareKit === 1,
       'so the closet has one cap out and one still waiting',
       `${capped.worn} worn, ${capped.spareKit} waiting`),
    ok(home.worn === 0 && home.spareKit === 2 && strays.length === 0,
       'and taken off the job it walks the cap home again',
       `${home.worn} worn, ${home.spareKit} waiting, strays ${JSON.stringify(strays)}`)
  ];
});

// --- a hat on the ground is anybody's ------------------------------------------
// The hat is the job. A helmet knocked off a head belongs to the rock and not to
// the head it came off, so it lies there as the rock's helmet: the nearest body
// entitled to wear one goes and gets it, and if that body was carrying dust a
// moment ago it is a miner from the second it puts the helmet on. Its owner gets
// whatever the books have left for it.

group('a knocked-off hat is up for grabs while its owner sees stars', async () => {
  window.__reset();
  window.__crew(2, 0);                        // two on the rock...
  window.__school({ breakers: 1 });           // ...and one helmet between them
  run(8);

  const S = yard.S;
  const owner = S.workers.find(o => o.trained && o.kitOf === 'miners');
  const mate = S.workers.find(o => o.type === 'miner' && o !== owner);
  const shook = window.__shake(S.workers.indexOf(owner));
  // Watched frame by frame while the owner is still on the floor: the claim is
  // the whole of the change and it is over in a second, because the mate is
  // standing on the rock a step from where the helmet landed.
  let claimed = 0, tookIt = 0;
  for (let i = 0; i < 60 * 2; i++) {
    run(1 / 60);
    if (S.workers.some(o => o.claimHat === owner)) claimed++;
    if (mate.trained && owner.dizzyUntil) tookIt++;
  }

  run(DIZZY_MS / 1000 + 8);                   // stars clear, everybody settles
  const rock = roster().find(r => r.job === 'miners');

  return [
    ok(!!owner && !!mate && shook.hatOff, 'one of the two was wearing it, and it came off',
       JSON.stringify(shook)),
    // The whole of the change: it is not the owner's hat any more the moment it
    // is on the floor, and the owner is in no state to argue about it.
    ok(claimed > 0, 'somebody else walks for it while the owner is on the floor',
       `${claimed} frames claimed`),
    ok(tookIt > 0, 'and has it on before the stars have cleared',
       `${tookIt} frames worn while the owner was still seeing them`),
    ok(mate.trained && mate.kitOf === 'miners', 'and is wearing it at the end',
       `${mate.type} ${mate.kitOf}`),
    ok(!owner.trained && owner.type === 'miner',
       'while the one it came off works the rock bare-headed',
       `${owner.type} trained ${owner.trained}`),
    // Nobody has moved job: the hat stayed at the station it belongs to and so
    // did both bodies.
    ok(S.miners === 2 && S.workers.length === 2 && rock.worn === 1 && rock.hats === 1,
       'one helmet, one head, and the rock still has two of them',
       `${S.miners} miners, ${rock.worn}/${rock.hats} worn`)
  ];
});

group('a hauler that picks the helmet up is a miner, and the swap is one body', async () => {
  window.__reset();
  window.__crew(1, 1);                        // one on the rock, one carrying
  window.__school({ breakers: 1 });
  run(8);

  const S = yard.S;
  const { lift, drop } = await import('../src/crew.js');
  const owner = S.workers.find(o => o.trained && o.kitOf === 'miners');
  const carter = S.workers.find(o => o.type === 'hauler');
  window.__shake(S.workers.indexOf(owner));
  run(0.5);                                   // the hat comes to rest

  // And the owner is carried off across the yard before it can come round, so
  // that the walk back is a real walk and the race is a race. This is the
  // player's own gesture -- picked up and put down somewhere else -- and the hat
  // stays where it fell.
  const hatAt = owner.hatOff && owner.hatOff.x;
  lift(owner);
  owner.x -= 600;
  owner.y -= 120;
  drop(owner);

  run(DIZZY_MS / 1000 + 20);

  const wearer = S.workers.find(o => o.trained && o.kitOf === 'miners');
  const rock = roster().find(r => r.job === 'miners');

  return [
    ok(hatAt != null, 'the helmet was lying in the yard', `${hatAt}`),
    ok(wearer === carter && carter.type === 'miner',
       'the body that was carrying dust walked over, put it on, and is a miner',
       `${carter.type}, kit ${carter.kitOf}`),
    // The other half of it. The hat is the job, so losing it loses the job: the
    // rock has no second helmet, and the body it was taken off goes carrying.
    ok(owner.type === 'hauler' && !owner.trained,
       'and the one it was taken off is carrying dust instead',
       `${owner.type} trained ${owner.trained}`),
    // One shake, one swap. The counts are exactly what they were.
    ok(S.miners === 1 && S.crew === 2 && S.workers.length === 2,
       'the yard has the same crew doing the same jobs, in different hats',
       `${S.miners} miners of ${S.crew}, ${S.workers.length} bodies`),
    ok(rock.worn === 1 && rock.hats === 1, 'and the one helmet is on one head',
       `${rock.worn}/${rock.hats}`)
  ];
});
