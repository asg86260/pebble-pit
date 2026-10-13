// D1, as far as the feedback worker uses it, over node's own SQLite: the
// cloud's stand-in (cloud/test/d1.mjs) over this worker's migrations, and a
// statement with RETURNING answered with its rows, as D1 answers it.
// `statements` counts every statement run, for the check that a refusal or a
// paused worker answers before it touches the database.

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The schema is the migrations wrangler applies, in the order it applies
// them, so the stand-in cannot drift from the database that is deployed.
const MIGRATIONS = fileURLToPath(new URL('../migrations/', import.meta.url));
const SCHEMA = readdirSync(MIGRATIONS).filter(f => f.endsWith('.sql')).sort()
  .map(f => readFileSync(join(MIGRATIONS, f), 'utf8')).join(';\n');

const plain = v => (v instanceof ArrayBuffer ? new Uint8Array(v) : v);
const rows = sql => /^\s*select/i.test(sql) || /\breturning\b/i.test(sql);

export function makeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  const counter = { statements: 0 };

  function statement(sql, args = []) {
    const exec = () => {
      counter.statements++;
      const st = db.prepare(sql);
      if (rows(sql)) return { results: st.all(...args).map(r => ({ ...r })), success: true, meta: { changes: 0 } };
      const r = st.run(...args);
      return { success: true, meta: { changes: Number(r.changes) } };
    };
    return {
      bind: (...a) => statement(sql, a.map(plain)),
      async first(col) {
        counter.statements++;
        const row = db.prepare(sql).get(...args);
        if (!row) return null;
        return col ? row[col] : { ...row };
      },
      async all() { return exec(); },
      async run() { return exec(); },
      _run: exec
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
