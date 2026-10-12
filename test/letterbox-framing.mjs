// What every cutscene is about is framed inside the window between the
// letterbox's bands (cutscene.js, `frameHeight`): the owner's finale opened in
// the deep with the stations and the pair half under the foot band, because
// the deep's floor was pinned to the foot of the glass and the bands were
// drawn over it. Shared by the letterbox-framing-*.test.mjs files, which each
// stand the scenes up at a window or two.
//
// Each scene is one of src/scenes.js's setups, run on a frame at a time until
// it has let go; on every frame it holds the yard with the bands all the way
// in and the camera arrived -- the glide done, the move between the bands
// come all the way -- the box `subject()` names is asked to lie wholly between
// the bands, and across the window. A holding scene that names nothing is a
// failure of its own: the window cannot frame what nobody has named.

import { yard, group, ok, SEED } from './helpers.mjs';
import { CELL } from '../src/config.js';
import { SCENES } from '../src/scenes.js';
import { subject, bandCells, liftArrived, holding } from '../src/cutscene.js';
import { gliding } from '../src/view.js';

const S = yard.S;

// Every cutscene the game has, from its start: the opening, the reunion, the
// first muck, the four shields' answers (the dome's with the rescue under
// it), the tearing and the drowning, the snatch, the first trip down, and the
// kill run on through every phase of the finale to the sunset.
export const CUTSCENES = ['opening', 'reunion', 'firstmuck', 'props>', 'net>', 'arch>', 'dome>', 'rescue',
                          'tear>', 'drown>', 'snatch-portal', 'abyss-intro', 'finale-kill'];
// How long any one is followed, in game seconds: past the longest of them.
const MOST_S = 150;
// A camera that has not moved for this many frames has stopped, rather than
// being at the slow end of an ease.
const STILL_FRAMES = 15;

export const WINDOWS = {
  desk: { W: 800, H: 600, coarse: false },
  big: { W: 2000, H: 1150, coarse: false },          // the owner's window
  // Stood up, a phone is narrower than the opening's fling: the survivor
  // lands outside a frame held on the rock, which is a framing across the
  // window and phone-view.test.mjs's to own. Here it is said, not failed.
  phone: { W: 390, H: 844, coarse: true, narrow: true },
  'phone across': { W: 844, H: 390, coarse: true },
};

function windowOf(win) {
  document.documentElement.clientWidth = win.W;
  document.documentElement.clientHeight = win.H;
  globalThis.innerWidth = win.W;
  globalThis.innerHeight = win.H;
  window.__coarse(win.coarse);
  window.__seed(SEED);
}

// Which part of a scene a frame is, for a failure's words.
const moment = () => [S.beat.yard, S.beat.camera, S.finale?.phase, S.abyss?.phase, S.snatch?.phase]
  .filter(Boolean).join('/');

// The subject on the glass, in screen pixels, against the bands' inner edges.
function offBy(box) {
  const band = bandCells() * CELL;
  const x = (box.x - S.camX) * S.zoom, y = (box.y - S.camY) * S.zoom;
  const w = box.w * S.zoom, h = box.h * S.zoom;
  return {
    up: Math.max(0, band - y), down: Math.max(0, y + h - (S.H - band)),
    across: Math.max(0, -x, x + w - S.W),
    at: `x ${x.toFixed(0)}..${(x + w).toFixed(0)} y ${y.toFixed(0)}..${(y + h).toFixed(0)} in ${S.W}x${S.H}, bands ${band}`,
  };
}

export function framing(names) {
  for (const name of names) {
    const win = WINDOWS[name];
    group(`at a ${name} window, every cutscene frames what it is about between the bands`, async () => {
      windowOf(win);
      window.__board = () => {};
      const checks = [];
      for (const scene of CUTSCENES) {
        SCENES[scene].run();
        window.__holdShot(0);                  // the shot tool's hold is wall clock
        let framed = 0, unnamed = 0, held = 0, worst = null, worstBy = 0, wide = null, wideBy = 0, camX = null, stood = 0;
        const tooWide = new Set(), lately = [];
        for (let f = 0; f < MOST_S * 60; f++) {
          window.__fast(1 / 60);
          // Across is asked of the frame STILL_FRAMES back, once the camera
          // has stood still for that long on either side of it: a frame the
          // subject changed hands on, the camera about to set off after it,
          // is a glide's start and not a framing.
          stood = camX != null && Math.abs(S.camX - camX) < 0.5 ? stood + 1 : 0;
          camX = S.camX;
          const back = lately.length > STILL_FRAMES ? lately.shift() : null;
          if (back && stood >= STILL_FRAMES * 2 && back.o.across > wideBy) { wideBy = back.o.across; wide = back.at; }
          lately.push(null);
          if (!holding()) { if (held && S.hush <= 0) break; continue; }
          held++;
          if (S.hush < 1 || gliding()) continue;
          const box = subject();
          if (!box) { unnamed++; continue; }
          if (!liftArrived() || (S.shot && !S.shot.out && S.shot.name !== 'abyss' && !S.shot.settled)) continue;
          framed++;
          const o = offBy(box);
          const by = Math.max(o.up, o.down);
          if (by > worstBy) { worstBy = by; worst = `${moment()}: ${o.at}`; }
          // Across, once the camera stands still on it (above): a glide or a
          // follow is on its way to it. A box wider than the window is
          // reported, not failed -- no height can help it.
          if (box.w * S.zoom > S.W) tooWide.add(moment());
          else lately[lately.length - 1] = { o, at: `${moment()}: ${o.at}` };
        }
        checks.push(ok(held > 0 && framed > 0, `${scene} holds and frames its subject`, `${held} held, ${framed} framed`));
        checks.push(ok(unnamed === 0, `${scene} names its subject while it holds`, `${unnamed} frames with none`));
        checks.push(ok(worstBy === 0, `${scene}'s subject is between the bands`, worst || ''));
        if (process.env.FRAMING_SAY && tooWide.size) console.log(`${name} ${scene}: wider than the window at ${[...tooWide].join(', ')}`);
        if (win.narrow) { if (process.env.FRAMING_SAY && wide) console.log(`${name} ${scene}: off across at ${wide}`); continue; }
        checks.push(ok(wideBy === 0, `${scene}'s subject is across the window`, wide || ''));
      }
      return checks;
    });
  }
}
