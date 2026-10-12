// The electron-builder config for the Steam cuts -- `bun run desk:build --
// --steam` and `--steam-demo` (tools/desk-build.mjs). It is package.json's
// `build` with four changes:
//
// - no mac: the Steam build waits on notarization (DESIGN.md, "Three builds");
// - steamworks.js is packed (the itch builds leave it out), and its native
//   `.node` files and Valve's library beside them are unpacked from the asar,
//   which a native module cannot be loaded out of;
// - the target is a plain folder, which is what SteamPipe uploads -- Steam is
//   the installer;
// - each cut has its own output folder, and the demo its own appId, so the
//   two are never confused on one machine. The product name stays: the
//   shell names the demo's save folder itself (electron/steam.cjs).

const base = require('../package.json').build;
const demo = process.env.STEAM_DEMO === '1';

module.exports = {
  ...base,
  appId: demo ? `${base.appId}.demo` : base.appId,
  files: base.files.filter(f => !f.includes('steamworks.js')),
  asarUnpack: ['node_modules/steamworks.js/dist/**'],
  directories: { ...base.directories, output: demo ? 'release/steam-demo' : 'release/steam' },
  win: { ...base.win, target: ['dir'] },
  linux: { ...base.linux, target: ['dir'] },
  mac: undefined
};
