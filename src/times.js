// The board of times, the yard's half: the run, the ping and the post
// (DESIGN.md, "The board of times: a global competition for the rescue").
// The board itself and the call to the server are timesboard.js's.
//
// The server owns the number. The game never tells it how long the rescue
// took; it tells it *that the sqwife is under*, once at the first rock
// (`/runs`, which names the run) and then every TIMES_PING_S of wall time
// while the yard is actually stepping (`/runs/:id/ping`). The time goes up
// at the rescue with the save behind it, and the server keeps or refuses it.
//
// Nothing here waits, retries or shows in the yard: every call has one
// timeout and one outcome for any failure, and a run that never reached the
// board is a run with a ~ row, or none. With no TIMES_URL there is no board
// and every function is a no-op, which is the node yard and every check.

import { S } from './state.js';
import { exportSave } from './persist.js';
import { call, timesOn, timesName, setTimesName } from './timesboard.js';
import { TIMES_PING_S } from './config.js';
export { setTimesUrl, timesOn, timesName, setTimesName, sayRank, showTimes, timesLabel } from './timesboard.js';

// The desk under the itch app hands over the key itch gave it (preload.cjs);
// anywhere else there is none.
const itchKey = () => {
  try { return (typeof window !== 'undefined' && window.desk?.itchKey?.()) || ''; } catch { return ''; }
};

// --- the run --------------------------------------------------------------------

// Asked once a boot: a run that got no name (offline, the board away) tries
// again at the next boot, not every frame; so does a post that could not go
// out. `S.timesAsked` holds both marks (ASKED_RUN, ASKED_PENDING); it is
// ephemeral, so a reset clears it, and a page's boot is a fresh module. The
// node yard's reload is neither, so a check says when it boots (`__bootTimes`).
const ASKED_RUN = 1, ASKED_PENDING = 2;
export const bootTimes = () => { S.timesAsked = 0; };

async function startRun() {
  const r = await call('/runs', { save: exportSave() });
  if (r && typeof r.id === 'string' && S.buried && !S.runId) S.runId = r.id;
}

// The step (game.js): while the sqwife is under and the yard has no run yet,
// ask for one; while a post waits, send it. Both once a boot. `stepped` is
// what the ping reads: the yard moved since its last tick.
let stepped = false;
export function stepTimes() {
  if (!timesOn() || S.staged) return;
  stepped = true;
  if (S.buried && !S.runId && !(S.timesAsked & ASKED_RUN)) { S.timesAsked |= ASKED_RUN; startRun(); }
  if (S.timePending && !(S.timesAsked & ASKED_PENDING)) { S.timesAsked |= ASKED_PENDING; sendPending(); }
}

// The ping, on wall time: a tick posts only if the yard stepped since the
// last one, so a held yard, a sleeping tab and a finished story are quiet.
let pinger = 0;
export function startTimes() {
  if (!timesOn() || pinger) return;
  pinger = setInterval(() => {
    const go = stepped && S.buried && S.runId;
    stepped = false;
    if (go) call(`/runs/${S.runId}/ping`, {});
  }, TIMES_PING_S * 1000);
}

// --- the time ---------------------------------------------------------------------

// The rescue's post. The reply is the row's rank, a refusal in the player's
// words, or null for a board that could not be reached -- in which case the
// post waits on the save for the next boot with a network.
export async function postTime(name = timesName()) {
  if (!timesOn() || !S.rescued) return null;
  setTimesName(name);
  const body = { ms: S.buriedMs, name: timesName(), save: exportSave(), itch: itchKey() };
  const r = await call(S.runId ? `/runs/${S.runId}/time` : '/runs/time', body);
  if (r === null) { S.timePending = { ms: S.buriedMs, name: timesName() }; return null; }
  S.timePending = null;
  if (r.error) return { error: saidRefusal(r.status) };
  if (typeof r.id === 'string' && !S.runId) S.runId = r.id;
  return { rank: r.rank, of: r.of };
}

async function sendPending() {
  const p = S.timePending;
  if (!p) return;
  const body = { ms: p.ms, name: p.name, save: exportSave(), itch: itchKey() };
  const r = await call(S.runId ? `/runs/${S.runId}/time` : '/runs/time', body);
  if (r === null) return;                        // still away; next boot
  S.timePending = null;
  if (typeof r.id === 'string' && !S.runId) S.runId = r.id;
}

// What a refusal says on the sheet. The codes are the server's
// (server/src/times.ts).
function saidRefusal(status) {
  if (status === 409) return 'the board already has this one';
  if (status === 422) return 'the board did not believe it';
  if (status === 429) return 'the board is busy; try again in a minute';
  return 'the board is away';
}
