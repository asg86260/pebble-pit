// The house board and the crew submenu hung off it.
//
// 12 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, newRun, raf, settle, state, buildShopFromTest, ok, board, panel, shop, point,
  hoverBench, hoverHouse, openCrewList, hoverAway, run, buy, asScreen } from './kit.js';

export const TESTS = [
  // A hire has always *been* a room -- the settlement is drawn straight off the
  // headcount -- so the bench selling "workers" from the far end of the yard was
  // the shop describing something the houses were already doing. You put the
  // next one up where it goes up.
  ['another house is bought where the houses are', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__give(100000);
    run(20);
    buildShopFromTest();
    const onBench = !!shop().querySelector('[data-key="worker"]') ||
                    !!shop().querySelector('[data-key="house"]');

    await hoverHouse();
    const before = state();
    const row = document.querySelector('#crewshop button[data-key="house"]');
    row?.click();
    await sleep(60);
    run(1);
    // Paid, but not built. A house is a timed build now -- C1 in
    // docs/wave-feedback3.md: the dust goes at the press, a builder walks out to
    // the block and puts it up over a couple of minutes, and only then is
    // there a room and somebody to live in it. So the dust reads on this
    // snapshot and the body and the room read on the next, after the build has
    // landed. Waited for rather than timed, because how long a build takes is
    // the works' business and a check that guessed would break the day it was
    // tuned.
    const paid = state();
    for (let i = 0; i < 400 && state().crew <= paid.crew; i++) run(1);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(!onBench, 'the bench does not sell people any more'),
      ok(!!row, 'the house board does'),
      ok(before.houseRow && /^another house/.test(before.houseRow),
         'and the row is a house rather than a headcount', before.houseRow),
      // a count, so it says where the count is going -- see the note on the
      // bench's rows about why "+1" was not enough
      ok(before.houseRow && /\d → \d/.test(before.houseRow),
         'saying where it takes you, like every other count', before.houseRow),
      ok(after.crew === before.crew + 1, 'buying one takes somebody on',
         `${before.crew} -> ${after.crew}`),
      ok(paid.stored < before.stored, 'and it is paid for in dust, up front',
         `${before.stored} -> ${paid.stored}`),
      ok(paid.crew === before.crew, 'but nobody arrives until it is built',
         `${before.crew} -> ${paid.crew} a second after paying`),
      ok(after.houses.cubes > before.houses.cubes,
         'and the block has another room standing in it',
         `${before.houses.cubes} -> ${after.houses.cubes}`)
    ];
  }],

  // The house is the one board that sells nothing. Standing at it lists who
  // lives there, where each of them is right now, and what each has done.
  ['the house lists who lives there', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(60);
    await hoverHouse();
    await openCrewList();
    const open = state();
    // the first person on the sheet that opened: the board itself is the block
    const row = document.querySelector('#crewlist button[data-key^="who"]');
    if (row) {
      const r = row.getBoundingClientRect();
      row.dispatchEvent(new PointerEvent('pointerenter',
        { clientX: r.left + 2, clientY: r.top + 2, bubbles: true }));
    }
    const tipEl = document.getElementById('tip');
    const said = tipEl.hidden ? '' : tipEl.textContent;
    const names = state().crewNames.split(' ').map(w => w.split('|')[0]);

    // clicking a name says which one it is, for a few seconds and no longer
    row?.click();
    const picked = state();
    // A body walks. The view is asked where it is now rather than where it was
    // standing when the row was clicked, so a couple of seconds of yard later
    // the two of them are still together.
    run(2);
    const kept = state();
    run(5);
    const gone = state();
    window.__crew(0, 0);
    return [
      ok(open.houseBoardOpen, 'standing at the house opens it', `${open.houseBoardOpen}`),
      ok(open.crewRows.length === 4, 'one row per body', `${open.crewRows.length} rows`),
      ok(open.crewRows.every(r => names.some(n => r.startsWith(n))),
         'and every row is somebody by name', JSON.stringify(open.crewRows)),
      ok(open.crewRows.some(r => r.includes('on the rock')) &&
         open.crewRows.some(r => r.includes('at the pit')),
         'saying where that body is standing, not what its job is called',
         JSON.stringify(open.crewRows)),
      // The whole card is the slim card now (feedback7, item 17): name, age,
      // doing, and nothing else. The tallies this asked for went with the wave.
      ok(/^age {7}/m.test(said) && /^doing {5}/m.test(said)
         && said.split(String.fromCharCode(10)).length === 3,
         'and hovering one gives that body its whole card', JSON.stringify(said)),
      ok(picked.pointed.length === 1 && open.crewRows[0].startsWith(picked.pointed[0]),
         'and clicking one puts an arrow over that body, so you can find it',
         JSON.stringify(picked.pointed)),
      ok(gone.pointed.length === 0, 'which goes away on its own a few seconds later',
         JSON.stringify(gone.pointed)),
      ok(kept.follows === picked.pointed[0] && Math.abs(kept.followOff) < 120,
         'and the view walks with them while the arrow is up, rather than to where they were',
         `${kept.follows} ${kept.followOff}px off centre`),
      ok(gone.follows === null, 'and lets go of them when the arrow does',
         `${gone.follows}`),
      ok(open.crewRows.every(r => !r.includes('undefined')),
         'and no row has a body the board cannot place',
         JSON.stringify(open.crewRows))
    ];
  }],

  // The names used to be poured out under the buy row, which is a board at four
  // bodies and a column taller than the window at twenty. They are a submenu
  // now -- and a submenu is only worth having if you can get to it: the board it
  // hangs off must not shut while the cursor is crossing to it, and neither of
  // them may shut while the cursor is on it.
  // One row at a time is the row you are reading. A submenu opens because a row
  // was hovered; hovering a different row is the answer changing, and the old
  // sheet has no business still standing beside a board that is no longer about
  // it.
  ['reading another row puts the submenu away', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(60);
    await hoverHouse();
    const door = await openCrewList();
    const list = document.getElementById('crewlist');
    const wasOut = !list.hidden && state().crewListOpen;

    // any other row on the same board -- the one that buys another house
    const other = [...document.querySelectorAll('#crewshop button')]
      .find(b => b !== door && b.offsetParent !== null);
    if (other) {
      const r = other.getBoundingClientRect();
      other.dispatchEvent(new PointerEvent('pointerenter',
        { clientX: r.left + 2, clientY: r.top + 2, bubbles: true }));
      await raf();
      await raf();
    }
    const after = state().crewListOpen;

    // and back on the door it comes out again, so this is a change of mind
    // rather than a submenu that can only be opened once
    await openCrewList();
    const again = state().crewListOpen;
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(wasOut, 'hovering the door opens the list'),
      ok(!!other, 'there is another row on the board to read'),
      ok(!after, 'and reading another row folds it away', `${after}`),
      ok(again, 'and going back to the door brings it out again', `${again}`)
    ];
  }],

  // The list lays over the board it came out of, and the board does not move.
  //
  // It stood beside the board once, as a flex sibling, and went to the other
  // side or onto a line of its own when the window was too narrow for both --
  // which on an ordinary window was always, so hovering the door threw the
  // whole board into the top corner of the glass to make room. The row you
  // hovered should stay where it was. So the list is out of the panel's flow,
  // seated on the board's bottom-right corner at the board's width, and the
  // board is measured before and after to prove it has not moved an inch.
  ['the list pops over the board and the board stays put', async () => {
    newRun();
    await settle();
    window.__crew(3, 2);
    run(60);
    await hoverHouse();
    const sheet = document.querySelector('#panel .sheet:not(.flyout)');
    const list = document.getElementById('crewlist');
    const before = sheet.getBoundingClientRect();
    await openCrewList();
    await sleep(80);
    const after = sheet.getBoundingClientRect();
    const listed = list.getBoundingClientRect();
    const panel = document.getElementById('panel');
    const still = Math.abs(after.left - before.left) < 1 && Math.abs(after.bottom - before.bottom) < 1;
    const over = Math.abs(listed.right - after.right) < 1 && Math.abs(listed.bottom - after.bottom) < 1 &&
                 Math.abs(listed.width - after.width) < 1;
    const unmoved = !panel.classList.contains('stack') && !panel.classList.contains('flip');
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(listed.width > 60, 'the list opens with something on it', `${Math.round(listed.width)}px`),
      ok(still, 'and the board it came out of has not moved',
         `${Math.round(before.left)},${Math.round(before.bottom)} -> ${Math.round(after.left)},${Math.round(after.bottom)}`),
      ok(over, 'because the list lays over it, edge for edge',
         `list ${Math.round(listed.right)},${Math.round(listed.bottom)} ${Math.round(listed.width)}w; board ${Math.round(after.right)},${Math.round(after.bottom)} ${Math.round(after.width)}w`),
      ok(unmoved, 'with nothing in the panel re-seated to make room for it', panel.className)
    ];
  }],

  ['the crew is a submenu of the house board', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(60);
    await hoverHouse();
    const shut = state();
    const inlineNames = document.querySelectorAll('#crewshop [data-key^="who"]').length;
    const sheet = document.querySelector('#panel .sheet:not(.flyout)');
    const list = document.getElementById('crewlist');

    await openCrewList();
    const open = state();
    const listOut = !list.hidden;
    const listed = list.getBoundingClientRect();
    const board = sheet.getBoundingClientRect();

    // The whole of the list, and the strip of nothing between it and the board
    // it came out of. These go to the canvas, which is where the game decides
    // whether the cursor has walked off: over the real page the panel is in the
    // way and the canvas never hears about any of it, so this is the harder
    // question of the two and the only one worth asking.
    const probes = [
      [listed.left + listed.width / 2, listed.top + listed.height / 2],
      [listed.right - 4, listed.bottom - 4],
      [listed.right - 4, listed.top + 4],
      [(board.right + listed.left) / 2, listed.bottom - 6]
    ];
    let stayed = true;
    for (const [x, y] of probes) {
      point('pointermove', x, y, 0);
      const s = state();
      if (!s.houseBoardOpen || !s.crewListOpen) stayed = false;
    }
    const onIt = state();

    // and it still goes away when you actually walk off. Straight up off the top
    // of it, which is out of the wedge in the one direction that cannot be
    // mistaken for anything else: the ground is below, the sky is not a station,
    // and the whole of the menu is between the cursor and where it came from.
    point('pointermove', listed.left + listed.width / 2,
          Math.min(listed.top, board.top) - 160, 0);
    // long enough for the board to give up on the station it was standing at:
    // leaving one lingers for a moment so that arriving at the next is a move
    // rather than a close and an open. See LINGER in board.js.
    await sleep(240);
    const left = state();
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(shut.houseBoardOpen && !shut.crewListOpen,
         'standing at the house opens the board with the list still folded away',
         `${shut.houseBoardOpen}, ${shut.crewListOpen}`),
      ok(inlineNames === 0 && shut.crewRows.length === 0,
         'so no names are sitting on the board itself', `${inlineNames} of them`),
      ok(!!shut.houseRow && /^another house/.test(shut.houseRow),
         'what is on it is the house you can put up', shut.houseRow),
      ok(!!shut.crewDoor && shut.crewDoor.includes('who lives here') &&
         shut.crewDoor.includes('4'),
         'and a row that leads to the people, saying how many there are',
         shut.crewDoor),
      ok(open.crewListOpen && listOut,
         'reaching that row brings the people out beside it',
         `${open.crewListOpen}, ${listOut}`),
      ok(open.crewRows.length === 4,
         'one row per body, on the sheet that opened', `${open.crewRows.length} rows`),
      ok(open.crewRows.some(r => r.includes('on the rock')),
         'still saying where each of them is', JSON.stringify(open.crewRows)),
      ok(document.getElementById('panel').contains(list) && listed.width > 0,
         'the list is part of the menu rather than a second thing beside it',
         `${Math.round(listed.width)}x${Math.round(listed.height)}`),
      ok(stayed, 'hovering it closes neither the board nor the list',
         `board ${Math.round(board.right)}, list ${Math.round(listed.left)}`),
      ok(onIt.houseBoardOpen && onIt.crewListOpen,
         'and both are still up at the far corner of it',
         `${onIt.houseBoardOpen}, ${onIt.crewListOpen}`),
      ok(!left.houseBoardOpen && !left.crewListOpen,
         'while walking away takes the two of them together',
         `${left.houseBoardOpen}, ${left.crewListOpen}`)
    ];
  }],

  // A board is seated by the size it was measured at, and a board changes size
  // under you -- so it has to measure itself again, or the sheet stands where a
  // board of some other size would have stood.
  //
  // It changes size two ways, and this used to know about one of them. A row
  // arriving or leaving is the obvious one. The other is a row that stays put
  // and starts saying something else: a row past the bench does not hand you the
  // thing any more, it starts the yard building it -- and from that moment the
  // row says what is happening where its gain was and carries a clock in its
  // bill. Same rows, wider board, and nothing said the board had moved.
  //
  // This check used to press that row and expect the *set* of rows to change,
  // and it did -- but only because the board had been standing stale since
  // before it was opened, and the press was what made it catch up. A board is
  // built from what the yard is offering this frame now, so the press changes
  // the words and nothing else, which is the case the seating was getting wrong
  // underneath the one this was watching.
  ['a board that changes under you is seated by its new size', async () => {
    newRun();
    await settle();
    await hoverBench();
    window.__give(400);
    run(0.5);
    await sleep(80);

    // What is drawn, against what the yard says it is offering. Nothing has been
    // pressed: a board you have walked up to shows what is on offer, rather than
    // whatever was on offer the last time somebody happened to rebuild it.
    const bench = new Set(window.__boards().find(b => b.name === 'bench').keys);
    const offered = window.__rows().filter(r => r.shown && bench.has(r.key)).map(r => r.key);
    const drawn = [...shop().querySelectorAll('[data-key]')].map(e => e.dataset.key);
    const missing = offered.filter(k => !drawn.includes(k));
    const ghosts = drawn.filter(k => !bench.has(k) || !offered.includes(k));
    const grew = window.__boardFit();

    // ...and now a row that starts a piece of work. The purchase puts the board
    // away (feedback8 item 1), so this walks back up to it -- and the row is
    // still there, saying what it is doing, which is a different width of row.
    // Re-queried rather than kept: the board is rebuilt on the way back in, so
    // the element from before the press is a stale one hanging off nothing.
    const row = shop().querySelector('[data-key="auto"]');
    row?.click();
    run(0.5);
    await sleep(80);
    await hoverBench();
    await sleep(250);
    const again = shop().querySelector('[data-key="auto"]');
    const said = again?.querySelector('.gain')?.textContent || '';
    const fit = window.__boardFit();
    const r = panel().getBoundingClientRect();
    const left = shop().querySelectorAll('[data-key]').length;
    return [
      ok(offered.length > 0 && missing.length === 0,
         'a board draws every row the yard is offering, with nothing pressed',
         missing.length ? `missing ${missing.join(',')}` : `${drawn.length} rows`),
      ok(ghosts.length === 0, 'and nothing it is not', ghosts.join(',') || 'none'),
      ok(Math.abs(grew.h - grew.realH) < 2 && Math.abs(grew.w - grew.realW) < 2,
         'and it is seated by the size those rows make it',
         `seated ${grew.w}x${grew.h}, really ${grew.realW}x${grew.realH}`),
      ok(!!again && left === drawn.length, 'starting a build leaves the row where it is',
         `${drawn.length} -> ${left} rows`),
      ok(/on the way|building|nobody on it|queued up/.test(said),
         'and the row says what the yard is doing about it', said || 'nothing'),
      ok(Math.abs(fit.h - fit.realH) < 2 && Math.abs(fit.w - fit.realW) < 2,
         'and the board is seated by the size it is now, not the size it was',
         `seated ${fit.w}x${fit.h}, really ${fit.realW}x${fit.realH}`),
      ok(r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
         'so it is still inside the window', JSON.stringify(r))
    ];
  }],
];
