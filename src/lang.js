// Every word a player reads, looked up (DESIGN.md, "Localization"). The words
// themselves are `locales/<code>.ftl`, Mozilla Fluent files, one a language;
// `en.ftl` is the source and the fallback, and this module is the one door to
// them. A module never writes a sentence: it names a message and hands over
// the numbers and names that go in it, `msg('slots-since-min', { m })`, and
// the language decides the words around them, the plural and the order.
//
// The language is read once, as the module loads, from the `lang`
// preference (prefs.js): a module may look a message up at its own top level
// and get the player's language, and changing it reloads the page, as the
// dark switch does. The node yard has no vite and reads the files off disk.

import { FluentBundle, FluentResource, FluentNumber } from '@fluent/bundle';
import { pref, setPref } from './prefs.js';

export const SOURCE = 'en';

// The files, by code. Under vite English is in the bundle and every other
// language is a chunk fetched when it is the one asked for; in node each is
// read off disk when asked. Adding `locales/xx.ftl` is all it takes for `xx`
// to be in `LANGS`.
const VITE = !!import.meta.env;
const LOADERS = VITE ? import.meta.glob('../locales/*.ftl', { query: '?raw', import: 'default' }) : null;
const EAGER = VITE ? import.meta.glob('../locales/en.ftl', { query: '?raw', import: 'default', eager: true }) : null;
const fs = VITE ? null : globalThis.process?.getBuiltinModule?.('node:fs');
const codeOf = path => path.replace(/^.*\/|\.ftl$/g, '');

export const LANGS = VITE
  ? Object.keys(LOADERS).map(codeOf).sort()
  : fs.readdirSync(new URL('../locales/', import.meta.url)).filter(f => f.endsWith('.ftl')).map(codeOf).sort();

// A file's text: at once for English and anywhere in node, a promise for
// another language's chunk.
function source(code) {
  if (!VITE) return fs.readFileSync(new URL(`../locales/${code}.ftl`, import.meta.url), 'utf8');
  if (code === SOURCE) return Object.values(EAGER)[0];
  return LOADERS[`../locales/${code}.ftl`]();
}

// A bundle of one file. No isolation marks round a placeable: the game's
// pages are one direction, and the marks would make every line a byte longer
// than the one it replaced.
function bundleOf(code, text) {
  const b = new FluentBundle(code, { useIsolating: false });
  const errors = b.addResource(new FluentResource(text));
  if (errors.length) console.warn(`locales/${code}.ftl:`, errors.map(e => e.message).join('; '));
  return b;
}

const english = bundleOf(SOURCE, source(SOURCE));
const wanted = String(pref('lang') || SOURCE);
export const LANG = wanted !== SOURCE && LANGS.includes(wanted) ? wanted : SOURCE;
const active = LANG === SOURCE ? english : bundleOf(LANG, await source(LANG));

// A number goes in as JavaScript writes it, `${n}`, so an English line reads
// exactly as the template it replaced; a plural selector still reads it as a
// number. A language that wants its own digits says NUMBER($n) in its file.
class Plain extends FluentNumber {
  toString() { return String(this.value); }
}
// A number a message picks its form for as a place in a line (1st, 2nd,
// 3rd): `msg('ordinal', { n: placeOf(n) })`, and the message selects on `$n`
// by the language's ordinal rules. A translation cannot ask NUMBER() for
// that, so the game hands the number over already asking.
export const placeOf = n => new Plain(n, { type: 'ordinal' });
function argsOf(args) {
  if (!args) return undefined;
  const out = {};
  for (const k in args) {
    const v = args[k];
    out[k] = v instanceof FluentNumber ? v : typeof v === 'number' ? new Plain(v) : typeof v === 'string' ? v : String(v);
  }
  return out;
}

// The pattern for `id` (a message) or `id.attr` (one of its attributes) in a
// bundle, or null.
function patternIn(b, id) {
  const dot = id.indexOf('.');
  const m = b.getMessage(dot < 0 ? id : id.slice(0, dot));
  if (!m) return null;
  return dot < 0 ? m.value : m.attributes[id.slice(dot + 1)] ?? null;
}

// The words for a message in the player's language, English where the
// language has no such message. An id no file has comes back as itself, so a
// missing line shows as its name rather than as nothing.
export function msg(id, args) {
  let b = active, p = patternIn(active, id);
  if (p == null && active !== english) { b = english; p = patternIn(english, id); }
  if (p == null) return id;
  return b.formatPattern(p, argsOf(args), []);
}

// Whether a message exists in the source file (the guard's question).
export const has = id => patternIn(english, id) != null;

// --- the pages ------------------------------------------------------------------
// The HTML carries its English as the words a page shows with no script, and a
// `data-l10n-id` on every element that says something. This writes the
// message over each: its value is the text, its attributes the attributes a
// player reads. A value may carry two kinds of markup: a <br>, and an empty
// element with a `data-l10n-name`, which stands for the element of that name
// already inside, moved into place rather than made again (it has an id,
// and code holds it). Anything else in a value is written as text.
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];

//
// `writeInto` is the same for a line the code writes, with the named elements
// handed in: `writeInto(el, msg('other-skip-pad'), { key: glyph('a') })`.
export function writeInto(el, text, given = {}) {
  if (!/[<&]/.test(text)) { if (el.textContent !== text) el.textContent = text; return; }
  const tpl = document.createElement('template');
  tpl.innerHTML = text;
  const named = {};
  for (const c of el.querySelectorAll('[data-l10n-name]')) named[c.dataset.l10nName] = c;
  Object.assign(named, given);
  const out = document.createDocumentFragment();
  for (const n of [...tpl.content.childNodes]) {
    if (n.nodeType === 3) out.append(n.textContent);
    else if (n.nodeName === 'BR') out.append(document.createElement('br'));
    else if (n.dataset?.l10nName && named[n.dataset.l10nName]) out.append(named[n.dataset.l10nName]);
    else out.append(n.textContent);
  }
  el.replaceChildren(out);
}

export function localizeElement(el) {
  const id = el.getAttribute('data-l10n-id');
  if (!id) return;
  let args;
  try { args = JSON.parse(el.getAttribute('data-l10n-args') || 'null') || undefined; } catch {}
  let b = active, m = active.getMessage(id);
  if (!m && active !== english) { b = english; m = english.getMessage(id); }
  if (!m) return;
  if (m.value != null) writeInto(el, b.formatPattern(m.value, argsOf(args), []));
  for (const a of ATTRS) if (m.attributes[a]) el.setAttribute(a, b.formatPattern(m.attributes[a], argsOf(args), []));
}

// Every element under `root` that names a message, and the page's language.
export function localize(root = document) {
  if (root === document) document.documentElement.lang = LANG;
  for (const el of root.querySelectorAll('[data-l10n-id]')) localizeElement(el);
}

// The page's own words, at once: every module that writes words over one of
// them imports this one, so this has run before any of them.
if (typeof document !== 'undefined' && document.querySelectorAll) localize();

// The language for the next load. The caller reloads.
export function chooseLang(code) {
  setPref('lang', LANGS.includes(code) ? code : SOURCE);
}
