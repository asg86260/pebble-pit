// The offline render: a song's scene to one seamless OGG loop.
//
//   node tools/music/render.mjs <song.json> [--scene <name> | --all] [--out <dir>] [--no-cache]
//
// stdout is JSON lines only, one an event, because the bench's dev server
// streams them to the page; anything for a person goes to stderr. Each synth
// stem is Surge XT in a Python process of its own (a second Surge in one
// process hangs), the drums are numpy, and every stem is cached against what
// makes its samples, so a re-render after a level change is a mix, not a
// minute of Surge loading.

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { validate, sceneBars, beatSeconds } from '../../src/music/song.js';
import { MUSIC_LUFS, MUSIC_TRUE_PEAK, MUSIC_RENDER_SR, MUSIC_RENDER_PRIME_S,
         MUSIC_RENDER_JOBS, MUSIC_RENDER_OGG_Q } from '../../src/config/music.js';
import { loopWindow, sceneSeconds, sceneTracks, passEvents, timedEvents,
         midiFile, stemKey } from './plan.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const CACHE = join(HERE, '.cache');
// The machine's Python 3.14 with pedalboard, numpy and mido (the music-render skill).
const PYTHON = process.env.PYTHON || 'C:\\Python314\\python.exe';
const FACTORY = 'C:\\Users\\asg86\\AppData\\Local\\Programs\\surge-xt\\Surge Synth Team\\SurgeXTData\\patches_factory';
// loudnorm's range target; a bed has little dynamic range to keep.
const LOUDNORM_LRA = 11;
const KICK = 36;

const emit = o => process.stdout.write(JSON.stringify(o) + '\n');
const log = (...a) => console.error(...a);

function args(argv) {
  const o = { song: null, scene: null, all: false, out: join(ROOT, 'public/music'), cache: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--scene') o.scene = argv[++i];
    else if (a === '--all') o.all = true;
    else if (a === '--out') o.out = resolve(argv[++i]);
    else if (a === '--no-cache') o.cache = false;
    else if (!o.song) o.song = resolve(a);
    else throw new Error(`unknown argument ${a}`);
  }
  if (!o.song) throw new Error('usage: render.mjs <song.json> [--scene <name> | --all] [--out <dir>] [--no-cache]');
  return o;
}

function run(cmd, argv, { quiet = false } = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; if (!quiet) process.stderr.write(d); });
    p.on('error', fail);
    p.on('close', code => code === 0 ? ok({ out, err })
      : fail(new Error(`${basename(cmd)} ${argv[0] ? basename(argv[0]) : ''} exited ${code}: ${err.trim().split('\n').slice(-3).join(' | ')}`)));
  });
}

// At most `n` jobs at once: other agents share this machine, and each Surge
// load pins a core for most of a minute.
async function pool(jobs, n) {
  const res = new Array(jobs.length);
  let next = 0;
  const lane = async () => { while (next < jobs.length) { const i = next++; res[i] = await jobs[i](); } };
  await Promise.all(Array.from({ length: Math.min(n, jobs.length) }, lane));
  return res;
}

const scriptHash = file => createHash('sha1').update(readFileSync(join(HERE, file))).digest('hex').slice(0, 8);

async function stem(song, scene, track, seconds, opts) {
  const script = track.kind === 'synth' ? 'surge_stem.py' : 'drum_stem.py';
  const deps = track.kind === 'synth' ? scriptHash(script) + scriptHash('surgefxp.py') : scriptHash(script);
  const key = `${track.id}-${stemKey(track, song, scene, MUSIC_RENDER_SR, deps)}`;
  const npy = join(CACHE, `${key}.npy`);
  const t0 = Date.now();
  if (opts.cache && existsSync(npy)) {
    emit({ event: 'stem', scene, track: track.id, state: 'cached', ms: Date.now() - t0 });
    return npy;
  }
  emit({ event: 'stem', scene, track: track.id, state: 'rendering', ms: 0 });
  const evs = passEvents(song, scene, track.id);
  const tmp = join(CACHE, `${key}.tmp.npy`);
  if (track.kind === 'synth') {
    if (!existsSync(join(FACTORY, `${track.patch}.fxp`))) throw new Error(`${track.id}: no factory patch ${track.patch}`);
    const mid = join(CACHE, `${key}.mid`);
    writeFileSync(mid, midiFile(song, evs, seconds));
    await run(PYTHON, [join(HERE, script), mid, track.patch, String(seconds), String(MUSIC_RENDER_SR), String(MUSIC_RENDER_PRIME_S), tmp]);
    rmSync(mid, { force: true });
  } else {
    const js = join(CACHE, `${key}.json`);
    writeFileSync(js, JSON.stringify(timedEvents(song, evs)));
    await run(PYTHON, [join(HERE, script), js, String(seconds), String(MUSIC_RENDER_SR), tmp]);
    rmSync(js, { force: true });
  }
  renameSync(tmp, npy);
  emit({ event: 'stem', scene, track: track.id, state: 'done', ms: Date.now() - t0 });
  return npy;
}

// ebur128's summary of a finished file: integrated loudness and true peak.
async function measure(file) {
  const { err } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { quiet: true });
  const sum = err.slice(err.lastIndexOf('Summary:'));
  const lufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(sum)?.[1]);
  const truePeak = Number(/Peak:\s+(-?[\d.inf]+) dBFS/.exec(sum)?.[1]);
  const probe = await run('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=duration', '-of', 'csv=p=0', file], { quiet: true });
  return { seconds: Number(probe.out.trim()), lufs, truePeak };
}

// Two-pass loudnorm, linear, so the whole loop moves by one gain and the
// seam stays where the mix put it.
async function loudness(wav, ogg) {
  const ln = `loudnorm=I=${MUSIC_LUFS}:TP=${MUSIC_TRUE_PEAK}:LRA=${LOUDNORM_LRA}`;
  const { err } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', wav, '-af', `${ln}:print_format=json`, '-f', 'null', '-'], { quiet: true });
  const m = JSON.parse(err.slice(err.lastIndexOf('{'), err.lastIndexOf('}') + 1));
  const af = `${ln}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}`
    + `:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json`;
  const two = await run('ffmpeg', ['-hide_banner', '-nostats', '-loglevel', 'info', '-y', '-i', wav, '-af', af,
    '-ar', String(MUSIC_RENDER_SR), '-c:a', 'libvorbis', '-q:a', String(MUSIC_RENDER_OGG_Q), ogg], { quiet: true });
  const n = JSON.parse(two.err.slice(two.err.lastIndexOf('{'), two.err.lastIndexOf('}') + 1));
  // loudnorm falls back to dynamic gain when one gain cannot meet both
  // targets, which would pump across the loop; say so rather than hide it.
  log(`loudnorm: input ${m.input_i} LUFS / ${m.input_tp} dBTP, ${n.normalization_type}`);
  if (n.normalization_type !== 'linear') log('loudnorm went dynamic: the mix is too peaky for one gain');
}

async function renderScene(song, scene, opts) {
  const bars = sceneBars(song, scene);
  const L = sceneSeconds(song, scene);
  const win = loopWindow(L, MUSIC_RENDER_SR);
  const seconds = win.total / MUSIC_RENDER_SR;
  const tracks = sceneTracks(song, scene);
  emit({ event: 'start', scene, tracks: tracks.map(t => t.id) });
  log(`${song.name}/${scene}: ${bars} bars at ${song.tempo} bpm = ${L.toFixed(3)} s, rendering ${seconds.toFixed(3)} s`);

  const stems = await pool(tracks.map(t => () => stem(song, scene, t, seconds, opts)), MUSIC_RENDER_JOBS);

  emit({ event: 'mix', scene });
  const kicks = song.tracks.filter(t => t.kind === 'drums' && !t.mute && t.clips?.[scene])
    .flatMap(t => timedEvents(song, passEvents(song, scene, t.id)).filter(e => e[1] === KICK).map(e => e[0]));
  const name = `${song.name}-${scene}`;
  const wav = join(CACHE, `${name}.wav`), plan = join(CACHE, `${name}.plan.json`);
  writeFileSync(plan, JSON.stringify({
    sr: MUSIC_RENDER_SR, total: win.total, start: win.start, frames: win.frames, beat: beatSeconds(song), out: wav, kicks,
    tracks: tracks.map((t, i) => ({ id: t.id, kind: t.kind, level: t.level ?? 1, pan: t.pan ?? 0, stem: stems[i] })),
  }));
  await run(PYTHON, [join(HERE, 'mix.py'), plan]);

  mkdirSync(opts.out, { recursive: true });
  const file = `${name}.ogg`, ogg = join(opts.out, file);
  await loudness(wav, ogg);
  rmSync(wav, { force: true }); rmSync(plan, { force: true });
  const m = await measure(ogg);
  writeFileSync(join(opts.out, `${name}.json`), JSON.stringify({
    seconds: m.seconds, lufs: m.lufs, truePeak: m.truePeak, bars, tempo: song.tempo, rendered: new Date().toISOString(),
  }, null, 1) + '\n');
  emit({ event: 'done', scene, file, seconds: m.seconds, lufs: m.lufs, truePeak: m.truePeak });
}

async function main() {
  const opts = args(process.argv.slice(2));
  const song = JSON.parse(readFileSync(opts.song, 'utf8'));
  const bad = validate(song);
  if (bad.length) throw new Error(`song does not read: ${bad.join('; ')}`);
  if (!song.name) song.name = basename(opts.song, '.json');
  const scenes = opts.all ? song.scenes.filter(s => sceneBars(song, s) > 0) : [opts.scene || song.game || song.scenes[0]];
  for (const s of scenes) {
    if (!song.scenes.includes(s)) throw new Error(`no scene ${s}`);
    if (!sceneBars(song, s)) throw new Error(`scene ${s} has no clips`);
    if (!sceneTracks(song, s).length) throw new Error(`scene ${s} has no unmuted tracks`);
  }
  mkdirSync(CACHE, { recursive: true });
  for (const s of scenes) await renderScene(song, s, opts);
}

main().catch(e => {
  emit({ event: 'error', message: e.message });
  log(e.stack);
  process.exit(1);
});
