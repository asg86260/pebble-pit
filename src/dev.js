// The dev panel. It is not part of the game.
//
// Everything in here is a shortcut to something the console hooks already do --
// but a slider you can push while watching the yard tells you things a number
// typed into a console never will, and most of the numbers in this game were
// found by sitting with it rather than by working them out.
//
// It is loaded only under `vite dev`: main.js reaches for it behind
// `import.meta.env.DEV`, so a build never sees this file at all. Backtick or
// tilde -- the same key, shift or no shift -- opens and closes it; it starts
// closed and remembers which you chose.

import { S } from './state.js';
import { SKY } from './smog.js';
import { TUNABLE, tune, tuned, PROP_FROM, PROP_COST, PROP_PLANKS } from './config.js';
import { relayout, beat } from './main.js';

const KEY = 'boulder-clicker/dev-open';
const el = document.createElement('div');
el.id = 'dev';
el.hidden = localStorage.getItem(KEY) !== '1';
document.body.appendChild(el);

const rows = [];
const line = (label, build) => {
  const row = document.createElement('div');
  row.className = 'devrow';
  const name = document.createElement('span');
  name.textContent = label;
  row.appendChild(name);
  const box = document.createElement('span');
  box.className = 'devbox';
  build(box);
  row.appendChild(box);
  el.appendChild(row);
  return row;
};

const button = (box, text, fn) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.addEventListener('click', () => { fn(); refresh(); });
  box.appendChild(b);
  return b;
};

// how many of each job, straight off, with the same call the checks use
const crew = ['miners', 'haulers', 'quarriers', 'farmhands'];
const jobs = { miners: 'rock', haulers: 'carry', quarriers: 'quarry', farmhands: 'farm' };
const hire = (which, d) => {
  const n = crew.map(k => S[k]);
  const i = crew.indexOf(which);
  n[i] = Math.max(0, n[i] + d);
  window.__crew(n[0], n[1], n[2], n[3]);
};

for (const k of crew) {
  line(jobs[k], box => {
    button(box, '-', () => hire(k, -1));
    const n = document.createElement('b');
    n.dataset.crew = k;
    box.appendChild(n);
    button(box, '+', () => hire(k, 1));
  });
}

line('give', box => {
  button(box, 'dust', () => window.__give(1000));
  // The hole holds about thirty-seven thousand now, and a building is priced
  // against that rather than against a scrape -- so there is a button that fills
  // it rather than only one that tops it up.
  button(box, 'fill', () => window.__give(999999));
  button(box, 'core', () => window.__grant({ cores: 5 }));
  button(box, 'shard', () => window.__grant({ shards: 5 }));
  button(box, 'spore', () => window.__grant({ spores: 5 }));
});

// Every building, not the three that happened to be here first. The quarry and the
// plots carry their own boards now, and the school, the house and the table are
// all places you walk to -- so all of them open from one line.
line('open', box => {
  button(box, 'quarry', () => { S.quarryOpen = !S.quarryOpen; S.seenCore = true; });
  button(box, 'farm', () => { S.farmOpen = !S.farmOpen; S.seenCore = true; });
  button(box, 'lab', () => window.__lab(!S.labOpen));
  button(box, 'school', () => window.__school({ open: !S.schoolOpen }));
});

line('open too', box => {
  button(box, 'scrub', () => { S.scrubOpen = !S.scrubOpen; S.seenAir = true; });
  button(box, 'casino', () => { S.casinoOpen = !S.casinoOpen; });
  button(box, 'tower', () => { S.towerOpen = !S.towerOpen; S.seenCore = true; });
  button(box, 'meteor', () => window.__meteor());
  button(box, 'wizard hat', () => window.__wizardHat(1));
  button(box, 'kit', () => window.__school({ open: true, breakers: 3, carters: 3,
                                             blasters: 3, growers: 3 }));
  button(box, 'sky', () => { S.skyShown = !S.skyShown; });
});

// The mess, and the crew who have to shovel it. A yard under muck is the one
// job everybody drops everything for, and it is worth being able to make one
// without waiting for the sky to rain.
line('muck', box => {
  // A depth in cells, laid across every column -- and a column never holds more
  // than six. Sixty was ten times what the worst downpour can leave, which is
  // why "a little" buried the yard.
  button(box, 'a little', () => window.__air({ muck: 1 }));
  button(box, 'a lot', () => window.__air({ muck: 4 }));
  button(box, 'haze', () => window.__air({ haze: 700 }));
  button(box, 'clear', () => window.__air({ haze: 0, muck: 0 }));
});

line('boulder', box => {
  button(box, '-', () => window.__jump(Math.max(1, S.boulderNo - 1)));
  const n = document.createElement('b');
  n.dataset.rock = '1';
  box.appendChild(n);
  button(box, '+', () => window.__jump(S.boulderNo + 1));
  button(box, 'finish', () => window.__next());
  button(box, 'sweep', () => window.__clearFloor());
});

line('run on', box => {
  for (const s of [1, 5, 30]) button(box, `${s}s`, () => window.__fast(s));
});

// The story, one press a beat. Each button puts a fresh game at the top of a
// scene, through the same hooks the checks use, so a beat can be watched in
// seconds without playing the hour up to it. Fresh on purpose: a beat is a
// fact about the story, not about whatever yard was standing when the button
// was pressed. A new beat is one entry here, nothing else.
const SCENES = {
  opening: () => window.__reset(true),
  // the one beat after the first rock: it is mined out, and somebody goes over
  reunion: () => { window.__reset(); window.__crew(1, 0); window.__give(50); window.__next(); },
  landing: () => { window.__reset(); window.__crew(2, 1); window.__next(); }
};

// the shields, beat by beat: the row on the bench, the frame going up a plank
// at a time, and the rock coming through the finished thing
const propsYard = () => {
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(PROP_COST * 2);
};
const PROPS = {
  offered: propsYard,
  building: () => { propsYard(); window.__buy('props'); },
  smash: () => {
    propsYard();
    window.__buy('props');
    // run the build through rather than skipping it -- the planks still arrive
    // by walking, only faster than watching
    for (let i = 0; i < 600 && S.props && S.props.laid < PROP_PLANKS; i++) window.__fast(1);
    window.__next();
  }
};

line('scenes', box => {
  for (const [name, fn] of Object.entries(SCENES)) button(box, name, fn);
});
line('props', box => {
  for (const [name, fn] of Object.entries(PROPS)) button(box, name, fn);
});

// the numbers themselves. Anything in TUNABLE turns up here without this file
// being told about it, which is the point of the list living in config.
for (const t of TUNABLE) {
  line(t.label, box => {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = t.min;
    slider.max = t.max;
    slider.step = t.step;
    slider.value = tuned(t.key);
    const shown = document.createElement('b');
    shown.textContent = tuned(t.key);
    slider.addEventListener('input', () => {
      shown.textContent = tune(t.key, +slider.value);
      if (t.layout) relayout();
      S.dirty = true;
    });
    box.appendChild(slider);
    box.appendChild(shown);
  });
}

line('', box => {
  button(box, 'reset the game', () => window.__reset());
});

// What the yard is actually running at, on the machine it is actually running
// on. This exists because the question cannot be answered anywhere else: the
// headless shell the checks run in has no graphics card, so every frame it
// draws is rasterised by the processor and the number it reports is a floor
// rather than a measurement. Sixty here and twenty-six there is the same game.
//
// A rolling second of real frames, plus the two numbers that explain it: how
// many device pixels the page is painting, and how many specks are in the sky.
// Frame rate in this game tracks the first of those almost exactly -- it is
// filling pixels, not thinking -- so a slow window is nearly always a big one.
const meter = { at: performance.now(), n: 0, fps: 0 };
function frameSeen() {
  meter.n++;
  const now = performance.now();
  if (now - meter.at >= 500) {
    meter.fps = Math.round((meter.n * 1000) / (now - meter.at));
    meter.n = 0;
    meter.at = now;
  }
  requestAnimationFrame(frameSeen);
}
requestAnimationFrame(frameSeen);

line('running at', box => {
  const out = document.createElement('span');
  out.dataset.fps = '1';
  box.appendChild(out);
});

// And where the frame went. Three numbers and a worst, because a rate on its own
// says a frame was slow and never says which part of it was: the yard thinking,
// the yard being drawn, or the page being written. The worst is the last five
// seconds, so it is a hitch you can still remember happening.
line('spent on', box => {
  const out = document.createElement('span');
  out.dataset.beat = '1';
  box.appendChild(out);
});

// What is doing the drawing. Asked once, because it cannot change while the page
// is open, and shown here because it is the first thing worth knowing when the
// frame rate is wrong: this game is fill-rate bound, so a browser quietly
// rendering it on the processor -- hardware acceleration switched off, a driver
// on a blocklist, a remote desktop -- is slow at any size, and nothing in the
// yard is the reason. Measured on a card, every scene the dev panel can build
// runs at over a hundred and fifty frames a second at three million pixels.
line('drawn by', box => {
  const out = document.createElement('span');
  let name = 'no webgl at all';
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const info = gl && gl.getExtension('WEBGL_debug_renderer_info');
    if (info) name = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
    else if (gl) name = String(gl.getParameter(gl.RENDERER));
  } catch { name = 'no webgl at all'; }
  // The names to worry about. SwiftShader and llvmpipe are Chrome drawing the
  // page with the processor because it has decided it cannot use the card.
  const soft = /swiftshader|llvmpipe|software|basic render/i.test(name);
  out.textContent = soft ? `${name}  -- ON THE PROCESSOR, not the card` : name;
  box.appendChild(out);
});

function refresh() {
  for (const n of el.querySelectorAll('[data-beat]')) {
    n.textContent = `step ${beat.step.toFixed(1)}  draw ${beat.draw.toFixed(1)}  ` +
                    `hud ${beat.hud.toFixed(1)}  |  worst ${beat.worst.toFixed(1)}ms (${beat.worstOf})`;
  }
  for (const n of el.querySelectorAll('[data-fps]')) {
    const px = Math.round(innerWidth * S.dpr) * Math.round(innerHeight * S.dpr);
    n.textContent = `${meter.fps} fps  ${(px / 1e6).toFixed(1)}M px  ${SKY.length} in the sky`;
  }
  for (const n of el.querySelectorAll('[data-crew]')) n.textContent = S[n.dataset.crew];
  for (const n of el.querySelectorAll('[data-rock]')) n.textContent = S.boulderNo;
}
setInterval(refresh, 250);
refresh();

addEventListener('keydown', e => {
  // The key, not the character on it: backtick and tilde are the same key with
  // and without shift, and a panel that opened on one and not the other is a
  // panel that does not open when you hold shift by accident.
  if (e.key !== '`' && e.key !== '~' && e.code !== 'Backquote') return;
  el.hidden = !el.hidden;
  localStorage.setItem(KEY, el.hidden ? '0' : '1');
});
