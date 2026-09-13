// The browser build, as one zip for itch's upload form.
//
// `bun run publish` is the better road when butler is installed: it pushes
// dist/ straight to the page. This is for the form -- build, then zip the
// *contents* of dist/ so index.html sits at the root of the archive, which
// is the one thing itch insists on. The zip lands beside the repository
// rather than in it, so it is never something to commit.
//
//   bun run zip                  # ../boulder-clicker-web.zip
//   bun run zip -- out/game.zip  # somewhere else

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { rmSync } from 'node:fs';
import { build } from 'vite';

const out = resolve(process.argv[2] || '../boulder-clicker-web.zip');

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

await build();
rmSync(out, { force: true });
// PowerShell on Windows, zip everywhere else: neither needs installing.
if (process.platform === 'win32')
  run('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path dist\\* -DestinationPath '${out}'`]);
else
  run('sh', ['-c', `cd dist && zip -qr '${out}' .`]);
console.log(`wrote ${out}`);
