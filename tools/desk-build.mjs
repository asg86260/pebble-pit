// Build dist/ and package it -- `bun run desk:build`.
//
// electron-builder will not run without a version, and this project has no
// version number and will not have one (see src/version.js: a build is named
// by its commit and its day). So the day is the version, worked out here at
// build time -- `2026.9.12` is a perfectly good semver, it matches the date
// on the settings sheet, and nobody has to remember to bump anything. The
// `0.0.0` in package.json is the placeholder the tool insists on reading
// before this overrides it; the shell never reads either.

import { execSync } from 'node:child_process';

const d = new Date();
const version = `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
const run = cmd => execSync(cmd, { stdio: 'inherit' });

run('vite build');
run(`electron-builder --config.extraMetadata.version=${version} ${process.argv.slice(2).join(' ')}`);
