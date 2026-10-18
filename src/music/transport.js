// The transport: the clock, which clip each track is playing, and the
// look-ahead scheduler that hands their notes to a sound source.
//
// Launching is Ableton's: a clip (or a whole scene) asked for now starts on
// the next bar line, and the track's old clip plays up to that line. Every
// tick looks a little way ahead and schedules the notes falling in that
// window with exact times, so a slow frame on the page never drags the beat.
// Notes are read off the clip on every tick, so an edit is heard on the next
// pass of the loop without stopping anything.

import { MUSIC_SCHED_TICK_MS, MUSIC_SCHED_AHEAD_S } from '../config/music.js';
import { stepSeconds, barSeconds, clipOf, clipSteps, nextBar } from './song.js';

export function makeTransport(ctx, { song, sink, onChange }) {
  let running = false, origin = 0, horizon = 0, timer = null;
  // track id -> { scene, at } for what plays, and what waits for the bar line
  const playing = new Map(), queued = new Map();

  const now = () => ctx.currentTime;
  const changed = () => onChange && onChange();

  function start() {
    if (running) return;
    running = true;
    origin = now() + 0.06;
    horizon = origin;
    // Anything queued while stopped starts on the downbeat.
    for (const [id, q] of queued) { playing.set(id, { scene: q.scene, at: origin }); }
    queued.clear();
    timer = setInterval(tick, MUSIC_SCHED_TICK_MS);
    tick();
    changed();
  }

  function stop() {
    running = false;
    clearInterval(timer); timer = null;
    // A stopped clip stays armed, so play starts the same scene again.
    for (const [id, p] of playing) queued.set(id, { scene: p.scene, at: 0 });
    playing.clear();
    sink.panic && sink.panic();
    changed();
  }

  // Ask for a track's clip in `scene` (or null to stop the track).
  function launch(trackId, scene) {
    if (!running) {
      if (scene) queued.set(trackId, { scene, at: 0 }); else queued.delete(trackId);
      start();
      return;
    }
    queued.set(trackId, { scene, at: nextBar(song(), now() + 0.01, origin) });
    changed();
  }

  function launchScene(scene) {
    const s = song();
    for (const t of s.tracks) launch(t.id, clipOf(t, scene) ? scene : null);
  }

  // The notes of one clip between `a` and `b`, the clip launched at `at`.
  function scheduleClip(track, clip, at, a, b) {
    const s = song(), step = stepSeconds(s), loop = clipSteps(clip) * step;
    const first = Math.max(0, Math.floor((a - at) / loop));
    for (let k = first; at + k * loop < b; k++) {
      const base = at + k * loop;
      for (const [st, pitch, len, vel] of clip.notes) {
        const t = base + st * step;
        if (t >= a && t < b) sink.note(track, pitch, t, len * step, vel);
      }
    }
  }

  function tick() {
    if (!running) return;
    const s = song(), a = horizon, b = now() + MUSIC_SCHED_AHEAD_S;
    if (b <= a) return;
    for (const track of s.tracks) {
      const q = queued.get(track.id), p = playing.get(track.id);
      const cut = q && q.at < b ? Math.max(q.at, a) : b;
      if (p && !track.mute && !soloHides(s, track)) {
        const clip = clipOf(track, p.scene);
        if (clip) scheduleClip(track, clip, p.at, a, cut);
      }
      if (q && q.at < b) {
        queued.delete(track.id);
        if (q.scene) {
          playing.set(track.id, { scene: q.scene, at: q.at });
          const clip = clipOf(track, q.scene);
          if (clip && !track.mute && !soloHides(s, track)) scheduleClip(track, clip, q.at, cut, b);
        } else playing.delete(track.id);
        setTimeout(changed, Math.max(0, (q.at - now()) * 1000));
      }
    }
    horizon = b;
  }

  return {
    start, stop, launch, launchScene,
    get running() { return running; },
    playing, queued,
    // Seconds since the downbeat, for the position readout and the playhead.
    elapsed: () => running ? Math.max(0, now() - origin) : 0,
    position() {
      const s = song(), t = running ? Math.max(0, now() - origin) : 0;
      const bar = barSeconds(s), beat = bar / 4;
      return { bar: Math.floor(t / bar) + 1, beat: Math.floor((t % bar) / beat) + 1 };
    },
    // Where the clip a track is playing has got to, in steps, or -1.
    stepOf(trackId) {
      const p = playing.get(trackId);
      if (!p || !running) return -1;
      const s = song(), track = s.tracks.find(t => t.id === trackId);
      const clip = track && clipOf(track, p.scene);
      if (!clip || now() < p.at) return -1;
      const len = clipSteps(clip);
      return ((now() - p.at) / stepSeconds(s)) % len;
    },
  };
}

// Solo: once any track is soloed, the others are silent.
const soloHides = (song, track) => song.tracks.some(t => t.solo) && !track.solo;
