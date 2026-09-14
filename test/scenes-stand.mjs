// Every scene under the given parts stands a yard up in the node one without
// throwing. Shared by the scenes-stand-*.test.mjs files, which each take a few
// parts: a scene is a real yard set up from nothing, four to seven seconds
// each, and one file of all of them would be the slowest thing in the tier by
// a distance.
//
// A board is DOM and the node yard has none, so opening one is a no-op here;
// what is being checked is that the setup under it stands. The scenes marked
// `page` want a real pointer, a button, a frame or a field the node snapshot
// has not got, and are the shot tool's.

import { yard, group, ok, run, reloadCheck } from './helpers.mjs';
import { SCENES } from '../src/scenes.js';

const S = yard.S;

export function standing(parts) {
  group(`every scene about ${parts.join(', ')} stands a yard up`, async () => {
    window.__board = () => {};
    const fell = [];
    for (const [name, sc] of Object.entries(SCENES)) {
      if (sc.page || !parts.includes(sc.about)) continue;
      try {
        sc.run();
        run(1);
        if (!(S.boulderNo >= 1)) fell.push(`${name}: no yard`);
        // ...and survives a refresh a second in, and a second after. Every
        // part of the game has a scene, so every part of the game has a
        // reload check, without anybody writing one.
        reloadCheck();
        run(1);
      } catch (e) {
        fell.push(`${name}: ${e.message}`);
      }
    }
    window.__crew(0, 0);
    return [ok(fell.length === 0, 'every scene stands', fell.join('; '))];
  });
}
