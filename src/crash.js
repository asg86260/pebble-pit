// The game stopping on a throw, and what is done about it.
//
// A throw inside a frame used to stop the loop for good -- the reschedule is the
// last line of `frame`, so it was never reached -- and leave the autosave
// running, writing the state that had just thrown over the last save that was
// whole, once a second, for as long as the tab stayed open. A bug that should
// have cost a reload could cost the run. So a throw does three things now, in
// this order: it marks the yard fatal, which is what stops `persist` writing;
// it stops the loop, on purpose rather than by accident; and it puts one sheet
// in the middle of the window that says so and lets you take the save with you.
//
// This is the first module main.js imports, before any of the game, so that a
// throw while a module is still being evaluated -- before there is a frame to
// throw in -- has something listening for it too.

import { S } from './state.js';

const sheet = document.getElementById('crashed');
const why = sheet.querySelector('.why');
const said = sheet.querySelector('.said');

// The one line of what broke, in the browser's words. The first line of the
// stack is the message with the error's name on the front, which is the line a
// bug report wants; the rest is for the console, where the whole of it goes.
function firstLine(err) {
  const s = err instanceof Error ? (err.stack || String(err)) : String(err);
  return s.split('\n')[0].trim() || 'something threw';
}

export function fatal(err) {
  if (S.fatal) return;                      // the first throw is the one that counts
  S.fatal = firstLine(err);
  console.error('the game stopped:', err);
  why.textContent = S.fatal;
  sheet.hidden = false;
}

// The save, out of the browser and into your hand. It is the save that was
// written *before* the throw -- nothing has been written since, which is the
// whole point -- so what you paste back in is a yard that was still standing.
// The copying itself is the settings sheet's `copyOut`, so the two sheets hand
// over the same blob the same way, and the blob is the store's (`loadRaw`,
// wherever the save is kept -- it read localStorage by hand once, and handed
// over nothing the day the save moved). Both are fetched at the click rather
// than imported at the top: this file has to be the first thing evaluated,
// before any of the game, and either import pulls the whole yard in behind it.
document.getElementById('copysave').addEventListener('click', async () => {
  const { copyOut } = await import('./settings.js');
  const { loadRaw } = await import('./save.js');
  let raw = '';
  try { raw = loadRaw() || ''; } catch {}
  await copyOut(raw, said);
});

// A throw with no frame around it: during boot, in a pointer handler, in a
// promise nobody awaited. Any of them means the yard is in a state nobody
// reasoned about, and the save is worth more than the session.
addEventListener('error', e => fatal(e.error ?? e.message));
addEventListener('unhandledrejection', e => fatal(e.reason));
