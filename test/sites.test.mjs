// The places out to the left of the rock: the cut, the beds, the bridge over
// the cut, and where each of them stands.

import { group, ok, state, run, runUntil, quickCrew, haveRock, openSites, P, WORKER } from './helpers.mjs';

// A shard is brought up and set down. Nothing counts it there: somebody has to
// walk over and pick it up, the same as everything else in this yard.
group('the quarry gives up shards, and somebody fetches them', async () => {
  window.__crew(0, 0, 3);                  // three quarriers, quarry open
  quickCrew();
  window.__clearFloor();
  const start = state();
  // Nobody is out of sight any more: they climb down and work the floor of the
  // cut where you can watch them, which is the whole point of a cut.
  let onTheFloor = false;
  const lay = runUntil(() => {
    const s = state();
    onTheFloor = onTheFloor || s.workerPos.some(p =>
      p[0] === 'q' && +p.split(',')[1] > s.groundY);
    return s.finds.includes('shard');
  }, 40);
  const waiting = state();

  window.__crew(0, 2, 3);                  // now put somebody on carrying
  window.__place('hauler', waiting.quarryX);
  quickCrew();
  const got = runUntil(() => state().shards > start.shards, 60);
  const after = state();
  window.__crew(0, 0, 0);
  return [
    ok(after.quarryOpen, 'the quarry is open'),
    ok(onTheFloor, 'a quarrier climbs down and works its floor'),
    ok(lay, 'and leaves a shard lying in the dust by the mouth',
       JSON.stringify(waiting.finds)),
    ok(waiting.shards === start.shards, 'which is not counted where it lies',
       `${start.shards} -> ${waiting.shards}`),
    ok(got, 'a worker walks over for it and that is what counts it',
       `${start.shards} -> ${after.shards}`),
    ok(after.seenShard, 'which is worth showing on the counter')
  ];
});

// A worked cut, not a box. Both walls come down in benches and the floor they
// leave is uneven -- and the floor is not just drawing: the crew stand on it,
// so a quarrier's feet have to be on the stretch of floor it is over.
group('the quarry is a worked cut, benched and uneven', async () => {
  window.__crew(0, 0, 3);
  quickCrew();
  run(6);
  const s = state();
  const c = s.quarryCut;
  const q = s.workerPos.filter(p => p[0] === 'q').map(p => +p.split(',')[1]);
  const feet = new Set(q);
  return [
    ok(c.deep - s.groundY > 100 && s.quarryW > 120,
       'it is a cut somebody has been down for a while, not a step down',
       `${s.quarryW} wide, ${c.deep - s.groundY} deep`),
    ok(c.rims === 2 && c.corners > 12, 'it is a stepped outline, not four corners',
       `${c.corners} corners, ${c.rims} at the rim`),
    ok(new Set(c.steps).size > 1 && Math.max(...c.steps) > 0,
       'and the floor it leaves is uneven', c.steps.join(' ')),
    ok(c.from > s.quarryX && c.to < s.quarryX + s.quarryW,
       'the walls eat in, so the floor is narrower than the mouth',
       `${c.from}..${c.to} in ${s.quarryX}..${s.quarryX + s.quarryW}`),
    ok(q.length === 3 && feet.size > 1, 'and the crew stand on it, not on one line',
       q.join(' '))
  ];
});

group('the quarry is a hole in the ground, left of the rock', async () => {
  const s = state();
  return [
    ok(s.quarryX + s.quarryW < s.rockX - s.rockW / 2, 'it is out past the rock',
       `quarry ends ${s.quarryX + s.quarryW}, rock starts ${Math.round(s.rockX - s.rockW / 2)}`),
    ok(s.quarryW > 0 && s.quarryW < 200, 'and it is a mouth, not a canyon', `${s.quarryW}`)
  ];
});

group('the farm grows spores when it is tended', async () => {
  window.__crew(0, 0, 0, 2);               // two farmhands, farm open
  quickCrew();
  window.__clearFloor();
  const start = state();
  let grew = false;
  const lay = runUntil(() => {
    grew = grew || state().beds.some(b => b > 0.1);
    return state().finds.includes('spore');
  }, 40);
  const waiting = state();

  window.__crew(0, 2, 0, 2);               // somebody to go and get it
  window.__place('hauler', waiting.farmX);
  quickCrew();
  const got = runUntil(() => state().spores > start.spores, 90);
  const after = state();
  return [
    ok(after.farmOpen, 'the farm is open'),
    ok(after.beds.length > 0, 'it has beds', `${after.beds.length}`),
    ok(grew, 'a bed comes on while it is tended'),
    ok(lay, 'and is cut for a spore that lies beside it',
       JSON.stringify(waiting.finds)),
    ok(got, 'a worker fetches it, and that is what counts it',
       `${start.spores} -> ${after.spores}`),
    ok(after.seenSpore, 'which is worth showing on the counter')
  ];
});

// A spore is a thing that grew, and it should be seen to have grown. It forms
// at the tip of the stalk the moment the bed is ripe and sits there until the
// farmhand takes it off -- from exactly where it grew, in the tone it grew in.
group('a ripe bed shows its spore before it is cut', async () => {
  window.__school({ breakers: 0, carters: 0, blasters: 0, growers: 0 });
  window.__crew(0, 0, 0, 1);
  quickCrew();
  window.__clearFloor();
  // A bed with a spore on it, not merely one left standing ripe by an earlier
  // check. A bed nobody is working keeps its tone for ever, so the farm is put
  // back to bare earth first and what ripens after that is this check's own.
  //
  // Naming the already-ripe ones and skipping them was not enough: with a
  // whole farm left standing ripe by an earlier check, the one farmhand has to
  // cut its way through all seven before a fresh one can appear, and how long
  // that takes depends on what every check before this one happened to do.
  window.__beds();
  const already = new Set(state().bedTone.flatMap((t, n) => t > 0 ? [n] : []));
  const fresh = s => s.bedTone.findIndex((t, n) => t > 0 && !already.has(n));
  // a frame at a time, not a second: it is only ripe for as long as it takes
  // the farmhand to cut it, and a second-wide step steps right over that
  let ripe = false;
  for (let i = 0; i < 3000 && !ripe; i++) {
    run(1 / 60);
    ripe = fresh(state()) >= 0;
  }
  const showing = state();
  const i = fresh(showing);
  const tone = showing.bedTone[i];
  const spores = showing.finds.filter(f => f === 'spore').length;
  run(0.3);
  const stillThere = state();
  // wait for it rather than guessing how long the cut and the throw take
  const landed = runUntil(
    () => state().finds.filter(f => f === 'spore').length > spores, 20);
  const after = state();
  window.__crew(0, 0, 0, 0);
  return [
    ok(ripe, 'a bed comes ripe'),
    ok(tone > 0, 'and a spore forms on it', `tone ${tone}`),
    ok(stillThere.beds[i] >= 1, 'which stays there to be looked at',
       `${stillThere.beds[i]}`),
    ok(after.beds[i] < 1, 'until the farmhand takes it off', `${after.beds[i]}`),
    ok(landed, 'and then it is lying in the farm pile',
       `${spores} -> ${after.finds.filter(f => f === 'spore').length}`)
  ];
});

group('nothing grows in an untended farm', async () => {
  window.__crew(0, 0, 0, 0);               // everybody off the farm
  run(0.2);
  const before = state();
  run(1.5);
  const after = state();
  return [
    ok(after.spores === before.spores, 'the crop does not come on by itself',
       `${before.spores} -> ${after.spores}`)
  ];
});

group('the sites are laid out left of the rock, in order', async () => {
  const s = state();
  return [
    ok(s.farmX + s.farmW < s.quarryX, 'the farm is out past the quarry',
       `farm ends ${Math.round(s.farmX + s.farmW)}, quarry at ${s.quarryX}`),
    ok(s.labX < s.farmX, 'and the lab out past the farm, at the far end',
       `lab at ${Math.round(s.labX)}, farm at ${Math.round(s.farmX)}`),
    ok(s.quarryX + s.quarryW < s.benchX, 'the quarry stands past the bench'),
    ok(s.benchX + s.benchW < s.rockX && s.rockX < s.pitX,
       'and the bench off the rock, between it and the quarry')
  ];
});

// Nothing in the lab is bought outright any more. Paying starts a piece of
// research; what finishes it is bodies standing in the lab, and an empty lab
// makes no progress at all however much you have paid.
// Benched rather than deleted: everything it needs is still here, and the dev
// panel can put it back in the sky to be looked at. It is not in the game.
// The crew go inside the lab, so there is nothing to watch. The chimney is the
// whole of the signal, and it says the one thing worth saying: that somebody
// is in there working. Paid-for research with an empty lab does not smoke.
// The crew crossed the mouth in mid-air: the ground line stops at one rim and
// picks up at the other, and everyone walked the gap. The bridge is what makes
// that honest, so it is not scenery -- groundAt() has to put the crew on it,
// and it has to reach solid ground either side of a mouth that moves with the
// rock.
group('there is a bridge over the quarry', async () => {
  window.__crew(0, 2, 1);
  run(1);
  const s = state();
  const { x0, d0, d1, x1, top } = s.bridge;
  const mouth = [s.quarryX, s.quarryX + s.quarryW];
  const p = s.deckWalk;                        // sampled across and past both ends
  const angle = Math.atan((s.groundY - top) / (d0 - x0)) * 180 / Math.PI;

  return [
    ok(d0 <= mouth[0] && d1 >= mouth[1], 'the flat deck covers the whole mouth',
       `${d0}..${d1} over ${mouth[0]}..${mouth[1]}`),
    ok(x0 - 0 < d0 && x1 > d1 && d0 - x0 === x1 - d1,
       'with a ramp of the same run either side', `${d0 - x0} / ${x1 - d1}`),
    ok(Math.abs(angle - 20) < 0.1, 'and they rise at twenty degrees',
       `${angle.toFixed(2)} deg`),
    ok([x0, d0, d1, x1].every(v => v % 6 === 0), 'every corner sits on the lattice',
       `${x0} ${d0} ${d1} ${x1}`),
    ok(p[0] === s.groundY && p[p.length - 1] === s.groundY,
       'off either end you are back on the ground', `${p[0]} / ${p[p.length - 1]}`),
    ok(p[1] > p[2] && p[2] > p[3], 'walking on it climbs', p.join(' ')),
    ok(p[3] === top && p[4] === top && p[5] === top, 'levels off over the hole',
       p.slice(3, 6).join(' ')),
    ok(p[6] < p[7] && p[7] < p[8], 'and comes back down the other side',
       p.slice(6).join(' ')),
    ok(p.every(v => v <= s.groundY), 'and never dips below the ground doing it',
       p.join(' '))
  ];
});

// The hole is the one place the layer can land that nobody can walk onto. It
// used to lie across the mouth at ground level -- a grey lid over thin air with
// the hole visible under it -- and a body sent to shift it walked at a column
// the lip would never let it reach and stood there pushing at the edge for ever.
group('muck in the hole lies on the dust and is climbed down to', async () => {
    run(0.4);
  window.__crew(0, 3);
  run(4);
  window.__clearFloor();
  window.__air({ haze: 0, muck: 0 });

  // Only over the mouth, so the crew cannot be busy with anything nearer -- and
  // only the near end of it. The hole is the full six hundred columns from the
  // first frame now, and mucking the whole mouth is twenty minutes of shovelling
  // for a check about whether anybody climbs down at all.
  const lip = window.__state().pitX;
  window.__muckSet(c => (window.__overPit(c) && c * 6 < lip + 240 ? 3 : 0));
  const start = window.__muckOverPit();
  const wasAt = state().workerPos.filter(p => p[0] === 'h').join();

  // watched all the way, because how far down anybody got is the whole claim
  let deepest = 0;
  let gone = false;
  for (let i = 0; i < 240 && !gone; i++) {
    run(0.25);
    const s = state();
    for (const p of s.workerPos.filter(q => q[0] === 'h'))
      deepest = Math.max(deepest, +p.split(':')[1].split(',')[1] - s.groundY);
    gone = window.__muckOverPit() === 0;
  }
  run(3);
  const after = state();
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(start > 20, 'the hole takes a real layer', `${start} cells`),
    ok(gone, 'and the crew go down after it and shift the lot',
       `${window.__muckOverPit()} left`),
    ok(deepest > 40,
       'having climbed down the ladder into the hole to do it, not reached in from the lip',
       `${deepest}px below the ground line at the deepest`),
    ok(after.workerPos.filter(p => p[0] === 'h').join() !== wasAt,
       'having actually gone somewhere to do it, rather than jamming at the edge',
       `${wasAt} -> ${after.workerPos.filter(p => p[0] === 'h').join()}`),
    ok(after.pit === state().pit,
       'and not one grain of it counted against what the hole holds')
  ];
});
