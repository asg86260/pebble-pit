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
import { AURA_KEYS } from '../src/render/wardaura.js';
import { pairBody, outfitOf, DEFAULTS, stepItem, rollOutfit, bareOutfit, SLOTS } from '../src/wardrobe.js';

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
  S.pairIds = { you: null, sqouse: null };
  restore();
  const back = ids();
  return [
    ok(opened.you === first && !opened.sqouse, 'the opening\'s survivor is him, and she is not one of the crew yet',
       JSON.stringify(opened)),
    ok(digger === named.you, 'he is the one who digs her out', `digger ${digger}, him ${named.you}`),
    ok(S.rescued && S.crew === crew + 1 && fresh.length === 1 && named.sqouse === fresh[0],
       'she is the body she becomes as she joins the crew', `${JSON.stringify(named)}, new ${fresh}`),
    ok(back.sqouse === named.sqouse && back.you === named.you && pairBody('sqouse') && pairBody('you'),
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
  const her = pairBody('sqouse');
  window.__cold();
  const cold = ids();
  return [
    ok(took && took.length === 2 && took.includes(named.sqouse) && took.includes(named.you),
       'it takes those two and nobody else', `took ${took}, named ${JSON.stringify(named)}`),
    ok(taken === named.you, 'you it takes into the water', `taken ${taken}`),
    ok(jump < WORKER, 'they walk to the edge: nothing crosses a body\'s width in a frame', `${jump.toFixed(1)}px`),
    ok(after.sqouse === named.sqouse && after.you === null, 'your sqouse is still your sqouse; you are not one of the crew', JSON.stringify(after)),
    ok(her && st0 && st0.fighter === her.uid && her.station === st0.id, 'she is the first station\'s fighter',
       `${st0?.fighter} ${after.sqouse}`),
    ok(cold.sqouse === named.sqouse && pairBody('sqouse')?.type === 'fighter', 'and a cold reload keeps her there', JSON.stringify(cold))
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
    ok(S.workers.length === 2 && pairBody('sqouse') && pairBody('you'),
       'the two kept when the crew is cut to two', `${S.workers.length} bodies`),
    ok(left.sqouse === named.sqouse && left.you === named.you, 'under the same names', JSON.stringify(left))
  ];
});

group('what they wear is kept by the save, item by item', async () => {
  // The picker's own steps (wardrobepage.js calls these on its rows).
  stepItem('sqouse', 'head', 1);           // bow -> top hat
  stepItem('you', 'back', -1);          // none, back round to the last
  stepItem('you', 'pattern', 2);
  let n = 0;
  rollOutfit('sqouse', () => [0.99, 0.5, 0.01, 0.7, 0.3][n++ % 5]);
  const worn = { sqouse: { ...outfitOf('sqouse') }, you: { ...outfitOf('you') } };
  persist();
  S.outfits = null;
  restore();
  const back = { sqouse: { ...outfitOf('sqouse') }, you: { ...outfitOf('you') } };
  // An item the game no longer has (the necklace was cut at the vote) comes
  // back as the slot's bare item; the rest of the outfit stands.
  const raw = JSON.parse(localStorage.getItem(KEY));
  raw.outfits.sqouse.neck = 'necklace';
  raw.outfits.you.head = 'no-such-hat';
  localStorage.setItem(KEY, JSON.stringify(raw));
  restore();
  const mended = { sqouse: { ...outfitOf('sqouse') }, you: { ...outfitOf('you') } };
  const slots = SLOTS.map(s => s.key);
  return [
    ok(worn.you.back === 'flag' && worn.sqouse.head !== DEFAULTS.sqouse.head, 'the steps change what they wear',
       JSON.stringify(worn)),
    ok(slots.every(k => back.sqouse[k] === worn.sqouse[k] && back.you[k] === worn.you[k]),
       'and a save and a load hand back every slot', JSON.stringify(back)),
    ok(mended.sqouse.neck === 'none' && mended.you.head === 'none'
       && mended.sqouse.head === worn.sqouse.head && mended.you.back === worn.you.back,
       'an item no longer in the wardrobe is taken off, the rest as worn', JSON.stringify(mended))
  ];
});

// The sixth slot, the aura (render/wardaura.js): stepped on as the picker's
// row does, kept by a save and a load, rolled by randomize (every aura
// turns up), taken off by clear; and a save from before the slot is read
// wearing none.
group('the aura is a slot: kept by the save, rolled by randomize, taken off by clear', async () => {
  const auras = SLOTS.find(s => s.key === 'aura').items.map(i => i.key);
  stepItem('you', 'aura', 7);
  stepItem('sqouse', 'aura', -1);
  const worn = { you: outfitOf('you').aura, sqouse: outfitOf('sqouse').aura };
  persist();
  S.outfits = null;
  restore();
  const back = { you: outfitOf('you').aura, sqouse: outfitOf('sqouse').aura };
  const rolled = new Set();
  for (let i = 0; i < 300; i++) { rollOutfit('you'); rolled.add(outfitOf('you').aura); }
  bareOutfit('you');
  const cleared = outfitOf('you').aura;
  persist();
  const raw = JSON.parse(localStorage.getItem(KEY));
  delete raw.outfits.you.aura; delete raw.outfits.sqouse.aura;
  raw.saveV = 25;
  const ran = migrate(raw).map(m => m.v);
  localStorage.setItem(KEY, JSON.stringify(raw));
  restore();
  return [
    ok(worn.you === auras[7] && worn.sqouse === auras[auras.length - 1], 'the row steps the aura', JSON.stringify(worn)),
    ok(back.you === worn.you && back.sqouse === worn.sqouse, 'a save and a load hand it back', JSON.stringify(back)),
    ok(auras.slice(1).every(k => AURA_KEYS.includes(k)) && AURA_KEYS.every(k => auras.includes(k)),
       'every aura on the row is one that is drawn', AURA_KEYS.join(' ')),
    ok(auras.every(k => rolled.has(k)), 'randomize puts every aura on, and none', [...rolled].join(' ')),
    ok(cleared === 'none', 'clear takes it off', cleared),
    ok(ran.includes(26) && raw.outfits.you.aura === 'none' && outfitOf('sqouse').aura === 'none',
       'a save from before the slot wears none', `${ran} ${JSON.stringify(outfitOf('sqouse'))}`)
  ];
});

// The item review's cuts (2026-10-16): a save wearing one is bare in that
// slot, the pattern once called black is the filled one, and no roll of the
// dice, nor any default, puts a cut item back on.
const CUT = { head: ['pigtails', 'tiara'], neck: ['bowtie', 'tie', 'collar', 'medal'],
              back: ['small-pack', 'cat-tail', 'bushy-tail'], pattern: ['grey', 'pale', 'black'] };
group('a save wearing a cut item has it taken off, and black is filled', async () => {
  run(1);
  persist();
  const raw = JSON.parse(localStorage.getItem(KEY));
  raw.outfits = {
    you: { head: 'tiara', face: 'monocle', neck: 'bowtie', back: 'cat-tail', pattern: 'black' },
    sqouse: { head: 'pigtails', face: 'eyes', neck: 'medal', back: 'flag', pattern: 'pale' },
  };
  raw.saveV = 24;
  const ran = migrate(raw).map(m => m.v);
  localStorage.setItem(KEY, JSON.stringify(raw));
  restore();
  const you = { ...outfitOf('you') }, sq = { ...outfitOf('sqouse') };
  const listed = SLOTS.flatMap(s => s.items.map(i => `${s.key}:${i.key}`));
  const rolled = new Set();
  for (let i = 0; i < 400; i++) { rollOutfit('sqouse'); for (const s of SLOTS) rolled.add(`${s.key}:${outfitOf('sqouse')[s.key]}`); }
  const cut = Object.entries(CUT).flatMap(([s, ks]) => ks.map(k => `${s}:${k}`));
  const defaults = Object.values(DEFAULTS).flatMap(o => Object.entries(o).map(([s, k]) => `${s}:${k}`));
  return [
    ok(ran.includes(25), 'the migration runs', `${ran}`),
    ok(you.head === 'none' && you.neck === 'none' && you.back === 'none' && you.pattern === 'filled' && you.face === 'monocle',
       'each cut slot is bare, the black pattern is filled, the rest as worn', JSON.stringify(you)),
    ok(sq.head === 'none' && sq.neck === 'none' && sq.pattern === 'plain' && sq.back === 'flag',
       'on both of them', JSON.stringify(sq)),
    ok(!cut.some(k => listed.includes(k) || rolled.has(k) || defaults.includes(k)),
       'no cut item is listed, rolled or worn by default', [...rolled].filter(k => cut.includes(k)).join(' '))
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
  S.pairIds = { you: null, sqouse: null };
  restore();
  return [
    ok(ran.includes(23), 'the migration runs', `${ran}`),
    ok(raw.pairIds.you === oldest && raw.pairIds.sqouse && raw.pairIds.sqouse !== oldest,
       'him the oldest body of the yard, her the oldest that is not him', JSON.stringify(raw.pairIds)),
    ok(S.pairIds.you === raw.pairIds.you && pairBody('sqouse') && pairBody('you'), 'and the yard reads them back',
       JSON.stringify(S.pairIds)),
    ok(S.dressOffered === true, 'a yard already played is not offered the picker as a new one'),
    ok(outfitOf('sqouse').head === DEFAULTS.sqouse.head && outfitOf('you').head === DEFAULTS.you.head,
       'they wear the defaults until it is opened')
  ];
});

group('a new yard has the picker to offer, and wears the defaults from its first frame', async () => {
  window.__reset();
  return [
    ok(S.dressOffered === false, 'a new yard has not been offered it yet'),
    ok(outfitOf('sqouse').head === DEFAULTS.sqouse.head && outfitOf('you').head === DEFAULTS.you.head
       && DEFAULTS.sqouse.head !== DEFAULTS.you.head, 'the two start in two different outfits'),
    ok(state() && S.pairIds.you === S.workers[0]?.uid, 'and he is named from the opening\'s hand-over')
  ];
});
