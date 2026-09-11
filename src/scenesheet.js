// The scenes on the held sheet, and the two handles the shot tool asks for.
//
// The held sheet is the one surface that is not the yard, and it is where the
// settings went for the same reason; the scenes go under them, below a rule.
// One heading per part of the game (`ABOUT`, scenes.js) and under each a row
// of the sheet's own buttons, one per scene. Pressing one runs the scene,
// closes the sheet and lets the clock go, so the yard is standing where the
// scene says with the player looking at it.
//
// Nothing here is in index.html: this module appends its own block to the
// sheet when it is imported, and it is imported from the `import.meta.env.DEV`
// block in main.js beside dev.js. A build has no scenes section because it has
// no scenes module -- one gate, and the one the dev panel already stands
// behind -- so there is no second gate to forget.
//
// A scene never touches your save. The sheet is reachable on the player's own
// game, and a scene is a fresh yard (`__reset` clears the store), so pressing
// one would put a synthetic yard over an evening's play. So the first scene
// pressed in a page copies the store's blob aside, sets `S.staged`, and
// `persist()` declines while it is set. `my yard` puts the blob back. A page
// reloaded while staged comes up on the kept save too: this module puts it
// back on load, before anybody has had time to notice the fresh yard.

import { S } from './state.js';
import { SCENES, byPart } from './scenes.js';
import { hold } from './input.js';
import { restore, bootYard } from './persist.js';
import { loadRaw, saveRaw } from './save.js';

const KEPT_KEY = 'boulder-clicker/v4.kept';
const kept = () => { try { return localStorage.getItem(KEPT_KEY); } catch { return null; } };
const keep = raw => { try { if (raw != null) localStorage.setItem(KEPT_KEY, raw); } catch {} };
const forget = () => { try { localStorage.removeItem(KEPT_KEY); } catch {} };

// Put the kept save back and stand the yard on it: the same three moves a
// save coming in through the sheet's paste makes (`importSave`), without the
// copy of the yard being left that `importSave` keeps as `prev` -- a scene is
// nobody's run, and keeping it would put a synthetic yard where the player's
// last-but-one save was.
export function myYard() {
  const raw = kept();
  if (raw == null) return false;
  saveRaw(raw);
  forget();
  S.staged = false;
  restore();
  bootYard();
  S.dirty = true;
  refresh();
  return true;
}

// Stand the yard at a scene. The first press keeps the save; every press
// after that is already on a staged page and the kept blob is the player's.
export function scene(name) {
  const sc = SCENES[name];
  if (!sc) return false;
  if (!S.staged) { keep(loadRaw()); S.staged = true; }
  hold(false);          // the clock runs from the first frame of the scene
  sc.run();
  refresh();
  return true;
}

// --- the block on the sheet --------------------------------------------------

const sheet = document.getElementById('held');
const block = document.createElement('div');
block.className = 'scenes';
block.id = 'scenes';

const style = document.createElement('style');
// The sheet's own hand: the record's width, a heading per part in the small
// hand the keys are written in, and the buttons wrapped under it. Scrolls
// past the record's height, so a hundred buttons do not push the settings
// off the bottom of the window.
style.textContent = `
  .held .scenes { display: flex; flex-direction: column; gap: 8px; width: 34em; max-width: 80vw;
                  max-height: 34vh; overflow-y: auto; text-transform: none; letter-spacing: 0; }
  .held .scenes .part { display: flex; flex-direction: column; gap: 4px; }
  .held .scenes .head { letter-spacing: .14em; text-transform: uppercase; font-size: 10px; }
  .held .scenes .row { display: flex; flex-wrap: wrap; gap: 4px; }
  .held .scenes button { font-size: 10px; padding: 1px 5px; }
  .held .scenes button.mine { align-self: flex-start; }
`;

function refresh() {
  block.replaceChildren();
  const rule = document.createElement('div');
  rule.className = 'rule';
  block.append(rule);
  // The way back, only while there is one: a page that has not pressed a
  // scene has nothing kept and no button.
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
sheet.append(block);
refresh();

// A staged page reloaded: the store is empty (the scene's `__reset` cleared
// it) and the kept blob is the player's. Put it back before the fresh yard
// has drawn more than a frame or two.
if (kept() != null) { S.staged = true; myYard(); }

// The handles the shot tool asks for -- `tools/look.mjs` runs a scene by name
// through the first and lists them through the second -- on the same window
// the other handles hang from.
Object.assign(window, {
  __scene: scene,
  __scenes: () => byPart(),
  __myYard: myYard
});
