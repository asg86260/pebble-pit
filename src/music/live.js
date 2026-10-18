// Surge live: the selected track's notes go out over Web MIDI, to a virtual
// cable (loopMIDI on Windows) that the Surge XT standalone listens on.
//
// A standalone Surge holds one patch, so live is one track at a time
// (DESIGN.md, the settled calls); the other lanes stay on the preview synth.
// Web MIDI takes its timestamps on the page's clock, not the audio clock, so
// every note is moved from one to the other as it is sent.

import { MUSIC_LIVE_CHANNEL } from '../config/music.js';

export async function openMidi() {
  if (!navigator.requestMIDIAccess) return { outputs: [], error: 'this browser has no Web MIDI' };
  try {
    const access = await navigator.requestMIDIAccess();
    return { access, outputs: [...access.outputs.values()] };
  } catch (e) {
    return { outputs: [], error: String(e.message || e) };
  }
}

export function makeLive(ctx) {
  let port = null;
  const ch = MUSIC_LIVE_CHANNEL;
  const at = t => performance.now() + (t - ctx.currentTime) * 1000;
  return {
    set port(p) { this.panic(); port = p; },
    get port() { return port; },
    note(track, pitch, t, dur, vel) {
      if (!port) return;
      port.send([0x90 | ch, pitch, vel], at(t));
      port.send([0x80 | ch, pitch, 0], at(t + Math.max(0.01, dur - 0.005)));
    },
    // All notes off and all sound off, for stop and for switching ports.
    panic() {
      if (!port) return;
      port.send([0xB0 | ch, 123, 0]);
      port.send([0xB0 | ch, 120, 0]);
    },
  };
}
