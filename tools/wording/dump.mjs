// Every word the node yard writes, at a few points in a game, as one JSON
// file: the boards' cells, the rows' names and gains, the two windows, the
// stations' table and every string any module exports. Run before and after a
// change that should not change a word (the localization's phase one), and
// the two files are compared by `diff`.
//
//   node tools/wording/dump.mjs out.json

import { writeFileSync, readdirSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { newYard } from '../node/yard.mjs';

const yard = await newYard();
const out = {};

function walk(el, path, into, seen = new Set()) {
  if (!el || seen.has(el)) return;
  seen.add(el);
  for (const k of ['textContent', 'innerHTML', 'title', 'placeholder']) {
    const v = el[k];
    if (typeof v === 'string' && v.trim()) into.push(`${path} ${k}: ${v}`);
  }
  (el.children || []).forEach((c, i) => walk(c, `${path}/${i}`, into, seen));
}

const DIRS = ['src', 'src/config', 'src/upgrades', 'src/deep', 'src/crew', 'src/render', 'src/smog'];
const SKIP = /(dev|scenes|hooks|console|selftest|report|verify|scenesheet|main|title)\.js$/;
const exportsOf = {};
for (const d of DIRS) for (const f of readdirSync(d)) {
  if (!f.endsWith('.js') || SKIP.test(f) || statSync(`${d}/${f}`).isDirectory()) continue;
  try { exportsOf[`${d}/${f}`] = await import(pathToFileURL(`${d}/${f}`).href); } catch (e) { exportsOf[`${d}/${f}`] = { error: String(e.message).slice(0, 80) }; }
}
function strings(v, path, into, seen = new Set(), depth = 0) {
  if (typeof v === 'string') { if (/[a-z]{2}/i.test(v)) into.push(`${path}: ${v}`); return; }
  if (!v || typeof v !== 'object' || seen.has(v) || depth > 6) return;
  seen.add(v);
  if (ArrayBuffer.isView(v)) return;
  for (const k of Object.keys(v)) {
    let x; try { x = v[k]; } catch { continue; }
    strings(x, `${path}.${k}`, into, seen, depth + 1);
  }
}
{
  const into = [];
  for (const [f, m] of Object.entries(exportsOf)) strings({ ...m }, f, into);
  out.exports = into;
}

const ROWFIELDS = ['name', 'note', 'blurb', 'does', 'unit', 'waits', 'title', 'say', 'label', 'empty'];
function rowsNow() {
  const into = [];
  for (const r of yard.allRows()) into.push(`${r.key}: ${r.name} | ${r.gain} | ${r.waits} | ${r.shown}`);
  return into;
}
function page(tag) {
  yard.rebuildBoards();
  try { yard.fillBoard(); } catch {}
  for (const k of ['books', 'crew']) try { yard.HANDLES.__window(k); } catch {}
  const into = [];
  for (const id of ['shop', 'labshop', 'crewshop', 'towershop', 'quarryshop', 'farmshop', 'filtershop', 'apothshop',
    'shackshop', 'looshop', 'statsshop', 'bookincome', 'booksky', 'bookcrew', 'booktally', 'crewlistrows', 'modaltitle',
    'objective', 'queue', 'hidedone', 'raise', 'purse', 'record', 'index', 'slots', 'cloudsheet', 'controlslist', 'said',
    'motion', 'touch', 'dark', 'sound', 'fullscreenrow', 'recordbtn', 'slotsbtn', 'crewfade', 'way', 'fullscreen'])
    walk(document.getElementById(id), id, into);
  out[tag] = { rows: rowsNow(), page: into };
  void ROWFIELDS;
}

yard.reset();
yard.fast(2);
page('fresh');
yard.reset();
yard.grant({ dust: 1e9, shards: 1e7, spores: 1e7, sparks: 1e4 });
try { yard.everything(2, 3); } catch (e) { out.everythingError = String(e.message); }
yard.fast(5);
page('rich');
try { yard.everything(8, 8); } catch (e) { out.everythingError2 = String(e.message); }
yard.fast(5);
page('richer');

writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v === 'object' ? Object.values(v).map(a => a.length) : v])));
process.exit(0);
