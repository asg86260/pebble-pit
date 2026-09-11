// A player's yard with a swing rung bought at the shack and a bar that never
// moved. Two rockhands, both marked `goal: 'to'`, and the shed claim passing
// them both over as "still commuting" -- for good, because the rock's stepper
// never clears the word and the shed release had written it on them itself
// the last time either fitted a pick. See shedhand.js, and the critics'
// document: four of them found it independently.
//
// The fixture is the player's save with the ground left out -- the boulder,
// floor, pit and cut blobs are laid over from a yard the game generates at
// the same rock number, because the stall is a fact about two bodies and a
// work, not about the dust. The quarriers are put on the walk to the cut for
// the same reason: their saved seats are in a hole this ground does not have.

import { readFileSync } from 'node:fs';
import { yard, group, ok, run, runUntil, WORKER } from './helpers.mjs';
import { workAt } from '../src/works.js';
import { persist } from '../src/persist.js';
import { shack } from '../src/state.js';
import { TYPE } from '../src/jobs.js';

const S = yard.S;

const load = () => {
  window.__reset(); window.__crew(2, 9); window.__fullSites(); window.__jump(90); run(1);
  persist();
  const ground = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
  const save = JSON.parse(readFileSync(new URL('./fixtures/shack-stall.json', import.meta.url), 'utf8'));
  for (const k of ['boulder', 'gw', 'gh', 'floor', 'pit', 'cut', 'muck', 'poop', 'rockSand', 'meteorCells', 'noticeboard'])
    if (k in ground) save[k] = ground[k];
  for (const w of save.who) if (w.type === 'quarrier') { w.goal = 'to'; delete w.y; }
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(save));
  yard.restore();
};

// The shack's work goes to a spare hand now, not to the gang, so the save's
// two rockhands are left alone and one of the haulers walks over instead.
group('a shack rung in a player\'s save is fitted, by a spare hand, and the gang is left alone', async () => {
  load();
  const rockhands = () => S.workers.filter(w => w.type === TYPE.ROCK);
  const marked = rockhands().filter(w => w.goal === 'to').length;
  const work = workAt('shack');
  const at0 = work && { key: work.key, done: work.done };
  const inShack = w => w.x + WORKER > shack.x && w.x < shack.x + shack.w;
  const arrived = runUntil(() => S.workers.some(w => w.type === TYPE.BUILD && w.site === 'shack' && w.goal === 'at' && inShack(w)), 60);
  const claimed = rockhands().some(w => w.onBuild);
  const landed = runUntil(() => !workAt('shack'), 400);
  window.__crew(0, 0);
  return [
    ok(!!at0 && at0.key === 'labswing' && at0.done === 0, 'the save holds the rung at nought', JSON.stringify(at0)),
    ok(marked === 0, 'the saved "to" comes off the rockhands on the way in', `${marked} marked`),
    ok(arrived, 'a spare hand stands at the hut'),
    ok(!claimed, 'and neither rockhand is claimed to it'),
    ok(landed, 'and the rung lands')
  ];
});
