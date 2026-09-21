// The bridge: one object, six functions, no events.
//
// `window.desk` is the whole of what the page knows about the shell. The save
// is read and written by slot number (1 to 3; see DESIGN.md, "Save slots"). No
// `ipcRenderer` reaches the page and no file path ever crosses; the page asks
// for the save and gets a string, hands one over and gets a yes or a no.
// `read` and `version` are synchronous because the boot reads the save before
// the first frame and has nothing to wait on; the rest are promises because
// they touch the disk or open a dialog.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desk', {
  read: slot => ipcRenderer.sendSync('desk:read', slot),
  write: (slot, raw) => ipcRenderer.invoke('desk:write', slot, raw),
  exportTo: raw => ipcRenderer.invoke('desk:exportTo', raw),
  importFrom: () => ipcRenderer.invoke('desk:importFrom'),
  version: () => ipcRenderer.sendSync('desk:version'),
  // The key the itch app put in the environment, or '' outside it; the board
  // of times sends it up so the server can ask itch whose it is (times.js).
  itchKey: () => ipcRenderer.sendSync('desk:itchKey')
});
