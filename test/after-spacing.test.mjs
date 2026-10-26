// Act 3's members keep their own spots (polish bar, own spots; the yard's
// `elbowIdle`): bodies standing about the camp -- at the podium, at a
// station's door, on an errand -- are never stood inside one another, and
// the printer does not leave an unattended press to walk its posters out
// while another hand could (DESIGN.md, "Act 3: one job a station", the
// printer "takes its own output out when a full load is waiting").
// The yard is the `after-crowd` scene, the setup these checks are not about.
import { group, ok, run, yard } from './helpers.mjs';
import { SCENES } from '../src/scenes.js';
import { P } from '../src/config.js';

const S = yard.S;
const WIDE = 3 * P;   // a body is three cells wide (after/bodies.js, `box`)

// Pairs of members in the work state stood closer than a body is wide, among
// the standing ones (`prev`: where each was a sample ago); walkers passing one
// another on the floor are no stack, so only a body that stayed put counts.
export function overlaps(prev) {
  const b = S.after.bodies.filter(w => w.state === 'work' && w.pair == null && prev[w.id] != null && Math.abs(prev[w.id] - w.x) < 0.5);
  let n = 0;
  for (let i = 0; i < b.length; i++)
    for (let j = i + 1; j < b.length; j++)
      if (Math.abs(b[i].x - b[j].x) < WIDE && Math.abs(b[i].y - b[j].y) < P) n++;
  for (const w of S.after.bodies) prev[w.id] = w.x;
  return n;
}

group('members of the crowd scene do not stand inside one another', async () => {
  window.__board = () => {}; window.__holdShot = () => {};
  SCENES['after-crowd'].run();
  const prev = {};
  let sum = 0, peak = 0, frames = 0, away = 0, press = 0;
  for (let s = 0; s < 120 * 4; s++) {
    run(0.25);
    const n = overlaps(prev);
    sum += n; peak = Math.max(peak, n); frames++;
    const pr = S.after.bodies.find(w => w.job === 'printer');
    if (pr && pr.out) away++;
    press++;
  }
  const mean = sum / frames;
  console.log(`overlap mean ${mean.toFixed(2)} peak ${peak}; printer out ${away}/${press}`);
  return [
    ok(mean < 0.5, 'on average under half a pair of standing members stacked', mean.toFixed(2)),
    ok(peak <= 3, 'never more than a few pairs at once', String(peak)),
    ok(away === 0, 'the printer stays at its press while other hands are free', `${away}/${press}`)
  ];
});
