// A play check for each place: its first minutes, with a hand on the glass.
// Act 3 shipped five landings green on their own checks and unplayable,
// because nobody had played it. Each group here is one place walked the way
// a player walks it, with only wheel, key and pointer events dispatched on
// the page: the camera panned to both ends of the place and back, the
// pointer walked up to every open station until its board opens and the
// cursor turns, a tile on a board pressed with the coins there, a pan that
// closes the board again, the place's portals taken both ways, and the
// place's main hand action (the rock, the shout at the pair, a blow at a
// face). Hooks stand the place up and grant coins -- the setup these checks
// are not about -- and nothing the checks ARE about goes through one.
//
// Run before any landing that touches a place:
//   node tools/headless.mjs --only "play:"
// What each place's rules are is the node tier's; this is only that a hand
// can reach them.

import { S } from '../state.js';
import { newRun, settle, raf, ok, point, canvas, panel, run, runUntil, haveBench, pressRaise, haveRock,
         boulderWorld } from './kit.js';
import { STATIONS, here, stationAt, hitRect } from '../stations.js';
import { openBoard, inSafeZone } from '../board.js';
import { toScreen } from '../world.js';
import { portalEnd } from '../portals.js';
import { pairBox } from '../after/rebel.js';
import { speakerAt } from '../after/place.js';
import { K as INK, W as PAPER } from '../render/after/kit.js';
import { mouthX, portalX, portalCircle, deepPortal } from '../deep/place.js';
import { arrowBox } from '../render/shaftway.js';
import { VIEW_GLIDE_S, P, GREY } from '../config.js';
import { PLACES } from '../acts.js';

// --- the pair on the glass -------------------------------------------------------
// Act 3's pair, each the yard's square on the pedestal (render/after/pedestal.js):
// read off the canvas at the spot place.js stands them, its rim the act's ink
// and its middle the act's paper -- not cloud, sky or a crowd drawn over them.
// The rim is two world px, under two screen px at the yard's zoom, so its
// darkest pixel is read as near the ink, not on it.
const lum = css => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = css; c.fillRect(0, 0, 1, 1); const d = c.getImageData(0, 0, 1, 1).data; return (d[0] + d[1] + d[2]) / 3; };
function pairOnGlass() {
  const g = canvas().getContext('2d'), k = S.dpr || 1, ink = lum(GREY[INK]), paper = lum(GREY[PAPER]);
  // the darkest and lightest device pixel over a world rect
  const span = (x, y, w, h) => {
    const a = toScreen(x, y), b = toScreen(x + w, y + h);
    const x0 = Math.floor(a.x * k), y0 = Math.floor(a.y * k), dw = Math.max(1, Math.ceil(b.x * k) - x0), dh = Math.max(1, Math.ceil(b.y * k) - y0);
    const d = g.getImageData(x0, y0, dw, dh).data;
    let lo = 255, hi = 0;
    for (let i = 0; i < d.length; i += 4) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; lo = Math.min(lo, v); hi = Math.max(hi, v); }
    return { lo, hi };
  };
  return [0, 1].map(n => {
    const { x, y } = speakerAt(n);          // the square's left edge, and the feet on the podium's top
    const rim = span(x, y - 12, 2, 6), mid = span(x + 6, y - 12, 6, 6);
    return { rim: Math.round(rim.lo), mid: Math.round(mid.lo), ok: rim.lo - ink < 0.3 * (paper - ink) && Math.abs(mid.lo - paper) < 24 };
  });
}

// --- the hand -----------------------------------------------------------------
// Frames of the page until `fn`, or false after `frames`. Wall frames, because
// the pan, a board's seating and the hover's intent are the page's; the yard's
// clock is turned with `run`.
const until = async (fn, frames = 90) => {
  for (let i = 0; i < frames; i++) { if (fn()) return true; await raf(); }
  return !!fn();
};
const wheel = dy => canvas().dispatchEvent(new WheelEvent('wheel', { deltaY: dy, bubbles: true, cancelable: true }));
const keyOf = dir => (dir > 0 ? 'ArrowRight' : 'ArrowLeft');

// The view driven to one end with the wheel or a held arrow until it stops
// moving, and the x it stopped at.
async function panEnd(dir, how) {
  let last = NaN, still = 0;
  if (how === 'keys') dispatchEvent(new KeyboardEvent('keydown', { key: keyOf(dir), bubbles: true, cancelable: true }));
  for (let i = 0; i < 4000 && still < 8; i++) {
    if (how === 'wheel') wheel(dir * 3000);
    await raf();
    if (S.camX === last) still++; else { still = 0; last = S.camX; }
  }
  if (how === 'keys') dispatchEvent(new KeyboardEvent('keyup', { key: keyOf(dir), bubbles: true, cancelable: true }));
  return S.camX;
}

// The camera panned out to both ends, by the wheel and then by the arrows,
// and back: three checks.
async function panChecks(name) {
  const start = S.camX;
  const right = await panEnd(1, 'wheel');
  const left = await panEnd(-1, 'wheel');
  const keyRight = await panEnd(1, 'keys');
  const keyLeft = await panEnd(-1, 'keys');
  return [
    ok(right > left + S.viewW / 4, `${name}: the wheel carries the view from one end to the other`, `${left} .. ${right} from ${start}`),
    ok(Math.abs(keyRight - right) < 1 && Math.abs(keyLeft - left) < 1,
       `${name}: the arrows reach the same two ends, and the view comes back`, `wheel ${left} .. ${right}, keys ${keyLeft} .. ${keyRight}`)
  ];
}

// A world point on the glass, as the pointer gives it (input.js `pos`).
const glass = (x, y) => { const r = canvas().getBoundingClientRect(), s = toScreen(x, y); return [r.left + s.x, r.top + s.y]; };
// The camera on a world x with nothing else moving it, a frame drawn.
const lookAt = async x => { window.__look(x - S.viewW / 2); await settle(0.1); };

// The pointer walked up to a spot from a few steps off, the way a hand
// arrives, rather than appearing on it.
async function walkTo(sx, sy) {
  for (let k = 8; k >= 1; k--) { point('pointermove', sx - k * 14, sy + k * 5, 0); await raf(); }
  point('pointermove', sx, sy, 0);
}

// Where on a station the pointer asks for its board: the middle of its
// ground if that is its own by the pointer's table (`stationAt`), else any
// spot of its hit box that is. Null if no spot is.
function spotOn(row) {
  const r = hitRect(row.key);
  if (!r) return null;
  const mid = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  if (stationAt(mid.x, mid.y) === row.key) return mid;
  for (let y = r.y + P; y < r.y + r.h; y += P * 2)
    for (let x = r.x + P; x < r.x + r.w; x += P * 2)
      if (stationAt(x, y) === row.key) return { x, y };
  return null;
}

// Every station in the world on screen that is standing and has a board.
const openRows = () => STATIONS.filter(r => r.board && r.stand && here(r) && r.open());

// A row's station visited: the camera on it, the pointer walked up, and what
// the page said back.
async function visit(row) {
  // The camera on the station first and the spot found there: a station
  // drawn against the camera (God's camp) is somewhere else once it moves.
  const r0 = hitRect(row.key);
  if (!r0) return { key: row.key, spot: false };
  let at = null;
  for (let i = 0; i < 3; i++) {
    await lookAt(at ? at.x : r0.x + r0.w / 2);
    at = spotOn(row);
    if (!at) return { key: row.key, spot: false };
  }
  // From a bare spot: a board already up for the neighbor holds its place
  // for a cursor heading toward it, which is the board's, not the walk's --
  // so a corner of the window off the way to that board, wherever it sits
  // (under a notice card or at the top of the glass).
  const [bx, by] = [[4, 4], [S.W - 4, 4], [4, S.H - 4], [S.W - 4, S.H - 4]].find(([x, y]) => !inSafeZone(x, y)) || [4, 4];
  point('pointermove', bx, by, 0);
  await until(() => openBoard() === null, 90);
  const [sx, sy] = glass(at.x, at.y);
  await walkTo(sx, sy);
  const opened = await until(() => openBoard() === row.key, 90);
  for (let i = 0; i < 30; i++) await raf();     // the board slides to its seat
  return { key: row.key, spot: true, opened, got: String(openBoard()), cursor: canvas().style.cursor };
}

// Every open station visited. Where a station cannot be stood at (no spot of
// it is its own) or opens no board, the name is in the detail.
async function stationChecks(name, rows = openRows()) {
  const seen = [];
  for (const row of rows) seen.push(await visit(row));
  const noSpot = seen.filter(v => !v.spot).map(v => v.key);
  const shut = seen.filter(v => v.spot && !v.opened).map(v => `${v.key} (got ${v.got})`);
  const mute = seen.filter(v => v.opened && v.cursor !== 'pointer').map(v => `${v.key}: ${v.cursor}`);
  return [
    ok(rows.length > 0, `${name}: there is a station standing to walk up to`, 'none open'),
    ok(!noSpot.length, `${name}: every open station has ground the pointer can stand on`, noSpot.join(', ')),
    ok(!shut.length, `${name}: the pointer walked up to each of ${rows.map(r => r.key).join(' ')} opens its board`, shut.join(', ')),
    ok(!mute.length, `${name}: and the cursor turns to the pointing hand over each`, mute.join(', '))
  ];
}

// A press on a tile the way a mouse makes it: the three events, on whatever
// is really under the tile's middle, so a tile behind something or off the
// window is not pressed.
function press(el) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const hit = document.elementFromPoint(x, y);
  if (!hit || !(hit === el || el.contains(hit))) { press.why = `${hit && (hit.id || hit.className || hit.tagName)} at ${Math.round(x)},${Math.round(y)}`; return false; }
  const at = { clientX: x, clientY: y, bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 };
  hit.dispatchEvent(new PointerEvent('pointerdown', { ...at, buttons: 1 }));
  hit.dispatchEvent(new PointerEvent('pointerup', { ...at, buttons: 0 }));
  hit.dispatchEvent(new MouseEvent('click', at));
  return true;
}
// The tiles of the board that is up and can be pressed now.
const liveTiles = () => [...panel().querySelectorAll('button[data-key]')]
  .filter(b => b.offsetParent && !b.disabled && !b.classList.contains('locked') && !b.classList.contains('stat'));

// Every coin the place spends, as numbers.
const purse = () => {
  const v = { dust: S.stored, shards: S.shards, spores: S.spores, sparks: S.sparks, scales: S.scales };
  if (S.hell) v.brimstone = S.hell.brimstone;
  if (S.after) { v.rebel = S.after.rebel; for (const [k, n] of Object.entries(S.after.stock || {})) v[`s.${k}`] = n; }
  return v;
};
const spent = (was, now) => Object.keys(was).filter(k => now[k] < was[k]);

// A board bought from: a live tile pressed, the coins down. `rows` are tried
// in turn until one has a tile to press (a lot with nothing built on it
// sells nothing); the open board is left up for the scroll check.
async function buyCheck(name, rows) {
  let tile = null;
  for (const row of rows) {
    await visit(row);
    tile = liveTiles()[0];
    if (tile) break;
  }
  if (!tile) return [ok(false, `${name}: a tile on some open board can be pressed`, `no live tile on ${rows.map(r => r.key).join(', ')}`)];
  const was = purse(), key = tile.dataset.key;
  const hit = press(tile);
  await raf();
  const down = spent(was, purse());
  return [ok(hit, `${name}: the tile is there to be pressed`, `${key} is covered or off the glass: ${press.why}`),
          ok(down.length > 0, `${name}: a press on ${key} spends coins`, `${JSON.stringify(was)} -> ${JSON.stringify(purse())}`)];
}

// Scrolling away from the open board shuts it.
async function scrollCloses(name) {
  const was = openBoard();
  await until(() => { wheel(1500); return openBoard() === null; }, 200);
  return [ok(was !== null && openBoard() === null, `${name}: panning away from the open board closes it`, `${was} -> ${openBoard()}`)];
}

// The camera come to rest in `view` after a way through (the ripple has run
// out), and a frame drawn: nothing is pressed while it glides.
async function arrived(view) {
  const done = runUntil(() => S.view === view && S.viewTo == null, VIEW_GLIDE_S * 4 + 6);
  await settle(0.3);
  return done;
}

// A click on a world spot.
const clickAt = (wx, wy) => { const [x, y] = glass(wx, wy); point('pointerdown', x, y); point('pointerup', x, y); };

// A body of the place picked up with the hand and put down again, the way
// the yard's are (selftest/carry.js): the right button held, the left
// pressed with it over the body, the pair carried off and let go. Taken off
// the place's own crew (placebodies.js), the jobs in `prefer` first: a body
// standing at its work, drawn where it stands.
async function grabCheck(name, crew, prefer) {
  // At its work: standing where it stood a second ago.
  let was = new Map();
  const free = w => crew.pickable(w) && !w.falling && !w.lifted && was.get(w) === `${w.x},${w.y}`;
  const pick = () => {
    const w = prefer.map(j => crew.list()?.find(o => o.job === j && free(o))).find(Boolean) || crew.list()?.find(free);
    was = new Map((crew.list() || []).map(o => [o, `${o.x},${o.y}`]));
    return w;
  };
  runUntil(() => !!pick(), 120);
  const w = pick();
  if (!w) return [ok(false, `${name}: a body stands to be picked up`, `${(crew.list() || []).length} bodies`)];
  await lookAt(w.x);
  const b = crew.box(w), x0 = w.x, y0 = w.y, job = w.job;
  const [sx, sy] = glass(b.x + b.w / 2, b.y + b.h / 2);
  point('pointerdown', sx, sy, 2, 2);
  point('pointermove', sx, sy, 3, 0);
  const took = !!w.lifted;
  // Carried up and a little along, a step a frame, and held still before
  // the release so it is let go, not thrown.
  const to = { x: b.x + b.w / 2 - P * 6, y: b.y + b.h / 2 - P * 10 };
  for (let k = 1; k <= 8; k++) { const [mx, my] = glass(b.x + b.w / 2 - P * 6 * k / 8, b.y + b.h / 2 - P * 10 * k / 8); point('pointermove', mx, my, 3, 0); await raf(); }
  for (let i = 0; i < 12; i++) await raf();
  const nb = crew.box(w), carried = Math.hypot(nb.x + nb.w / 2 - to.x, nb.y + nb.h / 2 - to.y);
  const [ux, uy] = glass(to.x, to.y);
  point('pointerup', ux, uy, 0, 2);
  const fell = !w.lifted && w.falling;
  run(3);
  const floor = crew.land(w).y, landed = !w.falling && Math.abs(w.y - floor) < 1;
  const back = runUntil(() => Math.hypot(w.x - x0, w.y - y0) < P * 2, 60);
  return [
    ok(took, `${name}: the right button held, the left takes the ${job} under the hand`, `${w.lifted}`),
    ok(carried < P, `${name}: and it goes where the cursor goes`, `${Math.round(carried)} px off`),
    ok(fell, `${name}: let go, it falls rather than being set down`, `lifted ${w.lifted} falling ${w.falling}`),
    ok(landed, `${name}: and lands on the floor under it`, `${Math.round(w.y)} against ${Math.round(floor)}`),
    ok(back && crew.list().includes(w) && w.job === job, `${name}: and walks back to its work`,
       `${Math.round(w.x)},${Math.round(w.y)} against ${Math.round(x0)},${Math.round(y0)}, ${w.job}`)
  ];
}

// --- the groups -----------------------------------------------------------------
export const TESTS = [
  ['play: yard', async () => {
    newRun();
    await settle();
    const out = [];
    // The bench is called, and answered, like a player: the button pressed.
    window.__give(100);
    await until(() => window.__state().benchCall, 60);
    const hit = await pressRaise();
    runUntil(() => window.__state().seenBench, 90);
    out.push(ok(!!hit && window.__state().seenBench, 'yard: the call to build the bench, pressed, raises it'));
    out.push(...await panChecks('yard'));
    out.push(...await stationChecks('yard'));
    // The bench's board, with dust to spend.
    window.__give(5000);
    const bench = STATIONS.find(r => r.key === 'bench');
    if (bench) {
      out.push(...await buyCheck('yard', [bench]));
      out.push(...await scrollCloses('yard'));
    } else out.push(ok(false, 'yard: the bench is a station', 'no row'));
    // The rock, struck with the pointer.
    await haveBench();
    haveRock();
    const b = boulderWorld();
    await lookAt(b.x);
    const before = window.__state().rock;
    for (let i = 0; i < 10; i++) { clickAt(b.x, b.y); run(0.05); }
    run(1);
    out.push(ok(window.__state().rock < before, 'yard: clicks on the rock take dust off it', `${before} -> ${window.__state().rock}`));
    return out;
  }],

  ['play: deep', async () => {
    newRun();
    await settle();
    const out = [];
    // The deep reached: a drowned yard, the snatch played (the setup), then
    // the way down by the arrow at the shaft, pressed.
    window.__crew(3, 3, 5, 7);
    window.__snatch({ played: true });
    window.__view('yard');
    window.__look(mouthX() - S.viewW / 2);
    run(0.5);
    await settle(0.2);
    const bx = arrowBox(false);
    clickAt(bx.x + bx.w / 2, bx.y + bx.h / 2);
    await arrived('deep');
    out.push(ok(S.view === 'deep', 'deep: the arrow at the shaft takes the view down', S.view));
    window.setResources({ dust: 88888, shards: 88888, spores: 88888, sparks: 88888, scales: 88888 });
    S.seenScale = S.seenFang = true;
    out.push(...await panChecks('deep'));
    out.push(...await stationChecks('deep'));
    out.push(...await buyCheck('deep', openRows()));
    out.push(...await scrollCloses('deep'));
    // And back up by the arrow in the light.
    const ub = arrowBox(true);
    window.__look(ub.x - S.viewW / 2);
    await settle(0.2);
    clickAt(ub.x + ub.w / 2, ub.y + ub.h / 2);
    await arrived('yard');
    out.push(ok(S.view === 'yard', 'deep: the arrow in the light brings the view back up', S.view));
    // The conjured portal in the pit, both of its ends.
    window.__look(portalX() - S.viewW / 2);
    run(2);
    clickAt(portalCircle().x, portalCircle().y);
    await arrived('deep');
    const down = S.view;
    await lookAt(deepPortal().x);
    clickAt(deepPortal().x, deepPortal().y);
    await arrived('yard');
    out.push(ok(down === 'deep' && S.view === 'yard', "deep: the pit's portal goes down and its far end comes back", `${down} then ${S.view}`));
    // The hand action there is the serpent's, which the deep's own groups own.
    return out;
  }],

  ['play: afterlife', async () => {
    newRun();
    await settle();
    const out = [];
    // Act 3 begun, the camera up there (the setup); the portal is the
    // player's from the arrival on.
    window.__actsOn(true);
    window.__actsAt('fallen');
    window.__goPlace('after');
    window.__fast(1);
    window.__grant({ dust: 5e6, spores: 2e6, shards: 2e6, scales: 2e5, sparks: 2e5 });
    window.__afterGrant({ rebel: 1e5, timber: 1e4, paper: 1e4 });
    await settle(0.3);
    out.push(ok(S.view === 'after', 'afterlife: the camera is up there', S.view));
    out.push(...await panChecks('afterlife'));
    out.push(...await stationChecks('afterlife'));
    out.push(...await buyCheck('afterlife', [STATIONS.find(r => r.key === 'after-shack')]));
    out.push(...await scrollCloses('afterlife'));
    // A member picked up with the hand and put down: it walks back to its
    // spot at the podium (the setup: one waiting in the crowd, who steps out
    // to it).
    S.after.camp += 1;
    run(30);
    out.push(...await grabCheck('afterlife', PLACES.after.crew, [null]));
    // The shout: a click on the pair on the pedestal sheds rebel.
    const pair = pairBox();
    await lookAt(pair.x + pair.w / 2);
    const glass = pairOnGlass();
    out.push(ok(glass.every(g => g.ok), "afterlife: the pair are drawn on the pedestal, the act's ink round its paper where they stand",
                JSON.stringify(glass)));
    const r0 = S.after.rebel, shouts0 = S.after.shout;
    clickAt(pair.x + pair.w / 2, pair.y + pair.h / 2);
    run(8);
    out.push(ok(S.after.shout !== shouts0, 'afterlife: a click on the pair is a line of the speech', `${shouts0} -> ${S.after.shout}`));
    out.push(ok(S.after.rebel > r0, 'afterlife: and rebel comes down on the pile', `${r0} -> ${S.after.rebel}`));
    // Heaven's gates, both ways, always open to the player.
    // The pointer over either end says a press will go through.
    const hover = (wx, wy) => {
      const r = canvas().getBoundingClientRect(), s = toScreen(wx, wy);
      point('pointermove', r.left + s.x, r.top + s.y, 0);
      return canvas().style.cursor;
    };
    const gate = portalEnd('heaven', 'after');
    await lookAt(gate.x);
    out.push(ok(hover(gate.x, gate.y) === 'pointer', "afterlife: the cursor over heaven's gates is the pointer", canvas().style.cursor));
    clickAt(gate.x, gate.y);
    await arrived('yard');
    out.push(ok(S.view === 'yard', "afterlife: heaven's gates take the view down to the yard", S.view));
    const low = portalEnd('heaven', 'yard');
    await lookAt(low.x);
    out.push(ok(hover(low.x, low.y) === 'pointer', "yard: the cursor over heaven's gates is the pointer", canvas().style.cursor));
    clickAt(low.x, low.y);
    await arrived('after');
    out.push(ok(S.view === 'after', "afterlife: and the yard's gates bring it back", S.view));
    window.__actsOn(null);
    return out;
  }],

  ['play: hell', async () => {
    newRun();
    await settle();
    const out = [];
    // The deep stands (the setup): hell's slit is in its floor.
    window.__crew(3, 3, 5, 7);
    window.__snatch({ played: true });
    window.__actsOn(true);
    window.__actsAt('act4');
    window.__goPlace('hell');
    window.__fast(1);
    window.__grant({ dust: 5e6, shards: 2e6, sparks: 2e5 });
    await settle(0.3);
    out.push(ok(S.view === 'hell', 'hell: the camera is down there', S.view));
    out.push(...await panChecks('hell'));
    // Hell's stations are rows of the table (hell/stations.js): the pointer
    // walked up to each opens its board, and a press on a tile spends hell's coins.
    window.__hell({ brimstone: 1e5 });
    out.push(...await stationChecks('hell'));
    out.push(...await buyCheck('hell', [STATIONS.find(r => r.key === 'hell-face')]));
    out.push(...await scrollCloses('hell'));
    // A ghost picked up with the hand and put down: it walks back to its work.
    out.push(...await grabCheck('hell', PLACES.hell.crew, ['miner', 'smith']));
    // The main hand action: a blow at the face with the pick.
    const f = window.__hellAt('face', 0);
    await lookAt(f.x);
    const h0 = S.hell.faces[0].hits, o0 = JSON.stringify(S.hell.ore);
    clickAt(f.x, f.y);
    run(1);
    out.push(ok(S.hell.faces[0].hits > h0 || JSON.stringify(S.hell.ore) !== o0, 'hell: a click on the face is a blow with the pick',
                `${h0} -> ${S.hell.faces[0].hits}`));
    // Hell's portal, both ways: from its end in hell up to the deep, and from
    // the deep's end down again.
    const up = portalEnd('hell', 'hell');
    await lookAt(up.x);
    clickAt(up.x, up.y);
    await arrived('deep');
    out.push(ok(S.view === 'deep', "hell: the portal in hell takes the view up to the deep", S.view));
    const slit = portalEnd('hell', 'deep');
    await lookAt(slit.x);
    clickAt(slit.x, slit.y);
    await arrived('hell');
    out.push(ok(S.view === 'hell', "hell: and the slit in the deep's floor brings it back down", S.view));
    window.__actsOn(null);
    return out;
  }]
];
