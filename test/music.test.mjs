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
