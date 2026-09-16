// The game stopping on a throw. A throw marks the yard fatal, which is what
// stops `persist` writing a broken state over the last whole save; stops the
// loop; and puts up one sheet that lets you take the save with you.
//
// This is the first module main.js imports, so a throw while a module is
// still being evaluated has something listening for it too.

import { S } from './state.js';

const sheet = document.getElementById('crashed');
const why = sheet.querySelector('.why');
const said = sheet.querySelector('.said');

// The first line of the stack is the message with the error's name on the
// front, which is the line a bug report wants; the whole goes to the console.
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

// The save written *before* the throw, which is a yard still standing. Both
// modules are fetched at the click rather than imported at the top: this file
// has to be evaluated before any of the game, and either import pulls the
// whole yard in behind it.
document.getElementById('copysave').addEventListener('click', async () => {
  const { copyOut } = await import('./copyout.js');
  const { loadRaw } = await import('./save.js');
  let raw = '';
  try { raw = loadRaw() || ''; } catch {}
  await copyOut(raw, said);
});

// A throw with no frame around it: during boot, in a pointer handler, in a
// promise nobody awaited.
addEventListener('error', e => fatal(e.error ?? e.message));
addEventListener('unhandledrejection', e => fatal(e.reason));
