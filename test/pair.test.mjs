// The two of them (wardrobe.js): which bodies are the sqwife and the
// sqhusband, kept from when each first appears, and what they wear.
//
// Reached the way the story reaches them: he is the body the opening hands
// the yard to, she is the one dug out under the dome's held rock (the
// rescue's own beat, walked: the dig, the walk out, the joining), and the
// snatch is played from its own due. A reload between is the save's
// question; the outfits go through a write and a read with S emptied
// between, so the save, not memory, answers.
import { group, ok, state, run, runUntil, yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { WORKER } from '../src/config.js';
import { startBeat } from '../src/beats.js';
import { persist, restore } from '../src/persist.js';
import { migrate } from '../src/migrations/index.js';
import { pairBody, outfitOf, DEFAULTS, stepItem, rollOutfit, SLOTS } from '../src/wardrobe.js';

const KEY = 'boulder-clicker/v4';
const ids = () => ({ ...S.pairIds });

// The rescue as its beat plays it: the dome's rock held over the spot, the
// dig, the walk out and the joining. The dome itself is shield.test.mjs's.
function rescue() {
  S.rockHeld = true;
  S.rockFall = 1;
  startBeat('rescue');
  let digger = null;
  for (let f = 0; f < 60 * 90 && S.beat.yard === 'rescue'; f++) {
    run(1 / 60);
    const d = S.workers.find(w => w.dig);
    if (d && !digger) digger = d.uid;
  }
  S.rockHeld = false;
  S.rockFall = 0;
  return digger;
}

group('he is the body the opening hands over, she the one dug out, and a reload keeps both', async () => {
  const first = S.workers[0]?.uid;
  const opened = ids();
  window.__crew(3, 2);
  run(2);
  const before = new Set(S.workers.map(w => w.uid));
  const crew = S.crew;
  const digger = rescue();
  const fresh = S.workers.filter(w => !before.has(w.uid)).map(w => w.uid);
  const named = ids();
  persist();
  S.pairIds = { her: null, him: null };
  restore();
  const back = ids();
  return [
    ok(opened.him === first && !opened.her, 'the opening\'s survivor is him, and she is not one of the crew yet',
       JSON.stringify(opened)),
    ok(digger === named.him, 'he is the one who digs her out', `digger ${digger}, him ${named.him}`),
    ok(S.rescued && S.crew === crew + 1 && fresh.length === 1 && named.her === fresh[0],
       'she is the body she becomes as she joins the crew', `${JSON.stringify(named)}, new ${fresh}`),
    ok(back.her === named.her && back.him === named.him && pairBody('her') && pairBody('him'),
       'the save keeps both names, each on its body', JSON.stringify(back))
  ];
});

group('the snatch takes the two of them, walked from where they stand, and she is the first station\'s', async () => {
  window.__crew(3, 3);
  run(2);
  rescue();
  run(3);
  const named = ids();
  window.__snatch();
  let took = null, jump = 0, last = null, taken = null;
  for (let f = 0; f < 60 * 120 && !S.beatsDone.includes('snatch'); f++) {
    run(1 / 60);
    if (S.snatch && S.pair.length && !took) took = S.pair.map(b => b.body?.uid);
    if (S.snatch?.him && !taken) taken = S.snatch.him.body?.uid;
    const at = S.pair.map(b => [b.x, b.y]);
    if (last && at.length === last.length)
      at.forEach(([x, y], i) => { jump = Math.max(jump, Math.hypot(x - last[i][0], y - last[i][1])); });
    last = at;
  }
  const after = ids();
  const st0 = S.stations[0];
  const her = pairBody('her');
  window.__cold();
  const cold = ids();
  return [
    ok(took && took.length === 2 && took.includes(named.her) && took.includes(named.him),
       'it takes those two and nobody else', `took ${took}, named ${JSON.stringify(named)}`),
    ok(taken === named.him, 'him it takes into the water', `taken ${taken}`),
    ok(jump < WORKER, 'they walk to the edge: nothing crosses a body\'s width in a frame', `${jump.toFixed(1)}px`),
    ok(after.her === named.her && after.him === null, 'she is still her; he is not one of the crew', JSON.stringify(after)),
    ok(her && st0 && st0.fighter === her.uid && her.station === st0.id, 'she is the first station\'s fighter',
       `${st0?.fighter} ${after.her}`),
    ok(cold.her === named.her && pairBody('her')?.type === 'fighter', 'and a cold reload keeps her there', JSON.stringify(cold))
  ];
});

group('a body that is one of them is not the one stood down', async () => {
  window.__crew(4, 4);
  run(2);
  rescue();
  run(1);
  const named = ids();
  window.__crew(1, 1);
  run(2);
  const left = ids();
  return [
    ok(S.workers.length === 2 && pairBody('her') && pairBody('him'),
       'the two kept when the crew is cut to two', `${S.workers.length} bodies`),
    ok(left.her === named.her && left.him === named.him, 'under the same names', JSON.stringify(left))
  ];
});

group('what they wear is kept by the save, item by item', async () => {
  // The picker's own steps (wardrobepage.js calls these on its rows).
  stepItem('her', 'head', 1);           // bow -> top hat
  stepItem('him', 'back', -1);          // none, back round to the last
  stepItem('him', 'pattern', 2);
  let n = 0;
  rollOutfit('her', () => [0.99, 0.5, 0.01, 0.7, 0.3][n++ % 5]);
  const worn = { her: { ...outfitOf('her') }, him: { ...outfitOf('him') } };
  persist();
  S.outfits = null;
  restore();
  const back = { her: { ...outfitOf('her') }, him: { ...outfitOf('him') } };
  // An item the game no longer has (the necklace was cut at the vote) comes
  // back as the slot's default; the rest of the outfit stands.
  const raw = JSON.parse(localStorage.getItem(KEY));
  raw.outfits.her.neck = 'necklace';
  raw.outfits.him.head = 'no-such-hat';
  localStorage.setItem(KEY, JSON.stringify(raw));
  restore();
  const mended = { her: { ...outfitOf('her') }, him: { ...outfitOf('him') } };
  const slots = SLOTS.map(s => s.key);
  return [
    ok(worn.him.back === 'flag' && worn.her.head !== DEFAULTS.her.head, 'the steps change what they wear',
       JSON.stringify(worn)),
    ok(slots.every(k => back.her[k] === worn.her[k] && back.him[k] === worn.him[k]),
       'and a save and a load hand back every slot', JSON.stringify(back)),
    ok(mended.her.neck === DEFAULTS.her.neck && mended.him.head === DEFAULTS.him.head
       && mended.her.head === worn.her.head && mended.him.back === worn.him.back,
       'an item no longer in the wardrobe reads as the default, the rest as worn', JSON.stringify(mended))
  ];
});

group('a save from before the names is given them, and is not offered the picker', async () => {
  window.__crew(3, 2);
  run(2);
  rescue();
  run(1);
  persist();
  const raw = JSON.parse(localStorage.getItem(KEY));
  delete raw.pairIds; delete raw.outfits; delete raw.dressOffered;
  raw.saveV = 22;
  const ran = migrate(raw).map(m => m.v);
  const oldest = [...raw.who].filter(k => !k.deepHome).sort((a, b) => +a.uid.slice(1) - +b.uid.slice(1))[0].uid;
  localStorage.setItem(KEY, JSON.stringify(raw));
  S.pairIds = { her: null, him: null };
  restore();
  return [
    ok(ran.includes(23), 'the migration runs', `${ran}`),
    ok(raw.pairIds.him === oldest && raw.pairIds.her && raw.pairIds.her !== oldest,
       'him the oldest body of the yard, her the oldest that is not him', JSON.stringify(raw.pairIds)),
    ok(S.pairIds.him === raw.pairIds.him && pairBody('her') && pairBody('him'), 'and the yard reads them back',
       JSON.stringify(S.pairIds)),
    ok(S.dressOffered === true, 'a yard already played is not offered the picker as a new one'),
    ok(outfitOf('her').head === DEFAULTS.her.head && outfitOf('him').head === DEFAULTS.him.head,
       'they wear the defaults until it is opened')
  ];
});

group('a new yard has the picker to offer, and wears the defaults from its first frame', async () => {
  window.__reset();
  return [
    ok(S.dressOffered === false, 'a new yard has not been offered it yet'),
    ok(outfitOf('her').head === DEFAULTS.her.head && outfitOf('him').head === DEFAULTS.him.head
       && DEFAULTS.her.head !== DEFAULTS.him.head, 'the two start in two different outfits'),
    ok(state() && S.pairIds.him === S.workers[0]?.uid, 'and he is named from the opening\'s hand-over')
  ];
});
