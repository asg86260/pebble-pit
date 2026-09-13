// Build dist/ and package it -- `bun run desk:build`.
//
// electron-builder reads `version` from package.json, the same number the
// page and the itch channel carry (see src/version.js); `bun run release` is
// what bumps it. Nothing to work out here beyond passing the flags through.

import { execSync } from 'node:child_process';

const run = cmd => execSync(cmd, { stdio: 'inherit' });

run('vite build');
run(`electron-builder ${process.argv.slice(2).join(' ')}`);
