// The preview's effects: each box of a track's chain as a few Web Audio nodes
// (DESIGN.md, "A track's effects chain"). They are the nearest thing the
// browser has to the render's pedalboard effects, not the same sound; every
// knob moves both the same way, and the render is the one that ships.
//
// A builder returns `{ input, output, set(params) }`; `set` moves the knobs in
// place, so turning one while the loop plays never cuts a note. A Duck also
// has `kick(t)`, which the preview calls for every kick it schedules, and a
// Vinyl `running(on)`, so its crackle only plays while the transport does.

import { MUSIC_PREVIEW_FX as P } from '../config/music.js';

const dB = d => Math.pow(10, d / 20);

// An LFO: an oscillator through a gain, aimed at a param. `smooth` runs it
// through a lowpass first, so a square wave never clicks.
function lfo(ctx, type = 'sine', smooth = 0) {
  const osc = ctx.createOscillator(), amt = ctx.createGain();
  osc.type = type;
  let tail = osc;
  if (smooth) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = smooth; osc.connect(f); tail = f; }
  tail.connect(amt); osc.start();
  return { osc, amt, to(param) { amt.connect(param); return this; } };
}

// The sample-and-hold the Downsample needs is the one thing Web Audio has no
// node for, so it is a tiny AudioWorklet, loaded once a context.
const HOLD = `class Hold extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'rate', defaultValue: 11025 }]; }
  constructor() { super(); this.ph = 0; this.v = []; }
  process(ins, outs, params) {
    const i = ins[0], o = outs[0];
    if (!i.length) return true;
    const step = params.rate[0] / sampleRate;
    let ph0 = this.ph;
    for (let c = 0; c < o.length; c++) {
      const x = i[c] || i[0]; let ph = ph0, v = this.v[c] || 0;
      for (let n = 0; n < x.length; n++) { ph += step; if (ph >= 1) { ph -= 1; v = x[n]; } o[c][n] = v; }
      this.v[c] = v; this.ph = ph;
    }
    return true;
  }
}
registerProcessor('music-hold', Hold);`;
const holdReady = new WeakMap();
export function loadWorklets(ctx) {
  if (holdReady.has(ctx) || !ctx.audioWorklet) return;
  holdReady.set(ctx, false);
  const url = URL.createObjectURL(new Blob([HOLD], { type: 'text/javascript' }));
  ctx.audioWorklet.addModule(url).then(() => holdReady.set(ctx, true)).catch(() => {});
}

// A seeded noise buffer, so a page reload hears the same crackle.
function noiseBuffer(ctx, seconds, fill) {
  const len = Math.round(seconds * ctx.sampleRate), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = fill(rnd); }
  return buf;
}

// A box with a dry path and a wet path, blended by `mix`.
function wetDry(ctx, wetIn, wetOut) {
  const input = ctx.createGain(), output = ctx.createGain(), dry = ctx.createGain(), wet = ctx.createGain();
  input.connect(dry).connect(output);
  input.connect(wetIn); wetOut.connect(wet).connect(output);
  return { input, output, mix(m) { dry.gain.value = 1 - m; wet.gain.value = m; } };
}

function shaper(ctx, fn) {
  const ws = ctx.createWaveShaper(), n = P.shaperSize, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) curve[i] = fn((i / (n - 1)) * 2 - 1);
  ws.curve = curve;
  return ws;
}

// A made-up hall: noise that decays over `seconds`, each channel its own.
function hall(ctx, seconds) {
  const len = Math.max(1, Math.round(seconds * ctx.sampleRate)), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, P.reverbCurve);
  }
  return buf;
}

const BUILD = {
  filter(ctx) {
    const f = ctx.createBiquadFilter();
    return { input: f, output: f, set(p) { f.type = p.type; f.frequency.value = p.cutoff; f.Q.value = P.filterQ[0] + p.reso * P.filterQ[1]; } };
  },
  eq(ctx) {
    const lo = ctx.createBiquadFilter(), mid = ctx.createBiquadFilter(), hi = ctx.createBiquadFilter();
    lo.type = 'lowshelf'; lo.frequency.value = P.eqLow;
    mid.type = 'peaking'; mid.frequency.value = P.eqMid; mid.Q.value = P.eqMidQ;
    hi.type = 'highshelf'; hi.frequency.value = P.eqHigh;
    lo.connect(mid).connect(hi);
    return { input: lo, output: hi, set(p) { lo.gain.value = p.low; mid.gain.value = p.mid; hi.gain.value = p.high; } };
  },
  drive(ctx) {
    const pre = ctx.createGain(), tone = ctx.createBiquadFilter(), post = ctx.createGain();
    const ws = shaper(ctx, x => Math.tanh(x));
    tone.type = 'lowpass';
    pre.connect(ws).connect(tone).connect(post);
    const box = wetDry(ctx, pre, post);
    return { ...box, set(p) { pre.gain.value = dB(p.amount); post.gain.value = 1 / Math.max(1, dB(p.amount) * P.driveMakeup); tone.frequency.value = p.tone; box.mix(p.mix); } };
  },
  bitcrush(ctx) {
    const pass = ctx.createGain(), out = ctx.createGain();
    let ws = null, bits = null;
    const box = wetDry(ctx, pass, out);
    return { ...box, set(p) {
      if (p.bits !== bits) {
        bits = p.bits;
        if (ws) ws.disconnect();
        const steps = Math.pow(2, bits - 1);
        ws = shaper(ctx, x => Math.round(x * steps) / steps);
        pass.connect(ws).connect(out);
      }
      box.mix(p.mix);
    } };
  },
  chorus(ctx) {
    const d = ctx.createDelay(0.1), lfo = ctx.createOscillator(), depth = ctx.createGain();
    d.delayTime.value = P.chorusBase;
    lfo.connect(depth).connect(d.delayTime); lfo.start();
    const box = wetDry(ctx, d, d);
    return { ...box, set(p) { lfo.frequency.value = p.rate; depth.gain.value = p.depth * P.chorusSwing; box.mix(p.mix); } };
  },
  phaser(ctx) {
    const stages = P.phaserFreqs.map(f => { const a = ctx.createBiquadFilter(); a.type = 'allpass'; a.frequency.value = f; return a; });
    stages.reduce((a, b) => (a.connect(b), b));
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.connect(depth); for (const s of stages) depth.connect(s.frequency); lfo.start();
    const box = wetDry(ctx, stages[0], stages.at(-1));
    return { ...box, set(p) { lfo.frequency.value = p.rate; depth.gain.value = p.depth * P.phaserSwing; box.mix(p.mix); } };
  },
  delay(ctx, beat) {
    const d = ctx.createDelay(4), fb = ctx.createGain(), tone = ctx.createBiquadFilter();
    tone.type = 'lowpass'; tone.frequency.value = P.delayTone;
    d.connect(tone).connect(fb).connect(d);
    const box = wetDry(ctx, d, tone);
    return { ...box, set(p) { d.delayTime.value = p.time * beat(); fb.gain.value = p.feedback; box.mix(p.mix); } };
  },
  reverb(ctx) {
    const conv = ctx.createConvolver(), damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    conv.connect(damp);
    let size = null;
    const box = wetDry(ctx, conv, damp);
    return { ...box, set(p) {
      // A new hall only when the size has moved enough to hear, not on every pixel of a drag.
      if (size == null || Math.abs(p.size - size) > P.reverbStep) { size = p.size; conv.buffer = hall(ctx, P.reverbSeconds[0] + p.size * P.reverbSeconds[1]); }
      damp.frequency.value = P.reverbDamp[1] * Math.pow(P.reverbDamp[0] / P.reverbDamp[1], p.damp);
      box.mix(p.mix);
    } };
  },
  comp(ctx) {
    const c = ctx.createDynamicsCompressor();
    c.attack.value = P.compAttack;
    return { input: c, output: c, set(p) { c.threshold.value = p.threshold; c.ratio.value = p.ratio; c.release.value = p.release / 1000; } };
  },
  autofilter(ctx) {
    const f = ctx.createBiquadFilter(), sweep = lfo(ctx).to(f.frequency);
    f.type = 'lowpass'; f.Q.value = P.autoQ;
    return { input: f, output: f, set(p) {
      f.frequency.value = p.center; sweep.osc.frequency.value = p.rate;
      sweep.amt.gain.value = p.center * P.autoSwing * p.depth;
    } };
  },
  downsample(ctx) {
    const pass = ctx.createGain(), out = ctx.createGain();
    let node = null;
    if (holdReady.get(ctx)) { node = new AudioWorkletNode(ctx, 'music-hold'); pass.connect(node).connect(out); }
    else pass.connect(out);
    const box = wetDry(ctx, pass, out);
    return { ...box, set(p) { if (node) node.parameters.get('rate').value = p.rate; box.mix(p.mix); } };
  },
  flanger(ctx) {
    const d = ctx.createDelay(0.05), fb = ctx.createGain(), sweep = lfo(ctx).to(d.delayTime);
    d.delayTime.value = P.flangeBase;
    d.connect(fb).connect(d);
    const box = wetDry(ctx, d, d);
    box.mix(0.5);
    return { ...box, set(p) { sweep.osc.frequency.value = p.rate; sweep.amt.gain.value = p.depth * P.flangeSwing; fb.gain.value = p.feedback; } };
  },
  wobble(ctx) {
    const d = ctx.createDelay(0.1), wow = lfo(ctx).to(d.delayTime), flutter = lfo(ctx, 'triangle').to(d.delayTime);
    d.delayTime.value = P.wobbleBase;
    flutter.osc.frequency.value = P.flutterHz;
    return { input: d, output: d, set(p) {
      wow.osc.frequency.value = p.wow; wow.amt.gain.value = p.depth * P.wowSwing;
      flutter.amt.gain.value = p.flutter * P.flutterSwing;
    } };
  },
  tremolo(ctx, beat) {
    const g = ctx.createGain();
    let shape = null, pulse = null;
    return { input: g, output: g, set(p) {
      if (p.shape !== shape) {
        shape = p.shape;
        if (pulse) { pulse.osc.stop(); pulse.amt.disconnect(); }
        pulse = lfo(ctx, shape, shape === 'square' ? P.tremSmooth : 0).to(g.gain);
      }
      pulse.osc.frequency.value = 1 / (p.rate * beat());
      g.gain.value = 1 - p.depth / 2; pulse.amt.gain.value = p.depth / 2;
    } };
  },
  autopan(ctx, beat) {
    const pan = ctx.createStereoPanner(), swing = lfo(ctx).to(pan.pan);
    return { input: pan, output: pan, set(p) { swing.osc.frequency.value = 1 / (p.rate * beat()); swing.amt.gain.value = p.depth; } };
  },
  width(ctx) {
    // Mid and side from left and right, the side scaled, then back again.
    const input = ctx.createGain(), split = ctx.createChannelSplitter(2), merge = ctx.createChannelMerger(2);
    input.channelCount = 2; input.channelCountMode = 'explicit';
    const mid = ctx.createGain(), side = ctx.createGain(), sideAmt = ctx.createGain(), neg = ctx.createGain();
    const lm = ctx.createGain(), rm = ctx.createGain(), ls = ctx.createGain(), rs = ctx.createGain();
    lm.gain.value = rm.gain.value = ls.gain.value = 0.5; rs.gain.value = -0.5; neg.gain.value = -1;
    input.connect(split);
    split.connect(lm, 0).connect(mid); split.connect(rm, 1).connect(mid);
    split.connect(ls, 0).connect(side); split.connect(rs, 1).connect(side);
    side.connect(sideAmt);
    mid.connect(merge, 0, 0); sideAmt.connect(merge, 0, 0);
    mid.connect(merge, 0, 1); sideAmt.connect(neg).connect(merge, 0, 1);
    return { input, output: merge, set(p) { sideAmt.gain.value = p.amount; } };
  },
  vinyl(ctx) {
    const wear = ctx.createBiquadFilter(), out = ctx.createGain(), bed = ctx.createGain();
    wear.type = 'lowpass';
    wear.connect(out); bed.connect(out);
    const hiss = ctx.createBufferSource(), pops = ctx.createBufferSource();
    hiss.buffer = noiseBuffer(ctx, P.vinylLoop, r => (r() * 2 - 1) * P.hissLevel);
    pops.buffer = noiseBuffer(ctx, P.vinylLoop, r => (r() < P.crackleOdds ? (r() * 2 - 1) : 0));
    hiss.loop = pops.loop = true;
    const hg = ctx.createGain(), pg = ctx.createGain();
    hiss.connect(hg).connect(bed); pops.connect(pg).connect(bed);
    hiss.start(); pops.start();
    bed.gain.value = 0;
    return { input: wear, output: out,
      set(p) { hg.gain.value = p.hiss; pg.gain.value = p.crackle * P.crackleLevel; wear.frequency.value = P.wearHz[0] * Math.pow(P.wearHz[1] / P.wearHz[0], p.wear); },
      running(on) { bed.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.05); } };
  },
  pitch(ctx) {
    // Two delay lines read through a sawtooth, half a cycle apart, each faded
    // in and out by a triangle so the jumps where it wraps are never heard.
    const input = ctx.createGain(), wet = ctx.createGain();
    const saw = ctx.createOscillator(); saw.type = 'sawtooth';
    const half = ctx.createWaveShaper(), curveN = 1024;
    const shift = new Float32Array(curveN), tri = new Float32Array(curveN), tri2 = new Float32Array(curveN);
    for (let i = 0; i < curveN; i++) {
      const x = i / (curveN - 1) * 2 - 1, y = x < 0 ? x + 1 : x - 1;
      shift[i] = y; tri[i] = 1 - Math.abs(x); tri2[i] = 1 - Math.abs(y);
    }
    half.curve = shift;
    saw.connect(half);
    const lines = [saw, half].map((src, k) => {
      const d = ctx.createDelay(0.2), amt = ctx.createGain(), fade = ctx.createGain(), win = ctx.createWaveShaper();
      win.curve = k ? tri2 : tri;
      d.delayTime.value = P.pitchWindow / 2;
      src.connect(amt).connect(d.delayTime);
      saw.connect(win).connect(fade.gain);
      fade.gain.value = 0;
      input.connect(d).connect(fade).connect(wet);
      return amt;
    });
    saw.start();
    const box = wetDry(ctx, input, wet);
    return { ...box, set(p) {
      // Reading a delay line that shortens at (ratio - 1) seconds a second raises the pitch by that ratio.
      const ratio = Math.pow(2, p.interval / 12), rate = (ratio - 1) / P.pitchWindow;
      saw.frequency.value = Math.abs(rate);
      for (const amt of lines) amt.gain.value = -Math.sign(rate) * P.pitchWindow / 2;
      box.mix(p.mix);
    } };
  },
  duck(ctx) {
    const g = ctx.createGain();
    let depth = 1, release = 0.15;
    return { input: g, output: g,
      set(p) { depth = dB(-p.amount); release = p.release; },
      kick(t) { g.gain.setTargetAtTime(depth, t, P.duckAttack); g.gain.setTargetAtTime(1, t + P.duckHold, release / 3); } };
  },
};

export const PREVIEW_FX_TYPES = Object.keys(BUILD);

// A track's chain as nodes between `input` and `output`, rebuilt only when
// its shape changes (which boxes, in which order, which are on).
export function makeChain(ctx, beat) {
  const input = ctx.createGain(), output = ctx.createGain();
  let shape = null, boxes = [], isRunning = false;
  input.connect(output);
  return {
    input, output,
    update(fx, fill) {
      const live = (fx || []).filter(b => b.on !== false && BUILD[b.type]);
      // A Downsample built before its worklet loaded is rebuilt once it has.
      const next = live.map(b => b.type).join('>') + (holdReady.get(ctx) ? '|hold' : '');
      if (next !== shape) {
        shape = next;
        input.disconnect();
        for (const b of boxes) b.output.disconnect();
        boxes = live.map(b => BUILD[b.type](ctx, beat));
        for (const b of boxes) b.running?.(isRunning);
        let at = input;
        for (const b of boxes) { at.connect(b.input); at = b.output; }
        at.connect(output);
      }
      live.forEach((b, i) => boxes[i].set(fill(b)));
    },
    kick(t) { for (const b of boxes) b.kick?.(t); },
    running(on) { isRunning = on; for (const b of boxes) b.running?.(on); },
  };
}
