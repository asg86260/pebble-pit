// Scratch audit for the render.js/crew.js split: for each file, list called
// names that are neither defined locally nor imported nor a known global -- i.e.
// helpers a moved cluster can no longer see. Catches the latent cross-cluster
// helper dependency (`cell`) that unresolved.mjs missed. Delete after the split.
import { readFileSync } from 'node:fs';
const globals = new Set(['Math','Object','Array','String','Number','Boolean','JSON','Map','Set','console','window','document','globalThis','requestAnimationFrame','Infinity','NaN','undefined','isFinite','isNaN','parseInt','parseFloat','Float64Array','Float32Array','Uint8Array','Uint8ClampedArray','Uint16Array','Uint32Array','Int32Array','Date','Promise','structuredClone','if','for','while','switch','catch','function','return','super','this']);
for (const f of process.argv.slice(2)) {
  const code = readFileSync(f, 'utf8');
  const s = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '``');
  const defs = new Set(); let m;
  const dre = /(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g;
  while ((m = dre.exec(s))) defs.add(m[1]);
  // rough: also treat destructured names `const { a, b } =` and params `(a, b) =>`
  const imp = new Set(); const ire = /import\s*\{([^}]*)\}\s*from/g;
  while ((m = ire.exec(s))) for (let p of m[1].split(',')) { p = p.trim().split(/\s+as\s+/).pop().trim(); if (p) imp.add(p); }
  const called = new Set(); const cre = /(?<!\.)\b([A-Za-z_$][\w$]*)\s*\(/g;
  while ((m = cre.exec(s))) called.add(m[1]);
  const missing = [...called].filter(n => !defs.has(n) && !imp.has(n) && !globals.has(n));
  console.log(f.split(/[\\/]/).pop().padEnd(18), missing.join(' ') || '(none)');
}
