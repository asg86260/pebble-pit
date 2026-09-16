// Which build this is: the package version, the commit and the day, stamped
// in at build time by `define` in vite.config.js; under `vite dev` they say so.

export const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : { version: '', hash: 'dev', date: '' };

// "v0.1.0 · 7b5da28 · 2026-09-12", or "dev" off the dev server
export const version = () =>
  BUILD.date ? `v${BUILD.version} · ${BUILD.hash} · ${BUILD.date}` : BUILD.hash;
