// The sheet pulled from tall to its seat by a real finger, over the
// debugging protocol, with the page's own frame times read back.
//
//   GAME=http://localhost:5231/ WINDOW=390,844 node tools/sheetpull.mjs
//
// Sixty moves of the finger on the handle, one a frame, and every frame's
// length in between (rAF deltas): a sheet that follows the finger costs a
// frame a move and nothing more, and the worst frame is what a jank is.

import { browser, closeOtherTabs, openTab } from './cdp.mjs';

const PORT = +(process.env.CDP_PORT || 9333);
const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT);
const read = async expr => (await tab.evaluate(expr)).result?.result?.value;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t = Date.now() / 1000, id = 0;
const at = (type, x, y, dt = 0) => { t += dt; if (type === 'touchStart') id++; return tab.send('Input.dispatchTouchEvent', {
  type, timestamp: t, touchPoints: type === 'touchEnd' ? [] : [{ x: Math.round(x), y: Math.round(y), id }]
}); };

// The bench as a sheet, dragged tall by the handle first.
const grip = await read(`(async () => {
  window.__scene('phonebench');
  await new Promise(r => setTimeout(r, 500));
  const h = document.getElementById('handle').getBoundingClientRect();
  return { x: h.left + h.width / 2, y: h.top + h.height / 2 };
})()`);
await at('touchStart', grip.x, grip.y);
for (let i = 1; i <= 10; i++) await at('touchMove', grip.x, grip.y - 20 * i, 0.016);
await at('touchEnd', grip.x, grip.y - 200, 0.016);
await sleep(500);
const tall = await read(`(() => { const r = document.getElementById('panel').getBoundingClientRect(); const h = document.getElementById('handle').getBoundingClientRect(); return { top: r.top, height: r.height, gx: h.left + h.width / 2, gy: h.top + h.height / 2 }; })()`);

// Frame lengths, recorded by the page while the finger pulls it back down.
await read(`(() => { globalThis.__ev = []; for (const t of ['pointerdown','pointermove','pointerup','pointercancel','touchstart','touchend']) document.getElementById('handle').addEventListener(t, e => globalThis.__ev.push(t + ':' + Math.round(e.clientY ?? (e.changedTouches && e.changedTouches[0].clientY)))); return 1; })()`);
await read(`(() => { globalThis.__frames = []; let last = performance.now(); const look = () => { const n = performance.now(); globalThis.__frames.push(n - last); last = n; if (globalThis.__frames.length < 200) requestAnimationFrame(look); }; requestAnimationFrame(look); return 1; })()`);
await at('touchStart', tall.gx, tall.gy);
for (let i = 1; i <= 60; i++) await at('touchMove', tall.gx, tall.gy + 5 * i, 0.016);
await at('touchEnd', tall.gx, tall.gy + 300, 0.016);
await sleep(400);
const frames = await read('globalThis.__frames');
const seat = await read(`(() => { const r = document.getElementById('panel').getBoundingClientRect(); return { top: r.top, height: r.height, hidden: document.getElementById('panel').hidden, tf: document.getElementById('panel').style.transform, cls: document.getElementById('panel').className }; })()`);
console.log('after', JSON.stringify(seat)); console.log('events', JSON.stringify(await read('globalThis.__ev.slice(0, 6).concat(globalThis.__ev.slice(-3))')));
const during = frames.slice(1, 70);
const worst = Math.max(...during);
console.log(`tall: top ${Math.round(tall.top)} h ${Math.round(tall.height)} -> after the pull: top ${Math.round(seat.top)} h ${Math.round(seat.height)} hidden ${seat.hidden}`);
console.log(`frames during the pull: ${during.length}, worst ${worst.toFixed(1)} ms, over 32 ms: ${during.filter(f => f > 32).length}, mean ${(during.reduce((a, b) => a + b, 0) / during.length).toFixed(1)} ms`);
console.log('  ' + during.map(f => f.toFixed(0)).join(' '));
// And the rows scrolled with the finger lifting over the yard: the sheet
// stays. (A real finger, since only the platform raises the pointerleave
// that once shut it.)
await sleep(300);
const rows = await read(`(() => { const l = document.querySelector('#panel > .sheet:not(.flyout)'); l.scrollTop = 0; const r = l.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 60, top: r.top }; })()`);
await at('touchStart', rows.x, rows.y);
for (let i = 1; i <= 10; i++) await at('touchMove', rows.x, rows.y - 30 * i, 0.016);
await at('touchEnd', rows.x, rows.y - 300, 0.016);
await sleep(400);
const after = await read(`({ hidden: document.getElementById('panel').hidden, open: __state().boardOpen, scrollTop: document.querySelector('#panel > .sheet:not(.flyout)').scrollTop })`);
console.log('rows scrolled, finger lifted over the yard:', JSON.stringify(after));
await tab.close();
own?.kill();
process.exit(0);
