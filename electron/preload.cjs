// The bridge: one object, five functions, no events.
//
// `window.desk` is the whole of what the page knows about the shell. No
// `ipcRenderer` reaches the page and no file path ever crosses; the page asks
// for the save and gets a string, hands one over and gets a yes or a no.
// `read` and `version` are synchronous because the boot reads the save before
// the first frame and has nothing to wait on; the rest are promises because
// they touch the disk or open a dialog.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desk', {
  read: () => ipcRenderer.sendSync('desk:read'),
  write: raw => ipcRenderer.invoke('desk:write', raw),
  exportTo: raw => ipcRenderer.invoke('desk:exportTo', raw),
  importFrom: () => ipcRenderer.invoke('desk:importFrom'),
  version: () => ipcRenderer.sendSync('desk:version')
});
