// The house board and the crew submenu hung off it.

import { sleep, newRun, raf, settle, state, buildShopFromTest, ok, board, panel, shop, point, hoverBench, hoverHouse, openCrewList, hoverAway, run, buy } from './kit.js';

export const TESTS = [
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
    // Paid, but not built: the dust goes at the press, the body and the room
    // arrive when the build lands. Waited for rather than timed, because how
    // long a build takes is the works' business.
    const paid = state();
    for (let i = 0; i < 400 && state().crew <= paid.crew; i++) run(1);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(!onBench, 'the bench does not sell people any more'),
      ok(!!row, 'the house board does'),
      ok(before.houseRow && /^another house/.test(before.houseRow),
         'and the row is a house rather than a headcount', before.houseRow),
      // a count, so it says where the count is going
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
    // A body walks: a couple of seconds of yard later the view and the body
    // should still be together.
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
      // The slim card: name, age, doing, and nothing else.
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

  // A submenu opens because a row was hovered; hovering a different row is
  // the answer changing.
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
    const enter = (el, type = 'pointerenter') => {
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent(type,
        { clientX: r.left + 2, clientY: r.top + 2, bubbles: true }));
    };
    const leave = el => enter(el, 'pointerleave');
    // Crossed on the way to the list: the row is between the door and the
    // names, so the pointer passes over it and lands on the list inside the
    // grace, and the list must still be there when it arrives.
    if (other) { enter(other); await raf(); leave(other); enter(list); }
    await sleep(320);                      // past SUBMENU_GRACE_MS
    const crossed = state().crewListOpen;
    // Stood on, and stayed on: that is reading the other row.
    if (other) { enter(other); await raf(); await raf(); }
    const atOnce = state().crewListOpen;   // not yet -- the grace has not run
    await sleep(320);
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
      ok(crossed, 'crossing that row on the way to the list does not fold it', `${crossed}`),
      ok(atOnce && !after, 'and standing on it does, a moment later', `${atOnce} -> ${after}`),
      ok(again, 'and going back to the door brings it out again', `${again}`)
    ];
  }],

  ['picking a name takes the view to them and folds the list away', async () => {
    newRun();
    await settle();
    window.__crew(6, 2);
    window.__give(40000);
    run(60);
    await hoverHouse();
    await openCrewList();
    await sleep(120);
    const rows = [...document.querySelectorAll('#crewlistrows button')];
    const before = state();
    rows[rows.length - 1].click();
    await sleep(120);
    const after = state();
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(rows.length > 1, 'there is a list of them to pick from', `${rows.length}`),
      ok(!after.crewListOpen, 'picking one folds the list away',
         `${before.crewListOpen} -> ${after.crewListOpen}`),
      ok(!!after.follows, 'and the view goes to whoever it was', `${after.follows}`)
    ];
  }],

  // A site takes a line (DESIGN.md, "The queue"), and the point of a line is
  // pressing the next row without walking back up. A press that buys nothing
  // must look the same from the board and different from the purse.
  ['buying leaves the board up, and so does a press that buys nothing', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__give(200000);
    // a place is bought with a core as well as with dust
    window.__grant({ cores: 5 });
    window.__answered('props');                 // the shield that opens the plots
    run(20);
    // Each press reports what it cost as well as what the board did, because
    // the rule is about the pair.
    const press = async key => {
      await hoverBench();                    // stand at the bench (still there after a press)
      await sleep(250);
      const b = document.querySelector(`#shop button[data-key="${key}"]`);
      if (!b) return null;
      const before = state().stored;
      b.click();
      await sleep(200);
      return { open: state().boardOpen, spent: before - state().stored };
    };

    const bought = await press('carry');
    // The row the yard is now building is committed, so pressing it again
    // cannot go through: a truer refusal than an empty purse, since the money
    // is there and the yard still says no.
    const refused = await press('carry');
    const place = await press('unlockfarm');

    await hoverAway();
    newRun();
    return [
      ok(!!bought && bought.spent > 0, 'a rung takes the money',
         bought ? `${bought.spent}` : 'no row'),
      ok(!!bought && bought.open === true, 'and the board stays up for the next press',
         `${bought && bought.open}`),
      // Not `=== 0`: the crew are hauling while this runs, so the purse
      // creeps *up* under the press. What matters is that nothing was taken.
      ok(!!refused && refused.spent <= 0, 'the rung being built is refused a second time',
         refused ? `${refused.spent} taken` : 'no row'),
      ok(!!refused && refused.open === true, 'and a press that bought nothing leaves the board up',
         `${refused && refused.open}`),
      ok(!!place && place.open === true, 'and ordering a place leaves it up as well',
         `${place && place.open}`)
    ];
  }],

  // The cursor comes up from the house, so the bottom row of the sheet is the
  // one it walks through.
  ['walking up to the block does not open the settlement on the way', async () => {
    newRun();
    await settle();
    // Plenty for a block, and short of the abyss: more than the hole holds
    // tears through the rift, and the drowning takes the camera to the pit
    // mid-walk.
    window.__give(30000);
    window.__grant({ cores: 9 });
    window.__crew(6, 3);
    run(20);
    // the walk has to start from where a hand actually starts
    const from = await hoverHouse();
    await sleep(400);
    const buy = document.querySelector('#crewshop button[data-key="house"]');
    const rows = [...document.querySelectorAll('#crewshop button')];
    const box = buy.getBoundingClientRect();
    const x = Math.round(box.left + box.width / 2);
    let opened = false;
    // A synthetic pointermove raises no enter and no leave of its own, and a
    // row opens its list on being entered, so a walk that only moves can never
    // trip the thing this is looking for.
    let was = null;
    for (let y = Math.round(from.y); y >= Math.round(box.top + 8); y -= 6) {
      const el = document.elementFromPoint(x, y) || document.querySelector('canvas');
      const at = { clientX: x, clientY: y, bubbles: true };
      if (el !== was) {
        if (was) was.dispatchEvent(new PointerEvent('pointerleave', { ...at, bubbles: false }));
        el.dispatchEvent(new PointerEvent('pointerenter', { ...at, bubbles: false }));
        was = el;
      }
      el.dispatchEvent(new PointerEvent('pointermove', at));
      await sleep(16);
      if (state().crewListOpen) opened = true;
    }
    const arrived = state();
    window.__board(null);
    window.__crew(0, 0);
    return [
      // Stated directly rather than as a row count: whatever the cursor
      // crosses first coming in off the yard must not be the door, which
      // opens on hover.
      ok(rows.length > 0 && rows[rows.length - 1].dataset.key !== 'crewlist',
         'the row nearest the yard is not the one that opens the settlement',
         rows.map(r => r.dataset.key).join(' then ')),
      ok(!opened, 'and reaching it never puts the settlement up'),
      ok(arrived.houseBoardOpen, 'and the board is still there when you get there')
    ];
  }],

  ['hovering a name does not close the list it is on', async () => {
    newRun();
    await settle();
    window.__crew(6, 2);
    window.__give(40000);
    run(30);
    await hoverHouse();
    await openCrewList();
    await sleep(120);
    const rows = [...document.querySelectorAll('#crewlistrows button')];
    let stayed = true;
    for (const b of rows.slice(0, 4)) {
      const r = b.getBoundingClientRect();
      b.dispatchEvent(new PointerEvent('pointerenter',
        { clientX: r.left + 8, clientY: r.top + 4, bubbles: true }));
      await sleep(40);
      if (!state().crewListOpen) stayed = false;
    }
    const at = state();
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(rows.length >= 4, 'there are names on the sheet', `${rows.length}`),
      ok(stayed, 'and hovering one leaves the sheet up'),
      ok(at.crewListOpen && at.houseBoardOpen,
         'and the board underneath it too', `${at.crewListOpen}, ${at.houseBoardOpen}`)
    ];
  }],

  ['you can get to the names without a ruler', async () => {
    newRun();
    await settle();
    window.__crew(6, 2);
    window.__give(40000);
    run(30);
    await hoverHouse();
    const door = await openCrewList();
    await sleep(120);
    const rows = [...document.querySelectorAll('#crewlistrows button')];
    const dr = door.getBoundingClientRect();
    const target = rows[0].getBoundingClientRect();

    // the ugliest crossing there is: out of the bottom of the board, along the
    // bottom edge of the panel, and up into the list. Along the edge and not
    // under it: the ground that far below the house board is the bench's own
    // stand, where a station under the pointer takes the board every time
    // (input.js). The wedge protects the crossing between a board and its
    // list, not a stroll over the neighbors.
    const dip = document.getElementById('panel').getBoundingClientRect().bottom - 10;
    const path = [
      [dr.right - 6, dr.bottom - 2],
      [dr.right + 10, dip],
      [(dr.right + target.left) / 2, dip],
      [target.left + 20, dip],
      [target.left + 20, target.top + 6]
    ];
    let openThroughout = true;
    for (const [x, y] of path) {
      point('pointermove', x, y, 0);          // to the canvas: the game's own ears
      await sleep(50);
      if (!state().houseBoardOpen || !state().crewListOpen) openThroughout = false;
    }
    const at = state();
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(rows.length > 0, 'there are names to walk to', `${rows.length} of them`),
      ok(openThroughout, 'and the board and its list survive the crossing'),
      ok(at.houseBoardOpen && at.crewListOpen, 'and are still up at the far end of it',
         `${at.houseBoardOpen}, ${at.crewListOpen}`)
    ];
  }],

  ['a row wears its description inline, not on a hover', async () => {
    // The crew submenu is the one exception (a roster of a dozen bodies keeps
    // the hover; see shop.js), and this is a board.
    newRun();
    await settle();
    window.__crew(4, 2);
    window.__give(40000);
    window.__grant({ shards: 400, spores: 1300, cores: 9 });
    // The ground up, so the rows that carry a note are on the bench: the tower
    // is one of them and it is the last thing the chain offers.
    window.__crew(0, 0, 1, 1);
    window.__invest();
    window.__crew(4, 2);
    run(30);
    window.__board('bench');
    await sleep(200);

    const tip = document.getElementById('tip');
    let described = 0, hoverTip = 0;
    for (const b of shop().querySelectorAll('button')) {
      const note = b.querySelector('.note');
      if (note && note.textContent.trim()) described++;
      const r = b.getBoundingClientRect();
      b.dispatchEvent(new PointerEvent('pointerenter',
        { clientX: r.right - 4, clientY: r.top + 4, bubbles: true }));
      await sleep(30);
      if (!tip.hidden) hoverTip++;
    }
    window.__board(null);
    window.__crew(0, 0);
    return [
      ok(described > 0, 'a row with something to say carries it in its own line',
         `${described} described`),
      ok(hoverTip === 0, 'and hovering a board row opens no sheet beside it',
         `${hoverTip} rows still popped a tip`)
    ];
  }],

  // The list stands beside the board on its bottom edge, the panel's gap
  // away: to the right, or to the left of the purse when the right runs out.
  // The board does not move for it, except on a window too narrow for the
  // three together, where it gives ground by exactly the shortfall. The
  // headless window is 800 wide, which is that case, so the move, if any, is
  // proved to be the shortfall and nothing more.
  ['the list opens beside the board', async () => {
    newRun();
    await settle();
    window.__crew(3, 2);
    run(60);
    await hoverHouse();
    const sheet = document.querySelector('#panel .sheet:not(.flyout)');
    const list = document.getElementById('crewlist');
    const panel = document.getElementById('panel');
    const before = sheet.getBoundingClientRect();
    const panelBefore = panel.getBoundingClientRect();
    const door = await openCrewList();
    await sleep(80);
    const after = sheet.getBoundingClientRect();
    const panelAfter = panel.getBoundingClientRect();
    const listed = list.getBoundingClientRect();
    const doorAt = door.getBoundingClientRect();
    const gap = 8;
    const shortfall = Math.max(0, panelBefore.right + gap + listed.width + 4 - innerWidth);
    const gave = panelBefore.left - panelAfter.left;
    // all the ground the board has to give is what stands between it and the
    // window's edge; past that the list itself comes back over the board
    const canGive = Math.min(shortfall, panelBefore.left - 4);
    const right = Math.abs(listed.left - (panelAfter.right + gap)) < 1 ||
                  (shortfall > canGive && Math.abs(listed.right - (innerWidth - 4)) < 1);
    const left = Math.abs(listed.right - (panelAfter.left - gap)) < 1;
    const beside = (right || left) && Math.abs(listed.bottom - after.bottom) < 1;
    const inside = listed.left >= 0 && listed.right <= innerWidth;
    const still = Math.abs(after.bottom - before.bottom) < 1 &&
                  (shortfall === 0 ? Math.abs(gave) < 1 : Math.abs(gave - canGive) < 1);
    // a slot, or a card plus the sheet's border and padding on either side,
    // which is the board's width less what its rows take
    const sheetAir = after.width - document.getElementById('crewshop').getBoundingClientRect().width;
    const wantW = door.classList.contains('tile') ? 2 * doorAt.width : doorAt.width + sheetAir;
    const wide = Math.abs(listed.width - wantW) < 1;
    const unmoved = !panel.classList.contains('stack') && !panel.classList.contains('flip');
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(listed.width > 60, 'the list opens with something on it', `${Math.round(listed.width)}px`),
      ok(beside, 'beside the board, on its bottom edge, the panel\'s gap away',
         `list ${Math.round(listed.left)}-${Math.round(listed.right)},${Math.round(listed.bottom)}; panel ${Math.round(panelAfter.left)}-${Math.round(panelAfter.right)},${Math.round(after.bottom)}`),
      ok(inside, 'and inside the window', `${Math.round(listed.left)}-${Math.round(listed.right)} of ${innerWidth}`),
      ok(still, 'and the board it came out of has not moved, or gave only the ground it had to',
         `${Math.round(before.left)},${Math.round(before.bottom)} -> ${Math.round(after.left)},${Math.round(after.bottom)}, short ${Math.round(shortfall)}`),
      ok(wide, door.classList.contains('tile') ? 'two slots wide' : 'one card wide',
         `list ${Math.round(listed.width)}w, door ${Math.round(doorAt.width)}w`),
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

    // These go to the canvas, where the game decides whether the cursor has
    // walked off: over the real page the panel is in the way and the canvas
    // never hears any of it, so this is the harder question.
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

    // Straight up off the top: out of the wedge in the one direction that
    // cannot be mistaken for anything else, since the sky is not a station.
    point('pointermove', listed.left + listed.width / 2,
          Math.min(listed.top, board.top) - 160, 0);
    // past LINGER (board.js): leaving a station lingers so that arriving at
    // the next is a move rather than a close and an open
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

  // A board changes size two ways: a row arriving or leaving, and a row that
  // stays put and starts saying something else (a pressed row says what the
  // yard is building and carries a clock in its bill). Same rows, wider
  // board, and the seating has to notice.
  ['a board that changes under you is seated by its new size', async () => {
    newRun();
    await settle();
    await hoverBench();
    window.__give(400);
    run(0.5);
    await sleep(80);

    // What is drawn, against what the yard says it is offering, with nothing
    // pressed.
    const bench = new Set(window.__boards().find(b => b.name === 'bench').keys);
    const offered = window.__rows().filter(r => r.shown && bench.has(r.key)).map(r => r.key);
    const drawn = [...shop().querySelectorAll('[data-key]')].map(e => e.dataset.key);
    const missing = offered.filter(k => !drawn.includes(k));
    const ghosts = drawn.filter(k => !bench.has(k) || !offered.includes(k));
    const grew = window.__boardFit();

    // ...and now a row that starts a piece of work. Re-queried after the walk
    // back up rather than kept: the board is rebuilt on the way in, so the
    // element from before the press hangs off nothing.
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
      ok(/building|queued/.test(said),
         'and the row says what the yard is doing about it', said || 'nothing'),
      ok(Math.abs(fit.h - fit.realH) < 2 && Math.abs(fit.w - fit.realW) < 2,
         'and the board is seated by the size it is now, not the size it was',
         `seated ${fit.w}x${fit.h}, really ${fit.realW}x${fit.realH}`),
      ok(r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
         'so it is still inside the window', JSON.stringify(r))
    ];
  }],
];
