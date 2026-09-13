// Cut a release -- `bun run release -- patch|minor|major|1.2.3`.
//
// One command from a clean main to a numbered build everywhere:
//
//   1. bump `version` in package.json, stamp the version and date on
//      CHANGELOG.md's "Unreleased" heading, commit both and tag `vX.Y.Z`;
//   2. push the commit and the tag.
//
// The tag is the trigger: `.github/workflows/release.yml` builds the browser
// game and the three desktop apps on GitHub's runners, pushes every itch
// channel, and makes the GitHub release with this version's CHANGELOG
// section as its notes. Nothing is built here, so the machine that cuts a
// release needs git and nothing else -- no butler, no docker, no Mac.
//
// With `--dry` it stops before committing: nothing is committed, tagged or
// pushed, and the two files are put back -- for seeing what a release would
// look like without making one.

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const bump = args.find(a => !a.startsWith('--')) || 'patch';
const dry = flags.has('--dry');

const fail = msg => { console.error(`release: ${msg}`); process.exit(1); };
// With a shell in the way an argument with a space in it ("Release v1.2.3")
// has to be quoted by hand.
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

// The changelog's "Unreleased" heading becomes this version's, dated, with a
// fresh empty one above it for the next fixes. A release with nothing under
// the heading gets no section, so the file does not fill with empty versions.
const logFile = 'CHANGELOG.md';
const rawLog = readFileSync(logFile, 'utf8');
const today = new Date().toISOString().slice(0, 10);
// Matched a line at a time: on a Windows checkout the file has CRLF endings
// and a bare `\n+` stops at the `\r` of the blank line, so three releases
// went out with their fixes still under Unreleased. The new heading is
// written in whatever ending the file already uses.
const unreleased = /^## Unreleased(?:\r?\n)+(?=- )/m;
const eol = rawLog.includes('\r\n') ? '\r\n' : '\n';
const stampedLog = rawLog.replace(unreleased, `## Unreleased${eol}${eol}## ${tag} — ${today}${eol}${eol}`);
if (stampedLog === rawLog) console.log('release: nothing under Unreleased in CHANGELOG.md; no section added');
writeFileSync(logFile, stampedLog);
const restore = () => { writeFileSync(pkgFile, raw); writeFileSync(logFile, rawLog); };

if (dry) {
  restore();
  console.log(`release: dry run done -- ${tag} would be tagged; nothing was committed or pushed`);
  process.exit(0);
}

// The tag goes to the remote last, so a failure before it leaves nothing
// there -- the local tag is easy to move.
sh('git', ['add', pkgFile, logFile]);
sh('git', ['commit', '-q', '-m', `Release ${tag}`]);
sh('git', ['tag', '-a', tag, '-m', tag]);
sh('git', ['push', '-q', 'origin', 'main']);
sh('git', ['push', '-q', 'origin', tag]);
const repo = read('git', ['remote', 'get-url', 'origin'])
  .replace(/\.git$/, '')
  .replace(/^git@github\.com:/, 'https://github.com/');
console.log(`release: ${tag} is on origin; the builds are at ${repo}/actions`);
