// The one list of scenes (src/scenes.js): every scene names a part the sheet
// has a heading for, every part has at least one scene under it, and each has
// a run and a sentence. Whether each scene actually stands a yard up is
// test/scenes-stand-*.test.mjs, split by part because every scene is a real
// yard set up from nothing and the whole list is seven minutes of them. The
// sheet itself -- the block, the press, the kept save -- is DOM and is checked
// in the browser tier (src/selftest/scenes.js).

import { group, ok } from './helpers.mjs';
import { ABOUT, SCENES, byPart } from '../src/scenes.js';

group('every scene is about a part the sheet names, and every part has a scene', async () => {
  const names = Object.keys(SCENES);
  const orphans = names.filter(k => !ABOUT.includes(SCENES[k].about));
  const empty = byPart().filter(([, ks]) => ks.length === 0).map(([about]) => about);
  const dumb = names.filter(k => typeof SCENES[k].run !== 'function' || !SCENES[k].say);
  return [
    ok(names.length > 80, 'the list is the whole list', `${names.length}`),
    ok(orphans.length === 0, 'no scene is about a part that has no heading', orphans.join(', ')),
    ok(empty.length === 0, 'no heading stands over nothing', empty.join(', ')),
    ok(dumb.length === 0, 'every scene has a run and a sentence', dumb.join(', '))
  ];
});
