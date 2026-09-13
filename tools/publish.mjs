// Push a build to itch.io.
//
// The one script in the repository that talks to the outside. By default it
// builds dist/ and pushes it to the `html` channel -- the game played in the
// browser on the itch page, which is what itch is for: no installer, no
// SmartScreen, no 110 MB of shell around 300 kB of game. With `--desktop`
// it instead pushes whatever `bun run desk:build` left in release/, one
// artifact per channel by shape, for the people who want it as an app.
//
// The page it pushes to is `config.itch` in package.json -- this game's own
// page, so a plain run goes where it should; ITCH_TARGET in the environment
// overrides it for a test page. Butler itself is installed and logged in by
// hand; this only calls it. `bun run release` is the front door -- it bumps
// the version and tags before coming through here.
//
//   bun run publish              # the browser build
//   bun run publish -- --desktop # the packaged apps

import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const target = process.env.ITCH_TARGET || pkg.config?.itch;
if (!target) {
  console.error('publish: no page to push to -- set config.itch in package.json or ITCH_TARGET');
  process.exit(2);
}
const desktop = process.argv.includes('--desktop');

// Every push is labeled with the version, so the itch dashboard and the
// settings sheet agree on what a build is called.
// On Windows butler goes through a shell, and the shell splits an artifact
// name with a space in it ("Pebble Pit 0.1.7 portable.exe") into four
// arguments unless it is quoted by hand.
const shell = process.platform === 'win32';
const quote = a => (shell && /\s/.test(a) ? `"${a}"` : a);
function push(file, channel) {
  console.log(`butler push ${file} ${target}:${channel} --userversion ${pkg.version}`);
  const args = ['push', file, `${target}:${channel}`, '--userversion', pkg.version];
  const r = spawnSync('butler', args.map(quote), { stdio: 'inherit', shell });
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
