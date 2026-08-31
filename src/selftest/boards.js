// The boards: what a row is, how wide a column goes, what a price says, and
// where a board seats itself.
//
// 13 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, newRun, raf, settle, state, ok, canvas, board, shop, point, onScreen,
  hoverBench, hoverStation, openCrewList, hoverAway, run } from './kit.js';

export const TESTS = [
  ['the school is a place you walk to', async () => {
    window.__crew(2, 2, 2, 2);
    window.__grant({ shards: 30 });
    const shut = state();
    const row = [...shop().querySelectorAll('[data-key]')]
      .find(r => r.dataset.key === 'unlockschool');
    row?.click();
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
  // longer than somebody's guess ran over the price. So the column is measured
  // now -- and what proves it is measured rather than merely wide enough is that
  // making a name longer makes the column wider.
  ['a longer name widens the column instead of running out of it', async () => {
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
    const nameW = () => Math.round(rows()[0].querySelector('.name').getBoundingClientRect().width);
    const over = b => {
      const cell = b.querySelector('.name');
      const range = document.createRange();
      range.selectNodeContents(cell);
      return Math.round(range.getBoundingClientRect().right - cell.getBoundingClientRect().right);
    };

    const was = nameW();
    // every row shares the tracks, so one width is the board's width
    const shared = new Set(rows().map(b => Math.round(b.querySelector('.name').getBoundingClientRect().width)));

    const victim = rows().find(b => b.querySelector('.what'));
    const said = victim.querySelector('.what').textContent;
    victim.querySelector('.what').textContent = said + ' of the everlasting stone';
    await raf();
    await raf();
    const now = nameW();
    const spilled = rows().filter(b => over(b) > 1).length;

    victim.querySelector('.what').textContent = said;
    await raf();
    const back = nameW();
    window.__board(null);
    return [
      ok(shared.size === 1, 'every row on a board shares one name column',
         `${shared.size} widths: ${[...shared].join(', ')}`),
      ok(now > was, 'a longer name makes that column wider', `${was}px -> ${now}px`),
      ok(spilled === 0, 'and none of the names run out of it', `${spilled} spilled`),
      ok(Math.abs(back - was) <= 1, 'and taking the words back takes the width back',
         `${now}px -> ${back}px, from ${was}px`)
    ];
  }],

  // Down the sheet as well as across it. A board whose rows are all different
  // heights is a board you read one row at a time, because there is no rhythm to
  // run your eye down -- and the heights were different for two reasons that
  // both used to be necessary and are not any more: a bill of two coins stacked
  // to fit a column that could not hold it, and a row with no ladder dropped the
  // half-line the pips sit on.
  ['every row on a board is the same height as every other', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9, shards: 900, spores: 900 });
    window.__crew(4, 3, 2, 2);
    window.__air({ janitors: 1 });
    run(20);
    const boards = ['bench', 'house', 'quarry', 'farm', 'school', 'scrub', 'lab',
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
      const heights = [...new Set(rows.map(e => Math.round(e.getBoundingClientRect().height)))];
      if (heights.length > 1) {
        bad.push(`${name}: ${heights.sort((a, b) => a - b).join(', ')}px`);
      }
    }
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(seen > 20, 'there are rows on the boards to measure', `${seen} rows`),
      ok(bad.length === 0, 'and each board comes down in one step',
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
    window.__lab(true);
    window.__crew(0, 0);
    run(30);
    window.__build();
    window.__buy('unlocktower');
    window.__build();
    window.__board('tower');
    await sleep(500);
    const row = document.querySelector('#towershop button[data-key="wizard"]');
    const coins = row && [...row.querySelectorAll('.cost i')].map(i => i.className);
    const said = row && row.querySelector('.cost').textContent.trim();
    const tall = row && Math.round(row.getBoundingClientRect().height);
    // A bill stacks two to a line once it is longer than the column can hold, and
    // a stacked bill makes its row taller than every other row on the board. Four
    // fits, so this one must not be stacking: asked of the cell itself, because
    // the tower has one row and "every row here is the same height" is a thing a
    // board with one row says whatever it does.
    const stacked = row && row.querySelector('.cost').classList.contains('split');
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
  ['an arrow under a station says it has something for you', async () => {
    newRun();
    await settle();
    window.__crew(3, 2, 1, 1);
    window.__school(true);
    run(20);
    window.__look(state().stands.school.x - 400);   // it has to be on the screen
    await sleep(200);
    await hoverAway();
    await sleep(200);

    const ink = which => {
      const s = state(), r = s.stands[which];
      if (!r) return 0;
      const dpr = window.devicePixelRatio || 1;
      const x0 = Math.round((r.x - s.camX) * s.zoom * dpr);
      const y0 = Math.round((s.groundY + 6 - s.camY) * s.zoom * dpr);
      const w = Math.max(1, Math.round(r.w * s.zoom * dpr));
      const h = Math.max(1, Math.round(30 * s.zoom * dpr));
      if (x0 < 0 || y0 < 0) return -1;
      const d = canvas().getContext('2d').getImageData(x0, y0, w, h).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] < 128) n++;
      return n;
    };

    // nothing in the purse: the school sells kit and cannot sell you any
    const broke = { has: state().offers.includes('school'), ink: ink('school') };
    window.__grant({ shards: 900 });
    await sleep(300);
    const rich = { has: state().offers.includes('school'), ink: ink('school') };

    // and standing at it changes nothing: what the arrow says is still true
    await hoverStation('school');
    await sleep(300);
    const there = ink('school');
    await hoverAway();
    await sleep(300);

    window.__crew(0, 0);
    newRun();
    return [
      ok(broke.has === false, 'a board with nothing you can buy offers nothing'),
      ok(broke.ink === 0, 'and there is no arrow under it', `${broke.ink} px`),
      ok(rich.has === true, 'money in the purse and it has something for you'),
      ok(rich.ink > 0, 'and an arrow appears under it', `${rich.ink} px`),
      // and it stays up while you are standing there. Taking it down read as the
      // mark flickering off under the cursor, and what it says is still true.
      ok(there > 0, 'and stays up while you are standing there reading it',
         `${there} px`)
    ];
  }],

  // The quarry is the hole, and a bridge crosses it: a ramp up, a deck straight
  // over the mouth, a ramp down, and the crew walk every foot of that. Aiming at
  // the mouth meant aiming at the deck, so walking a hauler over the quarry opened
  // the quarry's board on the way past. What you point at is the ground that is
  // missing.
  ['the quarry is opened by its hole, not by the bridge over it', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9 });
    window.__crew(2, 2, 2, 0);
    run(20);
    const q = state().stands.quarry;
    window.__look(q.x - 400);
    await sleep(300);
    const g = state().groundY;
    const at = async (wx, wy) => {
      const [x, y] = onScreen(wx, wy);
      point('pointermove', x, y, 0);
      await sleep(300);
      return state().quarryBoardOpen;
    };
    const deck = await at(q.x + q.w / 2, g - 30);     // straight over the mouth
    const ramp = await at(q.x - 40, g - 14);          // on the way up to it
    const hole = await at(q.x + q.w / 2, g + 40);     // and down in the quarry itself
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(deck === false, 'crossing the deck does not open it'),
      ok(ramp === false, 'nor does walking up the ramp'),
      ok(hole === true, 'and the hole itself does')
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
    window.__give(99999999);
    window.__grant({ cores: 9, shards: 9000, spores: 9000 });
    run(20);
    for (let i = 0; i < 9; i++) { window.__buy('carry'); window.__buy('pick'); }
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
    window.__grant({ shards: 9000 });
    window.__school({ open: true });
    window.__board('school');
    await sleep(400);

    // Bought the way a player buys it: the row is pressed until it will not be
    // pressed again. Setting the count through a hook would prove nothing about
    // the thing that goes wrong, which is what the board does on the purchase.
    const row = () => [...document.querySelectorAll('#schoolshop button[data-key]')]
      .filter(b => b.offsetParent).find(b => b.dataset.key === 'breaker');
    let presses = 0;
    for (let i = 0; i < 6; i++) {
      const b = row();
      if (!b || b.disabled) break;
      b.click();
      presses++;
      await sleep(120);
    }
    const bought = state().breakers;

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
  // open the row that sells the closet, and never appeared anywhere: which looks
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

  // The dot that marks a row you have never had on an open board hangs off the
  // *title*, not off the cell. The name cell is two lines -- the words, and the
  // line the ladder's pips sit on, which is held whether or not there are pips --
  // so a dot centred on the cell sits half a line below the words it belongs to,
  // pointing at the gap under them.
  ['the new-row dot is level with the name it marks', async () => {
    newRun();
    await settle();
    window.__give(400);
    run(20);
    window.__build();
    window.__board('bench');
    await sleep(500);
    const row = document.querySelector('#shop button.new');
    const what = row && row.querySelector('.what');
    const name = row && row.querySelector('.name');
    const on = what && getComputedStyle(what, '::before').content;
    const off = name && getComputedStyle(name, '::before').content;
    const anchored = what && getComputedStyle(what).position;
    // and the two lines really are at different heights, or this proves nothing
    const wm = what && what.getBoundingClientRect();
    const nm = name && name.getBoundingClientRect();
    const apart = wm && nm
      ? Math.round(Math.abs((nm.top + nm.height / 2) - (wm.top + wm.height / 2))) : 0;
    window.__board(null);
    return [
      ok(!!row, 'there is a row on the bench nobody has read yet',
         row ? row.dataset.key : 'none'),
      ok(apart >= 2, 'the cell and the title are at different heights',
         `${apart}px apart`),
      ok(on && on !== 'none', 'the dot hangs off the title', String(on)),
      ok(off === 'none' || off === undefined, 'and not off the cell round it',
         String(off)),
      ok(anchored === 'relative', 'which is what it is positioned against',
         String(anchored))
    ];
  }],

  ['no row on any board sits on top of itself', async () => {
    newRun();
    await settle();
    // enough of everything that every row on every board is showing
    window.__crew(4, 3);
    window.__grant({ cores: 6, shards: 4000, spores: 4000, sparks: 400 });
    window.__lab(true);
    window.__school({ open: true });
    window.__loo(true);
    window.__air({ open: true, scrubbers: 1 });
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
];
