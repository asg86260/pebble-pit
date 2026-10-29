// What an agent is doing for a review, written where the review bench reads
// it: shots/review/status.json, `[{ review, state, what, since }]`.
//
//   node tools/review-status.mjs <checkout> set "<review>" building|iterating "<what>"
//   node tools/review-status.mjs <checkout> clear "<review>"
//   node tools/review-status.mjs <checkout> list
//   node tools/review-status.mjs <checkout> changed "<review>" "<what changed this round>"
//   node tools/review-status.mjs <checkout> changes "<review>"
//
// `changed` appends one line to shots/review/changes.json, `[{ review, at,
// text }]`, which the board shows on the card until the owner next weighs in.
//
// The coordinator sets an entry when it dispatches an agent and clears it when
// the agent reports. Everything else on the board (waiting on you, signed off,
// landed) is worked out from the notes and the fingerprints, so only this
// needs a write. The write is a temp file renamed over the old one, so the
// page never reads half of it.

import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const statusPath = root => join(root, 'shots', 'review', 'status.json');
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function readStatus(root) {
  try { const a = JSON.parse(readFileSync(statusPath(root), 'utf8')); return Array.isArray(a) ? a : []; } catch { return []; }
}
export const changesPath = root => join(root, 'shots', 'review', 'changes.json');
export function readChanges(root) {
  try { const a = JSON.parse(readFileSync(changesPath(root), 'utf8')); return Array.isArray(a) ? a : []; } catch { return []; }
}
export function addChange(root, review, text) {
  const list = readChanges(root); list.push({ review, at: new Date().toISOString(), text: String(text) });
  write(root, list.slice(-300), changesPath(root));
}
function write(root, list, file = statusPath(root)) {
  const tmp = file + '.tmp';
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(tmp, JSON.stringify(list, null, 1));
  renameSync(tmp, file);
}
export function setStatus(root, review, state, what) {
  if (state !== 'building' && state !== 'iterating') throw new Error('state is building or iterating');
  const list = readStatus(root).filter(e => slug(e.review) !== slug(review));
  list.push({ review, state, what: what || '', since: new Date().toISOString() });
  write(root, list);
}
export function clearStatus(root, review) {
  write(root, readStatus(root).filter(e => slug(e.review) !== slug(review)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [root, cmd, review, state, what] = process.argv.slice(2);
  if (root && (cmd === 'changed' || cmd === 'changes')) {
    if (!review || (cmd === 'changed' && !state)) { console.error('usage: review-status.mjs <checkout> changed "<review>" "<text>" | changes "<review>"'); process.exit(2); }
    if (cmd === 'changed') addChange(root, review, state);
    console.log(JSON.stringify(readChanges(root).filter(c => slug(c.review) === slug(review)), null, 1));
    process.exit(0);
  }
  const usage = () => { console.error('usage: review-status.mjs <checkout> set "<review>" building|iterating "<what>" | clear "<review>" | list'); process.exit(2); };
  if (!root || !cmd) usage();
  try {
    if (cmd === 'set' && review && state) setStatus(root, review, state, what);
    else if (cmd === 'clear' && review) clearStatus(root, review);
    else if (cmd !== 'list') usage();
  } catch (e) { console.error(e.message); process.exit(2); }
  console.log(JSON.stringify(readStatus(root), null, 1));
}
