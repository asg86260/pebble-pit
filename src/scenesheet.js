// The scenes on the dev panel's `scenes` tab, and the handles the shot tool
// asks for. Imported from the `import.meta.env.DEV` block in main.js, so a
// build has no scenes tab because it has no scenes module.
//
// A scene never touches your save: a scene is a fresh yard (`__reset` clears
// the store), so the first scene pressed in a page copies the store's blob
// aside and sets `S.staged`, which `persist()` declines under. `my yard` puts
// the blob back, and so does a reload while staged.

import { S } from './state.js';
import { forceCoarse, forceMotion } from './prefs.js';
import { letGoDeepFrame } from './view.js';
import { SCENES, byPart } from './scenes.js';
import { hold } from './input.js';
import { restore, bootYard } from './persist.js';
import { loadRaw, saveRaw } from './save.js';
import { devPane } from './dev.js';

const KEPT_KEY = 'boulder-clicker/v4.kept';
const kept = () => { try { return localStorage.getItem(KEPT_KEY); } catch { return null; } };
const keep = raw => { try { if (raw != null) localStorage.setItem(KEPT_KEY, raw); } catch {} };
const forget = () => { try { localStorage.removeItem(KEPT_KEY); } catch {} };

// Put the kept save back and stand the yard on it: `importSave`'s moves
// without the `prev` copy, which would put a synthetic yard where the
// player's last-but-one save was.
export function myYard() {
  const raw = kept();
  if (raw == null) return false;
  saveRaw(raw);
  forget();
  S.staged = false;
  // Back to your own yard is back to your own motion setting too.
  forceMotion(null);
  restore();
  bootYard();
  refresh();
  return true;
}

// The first press keeps the save; every press after is already staged.
export function scene(name) {
  const sc = SCENES[name];
  if (!sc) return false;
  if (!S.staged) { keep(loadRaw()); S.staged = true; }
  hold(false);          // the clock runs from the first frame of the scene
  // A scene that stood the page up as a phone, or asked for less motion or
  // more, does not leave the page that way.
  forceCoarse(null);
  forceMotion(null);
  letGoDeepFrame();
  sc.run();
  refresh();
  return true;
}

// --- the block on the tab ----------------------------------------------------

const block = document.createElement('div');
block.className = 'scenes';
block.id = 'scenes';

const style = document.createElement('style');
style.textContent = `
  #dev .scenes { display: flex; flex-direction: column; gap: 6px; width: 30em; }
  #dev .scenes .part { display: flex; flex-direction: column; gap: 2px; }
  #dev .scenes .head { opacity: .55; }
  #dev .scenes .row { display: flex; flex-wrap: wrap; gap: 3px; }
  #dev .scenes button.mine { align-self: flex-start; }
`;

function refresh() {
  block.replaceChildren();
  // The way back, only while there is one.
  if (S.staged) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mine'; b.textContent = 'my yard';
    b.title = 'put the save you left back';
    b.addEventListener('click', () => { myYard(); hold(false); });
    block.append(b);
  }
  for (const [about, names] of byPart()) {
    const part = document.createElement('div');
    part.className = 'part';
    const head = document.createElement('div');
    head.className = 'head'; head.textContent = about;
    const row = document.createElement('div');
    row.className = 'row';
    for (const name of names) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = name; b.title = SCENES[name].say;
      b.dataset.scene = name;
      b.addEventListener('click', () => scene(name));
      row.append(b);
    }
    part.append(head, row);
    block.append(part);
  }
}

document.head.append(style);
devPane('scenes').append(block);
refresh();

// A staged page reloaded: the store is empty and the kept blob is the
// player's.
if (kept() != null) { S.staged = true; myYard(); }

// What `tools/look.mjs` runs a scene by name through, and lists them through.
Object.assign(window, {
  __scene: scene,
  __scenes: () => byPart(),
  // The bench (scenes.html) frames this page and reads the list through here
  // rather than importing scenes.js into a second window.
  __sceneSay: name => SCENES[name]?.say,
  // A review option that differs from its neighbours by a setting only names
  // a `swap`: moving between two such options of one review flips the setting
  // on the game already standing, rather than standing the whole scene again.
  // True when it swapped; false when the option has none (stand it instead).
  __sceneSwap: name => { const sc = SCENES[name]; if (!sc?.swap) return false; sc.swap(); return true; },
  // The review page (review.html) shows the scenes filed under a `review`,
  // each a button labelled by its `option`, in the order they are written.
  // `text` is everything the option's look says about itself -- its fields
  // and its setup's source -- which the page has the dev server fingerprint
  // to tell the owner what changed since they last looked.
  __reviews: () => {
    const by = new Map();
    for (const [name, sc] of Object.entries(SCENES)) if (sc.review) {
      if (!by.has(sc.review)) by.set(sc.review, []);
      const text = [sc.option, sc.say, sc.stage, String(sc.run), String(sc.swap || '')].join('\n');
      by.get(sc.review).push({ scene: name, label: sc.option || name, say: sc.say, swap: !!sc.swap, stage: sc.stage || null, text });
    }
    // A review's `branch`/`branches` (where its build lives) and `supersedes`
    // (the review names a built one replaces) are gathered over its scenes:
    // the dev server asks git whether those have landed on main.
    const all = (opts, f) => [...new Set(opts.flatMap(o => [].concat(SCENES[o.scene][f] || [])))];
    return [...by].map(([name, options]) => ({ name, options,
      branches: [...new Set([...all(options, 'branch'), ...all(options, 'branches')])], supersedes: all(options, 'supersedes') }));
  },
  __myYard: myYard
});
