// The song as data: what the bench writes is what the render reads.
//
// Neither tier can hear, so these hold the arithmetic every sound source
// shares: a scene's length, its notes in one list, and a launch landing on
// the bar line. Every song in src/music/songs/ must also read clean, so a
// save from the bench that the render would choke on is red here first.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validate, sceneBars, sceneEvents, nextBar, barSeconds, stepSeconds, clipStepAt } from '../src/music/song.js';
import { MUSIC_STEPS_PER_BAR } from '../src/config/music.js';

const dir = new URL('../src/music/songs/', import.meta.url);
const songs = readdirSync(dir).filter(f => f.endsWith('.json'))
  .map(f => [f, JSON.parse(readFileSync(new URL(f, dir), 'utf8'))]);

const tiny = () => ({
  tempo: 120, scenes: ['a', 'b'], game: 'a',
  tracks: [
    { id: 'k', kind: 'drums', clips: { a: { bars: 1, notes: [[0, 36, 1, 100], [8, 36, 1, 100]] } } },
    { id: 'l', kind: 'synth', clips: { a: { bars: 2, notes: [[4, 60, 2, 90]] } } },
  ],
});

test('every song on disk reads clean', () => {
  assert.ok(songs.length > 0);
  for (const [f, s] of songs) assert.deepEqual(validate(s), [], f);
});

test('a scene loops over its longest clip and repeats the shorter', () => {
  const s = tiny();
  assert.equal(sceneBars(s, 'a'), 2);
  assert.equal(sceneBars(s, 'b'), 0);
  const ev = sceneEvents(s, 'a');
  assert.deepEqual(ev.filter(e => e.track === 'k').map(e => e.step), [0, 8, 16, 24]);
  assert.deepEqual(ev.filter(e => e.track === 'l').map(e => e.step), [4]);
});

test('a muted track is left out of the scene', () => {
  const s = tiny(); s.tracks[0].mute = true;
  assert.ok(sceneEvents(s, 'a').every(e => e.track === 'l'));
});

test('a launch waits for the next bar line, and a press on it does not', () => {
  const s = tiny(), bar = barSeconds(s);
  assert.equal(bar, 2);
  assert.equal(stepSeconds(s) * MUSIC_STEPS_PER_BAR, bar);
  assert.equal(nextBar(s, 0.3), 2);
  assert.equal(nextBar(s, 2), 2);
  assert.equal(nextBar(s, 2.0000001), 2);
  assert.equal(nextBar(s, 2.01), 4);
  assert.equal(nextBar(s, 5, 1), 5);
});

test('a looping clip wraps where it was launched', () => {
  const s = tiny(), clip = s.tracks[0].clips.a;
  assert.equal(clipStepAt(s, clip, 2, 2), 0);
  assert.equal(clipStepAt(s, clip, 2, 3), 8);
  assert.equal(clipStepAt(s, clip, 2, 4.125), 1);
});

test('validate names what the render would choke on', () => {
  const s = tiny();
  s.tracks[1].clips.a.notes.push([40, 60, 1, 90]);
  s.tracks[1].clips.c = { bars: 3, notes: [] };
  s.game = 'z';
  const bad = validate(s).join('\n');
  assert.match(bad, /step 40/);
  assert.match(bad, /unknown scene c/);
  assert.match(bad, /3 bars/);
  assert.match(bad, /game scene z/);
});

// --- chords first (DESIGN.md, "Chords first, no wrong notes") ---------------

import { keyOf, inKey, chordName, chordPcs, followNotes, refollow, transposeNote, startChords, carryChords } from '../src/music/theory.js';
import { MUSIC_PATTERNS } from '../src/config/music.js';

const aMinor = { root: 'A', mode: 'minor' }, cMajor = { root: 'C', mode: 'major' };

test('an old song key string reads as a root and a mode', () => {
  assert.deepEqual(keyOf({ key: 'A minor' }), aMinor);
  assert.deepEqual(keyOf({ key: 'f# MAJOR' }), { root: 'F#', mode: 'major' });
  assert.deepEqual(keyOf({ key: 'nonsense' }), cMajor);
  assert.deepEqual(keyOf({ key: aMinor }), aMinor);
});

test('the seven chords of a key are named as a musician would', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(d => chordName(aMinor, d)), ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(d => chordName(cMajor, d)), ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
});

test('every pattern over every chord stays in the key and fills its bars', () => {
  for (const key of [aMinor, cMajor, { root: 'F#', mode: 'minor' }]) {
    const chords = [1, 2, 3, 4, 5, 6, 7, 1];
    for (const name of Object.keys(MUSIC_PATTERNS)) {
      const notes = followNotes(key, chords, name);
      assert.ok(notes.every(n => inKey(key, n[1])), `${name} in ${key.root} ${key.mode}`);
      assert.ok(notes.every(n => n[0] + n[2] <= chords.length * MUSIC_STEPS_PER_BAR), name);
      for (let bar = 0; bar < chords.length; bar++)
        assert.ok(notes.some(n => Math.floor(n[0] / MUSIC_STEPS_PER_BAR) === bar), `${name} plays in bar ${bar + 1}`);
    }
  }
});

test('a held chord plays the triad of its bar', () => {
  const notes = followNotes(aMinor, [1, 6], 'pad-held');
  const pcs = bar => notes.filter(n => n[0] === bar * 16).map(n => n[1] % 12).sort((a, b) => a - b);
  assert.deepEqual(pcs(0), [...chordPcs(aMinor, 1)].sort((a, b) => a - b));
  assert.deepEqual(pcs(1), [...chordPcs(aMinor, 6)].sort((a, b) => a - b));
});

test('refollow writes following clips the length of the strip and leaves the rest', () => {
  const s = { tempo: 100, key: aMinor, scenes: ['a', 'b'], chords: { a: startChords(aMinor) },
    tracks: [{ id: 'bass', kind: 'synth', follow: { pattern: 'bass-pulse' }, clips: {} },
             { id: 'lead', kind: 'synth', clips: { a: { bars: 1, notes: [[0, 69, 1, 90]] } } }] };
  refollow(s);
  assert.equal(s.tracks[0].clips.a.bars, 4);
  assert.equal(s.tracks[0].clips.b, undefined);
  assert.deepEqual(s.tracks[1].clips.a.notes, [[0, 69, 1, 90]]);
  assert.deepEqual(validate(s), []);
});

test('a melody moved to a new key keeps its degrees and its register', () => {
  const tune = [69, 71, 72, 74, 76];            // A B C D E in A minor
  assert.deepEqual(tune.map(p => transposeNote(aMinor, cMajor, p)), [72, 74, 76, 77, 79]);
  assert.deepEqual(tune.map(p => transposeNote(aMinor, { root: 'E', mode: 'minor' }, p)), [64, 66, 67, 69, 71]);
});

test('validate names a bad chord strip and an unknown pattern', () => {
  const s = tiny();
  s.chords = { a: [1, 9, 3], z: [1] };
  s.tracks[1].follow = { pattern: 'kazoo' };
  const bad = validate(s).join('\n');
  assert.match(bad, /chords\/a: 3 bars/);
  assert.match(bad, /not 1 to 7/);
  assert.match(bad, /unknown scene z/);
  assert.match(bad, /unknown pattern kazoo/);
});

test('a change of mode never turns a plain chord diminished', () => {
  const aMajor = { root: 'A', mode: 'major' };
  const carried = carryChords(aMinor, aMajor, [1, 6, 3, 7]);
  assert.ok(carried.every(d => !chordName(aMajor, d).endsWith('dim')), carried.join());
  const back = carryChords(aMajor, aMinor, [1, 2, 4, 5, 6]);
  assert.ok(back.every(d => !chordName(aMinor, d).endsWith('dim')), back.join());
  assert.deepEqual(carryChords(aMinor, { root: 'E', mode: 'minor' }, [1, 6, 3, 7]), [1, 6, 3, 7]);
});

// --- a track's effects chain (DESIGN.md, "A track's effects chain") ---------

import { newFx, fxParams, knobPos, knobValue, FX_TYPES } from '../src/music/fx.js';
import { MUSIC_FX } from '../src/config/music.js';

test('every knob of every effect has a default inside its own range', () => {
  for (const type of FX_TYPES) {
    const params = Object.entries(MUSIC_FX[type].params);
    assert.ok(params.length >= 1 && params.length <= 3, type);
    for (const [k, p] of params) {
      if (p.choices) assert.ok(p.choices.includes(p.def), `${type}.${k}`);
      else assert.ok(p.def >= p.min && p.def <= p.max, `${type}.${k}`);
    }
    assert.deepEqual(fxParams({ type }), Object.fromEntries(params.map(([k, p]) => [k, p.def])));
  }
});

test('a knob turned to the ends lands on its range, and back to where it was', () => {
  for (const type of FX_TYPES) for (const [k, p] of Object.entries(MUSIC_FX[type].params)) {
    if (p.choices) { assert.equal(knobValue(p, 0), p.choices[0]); assert.equal(knobValue(p, 1), p.choices.at(-1)); continue; }
    assert.equal(knobValue(p, 0), p.min, `${type}.${k}`);
    assert.equal(knobValue(p, 1), p.max, `${type}.${k}`);
    assert.ok(Math.abs(knobValue(p, knobPos(p, p.def)) - p.def) <= Math.max(0.01, p.def * 0.01), `${type}.${k}`);
  }
});

test('validate names an unknown effect, an unknown knob and a knob out of range', () => {
  const s = tiny();
  s.tracks[1].fx = [newFx('reverb'), { type: 'flanger' }, { type: 'delay', params: { time: 0.3, wobble: 1 } },
                    { type: 'reverb', params: { mix: 2 } }];
  const bad = validate(s).join('\n');
  assert.match(bad, /effect 2 is flanger/);
  assert.match(bad, /delay time 0.3 is out of range/);
  assert.match(bad, /delay has no knob wobble/);
  assert.match(bad, /reverb mix 2 is out of range/);
});
