// The string literals in a JavaScript source, and which of them read as
// words a player would see. A lexer, not a parser: comments, strings,
// templates and regular expressions are told apart and nothing else is, which
// is all a hunt for sentences needs. Read by test/l10n-guard.test.mjs and by
// `node tools/wording/strings.mjs [file...]`, which prints the candidates.

const REGEX_AFTER = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
const REGEX_WORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'yield', 'await']);

// Every literal: { text, line, kind } where kind is 'str' or 'tpl'; a
// template's holes read as `${}` in its text.
export function literals(src) {
  const out = [];
  let i = 0, line = 1, prev = '', word = '';
  const n = src.length;
  function readString(q) {
    const start = line, at = i;
    let s = '';
    i++;
    while (i < n && src[i] !== q) {
      if (src[i] === '\\') { s += src[i] + src[i + 1]; if (src[i + 1] === '\n') line++; i += 2; continue; }
      if (src[i] === '\n') line++;
      s += src[i++];
    }
    i++;
    return { text: s, line: start, start: at, end: i };
  }
  // A template from its backtick to its closing one; the holes are lexed as
  // code (they may hold strings and templates of their own).
  function readTemplate() {
    const start = line, at = i;
    let s = '';
    i++;
    while (i < n && src[i] !== '`') {
      if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; continue; }
      if (src[i] === '$' && src[i + 1] === '{') {
        i += 2; s += '${}';
        lexCode(true);
        continue;
      }
      if (src[i] === '\n') line++;
      s += src[i++];
    }
    i++;
    return { text: s, line: start, start: at, end: i };
  }
  function lexCode(inHole) {
    let depth = 0;
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
        i += 2; continue;
      }
      if (c === '"' || c === "'") { const r = readString(c); out.push({ ...r, kind: 'str' }); prev = 'x'; word = ''; continue; }
      if (c === '`') { const r = readTemplate(); out.push({ ...r, kind: 'tpl' }); prev = 'x'; word = ''; continue; }
      if (c === '/' && (prev === '' || REGEX_AFTER.has(prev) || REGEX_WORDS.has(word))) {
        // a regular expression: to its closing slash, minding classes
        i++;
        let cls = false;
        while (i < n) {
          if (src[i] === '\\') { i += 2; continue; }
          if (src[i] === '[') cls = true; else if (src[i] === ']') cls = false;
          else if (src[i] === '/' && !cls) break;
          else if (src[i] === '\n') break;
          i++;
        }
        i++;
        while (i < n && /[a-z]/i.test(src[i])) i++;
        prev = 'x'; word = '';
        continue;
      }
      if (inHole) {
        if (c === '{') depth++;
        if (c === '}') { if (depth === 0) { i++; return; } depth--; }
      }
      if (/[A-Za-z0-9_$]/.test(c)) {
        let w = '';
        while (i < n && /[A-Za-z0-9_$]/.test(src[i])) w += src[i++];
        word = w; prev = 'x';
        continue;
      }
      prev = c; word = '';
      i++;
    }
  }
  lexCode(false);
  return out;
}

// Whether a literal reads as words: two or more words of letters with a space
// between them, or an html fragment with words in it. Code that happens to
// have spaces in it -- css, selectors, a canvas font, a key list -- is not.
export function looksLikeCopy(text) {
  // a hole reads as a word, but only a real space between words makes words
  const t = text.replace(/\$\{\}/g, 'xx').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ');
  if (!/[a-z]{2,}[^\n]*\s[^\n]*[a-z]{2,}/i.test(t)) return false;
  // and a word of its own: holes and markup alone are not words
  if (!/[a-z]{2,}/i.test(text.replace(/\$\{\}/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' '))) return false;
  if (/^[\s\w-]*:[^;]*;/.test(text) && /;\s*$|;\s*\w+-?\w*:/.test(text)) return false;     // css declarations
  if (/^\s*[\d.]+(px|em|rem)?\s+[\w"' ,-]+$/.test(text) && /px|monospace|serif/.test(text)) return false; // a canvas font
  if (/^[.#]?[\w-]+([ >.#:\[][\w-.#:\[\]="' >()]*)$/.test(text) && /[.#\[>]/.test(text) && !/[a-z]{2,} [a-z]{2,} [a-z]{2,}/i.test(text)) return false;   // a selector
  if (/^[a-z][\w-]*( [a-z][\w-]*)*$/.test(text) && /-/.test(text) && !/ [a-z]+ /.test(text)) return false; // class lists
  if (/translate3d|^\$\{\}px |\bmonospace\b|^bold \$\{\}px|^hsla?\(/.test(text)) return false;         // a transform, a font, a color
  if (/^\((prefers|pointer|hover|min-|max-)[\w-]*:/.test(text)) return false;                          // a media query
  if (/:scope\b/.test(text)) return false;                                                              // a scoped selector
  if (/^[\w.#:\[\]="$-]+(, [\w.#:\[\]="$-]+)+$/.test(text)) return false;                              // a selector list
  return true;
}

// Whether a literal on a line of source is said to someone who is not a
// player: a dev panel knob's label, a line for the console, an error thrown
// for the developer. Asked with the line the literal is on.
export function devFacing(line) {
  return /\bkey: ['`][A-Z][^'`]*['`], label:/.test(line)        // a TUNABLE knob (dev.js draws them)
      || /\bconsole\.(log|warn|error|info|debug)\(/.test(line)
      || /\b(new Error|throw new \w*Error)\(/.test(line);
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('strings.mjs')) {
  const { readFileSync } = await import('node:fs');
  for (const f of process.argv.slice(2)) {
    const src = readFileSync(f, 'utf8');
    for (const l of literals(src)) if (looksLikeCopy(l.text)) console.log(`${f}:${l.line}\t${JSON.stringify(l.text)}`);
  }
}
