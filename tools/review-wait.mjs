// Wait for the owner's next decision on the review bench (review.html), and
// print it. Run in the background by an agent: it exits the moment a note
// lands in shots/review/notes.jsonl, so the exit is the agent's wake-up.
//
//   node tools/review-wait.mjs [checkout]     # the checkout whose dev server serves review.html
//   node tools/review-wait.mjs --all          # print every note so far; the cursor does not move
//   node tools/review-wait.mjs --reset        # start from now: move the cursor to the end, print nothing
//
// The cursor (shots/review/notes.cursor) is the byte offset of what has been
// printed, so a note that lands between one run's exit and the next run's
// start is not lost: on start, anything past the cursor is printed at once and
// the waiter exits. With no cursor file it starts from the current end, as it
// always did, and creates the file. Only whole lines are printed.

import { existsSync, statSync, readFileSync, watchFile, unwatchFile, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { notesPath } from './review-server.mjs';

const args = process.argv.slice(2), all = args.includes('--all'), reset = args.includes('--reset');
const root = resolve(args.find(a => !a.startsWith('--')) || '.');
const file = notesPath(root);
const cursorFile = join(dirname(file), 'notes.cursor');
const size = () => (existsSync(file) ? statSync(file).size : 0);

function readCursor() {
  if (!existsSync(cursorFile)) return null;
  const n = Number(readFileSync(cursorFile, 'utf8').trim());
  return Number.isInteger(n) && n >= 0 ? n : null;
}

function writeCursor(n) {
  mkdirSync(dirname(cursorFile), { recursive: true });
  const tmp = `${cursorFile}.${process.pid}.tmp`;
  writeFileSync(tmp, `${n}\n`);
  renameSync(tmp, cursorFile);
}

// The whole lines past the cursor, and the offset just after the last one. A
// line still being appended is left for the next look. A file that has shrunk
// (deleted or rewritten) is read from its start.
function news(cur) {
  const buf = existsSync(file) ? readFileSync(file) : Buffer.alloc(0);
  const start = buf.length < cur ? 0 : cur;
  const end = buf.lastIndexOf(0x0a) + 1;
  if (end <= start) return null;
  return { text: buf.subarray(start, end).toString('utf8'), end };
}

if (all) { process.stdout.write(existsSync(file) ? readFileSync(file, 'utf8') : ''); process.exit(0); }

if (reset) { writeCursor(size()); process.exit(0); }

let cur = readCursor();
if (cur === null) { cur = size(); writeCursor(cur); console.log(`waiting on ${file}`); }
else {
  const due = news(cur);
  if (due) { process.stdout.write(due.text); writeCursor(due.end); process.exit(0); }
  console.log(`waiting on ${file}`);
}

watchFile(file, { interval: 500 }, () => {
  const due = news(cur);
  if (!due) return;
  unwatchFile(file);
  process.stdout.write(due.text);
  writeCursor(due.end);
  process.exit(0);
});
