// What the player has said about how the game should behave, as opposed to
// what has happened in it (`S` and the save). A preference survives a reset
// and does not travel with an exported save, so it has its own key rather
// than a place in state.js's lists.

const KEY = 'boulder-clicker/prefs';

const DEFAULTS = {
  motion: null,      // null = follow the system; true = less; false = full
  muted: false,      // the mute (DESIGN.md, the sound of the yard)
  volume: 1,         // the slider: a share of SND_MASTER, 0..1, so 1 is "quiet"
  touch: null,       // null = follow the pointer; true = a thumb; false = a mouse
  theme: null,       // null = follow the system; else one of THEMES (DESIGN.md, "Dark mode: black stays black")
  readable: false,   // the page's words in the readable face (readable.js)
  crew: 'show',      // the crew drawn 'show', 'fade' or 'hide', so a crowded yard can still be read
  language: null,    // null = follow Steam, the system or the browser; else a file in locales/ (lang.js); read at boot
  feedbackDraft: '', // the feedback form's words, kept until they are sent (feedback.js); never the save
};

let prefs = { ...DEFAULTS };    // page: the player's preferences, which outlive a new game by design
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const had = JSON.parse(raw);
    prefs = { ...DEFAULTS, ...had };
    // Preferences kept before 2026-10-13 (phase two of the language work)
    // carry `lang: 'en'`, written for every player who touched any switch, a
    // choice none of them made, and no `language`. Such a player has been
    // playing in English and goes on in English until they pick otherwise;
    // the old key is dropped. Every blob written since has a `language` key,
    // null or chosen, so this reads only the ones from before.
    if (had && typeof had === 'object' && !('language' in had)) prefs.language = 'en';
    delete prefs.lang;
    // Preferences kept before 2026-10-18 carry `dark: true | false`, from when
    // there was one dark page. A player who chose dark gets the new one.
    if (prefs.theme == null && typeof had?.dark === 'boolean') prefs.theme = had.dark ? 'dark' : 'light';
    delete prefs.dark;
  }
} catch {
  // no storage, or a bad blob: the defaults are the preference
}

export const pref = name => prefs[name];

export function setPref(name, value) {
  prefs[name] = value;
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
}

// Whether the camera and the shake should hold still: the sheet's switch, else
// the system's answer. The node yard has no `matchMedia`, so it gets the full
// picture, which is what the checks are written against.
export function reducedMotion() {
  if (prefs.motion != null) return prefs.motion;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// How the crew is drawn (render.js, a `dim` layer): at full ink, faint, or
// not at all -- the corner's switch (corner.js). A late yard is a crowd, and
// this is the player saying they would rather see the buildings. Anything
// the store holds that is not one of the three is the default.
export const CREW_VIEWS = ['show', 'fade', 'hide'];
export const crewView = () => CREW_VIEWS.includes(prefs.crew) ? prefs.crew : 'show';

// Whether the pointer is a thumb (DESIGN.md, "Playing it on a phone"): the
// sheet's switch, else what the platform says its primary pointer is. Not
// the width and not the user agent -- a narrow desk window keeps its wheel
// and a wide tablet gets the hop, because it is the finger these are for.
// Asked once of the platform and kept: a pointer does not change kind
// mid-game, and every seat in the frame asks this.
let coarsePointer = null;       // page: what the platform says its pointer is
export function coarse() {
  if (forced != null) return forced;
  if (prefs.touch != null) return prefs.touch;
  coarsePointer ??= typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  return coarsePointer;
}
// A phone stood up for a scene or a check, without writing the player's
// preference: in memory only, cleared with null.
let forced = null;              // page: a phone stood up by a scene or a check
export const forceCoarse = v => { forced = v; };

// The page's look (DESIGN.md, "Dark mode: black stays black"): the light
// page; dim, the first dark page, light gray on charcoal turned by
// lightness; or dark, the graphite page where black stays black. `?dim` or
// `?dark` in the address for a shot, else the sheet's switch, else what the
// system asks for, which is the dark one. Asked at boot and at the switch,
// which turns the page in place (ink.js, `setTheme`). The node yard has no `matchMedia` and reads light,
// which is what every check is written against. The head of each page asks
// the same question of the store directly, before the first paint
// (play.html, index.html).
export const THEMES = ['light', 'dim', 'dark'];
export function theme() {
  if (typeof location !== 'undefined') {
    if (/[?&]dim\b/.test(location.search)) return 'dim';
    if (/[?&]dark\b/.test(location.search)) return 'dark';
  }
  if (THEMES.includes(prefs.theme)) return prefs.theme;
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
// Either dark page: what the deep, the veils and the checks ask.
export const dark = () => theme() !== 'light';
// The switch's next look, in the order the sheet steps through them.
export const nextTheme = () => THEMES[(THEMES.indexOf(theme()) + 1) % THEMES.length];

// Whether the page's words are set in the readable face (readable.js): `?readable`
// in the address for a shot, else the sheet's switch. The head of each page
// asks the store the same, before the first paint (play.html, index.html).
export function readable() {
  if (typeof location !== 'undefined' && /[?&]readable\b/.test(location.search)) return true;
  return !!prefs.readable;
}
