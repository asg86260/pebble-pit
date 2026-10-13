// The language file is the only place a player's words are (DESIGN.md,
// "Localization"). Four things hold that true:
//
//   the file reads clean: every message parses, no line is junk Fluent skips
//   the words did not change: every message, given sample numbers and names,
//     reads exactly as the code read before the words moved out of it
//     (test/fixtures/wording-before.json, captured from the source as each
//     literal left it, plus the wording inventory as it stood)
//   every id the code asks for is a message, and every message is asked for
//   no sentence is left in src/ or a page: a string literal that reads as
//     words is in the file or on the allow list (test/fixtures/l10n-allow.json),
//     which is for words no player reads -- the dev panel, the console, a key
//
// No yard: this is about the files.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FluentBundle, FluentResource } from '@fluent/bundle';
import { literals, looksLikeCopy, devFacing } from '../tools/wording/strings.mjs';
import { msg, placeOf } from '../src/lang.js';
import { inventory } from '../tools/wording/inventory.mjs';

const FTL = readFileSync('locales/en.ftl', 'utf8');
const BEFORE = JSON.parse(readFileSync('test/fixtures/wording-before.json', 'utf8'));
const ALLOW = JSON.parse(readFileSync('test/fixtures/l10n-allow.json', 'utf8'));
const PAGES = ['play.html', 'index.html'];

const bundle = new FluentBundle('en', { useIsolating: false });
const dupes = bundle.addResource(new FluentResource(FTL));
const IDS = [...FTL.matchAll(/^([a-zA-Z][\w-]*) =/gm)].map(m => m[1]);
// A message's id and each of its attributes', `id.attr`.
const FULL = IDS.flatMap(id => [id, ...Object.keys(bundle.getMessage(id)?.attributes || {}).map(a => `${id}.${a}`)]);

const sourceFiles = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f).replace(/\\/g, '/');
    if (statSync(p).isDirectory()) sourceFiles(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
};
const SRC = sourceFiles('src');
const skipped = f => ALLOW.files.some(g => g.endsWith('/') ? f.startsWith(g) : f === g);

test('the language file parses, every message once', () => {
  assert.deepEqual(dupes.map(e => e.message), []);
  // Fluent passes over a line it cannot read as junk, silently: every
  // `id =` the file has must be a message the bundle holds.
  const lost = IDS.filter(id => !bundle.hasMessage(id));
  assert.deepEqual(lost, [], 'lines Fluent read as junk');
  assert.equal(new Set(IDS).size, IDS.length, 'an id twice');
});

// Sample arguments: `{ place: n }` is a number asked for as a place in a line.
const argsOf = a => Object.fromEntries(Object.entries(a || {}).map(([k, v]) => [k, v && typeof v === 'object' && 'place' in v ? placeOf(v.place) : v]));
// A literal's holes, `${name}`, come back as themselves.
const holesOf = text => Object.fromEntries([...text.matchAll(/\$\{(\w+)\}/g)].map(m => [m[1], '${' + m[1] + '}']));

test('every message reads as the words it replaced', () => {
  const wrong = [];
  for (const [id, { text }] of Object.entries(BEFORE.extracted)) {
    const got = msg(id, holesOf(text));
    if (got !== text) wrong.push(`${id}: ${JSON.stringify(got)} was ${JSON.stringify(text)}`);
  }
  for (const [id, cases] of Object.entries(BEFORE.cases || {})) {
    for (const c of cases) {
      const got = msg(id, argsOf(c.args));
      if (got !== c.text) wrong.push(`${id} ${JSON.stringify(c.args)}: ${JSON.stringify(got)} was ${JSON.stringify(c.text)}`);
    }
  }
  assert.deepEqual(wrong, []);
});

// A message's variables, read off its parsed pattern (selectors and all).
function varsOf(full) {
  const [id, attr] = full.split('.');
  const m = bundle.getMessage(id);
  const out = new Set();
  const walk = n => {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'var') out.add(n.name);
    for (const v of Object.values(n)) walk(v);
  };
  walk(attr ? m?.attributes[attr] : m?.value);
  return [...out];
}

// The inventory as it stood before the words moved (docs/wording-inventory.json
// at 45761258), each entry under the id it has now: its own id with the dots
// made dashes, or, where it became part of a message with arguments, what the
// fixture's `inventoryAs` says -- a message and its arguments (an argument
// may itself be a message, `{ msg, args }`), a run of `parts` joined as the
// code joins them, or null for a line the inventory wrote as a summary of
// two messages, each checked under its own id. A `${…}` reads as a slot.
test('the wording inventory reads the same', () => {
  const ents = s => s.replace(/&middot;/g, '·').replace(/&larr;/g, '←').replace(/&rarr;/g, '→').replace(/&amp;/g, '&');
  const slot = s => s.replace(/\$\{[^}]*\}/g, '\u0000');
  const argsOf = a => Object.fromEntries(Object.entries(a || {}).map(([k, v]) =>
    [k, v && typeof v === 'object' ? msg(v.msg, argsOf(v.args)) : v]));
  const say = (id, a) => {
    if (!FULL.includes(id)) return null;
    const args = argsOf(a);
    for (const n of varsOf(id)) if (!(n in args)) args[n] = '\u0000';
    return msg(id, args);
  };
  const wrong = [];
  for (const { id: old, text } of BEFORE.inventory) {
    const as = BEFORE.inventoryAs?.[old];
    if (as === null) continue;
    let got;
    if (as?.parts) got = as.parts.map(p => (typeof p === 'string' ? p : say(p[0], p[1]))).join(as.sep);
    else got = say(as?.id || old.replace(/\./g, '-'), as?.args);
    if (got == null) { wrong.push(`${old}: no message ${as?.id || old.replace(/\./g, '-')}`); continue; }
    const want = slot(ents(text)).replace(/<span id="savedin"><\/span>/, '<span data-l10n-name="time"></span>');
    if (slot(got) !== want) wrong.push(`${old}: ${JSON.stringify(slot(got))} was ${JSON.stringify(want)}`);
  }
  assert.deepEqual(wrong, []);
});

// The ids the code asks for: every `msg('…')` with a literal id, and every
// `data-l10n-id` on a page. A message is used when its id stands as a
// literal anywhere in src/ or on a page (an id picked by a condition is two
// literals, each standing).
const asked = [];
const standing = new Set();
for (const f of SRC) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\bmsg\(\s*'([a-z][\w.-]*)'/g)) asked.push([f, m[1]]);
  for (const l of literals(src)) standing.add(l.text);
}
for (const p of PAGES) {
  for (const m of readFileSync(p, 'utf8').matchAll(/data-l10n-id="([^"]+)"/g)) { asked.push([p, m[1]]); standing.add(m[1]); }
}
// The shell says a few of its own (the carry-over dialog), off the same file.
for (const f of readdirSync('electron').filter(f => f.endsWith('.cjs'))) {
  for (const l of literals(readFileSync(join('electron', f), 'utf8'))) standing.add(l.text);
}

test('every id the code asks for is a message, and every message is asked for', () => {
  const missing = asked.filter(([, id]) => !FULL.includes(id)).map(([f, id]) => `${f}: ${id}`);
  assert.deepEqual(missing, [], 'asked for, not in locales/en.ftl');
  const unused = IDS.filter(id => !standing.has(id) && !FULL.some(f => f.startsWith(id + '.') && standing.has(f)));
  assert.deepEqual(unused, [], 'in locales/en.ftl, asked for by nothing');
});

test('no words are left in the code', () => {
  const left = [];
  for (const f of SRC) {
    if (skipped(f)) continue;
    const allowed = new Set(ALLOW.strings[f] || []);
    const src = readFileSync(f, 'utf8'), lines = src.split('\n');
    for (const l of literals(src)) {
      if (!looksLikeCopy(l.text) || allowed.has(l.text)) continue;
      // said to the developer: the line it is on, or the one it continues
      if (devFacing((lines[l.line - 2] || '') + lines[l.line - 1])) continue;
      left.push(`${f}:${l.line} ${JSON.stringify(l.text)}`);
    }
  }
  assert.deepEqual(left, []);
});

// The allow list says why for each file, and names nothing that has gone: an
// entry left behind when its string moved is an entry a new sentence could
// hide behind.
test('the allow list is current', () => {
  const stale = [];
  for (const [f, list] of Object.entries(ALLOW.strings)) {
    if (!ALLOW.why[f]) stale.push(`${f}: no reason given`);
    const have = new Set(literals(readFileSync(f, 'utf8')).map(l => l.text));
    for (const s of list) if (!have.has(s)) stale.push(`${f}: ${JSON.stringify(s)} is not there`);
  }
  for (const f of ALLOW.files) if (!ALLOW.why[f] && !/^src\/(dev|selftest|hooks|console|scenes|scenesheet|report|verify)\.js$|\/$/.test(f)) stale.push(`${f}: no reason given`);
  assert.deepEqual(stale, []);
});

// On a page: a text node with a letter in it stands inside an element that
// names its message, and so does every attribute a player reads.
test('no words are left on the pages', () => {
  const left = [];
  for (const p of PAGES) {
    const html = readFileSync(p, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<!doctype[^>]*>/i, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
    const stack = [];
    for (const m of html.matchAll(/<(\/?)([a-zA-Z0-9]+)([^>]*?)(\/?)>|([^<]+)/g)) {
      const [, close, tag, attrs, self, text] = m;
      if (text != null) {
        const t = text.replace(/&[a-z]+;|&#\d+;/g, ' ').trim();
        if (/[a-z]{2}/i.test(t) && !stack.some(e => e.named)) left.push(`${p}: ${JSON.stringify(t)} in <${stack.at(-1)?.tag}>`);
        continue;
      }
      const named = /data-l10n-id=/.test(attrs);
      for (const a of ['placeholder', 'aria-label', 'title', 'alt']) {
        const v = attrs.match(new RegExp(`\\s${a}="([^"]*)"`))?.[1];
        if (v && /[a-z]{2}/i.test(v) && !named) left.push(`${p}: ${a}="${v}" on <${tag}>`);
      }
      if (close) { while (stack.length && stack.pop().tag !== tag); continue; }
      if (self || /^(meta|link|input|br|img|path|rect)$/i.test(tag)) continue;
      stack.push({ tag, named });
    }
  }
  assert.deepEqual(left, []);
});

// The inventory is written off the language file (tools/wording/inventory.mjs),
// so the shots and the wording page read what the game says.
test('the wording inventory is the language file', () => {
  const had = JSON.parse(readFileSync('docs/wording-inventory.json', 'utf8'));
  assert.deepEqual(had, inventory(), 'run: node tools/wording/inventory.mjs');
});

// A line nobody has written yet is never shipped as a stand-in: the owner
// would rather read plain words than a bracketed note in the real game.
test('no message is a placeholder', () => {
  const marked = FTL.split('\n').filter(l => !l.startsWith('#') && /\[owner'?s words/i.test(l));
  assert.deepEqual(marked, []);
});
