// The surfaces the wording inventory's strings stand on, and how each is
// stood up (tools/wording-shots.mjs). A surface is one page load; a step is
// one shot in it. `setup` is page script run as the body of an async
// function with `W` (tools/wording/page.js) and `M(name)`, the game's own
// module instance of src/<name>.js. `ids` are the strings looked for in the
// shot; `re` overrides a string's pattern where the page relabels it; `clip`
// is the element the shot is cropped round ('full' for the whole window).

import { readFileSync } from 'node:fs';
const INV = JSON.parse(readFileSync('docs/wording-inventory.json', 'utf8'));
const ids = (prefix, filter = () => true) => INV.filter(s => s.id.startsWith(prefix) && filter(s)).map(s => s.id);

// --- shared page script --------------------------------------------------------
// The held sheet up on a page of its own.
const HOLD = `(await M('input')).hold(true); await W.frames(3);`;
const PANE = p => `(await M('settings')).showPane(${JSON.stringify(p)}); await W.frames(3);`;
const YARD = `window.__reset(); window.__crew(3, 2); window.__fast(2);`;
// The board of times pointed at a stub: the answer is whatever
// window.__timesSay(path, body) returns (an object, null for a dead board, or
// a promise that never settles).
const TIMES = `
  (await M('timesboard')).setTimesUrl('http://times.test');
  if (!window.__realFetch) {
    window.__realFetch = window.fetch;
    window.fetch = async (u, init = {}) => {
      if (!String(u).startsWith('http://times.test')) return window.__realFetch(u, init);
      const path = String(u).slice('http://times.test'.length);
      const a = await window.__timesSay(path, init.body ? JSON.parse(init.body) : undefined);
      if (a === null) throw new Error('down');
      return new Response(JSON.stringify(a.body ?? a), { status: a.status || 200, headers: { 'content-type': 'application/json' } });
    };
  }
  window.__timesSay = () => ({ rows: [] });`;
const ROWS = `[
  { id: 'a', ms: 754000, seen: 754000, name: 'pebblefan', itch: true, at: Date.now() - 3 * 3600e3 },
  { id: 'b', ms: 912000, seen: 100000, name: 'rockhound', at: Date.now() - 2 * 86400e3 },
  { id: 'mine', ms: 1200000, seen: 1200000, name: 'you', at: Date.now() - 60e3 }]`;

// The cloud worker as a list of answers (after src/selftest/cloud.js).
// window.__cloudSay(method, path, init) may answer first with a Response.
const CLOUD = (where = 'play') => `
  const C = await M('cloud');
  const json = (status, body) => new Response(body == null ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  window.__cloudSlots = window.__cloudSlots || [null, null, null];
  window.__cloudBlobs = window.__cloudBlobs || {};
  window.__cloudCalls = [];
  const fetch = async (url, init = {}) => {
    const path = String(url).replace('http://cloud.test', '');
    const method = (init.method || 'GET').toUpperCase();
    window.__cloudCalls.push(method + ' ' + path);
    const pre = window.__cloudSay && await window.__cloudSay(method, path, init);
    if (pre) return pre;
    const one = path.match(/^\\/slots\\/(\\d)$/);
    if (method === 'POST' && path === '/vaults') return json(201, { code: '7F3KQ9WM2HXD' });
    if (method === 'GET' && path === '/slots') return json(200, { slots: window.__cloudSlots });
    if (one && method === 'GET') {
      const body = window.__cloudBlobs[one[1]];
      return body ? new Response(body, { status: 200, headers: { 'content-type': 'application/gzip', 'x-rev': '1' } }) : json(404, null);
    }
    if (one && method === 'PUT') return json(200, { rev: 2 });
    if (method === 'POST' && path === '/pairings') return json(200, { pair: 'K7Q-94M', expiresS: 600 });
    if (method === 'POST' && path === '/pairings/claim') {
      let pair = ''; try { pair = String(JSON.parse(init.body).pair).replace(/-/g, '').toUpperCase(); } catch {}
      return pair === 'K7Q94M' ? json(200, { code: '7F3KQ9WM2HXD' }) : json(404, null);
    }
    if (method === 'POST' && path === '/vaults/me/rotate') return json(200, { code: '7F3KQ9WM2HXD' });
    if (method === 'DELETE') return new Response(null, { status: 204 });
    return json(404, null);
  };
  C.setCloudUrl('http://cloud.test');
  C.setCloudFetch(fetch);
  (await M('cloudsheet')).refreshCloud();`;
// The landing page's saves page, turned to by its button.
const TITLE_SLOTS = `document.getElementById('slotsback').click(); document.getElementById('slotsbtn').click(); await W.frames(3);`;
const HELD_SLOTS = `${HOLD} ${PANE('slots')}`;
// The landing page's own store, and a yard to write into it: the picture
// frame behind the menu is a yard standing, so its save is a real one.
const TITLE_YARD = `
  const V = await M('save');
  V.setSlot(1);
  const ifr =document.getElementById('yard');
  await W.until(() => ifr.contentWindow && typeof ifr.contentWindow.__fast === 'function', 8000);
  const P2 = await ifr.contentWindow.eval("import('/src/persist.js')");
  const S2 = (await ifr.contentWindow.eval("import('/src/state.js')")).S;
  // The picture's yard is staged (it never writes); let off for the one write.
  const blob = () => { S2.staged = false; try { return P2.exportSave(); } finally { S2.staged = true; } };
  const yardOn = (n, ago) => { const s = JSON.parse(blob()); s.savedAt = Date.now() - ago; s.boulderNo = 5; s.crew = 8; V.writeSlot(n, JSON.stringify(s)); };`;
// The landing page's front read again off the store.
const FRONT = `document.getElementById('slotsback').click(); await W.frames(3);`;
// Every store trouble flag down, so the next one set is the one said.
const CLEAR_STORE = `S.fellBack = S.broken = S.yielded = S.unsaved = false; S.newerSave = null;`;
// Whatever has the sheet let go, so another end's sheet can be started.
const FREE_SHEET = `(await M('state')).S.beat.sheet = null; await W.frames(3);`;

// A slot written as a yard saved some while ago: a copy of the standing
// save with its rock, crew and when changed.
const SLOT = `
  const S = (await M('state')).S, P = await M('persist'), V = await M('save');
  P.persist(); await V.storeSettled();
  const yardAt = (n, ago, rock, crew) => { const s = JSON.parse(P.exportSave()); s.savedAt = Date.now() - ago; s.boulderNo = rock; s.crew = crew; s.yardId = 'yard-' + n; V.writeSlot(n, JSON.stringify(s)); };`;

// The story's card up with its line, faded in.
const CARD = `const want = (await M('objectives')).objective(); const o = document.getElementById('objective');
  await W.until(() => !o.hidden && !o.classList.contains('scened') && !o.classList.contains('going') && want && o.querySelector('.say').textContent === want.say, 8000); await W.sleep(1200);`;

// --- the serpent's tiles ---------------------------------------------------------------
// A tile found by the words its hover says, and the pointer put on it: the
// game's own tip (#tip) says them. The fight is frozen first (`__still`), so
// the phase's mechanic stays where it was set.
const TILE = text => `const SI = await M('render/statusicons'); await W.frames(2);
  for (let y = 0; y < innerHeight; y += 4) for (let x = 0; x < innerWidth; x += 4) {
    const t = SI.statusAt(x, y); if (t && t.text === ${JSON.stringify(text)}) return { x: t.x + t.w / 2, y: t.y + t.h / 2 }; }
  return null;`;
// The phase's mechanic set calm, warned or on, in place (deep/phases.js, `part`).
const MECH = (when, skip = false) => `const S = (await M('state')).S, m = (await M('deep/phases')).part().m;
  const on = m.every - m.last; S.mechSkip = ${skip};
  S.mechAt = ${when === 'calm' ? '(on - m.warn) / 2' : when === 'warn' ? 'on - m.warn / 2' : 'm.every - m.last / 2'}; await W.frames(3);`;
const FREEZE = scene => `window.__scene('${scene}'); window.__fast(1); await W.sleep(4300); window.__still(true); await W.frames(3);`;
const SAYS = { 'serp.lash.on': 'Lash: stuns melee attackers', 'serp.lash.calm': 'Lash: stuns melee attackers', 'serp.lash.coming': 'Lash coming',
  'serp.lash.stopped': 'Lash: stopped', 'serp.sink.coming': 'Cloak coming', 'serp.sink.on': 'Cloak: out of reach',
  'serp.orb.coming': 'Constrict coming', 'serp.orb.on': 'Constrict', 'serp.orb.stopped': 'Constrict', 'serp.dazed': 'Dazed: thrown off, seeing stars',
  'serp.constricted': 'Constricted', 'serp.barrier': 'Barrier: absorbs explosive damage', 'serp.ward': 'Ward: magic damage cut in half',
  'serp.plates': 'Plates: phys damage cut in half', 'serp.stun': 'Stun: holds still, stops healing', 'serp.bleed': 'Bleed: damage over time',
  'serp.haste': 'Haste: attacks 20% faster', 'serp.held': 'Held: cannot heal', 'serp.exposed': 'Exposed: takes 15%-25% more damage',
  'serp.inspired': 'Inspired: hits harder' };
// The tile itself boxed too: it and the word under it are canvas, not page.
const TILE_BOX = text => `const SI = await M('render/statusicons');
  for (let y = 0; y < innerHeight; y += 4) for (let x = 0; x < innerWidth; x += 4) {
    const t = SI.statusAt(x, y); if (t && t.text === ${JSON.stringify(text)}) { W.box({ x: t.x - 2, y: t.y - 2, w: t.w + 4, h: t.h + (t.y < innerHeight / 2 ? 24 : 8) }); return; } }`;
const tile = (id, setup = '', note = '') => ({ file: 'serpent-' + id.slice(5).replace(/\./g, '-'), pad: 150, setup, hover: TILE(SAYS[id]), boxes: TILE_BOX(SAYS[id]),
  ids: [id], noteAll: ['the serpent\'s status tile hovered: the tip under it says the line; the word under the tile is the line up to its colon', note].filter(Boolean).join('; ') });
const SERPENT = [
  { name: 'serp-lash', steps: [
    tile('serp.lash.on', FREEZE('phase-lash') + MECH('on'), 'the lash running'),
    tile('serp.plates'),
    tile('serp.dazed', '', 'a fighter thrown off by the lash; its tile up the post at its station'),
    tile('serp.lash.calm', MECH('calm'), 'between lashes'),
    tile('serp.lash.coming', MECH('warn'), 'the lash warned'),
    tile('serp.lash.stopped', MECH('on', true), 'the lash answered'),
  ] },
  { name: 'serp-sink', steps: [
    tile('serp.sink.on', FREEZE('phase-sink') + MECH('on')),
    tile('serp.ward'),
    tile('serp.sink.coming', MECH('warn')),
  ] },
  { name: 'serp-orb', steps: [
    tile('serp.orb.on', `window.__scene('phase-orb'); window.__fast(0.3); window.__still(true); await W.frames(3);`),
    tile('serp.constricted', '', 'a fighter held in the orb'),
    tile('serp.orb.stopped', MECH('on', true), 'the constrict answered (struck through)'),
    tile('serp.orb.coming', MECH('warn')),
  ] },
  { name: 'serp-barrier', steps: [
    tile('serp.barrier', `window.__scene('deep-barrier'); window.__fast(1); window.__still(true); await W.frames(3);`),
    tile('serp.exposed'),
  ] },
  { name: 'serp-statuses', steps: [
    tile('serp.bleed', `window.__scene('party-statuses'); window.__fast(1); window.__still(true); await W.frames(3);`),
    tile('serp.held'),
  ] },
  { name: 'serp-stun', steps: [
    tile('serp.stun', `window.__scene('deep-stun'); window.__fast(1); window.__still(true); await W.frames(3);`),
  ] },
  { name: 'serp-bard', steps: [
    tile('serp.inspired', `window.__scene('party-bard'); window.__fast(1); window.__still(true); await W.frames(3);`),
    tile('serp.haste', `const D = await M('deep/statuses'), S = (await M('state')).S; for (const w of S.workers) if (w.station) D.haste(w, 600); await W.frames(3);`,
         "every fighter hasted by hand for the shot (the Bard's Tempo lays it)"),
  ] },
];

// --- the index -----------------------------------------------------------------------------
// Every entry met, the page open, and each entry picked in turn: its name in
// the list and on the entry, its words under. In the inventory's order, which
// is config/index.js's.
const IDX = INV.filter(s => /^idx\.[^.]+\.name$/.test(s.id)).map(s => s.id.split('.')[1]);
// Each entry's group off config/index.js, so a group's heading is looked for
// on the shot of the first entry under it.
const INDEX_KEYS = [...readFileSync('src/config/index.js', 'utf8').matchAll(/\{ key: '?(\w+|[^,]+?)'?, group: '([^']+)'/g)].map(m => m[2]);
const grpIds = i => (i === 0 || INDEX_KEYS[i] !== INDEX_KEYS[i - 1])
  ? INV.filter(s => s.id.startsWith('idx.grp.') && s.text === INDEX_KEYS[i]).map(s => s.id) : [];
const INDEX_SURFACES = [{ name: 'index', steps: IDX.map((key, i) => ({
  file: 'index-' + String(i + 1).padStart(2, '0') + '-' + key, clip: '#held',
  setup: (i ? '' : `${YARD} const S = (await M('state')).S; const { INDEX } = await M('config/index');
          window.__serpentOn(true); S.seen = INDEX.map(e => e.key); S.indexRead = INDEX.map(e => e.key);
          ${HOLD} ${PANE('index')} `) +
         `{ const { INDEX } = await M('config/index'); const e = INDEX[${i}];
           window.__wqIndexName = e.name;
           const b = document.querySelector('#index .it[data-key="' + e.key + '"]'); if (b) b.click(); await W.frames(3); }`,
  ids: ['idx.' + key + '.name', 'idx.' + key + '.text', ...grpIds(i), ...(i ? [] : ['held.index.word', 'held.indexback'])],
  noteAll: 'the index page (held sheet), this entry picked; the name is outlined in the list and on the entry',
})) }];

export const SURFACES = [
  // --- the held sheet ---------------------------------------------------------------
  { name: 'held', steps: [
    { file: 'sheet-paused', clip: '#held',
      setup: `${YARD} ${HOLD}`,
      ids: ['held.word', 'held.resume', 'held.slotsbtn', 'held.slotsbtn.label', 'held.recordbtn', 'held.recordbtn.label',
            'held.indexbtn', 'held.settingsbtn', 'held.titlebtn', 'held.keys'],
      re: { 'held.slotsbtn': 'saves · .*', 'held.recordbtn': 'achievements · .*' },
      note: { 'held.slotsbtn': 'relabelled from JS: reads "saves · n of 3"', 'held.recordbtn': 'relabelled from JS: reads "achievements · n of m"' } },
    { file: 'sheet-settings', clip: '#held',
      setup: `${PANE('settings')}`,
      ids: ['held.settings.word', 'set.motion.full', 'set.touch.off', 'set.dark.off', 'set.fullscreen.off', 'set.sound.on',
            'set.volume.aria', 'set.controlsbtn', 'set.settingsback'] },
    { file: 'sheet-settings-switched', clip: '#held',
      setup: `document.getElementById('motion').click(); document.getElementById('sound').click(); document.getElementById('touch').click();
              ${PANE('settings')}`,
      ids: ['set.motion.less', 'set.motion.full', 'set.touch.on', 'set.sound.off', 'set.sound.on'] },
    { file: 'sheet-controls', clip: '#held',
      setup: `${PANE('controls')}`,
      ids: ['set.controls.word', 'set.controlsback', ...ids('ctl.')] },
  ] },
  // The dark switch reloads the page, so its "on" is a page of its own.
  { name: 'held-dark', before: `try { localStorage.setItem('boulder-clicker/prefs', JSON.stringify({ dark: true })); } catch {}`, steps: [
    { file: 'sheet-settings-dark', clip: '#held',
      setup: `${YARD} ${HOLD} ${PANE('settings')}`,
      ids: ['set.dark.on'] },
  ] },
  // --- the saves page, on the held sheet ------------------------------------------
  { name: 'saves', steps: [
    { file: 'sheet-saves', clip: '#held',
      setup: `(await M('persist')).switchSlot(1); ${YARD} ${SLOT} yardAt(2, 5 * 60e3, 4, 6); yardAt(3, 3 * 3600e3, 7, 12); ${HELD_SLOTS}`,
      ids: ['held.slots.word', 'held.savecopy', 'held.loadsave', 'held.slotsback', 'slots.row.rock', 'slots.row.crew',
            'slots.row.playing', 'slots.since.min', 'slots.since.h', 'slots.del.aria'] },
    { file: 'sheet-saves-older', clip: '#held',
      setup: `${SLOT} yardAt(2, 26 * 3600e3, 4, 6); yardAt(3, 4 * 86400e3, 7, 12); ${PANE('main')} ${PANE('slots')}`,
      ids: ['slots.since.day', 'slots.since.days'] },
    { file: 'sheet-saves-empty-unreadable', clip: '#held',
      setup: `${SLOT} V.writeSlot(2, ''); V.writeSlot(3, '{not a save'); ${PANE('main')} ${PANE('slots')}`,
      ids: ['slots.row.empty', 'slots.row.unreadable'] },
    { file: 'sheet-saves-arm', clip: '#held',
      setup: `document.querySelector('#slots .slot[data-slot="2"]').click(); await W.frames(3);`,
      ids: ['slots.arm'] },
    { file: 'sheet-saves-confirm', clip: '#held', settle: 1500,
      setup: `${PANE('main')} ${PANE('slots')} document.querySelector('#slots .del[data-slot="1"]').click(); await W.sleep(600);`,
      ids: ['slots.confirm.yes', 'slots.confirm.no'] },
    { file: 'sheet-saves-paste', clip: '#held',
      setup: `${PANE('main')} ${PANE('slots')} document.getElementById('loadsave').click(); await W.frames(3);`,
      ids: ['held.loadit', 'held.nevermind'] },
    { file: 'sheet-saves-notasave', clip: '#held',
      setup: `document.getElementById('pastebox').value = 'not a save at all'; document.getElementById('loadit').click(); await W.frames(3);`,
      ids: ['said.notasave'] },
    { file: 'sheet-saves-copied', clip: '#held',
      setup: `window.focus(); document.getElementById('nevermind').click(); document.getElementById('savecopy').click(); await W.sleep(300);`,
      ids: ['said.copyout.copied', 'said.copyout.window'] },
    { file: 'sheet-saves-copy-noclipboard', clip: '#held',
      setup: `navigator.clipboard.writeText = () => Promise.reject(new Error('no')); document.getElementById('savecopy').click(); await W.sleep(300);`,
      ids: ['said.copyout.window', 'said.copyout.copied'] },
    { file: 'sheet-paused-loaded', clip: '#held',
      setup: `${PANE('slots')} document.getElementById('loadsave').click();
              document.getElementById('pastebox').value = (await M('persist')).exportSave();
              document.getElementById('loadit').click(); await W.frames(3);`,
      ids: ['said.loaded'], note: { 'said.loaded': 'after load a save -> load it with a good save; the page turns back to the front' } },
    { file: 'sheet-saves-couldnotload', clip: '#held',
      setup: `${PANE('main')} ${PANE('slots')} document.getElementById('loadsave').click();
              const S = (await M('state')).S, was = S.boulderNo;
              document.getElementById('pastebox').value = (await M('persist')).exportSave();
              S.boulderNo = 10n; try { document.getElementById('loadit').click(); } finally { S.boulderNo = was; } await W.frames(3);`,
      ids: ['said.couldnotload'], noteAll: 'an import that throws, forced: a value the save cannot write (a BigInt) left in the yard, so the save taken first throws' },
    { file: 'sheet-paused-slotloaded', clip: '#held',
      setup: `${SLOT} yardAt(2, 26 * 3600e3, 4, 6); ${PANE('main')} ${PANE('slots')} document.querySelector('#slots .slot[data-slot="2"]').click(); await W.frames(3);`,
      ids: ['slots.said.loaded'] },
  ] },
  // --- the held sheet's replies about the store -------------------------------------
  { name: 'said', steps: [
    ...[['fellBack', 'said.fellback'], ['broken', 'said.broken'], ['yielded', 'said.yielded']].map(([flag, id]) => (
      { file: 'sheet-paused-' + id.split('.')[1], clip: '#held',
        setup: `const S = (await M('state')).S; if (!(S.crew > 0)) { ${YARD} } if (!S.paused) { ${HOLD} }
                ${CLEAR_STORE} S.${flag} = true; (await M('settings')).sayStore(); await W.frames(3);`,
        ids: [id], noteAll: 'the line the held sheet says as it comes up (sayStore); the flag set by hand' })),
    { file: 'sheet-paused-newer', clip: '#held',
      setup: `const S = (await M('state')).S; ${CLEAR_STORE} S.newerSave = '9.9.9'; (await M('settings')).sayStore(); await W.frames(3);`,
      ids: ['said.newer'], noteAll: 'build name filled with a made-up 9.9.9' },
    ...[['SecurityError', 'said.unsaved.blocked'], ['QuotaExceededError', 'said.unsaved.full'], ['UnknownError', 'said.unsaved.refused']].map(([name, id]) => (
      { file: 'sheet-paused-' + id.split('.').slice(1).join('-'), clip: '#held',
        setup: `const S = (await M('state')).S, I = await M('input'), P = await M('persist');
                IDBObjectStore.prototype.put = function () { const r = {}; Object.defineProperty(r, 'error', { value: new DOMException('refused', ${JSON.stringify(name)}) }); setTimeout(() => r.onerror && r.onerror(), 0); return r; };
                Storage.prototype.setItem = function () { throw new DOMException('refused', ${JSON.stringify(name)}); };
                ${CLEAR_STORE} P.persist(); await W.sleep(80); P.persist(); await W.sleep(80);
                (await M('settings')).sayStore(); await W.frames(3);`,
        ids: [id], noteAll: 'the store made to refuse writes with a ' + name + ' for the shot' })),
  ] },
  // --- the board of times ---------------------------------------------------------
  { name: 'times', steps: [
    { file: 'sheet-paused-times', clip: '#held',
      setup: `${TIMES} window.__timesSay = () => ({ rows: ${ROWS} }); ${YARD} ${HOLD}`,
      ids: ['held.timesbtn'], noteAll: 'the board of times is off in this build (TIMES_ON=false); pointed at a stub for the shot' },
    { file: 'sheet-times', clip: '#held',
      setup: `(await M('state')).S.runId = 'mine'; ${PANE('times')} await W.until(() => document.querySelector('#times .row'));`,
      ids: ['held.times.word', 'held.times.row', 'held.timesback'], noteAll: 'TIMES_ON=false in this build; a stub board' },
    { file: 'sheet-paused-times-best', clip: '#held',
      setup: `${PANE('main')}`,
      ids: ['held.timesbtn.label'], noteAll: 'TIMES_ON=false in this build; a stub board' },
    { file: 'sheet-times-asking', clip: '#held',
      setup: `window.__timesSay = () => new Promise(() => {}); ${PANE('times')}`,
      ids: ['held.times.asking'], noteAll: 'TIMES_ON=false in this build; a stub board that never answers' },
    { file: 'sheet-times-down', clip: '#held',
      setup: `window.__timesSay = () => null; ${PANE('main')} ${PANE('times')} await W.sleep(200);`,
      ids: ['held.times.down'], noteAll: 'TIMES_ON=false in this build; a stub board that cannot be reached' },
    { file: 'sheet-times-nobody', clip: '#held',
      setup: `window.__timesSay = () => ({ rows: [] }); ${PANE('main')} ${PANE('times')} await W.sleep(200);`,
      ids: ['held.times.nobody'], noteAll: 'TIMES_ON=false in this build; a stub board with no rows' },
    { file: 'sheet-times-noboard', clip: '#held',
      setup: `(await M('timesboard')).setTimesUrl(''); ${PANE('main')} ${PANE('times')}`,
      ids: ['held.times.noboard'], noteAll: 'the page turned to directly: with no board the times button is hidden, so a player never sees this' },
  ] },
  { name: 'times-name', steps: [
    { file: 'sheet-settings-times', clip: '#held',
      setup: `${TIMES} ${YARD} ${HOLD} ${PANE('settings')}`,
      ids: ['set.boardname.placeholder'], noteAll: 'the name box shows only with a board of times (TIMES_ON=false in this build; a stub here)' },
  ] },
  // --- the rescue sheet and the other ends ------------------------------------------
  { name: 'rescue', steps: [
    { file: 'sheet-rescue', clip: '#saved', pad: 60,
      setup: `${TIMES} window.__timesSay = (p) => (p === '/runs' ? { id: 'r1' } : new Promise(() => {}));
              window.__scene('rescue-sheet-off'); window.__fast(1); await W.until(() => !document.getElementById('saved').hidden); await W.frames(3);`,
      ids: ['saved.word', 'saved.why', 'saved.timesname.placeholder', 'saved.timesgo', 'saved.thanks', 'saved.keepplaying'],
      note: { 'saved.timesname.placeholder': 'TIMES_ON=false in this build; the name box shows only with a board (a stub here)',
              'saved.timesgo': 'TIMES_ON=false in this build; a stub board' } },
    { file: 'sheet-rescue-telling', clip: '#saved', pad: 60,
      setup: `document.getElementById('timesname').value = 'pebblefan'; document.getElementById('timesgo').click(); await W.frames(3);`,
      ids: ['saved.telling'], noteAll: 'TIMES_ON=false in this build; a stub board that has not answered yet' },
    ...[['rank', `{ rank: 3, of: 41 }`, 'saved.rank'], ['down', 'null', 'saved.boarddown'], ['409', `{ status: 409, body: { error: 'x' } }`, 'saved.refuse.409'],
        ['422', `{ status: 422, body: { error: 'x' } }`, 'saved.refuse.422'], ['429', `{ status: 429, body: { error: 'x' } }`, 'saved.refuse.429']].map(([k, a, id]) => (
      { file: 'sheet-rescue-' + k, clip: '#saved', pad: 60,
        setup: `window.__timesSay = () => (${a}); document.getElementById('timesgo').click(); await W.sleep(250);`,
        ids: [id], noteAll: 'TIMES_ON=false in this build; the stub board answering ' + k })),
  ] },
  { name: 'rescue-on', steps: [
    { file: 'sheet-rescue-storygoeson', clip: '#saved', pad: 60,
      setup: `window.__scene('rescue-sheet'); window.__fast(1); await W.until(() => !document.getElementById('saved').hidden); await W.frames(3);`,
      ids: ['saved.word', 'saved.why'], note: { 'saved.word': 'with the second half on: no thanks and no button' } },
  ] },
  { name: 'ends', steps: [
    { file: 'sheet-demoend', clip: '#demoend', pad: 60,
      setup: `${YARD} (await M('beats')).startBeat('demoend'); await W.until(() => !document.getElementById('demoend').hidden); document.getElementById('demostore').hidden = false; await W.frames(3);`,
      ids: ['demoend.word', 'demoend.why', 'demoend.store', 'demoend.keep'],
      note: { 'demoend.store': 'shown only when the build has a STORE_URL; unhidden for the shot' } },
    { file: 'sheet-teaseend', clip: '#teaseend', pad: 60,
      setup: `${FREE_SHEET} (await M('beats')).startBeat('teaseend'); await W.until(() => !document.getElementById('teaseend').hidden); document.getElementById('teasestore').hidden = false; await W.frames(3);`,
      ids: ['teaseend.word', 'teaseend.store', 'teaseend.keep'],
      note: { 'teaseend.store': 'shown only when the build has a STORE_URL; unhidden for the shot' } },
    { file: 'sheet-freed', clip: '#freed', pad: 60,
      setup: `${FREE_SHEET} (await M('beats')).startBeat('freedsheet'); await W.until(() => !document.getElementById('freed').hidden); await W.frames(3);`,
      ids: ['freed.word', 'freed.why', 'freed.end', 'freed.thanks', 'freed.keep'] },
  ] },
  { name: 'crash', steps: [
    { file: 'sheet-crashed', clip: '#crashed', pad: 60,
      setup: `${YARD} (await M('crash')).fatal(''); await W.frames(3);`,
      ids: ['crashed.word', 'crashed.why.fallback', 'crashed.copysave'], note: { 'crashed.why.fallback': 'a throw with no message' } },
    { file: 'sheet-crashed-copied', clip: '#crashed', pad: 60,
      setup: `window.focus(); document.getElementById('copysave').click(); await W.sleep(400);`,
      ids: ['said.copyout.copied', 'said.copyout.window'] },
  ] },
  // --- the desk (Electron) build: window.desk stood in before the page boots ----------
  { name: 'desk', before: `window.desk = { read: () => ({}), write: () => true, exportTo: async () => window.__deskTake !== false, importFrom: async () => null };`, steps: [
    { file: 'sheet-paused-desk', clip: '#held',
      setup: `${YARD} ${HOLD}`,
      ids: ['held.quit'], noteAll: 'desktop build only; window.desk stood in for the shot' },
    { file: 'sheet-paused-desk-saved', clip: '#held',
      setup: `${PANE('slots')} document.getElementById('savecopy').click(); await W.sleep(200);`,
      ids: ['said.saved'], noteAll: 'desktop build only: the reply after copy a save writes the file' },
    { file: 'sheet-paused-desk-notsaved', clip: '#held',
      setup: `window.__deskTake = false; document.getElementById('savecopy').click(); await W.sleep(200);`,
      ids: ['said.notsaved'], noteAll: 'desktop build only: the reply when the file dialog is cancelled or fails' },
  ] },
  { name: 'title-desk', page: 'title', before: `window.desk = { read: () => ({}), write: () => true, exportTo: async () => true, importFrom: async () => null };`, steps: [
    { file: 'title-desk', clip: '.col',
      setup: `await W.sleep(300);`,
      ids: ['title.quit'], noteAll: 'desktop build only; window.desk stood in for the shot' },
  ] },

  // --- the landing page ---------------------------------------------------------------
  { name: 'title', page: 'title', steps: [
    { file: 'title', clip: 'full',
      setup: `${TITLE_YARD} yardOn(1, 2 * 3600e3); ${FRONT} await W.sleep(800);`,
      ids: ['title.gamename', 'title.line', 'title.play', 'title.playlabel.row', 'title.slotsbtn', 'title.recordbtn',
            'title.settingsbtn', 'title.link.itch', 'title.link.github'],
      re: { 'title.slotsbtn': 'saves · .*', 'title.recordbtn': 'achievements · .*' },
      note: { 'title.slotsbtn': 'relabelled from JS: reads "saves · n of 3"', 'title.recordbtn': 'relabelled from JS: reads "achievements · n of m"' } },
    { file: 'title-newyard', clip: '.col',
      setup: `const V = await M('save'); V.writeSlot(1, ''); ${FRONT}`,
      ids: ['title.playlabel.new'] },
    { file: 'title-record-empty', clip: '.col',
      setup: `document.getElementById('recordbtn').click(); await W.frames(3);`,
      ids: ['title.record.word', 'title.recordback', 'held.record.none'],
      note: { 'held.record.none': 'the landing page achievements page on an empty slot; the held sheet says the same on a yard with nothing earned' } },
    { file: 'title-copy-none', clip: '.col',
      setup: `${TITLE_SLOTS} document.getElementById('savecopy').click(); await W.sleep(200);`,
      ids: ['said.copyout.none'] },
    { file: 'title-saves', clip: '.col',
      setup: `${TITLE_YARD} yardOn(1, 10e3); ${TITLE_SLOTS}`,
      ids: ['title.slots.word', 'title.savecopy', 'title.loadsave', 'title.slotsback', 'slots.since.now'] },
    { file: 'title-saves-paste', clip: '.col',
      setup: `document.getElementById('loadsave').click(); await W.frames(3);`,
      ids: ['title.loadit', 'title.nevermind'] },
    { file: 'title-saves-notasave', clip: '.col',
      setup: `document.getElementById('pastebox').value = 'not a save'; document.getElementById('loadit').click(); await W.frames(3);`,
      ids: ['title.said.notasave'] },
    { file: 'title-loaded', clip: '.col',
      setup: `${TITLE_YARD} document.getElementById('pastebox').value = blob(); document.getElementById('loadit').click(); await W.frames(3);`,
      ids: ['title.said.loaded'] },
    { file: 'title-erased', clip: '.col',
      setup: `${TITLE_SLOTS} document.querySelector('#slots .del[data-slot="1"]').click(); await W.sleep(400);
              document.querySelector('#slots .confirm[data-slot="1"] .yes').click(); await W.frames(3);`,
      ids: ['title.said.erased'] },
    { file: 'title-saves-newyard', clip: '.col',
      setup: `const V = await M('save'); V.writeSlot(2, ''); ${TITLE_SLOTS}
              const b = document.querySelector('#slots .slot[data-slot="2"]'); b.click(); b.click(); await W.frames(3);`,
      ids: ['slots.said.new'], note: { 'slots.said.new': 'the landing page; on the held sheet the sheet goes down as the new yard starts, so the line is not seen there' } },
    { file: 'title-settings', clip: '.col',
      setup: `document.getElementById('settingsbtn').click(); await W.frames(3);`,
      ids: ['title.settings.word', 'title.motion', 'title.dark', 'title.sound', 'title.controlsbtn', 'title.settingsback'],
      re: { 'title.motion': 'motion: (full|less)', 'title.dark': 'dark: (on|off)', 'title.sound': 'sound: (on|off)' },
      noteAll: 'one state of the switch shown; the held sheet shots show both states of each' },
    { file: 'title-controls', clip: '.col',
      setup: `document.getElementById('controlsbtn').click(); await W.frames(3);`,
      ids: ['title.controls.word', 'title.controlsback'] },
    { file: 'title-board', clip: 'full',
      setup: `${TIMES} window.__timesSay = () => ({ rows: ${ROWS} }); document.getElementById('settingsback').click();
              document.getElementById('board').hidden = false; await (await M('timesboard')).showTimes(document.getElementById('times')); await W.frames(3);`,
      ids: ['title.board.word'], noteAll: 'the board of times is off in this build (TIMES_ON=false): the panel unhidden over a stub board for the shot' },
  ] },

  // --- cloud saves, on the landing page's saves page and foot bar -----------------------
  { name: 'cloud-title', page: 'title', steps: [
    { file: 'title-cloud-off', clip: 'full',
      setup: `${CLOUD()} await C.stopCloud(); (await M('cloudsheet')).refreshCloud(); ${TITLE_SLOTS}`,
      ids: ['cloud.line.off', 'cloud.head', 'cloud.btn.enable', 'cloud.btn.linkcode', 'cloud.btn.recovery'],
      noteAll: 'cloud saves are pointed at a stub worker for these shots' },
    { file: 'title-cloud-linkcode', clip: '#cloudsheet', pad: 40,
      setup: `W.btn('enter a link code').click(); await W.frames(3);`,
      ids: ['cloud.box.linkph', 'cloud.box.aria.link', 'cloud.typing.link', 'cloud.btn.dolink', 'cloud.btn.nevermind'] },
    { file: 'title-cloud-wrong', clip: '#cloudsheet', pad: 40,
      setup: `const box = document.querySelector('#cloudsheet input'); box.value = 'ZZ'; W.btn('link').click(); await W.sleep(200);`,
      ids: ['cloud.wrong'] },
    { file: 'title-cloud-recovery', clip: '#cloudsheet', pad: 40,
      setup: `W.btn('never mind').click(); await W.frames(2); W.btn('use a recovery code').click(); await W.frames(3);`,
      ids: ['cloud.box.recph', 'cloud.box.aria.rec', 'cloud.typing.rec'] },
    { file: 'title-cloud-enabled', clip: 'full',
      setup: `W.btn('never mind').click(); await W.frames(2); W.btn('enable cloud syncing').click(); await W.until(() => document.querySelector('#cloudsheet .code')); await W.frames(3);`,
      ids: ['cloud.btn.copy', 'cloud.writedown', 'cloud.btn.link', 'cloud.btn.newcode', 'cloud.btn.stop', 'cloud.line.on'] },
    { file: 'title-cloud-pair', clip: '#cloudsheet', pad: 40,
      setup: `W.btn('link a device').click(); await W.until(() => document.querySelector('#cloudsheet .pair-code')); await W.frames(3);`,
      ids: ['cloud.pair.enter', 'cloud.pair.left', 'cloud.btn.done'] },
    { file: 'title-cloud-showcode', clip: '#cloudsheet', pad: 40,
      setup: `W.btn('done').click(); ${TITLE_SLOTS}`,
      ids: ['cloud.btn.showcode'] },
    { file: 'title-cloud-hidecode', clip: '#cloudsheet', pad: 40,
      setup: `W.btn('show recovery code').click(); await W.frames(3);`,
      ids: ['cloud.btn.hidecode'] },
    { file: 'title-cloud-newcode-armed', clip: '#cloudsheet', pad: 40,
      setup: `W.btn('new recovery code').click(); await W.frames(3);`,
      ids: ['cloud.btn.newcode.armed'] },
    { file: 'title-cloud-saved', clip: 'full',
      setup: `const V = await M('save'); const f = JSON.parse(V.cloudRaw()); f.at = Date.now() - 5 * 60e3; V.setCloudRaw(JSON.stringify(f));
              (await M('cloudsheet')).refreshCloud(); await W.frames(3);`,
      ids: ['cloud.line.saved'], noteAll: 'the last push time set to five minutes ago (the landing page does not push itself)' },
    { file: 'title-cloud-stopped', clip: '#cloudsheet', pad: 40,
      setup: `W.btn('stop cloud saves').click(); await W.until(() => /off on this device/.test(document.getElementById('cloudsheet').textContent)); await W.frames(3);`,
      ids: ['cloud.said.off'] },
    ...[['503', 'cloud.why.resting'], ['403', 'cloud.why.forbidden'], ['0', 'cloud.why.noanswer']].map(([code, id]) => (
      { file: 'title-cloud-enable-' + code, clip: '#cloudsheet', pad: 40,
        setup: `window.__cloudSay = (m, p) => (m === 'POST' && p === '/vaults' ? (${code} ? new Response('{}', { status: ${code} }) : Promise.reject(new Error('net'))) : null);
                ${TITLE_SLOTS} W.btn('enable cloud syncing').click(); await W.sleep(400);`,
        ids: [id], noteAll: 'enable cloud syncing against a stub worker answering ' + (code === '0' ? 'nothing' : code) })),
    { file: 'title-cloud-linked', clip: '#cloudsheet', pad: 40,
      setup: `window.__cloudSay = null; ${TITLE_SLOTS} W.btn('enter a link code').click(); await W.frames(2);
              document.querySelector('#cloudsheet input').value = 'K7Q-94M'; W.btn('link').click(); await W.until(() => /linked/.test(document.getElementById('cloudsheet').textContent)); await W.frames(3);`,
      ids: ['cloud.said.linked'] },
    ...[['401', 'cloud.line.out', 'title-cloud-signedout'], ['500', 'cloud.line.offline', 'title-cloud-offline'], ['429', 'cloud.line.paused', 'title-cloud-paused']].map(([code, id, file]) => (
      { file, clip: 'full',
        setup: `const C = await M('cloud'); window.__cloudSay = (m, p) => (m === 'GET' && p === '/slots' ? new Response('{}', { status: ${code} }) : null);
                { const V = await M('save'); const f = JSON.parse(V.cloudRaw()); delete f.out; V.setCloudRaw(JSON.stringify(f)); }
                await C.cloudBoot(); (await M('cloudsheet')).refreshCloud(); ${TITLE_SLOTS}`,
        ids: [id, ...(code === '401' ? ['cloud.btn.linkcode', 'cloud.btn.recovery', 'cloud.btn.stop'] : [])],
        noteAll: 'the stub worker answering ' + code + " to the boot's look at the slots" })),
    { file: 'title-cloud-newer', clip: 'full',
      setup: `const C = await M('cloud'); window.__cloudSay = null; const V = await M('save'); const f = JSON.parse(V.cloudRaw()); delete f.out; V.setCloudRaw(JSON.stringify(f));
              window.__cloudSlots = [{ rev: 5, yardId: 'x', playedS: 10, saveV: 9999, size: 10, at: Date.now() }, null, null];
              await C.cloudBoot(); (await M('cloudsheet')).refreshCloud(); ${TITLE_SLOTS}`,
      ids: ['cloud.line.newer'], noteAll: 'the stub cloud holding a save from a newer build' },
  ] },
  { name: 'cloud-conflict', page: 'title', steps: [
    { file: 'title-cloud-conflict', clip: 'full',
      setup: `${TITLE_YARD} yardOn(1, 60e3); ${CLOUD()} await C.stopCloud();
              const other = JSON.parse(blob()); other.yardId = 'another-yard'; other.playedS = 99999; other.crew = 9;
              const body = new Uint8Array(await new Response(new Blob([JSON.stringify(other)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
              window.__cloudSlots = [{ rev: 1, yardId: 'another-yard', playedS: 99999, saveV: other.saveV, size: body.length, at: Date.now() }, null, null];
              window.__cloudBlobs = { 1: body };
              ${TITLE_SLOTS} W.btn('enter a link code').click(); await W.frames(2);
              document.querySelector('#cloudsheet input').value = 'K7Q-94M'; W.btn('link').click();
              await W.until(() => !document.getElementById('clashes').hidden && document.querySelector('#clashes .clash')); await W.frames(3);`,
      ids: ['title.conflict.word', 'title.conflictback', 'cloud.clash.here', 'cloud.clash.cloud', 'cloud.line.conflict', 'cloud.foot.choose'],
      re: { 'cloud.line.conflict': 'cloud · choose a yard' },
      noteAll: 'a link that meets a different yard in slot 1 (stub worker)' },
  ] },
  // --- cloud saves in play: the pushes' refusals, and another device ahead ---------------
  ...[['413', 'cloud.line.big', 'too big for the cloud'], ['507', 'cloud.line.full', 'the cloud is full'], ['400', 'cloud.line.refused', 'a save was refused']].map(([code, id, words]) => (
    { name: 'cloud-play-' + code, steps: [
      { file: 'sheet-saves-cloud-' + id.split('.').pop(), clip: '#held',
        setup: `${YARD} ${CLOUD()} await C.stopCloud(); await C.startCloud();
                window.__cloudSay = (m, p) => (m === 'PUT' ? new Response('{}', { status: ${code} }) : null);
                (await M('persist')).persist(); await C.pump(Date.now() + 1e7); await W.sleep(100);
                ${HELD_SLOTS} await W.frames(3);`,
        ids: [id], re: { [id]: words },
        noteAll: 'on the saves page the cloud section says the line without its "cloud · " (the foot bar that says it whole is the landing page, which never pushes); stub worker answering ' + code },
    ] })),
  { name: 'cloud-behind', steps: [
    { file: 'sheet-saves-cloud-behind', clip: '#held',
      setup: `${YARD} ${CLOUD()} await C.stopCloud(); await C.startCloud();
              const S = (await M('state')).S, P = await M('persist');
              const ahead = JSON.parse(P.exportSave()); ahead.playedS = (ahead.playedS || 0) + 5000;
              const body = new Uint8Array(await new Response(new Blob([JSON.stringify(ahead)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
              window.__cloudBlobs = { 1: body };
              window.__cloudSay = (m, p) => (m === 'PUT' ? new Response(JSON.stringify({ slot: { rev: 9, yardId: ahead.yardId, saveV: ahead.saveV, playedS: ahead.playedS, size: body.length } }), { status: 412, headers: { 'content-type': 'application/json' } }) : null);
              window.__fast(2); P.persist(); await C.pump(Date.now() + 1e7); await W.sleep(100);
              ${HELD_SLOTS} await W.frames(3);`,
      ids: ['cloud.line.behind', 'cloud.btn.take', 'cloud.btn.keep'], re: { 'cloud.line.behind': 'newer on another device' },
      noteAll: 'another device ahead on this yard (stub worker answering 412); the section says the line without its "cloud · "' },
    { file: 'toast-cloud-newer', clip: 'full',
      setup: `(await M('input')).hold(false); await W.until(() => [...document.querySelectorAll('button.toast')].some(b => !b.hidden && /another device/.test(b.textContent)), 20000); await W.sleep(800);`,
      ids: ['note.cloud.name', 'note.cloud.note'], noteAll: 'the card the yard puts up once when another device is ahead (asked every 15 s)' },
    { file: 'sheet-saves-cloud-kept', clip: '#held',
      setup: `${HELD_SLOTS} W.btn('keep this one').click(); await W.until(() => /kept/.test(document.getElementById('cloudsheet').textContent)); await W.frames(3);`,
      ids: ['cloud.said.kept'] },
  ] },
  // --- the story's card ----------------------------------------------------------------
  // A page each: the card strikes its old line through and fades before the
  // next, so a step after a step is a shot of the fade.
  ...[
    ['quest', `window.__scene('storyquest');`, ['obj.rock', 'obj.rock.q.chip', 'obj.rock.q.pickup', 'obj.rock.q.toss']],
    ['falling', `window.__reset(); window.__crew(1); (await M('beats')).markDone('meet'); window.__fast(1);`],
    ['props', `window.__scene('propsoffer');`],
    ['net', `window.__reset(); window.__crew(3, 1); window.__answered('props'); const S = (await M('state')).S; S.farmOpen = true; window.__fast(2);`],
    ['arch', `window.__reset(); window.__crew(3, 1); window.__answered('props', 'net'); const S = (await M('state')).S; S.farmOpen = S.quarryOpen = true; window.__fast(2);`],
    ['dome', `window.__scene('domeoffer');`],
    ['rescue', `window.__scene('domeoffer'); window.__answered('dome'); window.__fast(0.2);`],
    ['drown', `window.__reset(); window.__crew(2, 1); window.__serpentOn(true); const S = (await M('state')).S; S.rescued = true; S.buried = false;
               (await M('beats')).markDone('meet', 'part', 'rescue', 'ending'); window.__fast(1);`],
    ['tower', `window.__reset(); window.__crew(2, 1); window.__snatch({ played: true, portal: false }); const S = (await M('state')).S; S.towerOpen = false; S.meteorOpen = false; window.__view('yard'); window.__fast(1);`],
    ['talk', `window.__scene('aftersnatch');`],
    ['portal', `window.__scene('aftersnatch'); (await M('state')).S.askedWizards = true; window.__fast(0.5);`],
    ['free', `window.__scene('portal'); window.__fast(0.5);`],
    ['props-cancel', `window.__scene('propsqueued');`, ['obj.props', 'obj.barrier.cancel']],
  ].map(([key, setup, want]) => ({ name: 'card-' + key, steps: [
    { file: 'card-story-' + key, clip: '#topleft', pad: 40,
      setup: setup + ` window.__nocine(); window.__fast(0.1); window.__nocine(); ` + CARD,
      ids: ['obj.next', ...(want || ['obj.' + key])] }] })),

  // --- the achievements: the toast as one pops, and the page that keeps them -----------
  { name: 'toast', steps: [
    { file: 'toast-achievement-firstgrain', clip: '#toast', pad: 60,
      setup: `${YARD} const S = (await M('state')).S, N = await M('notices'); S.won = S.won.filter(k => k !== 'firstgrain');
              window.__fast(8); N.hushNotices(); S.won = S.won.filter(k => k !== 'firstgrain'); N.earn('firstgrain'); await W.frames(2);
              await W.until(() => (document.querySelector('#toast .name') || {}).textContent === "makin' money" && document.getElementById('toast').classList.contains('up'), 8000); await W.sleep(900);`,
      ids: ['ach.firstgrain.name', 'ach.firstgrain.note'], noteAll: 'the toast as it pops' },
  ] },
  { name: 'record', steps: [
    { file: 'sheet-achievements-none', clip: '#held',
      setup: `${YARD} const S = (await M('state')).S; S.won = []; S.wonAt = {}; ${HOLD} ${PANE('record')}`,
      ids: ['held.record.none', 'held.record.word', 'held.recordback'], again: true },
    ...[0, 1, 2, 3].map(k => ({ file: 'sheet-achievements-' + (k + 1), clip: '#held',
      setup: (k ? '' : `const N = await M('notices'); for (const n of N.NOTICES) N.earn(n.key, true); ${PANE('main')} ${PANE('record')}`) +
             `const box = [document.getElementById('record'), document.getElementById('held')].find(e => e.scrollHeight > e.clientHeight + 4);
              if (box) box.scrollTop = ${k} * (box.clientHeight - 60); await W.frames(3);`,
      ids: ids('ach.'), noteAll: 'the achievements page with every one earned' })),
    { file: 'sheet-paused-achievements-all', clip: '#held',
      setup: `${PANE('main')}`,
      ids: ['held.recordbtn.label', 'held.indexbtn'] },
  ] },

  // --- the serpent's status tiles, hovered ----------------------------------------------
  ...SERPENT,

  // --- the yard's own bits ------------------------------------------------------------
  { name: 'skip', steps: [
    { file: 'skip-hint', clip: '#skip', pad: 120,
      setup: `window.__scene('opening'); window.__fast(1); await W.until(() => !document.getElementById('skip').hidden); await W.sleep(500);`,
      ids: ['other.skip.desk'] },
  ] },
  { name: 'messtags', steps: [
    { file: 'messtags', clip: '#messtags', pad: 80,
      setup: `window.__scene('messtags'); window.__fast(1); await W.until(() => [...document.querySelectorAll('.messtag')].every(e => !e.hidden)); await W.sleep(500);`,
      ids: ['other.messtag.muck', 'other.messtag.poop'] },
  ] },
  { name: 'raise', steps: [
    { file: 'button-build-the-bench', clip: '#raise', pad: 120,
      setup: `window.__scene('call'); window.__fast(1); await W.until(() => !document.getElementById('raise').hidden); await W.sleep(300);`,
      ids: ['other.raise'] },
  ] },
  { name: 'board-hidedone', steps: [
    { file: 'board-finished-shown', clip: 'full',
      setup: `window.__scene('bench'); window.__fast(1); await W.sleep(600);`,
      ids: ['other.hidedone.init', 'other.hidedone.hide', 'other.hidedone.show'] },
    { file: 'board-finished-hidden', clip: 'full',
      setup: `document.getElementById('hidedone').click(); await W.sleep(400);`,
      ids: ['other.hidedone.show', 'other.hidedone.hide'] },
  ] },
  { name: 'queue', steps: [
    { file: 'queue-card', clip: '#topleft', pad: 60,
      setup: `window.__reset(); window.__crew(2, 1); window.__grant({ dust: 90000 }); window.__fast(1);
              window.__buy('unlockshack'); window.__buy('house'); window.__buy('house'); window.__fast(1);
              await W.until(() => /queued/.test(document.getElementById('queue').textContent)); await W.sleep(300);`,
      hover: `const b = [...document.querySelectorAll('#queue button:not([disabled])')].pop(); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };`,
      ids: ['other.queue.site.yard', 'other.queue.queued'],
      note: { 'other.queue.site.yard': 'the house line hovered: the tip names the site it is built at',
              'other.queue.queued': 'the shack at the front of its line with nobody at it' } },
  ] },
  { name: 'queue-sphere', steps: [
    { file: 'queue-card-sphere', clip: '#topleft', pad: 60,
      setup: `window.__scene('sphere'); window.__grant({ sparks: 99999, dust: 1e7 }); window.__buy('tunesphere'); window.__buy('tunesphere'); window.__fast(1);
              await W.until(() => document.querySelector('#queue button:not([disabled])')); await W.sleep(300);`,
      hover: `const b = [...document.querySelectorAll('#queue button:not([disabled])')].pop(); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };`,
      ids: ['other.queue.site.sphere'], noteAll: "the sphere's rung queued twice, the line hovered" },
  ] },
  { name: 'corner', steps: [
    ...[['show', 'other.corner.fade'], ['fade', 'other.corner.hide'], ['hide', 'other.corner.show']].map(([now, id]) => (
      { file: 'corner-crew-' + now, clip: '#corner', pad: 90,
        setup: `${now === 'show' ? YARD : ''} (await M('prefs')).setPref('crew', '${now}'); window.__fast(0.1); await W.frames(2);`,
        hover: `const r = document.getElementById('crewfade').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };`,
        after: `const b = document.getElementById('crewfade'); b.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' })); b.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));`,
        ids: [id], noteAll: 'the crew switch in the top-right corner, hovered: the note says what a press does next' })),
    { file: 'corner-fullscreen', clip: '#corner', pad: 90,
      setup: `(await M('prefs')).setPref('crew', 'show'); await W.frames(2);`,
      ids: ['other.fullscreen.title.off'], noteAll: 'a native title tooltip, which a headless shot does not draw' },
    { file: 'corner-fullscreen-on', clip: '#corner', pad: 90,
      setup: `Object.defineProperty(document, 'fullscreenElement', { get: () => document.documentElement, configurable: true }); document.dispatchEvent(new Event('fullscreenchange')); await W.frames(3);`,
      ids: ['other.fullscreen.title.on'], noteAll: 'the page told it is in fullscreen; a native title tooltip, which a headless shot does not draw' },
  ] },
  { name: 'corner-way', steps: [
    { file: 'corner-way-down', clip: '#corner', pad: 90,
      setup: `window.__scene('portal'); window.__fast(0.5); await W.until(() => !document.getElementById('way').hidden);`,
      hover: `const r = document.getElementById('way').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };`,
      ids: ['other.corner.down'] },
  ] },
  { name: 'corner-way-up', steps: [
    { file: 'corner-way-up', clip: '#corner', pad: 90,
      setup: `window.__scene('deep-portal'); window.__fast(0.5); await W.until(() => !document.getElementById('way').hidden);`,
      hover: `const r = document.getElementById('way').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };`,
      ids: ['other.corner.up'] },
  ] },
  { name: 'fullscreen-on', steps: [
    { file: 'sheet-settings-fullscreen-on', clip: '#held',
      setup: `${YARD} Object.defineProperty(document, 'fullscreenElement', { get: () => document.documentElement, configurable: true });
              document.dispatchEvent(new Event('fullscreenchange')); ${HOLD} ${PANE('settings')}`,
      ids: ['set.fullscreen.on', 'other.fullscreen.title.on'],
      noteAll: "the page told it is in fullscreen (a headless page cannot be); the corner button's 'leave fullscreen' is its native title, not drawn" },
  ] },
  { name: 'windows', steps: [
    { file: 'window-books', clip: '#modal', pad: 40,
      setup: `window.__scene('booksall'); window.__fast(0.5); await W.until(() => !document.getElementById('modal').hidden); await W.sleep(500);`,
      ids: ['modal.books', 'modal.close.aria'] },
    { file: 'window-crew', clip: '#modal', pad: 40,
      setup: `window.__window('crew'); await W.sleep(500);`,
      ids: ['modal.crew', 'modal.close.aria'] },
  ] },

  // --- the index: every entry, picked in turn --------------------------------------------
  ...INDEX_SURFACES,

  // --- a phone (390 x 844) ---------------------------------------------------------------
  { name: 'phone', phone: true, before: `Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => false }); Object.defineProperty(Document.prototype, 'webkitFullscreenEnabled', { get: () => false });`, steps: [
    { file: 'phone-yard-pause', clip: 'full',
      setup: `window.__coarse(true); ${YARD} await W.sleep(300);`,
      ids: ['other.pause.aria'], noteAll: 'the pause square in the corner, phone only' },
    { file: 'phone-settings-nofullscreen', clip: 'full',
      setup: `${HOLD} ${PANE('settings')}`,
      ids: ['set.fullscreen.note'], noteAll: 'where the page cannot go fullscreen (an iPhone): fullscreen reported unavailable for the shot' },
    { file: 'phone-skip-hint', clip: 'full',
      setup: `(await M('input')).hold(false); window.__scene('opening'); window.__fast(1); await W.until(() => !document.getElementById('skip').hidden); await W.sleep(500);`,
      ids: ['other.skip.touch'] },
    { file: 'phone-index-entry', clip: 'full',
      setup: `window.__scene('indexphoneentry'); await W.sleep(600);`,
      ids: ['held.index.entryback', 'held.index.word'] },
  ] },
];

// Why a string has no shot, for the ones the surfaces cannot show.
export const REASONS = {
  'cloud.said.taken': { note: 'never on screen: take it reads the cloud\'s yard back and turns the held sheet to its front in the same press (settings.js tookCloud), so the section that would say "taken" is already hidden; see sheet-saves-cloud-behind.png for the button' , shot: 'sheet-saves-cloud-behind.png' },
  'title.doctitle': { note: 'the browser tab title of index.html ("Pebble Pit"), outside the page, so no page shot shows it' },
  'play.doctitle': { note: 'the browser tab title of play.html, outside the page, so no page shot shows it; note it still reads "Boulder Clicker" while the landing page says "Pebble Pit"' },
  'other.hidedone.init': { stale: true, note: 'the HTML\'s first text, but board.js (sayHideDone, run by the frame from boot) overwrites it with "hide finished" before any board opens, so a player never sees it' },
  'other.queue.site.deep': { stale: true, note: 'no row is built at the "deep" site any more: the deep\'s stations build at their own site (deep/party.js) and pods at "pods", so the queue card never names "the deep"' },
  'other.queue.site.lab': { stale: true, note: 'the lab is gone (works.js SITE_JOB: "when there was a lab"); no row builds there, so the queue card never names it' },
};
