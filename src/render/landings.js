// The frame a rising place lands. Extracted verbatim from render.js; behavior
// unchanged. Owns stepRiseLandings, which is a step rather than a draw and sits
// in the painting order because the place it watches is drawn from here.

import { BUILD_SHAKE, HOUSE_CUBE } from '../config.js';
import { cubes as houseCubes } from '../house.js';
import { puff } from '../puff.js';
import { farmShed, quarryShed, shakeView } from '../world.js';
import { S, casino, lab, outhouse, scrub, tower } from '../state.js';
import { rising as risingAt } from './rise.js';

// The frame a rising place lands, the yard feels it -- a puff over the middle
// of the roof and a knock on the view, half as hard as a rock coming down (see
// `BUILD_SHAKE`). Watched here rather than from `stepWorks` in works.js, which
// has no idea where any of these places actually stand: the drawing side draws
// every one of them and so is the one place that already knows.
const RISE_PLACES = ['lab', 'tower', 'casino', 'scrub', 'outhouse',
                     'quarry', 'farm', 'house'];
const wasRising = {};
export function stepRiseLandings() {
  for (const place of RISE_PLACES) {
    const rising = risingAt(place);
    if (wasRising[place] && !rising) {
      const rect = place === 'lab' ? lab
                 : place === 'tower' ? tower : place === 'casino' ? casino
                 : place === 'scrub' ? scrub : place === 'outhouse' ? outhouse
                 : place === 'quarry' ? quarryShed() : place === 'farm' ? farmShed()
                 : null;
      if (rect) { puff(rect.x + rect.w / 2, rect.y); shakeView(BUILD_SHAKE); }
      else {
        // The house: the room that just landed is the last one `cubes` hands
        // back now that `S.crew` has actually grown.
        const room = houseCubes()[houseCubes().length - 1];
        if (room) { puff(room.x + HOUSE_CUBE / 2, room.y); shakeView(BUILD_SHAKE); }
      }
    }
    wasRising[place] = rising;
  }
}
