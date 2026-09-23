// The boards: what a row is, how wide a column goes, what a price says, and
// where a board seats itself.

import { sleep, newRun, raf, settle, state, ok, canvas, board, shop, point, onScreen, runUntil,
  haveBench, hoverBench, hoverStation, openCrewList, hoverAway, run } from './kit.js';
import { TIER_OWN, SHELF_HAND_FADE, MACHINE_TUNE_RUNGS } from '../config.js';

// The ink standing in the band of sky over a station, where nothing else
// black stands, so it counts the flag and very little else. Measured in the
// pixels the yard really paints. Shared, so the two flag groups below are
// asking the canvas the same question.
const flagInk = which => {
  const s = state(), r = s.stands[which];
  if (!r) return 0;
  const dpr = window.devicePixelRatio || 1;
  const x0 = Math.round((r.x - 12 - s.camX) * s.zoom * dpr);
  const y0 = Math.round((r.y - 72 - s.camY) * s.zoom * dpr);
  const w = Math.max(1, Math.round((r.w + 24) * s.zoom * dpr));
  const h = Math.max(1, Math.round(70 * s.zoom * dpr));
  if (x0 < 0 || y0 < 0) return -1;
  const d = canvas().getContext('2d').getImageData(x0, y0, w, h).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 128) n++;
  return n;
};

// Where a cell's words are painted: the union of its text, and only its text.
// A Range over the whole cell also takes in a tile's pips, which stand down
// the tile's right edge out of the flow on purpose (`.ladder` in shelf.css)
// and are not words running anywhere.
const textInk = cell => {
  let right = -Infinity;
  const walk = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const r = document.createRange();
    r.selectNodeContents(n);
    right = Math.max(right, r.getBoundingClientRect().right);
  }
  return { right };
};

export const TESTS = [
  // Read off the sheets themselves rather than the row list, because what is
  // claimed is where a player finds the row.
  ['each hat is sold on its own station\'s board', async () => {
    window.__crew(2, 2, 2, 2);
    window.__grant({ shards: 200, dust: 5000 });
    window.__shack();
    const St = (await import('/src/state.js')).S;
    St.quarryOpen = true;
    St.farmOpen = true;
    window.__build();
    // The kit gates are the door chain now, not the shields (`shieldOpened`),
    // so every station open is every hat on offer.
    window.__kit({ learned: true });
    const after = {};
    for (const [name, sel] of Object.entries({ shack: '#shackshop', quarry: '#quarryshop',
                                               farm: '#farmshop', bench: '#shop' })) {
      window.__board(name);
      await sleep(120);
      after[name] = [...document.querySelector(sel).querySelectorAll('[data-key]')]
        .filter(b => b.offsetParent).map(r => r.dataset.key);
    }
    window.__board(null);
    window.__crew(0, 0);
    const where = k => Object.keys(after).filter(n => after[n].includes(k)).join(',');
    return [
      ok(where('breaker') === 'shack', 'the breaker is on the shack\'s board', where('breaker')),
      ok(where('blaster') === 'quarry', 'the blaster on the quarry\'s', where('blaster')),
      ok(where('grower') === 'farm', 'the grower on the farm\'s', where('grower')),
      ok(where('carter') === 'bench', 'and the carter on the bench', where('carter'))
    ];
  }],

  // A bill is allowed to cost the card another line but never a word of the
  // gain: a gain in a `1fr` track against a six-coin bill's `auto` comes out
  // nought pixels wide, still in the DOM and not on the screen, and no status
  // check sees it. So this reads the gain in a yard rich enough for the deep
  // bills.
  ['no card ever eats the line that says what it gives', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 900, spores: 900, sparks: 999 });
    window.__crew(4, 3, 2, 2);
    // Every station standing: a card that is not on a board cannot be
    // measured.
    window.__fullSites();
    window.__invest();
    // The spark rung of the ground ladders, where the bills get wide enough
    // to squeeze the card.
    window.__levels({ cropLevel: TIER_OWN, tendLevel: TIER_OWN, seamLevel: TIER_OWN });
    run(20);
    const bad = [];
    const seen = new Set();
    for (const name of ['bench', 'house', 'quarry', 'farm', 'filter',
                        'tower', 'casino', 'outhouse']) {
      window.__board(name);
      await sleep(320);                        // the sheet scales in; let it land
      for (const card of document.querySelectorAll(
        '.page:not([hidden]) .rows button[data-key]')) {
        const g = card.querySelector('.gain');
        if (!g || !g.offsetParent || !g.textContent.trim()) continue;
        seen.add(card.dataset.key);
        // The words, not the box: a Range says where the ink actually ends,
        // where the cell's own rect only says how wide the track came out.
        const r = document.createRange();
        r.selectNodeContents(g);
        const ink = Math.round(r.getBoundingClientRect().width);
        const room = Math.round(g.getBoundingClientRect().width);
        if (ink - room > 1) bad.push(`${name}:${card.dataset.key} "${g.textContent}" ${ink}>${room}`);
      }
    }
    window.__board(null);
    window.__crew(0, 0);
    return [
      // Named rather than counted: a setup that stops putting the deep card
      // on the board should fail here rather than quietly measure ten easy
      // cards instead.
      ok(seen.has('crop') && seen.size >= 8,
         'the deep bills are on the boards to read',
         `${seen.size} lines${seen.has('crop') ? '' : ', no crop'}`),
      ok(bad.length === 0, 'and every one of them fits the cell it is in',
         bad.join(' | ') || 'all whole')
    ];
  }],

  // A card is three lines, and only a title longer than the card may make it
  // taller. Everything else that makes cards ragged is a bug: a bill stacked
  // to fit a narrow column, a card with no gain dropping the line its
  // neighbor held, a pips corner that comes and goes. The boards are shelves
  // now, whose tiles share their plank's rows (the long-name check below), so
  // the cards left to hold to this are the crew window's.
  ['a card is only ever taller by a whole line of title', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 900, spores: 900 });
    window.__crew(4, 3, 2, 2);
    window.__air({ janitors: 1 });
    // The shack stands, so its door (the one card under this purse with a
    // note, which is a second thing that makes a card taller and which the
    // rule does not yet cover) is off the bench.
    window.__shack();
    run(20);
    const boards = ['bench', 'shack', 'house', 'quarry', 'farm', 'filter',
                    'tower', 'casino'];
    const bad = [];
    let seen = 0;
    for (const name of boards) {
      window.__board(name);
      await sleep(320);                        // the sheet scales in; let it land
      if (name === 'house') { await openCrewList(); await sleep(200); }
      const rows = [...document.querySelectorAll(
        '.page:not([hidden]) .rows button, .page:not([hidden]) .rows .job, #crewlistrows button')]
        .filter(e => e.offsetParent && !e.closest('.step') && !e.classList.contains('tile'));
      if (rows.length < 2) continue;
      seen += rows.length;
      const h = e => Math.round(e.getBoundingClientRect().height);
      // Measured off the words rather than assumed from the height, so the
      // check is not comparing a number with itself.
      const lines = e => {
        const t = e.querySelector('.what');
        if (!t) return 1;
        const r = document.createRange();
        r.selectNodeContents(t);
        return Math.max(1, r.getClientRects().length);
      };
      // A line of the sheet is as tall as the taller of its two cards, so the
      // rule is read a line at a time: the step plus a line per line of the
      // *longest* title on it, and every card on it is that height. A line
      // with a note card (`.rows .note` in style.css) is left out: a note is a
      // second thing that makes a card taller, and this rule does not yet
      // cover it.
      const top = e => Math.round(e.getBoundingClientRect().top);
      const shelves = [...new Set(rows.map(top))].map(t => rows.filter(e => top(e) === t))
        .filter(shelf => !shelf.some(e => e.querySelector('.note')));
      const longest = shelf => Math.max(...shelf.map(lines));
      // A line of the sheet whose titles are all one line is the board's step.
      const one = shelves.filter(s => longest(s) === 1).flatMap(s => s.map(h));
      if (!one.length) continue;
      const step = Math.min(...one);
      const ragged = one.filter(x => x !== step).length;
      if (ragged) bad.push(`${name}: ${ragged} one-line cards off ${step}px`);
      const kept = shelves.flat();
      const line = Math.round((Math.max(...kept.map(h)) - step) /
                              Math.max(1, Math.max(...kept.map(lines)) - 1));
      for (const shelf of shelves) {
        const want = step + (longest(shelf) - 1) * (line || 0);
        for (const e of shelf) {
          if (Math.abs(h(e) - want) > 1) {
            bad.push(`${name}: ${h(e)}px beside ${longest(shelf)} title lines, wanted ${want}px`);
          }
        }
      }
    }
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(seen >= 8, 'there are cards to measure', `${seen} cards`),
      ok(bad.length === 0,
         'and every one of them is its board\'s step, plus a line per line of title',
         bad.join(' | ') || 'all level')
    ];
  }],

  ['on the dark page every word on a card is lighter than its paper', async () => {
    newRun();
    await settle();
    window.__give(3000);
    window.__crew(2, 2);
    run(20);
    window.__board('bench');
    await sleep(400);
    // The clock's count went unread on the dark page (2026-09-17): a rule in
    // shelf.css named black outright rather than a palette step, so the
    // swap to the dark ink never reached it. Measured off the computed
    // style of every text cell on every card, against the card's own paper.
    const lum = c => { const m = /rgba?\((\d+), (\d+), (\d+)/.exec(c); return m ? (+m[1] + +m[2] + +m[3]) / 3 : NaN; };
    document.documentElement.classList.add('dark');
    await raf();
    const rows = [...document.querySelectorAll('#shop button[data-key]')];
    const dim = [];
    for (const row of rows) {
      const paper = lum(getComputedStyle(row).backgroundColor);
      for (const sel of ['.what', '.gain', '.time', '.cost']) {
        const el = row.querySelector(sel);
        if (!el || !el.textContent.trim()) continue;
        const ink = lum(getComputedStyle(el).color);
        if (!(ink > paper + 40)) dim.push(`${row.dataset.key} ${sel} ${ink} on ${paper}`);
      }
    }
    document.documentElement.classList.remove('dark');
    window.__board(null);
    return [
      ok(rows.length > 0, 'the bench has cards on it'),
      ok(dim.length === 0, 'every word on every card stands off the dark paper', dim.join('; ')),
    ];
  }],

  ['the clock in a tag is in the same ink as the bill beside it', async () => {
    newRun();
    await settle();
    window.__give(3000);
    window.__crew(2, 2);
    run(20);
    window.__board('bench');
    await sleep(400);
    // The clock cell wore a step less ink than the coins in the same box, and
    // on the dark page that read as a second color, not a lighter touch
    // (2026-09-20). Measured on both pages: the computed color of the clock
    // cell against the bill's, on every card that carries both.
    const off = [];
    for (const dark of [false, true]) {
      document.documentElement.classList.toggle('dark', dark);
      await raf();
      for (const row of document.querySelectorAll('#shop button[data-key]')) {
        const time = row.querySelector('.tag .time'), cost = row.querySelector('.tag .cost');
        if (!time || !cost || !time.textContent.trim() || !cost.textContent.trim()) continue;
        const a = getComputedStyle(time).color, b = getComputedStyle(cost).color;
        if (a !== b) off.push(`${dark ? 'dark' : 'light'} ${row.dataset.key} ${a} vs ${b}`);
      }
    }
    document.documentElement.classList.remove('dark');
    window.__board(null);
    return [
      ok(document.querySelectorAll('#shop button[data-key] .tag .time').length > 0, 'the bench has clocks on it'),
      ok(off.length === 0, 'every clock is the ink of its bill', off.join('; ')),
    ];
  }],

  ['a bill you can half afford says which half', async () => {
    newRun();
    await settle();
    // The farm's door is the two-coin row on an early bench (a core and
    // dust), offered once the props have fallen and a core has been seen.
    // Dust enough, the core not.
    window.__give(3000);
    const St = (await import('/src/state.js')).S;
    St.shieldsDone = ['props'];
    St.seenCore = true;
    window.__grant({ cores: 0, shards: 2, spores: 0 });
    window.__crew(2, 2);
    run(20);
    window.__board('bench');
    await sleep(400);
    const rows = [...document.querySelectorAll('#shop button[data-key]')]
      .filter(b => b.offsetParent && b.querySelectorAll('.cost span').length > 1);
    const ink = el => getComputedStyle(el).color;
    const dim = [], lit = [];
    for (const b of rows) {
      if (!b.disabled) continue;              // an affordable row is not the case
      for (const sp of b.querySelectorAll('.cost span')) {
        (sp.classList.contains('short') ? dim : lit).push(ink(sp));
      }
    }
    window.__board(null);
    window.__crew(0, 0);
    // On a shelf a tile you cannot pay for pales, title and tag, so the plank
    // sorts itself from across the room; the coin you are short of stays
    // pale with it and the ones you have stand back up at full ink, so the
    // grey one is the one to go and get.
    const grey = c => { const m = c.match(/\d+/g); return m && +m[0] === +m[1] && +m[0] > 0 && +m[0] < 200; };
    return [
      ok(dim.length > 0 && lit.length > 0,
         'there is a row priced in something you have and something you have not',
         `${lit.length} held, ${dim.length} short`),
      ok(dim.every(grey),
         'what you are short of is greyed with the rest of the tile, readably',
         [...new Set(dim)].join(' ')),
      ok(lit.every(c => c === 'rgb(0, 0, 0)'),
         'and what you have is written in black',
         [...new Set(lit)].join(' '))
    ];
  }],

  // Time is a price, in the bill with the coins under a clock.
  ['what a thing costs in waiting is priced with the rest of it', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 9000, spores: 9000 });
    window.__answered('props', 'net', 'arch');  // the shields that open the doors below
    // The ground first: the tower is the end of the chain, so its row does not
    // appear until the plots, the cut and the lab are all standing.
    window.__crew(0, 0, 1, 1);
    window.__invest();
    window.__crew(0, 0);
    run(30);
    window.__build();
    window.__buy('unlocktower');
    window.__finish();  // the page's business, not the yard's
    window.__build();
    window.__board('tower');
    await sleep(500);
    const row = document.querySelector('#towershop button[data-key="wizard"]');
    // The coins are the bill and the clock is a cell of its own beside the
    // gain (the card in style.css), so the waiting is read across two cells.
    const coins = row && [...row.querySelectorAll('.cost i, .time i')].map(i => i.className);
    const said = row && row.querySelector('.time').textContent.trim();
    const tall = row && Math.round(row.getBoundingClientRect().height);
    // A bill wraps inside its cell once it is longer than the card can hold,
    // so what is pinned is the wrap the design promises: every coin inside
    // the cell, nothing clipped, the card grown to hold the second line.
    // Measured rather than asked of a class name put on by counting coins.
    const cell = row && row.querySelector('.cost');
    const box = cell && cell.getBoundingClientRect();
    const card = row && row.getBoundingClientRect();
    const spans = cell ? [...cell.querySelectorAll('span')].map(s => s.getBoundingClientRect()) : [];
    const inside = !!box && spans.length === 3 && spans.every(r =>
      r.left >= box.left - 1 && r.right <= box.right + 1 && r.bottom <= card.bottom + 1);
    window.__board(null);
    return [
      ok(!!row && row.querySelector('.what').textContent.trim() === 'train a wizard',
         'the tower trains a wizard', row && row.querySelector('.what').textContent),
      ok(coins && coins.slice().sort().join() === 'clock,dust,shard,spore',
         'and the waiting is the fourth thing it costs', String(coins)),
      ok(/[0-9]+ ?(min|s)$/i.test((said || '').trim()), 'said as a length of time, not a count of milliseconds',
         said),
      ok(!row?.dataset.note && !row?.title,
         'and the row keeps it all to itself: no sheet opens beside it'),
      ok(inside, 'and the bill of three coins stays inside its own cell, wrapped or not',
         spans.map(r => `${Math.round(r.left)}-${Math.round(r.right)}`).join(' ') + ` in ${Math.round(box?.left)}-${Math.round(box?.right)}`)
    ];
  }],

  // One mark over the station for the one question worth asking from across
  // the yard: is there anything on that board.
  ['a flag over a station says it has something for you', async () => {
    newRun();
    await settle();
    window.__crew(3, 2, 1, 1);
    window.__shack();
    window.__kit({ learned: true });
    run(20);
    window.__look(state().stands.shack.x - 400);   // it has to be on the screen
    await sleep(200);
    await hoverAway();
    await sleep(200);

    // nothing in the purse: the shack sells gear and kit and cannot sell you any
    const broke = { has: state().offers.includes('shack'), ink: flagInk('shack') };
    // Stone AND dust: every row is priced in both (`billOf` in upgrades.js),
    // so half a purse is still a yard that can afford nothing.
    window.__grant({ shards: 900, dust: 30000 });
    // The flag raises on the game's own clock (`raised` in render/aura.js),
    // and under headless rAF the sim does not advance on its own: turn the
    // clock past the whole raise, then give the page a beat to paint it.
    run(2);
    await sleep(300);
    const rich = { has: state().offers.includes('shack'), ink: flagInk('shack') };

    // and standing at it changes nothing: what the arrow says is still true
    await hoverStation('shack');
    await sleep(300);
    const there = flagInk('shack');
    await hoverAway();
    await sleep(300);

    window.__crew(0, 0);
    newRun();
    return [
      ok(broke.has === false, 'a board with nothing you can buy offers nothing'),
      // A few sky motes drift through the band, so "no flag" is a near-empty
      // band rather than a spotless one.
      ok(broke.ink < 150, 'and no flag flies over it', `${broke.ink} px`),
      ok(rich.has === true, 'money in the purse and it has something for you'),
      ok(rich.ink > broke.ink + 150, 'and a flag goes up over it',
         `${broke.ink} -> ${rich.ink} px`),
      // taking it down under the cursor reads as the mark flickering off
      ok(there > broke.ink + 150, 'and stays up while you are standing there reading it',
         `${there} px`)
    ];
  }],

  // One rule for every station (`hasOffer`); the bench's own older mark also
  // counts a heading never read, and this is the case that tells the two
  // apart: headings unread throughout, purse full and then spent.
  ['a flag is about the purse, not about what you have read', async () => {
    newRun();
    await settle();
    await hoverAway();

    // The bench is built with the first row you can afford, and has no stand
    // box before it is up, which is why the view is aimed at it after the
    // build (raise.js).
    window.__grant({ dust: 3000 });
    run(2);
    await haveBench();
    window.__look(state().stands.bench.x - 400);
    await sleep(300);
    const rich = { has: state().offers.includes('bench'), ink: flagInk('bench') };

    // Spend it back down through the rows themselves; nothing here opens a
    // board. Each purchase is finished on the spot, as `buy` does: a loop
    // that stops at "site busy" stops with coin still in the purse.
    for (let i = 0; i < 40 && state().offers.includes('bench'); i++) {
      if (!window.__rows().some(r => r.shown && window.__buy(r.key))) break;
      window.__finish();
      run(1);
    }
    run(2);
    await sleep(300);
    const broke = { has: state().offers.includes('bench'), ink: flagInk('bench') };
    const unread = state().benchMark;

    newRun();
    return [
      ok(rich.has === true, 'a purse that can buy a bench row flies the bench a flag'),
      ok(broke.has === false, 'and spending it takes the offer away'),
      ok(rich.ink > broke.ink + 150, 'and the flag comes down with it',
         `${rich.ink} -> ${broke.ink} px`),
      // The bench's own older mark still says 'flag' here, which is exactly
      // the reading the pole may not take.
      ok(unread === 'flag', 'with the headings still unread the whole way through',
         `${unread}`)
    ];
  }],

  // A bridge crosses the quarry and the crew walk every foot of it, so the
  // deck must not open the board on the way past. `stands.quarry` is the
  // shed (`standAt` in board.js), so the mouth is asked for by name.
  //
  // The ramp sample is ten pixels out, not forty: the shed stands only
  // `SHED_GAP` off the mouth, and forty pixels out is inside the shed itself.
  // `deckWalk` (report.js) is the table this number comes from.
  ['the quarry is opened by its hole, or by the shed beside it, not by the bridge', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9 });
    window.__crew(2, 2, 2, 0);
    run(20);
    const s0 = state();
    const qx = s0.quarryX, qw = s0.quarryW;
    const shed = s0.stands.quarry;
    const rampY = s0.deckWalk[2];             // groundAt(quarryX - 10)
    window.__look(qx - 400);
    await sleep(300);
    const g = state().groundY;
    const at = async (wx, wy) => {
      const [x, y] = onScreen(wx, wy);
      point('pointermove', x, y, 0);
      await sleep(300);
      return state().quarryBoardOpen;
    };
    const deck = await at(qx + qw / 2, g - 30);              // straight over the mouth
    const ramp = await at(qx - 10, rampY);                   // on the ramp, just short of the mouth
    const hole = await at(qx + qw / 2, g + 40);               // and down in the quarry itself
    const shack = await at(shed.x + shed.w / 2, shed.y + shed.h / 2);   // the shed beside it
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(deck === false, 'crossing the deck does not open it'),
      ok(ramp === false, 'nor does the ramp up to it'),
      // The shed is the station: where the board hangs, where you stand to
      // open it, and where its signs hang (`standAt`, `markAnchor`).
      ok(hole === false, 'the hole itself is a hole, not a shop counter'),
      ok(shack === true, 'the shed beside it is what opens it')
    ];
  }],

  // A click is not drifting: it is somebody deciding to do something else.
  ['a press on the yard puts an open board away', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9 });
    window.__crew(3, 2, 1, 1);
    window.__shack();
    run(20);
    await hoverStation('shack');
    const open = state().shackBoardOpen;

    // bare ground, well clear of anything that is a station
    const s = state();
    const [x, y] = onScreen(s.stands.shack.x - 260, s.groundY - 60);
    canvas().dispatchEvent(new PointerEvent('pointerdown',
      { clientX: x, clientY: y, pointerId: 1, isPrimary: true, button: 0,
        buttons: 1, bubbles: true }));
    await sleep(300);
    const shut = state().shackBoardOpen;

    // and standing at it again still opens it: this closes boards, it does not
    // put them out of reach
    await hoverStation('shack');
    const again = state().shackBoardOpen;
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(open === true, 'the board is up to begin with'),
      ok(shut === false, 'and a press on bare ground puts it away'),
      ok(again === true, 'and walking back up to it brings it back')
    ];
  }],

  // The board only rebuilds when the *set* of rows it would build has
  // changed, and the thing that works that set out has to ask the same
  // question as the thing that builds it.
  ['hiding the finished ladders takes them off the board', async () => {
    newRun();
    await settle();
    // A million, not a hundred million: `__give` banks one grain per turn of
    // its loop and the hole never refuses one, so an over-large number is
    // that many iterations (a quarter of an hour).
    window.__give(999999);
    // Every coin: the last rung of each is the spark's.
    window.__grant({ cores: 9, shards: 9000, spores: 9000, sparks: 9000 });
    window.__invest();                        // the grounds stand: rungs past the first are priced in their coins
    run(20);
    // Two ladders to their tops, each one card pressed past its length. The
    // pick waits on the swing being automatic.
    window.__buy('auto');
    for (let i = 0; i < 12; i++) {
      for (const key of ['carry', 'pick']) { window.__buy(key); window.__finish(); }
    }
    window.__build();
    window.__board('bench');
    await sleep(400);
    const rows = () => [...document.querySelectorAll('#shop button[data-key]')]
      .filter(b => b.offsetParent).map(b => b.dataset.key);
    const hide = document.getElementById('hidedone');

    const before = rows();
    hide.click();
    await sleep(400);
    const hidden = rows();
    hide.click();
    await sleep(400);
    const back = rows();

    window.__board(null);
    const went = before.filter(k => !hidden.includes(k));
    return [
      ok(before.length > 0, 'there are rows on the bench', `${before.length}`),
      ok(went.length === 2 && went.includes('carry') && went.includes('pick'),
         'and the two ladders at the top of themselves go when they are hidden',
         went.join(',') || 'none went'),
      ok(back.length === before.length, 'and come back when they are shown again',
         `${before.length} -> ${hidden.length} -> ${back.length}`)
    ];
  }],

  // The one exception to the switch above: a kit row is the only place to
  // read how many helmets are on the rock, and folding it away deletes the
  // fact at the moment it becomes final.
  ['a finished kit row stays on the board when the finished rows are hidden', async () => {
    newRun();
    await settle();
    window.__grant({ shards: 9000, dust: 60000 });
    window.__shack();
    window.__kit({ learned: true });
    window.__board('shack');
    await sleep(400);

    // Pressed until it will not be pressed again: what goes wrong is what the
    // board does on the purchase, which a hook would not exercise. The board
    // is re-opened before each press so the loop stays about the press.
    const row = () => [...document.querySelectorAll('#shackshop button[data-key]')]
      .filter(b => b.offsetParent).find(b => b.dataset.key === 'breaker');
    let presses = 0;
    for (let i = 0; i < 6; i++) {
      window.__board('shack');
      await sleep(120);
      const b = row();
      if (!b || b.disabled) break;
      b.click();
      // A hat is taught rather than handed over (works.js); this group is
      // about what the *board* does with a finished row.
      window.__finish();
      presses++;
      await sleep(120);
    }
    const bought = state().breakers;
    window.__board('shack');                  // and back up to read the finished row
    await sleep(200);

    const hide = document.getElementById('hidedone');
    hide.click();
    await sleep(400);
    const still = row();
    const says = still && still.textContent.includes('done');
    // Broke, so the top rung's bill (a done row's bill clamps there) is one
    // the purse cannot meet: a finished row is drawn full anyway. The board
    // paints on its next frame, so the yard is turned once more.
    const St = (await import('/src/state.js')).S;
    window.__pay('shard', St.shards); window.__pay('dust', St.stored);
    run(1);
    await sleep(200);
    const ink = still ? getComputedStyle(still).color : '';
    const tag = still && still.querySelector('.tag');
    const edge = tag ? getComputedStyle(tag).borderTopStyle : (still ? getComputedStyle(still).borderTopStyle : '');
    const pic = still && still.querySelector('.pic');
    const glyphInk = pic ? pic.dataset.tint.split('/')[1] : '#000';
    hide.click();
    await sleep(400);
    window.__board(null);

    return [
      ok(presses === 3 && bought === 3, 'the row is pressed until the set is full',
         `${presses} presses -> ${bought} breakers`),
      ok(!!still, 'and the finished row is still on the board with them hidden',
         still ? 'there' : 'GONE'),
      ok(says, 'saying it is done', still ? still.textContent.trim() : 'no row'),
      // A done row is not one you cannot afford: full ink, a solid edge, and
      // a glyph that does not grey when a coin on the clamped bill runs out.
      ok(ink === 'rgb(0, 0, 0)' && edge === 'solid' && glyphInk === '#000',
         'and drawn full, solid, with the glyph in black, even broke',
         `${ink} ${edge} glyph ${glyphInk}`)
    ];
  }],

  // The yard keeps two stacks (the weather's and the crew's own), and the
  // drawing has to know about both, or the crew's piles up in the count and
  // never appears anywhere.
  ['what the crew leave is drawn where they left it', async () => {
    newRun();
    await settle();
    window.__crew(3, 2);
    window.__tune('LOO_EVERY', 3000);
    window.__air({ haze: 0, muck: 0 });         // no weather: all of it is theirs
    run(90);
    await sleep(200);

    // the band of ground just above the line, across the middle of the yard
    const s = state();
    const dpr = window.devicePixelRatio || 1;
    const x0 = Math.max(0, Math.round((s.camX + 40 - s.camX) * s.zoom * dpr));
    const y0 = Math.round((s.groundY - 20 - s.camY) * s.zoom * dpr);
    const w = Math.round(Math.min(s.viewW - 80, 900) * s.zoom * dpr);
    const h = Math.round(20 * s.zoom * dpr);
    const d = canvas().getContext('2d').getImageData(x0, y0, w, h).data;
    // the muck brown: warmer than the black everything else is drawn in
    let brown = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > d[i + 2] + 12 && d[i] < 210 && d[i + 3] > 200) brown++;
    }

    window.__tune('LOO_EVERY', 600000);
    window.__crew(0, 0);
    newRun();
    return [
      ok(s.smog.poop > 0, 'the crew have left something', `${s.smog.poop} cells`),
      ok(s.smog.muck.all === s.smog.poop,
         'and with no weather in the yard, all of the mess is theirs',
         `${s.smog.muck.all} of mess, ${s.smog.poop} theirs`),
      ok(brown > 0, 'and it is drawn on the ground', `${brown} px of it`)
    ];
  }],

  // The mark for a card nobody has read is a turned-down corner made OF the
  // card. It must take nothing from the title: a mark that cost the title
  // room would re-wrap a name the moment it stopped being new.
  ['the new-card mark is a corner of the card itself', async () => {
    newRun();
    await settle();
    window.__give(400);
    run(20);
    window.__build();
    window.__board('bench');
    await sleep(500);
    const row = document.querySelector('#shop button.new');
    const what = row && row.querySelector('.what');
    const corner = row && getComputedStyle(row, '::before');
    const onTitle = what && getComputedStyle(what, '::before').content;
    const anchored = row && getComputedStyle(row).position;
    const card = row && row.getBoundingClientRect();
    const title = what && what.getBoundingClientRect();
    // The notch is drawn out of two borders, so its leg is the box they make:
    // both borders and whatever height is between them. Its face is the
    // words' ink, which is what makes it invert with the card.
    const size = corner ? parseFloat(corner.borderTopWidth) + parseFloat(corner.borderBottomWidth) +
                          (parseFloat(corner.height) || 0) : 0;
    const ink = corner ? corner.borderTopColor : '';
    const words = row ? getComputedStyle(row).color : '';
    // Set by the card's padding alone; if the mark took room in the flow this
    // would move.
    const inset = card && title ? Math.round(title.left - card.left) : -1;
    row.classList.remove('new');
    await raf();
    const settled = what ? Math.round(what.getBoundingClientRect().left - card.left) : -2;
    window.__board(null);
    return [
      ok(!!row, 'there is a card on the bench nobody has read yet',
         row ? row.dataset.key : 'none'),
      ok(size >= 8, 'the corner is turned down far enough to see', `${size}px`),
      ok(ink === words, 'in the same ink as the words, so it inverts with them',
         `${ink} against ${words}`),
      ok(anchored === 'relative', 'and it is placed against the card',
         String(anchored)),
      ok(!onTitle || onTitle === 'none', 'nothing hangs off the title any more',
         String(onTitle)),
      ok(inset === settled, 'and the title starts in the same place either way',
         `${inset}px new, ${settled}px read`)
    ];
  }],

  // "It was on the screen" is not "you read it".
  ['a card stops being new when you hover it, and only then', async () => {
    newRun();
    await settle();
    window.__give(400);
    run(20);
    window.__build();
    window.__board('bench');
    await sleep(500);
    const newOnes = () => [...document.querySelectorAll('#shop button.new')];
    const before = newOnes().length;
    const mark = newOnes()[0];
    const key = mark && mark.dataset.key;
    const others = before - 1;

    // the listener is on `pointerenter`, and the hover is what does it
    mark.dispatchEvent(new PointerEvent('pointerenter',
      { pointerId: 1, isPrimary: true, bubbles: false }));
    await raf();
    await raf();
    const hoveredGone = !mark.classList.contains('new');
    const leftAlone = newOnes().length;

    // Shut the board and open it again. What was never hovered is still new.
    window.__board(null);
    await sleep(300);
    window.__board('bench');
    await sleep(500);
    const after = newOnes().length;
    const cameBack = newOnes().some(b => b.dataset.key === key);
    window.__board(null);
    return [
      ok(before > 1, 'the bench opens with several cards nobody has read',
         `${before} new`),
      ok(hoveredGone, 'the card under the cursor stops being new', key || 'none'),
      ok(leftAlone === others, 'and none of its neighbors do',
         `${leftAlone} left, expected ${others}`),
      ok(!cameBack, 'the one that was read stays read across a close and re-open',
         cameBack ? `${key} came back` : 'stayed read'),
      ok(after === others, 'and closing the board reads nothing on its own',
         `${after} still new, expected ${others}`)
    ];
  }],

  ['no row on any board sits on top of itself', async () => {
    newRun();
    await settle();
    // enough of everything that every row on every board is showing
    window.__crew(4, 3);
    window.__grant({ cores: 6, shards: 4000, spores: 4000, sparks: 400 });
    window.__invest();
    window.__shack();
    window.__kit({ learned: true });
    window.__loo(true);
    window.__air({ open: true, purifiers: 1 });
    window.__meteor();
    window.__wizardHat(1);
    const St = (await import('/src/state.js')).S;
    St.towerOpen = true;
    St.casinoOpen = true;
    St.quarryOpen = true;
    St.farmOpen = true;
    St.seenSpark = true;
    window.__build();
    run(20);

    const boards = { bench: '#shop', lab: '#labshop', shack: '#shackshop',
                     casino: '#casinoshop', filter: '#filtershop', quarry: '#quarryshop',
                     farm: '#farmshop', tower: '#towershop', house: '#crewshop' };
    const bad = [];
    let rows = 0;
    for (const [name, sel] of Object.entries(boards)) {
      // Opened rather than unhidden: a board's rows are built empty and
      // filled when it opens, so a box revealed by hand is a column of blank
      // cells with nothing wrong with any of them.
      window.__board(name);
      await raf();
      await raf();
      if (name === 'house') { await openCrewList(); await raf(); }
      for (const row of document.querySelectorAll(`${sel} button, ${sel} div.job, #crewlistrows button`)) {
        if (row.offsetParent === null) continue;
        for (const cell of row.children) {
          const text = cell.textContent.trim();
          if (!text || cell.offsetParent === null) continue;
          rows++;
          // What overlaps is the *text*, not the boxes: the rows are a grid,
          // so the cells never overlap and the words run out across the next
          // one. `scrollWidth` does not see it either (on a grid item with
          // visible overflow it equals `clientWidth`), so the text is
          // measured where it is painted.
          const ink = textInk(cell);
          const box = cell.getBoundingClientRect();
          const over = Math.round(ink.right - box.right);
          if (over > 1) {
            bad.push(`${name}/${row.dataset.key || row.dataset.dial || text}: ` +
                     `"${text}" runs ${over}px past its column`);
          }
        }
      }
    }
    // And again with the buildings *unbought*: a row that sells a building is
    // only on the board while you have not got one, so the sweep above is the
    // one sweep guaranteed never to see them.
    St.towerOpen = false;
    St.casinoOpen = false;
    St.outhouseOpen = false;
    St.filterOpen = false;
    window.__build();
    window.__board('bench');
    await raf();
    await raf();
    for (const row of document.querySelectorAll('#shop button, #shop div.job')) {
      if (row.offsetParent === null) continue;
      for (const cell of row.children) {
        const text = cell.textContent.trim();
        if (!text || cell.offsetParent === null) continue;
        rows++;
        const ink = textInk(cell);
        const box = cell.getBoundingClientRect();
        const over = Math.round(ink.right - box.right);
        if (over > 1) {
          bad.push(`bench-unbought/${row.dataset.key || text}: ` +
                   `"${text}" runs ${over}px past its column`);
        }
      }
    }

    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(rows > 40, 'there is writing on the boards to look at', `${rows} cells`),
      ok(bad.length === 0, 'and none of it runs past its column',
         bad.slice(0, 4).join(' | ') || 'all clear')
    ];
  }],

  ['shop opens at the bench and is not buried', async () => {
    // The first time the board has been opened since the page loaded: a
    // board seated by the height it had before its rows were written hangs
    // low until closed and opened again, and nothing after this check ever
    // sees a first opening.
    newRun();
    await settle();
    await hoverBench();
    const b = board();
    const first = document.getElementById('panel').getBoundingClientRect();
    await hoverAway();
    await sleep(220);
    await hoverBench();
    const again = document.getElementById('panel').getBoundingClientRect();

    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const rows = [...shop().children];
    // Read by class, never by position: a tile stands its cells under a
    // picture and puts the clock inside the price's box, and `refresh` finds
    // them the same way.
    const text = (el, sel) => el.querySelector(sel)?.textContent.trim() || '';
    const cells = rows.filter(el => el.dataset.key)
                      .map(el => ({ name: text(el, '.what'), gain: text(el, '.gain'),
                                    price: text(el, '.cost') || text(el, '.time') }));
    return [
      ok(!b.hidden, 'board opens when the cursor nears the bench'),
      ok(r.width > 40 && r.height > 40, 'board has a size', `${r.width}x${r.height}`),
      ok(r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
         'board is inside the window', JSON.stringify(r)),
      ok(hit !== canvas(), 'board is above the canvas, not behind it',
         `topmost is ${hit && (hit.id || hit.tagName)}`),
      ok(rows.some(el => el.dataset.sect), 'board has section headings'),
      ok(cells.length > 0 && cells.every(c => c.name && c.price), 'every row has a name and a price',
         JSON.stringify(cells)),
      // A count says where it is going ("4 -> 5"), a rate what share it gains
      // ("+30%"), a gift the thing itself ("1 hit/s"), each with a verb in
      // front when the row's name is a thing rather than a stat. See
      // `gainText`.
      ok(cells.every(c => !c.gain || /^(?:[a-z ]+ )?(?:\+\d|[\d,.]+\s→\s|[\d,.]+\s[a-z\/]+$)/.test(c.gain)),
         'a count says where it is going, a rate says what it gains, a gift says what it is',
         JSON.stringify(cells.map(c => c.gain))),
      ok(Math.abs(first.top - again.top) < 2 && Math.abs(first.height - again.height) < 2,
         'and it opens in the same place the first time as the second',
         `${Math.round(first.top)}/${Math.round(first.height)} then ` +
         `${Math.round(again.top)}/${Math.round(again.height)}`)
    ];
  }],

  // A full bench is taller than the suite's window, as it is than a 1080p
  // browser's: its last row has to be reachable by scrolling the sheet, not
  // hanging off the bottom of the glass.
  ['a board taller than the window scrolls to its last row', async () => {
    newRun();
    window.__crew(3, 3, 5, 7);
    window.__grant({ sparks: 9999, shards: 9999, spores: 9999, cores: 9, dust: 90000 });
    window.__board('bench');
    await settle();
    const sheet = board().closest('.sheet');
    const r = sheet.getBoundingClientRect();
    const tall = sheet.scrollHeight > innerHeight;
    sheet.scrollTop = sheet.scrollHeight;
    await raf();
    const last = [...shop().querySelectorAll('[data-key]')].pop().getBoundingClientRect();
    const cols = [...new Set([...shop().querySelectorAll('[data-key]')]
      .map(el => Math.round(el.getBoundingClientRect().left)))].length;
    window.__board(null);
    return [
      ok(tall, 'the bench holds more than the window has room for',
         `${sheet.scrollHeight} in ${innerHeight}`),
      ok(r.top >= 0 && r.bottom <= innerHeight, 'the board stands inside the window', JSON.stringify(r)),
      ok(last.top >= r.top && last.bottom <= r.bottom, 'and its last row scrolls into view',
         `${Math.round(last.top)}..${Math.round(last.bottom)} in ${Math.round(r.top)}..${Math.round(r.bottom)}`),
      // the scrollbar comes out of the words' width unless it is given back
      ok(cols >= 3, 'and the scrollbar costs the shelf no column', `${cols} columns`)
    ];
  }],

  // Pressed the way a player presses it: the board is opened, the shut
  // control is clicked, and an option is chosen. The hooks only stand the
  // building up.
  ['a setting with named options is picked off a list', async () => {
    newRun();
    await settle();
    window.__crew(0, 1, 0, 2);
    window.__grant({ cores: 3, dust: 8000, spores: 3000, shards: 300 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    // `anotherpot` is the row watched for movement, and it is earned: five
    // batches, or it is not on the board and the measurement reads NaN -> NaN,
    // which passes as "did not move".
    window.__brews(5);
    window.__board('apothecary');
    await sleep(120);

    const row = document.querySelector('[data-dial="potkeep"]');
    const chosen = row?.querySelector('.chosen');
    const opts = row?._opts;                       // out on the body, not in the row
    const under = document.querySelector('[data-key="anotherpot"]');
    const shutFirst = !!opts?.hidden;
    // Against the row itself, not the window: the camera is still gliding to
    // the station, so the whole sheet drifts between the two readings.
    const below = () => under && row ? under.getBoundingClientRect().top - row.getBoundingClientRect().top : NaN;
    const wasAt = below();

    chosen?.click();
    await sleep(40);
    const dropped = !opts?.hidden;
    const listed = opts ? opts.querySelectorAll('.opt').length : 0;
    // The list is laid over the board, so the rows under it do not budge past
    // the place you had already aimed at.
    const stillAt = below();
    const c = chosen?.getBoundingClientRect(), o = opts?.getBoundingClientRect();
    const placed = !!c && !!o && o.top >= c.bottom - 1 && Math.abs(o.right - c.right) <= 2;

    opts?.querySelector('.opt[data-opt="off"]')?.click();
    await sleep(40);
    const said = (chosen?.textContent || '').trim();
    const shutAfter = !!opts?.hidden;

    // After a breath, so that crossing the gap between the control and the
    // list does not shut it under you.
    chosen?.click();
    opts?.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
    await sleep(120);
    const heldOn = !opts?.hidden;                // still there a moment later
    await sleep(600);
    const wanderedOff = !!opts?.hidden;

    // It hangs off the body, so the board closing does not take it with it
    // unless something says so.
    chosen?.click();
    const upAgain = !opts?.hidden;
    window.__board(null);
    await sleep(40);
    const wentWithBoard = !!opts?.hidden;

    window.__crew(0, 0);
    return [
      ok(shutFirst, 'the list starts shut, with the set option on the row itself'),
      ok(dropped && listed >= 2, 'pressing the row drops its options open',
         `${listed} options`),
      ok(placed, 'the list stands under the control that opened it, right edges level',
         c && o ? `control ${Math.round(c.right)}/${Math.round(c.bottom)}, ` +
                  `list ${Math.round(o.right)}/${Math.round(o.top)}` : 'no rects'),
      ok(Math.abs(wasAt - stillAt) < 1, 'and nothing under it moves to make room',
         `${Math.round(wasAt)} -> ${Math.round(stillAt)}`),
      // The control repeats the choice in the option's own words, not the key's.
      ok(said === 'just this one', 'pressing one of them sets it', said),
      ok(shutAfter, 'and the list shuts behind the choice'),
      ok(heldOn, 'the cursor leaving does not shut it on the spot'),
      ok(wanderedOff, 'but it puts itself away a breath later'),
      ok(upAgain && wentWithBoard, 'and it never outlives the board it belongs to',
         `${upAgain} then ${wentWithBoard}`)
    ];
  }],

  // A picker on a plank shows a sentence, not a number, so it stands two
  // slots wide and wears its drawing like any other tile.
  ['a picker tile keeps its name and its control on one line each', async () => {
    newRun();
    await settle();
    window.__crew(0, 1, 0, 2);
    window.__grant({ cores: 3, dust: 8000, spores: 3000, shards: 300 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    window.__board('apothecary');
    await sleep(120);

    const rows = ['potkeep'].map(k => document.querySelector(`.rows.shelves > [data-dial="${k}"]`));
    const fits = rows.map(r => {
      const what = r?.querySelector('.what'), chosen = r?.querySelector('.chosen');
      if (!what || !chosen) return null;
      const c = chosen.getBoundingClientRect();
      return { name: what.scrollWidth <= what.clientWidth + 1, oneLine: c.height < 24,
               control: chosen.scrollWidth <= chosen.clientWidth + 1,
               drawn: !!r.querySelector('.pic canvas'), top: Math.round(r.getBoundingClientRect().top) };
    });
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(fits.every(f => f), 'the picker stands on the apothecary board as a tile', JSON.stringify(fits)),
      ok(fits.every(f => f?.name), 'the name is not cut short', JSON.stringify(fits.map(f => f?.name))),
      ok(fits.every(f => f?.oneLine && f?.control), 'the chosen option sits on one line and is not cut short',
         JSON.stringify(fits.map(f => f && [f.oneLine, f.control]))),
      ok(fits.every(f => f?.drawn), 'each wears its drawing', JSON.stringify(fits.map(f => f?.drawn)))
    ];
  }],

  // The row that puts the building up is on the bench, because a row that
  // opens a place cannot live on the board of the place it opens; the board
  // carries the rest of the janitor's ladder.
  [`the outhouse carries the janitor's board, and walking up to it opens it`, async () => {
    newRun();
    await settle();
    window.__crew(3, 2, 1);                     // a quarrier opens the cut: the second cap is priced in ore
    window.__loo();                             // the shed up, the player's way is the node tier's job
    window.__give(20000);
    await raf();

    const stand = state().stands.outhouse;
    await hoverStation('outhouse');
    const open = state().looBoardOpen;
    const rows = [...document.querySelectorAll('#looshop [data-key]')]
      .map(r => r.dataset.key);
    const title = document.querySelector('#looboard .title')?.textContent.trim();
    await hoverAway();
    const shut = !state().looBoardOpen;
    window.__crew(0, 0);

    return [
      ok(!!stand, 'the outhouse is a stand once it is up',
         stand ? `${stand.x},${stand.w}` : 'nowhere'),
      ok(open, 'walking up to it opens its board'),
      ok(title === "the janitor's closet", 'which says whose it is', title),
      ok(rows.includes('loopost'),
         "and the janitor's second cap is sold on it", rows.join(',') || 'nothing'),
      ok(shut, 'and walking away shuts it again')
    ];
  }],

  ['the books hang on the noticeboard, and walking up opens them', async () => {
    newRun();
    await settle();
    window.__crew(3, 3);
    window.__fast(40);                       // so there is a rate to read
    await raf();

    const stand = state().stands.stats;
    await hoverStation('stats');
    const open = state().statsBoardOpen;
    const rows = [...document.getElementById('statsshop').querySelectorAll('[data-key]')]
      .map(r => r.dataset.key);
    // What the dust row says, off the sheet: a mark, a number and a clock.
    const dust = document.querySelector('#statsshop [data-key="ratedust"]');
    const said = dust ? dust.querySelector('.cost').innerHTML : '';
    // "a second" is the heading's word, said once over the rates rather than
    // as a clock on every line.
    const heading = [...document.querySelectorAll('#statsshop [data-sect]')].map(h => h.dataset.sect).join(' | ');
    // The books hang well to the LEFT of the rock, so the top-left corner
    // `hoverAway` points at is squarely inside the safe wedge on the way to
    // their sheet (input.js). The other corner is the one that means away.
    point('pointermove', canvas().clientWidth - 4, 4, 0);
    await sleep(250);
    const shut = !state().statsBoardOpen;
    window.__crew(0, 0);

    return [
      ok(!!stand, 'there is somewhere to stand to read them',
         stand ? `${stand.x},${stand.y}` : 'nowhere'),
      ok(open, 'standing there opens them'),
      ok(rows.includes('ratedust'), 'and dust is on them', rows.join(',')),
      ok(/class="dust"/.test(said) && /\d/.test(said) && !/class="clock"/.test(said), 'with its rate as a mark and a number', said),
      ok(/a second/.test(heading), 'and the heading says the rate is a second', heading),
      ok(!rows.includes('openbooks'), 'and there is no way into the books window from them', rows.join(',')),
      ok(shut, 'and walking away shuts them again')
    ];
  }],

  // Done the way a player does it (the pointer at the pot, the swatch
  // clicked), since a tonic set through a hook proves nothing about the
  // route. Two pots, so the picker can be shown to set the one you clicked
  // and leave the other where it was.
  ['standing at a pot picks what that pot brews', async () => {
    newRun();
    await settle();
    window.__crew(1, 4, 0, 2);
    window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000, sparks: 200 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    // The second pot is an earned row (five batches); without them the
    // purchase buys nothing and `__potSpot` answers for a pot the yard does
    // not have, so the hover is aimed at bare ground.
    window.__brews(5);
    window.__buy('anotherpot'); window.__finish();
    window.__pot('stew', 0);                     // the first pot is set and stays set
    window.__look(state().apothecaryX - 200);    // both pots on the glass
    await raf();

    // Asked again every time, never held: the camera moves between hovers
    // (opening a board and buying a rung is enough), and a held screen point
    // is then bare ground thousands of pixels from the pots.
    const mid = b => onScreen(b.x + b.w / 2, b.y + b.h / 2);
    const one = () => mid(window.__potSpot(0));
    const two = () => mid(window.__potSpot(1));
    const pop = () => document.querySelector('[data-potpick]');

    // Standing at the second cauldron is enough: no press.
    point('pointermove', ...two(), 0);
    await sleep(40);
    const open = !!pop() && !pop().hidden;
    const swatches = pop() ? pop().querySelectorAll('.opt .swatch').length : 0;
    const marked = pop()?.querySelector('.opt.on')?.dataset.opt;

    // What each row says a batch costs, against what the thing that charges
    // for a batch says: both read off the page, since typed numbers would
    // only prove two people copied the same constant.
    const billOfRow = row => [...row.querySelectorAll('.bill span')]
      .map(sp => `${sp.querySelector('i')?.className} ${sp.textContent.trim()}`);
    const said = k => `${k}: ${billOfRow(pop().querySelector(`.opt[data-opt="${k}"]`)).join(', ')}`;
    const charged = k => `${k}: ${window.__brewCost(k).map(([m, n]) => `${m} ${n}`).join(', ')}`;
    // Only the shown recipes have a bill to compare: a shard recipe is off
    // the list until the quarry opens.
    const priced = window.__tonics().filter(t => t.shown).map(t => t.key);
    const wrong = priced.filter(k => said(k) !== charged(k));
    const free = billOfRow(pop().querySelector('.opt[data-opt=""]')).length;

    // Crossing to the other cauldron moves the list with the cursor rather than
    // leaving it standing over the one you have left.
    point('pointermove', ...one(), 0);
    await sleep(40);
    const movedOn = pop()?.querySelector('.opt.on')?.dataset.opt;

    // ...and back, to set the one this check is about.
    point('pointermove', ...two(), 0);
    await sleep(40);
    pop()?.querySelector('.opt[data-opt="brace"]')?.click();
    await sleep(40);
    const after = state();
    const shut = !!pop() && pop().hidden;

    // After a breath, not on the instant: the gap between a control and its
    // list is a place the pointer is briefly outside both.
    point('pointermove', ...two(), 0);
    await sleep(40);
    const upAgain = !!pop() && !pop().hidden;
    point('pointermove', two()[0], two()[1] + 260, 0);   // bare ground below the yard
    await sleep(80);
    const heldOn = !!pop() && !pop().hidden;
    await sleep(700);
    const wanderedOff = !!pop() && pop().hidden;

    // A press, the only way in on a touchscreen. With no scene running: the
    // purse granted above tears the rift, and a press during a scene skips
    // the scene and does nothing else (`skipCutscene` in input.js).
    window.__nocine();
    point('pointerdown', ...two());
    point('pointerup', ...two());
    await sleep(60);
    const pressed = !!pop() && !pop().hidden;

    // A potency rung bought on one recipe is a deeper stew and nothing else,
    // so the stew's line moves next time the list opens and no other does.
    const linesNow = () => Object.fromEntries(
      [...pop().querySelectorAll('.opt')]
        .filter(o => o.dataset.opt)
        .map(o => [o.dataset.opt, o.querySelector('.note').textContent.trim()]));
    const before = linesNow();
    const allSaid = priced.every(k => (before[k] || '').length > 0);

    window.__board('apothecary');
    await sleep(140);
    const rung = document.querySelector('[data-key="potency-stew"]');
    rung?.click();
    window.__finish();                           // the yard builds what you buy
    window.__board(null);
    await sleep(40);

    point('pointermove', two()[0], two()[1] + 260, 0);   // off every pot, so that...
    await sleep(40);
    point('pointermove', ...two(), 0);                 // ...moving back reopens it
    await sleep(60);
    const deeper = linesNow();
    const moved = priced.filter(k => before[k] !== deeper[k]);

    // Only what the purse can pay for is on the list, all but the brew this
    // pot is already on, which stays so it can be turned off. Crop is the
    // base of every recipe, which makes it the coin to drain. "Shown" is
    // whether the row takes up room, not its `hidden` attribute: the rows are
    // `display: flex`, which beats the browser's own rule for the attribute.
    const shown = () => [...pop().querySelectorAll('.opt')]
      .filter(o => o.dataset.opt && o.offsetHeight > 0).map(o => o.dataset.opt);
    const shownBefore = shown();
    window.__pay('spore', state().spores);
    point('pointermove', two()[0], two()[1] + 260, 0);
    await sleep(40);
    point('pointermove', ...two(), 0);
    await sleep(60);
    const shownAfter = shown();
    const wantCrop = k => window.__brewCost(k).some(([m]) => m === 'spore');
    const setTo = state().potTonics[1];
    const expect = shownBefore.filter(k => k === setTo || !wantCrop(k));

    return [
      ok(open, 'standing at a cauldron drops its picker open, with no press'),
      ok(swatches === window.__tonics().length + 1,
         'with a swatch for each brew and one for nothing',
         `${swatches} options for ${window.__tonics().length} brews`),
      ok(marked === '', 'the pot it opened over reads as set to nothing',
         String(marked)),
      ok(wrong.length === 0, 'every brew says what the pot will actually be charged',
         wrong.map(k => `${said(k)} not ${charged(k)}`).join(' / ') ||
         priced.map(said).join(' / ')),
      ok(free === 0, 'and turning a pot off carries no price at all',
         `${free} marks`),
      ok(movedOn === 'stew', 'crossing to the other pot moves the list to it',
         String(movedOn)),
      ok(after.potTonics[1] === 'brace', 'picking a swatch sets THAT pot',
         String(after.potTonics[1])),
      ok(after.potTonics[0] === 'stew', 'and leaves the other one where it was',
         String(after.potTonics[0])),
      ok(shut, 'and the picker shuts behind the choice'),
      ok(upAgain && heldOn,
         'wandering off does not shut it on the instant', `${upAgain} then ${heldOn}`),
      ok(wanderedOff, 'but it puts itself away a breath later'),
      ok(pressed, 'and a press opens it too, for a screen with no hover'),
      ok(allSaid, 'every brew says what it does as well as what it costs',
         priced.map(k => `${k}: ${before[k]}`).join(' / ')),
      ok(!!rung, 'the stew has a potency rung to buy on the board'),
      ok(moved.join(',') === 'stew',
         'a rung on one recipe moves that row and no other',
         `${moved.join(',') || 'nothing'} moved -- ${before.stew} -> ${deeper.stew}`),
      ok(shownBefore.some(wantCrop) && shownAfter.join(',') === expect.join(','),
         'a brew the purse cannot pay for is off the list, unless the pot is on it',
         `${shownBefore.join(',')} -> ${shownAfter.join(',')}, wanted ${expect.join(',')}`)
    ];
  }],
  // Who THIS pot's doses go to first is the pot's own, not the building's:
  // two pots on two brews cannot share one answer.
  ['a pot says who it is for, and counts them', async () => {
    newRun();
    await settle();
    window.__crew(2, 3, 0, 2);
    window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000, sparks: 200 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    window.__brews(5);
    window.__buy('anotherpot'); window.__finish();
    window.__pot('stew', 0);
    window.__pot('strong', 1);
    window.__look(state().apothecaryX - 200);
    await raf();
    window.__nocine();
    const mid = b => onScreen(b.x + b.w / 2, b.y + b.h / 2);
    const one = () => mid(window.__potSpot(0));
    const two = () => mid(window.__potSpot(1));
    const pop = () => document.querySelector('[data-potpick]');
    const offered = () => [...pop().querySelectorAll('.for')]
      .filter(r => r.offsetHeight > 0).map(r => r.dataset.for);
    const countOf = job => pop().querySelector(`.for[data-for="${job}"] .count`)?.textContent;

    point('pointermove', ...one(), 0);           // the stew pot
    await sleep(40);
    const stewOffers = offered();
    const diggers = countOf('rockhands');
    const nearestFirst = pop()?.querySelector('.for.on')?.dataset.for;
    pop()?.querySelector('.for[data-for="rockhands"]')?.click();
    await sleep(40);
    const setStew = state().potPrefers?.[0];
    // the list stays up: who it is for is a tweak, not the end of the errand
    const stillUp = !!pop() && !pop().hidden;
    const markedNow = pop()?.querySelector('.for.on')?.dataset.for;

    point('pointermove', ...two(), 0);           // the strong pot
    await sleep(40);
    const strongOffers = offered();
    const strongOn = pop()?.querySelector('.for.on')?.dataset.for;
    pop()?.querySelector('.for[data-for="haulers"]')?.click();
    await sleep(40);
    const after = state();

    // Back on the stew pot, its own choice is the one marked.
    point('pointermove', ...one(), 0);
    await sleep(40);
    const stewOn = pop()?.querySelector('.for.on')?.dataset.for;
    point('pointermove', one()[0], one()[1] + 260, 0);
    await sleep(800);
    window.__crew(0, 0);
    return [
      ok(nearestFirst === '', 'a pot starts out for whoever is nearest', String(nearestFirst)),
      ok(stewOffers.includes('rockhands') && stewOffers.includes('haulers') && stewOffers.includes('farmhands'),
         'the stew pot offers every trade that stands, haulers too', stewOffers.join(',')),
      ok(!stewOffers.includes('quarriers') && !stewOffers.includes('wizards') && !stewOffers.includes('purifiers'),
         'and none whose station is not up', stewOffers.join(',')),
      ok(diggers === '0/2', 'and counts the diggers under it out of the diggers there are', String(diggers)),
      ok(setStew === 'rockhands' && stillUp && markedNow === 'rockhands',
         'clicking a job sets that pot, and the list stays up with it marked',
         `${setStew} up=${stillUp} marked=${markedNow}`),
      ok(strongOffers.includes('haulers') && strongOffers.includes('rockhands'),
         'the strong pot offers the haulers and the diggers alike', strongOffers.join(',')),
      ok(strongOn === '', "and comes up unset: the choice was the other pot's", String(strongOn)),
      ok(after.potPrefers?.[1] === 'haulers' && after.potPrefers?.[0] === 'rockhands',
         'each pot keeps its own', JSON.stringify(after.potPrefers)),
      ok(stewOn === 'rockhands', 'and the stew pot still shows its own', String(stewOn))
    ];
  }],

  // The page half of "A board has a size" in DESIGN.md. The sheet is
  // `white-space: nowrap`, and a content-sized sheet lets any word that
  // arrives on it set the width of the whole panel, which `place` re-seats
  // by, walking the board sideways out from under the cursor. Bought through
  // the row, because what starts the status is a purchase; the size is read
  // off the page, because nothing in the yard knows it.
  ['a board holds its size while a build is running', async () => {
    window.__crew(3, 2, 0, 0, 2);
    window.__grant({ shards: 60, dust: 20000, cores: 6 });
    (await import('/src/state.js')).S.seenMess = true;
    window.__board('bench');
    await settle(1);
    const sheet = document.querySelector('#panel > .sheet:not(.flyout)');
    const size = () => `${sheet.offsetWidth}x${sheet.offsetHeight}`;
    const before = size();

    // The board is asked for anew after the press: this check is about the
    // board being seated afresh over a build.
    const row = [...shop().querySelectorAll('[data-key]')]
      .find(r => r.dataset.key === 'unlockouthouse');
    row?.click();
    await settle(1);
    window.__board('bench');
    await settle(1);
    const back = [...shop().querySelectorAll('[data-key]')]
      .find(r => r.dataset.key === 'unlockouthouse');
    const status = back?.querySelector('.gain')?.textContent || '';
    // Sampled across the build: the status is rewritten every frame, so the
    // question is whether ANY write moved the board.
    const seen = new Set([size()]);
    for (let i = 0; i < 12; i++) { await settle(0.5); seen.add(size()); }
    // Every card on every board, tried with every word in the vocabulary in
    // the state a status is shown in: the gain column is `1fr` against the
    // bill's `auto`, and the margin on the tightest card is a pixel.
    const SAYS = ['queued', 'building'];
    const spills = [];
    for (const which of ['bench', 'casino', 'quarry', 'farm', 'stats',
                         'outhouse', 'house']) {
      window.__board(which);
      await settle(0.1);
      const page = document.querySelector('#panel .page:not([hidden])');
      for (const card of page?.querySelectorAll('.rows button[data-key]') || []) {
        const g = card.querySelector('.gain');
        if (!g || getComputedStyle(g).display === 'none') continue;
        const said = g.textContent;
        card.classList.add('waiting');
        // Each word in its cell, measured against the room the cell has with
        // that word in it: a card's gain is a track, a tile's is as wide as
        // its words up to the tile, so the room is read, never assumed.
        for (const t of SAYS) {
          g.textContent = t;
          if (g.scrollWidth > g.clientWidth) spills.push(`${which}:${card.dataset.key} "${t}" ${g.scrollWidth}>${g.clientWidth}`);
        }
        card.classList.remove('waiting');
        g.textContent = said;
      }
    }
    window.__board('bench');
    await settle(0.5);
    const spill = spills.length;

    // The guarantee under the wording: the real statuses are short by design,
    // so a line nobody would write is put straight into the cell to prove the
    // box does not grow for it (`pinWidth`).
    const anyGain = shop().querySelector('button[data-key] .gain');
    const said = anyGain.textContent;
    anyGain.textContent = 'busy: build the farm, build the training grounds, the next furrow';
    const shouted = size();
    anyGain.textContent = said;

    const rowsThen = shop().querySelectorAll('[data-key]').length;
    window.__finish();                 // the yard puts it up
    await settle(1);
    const rowsNow = shop().querySelectorAll('[data-key]').length;

    window.__board(null);
    window.__crew(0, 0);

    return [
      ok(!!row, 'the bench has a row that takes time to build'),
      ok(/queued|building/.test(status),
         'and pressing it puts a status where the gain was', status || 'nothing'),
      ok(seen.size === 1 && seen.has(before),
         'and the sheet is the same size on every frame the build runs',
         [...seen].join(' / ')),
      ok(spill === 0,
         'and no card on any board is given a status it cannot hold',
         spills.join(', ') || 'none spill'),
      // The WIDTH, and only the width: the gain column has a `min-content`
      // floor (style.css), so an impossible line makes that one card a line
      // taller, and a card you can still read is the right way round. The
      // board getting WIDER is what `pinWidth` exists to stop.
      ok(shouted.split('x')[0] === before.split('x')[0],
         'a line far too long for a card cannot widen the board either',
         `${before} -> ${shouted}`),
      // The row going is a change to what the board HOLDS rather than to what
      // it is saying, so the board may resize for it.
      ok(rowsNow === rowsThen - 1,
         'the row leaves when the build lands, and that is the one thing that may resize it',
         `${rowsThen} rows -> ${rowsNow}`)
    ];
  }],

  // The counts are read off the canvas, since the fill is pixels and nothing
  // in the yard knows how many are inked.
  ['a tile being built fills in, and its clock counts down', async () => {
    newRun();
    window.__crew(3, 3, 5, 7);
    window.__machineGates();
    window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 9000000 });
    window.__board('quarry');
    await settle(1);
    const tile = () => document.querySelector('#panel .rows.shelves [data-key="jaw"]');
    const inked = () => {
      const c = tile()?.querySelector('.pic canvas');
      if (!c) return -1;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      // black pixels in the drawing's own columns: the cells up. The hand
      // and its chips stand on a margin to the left of them.
      let n = 0;
      for (let y = 0; y < c.height; y++) for (let x = c.width - 28; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        if (d[i + 3] && d[i] === 0) n++;
      }
      return n;
    };
    const clock = () => tile()?.querySelector('.tag .time')?.textContent.trim() || '';
    const whole = inked();
    tile()?.click();
    await settle(2);
    const atStart = inked(), clockAt = clock();
    await settle(20);
    const later = inked(), clockLater = clock();
    // The tile being built holds the hover state, cursor or no cursor, and
    // sits back down when the site stalls. Read as the lift, which is what
    // the hover sets.
    const lift = () => (tile() ? getComputedStyle(tile()).getPropertyValue('--lift').trim() : '');
    // The plate goes up on a wall-clock transition too, and the tile says
    // queued until the spare hand has walked to the site, so twenty game
    // seconds can pass inside the transition.
    await sleep(300);
    const liftGoing = lift();
    const secs = t => t.split(':').reduce((a, b) => a * 60 + +b, 0);
    // Nobody at the site: the fill and the clock both hold.
    window.__crew(0, 0, 0, 0);
    await settle(3);
    const held = inked(), clockHeld = clock();
    const stalledSaid = tile()?.querySelector('.gain')?.textContent || '';
    await sleep(300);                  // the plate comes down on a wall-clock transition (SHELF_HOVER_MS)
    const liftStalled = lift();
    await settle(5);
    const stillHeld = inked(), clockStillHeld = clock();
    window.__finish();
    await settle(1);
    // A ladder rung is built too (at the bench), and its pips are a fact about
    // the ladder, not about the build: they stay up while it goes.
    window.__crew(3, 3, 5, 7);
    window.__board('bench');
    await settle(1);
    shop().querySelector('[data-key="carry"]')?.click();
    await settle(1);
    const pips = shop().querySelector('[data-key="carry"] .ladder')?.querySelectorAll('i').length || 0;
    const said = shop().querySelector('[data-key="carry"] .gain')?.textContent || '';
    // A second press on the same board goes in line behind it: its tag says
    // its place in the line, the queue card says the same word, and the tile
    // says what a press does.
    shop().querySelector('[data-key="auto"]')?.click();
    await settle(1);
    const nextTag = shop().querySelector('[data-key="auto"] .tag .time')?.textContent.trim() || '';
    const nextSaid = shop().querySelector('[data-key="auto"] .gain')?.textContent || '';
    const cardLine = [...document.querySelectorAll('#queue button.wait')].map(b => b.textContent.replace(/\s+/g, ' ').trim())[0] || '';
    // Its edge is dashed: a thing waiting its turn is pencilled in.
    const queuedTile = shop().querySelector('[data-key="auto"]');
    const edge = queuedTile ? getComputedStyle(queuedTile).borderTopStyle : '';
    window.__finish();
    await settle(1);
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(whole > 0 && atStart < whole, 'pressing a build row draws its glyph as a ghost', `${whole} -> ${atStart}`),
      ok(/building|queued/.test(said) && pips > 0, 'and a ladder keeps its pips while its rung is being built', `${said}: ${pips} pips`),
      ok(nextSaid === 'queued' && nextTag === 'next', 'a row in line says queued, and its tag says next', `${nextSaid} / ${nextTag}`),
      ok(/next/.test(cardLine), 'and the queue card says next on the same line', cardLine || 'no line'),
      ok(edge === 'dashed', 'and its edge is dashed', edge || 'none'),
      ok(later > atStart, 'and the glyph fills in while a hand is at the site', `${atStart} -> ${later}`),
      ok(/^\d+:\d\d$/.test(clockAt) && secs(clockLater) < secs(clockAt),
         'and the tag holds a clock to the second that falls as the work goes', `${clockAt} -> ${clockLater}`),
      ok(stalledSaid === 'queued', 'and says queued while nobody is at it', stalledSaid || 'nothing'),
      ok(liftGoing === '-2px' && liftStalled === '0px', 'the tile being built floats on its plate, and sits down when the site stalls', `${liftGoing} -> ${liftStalled}`),
      ok(stillHeld === held && clockStillHeld === clockHeld,
         'and with nobody on it the fill and the clock both hold', `${held}/${clockHeld} -> ${stillHeld}/${clockStillHeld}`),
    ];
  }],

  // Read off the canvas: ink left of the picture is the hand, and the hand's
  // lowest black row moving between frames is the swing.
  ['a hand on a tile being built swings with the body at the site', async () => {
    newRun();
    window.__crew(3, 3, 5, 7);
    window.__machineGates();
    window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 9000000 });
    window.__board('quarry');
    await settle(1);
    const tile = k => document.querySelector(`#panel .rows.shelves [data-key="${k}"]`);
    // The canvas, read: its width (a hand widens it by a margin on the left),
    // the black pixels in that margin (the hand, or nothing) and the lowest
    // row of them.
    const read = k => {
      const c = tile(k)?.querySelector('.pic canvas');
      if (!c) return { w: -1, hand: -1, foot: -1, ink: -1 };
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let hand = 0, foot = -1, ink = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        if (!(d[i + 3] && d[i] === 0)) continue;
        ink++;
        if (x < c.width - 28) { hand++; foot = y; }
      }
      return { w: c.width, hand, foot, ink };
    };
    const bare = read('jaw');
    tile('jaw')?.click();
    await settle(1);
    const pressed = read('jaw');
    // ...until a body is on the patch: the walk is a walk
    let at = 0;
    for (let i = 0; i < 40 && !(state().jigging > 0); i++) { await settle(0.5); at += 0.5; }
    await settle(0.2);
    const arrived = read('jaw');
    // the swing runs on the frame clock: watch a few frames
    const feet = new Set();
    for (let i = 0; i < 24; i++) { window.__fast(1 / 60); await raf(); feet.add(read('jaw').foot); }
    // some cells up, then nobody at the site: the hand fades out over
    // SHELF_HAND_FADE frames of the frame clock, and the cells hold
    await settle(8);
    window.__crew(0, 0, 0, 0);
    await settle(3);
    const leaving = read('jaw');
    for (let i = 0; i < SHELF_HAND_FADE + 10; i++) await raf();
    const alone = read('jaw');
    await settle(3);
    const stillAlone = read('jaw');
    window.__finish();
    await settle(1);
    // a work in line behind another is a plan, and a plan has no hand: two
    // rungs pressed at the bench, the second waiting on the first
    window.__crew(3, 3, 5, 7);
    window.__board('bench');
    await settle(1);
    tile('carry')?.click();
    await settle(1);
    tile('auto')?.click();
    await settle(2);
    const queued = read('auto');
    const queuedSaid = tile('auto')?.querySelector('.gain')?.textContent || '';
    // when a rung's work lands the row stays for its next rung, and the hand
    // fades out over the finished drawing rather than going with the ghost
    for (let i = 0; i < 40 && !(state().jigging > 0); i++) await settle(0.5);
    await settle(0.5);
    window.__finish();
    await settle(0.1);
    const landed = read('carry');
    for (let i = 0; i < SHELF_HAND_FADE + 10; i++) await raf();
    const after = read('carry');
    await settle(1);
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(bare.w === 28 && pressed.hand === 0, 'a tile for sale, and one just pressed, has no hand on it', `${bare.w}px wide; ${pressed.hand} hand pixels after the press`),
      ok(state().jigging >= 0 && arrived.hand > 0 && arrived.w > bare.w, `a hand is on the tile once a body is on the patch (${at}s)`, `${arrived.hand} pixels, ${arrived.w}px wide`),
      ok(feet.size > 1, 'and it moves with the swing', `feet at rows ${[...feet].join('/')}`),
      ok(queuedSaid === 'queued' && queued.hand === 0 && queued.w === 28, 'a row in line draws no hand', `${queuedSaid}: ${queued.hand} pixels, ${queued.w}px`),
      ok(leaving.hand > 0 && leaving.w > 28, 'when the body steps off, the hand is still fading on the tile', `${leaving.hand} pixels, ${leaving.w}px`),
      ok(alone.hand === 0 && alone.w === 28, 'and with nobody at the site there is nobody on the tile', `${alone.hand} pixels, ${alone.w}px`),
      ok(alone.ink === stillAlone.ink && alone.ink > 0, 'and the built cells hold', `${alone.ink} -> ${stillAlone.ink}`),
      ok(landed.hand > 0 && landed.w > 28, 'when the work lands the hand is still fading on the finished tile', `${landed.hand} pixels, ${landed.w}px`),
      ok(after.hand === 0 && after.w === 28, 'and is gone once it has faded', `${after.hand} pixels, ${after.w}px`),
    ];
  }],

  // The kit's ladder has no bands, and the shelf sets the pips by their
  // group element, so an ungrouped run is bare text. Measured, not read: a
  // column is taller than it is wide.
  ["a kit row's pips stand in a column like every other ladder's", async () => {
    newRun();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 9000000 });
    state().shieldsDone = ['props', 'net', 'arch'];
    window.__kit({ blasters: 1 });
    window.__board('quarry');
    await settle(1);
    const pips = document.querySelector('#panel .rows.shelves [data-key="blaster"] .ladder');
    const box = pips?.getBoundingClientRect();
    // ...and against a banded ladder on the same board: the same distance in
    // from its tile's right edge, so the two columns line up plank to plank.
    const inset = el => { const t = el.closest('.tile').getBoundingClientRect(); return Math.round(t.right - el.getBoundingClientRect().right); };
    const bandedEl = [...document.querySelectorAll('#panel .rows.shelves .tile .ladder')].find(l => l.querySelectorAll('b').length > 1);
    const mine = pips ? inset(pips) : -1, theirs = bandedEl ? inset(bandedEl) : -1;
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(!!pips && pips.querySelectorAll('i').length === 3, 'the blaster row has three pips', String(pips?.querySelectorAll('i').length)),
      ok(!!box && box.height > box.width, 'and they stand in a column', box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'none'),
      ok(!!bandedEl && mine === theirs, "the same distance in from the edge as a banded ladder's", `${mine} vs ${theirs}`),
    ];
  }],

  // A machine's ladder had no `rung` while it was endless, so it was the one
  // card on any board with nothing down its right edge. Three rungs now, and
  // a rung bought has to light a pip: the shelf reads `rung`/`rungs`, so a
  // row that lost either goes back to a bare tile and this goes red.
  ["a machine's ladder carries pips, and a rung bought lights one", async () => {
    newRun();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999999, shards: 999, spores: 999, dust: 9000000 });
    window.__machine('ram', { bought: true });
    window.__board('shack');
    await settle(1);
    const ladder = () => document.querySelector('#panel .rows.shelves [data-key="tuneram"] .ladder');
    const count = () => ({ all: ladder()?.querySelectorAll('i').length || 0,
                           on: ladder()?.querySelectorAll('i.on').length || 0 });
    const before = count();
    window.__buy('tuneram'); window.__finish();
    await settle(1);
    const after = count();
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(before.all === MACHINE_TUNE_RUNGS, 'a pip a rung of the ladder', `${before.all}`),
      ok(before.on === 0, 'none of them lit before a rung is bought', `${before.on}`),
      ok(after.on === 1, 'and one lit after', `${after.on}`),
    ];
  }],

  // The pips stand down the tile's right edge out of its flow, so a long
  // title or a wide bill can run under them. Every ladder at a different
  // band, so the bills are one to four coins wide across one plank.
  ['nothing on a shelf tile runs under its pips', async () => {
    newRun();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 9000000 });
    state().shieldsDone = ['props', 'net', 'arch'];
    window.__levels({ carryLevel: 0, speedLevel: 2, critChanceLevel: 4, critMultLevel: 6, haulCarryLevel: 2, haulPaceLevel: 4 });
    window.__board('bench');
    await settle(1);
    const bad = [];
    let seen = 0;
    for (const t of document.querySelectorAll('#panel .rows.shelves button.tile')) {
      const l = t.querySelector('.ladder');
      if (!l?.childElementCount) continue;
      seen++;
      const edge = l.getBoundingClientRect().left;
      for (const part of ['.what', '.tag']) {
        const r = t.querySelector(part)?.getBoundingClientRect();
        if (r && r.width && r.right > edge) bad.push(`${t.dataset.key} ${part} ${Math.round(r.right - edge)}px into the pips`);
      }
    }
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(seen >= 4, 'ladders at several bands on the bench', String(seen)),
      ok(bad.length === 0, 'and no title or tag reaches a pips column', bad.join('; ') || 'clear'),
    ];
  }],

  // The plank's rows are shared: every tile beside a two-line name drops its
  // tag by the same line, so the tags stay level.
  ['a long name on a shelf tile wraps, and its neighbors keep level with it', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 900, spores: 900 });
    // The farm stands and its crop has been seen: the apothecary's door is on
    // the bench, and "build the apothecary" is wider than a slot.
    window.__crew(3, 3, 5, 7);
    window.__buy('unlockfarm'); window.__finish();
    state().seenSpore = true;
    run(1);
    window.__board('bench');
    await settle(1);
    const tiles = [...document.querySelectorAll('#panel .rows.shelves button.tile:not(.goal)')];
    const lines = t => { const r = document.createRange(); r.selectNodeContents(t.querySelector('.what')); return r.getClientRects().length; };
    const long = tiles.find(t => lines(t) > 1);
    const what = long?.querySelector('.what');
    const top = e => Math.round(e.getBoundingClientRect().top);
    // ...its plankmates: the tiles that start on its line
    const mates = long ? tiles.filter(t => top(t) === top(long) && t !== long) : [];
    const tagTops = new Set([long, ...mates].filter(Boolean).map(t => top(t.querySelector('.tag'))));
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(!!long, 'a name on the bench takes two lines', long ? what.textContent : 'none'),
      ok(!!what && what.scrollWidth <= what.clientWidth + 1, 'and none of it is clipped', what ? `${what.scrollWidth} in ${what.clientWidth}` : 'none'),
      ok(mates.length > 0 && tagTops.size === 1, 'and every tag on its plank sits on one line', `${mates.length} mates, tag tops ${[...tagTops].join('/')}`),
    ];
  }],

  // The shield on offer pins itself while it is news, and the player's pin
  // wins over it (DESIGN.md, "The shields are the spine").
  ['a pinned card stands in the corner, buys, and comes down when the row goes', async () => {
    newRun();
    await settle();
    window.__crew(2, 1);
    window.__jump(4);                           // the timber is on offer from the fourth rock
    window.__give(200);
    window.__build();
    const corner = () => document.getElementById('pin');
    const card = () => corner().querySelector('button[data-key]');
    await settle(0.2);
    // The story pins itself: nothing was pinned, so the goal is in the corner,
    // dashed, because two hundred is not four hundred.
    const goalUp = !corner().hidden && card()?.dataset.key === 'props';
    const short = !!card()?.querySelector('.cost .short');

    // Pin over it from the bench: the pushpin on a card puts that card in the
    // corner and takes the goal down, and the bench's own card wears the mark.
    await hoverBench();
    const carry = shop().querySelector('button[data-key="carry"]');
    carry?.querySelector('.pinmark')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle(0.2);
    const overGoal = card()?.dataset.key === 'carry' && state().pinned === 'carry';
    const marked = carry?.classList.contains('pinned');
    // ...and the press on the pin was not a press on the card
    const notBought = state().carryLevel === 0;

    // The corner buys: the card is the row, so pressing it is the purchase.
    await hoverAway();
    window.__give(400);
    await settle(0.2);
    const solid = !card()?.querySelector('.cost .short');
    card()?.click();
    const bought = runUntil(() => state().carryLevel > 0, 30);
    // A ladder's card stays -- there is a next rung -- so it is still pinned;
    // pinning it again takes it down and the corner empties, and the goal
    // does not come back into it, because it has been looked at.
    await settle(0.2);
    const stayed = state().pinned === 'carry' && !corner().hidden;
    card()?.querySelector('.pinmark')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle(0.2);
    const down = state().pinned === null && corner().hidden;

    return [
      ok(goalUp, 'the shield on offer pins itself into the corner', card()?.dataset.key),
      ok(short, 'and reads short of what it costs'),
      ok(overGoal && marked, 'a pushpin on the bench pins that card over it', state().pinned),
      ok(notBought, 'without buying it'),
      ok(solid && bought, 'the corner card buys when it can be paid for'),
      ok(stayed, 'a ladder stays pinned for its next rung'),
      ok(down, 'and its pushpin takes it down again, leaving the corner empty')
    ];
  }],

  // The dome is the tower's goal, and it waits for the tower to be opened: the
  // bench's sign sends you to the wizards, and a dome pinned from the yard
  // would spare you that walk.
  ['the dome pins itself once the tower is opened, not before', async () => {
    newRun();
    await settle();
    window.__crew(2, 1, 0, 0, 0, 1);
    window.__jump(4);
    window.__answered('props', 'net', 'arch');
    window.__meteor();
    window.__build();
    const corner = () => document.getElementById('pin');
    const card = () => corner().querySelector('button[data-key]');
    await settle(0.2);
    // The dome is on offer, but nobody has been up to see it.
    const offered = state().offered?.dome ?? true;
    const notYet = corner().hidden && state().pinned === null;

    window.__board('tower');
    await settle(0.2);
    const goalCard = document.querySelector('#towershop button[data-key="dome"]');
    const wide = goalCard?.classList.contains('goal');
    const pinned = !corner().hidden && card()?.dataset.key === 'dome' && state().pinned === 'dome';

    // Closing the board leaves it up: going into the corner was being seen.
    window.__board(null);
    await settle(0.2);
    const stays = !corner().hidden && state().pinned === 'dome';

    return [
      ok(offered && notYet, 'the dome on offer does not pin from the yard', state().pinned),
      ok(wide, "it is the goal card on the tower's board"),
      ok(pinned, 'and opening the tower pins it into the corner', card()?.dataset.key),
      ok(stays, 'where it stays once the board is closed')
    ];
  }],
];
