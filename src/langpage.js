// The language page (DESIGN.md, "Localization phase two", section 1): one
// row on each settings page opens a page of its own, a button a language,
// each named in itself. The held sheet (settings.js) and the landing page
// (title.js) both build it from here; each says how its own page reloads.
//
// A name is never a message: a language's name for itself reads the same in
// every file, so it comes off the table (locales/languages.json), and each
// button carries its language's tag so it takes that language's face rather
// than the page's.

import { LANG, LANGS, LANGUAGES, chooseLang } from './lang.js';

// The languages offered: the ready ones that have a file. A dev build offers
// every one with a file, so a language still being translated can be read in
// the game it is for; a player never sees one until it is ready.
const DEV = !!import.meta.env?.DEV;
export const offered = () => LANGUAGES.filter(r => LANGS.includes(r.code) && (r.ready || DEV));

// The language in force, as its row: its name for the label beside the row
// that opens the page, so a player lost in a script they cannot read still
// sees their own language's name somewhere on settings.
export const inForce = () => LANGUAGES.find(r => r.code === LANG) || { code: LANG, name: LANG };

// The buttons, into `el`, the one in force inverted as the boards mark a
// chosen thing. A pick of another language writes the choice and hands it to
// `reload`; a pick of the one in force writes it too (a followed language
// becomes a chosen one) and hands it to `stay`, since nothing on the page
// would change.
export function fillLanguages(el, { reload, stay }) {
  el.textContent = '';
  for (const r of offered()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = r.name;
    b.setAttribute('lang', r.code);
    b.dataset.lang = r.code;
    const on = r.code === LANG;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
    b.addEventListener('click', () => {
      chooseLang(r.code);
      (on ? stay : reload)(r.code);
    });
    el.appendChild(b);
  }
}
