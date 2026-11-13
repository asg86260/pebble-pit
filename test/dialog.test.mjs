// The story's dialog (dialog.js; DESIGN.md, "A dialog system"): God's line at
// the throne, reached the way a player reaches it -- the go-on card over the
// house pressed (`sayGoOn`, what its click calls), the house falling, the
// souls rising -- waits for a click (`__goOnLine`, what input.js's click and
// Enter call) while the yard and the act go on under it; read, it is read for
// good, a reload taken straight after included; and the held space bar reads
// every line at once.
import fs from 'node:fs';
import { group, ok, run, runUntil, reloadCheck, yard } from './helpers.mjs';

const S = yard.S;
const { ACT_GOON_WAIT_S, ACT_GOON_FADE_S, SKIP_HOLD_MS, DIALOG_FADE_S } = await import('../src/config.js');
const { sayGoOn, goOnAlpha } = await import('../src/actbeats.js');
const { beatDone } = await import('../src/beats.js');
const { lineRuns, lineTyping, lineLook, LINE_MARKS } = await import('../src/dialog.js');
const { BODIES } = await import('../src/actbeats.js');
const { forceMotion } = await import('../src/prefs.js');
const { msg } = await import('../src/lang.js');

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
  // A click on the line all in (a reload puts it up typing again): read now,
  // and saved so.
  runUntil(() => lineLook() && lineLook().full, 5);
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

// The owner's marks round words in God's lines (locales/en.ftl) come out of
// the words drawn, each run carrying its effect (dialog.js, `lineRuns`); `^`
// is drawn plain until the owner picks its effect; a line with none is one
// plain run, drawn as it always was.
group('a line\'s marks are taken out and give their words an effect; a line with none is one plain run', () => {
  const got = [1, 2, 3, 4, 5, 6].map(n => lineRuns(msg(`act-meet-god-${n}`)).map(r => [r.text, r.fx]));
  const want = [
    [['come, and be welcome', null]],
    [['to the afterlife, an ', null], ['eternal paradise', 'wave']],
    [['your ', null], ['eternal', 'wave'], [' paradise', null]],
    [['you\'ve worked so hard, all the way to the ', null], ['end', 'slow']],
    [['so ', null], ['work', 'shake'], [' for me now', null]],
    [['eternally', 'shake']]
  ];
  const each = Object.entries(LINE_MARKS).filter(([m]) => m !== '^')
    .map(([m, fx]) => [fx, lineRuns(`a ${m}word${m}.`).map(r => [r.text, r.fx])]);
  const eachOk = each.every(([fx, r]) => JSON.stringify(r) === JSON.stringify([['a ', null], ['word', fx], ['.', null]]));
  const plain = lineRuns('a line with no marks, plain');
  const marksLeft = got.flat().some(([t]) => /[*_^~]/.test(t));
  return [
    ok(JSON.stringify(got) === JSON.stringify(want), 'each of God\'s lines parses to its runs, the right effect on each', JSON.stringify(got)),
    ok(eachOk, 'every mark gives its word its own effect', JSON.stringify(each)),
    ok(!marksLeft, 'no mark is left in the words drawn', JSON.stringify(got)),
    ok(plain.length === 1 && plain[0].fx === null && plain[0].text === 'a line with no marks, plain', 'an unmarked line is one plain run', JSON.stringify(plain))
  ];
});

// A mark character used as itself is never taken for a mark: a mark opens
// only at a word's start and closes only at a word's end. Every message in
// the language file but the marked dialog lines reads through untouched, and
// a dialog line loses only its marks.
group('ordinary punctuation survives the marks: every message reads through untouched but for its marks', () => {
  const ftl = fs.readFileSync(new URL('../locales/en.ftl', import.meta.url), 'utf8').replace(/\r/g, '');
  const values = [...ftl.matchAll(/^([a-z][a-z0-9-]*) =(.*(?:\n[ \t]+.*)*)/gm)].map(m => [m[1], m[2].trim()]);
  const dialog = new Set(Object.values(BODIES).flat().flatMap(ph => (ph.lines || []).map(l => l.id)));
  const eaten = values.filter(([id, v]) => !dialog.has(id) && lineRuns(v).map(r => r.text).join('') !== v).map(([id]) => id);
  const lines = [...dialog].map(id => [id, msg(id)]);
  const punct = s => (s.match(/[.,!?;:'"()-]/g) || []).join('');
  const lost = lines.filter(([, v]) => {
    const p = lineRuns(v).map(r => r.text).join('');
    return p !== v.replace(/[*_^~=+%|#@]/g, '') || punct(p) !== punct(v);
  }).map(([id]) => id);
  const loose = 'so 5+3 = 8, 50% off | #1 @ home_page * and ~ a_b';
  const kept = lineRuns(loose);
  return [
    ok(values.length > 1000 && eaten.length === 0, 'no message outside the dialog loses a character', `${values.length} read; ${eaten.join(' ')}`),
    ok(lines.length >= 7 && lost.length === 0, 'every dialog line keeps all its words and punctuation, only the marks gone', `${lines.length} lines; ${lost.join(' ')}`),
    ok(kept.length === 1 && kept[0].text === loose && kept[0].fx === null, 'mark characters used as themselves are left as they are', JSON.stringify(kept))
  ];
});

// The typewriter: a line types in a letter at a time; a click while it types
// finishes it, the next goes on; under reduced motion it comes up whole.
group('a line types in; a click while it types finishes it and the next goes on; reduced motion shows it whole', () => {
  toGodsLine();
  const ty = lineTyping(msg('act-meet-god-1'));
  const early = { ...window.__line() }, look0 = lineLook();
  const typing = !look0.full && ty.end > 0.5 && ty.at.every((v, i) => i === 0 || v > ty.at[i - 1]);
  const first = window.__goOnLine();
  const finished = !!lineLook().full && !S.heard.includes('act-meet-god-1') && window.__line().out == null;
  const second = window.__goOnLine();
  const read = S.heard.includes('act-meet-god-1');
  // the next line, under reduced motion: whole as it comes up, one click reads it
  forceMotion(true);
  runUntil(() => window.__line() && window.__line().out == null && window.__line().id === 'act-meet-god-2', 10);
  const whole = !!lineLook().full;
  window.__goOnLine();
  const readAtOnce = S.heard.includes('act-meet-god-2');
  forceMotion(null);
  // let alone, a line is all in by its own end and waits there
  runUntil(() => window.__line() && window.__line().out == null && window.__line().id === 'act-meet-god-3', 10);
  run(lineTyping(msg('act-meet-god-3')).end + 0.1);
  const typedSelf = !!lineLook().full && window.__line().out == null;
  window.__actsOn(null);
  return [
    ok(early.id === 'act-meet-god-1' && typing, 'God\'s first line is typing in, a letter after a letter', JSON.stringify({ early, end: ty.end })),
    ok(first && finished, 'a click while it types finishes it, unread and still waiting', `${first} ${finished}`),
    ok(second && read, 'and the next click goes on from it', `${second} ${read}`),
    ok(whole && readAtOnce, 'under reduced motion a line is whole as it comes up, and one click reads it', `${whole} ${readAtOnce}`),
    ok(typedSelf, 'let alone, a line types all the way in and waits', String(typedSelf))
  ];
});
