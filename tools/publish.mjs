// Push the packaged builds to itch.io.
//
// The one script in the repository that talks to the outside. It runs butler
// once per artifact `bun run desk:build` left in release/, on the channel the
// artifact's shape says it is for, and it refuses to do anything at all
// without ITCH_TARGET (`user/game`) in the environment -- so a stray run can
// never publish to somebody's page by accident. Butler itself is installed and
// logged in by hand; this only calls it.
//
//   ITCH_TARGET=somebody/boulder bun run publish

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const target = process.env.ITCH_TARGET;
if (!target) {
  console.error('publish: set ITCH_TARGET=user/game first; nothing was pushed');
  process.exit(2);
}

const DIR = 'release';

// Which channel each artifact belongs on, by the shape electron-builder gives
// it. The portable Windows build is told apart from the installer by its name,
// which is the only thing that differs between the two .exe files.
function channelOf(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.dmg')) return 'mac';
  if (lower.endsWith('.appimage')) return 'linux';
  if (lower.endsWith('.exe')) return lower.includes('portable') ? 'windows-portable' : 'windows';
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
for (const { file, channel } of artifacts) {
  console.log(`butler push ${file} ${target}:${channel}`);
  const r = spawnSync('butler', ['push', file, `${target}:${channel}`], { stdio: 'inherit' });
  if (r.status !== 0) { failed++; console.error(`publish: ${file} did not push`); }
}
process.exit(failed ? 1 : 0);
