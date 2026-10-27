// Wait for the owner's next decision on the review bench (review.html), and
// print it. Run in the background by an agent: it exits the moment a note
// lands in shots/review/notes.jsonl, so the exit is the agent's wake-up.
//
//   node tools/review-wait.mjs [checkout]     # the checkout whose dev server serves review.html
//
// Notes already in the file when it starts are not news; only lines written
// after it starts are printed. With --all it prints every note so far and
// exits, for a session picking up notes nobody was waiting for.

import { existsSync, statSync, readFileSync, watchFile, unwatchFile } from 'node:fs';
import { resolve } from 'node:path';
import { notesPath } from './review-server.mjs';

const args = process.argv.slice(2), all = args.includes('--all');
const root = resolve(args.find(a => !a.startsWith('--')) || '.');
const file = notesPath(root);
const size = () => (existsSync(file) ? statSync(file).size : 0);

if (all) { process.stdout.write(existsSync(file) ? readFileSync(file, 'utf8') : ''); process.exit(0); }

const from = size();
console.log(`waiting on ${file}`);
watchFile(file, { interval: 500 }, () => {
  if (size() <= from) return;
  unwatchFile(file);
  process.stdout.write(readFileSync(file).subarray(from).toString('utf8'));
  process.exit(0);
});
