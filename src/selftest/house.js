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

  // The submenu is on the screen whatever the window is doing.
  //
  // It is a flex sibling of the board, so the default answer to a panel wider
  // than the glass is to squash both of them -- and a crew list compressed to a
  // sliver behind the board reads as a submenu that failed to open. It moves
  // now: right of the board by preference, left when the right has run out, and
  // on a line of its own when neither side will take it.
  // A row's note is readable, which means it is not underneath the board the row
  // is on. It sat at a lower layer than the menu, so a note with nowhere to
  // stand did not overlap the board -- it disappeared into it, and the row
  // looked like it had something to say and said nothing.
  // Getting to the names is possible with a hand rather than with a ruler.
  //
  // The path from the door on the house board to a body's row in the list beside
  // it crosses a strip of bare canvas -- and a real pointer does not cross it in
  // a straight line: it dips under the sheet, overshoots the gap, cuts the
  // corner. Every one of those is a frame spent a little outside the panel, and
  // the board used to shut on it and take the list with it, which made the
  // submenu impossible to reach.
  // Reading a name does not put the names away.
  //
  // Hovering a row on a *board* closes whatever submenu the last row opened --
  // one row at a time is the row you are reading. The rows inside the submenu
  // are made by the same builder, and without an exception every name in the
  // crew list carried an instruction to close the crew list: hovering a body to
  // read it shut the sheet the body was written on. Which made the list
  // unusable, since reading it is the only thing it is for.
  // Picking a name is the end of reading the list.
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

  // Buying puts the board away, rung or place (feedback8 item 1). Every press
  // that takes money shuts the sheet, because what you bought happens out in
  // the yard the sheet is covering -- the dust arcs to the station, the gang
  // walks out to build, the flag comes down.
  //
  // The board used to stay up for a rung, so a ladder could be climbed without
  // walking back; that lost to seeing what you paid for, with the cost of a
  // walk-up per rung on the table when it was decided.
  //
  // A press that buys NOTHING is the other half of the rule and the half worth
  // guarding: no money, maxed out, a row already being built. The sheet has to stay
  // up for those, because a board that shuts on a bill you could not pay looks
  // exactly like a board that took your money.
  ['buying puts the board away; a press that buys nothing leaves it up', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__give(200000);
    // ...and rocks finished, because a place is bought with one now as well as
    // with dust.
    window.__grant({ cores: 5 });
    run(20);
    // Each press reports what it cost as well as what the board did, because
    // the rule is about the pair: away IF it bought, up if it did not. Reading
    // the board alone would pass a build that shut the sheet and took nothing.
    const press = async key => {
      await hoverBench();                    // walk back up: the last press shut it
      await sleep(250);
      const b = document.querySelector(`#shop button[data-key="${key}"]`);
      if (!b) return null;
      const before = state().stored;
      b.click();
      await sleep(200);
      return { open: state().boardOpen, spent: before - state().stored };
    };

    const bought = await press('carry');
    // The row the yard is now building is committed (see DESIGN.md, "The
    // queue"), so pressing it again is a press that cannot go through. That is
    // the refusal this needs, and it is a truer one than an empty purse: the
    // money is there, and the yard still says no.
    //
    // It used to press `auto`, the next rung at the bench, which the bench
    // refused while it was busy with the first. The bench takes a line now,
    // so that press is a purchase.
    const refused = await press('carry');
    const place = await press('unlockfarm');

    await hoverAway();
    newRun();
    return [
      ok(!!bought && bought.spent > 0, 'a rung takes the money',
         bought ? `${bought.spent}` : 'no row'),
      ok(!!bought && bought.open === false, 'and the board goes away with it',
         `${bought && bought.open}`),
      // Not `=== 0`: the crew are hauling while this runs, so the purse
      // creeps *up* under the press. What matters is that nothing was taken.
      ok(!!refused && refused.spent <= 0, 'the rung being built is refused a second time',
         refused ? `${refused.spent} taken` : 'no row'),
      ok(!!refused && refused.open === true, 'and a press that bought nothing leaves the board up',
         `${refused && refused.open}`),
      ok(!!place && place.open === false, 'and ordering a place puts it away as well',
         `${place && place.open}`)
    ];
  }],

  // The board comes out above the house and the cursor comes up from the house,
  // so the bottom row of the sheet is the one it walks through -- and while that
  // was the door to the settlement, going to put another block up threw the list
  // of names open every single time, which is a sheet doubling in width under a
  // cursor that was aiming at something else.
  ['walking up to the block does not open the settlement on the way', async () => {
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 9 });
    window.__crew(6, 3);
    run(20);
    // stood at the house, which is what puts the board up in the first place --
    // the walk has to start from where a hand actually starts
    const from = await hoverHouse();
    await sleep(400);
    const buy = document.querySelector('#crewshop button[data-key="house"]');
    const rows = [...document.querySelectorAll('#crewshop button')];
    const box = buy.getBoundingClientRect();
    const x = Math.round(box.left + box.width / 2);
    let opened = false;
    // Up from the house, a few pixels at a time, the way a hand moves -- and
    // crossing into a row has to *say* so. A synthetic pointermove raises no
    // enter and no leave of its own, and a row opens its list on being entered,
    // so a walk that only moves is a walk that can never trip the thing this is
    // looking for.
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
      // The rule, stated directly rather than as a row count: whatever the
      // cursor crosses first coming in off the yard must not be the door
      // through to the settlement, because that one opens on hover and would
      // throw the sheet open sideways on every walk up to the block. The board
      // used to be two rows, so "the last one is `house`" said the same thing;
      // it carries the crew's gear now and the count no longer describes it.
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
    // eighteen pixels under it: the house board sits deeper since the bar rode
    // the rising roof, and the ground that far below it is the bench's own
    // stand -- where a station under the pointer takes the board every time, by
    // design ("an arrival, not a journey", input.js). The wedge protects the
    // crossing between a board and its list, not a stroll over the neighbors.
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
    // A board row that has something to say now says it in its own line under
    // the row, not in a sheet that opens on hover -- so the menu reads without a
    // mouse and without waiting. The crew submenu is the one exception (a roster
    // of a dozen bodies keeps the hover; see shop.js), and this is a board.
    newRun();
    await settle();
    window.__crew(4, 2);
    window.__give(40000);
    window.__grant({ shards: 400, spores: 1300, cores: 9 });
    // The ground up, so the rows that carry a note are on the bench: the tower
    // is one of them and it is the last thing the chain offers now.
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

  ['the submenu finds room however narrow the window is', async () => {
    newRun();
    await settle();
    window.__crew(3, 2);
    run(60);
    await hoverHouse();
    await openCrewList();
    await sleep(80);
    const panel = document.getElementById('panel');
    const list = document.getElementById('crewlist');
    const wide = list.getBoundingClientRect().width;

    // What is checked here is the *decision*, not the layout.
    //
    // `asScreen` tells the game the window is a different size; it cannot tell
    // the browser, so the real CSS goes on laying the panel out for the window
    // that is actually there. A check that measured rectangles under a pretend
    // window would pass whatever the stylesheet said -- which it did, happily,
    // with the shrinking that caused the bug still in place. So this asks which
    // side the game decided on, which is the part that is ours.
    const seatIn = async (w, h) => {
      let out = '';
      await asScreen(w, h, 1, async () => {
        window.__placeBoard();
        await sleep(40);
        out = panel.classList.contains('stack') ? 'stacked'
            : panel.classList.contains('flip') ? 'flipped' : 'beside';
      });
      return out;
    };
    const roomy = await seatIn(1800, 900);
    const tight = await seatIn(520, 800);
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(wide > 60, 'the list opens with something on it', `${Math.round(wide)}px`),
      ok(roomy === 'beside', 'and stands beside the board when there is room',
         roomy),
      ok(tight === 'stacked', 'and on a line of its own when there is not', tight)
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
      ok(/on the way|building|nobody on it/.test(said),
         'and the row says what the yard is doing about it', said || 'nothing'),
      ok(Math.abs(fit.h - fit.realH) < 2 && Math.abs(fit.w - fit.realW) < 2,
         'and the board is seated by the size it is now, not the size it was',
         `seated ${fit.w}x${fit.h}, really ${fit.realW}x${fit.realH}`),
      ok(r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
         'so it is still inside the window', JSON.stringify(r))
    ];
  }],
];
