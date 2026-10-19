// Two yards from the field (0.6.0 on itch, the free build): the snatch played,
// the wizards asked, and the teaser's sheet standing. "keep playing" put down
// a sheet whose beat had nothing to land, so the click threw and the game
// crashed -- and since the sheet's beat was never marked done, every reload
// stood the same sheet again. The saves are the fixtures; what is asserted is
// the outcome: the sheet goes down, stays down across a reload, and the yard
// plays on.
import { readFileSync } from 'node:fs';
import { yard, group, ok, run, runUntil } from './helpers.mjs';
import { BEATS } from '../src/beats.js';
import { verifyParty } from '../src/verify.js';

const S = yard.S;
const KEY = 'boulder-clicker/v4';

for (const name of ['report-4', 'report-5']) {
  group(`${name}: keep playing on the teaser's sheet puts it down`, async () => {
    window.__deepOn(false);                    // the free build
    localStorage.setItem(KEY, readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
    yard.restore();
    runUntil(() => S.beat.sheet === 'teaseend', 10);
    const stood = S.beat.sheet;
    let threw = null;
    try { window.__skipBeat('sheet'); } catch (e) { threw = e; }
    run(1);
    const down = !S.beat.sheet;
    // and it is not stood again by a reload
    yard.persist();
    yard.restore();
    run(0.5);                                  // a sheet owed stands on the first frame
    const back = S.beat.sheet;
    window.__deepOn(null);
    window.__reset();
    return [
      ok(stood === 'teaseend', "the save stands the teaser's sheet", String(stood)),
      ok(!threw, 'keep playing does not throw', threw && threw.message),
      ok(down, 'the sheet is down'),
      ok(back !== 'teaseend', 'and a reload does not stand it again', String(back))
    ];
  });
}

// Past the sheet, report-5's fighter was a trained hauler when she was sent
// down: she climbs the shaft, puts the haulers' hat back on its stand, and
// goes down again to her station -- the one walk a fighter takes in the yard
// (verify.js), watched every frame, through the harness's reloads.
group("report-5: the fighter puts her hauler's hat back, then goes down", async () => {
  window.__deepOn(false);
  localStorage.setItem(KEY, readFileSync(new URL('./fixtures/report-5.json', import.meta.url), 'utf8'));
  yard.restore();
  runUntil(() => S.beat.sheet === 'teaseend', 10);
  window.__skipBeat('sheet');
  const her = () => S.workers.find(w => w.uid === 'u24');
  const wore = her().kitOf;
  runUntil(() => her().y <= 1980, 20);
  const up = her().y <= 1980;
  runUntil(() => !her().walking && her().y > 2400, 40);
  const w = her();
  // and the rule still holds for a fighter in the yard on no such walk
  const { x, y } = w;
  w.x = 5000; w.y = 1980 - 18;
  let caught = null;
  try { verifyParty(); } catch (e) { caught = e; }
  w.x = x; w.y = y;
  window.__deepOn(null);
  window.__reset();
  return [
    ok(wore === 'haulers', "she is sent down wearing the haulers' hat", String(wore)),
    ok(up, 'she climbs out to the yard'),
    ok(!w.trained && !w.kitOf, 'and puts the hat back', `${w.trained} ${w.kitOf}`),
    ok(!w.walking && w.y > 2400, 'then goes down to her station', `${Math.round(w.x)},${Math.round(w.y)} leg ${w.leg}`),
    ok(caught && /a fighter is in the yard/.test(caught.message), 'a fighter stood in the yard otherwise is still caught', caught && caught.message)
  ];
});

// Every sheet goes down the same way, whether or not its beat has a fact to
// land on the way out.
group('every sheet beat can be put down', async () => {
  const bad = [];
  for (const row of BEATS.filter(r => r.owns === 'sheet')) {
    window.__reset();
    S.beat.sheet = row.key;
    try { window.__skipBeat('sheet'); } catch (e) { bad.push(`${row.key}: ${e.message}`); continue; }
    if (S.beat.sheet || !S.beatsDone.includes(row.key)) bad.push(`${row.key}: still standing`);
  }
  window.__reset();
  return [ok(bad.length === 0, 'every sheet goes down', bad.join('; '))];
});
