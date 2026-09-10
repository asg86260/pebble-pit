// The save, out of the page and back in (wave-release, track C).
//
// A run lives in one origin's localStorage with no second copy, and the whole
// reward of this game is a yard built over hours. `exportSave` hands the blob
// over as it is stored; `importSave` takes one back, and the rule it keeps is
// that a bad paste can never cost the good save. Every group here is about
// that rule from a different side: a blob that is not a save is refused at the
// door, one that parses but will not read is refused after the fact with the
// old save put back, and one that reads is the yard from then on.

import { readFileSync } from 'node:fs';
import { group, ok, state, run, runUntil, yard } from './helpers.mjs';

const { exportSave, importSave } = await import('../src/persist.js');
const { PREV_KEY, loadPrev } = await import('../src/save.js');

const KEY = 'boulder-clicker/v4';
const player = () =>
  readFileSync(new URL('./fixtures/player-yard.json', import.meta.url), 'utf8');

// The names on the roster, in order: what "the same crew" means beyond a count.
const roster = () => yard.S.workers.map(w => `${w.type}:${w.name}`).join(',');
const rosterOf = blob => JSON.parse(blob).who.map(w => `${w.type}:${w.name}`).join(',');

// Whether the yard is doing anything: dust banked over ten seconds. A yard
// that came back and then stood still would pass every equality below.
const runsOn = () => { const was = state().stored; return runUntil(() => state().stored > was, 10); };

group('a save goes out and comes back', async () => {
  const S = yard.S;
  window.__crew(2, 2);
  run(30);
  S.dirty = true; yard.persist();              // what the once-a-second interval does
  const blob = exportSave();
  const then = { stored: S.stored, who: roster() };
  run(30);
  const later = S.stored;
  const took = importSave(blob);
  const back = { stored: S.stored, who: roster() };
  const going = runsOn();
  return [
    ok(blob.length > 0 && JSON.parse(blob).stored === then.stored,
       'the blob that went out is the save', `${blob.length} chars, stored ${then.stored}`),
    ok(later !== then.stored, 'the yard had moved on before it came back',
       `${then.stored} -> ${later}`),
    ok(took === true, 'and the import took'),
    ok(back.stored === then.stored, 'stored is the blob\'s again',
       `${then.stored} in the blob, ${back.stored} in the yard`),
    ok(back.who === then.who && back.who === rosterOf(blob), 'and so is the roster',
       `${back.who}`),
    ok(loadPrev() !== null && JSON.parse(loadPrev()).stored === later,
       'the save that was replaced is kept one step back'),
    ok(going, 'and the yard runs on')
  ];
});

group('a blob that is not a save is refused and costs nothing', async () => {
  const S = yard.S;
  window.__crew(2, 2);
  run(20);
  S.dirty = true; yard.persist();
  const before = localStorage.getItem(KEY), stored = S.stored, prev = loadPrev();
  const answers = ['x', '{}', '{"stored":1}'].map(b => importSave(b));
  const after = localStorage.getItem(KEY);
  return [
    ok(before && before.length > 0, 'there was a save to lose', `${before?.length} chars`),
    ok(answers.every(a => a === false), 'every one of them is refused', answers.join(',')),
    ok(after === before, 'and the save is byte for byte what it was'),
    ok(S.stored === stored, 'and the yard is untouched', `${stored} -> ${S.stored}`),
    // whatever an earlier import left one step back is still what is there
    ok(localStorage.getItem(PREV_KEY) === prev, 'and nothing was written one step back either')
  ];
});

// `craft` is the balloons' list, and `craftLoad` walks it with `for..of` --
// so a number where the list should be parses as JSON, passes the door
// (`stored` and `boulder` are what the door looks at) and throws from the
// middle of `restore`, with the pit, the sky and the rift already read out of
// the bad blob by then.
group('a save that parses but will not restore leaves the old one standing', async () => {
  const S = yard.S;
  window.__crew(2, 2);
  run(20);
  S.dirty = true; yard.persist();
  const before = localStorage.getItem(KEY), stored = S.stored, who = roster();
  const bad = JSON.parse(player());
  bad.craft = 1;
  const took = importSave(JSON.stringify(bad));
  const after = localStorage.getItem(KEY);
  const now = { stored: S.stored, who: roster() };
  const going = runsOn();
  return [
    ok(took === false, 'the import is refused'),
    ok(after === before, 'the previous blob is what is under the key'),
    ok(now.stored === stored && now.who === who, 'and the yard is the yard it was',
       `${stored}/${who.split(',').length} bodies before, ${now.stored}/${now.who.split(',').length} after`),
    ok(going, 'and it still runs')
  ];
});

group("the player's yard survives a round trip", async () => {
  const S = yard.S;
  const first = importSave(player());
  const a = { stored: S.stored, crew: S.crew, bodies: S.workers.length, who: roster(),
              rift: S.rift, riftOpen: S.riftOpen, held: JSON.stringify(S.riftHeld) };
  const out = exportSave();
  const second = importSave(out);
  const b = { stored: S.stored, crew: S.crew, bodies: S.workers.length, who: roster(),
              rift: S.rift, riftOpen: S.riftOpen, held: JSON.stringify(S.riftHeld) };
  const going = runsOn();
  return [
    ok(first === true && second === true, 'both imports take', `${first}, ${second}`),
    ok(a.stored === JSON.parse(player()).stored, 'stored is the fixture\'s', `${a.stored}`),
    ok(b.stored === a.stored, 'and the same after the round trip', `${a.stored} -> ${b.stored}`),
    ok(b.crew === a.crew && b.bodies === a.bodies && b.who === a.who,
       'the same crew, body for body', `${a.crew} (${a.bodies} bodies) -> ${b.crew} (${b.bodies})`),
    ok(b.rift === a.rift && b.riftOpen === a.riftOpen && b.held === a.held,
       'the same rift, contents and all', `${a.rift} ${a.held}`),
    ok(going, 'and the yard runs on')
  ];
});
