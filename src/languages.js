// Which language a player reads, when they have not said (DESIGN.md,
// "Localization phase two", section 1). The languages themselves are one
// table, `locales/languages.json`: a row a language with its file's code, its
// name for itself, the names Steam's API gives it, the tags a browser or a
// system reports for it, whether it is `ready` (approved, and so offered by
// the picker and followed by default), and for Chinese, Japanese and Korean
// the face cut for it (tools/fonts.mjs). The table is JSON rather than a
// module because the shell reads it too, and the shell never imports src/.
//
// Pure: everything is handed in, so the node tier can ask what a Steam Deck
// in Brazil or a browser in Taipei would get (test/l10n-default.test.mjs).
// The shell answers the same question for its own words with the same table
// and the same rules (electron/lang.cjs), and that check holds the two equal.

export const SOURCE = 'en';

// Whether a tag a browser or a system reports (`pt-PT`, `zh-Hans-CN`) is one
// of a row's patterns: the tag itself, or `xx-*` for any tag under `xx`.
// Case does not matter; an underscore is read as the hyphen it stands for.
function fits(tag, pattern) {
  const t = String(tag).toLowerCase().replace(/_/g, '-'), p = pattern.toLowerCase();
  return p.endsWith('-*') ? t.startsWith(p.slice(0, -1)) : t === p;
}

// The code of the language a tag names, or null. Traditional Chinese
// (`zh-TW`, `zh-HK`, `zh-Hant`) names none: it is not handed the Simplified
// file, and goes on to the next language in the reader's list.
export function codeForTag(tag, table) {
  if (!tag) return null;
  return table.find(r => r.match.some(p => fits(tag, p)))?.code ?? null;
}

// The code for Steam's API name for a language (`schinese`, `latam`), or null.
export function codeForSteam(name, table) {
  if (!name) return null;
  const n = String(name).toLowerCase();
  return table.find(r => r.steam.includes(n))?.code ?? null;
}

// The language to read in. A choice the player made (`language` in prefs)
// wins, if its file exists: any file, ready or not, so the dev panel and the
// shots tool can force one that is still being translated. With no choice,
// the first of these that names a ready language with a file: on the desk,
// Steam's language for the game and then the system's languages in order;
// in a browser, the browser's languages in order; then English.
//
//   chosen   the `language` preference, or null to follow
//   desk     `desk.language()`, `{ steam, system }`, or null off the desk
//   browser  `navigator.languages`, or null
//   files    the codes that have a file (lang.js's LANGS)
export function pickLanguage({ chosen = null, desk = null, browser = null, files, table }) {
  const has = code => code != null && files.includes(code);
  if (chosen != null && has(chosen)) return chosen;
  const ready = code => has(code) && table.some(r => r.code === code && r.ready);
  const asks = desk
    ? [codeForSteam(desk.steam, table), ...(desk.system || []).map(t => codeForTag(t, table))]
    : (browser || []).map(t => codeForTag(t, table));
  return asks.find(ready) ?? SOURCE;
}

// The family a language's cut face is registered under, or null for a
// language the house mono covers. style.css names the same three in its
// `:lang` blocks.
export const faceFamily = row => (row?.face ? 'Pit ' + row.face : null);
