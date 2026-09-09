// The keyboard and the cursor: holding the yard still, and what a shape says a
// press will do.
//
// 3 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, ok, canvas, panel, point, hoverAway, run,
         runUntil, haveBench } from './kit.js';

export const TESTS = [
  // Space stops the clock. Not a flag every system checks -- the clock simply
  // does not advance, so nothing in the yard can tell the difference.
  ['space holds the whole yard still', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(20);
    const before = state();
    dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    const held = state();
    // read now, not at the end: by then the test has pressed resume
    const sheetUp = !document.getElementById('held').hidden;
    run(30);
    const still = state();
    document.getElementById('resume').click();
    const sheetGone = document.getElementById('held').hidden;
    run(20);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(held.paused && sheetUp,
         'space holds it, and says so in the middle of the window',
         `${held.paused}, ${sheetUp}`),
      ok(still.workerPos.join() === held.workerPos.join(),
         'and nobody moves a pixel while it is held'),
      ok(!after.paused && sheetGone, 'and the resume button lets it go again',
         `${after.paused}, ${sheetGone}`),
      ok(after.workerPos.join() !== still.workerPos.join(),
         'and everybody carries on from exactly where they stopped')
    ];
  }],

  // The board opens because the cursor is at a station and it stands above that
  // station, so getting to it means crossing bare canvas that is neither. Aim
  // for a row in the far corner of the sheet and the diagonal used to take you
  // out of the station's patch of ground before it took you into the board.
  ['the board does not shut on the way to it', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__give(400);
    run(2);
    // The bench is built rather than delivered now (raise.js), and this check is
    // about walking up to one: the dust alone only puts the call up.
    await haveBench();
    const panel = document.getElementById('panel');
    // looking at the bench, which is where you are when you walk up to it: the
    // board is clamped inside the window and the station is not, so a station
    // scrolled off the side is a different geometry entirely
    window.__look(state().benchX - 200);
    run(0.2);
    const s = state();
    const move = (cx, cy) => { point('pointermove', cx, cy, 0); return state().boardOpen; };

    const bx = (s.benchX + 20 - s.camX) * s.zoom, by = (s.groundY - 30 - s.camY) * s.zoom;
    const opened = move(bx, by);
    const r = panel.getBoundingClientRect();

    // the whole diagonal from the station to the far bottom corner of the sheet
    const far = { x: r.x + r.width - 6, y: r.y + r.height - 6 };
    let heldOn = true;
    for (let i = 1; i <= 12; i++) {
      const k = i / 12;
      if (!move(bx + (far.x - bx) * k, by + (far.y - by) * k)) heldOn = false;
    }
    const corner = state().boardOpen;

    // and it still shuts when you actually walk away -- after a moment. The board
    // holds its place briefly when the pointer leaves a station (see LINGER in
    // board.js), so that crossing the bare ground to the next station along is
    // one movement rather than a close and an open. Walking off is the same
    // gesture with nowhere at the end of it, so the answer arrives a tenth of a
    // second later than it used to.
    const leave = async (cx, cy) => {
      point('pointermove', cx, cy, 0);
      await sleep(220);
      return state().boardOpen;
    };
    move(bx, by);
    const aside = await leave(r.x + r.width + 400, by);
    move(bx, by);
    // Below the *panel*, not a pinned distance below the bench: the board has
    // grown rows since this probe was written, and 200px down landed on the
    // sheet itself -- where holding open is the rule, not the failure.
    const below = await leave(bx, Math.max(by + 200, r.y + r.height + 40));
    move(s.W - 4, 4);                           // and out of the way for the next check
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(opened, 'standing at the bench opens it'),
      ok(heldOn, 'and every step of the way to its far corner keeps it open'),
      ok(corner, 'including the corner itself'),
      ok(!aside, 'well off to one side still shuts it',
         `panel ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} ` +
         `bench ${Math.round(bx)},${Math.round(by)} probe ${Math.round(r.x + r.width + 400)}`),
      ok(!below, 'and so does walking off below it')
    ];
  }],

  // The yard is one canvas, so nothing drawn in it carries a cursor of its own
  // the way a button on a page does. Half the things on screen do something when
  // you click them, and without this none of them say so.
  ['the cursor says what a thing will do', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__give(400);
    run(2);
    await haveBench();            // a place with a board on it has to be built first
    const canvasEl = canvas();
    const at = (wx, wy) => {
      const s = state();
      point('pointermove', (wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom, 0);
      return canvasEl.style.cursor;
    };
    const s0 = state();
    const r = s0.roster.find(x => x.job === 'rockhands');
    // Below the ground line and well clear of everything: the sky is where the
    // birds are, and a bird under the cursor is a thing you can click.
    const sky = at(s0.rockX - 900, s0.groundY + 300);
    const rock = at(s0.rockX, s0.rockY);
    const bench = at(s0.benchX + 20, s0.groundY - 30);
    const minus = at(r.less[0], r.less[1]);

    // A loose core is the one thing in this yard you pick up yourself -- and it
    // takes a rock that has one in it, which the first four do not.
    window.__jump(5);
    window.__next();
    // Until there is one, not for three seconds and a hope. Building the bench
    // above turns the clock twenty seconds further than this check used to, and
    // a fixed wait after that landed either side of the core coming free -- the
    // rock is a fact about the game, so wait for the fact.
    runUntil(() => !!state().coreItem, 30);
    const k = state().coreItem;
    const core = k ? at(k.x + 9, k.y + 9) : null;

    // and a mark that would tell you why something has stopped
    window.__give(100000);
    run(2);
    const full = state();
    const warn = at(full.pitX - 30, full.groundY - 42);
    window.__crew(0, 0);
    newRun();
    await sleep(300);
    return [
      ok(sky === 'crosshair' && rock === 'crosshair',
         'the ground state is aiming at a rock', `${sky} / ${rock}`),
      ok(bench === 'pointer', 'a place with a board on it is a thing to open', bench),
      ok(minus === 'pointer', 'and so are the counts under a station', minus),
      // and the target is a good deal bigger than the mark you aim at: the mark
      // is a bar in a slot four cells square, and there is no box round it to
      // say where the edge is, so the edge is generous instead
      ok(r.hitW >= 36 && r.hitH >= 48, 'with a target well past the mark itself',
         `${r.hitW}x${r.hitH} for an 18x2 mark`),
      ok(at(r.less[0], r.less[1] - 16) === 'pointer' &&
         at(r.less[0] - 16, r.less[1]) === 'pointer',
         'so a near miss still lands on it'),
      ok(at((r.less[0] + r.more[0]) / 2, r.less[1]) !== 'pointer',
         'and the count between them is still not a button'),
      ok(core === 'grab', 'a loose core is a thing to pick up', `${core}`),
      // The hole used to carry a pile-full mark and a help cursor to go with
      // it. It cannot stop anything now -- the first grain it refuses tears
      // the rift -- so there is no mark, no question, and the spot is plain
      // aim like the rest of the ground. The stations still carry their marks,
      // and the stations group hovers one for the tooltip half of this rule.
      ok(warn === 'crosshair',
         'and the hole, which cannot stop any more, is not a thing to ask', warn)
    ];
  }],
];
