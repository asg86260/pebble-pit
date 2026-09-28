// A station's rails (docs/wave-party.md, "The rails"; option 2b of
// docs/mocks/tree-2026-09-27.html, one rail a class).
//
// The board of a station of the party is its fighter's heading and, under
// it, the station's two classes: a plate each, one rail of eight pips each,
// rung 4 and rung 8 bigger since each brings something (the class's move,
// then its capstone). Looking is never choosing. A tap or a hover VIEWS a
// class: its line comes up in the panel and the other rail fades, but stays.
// Buying commits: the first rung bought on a blank station takes the class
// viewed, and the other rail folds away. Reset hands every rung back and
// unfolds the rails blank. A class the station cannot take yet
// (`classesOpen`) is a plate with no rail, saying when it opens.
//
// The purchases go through the party (`buyRung`, `resetStation`); this file
// only says what the player is looking at and what a press asks for. The
// fold and the fade are the stylesheet's (shelf.css, `.rails`), stepped as
// the cells are; the pips wear their band's coin as every ladder's do.

import { S } from '../state.js';
import { CLASSES, PAIRS, MOVE_RUNG, CAPSTONE_RUNG, LADDER, TIER_BAND, RAIL_FOLD_MS, RAIL_FOLD_STEPS,
         rungValue } from '../config.js';
import { stationById, classesOpen, buyRung, resetStation } from './party.js';
import { classLadder, CLASS_UNIT } from './rows.js';
import { canPay, billOf } from '../upgrades.js';
import { MARK, purse, priceText, fmt } from '../words.js';
import { pageOf, shopOf } from '../pages.js';
import { remeasure } from '../board.js';
import { onTap } from '../tap.js';
import { coarse } from '../prefs.js';
import { KINDS } from '../stations.js';

// The fold's beat, handed to the stylesheet once, as board.js hands the pips'.
document.documentElement.style.setProperty?.('--rail-fold-ms', `${RAIL_FOLD_MS}ms`);
document.documentElement.style.setProperty?.('--rail-fold-steps', String(RAIL_FOLD_STEPS));

// What a class does, a short line a thing (the owner, 2026-09-27: "a node's
// name and what it does in a few words, nothing about the system"): its
// base, its move at MOVE_RUNG, its capstone at CAPSTONE_RUNG, and what its
// number is counted in. The Bard's line says when she has nobody to sing to.
const WORDS = {
  brawler:  { base: 'heavy punches', per: 'a punch',
              move: ['Haymaker', 'every 4th punch x4, stuns'], cap: ['Knockout', 'haymakers stun longer'] },
  sword:    { base: 'cuts that bleed', per: 'a cut',
              move: ['Whirlwind', 'each cut hits wide'], cap: ['Twin cut', 'every 3rd cut hits twice'] },
  monk:     { base: 'palms build chi; a chi palm stuns', per: 'a palm',
              move: ['Deep breath', 'chi fills twice as fast'], cap: ['Still water', 'the chi palm stuns longer'] },
  martial:  { base: 'quick thrusts charge a finisher', per: 'a thrust',
              move: ['Flow', 'thrusts charge double'], cap: ['Rally', 'the finisher Hastes the party'] },
  ranger:   { base: 'arrows from overhead', per: 'an arrow',
              move: ['Aimed shot', 'every 5th arrow x5'], cap: ['Pinning shot', 'the aimed shot stuns'] },
  assassin: { base: 'stabs, x3 on a stunned serpent', per: 'a stab',
              move: ['Execution', 'stabs grow with the wound'], cap: ['Coup', "x3 in the phase's last tenth"] },
  hexer:    { base: 'hexes Weaken its heal', per: 'a hex',
              move: ['Binding', 'the serpent is Held'], cap: ['Bound fast', 'Held takes more from blows'] },
  sapper:   { base: 'thrown charges', per: 'a charge',
              move: ['Sticky charge', 'one big stunning blow'], cap: ['Pair', 'two charges at once'] },
  mage:     { base: 'a held purple beam', per: 'held',
              move: ['Widening', 'the beam widens and ramps'], cap: ['Burn through', 'the beam burns through'] },
  bard:     { base: 'sings the others Inspired', per: 'Inspired',
              move: ['Anthem', 'Inspired doubles'], cap: ['Refrain', 'Inspired lingers after the song'] }
};
// The Bard alone: nobody else is fighting, so her song does nothing.
const ALONE = 'no one else to sing to';

// --- what is being looked at -----------------------------------------------------
// A station's view: the class (and, off a pip, the rung) last tapped, and the
// one under the pointer now, which wins while it lasts. The pointer's, not the
// yard's: kept against the station's own record, so a new game or a reload,
// which stand new records, opens the rails unviewed.
const views = new WeakMap();             // station -> { tap, hover }, each { cls, r } or null
const NONE = { tap: null, hover: null };
const viewAt = id => {
  const st = stationById(id);
  if (!st) return { ...NONE };
  if (!views.has(st)) views.set(st, { ...NONE });
  return views.get(st);
};
export const viewing = id => { const v = viewAt(id); return v.hover || v.tap; };

// A tap views a class, or a rung of it; the same one again puts the view away.
// A class that cannot be taken yet cannot be viewed: it has no rail to view.
export function view(id, cls, r = null) {
  const st = stationById(id);
  if (!st || (cls && !classesOpen(st.kind).includes(cls))) return false;
  const v = viewAt(id);
  const same = v.tap && v.tap.cls === cls && v.tap.r === r;
  v.tap = cls && !same ? { cls, r } : null;
  return true;
}
// The pointer over a plate or a pip, or off them (`cls` null).
export function hover(id, cls, r = null) {
  const st = stationById(id);
  viewAt(id).hover = cls && st && classesOpen(st.kind).includes(cls) ? { cls, r } : null;
}

// --- what the rails say ---------------------------------------------------------
// Whether any other fighter stands at a built station: the Bard's audience.
const othersFight = id => S.stations.some(o => o.id !== id && o.built && o.fighter);

// The one line for a class, or a rung of it: a name and what it does.
export function lineOf(id, cls, r = null) {
  const w = WORDS[cls], name = CLASSES[cls].name;
  if (cls === 'bard' && !othersFight(id)) return `${name}: ${ALONE}`;
  if (r === MOVE_RUNG) return `${w.move[0]}: ${w.move[1]}`;
  if (r === CAPSTONE_RUNG) return `${w.cap[0]}: ${w.cap[1]}`;
  if (r) {
    const v = rungValue(cls, r), unit = CLASS_UNIT[cls];
    const said = Number.isInteger(v) ? fmt(v) : v.toFixed(1);
    return `${name} ${r}: ${said}${unit === '%' ? '%' : ` ${unit}`} ${w.per}`;
  }
  return `${name}: ${w.base}`;
}

// The rails of station `id`, as the player sees them this frame: a plate a
// class, what Buy would buy, whether Reset has anything to hand back, and the
// panel's line. What the checks read, in both tiers; the page draws exactly
// this (`refresh`).
export function railsOf(id) {
  const st = stationById(id);
  if (!st) return null;
  const open = classesOpen(st.kind);
  const v = viewing(id);
  const plates = (PAIRS[st.kind] || []).map(cls => ({
    cls, name: CLASSES[cls].name,
    locked: !open.includes(cls),
    on: st.cls === cls,
    // The other class goes once a class is taken; before that, the one not
    // viewed fades.
    folded: !!st.cls && st.cls !== cls,
    dim: !st.cls && !!v && v.cls !== cls,
    lit: st.cls === cls ? st.rung : 0
  }));
  // What Buy buys: the class taken, or on a blank station the class viewed.
  const cls = st.cls || (v && open.includes(v.cls) ? v.cls : null);
  const card = cls && classLadder(st, cls);
  const at = cls && st.cls === cls ? st.rung : 0;
  const top = at >= LADDER;
  const bill = card && !top ? billOf(card).filter(([m]) => m !== 'time') : [];
  const buy = {
    cls, rung: at + 1, bill, top,
    label: !cls ? 'pick a class' : top ? `${CLASSES[cls].name} ${LADDER} of ${LADDER}` : `Buy ${CLASSES[cls].name} ${at + 1}`,
    can: !!card && !top && !card.dead() && canPay(card)
  };
  // The line: what is viewed, else the class taken, else what to do.
  const says = v ? lineOf(id, v.cls, v.r) : st.cls ? lineOf(id, st.cls) : 'pick a class';
  return { id, kind: st.kind, cls: st.cls, rung: st.rung, plates, buy,
           reset: { can: !!st.cls || st.rung > 0 }, line: says };
}

// --- the presses ----------------------------------------------------------------
// Buy: the next rung of the class taken, or the first of the class viewed,
// which is what takes it. The party does the buying.
export function pressBuy(id) {
  const r = railsOf(id);
  if (!r || !r.buy.can) return false;
  const bought = buyRung(id, r.buy.cls);
  // The view has done its work once a class is taken: the rails now show it.
  if (stationById(id)?.cls) viewAt(id).tap = null;
  return bought;
}
// Reset: every rung back, the class blank, the rails unfolded.
export function pressReset(id) {
  const r = railsOf(id);
  if (!r || !r.reset.can) return false;
  resetStation(id);
  const v = viewAt(id);
  v.tap = v.hover = null;
  return true;
}

// --- the page ---------------------------------------------------------------------
// The rails of each station, built once into its board's page, under the
// fighter's heading, and filled every frame the board is up. Built for a
// kind: a station's kind never changes, but the page can be made for an id
// before a station stands under it.
const mounted = new Map();                // id -> { el, kind }

// The bill as the cards write it: each coin its own cell, saying whether you
// have it, in the order the yard hands them out (shop.js, `refresh`).
const COIN_ORDER = ['scale', 'dust', 'spore', 'shard', 'core', 'spark'];
const billHTML = bill => bill
  .slice().sort((a, b) => COIN_ORDER.indexOf(a[0]) - COIN_ORDER.indexOf(b[0]))
  .map(([m, n]) => `<span class="${purse(m) >= n ? 'have' : 'short'}">${MARK[m]} ${priceText(m, n)}</span>`).join('');

// A rail: eight pips in a group a band, as a card's ladder is, so the
// stylesheet tints each group in its band's coin; the move's and the
// capstone's pips are bigger.
const railHTML = () => {
  let s = '<span class="rl-rail" data-lead="scale">';
  for (let b = 0; b < LADDER / TIER_BAND; b++) {
    s += '<b>';
    for (let i = 0; i < TIER_BAND; i++) {
      const r = b * TIER_BAND + i + 1;
      s += `<i data-r="${r}"${r === MOVE_RUNG || r === CAPSTONE_RUNG ? ' class="big"' : ''}></i>`;
    }
    s += '</b>';
  }
  return s + '</span>';
};

function build(id, kind) {
  const el = document.createElement('div');
  el.className = 'rails';
  el.dataset.station = id;
  let h = '<div class="rl-set">';
  for (const cls of PAIRS[kind] || []) {
    h += `<div class="rl-fold" data-cls="${cls}"><div><div class="rl-cls">` +
         `<button type="button" class="rl-plate" data-cls="${cls}">${CLASSES[cls].name}</button>` +
         '<span class="rl-lock">opens with a second station</span></div>' + railHTML() + '</div></div>';
  }
  h += '</div><div class="rl-panel"></div>' +
       '<div class="rl-buy"><button type="button" class="rl-buybtn"><span class="rl-what"></span><span class="rl-tag"></span></button>' +
       '<button type="button" class="rl-reset">Reset</button></div>';
  el.innerHTML = h;
  // A tap views; a hover views while it lasts (a thumb has no hover, and the
  // tap is its way to look).
  for (const plate of el.querySelectorAll('.rl-plate')) {
    const cls = plate.dataset.cls;
    onTap(plate, () => { view(id, cls); refresh(id); });
    if (!coarse()) {
      plate.addEventListener('pointerenter', () => { hover(id, cls); refresh(id); });
      plate.addEventListener('pointerleave', () => { hover(id, null); refresh(id); });
    }
  }
  for (const pip of el.querySelectorAll('.rl-rail i')) {
    const cls = pip.closest('.rl-fold').dataset.cls, r = +pip.dataset.r;
    onTap(pip, () => { view(id, cls, r); refresh(id); });
    if (!coarse()) {
      pip.addEventListener('pointerenter', () => { hover(id, cls, r); refresh(id); });
      pip.addEventListener('pointerleave', () => { hover(id, null); refresh(id); });
    }
  }
  onTap(el.querySelector('.rl-buybtn'), () => { pressBuy(id); refresh(id); });
  onTap(el.querySelector('.rl-reset'), () => { pressReset(id); refresh(id); });
  return el;
}

// Put the rails into the station's page if they are not there, and say
// whether they went in just now: the board then measures itself again.
function mount(id) {
  const st = stationById(id);
  if (!st) return false;
  const had = mounted.get(id);
  if (had && had.kind === st.kind && had.el.isConnected !== false) return false;
  had?.el.remove?.();
  const el = build(id, st.kind);
  const rows = shopOf(id);
  if (rows?.after) rows.after(el); else pageOf(id)?.appendChild(el);
  mounted.set(id, { el, kind: st.kind });
  return true;
}

// Written only when it changes: this runs every frame the board is up.
const put = (el, key, v) => { if (el[key] !== v) el[key] = v; };
const mark = (el, cls, on) => { if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on); };

export function refresh(id) {
  const m = mounted.get(id), r = railsOf(id);
  if (!m || !r) return;
  const { el } = m;
  for (const p of r.plates) {
    const fold = el.querySelector(`.rl-fold[data-cls="${p.cls}"]`);
    if (!fold) continue;
    mark(fold, 'shut', p.folded);
    mark(fold, 'dim', p.dim);
    mark(fold, 'locked', p.locked);
    mark(fold.querySelector('.rl-plate'), 'on', p.on);
    put(fold.querySelector('.rl-plate'), 'disabled', p.locked);
    for (const pip of fold.querySelectorAll('.rl-rail i')) mark(pip, 'on', +pip.dataset.r <= p.lit);
  }
  put(el.querySelector('.rl-panel'), 'textContent', r.line);
  const btn = el.querySelector('.rl-buybtn');
  put(btn.querySelector('.rl-what'), 'textContent', r.buy.label);
  const tag = billHTML(r.buy.bill);
  put(btn.querySelector('.rl-tag'), 'innerHTML', tag);
  put(btn, 'disabled', !r.buy.can);
  put(el.querySelector('.rl-reset'), 'disabled', !r.reset.can);
  // The board's title is the kind's name: the page may have been made
  // before the station stood (pages.js reads the row's name once).
  const title = pageOf(id)?.querySelector('.title');
  const name = KINDS[r.kind]?.name;
  if (title && name && title.dataset.name !== name) { title.dataset.name = name; title.textContent = name; }
}

// Every frame (a layer in render.js): the open station's rails in its page,
// and filled. A board that has just had its rails put in is measured again,
// so it is seated for what it holds.
export function seatRails() {
  const id = S.stationBoardOpen;
  if (!id || !stationById(id)) return;
  if (mount(id)) remeasure();
  refresh(id);
}
