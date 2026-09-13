// Cut a release -- `bun run release -- patch|minor|major|1.2.3`.
//
// One command from a clean main to a numbered build on the itch page:
//
//   1. bump `version` in package.json, commit it and tag `vX.Y.Z`;
//   2. build dist/ (the stamp now carries the new number, see src/version.js)
//      and keep a zip of it as dist/pebble-pit-vX.Y.Z.zip, the same bytes the
//      page got, for the upload form or for a bug report;
//   3. push dist/ to the itch `html` channel labeled with the version;
//   4. push the commit and the tag.
//
// With `--desktop` it also packages the apps and pushes them to their
// channels. With `--dry` it stops after the zip: nothing is committed, tagged
// or pushed, and package.json is put back -- for seeing what a release would
// look like without making one.
//
// Order matters: the tag goes on before the build so the build's hash is the
// tagged commit, and git is pushed last so a failed itch push does not leave a
// tag on the remote that no page ever saw -- the local tag is easy to move.

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { zipDist } from './zip.mjs';

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const bump = args.find(a => !a.startsWith('--')) || 'patch';
const dry = flags.has('--dry');
const desktop = flags.has('--desktop');

const fail = msg => { console.error(`release: ${msg}`); process.exit(1); };
// `vite` from node_modules is a .cmd shim on Windows, which only a shell can
// start; with a shell in the way an argument with a space in it ("Release
// v1.2.3") has to be quoted by hand.
const shell = process.platform === 'win32';
const quote = a => (shell && /\s/.test(a) ? `"${a}"` : a);
const sh = (cmd, cmdArgs, opts = {}) => {
  const r = spawnSync(cmd, cmdArgs.map(quote), { stdio: 'inherit', shell, ...opts });
  if (r.status !== 0) fail(`\`${cmd} ${cmdArgs.join(' ')}\` failed`);
  return r;
};
const read = (cmd, cmdArgs) =>
  spawnSync(cmd, cmdArgs.map(quote), { encoding: 'utf8', shell }).stdout.trim();

// A release is a commit on main with nothing left over: a dirty tree would
// mean the tag names a state nobody can check out again.
const branch = read('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== 'main' && !dry) fail(`on ${branch}, not main`);
if (read('git', ['status', '--porcelain']) !== '') fail('the tree is not clean; commit or drop the changes first');
if (!dry && read('git', ['rev-list', '--count', '@{u}..HEAD']) !== '0') {
  // Unpushed commits are fine -- they go out with the tag -- but say so.
  console.log('release: main is ahead of origin; the commits go up with the tag');
}

// The next number: a semver word bumps the one in package.json, a literal
// version is taken as written.
const pkgFile = 'package.json';
const raw = readFileSync(pkgFile, 'utf8');
const pkg = JSON.parse(raw);
const [maj, min, pat] = pkg.version.split('.').map(Number);
const next = {
  major: `${maj + 1}.0.0`,
  minor: `${maj}.${min + 1}.0`,
  patch: `${maj}.${min}.${pat + 1}`,
}[bump] ?? bump;
if (!/^\d+\.\d+\.\d+$/.test(next)) fail(`"${bump}" is not patch, minor, major or a version like 1.2.3`);
if (read('git', ['tag', '-l', `v${next}`]) !== '') fail(`v${next} is already tagged`);

const tag = `v${next}`;
console.log(`release: ${pkg.version} -> ${next}${dry ? ' (dry run)' : ''}`);

// package.json is rewritten as text rather than re-serialized so nothing else
// in it moves and the diff is the one line.
const stamped = raw.replace(`"version": "${pkg.version}"`, `"version": "${next}"`);
if (stamped === raw) fail('could not find the version line in package.json');
writeFileSync(pkgFile, stamped);
const restore = () => writeFileSync(pkgFile, raw);

if (!dry) {
  sh('git', ['add', pkgFile]);
  sh('git', ['commit', '-q', '-m', `Release ${tag}`]);
  sh('git', ['tag', '-a', tag, '-m', tag]);
}

// Build and keep the zip. In a dry run the version goes back afterward so the
// tree is as clean as it was found.
sh('vite', ['build']);
const zip = zipDist(`dist/pebble-pit-${tag}.zip`);
if (desktop) sh('node', ['tools/desk-build.mjs']);
if (dry) {
  restore();
  console.log(`release: dry run done -- ${zip} is what ${tag} would ship; nothing was tagged or pushed`);
  process.exit(0);
}

// The page, then git. `publish` rebuilds dist/ itself -- a second, identical
// build is cheaper than a flag that lets it push a stale one.
sh('node', ['tools/publish.mjs']);
if (desktop) sh('node', ['tools/publish.mjs', '--desktop']);
sh('git', ['push', '-q', 'origin', 'main']);
sh('git', ['push', '-q', 'origin', tag]);
console.log(`release: ${tag} is on the page and on origin; the zip is ${zip}`);
