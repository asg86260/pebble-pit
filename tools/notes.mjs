// Print one version's section of CHANGELOG.md -- the GitHub release's notes.
//
//   node tools/notes.mjs            # the version in package.json
//   node tools/notes.mjs v0.1.5
//
// The changelog is already the short, player's-words list the release page
// wants, so the notes are that section and nothing else. A version with no
// section (a release with no fixes in it) gets one line saying so, so the
// release page is never blank.

import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const tag = process.argv[2] || `v${pkg.version}`;
const log = readFileSync('CHANGELOG.md', 'utf8');

const heading = new RegExp(`^## ${tag.replace('.', '\\.')}\\b[^\\n]*\\n`, 'm');
const start = log.search(heading);
let body = '';
if (start >= 0) {
  const rest = log.slice(start).replace(heading, '');
  const end = rest.search(/^## /m);
  body = (end >= 0 ? rest.slice(0, end) : rest).trim();
}
process.stdout.write((body || `${tag}: no fixes recorded; see the commits.`) + '\n');
