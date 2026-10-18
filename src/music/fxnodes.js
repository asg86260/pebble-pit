// The preview's effects: each box of a track's chain as a few Web Audio nodes
// (DESIGN.md, "A track's effects chain"). They are the nearest thing the
// browser has to the render's pedalboard effects, not the same sound; every
// knob moves both the same way, and the render is the one that ships.
//
// A builder returns `{ input, output, set(params) }`; `set` moves the knobs in
// place, so turning one while the loop plays never cuts a note. A Duck also
// has `kick(t)`, which the preview calls for every kick it schedules.

import { MUSIC_PREVIEW_FX as P } from '../config/music.js';

const dB = d => Math.pow(10, d / 20);

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
  let shape = null, boxes = [];
  input.connect(output);
  return {
    input, output,
    update(fx, fill) {
      const live = (fx || []).filter(b => b.on !== false && BUILD[b.type]);
      const next = live.map(b => b.type).join('>');
      if (next !== shape) {
        shape = next;
        input.disconnect();
        for (const b of boxes) b.output.disconnect();
        boxes = live.map(b => BUILD[b.type](ctx, beat));
        let at = input;
        for (const b of boxes) { at.connect(b.input); at = b.output; }
        at.connect(output);
      }
      live.forEach((b, i) => boxes[i].set(fill(b)));
    },
    kick(t) { for (const b of boxes) b.kick?.(t); },
  };
}
