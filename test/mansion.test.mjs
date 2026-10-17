// The ending's mansion (mansion.js; DESIGN.md, "Acts 3 and 4", "The portals
// and the mansion"): a standing job the yard's own hands do, a piece a trip,
// begun at the cage's barrier so it goes up while the act is still played and
// while the two of them walk home; the rock on the ruin broken up first, the
// scaffold up a pole a trip and down again last; then the two of them in at
// the door, the freed souls down the cloud stair, and the end sheet. Nothing
// pops: every piece is set by a body standing at its place, and fades in.
import { group, ok, run, runUntil, yard } from './helpers.mjs';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const { mansionPieces, mansionDone, rockRowsLeft, pieceIn } = await import('../src/mansion.js');
const { beatDone } = await import('../src/beats.js');
const { WORKER, P } = await import('../src/config.js');

group('the yard\'s own hands raise the mansion while the two of them walk home, and the end sheet follows', async () => {
  window.__actsOn(true);
  window.__crew(2, 4);
  window.__actsAt('mansion', 0);
  // the cage just broken, the two of them at it as ghosts: the climax owed
  S.beatsDone = S.beatsDone.filter(k => k !== 'unchain' && k !== 'alive');
  Object.assign(S.acts.pair, { route: null, at: 'cage', hold: 'cage', mode: 'ghost', rims: 0 });
  window.__actOwe('unchain');
  // Who sets each piece, and where they stand when they do.
  const setters = [];
  let walkingAt = null, setAtHome = null;
  const all = mansionPieces();
  const sample = () => {
    for (const w of S.workers) if (w.mansion && w.mansion.st === 'set') setters.push({ i: w.mansion.i, x: w.x, kind: all[w.mansion.i].kind });
    const set = S.acts.mansion ? S.acts.mansion.set.filter(v => v != null).length : 0;
    if (walkingAt == null && S.acts.pair.route) walkingAt = set;
    if (setAtHome == null && ['home', 'door'].includes(S.acts.pair.at)) setAtHome = set;
  };
  const midway = runUntil(() => { sample(); return S.acts.mansion && S.acts.mansion.set.filter(v => v != null).length >= 10; }, 400);
  // a reload in the middle of the build: what is set stays set, nobody is
  // left holding a claim, and it goes on
  const before = S.acts.mansion.set.filter(v => v != null).length;
  window.__reload();
  const after = S.acts.mansion.set.filter(v => v != null).length;
  const hands = S.workers.filter(w => w.mansion).length;
  const done = runUntil(() => { sample(); return beatDone('home-again') || S.beat.sheet === 'mansionsheet'; }, 1200);
  run(1);
  const sheet = S.beat.sheet;
  const borrowed = S.workers.filter(w => w.mansion).length;
  window.__actsOn(null);
  return [
    ok(midway, 'the build gets going with the yard\'s own hands', JSON.stringify(S.acts.mansion && S.acts.mansion.set.length)),
    ok(after === before && hands === 0, 'a reload keeps every piece set and lets the hands go to be taken again', `${before} -> ${after}, ${hands} holding`),
    ok(walkingAt != null && setAtHome != null && setAtHome > walkingAt, 'pieces go up while the two of them walk home', `${walkingAt} at the start, ${setAtHome} at home`),
    ok(done && mansionDone() && all.every((_, i) => pieceIn(i) >= 1 || !all[i].segs.length), 'every piece set and faded in', String(mansionDone())),
    ok(rockRowsLeft() === 0, 'the rock on the ruin broken up to the last row', String(rockRowsLeft())),
    ok(setters.length > 0 && setters.filter(s => s.kind === 'floor').every(s => Math.abs(s.x - (6 * P + Math.round(all[s.i].cx - WORKER / P / 2) * P)) <= P),
       'each piece set by a body standing at its place', JSON.stringify(setters.slice(0, 3))),
    ok(S.acts.house === 'mansion' && S.acts.ended && sheet === 'mansionsheet', 'the two of them in, the souls gathered, the end sheet up', `${S.acts.house} ${S.acts.ended} ${sheet}`),
    ok(borrowed === 0, 'and every borrowed hand let go back to its work', String(borrowed))
  ];
});
