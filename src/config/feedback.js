// The feedback form (DESIGN.md, "Feedback form"): a box, a tick that sends
// the open slot's save, and a send, posted to a worker of its own
// (feedback/). Read by both ends -- the worker imports this file -- so a cap
// is one fact, not two that can disagree.

import { CLOUD_BLOB_MAX } from './cloud.js';

// The node yard has no `import.meta.env`, so the read is guarded.
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

// Where the worker is. Empty is a build with no button, no pane and no
// request: the node yard, every check, a dev server and any build nobody
// pointed at the worker. Unlike the cloud's it is not cleared for Steam: the
// form goes in every build.
export const feedbackUrlFor = e => (e && e.VITE_FEEDBACK_URL) || '';
export const FEEDBACK_URL = feedbackUrlFor(env);

// The words, at most, in characters.
export const FEEDBACK_TEXT_MAX = 4000;
// A save, gzipped, at most: the cloud's own ceiling, four times the largest
// yard on file (test/cloud-size.test.mjs trips on a format growing toward it).
export const FEEDBACK_SAVE_MAX = CLOUD_BLOB_MAX;
// The whole request, at most: the largest save as base64 and the longest
// words, with room to spare.
export const FEEDBACK_BODY_MAX = 409600;
// A meta field kept as a short string (the version, the language): longer is
// not one of ours, and is dropped.
export const FEEDBACK_META_MAX = 40;
// The crash's first line, at most: the client cuts it to this so the worker
// keeps it.
export const FEEDBACK_FATAL_MAX = 200;
// A send gives up after this long and says it did not go.
export const FEEDBACK_TIMEOUT_MS = 15000;

// The worker's caps. Reports an ip may send a day; the ip is never stored,
// only a hash of it with the day and a pepper.
export const FEEDBACK_IP_DAY = 10;
// Reports the worker takes a day, from everybody.
export const FEEDBACK_DAY = 500;
// Bytes of saves stored, at most: past it the words are taken and the save
// is not.
export const FEEDBACK_BYTES_MAX = 524288000;
// What the kill switch tells a client to wait.
export const FEEDBACK_PAUSED_RETRY_S = 86400;
// Days a save is kept after it came in, and a report.
export const FEEDBACK_SAVE_KEEP_D = 90;
export const FEEDBACK_REPORT_KEEP_D = 365;

// The short lists a meta field's value is one of; anything else is dropped.
// `target` is the store and whether the build is the demo.
export const FEEDBACK_TARGETS = ['itch', 'itch-demo', 'steam', 'steam-demo'];
export const FEEDBACK_SHELLS = ['web', 'desk'];
export const FEEDBACK_OSES = ['windows', 'mac', 'linux', 'android', 'ios', 'other'];
export const FEEDBACK_PAGES = ['game', 'title', 'crashed'];
// The kinds a report may carry. The form sends none (the owner's call 2 is
// open; DESIGN.md recommends words only); the worker keeps one if it comes.
export const FEEDBACK_KINDS = ['bug', 'words', 'else'];
