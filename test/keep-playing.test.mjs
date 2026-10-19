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
    // Short: in report-5 a fighter climbs out to put her kit back a few
    // seconds on, a defect of its own (TODO.md).
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
