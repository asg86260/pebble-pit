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
import { TUNABLE, tune, tuned } from './config.js';
import { relayout } from './main.js';
import { DIALS, DEFAULTS, PRESETS, setAmount, setAll, amounts, present } from './shader.js';

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

// Every building, not the three that happened to be here first. The cut and the
// beds carry their own boards now, and the school, the house and the table are
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

// A filter over the finished frame. One dial per effect rather than a list to
// pick from, because a look is a *mix*: a television is curvature and a mask and
// scanlines and a fringe, and choosing one of those is not the same as having a
// little of each.
//
// The tube dials are here to be looked at rather than because they suit the
// game -- they are built for bright things on a dark screen, and this is black
// on a white page. In small amounts that is not fatal, and small amounts are
// what a dial is for. The press dials are the same pipeline pointed at what this
// game actually is.
//
// None of it ships. The pass hands a whole screen of pixels to the GPU every
// frame; on a phone that would be the most expensive thing in the frame, and
// nothing here has earned that yet.
const FX_KEY = 'boulder-clicker/dev-fx';
window.__fx = present;                       // render.js calls this if it is set

const fxSliders = {};

function fxSave() {
  localStorage.setItem(FX_KEY, JSON.stringify(amounts()));
}

// put a whole mix on the dials at once
function fxLoad(mix) {
  setAll(mix);
  for (const [k, el] of Object.entries(fxSliders)) {
    el.slider.value = mix[k] || 0;
    el.shown.textContent = (+(mix[k] || 0)).toFixed(2);
  }
  fxSave();
  S.dirty = true;
}

line('filter', box => {
  for (const name of Object.keys(PRESETS)) {
    button(box, name, () => fxLoad(PRESETS[name]));
  }
});

for (const d of DIALS) {
  line(`  ${d.key}`, box => {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = d.max;
    slider.step = 0.05;
    const shown = document.createElement('b');
    slider.addEventListener('input', () => {
      setAmount(d.key, +slider.value);
      shown.textContent = (+slider.value).toFixed(2);
      fxSave();
      S.dirty = true;
    });
    box.appendChild(slider);
    box.appendChild(shown);
    fxSliders[d.key] = { slider, shown };
  });
}

// whatever was on the dials last time, or the mix the file starts at
{
  let was = null;
  try { was = JSON.parse(localStorage.getItem(FX_KEY)); } catch { was = null; }
  fxLoad(was && typeof was === 'object' ? was : DEFAULTS);
}

line('', box => {
  button(box, 'reset the game', () => window.__reset());
});

function refresh() {
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
