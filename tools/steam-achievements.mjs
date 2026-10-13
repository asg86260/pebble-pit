// The table to paste into Steamworks: one achievement a notice.
//
//   node tools/steam-achievements.mjs [--csv | --md]
//
// API name (what the Steamworks dashboard wants as the achievement's id),
// the in-game id, the notice's in-game title, whether Steam hides it until
// it is won, and the icon files tools/steam-art.mjs writes for it. The
// display name and description Steam shows are the owner's to write there.

import { fileURLToPath } from 'node:url';
import { STEAM_ACHIEVEMENTS } from '../src/achievements.js';

// Hidden on Steam: the notices that spoil what lies past the surface. The one
// place the list is kept; the table below and the README read it from here.
export const STEAM_HIDDEN = ['gotout', 'rifttorn', 'drowned', 'rift1e6', 'star', 'firsthat',
                             'serpent0', 'serpent1', 'serpent2', 'serpent3', 'allstations'];

export const steamRows = () => STEAM_ACHIEVEMENTS.map(a => ({
  ...a,
  hidden: STEAM_HIDDEN.includes(a.key) ? 1 : 0,
  icon: `${a.api}.png`,
  iconLocked: `${a.api}_locked.png`
}));

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1].replace(/\\/g, '/')}`))) {
  const only = process.argv[2];
  const rows = steamRows();
  const q = s => `"${String(s).replace(/"/g, '""')}"`;

  const csv = ['api_name,game_id,game_title,hidden,icon,icon_locked',
    ...rows.map(a => [a.api, a.key, q(a.name), a.hidden, a.icon, a.iconLocked].join(','))].join('\n');
  const md = ['| API name | in-game id | in-game title | hidden | icon | locked icon |', '| --- | --- | --- | --- | --- | --- |',
    ...rows.map(a => `| ${a.api} | ${a.key} | ${a.name.replace(/\|/g, '\\|')} | ${a.hidden} | ${a.icon} | ${a.iconLocked} |`)].join('\n');

  if (only !== '--md') console.log(csv + '\n');
  if (only !== '--csv') console.log(md + '\n');
  console.log(`${rows.length} achievements, ${STEAM_HIDDEN.length} hidden`);
}
