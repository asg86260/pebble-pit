// The ending's mansion (mansion.js; DESIGN.md, "Acts 3 and 4", "The portals
// and the mansion", "The mansion and the house on the one construction"): a
// work on the yard's construction its builders carry up, a piece a trip,
// begun at the cage's barrier so it goes up while the act is still played and
// while the two of them walk home; the rock on the ruin broken up first, the
// scaffold up a pole a trip and down again last; then the two of them in at
// the door, the freed souls down the cloud stair, and the end sheet. Nothing
// pops: every piece is set by a body standing at its place, and fades in.
import { group, ok, run, yard } from './helpers.mjs';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const { mansionPieces, mansionDone, rockRowsLeft, pieceIn, MANSION_WAY } = await import('../src/mansion.js');
const { workOn, progressOf } = await import('../src/works.js');
const { TYPE } = await import('../src/jobs.js');
const { beatDone } = await import('../src/beats.js');
const { P, MANSION_BUILDERS } = await import('../src/config.js');

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
  let walkingAt = null, setAtHome = null, most = 0, notBuilders = 0;
  const all = mansionPieces();
  const sample = () => {
    const carriers = S.workers.filter(w => w.piece);
    most = Math.max(most, carriers.length);
    notBuilders += carriers.filter(w => w.type !== TYPE.BUILD || w.site !== 'mansion').length;
    for (const w of carriers) if (w.piece.st === 'set') setters.push({ i: w.piece.i, x: w.x, kind: all[w.piece.i].kind });
    const set = S.acts.mansion ? S.acts.mansion.set.filter(v => v != null).length : 0;
    if (walkingAt == null && S.acts.pair.route) walkingAt = set;
    if (setAtHome == null && ['home', 'door'].includes(S.acts.pair.at)) setAtHome = set;
  };
  // A frame at a time, so every piece's set is seen: a set lasts under a
  // second, and a second's step would pass over a third of them.
  const frameUntil = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { run(1 / 60); if (fn()) return true; } return false; };
  const midway = frameUntil(() => { sample(); return S.acts.mansion && S.acts.mansion.set.filter(v => v != null).length >= 10; }, 400);
  // a reload in the middle of the build: what is set stays set, nobody is
  // left holding a claim, and it goes on
  const before = S.acts.mansion.set.filter(v => v != null).length;
  const workBefore = progressOf(workOn('mansion')), idBefore = workOn('mansion')?.id;
  window.__reload();
  const after = S.acts.mansion.set.filter(v => v != null).length;
  const hands = S.workers.filter(w => w.piece).length;
  // the work read back off the save, before a frame is stepped, says what
  // the pieces read back say, and is the same work, not one started again
  const workAfter = progressOf(workOn('mansion')), idAfter = workOn('mansion')?.id;
  const agree = Math.abs(workAfter - after / all.length) < 1e-9 && idAfter === idBefore;
  const done = frameUntil(() => { sample(); return beatDone('home-again') || S.beat.sheet === 'mansionsheet'; }, 1200);
  run(1);
  const sheet = S.beat.sheet;
  const borrowed = S.workers.filter(w => w.piece).length;
  const workLeft = workOn('mansion');
  window.__actsOn(null);
  return [
    ok(midway, 'the build gets going with the yard\'s own hands', JSON.stringify(S.acts.mansion && S.acts.mansion.set.length)),
    ok(most > 1 && most <= MANSION_BUILDERS && notBuilders === 0, "the yard's builders carry it, a gang of up to its hands, nobody else", `${most} at once, ${notBuilders} not builders`),
    ok(after === before && hands === 0, 'a reload keeps every piece set and lets the hands go to be taken again', `${before} -> ${after}, ${hands} holding`),
    ok(workBefore > 0 && agree, 'the work on the construction is read back as it was, and agrees with the pieces set', `${workBefore} -> ${workAfter}, ${after}/${all.length}, id ${idBefore} -> ${idAfter}`),
    ok(walkingAt != null && setAtHome != null && setAtHome > walkingAt, 'pieces go up while the two of them walk home', `${walkingAt} at the start, ${setAtHome} at home`),
    ok(done && mansionDone() && all.every((_, i) => pieceIn(i) >= 1 || !all[i].segs.length), 'every piece set and faded in', String(mansionDone())),
    ok(rockRowsLeft() === 0, 'the rock on the ruin broken up to the last row', String(rockRowsLeft())),
    ok(new Set(setters.map(s => s.i)).size === all.length && setters.every(s => Math.abs(s.x - MANSION_WAY.to(s.i)) <= P),
       'every piece, of every kind, set by a body standing at its place', JSON.stringify(setters.filter(s => Math.abs(s.x - MANSION_WAY.to(s.i)) > P).slice(0, 3))),
    ok(!workLeft, 'the work landed off the construction', JSON.stringify(workLeft)),
    ok(S.acts.house === 'mansion' && S.acts.ended && sheet === 'mansionsheet', 'the two of them in, the souls gathered, the end sheet up', `${S.acts.house} ${S.acts.ended} ${sheet}`),
    ok(borrowed === 0, 'and every borrowed hand let go back to its work', String(borrowed))
  ];
});
