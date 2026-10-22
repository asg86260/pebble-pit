// One tab on the game, driven over Chrome's debugging protocol.
//
// This is the part of `headless.mjs` that is not about the suite: find the
// headless shell playwright keeps, start it or join one already on the port,
// open the page, wait for the game, evaluate, photograph, shut the tab. It is
// its own file so that `look.mjs` can hold one tab open and run scene after
// scene in it -- the page loads once, in about a second, and every scene after
// that costs what the scene costs. Before this it launched the whole shell per
// shot, and a scene that takes a third of a second to stand up took three
// seconds to photograph.
//
// Nothing here is installed: node's own WebSocket and fetch, and the shell
// playwright already keeps (`shellExe`).

import { spawn } from 'node:child_process';
import { writeFileSync, readdirSync, existsSync } from 'node:fs';
import { homedir, platform, tmpdir } from 'node:os';

// The game is `play.html` (index.html is the landing page); a GAME that names
// only the server gets it appended, and one naming a page is taken as is.
export function gameUrl() {
  const base = process.env.GAME || 'http://localhost:5184/';
  return base.endsWith('/') ? base + 'play.html' : base;
}

// The headless shell playwright keeps, on whichever machine this is: under
// PLAYWRIGHT_BROWSERS_PATH where that is set (a cloud container, CI), else
// playwright's own cache for the platform. Its folder and file are named
// per platform and per playwright version, so the one there is looked for
// rather than spelled.
const SHELL_NAMES = ['chrome-headless-shell.exe', 'chrome-headless-shell', 'headless_shell'];
export function shellExe() {
  const os = platform();
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH
    || (os === 'win32' ? `${process.env.LOCALAPPDATA}/ms-playwright`
      : os === 'darwin' ? `${homedir()}/Library/Caches/ms-playwright` : `${homedir()}/.cache/ms-playwright`);
  const dir = existsSync(root) && readdirSync(root).find(d => d.startsWith('chromium_headless_shell-'));
  if (dir) for (const sub of readdirSync(`${root}/${dir}`)) for (const n of SHELL_NAMES)
    if (existsSync(`${root}/${dir}/${sub}/${n}`)) return `${root}/${dir}/${sub}/${n}`;
  throw new Error(`no playwright headless shell under ${root} (npx playwright install chromium-headless-shell)`);
}
// A shell's own profile folder, by name: in the machine's temp folder.
export const profileDir = name => `${tmpdir()}/boulder-${name}`;
// The flags every shell starts with: no first-run sheet, and, run as root (a
// container), no sandbox, which Chrome refuses to start without otherwise.
export const shellFlags = port => [`--remote-debugging-port=${port}`, '--no-first-run',
  ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])];

const alive = async port => {
  try { await fetch(`http://127.0.0.1:${port}/json/version`); return true; }
  catch { return false; }
};

// A browser on `port`: the one already there, or a new one. `own` is the
// process this call started, so the caller can kill what it made and leave
// alone what it found.
//
// Its profile is its own, named by the port. One profile for every port was
// the slow scene: two agents' runs on different ports each started a shell on
// the same directory, the second found the storage locked by the first and
// booted with no IndexedDB and its quota database "reset" -- five seconds of
// that on every page load, and the save falling back to localStorage. A
// profile holds nothing worth keeping between runs; a shell reads it in
// under a second when it is fresh.
export async function browser({ port }) {
  const profile = profileDir(`headless-${port}`);
  let own = null;
  if (!await alive(port)) {
    // `WINDOW=1600,1000` for a shot you want to see the sky in: this game wants
    // eight hundred and thirty of height before the sky, the ground and the
    // whole depth of the pit all fit, and the shell's default is 800 by 600.
    //
    // It is not the default, and that is a measurement rather than a
    // preference: a window that size is two and a half times the pixels, which
    // takes the frame rate from sixty to twenty-six on this machine -- and the
    // suite has checks in it that count on frames arriving at the usual rate.
    const win = process.env.WINDOW ? [`--window-size=${process.env.WINDOW}`] : [];
    // Muted: a headless shell still plays the game's sound out of the speakers
    // of whoever is sitting at this machine.
    own = spawn(shellExe(), [...shellFlags(port), '--mute-audio', ...win, `--user-data-dir=${profile}`], { stdio: 'ignore' });
    for (let i = 0; i < 40 && !await alive(port); i++) await new Promise(r => setTimeout(r, 250));
  }
  return { port, own };
}

// Every other tab, closed, on purpose: tabs on one origin share the save, and
// a second live one writes over it every second, which fails the save checks
// for reasons that have nothing to do with the code.
export async function closeOtherTabs(port) {
  for (const t of await (await fetch(`http://127.0.0.1:${port}/json/list`)).json())
    await fetch(`http://127.0.0.1:${port}/json/close/${t.id}`);
}

// A tab on the game, ready to be asked things. `logs` is everything the page
// says for itself, as it says it: a module that would not load says so there
// and nowhere else, and a silent page is the confusing kind of broken.
//
// `ready` is the expression waited on before the tab is handed back: the
// game's suite by default; a page with no game in it (the landing page, the
// card bench, about:blank) passes its own, or null to wait on nothing.
export async function openTab(port, url = gameUrl(), { ready = "typeof window.__test === 'function'" } = {}) {
  const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,
                                 { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  const waiting = new Map();
  let n = 0;
  const logs = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    if (m.method === 'Runtime.consoleAPICalled') {
      const line = m.params.args.map(a => a.value ?? a.description ?? '').join(' ');
      logs.push(line);
      // Printed as it arrives when asked for, so a run that never finishes
      // still says how far it got. A suite that hangs is otherwise a silent one.
      if (process.env.LIVE) console.log(line);
    }
    if (m.method === 'Runtime.exceptionThrown')
      logs.push('EXCEPTION ' + (m.params.exceptionDetails.exception?.description ||
                                m.params.exceptionDetails.text || ''));
  });
  const send = (method, params = {}) =>
    new Promise(res => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });

  await new Promise(r => ws.addEventListener('open', r));
  await send('Runtime.enable');
  await send('Page.enable');
  // wait for the game to be there rather than guessing at how long it takes
  for (let i = 0; ready && i < 100; i++) {
    const probe = await send('Runtime.evaluate', { expression: ready, returnByValue: true });
    if (probe.result?.result?.value === true) break;
    await new Promise(r => setTimeout(r, 100));
  }

  // The whole reply, promise awaited, value by copy.
  const evaluate = expr => send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });

  // A png of the tab, once the page has stopped moving.
  //
  // A board scales in over a few hundred milliseconds of the wall clock, and
  // a shot taken the instant a scene has run caught it mid-fade: a ghost
  // sheet over the yard (critics 2026-09-10, D2). The page is asked, frame by
  // frame, whether any of its transitions is still running, and the shot
  // waits for the last to finish -- `SETTLE` milliseconds at the most, which
  // used to be the whole wait, every time, whether anything moved or not.
  // The sim is not advanced by this; it only moves under `__fast`.
  //
  // `ZOOM=4` crops to the middle of the viewport and blows it up four times.
  // A yard shot at 800x600 is a fine picture of the yard and useless for
  // looking at a hat, which is two cells of a three-cell body: about twelve
  // pixels, and no amount of squinting at a full-width shot settles whether
  // it is sitting straight. The capture can scale a clip for us, so it does.
  //
  // `CLIP=x,y,w,h` names the window rectangle to blow up instead of the
  // middle: the pit is at the bottom of the window and a look at anything in
  // it is a look at the sky when cropped to the center.
  //
  // `opts.clip` is a capture rectangle ({ x, y, width, height, scale }) that
  // overrides both, for a caller that frames each shot itself; `file` may be
  // null, and the png comes back either way.
  async function shot(file, opts = {}) {
    const z = Number(process.env.ZOOM || 0);
    const at = process.env.CLIP ? process.env.CLIP.split(',').map(Number) : null;
    const clip = opts.clip ? opts.clip : at && at.length === 4 ? { x: at[0], y: at[1], width: at[2], height: at[3], scale: z > 1 ? z : 1 }
               : z > 1 ? (() => {
      const [w, h] = (process.env.WINDOW || '800,600').split(',').map(Number);
      return { x: w / 2 - w / z / 2, y: h / 2 - h / z / 2, width: w / z, height: h / z, scale: z };
    })() : undefined;
    const cap = Number(process.env.SETTLE || 700);
    await evaluate(`new Promise(ok => {
      const t0 = performance.now();
      const look = () => {
        const still = document.getAnimations().every(a => a.playState !== 'running');
        if (still || performance.now() - t0 > ${cap}) ok(1); else requestAnimationFrame(look);
      };
      requestAnimationFrame(look);
    })`);
    const png = await send('Page.captureScreenshot', clip ? { format: 'png', clip } : { format: 'png' });
    const buf = Buffer.from(png.result.data, 'base64');
    if (file) writeFileSync(file, buf);
    return buf;
  }

  // Shut the tab. A page left open goes on running the game for ever --
  // sixty frames a second of a yard nobody is looking at -- and a browser
  // this script found already running is one it does not kill, so the tabs
  // pile up and every one of them keeps a core busy. That is a runner that
  // makes the next run of itself slower.
  const close = async () => { try { await fetch(`http://127.0.0.1:${port}/json/close/${tab.id}`); } catch {} };

  return { send, evaluate, shot, close, logs };
}

// A scene stood up the way every shot of one is: the scene, `secs` more of
// the yard so everything that animates is somewhere sensible, then two
// frames actually painted. Without that wait the shot is taken between the
// state change and the draw, and every scene came out a blank white page.
// Shared by `look.mjs` and `review/shoot.mjs`, so a scene looks the same in
// both. False when the page does not know the name.
export async function standScene(tab, name, secs = 1) {
  const r = await tab.evaluate(`(() => { const ok = window.__scene(${JSON.stringify(name)});
    window.__fast(${+secs});
    return new Promise(r => requestAnimationFrame(
      () => requestAnimationFrame(() => r(ok !== false)))); })()`);
  if (r.result?.exceptionDetails) tab.logs.push('EXCEPTION ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text || ''));
  return r.result?.result?.value === true;
}
