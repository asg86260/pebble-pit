// A rough check that every module can see the names it uses.
//
// It is not a type checker: it strips comments and strings, collects everything
// a file declares, imports or takes as a parameter, and reports the rest. False
// positives are cheap; a missing import that only shows up when a particular
// code path runs is not.
//
//   node tools/unresolved.mjs

import { readFileSync, readdirSync } from 'node:fs';

const GLOBALS = new Set(`Math Object Array String Number Boolean JSON Date Promise Set Map
Uint8Array document window console performance requestAnimationFrame setInterval setTimeout
clearTimeout addEventListener removeEventListener dispatchEvent WeakMap innerWidth innerHeight devicePixelRatio
localStorage visualViewport PointerEvent KeyboardEvent Infinity NaN undefined parseInt
parseFloat isNaN location navigator Error`.split(/\s+/));

const KEYWORDS = new Set(`new typeof instanceof return if else for while do switch case break
continue function const let var class extends export import from default try catch finally as
throw delete void in of async await yield static get set null true false this`.split(/\s+/));

const declared = src => {
  const n = new Set();
  const add = s => s && n.add(s.trim());
  const each = (re, f) => { let m; while ((m = re.exec(src))) f(m); };

  each(/\b(?:function|class)\s+([A-Za-z_$][\w$]*)/g, m => add(m[1]));
  // a declaration list: `const a = 1, b = 2;` declares both of them
  each(/\b(?:const|let|var)\s+([^;\n]+)/g, m => {
    let depth = 0, part = '';
    for (const ch of m[1]) {
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth--;
      if (ch === ',' && depth === 0) { add(part.split(/[=:]/)[0]); part = ''; continue; }
      part += ch;
    }
    add(part.split(/[=:]/)[0]);
  });
  // `for (const x of xs)` declares x, not the rest of the line
  each(/\bfor\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s+(?:of|in)\b/g, m => add(m[1]));
  each(/\bfor\s*\(\s*(?:const|let|var)\s*\[([^\]]*)\]\s+(?:of|in)\b/g, m =>
    m[1].split(',').forEach(add));
  each(/\b(?:const|let|var)\s*\{([^}]*)\}/g, m =>
    m[1].split(',').forEach(p => add(p.split(':').pop())));
  each(/\b(?:const|let|var)\s*\[([^\]]*)\]/g, m => m[1].split(',').forEach(add));
  each(/import\s*\{([^}]*)\}\s*from/g, m =>
    m[1].split(',').forEach(p => add(p.split(' as ').pop())));
  // a barrel's `export { x } from './leaf.js'` names x without using it
  each(/export\s*\{([^}]*)\}\s*from/g, m =>
    m[1].split(',').forEach(p => add(p.split(' as ')[0])));
  each(/import\s+([A-Za-z_$][\w$]*)\s+from/g, m => add(m[1]));
  each(/function\s*\w*\s*\(([^)]*)\)/g, m =>
    m[1].split(',').forEach(p => add(p.split(/[=:]/)[0].replace(/^\.+/, ''))));
  each(/\(([^()]*)\)\s*=>/g, m =>
    m[1].split(',').forEach(p => add(p.split(/[=:]/)[0].replace(/^\.+/, ''))));
  each(/([A-Za-z_$][\w$]*)\s*=>/g, m => add(m[1]));
  each(/catch\s*\(\s*([A-Za-z_$][\w$]*)/g, m => add(m[1]));
  // a destructured array parameter: `([a, b], i) => ...` declares a and b
  each(/\(\s*\[([^\]]*)\]/g, m => m[1].split(',').forEach(add));
  // a destructured parameter: `function f({ a, b })` declares a and b
  each(/(?:function\s*\w*\s*|=>\s*|\(\s*)\{([^{}]*)\}\s*\)/g, m =>
    m[1].split(',').forEach(p => add(p.split(/[=:]/).pop())));
  return n;
};

// Walk the tree: the barrels' leaves live in subdirectories now, and a check
// that only reads the top level shrinks toward nothing as they fill up. The
// browser suite checks itself, so selftest stays out.
const files = [];
const walk = dir => {
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.isDirectory()) { if (e.name !== 'selftest') walk(`${dir}/${e.name}`); continue; }
    if (e.name.endsWith('.js') && e.name !== 'selftest.js') files.push(`${dir}/${e.name}`);
  }
};
walk('src');

let bad = 0;
for (const path of files) {
  const f = path.slice(4);   // drop 'src/' so the report reads as it always has
  const src = readFileSync(path, 'utf8');
  const bare = src
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');

  const known = declared(src);
  const missing = new Set();
  for (const m of bare.matchAll(/(?<![\w.$])([A-Za-z_$][\w$]*)/g)) {
    const w = m[1];
    if (known.has(w) || GLOBALS.has(w) || KEYWORDS.has(w)) continue;
    if (bare.slice(m.index + w.length).match(/^\s*:/)) continue;   // an object key
    missing.add(w);
  }
  if (missing.size) {
    bad++;
    console.log(`${f.padEnd(13)} ${[...missing].sort().join(' ')}`);
  }
}
console.log(bad ? `\n${bad} file(s) with names they cannot see` : 'every module can see what it uses');
