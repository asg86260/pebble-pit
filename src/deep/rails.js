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

import { msg } from '../lang.js';
import { S } from '../state.js';
import { P, CLASSES, RECRUIT, PAIRS, BASES, FORK_RUNG, MOVE_RUNG, CAPSTONE_RUNG, LADDER, RAIL_FOLD_MS, RAIL_FOLD_STEPS,
         HASTE, EXPOSED_AMP, rungValue } from '../config.js';
import { stationById, classesOpen, kindsOffered, unchosen, buyRung, resetStation, levelingUp } from './party.js';
import { GLYPHS } from '../glyphs.js';
import { rungBill, CLASS_UNIT } from './rows.js';
import { take } from '../upgrades.js';
import { payTo } from '../pit.js';
import { standOfStation } from './place.js';
import { MARK, purse, priceText, fmt, unitText } from '../words.js';
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
// The status tokens a line can carry: a message names a status as a
// placeable ($stun), and the code hands it over as `{Stun}`, which `say`
// draws bold with its hover line and `plain` writes as its name.
const TOKENS = { stun: '{Stun}', bleed: '{Bleed}', haste: '{Haste}', held: '{Held}', exposed: '{Exposed}', inspired: '{Inspired}' };
const w = id => msg(id, TOKENS);
const WORDS = {
  brawler: { fork: w('cls-brawler-fork'), move: [w('cls-brawler-move'), w('cls-brawler-move-does')], cap: [w('cls-brawler-cap'), w('cls-brawler-cap-does')] },
  sword: { fork: w('cls-sword-fork'), move: [w('cls-sword-move'), w('cls-sword-move-does')], cap: [w('cls-sword-cap'), w('cls-sword-cap-does')] },
  monk: { fork: w('cls-monk-fork'), move: [w('cls-monk-move'), w('cls-monk-move-does')], cap: [w('cls-monk-cap'), w('cls-monk-cap-does')] },
  martial: { fork: w('cls-martial-fork'), move: [w('cls-martial-move'), w('cls-martial-move-does')], cap: [w('cls-martial-cap'), w('cls-martial-cap-does')] },
  ranger: { fork: w('cls-ranger-fork'), move: [w('cls-ranger-move'), w('cls-ranger-move-does')], cap: [w('cls-ranger-cap'), w('cls-ranger-cap-does')] },
  assassin: { fork: w('cls-assassin-fork'), move: [w('cls-assassin-move'), w('cls-assassin-move-does')], cap: [w('cls-assassin-cap'), w('cls-assassin-cap-does')] },
  hexer: { fork: w('cls-hexer-fork'), move: [w('cls-hexer-move'), w('cls-hexer-move-does')], cap: [w('cls-hexer-cap'), w('cls-hexer-cap-does')] },
  sapper: { fork: w('cls-sapper-fork'), move: [w('cls-sapper-move'), w('cls-sapper-move-does')], cap: [w('cls-sapper-cap'), w('cls-sapper-cap-does')] },
  mage: { fork: w('cls-mage-fork'), move: [w('cls-mage-move'), w('cls-mage-move-does')], cap: [w('cls-mage-cap'), w('cls-mage-cap-does')] },
  bard: { fork: w('cls-bard-fork'), move: [w('cls-bard-move'), w('cls-bard-move-does')], cap: [w('cls-bard-cap'), w('cls-bard-cap-does')] }
};
const GLYPH = { brawler: 'fist', sword: 'blade', monk: 'bell', martial: 'staff', ranger: 'target',
                assassin: 'dagger', hexer: 'rune', sapper: 'bomb', mage: 'beamwand', bard: 'lyre' };
const pct = k => `${Math.round(k * 100)}%`;
// What a status does, a line, its numbers read off the tables it is laid by.
const STATUS = {
  Stun: msg('status-stun-does'),
  Bleed: msg('status-bleed-does'),
  Haste: msg('status-haste-does', { pct: pct(HASTE) }),
  Held: msg('status-held-does'),
  Exposed: msg('status-exposed-does', { lo: pct(EXPOSED_AMP[0]), hi: pct(EXPOSED_AMP[1]) }),
  Inspired: msg('status-inspired-does')
};
// And what each is called, wherever it is named: the key is the code's.
const STATUS_NAME = { Stun: msg('status-stun'), Bleed: msg('status-bleed'), Haste: msg('status-haste'),
                      Held: msg('status-held'), Exposed: msg('status-exposed'), Inspired: msg('status-inspired') };
// A status's hover line: its name and what it does.
const lineFor = k => msg('status-line', { name: STATUS_NAME[k], does: STATUS[k] });
// The same line for a status's icon (render/statusicons.js), by the icon's key.
const ICON_STATUS = { stun: 'Stun', bleed: 'Bleed', held: 'Held', exposed: 'Exposed',
                      haste: 'Haste', inspired: 'Inspired' };
export const statusLine = key => (ICON_STATUS[key] ? lineFor(ICON_STATUS[key]) : null);
// The same with a count: `n` of it on at once.
export const statusLineOf = (key, n) => (ICON_STATUS[key]
  ? msg('status-line-n', { name: STATUS_NAME[ICON_STATUS[key]], n, does: STATUS[ICON_STATUS[key]] }) : null);
// And its name alone, for its label under the icon.
export const statusName = key => (ICON_STATUS[key] ? STATUS_NAME[ICON_STATUS[key]] : null);
const plain = t => t.replace(/\{(\w+)\}/g, (_, k) => STATUS_NAME[k] ?? k);
// MOCK fighters-skills-on-the-hover: what a fighter at station `st` can do
// by its rung -- its class's move from MOVE_RUNG, its capstone from
// CAPSTONE_RUNG; a base unit or a Recruit has none -- each its name and its
// line, a status in it said out with what it does, so a skill that is only a
// status ("Knockout: Stun") still says something.
const spelled = t => t.replace(/\{(\w+)\}/g, (_, k) => (STATUS[k] ? msg('skill-status', { name: STATUS_NAME[k], does: STATUS[k] }) : k));
export function skillsOf(st) {
  const w = st?.cls && WORDS[st.cls];
  if (!w) return [];
  const out = [];
  if (st.rung >= MOVE_RUNG) out.push({ name: w.move[0], does: spelled(w.move[1]), cap: false });
  if (st.rung >= CAPSTONE_RUNG) out.push({ name: w.cap[0], does: spelled(w.cap[1]), cap: true });
  return out.map(k => ({ ...k, line: msg('rail-line', { name: k.name, what: k.does }) }));
}
const BASE_DOES = { altar: msg('base-altar-does'), well: msg('base-well-does'), armory: msg('base-armory-does'),
                    circle: msg('base-circle-does'), spire: msg('base-spire-does') };
const RECRUIT_DOES = msg('recruit-does');
// The Bard alone: nobody else is fighting, so her song does nothing.
const ALONE = msg('rail-alone');
const LOCKED = msg('rail-locked');
const FORK_ASK = msg('rail-fork-ask');
const RECRUIT_ASK = msg('rail-recruit-ask');

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
  return unit === '%' ? msg('rail-worth-pct', { n: said }) : msg('rail-worth', { n: said, unit: unitText(unit) });
}
// The one line for a pip: a name and what it does. `cls` null is the base
// unit's rung, counted off its pair's first class.
export function lineOf(id, cls, r) {
  const st = stationById(id);
  if (!st?.kind) return '';
  const line = (name, what) => msg('rail-line', { name, what });
  if (!cls) return line(BASES[st.kind], worth(PAIRS[st.kind][0], r));
  const w = WORDS[cls], name = CLASSES[cls].name;
  if (!classesOpen(st.kind).includes(cls)) return line(name, LOCKED);
  if (cls === 'bard' && !othersFight(id)) return line(name, ALONE);
  if (r === MOVE_RUNG) return line(w.move[0], plain(w.move[1]));
  if (r === CAPSTONE_RUNG) return line(w.cap[0], plain(w.cap[1]));
  return line(name, worth(cls, r));
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
      row: sel && { kind: sel.kind, label: msg('rail-become', { name: sel.name }), bill, can: !levelingUp(st) && bill.every(([m, n]) => purse(m) >= n) },
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
      rows.push({ ...row(cls, msg('rail-become', { name: CLASSES[cls].name }), locked ? LOCKED : w.fork, locked),
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
const say = t => esc(t).replace(/\{(\w+)\}/g, (_, k) => `<b class="rl-st" data-line="${esc(lineFor(k))}">${esc(STATUS_NAME[k] ?? k)}</b>`);
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
  // MOCK fighters-skills-on-the-hover: option C, the skills it has under its name
  const sk = globalThis.__skillsMock?.opt === 'c' ? skillsOf(stationById(r.id)) : [];
  const skills = sk.length ? `<div class="rl-skills">${sk.map(k => `<span class="rl-fx${k.cap ? ' cap' : ''}"><i class="${k.cap ? 'cp' : 'mv'}"></i>` +
    `<b class="rl-st rl-sk" data-line="${esc(k.line)}">${esc(k.name)}</b></span>`).join('')}</div>` : '';
  return `<div class="rl-who">${esc(r.who)}</div>` + skills + treeHTML(r) +
         (r.ask ? `<div class="rl-ask">${esc(r.ask)}</div>` : '') +
         r.rows.map(o => rowHTML(o, o.cls ? `data-cls="${o.cls}"` : '')).join('') +
         `<button type="button" class="rl-reset"${r.reset.can ? '' : ' disabled'}>${esc(msg('rail-reset'))}</button>`;
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
// MOCK fighters-skills-on-the-hover: a scene holds skill `i`'s line up, as
// the pointer resting on it would.
export function skillTipOn(id, i) {
  const m = mounted.get(id), el = m?.body.querySelectorAll('.rl-sk')[i];
  if (el) showTip(m, el);
  return !!el;
}

export function seatRails() {
  const id = S.stationBoardOpen;
  // A hover line stands on the page, not in its board: when a board closes
  // under the pointer its line goes with it.
  for (const [k, m] of mounted) if (k !== id && !m.tip.hidden) m.tip.hidden = true;
  if (!id || !stationById(id)) return;
  const put = mount(id);
  if (refresh(id) || put) remeasure();
}
