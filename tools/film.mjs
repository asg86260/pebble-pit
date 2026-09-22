// A film of the sky, from a clean one to a front and back again.
//
//   node tools/film.mjs                     # the default: one whole weather cycle
//   node tools/film.mjs --scene yard        # stand a different scene up first
//   node tools/film.mjs --secs 200 --every 1  # how long, and a frame every N game seconds
//   node tools/film.mjs --out shots/sky     # where the frames and the mp4 go
//
// Why: the sky is the slowest thing in the game -- a front takes four minutes
// of brewing, pouring and settling -- so a shot of it says almost nothing and
// watching it in the game costs four minutes a look. This runs the yard's own
// clock fast (`__fast`), takes a frame every game second or so, and hands back
// a few seconds of video. It is a window, like `look.mjs`; nothing here passes
// or fails.
//
// It wants a dev server (GAME=http://localhost:5185/) and ffmpeg on the path;
// with no ffmpeg it leaves the numbered pngs and says so.

import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { browser, closeOtherTabs, openTab } from './cdp.mjs';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const scene = arg('scene', 'rock');
const secs = +arg('secs', 220);          // game seconds of weather to film
const every = +arg('every', 1);          // a frame every this many game seconds
const fps = +arg('fps', 20);
const out = arg('out', 'shots/film');

const PORT = +(process.env.CDP_PORT || 9333);
const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT);
const done = async code => { await tab.close(); own?.kill(); process.exit(code); };

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// The scene, then a front due at once: the film opens on a clean sky, the
// brew comes over it, it pours, and it settles again -- the whole arc, which
// is the thing worth watching and the thing no single shot shows.
await tab.evaluate(`(() => { window.__scene(${JSON.stringify(scene)});
  window.__fast(2); window.__front(1);
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1)))); })()`);

const frames = Math.floor(secs / every);
for (let i = 0; i < frames; i++) {
  // The sim does not advance on its own under headless rAF: one turn of the
  // clock, then one painted frame, then the shot.
  await tab.evaluate(`(() => { window.__fast(${every});
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1)))); })()`);
  await tab.shot(`${out}/${String(i).padStart(4, '0')}.png`);
  if (i % 20 === 0) process.stdout.write(`${i}/${frames}\r`);
}

const mp4 = `${out}.mp4`;
const ff = spawnSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', `${out}/%04d.png`,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', mp4],
  { stdio: 'ignore' });
console.log(ff.status === 0 && existsSync(mp4)
  ? `${frames} frames, ${Math.round(secs)}s of weather: ${mp4}`
  : `${frames} frames in ${out}/ (no ffmpeg, or it failed)`);
await done(0);
