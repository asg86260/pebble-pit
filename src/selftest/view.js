// The view: where the game opens, what a screen fits, and the ways it is
// dragged about.

import { sleep, state, ok, canvas, board, panel, point, onScreen, haveBench, hoverBench,
  hoverStation, run, runUntil, buy, asScreen, finger, touch, newRun, settle, haveRock } from './kit.js';

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
      // A narrow window does not show the bench, and must not: the rock wins.
      ok(deskShowsBench, 'a desk-sized window opens on the bench as well'),
      // it does not have to fit every window, but it has to fit a desk
      ok(deskFits, 'a desk-sized window shows the rock and the pit lip at once')
    ];
  }],

  ['a shard is swept up and thrown like anything else', async () => {
    window.__crew(0, 0);
    window.__clearFloor();
    // A hole worth throwing at: aiming into a fresh pit is a check about
    // marksmanship, and this one is about what the grain counts as when it
    // lands.
    window.__dig();
    run(0.5);
    const s0 = state();
    // The strip in front of the rock, so the shard and the lip of the pit are
    // in one window and the release point is on the screen.
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

  ['your pick and a rockhand bite are bought apart', async () => {
    // A fresh game has no bench and no hut, and this check is about pressing
    // a row on each, so it raises both itself.
    newRun();
    await settle(0.5);
    await haveBench();
    window.__crew(1, 0);
    // every rung above the first tier is priced in its own coin *and* in dust
    window.__grant({ shards: 200, spores: 200 });
    window.__give(4000);
    // Two rows on two boards: the gang's bite at their hut, your own pick on
    // the bench. Standing at each in turn is how a player buys them.
    window.__shack();
    await hoverStation('shack');
    const before = state();
    // `buy` reads the bench, so the bite is pressed where it is.
    const bite = document.querySelector('#shackshop button[data-key="rockhandpick"]');
    const gotBite = !!bite && !bite.disabled;
    if (gotBite) { bite.click(); window.__finish(); await sleep(150); }
    const mid = state();
    await hoverBench();
    // Your pick waits on the swing being automatic (rows-bench.js), so the
    // switch is bought first.
    await buy('auto');
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

  ['a small window shows less, not smaller', async () => {
    const checks = [];
    const zoomWas = state().zoom;               // whatever the game is drawn at
    for (const [w, h, dpr, name] of [[390, 844, 3, 'portrait'], [844, 390, 3, 'landscape'],
                                     [412, 915, 2.6, 'android'], [768, 1024, 2, 'tablet']]) {
      await asScreen(w, h, dpr, () => {
        // Where a phone OPENS: a resize keeps the camera where it was, so
        // without this the view is whatever the last group scrolled to.
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

  ['one finger on the yard never scrolls it: it sweeps on dust and taps on the rest', async () => {
    // Scrolling on a phone is the grab bar's alone (DESIGN.md, "Momentum
    // scrolling"): a finger dragged across the sky moves nothing, so a long
    // sweep toward the pit cannot turn into a scroll halfway. The canvas
    // refuses the platform's pan outright (touch-action), so the touch is
    // never taken from the game, and a finger on dust sweeps as ever.
    const drag = async (x, y, dx) => {
      const said = touch('touchstart', canvas(), x, y);
      finger('pointerdown', 1, x, y);
      for (let i = 1; i <= 8; i++) { finger('pointermove', 1, x + dx * i / 8, y); await sleep(16); }
      const mid = state();
      finger('pointerup', 1, x + dx, y);
      touch('touchend', canvas(), x + dx, y);
      await sleep(50);
      return { said, mid };
    };
    // No scene on: a press while one runs skips it and does nothing else.
    window.__nocine(); run(0.5);
    // the sky: nothing is ever lying in it
    const s0 = state();
    const skyY = (s0.groundY - 300 - s0.camY) * s0.zoom;
    const before = state();
    const sky = await drag(400, skyY, -120);
    const panned = state();
    // a tap is a tap: the view does not move under a finger inside the slop
    finger('pointerdown', 1, 400, skyY); await sleep(30); finger('pointerup', 1, 404, skyY);
    await sleep(50);
    const tapped = state();
    // the dust: mine some off the rock and let it land, then find a spot the
    // brush would take something from and drag there instead
    await haveRock();
    const b = state();
    const [rx, ry] = [(b.rockX - b.camX) * b.zoom, (b.rockY - b.camY) * b.zoom];
    for (let i = 0; i < 12; i++) { point('pointerdown', rx, ry); point('pointerup', rx, ry); run(0.05); }
    runUntil(() => state().chips === 0, 20);
    const d = state();
    // beside the rock, not under it: a press on the rock is a swing
    let spot = null;
    for (let off = d.rockW / 2 + 18; off <= d.rockW * 2 && !spot; off += 6)
      for (const wx of [d.rockX - off, d.rockX + off])
        if (!spot && [-6, 0, 6].every(k => window.__dustUnder(wx + k, d.groundY - 6) &&
                                          window.__dustUnder(wx, d.groundY - 6 + k))) spot = wx;
    let dust = null, swept = null, stayed = null;
    if (spot != null) {
      window.__nocine();
      window.__look(d.camX);
      const from = state();
      dust = await drag((spot - from.camX) * from.zoom, (d.groundY - 6 - from.camY) * from.zoom, -60);
      swept = dust.mid.dragging && (state().held > from.held || state().floor < from.floor);
      stayed = dust.mid.camX === from.camX;
    }
    return [
      ok(getComputedStyle(canvas()).touchAction === 'none', 'the platform is refused the yard outright',
         getComputedStyle(canvas()).touchAction),
      ok(sky.said === false && panned.camX === before.camX, 'a finger dragged across the sky moves nothing',
         `${before.camX} -> ${panned.camX}`),
      ok(!panned.dragging && panned.held === before.held, 'and sweeps nothing up'),
      ok(tapped.camX === panned.camX, 'a tap does not move it', `${panned.camX} -> ${tapped.camX}`),
      ok(spot != null, 'there is dust on the floor to press on'),
      ok(swept === true, 'a finger on the dust sweeps, as it always did',
         dust && `dragging ${dust.mid.dragging} held ${dust.mid.held}`),
      ok(stayed === true, 'and does not drag the view', dust && `cam ${dust.mid.camX}`)
    ];
  }],

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
    // and nothing after the button is up
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
    // Start from closed. The far corner of the window rather than the near
    // one: a board holds itself open over the whole wedge between it and its
    // station, and the top-left of the screen is somewhere that wedge reaches.
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
        // The window is not really this size, so read what placeBoard wrote
        // rather than where the browser drew it. The board is pinned to the
        // foot of the window, so the transform carries how far its bottom
        // edge stands *above* that foot (`place`).
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
