// Version B: the English sample through the machine engine, one language a
// run (each language's model is a few hundred megabytes of wasm memory, and
// a worker that has held three of them cannot hold a fourth).
//
//   node docs/l10n-pilot/tools/machine.mjs <lang>
//
// Only text goes to the engine. Every select is hoisted out first and each
// leaf translated as a whole sentence; the selects are rebuilt with the
// target language's own plural categories (a leaf for each, the English
// sentence for a number in that category, the number in place so the engine
// inflects for it). Every variable and every markup element goes to the
// engine as a number of its own and comes back as itself; one the engine
// dropped or doubled is written down, not repaired. Two mechanical post-edits
// any pipeline would make: the first letter takes the English line's case,
// and the game's name (title-gamename) is not sent at all.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, englishSample, patternsOf, selectorsOf, leaves, categories, samples, enCategory, flat, tree, collapse, messageText } from './lib.mjs';
import { translate, done, MT, VERSIONS } from './engine.mjs';

const lang = process.argv[2];
if (!MT[lang]) throw new Error('lang?');
const msgs = englishSample();
const DNT = new Set(['title-gamename']);
const POOL = [37, 58, 64, 91, 23, 76, 48, 83];

// A leaf's text for the engine, and how to undo it.
function mask(elements, fixed) {
  const tokens = [];
  let i = 0;
  const text = elements.map(el => {
    if (el.type === 'TextElement') return el.value.replace(/<span data-l10n-name="([^"]+)"><\/span>/g, (m) => {
      const t = String(POOL[i++]); tokens.push([t, m]); return t;
    });
    const e = el.expression;
    if (e.type === 'VariableReference') {
      const name = e.id.name;
      const t = fixed[name] != null ? String(fixed[name]) : String(POOL[i++]);
      tokens.push([t, `{ $${name} }`]);
      return t;
    }
    return flat([el]);
  }).join('');
  return { text, tokens };
}
function unmask(out, tokens, log, where) {
  let s = out;
  // Longest tokens first, so 21 is not found inside 211.
  for (const [t, back] of [...tokens].sort((a, b) => b[0].length - a[0].length)) {
    const re = new RegExp(`(?<![\\d])${t}(?![\\d])`, 'g');
    const hits = s.match(re)?.length ?? 0;
    if (hits !== 1) log.push(`${where}: ${back} came back ${hits} times in "${out}"`);
    if (hits >= 1) { let first = true; s = s.replace(re, m => first ? (first = false, back) : m); }
  }
  return s;
}
const caseLike = (s, en) => {
  const e = en.replace(/^[{\s$a-z_-]*\}\s*/, '').trimStart()[0];
  if (!e || !/[a-zA-Z]/.test(e) || !s) return s;
  const i = s.search(/\p{L}/u);
  if (i < 0) return s;
  if (s.slice(0, i).includes('{')) return s;
  const c = e === e.toLowerCase() ? s[i].toLowerCase() : s[i].toUpperCase();
  return s.slice(0, i) + c + s.slice(i + 1);
};

const jobs = []; // [msgId, attr, combos]
for (const m of msgs) {
  for (const [attr, pattern] of patternsOf(m)) {
    const sels = selectorsOf(pattern);
    const ls = leaves(pattern);
    // Target keys for each selector.
    const axes = sels.map(s => {
      if (s.kind === 'exact') return s.keys.map(k => ({ sel: s, key: k, en: k, fixed: /^\d+$/.test(k) ? Number(k) : null }));
      const type = s.kind === 'ordinal' ? 'ordinal' : 'cardinal';
      const smp = samples(lang, type);
      return categories(lang, type).map(c => {
        const n = smp[c];
        let en = enCategory(n, type);
        if (!s.keys.includes(en)) en = s.def;
        return { sel: s, key: c, en, fixed: n };
      });
    });
    let combos = [[]];
    for (const ax of axes) combos = combos.flatMap(c => ax.map(a => [...c, a]));
    const items = combos.map(c => {
      const leaf = ls.find(l => c.every(a => l.path.some(([v, k]) => v === a.sel.name && String(k) === String(a.en))));
      const fixed = {};
      for (const a of c) if (a.sel.kind !== 'exact' && a.fixed != null) fixed[a.sel.name] = a.fixed;
      return { combo: c, english: flat(leaf.elements), ...mask(leaf.elements, fixed) };
    });
    jobs.push({ m, attr, sels, items });
  }
}

const texts = [...new Set(jobs.filter(j => !DNT.has(j.m.id.name)).flatMap(j => j.items.map(i => i.text)))];
const t0 = Date.now();
const outs = await translate('en', MT[lang], texts, false);
done();
const got = new Map(texts.map((t, i) => [t, outs[i]]));
const log = [];

const blocks = [`### Pebble Pit pilot, version B: machine translation, ${lang}.\n### Engine: Firefox Translations (Bergamot) via @browsermt/bergamot-translator 0.4.9 (wasm), model en-${MT[lang]} ${VERSIONS['en' + (MT[lang] === 'zh' ? 'zh-Hans' : MT[lang])]} from Mozilla's Remote Settings registry.\n### Unedited except: the first letter takes the English case; title-gamename is not sent (the game's name).\n`];
const byMsg = new Map();
for (const j of jobs) {
  const id = j.m.id.name;
  const vals = j.items.map(it => {
    if (DNT.has(id)) return it.english;
    const raw = got.get(it.text);
    return caseLike(unmask(raw, it.tokens, log, `${id}${j.attr}[${it.combo.map(a => a.key).join(',')}]`), it.english).trim();
  });
  let value;
  if (!j.sels.length) value = vals[0];
  else {
    // Rebuild the nested selects in the English order.
    const build = (depth, prefix) => {
      if (depth === j.sels.length) return vals[j.items.findIndex(it => it.combo.every((a, i) => a.key === prefix[i]))];
      const keys = [...new Set(j.items.map(it => it.combo[depth].key))];
      const s = j.sels[depth];
      const def = s.kind === 'exact' ? s.def : 'other';
      return { sel: s.name, def, variants: keys.map(k => [k, build(depth + 1, [...prefix, k])]) };
    };
    const t = collapse(build(0, []));
    value = typeof t === 'string' ? t : tree(t, 8).replace(/\n {4}\}$/, '\n    }');
  }
  if (!byMsg.has(id)) byMsg.set(id, { value: null, attrs: [] });
  if (j.attr) byMsg.get(id).attrs.push([j.attr.slice(1), value]); else byMsg.get(id).value = value;
}
for (const m of msgs) {
  const id = m.id.name, r = byMsg.get(id);
  blocks.push(messageText(id, m.comment?.content, r.value, r.attrs));
}
fs.mkdirSync(path.join(ROOT, 'machine'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'machine', `${lang}.ftl`), blocks.join('\n'));
fs.writeFileSync(path.join(ROOT, 'machine', `${lang}.log.txt`), log.join('\n') + (log.length ? '\n' : ''));
console.log(lang, texts.length, 'segments', Date.now() - t0, 'ms;', log.length, 'mask problems');
