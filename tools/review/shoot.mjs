// Before and after, shot for shot: the same captures taken of two commits.
//
//   node tools/review/shoot.mjs --base <ref> --head <ref> --items <items.json> --out <dir>
//   node tools/review/shoot.mjs --items <items.json> --out <dir>   # the refs the items file pins
//   node tools/review/shoot.mjs ... --only spark,lightning     # just those items
//
// A ref is anything git can name: a sha, a branch, `origin/visual/deep-b4`,
// `main~3`. A remote branch is read as the last fetch left it; nothing here
// fetches.
//
// Each ref is checked out into a worktree of its own under the system temp
// dir, served by its own vite on a free port, and every capture an item names
// is taken of both, into `<out>/<item>/<n>-before.png|gif` and `-after`.
// `<out>/manifest.json` says what was taken and what could not be (a scene the
// base does not have, a file it did not have yet). `page.mjs` builds the
// review page from the items and that folder. Both servers, the browser and
// both worktrees are torn down at the end, whether the run worked or not.
//
// A capture (README.md has the whole of it):
//   { scene, url, window: [w, h], zoom, crop: [x, y, w, h], setup, theme,
//     wait, gif: { seconds, fps }, keepToasts, label }
//   { file: 'steam/store/x.png', zoom }          the file itself, at each ref
//   { files: [...], cols, zoom }                 several files tiled into one
//
// Why worktrees and not one server flipped between commits: the two sides
// stand side by side for the whole run, so a capture is the same moment
// taken twice, a few hundred milliseconds apart, rather than an hour apart
// with a checkout and a rebuild between.

import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, rmdirSync, unlinkSync, lstatSync, symlinkSync, mkdtempSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { browser, openTab, standScene, profileDir } from '../cdp.mjs';
import { decodePng, encodePng, encodeGif, tile } from './pixels.mjs';

const args = process.argv.slice(2);
const arg = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const itemsPath = arg('--items'), out = arg('--out');
const only = arg('--only')?.split(',').map(s => s.trim()).filter(Boolean);
// The refs on the command line, or else the ones the items file pins: a
// review written against two commits reshoots against the same two, however
// far its branches have moved since.
const doc = itemsPath && existsSync(itemsPath) ? JSON.parse(readFileSync(itemsPath, 'utf8')) : {};
const baseRef = arg('--base') || doc.base, headRef = arg('--head') || doc.head;
if (!baseRef || !headRef || !itemsPath || !out) {
  console.log('usage: node tools/review/shoot.mjs [--base <ref> --head <ref>] --items <items.json> --out <dir> [--only a,b]');
  process.exit(2);
}

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const gitBuf = (...a) => execFileSync('git', a, { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
const items = (doc.items || doc).filter(it => !only || only.includes(it.id));
const sides = { before: git('rev-parse', '--verify', `${baseRef}^{commit}`), after: git('rev-parse', '--verify', `${headRef}^{commit}`) };

// The worktrees have no node_modules; the main checkout's is joined in. A
// worktree's own `node_modules` would be a second install of everything.
const mainCheckout = dirname(resolve(git('rev-parse', '--git-common-dir')));
const modules = join(mainCheckout, 'node_modules');
if (!existsSync(join(modules, 'vite/bin/vite.js'))) { console.log(`no vite under ${modules}`); process.exit(2); }

const freePort = () => new Promise((ok, no) => {
  const s = createServer(); s.unref(); s.on('error', no);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => ok(port)); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
// A process and everything it started: vite leaves esbuild behind, the shell
// its renderers, and on Windows killing the parent kills neither.
const killTree = p => {
  if (!p || p.exitCode !== null) return;
  if (process.platform === 'win32') { try { execFileSync('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {} }
  else p.kill('SIGKILL');
};

const made = { trees: [], servers: [], shell: null, profile: null };

async function standUp(side) {
  const dir = mkdtempSync(join(tmpdir(), `review-${side}-`));
  rmSync(dir, { recursive: true, force: true });   // `worktree add` wants to make it
  git('worktree', 'add', '--detach', dir, sides[side]);
  made.trees.push(dir);
  symlinkSync(modules, join(dir, 'node_modules'), 'junction');
  const port = await freePort();
  const vite = spawn(process.execPath, [join(modules, 'vite/bin/vite.js'), '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
                     { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
  made.servers.push(vite);
  let said = '';
  vite.stdout.on('data', d => { said += d; }); vite.stderr.on('data', d => { said += d; });
  const origin = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(origin + 'play.html')).ok) break; } catch {}
    if (vite.exitCode !== null) throw new Error(`vite for ${side} died:\n${said}`);
    await sleep(250);
  }
  // Serving this checkout and not some other on the port: the page names its tree.
  const page = await (await fetch(origin + 'play.html')).text();
  if (!page) throw new Error(`vite for ${side} answers with nothing`);
  console.log(`${side}: ${sides[side].slice(0, 8)} at ${origin} from ${dir}`);
  return { dir, origin };
}

// The junction first, by itself, and the main checkout's modules seen still
// there before anything recursive touches the tree: a recursive delete that
// followed the junction would empty the main checkout's node_modules.
async function tearDownTree(dir) {
  const link = join(dir, 'node_modules');
  try { if (lstatSync(link).isSymbolicLink()) { try { rmdirSync(link); } catch { unlinkSync(link); } } } catch {}
  if (existsSync(link)) { console.log(`left ${dir}: its node_modules link would not come off`); return; }
  if (!existsSync(join(modules, 'vite'))) throw new Error('the main checkout lost its node_modules');
  for (let i = 0; i < 5; i++) {
    try { git('worktree', 'remove', '--force', dir); break; }
    catch { await sleep(500); }
  }
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  try { git('worktree', 'prune'); } catch {}
}

async function tearDown() {
  for (const s of made.servers) killTree(s);
  killTree(made.shell);
  await sleep(500);
  for (const d of made.trees) { try { await tearDownTree(d); } catch (e) { console.log(`teardown ${d}: ${e.message}`); } }
  if (made.profile) try { rmSync(made.profile, { recursive: true, force: true }); } catch {}
}
let stopping = false;
const stop = async code => { if (stopping) return; stopping = true; await tearDown(); process.exit(code); };
process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));

// --- one capture of one side --------------------------------------------------

const KEYS = {
  Tab: { key: 'Tab', code: 'Tab', keyCode: 9 }, Escape: { key: 'Escape', code: 'Escape', keyCode: 27 },
  Enter: { key: 'Enter', code: 'Enter', keyCode: 13 }, Space: { key: ' ', code: 'Space', keyCode: 32 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 }, ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 }, ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 }
};
const paint = 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1))))';

async function shootPage(cdpPort, origin, c, file) {
  const [w, h] = c.window || [800, 600];
  const page = c.url || 'play.html';
  const url = origin + page + (c.theme === 'dark' ? (page.includes('?') ? '&dark' : '?dark') : '');
  const tab = await openTab(cdpPort, 'about:blank', { ready: null });
  try {
    await tab.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await tab.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: c.theme === 'dark' ? 'dark' : 'light' }] });
    await tab.send('Page.navigate', { url });
    // The game is up when its dev handles are (console.js and scenesheet.js
    // load after the yard has booted, each in its own time); any other page
    // when it has loaded and lifted its veil (the landing page holds one
    // until its picture is there).
    const ready = c.ready || (page.startsWith('play.html')
      ? "['__scene', '__fast', '__still', '__test'].every(k => typeof window[k] === 'function')"
      : "document.readyState === 'complete' && !document.querySelector('.veil.up')");
    let up = false;
    for (let i = 0; i < 150 && !up; i++) { up = (await tab.evaluate(ready)).result?.result?.value === true; if (!up) await sleep(100); }
    if (!up) return { note: `${page} never came up` };
    await tab.evaluate('document.fonts.ready.then(() => 1)');
    const ev = async js => {
      const r = await tab.evaluate(js);
      if (r.result?.exceptionDetails) throw new Error((r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text || '').split('\n')[0]);
      return r.result?.result?.value;
    };
    if (c.scene) {
      const known = await ev(`(window.__scenes?.() || []).some(([, n]) => n.includes(${JSON.stringify(c.scene)}))`);
      if (!known) return { note: `no scene "${c.scene}" here` };
      if (!await standScene(tab, c.scene, c.wait ?? 1)) return { note: `scene "${c.scene}" would not stand: ${tab.logs.filter(l => l.startsWith('EXCEPTION')).pop() || ''}` };
    }
    // Keys go in through the browser's own input, as a player's would: a
    // Tab typed this way moves focus and lights :focus-visible, which a
    // script's `focus()` or a dispatched KeyboardEvent does not.
    for (const key of c.keys || []) {
      const code = KEYS[key] || { key, code: key, keyCode: 0 };
      await tab.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...code, windowsVirtualKeyCode: code.keyCode });
      await tab.send('Input.dispatchKeyEvent', { type: 'keyUp', ...code, windowsVirtualKeyCode: code.keyCode });
      await ev(paint);
    }
    if (c.setup) await ev(`(async () => (${c.setup}))()`);
    await ev(paint);
    // `zoom` scales whatever is captured: the crop, or with no crop the
    // middle of the window blown up (as `look.mjs --zoom` does), or under 1
    // the whole window shrunk, which is how a long GIF stays small.
    const z = c.zoom || 1;
    const clip = c.crop ? { x: c.crop[0], y: c.crop[1], width: c.crop[2], height: c.crop[3], scale: z }
               : z > 1 ? { x: w / 2 - w / z / 2, y: h / 2 - h / z / 2, width: w / z, height: h / z, scale: z }
               : { x: 0, y: 0, width: w, height: h, scale: z };
    // The notices a scene's setup fires (story beats marked done, old
    // toasts) are noise that never shows in play; hidden unless the capture
    // is about them.
    if (!c.keepToasts) await ev(`(() => { const s = document.createElement('style'); s.textContent = '.toast{display:none!important}'; document.head.append(s); return 1; })()`);
    if (!c.gif) { await tab.shot(file + '.png', { clip }); return { ext: 'png' }; }

    // Frame by frame: the page's own loop held off the yard (`__still`), the
    // scene's own hold let go, and each frame exactly 1/fps of game time. A
    // page with no yard (the landing, the bench) is filmed on the wall clock.
    const fps = c.gif.fps || 10, n = Math.round((c.gif.seconds || 3) * fps);
    const yard = await ev("typeof window.__fast === 'function' && typeof window.__still === 'function'");
    if (yard) await ev(`(() => { window.__still(true); window.__holdShot?.(0); return 1; })()`);
    const frames = [];
    for (let k = 0; k < n; k++) {
      await ev(paint);
      frames.push(decodePng(await tab.shot(null, { clip })));
      if (yard && !c.gif.wall) await ev(`(() => { window.__fast(${1 / fps}); return 1; })()`);
      else await sleep(1000 / fps);
    }
    writeFileSync(file + '.gif', encodeGif(frames, { delayMs: 1000 / fps }));
    return { ext: 'gif' };
  } finally {
    await tab.close();
  }
}

// A file as it was at a ref, or several tiled into one picture.
function shootFiles(ref, c, file) {
  const paths = c.file ? [c.file] : c.files;
  const imgs = [], gone = [];
  for (const p of paths) {
    try { imgs.push(decodePng(gitBuf('show', `${ref}:${p}`))); } catch { gone.push(p); }
  }
  if (!imgs.length) return { note: `not at ${ref.slice(0, 8)}: ${gone.join(', ')}` };
  let pic = paths.length === 1 ? imgs[0] : tile(imgs, { cols: c.cols || imgs.length, gap: c.gap ?? 8 });
  if (c.crop) pic = crop(pic, c.crop);
  if (c.zoom > 1) pic = upscale(pic, c.zoom | 0);
  writeFileSync(file + '.png', encodePng(pic));
  return { ext: 'png', ...(gone.length ? { note: `not at ${ref.slice(0, 8)}: ${gone.join(', ')}` } : {}) };
}
function crop(im, [x, y, w, h]) {
  w = Math.min(w, im.width - x); h = Math.min(h, im.height - y);
  const data = new Uint8Array(w * h * 4);
  for (let r = 0; r < h; r++) data.set(im.data.subarray(((y + r) * im.width + x) * 4, ((y + r) * im.width + x + w) * 4), r * w * 4);
  return { width: w, height: h, data };
}
function upscale(im, k) {
  const width = im.width * k, height = im.height * k, data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++)
    data.set(im.data.subarray(((y / k | 0) * im.width + (x / k | 0)) * 4, ((y / k | 0) * im.width + (x / k | 0)) * 4 + 4), (y * width + x) * 4);
  return { width, height, data };
}

// --- the run --------------------------------------------------------------------

const manifest = { base: sides.before, head: sides.after, at: new Date().toISOString(), items: {} };
const manifestPath = join(out, 'manifest.json');
// A partial run (`--only`) adds to the manifest rather than replacing it.
if (only && existsSync(manifestPath)) Object.assign(manifest.items, JSON.parse(readFileSync(manifestPath, 'utf8')).items);
let failed = 0;
try {
  const needsPage = items.some(it => it.shots.some(c => !c.file && !c.files));
  const servers = needsPage ? Object.fromEntries(await Promise.all(['before', 'after'].map(async s => [s, await standUp(s)]))) : {};
  let cdpPort = 0;
  if (needsPage) {
    cdpPort = await freePort();
    made.profile = profileDir(`headless-${cdpPort}`);
    rmSync(made.profile, { recursive: true, force: true });
    process.env.WINDOW ||= '1920,1200';
    made.shell = (await browser({ port: cdpPort })).own;
    for (const t of await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json())
      await fetch(`http://127.0.0.1:${cdpPort}/json/close/${t.id}`);
  }
  for (const it of items) {
    const dir = join(out, it.id);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const got = [];
    for (const [n, c] of it.shots.entries()) {
      const take = async side => {
        const file = join(dir, `${n + 1}-${side}`);
        try {
          return c.file || c.files ? shootFiles(sides[side], c, file) : await shootPage(cdpPort, servers[side].origin, c, file);
        } catch (e) { failed++; return { note: `error: ${e.message}` }; }
      };
      // The two sides at once: they are two origins, so two saves, and the
      // tabs cannot write over each other.
      const [before, after] = await Promise.all([take('before'), take('after')]);
      got.push({ n: n + 1, before, after });
      const say = s => s.ext ? s.ext + (s.note ? ` (${s.note})` : '') : s.note;
      console.log(`${it.id} #${n + 1}: before ${say(before)} | after ${say(after)}`);
    }
    manifest.items[it.id] = got;
  }
} catch (e) {
  console.log(`stopped: ${e.stack || e.message}`);
  failed++;
} finally {
  mkdirSync(out, { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
  await tearDown();
}
console.log(failed ? `${failed} capture(s) failed; see the manifest` : `done: ${manifestPath}`);
process.exit(failed ? 1 : 0);
