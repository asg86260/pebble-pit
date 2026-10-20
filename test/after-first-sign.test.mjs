// Act 3's first sign, followed (config, AFTER_SIGN_BEAT; actbeats.js,
// 'first-sign'): the beat plays once per save, from the first sign made to
// the first soul it wins walking back, and a reload in the middle of it
// plays it on to its end rather than losing it or playing it twice. The
// stations the workshop needs are the setup this check is not about; the
// posts that make and carry the sign are bought on their rows.
import { group, ok, run, yard } from './helpers.mjs';
import { RIM_PIECES, AFTER_SIGN_BEAT } from '../src/config.js';
import { beatDone, beatRunning } from '../src/beats.js';
import { actPhase } from '../src/actbeats.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const read = () => window.__afterRead();

group('the first sign is followed once, from the workshop to the soul it wins, across a reload', async () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 200000, spores: 40000, shards: 40000, sparks: 2000 });
  run(1);
  // Members in the camp for the two posts: souls inked full walk out to it.
  window.__afterCrowd((i, v) => (i < 6 ? RIM_PIECES : v));
  for (let s = 0; s < 120 && !(read().walking === 0 && read().camp >= 6); s++) run(1);
  window.__afterGrant({ rebel: 5000, timber: 60 });
  S.after.built.push('mill', 'workshop');
  const posts = ['joiner', 'carrier'].map(j => window.__buy(`after-post-${j}`));
  // Played to its end, reloaded once while it follows the carrier.
  let plays = 0, was = false, reloadedIn = null, resumed = false;
  for (let k = 0; k < 4 * 1500 && !beatDone('first-sign'); k++) {
    run(0.25);
    const on = beatRunning('first-sign');
    if (on && !was) plays++;
    if (on && reloadedIn != null && !resumed) resumed = true;
    was = on;
    if (on && reloadedIn == null && actPhase() === 1) { reloadedIn = actPhase(); window.__reload(); was = false; }
  }
  const done = beatDone('first-sign'), planted = S.after.signs.length;
  // Never again in the save: a minute on, it has not come back.
  let again = false;
  for (let k = 0; k < 240; k++) { run(0.25); if (beatRunning('first-sign')) again = true; }
  const entries = S.beatsDone.filter(k => k === 'first-sign').length;
  window.__actsOn(null);
  return [
    ok(AFTER_SIGN_BEAT === 1, 'the beat is on (config, AFTER_SIGN_BEAT)'),
    ok(posts.every(Boolean), 'the joiner and the carrier are posted through their rows', JSON.stringify(posts)),
    ok(reloadedIn === 1 && resumed, 'reloaded while it followed the carrier, it played on', `phase ${reloadedIn} resumed ${resumed}`),
    ok(done && planted >= 1, 'it played to its end, the sign planted', `done ${done} signs ${planted}`),
    ok(entries === 1 && !again && plays <= 2, 'once per save: done once, never again', `entries ${entries} again ${again} starts ${plays}`)
  ];
});
