// Upload a Steam build through SteamPipe (DESIGN.md, "Three builds").
//
// Writes the app build script Valve's steamcmd reads -- one app, one depot a
// platform, each depot the unpacked folder `desk:build -- --steam` left --
// and runs it. The release workflow's `steampipe` job is the caller; steamcmd
// is installed and logged in there (STEAM_USERNAME, and STEAM_CONFIG_VDF for
// the cached Steam Guard login, since a runner cannot answer a code).
//
//   node tools/steampipe.mjs --app 1234 --depot 1235=steam/windows \
//        --depot 1236=steam/linux --desc v0.5.2 [--live beta]
//
// `--live` sets a branch live after the upload. Never `default`: Steam
// refuses that from a build script, and the public branch is the owner's to
// set by hand in Steamworks.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const one = flag => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const many = flag => args.flatMap((a, i) => (a === flag ? [args[i + 1]] : []));

const app = one('--app');
const desc = one('--desc') || 'build';
const live = one('--live');
const depots = many('--depot').map(d => {
  const [id, dir] = String(d).split('=');
  return { id, dir: resolve(dir || '') };
});
const user = process.env.STEAM_USERNAME;
const steamcmd = process.env.STEAMCMD || 'steamcmd';

const fail = msg => { console.error(`steampipe: ${msg}`); process.exit(2); };
if (!/^\d+$/.test(app || '')) fail('--app must be a Steam app id');
if (!depots.length) fail('no --depot id=folder given');
for (const d of depots) {
  if (!/^\d+$/.test(d.id)) fail(`depot id "${d.id}" is not a number`);
  if (!existsSync(d.dir)) fail(`depot ${d.id}: no folder at ${d.dir}`);
}
if (!user) fail('STEAM_USERNAME is not set');

// VDF strings: a backslash and a quote are the two characters to escape.
const q = s => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const out = resolve('steam-output');
mkdirSync(out, { recursive: true });
const lines = [
  '"AppBuild"', '{',
  `  "AppID" ${q(app)}`,
  `  "Desc" ${q(desc)}`,
  `  "BuildOutput" ${q(out)}`,
  `  "ContentRoot" ${q(resolve('.'))}`,
  ...(live && live !== 'default' ? [`  "SetLive" ${q(live)}`] : []),
  '  "Depots"', '  {',
  ...depots.flatMap(d => [
    `    ${q(d.id)}`, '    {',
    `      "ContentRoot" ${q(d.dir)}`,
    '      "FileMapping"', '      {',
    '        "LocalPath" "*"', '        "DepotPath" "."', '        "recursive" "1"',
    '      }', '    }'
  ]),
  '  }', '}'
];
const script = join(out, `app_build_${app}.vdf`);
writeFileSync(script, lines.join('\n') + '\n');
console.log(`steampipe: app ${app}, depots ${depots.map(d => d.id).join(', ')}, "${desc}"`);

const r = spawnSync(steamcmd, ['+login', user, '+run_app_build', script, '+quit'], { stdio: 'inherit' });
process.exit(r.status === 0 ? 0 : 1);
