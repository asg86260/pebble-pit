// Cloud saves (DESIGN.md, "Cloud saves: a sync code and a worker";
// docs/wave-cloud.md): every slot mirrored on a Cloudflare Worker under a
// secret nobody types. Read by both ends -- the worker imports this file --
// so a ceiling is one fact, not two that can disagree.

// The switch. Off, the build has no cloud: no line in the foot bar, no page
// on the sheet, no request. Off until the owner has deployed the worker.
export const CLOUD_ON = false;

// Where the worker is. Empty means no cloud, which is the node yard, the
// checks and any build nobody pointed at a worker. The node yard has no
// `import.meta.env`, so the read is guarded.
export const CLOUD_URL = (CLOUD_ON && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CLOUD_URL) || '';

// The longest the boot waits on the cloud before it plays the local yard.
export const CLOUD_BOOT_MS = 3000;
// Every other call has this long and then is treated as offline.
export const CLOUD_TIMEOUT_MS = 5000;
// How often the page asks whether a push is due.
export const CLOUD_PUMP_MS = 5000;
// A moved slot goes up at most this often: the minute a shut lid can lose
// from the mirror, never from the yard.
export const CLOUD_PUSH_S = 60;
// The worker refuses a slot pushed again sooner than this, whatever the
// client believes; half the push, so a healthy client never meets it.
export const CLOUD_PUSH_FLOOR_S = 30;
// A healthy hour is sixty pushes and a few page hides; past this a session
// is looping and stops pushing.
export const CLOUD_PUSH_HOUR_MAX = 90;
// The longest a failing client waits between tries.
export const CLOUD_BACKOFF_MAX_S = 1800;
// The browser's cap on a keepalive request's body; a larger page-hide push
// waits for the next boot.
export const CLOUD_KEEPALIVE_MAX = 65536;
// A gzipped slot, at most: fifty times a busy yard. Over it is a bug in the
// save's size, not something to store.
export const CLOUD_BLOB_MAX = 262144;
// The whole store, at most: a fifth of D1's free five gigabytes.
export const CLOUD_BYTES_MAX = 1073741824;
// New secrets an ip may mint a day.
export const CLOUD_MINTS_IP_DAY = 3;
// A vault minted and never pushed to is swept after this many days...
export const CLOUD_EMPTY_D = 7;
// ...and any vault unseen for this many.
export const CLOUD_STALE_D = 180;
// Pushes a vault may make a day: three slots once a minute for over eight
// hours of play.
export const CLOUD_VAULT_DAY_WRITES = 1500;
// Pushes the whole worker takes a day. Three row writes each, so 75k of the
// account's free 100k, the rest left for mints, sweeps and other workers.
export const CLOUD_DAY_WRITES = 25000;
// The secret, in Crockford base-32 characters: a hundred bits.
export const CLOUD_SECRET_LEN = 20;
// The pairing code: thirty bits, safe only because it dies.
export const CLOUD_PAIR_LEN = 6;
// How long a pairing code lives.
export const CLOUD_PAIR_S = 600;
// Wrong claims an ip may make in CLOUD_PAIR_TRIES_S...
export const CLOUD_PAIR_TRIES = 5;
export const CLOUD_PAIR_TRIES_S = 600;
// ...and across the whole worker in an hour, which is what stops guesses
// spread over many ips.
export const CLOUD_PAIR_FAILS_HOUR = 1000;

// --- wave-cloud SYNC: the client's own ------------------------------------
// Crockford base 32: no I, L, O or U, so a code read off one screen is typed
// on another without a guess between a one and an ell.
export const CLOUD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
// A yard's name, in the same characters: eighty bits, so no two yards ever
// minted share one.
export const YARD_ID_LEN = 16;
// What the secret is shown behind, so a recovery code written on paper says
// what it is for; dropped again on the way in.
export const CLOUD_SECRET_PREFIX = 'PEBBLE';
