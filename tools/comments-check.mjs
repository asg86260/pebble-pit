// Proves a comment-only edit changed no code.
//
//   node tools/comments-check.mjs [base-ref]        (default: main)
//
// For every .js/.mjs file that differs from the base ref, both versions are
// stripped of comments and blank lines and compared. Any file whose code
// differs is named, and the exit code is 1. A `//` inside a string or a
// regex is stripped on both sides alike, so it cannot produce a false
// mismatch, only hide one on that exact line.

import { execSync } from 'child_process';
import fs from 'fs';

const base = process.argv[2] || 'main';

function strip(src) {
  let out = '', i = 0, q = null;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (q) {
      out += c;
      if (c === '\\') { out += d ?? ''; i += 2; continue; }
      if (c === q) q = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { q = c; out += c; i++; continue; }
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
    out += c; i++;
  }
  return out.split('\n').map(l => l.trimEnd()).filter(l => l.trim()).join('\n');
}

const changed = execSync(`git diff --name-only ${base}`, { encoding: 'utf8' })
  .split('\n').filter(f => /\.(js|mjs)$/.test(f));
let bad = 0;
for (const f of changed) {
  let was;
  try { was = execSync(`git show ${base}:${f}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { console.log(`new file: ${f}`); continue; }
  if (!fs.existsSync(f)) { console.log(`deleted: ${f}`); bad++; continue; }
  const a = strip(was), b = strip(fs.readFileSync(f, 'utf8'));
  if (a !== b) {
    bad++;
    const al = a.split('\n'), bl = b.split('\n');
    let k = 0; while (k < al.length && k < bl.length && al[k] === bl[k]) k++;
    console.log(`CODE CHANGED: ${f}\n  was: ${al[k] ?? '<end>'}\n  now: ${bl[k] ?? '<end>'}`);
  }
}
console.log(`${changed.length} file(s) checked, ${bad} with code changes`);
process.exit(bad ? 1 : 0);
