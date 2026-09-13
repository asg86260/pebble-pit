// The browser build, as one zip for itch's upload form.
//
// `bun run release` is the road when butler is installed: it pushes dist/
// straight to the page, and keeps a zip of what it pushed. This is for the
// form -- build, then zip the *contents* of dist/ so index.html sits at the
// root of the archive, which is the one thing itch insists on. The zip lands
// in dist/, which is never committed.
//
//   bun run zip                  # dist/pebble-pit.zip
//   bun run zip -- out/game.zip  # somewhere else

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { rmSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// Zip what is in dist/ to `out`. Windows' own bsdtar, zip everywhere else:
// neither needs installing. Not Compress-Archive: it names entries with
// backslashes (assets\index.js), which itch unpacks as one oddly named file
// at the root, and the page then serves its 404 -- text/html -- where the
// module should be. The archive usually lands in dist/ itself, so earlier
// zips are left out of the listing rather than packed inside the new one.
export function zipDist(out) {
  out = resolve(out);
  rmSync(out, { force: true });
  const entries = readdirSync('dist').filter(n => !n.endsWith('.zip'));
  if (process.platform === 'win32')
    run(`${process.env.SystemRoot}\\System32\\tar.exe`, ['-acf', out, '-C', 'dist', ...entries]);
  else
    run('sh', ['-c', `cd dist && zip -qr '${out}' ${entries.map(e => `'${e}'`).join(' ')}`]);
  console.log(`wrote ${out}`);
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { build } = await import('vite');
  await build();
  zipDist(process.argv[2] || './dist/pebble-pit.zip');
}
