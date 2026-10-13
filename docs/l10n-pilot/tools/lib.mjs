// What the pilot's tools share: the sample, a message's leaves (every select
// hoisted out, so each leaf is one plain sentence), the target language's
// plural categories, a serializer back to Fluent, a render with fixed
// arguments for scoring, chrF, and a display width.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dep } from './engine-deps.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = path.resolve(ROOT, '..', '..');
export const LANGS = ['de', 'fr', 'es', 'pt-BR', 'ru', 'zh-CN', 'ja', 'ko'];
export const NAMES = { de: 'German', fr: 'French', es: 'Spanish (neutral)', 'pt-BR': 'Brazilian Portuguese', ru: 'Russian', 'zh-CN': 'Simplified Chinese', ja: 'Japanese', ko: 'Korean' };

const syntax = await dep('@fluent/syntax');
const bundle = await dep('@fluent/bundle');
export const { parse, Resource } = syntax;

export const SAMPLE = fs.readFileSync(path.join(ROOT, 'sample.txt'), 'utf8')
  .split('\n').map(l => l.replace(/#.*/, '').trim()).filter(Boolean);

// The English sample, message by message, with the comment over each.
export function englishSample() {
  const res = parse(fs.readFileSync(path.join(REPO, 'locales', 'en.ftl'), 'utf8'), { withSpans: false });
  const byId = new Map(res.body.filter(e => e.type === 'Message').map(m => [m.id.name, m]));
  return SAMPLE.map(id => { const m = byId.get(id); if (!m) throw new Error('not in en.ftl: ' + id); return m; });
}
export function messagesOf(text) {
  const res = parse(text, { withSpans: false });
  return { res, junk: res.body.filter(e => e.type === 'Junk'), byId: new Map(res.body.filter(e => e.type === 'Message').map(m => [m.id.name, m])) };
}

// The numbers the game hands a message as numbers; every other variable is a
// string (a name, a phrase, a formatted number with its sign).
export const NUMERIC = new Set(['n', 'm', 'h', 'd', 'count', 'total', 'left', 'mins', 'secs', 'v', 'x', 'now', 'next', 'used', 'ours', 'nth']);

// Every pattern a message carries: its value and each attribute.
export function patternsOf(msg) {
  const out = [];
  if (msg.value) out.push(['', msg.value]);
  for (const a of msg.attributes) out.push(['.' + a.id.name, a.value]);
  return out;
}

// A selector's kind: an English plural (one/other), an ordinal (English
// cardinal never says two or few), or exact keys kept as they are.
export function selectorKind(sel) {
  const keys = sel.variants.map(v => v.key.type === 'NumberLiteral' ? v.key.value : v.key.name);
  if (keys.some(k => /^\d/.test(k)) || keys.some(k => !['zero', 'one', 'two', 'few', 'many', 'other'].includes(k))) return 'exact';
  if (keys.includes('two') || keys.includes('few')) return 'ordinal';
  return 'plural';
}
const keyOf = v => v.key.type === 'NumberLiteral' ? v.key.value : v.key.name;

// The leaves of a pattern: [{ path: [[var, key]...], elements }], every
// select hoisted, so a leaf is one sentence with only text, variables and
// literals in it.
export function leaves(pattern) {
  let acc = [{ path: [], elements: [] }];
  for (const el of pattern.elements) {
    if (el.type === 'Placeable' && el.expression.type === 'SelectExpression') {
      const sel = el.expression;
      const name = sel.selector.id.name;
      const next = [];
      for (const a of acc) {
        const known = a.path.find(p => p[0] === name);
        for (const v of sel.variants) {
          if (known && known[1] !== keyOf(v)) continue;
          for (const sub of leaves(v.value)) {
            const p = known ? a.path : [...a.path, [name, keyOf(v)]];
            next.push({ path: [...p, ...sub.path.filter(q => !p.some(r => r[0] === q[0]))], elements: [...a.elements, ...sub.elements] });
          }
        }
      }
      acc = next;
    } else for (const a of acc) a.elements.push(el);
  }
  return acc;
}

// The selectors a pattern uses, outermost first, with their kind and keys.
export function selectorsOf(pattern, out = []) {
  for (const el of pattern.elements) if (el.type === 'Placeable' && el.expression.type === 'SelectExpression') {
    const sel = el.expression, name = sel.selector.id.name;
    if (!out.some(s => s.name === name)) out.push({ name, kind: selectorKind(sel), keys: sel.variants.map(keyOf), def: keyOf(sel.variants.find(v => v.default)) });
    for (const v of sel.variants) selectorsOf(v.value, out);
  }
  return out;
}

// CLDR categories, from the platform's ICU.
export const categories = (lang, type = 'cardinal') => new Intl.PluralRules(lang, { type }).resolvedOptions().pluralCategories;

// A number for each category of a language, preferring one English reads as
// "other", so the English sentence it borrows carries the number in it.
export function samples(lang, type = 'cardinal') {
  const pr = new Intl.PluralRules(lang, { type }), en = new Intl.PluralRules('en', { type });
  const out = {};
  for (const c of pr.resolvedOptions().pluralCategories) {
    const ns = [];
    for (let n = 0; n <= 200; n++) if (pr.select(n) === c) ns.push(n);
    if (!ns.length) ns.push(c === 'other' ? 1.5 : 0);
    out[c] = (type === 'cardinal' ? ns.find(n => en.select(n) === 'other' && n !== 0) : undefined) ?? ns.find(n => n > 0) ?? ns[0];
  }
  return out;
}
export const enCategory = (n, type = 'cardinal') => new Intl.PluralRules('en', { type }).select(n);

// Fluent text for a list of flat elements.
export function flat(elements) {
  return elements.map(el => {
    if (el.type === 'TextElement') return el.value;
    const e = el.expression;
    if (e.type === 'VariableReference') return `{ $${e.id.name} }`;
    if (e.type === 'StringLiteral') return `{ "${e.value}" }`;
    if (e.type === 'NumberLiteral') return `{ ${e.value} }`;
    throw new Error('unexpected ' + e.type);
  }).join('');
}

// A select tree as Fluent text: `tree` is { sel: name, variants: [[key, tree|string]], def } or a string.
export function tree(t, indent = 4) {
  if (typeof t === 'string') return t;
  const pad = ' '.repeat(indent);
  const lines = t.variants.map(([k, sub]) => `${pad}${k === t.def ? '*' : ' '}[${k}] ${tree(sub, indent + 4)}`);
  return `{ $${t.sel} ->\n${lines.join('\n')}\n${' '.repeat(indent - 4)}}`;
}
// A collapsed tree: a selector whose every variant reads the same is dropped.
export function collapse(t) {
  if (typeof t === 'string') return t;
  const vs = t.variants.map(([k, s]) => [k, collapse(s)]);
  const first = JSON.stringify(vs[0][1]);
  if (vs.every(([, s]) => JSON.stringify(s) === first)) return vs[0][1];
  return { ...t, variants: vs };
}

// One message as Fluent text, value lines indented under the id.
export function messageText(id, comment, value, attrs = []) {
  const head = comment ? comment.split('\n').map(l => '# ' + l).join('\n') + '\n' : '';
  const v = value == null ? '' : ' ' + value.replace(/\n/g, '\n');
  const a = attrs.map(([name, val]) => `\n    .${name} = ${val}`).join('');
  return `${head}${id} =${v}${a}\n`;
}

// Fixed arguments for scoring: a number is 5, a string is X; `$nth` is 1, so
// a station reads as the second, not as the owner's kept "undefined".
export function renderArgs(names) {
  const o = {};
  for (const n of names) o[n] = n === 'nth' ? 1 : NUMERIC.has(n) ? 5 : 'X';
  return o;
}
export function variablesIn(pattern, out = new Set()) {
  for (const el of pattern.elements) if (el.type === 'Placeable') {
    const e = el.expression;
    if (e.type === 'VariableReference') out.add(e.id.name);
    if (e.type === 'SelectExpression') { out.add(e.selector.id.name); for (const v of e.variants) variablesIn(v.value, out); }
  }
  return out;
}
// The plain words a message shows with fixed arguments: markup read as words
// (a span is X, a break a space), for scoring and for length.
export function render(lang, text, id) {
  const b = new bundle.FluentBundle(lang, { useIsolating: false });
  b.addResource(new bundle.FluentResource(text));
  const m = b.getMessage(id);
  if (!m) return null;
  const p = m.value ?? Object.values(m.attributes)[0];
  const names = [...text.matchAll(/\$([a-z]+)/g)].map(x => x[1]);
  const errs = [];
  const s = b.formatPattern(p, renderArgs(names), errs);
  return s.replace(/<br\s*\/?>/g, ' ').replace(/<span[^>]*><\/span>/g, 'X').replace(/\s+/g, ' ').trim();
}

// chrF (Popović 2015): character n-grams to 6, beta 2, spaces dropped, on
// lowercased text; 0..100.
export function chrf(hyp, ref, N = 6, beta = 2) {
  const prep = s => s.toLowerCase().replace(/\s+/g, '');
  const h = prep(hyp), r = prep(ref);
  let P = 0, R = 0, k = 0;
  for (let n = 1; n <= N; n++) {
    const grams = s => { const m = new Map(); for (let i = 0; i + n <= s.length; i++) { const g = s.slice(i, i + n); m.set(g, (m.get(g) || 0) + 1); } return m; };
    const gh = grams(h), gr = grams(r);
    const th = [...gh.values()].reduce((a, b) => a + b, 0), tr = [...gr.values()].reduce((a, b) => a + b, 0);
    if (!th || !tr) continue;
    let match = 0;
    for (const [g, c] of gh) match += Math.min(c, gr.get(g) || 0);
    P += match / th; R += match / tr; k++;
  }
  if (!k) return 0;
  P /= k; R /= k;
  if (!P && !R) return 0;
  return 100 * (1 + beta * beta) * P * R / (beta * beta * P + R);
}

// Columns on a monospace line: East Asian wide and fullwidth letters take two.
export function width(s) {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0);
    w += (c >= 0x1100 && c <= 0x115f) || (c >= 0x2e80 && c <= 0xa4cf) || (c >= 0xac00 && c <= 0xd7a3) || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xfe30 && c <= 0xfe4f) || (c >= 0xff00 && c <= 0xff60) || (c >= 0xffe0 && c <= 0xffe6) ? 2 : 1;
  }
  return w;
}
