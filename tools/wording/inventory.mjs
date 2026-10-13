// docs/wording-inventory.json, written off locales/en.ftl: every message and
// every attribute of one, with its section (the file's `##` heading), the
// file that first asks for it (a file and not a line, so an edit elsewhere in
// that file leaves the inventory current), the comment over it, and its words with each
// argument as `${name}` -- the shape tools/wording-shots.mjs and its finder
// (tools/wording/page.js) read. The language file is the source, so the
// inventory, the shots and the game cannot drift apart.
//
//   node tools/wording/inventory.mjs           writes it
//   node tools/wording/inventory.mjs --check   exits 1 if it is not current

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FluentBundle, FluentResource } from '@fluent/bundle';

const FTL = 'locales/en.ftl';
const OUT = 'docs/wording-inventory.json';

export function inventory() {
  const text = readFileSync(FTL, 'utf8').replace(/\r\n/g, '\n');
  const bundle = new FluentBundle('en', { useIsolating: false });
  bundle.addResource(new FluentResource(text));

  // The sections and the comments, read off the file's lines.
  const meta = new Map();
  let group = '', comment = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) { group = line.slice(3).trim(); comment = []; continue; }
    if (line.startsWith('# ')) { comment.push(line.slice(2)); continue; }
    if (line === '#') { comment.push(''); continue; }
    const m = line.match(/^([a-zA-Z][\w-]*) =/);
    if (m) { meta.set(m[1], { group, context: comment.join(' ').trim() }); comment = []; continue; }
    if (!line.trim()) comment = [];
  }

  // Where each id is first asked for: a page's data-l10n-id, else the first
  // literal of it in src/.
  const where = new Map();
  for (const page of ['index.html', 'play.html']) {
    readFileSync(page, 'utf8').split('\n').forEach((l, i) => {
      for (const m of l.matchAll(/data-l10n-id="([^"]+)"/g)) if (!where.has(m[1])) where.set(m[1], page);
    });
  }
  const files = [];
  const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f).replace(/\\/g, '/'); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } };
  walk('src');
  files.sort();
  // a call first, `msg('id'`, and failing one any literal of the id (an id
  // picked by a condition, or kept in a table)
  for (const re of [/\bmsg\(\s*'([a-z][\w-]*(?:\.[\w-]+)?)'/g, /'([a-z][\w-]*(?:\.[\w-]+)?)'/g]) {
    for (const f of files) {
      readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
        if (/^\s*\/\//.test(l)) return;
        for (const m of l.matchAll(re)) if (meta.has(m[1].split('.')[0]) && !where.has(m[1])) where.set(m[1], f);
      });
    }
  }

  // The words, each argument standing as itself.
  const vars = pattern => {
    const out = new Set();
    const walkP = n => { if (!n || typeof n !== 'object') return; if (n.type === 'var') out.add(n.name); for (const v of Object.values(n)) walkP(v); };
    walkP(pattern);
    return [...out];
  };
  const words = pattern => bundle.formatPattern(pattern, Object.fromEntries(vars(pattern).map(v => [v, '${' + v + '}'])), []);

  const out = [];
  for (const [id, { group, context }] of meta) {
    const m = bundle.getMessage(id);
    if (!m) continue;
    if (m.value != null) out.push({ id, group, where: where.get(id) || '', context, text: words(m.value) });
    for (const [a, p] of Object.entries(m.attributes)) {
      const full = `${id}.${a}`;
      out.push({ id: full, group, where: where.get(full) || where.get(id) || '', context, text: words(p) });
    }
  }
  return out;
}

if (process.argv[1]?.endsWith('inventory.mjs')) {
  const now = JSON.stringify(inventory(), null, 1) + '\n';
  if (process.argv.includes('--check')) {
    const had = readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n');
    if (had !== now) { console.error(`${OUT} is not current: node tools/wording/inventory.mjs`); process.exit(1); }
    console.log(`${OUT} is current`);
  } else {
    writeFileSync(OUT, now);
    console.log(`${OUT}: ${JSON.parse(now).length} strings`);
  }
}
