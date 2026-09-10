// Which build this is.
//
// There is no version number and there will not be one -- nothing here is
// released in numbered steps, it is released as whatever main was that day. So
// the build says the commit and the day, which is what a bug report needs and
// what a player wants to compare against a devlog. Both are stamped in at build
// time by `define` in vite.config.js; under `vite dev` they say so.

export const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : { hash: 'dev', date: '' };

// "7b5da28 · 2026-09-09", or "dev" off the dev server
export const version = () => BUILD.date ? `${BUILD.hash} · ${BUILD.date}` : BUILD.hash;
