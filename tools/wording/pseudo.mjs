// Every word the node yard writes that did not come out of the language file.
// The game is loaded with every message wrapped in ⟦ ⟧ (`__l10nMark` in
// src/lang.js), the boards are built and filled at a few points in a game,
// the hover is asked of a grid of spots, and whatever text is left once the
// marked runs, the markup, the numbers and the marks are taken out is a word
// the code wrote itself.
//
//   node tools/wording/pseudo.mjs            prints what it finds
//
// Read by test/l10n-pseudo.test.mjs, which asks for nothing.

globalThis.__l10nMark = t => `⟦${t}⟧`;
const { newYard } = await import('../node/yard.mjs');
const { whatIsAt } = await import('../../src/input.js');
const { refresh, boardList } = await import('../../src/shop.js');
const { shopOf } = await import('../../src/pages.js');
const { BOARDS } = await import('../../src/stations.js');
const { showPane } = await import('../../src/settings.js');
const { fillQueue } = await import('../../src/queue.js');
const { seatObjective } = await import('../../src/objline.js');
const { stepToast } = await import('../../src/toast.js');

// What a string has left once the words the language file said are taken out.
export function unmarked(s) {
  let t = String(s);
  // innermost first: a message can carry another as an argument
  for (let i = 0; i < 6 && /⟦/.test(t); i++) t = t.replace(/⟦[^⟦⟧]*⟧/g, ' ');
  t = t.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;|&#\d+;/g, ' ');
  // numbers in the game's own short forms (1.3k, 2m, 0:47, x2, 25%, 3h, 12m)
  t = t.replace(/[+-]?\d[\d.,:]*\s*(k|m|b|t|h|s|x|%)?\b/gi, ' ').replace(/\bx\d+/g, ' ');
  return /[a-z]{2}/i.test(t) ? t.replace(/\s+/g, ' ').trim() : '';
}

// The crew's own names are names, in every language, and are left as they are.
let names = new Set();
function walk(el, path, out, seen = new Set()) {
  if (!el || seen.has(el)) return;
  seen.add(el);
  for (const k of ['textContent', 'innerHTML', 'title', 'placeholder']) {
    const v = el[k];
    if (typeof v !== 'string' || !v.trim()) continue;
    const left = unmarked(v);
    if (left && !names.has(left)) out.add(`${path}.${k}: ${left}   (${v.slice(0, 80)})`);
  }
  (el.children || []).forEach((c, i) => walk(c, `${path}/${i}`, out, seen));
}

const IDS = ['shop', 'crewshop', 'towershop', 'quarryshop', 'farmshop', 'filtershop', 'apothshop', 'shackshop', 'looshop',
  'statsshop', 'podsshop', 'bookincome', 'booksky', 'bookcrew', 'booktally', 'crewlistrows', 'modaltitle', 'objective',
  'queue', 'hidedone', 'raise', 'record', 'index', 'slots', 'cloudsheet', 'controlslist', 'said', 'motion', 'touch', 'dark',
  'sound', 'fullscreenrow', 'langbtn', 'recordbtn', 'slotsbtn', 'indexbtn', 'crewfade', 'way', 'fullscreen', 'toast', 'skip'];

export async function findUnmarked() {
  const yard = await newYard();
  const out = new Set();
  // The canvas's words: every fillText a frame draws, read as it is written.
  const { ctx } = await import('../../src/render/ctx.js');
  const { LAYERS } = await import('../../src/render.js');
  ctx.getTransform = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
  ctx.fillText = t => { const left = unmarked(t); if (left) out.add(`canvas ${left}`); };
  ctx.strokeText = ctx.fillText;
  const look = () => {
    names = new Set(yard.S.workers.map(w => w.name));
    yard.rebuildBoards();
    try { yard.fillBoard(); } catch {}
    // every board's cells, not only the bench's
    for (const which of BOARDS) try { refresh(shopOf(which), boardList(which), () => 0); } catch {}
    for (const k of ['books', 'crew']) try { yard.HANDLES.__window(k); } catch {}
    // the held sheet's pages, the corner cards and the story's line
    for (const p of ['main', 'slots', 'record', 'index', 'settings', 'controls']) {
      try { showPane(p); } catch {}
      for (const id of IDS) walk(document.getElementById(id), id, out);
    }
    for (const f of [fillQueue, () => seatObjective(performance.now()), stepToast]) try { f(); } catch {}
    // a layer at a time: the node canvas draws nothing, and a layer that
    // asks it for more than it has is passed over, not the frame
    for (const l of LAYERS) try { l.draw?.(); } catch {}
    for (const id of IDS) walk(document.getElementById(id), id, out);
    for (const r of yard.allRows()) for (const k of ['name', 'gain', 'waits']) {
      const left = unmarked(r[k] || '');
      if (left) out.add(`row ${r.key}.${k}: ${left}`);
    }
    // the hover, over a grid of the yard
    for (let x = 0; x < yard.S.worldW; x += 12) for (let y = 0; y < yard.S.H; y += 12) {
      const said = whatIsAt(x, y);
      const left = said ? unmarked(said) : '';
      if (left) out.add(`hover ${left}`);
    }
  };
  yard.reset(); yard.fast(2); look();
  yard.reset();
  yard.grant({ dust: 1e9, shards: 1e7, spores: 1e7, sparks: 1e4 });
  try { yard.everything(2, 3); } catch {}
  yard.fast(5); look();
  try { yard.everything(8, 8); } catch {}
  yard.fast(5); look();
  return [...out].sort();
}

if (process.argv[1]?.endsWith('pseudo.mjs')) {
  const found = await findUnmarked();
  console.log(found.join('\n') || 'nothing unmarked');
  process.exit(0);
}
