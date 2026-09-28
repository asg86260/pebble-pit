-- Refused requests, counted by day and status, for the owner's /stats
-- (docs/wave-cloud.md; DESIGN.md, "Cloud saves", "Watching it"). Each count
-- stops at CLOUD_REFUSALS_COUNTED, so a flood of bad requests costs a
-- bounded number of writes.
CREATE TABLE refusals (day TEXT NOT NULL, status INTEGER NOT NULL, n INTEGER NOT NULL,
                       PRIMARY KEY (day, status));
