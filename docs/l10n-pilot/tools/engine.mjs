// The machine engine: Firefox Translations (Bergamot) in node, through
// @browsermt/bergamot-translator's wasm, reading the models models.mjs
// fetched off disk. The deps live outside the repo: PILOT_DEPS names a folder
// with node_modules holding @browsermt/bergamot-translator, @fluent/syntax and
// @fluent/bundle. MODELS_DIR is models.mjs's folder.
import fs from 'node:fs';
import path from 'node:path';
import { dep } from './engine-deps.mjs';

const DIR = process.env.MODELS_DIR;
if (!DIR) throw new Error('set MODELS_DIR');

const { BatchTranslator, TranslatorBacking } = await dep('@browsermt/bergamot-translator/translator.js');
const reg = JSON.parse(fs.readFileSync(path.join(DIR, 'registry.json'), 'utf8'));
export const VERSIONS = JSON.parse(fs.readFileSync(path.join(DIR, 'versions.json'), 'utf8'));

// The registry's codes against the engine's: the package splits a key into
// two-letter halves, which `zh-Hans` breaks, so the list is built here.
const short = c => c === 'zh-Hans' ? 'zh' : c;
class Local extends TranslatorBacking {
  async loadModelRegistery() {
    return Object.entries(reg).map(([k, files]) => k.startsWith('en')
      ? { from: 'en', to: short(k.slice(2)), files }
      : { from: short(k.slice(0, -2)), to: 'en', files });
  }
  async fetch(name) {
    const b = fs.readFileSync(name);
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  }
}

// Our file codes against the engine's.
export const MT = { de: 'de', fr: 'fr', es: 'es', 'pt-BR': 'pt', ru: 'ru', 'zh-CN': 'zh', ja: 'ja', ko: 'ko' };

let t = null;
const tr = () => t ??= new BatchTranslator({ workers: 4, batchSize: 16, pivotLanguage: null, downloadTimeout: 0 }, new Local({ pivotLanguage: null, downloadTimeout: 0 }));

export async function translate(from, to, texts, html = true) {
  const out = await Promise.all(texts.map(text => tr().translate({ from, to, text, html })));
  return out.map(o => o.target.text);
}
export const done = () => { t?.delete(); t = null; };
