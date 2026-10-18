// The render's pure half (tools/music/): the MIDI writer's bytes and the
// loop window. No Surge and no Python, so it runs in the node tier.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { smf, noteEvents, vlq } from '../tools/music/smf.mjs';
import { loopWindow, sceneSeconds, passEvents, midiFile, stemKey } from '../tools/music/plan.mjs';
import { MUSIC_RENDER_PPQ, MUSIC_RENDER_SR, MUSIC_RENDER_TAIL_S } from '../src/config/music.js';

const song = JSON.parse(readFileSync(new URL('../src/music/songs/yard.json', import.meta.url), 'utf8'));

test('the SMF header is format 1 with a tempo track ahead of the parts', () => {
  const b = smf([[]], 0, 120, 480);
  assert.equal(b.subarray(0, 4).toString('latin1'), 'MThd');
  assert.deepEqual([...b.subarray(4, 14)], [0, 0, 0, 6, 0, 1, 0, 2, 480 >> 8, 480 & 255]);
  assert.equal(b.subarray(14, 18).toString('latin1'), 'MTrk');
  // 120 bpm is 500000 us a beat.
  assert.deepEqual([...b.subarray(22, 29)], [0, 0xFF, 0x51, 3, 0x07, 0xA1, 0x20]);
});

test('a note is a note-on and a note-off a delta apart, and ends its track', () => {
  const b = smf([noteEvents(0, 120, 60, 100)], 120, 120, 480);
  const tempoLen = b.readUInt32BE(18), at = 22 + tempoLen;
  assert.equal(b.subarray(at, at + 4).toString('latin1'), 'MTrk');
  assert.deepEqual([...b.subarray(at + 8)], [0, 0x90, 60, 100, 120, 0x80, 60, 0, 0, 0xFF, 0x2F, 0]);
});

test('a release at a restrike lands before the new note-on', () => {
  const evs = [...noteEvents(0, 120, 60, 100), ...noteEvents(120, 120, 60, 90)];
  const b = smf([evs], 240, 120, 480), body = [...b.subarray(b.length - 20)];
  assert.deepEqual(body.slice(0, 16), [0, 0x90, 60, 100, 0x78, 0x80, 60, 0, 0, 0x90, 60, 90, 0x78, 0x80, 60, 0]);
});

test('delta times are variable-length quantities', () => {
  assert.deepEqual(vlq(0), [0]);
  assert.deepEqual(vlq(127), [127]);
  assert.deepEqual(vlq(128), [0x81, 0]);
  assert.deepEqual(vlq(0x3FFF), [0xFF, 0x7F]);
});

test('the yard loop is four bars at 92 bpm and its window is the second pass', () => {
  const L = sceneSeconds(song, 'yard');
  assert.ok(Math.abs(L - 4 * 4 * 60 / 92) < 1e-9);
  const w = loopWindow(L, MUSIC_RENDER_SR);
  assert.equal(w.start, Math.round(L * MUSIC_RENDER_SR));
  assert.equal(w.end, Math.round(2 * L * MUSIC_RENDER_SR));
  assert.equal(w.frames, w.end - w.start);
  assert.ok(Math.abs(w.frames / MUSIC_RENDER_SR - L) < 1 / MUSIC_RENDER_SR);
  assert.equal(w.total, Math.round((2 * L + MUSIC_RENDER_TAIL_S) * MUSIC_RENDER_SR));
  assert.ok(w.total > w.end, 'the render runs past the window, so the window is never cut short');
});

test('both passes carry every note, the second a loop later', () => {
  const evs = passEvents(song, 'yard', 'lead'), half = evs.length / 2;
  assert.equal(evs.length, 32);
  for (let i = 0; i < half; i++) assert.equal(evs[i + half].step - evs[i].step, 64);
  // The drums' two-bar clip repeats to fill the four-bar loop, twice over.
  assert.equal(passEvents(song, 'yard', 'drums').filter(e => e.pitch === 36).length, 6 * 2 * 2);
});

test('the MIDI file of a stem ends at the render length', () => {
  const evs = passEvents(song, 'yard', 'bass'), L = sceneSeconds(song, 'yard');
  const b = midiFile(song, evs, 2 * L + MUSIC_RENDER_TAIL_S);
  assert.equal(b.subarray(0, 4).toString('latin1'), 'MThd');
  assert.equal(b.readUInt16BE(12), MUSIC_RENDER_PPQ);
});

test('a stem key moves with its notes and nothing else', () => {
  const bass = song.tracks.find(t => t.id === 'bass');
  const a = stemKey(bass, song, 'yard', MUSIC_RENDER_SR, 'x');
  const other = structuredClone(song);
  other.tracks.find(t => t.id === 'lead').clips.yard.notes[0][1] += 1;
  other.tracks.find(t => t.id === 'bass').level = 0.1;
  assert.equal(stemKey(other.tracks.find(t => t.id === 'bass'), other, 'yard', MUSIC_RENDER_SR, 'x'), a);
  other.tracks.find(t => t.id === 'bass').clips.yard.notes[0][3] -= 1;
  assert.notEqual(stemKey(other.tracks.find(t => t.id === 'bass'), other, 'yard', MUSIC_RENDER_SR, 'x'), a);
  assert.notEqual(stemKey(bass, song, 'yard', MUSIC_RENDER_SR, 'y'), a);
});
