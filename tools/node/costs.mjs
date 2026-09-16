// Every price in the yard, on one page.
//
//   node tools/node/costs.mjs                 # writes docs/upgrade-costs.html
//   node tools/node/costs.mjs --md            # the same table as markdown, to stdout
//
// The boards price a row from the yard's state -- a ladder's rung, how many
// rooms stand, what a coin is worth in dust -- so the only honest way to read a
// whole ladder is to climb it. This loads the node yard, walks every board the
// shop draws, and for each row takes the bill at every rung by buying the rung
// outright (`u.buy()`, the finish, not the work) and asking again, until the
// row says it is done. Nothing here is a number typed in; a price that looks
// wrong on the page is wrong in the game.
//
// Prices are read at the row's own gate, ignoring whether the board would show
// it yet, so a coin the yard has not met still prints -- the page is for
// checking the numbers, not for playing.

import { writeFileSync } from 'node:fs';
import { newYard } from './yard.mjs';

const yard = await newYard();
const { UPGRADES, SECTIONS, HOUSE_ROW, rungsOf } = await import('../../src/upgrades.js');
const { gainText } = await import('../../src/words.js');
const { workFor, takesTime } = await import('../../src/works.js');
const { shackRows, shackSections } = await import('../../src/shack.js');
const { crewSections } = await import('../../src/crewboard.js');
const { CASINO_UPGRADES, CASINO_SECTIONS } = await import('../../src/casino.js');
const { SCRUB_UPGRADES, SCRUB_SECTIONS } = await import('../../src/scrubhouse.js');
const { QUARRY_UPGRADES, QUARRY_SECTIONS } = await import('../../src/quarry.js');
const { FARM_UPGRADES, FARM_SECTIONS } = await import('../../src/farm.js');
const { APOTHECARY_UPGRADES, APOTHECARY_SECTIONS } = await import('../../src/apothecary.js');
const { TOWER_UPGRADES, TOWER_SECTIONS } = await import('../../src/tower.js');
const { OUTHOUSE_UPGRADES, OUTHOUSE_SECTIONS } = await import('../../src/outhouse.js');

// The boards in the order the yard opens them, each the same triple `BOARDS`
// in shop.js hands `build`.
const BOARDS = [
  ['the bench', UPGRADES.filter(u => !u.board), SECTIONS],
  ['the house', [HOUSE_ROW], crewSections()],
  ['the shack', shackRows(), shackSections()],
  ['the quarry', QUARRY_UPGRADES, QUARRY_SECTIONS],
  ['the farm', FARM_UPGRADES, FARM_SECTIONS],
  ['the apothecary', APOTHECARY_UPGRADES, APOTHECARY_SECTIONS],
  ['the casino', CASINO_UPGRADES, CASINO_SECTIONS],
  ['the outhouse', OUTHOUSE_UPGRADES, OUTHOUSE_SECTIONS],
  ['the tower', TOWER_UPGRADES, TOWER_SECTIONS],
  ['the scrubbing house', SCRUB_UPGRADES, SCRUB_SECTIONS]
];

// A row's sections and then whatever it forgot to name -- `grouped` in shop.js.
const grouped = (list, sections) => {
  const named = new Set(sections.flatMap(x => x.keys));
  const rest = list.filter(u => !named.has(u.key)).map(u => u.key);
  return rest.length ? [...sections, { title: 'and', keys: rest }] : sections;
};

// The bill as the row states it, with no dust conversion and no clock on the
// end: the coins are what the player pays, the seconds are a column of their own.
// A row that names a price but no coin -- a dial, a reading, a door -- is not
// for sale and stays off the page.
const forSale = u => !!(u.bill || u.cost);
const bill = u => (u.bill ? u.bill() : [[u.currency || 'dust', u.cost()]]).filter(([c]) => c !== 'time');
// The dome writes its clock into the bill; every other row leaves it to `workFor`.
const seconds = u => {
  const t = u.bill?.().find(([c]) => c === 'time');
  return t ? Math.round(t[1] / 1000) : takesTime(u) ? workFor(u) : 0;
};
const fmt = n => n.toLocaleString('en-US');
const billText = b => b.filter(([, n]) => n > 0).map(([c, n]) => `${fmt(n)} ${c}`).join(' · ');
// What the board itself prints in the gain column -- "walk +30%", "1 → 2 px" --
// so the page and the card agree to the digit.
const fromTo = u => { try { return gainText(u) || ''; } catch { return ''; } };

// The rungs of one row: the price now, and after every buy until it is done.
// The walk itself is `climbRow` in hooks.js, which the dome's price check
// climbs the same ladders with -- one climb, so the page and the check agree.
function climb(u) {
  const out = [];
  try { yard.climbRow(u, n => out.push({ n, bill: bill(u), work: seconds(u), range: fromTo(u) })); }
  catch (e) { out.push({ n: out.length + 1, err: String(e.message || e) }); }
  return out;
}

const pages = BOARDS.map(([title, list, sections]) => ({
  title,
  sections: grouped(list, sections).map(sec => ({
    title: sec.title,
    rows: sec.keys.map(k => list.find(u => u.key === k)).filter(u => u && forSale(u)).map(u => ({
      key: u.key, name: u.name, rungs: u.rung ? rungsOf(u) : 0, does: u.does || '', steps: climb(u)
    }))
  })).filter(sec => sec.rows.length)
}));

// --- output --------------------------------------------------------------------
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

if (process.argv.includes('--md')) {
  const lines = ['# Upgrade costs', '', `Generated ${new Date().toISOString().slice(0, 10)} by \`node tools/node/costs.mjs --md\`.`, ''];
  for (const p of pages) {
    lines.push(`## ${p.title}`, '');
    for (const sec of p.sections) {
      lines.push(`### ${sec.title}`, '', '| row | rung | gain | bill | work |', '|---|---|---|---|---|');
      for (const r of sec.rows) for (const s of r.steps)
        lines.push(s.err ? `| ${r.name} | ${s.n} | | error: ${s.err} | |`
                         : `| ${r.name} | ${r.rungs ? `${s.n}/${r.rungs}` : ''} | ${s.range} | ${billText(s.bill)} | ${s.work ? s.work + 's' : ''} |`);
      lines.push('');
    }
  }
  process.stdout.write(lines.join('\n'));
} else {
  const rowsHtml = r => r.steps.map((s, i) => `
      <tr class="${i === 0 ? 'first' : ''}">
        <td class="name">${i === 0 ? esc(r.name) : ''}</td>
        <td class="n">${r.rungs ? `${s.n}/${r.rungs}` : ''}</td>
        <td>${esc(s.range)}</td>
        <td class="bill">${s.err ? `<em>error: ${esc(s.err)}</em>` : esc(billText(s.bill))}</td>
        <td class="n">${s.work ? s.work + 's' : ''}</td>
      </tr>`).join('');
  const nav = pages.map(p => `<a href="#${esc(p.title.replace(/\s+/g, '-'))}">${esc(p.title)}</a>`).join(' · ');
  const body = pages.map(p => `
  <h2 id="${esc(p.title.replace(/\s+/g, '-'))}">${esc(p.title)}</h2>${p.sections.map(sec => `
  <h3>${esc(sec.title)}</h3>
  <table>
    <thead><tr><th>row</th><th>rung</th><th>gain</th><th>bill</th><th>work</th></tr></thead>
    <tbody>${sec.rows.map(rowsHtml).join('')}</tbody>
  </table>`).join('')}`).join('');
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>upgrade costs</title>
<style>
  body { background: #fff; color: #000; font: 13px/1.5 ui-monospace, Menlo, Consolas, monospace; margin: 0; padding: 24px; max-width: 960px; }
  h1 { font-size: 16px; letter-spacing: .1em; text-transform: uppercase; margin: 0 0 4px; }
  h2 { font-size: 14px; letter-spacing: .1em; text-transform: uppercase; margin: 32px 0 8px; border-bottom: 2px solid #000; padding-bottom: 4px; }
  h3 { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: #555; margin: 16px 0 4px; }
  nav { margin-bottom: 8px; color: #555; }
  a { color: #000; }
  table { border-collapse: collapse; width: 100%; }
  th { text-align: left; font-weight: normal; color: #555; border-bottom: 1px solid #000; padding: 2px 8px 2px 0; }
  td { padding: 1px 8px 1px 0; vertical-align: top; white-space: nowrap; }
  td.n { text-align: right; }
  td.name { font-weight: bold; }
  tr.first td { border-top: 1px solid #ddd; }
  em { color: #a00; font-style: normal; }
  .note { color: #555; margin-bottom: 16px; }
</style></head><body>
<h1>upgrade costs</h1>
<div class="note">every row on every board, priced by climbing it in the node yard. generated ${new Date().toISOString().slice(0, 10)} by <code>node tools/node/costs.mjs</code>. work is one pair of hands, in seconds.</div>
<nav>${nav}</nav>
${body}
</body></html>`;
  const out = new URL('../../docs/upgrade-costs.html', import.meta.url);
  writeFileSync(out, html);
  const n = pages.reduce((a, p) => a + p.sections.reduce((b, s) => b + s.rows.length, 0), 0);
  console.log(`wrote docs/upgrade-costs.html: ${n} rows across ${pages.length} boards`);
}
