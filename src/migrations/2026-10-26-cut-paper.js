// Act 3 is one chain since 2026-10-26 (DESIGN.md, "Act 3's goods are blocks,
// and a unit is followed through the saw mill", "Saves"): paper, posters, the
// chipper, the paper mill and the press are cut. A save from before is read
// here, on the raw object, so the act's reader (after/index.js) reads only
// today's shape: paper and posters dropped, the chipper's logs laid on the
// saw mill's pile, the three stations no longer built or going up, their
// upgrades dropped, their bodies stood down to idle members, and the seats
// bought on their jobs carried to the saw mill's, the larger of the two, so
// nothing paid for is lost (the fold in 2026-10-26-after-jobs.js).
import { AFTER_SEAT_BILLS } from '../config.js';
import { seatKey as seat } from '../after/levels.js';

const CUT = ['chipper', 'papermill', 'press'];
const CUT_JOBS = ['feeder', 'pulper', 'printer', 'paster'];
const CUT_UPS = ['after-drum', 'after-spout', 'after-vat', 'after-dry', 'after-stack', 'after-posterreach'];
const CUT_LOADS = ['posters', 'sheet'];
const obj = v => v && typeof v === 'object' && !Array.isArray(v);

export default {
  since: '2026-10-26',
  v: 29,
  says: 'act 3\'s chipper, paper mill and press are cut: their logs go to the saw mill, their seats to the sawyer, paper and posters are gone',
  apply(s) {
    const a = s.after;
    if (!obj(a)) return;
    if (obj(a.stock)) {
      a.stock.logs = (+a.stock.logs || 0) + (+a.stock.chiplogs || 0);
      delete a.stock.chiplogs; delete a.stock.paper; delete a.stock.posters;
    }
    delete a.posters;
    if (Array.isArray(a.built)) a.built = a.built.filter(k => !CUT.includes(k));
    for (const m of [a.raising, a.workAt]) if (obj(m)) for (const k of CUT) delete m[k];
    if (obj(a.ups)) {
      const saw = seat('sawyer');
      for (const job of CUT_JOBS) {
        const n = a.ups[seat(job)];
        if (n != null) { a.ups[saw] = Math.min(AFTER_SEAT_BILLS.length, Math.max(a.ups[saw] || 0, n)); delete a.ups[seat(job)]; }
      }
      for (const k of CUT_UPS) delete a.ups[k];
    }
    if (obj(a.upAt)) for (const k of CUT_UPS) delete a.upAt[k];
    if (obj(a.crew)) for (const job of CUT_JOBS) delete a.crew[job];
    for (const b of Array.isArray(a.bodies) ? a.bodies : []) {
      if (!obj(b)) continue;
      if (CUT_JOBS.includes(b.job)) Object.assign(b, { job: null, on: false, at: null, target: null, out: false, t: 0, pick: false });
      if (CUT_JOBS.includes(b.errand)) Object.assign(b, { errand: null, target: null, pick: false });
      if (CUT.includes(b.at)) b.at = null;
      if (CUT.includes(b.target)) b.target = null;
      if (CUT_LOADS.includes(b.load)) Object.assign(b, { load: null, carry: 0, n: 0, target: null });
    }
    if (Array.isArray(a.groundLogs)) a.groundLogs = a.groundLogs.filter(q => !obj(q) || q.kind !== 'sheet');
    if (obj(a.hand)) {
      if (a.hand.kind === 'sheet') a.hand = null;
      else if (a.hand.from === 'chiplogs') a.hand.from = 'logs';
    }
    if (obj(a.speech)) {
      if (obj(a.speech.target) && a.speech.target.kind === 'poster') a.speech.target = null;
      if (obj(a.speech.burnt) && a.speech.burnt.kind === 'poster') a.speech.burnt = null;
    }
  }
};
