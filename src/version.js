// Which build this is.
//
// A release has a number -- `version` in package.json, bumped and tagged by
// `bun run release` -- and every build carries it along with the commit and
// the day it was made from. The number is what the itch page and a devlog
// say; the hash and the day are what a bug report needs, since two builds of
// one day can differ and a checkout between tags has no number of its own.
// All three are stamped in at build time by `define` in vite.config.js; under
// `vite dev` they say so.

export const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : { version: '', hash: 'dev', date: '' };

// "v0.1.0 · 7b5da28 · 2026-09-12", or "dev" off the dev server
export const version = () =>
  BUILD.date ? `v${BUILD.version} · ${BUILD.hash} · ${BUILD.date}` : BUILD.hash;
