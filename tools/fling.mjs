// A real finger on the yard, over the debugging protocol: a fling across
// bare sky, and the view read back frame by frame after the finger lifts.
//
//   GAME=http://localhost:5231/ WINDOW=390,844 node tools/fling.mjs
//
// The browser suite cannot do this. A touch dispatched from page script is a
// DOM event and nothing more -- the platform never scrolls on one -- so the
// in-page checks (selftest/touch.js) read the decision the game makes at
// `touchstart` and stand in for the coast by writing `scrollLeft`. This is
// the coast itself: `Input.synthesizeScrollGesture` is the platform's own
// touch path, fling and all, and the momentum the finger leaves behind is the
// platform's, which is the whole design (DESIGN.md, "Momentum scrolling").
// What it prints is `camX` and `scrollLeft` on each frame after the gesture;
// a fling that works reads as a run of values still moving after the finger
// has gone, slowing.

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

await read(`(() => { window.__seed(20250830); window.__nocine(); if (document.getElementById('touch').textContent !== 'touch: on') document.getElementById('touch').click(); window.__look(1500); return 1; })()`);
await new Promise(r => setTimeout(r, 200));
const before = await read(`({ camX: __state().camX, left: document.getElementById('scroller').scrollLeft })`);

// One finger in the band, a fast flick to the left. The protocol runs the
// gesture and answers when the finger is up; the frames after are the coast.
// In the band along the bottom edge: the yard above it never scrolls.
const y = +(process.env.Y || (await read('innerHeight')) - 12);
const speed = +(process.env.SPEED || 2500);
const distance = +(process.env.DISTANCE || 200);
const at = (type, x, t) => tab.send('Input.dispatchTouchEvent', {
  type, timestamp: t, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }]
});
// Timestamped, since the fling's speed is read off the events' own clock and
// not off how fast the protocol delivered them.
const steps = 8, dt = distance / speed / steps;
let t = Date.now() / 1000;
await at('touchStart', 300, t);
for (let i = 1; i <= steps; i++) { t += dt; await at('touchMove', 300 - distance * i / steps, t); }
await at('touchEnd', 300 - distance, t + dt);
const trace = await frames(60);

console.log('before', before);
console.log(`a flick of ${distance}px at ${speed}px/s, then a frame a line [camX, scrollLeft]:`);
console.log(trace.map(t => t.join('/')).join(' '));
const moving = trace.filter((t, i) => i > 0 && t[1] !== trace[i - 1][1]).length;
console.log(`${moving} of ${trace.length} frames still moving after the finger lifted`);
await tab.close();
own?.kill();
process.exit(0);
