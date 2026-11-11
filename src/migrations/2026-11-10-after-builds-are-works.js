// Act 3 builds through the yard's construction since 2026-11-10 (DESIGN.md,
// "Act 3 builds through the yard's construction"): a station bought is a
// work on the yard's works, `works['after-<station>']`, not a site of its own
// in `after.raising` raised in four bands off a pile of eight carried loads.
//
// Read without this, a station going up in an older save lost its
// `raising` (the act's reader drops keys its blank lacks), its build sign
// came back, and its bill was asked a second time. So each one not yet
// standing becomes a work as far along as its bands were laid -- the loads
// carried and not laid count for nothing -- and one whose bands were all
// laid stands. Its builders go back to the podium, any load in their arms
// is put down for good, as is any load the act's ground was to lay
// (`after.lay`); a load lying on the saved ground is dropped where the
// ground is read back (after/ground.js), since nothing makes one any more.
// A builder of the pair, from a save older still, leaves the list, as it
// did once it had climbed back up.
//
// Every number here is that day's, written down so that this file never has
// to change: a work's length is the yard's for a building standing alone,
// thirty worker-seconds (config/build.js, BUILD_CAP_S on 2026-11-10), and a
// station took four bands of two loads.
import { KINDS } from '../config.js';
import { AFTER_JOB } from '../jobs.js';

const OF = 30, BANDS = 4, LOADS = 8;
const obj = v => v && typeof v === 'object' && !Array.isArray(v);

export default {
  since: '2026-11-10',
  v: 38,
  says: 'act 3\'s stations are built on the yard\'s works: one half raised in bands is a work as far along, paid for once',
  apply(s) {
    const a = s.after;
    if (!obj(a)) return;
    const built = Array.isArray(a.built) ? a.built : (a.built = []);
    const works = obj(s.works) ? s.works : (s.works = {});
    let id = Object.values(works).flat().reduce((m, w) => Math.max(m, obj(w) && Number.isInteger(w.id) ? w.id : 0), 0);
    for (const [key, r] of Object.entries(obj(a.raising) ? a.raising : {})) {
      if (!obj(r) || built.includes(key)) continue;
      if ((+r.n || 0) >= BANDS) { built.push(key); continue; }
      const laid = Math.max(0, Math.min(LOADS, Math.floor(+r.laid || 0)));
      const site = `after-${key}`;
      (works[site] = Array.isArray(works[site]) ? works[site] : []).push({ key: `after-build-${key}`, done: OF * laid / LOADS, of: OF, at: null, id: ++id, bill: null });
    }
    delete a.raising;
    const load = KINDS.load ? new Set(Array.from({ length: KINDS.load.tones }, (_, i) => KINDS.load.first + i)) : new Set();
    if (Array.isArray(a.bodies)) {
      a.bodies = a.bodies.filter(b => !(obj(b) && b.job === AFTER_JOB.BUILD && b.pair != null));
      for (const b of a.bodies) {
        if (!obj(b)) continue;
        if (Array.isArray(b.load)) { b.load = b.load.filter(v => !load.has(v)); b.carry = b.load.length; }
        if (b.job !== AFTER_JOB.BUILD) continue;
        Object.assign(b, { job: null, on: false, site: null, workId: null, goal: null, phase: null, slot: null, t: 0, n: 0 });
        delete b.builds; delete b.side; delete b.born;
      }
    }
    if (Array.isArray(a.lay)) a.lay = a.lay.filter(item => !(obj(item) && item.kind === 'load'));
  }
};
