// Hear a saved yard's sound offline: the check for the yard's sound set
// (DESIGN.md, "The yard's sound set, by lanes").
//
//   node tools/node/sound-audition.mjs [save.json] [seconds] [out-name]
//
// The save is loaded into the node yard, the audio's decision half is woken,
// and every strike it lets through (`onStrike` in audio.js: after the folds,
// the ceilings and the camera's gate) is mixed the way the page would play
// it -- recipes through audio.js's own `renderStrike`, recorded takes from
// public/sfx/ at their scattered rate, the voice cap, the pan, the palette's
// lowpass, SND_MASTER and the safety limiter. Out come shots/sound/<name>.ogg,
// its loudness, and how many strikes each event made. Defaults: the endgame
// save `test/fixtures/crew-grows-on-load.json`, twenty seconds, `audition`.
// Needs ffmpeg on PATH (to read the takes and to write and measure the mix).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const [save = 'test/fixtures/crew-grows-on-load.json', secs = '20', name = 'audition'] = process.argv.slice(2);
const { newYard } = await import('./yard.mjs');
const audio = await import('../../src/audio.js');
const { now } = await import('../../src/clock.js');
const C = await import('../../src/config/sound.js');
const { SND_RATE: SR, SND_MASTER, SND_LOWPASS_HZ, SND_LOWPASS_Q, SND_LIMIT_DB, SND_VOICES, SND_STEAL_S } = C;

const yard = await newYard();
localStorage.setItem('boulder-clicker/v4', readFileSync(save, 'utf8'));
yard.restore();
window.__fast(5);
// Look where a player looks: at the middle of the crew, so the rows heard on
// screen only are heard as they would be.
const xs = (yard.S.workers || []).map(w => w.x).sort((a, b) => a - b);
const lookAt = xs.length && yard.S.viewW ? Math.max(0, xs[xs.length >> 1] - yard.S.viewW / 2) : null;
// (held there every frame: the yard's own camera would glide it back to
// where the save was looking)
const hold = () => { if (lookAt != null) { yard.S.camTo = null; yard.S.camX = lookAt; } };
audio.wakeAudio();
audio.muteAudio(false);

const strikes = [];
const t0 = now();
audio.onStrike(s => strikes.push({ ...s, at: (s.t - t0) / 1000 + s.delay / 1000, pan: audio.panOf(s.o.x) }));
const frames = Math.round(+secs * 60);
let camAt = 0;
for (let i = 0; i < frames; i++) { hold(); window.__fast(1 / 60); camAt += yard.S.camX; }
const decided = audio.audioDecisions();

// The takes, read once each through ffmpeg as mono floats at the strike rate.
const takes = new Map();
function take(file) {
  if (!takes.has(file)) {
    const r = spawnSync('ffmpeg', ['-v', 'error', '-i', join('public', 'sfx', file), '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'],
      { maxBuffer: 1 << 26 });
    takes.set(file, new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.byteLength / 4));
  }
  return takes.get(file);
}
// A take at a rate: read faster for higher, as the page's playbackRate does.
function atRate(x, rate) {
  const n = Math.floor(x.length / rate), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = i * rate, k = p | 0, f = p - k; y[i] = (x[k] || 0) * (1 - f) + (x[k + 1] || 0) * f; }
  return y;
}

const N = Math.ceil((+secs + 3) * SR), L = new Float32Array(N), R = new Float32Array(N);
const live = [], counts = {};
strikes.sort((a, b) => a.at - b.at);
for (const s of strikes) {
  counts[s.event] = (counts[s.event] || 0) + 1;
  const buf = s.take ? atRate(take(s.take), Math.pow(2, s.detune / 1200)).map(v => v * s.level)
                     : audio.renderStrike(s.spec, s.o, { level: s.level, widen: s.widen, detune: s.detune });
  // the cap, as makeRoom keeps it: past SND_VOICES the quietest of the yard's
  // goes (never the hand), faded over the steal time
  for (let i = live.length - 1; i >= 0; i--) if (live[i].end <= s.at) live.splice(i, 1);
  if (live.length >= SND_VOICES) {
    let pick = -1;
    live.forEach((v, i) => { if (v.cls !== 'hand' && (pick < 0 || v.level < live[pick].level)) pick = i; });
    if (pick >= 0) { live[pick].cut = s.at; live.splice(pick, 1); }
  }
  const v = { at: s.at, buf, pan: s.pan, level: s.level, cls: s.o.cls || C.SOUNDS[s.event]?.cls, end: s.at + buf.length / SR, cut: Infinity };
  live.push(v);
  s.voice = v;
}
for (const s of strikes) {
  const v = s.voice, i0 = Math.round(v.at * SR);
  const stop = Math.min(v.buf.length, Number.isFinite(v.cut) ? Math.round((v.cut - v.at + SND_STEAL_S) * SR) : v.buf.length);
  const gl = Math.cos((v.pan + 1) * Math.PI / 4) * Math.SQRT2, gr = Math.sin((v.pan + 1) * Math.PI / 4) * Math.SQRT2;
  const fadeN = Math.round(SND_STEAL_S * SR);
  for (let i = 0; i < stop && i0 + i < N; i++) {
    const g = Number.isFinite(v.cut) && i > stop - fadeN ? (stop - i) / fadeN : 1;
    L[i0 + i] += v.buf[i] * g * gl; R[i0 + i] += v.buf[i] * g * gr;
  }
}
// The master: the palette's lowpass, SND_MASTER, the limiter a decibel under full scale.
function lowpass(x) {
  const w = 2 * Math.PI * SND_LOWPASS_HZ / SR, a = Math.sin(w) / (2 * SND_LOWPASS_Q), c = Math.cos(w);
  const b0 = (1 - c) / 2 / (1 + a), b1 = (1 - c) / (1 + a), a1 = -2 * c / (1 + a), a2 = (1 - a) / (1 + a);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const y = b0 * x[i] + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y * SND_MASTER; }
}
lowpass(L); lowpass(R);
const ceil = Math.pow(10, SND_LIMIT_DB / 20);
let g = 1;
for (let i = 0; i < N; i++) {
  const p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
  g = p * g > ceil ? ceil / p : Math.min(1, g + 1 / (0.1 * SR));
  L[i] *= g; R[i] *= g;
}
const pcm = new Float32Array(N * 2);
for (let i = 0; i < N; i++) { pcm[i * 2] = L[i]; pcm[i * 2 + 1] = R[i]; }
mkdirSync('shots/sound', { recursive: true });
const raw = join('shots', 'sound', name + '.f32'), ogg = join('shots', 'sound', name + '.ogg');
writeFileSync(raw, Buffer.from(pcm.buffer));
spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', raw, '-c:a', 'libvorbis', '-q:a', '6', ogg]);
const meas = spawnSync('ffmpeg', ['-hide_banner', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', raw, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const lufs = (meas.match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold[\s\S]*$/) || meas.match(/I:\s+(-?[\d.]+) LUFS(?![\s\S]*I:)/) || [])[1];
spawnSync(process.platform === 'win32' ? 'cmd' : 'rm', process.platform === 'win32' ? ['/c', 'del', raw.replace(/\//g, '\\')] : [raw]);
console.log(`${ogg}: ${secs} s of ${save}, ${lufs} LUFS, ${strikes.length} strikes (${(strikes.length / +secs).toFixed(0)} a second), ` +
            `${decided.unseen} kept silent off screen, ${decided.dropped} dropped over a ceiling; ` +
            `the view averaged x ${Math.round(camAt / frames)} to ${Math.round(camAt / frames + (yard.S.viewW || 0))}`);
console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([e, n]) => `${e} ${n}`).join(' · '));
