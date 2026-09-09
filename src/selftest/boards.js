// The boards: what a row is, how wide a column goes, what a price says, and
// where a board seats itself.
//
// 14 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, newRun, raf, settle, state, ok, canvas, board, shop, point, onScreen,
  haveBench, hoverBench, hoverStation, openCrewList, hoverAway, run } from './kit.js';

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
  ['the school is a place you walk to', async () => {
    window.__crew(2, 2, 2, 2);
    // Dust as well as stone: every row in the game is priced in both now -- see
    // `billOf` in upgrades.js -- and the training grounds was the one row that
    // used to ask for stone alone.
    window.__grant({ shards: 30, dust: 5000 });
    const shut = state();
    const row = [...shop().querySelectorAll('[data-key]')]
      .find(r => r.dataset.key === 'unlockschool');
    row?.click();
    window.__finish();      // the school is a building, and the yard puts it up
    const open = state();
    const rows = [...document.getElementById('schoolshop').querySelectorAll('[data-key]')]
      .map(r => r.dataset.key);

    // standing at it opens its board, the same as the bench and the lab
    await hoverStation('school');
    const standing = state().schoolBoardOpen;
    await hoverAway();
    window.__look(state().openCamX);             // and leave the view where it was
    window.__crew(0, 0);
    return [
      ok(!shut.schoolOpen && !!row, 'the bench sells it, and it is not there to start with'),
      ok(open.schoolOpen && open.shards === shut.shards - 4,
         'shards build it', `${shut.shards} -> ${open.shards}`),
      // Against the two things it is actually between, not against the pixels
      // they happened to sit at: the town is laid out as offsets back from the
      // rock, so widening the ground on the left moves every one of these at
      // once and a check written in world coordinates fails for no reason.
      ok(open.schoolX > open.quarryX + open.quarryW &&
         open.schoolX + 120 < (open.houses.left ?? open.benchX),
         'it stands clear of the quarry spoil and of where the crew live',
         `${open.quarryX + open.quarryW} < ${open.schoolX}..${open.schoolX + 120} < ${open.houses.left ?? open.benchX}`),
      ok(rows.join(',') === 'breaker,carter,blaster,grower',
         'and it sells the four trades', rows.join(',')),
      ok(standing, 'walking up to it opens its board')
    ];
  }],

  // The trades are bought at a building of their own, not on the bench. The
  // bench is the shop; this is a decision about people, and they read
  // differently for standing in different places.
  // Nothing on any board sits on top of anything else.
  //
  // Every board is a grid of three columns, and every time a name gets longer or
  // a price grows a second currency the risk is the same: the text runs past its
  // column and the next one starts underneath it. It has happened on the tower
  // twice and on the scrubbing house once, and each time it was found by looking
  // at a screenshot. This asks the page instead, on every board at once, so the
  // next one is found by the suite.
  // The check above says today's names fit. This one says the board would still
  // fit a name nobody has written yet, which is the thing that kept breaking:
  // for a long time every board carried a hand-cut column width, and a name
  // longer than somebody's guess ran over the price.
  //
  // The answer used to be that the column measured itself and grew. It does not
  // grow any more -- the sheet has a ceiling over it now, because with the bill
  // up on the title's line an unbounded sheet answered a long name by getting
  // wider and ran off the side of the window. So the title WRAPS instead, and
  // what has to be true is the same thing it always was, said about a card: the
  // words never leave their cell, and they never move the bill.
  ['a longer name wraps instead of running out of its card', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 900, spores: 900 });
    window.__board('bench');
    // The sheet scales in, and a width read through that transform is a width
    // read mid-animation: it has to have arrived before any of this means
    // anything.
    await sleep(400);
    const rows = () => [...document.querySelectorAll('#shop button')].filter(b => b.offsetParent);
    const sheetW = () => Math.round(
      document.querySelector('.panel .sheet').getBoundingClientRect().width);
    // How far the ink in a cell reaches past the cell that is meant to hold it.
    // A Range, because a grid cell's own rect is the track and says nothing
    // about where the words inside it actually end.
    const over = el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return Math.round(range.getBoundingClientRect().right - el.getBoundingClientRect().right);
    };

    const wasWide = sheetW();
    const victim = rows().find(b => b.querySelector('.what'));
    const what = victim.querySelector('.what');
    const said = what.textContent;
    const wasTall = Math.round(victim.getBoundingClientRect().height);
    const billAt = Math.round(victim.querySelector('.cost').getBoundingClientRect().right);

    what.textContent = said + ' of the everlasting stone';
    await raf();
    await raf();
    const nowWide = sheetW();
    const nowTall = Math.round(victim.getBoundingClientRect().height);
    const billNow = Math.round(victim.querySelector('.cost').getBoundingClientRect().right);
    const spilled = rows().filter(b => over(b.querySelector('.what')) > 1).length;

    what.textContent = said;
    await raf();
    const backWide = sheetW();
    const backTall = Math.round(victim.getBoundingClientRect().height);
    window.__board(null);
    return [
      ok(spilled === 0, 'none of the names run out of their card', `${spilled} spilled`),
      ok(nowTall > wasTall, 'a longer name takes another line of the card',
         `${wasTall}px -> ${nowTall}px`),
      ok(nowWide === wasWide, 'and does not widen the sheet to do it',
         `${wasWide}px -> ${nowWide}px`),
      ok(Math.abs(billNow - billAt) <= 1, 'and the bill does not move for it',
         `${billAt}px -> ${billNow}px`),
      ok(Math.abs(backTall - wasTall) <= 1 && backWide === wasWide,
         'and taking the words back takes the line back',
         `${nowTall}px -> ${backTall}px, from ${wasTall}px`)
    ];
  }],

  // Down the sheet as well as across it. A board whose cards are all different
  // heights is a board you read one card at a time, because there is no rhythm
  // to run your eye down.
  //
  // One card in two is now allowed to be taller, and only one thing may make it
  // so: a title that took a second line. That is the bargain of putting the bill
  // up on the title's line -- the price holds its corner and the name is what
  // gives way -- and it is worth being exact about, because everything else that
  // used to make cards ragged was a bug. A bill that stacked to fit a column too
  // narrow for it, a card with no gain dropping the line its neighbor held: both
  // of those are still failures here, which is what the whole-lines rule says.
  ['a card is only ever taller by a whole line of title', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 900, spores: 900 });
    window.__crew(4, 3, 2, 2);
    window.__air({ janitors: 1 });
    run(20);
    const boards = ['bench', 'house', 'quarry', 'farm', 'school', 'scrub',
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
      // A card whose title is one line is the board's step. Anything taller has
      // to be taller by exactly the lines its title gained.
      const one = rows.filter(e => lines(e) === 1).map(h);
      if (!one.length) continue;
      const step = Math.min(...one);
      const ragged = one.filter(x => x !== step).length;
      if (ragged) bad.push(`${name}: ${ragged} one-line cards off ${step}px`);
      const line = Math.round((Math.max(...rows.map(h)) - step) /
                              Math.max(1, Math.max(...rows.map(lines)) - 1));
      for (const e of rows) {
        const want = step + (lines(e) - 1) * (line || 0);
        if (Math.abs(h(e) - want) > 1) {
          bad.push(`${name}: ${h(e)}px on ${lines(e)} title lines, wanted ${want}px`);
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
    window.__give(3000);                       // dust enough, stone not
    window.__grant({ cores: 1, shards: 2, spores: 0 });
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
    return [
      ok(dim.length > 0 && lit.length > 0,
         'there is a row priced in something you have and something you have not',
         `${lit.length} held, ${dim.length} short`),
      ok(lit.every(c => c === 'rgb(0, 0, 0)'),
         'what you have is written as plainly as on any other row',
         [...new Set(lit)].join(' ')),
      ok(dim.every(c => c !== 'rgb(0, 0, 0)'),
         'and only what you are short of is greyed', [...new Set(dim)].join(' '))
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
    // The ground first. The tower is the end of the chain now -- it is what a
    // finished yard buys -- so its row does not appear until the plots, the cut
    // and the lab are all standing.
    window.__crew(0, 0, 1, 1);
    window.__buildbench(true);
    window.__crew(0, 0);
    run(30);
    window.__build();
    window.__buy('unlocktower');
    window.__finish();  // everything past the bench is built now; this is the page's business, not the yard's
    window.__build();
    window.__board('tower');
    await sleep(500);
    const row = document.querySelector('#towershop button[data-key="wizard"]');
    const coins = row && [...row.querySelectorAll('.cost i')].map(i => i.className);
    const said = row && row.querySelector('.cost').textContent.trim();
    const tall = row && Math.round(row.getBoundingClientRect().height);
    // A bill wraps inside its cell once it is longer than the card can hold, and
    // a wrapped bill makes its card taller than the others. Four fits, so this
    // one must not be wrapping.
    //
    // Measured rather than asked of a class name. There used to be a `.split`
    // class, put on by counting the coins, and this checked for it -- so it was
    // really checking that somebody had counted to four, not that the words fit.
    // The bill wraps on its own now, which means the honest question is whether
    // the cell is taller than one of the coins in it.
    const cell = row && row.querySelector('.cost');
    const coin = cell && cell.querySelector('span');
    const stacked = !!cell && !!coin &&
      cell.getBoundingClientRect().height > coin.getBoundingClientRect().height * 1.5;
    window.__board(null);
    return [
      ok(!!row && row.querySelector('.what').textContent.trim() === 'train a wizard',
         'the tower trains a wizard', row && row.querySelector('.what').textContent),
      ok(coins && coins.join() === 'dust,shard,spore,clock',
         'and the waiting is the fourth thing it costs', String(coins)),
      ok(/[0-9]+ ?(min|s)$/i.test((said || '').trim()), 'said as a length of time, not a count of milliseconds',
         said),
      ok(!row?.dataset.note && !row?.title,
         'and the row keeps it all to itself: no sheet opens beside it'),
      ok(stacked === false, 'and the bill of four still fits on one line',
         stacked ? 'it stacked' : 'one line')
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
    window.__school(true);
    run(20);
    window.__look(state().stands.school.x - 400);   // it has to be on the screen
    await sleep(200);
    await hoverAway();
    await sleep(200);

    // The offer sign is the flag now: a pole off the station's top with a
    // pennant on it. Ink is counted in the band of sky over the station --
    // where nothing else black stands -- rather than under it, where the old
    // diamond hung.
    // nothing in the purse: the school sells kit and cannot sell you any
    const broke = { has: state().offers.includes('school'), ink: flagInk('school') };
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
    const rich = { has: state().offers.includes('school'), ink: flagInk('school') };

    // and standing at it changes nothing: what the arrow says is still true
    await hoverStation('school');
    await sleep(300);
    const there = flagInk('school');
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
    for (let i = 0; i < 40 && state().offers.includes('bench'); i++) {
      if (!window.__rows().some(r => r.shown && window.__buy(r.key))) break;
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
    window.__school(true);
    run(20);
    await hoverStation('school');
    const open = state().schoolBoardOpen;

    // bare ground, well clear of anything that is a station
    const s = state();
    const [x, y] = onScreen(s.stands.school.x - 260, s.groundY - 60);
    canvas().dispatchEvent(new PointerEvent('pointerdown',
      { clientX: x, clientY: y, pointerId: 1, isPrimary: true, button: 0,
        buttons: 1, bubbles: true }));
    await sleep(300);
    const shut = state().schoolBoardOpen;

    // and standing at it again still opens it: this closes boards, it does not
    // put them out of reach
    await hoverStation('school');
    const again = state().schoolBoardOpen;
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
    window.__grant({ cores: 9, shards: 9000, spores: 9000 });
    run(20);
    for (let i = 0; i < 9; i++) { window.__buy('carry'); window.__finish(); window.__buy('pick'); window.__finish(); }
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
  // question at the school. Folding it away deletes the fact at the moment the
  // fact becomes final.
  ['a finished kit row stays on the board when the finished rows are hidden', async () => {
    newRun();
    await settle();
    window.__grant({ shards: 9000, dust: 60000 });
    window.__school({ open: true });
    window.__board('school');
    await sleep(400);

    // Bought the way a player buys it: the row is pressed until it will not be
    // pressed again. Setting the count through a hook would prove nothing about
    // the thing that goes wrong, which is what the board does on the purchase.
    //
    // A purchase puts the board away now (feedback8 item 1), so a set of three
    // is three walk-ups -- which is exactly what a player does, and the loop
    // walks back up the same way rather than reaching past the board.
    const row = () => [...document.querySelectorAll('#schoolshop button[data-key]')]
      .filter(b => b.offsetParent).find(b => b.dataset.key === 'breaker');
    let presses = 0;
    for (let i = 0; i < 6; i++) {
      window.__board('school');
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
    window.__board('school');                  // and back up to read the finished row
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
    window.__buildbench(true);
    window.__school({ open: true });
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

    const boards = { bench: '#shop', lab: '#labshop', school: '#schoolshop',
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
    const cells = rows.filter(el => !el.dataset.sect)
                      .map(el => [...el.children].map(sp => sp.textContent));
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
      ok(cells.length > 0 && cells.every(c => c.length === 3), 'rows are three columns',
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
      ok(cells.every(c => !c[1] || /^\+\d/.test(c[1]) || /^[\d,.]+ → /.test(c[1])),
         'a count says where it is going, a rate says what it gains',
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
  // part this check is not about.
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

    const row = document.querySelector('[data-dial="potprefer"]');
    const chosen = row?.querySelector('.chosen');
    const opts = row?._opts;                       // out on the body, not in the row
    const under = document.querySelector('[data-key="anotherpot"]');
    const shutFirst = !!opts?.hidden;
    const wasAt = under?.getBoundingClientRect().top;

    chosen?.click();
    await sleep(40);
    const dropped = !opts?.hidden;
    const listed = opts ? opts.querySelectorAll('.opt').length : 0;
    // The list is laid over the board, so the rows under it do not budge. It was
    // folded into the sheet once, and opening it shoved everything below it down
    // -- past the place you had already aimed at.
    const stillAt = under?.getBoundingClientRect().top;
    const c = chosen?.getBoundingClientRect(), o = opts?.getBoundingClientRect();
    const placed = !!c && !!o && o.top >= c.bottom - 1 && Math.abs(o.right - c.right) <= 2;

    opts?.querySelector('.opt[data-opt="rockhands"]')?.click();
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
      ok(dropped && listed > 2, 'pressing the row drops its options open',
         `${listed} options`),
      ok(placed, 'the list stands under the control that opened it, right edges level',
         c && o ? `control ${Math.round(c.right)}/${Math.round(c.bottom)}, ` +
                  `list ${Math.round(o.right)}/${Math.round(o.top)}` : 'no rects'),
      ok(Math.abs(wasAt - stillAt) < 1, 'and nothing under it moves to make room',
         `${Math.round(wasAt)} -> ${Math.round(stillAt)}`),
      // The control repeats the choice the way the yard says it -- "rock
      // hands", in words, per jobSaid -- not the way the key spells it.
      ok(said === 'rock hands', 'pressing one of them sets it', said),
      ok(shutAfter, 'and the list shuts behind the choice'),
      ok(heldOn, 'the cursor leaving does not shut it on the spot'),
      ok(wanderedOff, 'but it puts itself away a breath later'),
      ok(upAgain && wentWithBoard, 'and it never outlives the board it belongs to',
         `${upAgain} then ${wentWithBoard}`)
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
    window.__crew(3, 2);
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

  ['the books stand over the pit, and walking up to them opens them', async () => {
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
    const said = dust ? dust.children[2].innerHTML : '';
    await hoverAway();
    const shut = !state().statsBoardOpen;
    window.__crew(0, 0);

    return [
      ok(!!stand, 'there is somewhere to stand to read them',
         stand ? `${stand.x},${stand.y}` : 'nowhere'),
      ok(open, 'standing there opens them'),
      ok(rows.includes('ratedust'), 'and dust is on them', rows.join(',')),
      ok(/class="clock"/.test(said), 'with its rate over a clock', said),
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
         `${moved.join(',') || 'nothing'} moved -- ${before.stew} -> ${deeper.stew}`)
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
    window.__board('bench');
    await settle(1);
    const sheet = document.querySelector('#panel > .sheet:not(.flyout)');
    const size = () => `${sheet.offsetWidth}x${sheet.offsetHeight}`;
    const before = size();

    // A row that has to be built, pressed the way a finger presses it. The
    // press puts the board away -- buying is a thing you do to the yard and the
    // sheet gets out of the light -- so walking back up to it is part of the
    // route, and it is the board you walk back up to that this is about.
    const row = [...shop().querySelectorAll('[data-key]')]
      .find(r => r.dataset.key === 'unlockschool');
    row?.click();
    await settle(1);
    window.__board('bench');
    await settle(1);
    const back = [...shop().querySelectorAll('[data-key]')]
      .find(r => r.dataset.key === 'unlockschool');
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
    const SAYS = ['busy', 'busy (9)', 'building', 'on the way', 'nobody on it'];
    const spills = [];
    for (const which of ['bench', 'casino', 'quarry', 'farm', 'stats',
                         'outhouse', 'buildbench', 'house']) {
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
      ok(/busy|building|on the way|nobody on it/.test(status),
         'and pressing it puts a status where the gain was', status || 'nothing'),
      ok(seen.size === 1 && seen.has(before),
         'and the sheet is the same size on every frame the build runs',
         [...seen].join(' / ')),
      ok(spill === 0,
         'and no card on any board is given a status it cannot hold',
         spills.join(', ') || 'none spill'),
      ok(shouted === before,
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
];
