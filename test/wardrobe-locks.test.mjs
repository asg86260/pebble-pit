// What opens the wardrobe's items (wardrobe.js, `itemLock`; the owner's
// picks, 2026-10-16): a notice earned, a station's first hat owned, or the
// portal standing. Each opens as the player gets there, never closes again,
// is never rolled while locked, and an outfit a save brings back keeps an
// item it is wearing whether or not it is open now.
import { group, ok, run, runUntil, haveRock, quickCrew } from './helpers.mjs';
import { S } from '../src/state.js';
import { earn } from '../src/notices.js';
import { persist, restore } from '../src/persist.js';
import { JOB } from '../src/jobs.js';
import { stockOf } from '../src/kit.js';
import { SLOTS, isOpen, itemLock, wear, outfitOf, stepItem, rollOutfit, DEFAULTS } from '../src/wardrobe.js';

const locked = () => SLOTS.flatMap(s => s.items.filter(it => !isOpen(s.key, it.key)).map(it => `${s.key}:${it.key}`));

group('a fresh yard: the starting outfits and the plain items are open, the rest say what they wait on', async () => {
  const lk = itemLock('face', 'round-glasses'), hat = itemLock('head', 'helmet'), bowl = itemLock('head', 'diving-bowl');
  return [
    ok(isOpen('head', 'top-hat') && isOpen('face', 'monocle') && isOpen('head', 'bow'), 'what they start in is open, the top hat with it'),
    ok(isOpen('head', 'ears') && isOpen('aura', 'dust-motes') && itemLock('head', 'ears') === null, 'an item with no rule is open'),
    ok(lk && lk.kind === 'ach' && lk.id === 'firstspark' && lk.name === 'magic in the air' && lk.note,
       'round glasses wait on "magic in the air"', JSON.stringify(lk)),
    ok(hat && hat.kind === 'hat' && hat.id === JOB.ROCK && hat.name && hat.note, 'the helmet waits on the rock\'s first helmet',
       JSON.stringify(hat)),
    ok(bowl && bowl.kind === 'fact' && bowl.id === 'portal' && bowl.name && bowl.note, 'the diving bowl waits on the portal',
       JSON.stringify(bowl)),
    ok(['head:serpent-comb', 'head:crown', 'head:flower', 'head:sprout', 'head:gold-crown', 'neck:gold-scarf', 'back:gold-cape', 'aura:gold-halo',
        'aura:flies', 'aura:rain-cloud', 'aura:scale-swirl', 'head:bird', 'face:surprised', 'back:moneybag'].every(k => locked().includes(k)),
       'the earned items are locked', locked().join(' '))
  ];
});

group('the first pebble in the pit opens the sprout and the moneybag, and nothing else', async () => {
  const before = locked();
  haveRock();
  run(1);
  quickCrew();
  window.__crew(2, 3);
  window.__swing(80);
  await runUntil(() => S.won.includes('firstgrain'), 120);
  const opened = before.filter(k => !locked().includes(k));
  return [
    ok(S.won.includes('firstgrain'), 'the first pebble is thrown'),
    ok(isOpen('head', 'sprout') && isOpen('back', 'moneybag'), 'the sprout and the moneybag are open', opened.join(' ')),
    ok(opened.every(k => ['head:sprout', 'back:moneybag'].includes(k) || S.won.length > 1),
       'nothing it does not name opens with it', `${opened.join(' ')} / won ${S.won.join(' ')}`)
  ];
});

group('the rock\'s first helmet bought opens the helmet, and it stays open when the count falls and over a reload', async () => {
  window.__grant({ shards: 100000, dust: 40000 });
  window.__kit({ learned: true });
  window.__crew(2, 3);
  run(2);
  const was = isOpen('head', 'helmet');
  const bought = window.__buy('breaker');
  runUntil(() => stockOf(JOB.ROCK) >= 1, 240);
  run(1);
  const now = isOpen('head', 'helmet'), latched = (S.wardOpened || []).includes('hat:' + JOB.ROCK);
  S.breakers = 0;
  const after = isOpen('head', 'helmet');
  persist();
  S.wardOpened = [];
  restore();
  return [
    ok(!was && bought, 'locked before the hat is bought, and bought through the row'),
    ok(now && latched, 'open once it is bought, and the opening kept', JSON.stringify(S.wardOpened)),
    ok(after, 'still open with the count back at none'),
    ok(isOpen('head', 'helmet') && S.breakers === 0, 'and after a reload, read from the save', JSON.stringify(S.wardOpened))
  ];
});

group('the outhouse opens the cap, and the portal the diving bowl, and neither closes', async () => {
  const cap = isOpen('head', 'cap'), bowl = isOpen('head', 'diving-bowl');
  S.outhouseOpen = true;
  S.portalOpen = true;
  run(1);
  S.outhouseOpen = false;
  S.portalOpen = false;
  run(1);
  return [
    ok(!cap && !bowl, 'both locked at first'),
    ok(isOpen('head', 'cap') && isOpen('head', 'diving-bowl'), 'both open after, the yard\'s facts undone',
       JSON.stringify(S.wardOpened))
  ];
});

group('complete act 2 opens the gold set', async () => {
  const gold = [['head', 'gold-crown'], ['neck', 'gold-scarf'], ['back', 'gold-cape'], ['aura', 'gold-halo']];
  const was = gold.some(([s, k]) => isOpen(s, k));
  earn('freed', true);
  return [
    ok(!was, 'locked before'),
    ok(gold.every(([s, k]) => isOpen(s, k)), 'all four open after')
  ];
});

// The serpent's best level is set; the notice is the game's own, earned on
// its tick, and the comb opens off it.
group('the serpent comb opens at the serpent\'s level 25, not before', async () => {
  S.serpentBest = 24;
  run(1);
  const at24 = isOpen('head', 'serpent-comb'), lk = itemLock('head', 'serpent-comb');
  S.serpentBest = 25;
  run(1);
  return [
    ok(!at24 && lk && lk.kind === 'ach' && lk.id === 'serpent3' && lk.name, 'locked at level 24, waiting on the notice for 25',
       JSON.stringify(lk)),
    ok(S.won.includes('serpent3') && isOpen('head', 'serpent-comb'), 'open at 25', S.won.join(' '))
  ];
});

// The muck rain is the game's own, counted on the tally the notice reads.
group('the first muck rain opens the rain cloud with the flies', async () => {
  const was = isOpen('aura', 'rain-cloud'), lk = itemLock('aura', 'rain-cloud');
  S.tally.muckRains = 1;
  run(1);
  return [
    ok(!was && lk && lk.kind === 'ach' && lk.id === 'muckrain' && lk.name, 'locked, waiting on the muck rain', JSON.stringify(lk)),
    ok(S.won.includes('muckrain') && isOpen('aura', 'rain-cloud') && isOpen('aura', 'flies'), 'both open after', S.won.join(' '))
  ];
});

group('the scale swirl opens at the serpent\'s level 2, not before', async () => {
  S.serpentBest = 1;
  run(1);
  const at1 = isOpen('aura', 'scale-swirl'), lk = itemLock('aura', 'scale-swirl');
  S.serpentBest = 2;
  run(1);
  return [
    ok(!at1 && lk && lk.kind === 'ach' && lk.id === 'serpent0' && lk.name, 'locked at level 1, waiting on the notice for 2',
       JSON.stringify(lk)),
    ok(S.won.includes('serpent0') && isOpen('aura', 'scale-swirl'), 'open at 2', S.won.join(' '))
  ];
});

group('a roll never puts on a locked item, a step goes past one, and a save keeps one already worn', async () => {
  const rolled = new Set();
  for (let i = 0; i < 400; i++) { rollOutfit('you'); for (const s of SLOTS) rolled.add(`${s.key}:${outfitOf('you')[s.key]}`); }
  const shut = locked();
  wear('you', { ...DEFAULTS.you });
  stepItem('you', 'head', 1);
  const stepped = outfitOf('you').head;
  wear('you', { head: 'crown', aura: 'flies' });
  persist();
  S.outfits = null;
  restore();
  const kept = outfitOf('you');
  return [
    ok(![...rolled].some(k => shut.includes(k)), 'no locked item rolled', [...rolled].filter(k => shut.includes(k)).join(' ')),
    ok(stepped === 'ears', 'the top hat\'s next is the first open item past it', stepped),
    ok(kept.head === 'crown' && kept.aura === 'flies' && !isOpen('head', 'crown'), 'a locked item worn is still worn after a reload',
       JSON.stringify(kept))
  ];
});
