// The board as a sheet from the bottom (DESIGN.md, "Boards as bottom
// sheets"): under a coarse pointer the panel is the window's width with its
// top at SHEET_H, the handle drags it between its three stops, the purse
// lies inside it and the crew list opens as a page in it; and with the
// pointer fine again the desk's popover measures and seats exactly as it
// did. The pips on every board are boxes at a fixed pitch, so at a phone's
// width no two of them can land on each other.

import { sleep, state, ok, run, raf, haveBench, settle, asScreen, openCrewList, hoverStation, touch, tap } from './kit.js';
import { workOn } from '../works.js';
import { SHEET_H, SHEET_TALL, SHEET_MS, SHEET_RAIL_W, TWEEN_MAX_MS } from '../config.js';
import { S } from '../state.js';
import { sheetRail, sheetStop } from '../board.js';

// The list of rows inside the sheet, the thing that scrolls.
const list = () => panel().querySelector(':scope > .sheet:not(.flyout)');

// A finger on the list, pulled `dy` down over a few moves and lifted: the
// platform would scroll the list; the game takes the pull for the sheet only
// when the list is at its top.
async function pullList(dy) {
  const el = list();
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + 20;
  touch('touchstart', el, x, y, 6);
  let prevented = false;
  for (let i = 1; i <= 6; i++) { prevented = touch('touchmove', el, x, y + dy * i / 6, 6) || prevented; await raf(); }
  touch('touchend', el, x, y + dy, 6);
  await settled();
  return prevented;
}

const phone = on => window.__coarse(on ? true : null);
const panel = () => document.getElementById('panel');
const handle = () => document.getElementById('handle');
const frames = async n => { for (let i = 0; i < n; i++) { run(1 / 60); await raf(); } };
const settled = async () => { await sleep(SHEET_MS + 60); await frames(2); };

// The handle in hand: a press at its middle, moved `dy` down (up when
// negative) over a few moves, and let go.
async function dragHandle(dy, el = handle()) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const ev = (type, at, buttons = 1) => el.dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: at, pointerId: 5, isPrimary: true, pointerType: 'touch', button: 0, buttons, bubbles: true }));
  ev('pointerdown', y);
  for (let i = 1; i <= 6; i++) { ev('pointermove', y + dy * i / 6); await raf(); }
  ev('pointerup', y + dy, 0);
  await settled();
}

// A touch that begins somewhere and ends somewhere else, through the pointer
// events a finger raises: `from` and `to` are page points, and the events go
// to whatever stands at `from` (the platform's rule for a touch).
async function stroke(from, to) {
  const el = document.elementFromPoint(from.x, from.y);
  const ev = (type, x, y, buttons = 1) => el.dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: y, pointerId: 9, isPrimary: true, pointerType: 'touch', button: 0, buttons, bubbles: true, cancelable: true }));
  touch('touchstart', el, from.x, from.y, 9);
  ev('pointerdown', from.x, from.y);
  for (let i = 1; i <= 6; i++) { const x = from.x + (to.x - from.x) * i / 6, y = from.y + (to.y - from.y) * i / 6; touch('touchmove', el, x, y, 9); ev('pointermove', x, y); await raf(); }
  ev('pointerup', to.x, to.y, 0);
  touch('touchend', el, to.x, to.y, 9);
  await settled();
  return el;
}

const rect = () => panel().getBoundingClientRect();

// A finger on the handle that can be moved, held still and lifted, each move
// made in its own moment, so the speed the sheet reads off the last moves is
// the speed the check moved at: `dy` over `ms`, a step a frame or so.
function finger(el = handle()) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  let y = r.top + r.height / 2;
  const ev = (type, buttons = 1) => el.dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: y, pointerId: 11, isPrimary: true, pointerType: 'touch', button: 0, buttons, bubbles: true }));
  ev('pointerdown');
  return {
    async move(dy, ms) {
      const n = Math.max(3, Math.round(ms / 16)), y0 = y;
      for (let i = 1; i <= n; i++) { await sleep(ms / n); y = y0 + dy * i / n; ev('pointermove'); }
    },
    async up() { ev('pointerup', 0); await settled(); },
  };
}
// A flick: quick, lifted while still moving. A slow drag: slow, and the
// finger still a moment before it lifts, as a thumb that has placed the sheet.
const flick = async (dy, el) => { const f = finger(el); await f.move(dy, 48); await f.up(); };
const slow = async (dy, el) => { const f = finger(el); await f.move(dy, 800); await sleep(150); await f.up(); };
const shownNow = () => sheetStop()?.height ?? 0;
// How much shows at the seat; and the way down from tall to just past it.
const seatPx = () => Math.round(state().H * (1 - SHEET_H));
const pastSeat = () => Math.round(state().H * SHEET_TALL) - seatPx() + 30;

export const TESTS = [
  ['on a phone a board is a sheet from the bottom, dragged between three stops', async () => {
    window.__nocine();
    await haveBench();
    phone(true);
    window.__board('bench');
    await settled();
    const s = state();
    const r0 = rect();
    const fullWidth = Math.abs(r0.width - s.W) <= 2 && r0.left <= 1;
    // the box is the tall stop's, slid down: its top at the seat, its foot below the window
    const atSeat = Math.abs(r0.top - s.H * SHEET_H) <= 2 && r0.bottom >= s.H - 1;
    const grip = handle().querySelector('.grip').getBoundingClientRect();
    const gripOnTop = Math.abs((grip.left + grip.width / 2) - s.W / 2) <= 2 && grip.top - r0.top < 12;
    const purse = document.getElementById('purse').getBoundingClientRect();
    const purseInside = purse.top >= r0.top && purse.bottom <= r0.bottom && purse.left >= r0.left && purse.right <= r0.right;
    const named = handle().querySelector('.name').textContent.trim();
    // up past the seat: tall
    await dragHandle(-120);
    const r1 = rect();
    const tall = Math.abs(r1.height - s.H * SHEET_TALL) <= 2;
    // slowly down to just past the seat: back at the seat, not gone
    await slow(pastSeat());
    const r2 = rect();
    const backToSeat = !panel().hidden && Math.abs(r2.top - s.H * SHEET_H) <= 2;
    // and flicked down from the seat: gone
    await flick(120);
    const gone = panel().hidden;
    phone(false);
    await frames(2);
    return [
      ok(fullWidth, 'the sheet is the window\'s width', `${Math.round(r0.left)}+${Math.round(r0.width)} of ${s.W}`),
      ok(atSeat, 'with its top at SHEET_H of the window, standing on the foot', `top ${Math.round(r0.top)} vs ${Math.round(s.H * SHEET_H)}`),
      ok(gripOnTop, 'the grip centered on its top edge', `${Math.round(grip.left + grip.width / 2)} vs ${s.W / 2}`),
      ok(named === 'the bench', 'the board\'s name beside the grip', named),
      ok(purseInside, 'the purse lies inside it'),
      ok(tall, 'dragged up past its seat it is tall', `${Math.round(r1.height)} vs ${Math.round(s.H * SHEET_TALL)}`),
      ok(backToSeat, 'dragged slowly from tall to just past the seat it is back at the seat', `top ${Math.round(r2.top)}`),
      ok(gone, 'and flicked down from the seat it is gone'),
    ];
  }],

  ['let go, the sheet goes to the stop nearest where it would coast: a flick from tall closes, a slow drag past the seat stays', async () => {
    window.__nocine();
    await haveBench();
    phone(true);
    const reopen = async () => { window.__board(null); await settled(); window.__board('bench'); await settled(); };
    await reopen();
    const seatH = shownNow(), tallH = Math.round(state().H * SHEET_TALL);
    // a flick up from the seat: tall
    await flick(-80);
    const flickUp = { tall: !!sheetStop()?.tall, h: shownNow() };
    // slowly down from tall to just past the seat: the seat, not gone
    await slow(tallH - (seatH - 30));
    const slowPast = { hidden: panel().hidden, h: shownNow() };
    // a flick down from tall, shorter than the way to the seat: gone
    await reopen(); await flick(-80);
    await flick(150);
    const flickDown = panel().hidden;
    // slowly down from tall to nearly the foot: gone
    await reopen(); await flick(-80);
    await slow(tallH - 40);
    const nearFoot = panel().hidden;
    // up past tall: it follows less than the finger, and springs back
    await reopen(); await flick(-80);
    const f = finger();
    await f.move(-200, 400);
    const over = shownNow();
    await f.up();
    const back = shownNow();
    window.__board(null);
    phone(false);
    await frames(2);
    return [
      ok(flickUp.tall && Math.abs(flickUp.h - tallH) <= 2, 'a flick up from the seat is tall', `${flickUp.h} vs ${tallH}`),
      ok(!slowPast.hidden && Math.abs(slowPast.h - seatH) <= 2, 'a slow drag from tall to just past the seat settles at the seat', `hidden ${slowPast.hidden}, ${slowPast.h} vs ${seatH}`),
      ok(flickDown, 'a flick down from tall closes it'),
      ok(nearFoot, 'a slow drag from tall nearly to the foot closes it'),
      ok(over > tallH + 10 && over < tallH + 160, 'dragged up past tall it resists the finger', `${over} for 200 px past ${tallH}`),
      ok(Math.abs(back - tallH) <= 2, 'and springs back to tall', `${back}`),
    ];
  }],

  ['a gesture that begins on the sheet is the sheet\'s wherever it ends; a tap outside closes; a drag from the yard buys nothing', async () => {
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, dust: 90000 });
    run(0.5);
    phone(true);
    window.__board('bench');
    await settled();
    const el = list();
    const r = rect();
    // a scroll of the rows that lifts 200 px above the sheet: the list has
    // scrolled and the sheet is still up
    el.scrollTop = 0;
    const from = { x: r.left + r.width / 2, y: r.top + 80 };
    const startedOn = await stroke(from, { x: from.x, y: r.top - 200 });
    el.scrollTop = 60;                              // the platform's scroll, stood in for
    await frames(2);
    const stillUp = !panel().hidden && state().boardOpen;
    // a tap outside, on the yard above it, closes it
    const sky = { x: state().W / 2, y: r.top - 120 };
    await stroke(sky, sky);
    await frames(2);
    await sleep(300);
    const closed = panel().hidden || !state().boardOpen;
    // a drag that begins on the yard and ends on a row buys nothing
    window.__board('bench');
    await settled();
    const row = document.querySelector('#shop button.tile:not(:disabled):not(.off)');
    const rr = row.getBoundingClientRect();
    const had = state().stored;
    await stroke({ x: state().W / 2, y: rect().top - 120 }, { x: rr.left + rr.width / 2, y: rr.top + rr.height / 2 });
    await frames(2);
    const bought = state().stored < had || !!workOn(row.dataset.key);
    window.__board(null);
    phone(false);
    await frames(2);
    return [
      ok(startedOn && el.contains(startedOn), 'the scroll began on the rows'),
      ok(stillUp, 'and lifting the finger over the yard leaves the sheet up, the list scrolled'),
      ok(closed, 'a tap on the yard above it puts it away'),
      ok(!bought, 'a drag from the yard that ends on a row buys nothing', `${had} -> ${state().stored}`),
    ];
  }],

  ['the settings sheet is a sheet like the boards\': the same gesture reaches the same stops', async () => {
    window.__nocine();
    await haveBench();
    await settled();                  // a sheet the last check put away is all the way down
    phone(true);
    // The way in, read off the slide itself: the stylesheet's transition,
    // caught paused in the microtask after the write that starts it and
    // stepped through its own timeline, twenty steps from start to end. Read
    // a frame at a time off the page's clock instead, a slow frame skips half
    // the slide and the two sheets are compared on whichever frames each got.
    const yOf = el => { const m = getComputedStyle(el).transform.match(/matrix\(([^)]*)\)/); return m ? Math.round(+m[1].split(',')[5]) : 0; };
    const enterOf = async (el, open) => {
      let slide = null;
      const grab = () => {
        if (slide) return;
        slide = el.getAnimations().find(a => a.transitionProperty === 'transform') || null;
        slide?.pause();
      };
      const watch = new MutationObserver(grab);
      watch.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
      await open();
      grab();
      for (let i = 0; i < 30 && !slide; i++) await raf();   // the board's `open` comes a frame later
      watch.disconnect();
      if (!slide) return [];
      const end = slide.effect.getComputedTiming().endTime, ys = [];
      for (let i = 0; i <= 20; i++) { slide.currentTime = end * i / 20; ys.push(yOf(el)); }
      slide.finish();
      return ys;
    };
    const boardIn = await enterOf(panel(), () => window.__board('bench'));
    await settled();
    // the bench, dragged tall then back, and the transforms it lands on
    const tf = () => panel().style.transform;
    const seatBoard = tf();
    await dragHandle(-160);
    const tallBoard = tf();
    await slow(pastSeat());
    const backBoard = tf();
    window.__board(null);
    await settled();
    // the settings sheet, the very same gestures on its own handle
    const held = document.getElementById('held'), hh = document.getElementById('heldhandle');
    const heldIn = await enterOf(held, () => tap(document.getElementById('pause')));
    await sleep(SHEET_MS + 60);
    const seatHeld = held.style.transform;
    // the same way in: from below the foot -- the whole box off it -- up to
    // the seat, step for step
    const foot = Math.round(state().H * SHEET_TALL);
    const slid = boardIn.length === 21 && boardIn[0] === foot && boardIn[0] > boardIn[20];
    const same = slid && heldIn.length === 21 && boardIn.every((y, i) => Math.abs(y - heldIn[i]) <= 1);
    await dragHandle(-160, hh);
    const tallHeld = held.style.transform;
    await slow(pastSeat(), hh);
    const backHeld = held.style.transform;
    // and flicked down from the seat, it goes -- slid off, no fade
    await flick(120, hh);
    const gone = held.hidden && !state().paused;
    phone(false);
    await frames(2);
    return [
      ok(seatBoard === seatHeld, 'both sheets stand at the same seat', `${seatBoard} vs ${seatHeld}`),
      ok(tallBoard === tallHeld && tallBoard !== seatBoard, 'dragged up, both reach the same tall stop', `${tallBoard} vs ${tallHeld}`),
      ok(backBoard === backHeld && backBoard === seatBoard, 'and dragged slowly down past the seat, both come back to it', `${backBoard} vs ${backHeld}`),
      ok(gone, 'and from the seat the same flick puts the settings away'),
      ok(slid && same, 'and both come in the same way, from below the foot up to the seat, step for step',
         `board ${boardIn.join(' ')} | settings ${heldIn.join(' ')} (foot ${Math.round(state().H * SHEET_TALL)})`),
    ];
  }],

  ['the settings rows keep the desk\'s spacing on a phone', async () => {
    window.__nocine();
    const pitchOf = () => { const a = document.getElementById('motion').getBoundingClientRect(), b = document.getElementById('dark').getBoundingClientRect(); return b.top - a.top; };
    // the desk: escape holds, and the settings page
    phone(false);
    await frames(2);
    dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    document.getElementById('settingsbtn').click();
    await frames(2); await sleep(220);
    const desk = pitchOf();
    document.getElementById('resume').hidden = false;
    dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await frames(2); await sleep(220);
    // the phone: the pause button, then the settings page
    phone(true);
    await frames(2);
    await tap(document.getElementById('pause'));
    document.getElementById('settingsbtn').click();
    await frames(2); await sleep(SHEET_MS + 60);
    const phonePitch = pitchOf();
    const heldGap = getComputedStyle(document.getElementById('held')).rowGap;
    await flick(120, document.getElementById('heldhandle'));
    phone(false);
    await frames(2);
    return [
      ok(desk > 24, 'the desk keeps air between its rows', `${desk}px`),
      ok(Math.abs(phonePitch - desk) <= 1, 'and the phone\'s rows are pitched the same', `${phonePitch} vs ${desk} (gap ${heldGap})`),
    ];
  }],

  ['a coin along the sheet\'s top edge keeps its place when a count grows a digit', async () => {
    window.__nocine();
    await haveBench();
    window.__give(1005 - state().stored);
    window.__grant({ shards: 5, spores: 5 });          // more than one coin along the edge
    phone(true);
    window.__board('bench');
    await settled();
    // A count rolls to its value (tween.js), setting out on the first frame
    // that paints it, so it is read at rest: a painted frame, then the
    // longest roll there is on the game's clock. Read on the wall's clock it
    // was wherever the window's frame rate had got it to -- 914 on its way to
    // 1005 in a large window -- and the digits were the roll's, not the
    // purse's.
    const rest = async () => { await frames(1); run(TWEEN_MAX_MS / 1000); await frames(2); };
    await rest();
    const lefts = () => [...document.querySelectorAll('#purse .coin')].map(c => Math.round(c.getBoundingClientRect().left));
    const words = () => [...document.querySelectorAll('#purse .coin b')].map(b => b.textContent);
    const before = lefts(), said = words();
    // the carry rung costs twenty: a thousand becomes hundreds, one digit fewer
    await tap(document.querySelector('#shop button[data-key="carry"]'));
    await settle(1.5);
    await rest();
    const after = lefts(), saidAfter = words();
    window.__board(null);
    phone(false);
    return [
      ok(said[0] !== saidAfter[0] && said[0].length !== saidAfter[0].length, 'the dust count changed its digits', `${said[0]} -> ${saidAfter[0]}`),
      ok(before.length > 1 && before.join() === after.join(), 'and no coin moved', `${before.join(' ')} -> ${after.join(' ')}`),
    ];
  }],

  ['a scroll that reaches the top stops there; only a new touch from the top pulls the sheet', async () => {
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, dust: 90000 });
    run(0.5);
    phone(true);
    window.__board('bench');
    await settled();
    const el = list();
    el.scrollTop = 300;
    await raf();
    // one gesture: from 300 to the top and 150 px further
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + 30;
    touch('touchstart', el, x, y, 6);
    let took = false;
    for (let i = 1; i <= 6; i++) { el.scrollTop = Math.max(0, 300 - 75 * i); took = touch('touchmove', el, x, y + 75 * i, 6) || took; await raf(); }
    touch('touchend', el, x, y + 450, 6);
    await settled();
    const stayed = !panel().hidden && el.scrollTop === 0;
    const tf = panel().style.transform;
    // a second touch, begun with the list at its top, pulls the sheet
    const took2 = await pullList(seatPx() * 3 / 4);
    const gone = panel().hidden;
    phone(false);
    await frames(2);
    return [
      ok(!took && stayed, 'the one gesture scrolled the list to its top and left the sheet at its stop', `took ${took}, scrollTop ${el.scrollTop}, ${tf}`),
      ok(took2 && gone, 'a new touch from the top pulls it down and away', `took ${took2}, hidden ${gone}`),
    ];
  }],

  // A list that can scroll at all is the premise, and whether the shack's
  // rows outgrow the seat depends on the window: on a 900-high glass they fit.
  // So the window is stood short enough that the seat shows three quarters of
  // the rows as measured -- the phone held sideways -- whatever the screen.
  ['the list pulled down from its top pulls the sheet down; scrolled, it only scrolls', async () => {
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, dust: 90000 });
    run(0.5);
    phone(true);
    window.__board('shack');
    await settled();
    // the rows alone: the list's foot is padded by what the seat hides below the glass
    const rows = list().scrollHeight - parseFloat(getComputedStyle(list()).paddingBottom);
    const short = Math.round(rows * 3 / 4 / (1 - SHEET_H));
    const out = await asScreen(state().W, short, devicePixelRatio, async () => {
      await settled();
      const el = list();
      const overflows = el.scrollHeight > el.clientHeight + 1;
      const contain = getComputedStyle(el).overscrollBehaviorY;
      // scrolled a little: a pull is the list's, and the sheet stays
      el.scrollTop = 40;
      await raf();
      const took1 = await pullList(seatPx() * 3 / 4);
      const stayed = !panel().hidden;
      // back at the top: the same pull is the sheet's, through its stops
      el.scrollTop = 0;
      await raf();
      const took2 = await pullList(seatPx() * 3 / 4);
      const gone = panel().hidden;
      return { overflows, contain, took1, stayed, took2, gone };
    });
    const { overflows, contain, took1, stayed, took2, gone } = out;
    phone(false);
    await frames(2);
    return [
      ok(overflows, 'the shack board has more rows than the seat shows', `${Math.round(rows)} rows in a ${short} window`),
      ok(contain === 'contain', 'the list keeps its overscroll to itself', contain),
      ok(!took1 && stayed, 'pulled with the list scrolled, the sheet stays', `took ${took1}`),
      ok(took2 && gone, 'pulled from the very top, the sheet goes', `took ${took2}, hidden ${gone}`),
    ];
  }],

  ['the sheet draws its own scrollbar while the rows overflow, and none when they fit', async () => {
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, dust: 90000 });
    run(0.5);
    const out = { long: null, fits: null };
    await asScreen(390, 844, 3, async () => {
      phone(true);
      window.__board('bench');
      await settled();
      const el = list();
      const rail = sheetRail();
      out.long = { over: el.scrollHeight > el.clientHeight + 1, rail, share: el.clientHeight / el.scrollHeight,
                   inside: rail && rail.track.right <= rect().right + 1 && rail.track.top >= rect().top - 1 && rail.track.bottom <= rect().bottom + 1 };
      // scrolled to the foot, the thumb is at the foot
      el.scrollTop = el.scrollHeight;
      await frames(2);
      const r2 = sheetRail();
      out.long.atFoot = r2 && Math.abs(r2.thumb.bottom - r2.track.bottom) <= 2;
      // a board that fits: the books, one ledger, at the tall stop
      window.__board('stats');
      await settled();
      await dragHandle(-200);
      const el2 = list();
      out.fits = { over: el2.scrollHeight > el2.clientHeight + 1, rail: sheetRail() };
      window.__board(null);
      phone(false);
    });
    const ratio = out.long.rail ? out.long.rail.thumb.height / out.long.rail.track.height : 0;
    return [
      ok(out.long.over && !!out.long.rail, 'the bench overflows and wears a rail', `over ${out.long.over}`),
      ok(out.long.rail && Math.abs(ratio - out.long.share) * out.long.rail.track.height <= SHEET_RAIL_W,
         'the thumb is the viewport\'s share of the rows, within a cell', `${ratio.toFixed(3)} vs ${out.long.share.toFixed(3)}`),
      ok(!!out.long.inside, 'and stands inside the sheet'),
      ok(!!out.long.atFoot, 'scrolled to the foot, the thumb is at the foot'),
      ok(out.fits && !out.fits.over && out.fits.rail === null, 'a board that fits wears none', `over ${out.fits && out.fits.over}`),
    ];
  }],

  ['on a phone the crew window stands inside the glass, and the cross puts it away', async () => {
    window.__nocine();
    window.__crew(3, 2);
    run(0.5);
    phone(true);
    window.__board('house');
    await settled();
    const door = await openCrewList();
    await settled();
    const s = state();
    const win = document.getElementById('modal');
    const wr = win.getBoundingClientRect();
    const inWindow = !win.hidden && wr.left >= -1 && wr.top >= -1 && wr.right <= s.W + 1 && wr.bottom <= s.H + 1;
    document.getElementById('modalclose').click();
    await settled();
    const closed = state().modal === null;
    phone(false);
    window.__board(null);
    await frames(2);
    return [
      ok(!!door, 'the house board has its door'),
      ok(s.modal === 'crew', 'pressing it opens the crew window', `${s.modal}`),
      ok(inWindow, 'inside the glass', `${Math.round(wr.left)},${Math.round(wr.top)} ${Math.round(wr.width)}x${Math.round(wr.height)} in ${s.W}x${s.H}`),
      ok(closed, 'and the cross puts it away'),
    ];
  }],

  ['the desk\'s popover measures and seats as it did once the pointer is fine again', async () => {
    window.__nocine();
    await haveBench();
    phone(false);
    window.__board('bench');
    await settle(0.6);
    // A board stands under the notice card while one is up (place() in board.js),
    // and a different notice is a different height: both seatings are read with
    // the card off the glass, so this measures the popover and not the card.
    const noCard = async () => {
      document.getElementById('toast')?.classList.remove('up');
      window.__placeBoard();
      await frames(1);
    };
    await noCard();
    const fitBefore = window.__boardFit();
    const rBefore = rect();
    // a phone for a moment, and back
    phone(true);
    await settled();
    const asSheet = panel().classList.contains('bottom');
    phone(false);
    await settled();
    await noCard();
    await settle(0.3);
    const fitAfter = window.__boardFit();
    const rAfter = rect();
    window.__board(null);
    return [
      ok(asSheet, 'the open board became a sheet on the phone'),
      ok(!panel().classList.contains('bottom') && handle().hidden, 'and a popover again on the desk'),
      ok(fitAfter.w === fitBefore.w && fitAfter.h === fitBefore.h && fitAfter.realW === fitBefore.realW,
         'measuring the same', `${JSON.stringify(fitBefore)} vs ${JSON.stringify(fitAfter)}`),
      ok(Math.abs(rAfter.left - rBefore.left) <= 1 && Math.abs(rAfter.top - rBefore.top) <= 1,
         'and seated where it was', `${Math.round(rBefore.left)},${Math.round(rBefore.top)} vs ${Math.round(rAfter.left)},${Math.round(rAfter.top)}`),
    ];
  }],

  ['no two pips on any board land on each other at a phone\'s width', async () => {
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, dust: 90000 });
    window.__levels({ carryLevel: 3, speedLevel: 5, haulCarryLevel: 4, quarryPaceLevel: 5, tendLevel: 3 });
    run(0.5);
    const bad = [], seen = [];
    const meet = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
    await asScreen(390, 844, 3, async () => {
      phone(true);
      for (const which of Object.keys(state().stands)) {
        window.__board(which);
        await settled();
        for (const ladder of document.querySelectorAll('#panel .page:not([hidden]) .ladder')) {
          const groups = [...ladder.querySelectorAll('b')];
          if (!groups.length) continue;
          seen.push(which);
          const gr = groups.map(g => g.getBoundingClientRect());
          for (let i = 0; i < gr.length; i++) for (let j = i + 1; j < gr.length; j++)
            if (meet(gr[i], gr[j])) bad.push(`${which}: two bands of ${ladder.closest('button')?.dataset.key} meet`);
          const pips = [...ladder.querySelectorAll('i')].map(p => p.getBoundingClientRect());
          for (let i = 1; i < pips.length; i++)
            if (meet(pips[i - 1], pips[i])) bad.push(`${which}: pips of ${ladder.closest('button')?.dataset.key} meet`);
        }
      }
      window.__board(null);
      phone(false);
    });
    return [
      ok(seen.length > 3, 'several boards carry ladders', `${seen.length}`),
      ok(bad.length === 0, 'and on none of them do two pips or two bands meet', bad.slice(0, 4).join('; ')),
    ];
  }],
];
