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
// An empty lot's board is the question before all that: what goes up here,
// a base unit a row.
//
// The purchases go through the party (`buyRung`, `pickKind`,
// `resetStation`); this file says what the player sees and what a press asks
// for. The fade of a closed branch is the stylesheet's (shelf.css, `.rails`).

import { S } from '../state.js';
import { P, CLASSES, PAIRS, BASES, FORK_RUNG, MOVE_RUNG, CAPSTONE_RUNG, LADDER, RAIL_FOLD_MS, RAIL_FOLD_STEPS,
         rungValue } from '../config.js';
import { stationById, classesOpen, kindsOffered, keyOf, isLot, buyRung, pickKind, resetStation } from './party.js';
import { rungBill, CLASS_UNIT } from './rows.js';
import { take } from '../upgrades.js';
import { payTo } from '../pit.js';
import { standOfStation } from './place.js';
import { MARK, purse, priceText, fmt } from '../words.js';
import { pageOf, shopOf } from '../pages.js';
import { remeasure } from '../board.js';
import { onTap } from '../tap.js';
import { coarse } from '../prefs.js';
import { KINDS } from '../stations.js';

// The fade's beat, handed to the stylesheet once, as board.js hands the pips'.
document.documentElement.style.setProperty?.('--rail-fold-ms', `${RAIL_FOLD_MS}ms`);
document.documentElement.style.setProperty?.('--rail-fold-steps', String(RAIL_FOLD_STEPS));

// What a class says, in the owner's wording (2026-09-28): every choice an
// imperative, every move and capstone a name and an imperative, the same
// effect in the same words wherever it comes ("inflict bleeding"), the
// serpent "your enemy". `fork` is the class's row at the fork.
const WORDS = {
  brawler:  { fork: 'Throw harder punches, learn combos, and stun',
              move: ['Combos', 'string punches together'], cap: ['Knockout', 'stun your enemy'] },
  sword:    { fork: 'Master the sword',
              move: ['Whirlwind', 'strike all around'], cap: ['Weak points', 'inflict bleeding'] },
  monk:     { fork: 'Focus your chi',
              move: ['Deep breath', 'build chi faster'], cap: ['Still water', 'stun your enemy'] },
  martial:  { fork: 'Strike quicker and finish faster',
              move: ['Flourish', 'charge finishers faster'], cap: ['Rally', 'haste your party'] },
  ranger:   { fork: 'Aim at weak points',
              move: ['Aimed shot', 'charge a powerful arrow'], cap: ['Pinning shot', 'pin your enemy'] },
  assassin: { fork: 'Strike quick and precise',
              move: ['Execution', 'exploit its wounds'], cap: ['Serrated', 'inflict bleeding'] },
  hexer:    { fork: 'Cast hexes that debuff',
              move: ['Wither', 'slow its healing'], cap: ['Binding', 'stop its healing, expose it'] },
  sapper:   { fork: 'Learn explosives',
              move: ['Sticky bombs', 'stick and blow'], cap: ['Pair', 'throw two, stun your enemy'] },
  mage:     { fork: 'Channel powerful beams',
              move: ['Widening', 'widen the beam'], cap: ['Thermite', 'burn through armor'] },
  bard:     { fork: 'Inspire your party',
              move: ['Anthem', 'double the boost'], cap: ['Tempo', 'haste your party'] }
};
const BASE_DOES = { altar: 'Throw punches', well: 'Practice martial arts', armory: 'Shoot arrows',
                    circle: 'Cast hexes', spire: 'Shoot beams' };
// The Bard alone: nobody else is fighting, so her song does nothing.
const ALONE = 'no one else to sing to';
const LOCKED = 'opens with a second station';
const FORK_ASK = 'Specialize';
const LOT_ASK = 'Choose your fighter';

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
  if (r === MOVE_RUNG) return `${w.move[0]}: ${w.move[1]}`;
  if (r === CAPSTONE_RUNG) return `${w.cap[0]}: ${w.cap[1]}`;
  return `${name}: ${worth(cls, r)}`;
}

// The board of station `id`, as the player sees it this frame: the lot's
// kinds, or the tree and the rows. What the checks read, in both tiers; the
// page draws exactly this (`refresh`).
export function railsOf(id) {
  const st = stationById(id);
  if (!st) return null;
  if (isLot(st)) {
    const offered = kindsOffered();
    return {
      id, lot: true, ask: LOT_ASK,
      kinds: Object.keys(PAIRS).map(kind => ({
        kind, name: BASES[kind], open: offered.includes(kind),
        sub: offered.includes(kind) ? BASE_DOES[kind] : LOCKED
      }))
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
  // The rows: what can be bought next. At the fork, one a class.
  const row = (cls, label, sub, locked = false) => {
    const bill = locked ? [] : rungBill(id, cls);
    return { cls, label, sub, bill, locked,
             can: !locked && st.built && bill.every(([m, n]) => purse(m) >= n) };
  };
  const rows = [];
  let ask = null;
  if (next < FORK_RUNG) rows.push(row(null, BASES[st.kind], worth(PAIRS[st.kind][0], next)));
  else if (next === FORK_RUNG) {
    ask = FORK_ASK;
    for (const cls of PAIRS[st.kind]) {
      const w = WORDS[cls], locked = !open.includes(cls);
      rows.push(row(cls, `Become a ${CLASSES[cls].name}`, locked ? LOCKED : w.fork, locked));
    }
  } else if (next <= LADDER) {
    const w = WORDS[st.cls], cap = next === CAPSTONE_RUNG;
    rows.push(row(st.cls, cap ? w.cap[0] : CLASSES[st.cls].name, cap ? w.cap[1] : worth(st.cls, next)));
  }
  return { id, lot: false, kind: st.kind, cls: st.cls, rung: st.rung, who: st.cls ? CLASSES[st.cls].name : BASES[st.kind],
           tree: { base, arms }, ask, rows, top: st.rung >= LADDER, reset: { can: !!st.cls || st.rung > 0 } };
}

// --- the presses ----------------------------------------------------------------
// A lot's row: its kind picked, and the builders sent to put it up.
export function pressKind(id, kind) {
  const r = railsOf(id);
  if (!r?.lot || !r.kinds.find(k => k.kind === kind)?.open) return false;
  return pickKind(id, kind);
}
// A row bought: the next rung, or at the fork the class `cls`. Paid here, as
// a card's press pays (`buy` in upgrades.js), the coins flying to the
// station; the party keeps the bill on the station so a Reset hands back
// exactly this.
export function pressBuy(id, cls = null) {
  const r = railsOf(id);
  const it = r && !r.lot && r.rows.find(o => (cls ? o.cls === cls : r.rows.length === 1));
  if (!it || !it.can) return false;
  const g = standOfStation(stationById(id));
  const to = g && { x: g.x + g.w / 2, y: g.y - P * 2 };
  if (to) payTo(to.x, to.y);
  for (const [money, n] of it.bill) take(money, n, to);
  payTo();
  return buyRung(id, it.cls, it.bill);
}
// Reset: every rung back, the base unit stood again.
export function pressReset(id) {
  const r = railsOf(id);
  if (!r || r.lot || !r.reset.can) return false;
  return resetStation(id);
}

// --- the page ---------------------------------------------------------------------
// The board's own part, under the fighter's heading, drawn afresh whenever
// what it says changes (a rung, a bill, what can be afforded) and left alone
// otherwise: this runs every frame the board is up.
const mounted = new Map();                // id -> { el, body, tip, sig }

// The bill as the cards write it: each coin its own cell, saying whether you
// have it, in the order the yard hands them out (shop.js, `refresh`).
const COIN_ORDER = ['scale', 'dust', 'spore', 'shard', 'core', 'spark'];
const billHTML = bill => bill
  .slice().sort((a, b) => COIN_ORDER.indexOf(a[0]) - COIN_ORDER.indexOf(b[0]))
  .map(([m, n]) => `<span class="${purse(m) >= n ? 'have' : 'short'}">${MARK[m]} ${priceText(m, n)}</span>`).join('');
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const pipHTML = p => `<i class="${[p.big && 'big', p.cap && 'cap', p.on && 'on', p.next && 'next'].filter(Boolean).join(' ')}"` +
                     ` data-line="${esc(p.line)}"></i>`;
function treeHTML(r) {
  const arms = r.tree.arms.map(a => `<span class="rl-arm${a.gone ? ' gone' : ''}${a.locked ? ' locked' : ''}">` +
                                   a.pips.map(pipHTML).join('') + `<span class="rl-name">${esc(a.name)}</span></span>`).join('');
  return `<div class="rl-tree"><span class="rl-base">${r.tree.base.map(pipHTML).join('')}</span>` +
         `<span class="rl-fork"></span><span class="rl-arms">${arms}</span></div>`;
}
const rowHTML = (o, attrs) => `<button type="button" class="rl-row" ${attrs}${o.can === false ? ' disabled' : ''}>` +
  (o.bill ? `<span class="rl-tag">${billHTML(o.bill)}</span>` : '') +
  `<span class="rl-t">${esc(o.label)}</span><span class="rl-s">${esc(o.sub)}</span></button>`;

function bodyHTML(r) {
  if (r.lot)
    return `<div class="rl-ask">${esc(r.ask)}</div>` +
           r.kinds.map(k => rowHTML({ label: k.name, sub: k.sub, can: k.open }, `data-kind="${k.kind}"`)).join('');
  return `<div class="rl-who">${esc(r.who)}</div>` + treeHTML(r) +
         (r.ask ? `<div class="rl-ask">${esc(r.ask)}</div>` : '') +
         r.rows.map(o => rowHTML(o, o.cls ? `data-cls="${o.cls}"` : '')).join('') +
         `<button type="button" class="rl-reset"${r.reset.can ? '' : ' disabled'}>reset – refunds everything</button>`;
}

// The hover line over a pip, and a tap's where a thumb has no hover.
function showTip(m, pip) {
  const { tip, el } = m;
  if (!pip) { tip.hidden = true; return; }
  tip.textContent = pip.dataset.line;
  tip.hidden = false;
  const a = el.getBoundingClientRect(), b = pip.getBoundingClientRect();
  tip.style.left = `${Math.round(b.left - a.left + b.width / 2)}px`;
  tip.style.top = `${Math.round(b.top - a.top)}px`;
}

function wire(id, m) {
  const { body } = m;
  for (const b of body.querySelectorAll('.rl-row[data-kind]'))
    onTap(b, () => { pressKind(id, b.dataset.kind); refresh(id); });
  for (const b of body.querySelectorAll('.rl-row:not([data-kind])'))
    onTap(b, () => { pressBuy(id, b.dataset.cls || null); refresh(id); });
  const reset = body.querySelector('.rl-reset');
  if (reset) onTap(reset, () => { pressReset(id); refresh(id); });
  for (const pip of body.querySelectorAll('.rl-tree i')) {
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
  el.innerHTML = '<div class="rl-body"></div><div class="rl-tip" hidden></div>';
  const rows = shopOf(id);
  if (rows?.after) rows.after(el); else pageOf(id)?.appendChild(el);
  mounted.set(id, { el, body: el.querySelector('.rl-body'), tip: el.querySelector('.rl-tip'), sig: '' });
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
  // The board's title: the kind's name, or the lot's. The page may have been
  // made before anything stood under the id (pages.js reads the row's name once).
  const title = pageOf(id)?.querySelector('.title');
  const name = r.lot ? 'an empty lot' : KINDS[r.kind]?.name;
  if (title && name && title.dataset.name !== name) { title.dataset.name = name; title.textContent = name; }
  return grew;
}

// Every frame (a layer in render.js): the open station's board part in its
// page, and filled. A board whose part has just gone in or changed its rows
// is measured again, so it is seated for what it holds.
export function seatRails() {
  const id = S.stationBoardOpen;
  if (!id || !stationById(id)) return;
  const put = mount(id);
  if (refresh(id) || put) remeasure();
}
