// The cutscene bench (cutscenes.html). Choosing a row plays its cutscene in
// the frame with the clock held still (`__still`), a tenth of a second of game
// time at a time (`__fast(0.1)`), and keeps the picture and the camera's
// reading of each. The timeline scrubs the kept frames; nothing is replayed
// live, so a scrub is exact and free.

import { ROWS, greyReason } from './rows.js';
import { readShot, labelOf } from './shotread.js';
import { runChecks, CHECKS, DT } from './checks.js';

// What a recording is allowed to cost. 120 s at ten frames a second is 1200
// frames; each is kept as an ImageBitmap shrunk to CAP_W across (the picture
// is only ever looked at to read the framing), about 0.7 MB apiece, so the
// worst recording holds under a gigabyte. Past MAX_KEPT the oldest frame is
// dropped, which the 120 s cap means never happens unless that cap is raised.
const CAP_S = 120;
const CAP_W = 512;
const MAX_KEPT = 1200;

const $ = id => document.getElementById(id);
const frameEl = $('yard'), listEl = $('rows'), find = $('find');
const view = $('view'), vctx = view.getContext('2d');
const track = $('track'), tctx = track.getContext('2d');
const marksEl = $('marks'), tip = $('tip'), note = $('note'), readout = $('readout');
const yard = () => frameEl.contentWindow;
const raf = w => new Promise(r => w.requestAnimationFrame(() => r()));

let current = null;           // the row standing
let frames = [];              // { bmp, s } per recorded frame
let flags = [];               // check names per frame
let marks = [];               // { i, label }
let from = null;              // the phase label this recording began at, or null
let idx = 0;
let overlay = true;
let recording = false, abort = false, finished = Promise.resolve();
let player = 0;
const rowEls = new Map();

// --- the list ------------------------------------------------------------------

let builtFor = null;         // the frame window the list was last built against
function build() {
  builtFor = yard();
  listEl.replaceChildren();
  rowEls.clear();
  for (const row of ROWS) {
    const why = greyReason(row, yard());
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'row' + (why ? ' grey' : '');
    b.dataset.key = row.key;
    b.dataset.text = `${row.key} ${row.name} ${row.about}`.toLowerCase();
    b.title = why || row.about;
    const n = document.createElement('span'); n.textContent = row.name;
    const s = document.createElement('small'); s.textContent = why || row.about;
    b.append(n, s);
    b.disabled = !!why;
    row.grey = why;
    b.addEventListener('click', () => choose(row.key));
    listEl.append(b);
    rowEls.set(row.key, b);
  }
  filter();
}
function filter() {
  const words = find.value.toLowerCase().split(/\s+/).filter(Boolean);
  for (const b of listEl.children) b.hidden = !words.every(w => b.dataset.text.includes(w));
}

// --- recording -----------------------------------------------------------------

async function grab(w, row) {
  await raf(w);
  const s = readShot(w);
  const cv = w.document.getElementById('c');
  const bh = Math.max(1, Math.round(CAP_W * cv.height / cv.width));
  const bmp = await createImageBitmap(cv, { resizeWidth: CAP_W, resizeHeight: bh, resizeQuality: 'low' });
  return { bmp, s };
}

// Stand the row up and play it. With `fromLabel`, the frames before that phase
// are run but not kept: the end of a forty-second cutscene is one click away.
async function record(key, { maxS = CAP_S, fromLabel = null } = {}) {
  const row = ROWS.find(r => r.key === key);
  if (!row || row.grey) return false;
  if (recording) { abort = true; await finished; }
  await ready();                        // the frame reloads itself now and then
  let release;
  finished = new Promise(r => { release = r; });
  recording = true; abort = false;
  const w = yard();
  clearFrames();
  from = fromLabel;
  current = row;
  $('name').textContent = row.name;
  $('say').textContent = row.about;
  for (const [k, b] of rowEls) b.classList.toggle('on', k === key);
  view.hidden = true;
  note.hidden = false; note.textContent = 'standing it up';
  try {
    w.__still(false);
    w.__scene(row.scene);
    w.__holdShot(0);                    // a scene's hold would make __fast skip
    await raf(w);
    row.start(w);
    w.__still(true);
    let t = 0;
    if (fromLabel) {
      note.textContent = `running to ${fromLabel}`;
      for (; t < maxS && labelOf(readShot(w)) !== fromLabel && !row.done(w); t += DT) {
        w.__fast(DT);
        if (abort) return false;
        if (Math.round(t / DT) % 10 === 9) await raf(w);
      }
      t = 0;
    }
    for (let n = 0; t <= maxS && !abort; n++, t += DT) {
      const f = await grab(w, row);
      frames.push(f);
      if (frames.length > MAX_KEPT) { frames.shift().bmp.close(); }
      if (n % 5 === 0) { refresh(); idx = frames.length - 1; draw(); }
      note.textContent = `recording ${frames.length} frames`;
      if (n > 0 && row.done(w)) break;
      w.__fast(DT);
    }
  } finally {
    recording = false;
    note.hidden = true;
    release();
  }
  if (abort) return false;
  refresh();
  idx = 0;
  view.hidden = false;
  draw();
  return true;
}

function clearFrames() {
  stopPlay();
  for (const f of frames) f.bmp.close();
  frames = []; flags = []; marks = []; idx = 0;
}

// The checks and the phase marks are facts about the whole recording, so they
// are worked out again from the frames whenever the frames change.
function refresh() {
  flags = runChecks(frames.map(f => f.s));
  marks = [];
  let last = '';
  frames.forEach((f, i) => {
    const l = labelOf(f.s);
    if (l !== last && (l || last)) marks.push({ i, label: l || '(released)' });
    last = l;
  });
  paintMarks();
  paintTrack();
}

// --- the picture ---------------------------------------------------------------

const RED = '#e22', BLUE = '#17f', ORANGE = '#f80', GREEN = '#0a0';

function draw() {
  const f = frames[idx];
  if (!f) { readout.textContent = current ? '' : 'pick a cutscene from the list'; return; }
  const { bmp, s } = f;
  if (view.width !== bmp.width || view.height !== bmp.height) { view.width = bmp.width; view.height = bmp.height; }
  vctx.imageSmoothingEnabled = false;
  vctx.drawImage(bmp, 0, 0);
  if (overlay) drawOverlay(s, bmp.width / s.viewW);
  paintReadout(s);
  paintTrack();
}

// World pixels to bitmap pixels: the window shows `viewW` of them across.
function drawOverlay(s, k) {
  const X = x => (x - s.camX) * k, Y = y => (y - s.camY) * k;
  const W = view.width, H = view.height;
  vctx.save();
  vctx.lineWidth = 1;
  // the bands' edges
  if (s.bands > 0) {
    vctx.strokeStyle = BLUE;
    for (const y of [s.bands * k, H - s.bands * k]) {
      vctx.beginPath(); vctx.moveTo(0, y + 0.5); vctx.lineTo(W, y + 0.5); vctx.stroke();
    }
  }
  // the camera center's path across the recorded frames, seen from this one
  vctx.strokeStyle = ORANGE;
  vctx.beginPath();
  frames.forEach((g, i) => {
    const x = X(g.s.camX + g.s.viewW / 2), y = Y(g.s.camY + g.s.viewH / 2);
    if (i === 0) vctx.moveTo(x, y); else vctx.lineTo(x, y);
  });
  vctx.stroke();
  vctx.fillStyle = ORANGE;
  vctx.fillRect(W / 2 - 2, H / 2 - 2, 4, 4);
  // the frame box
  if (s.frame) {
    vctx.strokeStyle = flags[idx]?.includes('box') ? RED : GREEN;
    vctx.lineWidth = 2;
    vctx.strokeRect(X(s.frame.x), Y(s.frame.y), s.frame.w * k, s.frame.h * k);
  }
  vctx.restore();
}

function paintReadout(s) {
  const t = (idx * DT).toFixed(1);
  const r = [];
  r.push(`frame ${idx + 1}/${frames.length}  t=${t}s${from ? ` (from ${from})` : ''}`);
  r.push(`place ${s.place}  zoom ${fmt(s.zoom)}  zoomShow ${fmt(s.zoomShow)}  cam ${fmt(s.camX)}, ${fmt(s.camY)}  view ${fmt(s.viewW)}x${fmt(s.viewH)}`);
  r.push(`beat ${s.beat ?? '-'}  phase ${s.phase ?? '-'}  hush ${fmt(s.hush)}  bands ${fmt(s.bands)}  gliding ${s.gliding}`);
  if (s.src !== 'shot') r.push('no shot readout: bands and gliding are approximated from __framed');
  const fl = flags[idx] || [];
  if (fl.length) r.push('CHECK: ' + fl.map(k => CHECKS[k]).join('; '));
  readout.textContent = r.join('\n');
}
const fmt = v => v == null ? '-' : Number.isInteger(v) ? String(v) : (+v).toFixed(2);

// --- the timeline --------------------------------------------------------------

const xOf = i => (frames.length > 1 ? i / (frames.length - 1) : 0) * (track.width - 1);

function paintTrack() {
  const w = track.clientWidth;
  if (track.width !== w) track.width = w;
  track.height = track.clientHeight;
  const W = track.width, H = track.height;
  tctx.clearRect(0, 0, W, H);
  for (const m of marks) { tctx.fillStyle = '#bbb'; tctx.fillRect(Math.round(xOf(m.i)), 0, 1, H); }
  tctx.fillStyle = RED;
  flags.forEach((fl, i) => { if (fl.length) tctx.fillRect(Math.round(xOf(i)) - 1, H * 0.35, 3, H * 0.65); });
  if (frames.length) { tctx.fillStyle = '#111'; tctx.fillRect(Math.round(xOf(idx)) - 1, 0, 2, H); }
}

// Marks alternate between two lanes so neighbors do not sit on each other's
// words; a mark is a button that plays from its phase.
function paintMarks() {
  marksEl.replaceChildren();
  const w = marksEl.clientWidth;
  marks.forEach((m, n) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mark'; b.textContent = m.label;
    b.title = `play from ${m.label}`;
    b.style.left = Math.min(w - 40, Math.round(xOf(m.i) * w / Math.max(1, track.width - 1))) + 'px';
    b.style.top = (n % 2 ? 18 : 0) + 'px';
    b.addEventListener('click', () => current && record(current.key, { fromLabel: m.label }));
    marksEl.append(b);
  });
}

function frameAt(ev) {
  const r = track.getBoundingClientRect();
  const u = Math.min(1, Math.max(0, (ev.clientX - r.left) / Math.max(1, r.width)));
  return Math.round(u * (frames.length - 1));
}
let scrubbing = false;
track.addEventListener('pointerdown', ev => { if (!frames.length) return; scrubbing = true; track.setPointerCapture(ev.pointerId); seek(frameAt(ev)); });
track.addEventListener('pointerup', () => { scrubbing = false; });
track.addEventListener('pointermove', ev => {
  if (!frames.length) return;
  const i = frameAt(ev);
  if (scrubbing) seek(i);
  const near = [];
  for (let j = Math.max(0, i - 2); j <= Math.min(frames.length - 1, i + 2); j++) for (const k of flags[j] || []) near.push(`${j + 1}: ${CHECKS[k]}`);
  tip.hidden = false;
  tip.style.left = ev.clientX + 12 + 'px'; tip.style.top = ev.clientY - 28 + 'px';
  tip.textContent = `${((i) * DT).toFixed(1)}s  ${labelOf(frames[i].s) || ''}` + (near.length ? '  ' + [...new Set(near)].join(' | ') : '');
});
track.addEventListener('pointerleave', () => { tip.hidden = true; });

function seek(i) {
  if (!frames.length) return;
  idx = Math.min(frames.length - 1, Math.max(0, i));
  draw();
}

// --- playing -------------------------------------------------------------------

function stopPlay() { clearInterval(player); player = 0; $('play').textContent = 'play'; }
function togglePlay() {
  if (player) return stopPlay();
  if (!frames.length) return;
  if (idx >= frames.length - 1) idx = 0;
  $('play').textContent = 'pause';
  player = setInterval(() => { if (idx >= frames.length - 1) stopPlay(); else seek(idx + 1); }, DT * 1000);
}

// --- keys and buttons ----------------------------------------------------------

function choose(key) { if (location.hash.slice(1) === key) record(key); else location.hash = key; }
addEventListener('hashchange', () => { const k = location.hash.slice(1); if (ROWS.some(r => r.key === k)) record(k); });

function keys(e) {
  if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) {
    if (e.key === 'Escape') { find.value = ''; filter(); find.blur(); }
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const big = e.shiftKey ? 10 : 1;
  if (e.key === 'ArrowRight') { e.preventDefault(); seek(idx + big); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(idx - big); }
  else if (e.key === 'Home') { e.preventDefault(); seek(0); }
  else if (e.key === 'End') { e.preventDefault(); seek(frames.length - 1); }
  else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  else if (e.key === 'r') { e.preventDefault(); if (current) record(current.key); }
  else if (e.key === 'o') { e.preventDefault(); toggleOverlay(); }
  else if (e.key === '/') { e.preventDefault(); find.focus(); find.select(); }
}
function toggleOverlay() { overlay = !overlay; $('ov').classList.toggle('on', overlay); draw(); }
addEventListener('keydown', keys);
find.addEventListener('input', filter);
$('rec').addEventListener('click', () => current && record(current.key));
$('play').addEventListener('click', togglePlay);
$('ov').addEventListener('click', toggleOverlay);
addEventListener('resize', () => { paintMarks(); paintTrack(); });

// --- the frame -----------------------------------------------------------------

function ready() {
  return new Promise(res => {
    const look = () => { const w = yard(); w?.__scene && w.__fast && w.__cutRead && w.__framed ? res() : setTimeout(look, 50); };
    look();
  });
}
let attached = Promise.resolve();
async function attach() {
  await ready();
  yard().addEventListener('keydown', keys);
  build();
  const want = location.hash.slice(1);
  if (want && ROWS.some(r => r.key === want)) record(want);
}
frameEl.addEventListener('load', () => { attached = attach(); });

// The selftest's handles (src/selftest/cutbench.js) and the shot tool's.
window.__cutbench = {
  ready: async () => {
    for (;;) { await ready(); if (builtFor === yard()) return; await new Promise(r => setTimeout(r, 50)); }
  },
  rows: () => ROWS.map(r => ({ key: r.key, name: r.name, grey: r.grey || '' })),
  record, seek, toggleOverlay,
  frames: () => frames.map(f => f.s),
  flags: () => flags, marks: () => marks, index: () => idx,
  overlay: () => overlay, recording: () => recording,
};
$('ov').classList.toggle('on', overlay);

// headless.mjs waits for this and calls it with a group filter; the bench's own
// group runs here, against this page, rather than in the game's suite.
window.__test = async (filter = '') => {
  const { TESTS } = await import('../selftest/cutbench.js');
  const out = [];
  for (const [name, fn] of TESTS) {
    if (filter && !name.toLowerCase().includes(filter.toLowerCase())) continue;
    let checks;
    try { checks = await fn(); } catch (e) { checks = [{ pass: false, what: 'threw', detail: String(e && e.stack || e) }]; }
    for (const c of checks) out.push({ ...c, group: name });
  }
  const failed = out.filter(c => !c.pass);
  return { passed: out.length - failed.length, total: out.length,
           failures: failed.map(f => `${f.group}: ${f.what}${f.detail ? ` -- ${f.detail}` : ''}`) };
};
