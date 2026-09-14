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
//
// It is five tabs, because one column of everything ran off the bottom of the
// window once the sliders and the scenes were on it. `yard` is the things you
// do to the yard, `dials` the numbers, `scenes` the places (scenesheet.js
// hangs its block there), `sounds` which event plays which recipe, `frame`
// what the machine is doing about it. The tab you were on is remembered with
// the open flag.

import { S } from './state.js';
import { SKY } from './smog.js';
import { TUNABLE, SOUNDS } from './config.js';
import { applySounds } from './audio.js';
import { relayout, beat } from './main.js';
import { JOB } from './jobs.js';

const KEY = 'boulder-clicker/dev-open';
const TAB_KEY = 'boulder-clicker/dev-tab';
const el = document.createElement('div');
el.id = 'dev';
el.hidden = localStorage.getItem(KEY) !== '1';
document.body.appendChild(el);

// The tab strip, and one pane under it per tab. A pane is made the first time
// it is asked for, in the order asked, so a module that hangs its own block on
// a tab of its own (scenesheet.js) gets a tab without this file naming it.
const strip = document.createElement('div');
strip.className = 'devtabs';
el.appendChild(strip);
const panes = new Map();
export function devPane(name) {
  if (panes.has(name)) return panes.get(name);
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.textContent = name;
  tab.dataset.tab = name;
  tab.addEventListener('click', () => showTab(name));
  strip.appendChild(tab);
  const pane = document.createElement('div');
  pane.className = 'devpane';
  pane.dataset.pane = name;
  pane.hidden = true;
  el.appendChild(pane);
  panes.set(name, pane);
  if ((localStorage.getItem(TAB_KEY) || 'yard') === name) showTab(name);
  return pane;
}
function showTab(name) {
  for (const [k, pane] of panes) pane.hidden = k !== name;
  for (const t of strip.children) t.classList.toggle('on', t.dataset.tab === name);
  localStorage.setItem(TAB_KEY, name);
}

let into = null;                      // the pane the lines below go on
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
  into.appendChild(row);
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

into = devPane('yard');

// how many of each job, straight off, with the same call the checks use
const crew = [JOB.ROCK, JOB.HAUL, JOB.QUARRY, JOB.FARM];
const jobs = { rockhands: 'rock', haulers: 'carry', quarriers: 'quarry', farmhands: 'farm' };
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
// plots carry their own boards now, and the casino, the house and the table are
// all places you walk to -- so all of them open from one line.
line('open', box => {
  button(box, 'quarry', () => { S.quarryOpen = !S.quarryOpen; S.seenCore = true; });
  button(box, 'farm', () => { S.farmOpen = !S.farmOpen; S.seenCore = true; });
});

line('open too', box => {
  button(box, 'scrub', () => { S.scrubOpen = !S.scrubOpen; S.seenAir = true; });
  button(box, 'casino', () => { S.casinoOpen = !S.casinoOpen; });
  button(box, 'tower', () => { S.towerOpen = !S.towerOpen; S.seenCore = true; });
  button(box, 'meteor', () => window.__meteor());
  button(box, 'wizard hat', () => window.__wizardHat(1));
  button(box, 'kit', () => window.__kit({ breakers: 3, carters: 3,
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

line('', box => {
  // The whole thing, opening included, on a seed of its own: this is the
  // player's "reset progress" and not the hook the scenes use, which skips
  // the opening and keeps the run so a check can compare two halves.
  button(box, 'reset the game', () => window.__reset(true, true));
  // Your whole yard, on the clipboard. A report about something the yard is
  // doing wrong is only as good as the yard it happened in, and "open the
  // console and type this" is a thing to get wrong at the end of a sentence
  // about something else. This is one button: press it, paste it, and whoever
  // is looking has your game rather than a description of it.
  button(box, 'copy save', async () => {
    const raw = localStorage.getItem('boulder-clicker/v4') || '';
    const say = n => { n.textContent = raw ? 'copied ' + Math.round(raw.length / 1024) + 'kb' : 'nothing saved yet'; };
    try {
      await navigator.clipboard.writeText(raw);
      say(document.querySelector('[data-said]'));
    } catch {
      // Not every page is allowed the clipboard. Put it somewhere you can get
      // at it by hand rather than failing silently.
      window.__save = raw;
      document.querySelector('[data-said]').textContent = 'in window.__save';
    }
  });
  const said = document.createElement('b');
  said.dataset.said = '1';
  box.appendChild(said);
});

// The story's beats and the shields used to be rows of buttons here. They
// are scenes now -- src/scenes.js, drawn on the `scenes` tab by scenesheet.js
// under "the story" and "the shields" -- because a scene is a place and a
// place is pressed, not dialed; what stays on this tab is dials.
into = devPane('dials');

// the numbers themselves. Anything in TUNABLE turns up here without this file
// being told about it, which is the point of the table living in config: a row
// carries its own label, its own ends, and its own way of reading the number,
// so a slider is built out of the row and nothing here knows any knob by name.
for (const t of TUNABLE) {
  line(t.label, box => {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = t.min;
    slider.max = t.max;
    slider.step = t.step;
    slider.value = t.get();
    const shown = document.createElement('b');
    shown.textContent = t.get();
    slider.addEventListener('input', () => {
      // The row's own pair, which is exactly what `tune` in config.js does --
      // written here so the sound's rows, which config.js does not know, move
      // the same way as everything else's.
      t.set(+slider.value);
      shown.textContent = t.get();
      if (t.layout) relayout();
      S.dirty = true;
    });
    box.appendChild(slider);
    box.appendChild(shown);
  });
}

// The scenes' tab is made here so the strip reads yard, dials, scenes, sounds,
// frame whichever order the two modules happen to load in; scenesheet.js
// fills it.
devPane('scenes');
into = devPane('sounds');

// The mapping: the bench's JSON -- `{ "rock-hit": { ...recipe }, "footstep":
// null, ... }` -- pasted here is laid over SOUNDS live and kept in this
// browser, so a sound is heard in place before it is written into config. The
// list under the box is the table as it stands, one line an event, so what is
// silent and what is not can be read off. `clear` drops the paste and puts the
// shipped table back on the next load.
const SOUNDS_KEY = 'boulder-clicker/sounds';
const soundsBox = document.createElement('textarea');
soundsBox.rows = 4;
soundsBox.placeholder = 'paste the bench\'s mapping JSON';
soundsBox.spellcheck = false;
into.appendChild(soundsBox);
const soundsList = document.createElement('div');
const saySounds = () => {
  soundsList.textContent = '';
  for (const k in SOUNDS) {
    const r = SOUNDS[k].recipe;
    const row = document.createElement('div');
    row.className = 'devrow';
    const name = document.createElement('span');
    name.textContent = k;
    const what = document.createElement('span');
    what.textContent = r === null ? '—' : typeof r === 'string' ? r : (r.name || 'pasted');
    if (r === null) what.style.opacity = '.4';
    row.appendChild(name); row.appendChild(what);
    soundsList.appendChild(row);
  }
};
const laySounds = raw => {
  let map;
  try { map = JSON.parse(raw); } catch { return null; }
  const n = applySounds(map);
  saySounds();
  return n;
};
line('', box => {
  button(box, 'apply', () => {
    const n = laySounds(soundsBox.value);
    if (n === null) { soundsBox.style.borderColor = '#c00'; return; }
    soundsBox.style.borderColor = '';
    localStorage.setItem(SOUNDS_KEY, soundsBox.value);
  });
  button(box, 'clear', () => {
    localStorage.removeItem(SOUNDS_KEY);
    soundsBox.value = '';
    location.reload();
  });
});
into.appendChild(soundsList);
{
  const kept = localStorage.getItem(SOUNDS_KEY);
  if (kept) { soundsBox.value = kept; laySounds(kept); }
}
saySounds();

into = devPane('frame');

// Which run this is. Read-only on purpose: a seed is a fact about a whole run
// and not a setting -- typing a new one into the yard already standing would
// give a game that is half one run and half another (see `seedGame` in
// hooks.js). It is here because the number is otherwise invisible, and it is
// worth being able to say which yard you were looking at when something went
// wrong in it. A new game draws a new one; a reload comes back to this one.
line('this run', box => {
  const out = document.createElement('b');
  out.dataset.seed = '1';
  box.appendChild(out);
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
  for (const n of el.querySelectorAll('[data-seed]')) n.textContent = S.runSeed >>> 0;
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
