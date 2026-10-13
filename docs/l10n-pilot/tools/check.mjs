// The mechanical checks, both versions, every language: parses (strict
// @fluent/syntax and the runtime @fluent/bundle), every message there, the
// same variables and markup as the English, select keys that are the
// language's CLDR categories, English left behind, and length on short
// labels. Writes docs/l10n-pilot/results/mechanical.json and the rendered
// lines (results/render.json) that back-translation and the report read.
//
//   node docs/l10n-pilot/tools/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, LANGS, SAMPLE, englishSample, messagesOf, patternsOf, variablesIn, selectorsOf, leaves, categories, render, width } from './lib.mjs';

const en = englishSample();
const enText = fs.readFileSync(path.join(ROOT, 'en.ftl'), 'utf8');
const enById = new Map(en.map(m => [m.id.name, m]));
const enRender = Object.fromEntries(SAMPLE.map(id => [id, render('en', enText, id)]));
const DNT = new Set(['title-gamename']);
// Latin words a line may keep: units and keys the English writes too, and
// the placeholder the owner kept on purpose.
const KEEP = new Set(['esc', 'mb', 'kb', 'undefined', 'x', 's', 'h', 'pebble', 'pit', 'casino']);
const CJK = new Set(['zh-CN', 'ja', 'ko', 'ru']);
// Words spelled the same in English and in the language, and correct there
// (curated off this sample's own hits), so they are not English left behind.
const COGNATES = {
  de: ['portal', 'station', 'hand', 'land', 'baby', 'in', 'cloud'],
  fr: ['serpent', 'surface', 'cloud', 'page', 'syndrome', 'grain', 'table', 'double', 'machine', 'station', 'martial', 'options', 'potion', 'inter', 'boosts'],
  es: ['portal'],
  'pt-BR': ['portal', 'conjure', 'save', 'saves', 'inter', 'dimensional'],
};
// A line whose every word is a cognate reads the same and is right.
const SAME_OK = { de: ['books-got'] };

const markup = s => ({ br: (s.match(/<br\s*\/?>/g) || []).length, names: [...s.matchAll(/data-l10n-name="([^"]+)"/g)].map(m => m[1]).sort().join(',') });
const sourceOf = msg => patternsOf(msg).map(([, p]) => JSON.stringify(p)).join('');
const textOf = (text, id) => {
  // A message's lines as written, for markup counting.
  const lines = text.split('\n');
  const i = lines.findIndex(l => l.startsWith(id + ' ='));
  if (i < 0) return '';
  let j = i + 1;
  while (j < lines.length && /^\s/.test(lines[j])) j++;
  return lines.slice(i, j).join('\n');
};
const enWords = id => new Set((enRender[id] || '').toLowerCase().match(/[a-z']{4,}/g) || []);

const results = { english: enRender, langs: {} };
const renders = { en: enRender };
for (const lang of LANGS) {
  results.langs[lang] = {};
  for (const version of ['draft', 'machine']) {
    const file = path.join(ROOT, version, `${lang}.ftl`);
    const text = fs.readFileSync(file, 'utf8');
    const { junk, byId } = messagesOf(text);
    const issues = [];
    const rendered = {};
    const lengths = [];
    for (const id of SAMPLE) {
      const m = byId.get(id);
      if (!m) { issues.push({ id, kind: 'missing', msg: 'message missing' }); continue; }
      const em = enById.get(id);
      const ev = new Set(), tv = new Set();
      for (const [, p] of patternsOf(em)) variablesIn(p, ev);
      for (const [, p] of patternsOf(m)) variablesIn(p, tv);
      const miss = [...ev].filter(v => !tv.has(v)), extra = [...tv].filter(v => !ev.has(v));
      // A selector the language does not need may go (`$more` in a language
      // whose two lines read the same); a variable shown in the text may not.
      const shown = new Set();
      const walk = p => { for (const el of p.elements) if (el.type === 'Placeable') { const e = el.expression; if (e.type === 'VariableReference') shown.add(e.id.name); if (e.type === 'SelectExpression') e.variants.forEach(v => walk(v.value)); } };
      for (const [, p] of patternsOf(em)) walk(p);
      for (const v of miss) issues.push({ id, kind: shown.has(v) ? 'variable' : 'selector-dropped', msg: shown.has(v) ? `{ $${v} } lost` : `select on $${v} dropped (its lines read the same)` });
      for (const v of extra) issues.push({ id, kind: 'variable', msg: `{ $${v} } added` });
      // Per line: a variable every English line shows must be in every
      // translated line too (a plural's own number may go: "a day ago").
      const leafVars = els => new Set(els.filter(e => e.type === 'Placeable' && e.expression.type === 'VariableReference').map(e => e.expression.id.name));
      for (const [[attr, ep], [, tp]] of patternsOf(em).map((x, i) => [x, patternsOf(m)[i] || x])) {
        const plural = new Set(selectorsOf(ep).filter(s => s.kind !== 'exact').map(s => s.name));
        const eLeaves = leaves(ep).map(l => leafVars(l.elements));
        const always = [...eLeaves[0]].filter(v => eLeaves.every(s => s.has(v)) && !plural.has(v));
        for (const l of leaves(tp)) {
          const got = leafVars(l.elements);
          const lost = always.filter(v => !got.has(v));
          if (lost.length && !miss.some(v => lost.includes(v))) issues.push({ id, kind: 'variable', msg: `{ $${lost.join(' }, { $')} } lost in [${l.path.map(p => p[1]).join(',')}]${attr}` });
        }
      }
      const a = markup(textOf(enText, id)), b = markup(textOf(text, id));
      if (a.br !== b.br || a.names !== b.names) issues.push({ id, kind: 'markup', msg: `markup ${JSON.stringify(b)} against English ${JSON.stringify(a)}` });
      // Select keys.
      const enSels = new Map(); for (const [, p] of patternsOf(em)) for (const s of selectorsOf(p)) enSels.set(s.name, s);
      for (const [, p] of patternsOf(m)) for (const s of selectorsOf(p)) {
        const es = enSels.get(s.name);
        const kind = es ? es.kind : 'plural';
        if (kind === 'exact') {
          const want = es.keys.join(','), got = s.keys.join(',');
          if (want !== got) issues.push({ id, kind: 'keys', msg: `keys [${got}] against English [${want}]` });
          continue;
        }
        const cats = categories(lang, kind === 'ordinal' ? 'ordinal' : 'cardinal');
        const bad = s.keys.filter(k => !cats.includes(k));
        if (bad.length) issues.push({ id, kind: 'keys', msg: `[${bad.join(', ')}] is not a ${lang} ${kind === 'ordinal' ? 'ordinal' : 'plural'} category (${cats.join(', ')})` });
        const absent = cats.filter(c => c !== 'many' || lang === 'ru').filter(c => !s.keys.includes(c));
        if (absent.length && lang === 'ru') issues.push({ id, kind: 'keys-incomplete', msg: `no [${absent.join(', ')}]: those numbers read the default` });
      }
      const r = render(lang, text, id);
      rendered[id] = r;
      if (r == null) { issues.push({ id, kind: 'render', msg: 'does not render' }); continue; }
      // English left behind.
      if (!DNT.has(id) && !(SAME_OK[lang] || []).includes(id) && r === enRender[id] && /[a-z]{2,}/i.test(r)) issues.push({ id, kind: 'untranslated', msg: 'identical to the English' });
      else if (!DNT.has(id) && !(SAME_OK[lang] || []).includes(id)) {
        const latin = (r.match(/[A-Za-z]{3,}/g) || []).map(w => w.toLowerCase()).filter(w => !KEEP.has(w) && !(COGNATES[lang] || []).includes(w));
        const left = CJK.has(lang) ? latin : latin.filter(w => enWords(id).has(w) && w.length >= 4 && !['local'].includes(w));
        if (left.length) issues.push({ id, kind: 'english-left', msg: `English left: ${[...new Set(left)].join(', ')}` });
      }
      const ew = width(enRender[id]), tw = width(r);
      lengths.push(tw / ew);
      if (ew <= 20 && tw / ew > 1.4) issues.push({ id, kind: 'long', msg: `${tw} columns against English ${ew} (${Math.round(100 * (tw / ew - 1))}% longer)` });
    }
    lengths.sort((x, y) => x - y);
    results.langs[lang][version] = {
      junk: junk.length,
      messages: byId.size,
      issues,
      medianLength: lengths[Math.floor(lengths.length / 2)],
      count: issues.reduce((o, i) => (o[i.kind] = (o[i.kind] || 0) + 1, o), {}),
    };
    renders[`${lang}.${version}`] = rendered;
  }
}
fs.mkdirSync(path.join(ROOT, 'results'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'results', 'mechanical.json'), JSON.stringify(results, null, 1));
fs.writeFileSync(path.join(ROOT, 'results', 'render.json'), JSON.stringify(renders, null, 1));
for (const lang of LANGS) for (const v of ['draft', 'machine']) {
  const r = results.langs[lang][v];
  console.log(lang.padEnd(6), v.padEnd(8), 'junk', r.junk, 'msgs', r.messages, 'median len', r.medianLength.toFixed(2), JSON.stringify(r.count));
}
