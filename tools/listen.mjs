// Hear the yard without ears: render every voice through the real audio.js
// into an offline context, write the result to `shots/sound/`, and measure it.
//
//   node tools/listen.mjs                 # every voice, one wav each
//   node tools/listen.mjs --strip         # and one strip of all of them in a row
//
// It is `look.mjs` for the other sense. The node tier can hold the decisions
// (how many voices forty grains become) and nothing about what a voice sounds
// like; this renders the context half, so a change to a spec is a file you can
// play and a row of numbers you can compare, in about ten seconds. It needs a
// dev server -- pass `GAME=http://localhost:<port>/` -- and the headless shell
// headless.mjs uses.
//
// The numbers, per voice:
//   peak     dBFS, after the whole master chain (the lowpass, the limiter,
//            SND_MASTER), so it is the level that reaches the speaker
//   length   ms from onset until the last sample within 40 dB of the peak:
//            how long the thing is actually audible, not how long it rings
//   centroid Hz, the spectral center of mass -- where the ear places it
//   flat     spectral flatness in [0, 1] over 40 Hz to 6 kHz. Noise is high
//            (a wide band sits around 0.4 and up), a tone is near nought. This
//            is the number that says "noise" or "note" without an ear
//   tone     the strongest normalized autocorrelation at any lag between 1 and
//            25 ms: how much of the sound repeats itself, which is what a pitch
//            is. Noise is under 0.3, a struck body is 0.6 and up
//
// The offline context is stood in for the page's AudioContext before the module
// wakes, and its clock is a variable this script moves, so each voice is
// scheduled at its own second and the whole run renders faster than real time.
// The import carries a query so it is a second instance of audio.js: the page's
// own must stay asleep, or its frame loop would close our fold windows under us.

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const URL_ = process.env.GAME || 'http://localhost:5184/';
const PORT = +(process.env.CDP_PORT || 9353);
const PROFILE = `${process.env.TEMP}/boulder-listen`;
const OUT = 'shots/sound';
const strip = process.argv.includes('--strip');

// What gets rendered, in order: `sfx(voice, opts)` with the hand's class, so
// nothing is folded or stolen and each is heard whole.
const GAP = 1.5;
const STRIKES = [
  ['stone',        'stone', {}],
  ['stone-hard',   'stone', { hard: 1 }],
  ['stone-crit',   'stone', { crit: true }],
  ['stone-big',    'stone', { big: true, hard: 1 }],
  ['wood',         'wood',  {}],
  ['wood-big',     'wood',  { big: true }],
  ['metal',        'metal', {}],
  ['metal-big',    'metal', { big: true, hard: 1 }],
  ['rift',         'rift',  {}],
  ['rift-punct',   'rift',  { cls: 'punct' }]
];

const PAGE = `(async () => {
  const SR = 44100, LEN = ${(STRIKES.length * GAP + 2).toFixed(1)};
  let fakeNow = 0;
  class Off extends OfflineAudioContext {
    constructor() { super(1, Math.ceil(SR * LEN), SR); globalThis.__off = this; }
    get currentTime() { return fakeNow; }
    resume() { return Promise.resolve(); }
  }
  globalThis.AudioContext = Off;
  const A = await import('/src/audio.js?listen');
  A.wakeAudio();
  const ctx = globalThis.__off;
  if (!ctx) throw new Error('audio.js made no context');
  const marks = [];
  let t = 0.5;
  for (const [name, voice, opts] of ${JSON.stringify(STRIKES)}) {
    fakeNow = t; marks.push({ name, at: t, len: ${GAP} });
    A.sfx(voice, Object.assign({ cls: 'hand', x: null }, opts));
    t += ${GAP};
  }
  fakeNow = t; A.stepAudio();
  const buf = await ctx.startRendering();
  globalThis.__listen = { marks, sr: SR, pcm: buf.getChannelData(0) };
  return { marks, sr: SR };
})()`;



// One segment of the render, as 16-bit little-endian base64. The whole render is
// megabytes, and a Runtime.evaluate result that size never comes back; a
// segment at a time does.
const SEG = (at, len) => `(() => {
  const { pcm, sr } = globalThis.__listen;
  const a = Math.round(${at} * sr), b = Math.min(pcm.length, Math.round((${at} + ${len}) * sr));
  const bytes = new Uint8Array((b - a) * 2);
  const view = new DataView(bytes.buffer);
  for (let i = a; i < b; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16((i - a) * 2, s < 0 ? s * 32768 : s * 32767, true);
  }
  let b64 = '';
  for (let i = 0; i < bytes.length; i += 32766)
    b64 += btoa(String.fromCharCode.apply(null, bytes.subarray(i, i + 32766)));
  return b64;
})()`;

// --- the browser, as headless.mjs drives it ---------------------------------------
const root = `${process.env.LOCALAPPDATA}/ms-playwright`;
const dir = readdirSync(root).find(d => d.startsWith('chromium_headless_shell-'));
const exe = `${root}/${dir}/chrome-headless-shell-win64/chrome-headless-shell.exe`;
const alive = async () => { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); return true; }
                            catch { return false; } };
let own = null;
if (!await alive()) {
  own = spawn(exe, [`--remote-debugging-port=${PORT}`, '--no-first-run', `--user-data-dir=${PROFILE}`],
              { stdio: 'ignore' });
  for (let i = 0; i < 40 && !await alive(); i++) await new Promise(r => setTimeout(r, 250));
}
for (const t of await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json())
  await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`);
const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_)}`,
                               { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
const waiting = new Map();
let n = 0;
const logs = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  if (m.method === 'Runtime.consoleAPICalled')
    logs.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' '));
  if (m.method === 'Runtime.exceptionThrown')
    logs.push('EXCEPTION ' + (m.params.exceptionDetails.exception?.description ||
                              m.params.exceptionDetails.text || ''));
});
const send = (method, params = {}) =>
  new Promise(res => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
await new Promise(r => ws.addEventListener('open', r));
await send('Runtime.enable');
for (let i = 0; i < 100; i++) {
  const probe = await send('Runtime.evaluate', { expression: 'typeof window.__test', returnByValue: true });
  if (probe.result?.result?.value === 'function') break;
  await new Promise(r => setTimeout(r, 100));
}
const out = await send('Runtime.evaluate', { expression: PAGE, awaitPromise: true, returnByValue: true });
const res = out.result?.result?.value;
if (!res) {
  console.error('no render:', JSON.stringify(out.result?.exceptionDetails || out, null, 1));
  if (logs.length) console.error(logs.join('\n'));
  process.exit(1);
}
const total = res.marks.at(-1).at + res.marks.at(-1).len;
const pulled = [];
for (let at = 0; at < total; at += 2) {
  const r = await send('Runtime.evaluate', { expression: SEG(at, 2), returnByValue: true });
  if (typeof r.result?.result?.value !== 'string') {
    console.error('pull failed at', at, JSON.stringify(r.result?.exceptionDetails || r).slice(0, 300));
    process.exit(1);
  }
  pulled.push(Buffer.from(r.result.result.value, 'base64'));
}
try { await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`); } catch {}
own?.kill();

// --- the files and the numbers ------------------------------------------------------
const { marks, sr } = res;
const raw = Buffer.concat(pulled);
const all = new Float32Array(raw.length / 2);
for (let i = 0; i < all.length; i++) all[i] = raw.readInt16LE(i * 2) / 32768;

function wav(samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    b.writeInt16LE(Math.round(s < 0 ? s * 32768 : s * 32767), 44 + i * 2);
  }
  return b;
}

// A radix-2 FFT, in place, for the two spectral numbers. 4096 points at 44.1k
// is a 93 ms window and a 10 Hz bin, which resolves the rift's 44 Hz.
function fft(re, im) {
  const N = re.length;
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}

const dB = v => v > 0 ? 20 * Math.log10(v) : -Infinity;

// Where a segment actually begins: the first sample within 30 dB of its peak.
// A strike is scheduled up to SND_JITTER_MS late, so the mark is not the onset.
function measure(seg) {
  let peak = 0;
  for (const s of seg) peak = Math.max(peak, Math.abs(s));
  if (peak === 0) return { peak: -Infinity, length: 0, centroid: 0, flat: 0, tone: 0 };
  const gate = peak * Math.pow(10, -40 / 20), edge = peak * Math.pow(10, -30 / 20);
  let on = 0; while (on < seg.length && Math.abs(seg[on]) < edge) on++;
  let off = seg.length - 1; while (off > on && Math.abs(seg[off]) < gate) off--;
  const length = (off - on) / sr * 1000;

  // Spectrum: the mean power over 4096-point Hann windows stepped through the
  // audible part, so a long bed and a short strike are read the same way.
  const N = 4096, P = new Float64Array(N / 2);
  let frames = 0;
  for (let start = on; start + N <= Math.min(seg.length, off + N); start += N / 2, frames++) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const s = start + i < seg.length ? seg[start + i] : 0;
      re[i] = s * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
    }
    fft(re, im);
    for (let k = 0; k < N / 2; k++) P[k] += re[k] * re[k] + im[k] * im[k];
  }
  const lo = Math.round(40 / sr * N), hi = Math.round(6000 / sr * N);
  let num = 0, den = 0, logsum = 0, cnt = 0;
  for (let k = lo; k < hi; k++) {
    const p = P[k] / Math.max(1, frames);
    num += p * k * sr / N; den += p;
    logsum += Math.log(p + 1e-20); cnt++;
  }
  const centroid = den > 0 ? num / den : 0;
  const flat = den > 0 ? Math.exp(logsum / cnt) / (den / cnt) : 0;

  // Autocorrelation over the first 60 ms after onset, normalized, at lags from
  // 1 ms (1 kHz) to 25 ms (40 Hz): the strongest is how pitched it is.
  const W = Math.min(Math.round(sr * 0.06), seg.length - on - Math.round(sr * 0.025));
  let tone = 0;
  if (W > 0) {
    let e0 = 0;
    for (let i = 0; i < W; i++) e0 += seg[on + i] * seg[on + i];
    for (let lag = Math.round(sr / 1000); lag <= Math.round(sr / 40); lag++) {
      let r = 0, e1 = 0;
      for (let i = 0; i < W; i++) { r += seg[on + i] * seg[on + i + lag]; e1 += seg[on + i + lag] * seg[on + i + lag]; }
      const nr = r / Math.sqrt(e0 * e1 + 1e-20);
      if (nr > tone) tone = nr;
    }
  }
  return { peak: dB(peak), length, centroid, flat, tone };
}

mkdirSync(OUT, { recursive: true });
const pad = (v, w) => String(v).padStart(w);
console.log(`${'voice'.padEnd(12)} ${pad('peak', 7)} ${pad('length', 8)} ${pad('centroid', 9)} ${pad('flat', 6)} ${pad('tone', 6)}`);
for (const m of marks) {
  const seg = all.subarray(Math.round(m.at * sr), Math.round((m.at + m.len) * sr));
  writeFileSync(`${OUT}/${m.name}.wav`, wav(seg));
  const r = measure(seg);
  console.log(`${m.name.padEnd(12)} ${pad(r.peak.toFixed(1), 7)} ${pad(r.length.toFixed(0) + 'ms', 8)} ` +
              `${pad(r.centroid.toFixed(0) + 'Hz', 9)} ${pad(r.flat.toFixed(2), 6)} ${pad(r.tone.toFixed(2), 6)}`);
}
if (strip) writeFileSync(`${OUT}/all.wav`, wav(all));
console.log(`wrote ${marks.length}${strip ? ' + all' : ''} wav to ${OUT}/`);
if (logs.length) console.log(['--- console ---', ...logs].join('\n'));
process.exit(0);
