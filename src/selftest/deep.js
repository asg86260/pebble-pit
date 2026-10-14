// The two views, by the pointer (DESIGN.md, "The way between the halves"):
// the arrow at the shaft and the corner's square take the camera down into
// the deep once the snatch has played and back up from it; the drowned
// surface and the deep's roof themselves take no click. The camera's part of
// it is test/deep-view.test.mjs; this is the click reaching it.

import { ok, point, onScreen, run, settle, hoverStation, hoverAway } from './kit.js';
import { countRect } from '../render/counter.js';
import { portalNearEdge } from '../render/portal.js';
import { S } from '../state.js';
import { P, VIEW_GLIDE_S, PORTAL_RX, BIRD_DUST } from '../config.js';
import { mouthX, portalX, portalCircle, deepPortal, deepTop, deepFloor, propRect, postX } from '../deep/place.js';
import { abyssLine } from '../pit.js';
import { arrowBox } from '../render/shaftway.js';
import { refreshCorner } from '../corner.js';
import { draw } from '../render.js';
import { now } from '../clock.js';

const click = (wx, wy) => {
  const [x, y] = onScreen(wx, wy);
  point('pointerdown', x, y);
  point('pointerup', x, y);
};
const clickArrow = deep => { const b = arrowBox(deep); click(b.x + b.w / 2, b.y + b.h / 2); };
// The corner is laid out by the page's frame, which the checks' clock does
// not run: it is laid out here before it is read.
const way = () => { refreshCorner(); return document.getElementById('way'); };
// The corner's square is a page button: pressed the way a pointer does.
const pressWay = () => {
  const b = way();
  if (!b || b.hidden) return false;
  const r = b.getBoundingClientRect();
  const at = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0 };
  b.dispatchEvent(new PointerEvent('pointerdown', at));
  b.dispatchEvent(new PointerEvent('pointerup', at));
  b.dispatchEvent(new MouseEvent('click', at));
  return true;
};

// A drowned yard, the camera on the shaft; `snatched` plays the snatch out.
function deepYard(snatched = true) {
  window.__crew(3, 3, 5, 7);
  if (snatched) window.__snatch({ played: true });
  else window.__rift();
  window.__view('yard');
  window.__look(mouthX() - S.viewW / 2);
  run(0.5);
}

export const TESTS = [
  ['deep: the arrow at the shaft goes down and up; the surface and the roof take no click', async () => {
    deepYard();
    // The liquid well clear of the portal, which is a way down of its own.
    click(mouthX() + PORTAL_RX * 3, abyssLine() + P * 2);
    run(VIEW_GLIDE_S + 0.5);
    const surface = S.view;
    clickArrow(false);
    run(VIEW_GLIDE_S + 0.5);
    const down = S.view;
    click(S.camX + S.viewW / 2, deepTop() + P * 3);
    run(VIEW_GLIDE_S + 0.5);
    const roof = S.view;
    clickArrow(true);
    run(VIEW_GLIDE_S + 0.5);
    const up = S.view;
    return [
      ok(surface === 'yard', 'a click on the surface is not a way down any more', surface),
      ok(down === 'deep', 'the arrow over the plank takes the view down', down),
      ok(roof === 'deep', 'a click on the roof is not a way up', roof),
      ok(up === 'yard', 'and the arrow in the light brings it back up', up)
    ];
  }],
  ['deep: a click on the conjured portal goes down, and on its deep end back up', async () => {
    deepYard();
    window.__look(portalX() - S.viewW / 2);
    run(2);                                // held open, and open all the way
    click(portalCircle().x, portalCircle().y);
    run(VIEW_GLIDE_S + 0.5);
    const down = S.view;
    click(deepPortal().x, deepPortal().y);
    run(VIEW_GLIDE_S + 0.5);
    return [ok(down === 'deep', 'the portal in the pit takes the view down', down),
            ok(S.view === 'yard', 'and its end in the deep brings it back up', S.view)];
  }],
  ['deep: the counter card keeps to the ground left of the torn portal', async () => {
    deepYard();
    window.__look(portalX() - S.viewW / 2);
    await settle(2);                       // held open, all the way, and drawn
    const box = countRect(), edge = (portalNearEdge() - S.camX) * S.zoom;
    return [ok(box && box.x + box.w <= edge, 'the card stands clear of the hole', box && `${box.x + box.w} > ${edge}`)];
  }],
  ['deep: the corner square goes down and up, and only after the snatch', async () => {
    deepYard(false);
    run(0.1);
    const hiddenBefore = way().hidden;
    deepYard();
    run(0.1);
    const pressed = pressWay();
    run(VIEW_GLIDE_S + 0.5);
    const down = S.view;
    pressWay();
    run(VIEW_GLIDE_S + 0.5);
    const up = S.view;
    return [
      ok(hiddenBefore, 'before the snatch there is no square'),
      ok(pressed && down === 'deep', 'after it, the square takes the view down', down),
      ok(up === 'yard', 'and back up', up)
    ];
  }],
  // A window taller than the deep lets its camera look up past the ceiling
  // into the yard's lowest rows, and whatever a shared layer draws over a
  // yard body -- a shout, a squat, a roster badge -- hung there over the
  // water. Here the camera is put up there by hand and the frame drawn twice,
  // with the yard's bodies saying something and with them quiet: in the deep
  // the two are the same picture, and in the yard (the control) they are not.
  // The camera is put across as well, over the yard's bodies: the deep's own
  // opens on the deep's end of the portal, mid-deep, with nobody of the
  // yard's under it, and the check would pass in the deep with nothing to hide.
  ['deep: nothing said over a yard body shows in the deep, even with the yard on the glass', async () => {
    deepYard();
    window.__view('deep');
    run(1);
    const up = S.workers.filter(w => w.y < S.worldH && !w.inside);
    const xs = up.map(w => w.x).sort((a, b) => a - b);
    const camX = (xs[xs.length >> 1] ?? 0) - S.viewW / 2;
    const seen = up.filter(w => w.x >= camX && w.x <= camX + S.viewW).length;
    const c = document.getElementById('c');
    const frame = (view, say) => {
      for (const w of up) w.say = say ? { mark: say, until: now() + 60000 } : null;
      const keep = { view: S.view, camX: S.camX, camY: S.camY };
      S.view = view;
      S.camX = camX;
      S.camY = S.groundY - S.viewH * 0.4;
      draw();
      S.view = keep.view; S.camX = keep.camX; S.camY = keep.camY;
      return c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    };
    const differ = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++; return n; };
    const out = [];
    for (const mark of ['bang', 'loo', 'burst']) {
      out.push(ok(differ(frame('deep', mark), frame('deep', null)) === 0, `a yard body's ${mark} is not drawn in the deep`,
                  `${differ(frame('deep', mark), frame('deep', null))} pixels`));
    }
    const shown = differ(frame('yard', 'bang'), frame('yard', null));
    out.push(ok(seen > 0 && shown > 0, 'and the same marks are drawn in the yard', `${seen} of ${up.length} bodies on the glass, ${shown} pixels`));
    for (const w of up) w.say = null;
    return out;
  }],
  // A strike is the yard's sky: its flash is a pane over the whole window, so
  // it would dim the deep too. The same frame with the bolt and without it
  // is the same picture in the deep and (the control) not in the yard.
  ['deep: a strike\'s flash in the yard does not reach the deep', async () => {
    deepYard();
    window.__strike(9, 9);
    const bolt = S.bolt;
    const c = document.getElementById('c');
    const frame = (view, lit) => {
      const keep = S.view;
      S.view = view;
      S.bolt = lit ? bolt : null;
      draw();
      S.view = keep;
      return c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    };
    const differ = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++; return n; };
    const deep = differ(frame('deep', true), frame('deep', false));
    const yard = differ(frame('yard', true), frame('yard', false));
    S.bolt = null;
    return [
      ok(!!bolt, 'a bolt was struck'),
      ok(deep === 0, 'the deep is the same picture with the strike as without', `${deep} pixels`),
      ok(yard > 0, 'and the yard is not', `${yard} pixels`)
    ];
  }],
  // The deep has no top on screen: a window taller than the deep looks up
  // past its ceiling, and the water goes on up there, stars and veil, rather
  // than a flat black band over it. The checks' window is short, so the
  // camera is put up there by hand, as the stuck-over-the-water check does.
  ['deep: the water reaches the top of a window that looks up past the deep', async () => {
    deepYard();
    window.__view('deep');
    run(1);
    const c = document.getElementById('c');
    const keep = S.camY;
    S.camY = deepTop() - S.viewH / 2;
    draw();
    S.camY = keep;
    // The band over the deep's ceiling, clear of the corner's squares.
    const y0 = Math.round(c.height * 0.15), h = Math.round(c.height * 0.3);
    const d = c.getContext('2d').getImageData(0, y0, c.width, h).data;
    let lit = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) lit++;
    const share = lit / (d.length / 4);
    return [ok(share > 0.01, 'the water is lit over the deep\'s ceiling, not a black band', `${(share * 100).toFixed(2)}% lit`)];
  }],
  // The pods stand from the snatch with the sqwife's in them, so their board
  // is there from the deep's first frame; another pod is sold on it and not
  // on the altar's.
  ['deep: walking up to the pods opens their own board, with another pod on it', async () => {
    deepYard();
    window.__view('deep');
    run(VIEW_GLIDE_S + 0.5);
    const at = await hoverStation('pods');
    const open = S.podsBoardOpen;
    const rows = [...document.querySelectorAll('#podsshop [data-key]')].map(r => r.dataset.key);
    const title = document.querySelector('#podsboard .title')?.textContent.trim();
    await hoverAway();
    await hoverStation('altar');
    const altar = [...document.querySelectorAll('#altarshop [data-key]')].map(r => r.dataset.key);
    await hoverAway();
    return [
      ok(!!at && open, 'the pods open a board', at ? `${S.pods} pods` : 'no ground'),
      ok(title === 'the pods', 'which says whose it is', title),
      ok(rows.includes('pod'), 'another pod is on it', rows.join(' ')),
      ok(!altar.includes('pod'), "and not on the altar's", altar.join(' '))
    ];
  }]
];

// --- anchor: RAILS (the party wave, track BOARD) ------------------------------------
// A station's board under a real pointer (deep/rails.js): the pip tree with
// a hover line, the rows the only things pressed, the fork a row a class, and
// Reset. What each press does to the station is test/rails.test.mjs; this is
// the press reaching it, and the tree being drawn.
import { showPanel } from '../board.js';
import { seatRails } from '../deep/rails.js';
import { stationById, levelingUp } from '../deep/party.js';
import { chooseMarkAt } from '../render/deep.js';
import { RAIL_FOLD_MS, FORK_RUNG } from '../config.js';
import { tap, sleep, raf } from './kit.js';

const rails = id => document.querySelector(`.rails[data-station="${id || 's1'}"]`);
const seat = async () => { seatRails(); await raf(); await raf(); seatRails(); };
// A rung bought shuts the board for the fighter's level-up: the player waits
// it out and opens the board again.
const reopen = async id => {
  for (let i = 0; i < 60 && levelingUp(stationById(id)); i++) { window.__fast(0.1); await raf(); }
  showPanel(id, true);
  await seat();
};
const rowNamed = (id, text) => [...(rails(id)?.querySelectorAll('.rl-row') || [])].find(b => b.querySelector('.rl-t').textContent === text);

TESTS.push(['rails: the rows climb the base unit, the fork takes a class and closes the other branch, Reset stands the Recruit again', async () => {
  // An altar and a spire, and a purse for every band.
  window.__fullSites();
  window.__party({ stations: [{ kind: 'altar' }, { kind: 'spire' }] });
  S.seenSpark = true;
  window.__scales(99999);
  window.__grant({ dust: 1e8, shards: 1e6, sparks: 1e5 });
  showPanel('s1', true);
  await seat();
  const st = S.stations[0];
  const up = !!rails() && S.stationBoardOpen === 's1';
  const pips = rails().querySelectorAll('.rl-tree i').length;
  // A hover on a pip says what it is; pips are never pressed.
  const pip = rails().querySelector('.rl-arm i.big');
  pip.dispatchEvent(new PointerEvent('pointerenter'));
  // The hover line stands on the page, not in the board (a sheet clips its own edge).
  const tip = [...document.querySelectorAll('.rl-tip')].pop();   // the newest mount is the open board's
  const said = !tip.hidden && tip.textContent;
  pip.dispatchEvent(new PointerEvent('pointerleave'));
  await tap(rowNamed('s1', 'Fighter'));
  await raf();
  const shut = S.stationBoardOpen !== 's1' && levelingUp(stationById('s1'));
  await reopen('s1');
  for (let r = 2; r < FORK_RUNG; r++) { await tap(rowNamed('s1', 'Fighter')); await reopen('s1'); }
  const base = st.cls === null && st.rung === FORK_RUNG - 1;
  const ask = rails().querySelector('.rl-ask')?.textContent || '';
  // each specialist's row names its capstone's status, bold, its line on hover
  const stun = [...rails().querySelectorAll('.rl-row .rl-st')].find(b => b.textContent === 'Stun');
  stun?.dispatchEvent(new PointerEvent('pointerenter'));
  const stunSaid = !tip.hidden && tip.textContent;
  stun?.dispatchEvent(new PointerEvent('pointerleave'));
  const bold = stun && getComputedStyle(stun).fontWeight >= 700;
  await tap(rowNamed('s1', 'Become a Swordsman'));
  await reopen('s1');
  await sleep(RAIL_FOLD_MS + 100);
  const took = st.cls === 'sword' && st.rung === FORK_RUNG && st.paid.some(([m, n]) => m === 'scale' && n > 0);
  const gone = [...rails().querySelectorAll('.rl-arm')].map(a => a.classList.contains('gone'));
  const lit = rails().querySelectorAll('.rl-tree i.on').length;
  await tap(rails().querySelector('.rl-reset'));
  await seat();
  const blanked = stationById('s1').cls === null && stationById('s1').kind === null && stationById('s1').rung === 0 &&
                  stationById('s1').paid.length === 0;
  const again = !!rails().querySelector('.rl-five') && !!rails().querySelector('.rl-become');
  showPanel(null, true);
  return [
    ok(up, "the station's board is up", `${S.stationBoardOpen}`),
    ok(pips === 3 + 2 * 5, 'its tree: three pips, then five a branch', `${pips}`),
    ok(said === 'Combos: chain punches', 'a hover on a pip says what it is', `${said}`),
    ok(shut, "a rung bought shuts the board while the fighter's level-up plays", `${S.stationBoardOpen}`),
    ok(base, 'the rows climb the Fighter to the fork', JSON.stringify(st)),
    ok(ask === 'Specialize', 'where the board asks it to specialize', ask),
    ok(bold && /^Stun: /.test(stunSaid || ''), "each row's status bold, its line on hover", `${stunSaid}`),
    ok(took, 'the Swordsman row takes the Swordsman, paid in scales', JSON.stringify(st)),
    ok(gone.join() === 'true,false', "and the Brawler's branch closes", gone.join()),
    ok(lit === FORK_RUNG, 'the pips climbed are lit', `${lit}`),
    ok(blanked, 'Reset blanks the station, kind and all'),
    ok(again, "and stands the Recruit's tree again")
  ];
}]);

// The first station under a real pointer: it stands from the snatch, free,
// nothing picked (deep/party.js, `standFirst`), so the floating build button
// (deep/buildbutton.js) has nothing to sell until a fang is held. Its
// Recruit's board (voted R2) offers the three starting kinds as nodes; a tap
// on one only looks, and the button under it buys rung 1.
TESTS.push(['rails: the first station stands from the snatch, and its Recruit tree picks the fighter', async () => {
  window.__snatch({ played: true });
  window.__view('deep');
  await raf(); await raf();
  const btn = document.getElementById('buildbtn');
  const queued = S.stations[0] && { ...S.stations[0] }, fangs = S.fangs;
  const gone = !btn || !btn.classList.contains('on');
  run(VIEW_GLIDE_S + 0.5);
  window.__look(stationById('s1') && chooseMarkAt(stationById('s1')).x - 300);
  await sleep(120);
  const m = chooseMarkAt(stationById('s1'));
  point('pointermove', ...onScreen(m.x + m.w / 2, m.y + m.h / 2), 0);
  await sleep(250);
  const tipEl = document.getElementById('tip');
  const asks = !tipEl.hidden && tipEl.textContent;
  await hoverAway();
  window.__scales(99999);
  window.__grant({ dust: 1e8 });
  showPanel('s1', true);
  await seat();
  const nodes = [...(rails()?.querySelectorAll('.rl-node:not(:disabled)') || [])].map(b => b.dataset.look);
  const firstLook = rails()?.querySelector('.rl-become .rl-t')?.textContent;
  await tap(rails().querySelector('.rl-node[data-look="armory"]'));
  await seat();
  const looked = rails().querySelector('.rl-become .rl-t')?.textContent, stillRecruit = stationById('s1').kind === null;
  const glyphs = rails().querySelectorAll('.rl-pick .rl-bn svg').length;
  await tap(rails().querySelector('.rl-become'));
  await seat();
  const st = { ...stationById('s1') };
  showPanel(null, true);
  // with three fangs held, the button asks one
  S.fangs = 3;
  await raf(); await raf();
  const price = btn.querySelector('.count')?.textContent;
  return [
    ok(queued && queued.id === 's1' && queued.kind === null && queued.built && fangs === 0,
       'the first station stands from the snatch, free, with nothing picked', JSON.stringify(queued)),
    ok(gone, 'and the build button has nothing to sell, with no fang held'),
    ok(asks === 'choose a fighter', 'it stands wearing the mark, which asks for a fighter', `${asks}`),
    ok(nodes.join() === 'altar,armory,spire', "once it stands, its Recruit's tree offers the three starting kinds", nodes.join()),
    ok(firstLook === 'Become a Fighter' && looked === 'Become a Scout' && stillRecruit, 'a node only looks', `${firstLook} / ${looked}`),
    ok(glyphs === 2, "the one looked at opens with its two specialists' glyphs", `${glyphs}`),
    ok(st.kind === 'armory' && st.rung === 1, 'the button under it buys rung 1: a Scout', JSON.stringify(st)),
    ok(price === '×1', 'with fangs held, the build button asks one of them', price)
  ];
}]);

// A station is its fighter and a prop (DESIGN.md): its ground spans the prop
// and the fighter's post, so the pointer on either opens its board, and the
// board says whose it is -- the fighter's, not the old building's.
TESTS.push(['rails: the pointer on a station\'s prop or its fighter opens the board, titled by the fighter', async () => {
  window.__fullSites();
  window.__party({ stations: [{ kind: 'altar', cls: null, rung: 0 }, { kind: 'armory', cls: 'ranger', rung: 8 }] });
  window.__view('deep');
  run(VIEW_GLIDE_S + 0.5);
  const seen = [];
  for (const st of S.stations) {
    const p = propRect(st), post = postX(st);
    for (const [name, wx] of [['prop', p.x + p.w / 2], ['post', post + P]]) {
      window.__look(wx - 400);
      await sleep(120);
      const [x, y] = onScreen(wx, deepFloor() - P * 2);
      point('pointermove', x, y, 0);
      await sleep(250);
      await seat();
      seen.push({ id: st.id, name, open: S.stationBoardOpen === st.id,
                  title: document.querySelector(`#${st.id}board .title`)?.textContent.trim() });
      await hoverAway();
    }
  }
  const at = (id, name) => seen.find(o => o.id === id && o.name === name);
  return [
    ok(seen.every(o => o.open), 'the pointer on the prop and on the post opens the board',
       seen.map(o => `${o.id} ${o.name} ${o.open}`).join(', ')),
    ok(at('s1', 'prop')?.title === 'the Fighter', "a base unit's board is the Fighter's", at('s1', 'prop')?.title),
    ok(at('s2', 'post')?.title === 'the Ranger', "a class's board is its fighter's", at('s2', 'post')?.title)
  ];
}]);

// The hand in the deep, the player's way: a press on the floor's loose
// scales by the crusher sweeps them onto the pointer, where they are drawn
// as the yard's dust is, and let go anywhere on the furnace they go in at its
// mouth and are crushed (DESIGN.md, "The crusher").
import { crusherRect } from '../deep/place.js';
TESTS.push(['deep: a handful swept off the floor shows on the pointer, and let go on the furnace goes in', async () => {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
  window.__looseScales(400);
  window.__levels({ carryLevel: 4 });
  window.__view('deep');
  run(VIEW_GLIDE_S + 0.5);
  const c = crusherRect();
  window.__look(c.x + c.w / 2 - S.viewW / 3);
  run(0.2);
  const purse = S.scales;
  const bx = c.x + c.w + P * 10, by = deepFloor() - P;
  point('pointerdown', ...onScreen(bx, by));
  for (let i = 0; i < 4; i++) point('pointermove', ...onScreen(bx + i * P, by));
  const held = S.heldScales;
  // Carried onto the furnace's door, still held: what the hand holds is drawn
  // round it. The same frame painted with the hand emptied for a moment is
  // the difference.
  const hx = c.x + c.w / 2, hy = c.y + c.h * 0.7;
  point('pointermove', ...onScreen(hx, hy));
  run(0.3);
  const [sx, sy] = onScreen(hx, hy);
  const box = () => {
    draw();
    const r = 6 * P * S.zoom, g = document.getElementById('c').getContext('2d');
    const k = devicePixelRatio || 1;
    return g.getImageData(Math.round((sx - r) * k), Math.round((sy - r) * k), Math.round(2 * r * k), Math.round(2 * r * k)).data;
  };
  const withHand = box();
  const motes = S.motes; S.motes = [];
  const without = box();
  S.motes = motes;
  let differ = 0;
  for (let i = 0; i < withHand.length; i += 4) if (withHand[i] !== without[i] || withHand[i + 1] !== without[i + 1]) differ++;
  point('pointerup', ...onScreen(hx, hy));
  const inWater = S.sinking.length;
  // One grain's path, every frame, for the report when it misses.
  const one = S.sinking[0], path = [];
  for (let f = 0; f < 60 * 15; f++) {
    window.__fast(1 / 60);
    if (f % 20 === 0 && S.sinking.includes(one)) path.push(`${Math.round(one.x - c.x)},${Math.round(one.y - c.y)}`);
  }
  return [
    ok(held > 0, 'the press took scales off the floor', `${held}`),
    ok(differ > 0, 'and they are drawn on the pointer while held', `${differ} pixels`),
    ok(inWater >= held && S.heldScales === 0, 'let go, they all went into the water', `${inWater} of ${held}`),
    ok(S.scales - purse === held, 'and every one fell into the crusher', `${S.scales - purse} of ${held}; one, off the crusher's corner: ${path.join(' ')}`)
  ];
}]);

// The right button held looks at the crew (DESIGN.md, "Holding the right
// button looks at the crew") in the deep as in the yard: what is behind the
// bodies veiled, each body ringed. Pressed through the real pointer on a
// body, then the frame drawn with the sight held and with it let go, from the
// same instant: the ring's left side has gone over to the body's own ink, and
// the veil has changed a good share of the window (the deep's open water is
// its paper, and a veil over paper changes nothing). The yard is the control.
import { inTheDeep } from '../render/crew.js';
import { isFighter } from '../render/arms.js';
import { WORKER, SIGHT_IN_MS, SIGHT_GAP, SIGHT_RING, DEEP_SURFACE } from '../config.js';
TESTS.push(['deep: the right button held veils the deep and rings its crew, as in the yard', async () => {
  const c = document.getElementById('c'), g = c.getContext('2d'), k = devicePixelRatio || 1;
  const px = (wx, wy) => {
    const [x, y] = onScreen(wx, wy);
    return [...g.getImageData(Math.floor(x * k), Math.floor(y * k), 1, 1).data].slice(0, 3).join(',');
  };
  // Zoomed out, a ring two pixels wide is under two on the glass and comes
  // out part-toned, and the page's press shades it too: the ring is a pixel
  // well over toward the body's ink from what is there with the sight let go.
  const tone = p => +p.split(',')[0];
  const toward = (held, free, ink) => Math.abs(tone(held) - tone(ink)) + 64 < Math.abs(tone(free) - tone(ink));
  // The ring is read along one side of the body, chosen when the frame is
  // drawn: a body stands over its neighbor's ring where they rest together
  // (the crusher's gatherers do), so the side read is one no other body, nor
  // the stack it carries over its head, reaches into.
  const ringSides = w => {
    const g0 = SIGHT_GAP, r = SIGHT_RING, W = WORKER, mid = r / 2;
    const along = a => { const o = []; for (let d = P; d < W - P; d += 2) o.push(a(d)); return o; };
    return [
      { box: [w.x - g0 - r, w.y, r, W], pts: along(d => [w.x - g0 - mid, w.y + d]) },
      { box: [w.x + W + g0, w.y, r, W], pts: along(d => [w.x + W + g0 + mid, w.y + d]) },
      { box: [w.x, w.y + W + g0, W, r], pts: along(d => [w.x + d, w.y + W + g0 + mid]) },
      { box: [w.x, w.y - g0 - r, W, r], pts: along(d => [w.x + d, w.y - g0 - mid]) }
    ];
  };
  const covered = (w, [x, y, bw, bh]) => S.workers.some(o => o !== w && !o.lifted &&
    o.x < x + bw && o.x + WORKER > x && o.y - P * 14 < y + bh && o.y + WORKER > y);
  const look = (half, w) => {
    const [x, y] = onScreen(w.x + WORKER / 2, w.y + WORKER / 2);
    point('pointerdown', x, y, 2, 2);
    const held = S.crewSight != null;
    run(SIGHT_IN_MS / 1000 + 0.2);
    const read = () => {
      draw();
      const ink = px(w.x + 1, w.y + WORKER / 2);
      const sides = ringSides(w), use = sides.find(o => !covered(w, o.box)) || sides[0];
      const side = use.pts.map(([wx, wy]) => px(wx, wy));
      return { ink, side, all: g.getImageData(0, 0, c.width, c.height).data };
    };
    const on = read();
    const keep = S.crewSight;
    S.crewSight = null;
    const off = read();
    S.crewSight = keep;
    point('pointerup', x, y, 0, 2);
    let differ = 0, n = 0;
    for (let i = 0; i < on.all.length; i += 64, n++) if (on.all[i] !== off.all[i]) differ++;
    return [
      ok(held, `${half}: the right button down on a body holds the sight`, String(held)),
      // The deep is drawn inverted, so its ink is the paper's tone: the ring
      // is a pixel far from what is there with the sight let go.
      ok(on.side.every((p, i) => (half === 'deep' ? Math.abs(tone(p) - tone(off.side[i])) > 64 : toward(p, off.side[i], on.ink))),
         `${half}: and the body wears a ring`, `ink ${on.ink}; held ${on.side.join(' ')}; let go ${off.side.join(' ')}`),
      ok(differ > n / 10, `${half}: and what is behind it is veiled`, `${differ} of ${n} samples`)
    ];
  };
  deepYard();
  // Hands of the deep's own beside the fighter the snatch stands, and the
  // first trip down already had, so the view is the player's.
  window.__deepCrew({ spare: 3 });
  if (!S.beatsDone.includes('abyss')) S.beatsDone.push('abyss');
  run(1);
  const onGlass = w => w.x > S.camX + 40 && w.x < S.camX + S.viewW - 40;
  // Wherever the yard's crew are, the camera goes to one of them.
  const pick = S.workers.find(w => !w.lifted && !w.inside && !inTheDeep(w) && !w.aloft);
  if (pick) { window.__look(pick.x - S.viewW / 2); run(0.1); }
  const up = S.workers.find(w => !w.lifted && !w.inside && !inTheDeep(w) && onGlass(w));
  const yard = up ? look('yard', up) : [ok(false, 'yard: a body on the glass')];
  window.__view('deep');
  run(VIEW_GLIDE_S + 1);
  const below = S.workers.find(w => !w.lifted && inTheDeep(w) && !isFighter(w) && w.y > deepTop() + DEEP_SURFACE + P * 4);
  if (below) { window.__look(below.x - S.viewW / 2); run(0.1); }
  const down = S.workers.find(w => !w.lifted && inTheDeep(w) && !isFighter(w) &&
                                   w.y > deepTop() + DEEP_SURFACE + P * 4 && onGlass(w));
  const deep = down ? look('deep', down)
                    : [ok(false, 'deep: a body on the glass', String(S.workers.filter(inTheDeep).length))];
  // The rest of the pointer's crew controls down there: with the right button
  // held, the left takes the body under the hand (a chord arrives as a move),
  // and the middle button drags the view along.
  let lifted = false, panned = false, why = '';
  if (down) {
    const [x, y] = onScreen(down.x + WORKER / 2, down.y + WORKER / 2);
    point('pointerdown', x, y, 2, 2);
    point('pointermove', x, y, 3, 0);
    // The body the hand finds: gatherers resting by the crusher stand
    // together, and the top one of them is the one taken.
    const got = S.workers.find(o => o.lifted);
    lifted = !!got && inTheDeep(got);
    why = `${got ? got.type : 'none'} under the hand`;
    point('pointerup', x, y, 0, 2);
    run(3);
    for (const dx of [-120, 120]) {
      const was = S.camX;
      point('pointerdown', x, y, 4, 1);
      point('pointermove', x + dx, y, 4, -1);
      point('pointerup', x + dx, y, 0, 1);
      panned = panned || S.camX !== was;
    }
  }
  deep.push(ok(lifted, 'deep: right and left together lift the body', why),
            ok(panned && S.view === 'deep', 'deep: and the middle button drags the view', `${panned} ${S.view}`));
  return [...yard, ...deep];
}]);

// The constrict's orb under a real pointer (deep/phases.js): its fighter
// stands on its station's ground, and the orb rises until it is clear of the
// station's hit box. A mouse coming up from the fighter's post onto the orb,
// clicking, and pressing and holding, and a finger tapping it: each press
// takes from the orb, and no board is up over it once the pointer is on it.
import { SCENES } from '../scenes.js';
import { orbOn, orbMiddle } from '../deep/phases.js';
import { postY } from '../deep/place.js';
import { hitRect } from '../stations.js';
import { ORB_R, ORB_CLOSE_S, ORB_RISE_S } from '../config.js';
import { panel, canvas } from './kit.js';
TESTS.push(['deep: a press on the constrict\'s orb hits the orb and opens no board, by mouse or finger', async () => {
  SCENES['phase-orb'].run();
  // The party swims down from the portal: held in the orb's turn until a
  // fighter is standing on its post (the brawler the scene casts it on goes
  // up to the coil), and the orb moved onto that one, outlasting the party's
  // blows (they land on it first) and every press below.
  const turn = S.mechAt;
  if (S.orb) S.orb.hp = S.orb.max = 1e9;
  const onPost = () => S.workers.find(b => b.station && S.stations.some(s => s.id === b.station) && Math.abs(b.y - postY()) < P);
  for (let i = 0; i < 240 && !onPost(); i++) { run(0.25); S.mechAt = turn; }
  if (S.orb && onPost()) S.orb.st = onPost().station;
  const o = orbOn(), w = o && S.workers.find(b => b.station === o.st);
  if (!w || Math.abs(w.y - postY()) >= P) {
    return [ok(false, 'a fighter held in the orb, on its post', JSON.stringify({ orb: S.orb, y: w?.y, post: postY() }))];
  }
  o.at = now() - (ORB_CLOSE_S + ORB_RISE_S) * 1000;   // closed and risen all the way
  const mid = orbMiddle(o.st), hit = hitRect(o.st);
  const clear = mid.y + ORB_R * P <= hit.y;
  const open = () => !panel().hidden || panel().classList.contains('open');
  // `up` 0 is the fighter's spot on its post, 1 the orb's middle
  const at = (up = 1) => { const m = orbMiddle(o.st); return onScreen(m.x, w.y + WORKER - (w.y + WORKER - m.y) * up); };
  const ev = (kind, type, [x, y], buttons) => canvas().dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: y, pointerId: kind === 'touch' ? 7 : 1, isPrimary: true,
    pointerType: kind, button: 0, buttons, bubbles: true }));
  const seen = [];
  const press = async (kind, hold) => {
    const hp = o.hp;
    if (kind === 'mouse') {
      // up from the feet, across the station's ground, onto the orb
      for (const k of [0, 0.25, 0.5, 0.75, 1]) { ev(kind, 'pointermove', at(k), 0); await sleep(120); }
      await sleep(200);
    }
    const over = open();
    ev(kind, 'pointerdown', at(), 1);
    if (hold) await sleep(400);
    ev(kind, 'pointerup', at(), 0);
    await sleep(250); await raf();
    seen.push({ kind, hold, hit: o.hp < hp, over, open: open() });
    await hoverAway();
  };
  for (let i = 0; i < 3; i++) await press('mouse', false);
  await press('mouse', true);
  for (let i = 0; i < 3; i++) await press('touch', false);
  const say = seen.map(s => `${s.kind}${s.hold ? ' held' : ''}: hit ${s.hit}, board on arrival ${s.over}, after ${s.open}`).join('; ');
  return [
    ok(clear, 'risen, the orb is clear of its station\'s hit box', `bottom ${mid.y + ORB_R * P}, hit box top ${hit.y}`),
    ok(orbOn() === o, 'the orb holds through the presses', JSON.stringify(S.orb)),
    ok(seen.every(s => s.hit), 'every press on the orb takes from it', say),
    ok(seen.every(s => !s.over && !s.open), 'and no board is up over it, on arrival or after the press', say)
  ];
}]);

// A creature of the deep under a real pointer (deep/fauna.js): the click
// reaches `startleFauna` past the coil and the stations, shakes the bird's
// handful loose where the creature was, and it plays its reaction (the
// school bolts). The reactions frame by frame, the sinking and the carrying
// are test/deep-creature-click.test.mjs.
TESTS.push(['deep: a click on a creature startles it, and it shakes loose a handful of scales', async () => {
  deepYard();
  window.__view('deep');
  run(VIEW_GLIDE_S + 0.5);
  // One up in the light, clear of the coil's band and the stations' floor.
  const pickOne = () => window.__fauna().find(f => !f.bolting && !f.reacting && f.inside && (f.zone === 'sun' || f.zone === 'twi'));
  const first = pickOne();
  window.__look(first.x - S.viewW / 2);
  run(0.1);
  const f = window.__fauna()[first.i];
  const sinking = S.sinking.length;
  click(f.x, f.y);
  const shaken = S.sinking.length - sinking;
  const after = window.__fauna()[f.i];
  return [
    ok(!f.bolting && !f.reacting, 'it was there to be clicked', `${f.kind} at ${Math.round(f.x)},${Math.round(f.y)}`),
    ok(after.reacting || after.bolting, 'the click startles it into its reaction', after.kind),
    ok(shaken === BIRD_DUST, "and it shakes loose the bird's handful", `${shaken}`)
  ];
}]);

// A stream creature under a real pointer (deep/flow.js): one of the far
// crossings, up over the fight where neither the serpent nor a station takes
// the click first. It reacts, and shakes loose the same handful.
TESTS.push(['deep: a click on a stream creature makes it react, and it shakes loose a handful of scales', async () => {
  deepYard();
  window.__view('deep');
  run(VIEW_GLIDE_S + 0.5);
  const seen = s => !s.near && s.clickable && s.x > S.camX + P * 10 && s.x < S.camX + S.viewW - P * 10;
  let s = null;
  for (let i = 0; i < 60 && !(s = window.__stream().find(seen)); i++) run(4);
  const sinking = S.sinking.length;
  if (s) click(s.x, s.y);
  const shaken = S.sinking.length - sinking;
  const after = s && window.__stream().find(g => g.key === s.key);
  return [
    ok(s, 'a crossing came by on the glass', s ? `kind ${s.kind} at ${Math.round(s.x)},${Math.round(s.y)}` : 'none'),
    ok(after && after.reacting, 'the click makes it react'),
    ok(shaken === BIRD_DUST, "and it shakes loose the bird's handful", `${shaken}`)
  ];
}]);
