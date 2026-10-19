// The cutscene bench (cutscenes.html, src/cutbench/): the page loads, lists its
// rows, records house-fall for two seconds, and shows the frames on the
// timeline. Run in the bench itself (`GAME=http://localhost:<port>/cutscenes.html
// node tools/headless.mjs --only cutbench`, where main.js answers `__test`) or
// from the game's suite, where the group opens the bench in a frame.
// Self-contained on purpose: the bench page loads none of the game's kit.

import { runChecks, DT } from '../cutbench/checks.js';

const ok = (cond, what, detail = '') => cond ? { pass: true, what } : { pass: false, what, detail };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function bench() {
  if (window.__cutbench) return { cb: window.__cutbench, doc: document, done() {} };
  const f = document.createElement('iframe');
  f.src = './cutscenes.html';
  f.style.cssText = 'position:fixed;left:0;top:0;width:1100px;height:700px;border:0;opacity:0;pointer-events:none;z-index:-1';
  document.body.appendChild(f);
  const t0 = performance.now();
  while (!f.contentWindow?.__cutbench && performance.now() - t0 < 20000) await sleep(50);
  return { cb: f.contentWindow.__cutbench, doc: f.contentDocument, done: () => f.remove() };
}

const still = (o = {}) => ({ camX: 0, camY: 0, viewW: 960, viewH: 540, zoom: 6, zoomShow: 6, bands: 48,
                             hush: 1, beat: 'x', gliding: false, frame: null, ...o });

export const TESTS = [
  ['cutbench: the page lists the rows, records house-fall for two seconds, and shows the frames on the timeline', async () => {
    const { cb, doc, done } = await bench();
    try {
      if (!cb) return [ok(false, 'the bench page loads')];
      await cb.ready();
      const rows = cb.rows();
      const keys = rows.map(r => r.key);
      const out = [
        ok(['act3-intro', 'house-fall', 'finale', 'snatch', 'opening', 'first-trip', 'tear', 'drown', 'first-muck']
          .every(k => keys.includes(k)), 'the rows are listed', keys.join(',')),
        ok(doc.querySelectorAll('#rows .row').length === rows.length, 'and each is a button in the list'),
      ];
      const hf = rows.find(r => r.key === 'house-fall');
      if (!hf || hf.grey) return [...out, ok(false, 'house-fall can be stood up', hf && hf.grey)];
      const good = await cb.record('house-fall', { maxS: 2 });
      const n = cb.frames().length;
      out.push(ok(good && n >= 20 && n <= 22, 'two seconds record about twenty-one frames', `${n}`));
      const view = doc.getElementById('view');
      out.push(ok(!view.hidden && view.width > 0, 'the recorded picture is up'));
      const track = doc.getElementById('track');
      out.push(ok(track.width > 0 && cb.index() === 0, 'the timeline is drawn with the playhead at the first frame'));
      cb.seek(10);
      out.push(ok(cb.index() === 10 && /frame 11\/\d+/.test(doc.getElementById('readout').textContent),
        'scrubbing moves the playhead and the readout'));
      const px = (() => {
        const d = doc.getElementById('track').getContext('2d').getImageData(0, 0, track.width, track.height).data;
        for (let i = 3; i < d.length; i += 4) if (d[i]) return true;
        return false;
      })();
      out.push(ok(px, 'the timeline has ink on it'));
      return out;
    } finally { done(); }
  }],

  ['cutbench: the checks flag a zoom step, a jump, a box outside the window and a missing band, and nothing else', async () => {
    const f = runChecks([
      still(), still(),
      still({ zoom: 5, zoomShow: 5 }),                                 // a zoom step in a held frame
      still({ zoom: 5, zoomShow: 4.5, gliding: true }),                // a glide may move the zoom
      still({ camX: 5000, zoom: 5, zoomShow: 4.5, gliding: true }),    // and the camera
      still({ camX: 5000, frame: { x: 0, y: 0, w: 100, h: 100 } }),    // box outside, zoom back
      still({ camX: 5000, hush: 0.5 }),                                // a band dipping mid-shot
      still({ camX: 5000 }),
    ]);
    const ramp = runChecks([still({ hush: 0.3 }), still(), still(), still({ hush: 0.4 })]);
    return [
      ok(f[1].length === 0, 'a still frame is clean'),
      ok(f[2].includes('zoom'), 'a zoom step while not gliding is red'),
      ok(!f[3].includes('zoom'), 'a zoom change in a glide is not'),
      ok(!f[4].includes('pan'), 'a pan in a glide is not'),
      ok(f[5].includes('box'), 'a box outside the window is red'),
      ok(f[6].includes('band') && DT === 0.1, 'a band dipping while the shot holds is red'),
      ok(!ramp[0].includes('band') && !ramp[3].includes('band'), 'the bands easing in and out at the ends are not'),
    ];
  }],
];
