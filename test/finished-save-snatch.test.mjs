// A player who finished the story before the second half shipped: a save from
// the field (the fixture crew-grows-on-load.json) with the sqwife out, the pit
// drowned and the ending's sheet put down, and nothing ever taken. With the
// half switched on, loading it has to play the snatch -- the save carries
// both facts and the sheet, so nothing else will ever start it -- and land the
// yard in the deep with its one hand.

import { readFileSync } from 'node:fs';
import { yard, group, ok, run, runUntil } from './helpers.mjs';

const S = yard.S;
const load = name => {
  localStorage.setItem('boulder-clicker/v4', readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
  yard.restore();
};

group('a save that already rescued the sqwife plays the snatch once the half is on', async () => {
  window.__serpentOn(true);
  try {
    load('crew-grows-on-load.json');
    const before = { rescued: S.rescued, drowned: S.drowned, ended: S.beatsDone.includes('ending'), snatched: !!S.snatched, crew: S.crew };
    const started = runUntil(() => S.beat.yard === 'snatch' || !!S.snatch, 10);
    const done = runUntil(() => S.beatsDone.includes('snatch'), 120);
    window.__reload();
    run(2);
    return [
      ok(before.rescued && before.drowned && before.ended && !before.snatched, 'the save is a finished story, nothing taken',
         JSON.stringify(before)),
      ok(started, 'the snatch starts within seconds of loading', `beat ${S.beat.yard}`),
      ok(done && S.snatched, 'it plays to its end and the serpent has him', `snatched ${S.snatched}`),
      ok(S.crew === before.crew - 1 && S.deepCrew === 1, 'the crew is one fewer, and she is the one hand in the deep', `${before.crew} -> ${S.crew}, deep ${S.deepCrew}`),
      ok(!S.snatch && S.beatsDone.includes('snatch'), 'and a reload does not play it again', `snatch ${JSON.stringify(S.snatch)}`)
    ];
  } finally { window.__serpentOn(null); }
});

group('the same save with the half off stays a finished story', async () => {
  window.__serpentOn(false);
  try {
    load('quarry-crossing.json');
    const crew = S.crew;
    run(20);
    return [ok(!S.snatch && !S.snatched && S.crew === crew, 'nothing comes up out of the water', `snatched ${S.snatched}, crew ${crew} -> ${S.crew}`)];
  } finally { window.__serpentOn(null); }
});
