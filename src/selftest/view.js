// The view: where the game opens, what a screen fits, and the ways it is
// dragged about.
//
// 9 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, state, ok, canvas, board, panel, point, onScreen, haveBench, hoverBench,
  hoverStation, run, buy, asScreen, finger, newRun, settle } from './kit.js';

export const TESTS = [
  ['the opening view is looking at the rock', async () => {
    window.__jump(12);
    await sleep(300);
    const s = state();
    const left = (s.rockX - s.rockW / 2 - s.camX) * s.zoom;
    const right = (s.rockX + s.rockW / 2 - s.camX) * s.zoom;
    let deskFits = false, deskShowsBench = false;
    await asScreen(1440, 900, 1, () => {
      const d = state();
      deskFits = (d.rockX - d.rockW / 2 - d.camX) * d.zoom >= 0 &&
                 (d.pitX - d.camX) * d.zoom < 1440;
      deskShowsBench = d.benchX >= d.openCamX;
    });
    window.__jump(1);
    return [
      ok(left >= 0, 'the last rock is not cut off on the left', `${Math.round(left)}px in`),
      ok(right < innerWidth, 'and you can see the whole of it',
         `ends at ${Math.round(right)} of ${innerWidth}`),
      // The bench and the shacks stand off the rock's far flank, and a window
      // with the room for them opens wide enough to show them. A narrow one
      // does not, and must not: the rock wins every time.
      ok(deskShowsBench, 'a desk-sized window opens on the bench as well'),
      // it no longer has to fit every window, but it has to fit a desk
      ok(deskFits, 'a desk-sized window shows the rock and the pit lip at once')
    ];
  }],

  // A shard is a grain of dust as far as the ground and the hand are concerned:
  // it is swept up with everything else, rides the cursor, and is thrown the
  // same way. It costs carrying room, because it is one grain of your load.
  ['a shard is swept up and thrown like anything else', async () => {
    window.__crew(0, 0);
    window.__clearFloor();
    // A hole worth throwing at. A scrape is 150 across and a thrown grain
    // carries most of a window: aiming one into a fresh pit is a check about
    // marksmanship, and this one is about what the grain counts as when it
    // lands.
    window.__dig();
    run(0.5);
    const s0 = state();
    // The strip in front of the rock, because the throw has to be watched as
    // well as the sweep: a shard dropped at the far end of the yard is a shard
    // and the lip of the pit in two different windows, and the release point
    // would be off the side of the screen -- which is a throw nobody could make
    // and not what this check is about.
    const p = s0.piles.find(q => q.key === 'rock');
    window.__toss('shard', p.from + 60);
    run(3);
    const lying = state();
    const mine = lying.findAll.map(t => t.split(',').map(Number))
                              .filter(a => a[0] > p.from && a[0] < p.to);

    const [sx, sy] = onScreen(mine[0][0], s0.groundY - mine[0][1]);
    point('pointerdown', sx, sy);
    for (let i = 0; i < 4; i++) { point('pointermove', sx, sy); await sleep(20); }
    const inHand = state();

    const [px, py] = onScreen(s0.pitX + 40, s0.groundY - 120);
    for (let i = 1; i <= 6; i++) {
      point('pointermove', sx + (px - sx) * i / 6, sy + (py - sy) * i / 6);
      await sleep(16);
    }
    point('pointerup', px, py);
    run(4);
    const after = state();
    return [
      ok(mine.length === 1, 'a shard is lying there to start with'),
      ok(inHand.held > 0, 'sweeping over it lifts it like any other grain',
         `${inHand.held} in hand`),
      ok(after.shards > lying.shards, 'and thrown into the pit it counts as a shard',
         `${lying.shards} -> ${after.shards}`)
    ];
  }],

  // Your pick and a rockhand's are two different tools. One row that bought both
  // was doing two jobs, and it sat under `you` while half of it was on the rock.
  ['your pick and a rockhand bite are bought apart', async () => {
    // Its own yard, whatever ran before it. The runner starts every group from
    // a fresh game, but a fresh game has no bench and no hut, and this check is
    // about pressing a row on each: it raises both itself rather than trusting
    // whichever neighbor it shares a shard with to have left them standing.
    newRun();
    await settle(0.5);
    await haveBench();
    window.__crew(1, 0);
    // Yours is cut stone and theirs is what they are fed on: no core buys a
    // rate any more, they open places. And dust with it -- every rung above the
    // first tier is priced in its own coin *and* in dust, so that the rock never
    // stops being worth digging. See "The ladder" in DESIGN.md.
    window.__grant({ shards: 200, spores: 200 });
    window.__give(4000);
    // Two rows on two boards, and that is the point of the check now. The gang's
    // bite is sold at their hut -- everything about the rock moved onto that
    // sheet -- and your own pick is still yours, on the bench. Standing at each
    // in turn is how a player buys them, and it is the part that would have gone
    // unnoticed if this had gone on pressing both from one board.
    window.__shack();
    await hoverStation('shack');
    const before = state();
    // The bite is on the hut's sheet, not the bench's, so `buy` -- which reads
    // the bench -- cannot press it. Pressed where it is, the way it is bought.
    const bite = document.querySelector('#shackshop button[data-key="rockhandpick"]');
    const gotBite = !!bite && !bite.disabled;
    if (gotBite) { bite.click(); window.__finish(); await sleep(150); }
    const mid = state();
    await hoverBench();
    const gotPick = await buy('pick');
    const after = state();
    window.__crew(0, 0);
    return [
      ok(gotBite, 'the rock has a bite row of its own'),
      ok(mid.rockhandPickLevel === before.rockhandPickLevel + 1, 'buying it moves the rockhands',
         `${before.rockhandPickLevel} -> ${mid.rockhandPickLevel}`),
      ok(mid.pickLevel === before.pickLevel, 'and leaves your own pick alone',
         `${before.pickLevel} -> ${mid.pickLevel}`),
      ok(gotPick && after.pickLevel === mid.pickLevel + 1, 'your pick still buys your own swing',
         `${mid.pickLevel} -> ${after.pickLevel}`),
      ok(after.rockhandPickLevel === mid.rockhandPickLevel, 'and not theirs',
         `${mid.rockhandPickLevel} -> ${after.rockhandPickLevel}`)
    ];
  }],

  ['a cell is a whole number of device pixels', async () => {
    const checks = [];
    for (const [w, h, dpr] of [[2560, 1300, 1], [1440, 900, 2], [390, 844, 3], [412, 915, 2.6]]) {
      await asScreen(w, h, dpr, () => {
        const s = state();
        const cell = s.cellDevicePx;
        checks.push(ok(Math.abs(cell - Math.round(cell)) < 1e-6,
          `${w}x${h} at ${dpr}x lands on whole device pixels`, `${cell} device px a cell`));
      });
    }
    return checks;
  }],

  // The picture never shrinks to fit. A cell is a cell whatever you are looking
  // at this on, so a narrow window shows less of the yard rather than a smaller
  // one: what a small screen owes you is the rock and somewhere to put the dust,
  // not the whole works at once.
  ['a small window shows less, not smaller', async () => {
    const checks = [];
    const zoomWas = state().zoom;               // whatever the game is drawn at
    for (const [w, h, dpr, name] of [[390, 844, 3, 'portrait'], [844, 390, 3, 'landscape'],
                                     [412, 915, 2.6, 'android'], [768, 1024, 2, 'tablet']]) {
      await asScreen(w, h, dpr, () => {
        // Where a phone OPENS, which is what the check is about. A resize keeps
        // the camera where it was, so without this the view was whatever the
        // last group had scrolled to, narrowed -- and it read the rock in shot
        // for exactly as long as that happened to be true.
        window.__look(state().openCamX);
        const s = state();
        const rockLeft = (s.rockX - s.rockW / 2 - s.camX) * s.zoom;
        const rockRight = (s.rockX + s.rockW / 2 - s.camX) * s.zoom;
        checks.push(ok(Math.abs(s.zoom - zoomWas) < 1e-9,
          `${name} draws at the same size as everywhere else`, `zoom ${s.zoom}`));
        checks.push(ok(rockRight > 0 && rockLeft < w, `${name} is looking at the rock`,
          `rock ${Math.round(rockLeft)}..${Math.round(rockRight)} of ${w}`));
      });
    }
    return checks;
  }],

  ['two fingers drag the view', async () => {
    const before = state();
    finger('pointerdown', 1, 300, 300);
    finger('pointerdown', 2, 400, 300);
    for (let i = 1; i <= 8; i++) {
      finger('pointermove', 1, 300 - i * 12, 300);
      finger('pointermove', 2, 400 - i * 12, 300);
      await sleep(16);
    }
    finger('pointerup', 1, 204, 300);
    finger('pointerup', 2, 304, 300);
    await sleep(100);
    const after = state();
    return [
      ok(after.camX > before.camX, 'the view moves with the fingers',
         `${before.camX} -> ${after.camX}`),
      ok(!after.dragging, 'and it is not left mid-sweep'),
      ok(after.held === before.held, 'a pan does not sweep dust up',
         `${before.held} -> ${after.held}`)
    ];
  }],

  // What the two fingers are on a desk. A mouse has no second finger, and the
  // yard is wider than any window it is looked at through, so without this the
  // only ways along it are the wheel and walking somebody there.
  ['the middle button drags the view', async () => {
    const mouse = (type, x, button) =>
      canvas().dispatchEvent(new PointerEvent(type, {
        clientX: x, clientY: 300, pointerId: 9, isPrimary: true, pointerType: 'mouse',
        button, buttons: type === 'pointerup' ? 0 : 4, bubbles: true, cancelable: true
      }));
    const before = state();
    mouse('pointerdown', 600, 1);
    for (let i = 1; i <= 8; i++) { mouse('pointermove', 600 - i * 20, 1); await sleep(16); }
    const dragged = state();
    mouse('pointerup', 440, 1);
    await sleep(50);
    // and nothing after the button is up: a view that kept sliding with the
    // pointer afterwards would be a yard you could not stop looking at
    mouse('pointermove', 900, 0);
    await sleep(50);
    const after = state();
    return [
      ok(dragged.camX > before.camX, 'the view moves with the button held',
         `${before.camX} -> ${dragged.camX}`),
      ok(after.camX === dragged.camX, 'and stops the moment it is let go',
         `${dragged.camX} -> ${after.camX}`),
      ok(!after.dragging && after.held === before.held,
         'and it is a look around rather than a sweep',
         `${before.held} -> ${after.held}`)
    ];
  }],

  ['a tap opens the board, because there is no hovering', async () => {
    // Start from closed, whatever an earlier check left behind. The far corner
    // of the window rather than the near one: a board holds itself open over the
    // whole wedge between it and its station now, and the top-left of the screen
    // is somewhere that wedge can reach.
    const away = state();
    canvas().dispatchEvent(new PointerEvent('pointermove', {
      clientX: away.W - 4, clientY: away.H - 4,
      pointerId: 1, isPrimary: true, buttons: 0, bubbles: true }));
    await sleep(150);
    const startedClosed = board().hidden;

    await haveBench();
    const s = state();
    const at = (wx, wy) => [(wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom];

    const [bx, by] = at(s.benchX + 20, s.groundY - 24);
    finger('pointerdown', 9, bx, by); await sleep(40); finger('pointerup', 9, bx, by);
    await sleep(150);
    const opened = !board().hidden;

    const [ax, ay] = at(s.benchX + 420, s.groundY - 200);
    finger('pointerdown', 9, ax, ay); await sleep(40); finger('pointerup', 9, ax, ay);
    await sleep(150);
    const closed = board().hidden;

    return [
      ok(startedClosed, 'the board is out of the way to begin with'),
      ok(opened, 'a tap on the bench opens it'),
      ok(closed, 'a tap away puts it back')
    ];
  }],

  ['the board stays on screen, however small it is', async () => {
    await haveBench();
    window.__crew(4, 3);                     // every row showing: the tallest it gets
    await sleep(250);
    const checks = [];
    for (const [w, h, dpr, name] of [[390, 844, 3, 'portrait'], [844, 390, 3, 'landscape'],
                                     [320, 568, 2, 'a small old phone']]) {
      await asScreen(w, h, dpr, async () => {
        const el = panel();
        el.hidden = false;
        board().hidden = false;
        window.__placeBoard();
        await sleep(60);
        // the window is not really this size, so read what placeBoard wrote
        // rather than where the browser drew it.
        //
        // The board is pinned to the foot of the window and moved from there, so
        // what the transform carries is how far its bottom edge stands *above*
        // that foot -- see `place`. It used to be the top corner, which is the
        // one number about a board that changes the instant its contents do.
        const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(el.style.transform) || [0, 0, 0];
        const left = +m[1], bottom = -(+m[2]);
        // the board's own size comes from CSS, which follows the real window and
        // not the pretend one, so only require it to be tucked in where it fits
        const bw = el.offsetWidth, bh = el.offsetHeight;
        const room = bw <= w && bh <= h;
        checks.push(ok(left >= 0 && bottom >= 0 &&
                       (!room || (left + bw <= w + 1 && bottom + bh <= h + 1)),
          `${name} keeps the whole board inside the window`,
          `${Math.round(left)}+${bw} wide, ${Math.round(bottom)}+${bh} tall, in ${w}x${h}`));
        el.hidden = true;
      });
    }
    window.__crew(0, 0);
    return checks;
  }],
];
