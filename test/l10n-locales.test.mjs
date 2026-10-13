// Every translation keeps faith with the English (DESIGN.md, "Localization
// phase two", section 8). Over every `locales/*.ftl` but en.ftl:
//
//   parses: no junk Fluent passes over, no error from addResource
//   nothing stale: every message and attribute is one en.ftl has
//   nothing dropped: each message uses exactly the English's variables
//   same markup: each `<br>` and each `data-l10n-name` element kept
//   selectors have their default: every select has a `*` variant
//   missing is reported, not red -- unless the language is `ready`
//
// And the table (locales/languages.json) names every file, and the faces it
// names are the ones the stylesheet's `:lang` blocks write.
//
// No yard: this is about the files.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { FluentBundle, FluentResource } from '@fluent/bundle';
import { faceFamily } from '../src/languages.js';

const TABLE = JSON.parse(readFileSync('locales/languages.json', 'utf8'));
const FILES = readdirSync('locales').filter(f => f.endsWith('.ftl')).map(f => f.slice(0, -4)).sort();
const OTHERS = FILES.filter(c => c !== 'en');

function load(code) {
  const text = readFileSync(`locales/${code}.ftl`, 'utf8');
  const res = new FluentResource(text);
  const b = new FluentBundle(code, { useIsolating: false });
  const errors = b.addResource(res).map(e => e.message);
  const ids = [...text.matchAll(/^(-?[a-zA-Z][\w-]*) *=/gm)].map(m => m[1]);
  return { text, res, b, errors, ids };
}
const EN = load('en');

// Each message and each attribute, `id` and `id.attr`, with its pattern.
function patterns({ res }) {
  const out = new Map();
  for (const m of res.body) {
    if (m.id.startsWith('-')) continue;
    if (m.value != null) out.set(m.id, m.value);
    for (const [a, p] of Object.entries(m.attributes || {})) out.set(`${m.id}.${a}`, p);
  }
  return out;
}
const EN_P = patterns(EN);

// What a pattern carries that a translation must keep: its variables (across
// every variant), its <br>s and its named elements; and any select lacking
// its default.
function walk(p) {
  const vars = new Set(), text = [];
  let noStar = 0;
  const go = n => {
    if (n == null) return;
    if (typeof n === 'string') { text.push(n); return; }
    if (Array.isArray(n)) { n.forEach(go); return; }
    if (typeof n !== 'object') return;
    if (n.type === 'var') vars.add(n.name);
    if (n.type === 'select' && typeof n.star !== 'number') noStar++;
    if (n.type === 'str') text.push(n.value);
    for (const v of Object.values(n)) if (v && typeof v === 'object') go(v);
  };
  go(p);
  const all = text.join('');
  const brs = (all.match(/<br\s*\/?>/gi) || []).length;
  const named = [...all.matchAll(/data-l10n-name="([^"]+)"/g)].map(m => m[1]).sort();
  return { vars: [...vars].sort(), brs, named, noStar };
}

test('the table names every file, and English is ready', () => {
  const codes = TABLE.map(r => r.code);
  assert.deepEqual(FILES.filter(c => !codes.includes(c)), [], 'a file with no row in locales/languages.json');
  assert.equal(TABLE.find(r => r.code === 'en')?.ready, true);
  for (const r of TABLE) {
    assert.ok(r.name && Array.isArray(r.steam) && Array.isArray(r.match) && typeof r.ready === 'boolean', `${r.code}: a row wants a name, steam, match and ready`);
  }
});

test('the faces the table names are the ones the stylesheet writes', () => {
  const css = readFileSync('src/style.css', 'utf8');
  for (const r of TABLE.filter(r => r.face)) {
    const lang = r.code.split('-')[0];
    const rule = css.match(new RegExp(`:lang\\(${lang}\\)\\s*\\{([^}]*)\\}`))?.[1] || '';
    assert.match(rule, new RegExp(`"${faceFamily(r)}"`), `${r.code}: style.css's :lang(${lang}) names ${faceFamily(r)}`);
  }
});

for (const code of OTHERS) {
  const tr = load(code);
  const TR_P = patterns(tr);
  const ready = !!TABLE.find(r => r.code === code)?.ready;

  test(`${code}: parses, every message once`, () => {
    assert.deepEqual(tr.errors, []);
    const lost = tr.ids.filter(id => !(id.startsWith('-') ? tr.res.body.some(m => m.id === id) : tr.b.hasMessage(id)));
    assert.deepEqual(lost, [], 'lines Fluent read as junk');
    assert.equal(new Set(tr.ids).size, tr.ids.length, 'an id twice');
  });

  test(`${code}: nothing stale, nothing dropped, the same markup, every default`, () => {
    const wrong = [];
    for (const [id, p] of TR_P) {
      if (!EN_P.has(id)) { wrong.push(`${id}: not in en.ftl`); continue; }
      const want = walk(EN_P.get(id)), got = walk(p);
      if (want.vars.join() !== got.vars.join()) wrong.push(`${id}: variables { ${got.vars.join(', ')} }, English has { ${want.vars.join(', ')} }`);
      if (want.brs !== got.brs) wrong.push(`${id}: ${got.brs} <br>, English has ${want.brs}`);
      if (want.named.join() !== got.named.join()) wrong.push(`${id}: named [${got.named}], English has [${want.named}]`);
      if (got.noStar) wrong.push(`${id}: a select with no * default`);
    }
    assert.deepEqual(wrong, []);
  });

  test(`${code}: missing messages${ready ? ' (ready: none may be)' : ' (reported)'}`, t => {
    const missing = [...EN_P.keys()].filter(id => !TR_P.has(id));
    t.diagnostic(`${code}: ${missing.length} of ${EN_P.size} missing${missing.length ? ': ' + missing.slice(0, 12).join(', ') + (missing.length > 12 ? ', ...' : '') : ''}`);
    if (ready) assert.deepEqual(missing, [], `${code} is ready, so every message is translated`);
  });
}
