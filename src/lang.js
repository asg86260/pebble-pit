// Every word a player reads, looked up (DESIGN.md, "Localization"). The words
// themselves are `locales/<code>.ftl`, Mozilla Fluent files, one a language;
// `en.ftl` is the source and the fallback, and this module is the one door to
// them. A module never writes a sentence: it names a message and hands over
// the numbers and names that go in it, `msg('slots-since-min', { m })`, and
// the language decides the words around them, the plural and the order.
//
// The language is settled once, as the module loads: the `language`
// preference (prefs.js) if the player chose one, else what Steam, the system
// or the browser asks for, else English (languages.js, `pickLanguage`). A
// module may look a message up at its own top level and get the player's
// language, and changing it reloads the page, as the dark switch does. The
// node yard has no vite and reads the files off disk; it follows nothing, so
// a check reads English wherever it runs unless it chooses.

import { FluentBundle, FluentResource, FluentNumber } from '@fluent/bundle';
import { pref, setPref } from './prefs.js';
import { SOURCE, pickLanguage, faceFamily } from './languages.js';

export { SOURCE };

// The files, by code. Under vite English is in the bundle and every other
// language is a chunk fetched when it is the one asked for; in node each is
// read off disk when asked. Adding `locales/xx.ftl` is all it takes for `xx`
// to be in `LANGS`.
const VITE = !!import.meta.env;
const LOADERS = VITE ? import.meta.glob('../locales/*.ftl', { query: '?raw', import: 'default' }) : null;
const EAGER = VITE ? import.meta.glob('../locales/en.ftl', { query: '?raw', import: 'default', eager: true }) : null;
const TABLE = VITE ? import.meta.glob('../locales/languages.json', { import: 'default', eager: true }) : null;
// The faces cut for Chinese, Japanese and Korean (tools/fonts.mjs, run by the
// build), by language code. A checkout that has not cut them, or a language
// whose file does not exist yet, has none, and the system's own face answers.
const FACES = VITE ? import.meta.glob('./fonts/*.woff2', { query: '?url', import: 'default', eager: true }) : null;
const fs = VITE ? null : globalThis.process?.getBuiltinModule?.('node:fs');
// The folder, for node. Not written as `new URL(path, import.meta.url)`: vite
// reads that shape as an asset to ship, and the file would go out twice.
const HERE = import.meta.url;
const DIR = VITE ? null : new URL('../locales/', HERE);
const codeOf = path => path.replace(/^.*\/|\.ftl$/g, '');

export const LANGS = VITE
  ? Object.keys(LOADERS).map(codeOf).sort()
  : fs.readdirSync(DIR).filter(f => f.endsWith('.ftl')).map(codeOf).sort();

// Every language the game is written for, ready or not (locales/languages.json).
export const LANGUAGES = VITE ? Object.values(TABLE)[0] : JSON.parse(fs.readFileSync(new URL('languages.json', DIR), 'utf8'));

// A file's text: at once for English and anywhere in node, a promise for
// another language's chunk.
function source(code) {
  if (!VITE) return fs.readFileSync(new URL(code + '.ftl', DIR), 'utf8');
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

// What the shell says (Steam's language for the game, the system's list), or
// null off the desk; a bridge that throws is a desk with nothing to say.
function deskAsks() {
  const d = globalThis.desk;
  if (typeof d?.language !== 'function') return null;
  try { return d.language() || { steam: null, system: [] }; } catch { return { steam: null, system: [] }; }
}

const english = bundleOf(SOURCE, source(SOURCE));
// A dev page may name its language in its address (`play.html?bench&lang=ja`)
// rather than in the preference, which every tab on the origin shares: the
// board check stands a frame a language beside the suite's own page, and a
// preference written for the frame was read by every group after it.
const ASKED = VITE && import.meta.env.DEV && typeof location !== 'undefined'
  ? new URLSearchParams(location.search).get('lang') : null;
export const LANG = pickLanguage({
  chosen: ASKED ?? pref('language'),
  desk: VITE ? deskAsks() : null,
  browser: VITE && typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : null,
  files: LANGS,
  table: LANGUAGES,
});
const active = LANG === SOURCE ? english : bundleOf(LANG, await source(LANG));

// The face the canvas writes in (DESIGN.md, "Localization phase two", section
// 3): the house mono (Courier Prime, bundled; Courier New for what it does not
// draw), with the language's cut face after it for Chinese,
// Japanese and Korean, the stack style.css's `:lang` blocks write. The canvas
// does not see `:lang`, so every `ctx.font` is `${px}px ${FACE}`.
const ROW = LANGUAGES.find(r => r.code === LANG);
const FAMILY = faceFamily(ROW);
export const FACE = FAMILY ? `"Courier Prime", "Courier New", "${FAMILY}", monospace` : '"Courier Prime", "Courier New", monospace';

// A cut face is fetched before any module runs, so nothing measures a line
// with the fallback and keeps the wrong width (ribbon.js sizes its cloth
// once). Registered here rather than as an @font-face in a sheet, so a
// language that does not need it never names the file.
if (FAMILY && FACES && typeof FontFace === 'function' && typeof document !== 'undefined') {
  const url = FACES[`./fonts/${LANG}.woff2`];
  if (url) {
    const face = new FontFace(FAMILY, `url(${url})`, { weight: '400 700' });
    document.fonts.add(face);
    try { await face.load(); } catch (e) { console.warn(`${FAMILY}: the face did not load`, e); }
  }
}

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
  const out = b.formatPattern(p, argsOf(args), []);
  return globalThis.__l10nMark ? globalThis.__l10nMark(out) : out;
}
// A line rewritten in English with more in it than a translation has caught
// up with (the story lines that name the two of them, "Who you are"): `id`
// where the player's language has it, else its `older` line in that
// language, else English's `id`. A translation keeps its own words until it
// writes the new message, rather than turning English mid-story.
export function msgOr(id, older, args) {
  if (active !== english && patternIn(active, id) == null && patternIn(active, older) != null) return msg(older, args);
  return msg(id, args);
}
// `globalThis.__l10nMark`, set before the game's modules load, wraps every
// message the game says: a pseudo-language for the checks, under which any
// word on a board that came from somewhere else is plain to see
// (tools/wording/pseudo.mjs). Never set in play.

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
  setPref('language', LANGS.includes(code) ? code : SOURCE);
}
