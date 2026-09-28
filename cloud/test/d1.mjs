// D1, as far as the worker uses it, over node's own SQLite: the one stand-in
// both ends' checks run the real `handle` against (docs/wave-cloud.md,
// "Decided here" 3). `prepare(sql).bind(...).first/all/run`, and
// `batch([...])` in one transaction. A BLOB comes back a Uint8Array; the
// worker wraps whatever D1 hands it in `new Uint8Array(x)`, which takes an
// Array, an ArrayBuffer or a Uint8Array alike, so the difference cannot
// matter. `statements` counts every statement run, for the check that a
// paused worker answers before it touches the database.

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The schema is the migrations wrangler applies, read in the order it applies
// them, so the stand-in cannot drift from the database that is deployed.
const MIGRATIONS = fileURLToPath(new URL('../migrations/', import.meta.url));
const SCHEMA = readdirSync(MIGRATIONS).filter(f => f.endsWith('.sql')).sort()
  .map(f => readFileSync(join(MIGRATIONS, f), 'utf8')).join(';\n');

const plain = v => (v instanceof ArrayBuffer ? new Uint8Array(v) : v);

export function makeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  const counter = { statements: 0 };

  function statement(sql, args = []) {
    return {
      bind: (...a) => statement(sql, a.map(plain)),
      async first(col) {
        counter.statements++;
        const row = db.prepare(sql).get(...args);
        if (!row) return null;
        return col ? row[col] : { ...row };
      },
      async all() {
        counter.statements++;
        return { results: db.prepare(sql).all(...args).map(r => ({ ...r })), success: true };
      },
      async run() {
        counter.statements++;
        const r = db.prepare(sql).run(...args);
        return { success: true, meta: { changes: Number(r.changes) } };
      },
      // For batch: run synchronously inside the transaction.
      _run() {
        counter.statements++;
        const st = db.prepare(sql);
        if (/^\s*select/i.test(sql)) return { results: st.all(...args).map(r => ({ ...r })), success: true };
        const r = st.run(...args);
        return { success: true, meta: { changes: Number(r.changes) } };
      }
    };
  }

  const DB = {
    prepare: sql => statement(sql),
    async batch(list) {
      db.exec('BEGIN');
      try {
        const out = list.map(s => s._run());
        db.exec('COMMIT');
        return out;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    }
  };
  return { DB, counter, raw: db };
}
