// What changed on the review bench since the owner last looked: a
// fingerprint per option, worked out with nobody bumping a version.
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
// The first time each print is seen is kept in shots/review/prints.json, so
// the page can say how long ago an option last changed. shots/ is outside git
// and the watcher, so writing it never reloads the page.

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { createHash } from 'node:crypto';

const TAG = /(?:\/\/|\/\*)\s*(?:MOCK|REVIEW)\b[\s(:]*([A-Za-z0-9][\w-]*)?/g;
const SCANNED = /\.(m?js|css|html)$/;
const hash = s => createHash('sha1').update(s).digest('hex').slice(0, 16);
// Kept to the newest few thousand, so the history never grows without end.
const KEEP = 4000;

export const printsPath = root => join(root, 'shots', 'review', 'prints.json');

// path -> { stamp, tags: [names, '' for a bare tag], hash }, re-read only
// when a file's mtime or size moves: a scan is a stat per source file.
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
        c = { stamp, tags: [...tags], hash: tags.size ? hash(text) : null };
        cache.set(p, c);
      }
      if (c.tags.length) out.push({ file: relative(root, p).replace(/\\/g, '/'), tags: c.tags, hash: c.hash });
    }
  };
  walk(join(root, 'src'));
  return out;
}

// reviews: [{ slug, options: [{ scene, text }] }] as the page posts them.
// Returns each option's print, when it was first seen and the tagged files
// in it, and each review's print (of its options) with the newest time.
export function prints(root, reviews) {
  const scenes = reviews.flatMap(r => r.options.map(o => o.scene));
  // The options a tag names; none means it names nothing open.
  const named = tag => {
    if (!tag) return [];
    const r = reviews.find(x => x.slug === tag);
    if (r) return r.options.map(o => o.scene);
    return scenes.filter(s => s === tag || (tag.includes('-') && s.startsWith(tag + '-')));
  };
  const code = new Map(scenes.map(s => [s, new Map()]));   // scene -> file -> hash
  for (const f of scan(root)) for (const tag of f.tags) {
    const hit = named(tag);
    for (const s of hit.length ? hit : scenes) code.get(s).set(f.file, f.hash);
  }
  const file = printsPath(root);
  let seen = {};
  try { seen = JSON.parse(readFileSync(file, 'utf8')); } catch {}
  const nowIso = new Date().toISOString();
  let grew = false;
  const options = {}, revs = {};
  for (const r of reviews) {
    const fps = [];
    let latest = null;
    for (const o of r.options) {
      const files = [...code.get(o.scene)].sort((a, b) => (a[0] < b[0] ? -1 : 1));
      const fp = hash(`${o.scene}\n${o.text}\n${files.map(([f, h]) => `${f}#${h}`).join('\n')}`);
      if (!seen[fp]) { seen[fp] = nowIso; grew = true; }
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
  return { options, reviews: revs };
}
