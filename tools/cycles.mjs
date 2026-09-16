// Which modules under src/ import each other in a ring.
//
// Every `import ... from './x.js'` and `export ... from './x.js'` is an edge;
// Tarjan's walk groups the modules that can reach each other both ways. A ring
// is where load order stops being the order the files are written in, so a
// row read at load can find its import uninitialized (the TDZ seam 1 hit).
// The count of the largest group is the check for the upgrades.js split: the
// sim must not sit in a group with the shop.
//
//   node tools/cycles.mjs                     the groups by size, the largest listed
//   node tools/cycles.mjs --all               every group of two or more, listed
//   node tools/cycles.mjs --path a.js b.js    the shortest chain of imports from a to b

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC = join(ROOT, 'src');

const walk = dir => readdirSync(dir).flatMap(name => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : name.endsWith('.js') ? [p] : [];
});

const files = walk(SRC);
const id = p => relative(ROOT, p).split(sep).join('/');
const edges = new Map();
const EDGE = /\b(?:import|export)\b[^'"]*?\bfrom\s*['"](\.{1,2}\/[^'"]+)['"]|\bimport\s*['"](\.{1,2}\/[^'"]+)['"]/g;
for (const f of files) {
  const src = readFileSync(f, 'utf8').replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
  const out = new Set();
  let m;
  while ((m = EDGE.exec(src))) {
    const target = resolve(dirname(f), m[1] || m[2]);
    if (target.endsWith('.js') && target.startsWith(SRC)) out.add(id(target));
  }
  edges.set(id(f), out);
}

// Tarjan, iterative in spirit but the tree is shallow enough to recurse.
let index = 0;
const stack = [], onStack = new Set(), idx = new Map(), low = new Map(), groups = [];
const connect = v => {
  idx.set(v, index); low.set(v, index); index++;
  stack.push(v); onStack.add(v);
  for (const w of edges.get(v) || []) {
    if (!idx.has(w)) { connect(w); low.set(v, Math.min(low.get(v), low.get(w))); }
    else if (onStack.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
  }
  if (low.get(v) === idx.get(v)) {
    const g = [];
    let w;
    do { w = stack.pop(); onStack.delete(w); g.push(w); } while (w !== v);
    groups.push(g.sort());
  }
};
for (const v of edges.keys()) if (!idx.has(v)) connect(v);

// `--path src/a.js src/b.js`: the shortest chain of imports from a to b, so
// the edge holding a file in a ring can be named rather than guessed at.
const at = process.argv.indexOf('--path');
if (at > 0) {
  const [from, to] = process.argv.slice(at + 1, at + 3);
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const v = queue.shift();
    if (v === to) break;
    for (const w of edges.get(v) || []) if (!prev.has(w)) { prev.set(w, v); queue.push(w); }
  }
  if (!prev.has(to)) console.log(`no path from ${from} to ${to}`);
  else {
    const chain = [];
    for (let v = to; v; v = prev.get(v)) chain.unshift(v);
    console.log(chain.join(' -> '));
  }
  process.exit(0);
}

const rings = groups.filter(g => g.length > 1).sort((a, b) => b.length - a.length);
console.log(`${edges.size} modules, ${rings.length} group${rings.length === 1 ? '' : 's'} of two or more`);
for (const g of rings) console.log(`  ${g.length}: ${g[0]} ...`);
const show = process.argv.includes('--all') ? rings : rings.slice(0, 1);
for (const g of show) {
  console.log(`\nthe group of ${g.length}:`);
  for (const f of g) console.log(`  ${f}`);
}
