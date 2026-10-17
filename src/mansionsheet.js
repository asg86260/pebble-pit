// The ending's sheet (actbeats.js; beats.js, `mansionsheet`): up while its
// beat has the sheet, once the freed souls have gathered at the mansion, and
// put down by its button. Placeholder words (locales/en.ftl, mansion-*).

import { S } from './state.js';
import { now } from './clock.js';
import { beatRunning, skipBeat } from './beats.js';

const sheet = typeof document !== 'undefined' ? document.getElementById('mansionend') : null;
sheet?.querySelector('#mansionkeep')?.addEventListener('click', () => { skipBeat(now(), 'sheet'); });

export function syncMansionSheet() {
  if (!sheet) return;
  const up = beatRunning('mansionsheet') && !S.paused && !S.fatal;
  if (sheet.hidden === up) sheet.hidden = !up;
}
