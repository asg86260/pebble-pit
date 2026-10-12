// The table to paste into Steamworks: one achievement a notice.
//
//   node tools/steam-achievements.mjs [--csv | --md]
//
// API name (what the Steamworks dashboard wants as the achievement's id),
// the in-game id, and the notice's in-game title. The display name and
// description Steam shows are the owner's to write there.

import { STEAM_ACHIEVEMENTS } from '../src/achievements.js';

const only = process.argv[2];
const q = s => `"${String(s).replace(/"/g, '""')}"`;

const csv = ['api_name,game_id,game_title',
  ...STEAM_ACHIEVEMENTS.map(a => [a.api, a.key, q(a.name)].join(','))].join('\n');
const md = ['| API name | in-game id | in-game title |', '| --- | --- | --- |',
  ...STEAM_ACHIEVEMENTS.map(a => `| ${a.api} | ${a.key} | ${a.name.replace(/\|/g, '\|')} |`)].join('\n');

if (only !== '--md') console.log(csv + '\n');
if (only !== '--csv') console.log(md + '\n');
console.log(`${STEAM_ACHIEVEMENTS.length} achievements`);
