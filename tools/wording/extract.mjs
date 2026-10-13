// Move string literals out of a source file and into locales/en.ftl, a list
// at a time (the localization's phase one; DESIGN.md, "Localization"). A list
// is a text file:
//
//   @group Sheets                     the en.ftl section the next lines go under
//   @file src/slots.js                the file the next lines are in
//   16 slots-since-now | context      line 16's one word-like literal
//   20 "a day ago" slots-day | ...    the literal on line 20 with that text
//   39 `rock ${}` slots-rock vars=n | the template, its holes named in order
//
// Each literal is replaced with `msg('id')` (or `msg('id', { n: <hole> })`),
// the message is appended to its section with the context as its comment,
// `import { msg }` is added to the file, and the literal as it read is
// recorded in test/fixtures/wording-before.json, which the guard renders
// every message against. A hole that is a plain name keeps that name.
//
//   node tools/wording/extract.mjs <list> [--dry]

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { relative, dirname, posix } from 'node:path';
import { literals } from './strings.mjs';

const FTL = 'locales/en.ftl';
const BEFORE = 'test/fixtures/wording-before.json';
const dry = process.argv.includes('--dry');
const list = readFileSync(process.argv[2], 'utf8').split(/\r?\n/);

// A JavaScript literal's body, unescaped.
function unescape(s) {
  return s.replace(/\\(u\{[0-9a-f]+\}|u[0-9a-f]{4}|x[0-9a-f]{2}|.)/gi, (m, e) => {
    if (e[0] === 'u' && e[1] === '{') return String.fromCodePoint(parseInt(e.slice(2, -1), 16));
    if (e[0] === 'u' && e.length === 5) return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e[0] === 'x' && e.length === 3) return String.fromCharCode(parseInt(e.slice(1), 16));
    return { n: '\n', t: '\t', r: '\r', '0': '\0' }[e] ?? e;
  });
}

// Text as a Fluent value: braces escaped, and a space at either end kept by
// a placeable (Fluent trims bare ones).
const braces = s => s.replace(/[{}]/g, c => `{"${c}"}`);
function edges(t) {
  t = t.replace(/^ +/, m => `{"${m}"}`).replace(/ +$/, m => `{"${m}"}`);
  return t;
}
export const ftlText = s => edges(braces(s));

// The holes of a template literal in the source, as expression text.
function holesOf(src, start) {
  // `start` is the index of the opening backtick
  const holes = [];
  let i = start + 1;
  while (src[i] !== '`') {
    if (src[i] === '\\') { i += 2; continue; }
    if (src[i] === '$' && src[i + 1] === '{') {
      let depth = 0, j = i + 2;
      for (; j < src.length; j++) {
        const c = src[j];
        if (c === '{') depth++;
        else if (c === '}') { if (depth === 0) break; depth--; }
        else if (c === '`' || c === '"' || c === "'") {   // a string inside a hole
          const q = c; j++;
          while (src[j] !== q) { if (src[j] === '\\') j++; j++; }
        }
      }
      holes.push(src.slice(i + 2, j).trim());
      i = j + 1;
      continue;
    }
    i++;
  }
  return { holes, end: i + 1 };
}

const INV = existsSync('docs/wording-inventory.json') ? JSON.parse(readFileSync('docs/wording-inventory.json', 'utf8')) : [];
const invOf = new Map(INV.map(s => [s.id.replace(/\./g, '-'), s]));
const before = existsSync(BEFORE) ? JSON.parse(readFileSync(BEFORE, 'utf8')) : { inventory: [], extracted: {} };
let ftl = readFileSync(FTL, 'utf8');
const ftlIds = new Set([...ftl.matchAll(/^([a-zA-Z][\w-]*) =/gm)].map(m => m[1]));

function addMessage(group, id, context, value) {
  if (ftlIds.has(id)) {
    // the same words again, said from another place: one message
    const had = ftl.match(new RegExp(`^${id} = (.*)$`, 'm'))?.[1];
    if (had === value) return;
    throw new Error(`${id} is already in ${FTL}, as ${had}`);
  }
  ftlIds.add(id);
  const block = (context ? `# ${context}\n` : '') + `${id} = ${value}\n`;
  const head = `## ${group}\n`;
  const at = ftl.indexOf(head);
  if (at < 0) { ftl = ftl.replace(/\n*$/, '\n\n') + head + '\n' + block; return; }
  // the end of the section: the next group header, or the end of the file
  const next = ftl.indexOf('\n## ', at + head.length);
  const end = next < 0 ? ftl.length : next + 1;
  const body = ftl.slice(0, end).replace(/\n*$/, '\n');
  ftl = body + '\n' + block + (next < 0 ? '' : '\n' + ftl.slice(end));
}

let group = 'Other', file = null, src = null, edits = [];
const writes = new Map();   // every file at the end, or none: a list that fails part way writes nothing
function flush() {
  if (!file) return;
  // last first, so the offsets of the earlier ones hold
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) src = src.slice(0, e.start) + e.text + src.slice(e.end);
  if (edits.length && !/import \{[^}]*\bmsg\b[^}]*\} from '[^']*lang\.js'/.test(src)) {
    let rel = posix.normalize(relative(dirname(file), 'src/lang.js').replace(/\\/g, '/'));
    if (!rel.startsWith('.')) rel = './' + rel;
    const line = `import { msg } from '${rel}';\n`;
    // the imports at the head of the file, not one further down
    const all = [...src.matchAll(/^import [^;]*?;[^\n]*\n/gms)];
    const imports = [];
    for (const m of all) {
      const prevEnd = imports.length ? imports.at(-1).index + imports.at(-1)[0].length : 0;
      const gap = src.slice(prevEnd, m.index);
      if (imports.length && !gap.split('\n').every(l => /^\s*(\/\/.*)?$/.test(l))) break;
      imports.push(m);
    }
    if (imports.length) { const last = imports[imports.length - 1]; const at = last.index + last[0].length; src = src.slice(0, at) + line + src.slice(at); }
    else {
      // after the header comment
      const m = src.match(/^(\/\/[^\n]*\n)*\n?/);
      src = src.slice(0, m[0].length) + line + (m[0].length ? '\n' : '') + src.slice(m[0].length);
    }
  }
  writes.set(file, src);
  edits = [];
}

for (const raw of list) {
  const line = raw.trim();
  if (!line || line.startsWith('//')) continue;
  if (line.startsWith('@group ')) { group = line.slice(7).trim(); continue; }
  if (line.startsWith('@file ')) { flush(); file = line.slice(6).trim(); src = readFileSync(file, 'utf8'); continue; }
  const m = line.match(/^(\d+)\s+(?:("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*')\s+)?([a-z][\w-]*)((?:\s+vars=[\w,]+)?)\s*(?:\|\s*(.*))?$/);
  if (!m) throw new Error(`cannot read: ${raw}`);
  const [, ln, quoted, id, varsPart, context] = m;
  const want = quoted ? unescape(quoted.slice(1, -1)) : null;
  const names = varsPart ? varsPart.trim().slice(5).split(',') : null;
  // the literal: its offsets in the source
  const lits = locate(src).filter(l => l.line === +ln);
  const { looksLikeCopy } = await import('./strings.mjs');
  let pick = want != null ? lits.filter(l => unescape(l.text) === want) : lits.filter(l => looksLikeCopy(l.text));
  if (want == null && pick.length !== 1) pick = pick.length ? pick : lits;
  if (pick.length < 1) throw new Error(`${file}:${ln}: no literal ${want ?? ''} (have ${lits.map(l => JSON.stringify(l.text)).join(', ')})`);
  const lit = pick[0];
  if (pick.length > 1 && !pick.every(p => p.text === lit.text)) throw new Error(`${file}:${ln}: ${pick.length} literals; name one`);
  if (pick.length > 1) {
    // the same words twice on a line: take the first not yet taken
    const taken = new Set(edits.map(e => e.start));
    const free = pick.find(p => !taken.has(p.start));
    Object.assign(lit, free);
  }
  let value, call, beforeText;
  if (lit.kind === 'tpl') {
    const { holes, end } = holesOf(src, lit.start);
    // split by the holes: rebuild the quasis from the raw source between holes
    const quasis = splitQuasis(src.slice(lit.start + 1, end - 1));
    const vn = holes.map((h, i) => names?.[i] ?? (/^[A-Za-z_$][\w$]*$/.test(h) ? h : null));
    if (vn.some(v => !v)) throw new Error(`${file}:${ln}: name the holes (${holes.join(' | ')})`);
    value = edges(quasis.map((q, i) => braces(unescape(q)) + (i < holes.length ? `{ $${vn[i]} }` : '')).join(''));
    beforeText = quasis.map((q, i) => unescape(q) + (i < holes.length ? '${' + vn[i] + '}' : '')).join('');
    const uniq = [...new Map(vn.map((v, i) => [v, holes[i]])).entries()];
    call = holes.length ? `msg('${id}', { ${uniq.map(([v, h]) => v === h ? v : `${v}: ${h}`).join(', ')} })` : `msg('${id}')`;
    lit.end = end;
  } else {
    const text = unescape(lit.text);
    value = ftlText(text);
    beforeText = text;
    call = `msg('${id}')`;
  }
  // a value fluent would read differently at its edges is fixed above; one
  // that is empty cannot be a message
  if (!beforeText.trim()) throw new Error(`${file}:${ln}: an empty literal is not a message`);
  const inv = invOf.get(id);
  addMessage(inv && !context && group === 'Other' ? inv.group : group, id, context?.trim() || inv?.context, value);
  before.extracted[id] = { text: beforeText, from: `${file}:${ln}` };
  edits.push({ start: lit.start, end: lit.end, text: call });
}
flush();

function splitQuasis(body) {
  const out = [];
  let cur = '', i = 0;
  while (i < body.length) {
    if (body[i] === '\\') { cur += body[i] + body[i + 1]; i += 2; continue; }
    if (body[i] === '$' && body[i + 1] === '{') {
      out.push(cur); cur = '';
      let depth = 0, j = i + 2;
      for (; j < body.length; j++) {
        const c = body[j];
        if (c === '{') depth++;
        else if (c === '}') { if (depth === 0) break; depth--; }
        else if (c === '`' || c === '"' || c === "'") { const q = c; j++; while (body[j] !== q) { if (body[j] === '\\') j++; j++; } }
      }
      i = j + 1;
      continue;
    }
    cur += body[i++];
  }
  out.push(cur);
  return out;
}

// The literals with their offsets: the lexer again, with positions.
function locate(source) {
  const out = [];
  const lits = literals(source);
  for (const l of lits) out.push(l);
  return out;
}

if (!dry) {
  for (const [f, s] of writes) writeFileSync(f, s);
  writeFileSync(FTL, ftl);
  writeFileSync(BEFORE, JSON.stringify(before, null, 1) + '\n');
} else console.log(ftl.slice(-3000));
