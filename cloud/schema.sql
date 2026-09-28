-- The cloud's whole database (docs/wave-cloud.md, "Schema"). A cleared slot
-- is a row with an empty body, never a deleted row.
CREATE TABLE vaults  (id TEXT PRIMARY KEY, hash TEXT UNIQUE NOT NULL,
                      created INTEGER NOT NULL, seen INTEGER NOT NULL,
                      pushed INTEGER NOT NULL DEFAULT 0,
                      day TEXT NOT NULL DEFAULT '', day_writes INTEGER NOT NULL DEFAULT 0);
CREATE TABLE slots   (vault TEXT NOT NULL, n INTEGER NOT NULL, rev INTEGER NOT NULL,
                      yard_id TEXT NOT NULL, played_s INTEGER NOT NULL, save_v INTEGER NOT NULL,
                      size INTEGER NOT NULL, at INTEGER NOT NULL, body BLOB NOT NULL,
                      PRIMARY KEY (vault, n));
CREATE TABLE pairings(hash TEXT PRIMARY KEY, vault TEXT UNIQUE NOT NULL, expires INTEGER NOT NULL,
                      wrapped BLOB NOT NULL, iv BLOB NOT NULL);
CREATE TABLE limits  (key TEXT PRIMARY KEY, until INTEGER NOT NULL, n INTEGER NOT NULL);
CREATE TABLE totals  (id INTEGER PRIMARY KEY CHECK (id = 1), bytes INTEGER NOT NULL,
                      day TEXT NOT NULL, writes INTEGER NOT NULL,
                      fail_hour INTEGER NOT NULL, fails INTEGER NOT NULL);
INSERT INTO totals VALUES (1, 0, '', 0, 0, 0);
