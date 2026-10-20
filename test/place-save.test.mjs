// The places' one save reader (src/placesave.js): act 3 and hell both read
// their saved blob over their blank through it, so a save from before a field
// was added -- at the top or inside a record -- comes back filled, and a
// mid-act yard comes back equal to what was written.
import { group, ok, run, yard } from './helpers.mjs';
import { readOver } from '../src/placesave.js';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const saved = () => JSON.parse(localStorage.getItem(KEY));
const put = blob => { localStorage.setItem(KEY, JSON.stringify(blob)); yard.restore(); };

group('a mid-act act 3 and hell yard read back equal', async () => {
  window.__actsOn(true);
  window.__goPlace('after');
  run(6);
  window.__goPlace('hell');
  run(6);
  S.hell.brimstone = 11; S.hell.blows[1] = 5; S.hell.ore.cinder = 2; S.hell.chamber = 1;
  S.after.rebel = 9; S.after.stock.logs = 3; S.after.posts = { a: 1 };
  yard.persist();
  const want = JSON.stringify([S.after, S.hell]);
  const blob = saved();
  put(blob);
  const back = JSON.stringify([S.after, S.hell]);
  // the bytes the second read writes are the first's
  yard.persist();
  const again = saved();
  window.__view('yard');
  window.__actsOn(null);
  return [
    ok(back === want, 'both blobs come back equal', `${back.slice(0, 200)} not ${want.slice(0, 200)}`),
    ok(JSON.stringify([again.after, again.hell]) === JSON.stringify([blob.after, blob.hell]), 'and write the same again')
  ];
});

group('an old-shaped act blob is filled from the blank', async () => {
  window.__actsOn(true);
  window.__goPlace('after');
  window.__goPlace('hell');
  yard.persist();
  const blob = saved();
  const stockKeys = Object.keys(blob.after.stock);
  delete blob.after.posters; delete blob.after.stock[stockKeys[0]]; delete blob.after.begun;
  blob.after.wardens = [1];
  blob.after.gone = 'retired';
  delete blob.hell.flights; delete blob.hell.faces[0].crust; delete blob.hell.furnaces[1].hopper;
  delete blob.hell.ore[Object.keys(blob.hell.ore)[0]];
  blob.hell.brimstone = 'junk';
  put(blob);
  const a = S.after, h = S.hell;
  const out = [
    ok(Array.isArray(a.posters) && a.begun !== undefined, 'a top-level field the act 3 save lacks comes back'),
    ok(a.stock[stockKeys[0]] === 0, 'and a missing stock count comes back zero'),
    ok(!('wardens' in a) && !('gone' in a), 'and a key the blank lacks is dropped'),
    ok(h.flights === 0, 'a top-level field hell\'s save lacks comes back'),
    ok(h.faces[0].crust === 0 && h.furnaces[1].hopper && typeof h.furnaces[1].hopper === 'object',
       'and so does a field inside a chamber\'s record'),
    ok(Object.keys(h.ore).length === Object.keys(h.bars).length, 'and a count by ore'),
    ok(h.brimstone === 0, 'a value of the wrong type falls back to the blank')
  ];
  window.__view('yard');
  window.__actsOn(null);
  return out;
});

group('readOver, on plain shapes', async () => {
  const blank = { n: 0, o: { a: 1, b: 2 }, l: [], r: [{ x: 1, y: 2 }, { x: 3, y: 4 }], z: null };
  const got = readOver(blank, { n: 5, o: { a: 9 }, l: [{ q: 1 }], r: [{ x: 7 }], z: 'hi', extra: 1 });
  return [
    ok(JSON.stringify(got) === JSON.stringify({ n: 5, o: { a: 9, b: 2 }, l: [{ q: 1 }], r: [{ x: 7, y: 2 }, { x: 3, y: 4 }], z: 'hi' }),
       'laid over the blank, one level into a record', JSON.stringify(got)),
    ok(JSON.stringify(readOver(blank, 'x')) === JSON.stringify(blank), 'a saved value that is no record leaves the blank')
  ];
});
