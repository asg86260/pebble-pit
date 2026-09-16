// The check every row on every board gets. See `shop-rows.mjs` for the table
// and why it exists; this is the walk over it.
//
// Each row is its own group from a fresh yard: reach it, buy it, throw the
// yard away, read the save back, and compare every board to what it said
// before. The comparison is of the boards rather than of a field, because a
// field is the mechanism and the boards are what the player sees -- a rung
// that comes back as a different number is a rung the player buys twice,
// whichever field it was kept in.

import { group, ok, yard, run } from './helpers.mjs';
import { ROWS } from './shop-rows.mjs';

const S = yard.S;

// What the boards say, row by row: whether it is drawn, the words it gives and
// the bill it asks. Together these are every fact about a row a player can
// read, so a save that lost any of them shows here.
const boards = () => Object.fromEntries(window.__rows().map(r =>
  [r.key, `${r.shown ? 'on' : 'off'} ${r.gain} ${JSON.stringify(r.bill)}`]));
const shown = key => !!window.__rows().find(r => r.key === key)?.shown;

// A cold reload: the save written, the yard reset to nothing, the save read.
// `__reload` is persist-then-restore in one process, and a field the save
// forgot survives that in memory, which is exactly the loss this is for.
const coldReload = () => {
  S.dirty = true;
  yard.persist();
  const raw = localStorage.getItem('boulder-clicker/v4');
  window.__reset();
  localStorage.setItem('boulder-clicker/v4', raw);
  yard.restore();
  window.__build();
};

export function cover(part) {
  for (const row of ROWS.filter(r => r.part === part)) {
    // A row with `reload: false` follows one particular pot across more than
    // five seconds (helpers.mjs, `group`); every other row runs under the
    // harness.
    group(`${row.key}: gated, bought and kept`, async () => {
      window.__reset();
      run(0.5);
      const out = [];
      if (!row.fresh) {
        out.push(ok(!shown(row.key), 'off the boards before its gate is met'));
      }
      row.reach?.(S, run);
      window.__build();
      run(0.5);
      out.push(ok(shown(row.key), 'on the boards once it is'));
      if (row.dial) return out;

      // The coins are the setup, never the subject: what is checked is that the
      // press fires and what it bought is kept, not that the yard can afford it.
      if (!row.purse) window.__grant({ dust: 1e9, shards: 1e7, spores: 1e7, cores: 1e5, sparks: 1e6 });
      const pressed = window.__buy(row.key);
      const bought = row.fired ? row.fired(S) : pressed;
      window.__finish();
      run(0.5);
      out.push(ok(bought, 'and it can be bought'));

      const before = boards();
      coldReload();
      run(0.5);
      const after = boards();
      const lost = Object.keys(before).filter(k => before[k] !== after[k]);
      out.push(ok(lost.length === 0, 'and every board reads the same after a cold reload',
                  lost.map(k => `${k}: ${before[k]} -> ${after[k]}`).join('; ')));
      return out;
    }, row.reload === false ? { reload: false } : undefined);
  }
}
