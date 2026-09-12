// The desk: the main process of the Electron shell.
//
// The game is the web build, unchanged, plus one adapter in src/save.js; this
// process owns only what a page cannot have -- a window that keeps its clock,
// a save that is a file, and native dialogs for a save going out and coming
// back in. It never imports from src/, and the renderer never sees a path.
// See DESIGN.md, "The desk: an Electron shell".

const { app, BrowserWindow, Menu, dialog, ipcMain, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { openStore } = require('./store.cjs');

// The window as it opens, and the least it may be shrunk to. The yard lays
// itself out to any size; these are the sizes at which the boards read.
const WIN = { width: 1440, height: 900, minWidth: 960, minHeight: 600 };

// The stamp the page carries (see src/version.js), read from the file the
// build wrote beside index.html so the shell and the page name the same build.
// Under the dev server there is no build, and both say so the same way.
function readBuild() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'dist', 'build.json'), 'utf8');
    const b = JSON.parse(raw);
    if (typeof b.hash === 'string' && typeof b.date === 'string') return b;
  } catch {}
  return { hash: 'dev', date: '' };
}

// The default name for a save on its way out: the day, so a folder of them
// sorts itself.
const saveName = () => `boulder-${new Date().toISOString().slice(0, 10)}.json`;
const FILTERS = [{ name: 'save', extensions: ['json'] }];

let store = null;
let build = { hash: 'dev', date: '' };

// Where the window was last left -- its bounds, and whether it was maximized
// or full -- so it comes back there. A window that opens 1440x900 in the
// middle of the screen every time, after being sized and moved every time,
// is the first thing a desktop player notices and the first thing they say.
// A remembered rectangle is only used if some display still shows a corner
// of it: a monitor that has since been unplugged would put the yard off the
// edge of the world with no way to drag it back.
const WINDOW_FILE = () => path.join(app.getPath('userData'), 'window.json');

function readWindow() {
  try {
    const w = JSON.parse(fs.readFileSync(WINDOW_FILE(), 'utf8'));
    const onScreen = screen.getAllDisplays().some(d => {
      const a = d.workArea;
      return w.x < a.x + a.width && w.x + w.width > a.x &&
             w.y < a.y + a.height && w.y + w.height > a.y;
    });
    if (onScreen && w.width >= WIN.minWidth && w.height >= WIN.minHeight) return w;
  } catch {}
  return null;
}

function rememberWindow(win) {
  let timer = null;
  const save = () => {
    // The normal bounds, not the maximized or full-screen ones, so a window
    // taken out of either comes back to the size it had before.
    const b = win.getNormalBounds();
    const w = { ...b, maximized: win.isMaximized(), fullscreen: win.isFullScreen() };
    try { fs.writeFileSync(WINDOW_FILE(), JSON.stringify(w)); } catch {}
  };
  // Every drag fires dozens of these; the last one is the one that counts.
  const later = () => { clearTimeout(timer); timer = setTimeout(save, 300); };
  for (const ev of ['resize', 'move', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']) win.on(ev, later);
  win.on('close', () => { clearTimeout(timer); save(); });
}

function wire() {
  ipcMain.on('desk:read', e => { e.returnValue = store.read(); });
  ipcMain.on('desk:version', e => { e.returnValue = build; });
  ipcMain.handle('desk:write', (e, raw) => store.write(raw));
  ipcMain.handle('desk:exportTo', async (e, raw) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showSaveDialog(win, { defaultPath: saveName(), filters: FILTERS });
    if (r.canceled || !r.filePath) return false;
    try { fs.writeFileSync(r.filePath, String(raw), 'utf8'); return true; } catch { return false; }
  });
  ipcMain.handle('desk:importFrom', async e => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showOpenDialog(win, { filters: FILTERS, properties: ['openFile'] });
    if (r.canceled || !r.filePaths.length) return null;
    try { return fs.readFileSync(r.filePaths[0], 'utf8'); } catch { return null; }
  });
}

function open() {
  const was = readWindow();
  const win = new BrowserWindow({
    ...WIN,
    ...(was ? { x: was.x, y: was.y, width: was.width, height: was.height } : {}),
    // White, so the first frame is not a flash of dark before the yard paints.
    backgroundColor: '#ffffff',
    title: 'Boulder',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      // rAF keeps firing when the window is minimized, so the yard's clock is
      // the yard's; a suspended machine is the clock clamp's job (clock.js).
      backgroundThrottling: false
    }
  });
  // The page's own <title> would otherwise take the window over; the shell
  // is called Boulder and stays so.
  win.on('page-title-updated', e => e.preventDefault());
  if (was && was.maximized) win.maximize();
  if (was && was.fullscreen) win.setFullScreen(true);
  rememberWindow(win);
  // F11 or Alt+Enter, the two keys every desktop player tries: full screen
  // and back. There is no menu bar to put it on, and it is the shell's to
  // do -- the page has no full-screen of its own to offer.
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.key === 'Enter' && input.alt)) {
      e.preventDefault();
      win.setFullScreen(!win.isFullScreen());
    }
  });
  const dev = process.env.VITE_DEV_SERVER_URL;
  if (dev) win.loadURL(dev);
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  store = openStore(path.join(app.getPath('userData'), 'saves'));
  build = readBuild();
  wire();
  open();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) open(); });
});

app.on('window-all-closed', () => app.quit());
