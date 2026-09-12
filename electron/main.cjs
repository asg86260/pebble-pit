// The desk: the main process of the Electron shell.
//
// The game is the web build, unchanged, plus one adapter in src/save.js; this
// process owns only what a page cannot have -- a window that keeps its clock,
// a save that is a file, and native dialogs for a save going out and coming
// back in. It never imports from src/, and the renderer never sees a path.
// See DESIGN.md, "The desk: an Electron shell".

const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
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
  const win = new BrowserWindow({
    ...WIN,
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
