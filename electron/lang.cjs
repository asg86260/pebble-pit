// The shell's own words: the window's title and the Steam carry-over dialog
// (DESIGN.md, "Localization phase two", section 6). They are said before the
// page exists, so they cannot use the page's lookup or the page's
// preference; they are messages in the same files (`locales/*.ftl`), read
// here with @fluent/bundle's CommonJS entry, in the language Steam names for
// the game, else the first of the system's that has a ready file, else
// English. A first launch has no choice to honor, and following Steam is what
// Steam asks of a game.
//
// The table and the rules are the page's (locales/languages.json,
// src/languages.js), written again here because the shell never imports from
// src/; test/l10n-default.test.mjs holds the two to the same answers.
//
// Plain Node and nothing from Electron, so the node tier can read it. The
// packaged app carries `locales/` beside `electron/` (package.json's `files`):
// the build hashes the page's copies into chunks the shell cannot find.

const fs = require('node:fs');
const path = require('node:path');
const { FluentBundle, FluentResource } = require('@fluent/bundle');

const SOURCE = 'en';
const DIR = path.join(__dirname, '..', 'locales');

function readTable(dir = DIR) {
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'languages.json'), 'utf8')); } catch { return [{ code: SOURCE, steam: ['english'], match: ['en', 'en-*'], ready: true }]; }
}

function fits(tag, pattern) {
  const t = String(tag).toLowerCase().replace(/_/g, '-'), p = pattern.toLowerCase();
  return p.endsWith('-*') ? t.startsWith(p.slice(0, -1)) : t === p;
}
const codeForTag = (tag, table) => (tag ? table.find(r => r.match.some(p => fits(tag, p)))?.code ?? null : null);
const codeForSteam = (name, table) => (name ? table.find(r => r.steam.includes(String(name).toLowerCase()))?.code ?? null : null);

// The language for the shell's words: Steam's, then the system's in order,
// the first that is ready and has a file; else English.
function pickShellLanguage({ steam = null, system = [], dir = DIR, table = readTable(dir) } = {}) {
  const ready = code => code != null && table.some(r => r.code === code && r.ready) && fs.existsSync(path.join(dir, `${code}.ftl`));
  const asks = [codeForSteam(steam, table), ...(system || []).map(t => codeForTag(t, table))];
  return asks.find(ready) ?? SOURCE;
}

function bundleOf(code, dir) {
  const b = new FluentBundle(code, { useIsolating: false });
  try { b.addResource(new FluentResource(fs.readFileSync(path.join(dir, `${code}.ftl`), 'utf8'))); } catch {}
  return b;
}

// A lookup in `code`, English where that file lacks the message, the id
// itself where neither has it -- the page's msg(), without arguments, which
// none of the shell's words take.
function sayer(code = SOURCE, dir = DIR) {
  const english = bundleOf(SOURCE, dir);
  const active = code === SOURCE ? english : bundleOf(code, dir);
  return id => {
    for (const b of [active, english]) {
      const m = b.getMessage(id);
      if (m && m.value) return b.formatPattern(m.value, undefined, []);
    }
    return id;
  };
}

module.exports = { SOURCE, readTable, codeForTag, codeForSteam, pickShellLanguage, sayer };
