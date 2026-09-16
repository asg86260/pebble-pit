// Turning a list of upgrades into rows on a board, and keeping them current.
//
// It knows nothing about what any upgrade does or which board it is filling:
// every board is the same code with a different list.

import { S } from './state.js';
import { P, SHELF_INK, SHELF_DOT, SHELF_FLOAT_SPREAD, SHELF_FOLLOW, SHELF_GLYPH_CELL, SHELF_HAND_CELLS, SHELF_HAND_FADE, GRIT_MOTES, GRIT_SPREAD, GRIT_RISE, GRIT_GRAV, GRIT_LIFE } from './config.js';
import { drawGlyph, glyphFor, badgeFor, cellsOf } from './glyphs.js';
import { ownsCamera } from './beats.js';
import { showTipAt } from './board.js';
import { UPGRADES, lodgers, SECTIONS, buy, billOf, canPay, rungOf, rungsOf, maxed, folds, building, inLine, lineAt, undoable } from './upgrades.js';
import { MARK, gainText, purse, priceText, leftText, ordinal } from './words.js';
import { takesTime, stalled, BUILDER_SITES, rowFor, progressOf, leftAt, workOn, roomAt, bodiesOn } from './works.js';
import { closeSubmenu, keepSubmenu } from './board.js';
import { tookLook } from './world.js';
import { CASINO_UPGRADES, CASINO_SECTIONS } from './casino.js';
import { SCRUB_UPGRADES, SCRUB_SECTIONS } from './scrubhouse.js';
import { QUARRY_UPGRADES, QUARRY_SECTIONS } from './quarry.js';
import { FARM_UPGRADES, FARM_SECTIONS } from './farm.js';
import { APOTHECARY_UPGRADES, APOTHECARY_SECTIONS } from './apothecary.js';
import { TOWER_UPGRADES, TOWER_SECTIONS } from './tower.js';
import { STATS_UPGRADES, STATS_SECTIONS } from './stats.js';
import { OUTHOUSE_UPGRADES, OUTHOUSE_SECTIONS } from './outhouse.js';
import { shackRows, shackSections } from './shack.js';
import { crewRows, crewSections, crewList, crewListSections } from './crewboard.js';
import { shown } from './tween.js';
import { onTap } from './tap.js';
import { coarse } from './prefs.js';

const shopEl = document.getElementById('shop');
const pinEl = document.getElementById('pin');
const casinoEl = document.getElementById('casinoshop');
const crewEl = document.getElementById('crewshop');
const crewListEl = document.getElementById('crewlistrows');
const scrubEl = document.getElementById('scrubshop');
const quarryEl = document.getElementById('quarryshop');
const farmEl = document.getElementById('farmshop');
const apothEl = document.getElementById('apothshop');
const towerEl = document.getElementById('towershop');
const statsEl = document.getElementById('statsshop');
const looEl = document.getElementById('looshop');
const shackEl = document.getElementById('shackshop');

// The sections a board draws: the ones it declares, then a last group holding
// every row nobody named. The rows are the source of truth for what exists;
// forgetting to name one in a section costs a heading, not the row.
const grouped = (list, sections) => {
  const named = new Set(sections.flatMap(x => x.keys));
  const rest = list.map(u => u.key).filter(k => !named.has(k));
  return rest.length ? [...sections, { title: 'and', keys: rest }] : sections;
};

// Revealing is a one-way door. A row may leave because you bought or finished
// it, never because a number dipped or a machine stopped. `once` is the
// condition that reveals, asked only until it is true; `show` is then about
// whether the row has been consumed. A row with no `once` is unchanged.
export const revealed = u => {
  if (!u.once) return u.show();
  if (!S.shownRows.includes(u.key)) {
    if (!u.once()) return false;
    S.shownRows = [...S.shownRows, u.key];
    S.dirty = true;
  }
  return u.show();
};

function shape(list, sections) {
  const out = [];
  for (const sect of grouped(list, sections)) {
    const rows = sect.keys.filter(k => {
      const u = list.find(x => x.key === k);
      // The same two questions `build` asks, in the same order, or the
      // signature says "unchanged" while the board it would build differs.
      return u && revealed(u) && !(S.hideDone && folds(u));
    });
    if (rows.length) out.push(sect.title, ...rows);
  }
  return out.join(',');
}

// What each board was last built with, as a string; the DOM is touched only
// when the *set* of rows changes.
const built = new WeakMap();

// --- the open option list -----------------------------------------------------
// A select's list is a popover over the board, not a fold in the sheet, so
// nothing under it moves when it opens. It hangs off `document.body`: the
// board's container carries a transform, which makes itself the containing
// block for anything `position: fixed` inside it, so a list built into the
// row took its coordinates from the board rather than the window. `#tip` lives
// outside the board for the same reason.
let openList = null;
let leaving = 0;                 // the wander-off timer, if one is running

// Says whether there was one to shut: escape in input.js shuts a list before
// it holds the yard, and only holds it when there was nothing to shut.
export function shutOpts() {
  clearTimeout(leaving);
  leaving = 0;
  if (!openList) return false;
  openList.opts.hidden = true;
  openList.row?.classList.remove('open');
  openList = null;
  return true;
}

// Whether a given list is the one standing open; the pot picker asks before
// re-opening on every pointermove, which would flicker.
export const optsOpen = list => !!openList && openList.opts === list;

// Wandering off puts the list away after a short grace, cancelled when the
// pointer comes back to the list or its control: the gap between the two is a
// place the pointer is briefly outside the thing it is using. Exported for the
// cauldron's picker (potpick.js), which is the same grace.
const LEAVE_MS = 450;
export function leaveSoon() {
  clearTimeout(leaving);
  leaving = setTimeout(shutOpts, LEAVE_MS);
}
export function stayOpen() { clearTimeout(leaving); leaving = 0; }

// Under the control, edges lined up, flipped above when there is no room below
// and pulled back inside the window. Takes a RECT rather than an element
// because a cauldron in the yard has no DOM to measure (potpick.js).
export function openOptsAt(r, opts, row = null, align = 'right') {
  opts.hidden = false;
  // Measured pinned at the origin, where nothing can wrap it: left where it
  // last stood, a list near the window's right edge folds its longest label
  // and reports a width the final position will not have.
  opts.style.top = '0px';
  opts.style.left = '0px';
  const box = opts.getBoundingClientRect();
  const room = innerHeight - r.bottom - 4;
  const top = box.height <= room ? r.bottom : Math.max(4, r.top - box.height);
  // Flush right for a board's dial; centered for a thing in the yard.
  const want = align === 'center'
    ? r.left + r.width / 2 - box.width / 2
    : r.right - box.width;
  const left = Math.max(4, Math.min(want, innerWidth - box.width - 4));
  opts.style.top = `${Math.round(top)}px`;
  opts.style.left = `${Math.round(left)}px`;
  row?.classList.add('open');
  openList = { row, opts };
}

const showOpts = (row, chosen, opts) =>
  openOptsAt(chosen.getBoundingClientRect(), opts, row);

// A press anywhere else puts it away. `pointerdown` rather than `click` so it
// is shut before whatever was pressed acts on it.
addEventListener('pointerdown', e => {
  if (!openList) return;
  if (openList.opts.contains(e.target) || openList.row?.contains(e.target)) return;
  shutOpts();
}, true);
// Escape shuts it too, from input.js's keyboard handler, ahead of the hold.

// The picture a shelf row stands behind: a zero-width anchor on the tile's
// center line that the glyph hangs off (`.tile .pic` in shelf.css).
const PIC = '<span class="pic"></span>';
const COIN_ORDER = ['dust', 'spore', 'shard', 'core', 'spark'];
const STEPPER = '<span class="name"><i class="what"></i><i class="ladder"></i></span>' +
  '<span class="step">' +
  '<button type="button" class="less">-</button>' +
  '<span class="count"></span>' +
  '<button type="button" class="more">+</button></span>';

// Set when the board changed shape (a row arriving or leaving, or a row saying
// something else), read once by the board after it has filled its rows in: the
// measurement has to be of a board with its words already in, which is the
// frame loop's business.
let moved = false;
export const boardMoved = () => { const was = moved; moved = false; return was; };

// The softer word for a cell whose TEXT changed while the set of rows did not.
// The board measures after one of these but keeps its seat when the width
// comes back unchanged (`hud` in board.js), so reading a board cannot walk it.
let reworded = false;
export const boardReworded = () => { const was = reworded; reworded = false; return was; };

// One row per available upgrade, under a heading. Rebuilt only when the set of
// rows changes: rebuilding takes the row under the cursor, and its hover, with
// it.
function build(el, list, sections, empty, heads) {
  const inSubmenu = el === crewListEl;
  // The shelf (DESIGN.md, "The shelf"): a section is a plank and a row a thing
  // standing on it. The crew submenu and the pin keep the cards; the books are
  // a ledger, a line a reading, laid out by the stylesheet on the card markup.
  const ledger = el === statsEl;
  const shelf = !inSubmenu && !ledger;
  el.classList.toggle('shelves', shelf);
  el.classList.toggle('ledger', ledger);
  // A board whose one heading repeats its title drops the heading. The name is
  // read off the title once and kept, because the title may be wearing a badge
  // by the second time through and would never match its heading again.
  const titleEl = el.closest('.page')?.querySelector('.title');
  if (titleEl && !titleEl.dataset.name) titleEl.dataset.name = titleEl.textContent.trim();
  const title = titleEl?.dataset.name;
  const lone = grouped(list, sections).length === 1;
  // A board with a single group has no heading for a headcount to ride, so
  // `refresh` wears it on the title instead.
  el._titled = lone && heads && titleEl ? { el: titleEl, heads } : null;
  const now = shape(list, sections);
  if (built.get(el) === now) return;
  built.set(el, now);

  // Said rather than measured here: the rows built below are empty until
  // `refresh` puts the words in, and a board measured between the two comes out
  // shorter than it will be.
  moved = true;

  // The open list's popover is out on the body, so clearing the board would not
  // take it with it. Each row carries a handle to its own; only this board's go.
  shutOpts();
  for (const old of el.querySelectorAll('[data-dial]')) old._opts?.remove();
  el.textContent = '';
  if (!now) {                              // nothing to show: say so rather than nothing
    const line = document.createElement('div');
    line.className = 'empty';
    line.textContent = empty;
    el.appendChild(line);
    return;
  }
  for (const sect of grouped(list, sections)) {
    const rows = sect.keys
      .map(k => list.find(u => u.key === k))
      .filter(u => u && revealed(u))
      // a section with nothing left in it goes with its finished rows
      .filter(u => !(S.hideDone && folds(u)));
    if (!rows.length) continue;

    if (!(lone && sect.title === title)) {
      const head = document.createElement('div');
      // The goal section is the one heading drawn differently (`.goal` in
      // style.css, `SECTIONS` in upgrades.js).
      head.className = sect.goal ? 'sect goal' : 'sect';
      head.dataset.sect = sect.title;
      el.appendChild(head);
    }

    for (const u of rows) {
      // A dial is the shape of a job row (a setting between two buttons) for a
      // setting that is not a headcount and spends nothing.
      if (u.dial) {
        const row = document.createElement('div');
        row.className = 'job';
        row.dataset.dial = u.key;

        // A dial with named `options` is picked off a list; a number keeps its
        // two buttons.
        if (u.options) {
          row.classList.add('pickrow');
          row.innerHTML = (shelf ? PIC : '') + '<span class="name"><i class="what"></i></span>' +
                          '<button type="button" class="chosen"></button>' +
                          (u.note ? '<span class="note"></span>' : '');
          if (shelf) row.classList.add('tile');
          row.querySelector('.what').textContent = u.name;
          const chosen = row.querySelector('.chosen');
          // Out on the body, clear of the board's transform. The row keeps a
          // handle on it so a rebuild can take it away again.
          const opts = document.createElement('div');
          opts.className = 'optspop';
          opts.hidden = true;
          opts.dataset.forDial = u.key;
          document.body.appendChild(opts);
          row._opts = opts;
          // Wandering off shuts it; coming back to either half calls that off.
          opts.addEventListener('pointerenter', stayOpen);
          opts.addEventListener('pointerleave', leaveSoon);
          row.addEventListener('pointerenter', stayOpen);
          row.addEventListener('pointerleave', leaveSoon);
          for (const o of u.options()) {
            const pick = document.createElement('button');
            pick.type = 'button';
            pick.className = 'opt';
            pick.dataset.opt = o.key;
            pick.textContent = o.label;
            pick.addEventListener('click', () => { u.pick(o.key); shutOpts(); });
            opts.appendChild(pick);
          }
          // The list lies over the board, so no `moved` here. Only one is open
          // at a time.
          chosen.addEventListener('click', () => {
            const opening = opts.hidden;
            shutOpts();
            if (opening) showOpts(row, chosen, opts);
          });
          el.appendChild(row);
          continue;
        }

        row.innerHTML = (shelf ? PIC : '') + STEPPER + (u.note ? '<span class="note"></span>' : '');
        if (shelf) row.classList.add('tile');
        row.querySelector('.what').textContent = u.name;
        row.querySelector('.less').addEventListener('click', () => u.less());
        row.querySelector('.more').addEventListener('click', () => u.more());
        el.appendChild(row);
        continue;
      }

      // A job row moves bodies rather than spending anything: a count between
      // two buttons.
      if (u.job) {
        const row = document.createElement('div');
        row.className = shelf ? 'job tile' : 'job';
        row.dataset.job = u.key;
        row.innerHTML = (shelf ? PIC : '') + STEPPER;
        row.querySelector('.what').textContent = u.name;
        row.querySelector('.less').addEventListener('click', () => u.less());
        row.querySelector('.more').addEventListener('click', () => u.more());
        el.appendChild(row);
        continue;
      }

      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.key = u.key;
      // The pips live *inside* the name so they sit under the title whatever
      // the rest of the row does; the clock is a cell of its own so the bill
      // is coins only. On a shelf the same cells stand under a picture and the
      // clock is inside the price's box (`.tag`). `refresh` finds every cell
      // by class, so either shape reads the same.
      b.innerHTML = shelf
        ? PIC + '<span class="name"><i class="what"></i><i class="ladder"></i></span>' +
          '<span class="gain"></span><span class="tag"><span class="cost"></span><span class="time"></span></span>' +
          (u.note ? '<span class="note"></span>' : '')
        : '<span class="name"><i class="what"></i><i class="ladder"></i></span>' +
          '<span class="gain"></span><span class="time"></span><span class="cost"></span>' +
          (u.note && !inSubmenu ? '<span class="note"></span>' : '');
      // A readout (`u.read`) and the pinned card do not answer the cursor;
      // nor does any tile under a thumb, which has no cursor to answer
      // (DESIGN.md, "A tap buys": a hover a phone can see is a tap it eats).
      if (shelf) { b.classList.add('tile'); if (!u.read && el !== pinEl && !coarse()) leanToCursor(b, u.key); }
      // The goal card wears its section's title as a sign on its own frame
      // (shelf.css), since the goal heading itself is not drawn on a shelf.
      if (sect.goal) { b.classList.add('goal'); b.dataset.sign = sect.title; }
      // The pushpin in the card's corner (`fillPin`). Not a press on the card,
      // so the press is stopped here. A readout has nothing to wait for and a
      // signpost has no price, so neither carries one.
      if (!u.read && !u.sign && !inSubmenu) {
        const pin = document.createElement('i');
        pin.className = 'pinmark';
        pin.title = 'pin this card to the corner';
        const press = e => { e.stopPropagation(); e.preventDefault(); togglePin(u.key); };
        pin.addEventListener('pointerdown', press);
        pin.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); });
        b.appendChild(pin);
      }
      // A card wears its description inline (`sayNote`); the crew submenu and a
      // shelf tile have no line for it, so the tip carries it. The goal card
      // keeps its sentence in place. A tile in line says what a press does,
      // since it is the one press that undoes a purchase.
      const tells = (inSubmenu || (shelf && !sect.goal)) && (u.note || takesTime(u));
      const say = tells ? () => {
        const r = b.getBoundingClientRect();
        const words = undoable(u) ? 'just bought -- press to take it back' : inLine(u) ? 'in line -- press to hand it back' : u.note ? u.note() : null;
        if (!words) { showTipAt(null); return; }
        // Off the board for a card (a note under the board's layer is a note
        // nobody reads), over the neighbors for a shelf tile.
        showTipAt(words, r.right + 8, r.top - 2, false, shelf);
      } : null;
      if (u.read) b.classList.add('stat');
      // A purchase leaves the board up: a site takes a line (DESIGN.md, "The
      // queue"), and the point of a line is pressing the next row from here.
      // A tap, not a click (tap.js): a press that scrolled the board or
      // lingered on it buys nothing, and a long press asks about the row
      // instead, which is what a hover did for a mouse.
      else onTap(b, () => {
        tookLook();                            // anything the yard sent earlier
        buy(u);
        tookLook();                            // and whatever this purchase sent
      }, { long: say });
      // A door opens what is behind it on the way in, not on the press; the
      // press is wired too (on the row itself) because a finger cannot hover.
      // Every other board row, hovered, puts away whatever the last door led
      // to. Rows inside the submenu are exempt: they are the answer, not the
      // question, and this same builder makes them.
      if (u.over) { b.classList.add('door'); b.addEventListener('pointerenter', () => u.over()); }
      // Put away by being *stood on*, not crossed: this row is on the way to
      // the list, so the fold waits a grace (board.js, `closeSubmenu`).
      else if (!inSubmenu) {
        b.addEventListener('pointerenter', () => closeSubmenu());
        b.addEventListener('pointerleave', () => keepSubmenu());
      }
      // The corner comes off the card you went and looked at; hovering is the
      // cheapest true evidence a row was read. A finger cannot hover, so the
      // press clears it too.
      b.addEventListener('pointerenter', () => markRowSeen(u));
      b.addEventListener('pointerdown', () => markRowSeen(u));
      // On a desk the tip comes up under the cursor; under a thumb there is
      // no cursor, and the long press above is the way to ask.
      if (say && !coarse()) {
        b.addEventListener('pointerenter', say);
        b.addEventListener('pointermove', say);
        b.addEventListener('pointerleave', () => showTipAt(null));
      }
      // A note brought up by a long press goes with the finger.
      if (say) b.addEventListener('pointerup', () => { if (coarse()) showTipAt(null); });
      el.appendChild(b);
    }
  }
}

// The numbers on the rows, every frame the board is open. A cell is written
// only when what it says changes: `innerHTML` is a parse, and this runs on
// every cell of every row every frame.
// A count runs through the tweener; a dial's value can be words, which do not.
const sayCount = (key, v) => typeof v === 'number' ? String(Math.round(shown('count:' + key, v))) : String(v);
const say = (el, text) => { if (el._said !== text) { el._said = text; el.textContent = text; reworded = true; } };
// A place in a line: the first waiting is `next`, the rest count from there.
export const placeWord = n => (n <= 1 ? 'next' : ordinal(n));
const sayHTML = (el, html) => { if (el._said !== html) { el._said = html; el.innerHTML = html; reworded = true; } };
const grey = (el, off) => { if (el.disabled !== off) el.disabled = off; };
const sayNote = (row, u) => { const n = row.querySelector('.note'); if (n && typeof u.note === 'function') say(n, u.note()); };

// A headcount worn after a line of words. The words are the line's only text,
// so overwriting them can never leave a stale badge behind; the badge is its
// own element so it can be styled apart from a heading that stays dim. Written
// only when it changes, since building an element every frame lays the whole
// panel out every frame.
function wearBadge(line, words, n) {
  n = Math.round(shown('badge:' + words, n));
  if (line.dataset.count === String(n)) return;
  line.dataset.count = n;
  moved = true;                            // a badge is a word, and words have a width
  line.textContent = words;
  if (n) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = n;
    line.appendChild(badge);
  }
}

// The picture on a shelf tile, redrawn only when its key changes: the two
// inks, `built` (cells up so far on a tile being built, so it is redrawn once
// a cell and not once a frame) and `hands` (each frame's pose of the bodies at
// the site, so a tile with a body swinging on it is redrawn and one with
// nobody is not).
function wearGlyph(row, key, tint, ink, built = null, hands = []) {
  const pic = row.querySelector('.pic');
  if (!pic) return;
  const pose = hands.map(h => `${Math.round(h.dy)}@${h.on.toFixed(2)}:${h.chips.map(c => `${Math.round(c.x)},${Math.round(c.y)},${c.a.toFixed(1)}`).join(';')}`).join('|');
  const drawn = `${tint}/${ink}/${built}/${pose}`;
  if (pic.dataset.tint !== drawn) { pic.dataset.tint = drawn; pic.replaceChildren(drawGlyph(glyphFor(key), tint, ink, badgeFor(key), built, hands)); }
}

// The hands on a tile being built (DESIGN.md, "A hand on the tile"), read off
// the yard's own builders. A body's pose is where it is against its own foot
// (`workJig` sets the hop and the lunge), scaled from the yard's cell to the
// glyph's; its chips are `spawnGrit`'s grit at the same scale, thrown on the
// frame its count of blows changes. `on` climbs from nought to one over
// `SHELF_HAND_FADE` frames after the body steps on and falls back after it
// steps off; a body that has left stays on the tile's list until it has faded,
// throwing nothing.
const hits = new WeakMap();
const SCALE = SHELF_GLYPH_CELL / P;
const seen = new Map();                        // key -> Map(body -> on)
function handsFor(key) {
  const here = bodiesOn(key), was = seen.get(key) || new Map();
  const now = new Map();
  for (const [w, on] of was) if (!here.includes(w) && on > 1 / SHELF_HAND_FADE) now.set(w, on - 1 / SHELF_HAND_FADE);
  for (const w of here) now.set(w, Math.min(1, (was.get(w) ?? 0) + 1 / SHELF_HAND_FADE));
  if (now.size) seen.set(key, now); else seen.delete(key);
  return [...now].map(([w, on]) => {
    const gone = !here.includes(w);
    const dy = gone ? 0 : ((w.y - w.foot) / P + (w.lunge || 0)) * SHELF_GLYPH_CELL;
    let chips = hits.get(w)?.chips || [];
    const last = hits.get(w)?.hits;
    if (!gone && last !== undefined && last !== w.hits) {
      const side = SHELF_HAND_CELLS * SHELF_GLYPH_CELL;
      for (let i = 0; i < GRIT_MOTES; i++) {
        const dir = i % 2 ? 1 : -1, k = (i >> 1) / Math.max(1, (GRIT_MOTES >> 1) - 1);
        chips.push({ x: side, y: side / 2,
                     vx: dir * GRIT_SPREAD * (0.5 + k) * SCALE, vy: -GRIT_RISE * (0.6 + k * 0.8) * SCALE,
                     t: 0, life: GRIT_LIFE * (0.7 + k * 0.6) });
      }
    }
    // grit stops at the floor, the body's own foot, as the yard's does
    const floor = SHELF_HAND_CELLS * SHELF_GLYPH_CELL - SHELF_GLYPH_CELL;
    chips = chips.map(c => ({ ...c, t: c.t + 1 / 60, vy: c.vy + GRIT_GRAV / 60 * SCALE, x: c.x + c.vx, y: Math.min(floor, c.y + c.vy) }))
                 .filter(c => c.t < c.life)
                 .map(c => ({ ...c, a: 1 - (c.t / c.life) ** 2 }));
    hits.set(w, { hits: w.hits, chips });
    return { dy, chips, on };
  });
}

export function refresh(el, list, headcount) {
  if (el._titled) wearBadge(el._titled.el, el._titled.el.dataset.name, el._titled.heads());
  for (const row of el.children) {
    if (row.dataset.sect) {
      wearBadge(row, row.dataset.sect, headcount ? headcount(row.dataset.sect) : 0);
      continue;
    }
    if (row.dataset.dial) {
      const u = list.find(x => x.key === row.dataset.dial);
      if (!u) continue;
      if (u.options) {
        // The shut list says which one is set; the open one also marks it, so
        // you can see what you are changing from.
        say(row.querySelector('.chosen'), u.value());
        const at = String(u.at ? u.at() : '');
        for (const o of row._opts?.querySelectorAll('.opt') || [])
          o.classList.toggle('on', o.dataset.opt === at);
      } else {
        grey(row.querySelector('.less'), u.lo());
        say(row.querySelector('.count'), sayCount(u.key, u.value()));
        grey(row.querySelector('.more'), u.hi());
      }
      sayNote(row, u);
      wearGlyph(row, u.key, null, '#000');
      continue;
    }
    if (row.dataset.job) {
      const u = list.find(x => x.key === row.dataset.job);
      if (!u) continue;
      grey(row.querySelector('.less'), u.count() < 1);
      say(row.querySelector('.count'), sayCount(u.key, u.count()));
      grey(row.querySelector('.more'), u.spare() < 1);
      wearGlyph(row, u.key, null, '#000');
      continue;
    }
    const u = list.find(x => x.key === row.dataset.key);
    if (!u) continue;
    row.classList.toggle('pinned', S.pinned === u.key);
    sayNote(row, u);
    // Each coin of the bill is its own cell and says whether you have it: "you
    // are short of something" is not "you are short of *this*". The price is
    // not run through the tweener: a price only changes when the next rung is
    // up, and a number counting from the old bill to the new read as the thing
    // you had just bought going up under you.
    const said = ([money, n]) =>
      `<span class="${purse(money) >= n ? 'have' : 'short'}">${MARK[money]} ${priceText(money, n)}</span>`;
    const full = billOf(u);
    // The coins in the order the yard hands them out, whatever order the row
    // wrote its bill in.
    const bill = full.filter(([m]) => m !== 'time')
      .sort((a, b) => COIN_ORDER.indexOf(a[0]) - COIN_ORDER.indexOf(b[0])).map(said).join('');
    const clock = full.filter(([m]) => m === 'time').map(said).join('');
    // By class, never by position: a shelf tile and a card lay the cells out
    // differently.
    const gain = row.querySelector('.gain'), time = row.querySelector('.time'), price = row.querySelector('.cost');
    const what = row.querySelector('.what'), ladder = row.querySelector('.ladder');
    const waits = u.waits?.() || '';
    // The work on this row, if the yard is building it or has it in line: the
    // picture and the tag are about the build then, not the offer.
    const mine = takesTime(u) ? workOn(u.key) : null;
    const pic = row.querySelector('.pic');           // set on a shelf tile; the gain reads it below
    if (pic && mine) {
      // Drawn to the share done, no stroke (a stroke is the next rung's legend,
      // and there is no next rung on a thing not up). A row in line is a plan:
      // the outline and nothing in it.
      const rows = glyphFor(u.key);
      wearGlyph(row, u.key, null, '#000', inLine(u) ? 'plan' : Math.floor(progressOf(mine) * cellsOf(rows)), inLine(u) ? [] : handsFor(u.key));
    } else if (pic) {
      const coins = full.map(([m]) => m);
      const tint = maxed(u) ? SHELF_INK.done
                 : coins.includes('spark') ? SHELF_INK.spark
                 : coins.includes('shard') ? SHELF_INK.shard
                 : coins.includes('spore') ? SHELF_INK.spore : null;
      const ink = waits || full.some(([m, n]) => m !== 'time' && purse(m) < n) ? SHELF_INK.short : '#000';
      // A hand fades out over the finished drawing rather than vanishing.
      // `seen` has an entry only for a tile that had a hand, so every other
      // tile pays nothing here.
      wearGlyph(row, u.key, tint, ink, null, seen.has(u.key) ? handsFor(u.key) : []);
    }

    // How far up the ladder, as pips under the words.
    if (ladder) {
      // Counted off the row, not the constant: the kit ladders are shorter
      // (`rungsOf`).
      const at = u.rung ? rungOf(u) : 0;
      const of = rungsOf(u);
      // A pip is an element, not a glyph: the circles were text once (●○)
      // and their pitch was a letter-spacing tuned to one font, which on a
      // phone's font stacked them on top of each other. A box is the same
      // size in every font, and the stylesheet sets the pitch.
      const pip = i => (i < at ? '<i class="on"></i>' : '<i></i>');
      const pips = u.rung ? Array.from({ length: of }, (_, i) => pip(i)) : [];
      // A banded ladder draws its pips a group a band, each an element so the
      // stylesheet can tint it in the band's coin. A ladder with no bands is
      // one group, since the shelf sets its pips by the group element.
      const groups = [];
      if (pips.length) for (let i = 0; i < pips.length; i += u.group || pips.length) groups.push(`<b>${pips.slice(i, i + (u.group || pips.length)).join('')}</b>`);
      const want = groups.join('');
      if (ladder.innerHTML !== want) ladder.innerHTML = want;
    }

    // A row the yard is building says so where the numbers go; a row in line
    // says where it stands and stays pressable, because pressing it again is
    // how it is handed back (DESIGN.md, "The queue").
    if (takesTime(u)) {
      if (mine) {
        say(what, u.name);
        // The vocabulary is closed, and every word fits the tightest cell on
        // any board (`pinWidth` in board.js, the width check in
        // selftest/boards.js). A builders' site always has somebody, so it is
        // never stuck.
        row.classList.add('waiting');
        const queued = inLine(u);
        const stuck = !queued && stalled(u.site) && !BUILDER_SITES.includes(u.site);
        // Two words about bodies: `building` while somebody is at it, `queued`
        // while nobody is. The tile says which by the rest of it.
        sayHTML(gain, queued || stuck ? 'queued' : 'building');
        // A paid bill is not a price: the tag holds the time left, or for a
        // row in line its place. The place is in the LINE, not among the
        // site's works: a site building two at once has its first waiting row
        // third in the list and next in line.
        sayHTML(price, '');
        // For a moment after the press the tag is the way back (DESIGN.md,
        // "A tap buys"): a tap on it puts the bill back -- one word, since a tag
        // is one word and a sentence ran off the card. The clock takes
        // over when the moment is up.
        const undo = undoable(u);
        sayHTML(time, undo ? '<span class="have">undo</span>'
                     : `<span class="have">${queued ? placeWord(lineAt(u) - roomAt(u.site)) : MARK.time + ' ' + leftText(leftAt(u.site, u.key))}</span>`);
        if (row.classList.contains('building') !== (!queued && !stuck)) row.classList.toggle('building', !queued && !stuck);
        if (row.classList.contains('queued') !== !!queued) row.classList.toggle('queued', !!queued);
        if (row.classList.contains('undo') !== undo) row.classList.toggle('undo', undo);
        // Greyed while being built; live while it waits, so a press can pull
        // it back out -- and live while it can be undone.
        grey(row, !queued && !undo);
        // Pressable but not on offer: `off` keeps the shelf's hover away.
        row.classList.add('off');
        continue;
      }
    }
    if (!waits && row.classList.contains('waiting')) row.classList.remove('waiting');
    if (row.classList.contains('building')) row.classList.remove('building');
    if (row.classList.contains('undo')) row.classList.remove('undo');
    if (row.classList.contains('queued')) row.classList.remove('queued');
    if (row.classList.contains('locked') !== !!waits) row.classList.toggle('locked', !!waits);


    // a dot on any purchase that has not been on a board you looked at; a
    // readout is not a thing to have missed
    const fresh = !u.read && !S.seenRows.includes(u.key);
    if (row.classList.contains('new') !== fresh) row.classList.toggle('new', fresh);

    say(what, u.name);
    // "done" rather than a price: a price on a row you cannot buy looks like
    // one you cannot afford.
    if (maxed(u)) {
      sayHTML(gain, '');
      sayHTML(price, 'done'); sayHTML(time, '');
      grey(row, true); row.classList.add('off');
      continue;
    }
    // A next rung priced in a coin the yard has no source for yet says what it
    // is waiting on where the status goes, with no price: a bill in a coin the
    // player has not met is not a price (`coinNeeds`).
    if (waits) {
      row.classList.add('waiting');
      sayHTML(gain, waits);
      sayHTML(price, ''); sayHTML(time, '');
      grey(row, true); row.classList.add('off');
      continue;
    }
    // On a shelf the gain is the number alone -- the name is the verb.
    const g = gainText(u);
    sayHTML(gain, pic && u.does && g.startsWith(u.does + ' ') ? g.slice(u.does.length + 1) : g);
    // A row that is not a purchase says what it *pays* where a price would go.
    // The casino's decisions are the only ones: none costs anything, and the
    // number each is about is the pot.
    sayHTML(price, u.price ? u.price() : bill); sayHTML(time, u.price ? '' : clock);
    const off = u.price ? !!u.dead?.() : !canPay(u);
    grey(row, off);
    // The hover, the lift and the lean key off `off`, never off `disabled`.
    row.classList.toggle('off', off);
  }
  if (el.classList.contains('shelves')) phaseDots(el);
}

// A lifted tile leans toward the cursor, up to SHELF_FOLLOW px at the edge, in
// whole pixels so the dots stay on their grid. It drifts at a rate and in a
// direction hashed off the row's key, so a plank never breathes in unison.
function leanToCursor(b, key) {
  let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  b.style.setProperty('--sway-rate', String(1 + ((h % 1000) / 1000 * 2 - 1) * SHELF_FLOAT_SPREAD));
  b.style.setProperty('--sway-dir', (h >> 10) & 1 ? 'reverse' : 'normal');
  b.addEventListener('pointermove', e => {
    // a tile you cannot pay for, or that is not for sale, does not lean
    if (b.disabled || b.classList.contains('off') || b.classList.contains('stat')) return;
    const r = b.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.right) / 2) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.bottom) / 2) / (r.height / 2);
    b.style.setProperty('--follow-x', `${Math.round(Math.max(-1, Math.min(1, dx)) * SHELF_FOLLOW)}px`);
    b.style.setProperty('--follow-y', `${Math.round(Math.max(-1, Math.min(1, dy)) * SHELF_FOLLOW)}px`);
  });
  b.addEventListener('pointerleave', () => { b.style.setProperty('--follow-x', '0px'); b.style.setProperty('--follow-y', '0px'); });
}

// Each tile's dots, phased to the sheet's so the two coincide to the pixel:
// the tile draws the same pattern shifted back by its own offset modulo
// SHELF_DOT. Layout offsets, never rects: a rect carries the tile's transform,
// and a lifted tile re-phased off its moving rect had its dots pinned to the
// ground while the plate moved.
const laidAt = e => { let x = 0, y = 0; for (; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return [x, y]; };
function phaseDots(el) {
  // The dots are painted on the sheet from its padding edge; on a page with
  // no sheet the rows paint them and the rows are the box.
  const ground = el.closest('.sheet') || el;
  const [gx0, gy0] = laidAt(ground);
  const gx = gx0 + ground.clientLeft, gy = gy0 + ground.clientTop;   // clientLeft/Top: the border
  for (const t of el.querySelectorAll('.tile')) {
    // A tile that went dear under the cursor keeps no lean: the reset is on
    // pointer-leave, and the pointer has not left.
    if ((t.disabled || t.classList.contains('off')) && t.style.getPropertyValue('--follow-x')) { t.style.removeProperty('--follow-x'); t.style.removeProperty('--follow-y'); }
    const [tx, ty] = laidAt(t);
    const left = tx - gx, top = ty - gy;
    const key = `${left},${top}`;
    if (t._dots === key) continue;
    t._dots = key;
    t.style.setProperty('--dot-x', `${-(((left % SHELF_DOT) + SHELF_DOT) % SHELF_DOT)}px`);
    t.style.setProperty('--dot-y', `${-(((top % SHELF_DOT) + SHELF_DOT) % SHELF_DOT)}px`);
  }
}

// --- what is new on it --------------------------------------------------------
// A card you have never had on a board carries a turned-down corner until you
// have looked at it. Cleared by the hover on that one card and nothing else: a
// hover cannot happen before the card is under the cursor, so a mark can
// never go in the frame it was drawn.
export function markRowSeen(u) {
  if (!u || S.seenRows.includes(u.key)) return;
  // A fresh array rather than a push: the save notices a new array where it
  // can miss a mutation in place.
  S.seenRows = [...S.seenRows, u.key];
  S.dirty = true;
}

// The crew board, a list of people that changes length whenever anybody is
// hired.
export function buildCrew() {
  build(crewEl, crewRows(), crewSections(), 'nobody lives here yet');
}

export function buildCrewList() {
  build(crewListEl, crewList(), crewListSections(), 'nobody lives here yet');
}

// Every board, by the name the panel knows it by. Each row is asked for rather
// than held: farm.js and quarry.js import this file back, so their lists do
// not exist yet when this line runs.
const BOARDS = {
  bench:  () => [shopEl, UPGRADES.filter(u => !u.board), SECTIONS, 'nothing to sell'],
  casino: () => [casinoEl, CASINO_UPGRADES, CASINO_SECTIONS, 'nothing on the table'],
  scrub:  () => [scrubEl, SCRUB_UPGRADES, SCRUB_SECTIONS, 'nothing to fit'],
  // Each ground draws the kit row that lodges with it (`lodgers`).
  quarry: () => [quarryEl, [...QUARRY_UPGRADES, ...lodgers('quarry')], QUARRY_SECTIONS, 'the quarry is as deep as it goes'],
  farm:   () => [farmEl, [...FARM_UPGRADES, ...lodgers('farm')], FARM_SECTIONS, 'the ground is all broken'],
  apothecary: () => [apothEl, APOTHECARY_UPGRADES, APOTHECARY_SECTIONS, 'the pot stands cold'],
  tower:  () => [towerEl, TOWER_UPGRADES, TOWER_SECTIONS, 'nothing stirs in here yet'],
  // The books and the record, two sections on the one sheet.
  stats:  () => [statsEl, STATS_UPGRADES, STATS_SECTIONS, 'nothing has come in yet'],
  outhouse: () => [looEl, OUTHOUSE_UPGRADES, OUTHOUSE_SECTIONS, 'the brooms are all on their hooks'],
  // The fifth thing is whom the sheet counts: the shack has one group and so
  // no heading to hang the rockhands on, so the count rides the title.
  shack:  () => [shackEl, shackRows(), shackSections(), 'the tools are all on the rock', () => S.rockhands]
};

// One board, rebuilt if the set of rows on it has moved. The open board asks
// every frame instead of being told: a work landing by itself, frames after
// the press, has nobody to say so, and `build` returns without touching the
// DOM unless the set has changed.
export function buildBoard(which) {
  const board = BOARDS[which];
  if (board) build(...board());
}

export function buildShop() {
  for (const which of Object.keys(BOARDS)) buildBoard(which);
}

// Draw rows into any element with no yard behind them, for the card bench
// (cards.html) and the shelf bench (shelf.html, which hands `sections` through
// so the planks are the real planks).
export function mountRows(el, rows, title = 'the bench', sections = null) {
  const list = rows.map(u => ({ show: () => true, ...u }));
  build(el, list, sections || [{ title, keys: list.map(u => u.key) }], '', null);
  refresh(el, list, null);
}

// --- the pin ------------------------------------------------------------------
// One card in the corner of the game, the same row through the same builder
// as the board's, so the two cannot disagree. One at a time; it comes down by
// itself when the row retires. `S.pinned` is the saved key; a key no build
// knows reads as nothing pinned.
//
// The goal pins itself when a shield row arrives and the corner is empty,
// once: going up in the corner is being seen (`markRowSeen`), and a seen
// shield does not climb back into a corner you emptied. The player's pin wins.
export const togglePin = key => {
  S.pinned = S.pinned === key ? null : key;
  S.dirty = true;
};

const goalRow = () => {
  const goal = SECTIONS.find(s => s.goal);
  if (!goal) return null;
  return UPGRADES.find(u => goal.keys.includes(u.key) && !u.sign && revealed(u)
                            && !S.seenRows.includes(u.key)) || null;
};

export function fillPin() {
  if (!pinEl) return;
  let u = S.pinned ? rowFor(S.pinned) : null;
  if (u && !(revealed(u) && !maxed(u))) { u = null; S.pinned = null; S.dirty = true; }
  // Not while a scene has the camera: the next shield's row arrives on the
  // frame the last one breaks, mid-cutscene.
  if (!u && !ownsCamera()) {
    u = goalRow();
    if (u) { S.pinned = u.key; markRowSeen(u); S.dirty = true; }
  }
  pinEl.hidden = !u;
  if (!u) { built.delete(pinEl); return; }
  build(pinEl, [u], [{ title: '', keys: [u.key] }], '', null);
  refresh(pinEl, [u], null);
}



export { UPGRADES, CASINO_UPGRADES, QUARRY_UPGRADES, FARM_UPGRADES };
