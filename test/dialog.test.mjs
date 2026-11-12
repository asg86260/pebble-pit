// The story's dialog (dialog.js; DESIGN.md, "A dialog system"): God's line at
// the throne, reached the way a player reaches it -- the go-on card over the
// house pressed (`sayGoOn`, what its click calls), the house falling, the
// souls rising -- waits for a click (`__goOnLine`, what input.js's click and
// Enter call) while the yard and the act go on under it; read, it is read for
// good, a reload taken straight after included; and the held space bar reads
// every line at once.
import { group, ok, run, runUntil, reloadCheck, yard } from './helpers.mjs';

const S = yard.S;
const { ACT_GOON_WAIT_S, ACT_GOON_FADE_S, SKIP_HOLD_MS, DIALOG_FADE_S } = await import('../src/config.js');
const { sayGoOn, goOnAlpha } = await import('../src/actbeats.js');
const { beatDone } = await import('../src/beats.js');

const waiting = () => { const l = window.__line(); return l && l.out == null ? l : null; };

// Act 3 from the card over the house to God's first line waiting.
function toGodsLine() {
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('home');
  runUntil(() => goOnAlpha() >= 1, 4 * (ACT_GOON_WAIT_S + ACT_GOON_FADE_S));
  const said = sayGoOn();
  const up = runUntil(() => !!waiting(), 240);
  return { said, up };
}

group('God\'s line waits for a click with the act going on under it, and is read once, a reload after included', () => {
  const { said, up } = toGodsLine();
  const line = waiting();
  const at = { beat: S.beat.camera, id: line && line.id, who: line && line.who };
  // Ten seconds unanswered: the line still up, the beat still on it, and the
  // act's clock and its crowd moving under it (two reloads on the way, the
  // harness's every five seconds: the line comes back up, unread).
  const t0 = S.after.t;
  run(10);
  const still = { waiting: !!waiting(), beat: S.beat.camera, dt: S.after.t - t0, heard: S.heard.includes('act-meet-god-1') };
  // A click: read now, and saved so.
  const went = window.__goOnLine();
  const read = S.heard.includes('act-meet-god-1');
  const again = window.__goOnLine();                 // a second click has no line to go on from
  // Read back at once, the line mid-fade: it never comes up again.
  reloadCheck();
  let seenAgain = false;
  const done = runUntil(() => { if (waiting() && waiting().id === 'act-meet-god-1') seenAgain = true; window.__goOnLine(); return beatDone('meet-god'); }, 60);
  window.__actsOn(null);
  return [
    ok(said && up, 'the card pressed, the fall and the rise played, God\'s line comes up', `${said} ${up}`),
    ok(at.beat === 'meet-god' && at.id === 'act-meet-god-1' && at.who === 'god', 'it is God\'s, at the throne, in the meeting', JSON.stringify(at)),
    ok(still.waiting && still.beat === 'meet-god' && !still.heard, 'unanswered it waits: ten seconds on, still up and unread', JSON.stringify(still)),
    ok(still.dt >= 9.5, 'and nothing waits with it: act 3\'s clock ran the whole ten seconds', JSON.stringify(still)),
    ok(went && read && !again, 'a click goes on from it, and it is read at once; a second click finds no line', `${went} ${read} ${again}`),
    ok(done && !seenAgain, 'read, it never comes up again, a reload straight after included, and the meeting ends', `${done} ${seenAgain} ${S.beatsDone.join(' ')}`)
  ];
});

group('the held space bar reads every line at once and lets the beat go on', () => {
  toGodsLine();
  const up = !!waiting();
  window.__holdSkip(true);
  run(SKIP_HOLD_MS / 1000 + 0.2);
  window.__holdSkip(false);
  const read = S.heard.includes('act-meet-god-1'), gone = !waiting();
  const done = runUntil(() => beatDone('meet-god'), DIALOG_FADE_S + 3);
  window.__actsOn(null);
  return [
    ok(up, 'God\'s line is up', String(up)),
    ok(read && gone, 'the hold reads it and takes it down', `${read} ${gone}`),
    ok(done, 'and the meeting ends without another press', S.beatsDone.join(' '))
  ];
});
