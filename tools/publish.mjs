// Push a build to itch.io.
//
// The one script in the repository that talks to the outside. By default it
// builds dist/ and pushes it to the `html` channel -- the game played in the
// browser on the itch page, which is what itch is for: no installer, no
// SmartScreen, no 110 MB of shell around 300 kB of game. With `--desktop`
// it instead pushes whatever `bun run desk:build` left in release/, one
// artifact per channel by shape, for the people who want it as an app.
//
// It refuses to do anything at all without ITCH_TARGET (`user/game`) in the
// environment, so a stray run can never publish to somebody's page by
// accident. Butler itself is installed and logged in by hand; this only calls
// it.
//
//   ITCH_TARGET=somebody/boulder bun run publish              # the browser build
//   ITCH_TARGET=somebody/boulder bun run publish -- --desktop # the packaged apps

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const target = process.env.ITCH_TARGET;
if (!target) {
  console.error('publish: set ITCH_TARGET=user/game first; nothing was pushed');
  process.exit(2);
}
const desktop = process.argv.includes('--desktop');

function push(file, channel) {
  console.log(`butler push ${file} ${target}:${channel}`);
  const r = spawnSync('butler', ['push', file, `${target}:${channel}`], { stdio: 'inherit' });
  if (r.status !== 0) console.error(`publish: ${file} did not push`);
  return r.status === 0;
}

// The browser build: built fresh so the channel never carries a stale dist/,
// then pushed as a directory -- butler zips it and itch serves index.html.
if (!desktop) {
  const b = spawnSync('vite', ['build'], { stdio: 'inherit', shell: true });
  if (b.status !== 0 || !existsSync('dist/index.html')) {
    console.error('publish: the build failed; nothing was pushed');
    process.exit(1);
  }
  process.exit(push('dist', 'html') ? 0 : 1);
}

const DIR = 'release';

// Which channel each artifact belongs on, by the shape electron-builder gives
// it. The portable Windows build is told apart from the installer by its name,
// which is the only thing that differs between the two .exe files -- and the
// installer stays home: unsigned, it is the same SmartScreen sheet as the
// portable plus an uninstaller to explain, for nothing the portable lacks.
function channelOf(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.dmg')) return 'mac';
  if (lower.endsWith('.appimage')) return 'linux';
  if (lower.endsWith('.exe')) return lower.includes('portable') ? 'windows-portable' : null;
  return null;
}

let names;
try { names = readdirSync(DIR); } catch {
  console.error(`publish: no ${DIR}/ -- run bun run desk:build first`);
  process.exit(2);
}

const artifacts = names
  .filter(n => statSync(join(DIR, n)).isFile())
  .map(n => ({ file: join(DIR, n), channel: channelOf(n) }))
  .filter(a => a.channel);

if (!artifacts.length) {
  console.error(`publish: nothing in ${DIR}/ looks like a build`);
  process.exit(2);
}

let failed = 0;
for (const { file, channel } of artifacts) if (!push(file, channel)) failed++;
process.exit(failed ? 1 : 0);
