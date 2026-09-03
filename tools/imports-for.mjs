// Scratch helper for the render.js/crew.js split. Given the core module and a
// candidate extracted file, print the import lines the candidate needs: the
// re-imports of names the core imports, plus the core's own locally-defined
// names the candidate still uses (ctx, drawMark, withRise, ...). Not part of the
// game; delete when the split is done.
import { readFileSync } from 'node:fs';

const [srcPath, candPath] = process.argv.slice(2);
const src = readFileSync(srcPath, 'utf8');
const cand = readFileSync(candPath, 'utf8');
const coreName = srcPath.split(/[\\/]/).pop();     // e.g. render.js

function idents(code) {
  const stripped = code
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^']*'/g, "''")
    .replace(/"[^"]*"/g, '""')
    .replace(/`[^`]*`/g, '``');
  return new Set(stripped.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || []);
}

// 1. Names the core imports, mapped to their module.
const map = new Map();
const re = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
let m;
while ((m = re.exec(src))) {
  const mod = m[2];
  for (let part of m[1].split(',')) {
    part = part.trim();
    if (!part) continue;
    const local = part.split(/\s+as\s+/).pop().trim();
    map.set(local, mod);
  }
}

// 2. Names the core EXPORTS -- only these are importable from it.
const localDefs = new Set();
const expRe = /^\s*export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;
while ((m = expRe.exec(src))) localDefs.add(m[1]);
// `export { a, b }` lists
const expList = /^\s*export\s*\{([^}]*)\}\s*;?\s*$/gm;
while ((m = expList.exec(src))) for (let p of m[1].split(',')) { p = p.trim().split(/\s+as\s+/).pop().trim(); if (p) localDefs.add(p); }

// Names the candidate itself defines (do not self-import).
const candDefs = new Set();
const defRe = /^\s*(?:export\s+)?(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;
while ((m = defRe.exec(cand))) candDefs.add(m[1]);

const used = idents(cand);

const byMod = new Map();
const add = (mod, name) => { if (!byMod.has(mod)) byMod.set(mod, new Set()); byMod.get(mod).add(name); };

for (const name of used) {
  if (candDefs.has(name)) continue;
  if (map.has(name)) add(map.get(name), name);
  else if (localDefs.has(name)) add('__CORE__', name);
}

const rows = [];
for (const [mod, names] of byMod) {
  if (mod === '__CORE__') continue;
  const rebased = mod.startsWith('./') ? '../' + mod.slice(2) : mod;
  rows.push([rebased, [...names].sort()]);
}
rows.sort((a, b) => a[0].localeCompare(b[0]));
for (const [mod, names] of rows) console.log(`import { ${names.join(', ')} } from '${mod}';`);
if (byMod.has('__CORE__')) {
  console.log(`import { ${[...byMod.get('__CORE__')].sort().join(', ')} } from '../${coreName}';`);
}
