// The game under a thumb (DESIGN.md, "Playing it on a phone"): the grab bar
// the yard is scrolled from, the tap that buys and the press that does not,
// the undo, the hop, the skip, the whole screen and the page's own shape.
// Everything here needs the page -- a pointer, a scroller, a stylesheet --
// which is why it is in this tier; the targets and the refunds themselves
// are the node tier's (test/hop.test.mjs, test/undo-buy.test.mjs).
//
// A phone is stood up with `__coarse(true)`, which forces `coarse()` without
// writing the preference, and every group puts it back.

import { sleep, state, ok, canvas, run, runUntil, raf, tap, touch, finger, haveBench, newRun, settle } from './kit.js';
import { TAP_SLOP, TAP_TIME, UNDO_MS, UNDO_DEAD_MS, HOP_Y, HOP_SIZE, SKIP_HOLD_MS } from '../config.js';
import { S } from '../state.js';
import { purse } from '../words.js';
import { workOn } from '../works.js';

const phone = on => window.__coarse(on ? true : null);
const scroller = () => document.getElementById('scroller');
const thumb = () => document.querySelector('#bar .thumb');
const tile = key => document.querySelector(`#shop button[data-key="${key}"]`);
const frames = async n => { for (let i = 0; i < n; i++) { run(1 / 60); await raf(); } };

// The bench open on a phone with the coin for its first rungs.
async function benchOnPhone() {
  phone(true);
  await haveBench();
  window.__crew(1, 0);           // the shack's row wants a crew, and it is the one with a note
  window.__give(3000);
  window.__build();
  window.__nocine();
  window.__board('bench');
  await settle(0.5);
}

export const TESTS = [
  ['the grab bar is the yard\'s one scroll on a phone, and the yard reads it back', async () => {
    window.__nocine();
    phone(false);
    await frames(2);
    const deskHidden = scroller().hidden;
    phone(true);
    window.__look(1200);
    await frames(2);
    const sc = scroller();
    const s0 = state();
    const shownOnPhone = !sc.hidden;
    const action = getComputedStyle(sc).touchAction;
    const wrote = Math.abs(sc.scrollLeft - s0.camX * s0.zoom) <= 1;
    // The platform's scroll, stood in for: a finger in the band moves
    // `scrollLeft`, and the camera follows it on the next frame. No script
    // can make the platform coast; tools/fling.mjs drives a real finger.
    const left = sc.scrollLeft + 200;
    sc.scrollLeft = left;
    await frames(2);
    const s1 = state();
    const followed = Math.abs(s1.camX - left / s1.zoom) <= 1;
    // and the thumb is the view's share of the world, where the view is
    const t = thumb().getBoundingClientRect();
    const wantW = Math.max(24, s1.W * s1.viewW / s1.worldW), wantX = s1.W * s1.camX / s1.worldW;
    // a finger dragged across the sky moves nothing
    const skyY = (s1.groundY - 300 - s1.camY) * s1.zoom;
    finger('pointerdown', 1, 300, skyY);
    for (let i = 1; i <= 6; i++) { finger('pointermove', 1, 300 - i * 20, skyY); await sleep(16); }
    finger('pointerup', 1, 180, skyY);
    await frames(1);
    const s2 = state();
    // a board comes down when its station is scrolled off the window, on
    // every board (the rule was keyed on the bench's flag alone)
    await haveBench();
    window.__crew(2, 1);
    run(0.5);
    window.__board('house');
    await frames(3);
    const houseUp = !document.getElementById('panel').hidden;
    sc.scrollLeft = sc.scrollWidth;                         // the far end of the world
    await frames(3);
    const houseDown = document.getElementById('panel').hidden || !state().houseBoardOpen;
    // a cutscene shuts the band for its run
    const lockedBefore = getComputedStyle(sc).overflowX;
    phone(false);
    await frames(1);
    return [
      ok(deskHidden, 'on a desk there is no band'),
      ok(shownOnPhone, 'on a phone there is'),
      ok(action === 'pan-x', 'and it pans sideways and nothing else', action),
      ok(wrote, 'a lookAt writes the band\'s position', `${sc.scrollLeft} vs ${s0.camX * s0.zoom}`),
      ok(followed, 'and the camera follows where the band is scrolled to', `${s1.camX} vs ${left / s1.zoom}`),
      ok(Math.abs(t.width - wantW) <= 6 && Math.abs(t.left - wantX) <= 6, 'the thumb is the view\'s share of the world, where the view is',
         `thumb ${Math.round(t.left)}+${Math.round(t.width)} vs ${Math.round(wantX)}+${Math.round(wantW)}`),
      ok(s2.camX === s1.camX && !s2.dragging, 'a finger dragged across the sky moves nothing', `${s1.camX} -> ${s2.camX}`),
      ok(houseUp && houseDown, 'a board comes down when its station is scrolled off the window', `up ${houseUp}, down ${houseDown}`),
      ok(lockedBefore === 'auto' || lockedBefore === 'scroll', 'the band is open to a finger with no scene on', lockedBefore),
      ok(scroller().hidden, 'and gone again on a desk'),
    ];
  }],

  ['a tap buys, a scroll does not, a long press asks, and a second tap takes it back', async () => {
    await benchOnPhone();
    const carry = tile('carry'), auto = tile('auto'), shack = tile('unlockshack');
    const had = purse('dust');
    const lean = !!carry && !carry.style.getPropertyValue('--sway-rate');   // no lean wired under a thumb
    await tap(carry);
    await settle(UNDO_DEAD_MS / 1000 + 0.1);      // past the dead zone, so the tag is the way back
    const bought = !!workOn('carry');
    const spent = purse('dust') < had;
    const tag = carry.querySelector('.tag .time')?.textContent.trim() || '';
    // and the tag fits its card: one word, inside the tile's own box
    const inCard = (() => { const t = carry.querySelector('.tag').getBoundingClientRect(), c = carry.getBoundingClientRect();
      return t.left >= c.left - 1 && t.right <= c.right + 1 && t.top >= c.top - 1 && t.bottom <= c.bottom + 1; })();
    // a press that moved past the slop is a scroll, and buys nothing
    await tap(auto, { move: TAP_SLOP + 10 });
    await settle(0.2);
    const scrolled = !workOn('auto');
    // a press held past the time asks about the row and buys nothing
    const tipBefore = document.getElementById('tip').hidden;
    let tipDuring = null;
    const p = tap(shack, { hold: TAP_TIME + 150 });
    await sleep(TAP_TIME + 60);
    tipDuring = !document.getElementById('tip').hidden;
    await p;
    await settle(0.2);
    const held = !workOn('unlockshack');
    // the same tap again on the bought tile, inside the moment, puts it back
    await tap(carry);
    await settle(0.2);
    const undone = !workOn('carry') && purse('dust') === had;
    phone(false);
    window.__board(null);
    return [
      ok(!!carry && !!auto && !!shack, 'the three rows are on the bench'),
      ok(lean, 'no lean is wired under a thumb'),
      ok(bought && spent, 'a tap buys the rung', `work ${bought}, ${had} -> ${purse('dust')}`),
      ok(tag === 'undo', 'and the tag offers the way back, in one word', tag),
      ok(inCard, 'inside the card'),
      ok(scrolled, 'a press that moved past the slop buys nothing'),
      ok(tipBefore && tipDuring && held, 'a press held past the time brings up the note and buys nothing',
         `tip ${tipDuring}, bought ${!held}`),
      ok(undone, 'a tap on the tag inside the moment puts the bill back', `${purse('dust')} vs ${had}`),
    ];
  }],

  ['two taps in a row zoom nothing and buy once', async () => {
    await benchOnPhone();
    const auto = tile('auto');
    const had = purse('dust');
    const scale0 = visualViewport.scale;
    let low = had;
    await tap(auto);
    low = Math.min(low, purse('dust'));
    await sleep(150);
    await tap(auto);
    await settle(0.2);
    low = Math.min(low, purse('dust'));
    const scale1 = visualViewport.scale;
    // The second tap lands inside the dead zone, so it is not the undo:
    // bought once and kept, never twice.
    const once = purse('dust') < had && purse('dust') === low && !!workOn('auto');
    // and every tappable thing on the page says so to the platform
    const auto_ = [...document.querySelectorAll('button, #scroller, #handle, .panel, .held, #pin, #queue, .toast')]
      .filter(el => el.offsetParent !== null || el.id === 'scroller')
      .map(el => [el.id || el.className, getComputedStyle(el).touchAction])
      .filter(([, a]) => !/manipulation|pan-x|pan-y|none/.test(a));
    const meta = document.querySelector('meta[name="viewport"]')?.content || '';
    phone(false);
    window.__board(null);
    return [
      ok(scale0 === 1 && scale1 === 1, 'the page is not zoomed by the double tap', `${scale0} -> ${scale1}`),
      ok(once && low >= had - 1000, 'bought once and kept, never twice', `${had} -> ${low} -> ${purse('dust')}`),
      ok(auto_.length === 0, 'every tappable element refuses the platform\'s double-tap zoom', auto_.map(a => a.join(':')).join(', ')),
      ok(/maximum-scale=1/.test(meta), 'and the viewport says so too', meta),
    ];
  }],

  ['the undo tag fits inside its card on every board', async () => {
    phone(true);
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 90000 });
    run(0.5);
    const bad = [], seen = [];
    for (const which of Object.keys(state().stands)) {
      window.__board(which);
      await settle(0.3);
      // the first tile on the board that a press buys
      const row = [...document.querySelectorAll('#panel .page:not([hidden]) .rows button.tile:not(:disabled):not(.stat):not(.door)')]
        .find(b => b.dataset.key && !b.classList.contains('off'));
      if (!row) continue;
      await tap(row);
      await settle(UNDO_DEAD_MS / 1000 + 0.1);
      const time = row.querySelector('.tag .time');
      if (!time || time.textContent.trim() !== 'undo') continue;
      seen.push(which);
      const t = row.querySelector('.tag').getBoundingClientRect(), c = row.getBoundingClientRect();
      if (t.right > c.right + 1 || t.left < c.left - 1 || t.bottom > c.bottom + 1) bad.push(`${which}/${row.dataset.key} ${Math.round(t.right - c.right)}px past`);
    }
    window.__board(null);
    phone(false);
    return [
      ok(seen.length >= 3, 'several boards showed the way back', seen.join(' ')),
      ok(bad.length === 0, 'and on every one the tag stays inside its card', bad.join('; ')),
    ];
  }],

  ['a notice stands clear of a building that reaches into the sky', async () => {
    // A settlement tall enough to reach the top edge, where the card lands;
    // the card slides to the clearer side rather than over the rooms.
    window.__nocine();
    window.__crew(35, 30, 0, 0);
    run(3);
    const h = state().stands.house;
    window.__look(h.x + h.w / 2 - state().viewW / 2);
    await frames(3);
    for (let i = 0; i < 40 && document.getElementById('toast').hidden; i++) await frames(1);
    await sleep(450);                       // the card's slide is a real transition
    const s = state();
    const t = document.getElementById('toast').getBoundingClientRect();
    const hr = { x: (h.x - s.camX) * s.zoom, y: (h.y - s.camY) * s.zoom, w: h.w * s.zoom, h: h.h * s.zoom };
    const reaches = hr.y < t.bottom;
    const meets = t.left < hr.x + hr.w && hr.x < t.right && t.top < hr.y + hr.h && hr.y < t.bottom;
    window.__crew(0, 0);
    return [
      ok(!document.getElementById('toast').hidden, 'a notice is up'),
      ok(reaches, 'and the house reaches the sky the card lands in', `house top ${Math.round(hr.y)}, card bottom ${Math.round(t.bottom)}`),
      ok(!meets, 'so the card stands beside it, not over it', `card ${Math.round(t.left)}..${Math.round(t.right)}, house ${Math.round(hr.x)}..${Math.round(hr.x + hr.w)}`),
      ok(t.left >= 0 && t.right <= s.W, 'inside the window'),
    ];
  }],

  ['the gear opens the settings as a sheet on a phone, and a drag down closes it', async () => {
    window.__nocine();
    phone(false);
    await frames(2);
    const deskHidden = document.getElementById('gear').hidden;
    phone(true);
    await frames(2);
    const gear = document.getElementById('gear');
    const present = !gear.hidden;
    const r = gear.getBoundingClientRect();
    const corner = r.top < 80 && r.right > state().W - 120 && r.width >= 44;
    await tap(gear);
    await frames(2);
    await sleep(250);
    const held = document.getElementById('held');
    const open = state().paused && !held.hidden && held.classList.contains('bottom');
    const rows = ['touch', 'motion', 'fullscreenrow', 'savecopy'].map(id => document.getElementById(id))
      .filter(el => el && !el.hidden && el.getBoundingClientRect().height > 0);
    const hr = held.getBoundingClientRect();
    const asSheet = Math.abs(hr.width - state().W) <= 2 && Math.abs(hr.bottom - state().H) <= 1;
    // the grip dragged down past a third of the sheet
    const grip = document.getElementById('heldgrip');
    const gr = grip.getBoundingClientRect();
    const ev = (type, y, buttons = 1) => grip.dispatchEvent(new PointerEvent(type, { clientX: gr.left + gr.width / 2, clientY: y, pointerId: 8, isPrimary: true, pointerType: 'touch', button: 0, buttons, bubbles: true }));
    ev('pointerdown', gr.top + 5);
    for (let i = 1; i <= 5; i++) { ev('pointermove', gr.top + 5 + hr.height * 0.5 * i / 5); await raf(); }
    ev('pointerup', gr.top + 5 + hr.height * 0.5, 0);
    await frames(2);
    await sleep(250);
    const closed = !state().paused && held.hidden;
    phone(false);
    await frames(2);
    return [
      ok(deskHidden, 'on a desk there is no gear'),
      ok(present && corner, 'on a phone it stands in the top-right corner', `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}`),
      ok(open, 'a tap holds the yard with the settings up, as a sheet from the bottom'),
      ok(rows.length >= 3 && rows.some(el => el.id === 'touch') && rows.some(el => el.id === 'savecopy'), 'with its rows showing', rows.map(e => e.id).join(' ')),
      ok(asSheet, 'the window\'s width, on the foot', `${Math.round(hr.width)}x${Math.round(hr.height)} at ${Math.round(hr.bottom)}`),
      ok(closed, 'and a drag down on the grip puts it away'),
    ];
  }],

  ['the page fills a phone\'s screen and installs to it', async () => {
    const meta = document.querySelector('meta[name="viewport"]')?.content || '';
    const link = document.querySelector('link[rel="manifest"]');
    let manifest = null;
    try { manifest = await (await fetch(link.href)).json(); } catch {}
    const rootH = document.documentElement.clientHeight;
    return [
      ok(/viewport-fit=cover/.test(meta), 'the viewport reaches under the bars', meta),
      ok(!!manifest && manifest.display === 'standalone', 'the manifest resolves and asks for a standalone window',
         manifest ? manifest.display : 'no manifest'),
      ok(!!document.querySelector('meta[name="apple-mobile-web-app-capable"][content="yes"]'), 'and safari is told the same'),
      ok(Math.abs(rootH - visualViewport.height) <= 1, 'the page stands the whole height of the visual viewport',
         `${rootH} vs ${visualViewport.height}`),
    ];
  }],

  ['the hop stands in the mid sky on a phone and moves the view', async () => {
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    run(0.5);
    phone(false);
    await frames(2);
    const deskHidden = document.getElementById('hop').hidden;
    phone(true);
    window.__look(0);
    await frames(2);
    const right = document.querySelector('#hop .right');
    const stripUp = !document.getElementById('hop').hidden && !right.hidden;
    const r = right.getBoundingClientRect();
    const s0 = state();
    // at HOP_Y of the window, or the middle of the sky where that is higher
    const wantY = Math.min(s0.H * HOP_Y, (s0.groundY - s0.camY) * s0.zoom / 2);
    const atY = Math.abs((r.top + r.height / 2) - wantY) <= 2;
    const wears = right.dataset.to;
    const before = s0.camX;
    await tap(right);
    await frames(3);
    const s1 = state();
    const moving = s1.camX > before;
    // and the thumb followed the hop
    let frames_ = 0;
    while (S.camTo !== null && frames_++ < 120) await frames(1);
    const s2 = state();
    const t = thumb().getBoundingClientRect();
    const thumbX = s2.W * s2.camX / s2.worldW;
    phone(false);
    await frames(1);
    return [
      ok(deskHidden, 'on a desk there are no arrows'),
      ok(stripUp, 'on a phone the right arrow is up at the far left of the world', `camX ${s0.camX}, to ${right.dataset.to}`),
      ok(atY, 'at HOP_Y of the window, or the middle of the sky if that is higher', `${Math.round(r.top + r.height / 2)} vs ${Math.round(wantY)}`),
      ok(r.width >= HOP_SIZE && r.height >= HOP_SIZE, 'a thumb\'s size', `${Math.round(r.width)}x${Math.round(r.height)}`),
      ok(!!wears && !!s0.stands[wears], 'wearing a standing station\'s glyph', wears),
      ok(moving, 'and a tap on it moves the view that way', `${before} -> ${s1.camX}`),
      ok(Math.abs(t.left - thumbX) <= 6, 'with the grab bar\'s thumb following', `${Math.round(t.left)} vs ${Math.round(thumbX)}`),
      ok(document.getElementById('hop').hidden, 'and gone again on a desk'),
    ];
  }],

  ['a tap skips a scene and a held button skips the opening', async () => {
    // A cutscene: the hole giving way. A tap on the yard lets the camera go,
    // the way a click does.
    window.__scene('tear');
    await frames(2);
    const running = state().cine && !state().cineOut;
    const s = state();
    finger('pointerdown', 1, s.W / 2, s.H / 3);
    finger('pointerup', 1, s.W / 2, s.H / 3);
    await frames(2);
    const tapped = state().cineOut || !state().cine;
    // The opening, which a click does not skip: the hint is a button, held.
    window.__reset(true);
    await frames(2);
    const skip = document.getElementById('skip');
    const introOn = state().intro === 'leave';
    const shown = !skip.hidden && getComputedStyle(skip).pointerEvents !== 'none';
    skip.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 3, isPrimary: true, pointerType: 'touch', button: 0, buttons: 1, bubbles: true, cancelable: true }));
    run(SKIP_HOLD_MS / 1000 + 0.2);
    await raf();
    skip.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, isPrimary: true, pointerType: 'touch', button: 0, buttons: 0, bubbles: true }));
    await frames(2);
    const cut = state().intro !== 'leave';
    window.__scene('yard');
    window.__nocine();
    return [
      ok(running, 'a scene has the yard'),
      ok(tapped, 'a tap on the yard lets it go, as a click does'),
      ok(introOn && shown, 'the opening runs with the skip hint up as a button', `${state().intro}`),
      ok(cut, 'and holding it for SKIP_HOLD_MS cuts the opening', `${state().intro}`),
    ];
  }],

  ['the fullscreen button is there only where the platform can, and asks it', async () => {
    window.__nocine();
    await frames(2);
    const able = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    const b = document.getElementById('fullscreen');
    const present = !b.hidden;
    let asked = 0;
    const real = document.documentElement.requestFullscreen;
    document.documentElement.requestFullscreen = function () { asked++; return Promise.resolve(); };
    if (present) await tap(b);
    document.documentElement.requestFullscreen = real;
    const row = document.getElementById('fullscreenrow');
    return [
      ok(present === able, 'the button is present exactly where fullscreen is possible', `able ${able}, present ${present}`),
      ok(!able || asked === 1, 'and a tap on it asks the platform', `${asked} asks`),
      ok(!able || row.dataset.pane === 'settings', 'and the settings sheet has the same row', row.dataset.pane),
    ];
  }],
];
