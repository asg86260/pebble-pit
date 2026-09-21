// The board of times, the half that needs no yard: the call to the server,
// the read of the board, the name, and the page. times.js (the run, the
// ping, the post) sits on top of this; the landing page reads this alone,
// the way it reads record.js and not notices.js.
// DESIGN.md, "The board of times: a global competition for the rescue".

import { S } from './state.js';
import { pref, setPref } from './prefs.js';
import { since } from './slots.js';
import { sayClock } from './stats.js';
import { TIMES_URL, TIMES_SHOWN, TIMES_TIMEOUT_MS, TIMES_NAME_MAX, TIMES_WATCHED_MIN } from './config.js';

// The checks point the yard at a stub server with `__timesUrl`; a build's
// answer is the constant. Empty means there is no board and nothing here
// calls anything.
let url = TIMES_URL;
export const setTimesUrl = u => { url = u || ''; };
export const timesOn = () => !!url;

// One shape for every call: a JSON body, a timeout, and null for anything
// that is not a reply the server meant. A refusal comes back as
// `{ status, error }` so the ending sheet can say why.
export async function call(path, body) {
  if (!url) return null;
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl && setTimeout(() => ctl.abort(), TIMES_TIMEOUT_MS);
  try {
    const r = await fetch(url.replace(/\/$/, '') + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl?.signal
    });
    let data = null;
    try { data = await r.json(); } catch {}
    if (!r.ok) return { status: r.status, error: data?.error || String(r.status) };
    return data;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// A name is a preference: typed once, kept outside the save, editable on the
// settings sheet.
export const timesName = () => pref('name') || '';
export function setTimesName(name) {
  setPref('name', String(name || '').trim().slice(0, TIMES_NAME_MAX));
}

// What every surface says when the board cannot be reached: the server is
// on somebody's desk, and a desk is sometimes off.
export const BOARD_DOWN = 'the board is down right now';

// The list, best first, and this yard's own row if it has one. Null when the
// board cannot be reached.
export async function fetchBoard(top = TIMES_SHOWN, mineId = S.runId) {
  if (!url) return null;
  const mine = mineId ? `&mine=${encodeURIComponent(mineId)}` : '';
  const r = await call(`/times?top=${top}${mine}`);
  if (!r || !Array.isArray(r.rows)) return null;
  return r;
}

// One line a row: the time, the name, the badge, and how long ago; a ~ in
// front of a time the server saw less than TIMES_WATCHED_MIN of.
export function rowText(row, now = Date.now()) {
  const watched = row.ms > 0 ? (row.seen || 0) / row.ms : 1;
  const parts = [(watched < TIMES_WATCHED_MIN ? '~' : '') + sayClock(row.ms), row.name || '?'];
  if (row.itch) parts.push('itch');
  if (Number.isFinite(row.at)) parts.push(since(row.at, now));
  return parts.join(' · ');
}

// The line on the sheet's front, off the last read: the best time, or the
// word alone until one has been read.
let best = null;
export const timesLabel = () => (best ? `times · best ${sayClock(best)}` : 'times');
export const noteBest = ms => { if (Number.isFinite(ms)) best = ms; };

// The page: fetched when it is turned, never on a timer.
export async function showTimes(el, mineId = S.runId) {
  try { await drawTimes(el, mineId); } catch {
    el.replaceChildren();
    const none = document.createElement('div');
    none.className = 'none';
    none.textContent = BOARD_DOWN + ' \u2014 try again later';
    el.appendChild(none);
  }
}
async function drawTimes(el, mineId) {
  el.replaceChildren();
  const none = document.createElement('div');
  none.className = 'none';
  none.textContent = url ? 'asking the board…' : 'no board to ask';
  el.appendChild(none);
  if (!url) return;
  const board = await fetchBoard(TIMES_SHOWN, mineId);
  el.replaceChildren();
  if (!board) {
    none.textContent = BOARD_DOWN + ' \u2014 try again later';
    el.appendChild(none);
    return;
  }
  if (board.rows.length === 0) {
    none.textContent = 'nobody yet';
    el.appendChild(none);
  }
  noteBest(board.rows[0]?.ms);
  board.rows.forEach((row, i) => {
    const d = document.createElement('div');
    d.className = 'row' + (row.id && row.id === mineId ? ' mine' : '');
    d.textContent = `${i + 1}. ${rowText(row)}`;
    el.appendChild(d);
  });
  if (board.mine && !board.rows.some(r => r.id === mineId)) {
    const d = document.createElement('div');
    d.className = 'row mine';
    d.textContent = `${board.mine.rank}. ${rowText(board.mine)}`;
    el.appendChild(d);
  }
}

// The ordinal on the ending sheet: "3rd of 41".
export function sayRank(rank, of) {
  const n = rank % 100, d = rank % 10;
  const suffix = n >= 11 && n <= 13 ? 'th' : d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th';
  return `${rank}${suffix} of ${of}`;
}
