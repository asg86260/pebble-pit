// The board of times (DESIGN.md, "The board of times: a global competition
// for the rescue"): the one board everybody's rescue clock goes on, and the
// server that keeps it.

// The switch. Off, the game is a build with no board -- no panel on the
// title, no page on the sheet, no ping, no post -- whatever TIMES_URL says.
// Off since 2026-09-21 by the owner's call; the server and the tunnel stay up.
// A check turns the board on for itself through `__timesUrl`.
export const TIMES_ON = false;

// Where the board is. Empty means there is no board: times.js does nothing
// at all, which is the node yard, the checks and a build nobody pointed at a
// server. A build reads it from `VITE_TIMES_URL`; the node yard has no
// `import.meta.env`, so the read is guarded.
export const TIMES_URL = (TIMES_ON && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TIMES_URL) || '';

// How often the game tells the server the sqwife is still under, in wall
// seconds. A precision knob, not a cost one: a cheater can shave at most one
// interval off a real run, and a two-hour rescue at sixty is a hundred and
// twenty requests of nothing.
export const TIMES_PING_S = 60;
// How many intervals a gap between pings may count for. A ping after a day
// away is one interval, not a day.
export const TIMES_PING_SLACK = 2;
// Under this a real rescue cannot land: half the fastest driven yard the node
// tier can stage (tools/node/rescue-floor.mjs: 220 s on two crew, 243 s on
// ten, 2026-09-20 -- the shields' sequence sets the pace, not the hands).
// Re-read it when the rescue's pace changes.
export const TIMES_FLOOR_MS = 120000;
// A row the server watched less than this share of is marked ~ (played
// offline).
export const TIMES_WATCHED_MIN = 0.8;
// The page shows this many, best first.
export const TIMES_SHOWN = 10;
// The most a read may ask for.
export const TIMES_TOP_MAX = 50;
// Every call to the board has this long and then is nobody's business.
export const TIMES_TIMEOUT_MS = 5000;
// A name on the board is this long at most, after trimming.
export const TIMES_NAME_MAX = 20;
// A run with no ping for this many days is dropped from the server's table.
export const TIMES_RUN_STALE_D = 30;
