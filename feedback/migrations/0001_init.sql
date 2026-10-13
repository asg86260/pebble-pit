-- The feedback worker's whole database (DESIGN.md, "Feedback form", "The
-- worker"), as wrangler's first migration; feedback/test/d1.mjs reads this
-- same file. Two tables for a report, so reading the list never drags the
-- blobs: `reports` the words and the facts, `saves` the gzip as sent.
-- `save_bytes` is the save's size while it is kept, 0 once it is not.
CREATE TABLE reports (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL,
                      kind TEXT, text TEXT NOT NULL,
                      version TEXT, target TEXT, shell TEXT, os TEXT, lang TEXT, page TEXT, fatal TEXT,
                      save_bytes INTEGER NOT NULL DEFAULT 0, read_at INTEGER);
CREATE INDEX reports_at ON reports (at);
CREATE TABLE saves   (report_id INTEGER PRIMARY KEY, blob BLOB NOT NULL);
-- A day's count of reports from one ip, keyed on the ip, the day and a pepper
-- hashed together, so the table holds no ip and no row can be tied to one
-- across days.
CREATE TABLE limits  (key TEXT PRIMARY KEY, day TEXT NOT NULL, n INTEGER NOT NULL);
-- The running totals: bytes of saves stored, and today's reports.
CREATE TABLE totals  (id INTEGER PRIMARY KEY CHECK (id = 1), bytes INTEGER NOT NULL,
                      day TEXT NOT NULL, reports INTEGER NOT NULL);
INSERT INTO totals VALUES (1, 0, '', 0);
