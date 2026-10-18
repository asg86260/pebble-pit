// A song as plain data: what the bench writes, the render reads and the game
// will play. No DOM and no AudioContext, so the node tier reads it as is.
//
// A song is a tempo, a key, scenes by name and tracks; a track holds one clip
// per scene at most, and a clip is a loop of whole bars with its notes as
// `[step, pitch, length, velocity]` on a sixteenth grid. `game` names the one
// scene that is the place's loop in the game (DESIGN.md, the settled calls).
// `chords[scene]` is a scale degree a bar, and a track with `follow` has its
// clips written from those chords (theory.js); both are optional.

import { MUSIC_STEPS_PER_BAR, MUSIC_BEATS_PER_BAR, MUSIC_CLIP_BARS, MUSIC_CHORD_BARS,
         MUSIC_TEMPO_MIN, MUSIC_TEMPO_MAX, MUSIC_PATTERNS, MUSIC_ROOTS, MUSIC_MODES } from '../config/music.js';

export const beatSeconds = song => 60 / song.tempo;
export const stepSeconds = song => beatSeconds(song) * MUSIC_BEATS_PER_BAR / MUSIC_STEPS_PER_BAR;
export const barSeconds = song => beatSeconds(song) * MUSIC_BEATS_PER_BAR;

export const clipOf = (track, scene) => track.clips?.[scene] || null;
export const clipSteps = clip => clip.bars * MUSIC_STEPS_PER_BAR;

// A scene loops over its longest clip; the shorter ones repeat inside it.
export function sceneBars(song, scene) {
  let bars = 0;
  for (const t of song.tracks) { const c = clipOf(t, scene); if (c) bars = Math.max(bars, c.bars); }
  return bars;
}

// Every note of one pass of a scene, each clip repeated to fill it, in steps.
// The order is by start, then track, so the render and a check read one list.
export function sceneEvents(song, scene) {
  const bars = sceneBars(song, scene), total = bars * MUSIC_STEPS_PER_BAR, out = [];
  song.tracks.forEach((track, ti) => {
    const clip = clipOf(track, scene);
    if (!clip || track.mute) return;
    const len = clipSteps(clip);
    for (let off = 0; off < total; off += len)
      for (const [step, pitch, length, vel] of clip.notes)
        out.push({ track: track.id, ti, step: off + step, pitch, length, vel });
  });
  return out.sort((a, b) => a.step - b.step || a.ti - b.ti || a.pitch - b.pitch);
}

// Launching waits for the bar line: the first bar boundary at or after `t`,
// counted from the transport's start. A launch inside a millisecond of a bar
// line is that bar, so a press on the beat does not wait a whole bar.
export function nextBar(song, t, start = 0) {
  const bar = barSeconds(song), n = (t - start) / bar;
  const k = Math.abs(n - Math.round(n)) < 1e-3 / bar ? Math.round(n) : Math.ceil(n);
  return start + Math.max(0, k) * bar;
}

// Where a looping clip launched at `at` is at time `t`, in steps.
export function clipStepAt(song, clip, at, t) {
  const len = clipSteps(clip), s = (t - at) / stepSeconds(song);
  return ((s % len) + len) % len;
}

// What would make a song unreadable by the render or the game, one line each.
export function validate(song) {
  const bad = [];
  if (!song || typeof song !== 'object') return ['not an object'];
  if (!(song.tempo >= MUSIC_TEMPO_MIN && song.tempo <= MUSIC_TEMPO_MAX)) bad.push(`tempo ${song.tempo}`);
  if (!Array.isArray(song.scenes) || !song.scenes.length) bad.push('no scenes');
  if (song.game && !song.scenes?.includes(song.game)) bad.push(`game scene ${song.game} is not a scene`);
  if (song.key && typeof song.key === 'object' && !(MUSIC_ROOTS.includes(song.key.root) && MUSIC_MODES[song.key.mode]))
    bad.push(`key ${JSON.stringify(song.key)}`);
  for (const [scene, chords] of Object.entries(song.chords || {})) {
    if (!song.scenes?.includes(scene)) bad.push(`chords in unknown scene ${scene}`);
    if (!MUSIC_CHORD_BARS.includes(chords.length)) bad.push(`chords/${scene}: ${chords.length} bars`);
    if (!chords.every(d => Number.isInteger(d) && d >= 1 && d <= 7)) bad.push(`chords/${scene}: a degree is not 1 to 7`);
  }
  const ids = new Set();
  for (const t of song.tracks || []) {
    if (ids.has(t.id)) bad.push(`track id ${t.id} twice`);
    ids.add(t.id);
    if (t.kind !== 'synth' && t.kind !== 'drums') bad.push(`${t.id}: kind ${t.kind}`);
    if (t.follow && !MUSIC_PATTERNS[t.follow.pattern]) bad.push(`${t.id}: follows unknown pattern ${t.follow.pattern}`);
    for (const [scene, clip] of Object.entries(t.clips || {})) {
      if (!song.scenes?.includes(scene)) bad.push(`${t.id}: clip in unknown scene ${scene}`);
      if (!MUSIC_CLIP_BARS.includes(clip.bars)) bad.push(`${t.id}/${scene}: ${clip.bars} bars`);
      const steps = clip.bars * MUSIC_STEPS_PER_BAR;
      for (const n of clip.notes || []) {
        const [step, pitch, length, vel] = n;
        if (!(step >= 0 && step < steps)) bad.push(`${t.id}/${scene}: step ${step}`);
        if (!(pitch >= 0 && pitch <= 127)) bad.push(`${t.id}/${scene}: pitch ${pitch}`);
        if (!(length > 0)) bad.push(`${t.id}/${scene}: length ${length}`);
        if (!(vel >= 1 && vel <= 127)) bad.push(`${t.id}/${scene}: velocity ${vel}`);
      }
    }
  }
  return bad;
}
