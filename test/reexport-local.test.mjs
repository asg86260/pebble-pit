// `export { a as b } from './x.js'` passes a name through without binding it in
// the module, so a use of `b` further down throws only when that line runs. The
// deep's kit halo did, on a rung climb, and no other check reached the line.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []);

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  .replace(/`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/g, '""');

test('no module uses a name it only passes through with export … from', () => {
  const bad = [];
  for (const f of files('src')) {
    const src = strip(readFileSync(f, 'utf8'));
    const passed = [];
    const rest = src.replace(/export\s*\{([^}]*)\}\s*from\s*""\s*;?/g, (_, list) => {
      for (const part of list.split(',')) {
        const name = part.trim().split(/\s+as\s+/).pop();
        if (name) passed.push(name);
      }
      return '';
    });
    for (const name of passed) {
      const bound = new RegExp(`(?:import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}|\\b(?:const|let|var|function|class)\\s+${name}\\b)`).test(rest);
      if (!bound && new RegExp(`(?<![\\w$.])${name}\\b`).test(rest)) bad.push(`${f}: ${name}`);
    }
  }
  assert.deepEqual(bad, []);
});
