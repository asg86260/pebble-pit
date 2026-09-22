// The house board and the crew window opened off it.

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
    const row = document.querySelector('#crewlistrows button[data-key^="who"]');
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

  ['picking a name takes the view to them and closes the window', async () => {
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
      ok(before.modal === 'crew' && after.modal === null, 'picking one closes the window',
         `${before.modal} -> ${after.modal}`),
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
      if (state().modal) opened = true;
    }
    const arrived = state();
    window.__board(null);
    window.__crew(0, 0);
    return [
      // The door opens on a press, so crossing any row on the way in, the
      // door included, puts nothing up.
      ok(rows.length > 0, 'there are rows to walk through', rows.map(r => r.dataset.key).join(' then ')),
      ok(!opened, 'and reaching them never puts the settlement up'),
      ok(arrived.houseBoardOpen, 'and the board is still there when you get there')
    ];
  }],

  ['hovering a name does not close the window it is in', async () => {
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
      if (state().modal !== 'crew') stayed = false;
    }
    const at = state();
    window.__window(null);
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(rows.length >= 4, 'there are names on the sheet', `${rows.length}`),
      ok(stayed && at.modal === 'crew', 'and hovering one leaves the window up', `${at.modal}`)
    ];
  }],

  ['a row wears its description inline, not on a hover', async () => {
    // The crew window is the one exception (a roster of a dozen bodies keeps
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

  // The window stands in the middle of the glass over a wash of its own, the
  // yard keeps running under it, and it goes three ways: the cross, escape,
  // and a press on the wash. The pointer wandering off is not one of them.
  ['the crew opens in a window, and it closes three ways', async () => {
    newRun();
    await settle();
    window.__crew(3, 2);
    run(30);
    await hoverHouse();
    const win = document.getElementById('modal');
    const wash = document.getElementById('modalwash');
    const opened = [];
    const openIt = async () => {
      window.__board('house');
      await sleep(120);
      await openCrewList();
      await sleep(260);                          // past the fade in
      const r = win.getBoundingClientRect();
      opened.push(state().modal === 'crew' && !win.hidden && !wash.hidden);
      return r;
    };
    const r = await openIt();
    const mid = Math.abs((r.left + r.right) / 2 - innerWidth / 2) < 2 && Math.abs((r.top + r.bottom) / 2 - innerHeight / 2) < 2;
    const inside = r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
    // the yard under it is not held: a window is for reading a live yard
    const ran = !state().paused;
    // the pointer off to the corner, as a hand leaving the list would
    point('pointermove', 4, 4, 0);
    await sleep(250);
    const stayed = state().modal === 'crew';

    document.getElementById('modalclose').click();
    await sleep(40);
    const byCross = state().modal === null;
    await openIt();
    dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await sleep(40);
    const byKey = state().modal === null && !state().paused;
    await openIt();
    const wr = wash.getBoundingClientRect();
    wash.dispatchEvent(new PointerEvent('pointerdown', { clientX: wr.left + 6, clientY: wr.top + 6, bubbles: true, isPrimary: true }));
    wash.dispatchEvent(new PointerEvent('pointerup', { clientX: wr.left + 6, clientY: wr.top + 6, bubbles: true, isPrimary: true }));
    wash.click();
    await sleep(40);
    const byWash = state().modal === null;
    await sleep(260);
    const gone = win.hidden && wash.hidden;
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(opened.every(Boolean) && opened.length === 3, 'pressing the door opens the window over its wash', opened.join(',')),
      ok(mid && inside, 'in the middle of the glass, and inside it',
         `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} in ${innerWidth}x${innerHeight}`),
      ok(ran, 'and the yard is not held under it'),
      ok(stayed, 'the pointer wandering off leaves it up'),
      ok(byCross, 'the cross closes it'),
      ok(byKey, 'so does escape, without holding the yard'),
      ok(byWash, 'and so does a press on the wash'),
      ok(gone, 'and gone, it is hidden')
    ];
  }],

  ['the crew opens off the house board, in a window', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(60);
    await hoverHouse();
    const shut = state();
    const inlineNames = document.querySelectorAll('#crewshop [data-key^="who"]').length;
    await openCrewList();
    await sleep(260);
    const open = state();
    const win = document.getElementById('modal');
    const inWindow = win.contains(document.getElementById('crewlistrows'));
    window.__window(null);
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(shut.houseBoardOpen && !shut.modal,
         'standing at the house opens the board with the list still put away',
         `${shut.houseBoardOpen}, ${shut.modal}`),
      ok(inlineNames === 0 && shut.crewRows.length === 0,
         'so no names are sitting on the board itself', `${inlineNames} of them`),
      ok(!!shut.houseRow && /^another house/.test(shut.houseRow),
         'what is on it is the house you can put up', shut.houseRow),
      ok(!!shut.crewDoor && shut.crewDoor.includes('who lives here') &&
         shut.crewDoor.includes('4'),
         'and a row that leads to the people, saying how many there are',
         shut.crewDoor),
      ok(open.modal === 'crew' && inWindow,
         'pressing that row brings the people up in the window', `${open.modal}`),
      ok(open.crewRows.length === 4,
         'one row per body', `${open.crewRows.length} rows`),
      ok(open.crewRows.some(r => r.includes('on the rock')),
         'still saying where each of them is', JSON.stringify(open.crewRows))
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
