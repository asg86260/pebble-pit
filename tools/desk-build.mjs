// Build dist/ and package it -- `bun run desk:build`.
//
// electron-builder reads `version` from package.json, the same number the
// page and the itch channel carry (see src/version.js); `bun run release` is
// what bumps it. The flags pass through, plus `--publish never`: itch is the
// store and the GitHub release is release.yml's to make, so electron-builder
// must not go looking for a token to publish with on its own.
//
// `--linux` on a Windows machine is the exception: the AppImage is built
// inside the electronuserland/builder docker image, because the packager on
// Windows cannot make one, and because the Windows node_modules carry
// Windows-only binaries (esbuild, electron) that a Linux build cannot use --
// the container installs its own into a named volume, which it keeps between
// runs. It leaves the AppImage in release/ next to the exe so
// `publish --desktop` finds both. On Linux itself (the release workflow's
// ubuntu leg) `--linux` is just electron-builder's own flag.

//
// The cuts (DESIGN.md, "Three builds"): `--mode full` builds the paid game
// for the paid itch page; `--steam` and `--steam-demo` build the Steam full
// game and the Steam demo with tools/steam-builder.cjs, which drops the mac
// target, carries steamworks.js unpacked beside the asar, and leaves an
// unpacked folder under release/steam* for SteamPipe to upload. Each cut
// names its own output folder, so one runner's cuts never mix in release/.

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const run = (cmd, opts) => execSync(cmd, { stdio: 'inherit', ...opts });
const take = flag => {
  const i = args.indexOf(flag);
  if (i < 0) return null;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const drop = flag => {
  const i = args.indexOf(flag);
  if (i >= 0) args.splice(i, 1);
  return i >= 0;
};

let mode = take('--mode');
const steamDemo = drop('--steam-demo');
const steamFull = drop('--steam');
if (steamDemo) mode = 'steam-demo';
else if (steamFull) mode = 'steam';
const viteBuild = mode ? `vite build --mode ${mode}` : 'vite build';
if (steamDemo || steamFull) args.push('--config', 'tools/steam-builder.cjs');
const env = steamDemo ? { ...process.env, STEAM_DEMO: '1' } : process.env;

run(viteBuild);

if (args.includes('--linux') && process.platform !== 'linux') {
  // Paths are handed to docker in Windows form; under Git Bash the
  // MSYS_NO_PATHCONV guard stops it turning `/project` into a Program Files
  // path. Docker needs forward slashes on every platform.
  const here = resolve('.').replace(/\\/g, '/');
  const out = resolve('release').replace(/\\/g, '/');
  const inside = [
    'npm install --no-package-lock --no-audit --no-fund --loglevel=error',
    `npx ${viteBuild}`,
    'npx electron-builder --linux AppImage --publish never --config.directories.output=/out',
  ].join(' && ');
  run(
    `docker run --rm -v "${here}:/project" -v pebble-pit-nm:/project/node_modules ` +
      `-v "${out}:/out" -w /project electronuserland/builder:22 sh -c "${inside}"`,
    { env: { ...process.env, MSYS_NO_PATHCONV: '1' } },
  );
  args.splice(args.indexOf('--linux'), 1);
  if (!args.length) process.exit(0);
}

run(`electron-builder ${args.join(' ')} --publish never`, { env });
