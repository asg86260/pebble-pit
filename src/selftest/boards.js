// The boards: what a row is, how wide a column goes, what a price says, and
// where a board seats itself.
//
// 15 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, newRun, raf, settle, state, ok, canvas, board, shop, point, onScreen, runUntil,
  haveBench, hoverBench, hoverStation, openCrewList, hoverAway, run } from './kit.js';
import { TIER_OWN } from '../config.js';

// The ink standing in the band of sky over a station -- where nothing else
// black stands, so it counts the flag and very little else. Measured in the
// pixels the yard really paints, because a mark the yard does not actually
// draw is a mark nobody sees. Shared, so the two flag groups below are asking
// the canvas the same question.
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

export const TESTS = [
  // Kit is sold where it is worn: each hat's row is on the board of the
  // station that wears it, and the shields open them. Read off the sheets
  // themselves rather than the row list, because what is claimed is where a
  // player finds the row.
  ['each hat is sold on its own station\'s board', async () => {
    window.__crew(2, 2, 2, 2);
    window.__grant({ shards: 200, dust: 5000 });
    window.__shack();
    const St = (await import('/src/state.js')).S;
    St.quarryOpen = true;
    St.farmOpen = true;
    // before any shield has fallen, nobody sells a hat
    window.__build();
    const before = {};
    for (const [name, sel] of Object.entries({ shack: '#shackshop', quarry: '#quarryshop',
                                               farm: '#farmshop', bench: '#shop' })) {
      window.__board(name);
      await sleep(120);
      before[name] = [...document.querySelector(sel).querySelectorAll('[data-key]')]
        .filter(b => b.offsetParent).map(r => r.dataset.key);
    }
    // ...and once they have, each row is on its own board and no other
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
    const hats = ['breaker', 'carter', 'blaster', 'grower'];
    const where = k => Object.keys(after).filter(n => after[n].includes(k)).join(',');
    return [
      ok(Object.values(before).every(rows => !rows.some(k => hats.includes(k))),
         'no hat is for sale before the sky has taught the trade',
         JSON.stringify(before)),
      ok(where('breaker') === 'shack', 'the breaker is on the shack\'s board', where('breaker')),
      ok(where('blaster') === 'quarry', 'the blaster on the quarry\'s', where('blaster')),
      ok(where('grower') === 'farm', 'the grower on the farm\'s', where('grower')),
      ok(where('carter') === 'bench', 'and the carter on the bench', where('carter'))
    ];
  }],

  // A name is one line, and a name too long for it is clipped inside its
  // card rather than allowed to wrap or to widen anything. It used to wrap,
  // taking the card a line taller; the card is three lines now, the same three
  // on every card, and the name shares its line only with the pips (see the
  // card in style.css). The words a board carries are short on purpose; this
  // is the check that a long one cannot break the shape.
  ['a longer name stays on its line and inside its card', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 900, spores: 900 });
    window.__board('bench');
    await sleep(400);
    const rows = () => [...document.querySelectorAll('#shop button')].filter(b => b.offsetParent);
    const sheetW = () => Math.round(
      document.querySelector('.panel .sheet').getBoundingClientRect().width);
    const inside = el => el.getBoundingClientRect().right <= el.closest('button').getBoundingClientRect().right + 1;

    const wasWide = sheetW();
    const victim = rows().find(b => b.querySelector('.what'));
    const what = victim.querySelector('.what');
    const said = what.textContent;
    const wasTall = Math.round(victim.getBoundingClientRect().height);
    const cardRight = Math.round(victim.getBoundingClientRect().right);

    what.textContent = said + ' of the everlasting stone';
    await raf();
    await raf();
    const nowWide = sheetW();
    const nowTall = Math.round(victim.getBoundingClientRect().height);
    const cardRightNow = Math.round(victim.getBoundingClientRect().right);
    const held = inside(what);
    const oneLine = Math.round(what.getBoundingClientRect().height) <= Math.round(parseFloat(getComputedStyle(what).lineHeight) || 20) + 2;
    what.textContent = said;
    await raf();
    window.__board(null);
    return [
      ok(held, 'a longer name stays inside its card'),
      ok(oneLine, 'on one line', `${Math.round(what.getBoundingClientRect().height)}px tall`),
      ok(Math.abs(nowTall - wasTall) <= 1, 'and the card is no taller for it', `${wasTall}px -> ${nowTall}px`),
      ok(nowWide === wasWide && Math.abs(cardRightNow - cardRight) <= 1, 'nor wider, nor is the sheet',
         `sheet ${wasWide}px -> ${nowWide}px, card right ${cardRight} -> ${cardRightNow}`)
    ];
  }],

  // What a card gives you is the reason to press it, and a bill is allowed to
  // cost the card another line but never a word of that.
  //
  // It went the other way for a while and nothing said so: the gain sat in a
  // `1fr` track against the bill's `auto`, so on a card whose bill runs to six
  // coins -- a ground ladder's spark rung -- the bill took
  // the whole card and the gain cell came out exactly nought pixels wide. The
  // line was still in the markup, still in the DOM, and simply not on the
  // screen; every check about statuses passed, because a status spans the card
  // and never sits in that track. So this is the check that reads the gain
  // cards actually carry, in a yard rich enough to have the deep bills in it.
  ['no card ever eats the line that says what it gives', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 900, spores: 900, sparks: 999 });
    window.__crew(4, 3, 2, 2);
    // Every station standing, because a board nobody has built sells nothing
    // and a card that is not on a board cannot be measured.
    window.__fullSites();
    window.__invest();
    // The spark rung of the ground ladders on offer, which is where the bills
    // get wide enough to squeeze the card -- the state the defect actually needed.
    window.__levels({ cropLevel: TIER_OWN, tendLevel: TIER_OWN, seamLevel: TIER_OWN });
    run(20);
    const bad = [];
    const seen = new Set();
    for (const name of ['bench', 'house', 'quarry', 'farm', 'scrub',
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
      // Named rather than counted: the card the defect was found on is the one
      // this check exists for, so a setup that stops putting it on the board
      // should fail here rather than quietly measure ten easy cards instead.
      // Eight or more: a ladder is one card now, where it was up to three, so
      // a board carries fewer gain lines than it did and the same deep bills.
      ok(seen.has('crop') && seen.size >= 8,
         'the deep bills are on the boards to read',
         `${seen.size} lines${seen.has('crop') ? '' : ', no crop'}`),
      ok(bad.length === 0, 'and every one of them fits the cell it is in',
         bad.join(' | ') || 'all whole')
    ];
  }],

  // Down the sheet as well as across it. A board whose cards are all different
  // heights is a board you read one card at a time, because there is no rhythm
  // to run your eye down.
  //
  // A card is three lines -- the name, the gain, the pips and the bill -- and
  // only one thing may make it taller: a title longer than the card, which
  // takes a second line. No title in the game is, now that the bill has a line
  // of its own and the name has the whole of the first; for a while the two
  // shared a line and the name gave way to the bill, and this check was the
  // one that said a card could be taller for that reason and no other. It
  // still says so, because everything else that used to make cards ragged was
  // a bug: a bill that stacked to fit a column too narrow for it, a card with
  // no gain dropping the line its neighbor held, a pips corner that came and
  // went. All of those are failures here, which is what the whole-lines rule
  // says.
  ['a card is only ever taller by a whole line of title', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 900, spores: 900 });
    window.__crew(4, 3, 2, 2);
    window.__air({ janitors: 1 });
    // The shack stands, so its door is off the bench and the rock's gear is on
    // the shack's own sheet, where it is measured with the rest. The door is
    // the one card under this purse that carries a note -- a description line
    // under the row, by design (see `.rows .note` in style.css) -- and a note
    // is a second thing that makes a card taller, which the rule below does not
    // yet say anything about. The rows measured here are the ones the rule was
    // written about; a note card's rhythm is a call still to be made.
    window.__shack();
    run(20);
    const boards = ['bench', 'shack', 'house', 'quarry', 'farm', 'scrub',
                    'tower', 'casino'];
    const bad = [];
    let seen = 0;
    for (const name of boards) {
      window.__board(name);
      await sleep(320);                        // the sheet scales in; let it land
      if (name === 'house') { await openCrewList(); await sleep(200); }
      const rows = [...document.querySelectorAll(
        '.page:not([hidden]) .rows button, .page:not([hidden]) .rows .job, #crewlistrows button')]
        .filter(e => e.offsetParent && !e.closest('.step'));
      if (rows.length < 2) continue;
      seen += rows.length;
      const h = e => Math.round(e.getBoundingClientRect().height);
      // How many lines the title of a card takes. Measured off the words rather
      // than assumed from the height, so the two readings are independent and
      // the check is not comparing a number with itself.
      const lines = e => {
        const t = e.querySelector('.what');
        if (!t) return 1;
        const r = document.createRange();
        r.selectNodeContents(t);
        return Math.max(1, r.getClientRects().length);
      };
      // The cards stand two to a line of the sheet, and a line of the sheet is
      // as tall as the taller of its two -- that is what a grid does, and the
      // alternative, cards of different heights side by side with ragged
      // bottoms, is the very thing this check exists to keep off the boards.
      // So the rule is read a line of the sheet at a time: its height is the
      // step plus a line per line of the *longest* title on it, and every card
      // on it is that height.
      // A line of the sheet with a note card on it is left out: a note is a
      // description under the row, by design (see `.rows .note` in style.css),
      // and it is a second thing that makes a card taller which this rule does
      // not yet say anything about. Its neighbor is stretched to match it,
      // bill pinned to the bottom, which is the card doing what it should.
      const top = e => Math.round(e.getBoundingClientRect().top);
      const shelves = [...new Set(rows.map(top))].map(t => rows.filter(e => top(e) === t))
        .filter(shelf => !shelf.some(e => e.querySelector('.note')));
      const longest = shelf => Math.max(...shelf.map(lines));
      // A line of the sheet whose titles are all one line is the board's step.
      // Anything taller has to be taller by exactly the lines its longest title
      // gained.
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
      ok(seen > 20, 'there are cards on the boards to measure', `${seen} cards`),
      ok(bad.length === 0,
         'and every one of them is its board\'s step, plus a line per line of title',
         bad.join(' | ') || 'all level')
    ];
  }],

  // A bill of two coins is a row you cannot press for either of two reasons, and
  // "you are short of something" is not the same news as "you are short of
  // *this*". Dimmed alike, a player holding the stone but not the dust reads the
  // same row as one holding neither, and has to go and count both piles to find
  // out which half to go and fix.
  ['a bill you can half afford says which half', async () => {
    newRun();
    await settle();
    // The farm's door is the two-coin row on an early bench (a core and dust),
    // and it is offered once the props have fallen and a core has been seen.
    // Dust enough, the core not: the training grounds' shard-and-dust bill
    // used to be the row here, and the grounds is gone.
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
    // The emphasis is the other way up since the critics measured the pale
    // (docs/critics-2026-09-10.md, C1): the coin you are short of is the one
    // number you came to read, so it is the black one; what you have is grey
    // with the rest of the row -- a readable grey, never the old pale.
    const grey = c => { const m = c.match(/\d+/g); return m && +m[0] === +m[1] && +m[0] > 0 && +m[0] < 200; };
    return [
      ok(dim.length > 0 && lit.length > 0,
         'there is a row priced in something you have and something you have not',
         `${lit.length} held, ${dim.length} short`),
      ok(dim.every(c => c === 'rgb(0, 0, 0)'),
         'what you are short of is written in black, being the number you came to read',
         [...new Set(dim)].join(' ')),
      ok(lit.every(grey),
         'and what you have is greyed with the rest of the row, readably',
         [...new Set(lit)].join(' '))
    ];
  }],

  // Time is a price. A thing that takes two minutes costs you two minutes, and
  // saying so in a note meant a second sheet opening beside the row to carry one
  // number -- so it is in the bill with the coins, under a clock, and the row
  // itself says everything about itself.
  ['what a thing costs in waiting is priced with the rest of it', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 9000, spores: 9000 });
    window.__answered('props', 'net', 'arch');  // the shields that open the doors below
    // The ground first. The tower is the end of the chain now -- it is what a
    // finished yard buys -- so its row does not appear until the plots, the cut
    // and the lab are all standing.
    window.__crew(0, 0, 1, 1);
    window.__invest();
    window.__crew(0, 0);
    run(30);
    window.__build();
    window.__buy('unlocktower');
    window.__finish();  // everything past the bench is built now; this is the page's business, not the yard's
    window.__build();
    window.__board('tower');
    await sleep(500);
    const row = document.querySelector('#towershop button[data-key="wizard"]');
    // The coins are the bill and the clock is a cell of its own beside the
    // gain (see the card in style.css): the waiting is priced with the rest,
    // read across the two cells.
    const coins = row && [...row.querySelectorAll('.cost i, .time i')].map(i => i.className);
    const said = row && row.querySelector('.time').textContent.trim();
    const tall = row && Math.round(row.getBoundingClientRect().height);
    // A bill wraps inside its cell once it is longer than the card can hold --
    // the stylesheet says so, and names the wizard among the handful of rows
    // wide enough to do it. So what is pinned is not that four coins sit on one
    // line (they did, until the coins got dearer) but that the wrap is the one
    // the design promises: every coin inside the cell's right edge, nothing
    // clipped, and the card grown to hold the second line rather than the bill
    // running out of the card.
    //
    // Measured rather than asked of a class name. There used to be a `.split`
    // class, put on by counting the coins, and this checked for it -- so it was
    // really checking that somebody had counted to four, not that the words fit.
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

  // One mark, under the station, for the one question worth asking from across
  // the yard: is there anything on that board.
  //
  // It is drawn *below* the ground line, which is otherwise empty -- everything
  // over a roof is about what a place is doing, and this is about what it is
  // offering. Measured in the pixels it is really drawn in, because a mark the
  // yard does not actually paint is a mark nobody sees.
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

    // The offer sign is the flag now: a pole off the station's top with a
    // pennant on it. Ink is counted in the band of sky over the station --
    // where nothing else black stands -- rather than under it, where the old
    // diamond hung.
    // nothing in the purse: the shack sells gear and kit and cannot sell you any
    const broke = { has: state().offers.includes('shack'), ink: flagInk('shack') };
    // Stone AND dust. Every row in the game is priced in both -- see `billOf` in
    // upgrades.js -- so "money in the purse" stopped meaning one coin, and a
    // check that filled only half the purse was still a check about a yard that
    // could not afford anything.
    window.__grant({ shards: 900, dust: 30000 });
    // The flag raises on the game's own clock (see `raised` in render/aura.js),
    // and under headless rAF the sim does not advance on its own -- so turn the
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
      // and it stays up while you are standing there. Taking it down read as the
      // mark flickering off under the cursor, and what it says is still true.
      ok(there > broke.ink + 150, 'and stays up while you are standing there reading it',
         `${there} px`)
    ];
  }],

  // The flag means one thing, and the bench is not allowed a second meaning for
  // it. The bench used to answer the offer question through its own older mark,
  // which counts a heading you have never read as well -- so a bench with an
  // empty purse and an unopened board flew a flag saying there was something
  // down there to buy, and there was not. One rule for every station now
  // (`hasOffer`), and this is the case that told the two rules apart: headings
  // unread throughout, purse full and then spent.
  ['a flag is about the purse, not about what you have read', async () => {
    newRun();
    await settle();
    await hoverAway();

    // The bench is built with the first row you can afford, so a purse is what
    // starts it -- and its headings have still never been opened. It has no
    // stand box at all before it is up, which is why the view is aimed at it
    // after the build rather than before. See raise.js.
    window.__grant({ dust: 3000 });
    run(2);
    await haveBench();
    window.__look(state().stands.bench.x - 400);
    await sleep(300);
    const rich = { has: state().offers.includes('bench'), ink: flagInk('bench') };

    // Spend it back down through the rows themselves, until the boards will
    // sell nothing. The headings stay unread: nothing here opens a board.
    // Each purchase is finished on the spot, as `buy` does: a rung is five
    // worker-seconds at the bench, and a loop that stopped at "site busy"
    // stopped with coin still in the purse.
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
      // The bench's own older mark still says 'flag' here -- that is exactly the
      // reading the pole is no longer allowed to take.
      ok(unread === 'flag', 'with the headings still unread the whole way through',
         `${unread}`)
    ];
  }],

  // The quarry is the hole, and a bridge crosses it: a ramp up, a deck straight
  // over the mouth, a ramp down, and the crew walk every foot of that. Aiming at
  // the mouth meant aiming at the deck, so walking a hauler over the quarry
  // opened the quarry's board on the way past. What you point at is the ground
  // that is missing.
  //
  // The shed beside it is a second way in now (#1, "Wave 3.1") -- the hole
  // still answers exactly as it did, but the shed also does, which is what
  // makes it worth hovering: before this it was scenery that did nothing when
  // you pointed at it despite carrying the sign. `stands.quarry` is the shed
  // now (see `standAt` in board.js), so the mouth itself is asked for by name
  // -- `quarryX`/`quarryW` -- rather than through `standRect`.
  //
  // The ramp sample moved from forty pixels out to ten. The shed stands only
  // `SHED_GAP` (three cells) off the mouth, a lot narrower than the ramp's own
  // eleven-cell run, so at forty pixels out the point this check used to call
  // "the ramp" is now standing inside the shed itself -- not near it, inside
  // it, the same pixel `nearQuarryShed` in board.js has to carve its own
  // padding back from. Ten pixels out is still short of the mouth and clear of
  // the shed's own footprint. `deckWalk` (report.js) is the same table this
  // number comes from, so the two cannot drift apart.
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
      // The shack is the door, and the only one. This asked for the hole as
      // well, from when the hole was the target and the shed was being added
      // beside it; the shed is the station now -- it is where the board hangs,
      // where you stand to open it, and where its signs hang (see `standAt` in
      // board.js and `markAnchor` in render.js). A hole in the ground that also
      // opened a shop was the thing being moved away from, and a check still
      // asking for it is the old arrangement outliving the change.
      ok(hole === false, 'the hole itself is a hole, not a shop counter'),
      ok(shack === true, 'the shed beside it is what opens it')
    ];
  }],

  // A board opens by being walked up to and closes by being walked away from,
  // which is right while the cursor is drifting. A click is not drifting: it is
  // somebody deciding to do something else, and the sheet in the corner is over.
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

  // Folding the finished ladders away. The switch flipped and the label changed
  // and the board did not move: the board only rebuilds when the *set* of rows
  // it would build has changed, and the thing that works that set out was asking
  // a different question from the thing that builds it -- so it said "same rows
  // as last time" for ever.
  ['hiding the finished ladders takes them off the board', async () => {
    newRun();
    await settle();
    // The same million every other check in the suite asks for, not a hundred
    // of them. `__give` banks one grain per turn of its loop and the hole no
    // longer refuses one: since the pit gives way instead of saying no, an
    // over-large number is not a harmless "make me rich", it is that many
    // iterations. This check asked for a hundred million and took a quarter of
    // an hour, which is why the whole browser tier never finished -- see
    // TODO.md. A million is already far more than eighteen rungs cost.
    window.__give(999999);
    // Every coin: the last rung of each is the spark's.
    window.__grant({ cores: 9, shards: 9000, spores: 9000, sparks: 9000 });
    window.__invest();                        // the grounds stand: rungs past the first are priced in their coins
    run(20);
    // Two ladders to their tops, each one card pressed past its length. The pick
    // waits on the swing being automatic.
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

  // ...but a finished *kit* row stays. It is the exception to the switch above
  // and the only one, and it is here because it broke the day the kit got a
  // ceiling: these rows had never had a ladder, so `maxed` was never true of
  // them and the fold could not see them. Three rungs is quickly done, so what
  // the player saw was the row they had just bought vanishing under their hand.
  //
  // The reason it stays is the board's own: every row in this game says what
  // buying it *gives* you and never what you have, which leaves this row as the
  // only place to read how many helmets are on the rock -- and that is the whole
  // question of a kit row. Folding it away deletes the fact at the moment the
  // fact becomes final.
  ['a finished kit row stays on the board when the finished rows are hidden', async () => {
    newRun();
    await settle();
    window.__grant({ shards: 9000, dust: 60000 });
    window.__shack();
    window.__kit({ learned: true });
    window.__board('shack');
    await sleep(400);

    // Bought the way a player buys it: the row is pressed until it will not be
    // pressed again. Setting the count through a hook would prove nothing about
    // the thing that goes wrong, which is what the board does on the purchase.
    //
    // The board is re-opened before each press. It used to be put away by the
    // purchase (feedback8 item 1) and stays up now (DESIGN.md, "The queue");
    // opening it again either way is what keeps the loop about the press.
    const row = () => [...document.querySelectorAll('#shackshop button[data-key]')]
      .filter(b => b.offsetParent).find(b => b.dataset.key === 'breaker');
    let presses = 0;
    for (let i = 0; i < 6; i++) {
      window.__board('shack');
      await sleep(120);
      const b = row();
      if (!b || b.disabled) break;
      b.click();
      // A hat is taught rather than handed over -- see works.js -- and the row
      // is greyed until it has been. This group is about what the *board* does
      // with a finished row, so it takes the shortcut.
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
    hide.click();
    await sleep(400);
    window.__board(null);

    return [
      ok(presses === 3 && bought === 3, 'the row is pressed until the set is full',
         `${presses} presses -> ${bought} breakers`),
      ok(!!still, 'and the finished row is still on the board with them hidden',
         still ? 'there' : 'GONE'),
      ok(says, 'saying it is done', still ? still.textContent.trim() : 'no row')
    ];
  }],

  // What the crew leave is on the screen while it lies there.
  //
  // The yard keeps two stacks -- what the weather drops, which everybody clears,
  // and what a body leaves, which only a janitor clears -- and the drawing knew
  // about the first and no more. So the crew's own piled up in the count, held
  // open the row that sells the outhouse, and never appeared anywhere: which looks
  // exactly like somebody going round and tidying it away.
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

  // The mark for a card nobody has read is made OF the card: a turned-down
  // corner, inside its own border. It was a dot hung nine pixels off the left of
  // the title, which was right while the rows were names in one shared column
  // with no boxes round them -- the mark stood in the margin the column left.
  // A row is a card now and that margin is the card's own edge, so the dot
  // landed on the line and read as a blemish on the box. What this guards is
  // that the mark belongs to the card and takes nothing from the title: a mark
  // that cost the title room would re-wrap a name the moment it stopped being
  // new, and the card would change shape for a reason the player cannot see.
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
    // The notch is drawn out of two borders, so its size is the border width
    // rather than a width and a height -- and the face of it is the same ink as
    // the words, which is what makes it invert with the card under the cursor.
    const size = corner ? parseFloat(corner.borderTopWidth) : 0;
    const ink = corner ? corner.borderTopColor : '';
    const words = row ? getComputedStyle(row).color : '';
    // Where the title starts is set by the card's padding alone. If the mark
    // ever took room in the flow this would move, and every name on the board
    // would sit at a different place depending on whether it was new.
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

  // And it comes off the card you went and looked at, not off every card on the
  // board when the board shuts. "It was on the screen" is not "you read it": on
  // a board of a dozen, the one row you came for is the one you looked at, and
  // clearing the rest throws away the answer to "what is new here" for every
  // card you scrolled past.
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

    // Hovered for real -- the listener is on `pointerenter`, and the point of
    // the check is that the hover is what does it.
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
                     casino: '#casinoshop', scrub: '#scrubshop', quarry: '#quarryshop',
                     farm: '#farmshop', tower: '#towershop', house: '#crewshop' };
    const bad = [];
    let rows = 0;
    for (const [name, sel] of Object.entries(boards)) {
      // Opened rather than unhidden. A board's rows are built empty and filled
      // when it opens -- so a check that reveals the box by hand measures a
      // column of blank cells and finds nothing wrong with any of them, which is
      // how the first two versions of this passed while the tower's names were
      // sitting on its prices.
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
          // What overlaps is the *text*, not the boxes. These rows are a grid, so
          // the cells never overlap however long their contents are -- the words
          // run out of the cell and are painted across the next one, because the
          // sheet is nowrap. `scrollWidth` does not see it either: on a grid item
          // with visible overflow it comes back equal to `clientWidth`. So the
          // text is measured where it is actually painted, with a range round
          // the cell's contents.
          const range = document.createRange();
          range.selectNodeContents(cell);
          const ink = range.getBoundingClientRect();
          const box = cell.getBoundingClientRect();
          const over = Math.round(ink.right - box.right);
          if (over > 1) {
            bad.push(`${name}/${row.dataset.key || row.dataset.dial || text}: ` +
                     `"${text}" runs ${over}px past its column`);
          }
        }
      }
    }
    // And again with the buildings *unbought*, because a row that sells a
    // building is only on the board while you have not got one -- so the sweep
    // above, which opens everything so that every board has rows, is the one
    // sweep guaranteed never to see them. "Raise the tower" ran over its price
    // for exactly this reason.
    St.towerOpen = false;
    St.casinoOpen = false;
    St.labOpen = false;
    St.outhouseOpen = false;
    St.scrubOpen = false;
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
        const range = document.createRange();
        range.selectNodeContents(cell);
        const ink = range.getBoundingClientRect();
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
    // The first time the board has been opened since the page loaded, which is
    // the case that used to be wrong: it was seated by the height it had before
    // its rows were written, so it hung low until you closed it and opened it
    // again. Nothing after this check ever sees a board opening for the first
    // time, so if this is not where it is caught it is not caught at all.
    //
    // Its own yard, so the bench it reads is a fresh bench with the rows a
    // hundred dust puts on it, whichever neighbor ran before it in the shard.
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
    // A row's description, when it has one, is a line under the row and spans
    // the whole card (`.rows .note`, style.css) -- it is not a column, and the
    // shack's door is the one row on a fresh bench that carries one.
    // ...and the pin in the card's corner is a control, not a cell.
    const cells = rows.filter(el => !el.dataset.sect)
                      .map(el => [...el.children].filter(sp => !sp.classList.contains('note') &&
                                                               !sp.classList.contains('pinmark'))
                                                 .map(sp => sp.textContent));
    return [
      ok(!b.hidden, 'board opens when the cursor nears the bench'),
      ok(r.width > 40 && r.height > 40, 'board has a size', `${r.width}x${r.height}`),
      ok(r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
         'board is inside the window', JSON.stringify(r)),
      ok(hit !== canvas(), 'board is above the canvas, not behind it',
         `topmost is ${hit && (hit.id || hit.tagName)}`),
      ok(rows.some(el => el.dataset.sect), 'board has section headings'),
      // Three columns: name, gain, price. The pips saying how far up the ladder a
      // row is live inside the name -- under the title rather than beside it --
      // so they are not a column at all.
      // Name, gain, clock, bill: the four cells of a card.
      ok(cells.length > 0 && cells.every(c => c.length === 4), 'rows are four cells',
         JSON.stringify(cells[0])),
      // name, rung, gain, price -- so the two that must never be empty are the
      // first and the last
      ok(cells.every(c => c[0] && c[2]), 'every row has a name and a price',
         JSON.stringify(cells)),
      // What a row says in the middle is either where a count is going -- "4 -> 5"
      // -- or what share a rate gains, "+30%".
      //
      // It used to be the gain and only the gain, on the rule that no row states
      // a value the game is keeping. That is right for a rate, which is already
      // a comparison, and wrong for a count: "+1" tells you what the row does and
      // nothing about whether it is worth having, because going from one to two
      // doubles what you can carry and going from eleven to twelve does not, and
      // the row read the same either way. The number you have is the one thing
      // the board could not tell you and the yard could not either -- it is on
      // your cursor, not on a counter.
      //
      // And the verb in front, when the row's name is a thing rather than a stat
      // -- "walk +30%", "carry 1 -> 2" -- with the amount written in no-break
      // spaces so it never splits across the line. See `gainText`.
      // A row that gives a thing outright rather than a step -- hold to mine,
      // "1 hit/s" -- says the thing: one figure and its unit.
      ok(cells.every(c => !c[1] || /^(?:[a-z ]+ )?(?:\+\d|[\d,.]+ → |[\d,.]+ [a-z\/]+$)/.test(c[1])),
         'a count says where it is going, a rate says what it gains, a gift says what it is',
         JSON.stringify(cells.map(c => c[1]))),
      ok(Math.abs(first.top - again.top) < 2 && Math.abs(first.height - again.height) < 2,
         'and it opens in the same place the first time as the second',
         `${Math.round(first.top)}/${Math.round(first.height)} then ` +
         `${Math.round(again.top)}/${Math.round(again.height)}`)
    ];
  }],

  // A setting with a list of named options is picked off the list rather than
  // stepped onto with two buttons -- seven stations was six presses to reach the
  // last one, and one press past it went all the way round. Pressed the way a
  // player presses it: the board is opened, the shut control is clicked, and an
  // option is chosen. The hooks here only stand the building up, which is the
  // part this check is not about. (The seven-station dial has since moved to
  // the pot's own picker; "keep brewing" is the list that is left on the board.)
  ['a setting with named options is picked off a list', async () => {
    newRun();
    await settle();
    window.__crew(0, 1, 0, 2);
    window.__grant({ cores: 3, dust: 8000, spores: 3000, shards: 300 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    // `anotherpot` is the row this check watches for movement, and it is an
    // earned one -- five batches, or it is not on the board at all. When it was
    // missing the two measurements below were taken off nothing and the check
    // reported `NaN -> NaN`, which says the row did not move and means the row
    // was not there.
    window.__brews(5);
    window.__board('apothecary');
    await sleep(120);

    const row = document.querySelector('[data-dial="potkeep"]');
    const chosen = row?.querySelector('.chosen');
    const opts = row?._opts;                       // out on the body, not in the row
    const under = document.querySelector('[data-key="anotherpot"]');
    const shutFirst = !!opts?.hidden;
    // Measured against the row itself, not the window: the board is seated on
    // its station and the camera is still gliding to it, so the whole sheet
    // drifts a few pixels between the two readings whatever the list does.
    const below = () => under && row ? under.getBoundingClientRect().top - row.getBoundingClientRect().top : NaN;
    const wasAt = below();

    chosen?.click();
    await sleep(40);
    const dropped = !opts?.hidden;
    const listed = opts ? opts.querySelectorAll('.opt').length : 0;
    // The list is laid over the board, so the rows under it do not budge. It was
    // folded into the sheet once, and opening it shoved everything below it down
    // -- past the place you had already aimed at.
    const stillAt = below();
    const c = chosen?.getBoundingClientRect(), o = opts?.getBoundingClientRect();
    const placed = !!c && !!o && o.top >= c.bottom - 1 && Math.abs(o.right - c.right) <= 2;

    opts?.querySelector('.opt[data-opt="off"]')?.click();
    await sleep(40);
    const said = (chosen?.textContent || '').trim();
    const shutAfter = !!opts?.hidden;

    // The cursor wandering off puts it away -- after a breath, so that crossing
    // the gap between the control and the list does not shut it under you.
    chosen?.click();
    opts?.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
    await sleep(120);
    const heldOn = !opts?.hidden;                // still there a moment later
    await sleep(600);
    const wanderedOff = !!opts?.hidden;

    // And it never outlives the board it belongs to: it hangs off the body, so
    // the board closing does not take it with it unless something says so.
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

  // A picker on a plank is a tile like the rest, but what it shows is a
  // sentence -- "batch after batch" -- not a number. It stands two slots wide
  // so the name and the control each keep to one line, and it wears its
  // drawing like any other tile. It once took the card's two-column layout onto the plank: the
  // name was squeezed to "KEE..." beside a control folded onto three lines.
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

  // Track F3 (wave5). The books are the one board in the game that belongs to no
  // building: they hang over the pit mouth, where the counter card already
  // floats, because the counter says what you have and this says how fast it is
  // arriving. Walked up to with a real pointer, like every other board -- the
  // node tier can say what the rows compute, and only this tier can say that
  // standing there opens them.
  // The outhouse, walked up to. Its board arrives with the building, like every
  // station's -- the row that puts the building up is on the bench, because a
  // row that opens a place cannot live on the board of the place it opens --
  // and what the board carries is the rest of the janitor's ladder.
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
    // as a clock on every line (the books are a ledger; DESIGN.md, "The
    // shelf", the books).
    const heading = [...document.querySelectorAll('#statsshop [data-sect]')].map(h => h.dataset.sect).join(' | ');
    // Away has to mean away, and which way is away has changed. These used to
    // stand at the pit mouth, off on their own, so the top-left corner of the
    // screen was away from everything -- which is what `hoverAway` points at.
    // They hang on the noticeboard now, well to the LEFT of the rock the view
    // opens on, so their sheet opens on that side and the top-left corner is
    // squarely on the way to it. The safe wedge holds the board up, quite
    // rightly (see the note by the cascade in input.js).
    //
    // So this walks away to the other corner, which is the one that means it.
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
      ok(shut, 'and walking away shuts them again')
    ];
  }],

  // A cauldron is a control: clicking one drops open the picker for what THAT
  // pot brews (item 17). Done the way a player does it -- the pointer goes to
  // the pot, the swatch is clicked -- because the whole point of the feature is
  // that you do not have to go and find a board, and a check that set the tonic
  // through a hook would prove nothing about the route.
  //
  // Two pots, so the check can say the thing that matters: the picker sets the
  // pot you clicked and leaves the other one exactly where it was.
  ['standing at a pot picks what that pot brews', async () => {
    newRun();
    await settle();
    window.__crew(1, 4, 0, 2);
    window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
    window.__buy('unlockfarm'); window.__finish();
    window.__buy('unlockapothecary'); window.__finish();
    // The second pot is an earned row: it does not appear until the craft has
    // five batches behind it. Without this the purchase below quietly bought
    // nothing, the yard kept one cauldron, and the check failed further down
    // with a menu that would not open -- because `__potSpot` answers for a pot
    // the yard does not have, so the hover was aimed at bare ground.
    window.__brews(5);
    window.__buy('anotherpot'); window.__finish();
    window.__pot('stew', 0);                     // the first pot is set and stays set
    window.__look(state().apothecaryX - 200);    // both pots on the glass
    await raf();

    // Asked again every time, never held. `onScreen` is a world point through
    // the camera, and the camera moves -- opening a board and buying a rung
    // between two hovers was enough to slide it, and the second half of this
    // check was then pointing at bare ground several thousand pixels from the
    // pots while reading a picker that had simply never reopened. The yard says
    // where its pots are; a check that copies the answer down is holding a copy
    // of the layout, which is the thing kit.js exists to stop.
    const mid = b => onScreen(b.x + b.w / 2, b.y + b.h / 2);
    const one = () => mid(window.__potSpot(0));
    const two = () => mid(window.__potSpot(1));
    const pop = () => document.querySelector('[data-potpick]');

    // Standing at the second cauldron is enough: no press, the way a station's
    // board opens when you walk up to it.
    point('pointermove', ...two(), 0);
    await sleep(40);
    const open = !!pop() && !pop().hidden;
    const swatches = pop() ? pop().querySelectorAll('.opt .swatch').length : 0;
    const marked = pop()?.querySelector('.opt.on')?.dataset.opt;

    // What each row says a batch costs, against what the thing that charges for
    // a batch says it costs. Both read off the page: a check with the numbers
    // typed into it would only be proving that two people copied the same
    // constant out of config.
    const billOfRow = row => [...row.querySelectorAll('.bill span')]
      .map(sp => `${sp.querySelector('i')?.className} ${sp.textContent.trim()}`);
    const said = k => `${k}: ${billOfRow(pop().querySelector(`.opt[data-opt="${k}"]`)).join(', ')}`;
    const charged = k => `${k}: ${window.__brewCost(k).map(([m, n]) => `${m} ${n}`).join(', ')}`;
    // The recipes the yard says it has, rather than three keys typed in here.
    // Only the shown ones have a bill to compare: a shard recipe is off the
    // list until the quarry opens, and asking a hidden row what it costs is
    // asking about a row that is not on the picker.
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

    // Wandering off puts it away -- after a breath, not on the instant, because
    // the gap between a control and its list is a place the pointer is briefly
    // outside both. Same grace the boards' own dials run on.
    point('pointermove', ...two(), 0);
    await sleep(40);
    const upAgain = !!pop() && !pop().hidden;
    point('pointermove', two()[0], two()[1] + 260, 0);   // bare ground below the yard
    await sleep(80);
    const heldOn = !!pop() && !pop().hidden;
    await sleep(700);
    const wanderedOff = !!pop() && pop().hidden;

    // And a press still opens it, which is the only way in on a touchscreen.
    //
    // With no scene running. The purse this check grants in setup is more than
    // the hole holds, so it tears the rift and the tear plays -- and a press
    // during a scene skips the scene and does nothing else, which is the rule
    // (see the note over `skipCutscene` in input.js). Left standing, this check
    // pressed the skip and reported that a press does not open the picker.
    window.__nocine();
    point('pointerdown', ...two());
    point('pointerup', ...two());
    await sleep(60);
    const pressed = !!pop() && !pop().hidden;

    // What each brew does, said on the row -- and it has to follow the ladder.
    // A potency rung bought on one recipe is a deeper stew and nothing else, so
    // the stew's line has to move next time the list opens and the other two
    // have to sit exactly where they were. Bought the way a player buys it: the
    // board is opened and the row is pressed.
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

    // Only what the purse can pay for is on the list. The dust is paid away
    // through the same `take` every bill goes through, so the rows priced in it
    // go -- all but the one this pot is already on, which stays so it can be
    // seen and turned off. Read off the page against the bills the yard says it
    // charges, so the check does not know which recipes want dust. (Dust rather
    // than shard: the quarry is shut in this yard, so shard rows were never on
    // the list to begin with.) "Shown" is whether the row takes up room, not
    // whether its `hidden` attribute is set: the rows are `display: flex`, which
    // beat the browser's own rule for the attribute, and every brew stayed on
    // the list with `hidden` faithfully set on three of them.
    const shown = () => [...pop().querySelectorAll('.opt')]
      .filter(o => o.dataset.opt && o.offsetHeight > 0).map(o => o.dataset.opt);
    const shownBefore = shown();
    window.__pay('dust', state().stored);
    point('pointermove', two()[0], two()[1] + 260, 0);
    await sleep(40);
    point('pointermove', ...two(), 0);
    await sleep(60);
    const shownAfter = shown();
    const wantDust = k => window.__brewCost(k).some(([m]) => m === 'dust');
    const setTo = state().potTonics[1];
    const expect = shownBefore.filter(k => k === setTo || !wantDust(k));

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
      ok(shownBefore.some(wantDust) && shownAfter.join(',') === expect.join(','),
         'a brew the purse cannot pay for is off the list, unless the pot is on it',
         `${shownBefore.join(',')} -> ${shownAfter.join(',')}, wanted ${expect.join(',')}`)
    ];
  }],
  // Under the brews, the picker says who THIS pot's doses go to first, with
  // how many of that job are under the brew out of how many there are. Only
  // the jobs the set brew can reach are offered, and a click sets that pot and
  // no other -- it was one dial on the board for the whole building, which
  // with two pots on two brews could not hold two answers. Done the player's
  // way: the pointer at the cauldron, the row clicked.
  ['a pot says who it is for, and counts them', async () => {
    newRun();
    await settle();
    window.__crew(2, 3, 0, 2);
    window.__grant({ cores: 8, dust: 60000, spores: 9000, shards: 3000 });
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
    const shut = !!pop() && pop().hidden;

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
      ok(stewOffers.includes('rockhands') && !stewOffers.includes('haulers'),
         'the stew pot offers the diggers and not the haulers, who cannot drink it', stewOffers.join(',')),
      ok(diggers === '0/2', 'and counts the diggers under it out of the diggers there are', String(diggers)),
      ok(setStew === 'rockhands' && shut, 'clicking a job sets that pot and shuts the list',
         `${setStew} shut=${shut}`),
      ok(strongOffers.includes('haulers') && !strongOffers.includes('rockhands'),
         'the strong pot offers the haulers and not the diggers', strongOffers.join(',')),
      ok(strongOn === '', "and comes up unset: the choice was the other pot's", String(strongOn)),
      ok(after.potPrefers?.[1] === 'haulers' && after.potPrefers?.[0] === 'rockhands',
         'each pot keeps its own', JSON.stringify(after.potPrefers)),
      ok(stewOn === 'rockhands', 'and the stew pot still shows its own', String(stewOn))
    ];
  }],

  // A board does not change size while it is saying something.
  //
  // This is the page half of "A board has a size" in DESIGN.md. The sheet is
  // `white-space: nowrap` and used to be content-sized, so any word that arrived
  // anywhere on it set the width of the whole panel -- and `place` re-seats the
  // panel by that width, so a card telling you the site was busy walked the
  // board sideways and took every row out from under the cursor. Measured on the
  // bench at the time: a status naming two works took the sheet from 525 pixels
  // to 731, and three took it to 1167, and it all snapped back when the build
  // landed.
  //
  // Bought the player's way, through the row, because what starts the status is
  // a purchase and a `__` hook that set a work would prove nothing about the
  // press. The size is read off the page rather than off the game, because it is
  // a fact about layout and there is nothing in the yard that knows it.
  ['a board holds its size while a build is running', async () => {
    window.__crew(3, 2, 0, 0, 2);
    window.__grant({ shards: 60, dust: 20000, cores: 6 });
    (await import('/src/state.js')).S.seenMess = true;
    window.__board('bench');
    await settle(1);
    const sheet = document.querySelector('#panel > .sheet:not(.flyout)');
    const size = () => `${sheet.offsetWidth}x${sheet.offsetHeight}`;
    const before = size();

    // A row that has to be built, pressed the way a finger presses it. The
    // board is opened again after the press (it stays up now, but this check
    // is about the board being seated afresh over a build, so it is asked for
    // anew rather than relied on).
    const row = [...shop().querySelectorAll('[data-key]')]
      .find(r => r.dataset.key === 'unlockouthouse');
    row?.click();
    await settle(1);
    window.__board('bench');
    await settle(1);
    const back = [...shop().querySelectorAll('[data-key]')]
      .find(r => r.dataset.key === 'unlockouthouse');
    const status = back?.querySelector('.gain')?.textContent || '';
    // Sampled across the build rather than looked at once: the status is
    // rewritten every frame -- the clock in the bill is counting down -- so the
    // question is whether ANY of those writes moved the board, not whether the
    // first and the last happen to agree.
    const seen = new Set([size()]);
    for (let i = 0; i < 12; i++) { await settle(0.5); seen.add(size()); }
    // ...and no card on ANY board can be given a status it cannot hold.
    //
    // Not the bench alone, and not the statuses that happen to be up: every card
    // in the game, tried with every word in the vocabulary, in the state a
    // status is actually shown in. The gain column is `1fr` against the bill's
    // `auto`, so a card with a wide bill leaves it very little -- five cards
    // measured narrower than "nobody on it" before the status was given the
    // whole of the card's second line, and the margin on the tightest of them is
    // one pixel now. A number that close is not a thing to leave to a comment.
    // ...and the words a ladder says while its next rung is priced in a coin
    // the yard has no source for yet (see coinNeeds in upgrades/price.js).
    const SAYS = ['queued', 'building', 'nobody on it',
                  'needs crops', 'needs a quarry', 'needs a core', 'needs a spark'];
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
        let need = 0;
        for (const t of SAYS) { g.textContent = t; need = Math.max(need, g.scrollWidth); }
        g.textContent = 'busy';
        const room = g.clientWidth;
        card.classList.remove('waiting');
        g.textContent = said;
        if (need > room) spills.push(`${which}:${card.dataset.key} ${need}>${room}`);
      }
    }
    window.__board('bench');
    await settle(0.5);
    const spill = spills.length;

    // ...and the guarantee under the wording. `busy (3)` is short by design, so
    // the check above would pass on the wording alone even with the sheet still
    // sizing itself to its content. This is the other half: a line nobody would
    // write, put straight into the cell, to prove that the box does not grow for
    // it. Without `pinWidth` this takes the bench from 525 pixels to over 1100.
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
      ok(/queued|building|nobody on it/.test(status),
         'and pressing it puts a status where the gain was', status || 'nothing'),
      ok(seen.size === 1 && seen.has(before),
         'and the sheet is the same size on every frame the build runs',
         [...seen].join(' / ')),
      ok(spill === 0,
         'and no card on any board is given a status it cannot hold',
         spills.join(', ') || 'none spill'),
      // The WIDTH, and only the width. What a card gives you is never truncated
      // now -- its column has a `min-content` floor under it (style.css) -- so
      // an impossible line takes the room it needs and the bill beside it wraps
      // to another line, which makes that one card a line taller. That is the
      // right way round: a card growing a line is a card you can still read,
      // where the same room taken out of the gain is words nobody ever sees.
      // The board getting WIDER is the thing `pinWidth` exists to stop, and it
      // still does: without it this line takes the bench from 525 to over 1100.
      ok(shouted.split('x')[0] === before.split('x')[0],
         'a line far too long for a card cannot widen the board either',
         `${before} -> ${shouted}`),
      // And then the row goes, which is a change to what the board HOLDS rather
      // than to what it is saying -- so the board is allowed to resize for it,
      // and that is the whole distinction this design rests on.
      ok(rowsNow === rowsThen - 1,
         'the row leaves when the build lands, and that is the one thing that may resize it',
         `${rowsThen} rows -> ${rowsNow}`)
    ];
  }],

  // A tile being built shows the building (DESIGN.md): the glyph is drawn to
  // the share done and fills in while a hand is at the site, the tag holds a
  // clock to the second that falls while the site is going, a tile in line
  // is all ghost with its place in the tag. Bought the player's way, through
  // the row; the counts are read off the canvas, since the fill is pixels and
  // nothing in the yard knows how many are inked.
  ['a tile being built fills in, and its clock counts down', async () => {
    newRun();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 9000000 });
    window.__board('quarry');
    await settle(1);
    const tile = () => document.querySelector('#panel .rows.shelves [data-key="jaw"]');
    const inked = () => {
      const c = tile()?.querySelector('.pic canvas');
      if (!c) return -1;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] === 0) n++;   // black pixels: the cells up
      return n;
    };
    const clock = () => tile()?.querySelector('.tag .time')?.textContent.trim() || '';
    const whole = inked();
    tile()?.click();
    await settle(2);
    const atStart = inked(), clockAt = clock();
    await settle(20);
    const later = inked(), clockLater = clock();
    const secs = t => t.split(':').reduce((a, b) => a * 60 + +b, 0);
    // Nobody at the site: the fill and the clock both hold.
    window.__crew(0, 0, 0, 0);
    await settle(3);
    const held = inked(), clockHeld = clock();
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
    const pips = shop().querySelector('[data-key="carry"] .ladder')?.textContent || '';
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
    shop().querySelector('[data-key="auto"]')?.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    await raf();
    const tip = document.getElementById('tip')?.textContent || '';
    shop().querySelector('[data-key="auto"]')?.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
    window.__finish();
    await settle(1);
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(whole > 0 && atStart < whole, 'pressing a build row draws its glyph as a ghost', `${whole} -> ${atStart}`),
      ok(/building|queued/.test(said) && pips.length > 0, 'and a ladder keeps its pips while its rung is being built', `${said}: ${pips || 'none'}`),
      ok(nextSaid === 'queued' && nextTag === 'next', 'a row in line says queued, and its tag says next', `${nextSaid} / ${nextTag}`),
      ok(/next/.test(cardLine), 'and the queue card says next on the same line', cardLine || 'no line'),
      ok(/hand it back/.test(tip), 'and hovering it says a press hands it back', tip || 'no tip'),
      ok(edge === 'dashed', 'and its edge is dashed', edge || 'none'),
      ok(later > atStart, 'and the glyph fills in while a hand is at the site', `${atStart} -> ${later}`),
      ok(/^\d+:\d\d$/.test(clockAt) && secs(clockLater) < secs(clockAt),
         'and the tag holds a clock to the second that falls as the work goes', `${clockAt} -> ${clockLater}`),
      ok(stillHeld === held && clockStillHeld === clockHeld,
         'and with nobody on it the fill and the clock both hold', `${held}/${clockHeld} -> ${stillHeld}/${clockStillHeld}`),
    ];
  }],

  // The kit's ladder has no bands, and its pips went flat on the shelf while
  // every banded ladder's stood in a column: the shelf sets the pips by their
  // group element, and an ungrouped run was bare text. Measured, not read:
  // a column is taller than it is wide.
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
      ok(!!pips && pips.textContent.length === 3, 'the blaster row has three pips', pips?.textContent || 'none'),
      ok(!!box && box.height > box.width, 'and they stand in a column', box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'none'),
      ok(!!bandedEl && mine === theirs, "the same distance in from the edge as a banded ladder's", `${mine} vs ${theirs}`),
    ];
  }],

  // The pips stand down the tile's right edge out of its flow, so a long
  // title or a two-coin bill and its clock on one line ran under them. The
  // tile keeps its sides clear of the column, and a bill of two coins wraps.
  // Every ladder at a different band, so the bills are one, two, three and
  // four coins wide across one plank. Measured: nothing in the tile's flow
  // reaches a pip's left edge.
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

  // The pin: one card in the top-right corner, chosen by its pushpin, drawn
  // by the same builder as the board's, buying when pressed and coming down
  // when the row retires. The shield on offer pins itself while it is news,
  // and the player's pin wins over it. DESIGN.md, "The shields are the spine".
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
];
