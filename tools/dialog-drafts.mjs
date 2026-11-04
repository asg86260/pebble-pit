// MOCK gods-opening-lines
// The review bench's dialog editor, on the dev server: a draft script's lines
// read out of locales/en.ftl, and written back with the script's line list in
// src/dialogdrafts.js and the wording inventory, so a save leaves the tree as
// the language checks want it (test/l10n.test.mjs: every message asked for by
// a literal in src/, the inventory the language file, no placeholder).
//
// Only the block between the MOCK draft-god markers is ever rewritten; the
// rest of the file is left byte for byte, its CRLFs with it. A script is the
// messages `<key>-<n>`, in order, numbered 1.. on every save, so an add, a
// cut or a move is a renumbering and the list in src/ is derived from it.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FluentResource } from '@fluent/bundle';
import { inventory } from './wording/inventory.mjs';

const BEGIN = /^# --- MOCK draft-god: begin\b.*$/m, END = /^# --- MOCK draft-god: end ---$/m;
const SRC_BEGIN = '  // BEGIN SCRIPTS', SRC_END = '  // END SCRIPTS';
export const KEY = /^draft-god-[a-z]$/;
const MAX_LINES = 12, MAX_CHARS = 200;

// The block's messages, in file order: { id, key, n, text, note }.
function messages(block) {
  const out = [];
  let note = '';
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith('# ')) { note = line.slice(2); continue; }
    const m = line.match(/^((draft-god-[a-z])-(\d+)) = (.*)$/);
    if (m) out.push({ id: m[1], key: m[2], n: +m[3], text: unescape(m[4]), note });
    if (!line.trim()) note = '';
  }
  return out;
}
// Fluent's text with its quoted braces back to plain.
const unescape = s => s.replace(/\{"([{}])"\}/g, '$1');

function split(ftl) {
  const b = ftl.search(BEGIN), e = ftl.search(END);
  if (b < 0 || e < b) throw new Error('locales/en.ftl has no MOCK draft-god block');
  const head = ftl.indexOf('\n', b) + 1;
  return { pre: ftl.slice(0, head), block: ftl.slice(head, e), post: ftl.slice(e) };
}

export function readScript(root, key) {
  if (!KEY.test(key)) throw new Error(`not a draft script: ${key}`);
  const ftl = readFileSync(join(root, 'locales/en.ftl'), 'utf8');
  return messages(split(ftl).block).filter(m => m.key === key).sort((a, b) => a.n - b.n).map(m => ({ id: m.id, text: m.text }));
}

// A line the owner typed, checked: one line of plain words, nothing Fluent
// would read as markup, never a placeholder.
function clean(t) {
  const s = String(t).replace(/\s+/g, ' ').trim();
  if (!s) throw new Error('a line is empty: cut it instead');
  if (s.length > MAX_CHARS) throw new Error(`a line is over ${MAX_CHARS} characters`);
  if (/[{}]/.test(s)) throw new Error('a line has a { or }');
  if (/^[[.]/.test(s)) throw new Error('a line starts with [ or .');
  // MOCK dialog-sauce: the words' effects are marks in pairs round words, the
  // marks of FX_MARKS in src/dialogsauce.js (*wave* _shake_ ^glow^ ~slow~
  // =rainbow= +pulse+ %nervous% |drop| #boom# @trail@), so a * may open a line
  // when it opens an effect, and every mark must be closed
  if (/^\*/.test(s) && !/^\*[^*]+\*/.test(s)) throw new Error('a line starts with a * that opens no effect');
  for (const m of '*_^~=+%|#@') if ((s.split(m).length - 1) % 2) throw new Error(`a line has a ${m} not closed: effects come in pairs, like *wave* or #boom#`);
  if (/\[owner'?s words/i.test(s)) throw new Error('a line is a placeholder');
  return s;
}

// The scripts as src/dialogdrafts.js lists them, every script in the block.
function scriptsSource(msgs) {
  const keys = [...new Set(msgs.map(m => m.key))].sort();
  return keys.map(k => {
    const ids = msgs.filter(m => m.key === k).sort((a, b) => a.n - b.n).map(m => `    { who: 'god', id: '${m.id}' }`);
    return `  '${k}': [\n${ids.join(',\n')}\n  ]`;
  }).join(',\n');
}

export function writeScript(root, key, lines) {
  if (!KEY.test(key)) throw new Error(`not a draft script: ${key}`);
  if (!Array.isArray(lines) || !lines.length) throw new Error('a script needs a line');
  if (lines.length > MAX_LINES) throw new Error(`a script is at most ${MAX_LINES} lines`);
  const words = lines.map(clean);
  const ftlPath = join(root, 'locales/en.ftl'), srcPath = join(root, 'src/dialogdrafts.js');
  const ftl = readFileSync(ftlPath, 'utf8'), nl = ftl.includes('\r\n') ? '\r\n' : '\n';
  const { pre, block, post } = split(ftl);
  const msgs = messages(block);
  const mine = msgs.filter(m => m.key === key);
  if (!mine.length) throw new Error(`no script ${key} in locales/en.ftl`);
  // each line's note says which script and which line: the first line's, renumbered
  const label = mine.sort((a, b) => a.n - b.n)[0].note.replace(/, line \d+$/, '');
  const fresh = words.map((text, i) => ({ id: `${key}-${i + 1}`, key, n: i + 1, text, note: `${label}, line ${i + 1}` }));
  // the scripts in the block's own order, this one replaced where it stood
  const order = [...new Set(msgs.map(m => m.key))];
  const all = order.flatMap(k => (k === key ? fresh : msgs.filter(m => m.key === k).sort((a, b) => a.n - b.n)));
  const body = [''].concat(all.flatMap(m => [`# ${m.note}`, `${m.id} = ${m.text}`, ''])).join(nl) + nl;
  const next = pre + body + post;
  // the block as Fluent reads it, before anything is written
  const res = new FluentResource(body);
  if (res.body.length !== all.length) throw new Error('a line does not read as one message');
  const src = readFileSync(srcPath, 'utf8'), sb = src.indexOf(SRC_BEGIN), se = src.indexOf(SRC_END);
  if (sb < 0 || se < sb) throw new Error('src/dialogdrafts.js has no SCRIPTS block');
  const snl = src.includes('\r\n') ? '\r\n' : '\n';
  const listed = src.slice(0, src.indexOf('\n', sb) + 1) + scriptsSource(all).replace(/\n/g, snl) + snl + src.slice(se);
  // the words, then the list (the write the bench's reload follows), then the
  // inventory, which reads where each id is asked for off the list
  writeFileSync(ftlPath, next);
  writeFileSync(srcPath, listed);
  writeFileSync(join(root, 'docs/wording-inventory.json'), JSON.stringify(inventory(), null, 1) + '\n');
  return fresh.map(m => ({ id: m.id, text: m.text }));
}
