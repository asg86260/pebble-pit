// Just enough music theory to make choices instead of notes (DESIGN.md,
// "Chords first, no wrong notes"): a key's seven notes, the triad on each of
// its degrees, and the parts that play those triads by themselves.
//
// Plain functions over the song, no DOM, so the node tier checks that a
// progression stays in its key and a pattern fills its bars. Following parts
// are written into ordinary clip notes, so the render and the game never need
// to know a chord was involved.

import { MUSIC_ROOTS, MUSIC_MODES, MUSIC_FEEL, MUSIC_NEXT, MUSIC_START_CHORDS, MUSIC_PATTERNS,
         MUSIC_ROLE_LOW, MUSIC_STEPS_PER_BAR, MUSIC_MODE_SWAP } from '../config/music.js';

// A key as a root and a mode. An old song wrote it as "A minor"; that reads
// the same, and anything unreadable falls back to C major.
export function keyOf(song) {
  const k = song.key;
  if (k && typeof k === 'object' && MUSIC_ROOTS.includes(k.root) && MUSIC_MODES[k.mode]) return k;
  const m = typeof k === 'string' && k.trim().match(/^([A-G]#?)\s+(major|minor)$/i);
  if (m && MUSIC_ROOTS.includes(m[1].toUpperCase())) return { root: m[1].toUpperCase(), mode: m[2].toLowerCase() };
  return { root: 'C', mode: 'major' };
}
export const keyName = key => `${key.root} ${key.mode}`;
const rootPc = key => MUSIC_ROOTS.indexOf(key.root);
const scale = key => MUSIC_MODES[key.mode];

// The pitch classes of the key, and whether a MIDI note is one of them.
export const keyPcs = key => scale(key).map(i => (rootPc(key) + i) % 12);
export const inKey = (key, pitch) => keyPcs(key).includes(((pitch % 12) + 12) % 12);

// A note's place in the key: its degree (0-6) and octave, or null off the key.
function degreeOf(key, pitch) {
  const rel = pitch - rootPc(key), oct = Math.floor(rel / 12), pc = ((rel % 12) + 12) % 12;
  const d = scale(key).indexOf(pc);
  return d < 0 ? null : { d, oct };
}
const pitchOf = (key, d, oct) => {
  const s = scale(key), wrap = Math.floor(d / 7), dd = ((d % 7) + 7) % 7;
  return rootPc(key) + (oct + wrap) * 12 + s[dd];
};

// The triad on a degree (1-7), as pitch classes root, third, fifth.
export function chordPcs(key, degree) {
  const s = scale(key), d = degree - 1;
  return [0, 2, 4].map(k => (rootPc(key) + s[(d + k) % 7]) % 12);
}
export function chordName(key, degree) {
  const [r, t, f] = chordPcs(key, degree);
  const third = (t - r + 12) % 12, fifth = (f - r + 12) % 12;
  const q = fifth === 6 ? 'dim' : third === 3 ? 'm' : '';
  return MUSIC_ROOTS[r] + q;
}
export const chordFeel = (key, degree) => MUSIC_FEEL[key.mode][degree - 1];
export const goodNext = (key, degree) => MUSIC_NEXT[key.mode][degree] || [];
export const startChords = key => [...MUSIC_START_CHORDS[key.mode]];

// A tone of a chord as a MIDI note, the root placed at or above `low`.
function tonePitch(key, degree, tone, low, nextDegree) {
  const [r, t, f] = chordPcs(key, degree);
  const root = low + ((r - low) % 12 + 12) % 12;
  const up = pc => root + ((pc - r + 12) % 12);
  switch (tone) {
    case 'r': return root;
    case '3': return up(t);
    case '5': return up(f);
    case '8': return root + 12;
    case '5-': return up(f) - 12;
    case 'a': {
      // A step under the next chord's root: the walking bass leads into it.
      const nr = chordPcs(key, nextDegree)[0];
      const target = root + ((nr - r + 12) % 12);
      const at = degreeOf(key, target);
      return at ? pitchOf(key, at.d - 1, at.oct) : target - 1;
    }
  }
  return root;
}

// The notes a following part plays over a list of chords, one chord a bar.
export function followNotes(key, chords, pattern) {
  const pat = MUSIC_PATTERNS[pattern];
  if (!pat || !chords.length) return [];
  const low = MUSIC_ROLE_LOW[pat.role], out = [];
  chords.forEach((deg, bar) => {
    const next = chords[(bar + 1) % chords.length];
    for (const [step, tone, len, vel] of pat.hits)
      out.push([bar * MUSIC_STEPS_PER_BAR + step, tonePitch(key, deg, tone, low, next), len, vel]);
  });
  return out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

// Rewrite every following clip from its scene's chords. A following track
// with no clip in a scene that has chords gets one, so a new chord strip is
// heard at once. Mutates the song; returns it.
export function refollow(song) {
  const key = keyOf(song);
  for (const t of song.tracks) {
    if (!t.follow) continue;
    t.clips = t.clips || {};
    for (const scene of song.scenes) {
      const chords = song.chords?.[scene];
      if (!chords?.length) continue;
      t.clips[scene] = { bars: chords.length, notes: followNotes(key, chords, t.follow.pattern) };
    }
  }
  return song;
}

// Move a hand-drawn note from one key into another by scale degree, so a
// melody keeps its shape; a note off the old key moves by the roots' gap.
export function transposeNote(from, to, pitch) {
  // The roots' gap the short way round, the same for every note, so a melody
  // keeps its register and its contour.
  const gap = rootPc(to) - rootPc(from), wrap = gap > 6 ? -12 : gap < -6 ? 12 : 0;
  const at = degreeOf(from, pitch);
  if (!at) return pitch + gap + wrap;
  return pitchOf(to, at.d, at.oct) + wrap;
}

// A chord strip carried into another key: the same degrees, but a change of
// mode moves the chord that would turn diminished (MUSIC_MODE_SWAP).
export function carryChords(from, to, chords) {
  if (from.mode === to.mode) return [...chords];
  const swap = MUSIC_MODE_SWAP[to.mode];
  return chords.map(d => swap[d] ?? d);
}
