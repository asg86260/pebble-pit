// The story's line on the page (objectives.js says which step it is). Read
// every frame from the yard, so a save restored after load shows its own line;
// a step finished is struck through and fades before the next comes up, so the
// line never changes under the eye without saying so.

import { S } from './state.js';
import { objective, questNow } from './objectives.js';

const el = document.getElementById('objective');
// The node yard's page is a stand-in with no line on it: nothing to seat.
const say = el?.querySelector?.('.say') ?? null;
const list = el?.querySelector?.('.quest') ?? null;
const STRIKE_MS = 1000;

let shown = null, leaving = 0, listed = '';

export function seatObjective(t) {
  if (!say) return;
  const want = objective();
  // Off while a beat has the yard, the camera or a sheet: the story is being told.
  const hide = (!want && !shown) || !!(S.beat.yard || S.beat.camera || S.beat.sheet);
  el.hidden = hide;
  el.classList.toggle('deep', S.view === 'deep');
  if (hide) return;
  const key = want ? want.key : null;
  if (shown && key !== shown.key) {
    // the one done: struck through and faded, then the next
    if (!leaving) { leaving = t + STRIKE_MS; say.classList.add('done'); }
    if (t < leaving) return;
    leaving = 0;
    say.classList.remove('done');
    shown = null;
  }
  if (!shown && want) {
    shown = want;
    say.textContent = want.say;
    say.classList.add('in');
    requestAnimationFrame(() => say.classList.remove('in'));
  }
  if (!want && !shown) el.hidden = true;
  seatQuest(want);
}

// The quest under the line: drawn again only when an item's state changes.
function seatQuest(want) {
  if (!list) return;
  const items = want && shown && want.key === shown.key ? questNow() : null;
  const said = items ? items.map(i => `${i.done ? 1 : 0}${i.say}`).join('|') : '';
  if (said === listed) return;
  listed = said;
  list.hidden = !items;
  list.replaceChildren(...(items || []).map(i => {
    const li = document.createElement('li');
    li.textContent = i.say;
    if (i.done) li.className = 'done';
    return li;
  }));
}
