// The dev panel. It is not part of the game.
//
// Everything in here is a shortcut to something the console hooks already do --
// but a slider you can push while watching the yard tells you things a number
// typed into a console never will, and most of the numbers in this game were
// found by sitting with it rather than by working them out.
//
// It is loaded only under `vite dev`: main.js reaches for it behind
// `import.meta.env.DEV`, so a build never sees this file at all. Backtick opens
// and closes it; it starts closed and remembers which you chose.

import { S } from './state.js';
import { TUNABLE, tune, tuned } from './config.js';
import { relayout } from './main.js';

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
  button(box, 'core', () => window.__grant({ cores: 5 }));
  button(box, 'shard', () => window.__grant({ shards: 5 }));
  button(box, 'spore', () => window.__grant({ spores: 5 }));
});

line('open', box => {
  button(box, 'quarry', () => { S.quarryOpen = !S.quarryOpen; S.seenCore = true; });
  button(box, 'farm', () => { S.farmOpen = !S.farmOpen; S.seenCore = true; });
  button(box, 'lab', () => window.__lab(!S.labOpen));
  button(box, 'sky', () => { S.skyShown = !S.skyShown; });
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

line('', box => {
  button(box, 'reset the game', () => dispatchEvent(new KeyboardEvent('keydown', { key: 'r' })));
});

function refresh() {
  for (const n of el.querySelectorAll('[data-crew]')) n.textContent = S[n.dataset.crew];
  for (const n of el.querySelectorAll('[data-rock]')) n.textContent = S.boulderNo;
}
setInterval(refresh, 250);
refresh();

addEventListener('keydown', e => {
  if (e.key !== '`') return;
  el.hidden = !el.hidden;
  localStorage.setItem(KEY, el.hidden ? '0' : '1');
});
