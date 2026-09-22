// The frame a rising place lands. A step rather than a draw; it sits in the
// painting order because the place it watches is drawn from here.

import { BUILD_SHAKE, HOUSE_CUBE } from '../config.js';
import { cubes as houseCubes } from '../house.js';
import { puff } from '../puff.js';
import { farmShed, quarryShed, shakeView } from '../world.js';
import { casino, lab, outhouse, filter, tower } from '../state.js';
import { rising as risingAt } from './rise.js';

// The frame a rising place lands: a puff over the middle of the roof and a
// knock on the view (`BUILD_SHAKE`). Watched here rather than from `stepWorks`,
// which has no idea where any of these places stand.
const RISE_PLACES = ['lab', 'tower', 'casino', 'filter', 'outhouse',
                     'quarry', 'farm', 'house'];
const wasRising = {};
export function stepRiseLandings() {
  for (const place of RISE_PLACES) {
    const rising = risingAt(place);
    if (wasRising[place] && !rising) {
      const rect = place === 'lab' ? lab
                 : place === 'tower' ? tower : place === 'casino' ? casino
                 : place === 'filter' ? filter : place === 'outhouse' ? outhouse
                 : place === 'quarry' ? quarryShed() : place === 'farm' ? farmShed()
                 : null;
      if (rect) { puff(rect.x + rect.w / 2, rect.y); shakeView(BUILD_SHAKE); }
      else {
        // The house: the room that just landed is the last one `cubes` hands
        // back now that `S.crew` has grown.
        const room = houseCubes()[houseCubes().length - 1];
        if (room) { puff(room.x + HOUSE_CUBE / 2, room.y); shakeView(BUILD_SHAKE); }
      }
    }
    wasRising[place] = rising;
  }
}
