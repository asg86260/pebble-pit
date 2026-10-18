// The render's arithmetic, kept pure so the node tier can check it without
// Surge or Python: how long a scene's loop is, which samples of the two-pass
// render become the OGG, each track's notes over both passes, its MIDI file
// and the key its cached stem is filed under.

import { createHash } from 'node:crypto';
import { sceneEvents, sceneBars, stepSeconds, barSeconds } from '../../src/music/song.js';
import { MUSIC_STEPS_PER_BAR, MUSIC_RENDER_PASSES, MUSIC_RENDER_TAIL_S,
         MUSIC_RENDER_PPQ } from '../../src/config/music.js';
import { smf, noteEvents } from './smf.mjs';

// The loop is rendered twice and the second pass is kept: [L, 2L) already
// carries the first pass's releases, delay and reverb, so the sample after
// the last one is the first one and the wrap is silent. Rounding the start
// and the length separately would let the window drift a sample from the
// bar line, so the end is rounded too and the length is their difference.
export function loopWindow(seconds, sr, passes = MUSIC_RENDER_PASSES, tail = MUSIC_RENDER_TAIL_S) {
  const start = Math.round((passes - 1) * seconds * sr);
  const end = Math.round(passes * seconds * sr);
  return { start, end, frames: end - start, total: Math.round((passes * seconds + tail) * sr) };
}

export const sceneSeconds = (song, scene) => sceneBars(song, scene) * barSeconds(song);

// The tracks that sound in a scene: a clip there and not muted.
export const sceneTracks = (song, scene) =>
  song.tracks.filter(t => t.clips?.[scene] && !t.mute);

// One track's notes over every pass, steps counted from the render's start.
export function passEvents(song, scene, trackId, passes = MUSIC_RENDER_PASSES) {
  const total = sceneBars(song, scene) * MUSIC_STEPS_PER_BAR;
  const one = sceneEvents(song, scene).filter(e => e.track === trackId);
  const out = [];
  for (let p = 0; p < passes; p++) for (const e of one) out.push({ ...e, step: e.step + p * total });
  return out;
}

// The notes as [seconds, pitch, length seconds, velocity], what the drum
// synth and the sidechain read.
export const timedEvents = (song, evs) => {
  const st = stepSeconds(song);
  return evs.map(e => [e.step * st, e.pitch, e.length * st, e.vel]);
};

// A sixteenth is a quarter of a beat at the file's resolution.
export function midiFile(song, evs, seconds, ppq = MUSIC_RENDER_PPQ) {
  const step = ppq / 4;
  const notes = evs.flatMap(e => noteEvents(e.step * step, e.length * step, e.pitch, e.vel));
  const fin = Math.round(seconds / (60 / song.tempo) * ppq);
  return smf([notes], fin, song.tempo, ppq);
}

// A stem is filed under everything that changes its samples, plus the source
// of the script that makes it, so an edit to the drum synth or the Surge
// host is a fresh render rather than a stale cache hit.
export function stemKey(track, song, scene, sr, script) {
  const evs = sceneEvents(song, scene).filter(e => e.track === track.id)
    .map(e => [e.step, e.pitch, e.length, e.vel]);
  return createHash('sha1').update(JSON.stringify({
    kind: track.kind, patch: track.patch || null, evs, tempo: song.tempo,
    bars: sceneBars(song, scene), sr, passes: MUSIC_RENDER_PASSES, tail: MUSIC_RENDER_TAIL_S, script,
  })).digest('hex').slice(0, 16);
}
