// A real finger on the yard, over the debugging protocol: a drag that starts
// on dust, a fling across bare sky, and a tap on a row, with the game read
// back after each.
//
//   GAME=http://localhost:5231/ WINDOW=390,844 node tools/fling.mjs
//
// The browser suite cannot do this. A touch dispatched from page script is a
// DOM event and nothing more -- the platform never scrolls on one -- so the
// in-page checks (selftest/touch.js) read the decision the game makes at
// `touchstart` and stand in for the coast by writing `scrollLeft`. This is
// the platform's own touch path (`Input.dispatchTouchEvent`, timestamped so
// the fling's speed is read off the events' own clock): the three things
// DESIGN.md's "Momentum scrolling" promises, seen from outside the page.
//
// Two things about the platform, learned here: a headless shell scrolls one
// for one with the finger and may not animate the coast after the lift (a
// phone does); and a touch that lands while a fling is in flight is not
// cancelable -- it catches the fling, and the page cannot claim it -- which
// is why the dust drag comes first and a tap stops the fling before the row
// is pressed.

import { browser, closeOtherTabs, openTab } from './cdp.mjs';

const PORT = +(process.env.CDP_PORT || 9333);
const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT);

const read = async expr => (await tab.evaluate(expr)).result?.result?.value;
const frames = n => read(`new Promise(ok => {
  const out = [];
  const sc = document.getElementById('scroller');
  const look = () => {
    out.push([Math.round(__state().camX), Math.round(sc.scrollLeft)]);
    if (out.length < ${n}) requestAnimationFrame(look); else ok(out);
  };
  requestAnimationFrame(look);
})`);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t = Date.now() / 1000, id = 0;
const at = (type, x, y, dt = 0) => { t += dt; if (type === 'touchStart') id++; return tab.send('Input.dispatchTouchEvent', {
  type, timestamp: t, touchPoints: type === 'touchEnd' ? [] : [{ x: Math.round(x), y: Math.round(y), id }]
}); };
const stroke = async (x, y, dx, speed = 2500, steps = 8) => {
  const dt = Math.abs(dx) / speed / steps;
  await at('touchStart', x, y);
  for (let i = 1; i <= steps; i++) await at('touchMove', x + dx * i / steps, y, dt);
  await at('touchEnd', x + dx, y, dt);
};
const tap = async (x, y) => { await at('touchStart', x, y); await at('touchEnd', x, y, 0.05); };

await read(`(() => { window.__seed(20250830); window.__nocine(); window.__coarse(true); window.__look(1500); return 1; })()`);
await sleep(200);

// 1. a drag that starts on dust: the sweep, and the view stays
const spot = await read(`(() => {
  const s = __state();
  window.__pile(s.camX + s.viewW / 2, 40); window.__fast(2);
  const s3 = __state();
  for (let dx = -60; dx <= 60; dx += 6) {
    const x = s3.camX + s3.viewW / 2 + dx;
    if ([-6, 0, 6].every(k => window.__dustUnder(x + k, s3.groundY - 6) && window.__dustUnder(x, s3.groundY - 6 + k)))
      return { x: (x - s3.camX) * s3.zoom, y: (s3.groundY - 6 - s3.camY) * s3.zoom, camX: s3.camX, held: s3.held, floor: s3.floor };
  }
  return null;
})()`);
if (spot) {
  await at('touchStart', spot.x, spot.y);
  await at('touchMove', spot.x - 40, spot.y, 0.05);
  await at('touchMove', spot.x - 80, spot.y, 0.05);
  const mid = await read(`({ camX: __state().camX, held: __state().held, dragging: __state().dragging })`);
  await at('touchMove', spot.x - 160, spot.y, 0.05);
  await at('touchEnd', spot.x - 160, spot.y, 0.05);
  await sleep(300);
  const after = await read(`({ camX: __state().camX })`);
  console.log(`1. a drag from dust: mid-drag sweeping ${mid.dragging} with ${mid.held} in hand; camX ${spot.camX} -> ${mid.camX} -> ${after.camX} (the view stayed: ${after.camX === spot.camX})`);
} else console.log('1. no dust to press on');

// 2. a fling across bare sky: the view moves, and keeps moving if the
// platform coasts
const before = await read(`({ camX: __state().camX, left: document.getElementById('scroller').scrollLeft })`);
await stroke(300, 200, -200);
const trace = await frames(40);
console.log('2. a fling on bare sky, from', before);
console.log('   [camX/scrollLeft] a frame:', trace.map(t => t.join('/')).join(' '));
const moving = trace.filter((t, i) => i > 0 && t[1] !== trace[i - 1][1]).length;
console.log(`   moved ${trace[0][0] - before.camX} px on the lift; ${moving} of ${trace.length} frames still moving after`);

// 3. a tap on a row buys it. A tap on the sky first: it catches the fling,
// which the platform otherwise keeps for its own.
await tap(300, 200);
await sleep(300);
const row = await read(`(async () => {
  window.__give(3000); window.__build(); window.__board('bench');
  await new Promise(r => setTimeout(r, 400));
  const b = document.querySelector('#shop button[data-key="carry"]');
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, stored: __state().stored };
})()`);
await tap(row.x, row.y);
await sleep(300);
const bought = await read(`({ stored: __state().stored })`);
console.log(`3. a tap on the carry row: dust ${row.stored} -> ${bought.stored} (bought: ${bought.stored < row.stored})`);

await tab.close();
own?.kill();
process.exit(0);
