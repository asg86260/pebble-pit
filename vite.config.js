import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The build is named after the commit it was made from, and the day. See
// src/version.js for who reads it. A checkout with no git behind it -- a
// tarball, a zip somebody was handed -- builds as "unknown" rather than not at
// all.
function build() {
  let hash = 'unknown';
  try { hash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
  return { hash, date: new Date().toISOString().slice(0, 10) };
}

// The same stamp, as a file beside index.html, for the desk (wave-desk-sound,
// track A). The Electron shell reads `dist/build.json` to answer
// `desk.version()`, so the shell and the page name the same build -- one
// `build()` call, written to both places.
function stampFile(stamp) {
  return {
    name: 'boulder-build-stamp',
    closeBundle() {
      writeFileSync(join('dist', 'build.json'), JSON.stringify(stamp) + '\n');
    }
  };
}

export default defineConfig(({ command }) => {
  const stamp = command === 'build' ? build() : { hash: 'dev', date: '' };
  return {
    // Relative, because the desk loads dist/ over file:// and an absolute
    // /assets path is the root of the disk there.
    base: './',
    plugins: command === 'build' ? [stampFile(stamp)] : [],
    define: {
      // Off the dev server the page says "dev": a stamp that changed on every
      // save would be a stamp nobody could compare against anything.
      __BUILD__: JSON.stringify(stamp)
    },
    server: {
      // listen on every interface, not just localhost, so the phone on the
      // same wifi can reach it. Vite prints the Network: address to use.
      host: true,
      port: 5183,
      strictPort: true,
      // The packager's output is not the game's source, and a watcher holding
      // a handle on it is what stopped electron-builder renaming its own
      // folder (EPERM on `win-unpacked.tmp` while a dev server was up).
      watch: { ignored: ['**/release/**'] }
    },
    preview: {
      host: true,
      port: 4183,
      strictPort: true
    }
  };
});
