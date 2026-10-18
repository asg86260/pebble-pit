// The music bench: a song's tracks as lanes, a clip a scene, and the selected
// clip's piano roll (or, on a drum track, its step grid) opened under its lane
// (DESIGN.md, "The score, and the bench it is written on").
//
// The song is the file on disk; this page edits a copy and saves it back
// through the dev server (tools/music-server.mjs). Unsaved edits are kept in
// localStorage so a reload does not lose them, but the file is the truth.
// Everything is redrawn from the song on every change -- it is a few hundred
// elements -- and only the playhead and the clip progress move per frame.

import { MUSIC_STEPS_PER_BAR, MUSIC_CLIP_BARS, MUSIC_DRUM_ROWS, MUSIC_ROLL_LOW, MUSIC_ROLL_ROWS,
         MUSIC_VEL_DEFAULT, MUSIC_TEMPO_MIN, MUSIC_TEMPO_MAX, MUSIC_ROOTS, MUSIC_MODES, MUSIC_PATTERNS,
         MUSIC_CHORD_BARS, MUSIC_FX, MUSIC_START_FX, MUSIC_FX_GROUPS, MUSIC_FX_PRESETS } from '../config/music.js';
import { clipOf, clipSteps, validate, barSeconds } from './song.js';
import { keyOf, keyName, inKey, chordPcs, chordName, chordFeel, goodNext, startChords, refollow,
         transposeNote, carryChords } from './theory.js';
import { makePreview } from './preview.js';
import { newFx, fxParams, knobPos, knobValue, FX_TYPES } from './fx.js';
import { makeTransport } from './transport.js';
import { makeLive, openMidi } from './live.js';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = p => NAMES[p % 12] + (Math.floor(p / 12) - 1);
const isBlack = p => NAMES[p % 12].includes('#');
const COLORS = ['#e8743b', '#3b82f6', '#22a06b', '#d946a8', '#a855f7', '#eab308', '#06b6d4', '#f43f5e'];
const WAVES = ['sawtooth', 'square', 'triangle', 'sine'];
const LOCAL = name => 'music-bench/' + name;
const HISTORY = 200;
// `music.html?muted`: silent, for checks run by an agent in a browser pane.
const MUTED = new URLSearchParams(location.search).has('muted');

const app = {
  name: null, song: null, songs: [], patches: [],
  sel: { track: null, scene: null }, focus: null, lastLen: 2,
  // the chord strip's open bar, and the roll showing all twelve notes
  openBar: null, allNotes: false,
  // the open editor's tab (notes or effects), and whether the add list is open
  edTab: 'notes', fxMenu: false,
  undo: [], redo: [], dirty: false,
  source: 'preview', midi: { outputs: [], error: null }, render: null,
};

let ctx, preview, live, transport;
const root = document.getElementById('bench');
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : String(c));
  return e;
};

// --- the song, its history and its file -------------------------------------

const trackOf = id => app.song.tracks.find(t => t.id === id);
const selTrack = () => app.sel.track && trackOf(app.sel.track);
const selClip = () => { const t = selTrack(); return t && app.sel.scene ? clipOf(t, app.sel.scene) : null; };

// Every edit goes through here: the copy before it goes on the undo stack.
function edit(fn, { redraw = true } = {}) {
  app.undo.push(JSON.stringify(app.song));
  if (app.undo.length > HISTORY) app.undo.shift();
  app.redo.length = 0;
  fn();
  touched(redraw);
}
function touched(redraw = true) {
  app.dirty = true;
  try { localStorage.setItem(LOCAL(app.name), JSON.stringify(app.song)); } catch {}
  if (redraw) draw();
}
function undo(back = true) {
  const from = back ? app.undo : app.redo, to = back ? app.redo : app.undo;
  if (!from.length) return;
  to.push(JSON.stringify(app.song));
  app.song = JSON.parse(from.pop());
  app.focus = null;
  touched();
}

async function api(path, opts) {
  const r = await fetch('/__music/' + path, opts);
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || r.statusText);
  return body;
}

async function loadSong(name) {
  const disk = await api('song/' + name);
  let song = disk, restored = false;
  try {
    const kept = localStorage.getItem(LOCAL(name));
    if (kept && kept !== JSON.stringify(disk)) { song = JSON.parse(kept); restored = true; }
  } catch {}
  if (transport?.running) transport.stop();
  app.name = name; app.song = song; app.undo = []; app.redo = []; app.dirty = restored;
  app.focus = null; app.openBar = null;
  const first = song.tracks.find(t => clipOf(t, song.game)) || song.tracks[0];
  app.sel = { track: first?.id || null, scene: first && clipOf(first, song.game) ? song.game : null };
  history.replaceState(null, '', '#' + name);
  note(restored ? 'restored unsaved edits from this browser; save to keep them, or reload from disk' : '');
  draw();
}

async function save() {
  const bad = validate(app.song);
  if (bad.length) { note('cannot save: ' + bad.join('; '), true); return false; }
  try {
    await api('song/' + app.name, { method: 'PUT', body: JSON.stringify(app.song) });
    app.dirty = false;
    try { localStorage.removeItem(LOCAL(app.name)); } catch {}
    note('saved src/music/songs/' + app.name + '.json');
    draw();
    return true;
  } catch (e) { note('save failed: ' + e.message, true); return false; }
}

async function revert() {
  try { localStorage.removeItem(LOCAL(app.name)); } catch {}
  await loadSong(app.name);
}

async function newSong() {
  const name = prompt('song name (lowercase, a place: yard, deep, after, hell)');
  if (!name) return;
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(name)) { note('a song name is lowercase letters, digits and dashes', true); return; }
  // A new song is a whole loop before anybody touches it: four chords, and a
  // bass, a pad and an arpeggio all following them over a steady beat.
  const key = { root: 'A', mode: 'minor' };
  const groove = [];
  for (let st = 0; st < MUSIC_STEPS_PER_BAR; st += 2) groove.push([st, 42, 1, st % 4 ? 60 : 80]);
  groove.push([0, 36, 1, 110], [8, 36, 1, 100], [4, 38, 1, 100], [12, 38, 1, 100]);
  const song = {
    name, tempo: 96, key, game: 'main', scenes: ['main'], chords: { main: startChords(key) },
    tracks: [
      { id: 'drums', name: 'Drums', kind: 'drums', color: COLORS[0], level: 0.8, pan: 0,
        clips: { main: { bars: 1, notes: groove.sort((a, b) => a[0] - b[0] || a[1] - b[1]) } } },
      { id: 'bass', name: 'Bass', kind: 'synth', patch: 'Basses/Lord Sawtooth', color: COLORS[1], level: 0.7, pan: 0,
        follow: { pattern: 'bass-fifth' },
        preview: { wave: 'sawtooth', cutoff: 900, q: 4, attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.12 }, clips: {} },
      { id: 'pad', name: 'Pad', kind: 'synth', patch: 'Pads/MKS-70 Warm Pad', color: COLORS[2], level: 0.45, pan: 0,
        follow: { pattern: 'pad-held' },
        preview: { wave: 'sawtooth', cutoff: 1400, q: 1, attack: 0.4, decay: 0.5, sustain: 0.8, release: 0.8, detune: 8 }, clips: {} },
      { id: 'arp', name: 'Arp', kind: 'synth', patch: 'Plucks/Mr. Sparkle', color: COLORS[5], level: 0.4, pan: 0.15,
        follow: { pattern: 'arp-up' },
        preview: { wave: 'triangle', cutoff: 3000, q: 1, attack: 0.005, decay: 0.15, sustain: 0.3, release: 0.15 }, clips: {} },
    ],
  };
  for (const t of song.tracks) {
    const role = MUSIC_PATTERNS[t.follow?.pattern]?.role;
    if (MUSIC_START_FX[role]) t.fx = MUSIC_START_FX[role].map(b => newFx(b.type, b.params));
  }
  refollow(song);
  await api('song/' + name, { method: 'PUT', body: JSON.stringify(song) });
  app.songs = await api('songs');
  await loadSong(name);
}

// --- sound ------------------------------------------------------------------

function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  ctx = new AudioContext();
  preview = makePreview(ctx, { muted: MUTED, beat: () => 60 / app.song.tempo });
  live = makeLive(ctx);
  const sink = {
    // Live is the selected track only; everything else stays on the preview.
    note(track, pitch, t, dur, vel) {
      if (app.source === 'live' && live.port && !MUTED && track.id === app.sel.track) live.note(track, pitch, t, dur, vel);
      else preview.note(track, pitch, t, dur, vel);
    },
    panic() { live.panic(); },
  };
  transport = makeTransport(ctx, { song: () => app.song, sink, onChange: refreshClips });
  app.sink = sink;
}

function audition(track, pitch, vel = MUSIC_VEL_DEFAULT) {
  ensureAudio();
  app.sink.note(track, pitch, ctx.currentTime + 0.01, 0.25, vel);
}

async function setSource(src) {
  app.source = src;
  if (src === 'live' && !app.midi.access) {
    app.midi = await openMidi();
    const outs = app.midi.outputs;
    ensureAudio();
    live.port = outs.find(o => /loop|surge/i.test(o.name)) || outs[0] || null;
    if (app.midi.access) app.midi.access.onstatechange = () => { app.midi.outputs = [...app.midi.access.outputs.values()]; drawStatus(); };
  }
  draw();
}

// --- render -----------------------------------------------------------------

async function render() {
  if (app.render?.running) return;
  if (app.dirty && !(await save())) return;
  const scene = document.getElementById('renderScene').value;
  app.render = { running: true, stems: {}, scene, done: [], error: null };
  drawStatus();
  try {
    const r = await fetch(`/__music/render/${app.name}?scene=${encodeURIComponent(scene)}`, { method: 'POST' });
    if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.error || r.statusText); }
    const reader = r.body.getReader(), dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        renderEvent(ev);
      }
    }
  } catch (e) { app.render.error = e.message; }
  app.render.running = false;
  drawStatus();
}

function renderEvent(ev) {
  const r = app.render;
  if (ev.event === 'start') for (const t of ev.tracks || []) r.stems[ev.scene + '/' + t] = { track: t, scene: ev.scene, state: 'waiting' };
  else if (ev.event === 'stem') r.stems[ev.scene + '/' + ev.track] = { track: ev.track, scene: ev.scene, state: ev.state, ms: ev.ms };
  else if (ev.event === 'mix') r.mixing = ev.scene;
  else if (ev.event === 'done') { r.done.push(ev); r.mixing = null; }
  else if (ev.event === 'error') r.error = ev.message + (ev.log ? '\n' + ev.log : '');
  drawStatus();
}

// --- drawing ----------------------------------------------------------------

let statusEl, lanesEl;
function note(text, bad = false) { app.notice = text ? { text, bad } : null; drawStatus(); }

function draw() {
  root.replaceChildren(drawTransport(), statusEl = h('div', { class: 'status' }), lanesEl = h('div'), drawHelp());
  drawStatus();
  drawLanes();
}

function drawTransport() {
  const s = app.song;
  const tempo = h('input', { type: 'number', min: MUSIC_TEMPO_MIN, max: MUSIC_TEMPO_MAX, value: s.tempo,
    onchange: e => { const v = Math.round(+e.target.value); if (v >= MUSIC_TEMPO_MIN && v <= MUSIC_TEMPO_MAX) edit(() => { s.tempo = v; }); } });
  const k = keyOf(s);
  const key = h('span', { style: 'display:flex;gap:4px' },
    h('select', { onchange: e => changeKey({ ...k, root: e.target.value }) },
      MUSIC_ROOTS.map(r => h('option', { value: r, selected: r === k.root }, r))),
    h('select', { onchange: e => changeKey({ ...k, mode: e.target.value }) },
      Object.keys(MUSIC_MODES).map(m => h('option', { value: m, selected: m === k.mode }, m))));
  const songSel = h('select', { onchange: e => loadSong(e.target.value) },
    app.songs.map(n => h('option', { value: n, selected: n === app.name }, n)));
  const gameSel = h('select', { onchange: e => edit(() => { s.game = e.target.value; }) },
    s.scenes.map(n => h('option', { value: n, selected: n === s.game }, n)));
  const renderSel = h('select', { id: 'renderScene' },
    h('option', { value: s.game }, 'game loop (' + s.game + ')'),
    s.scenes.filter(n => n !== s.game).map(n => h('option', { value: n }, n)),
    h('option', { value: '*' }, 'every scene'));
  return h('div', { class: 'transport' },
    h('button', { class: 'play' + (transport?.running ? ' on' : ''), id: 'play', title: 'play / stop (space)', onclick: togglePlay },
      transport?.running ? '■' : '▶'),
    h('div', { class: 'field' }, h('small', {}, 'Song'), songSel),
    h('div', { class: 'field' }, h('small', {}, 'Tempo'), tempo),
    h('div', { class: 'field' }, h('small', {}, 'Key'), key),
    h('div', { class: 'field' }, h('small', {}, 'Position'), h('b', { class: 'num', id: 'pos' }, '1.1')),
    h('div', { class: 'field' }, h('small', {}, 'Game loop'), gameSel),
    h('div', { class: 'spacer' }),
    h('div', { class: 'seg' },
      h('button', { class: app.source === 'preview' ? 'on' : '', onclick: () => setSource('preview') }, 'Preview'),
      h('button', { class: app.source === 'live' ? 'on' : '', onclick: () => setSource('live') }, 'Surge live')),
    h('button', { class: 'btn' + (app.dirty ? ' dirty' : ''), title: 'ctrl+s', onclick: save }, 'Save'),
    app.dirty ? h('button', { class: 'btn small', title: 'throw away unsaved edits', onclick: revert }, 'Revert') : null,
    h('div', { class: 'field' }, h('small', {}, 'Render'), renderSel),
    h('button', { class: 'btn primary', onclick: render, disabled: !!app.render?.running }, app.render?.running ? 'Rendering…' : 'Render OGG'),
  );
}

function drawStatus() {
  if (!statusEl) return;
  const parts = [];
  if (app.notice) parts.push(h('span', { class: app.notice.bad ? 'bad' : '' }, app.notice.text));
  if (app.source === 'live') {
    const outs = app.midi.outputs;
    if (app.midi.error) parts.push(h('span', { class: 'bad' }, 'MIDI: ' + app.midi.error + ' (open the bench in Chrome or Edge and allow MIDI when it asks)'));
    else if (!outs.length) parts.push(h('span', { class: 'bad' },
      'no MIDI outputs: install loopMIDI, add a port, then open Surge XT (standalone) and pick that port under its MIDI input'));
    else {
      const sel = h('select', { onchange: e => { live.port = outs.find(o => o.id === e.target.value) || null; drawStatus(); } },
        outs.map(o => h('option', { value: o.id, selected: live.port && o.id === live.port.id }, o.name)));
      const t = selTrack();
      parts.push(h('span', {}, 'live out ', sel, ' · ', h('b', {}, t ? t.name : 'no track'),
        ' plays through Surge; load ', h('b', {}, t?.patch || 'its patch'), ' there'));
    }
  }
  const r = app.render;
  if (r) {
    const stems = Object.values(r.stems);
    if (stems.length) parts.push(h('span', {}, stems.map(st =>
      h('span', { class: 'stem ' + st.state, title: st.state + (st.ms ? ` ${(st.ms / 1000).toFixed(1)} s` : '') },
        h('i'), (r.scene === '*' ? st.scene + '/' : '') + st.track))));
    if (r.mixing) parts.push(h('span', {}, 'mixing ' + r.mixing + '…'));
    for (const d of r.done) parts.push(h('span', { class: 'good' },
      `${d.file}: ${d.seconds.toFixed(2)} s, ${d.lufs.toFixed(1)} LUFS, ${d.truePeak.toFixed(1)} dBTP `,
      h('audio', { controls: true, loop: true, src: '/music/' + d.file + '?t=' + Date.now() })));
    if (r.error) parts.push(h('span', { class: 'bad', style: 'white-space: pre-wrap' }, 'render: ' + r.error));
    if (r.running && !stems.length) parts.push(h('span', {}, 'starting the render (Surge takes up to a minute to load)…'));
  }
  statusEl.replaceChildren(...parts);
}

function drawLanes() {
  if (!lanesEl) return;
  const s = app.song, ns = s.scenes.length;
  const playBtn = document.getElementById('play');
  if (playBtn) { playBtn.textContent = transport?.running ? '■' : '▶'; playBtn.classList.toggle('on', !!transport?.running); }
  const liveScene = sceneEveryonePlays();
  const heads = h('div', { class: 'heads', style: `--scenes:${ns}` },
    h('span', {}),
    s.scenes.map(sc => h('button', {
      class: 'scenehead' + (sc === liveScene ? ' live' : ''), 'data-scene': sc, title: 'launch the scene; double-click to rename',
      onclick: () => { ensureAudio(); transport.launchScene(sc); },
      ondblclick: () => renameScene(sc),
    }, h('span', { class: 'tri' }, '▶'), sc, sc === s.game ? h('span', { class: 'game', title: 'the loop the game plays' }, 'game') : null)),
    h('div', { class: 'stopcell' }, h('button', { title: 'add a scene', onclick: addScene }, '+')));
  const kids = [drawStrip(), heads];
  s.tracks.forEach((t, i) => {
    kids.push(drawLane(t, ns));
    if (t.id === app.sel.track && app.edTab === 'effects') kids.push(drawFx(t));
    else if (t.id === app.sel.track && selClip()) kids.push(t.kind === 'drums' ? drawSteps(t) : drawRoll(t));
  });
  kids.push(h('div', { class: 'adds' },
    h('button', { class: 'btn', onclick: () => addTrack('synth') }, '+ synth track'),
    h('button', { class: 'btn', onclick: () => addTrack('drums') }, '+ drum track'),
    h('button', { class: 'btn', onclick: newSong }, 'New song')));
  lanesEl.replaceChildren(...kids);
}

// The scene name lights when every track that has a clip in it is playing it.
function sceneEveryonePlays() {
  if (!transport?.running) return null;
  const scenes = new Set([...transport.playing.values()].map(p => p.scene));
  return scenes.size === 1 ? [...scenes][0] : null;
}

// A launch or a bar line changes only which clips light, so it restyles the
// slots in place: rebuilding the lanes would drop a drag in the open roll.
function refreshClips() {
  preview?.running(!!transport?.running);
  if (!lanesEl) return;
  const playBtn = document.getElementById('play');
  if (playBtn) { playBtn.textContent = transport?.running ? '■' : '▶'; playBtn.classList.toggle('on', !!transport?.running); }
  const liveScene = sceneEveryonePlays();
  for (const el of lanesEl.querySelectorAll('.scenehead')) el.classList.toggle('live', el.dataset.scene === liveScene);
  for (const el of lanesEl.querySelectorAll('.clip.full')) {
    const p = transport?.playing.get(el.dataset.track), q = transport?.queued.get(el.dataset.track);
    const playing = !!p && p.scene === el.dataset.scene;
    el.classList.toggle('playing', playing);
    if (!playing) el.querySelector('.prog').style.width = '0';
    el.classList.toggle('queued', !!q && transport.running && q.scene === el.dataset.scene);
    const go = el.querySelector('.go');
    go.textContent = playing ? '■' : '▶';
    go.title = playing ? 'stop' : 'launch';
  }
}

function drawLane(t, ns) {
  const s = app.song, sel = t.id === app.sel.track;
  const p = transport?.playing.get(t.id), q = transport?.queued.get(t.id);
  const isLive = app.source === 'live' && sel;
  const lane = h('div', { class: 'lane' + (sel ? ' sel' : ''), 'data-track': t.id, style: `--scenes:${ns};--tc:${t.color}` },
    h('div', { class: 'tname', onclick: () => { app.sel.track = t.id; draw(); }, ondblclick: () => renameTrack(t) },
      h('span', { class: 'chip' }),
      h('div', { class: 'who' }, h('b', {}, t.name, t.fx?.length ? h('span', { class: 'fxcount', title: t.fx.map(b => MUSIC_FX[b.type]?.label).join(' → ') },
        t.fx.length + (t.fx.length > 1 ? ' effects' : ' effect')) : null),
        h('small', { class: isLive ? 'live' : t.follow ? 'follows' : '' }, isLive ? 'live · ' + (t.patch || 'Surge')
          : t.kind === 'drums' ? 'drums'
          : t.follow ? 'follows chords · ' + MUSIC_PATTERNS[t.follow.pattern].label
          : t.unfollowed ? 'your notes now' : (t.patch || 'no patch'))),
      t.unfollowed && !t.follow ? h('button', { class: 'btn small', title: 'rewrite this part from the chords again',
        onclick: e => { e.stopPropagation(); setFollow(t, t.unfollowed); } }, 'follow again') : null,
      h('div', { class: 'ms' },
        h('button', { class: 'm' + (t.mute ? ' on' : ''), title: 'mute', onclick: e => { e.stopPropagation(); edit(() => { t.mute = !t.mute || undefined; }); } }, 'M'),
        h('button', { class: 's' + (t.solo ? ' on' : ''), title: 'solo', onclick: e => { e.stopPropagation(); edit(() => { t.solo = !t.solo || undefined; }); } }, 'S'))));
  for (const sc of s.scenes) {
    const clip = clipOf(t, sc);
    if (!clip) {
      lane.append(h('div', { class: 'clip empty', title: 'new clip', onclick: () => newClip(t, sc) }));
      continue;
    }
    const playing = p && p.scene === sc, queued = q && q.scene === sc;
    lane.append(h('div', {
      class: 'clip full' + (playing ? ' playing' : '') + (queued && transport.running ? ' queued' : '') + (sel && app.sel.scene === sc ? ' sel' : ''),
      'data-track': t.id, 'data-scene': sc,
      onclick: () => { app.sel = { track: t.id, scene: sc }; app.focus = null; app.edTab = 'notes'; draw(); },
    },
      h('span', { class: 'q' }),
      h('span', { class: 'go', title: playing ? 'stop' : 'launch',
        onclick: e => { e.stopPropagation(); ensureAudio(); const now = transport.playing.get(t.id)?.scene === sc; transport.launch(t.id, now ? null : sc); } }, playing ? '■' : '▶'),
      h('span', { class: 'lbl' }, sc),
      h('span', { class: 'bars' }, clip.bars + (clip.bars > 1 ? ' bars' : ' bar')),
      h('span', { class: 'prog' })));
  }
  lane.append(h('div', { class: 'stopcell' },
    h('button', { title: 'stop this track', onclick: () => { ensureAudio(); if (transport.running) transport.launch(t.id, null); } }, '■')));
  return lane;
}

// The bar above an open clip: what it is, how long, and the track's sound.
function editorBar(t, clip, extra) {
  const v = t.preview || {};
  const setV = (k, val) => { t.preview = { ...(t.preview || {}), [k]: val }; touched(false); };
  // A slider is one undo step a drag: the copy is taken when it is grabbed.
  const grab = () => { app.undo.push(JSON.stringify(app.song)); app.redo.length = 0; };
  const slider = (label, value, min, max, step, set) => h('label', {}, label,
    h('input', { type: 'range', min, max, step, value, onpointerdown: grab, onkeydown: grab,
      oninput: e => set(+e.target.value) }));
  const range = (label, k, min, max, step, fallback) => slider(label, v[k] ?? fallback, min, max, step, x => setV(k, x));
  return h('div', { class: 'edbar' },
    edTabs(),
    h('b', {}, `${t.name} · ${app.sel.scene}`),
    h('label', {}, 'length', h('select', { onchange: e => setBars(clip, +e.target.value) },
      MUSIC_CLIP_BARS.map(b => h('option', { value: b, selected: b === clip.bars }, b + (b > 1 ? ' bars' : ' bar'))))),
    h('button', { class: 'btn small', title: 'double the clip and copy its notes into the new half', onclick: () => duplicate(clip),
      disabled: clip.bars * 2 > Math.max(...MUSIC_CLIP_BARS) }, '×2'),
    t.kind === 'synth' ? h('label', {}, 'plays', h('select', { onchange: e => setFollow(t, e.target.value || null) },
      h('option', { value: '', selected: !t.follow }, 'my own notes'),
      ['bass', 'pad', 'arp'].map(role => h('optgroup', { label: 'follow the chords: ' + role },
        Object.entries(MUSIC_PATTERNS).filter(([, pt]) => pt.role === role)
          .map(([id, pt]) => h('option', { value: id, selected: t.follow?.pattern === id }, pt.label)))))) : null,
    extra,
    h('span', { class: 'grow' }),
    t.kind === 'synth' ? h('label', {}, 'Surge patch',
      h('input', { class: 'patch', list: 'patches', value: t.patch || '', placeholder: 'Leads/Crisp PWM',
        onchange: e => edit(() => { t.patch = e.target.value.trim(); }) })) : null,
    t.kind === 'synth' ? h('label', {}, 'preview', h('select', { onchange: e => { grab(); setV('wave', e.target.value); } },
      WAVES.map(w => h('option', { value: w, selected: (v.wave || 'sawtooth') === w }, w)))) : null,
    t.kind === 'synth' ? range('cutoff', 'cutoff', 200, 8000, 50, 1800) : null,
    t.kind === 'synth' ? range('attack', 'attack', 0.001, 1.5, 0.001, 0.01) : null,
    t.kind === 'synth' ? range('release', 'release', 0.02, 2, 0.01, 0.2) : null,
    slider('level', t.level ?? 0.7, 0, 1, 0.01, x => { t.level = x; preview?.refresh(t); touched(false); }),
    slider('pan', t.pan ?? 0, -1, 1, 0.05, x => { t.pan = x; preview?.refresh(t); touched(false); }),
    h('button', { class: 'btn small danger', onclick: () => deleteClip(t) }, 'delete clip'),
    h('button', { class: 'btn small danger', onclick: () => deleteTrack(t) }, 'delete track'),
  );
}

// --- the effects chain ----------------------------------------------------------

function edTabs() {
  const tab = name => h('button', { class: app.edTab === name ? 'on' : '', onclick: () => { app.edTab = name; app.fxMenu = false; drawLanes(); } }, name);
  return h('div', { class: 'edtabs' }, tab('notes'), tab('effects'));
}

// The chain under the selected track: one box an effect, in the order the
// sound goes through them, left to right, and an add box at the end.
function drawFx(t) {
  t.fx = t.fx || [];
  const row = h('div', { class: 'chain' });
  t.fx.forEach((box, i) => {
    if (i) row.append(h('span', { class: 'arrow' }, '→'));
    row.append(fxBox(t, box, i));
  });
  if (t.fx.length) row.append(h('span', { class: 'arrow' }, '→'));
  row.append(h('button', { class: 'addfx' + (app.fxMenu ? ' open' : ''), onclick: () => { app.fxMenu = !app.fxMenu; drawLanes(); } }, '+ add'));
  const parts = [h('div', { class: 'edbar' }, edTabs(), h('b', {}, t.name + ' · effects'),
    h('span', { class: 'hint' }, t.fx.length ? 'the sound goes left to right · drag a box by its name to move it · drag a knob up or down, double-click to reset'
      : 'no effects yet: the track plays dry'),
    h('span', { class: 'grow' }),
    t.fx.length ? h('button', { class: 'btn small danger', onclick: () => edit(() => { t.fx = []; }) }, 'clear all') : null), row];
  if (app.fxMenu) parts.push(fxLibrary(t));
  return h('div', { class: 'editor', style: `--tc:${t.color}` }, ...parts);
}

// The add panel (DESIGN.md, "The effects library"): starting points across
// the top, a whole chain each, then every effect in its group with its
// sentence. Picking one closes the panel; undo takes it back.
function fxLibrary(t) {
  const add = boxes => { app.fxMenu = false; edit(() => { t.fx.push(...boxes); preview?.refresh(t); }); };
  const chainOf = pre => pre.chain.map(([type, params]) => newFx(type, params));
  const presets = h('div', { class: 'fxpresets' }, MUSIC_FX_PRESETS.map(pre => h('div', { class: 'fxpreset' },
    h('b', {}, pre.name), h('small', {}, pre.about),
    h('div', { class: 'fxchips' }, pre.chain.map(([type]) => h('span', {}, MUSIC_FX[type].label))),
    h('div', { class: 'fxpresetgo' },
      h('button', { class: 'btn small', title: "replace this track's effects with this chain (undo brings them back)",
        onclick: () => { app.fxMenu = false; edit(() => { t.fx = chainOf(pre); preview?.refresh(t); }); } }, 'use'),
      t.fx.length ? h('button', { class: 'btn small', title: 'put this chain after the effects already here',
        onclick: () => add(chainOf(pre)) }, 'add to the end') : null))));
  const groups = h('div', { class: 'fxgroups' }, MUSIC_FX_GROUPS.map(([key, label]) => h('div', { class: 'fxgroup' },
    h('div', { class: 'fxhead' }, label),
    FX_TYPES.filter(type => MUSIC_FX[type].group === key).map(type => h('button', { class: 'fxrow', onclick: () => add([newFx(type)]) },
      h('b', {}, MUSIC_FX[type].label), h('small', {}, MUSIC_FX[type].about))))));
  return h('div', { class: 'fxlib' },
    h('div', { class: 'fxhead' }, 'Starting points · a whole chain to start from'), presets,
    h('div', { class: 'fxhead' }, 'Effects · one at a time'), groups);
}

function fxBox(t, box, i) {
  const spec = MUSIC_FX[box.type], params = fxParams(box);
  const el = h('div', { class: 'fxbox' + (box.on === false ? ' off' : ''), 'data-i': i, title: spec.about });
  const top = h('div', { class: 'fxtop', draggable: 'true', title: 'drag to move it in the chain' },
    h('button', { class: 'power', title: box.on === false ? 'switch on' : 'switch off (hear the track without it)',
      onclick: () => edit(() => { box.on = box.on === false; preview?.refresh(t); }) }),
    h('b', {}, spec.label),
    h('button', { class: 'x', title: 'remove', onclick: () => edit(() => { t.fx.splice(i, 1); preview?.refresh(t); }) }, '✕'));
  // Moving a box: drop it on another and it takes that one's place.
  top.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', String(i)); el.classList.add('dragging'); });
  top.addEventListener('dragend', () => el.classList.remove('dragging'));
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', e => {
    e.preventDefault();
    const from = +e.dataTransfer.getData('text/plain');
    if (Number.isNaN(from) || from === i) return;
    edit(() => { const [moved] = t.fx.splice(from, 1); t.fx.splice(i, 0, moved); preview?.refresh(t); });
  });
  el.append(top, h('div', { class: 'knobs' },
    Object.entries(spec.params).map(([k, p]) => knob(t, box, k, p, params[k]))));
  return el;
}

const knobText = (p, v) => p.names ? p.names[p.choices.indexOf(v)] : p.choices ? v
  : (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 100) / 100) + (p.unit ? ' ' + p.unit : '');

// A knob: drag up to turn it up, double-click for its default; a knob of
// choices steps through them as it turns.
function knob(t, box, k, p, value) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 36 36');
  svg.innerHTML = '<circle cx="18" cy="18" r="14" class="ring"/><path class="arc"/><line x1="18" y1="18" x2="18" y2="6" class="tick"/>';
  const val = h('span', { class: 'num' });
  const show = v => {
    const x = knobPos(p, v), a0 = -135, a = a0 + 270 * x, rad = d => (d - 90) * Math.PI / 180;
    const pt = d => [18 + 14 * Math.cos(rad(d)), 18 + 14 * Math.sin(rad(d))];
    const [x0, y0] = pt(a0), [x1, y1] = pt(a);
    svg.querySelector('.arc').setAttribute('d', x > 0.001 ? `M${x0} ${y0} A14 14 0 ${a - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}` : '');
    svg.querySelector('.tick').setAttribute('transform', `rotate(${a} 18 18)`);
    val.textContent = knobText(p, v);
  };
  const set = v => { box.params = { ...(box.params || {}), [k]: v }; show(v); preview?.refresh(t); touched(false); };
  const el = h('div', { class: 'knob', title: `${p.label}: ${p.about}` }, svg, h('small', {}, p.label), val);
  let drag = null;
  svg.addEventListener('pointerdown', e => {
    svg.setPointerCapture(e.pointerId);
    app.undo.push(JSON.stringify(app.song)); app.redo.length = 0;
    drag = { y: e.clientY, x: knobPos(p, fxParams(box)[k]) };
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    // A full turn is about two hundred pixels; shift turns it finely.
    const span = e.shiftKey ? 800 : 200;
    set(knobValue(p, drag.x + (drag.y - e.clientY) / span));
  });
  const end = () => { drag = null; };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('dblclick', () => { app.undo.push(JSON.stringify(app.song)); set(p.def); });
  show(value);
  return el;
}

// --- the piano roll -----------------------------------------------------------

let roll = null;   // the open roll's elements, for the per-frame playhead

// The roll's rows, top to bottom: the key's notes only, unless "all notes"
// is on; a note already drawn off the key keeps its row so it never vanishes.
function rollRows(clip) {
  const key = keyOf(app.song), used = new Set(clip.notes.map(n => n[1])), rows = [];
  for (let p = MUSIC_ROLL_LOW + MUSIC_ROLL_ROWS - 1; p >= MUSIC_ROLL_LOW; p--)
    if (app.allNotes || inKey(key, p) || used.has(p)) rows.push(p);
  return rows;
}

function drawRoll(t) {
  const clip = selClip(), steps = clipSteps(clip), key = keyOf(app.song);
  const rows = rollRows(clip), rp = rowPx(), tonic = MUSIC_ROOTS.indexOf(key.root);
  const keys = h('div', { class: 'keys' }), notes = h('div', { class: 'notes' });
  for (const p of rows) {
    const off = !inKey(key, p);
    keys.append(h('div', { class: (isBlack(p) && app.allNotes ? 'black ' : '') + (p % 12 === tonic ? 'c' : '') + (off ? ' off' : ''),
      onpointerdown: () => audition(t, p) }, noteName(p)));
    notes.append(h('div', { class: 'rowbg' + (off ? ' off' : '') }));
  }
  // Under each bar, the rows in that bar's chord are lit: a note there fits.
  const chords = app.song.chords?.[app.sel.scene];
  if (chords?.length) {
    for (let b = 0; b < clip.bars; b++) {
      const pcs = chordPcs(key, chords[b % chords.length]);
      rows.forEach((p, i) => {
        if (pcs.includes(p % 12)) notes.append(h('div', { class: 'tone',
          style: `left:${b / clip.bars * 100}%;width:${100 / clip.bars}%;top:${i * rp}px;height:${rp}px` }));
      });
    }
  }
  for (let st = 0; st <= steps; st++) {
    const cls = st % MUSIC_STEPS_PER_BAR === 0 ? ' bar' : st % 4 === 0 ? ' beat' : '';
    notes.append(h('div', { class: 'vline' + cls, style: `left:${st / steps * 100}%` }));
  }
  const layer = h('div', { style: 'position:absolute;inset:0' });
  const ph = h('div', { class: 'ph' });
  notes.append(layer, ph);
  const velbars = h('div', { class: 'velbars' });
  const box = h('div', { class: 'editor', style: `--tc:${t.color}` },
    editorBar(t, clip, h('label', { title: 'show the notes outside the key too' },
      h('input', { type: 'checkbox', checked: app.allNotes, onchange: e => { app.allNotes = e.target.checked; drawLanes(); } }), 'all notes')),
    h('div', { class: 'hint rollhint' }, 'only the notes of ' + keyName(key) + " are shown; the lit rows are in that bar's chord, so a note there always fits · click to draw · drag to move · drag the end to stretch · right-click to delete · alt-drag to copy"),
    h('div', { class: 'roll' }, keys, notes),
    h('div', { class: 'vel' }, h('span', {}, 'velocity'), velbars));
  roll = { t, clip, notes, layer, ph, velbars, steps, rows };
  drawNotes();
  rollPointer(notes, t, clip, steps);
  velPointer(velbars, clip, steps);
  // Open on the clip's notes, not on the bottom octave.
  requestAnimationFrame(() => {
    const scroller = box.querySelector('.roll');
    const ps = clip.notes.map(n => n[1]);
    const top = ps.length ? Math.max(...ps) + 4 : 72;
    const row = rows.findIndex(p => p <= top);
    scroller.scrollTop = Math.max(0, row) * rowPx();
  });
  return box;
}

const rowPx = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rollrow')) || 18;

function drawNotes() {
  if (!roll) return;
  const { clip, layer, velbars, steps, rows } = roll, rp = rowPx();
  layer.replaceChildren(...clip.notes.map((n, i) => {
    const [st, p, len] = n;
    const e = h('div', { class: 'n' + (app.focus === n ? ' focus' : ''), 'data-i': i,
      style: `left:calc(${st / steps * 100}% + 1px);width:calc(${len / steps * 100}% - 2px);top:${rowIndex(rows, p) * rp + 1}px` },
      len >= 2 ? noteName(p) : '');
    e._n = n;
    return e;
  }));
  velbars.replaceChildren(...clip.notes.map(n => h('i', { class: app.focus === n ? 'focus' : '',
    style: `left:calc(${(n[0] + 0.5) / steps * 100}% - 2px);height:${n[3] / 127 * 100}%` })));
}

// A pitch's row, or the row nearest a pitch that has none.
function rowIndex(rows, p) {
  let best = 0;
  rows.forEach((q, i) => { if (Math.abs(q - p) < Math.abs(rows[best] - p)) best = i; });
  return best;
}

function rollPointer(el, t, clip, steps) {
  let drag = null;
  // The pointer snaps to a row, and every row is a note in the key.
  const at = e => {
    const r = el.getBoundingClientRect(), rows = roll.rows;
    const step = (e.clientX - r.left) / r.width * steps;
    const row = clamp(Math.floor((e.clientY - r.top) / rowPx()), 0, rows.length - 1);
    return { step, row, pitch: rows[row] };
  };
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('pointerdown', e => {
    const hit = e.target.closest('.n')?._n;
    const { step, pitch } = at(e);
    if (e.button === 2) {
      if (hit) edit(() => { clip.notes.splice(clip.notes.indexOf(hit), 1); if (app.focus === hit) app.focus = null; unfollow(t); }, { redraw: false });
      drawNotes();
      return;
    }
    if (e.button !== 0) return;
    el.setPointerCapture(e.pointerId);
    app.undo.push(JSON.stringify(app.song)); app.redo.length = 0;
    unfollow(t);
    if (hit) {
      const r = e.target.getBoundingClientRect();
      let n = hit;
      if (e.altKey) { n = [...hit]; clip.notes.push(n); }
      const stretch = e.clientX > r.right - 6;
      drag = { n, mode: stretch ? 'len' : 'move', from: { step }, orig: [...n] };
    } else {
      const n = [Math.floor(step), pitch, Math.min(app.lastLen, steps - Math.floor(step)), MUSIC_VEL_DEFAULT];
      clip.notes.push(n);
      drag = { n, mode: 'len', from: { step: Math.floor(step) }, orig: [...n], fresh: true };
      audition(t, pitch);
    }
    app.focus = drag.n;
    drawNotes();
  });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    const { step, pitch: np } = at(e), n = drag.n, o = drag.orig;
    if (drag.mode === 'move') {
      const ds = Math.round(step - drag.from.step);
      n[0] = clamp(o[0] + ds, 0, steps - n[2]);
      if (np !== n[1]) { n[1] = np; audition(t, np, n[3]); }
    } else {
      n[2] = clamp(Math.ceil(step) - n[0], 1, steps - n[0]);
    }
    drawNotes();
  });
  const end = () => {
    if (!drag) return;
    if (drag.mode === 'len') app.lastLen = drag.n[2];
    drag = null;
    clip.notes.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    touched(false);
    drawNotes();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

// Drag up and down over the velocity lane to set the nearest note's velocity.
function velPointer(el, clip, steps) {
  let on = false;
  const set = e => {
    const r = el.getBoundingClientRect();
    const step = (e.clientX - r.left) / r.width * steps;
    const vel = clamp(Math.round((1 - (e.clientY - r.top) / r.height) * 127), 1, 127);
    let best = null, d = Infinity;
    for (const n of clip.notes) { const dd = Math.abs(n[0] + 0.5 - step); if (dd < d) { d = dd; best = n; } }
    if (best && d < 1) { best[3] = vel; app.focus = best; drawNotes(); }
  };
  el.addEventListener('pointerdown', e => { on = true; el.setPointerCapture(e.pointerId); app.undo.push(JSON.stringify(app.song)); app.redo.length = 0; unfollow(roll.t); set(e); });
  el.addEventListener('pointermove', e => { if (on) set(e); });
  el.addEventListener('pointerup', () => { if (on) { on = false; touched(false); } });
}

// --- the step grid ------------------------------------------------------------

let grid = null;

function drawSteps(t) {
  const clip = selClip(), steps = clipSteps(clip);
  const cells = [];
  const rows = MUSIC_DRUM_ROWS.map(({ pitch, name }) => {
    const row = h('div', { class: 'steprow', style: `--steps:${steps}` },
      h('span', { onpointerdown: () => audition(t, pitch) }, name));
    for (let st = 0; st < steps; st++) {
      const n = clip.notes.find(n => n[0] === st && n[1] === pitch);
      const cell = h('i', {
        class: (n ? 'on' : st % 4 === 0 ? 'down' : '') + (st && st % MUSIC_STEPS_PER_BAR === 0 ? ' barline' : ''),
        style: n ? `opacity:${0.35 + 0.65 * n[3] / 127}` : '',
        title: 'click: on/off · shift-click: accent, normal, ghost',
        onclick: e => toggleStep(t, clip, st, pitch, e.shiftKey),
      });
      cells.push({ cell, st });
      row.append(cell);
    }
    return row;
  });
  grid = { cells };
  return h('div', { class: 'editor', style: `--tc:${t.color}` }, editorBar(t, clip), h('div', { class: 'steps' }, rows));
}

function toggleStep(t, clip, st, pitch, shift) {
  const n = clip.notes.find(n => n[0] === st && n[1] === pitch);
  edit(() => {
    if (!n) { clip.notes.push([st, pitch, 1, MUSIC_VEL_DEFAULT]); clip.notes.sort((a, b) => a[0] - b[0] || a[1] - b[1]); }
    else if (shift) n[3] = n[3] >= 120 ? MUSIC_VEL_DEFAULT : n[3] >= MUSIC_VEL_DEFAULT ? 50 : 127;
    else clip.notes.splice(clip.notes.indexOf(n), 1);
  });
  if (!n || shift) audition(t, pitch, (n || clip.notes.find(m => m[0] === st && m[1] === pitch))[3]);
}

// --- the chord strip ------------------------------------------------------------

// The strip shows the chords of the scene being edited, or the game loop's.
const stripScene = () => app.sel.scene || app.song.game;
let strip = null;  // the bar blocks, for the per-frame "playing now" mark

function drawStrip() {
  const s = app.song, scene = stripScene(), key = keyOf(s), chords = s.chords?.[scene];
  const box = h('div', { class: 'strip' });
  if (!chords?.length) {
    strip = null;
    box.append(h('div', { class: 'striphead' }, h('b', {}, 'Chords · ' + scene),
      h('button', { class: 'btn small', onclick: () => setChords(scene, startChords(key)) }, 'add chords')),
      h('div', { class: 'hint' }, 'pick four chords and the bass, pad and arpeggio play them for you'));
    return box;
  }
  const bars = h('div', { class: 'stripbars', style: `--bars:${chords.length}` });
  const blocks = chords.map((deg, i) => h('button', {
    class: 'chordbar' + (app.openBar === i ? ' open' : ''),
    onclick: () => { app.openBar = app.openBar === i ? null : i; drawLanes(); },
  }, h('b', {}, chordName(key, deg)), h('small', {}, chordFeel(key, deg)), h('i', { class: 'prog' })));
  bars.append(...blocks);
  strip = { scene, blocks };
  box.append(h('div', { class: 'striphead' },
    h('b', {}, 'Chords · ' + scene), h('span', { class: 'hint' }, 'one a bar'),
    h('label', {}, 'bars', h('select', { onchange: e => setChordBars(scene, +e.target.value) },
      MUSIC_CHORD_BARS.map(n => h('option', { value: n, selected: n === chords.length }, n)))),
    h('button', { class: 'btn small', title: 'hear the chords on their own', onclick: () => playChords(chords) }, 'hear them')), bars);
  if (app.openBar != null && app.openBar < chords.length) {
    const i = app.openBar, before = chords[(i + chords.length - 1) % chords.length];
    const stars = goodNext(key, before);
    box.append(h('div', { class: 'chordmenu' },
      h('span', { class: 'hint' }, `bar ${i + 1}: after ${chordName(key, before)}, the starred ones usually sound right`),
      h('div', { class: 'chordpicks' }, [1, 2, 3, 4, 5, 6, 7].map(d => h('button', {
        class: 'chordpick' + (d === chords[i] ? ' cur' : '') + (stars.includes(d) ? ' good' : ''),
        onmouseenter: () => playChord(d),
        onclick: () => { setChord(scene, i, d); },
      }, h('b', {}, chordName(key, d)), h('small', {}, chordFeel(key, d)))))));
  }
  return box;
}

// A chord as a quick sine-ish strum, for choosing by ear.
const CHORD_VOICE = { id: '__chord', kind: 'synth', level: 0.5, pan: 0,
  preview: { wave: 'triangle', cutoff: 2400, q: 1, attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.4 } };
function playChord(deg, at = 0, dur = 0.6) {
  ensureAudio();
  const key = keyOf(app.song), t0 = ctx.currentTime + 0.02 + at;
  const [r, t3, f] = chordPcs(key, deg), root = 48 + ((r - 48) % 12 + 12) % 12;
  for (const p of [root, root + ((t3 - r + 12) % 12), root + ((f - r + 12) % 12), root + 12])
    app.sink.note(CHORD_VOICE, p, t0, dur, 80);
}
function playChords(chords) {
  const bar = barSeconds(app.song) / 2;
  chords.forEach((d, i) => playChord(d, i * bar, bar * 0.95));
}

function setChords(scene, chords) {
  edit(() => { app.song.chords = { ...(app.song.chords || {}), [scene]: chords }; refollow(app.song); });
}
function setChord(scene, i, deg) {
  edit(() => { app.song.chords[scene][i] = deg; app.openBar = null; refollow(app.song); });
}
// A longer strip repeats the chords it has; a shorter one keeps the first.
function setChordBars(scene, n) {
  const old = app.song.chords[scene];
  setChords(scene, Array.from({ length: n }, (_, i) => old[i % old.length]));
}

// A new key carries the song: drawn notes move by scale degree, and the
// following parts are written again from the same chords in the new key.
function changeKey(to) {
  const s = app.song, from = keyOf(s);
  edit(() => {
    for (const t of s.tracks) {
      if (t.kind === 'drums' || t.follow) continue;
      for (const clip of Object.values(t.clips || {}))
        clip.notes = clip.notes.map(([st, p, len, vel]) => [st, clamp(transposeNote(from, to, p), 0, 127), len, vel]);
    }
    for (const [scene, chords] of Object.entries(s.chords || {})) s.chords[scene] = carryChords(from, to, chords);
    s.key = to;
    refollow(s);
  });
}

// Follow the chords with a pattern, or stop following (null keeps the notes).
function setFollow(t, pattern) {
  const s = app.song;
  edit(() => {
    if (!pattern) { delete t.follow; return; }
    t.follow = { pattern };
    delete t.unfollowed;
    // Following needs chords: a scene being edited without any gets a start.
    const scene = app.sel.track === t.id && app.sel.scene ? app.sel.scene : s.game;
    if (!s.chords?.[scene]?.length) s.chords = { ...(s.chords || {}), [scene]: startChords(keyOf(s)) };
    refollow(s);
    if (app.sel.track === t.id && !app.sel.scene) app.sel.scene = scene;
  });
}

// Your edit wins: drawing on a following part makes it yours, and the lane
// offers "follow again" rather than ever writing over what you drew.
function unfollow(t) {
  if (!t?.follow) return false;
  t.unfollowed = t.follow.pattern;
  delete t.follow;
  note(`${t.name} plays your notes now; "follow again" on its lane writes it from the chords again`);
  // The lane shows it once the hand lets go: redrawing mid-drag would drop it.
  addEventListener('pointerup', () => requestAnimationFrame(drawLanes), { once: true });
  return true;
}

// --- edits ----------------------------------------------------------------------

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function newClip(t, scene) {
  edit(() => {
    t.clips = t.clips || {};
    t.clips[scene] = { bars: t.kind === 'drums' ? 1 : 2, notes: [] };
    // A following part in a scene with no chords starts the scene's chords.
    if (t.follow) {
      const s = app.song;
      if (!s.chords?.[scene]?.length) s.chords = { ...(s.chords || {}), [scene]: startChords(keyOf(s)) };
      refollow(s);
    }
    app.sel = { track: t.id, scene };
    app.focus = null;
  });
}
function setBars(clip, bars) {
  edit(() => {
    unfollow(selTrack());
    clip.bars = bars;
    const steps = clipSteps(clip);
    clip.notes = clip.notes.filter(n => n[0] < steps).map(n => [n[0], n[1], Math.min(n[2], steps - n[0]), n[3]]);
  });
}
function duplicate(clip) {
  edit(() => {
    unfollow(selTrack());
    const steps = clipSteps(clip);
    clip.notes = [...clip.notes, ...clip.notes.map(n => [n[0] + steps, n[1], n[2], n[3]])];
    clip.bars *= 2;
  });
}
function deleteClip(t) {
  const sc = app.sel.scene;
  if (transport?.playing.get(t.id)?.scene === sc) transport.launch(t.id, null);
  edit(() => { delete t.clips[sc]; app.sel.scene = null; });
}
function deleteTrack(t) {
  if (!confirm(`delete the track "${t.name}" and all its clips?`)) return;
  if (transport?.running) transport.launch(t.id, null);
  edit(() => {
    app.song.tracks = app.song.tracks.filter(x => x !== t);
    app.sel = { track: app.song.tracks[0]?.id || null, scene: null };
  });
}
function addTrack(kind) {
  const s = app.song;
  const base = kind === 'drums' ? 'drums' : 'synth';
  let i = 1; while (s.tracks.some(t => t.id === base + i)) i++;
  const id = base + i;
  edit(() => {
    s.tracks.push(kind === 'drums'
      ? { id, name: 'Drums ' + i, kind, color: COLORS[s.tracks.length % COLORS.length], level: 0.8, pan: 0, clips: {} }
      : { id, name: 'Synth ' + i, kind, patch: '', color: COLORS[s.tracks.length % COLORS.length], level: 0.6, pan: 0,
          preview: { wave: 'sawtooth', cutoff: 1800, q: 1, attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.2 }, clips: {} });
    app.sel = { track: id, scene: null };
  });
}
function renameTrack(t) {
  const name = prompt('track name', t.name);
  if (name && name.trim()) edit(() => { t.name = name.trim(); });
}
function addScene() {
  const s = app.song;
  let i = s.scenes.length + 1; while (s.scenes.includes('scene' + i)) i++;
  edit(() => { s.scenes.push('scene' + i); });
}
function renameScene(old) {
  const s = app.song;
  const name = prompt('scene name', old)?.trim();
  if (!name || name === old) return;
  if (s.scenes.includes(name)) { note('there is already a scene called ' + name, true); return; }
  if (transport?.running) transport.stop();
  edit(() => {
    s.scenes[s.scenes.indexOf(old)] = name;
    if (s.game === old) s.game = name;
    for (const t of s.tracks) if (t.clips?.[old]) { t.clips[name] = t.clips[old]; delete t.clips[old]; }
    if (app.sel.scene === old) app.sel.scene = name;
  });
}

function togglePlay() {
  ensureAudio();
  if (transport.running) transport.stop();
  else {
    // Play with nothing armed starts the game loop's scene.
    if (!transport.queued.size) transport.launchScene(app.song.game);
    else transport.start();
  }
  refreshClips();
}

function drawHelp() {
  return h('div', { class: 'help' },
    h('p', {}, h('kbd', {}, 'space'), ' play / stop · ', h('kbd', {}, 'ctrl+z'), ' undo · ', h('kbd', {}, 'ctrl+shift+z'), ' redo · ',
      h('kbd', {}, 'ctrl+s'), ' save · ', h('kbd', {}, 'delete'), ' the focused note · ', h('kbd', {}, '←→↑↓'), ' nudge it (shift: an octave or a bar). ',
      'Clips and scenes launch on the next bar line. Click a scene name to launch it, double-click to rename. ',
      'Surge live sends the selected track over MIDI; the render plays every synth track through its Surge patch and writes public/music/<song>-<scene>.ogg.'));
}

// --- keys -------------------------------------------------------------------------

addEventListener('keydown', e => {
  if (e.target.closest?.('input, select, textarea')) return;
  const mod = e.ctrlKey || e.metaKey;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); return; }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); save(); return; }
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(!e.shiftKey); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); undo(false); return; }
  const n = app.focus, clip = selClip();
  if (!n || !clip || !clip.notes.includes(n)) return;
  const steps = clipSteps(clip);
  const move = {
    ArrowLeft: () => { n[0] = clamp(n[0] - (e.shiftKey ? MUSIC_STEPS_PER_BAR : 1), 0, steps - n[2]); },
    ArrowRight: () => { n[0] = clamp(n[0] + (e.shiftKey ? MUSIC_STEPS_PER_BAR : 1), 0, steps - n[2]); },
    ArrowUp: () => { n[1] = clamp(n[1] + (e.shiftKey ? 12 : 1), 0, 127); },
    ArrowDown: () => { n[1] = clamp(n[1] - (e.shiftKey ? 12 : 1), 0, 127); },
    Delete: () => { clip.notes.splice(clip.notes.indexOf(n), 1); app.focus = null; },
    Backspace: () => { clip.notes.splice(clip.notes.indexOf(n), 1); app.focus = null; },
  }[e.key];
  if (!move) return;
  e.preventDefault();
  let lost = false;
  edit(() => { lost = unfollow(selTrack()); move(); }, { redraw: false });
  if (lost) drawLanes(); else drawNotes();
  if (app.focus && e.key.startsWith('Arrow')) audition(selTrack(), n[1], n[3]);
});

addEventListener('beforeunload', e => { if (app.dirty) { e.preventDefault(); } });

// --- the frame: playhead, clip progress, position ---------------------------------

function frame() {
  requestAnimationFrame(frame);
  if (!transport) return;
  const pos = document.getElementById('pos');
  if (pos) { const p = transport.position(); pos.textContent = transport.running ? `${p.bar}.${p.beat}` : '1.1'; }
  for (const el of lanesEl?.querySelectorAll('.clip.playing') || []) {
    const clip = clipOf(trackOf(el.dataset.track), el.dataset.scene);
    const st = transport.stepOf(el.dataset.track);
    el.querySelector('.prog').style.width = st < 0 ? '0' : (st / clipSteps(clip) * 100) + '%';
  }
  const selStep = app.sel.track && transport.playing.get(app.sel.track)?.scene === app.sel.scene
    ? transport.stepOf(app.sel.track) : -1;
  if (roll && roll.ph.isConnected) {
    roll.ph.style.display = selStep < 0 ? 'none' : 'block';
    if (selStep >= 0) roll.ph.style.left = (selStep / roll.steps * 100) + '%';
    for (const e of roll.layer.children) {
      const n = e._n;
      e.classList.toggle('lit', selStep >= n[0] && selStep < n[0] + n[2]);
    }
  }
  // The chord strip marks the bar playing now in its scene.
  if (strip && strip.blocks[0]?.isConnected) {
    const p = [...transport.playing.values()].find(q => q.scene === strip.scene);
    const bar = barSeconds(app.song), t = p && transport.running ? ctx.currentTime - p.at : -1;
    const n = strip.blocks.length, i = t < 0 ? -1 : Math.floor(t / bar) % n;
    strip.blocks.forEach((b, k) => {
      b.classList.toggle('now', k === i);
      b.querySelector('.prog').style.width = k === i ? ((t % bar) / bar * 100) + '%' : '0';
    });
  }
  if (grid && grid.cells[0]?.cell.isConnected) {
    const cur = Math.floor(selStep);
    for (const { cell, st } of grid.cells) cell.classList.toggle('cur', st === cur);
  }
}

// --- boot -------------------------------------------------------------------------

(async () => {
  try {
    app.songs = await api('songs');
    app.patches = await api('patches').catch(() => []);
    document.body.append(h('datalist', { id: 'patches' }, app.patches.map(p => h('option', { value: p }))));
    const want = location.hash.slice(1);
    await loadSong(app.songs.includes(want) ? want : app.songs.includes('yard') ? 'yard' : app.songs[0]);
  } catch (e) {
    root.replaceChildren(h('div', { class: 'status' }, h('span', { class: 'bad' },
      'the bench needs the dev server (npm run dev): ' + e.message)));
    return;
  }
  requestAnimationFrame(frame);
})();
