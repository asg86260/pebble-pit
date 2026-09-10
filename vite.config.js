import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

// The build is named after the commit it was made from, and the day. See
// src/version.js for who reads it. A checkout with no git behind it -- a
// tarball, a zip somebody was handed -- builds as "unknown" rather than not at
// all.
function build() {
  let hash = 'unknown';
  try { hash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
  return { hash, date: new Date().toISOString().slice(0, 10) };
}

export default defineConfig(({ command }) => ({
  define: {
    // Off the dev server the page says "dev": a stamp that changed on every
    // save would be a stamp nobody could compare against anything.
    __BUILD__: JSON.stringify(command === 'build' ? build() : { hash: 'dev', date: '' })
  },
  server: {
    // listen on every interface, not just localhost, so the phone on the same
    // wifi can reach it. Vite prints the Network: address to use.
    host: true,
    port: 5183,
    strictPort: true
  },
  preview: {
    host: true,
    port: 4183,
    strictPort: true
  }
}));
