// The settings page's tabs (option B of docs/mocks/settings-sections-2026-10-16/):
// one page, a strip of tabs under its word, the rows of the tab in force
// below. The held sheet (settings.js) and the landing page's column
// (title.js) both mount theirs from here, so the two cannot drift apart.
//
// Every tab's rows stand in one grid cell, the ones not in force hidden by
// visibility rather than by `hidden` (style.css, `.tabbody`): the cell is as
// tall as the tallest tab whatever is shown, measured by the layout, so the
// desk's centered sheet holds still as the tabs turn.
//
// The tab in force is remembered for the session, not saved: a reload under
// the veil (dark, a language) comes back on the tab it left.

export const TABS = ['graphics', 'audio', 'controls', 'language'];
const KEY = 'boulder-clicker/settings-tab';

function recall() {
  try { const t = sessionStorage.getItem(KEY); if (TABS.includes(t)) return t; } catch {}
  return TABS[0];
}
let now = recall();             // page: the tab in force, remembered for the session
export const tabNow = () => now;

const mounted = [];
const seen = el => !!el && !el.hidden && !el.closest('[hidden], [inert]') && el.getClientRects().length > 0;

// What a tab set can stand on, in page order: the chosen tab, the rows of
// the tab in force, and what stands at the foot under them.
function rowsOf(set) {
  const out = [];
  for (const el of set.root.querySelectorAll('button, input[type="range"]')) {
    if (el.closest('.settabs') || el.closest('.tabpane:not(.on)') || !seen(el)) continue;
    out.push(el);
  }
  return out;
}
const firstRow = set => rowsOf(set).find(el => el.closest('.tabpane'));
const chosenTab = set => set.strip.querySelector('button.on');

function paint(set) {
  for (const b of set.strip.querySelectorAll('button[data-tab]')) {
    const on = b.dataset.tab === now;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  }
  for (const p of set.root.querySelectorAll('.tabpane')) {
    const on = p.dataset.tab === now;
    p.classList.toggle('on', on);
    p.inert = !on;
  }
}

// The focus on the first row of the tab in force on `root`.
export function focusFirstRow(root) {
  const set = mounted.find(s => s.root === root);
  const el = set && firstRow(set);
  if (el) el.focus({ preventScroll: true });
}

// Turn to a tab by name, or by a step along the strip (`by`, wrapping).
export function turnTab(to) {
  now = typeof to === 'number' ? TABS[(TABS.indexOf(now) + to + TABS.length) % TABS.length] : to;
  try { sessionStorage.setItem(KEY, now); } catch {}
  for (const set of mounted) paint(set);
}

// The strip and its keys. `root` is the sheet or the column; the strip is
// `.settabs` in it and the rows `.tabpane`s.
export function mountTabs(root) {
  const set = { root, strip: root.querySelector('.settabs') };
  if (!set.strip?.querySelectorAll) return;   // the node yard's page has none
  mounted.push(set);
  for (const b of set.strip.querySelectorAll('button[data-tab]')) b.addEventListener('click', () => turnTab(b.dataset.tab));
  // The keyboard walks the page as the pad does: up and down step the rows,
  // up off the first lands on the strip, left and right there turn it. Kept
  // from the window, whose arrows pan the yard.
  root.addEventListener('keydown', e => {
    const at = e.target;
    if (!seen(set.strip) || !at?.closest) return;
    const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
    if (!dir) return;
    const to = step(set, at, dir);
    if (!to) return;
    e.preventDefault();
    e.stopPropagation();
    to.focus();
  });
  paint(set);
}

// Where a press of `dir` goes from `at`, or null for nothing of ours (a
// slider's own left and right). Turning the strip is a side effect.
function step(set, at, dir) {
  const onStrip = !!at.closest('.settabs');
  if (onStrip) {
    if (dir === 'left' || dir === 'right') { turnTab(dir === 'right' ? 1 : -1); return chosenTab(set); }
    if (dir === 'down') return firstRow(set) || null;
    return null;
  }
  if (dir !== 'up' && dir !== 'down') return null;
  const rows = rowsOf(set);
  const i = rows.indexOf(at);
  if (i < 0) return null;
  if (dir === 'up') return at === firstRow(set) || i === 0 ? chosenTab(set) : rows[i - 1];
  return rows[i + 1] || null;
}

// The pad's say on a shown tab set (pad.js, on the held sheet): LB and RB
// turn the tab and put the focus on its first row; on the strip left and
// right turn it, down goes into the rows; up off the first row is the
// strip. `focus` is the pad's own (padpage.js), so its marker follows.
// Hands back the directions it did not take.
export function padTabs(dirs, pressed, focus) {
  const set = mounted.find(s => seen(s.strip));
  if (!set) return dirs;
  if (pressed('lb') || pressed('rb')) {
    turnTab(pressed('rb') ? 1 : -1);
    const to = firstRow(set) || chosenTab(set);
    if (to) focus(to);
    return [];
  }
  return dirs.filter(d => {
    const at = document.activeElement;
    if (!at || !set.root.contains(at)) return true;
    const onStrip = !!at.closest('.settabs');
    if (!onStrip && !(d === 'up' && at === firstRow(set))) return true;
    const to = step(set, at, d);
    if (to) focus(to);
    return !to && !onStrip;
  });
}
