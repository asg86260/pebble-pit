// The bridge: one object, nine functions, no events.
//
// `window.desk` is the whole of what the page knows about the shell. The save
// is read and written by slot number (1 to 3; see DESIGN.md, "Save slots"). No
// `ipcRenderer` reaches the page and no file path ever crosses; the page asks
// for the save and gets a string, hands one over and gets a yes or a no.
// `read`, `version` and `language` are synchronous because the boot reads the save before
// the first frame and has nothing to wait on; the rest are promises because
// they touch the disk or open a dialog.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desk', {
  read: slot => ipcRenderer.sendSync('desk:read', slot),
  write: (slot, raw) => ipcRenderer.invoke('desk:write', slot, raw),
  exportTo: raw => ipcRenderer.invoke('desk:exportTo', raw),
  importFrom: () => ipcRenderer.invoke('desk:importFrom'),
  version: () => ipcRenderer.sendSync('desk:version'),
  // What the shell knows of the player's language, `{ steam, system }`:
  // Steam's name for it on a Steam build (null elsewhere) and the system's
  // tags in order. Synchronous for the reason `read` is: lang.js settles the
  // language as it loads, before the first frame.
  language: () => ipcRenderer.sendSync('desk:language'),
  // Steam achievements: one won now, and the save's whole list at launch. The
  // shell does nothing with either off Steam.
  achievement: name => ipcRenderer.send('desk:achievement', name),
  achievements: names => ipcRenderer.send('desk:achievements', names)
});
