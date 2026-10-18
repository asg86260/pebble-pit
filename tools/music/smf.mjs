// A tiny Standard MIDI File writer, ported from Sunday Vacuum's
// tools/music/smf.ts. Format 1: a tempo track, then one track per part.
// An event is [tick, order, bytes]; `order` breaks ties at one tick, so a
// note-off (0) lands before a note-on (1) and a repeated pitch restrikes
// instead of being cut by its own release.

const vlq = n => { const b = [n & 127]; while ((n >>= 7)) b.unshift((n & 127) | 128); return b; };
const u32 = n => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255];
const u16 = n => [n >> 8, n & 255];
const chunk = (id, d) => [...Buffer.from(id, 'latin1'), ...u32(d.length), ...d];

function track(evs, fin) {
  const d = [];
  let last = 0;
  for (const [t, , b] of [...evs].sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
    d.push(...vlq(t - last), ...b);
    last = t;
  }
  return chunk('MTrk', [...d, ...vlq(Math.max(0, fin - last)), 0xFF, 0x2F, 0]);
}

export function smf(tracks, fin, bpm, ppq) {
  const us = Math.round(6e7 / bpm);
  const tempo = chunk('MTrk', [0, 0xFF, 0x51, 3, us >> 16, (us >> 8) & 255, us & 255,
    0, 0xFF, 0x58, 4, 4, 2, 24, 8, ...vlq(fin), 0xFF, 0x2F, 0]);
  return Buffer.from([...chunk('MThd', [...u16(1), ...u16(tracks.length + 1), ...u16(ppq)]),
    ...tempo, ...tracks.flatMap(e => track(e, fin))]);
}

// One note as its two events, on a channel, in ticks.
export const noteEvents = (tick, ticks, pitch, vel, ch = 0) => [
  [tick, 1, [0x90 | ch, pitch, vel]],
  [tick + ticks, 0, [0x80 | ch, pitch, 0]],
];

export { vlq };
