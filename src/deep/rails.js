// A station's board (DESIGN.md, "A fighter branches at rung 4"; option D of
// docs/mocks/branch-2026-09-28.html, the tree in the pips).
//
// Over the board's rows, the station's ladder drawn as a tree of pips: the
// base unit's three, branching into each of its two classes' five, rung 4
// and rung 8 bigger, rung 8 purple. The pips are only looked at: a hover (or
// a tap, where there is no hover) says what one is, a short line. What is
// bought is the rows under them, the board's way: the next rung, or at the
// fork one row a class, asked as "choose a path". Buying one closes the other
// branch; Reset hands every rung back and stands the base unit again.
//
// A Recruit's board is the question before all that (DESIGN.md, "Built
// first, a recruit, then two choices"; voted R2): the Recruit's own tree, five
// base units, the one looked at opened under them with the two specialists it
// forks into and the button that buys rung 1. Every choice says what it leads
// to (voted E2), its statuses named, bold, with a line on hover.
//
// The purchases go through the party (`buyRung`, `resetStation`); this file says what the player sees and what a press asks
// for. The fade of a closed branch is the stylesheet's (shelf.css, `.rails`).

import { S } from '../state.js';
import { P, CLASSES, RECRUIT, PAIRS, BASES, FORK_RUNG, MOVE_RUNG, CAPSTONE_RUNG, LADDER, RAIL_FOLD_MS, RAIL_FOLD_STEPS,
         HASTE, EXPOSED_AMP, rungValue } from '../config.js';
import { stationById, classesOpen, kindsOffered, unchosen, buyRung, resetStation, levelingUp } from './party.js';
import { GLYPHS } from '../glyphs.js';
import { rungBill, CLASS_UNIT } from './rows.js';
import { take } from '../upgrades.js';
import { payTo } from '../pit.js';
import { standOfStation } from './place.js';
import { MARK, purse, priceText, fmt } from '../words.js';
import { pageOf, shopOf } from '../pages.js';
import { remeasure, showPanel } from '../board.js';
import { onTap } from '../tap.js';
import { coarse } from '../prefs.js';
import { station } from '../stations.js';

// The fade's beat, handed to the stylesheet once, as board.js hands the pips'.
document.documentElement.style.setProperty?.('--rail-fold-ms', `${RAIL_FOLD_MS}ms`);
document.documentElement.style.setProperty?.('--rail-fold-steps', String(RAIL_FOLD_STEPS));

// What a class says, in the owner's wording (2026-09-28): every choice an
// imperative, every move and capstone a name and what it does in two or three
// words (shortened the same day), the serpent "your enemy". A status is named
// in braces -- "{Bleed}" -- and the board draws it bold with its hover line
// (`STATUS`), which says the rest. `fork` is the class's
// line at the fork, and its glyph the weapon drawn over its branch.
const WORDS = {
  brawler:  { fork: 'Throw harder punches, learn combos',
              move: ['Combos', 'chain punches'], cap: ['Knockout', '{Stun}'] },
  sword:    { fork: 'Master the sword',
              move: ['Whirlwind', 'heavier cut'], cap: ['Weak points', '{Bleed}'] },
  monk:     { fork: 'Focus your chi',
              move: ['Deep breath', 'faster chi'], cap: ['Still water', '{Stun}'] },
  martial:  { fork: 'Strike quicker and finish faster',
              move: ['Flourish', 'faster finishers'], cap: ['Rally', 'party {Haste}'] },
  ranger:   { fork: 'Aim at weak points',
              move: ['Aimed shot', 'charged arrow'], cap: ['Pinning shot', '{Stun}'] },
  assassin: { fork: 'Strike quick and precise',
              move: ['Execution', 'punish wounds'], cap: ['Serrated', '{Bleed}'] },
  hexer:    { fork: 'Cast hexes that debuff',
              move: ['Wither', 'serpent takes more damage'], cap: ['Binding', '{Held}, {Exposed}'] },
  sapper:   { fork: 'Learn explosives',
              move: ['Sticky bombs', 'stick, then blow'], cap: ['Pair', 'two bombs, {Stun}'] },
  mage:     { fork: 'Channel powerful beams',
              move: ['Widening', 'wider beam'], cap: ['Thermite', 'burns armor'] },
  bard:     { fork: 'Give your party {Inspired}',
              move: ['Anthem', 'double {Inspired}'], cap: ['Tempo', 'party {Haste}'] }
};
const GLYPH = { brawler: 'fist', sword: 'blade', monk: 'bell', martial: 'staff', ranger: 'target',
                assassin: 'dagger', hexer: 'rune', sapper: 'bomb', mage: 'beamwand', bard: 'lyre' };
const pct = k => `${Math.round(k * 100)}%`;
// What a status does, a line, its numbers read off the tables it is laid by.
const STATUS = {
  Stun: 'holds still, stops healing',
  Bleed: 'damage over time',
  Haste: `attacks ${pct(HASTE)} faster`,
  Held: 'cannot heal',
  Exposed: `takes ${pct(EXPOSED_AMP[0])}-${pct(EXPOSED_AMP[1])} more damage`,
  Inspired: 'hits harder'
};
// The same line for a status's icon (render/statusicons.js), by the icon's key.
const ICON_STATUS = { stun: 'Stun', bleed: 'Bleed', held: 'Held', exposed: 'Exposed',
                      haste: 'Haste', inspired: 'Inspired' };
export const statusLine = key => (ICON_STATUS[key] ? `${ICON_STATUS[key]}: ${STATUS[ICON_STATUS[key]]}` : null);
const plain = t => t.replace(/\{(\w+)\}/g, '$1');
const BASE_DOES = { altar: 'Throw punches', well: 'Practice martial arts', armory: 'Shoot arrows',
                    circle: 'Cast hexes', spire: 'Shoot beams' };
const RECRUIT_DOES = 'a light punch';
// The Bard alone: nobody else is fighting, so her song does nothing.
const ALONE = 'no one else to sing to';
const LOCKED = 'opens with a second station';
const FORK_ASK = 'Specialize';
const RECRUIT_ASK = 'Choose your fighter';

// Which base unit a Recruit's board is looking at, a station: only looked at,
// never bought, so nothing a save keeps (DESIGN.md, voted R2).
const looking = new Map();

// --- what the board says -----------------------------------------------------------
// Whether any other fighter stands at a built station: the Bard's audience.
const othersFight = id => S.stations.some(o => o.id !== id && o.built && o.fighter);

// A rung's number, in its class's unit: "50 dmg", "+18%". Whole from ten
// up, where a tenth is noise; a tenth below it, where it is a third of it.
function worth(cls, r) {
  const v = rungValue(cls, r), unit = CLASS_UNIT[cls];
  const said = Number.isInteger(v) || v >= 10 ? fmt(Math.round(v)) : v.toFixed(1);
  return unit === '%' ? `+${said}%` : `${said} ${unit}`;
}
// The one line for a pip: a name and what it does. `cls` null is the base
// unit's rung, counted off its pair's first class.
export function lineOf(id, cls, r) {
  const st = stationById(id);
  if (!st?.kind) return '';
  if (!cls) return `${BASES[st.kind]}: ${worth(PAIRS[st.kind][0], r)}`;
  const w = WORDS[cls], name = CLASSES[cls].name;
  if (!classesOpen(st.kind).includes(cls)) return `${name}: ${LOCKED}`;
  if (cls === 'bard' && !othersFight(id)) return `${name}: ${ALONE}`;
  if (r === MOVE_RUNG) return `${w.move[0]}: ${plain(w.move[1])}`;
  if (r === CAPSTONE_RUNG) return `${w.cap[0]}: ${plain(w.cap[1])}`;
  return `${name}: ${worth(cls, r)}`;
}
// A specialist's branch: its name and glyph, its move and its capstone.
const branchOf = cls => ({ cls, name: CLASSES[cls].name, glyph: GLYPH[cls], move: WORDS[cls].move, cap: WORDS[cls].cap });

// The board of station `id`, as the player sees it this frame: a Recruit's
// first choice, or the tree and the rows. What the checks read, in both
// tiers; the page draws exactly this (`refresh`).
export function railsOf(id) {
  const st = stationById(id);
  if (!st) return null;
  if (unchosen(st)) {
    // The Recruit's own tree (voted R2): five nodes, the one looked at open
    // under them with its two specialists and the button that buys rung 1.
    const offered = kindsOffered();
    const kinds = Object.keys(PAIRS).map(kind => ({ kind, name: BASES[kind], open: offered.includes(kind),
                                                    does: BASE_DOES[kind], pair: PAIRS[kind].map(branchOf) }));
    const sel = kinds.find(k => k.open && k.kind === looking.get(id)) || kinds.find(k => k.open);
    const bill = sel ? rungBill(id, PAIRS[sel.kind][0]) : [];
    return {
      id, recruit: true, ask: RECRUIT_ASK, who: RECRUIT.name, does: RECRUIT_DOES, kinds, looking: sel?.kind || null,
      row: sel && { kind: sel.kind, label: `Become a ${sel.name}`, bill, can: !levelingUp(st) && bill.every(([m, n]) => purse(m) >= n) },
      reset: { can: false }
    };
  }
  const open = classesOpen(st.kind), next = st.rung + 1;
  const pip = (cls, r) => ({ r, on: st.rung >= r && (!cls || st.cls === cls),
                             next: r === next && (!cls || !st.cls || st.cls === cls) && (!cls || open.includes(cls)),
                             big: r === MOVE_RUNG || r === CAPSTONE_RUNG, cap: r === CAPSTONE_RUNG,
                             line: lineOf(id, cls, r) });
  const base = [];
  for (let r = 1; r < FORK_RUNG; r++) base.push(pip(null, r));
  const arms = PAIRS[st.kind].map(cls => {
    const pips = [];
    for (let r = FORK_RUNG; r <= LADDER; r++) pips.push(pip(cls, r));
    return { cls, name: CLASSES[cls].name, gone: !!st.cls && st.cls !== cls, locked: !open.includes(cls), pips };
  });
  // The rows: what can be bought next. At the fork, one a class, each with
  // the move and the capstone it leads to.
  const row = (cls, label, sub, locked = false) => {
    const bill = locked ? [] : rungBill(id, cls);
    return { cls, label, sub, bill, locked,
             can: !locked && st.built && !levelingUp(st) && bill.every(([m, n]) => purse(m) >= n) };
  };
  const rows = [];
  let ask = null;
  if (next < FORK_RUNG) rows.push(row(null, BASES[st.kind], worth(PAIRS[st.kind][0], next)));
  else if (next === FORK_RUNG) {
    ask = FORK_ASK;
    for (const cls of PAIRS[st.kind]) {
      const w = WORDS[cls], locked = !open.includes(cls);
      rows.push({ ...row(cls, `Become a ${CLASSES[cls].name}`, locked ? LOCKED : w.fork, locked),
                  branch: locked ? null : branchOf(cls) });
    }
  } else if (next <= LADDER) {
    const w = WORDS[st.cls], cap = next === CAPSTONE_RUNG;
    rows.push(row(st.cls, cap ? w.cap[0] : CLASSES[st.cls].name, cap ? w.cap[1] : worth(st.cls, next)));
  }
  return { id, lot: false, kind: st.kind, cls: st.cls, rung: st.rung, who: st.cls ? CLASSES[st.cls].name : BASES[st.kind],
           tree: { base, arms }, ask, rows, top: st.rung >= LADDER, reset: { can: !!st.kind } };
}

// --- the presses ----------------------------------------------------------------
// A bill paid at station `id`, as a card's press pays (`buy` in upgrades.js):
// the coins flying to the station.
function pay(id, bill) {
  const g = standOfStation(stationById(id));
  const to = g && { x: g.x + g.w / 2, y: g.y - P * 2 };
  if (to) payTo(to.x, to.y);
  for (const [money, n] of bill) take(money, n, to);
  payTo();
}
// A Recruit's node pressed: only looked at.
export function lookAt(id, kind) {
  if (!railsOf(id)?.recruit || !PAIRS[kind]) return false;
  looking.set(id, kind);
  return true;
}
// A Recruit's rung 1 bought: it becomes the base unit of `kind`. The party
// keeps the bill on the station so a Reset hands back exactly this.
export function pressKind(id, kind) {
  const r = railsOf(id);
  if (!r?.recruit || !r.kinds.find(k => k.kind === kind)?.open) return false;
  const bill = rungBill(id, PAIRS[kind][0]);
  if (!bill.every(([m, n]) => purse(m) >= n)) return false;
  pay(id, bill);
  looking.delete(id);
  return buyRung(id, kind, bill);
}
// A row bought: the next rung, or at the fork the class `cls`.
export function pressBuy(id, cls = null) {
  const r = railsOf(id);
  const it = r && !r.recruit && r.rows.find(o => (cls ? o.cls === cls : r.rows.length === 1));
  if (!it || !it.can) return false;
  pay(id, it.bill);
  return buyRung(id, it.cls, it.bill);
}
// Reset: every rung back, the Recruit stood again.
export function pressReset(id) {
  const r = railsOf(id);
  if (!r || r.recruit || !r.reset.can) return false;
  return resetStation(id);
}

// --- the page ---------------------------------------------------------------------
// The board's own part, under the fighter's heading, drawn afresh whenever
// what it says changes (a rung, a bill, what can be afforded) and left alone
// otherwise: this runs every frame the board is up.
const mounted = new Map();                // id -> { el, body, tip, sig }

// The bill as the cards write it: each coin its own cell, saying whether you
// have it, in the order the yard hands them out (shop.js, `refresh`).
const COIN_ORDER = ['scale', 'dust', 'spore', 'shard', 'spark'];
const billHTML = bill => bill
  .slice().sort((a, b) => COIN_ORDER.indexOf(a[0]) - COIN_ORDER.indexOf(b[0]))
  .map(([m, n]) => `<span class="${purse(m) >= n ? 'have' : 'short'}">${MARK[m]} ${priceText(m, n)}</span>`).join('');
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// A line with its statuses bold, each carrying its hover line.
const say = t => esc(t).replace(/\{(\w+)\}/g, (_, k) => `<b class="rl-st" data-line="${esc(`${k}: ${STATUS[k]}`)}">${k}</b>`);
// A glyph, drawn in the board's ink at `px` screen pixels a cell.
const glyphHTML = (name, px = 2) => {
  const rows = GLYPHS[name] || GLYPHS.crate;
  const cells = rows.flatMap((r, y) => [...r].map((c, x) => (c === '#' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : ''))).join('');
  return `<svg class="rl-glyph" width="${8 * px}" height="${8 * px}" viewBox="0 0 8 8" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${cells}</svg>`;
};

const pipHTML = p => `<i class="${[p.big && 'big', p.cap && 'cap', p.on && 'on', p.next && 'next'].filter(Boolean).join(' ')}"` +
                     ` data-line="${esc(p.line)}"></i>`;
function treeHTML(r) {
  const arms = r.tree.arms.map(a => `<span class="rl-arm${a.gone ? ' gone' : ''}${a.locked ? ' locked' : ''}">` +
                                   a.pips.map(pipHTML).join('') + `<span class="rl-name">${esc(a.name)}</span></span>`).join('');
  return `<div class="rl-tree"><span class="rl-base">${r.tree.base.map(pipHTML).join('')}</span>` +
         `<span class="rl-fork"></span><span class="rl-arms">${arms}</span></div>`;
}
// A specialist's move and capstone (voted E2): a square for rung 4, a purple
// one for rung 8, each with its line.
const effectsHTML = b => `<span class="rl-fx"><i class="mv"></i><span><b class="rl-fn">${esc(b.move[0])}</b> ${say(b.move[1])}</span></span>` +
                         `<span class="rl-fx cap"><i class="cp"></i><span><b class="rl-fn">${esc(b.cap[0])}</b> ${say(b.cap[1])}</span></span>`;
const branchHTML = b => `<div class="rl-br"><div class="rl-bn">${glyphHTML(b.glyph)}${esc(b.name)}</div>${effectsHTML(b)}</div>`;
// A root over its fork: the name centered, a stem, and a crossbar that ends
// at its branches.
const rootHTML = (name, does) => `<div class="rl-root"><b>${esc(name)}</b><span>${say(does)}</span></div><i class="rl-stem"></i>`;
const rowHTML = (o, attrs) => `<button type="button" class="rl-row" ${attrs}${o.can === false ? ' disabled' : ''}>` +
  (o.bill ? `<span class="rl-tag">${billHTML(o.bill)}</span>` : '') +
  `<span class="rl-t">${esc(o.label)}</span><span class="rl-s">${say(o.sub)}</span>` +
  (o.branch ? `<span class="rl-fxs">${effectsHTML(o.branch)}</span>` : '') + `</button>`;

function recruitHTML(r) {
  const n = r.kinds.length;
  const ticks = r.kinds.map((_, i) => `<i style="left:${(i + 0.5) / n * 100}%"></i>`).join('');
  const nodes = r.kinds.map(k => `<button type="button" class="rl-node${k.open ? '' : ' locked'}${k.kind === r.looking ? ' on' : ''}"` +
    ` data-look="${k.kind}"${k.open ? '' : ' disabled'}><span class="rl-ic">${k.pair.map(b => glyphHTML(b.glyph, 1)).join('')}</span>${esc(k.name)}</button>`).join('');
  const sel = r.kinds.find(k => k.kind === r.looking);
  const pick = sel ? `<div class="rl-pick">${rootHTML(sel.name, sel.does)}<div class="rl-cross"></div>` +
    `<div class="rl-brs">${sel.pair.map(branchHTML).join('')}</div>` +
    `<button type="button" class="rl-row rl-become" data-kind="${sel.kind}"${r.row.can ? '' : ' disabled'}>` +
    `<span class="rl-tag">${billHTML(r.row.bill)}</span><span class="rl-t">${esc(r.row.label)}</span></button></div>` : '';
  return `<div class="rl-ask">${esc(r.ask)}</div>${rootHTML(r.who, r.does)}` +
         `<div class="rl-rail" style="--n:${n}">${ticks}</div><div class="rl-five" style="--n:${n}">${nodes}</div>${pick}`;
}

function bodyHTML(r) {
  if (r.recruit) return recruitHTML(r);
  return `<div class="rl-who">${esc(r.who)}</div>` + treeHTML(r) +
         (r.ask ? `<div class="rl-ask">${esc(r.ask)}</div>` : '') +
         r.rows.map(o => rowHTML(o, o.cls ? `data-cls="${o.cls}"` : '')).join('') +
         `<button type="button" class="rl-reset"${r.reset.can ? '' : ' disabled'}>reset – refunds everything</button>`;
}

// The hover line over a pip or a status, and a tap's where a thumb has no hover.
// It stands on the page, not in the board: the board's sheet clips whatever
// reaches past its edge, and a status near the edge had its line cut off. Over
// the thing it is about, centered, kept on the glass; under it where there is
// no room above. In the board's own face and size.
const TIP_GAP = 6, TIP_EDGE = 4;
function showTip(m, pip) {
  const { tip, el } = m;
  if (!pip) { tip.hidden = true; return; }
  const cs = getComputedStyle(el);
  tip.style.fontFamily = cs.fontFamily;
  tip.style.fontSize = cs.getPropertyValue('--rl-text');
  tip.textContent = pip.dataset.line;
  tip.hidden = false;
  const b = pip.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  const left = Math.max(TIP_EDGE, Math.min(b.left + b.width / 2 - w / 2, innerWidth - w - TIP_EDGE));
  const top = b.top - h - TIP_GAP >= TIP_EDGE ? b.top - h - TIP_GAP : b.bottom + TIP_GAP;
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

function wire(id, m) {
  const { body } = m;
  for (const b of body.querySelectorAll('.rl-node[data-look]'))
    onTap(b, () => { lookAt(id, b.dataset.look); refresh(id); });
  for (const b of body.querySelectorAll('.rl-row[data-kind]'))
    onTap(b, () => { if (pressKind(id, b.dataset.kind)) showPanel(null, true); else refresh(id); });
  for (const b of body.querySelectorAll('.rl-row:not([data-kind])'))
    // A rung bought shuts the sheet, so the fighter's level-up is seen.
    onTap(b, () => { if (pressBuy(id, b.dataset.cls || null)) showPanel(null, true); else refresh(id); });
  const reset = body.querySelector('.rl-reset');
  if (reset) onTap(reset, () => { pressReset(id); refresh(id); });
  // A status's line is a hover's only: most sit inside a row a tap buys.
  for (const pip of body.querySelectorAll('.rl-tree i, .rl-st')) {
    if (coarse() && pip.classList.contains('rl-st')) continue;
    if (coarse()) onTap(pip, () => showTip(m, m.tip.hidden || m.tip.textContent !== pip.dataset.line ? pip : null));
    else {
      pip.addEventListener('pointerenter', () => showTip(m, pip));
      pip.addEventListener('pointerleave', () => showTip(m, null));
    }
  }
}

// Put the board's part into the station's page if it is not there, and say
// whether it went in just now: the board then measures itself again.
function mount(id) {
  if (!stationById(id)) return false;
  const had = mounted.get(id);
  if (had && had.el.isConnected !== false) return false;
  had?.el.remove?.();
  const el = document.createElement('div');
  el.className = 'rails';
  el.dataset.station = id;
  el.innerHTML = '<div class="rl-body"></div>';
  const rows = shopOf(id);
  if (rows?.after) rows.after(el); else pageOf(id)?.appendChild(el);
  had?.tip?.remove?.();
  const tip = document.createElement('div');
  tip.className = 'rl-tip';
  tip.hidden = true;
  document.body.appendChild(tip);
  mounted.set(id, { el, body: el.querySelector('.rl-body'), tip, sig: '' });
  return true;
}

export function refresh(id) {
  const m = mounted.get(id), r = railsOf(id);
  if (!m || !r) return false;
  const html = bodyHTML(r);
  let grew = false;
  if (html !== m.sig) {
    m.sig = html;
    m.body.innerHTML = html;
    m.tip.hidden = true;
    wire(id, m);
    grew = true;
  }
  // The board's title: its row's name, the fighter's or the lot's. The page
  // may have been made before anything stood under the id (pages.js reads
  // the row's name once), and the name changes at the fork.
  const title = pageOf(id)?.querySelector('.title');
  const name = station(id)?.name;
  if (title && name && title.dataset.name !== name) { title.dataset.name = name; title.textContent = name; }
  return grew;
}

// Every frame (a layer in render.js): the open station's board part in its
// page, and filled. A board whose part has just gone in or changed its rows
// is measured again, so it is seated for what it holds.
export function seatRails() {
  const id = S.stationBoardOpen;
  // A hover line stands on the page, not in its board: when a board closes
  // under the pointer its line goes with it.
  for (const [k, m] of mounted) if (k !== id && !m.tip.hidden) m.tip.hidden = true;
  if (!id || !stationById(id)) return;
  const put = mount(id);
  if (refresh(id) || put) remeasure();
}
