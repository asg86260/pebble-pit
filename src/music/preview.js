// The preview synth: an approximation of each track, instant and all at once.
//
// It is not the sound that ships -- that is Surge XT through the render -- so
// every voice here is a few nodes: an oscillator or two through a lowpass and
// an envelope, and drums made from a sine sweep and filtered noise. Notes are
// handed to Web Audio with exact start times by the scheduler (transport.js),
// so nothing here keeps time of its own.

import { MUSIC_PREVIEW_MASTER, MUSIC_PREVIEW_COMP, MUSIC_PREVIEW_VOICE, MUSIC_PREVIEW_PEAK,
         MUSIC_PREVIEW_SWEEP, MUSIC_PREVIEW_DRUMS as D } from '../config/music.js';

const midiHz = p => 440 * Math.pow(2, (p - 69) / 12);

// `muted` keeps every note scheduled and the playhead running with nothing
// reaching the speakers: an agent checking the bench must never be heard.
export function makePreview(ctx, { muted = false } = {}) {
  const master = ctx.createGain();
  master.gain.value = muted ? 0 : MUSIC_PREVIEW_MASTER;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = MUSIC_PREVIEW_COMP.threshold; comp.ratio.value = MUSIC_PREVIEW_COMP.ratio;
  master.connect(comp).connect(ctx.destination);

  // One second of white noise, shared by every drum hit.
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const buses = new Map();
  function bus(track) {
    let b = buses.get(track.id);
    if (!b) {
      const gain = ctx.createGain(), pan = ctx.createStereoPanner();
      gain.connect(pan).connect(master);
      b = { gain, pan };
      buses.set(track.id, b);
    }
    b.gain.gain.value = track.level ?? 0.7;
    b.pan.pan.value = track.pan ?? 0;
    return b.gain;
  }

  function synthNote(track, pitch, t, dur, vel) {
    const v = { ...MUSIC_PREVIEW_VOICE, ...(track.preview || {}) };
    const out = bus(track);
    const amp = ctx.createGain(), filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.Q.value = v.q;
    const peak = (vel / 127) * MUSIC_PREVIEW_PEAK;
    const end = t + Math.max(dur, v.attack + 0.01);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(peak, t + v.attack);
    amp.gain.setTargetAtTime(peak * v.sustain, t + v.attack, v.decay / 3);
    amp.gain.setValueAtTime(peak * v.sustain, end);
    amp.gain.setTargetAtTime(0, end, v.release / 3);
    filt.frequency.setValueAtTime(v.cutoff * MUSIC_PREVIEW_SWEEP, t);
    filt.frequency.setTargetAtTime(v.cutoff, t, v.decay / 2);
    filt.connect(amp).connect(out);
    const stop = end + v.release * 2;
    const oscs = v.detune ? [-v.detune, v.detune] : [0];
    for (const d of oscs) {
      const o = ctx.createOscillator();
      o.type = v.wave; o.frequency.value = midiHz(pitch); o.detune.value = d;
      o.connect(filt); o.start(t); o.stop(stop);
    }
  }

  function noiseHit(out, t, { type, freq, q = 1, len, level }) {
    const src = ctx.createBufferSource(); src.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 0.5); src.stop(t + len + 0.02);
  }

  function drumNote(track, pitch, t, vel) {
    const out = bus(track), k = vel / 127;
    if (pitch === 36) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(D.kick.from, t);
      o.frequency.exponentialRampToValueAtTime(D.kick.to, t + D.kick.sweep);
      g.gain.setValueAtTime(D.kick.level * k, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + D.kick.len);
      o.connect(g).connect(out); o.start(t); o.stop(t + D.kick.len + 0.05);
    } else if (pitch === 38) {
      const sn = D.snare;
      noiseHit(out, t, { type: 'bandpass', freq: sn.freq, q: sn.q, len: sn.len, level: sn.level * k });
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = sn.tone;
      g.gain.setValueAtTime(sn.toneLevel * k, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + sn.toneLen);
      o.connect(g).connect(out); o.start(t); o.stop(t + sn.toneLen + 0.02);
    } else if (pitch === 39) {
      const c = D.clap;
      for (const d of c.gaps) noiseHit(out, t + d, { type: 'bandpass', freq: c.freq, q: c.q, len: c.len, level: c.level * k });
    } else if (pitch === 46) {
      noiseHit(out, t, { type: 'highpass', freq: D.openHat.freq, len: D.openHat.len, level: D.openHat.level * k });
    } else {
      noiseHit(out, t, { type: 'highpass', freq: D.hat.freq, len: D.hat.len, level: D.hat.level * k });
    }
  }

  return {
    note(track, pitch, t, dur, vel) {
      if (track.kind === 'drums') drumNote(track, pitch, t, vel);
      else synthNote(track, pitch, t, dur, vel);
    },
    refresh(track) { bus(track); },
  };
}
