// What changed on the review bench since the owner last looked, and which
// reviews have landed: both worked out with nobody bumping or setting
// anything by hand.
//
// An option's look is its scene (the fields and the `run`/`swap` source,
// which review.html reads off the page and posts here, so a scene built by
// `Object.fromEntries` counts as much as one written out) plus the code the
// review draws with. That code is found by its tag: a review's code carries
// `// MOCK <name>` or `// REVIEW <name>` (a `/*` comment counts too), the
// name a scene of the review, a prefix of its scenes' names at a `-`
// ("after-shopbtn" for after-shopbtn-a and -b), or the review's slug. Every
// file carrying the tag is hashed whole, since the line an edit lands on is
// rarely the tagged one. A tag that names nothing open (a bare `// MOCK`)
// cannot be attributed, so it goes into every review's print: marking every
// review beats missing the one that changed. scenes.js is not scanned; the
// scene's own source already covers it, and scanning it would light every
// review on any scene edit.
//
// Content hashes rather than git: a commit, a merge, a fast-forward and a
// live edit all change a file's bytes the same way, while commit messages
// do not reliably name scenes and a branch's diff cannot tell two reviews
// on it apart.
//
// The first time each print is seen is kept in shots/review/prints.json, so
// the page can say how long ago an option last changed. shots/ is outside git
// and the watcher, so writing it never reloads the page.
//
// A review has landed when every branch its scenes name (`branch` or
// `branches`) is merged into main, or when another review's scenes say they
// `supersedes` it (the built review that came out of a mock). That is asked
// of git, and the answers are kept a minute so the page stays fast.

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile, execFileSync } from 'node:child_process';

const TAG = /(?:\/\/|\/\*)\s*(?:MOCK|REVIEW)\b[\s(:]*([A-Za-z0-9][\w-]*)?/g;
const SCANNED = /\.(m?js|css|html)$/;
const hash = s => createHash('sha1').update(s).digest('hex').slice(0, 16);
// Kept to the newest few thousand, so the history never grows without end.
const KEEP = 4000;
// How long a branch's merged-or-not answer, and a fetch, are good for.
const GIT_FRESH_MS = 60e3;

export const printsPath = root => join(root, 'shots', 'review', 'prints.json');

// path -> { stamp, mtime, tags: [names, '' for a bare tag], hash }, re-read
// only when a file's mtime or size moves: a scan is a stat per source file.
const cache = new Map();
function scan(root) {
  const out = [];
  const walk = dir => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!SCANNED.test(e.name) || e.name === 'scenes.js') continue;
      const st = statSync(p), stamp = `${st.mtimeMs}:${st.size}`;
      let c = cache.get(p);
      if (!c || c.stamp !== stamp) {
        const text = readFileSync(p, 'utf8'), tags = new Set();
        for (const m of text.matchAll(TAG)) tags.add(m[1] || '');
        c = { stamp, mtime: st.mtimeMs, tags: [...tags], hash: tags.size ? hash(text) : null };
        cache.set(p, c);
      }
      if (c.tags.length) out.push({ file: relative(root, p).replace(/\\/g, '/'), tags: c.tags, hash: c.hash, mtime: c.mtime });
    }
  };
  walk(join(root, 'src'));
  return out;
}

// --- landed ------------------------------------------------------------------

const git = (root, ...args) => execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
const hasRef = (root, ref) => { try { git(root, 'rev-parse', '--verify', '--quiet', ref + '^{commit}'); return true; } catch { return false; } };
// The remote's copy of a branch when there is one (what landing means), else
// the local one; null when neither exists, which is "not known to be landed".
const refOf = (root, b) => hasRef(root, `origin/${b}`) ? `origin/${b}` : hasRef(root, b) ? b : null;
let fetchedAt = 0;
const merged = new Map();   // branch -> { at, landed }
function landedBranch(root, b) {
  // A fetch in the background, a minute apart: the answer now is from the
  // refs as they stand, and the next ask after the fetch sees the new ones.
  if (Date.now() - fetchedAt > GIT_FRESH_MS) {
    fetchedAt = Date.now();
    execFile('git', ['fetch', '--quiet', 'origin'], { cwd: root }, () => merged.clear());
  }
  const c = merged.get(b);
  if (c && Date.now() - c.at < GIT_FRESH_MS) return c.landed;
  let landed = false;
  const main = refOf(root, 'main'), ref = refOf(root, b);
  if (main && ref) try { git(root, 'merge-base', '--is-ancestor', ref, main); landed = true; } catch {}
  merged.set(b, { at: Date.now(), landed });
  return landed;
}

// reviews: [{ slug, name, branches, supersedes, options: [{ scene, text }] }]
// -> slug -> { landed, why }
function landing(root, reviews) {
  const over = new Map();   // review name -> the review that supersedes it
  for (const r of reviews) for (const n of r.supersedes || []) over.set(n, r.name);
  const out = {};
  for (const r of reviews) {
    const bs = r.branches || [];
    if (over.has(r.name)) out[r.slug] = { landed: true, why: `superseded by ${over.get(r.name)}` };
    else if (bs.length && bs.every(b => landedBranch(root, b))) out[r.slug] = { landed: true, why: `${bs.join(', ')} merged into main` };
    else out[r.slug] = { landed: false, why: bs.length ? `${bs.join(', ')} not merged into main` : '' };
  }
  return out;
}

// --- prints ------------------------------------------------------------------

// Returns each option's print, when it was first seen and the tagged files
// in it; each review's print (of its options) with the newest time; and
// which reviews have landed.
export function prints(root, reviews) {
  const scenes = reviews.flatMap(r => r.options.map(o => o.scene));
  // The options a tag names; none means it names nothing open.
  const named = tag => {
    if (!tag) return [];
    const r = reviews.find(x => x.slug === tag);
    if (r) return r.options.map(o => o.scene);
    return scenes.filter(s => s === tag || (tag.includes('-') && s.startsWith(tag + '-')));
  };
  const code = new Map(scenes.map(s => [s, new Map()]));   // scene -> file -> { hash, mtime }
  for (const f of scan(root)) for (const tag of f.tags) {
    const hit = named(tag);
    for (const s of hit.length ? hit : scenes) code.get(s).set(f.file, f);
  }
  const file = printsPath(root);
  let seen = {};
  try { seen = JSON.parse(readFileSync(file, 'utf8')); } catch {}
  // A print first seen is stamped with when its files last changed, not with
  // now: a page opened the morning after a night of edits would otherwise say
  // every change happened "just now". The newest mtime of the files feeding
  // it is never earlier than the change, and it is capped at now.
  const nowMs = Date.now();
  let scenesMs = nowMs;
  try { scenesMs = statSync(join(root, 'src', 'scenes.js')).mtimeMs; } catch {}
  let grew = false;
  const options = {}, revs = {};
  for (const r of reviews) {
    const fps = [];
    let latest = null;
    for (const o of r.options) {
      const files = [...code.get(o.scene)].sort((a, b) => (a[0] < b[0] ? -1 : 1));
      const fp = hash(`${o.scene}\n${o.text}\n${files.map(([f, c]) => `${f}#${c.hash}`).join('\n')}`);
      if (!seen[fp]) {
        seen[fp] = new Date(Math.min(nowMs, Math.max(scenesMs, ...files.map(([, c]) => c.mtime)))).toISOString();
        grew = true;
      }
      options[o.scene] = { fp, since: seen[fp], files: files.map(([f]) => f) };
      fps.push(fp);
      if (!latest || seen[fp] > latest) latest = seen[fp];
    }
    revs[r.slug] = { fp: hash(fps.join(',')), since: latest };
  }
  if (grew) {
    const keep = Object.entries(seen).sort((a, b) => (a[1] < b[1] ? 1 : -1)).slice(0, KEEP);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(Object.fromEntries(keep)));
  }
  return { options, reviews: revs, landed: landing(root, reviews) };
}
