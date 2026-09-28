// The worker's calendar is UTC: the day caps, the mint window and the
// once-a-day `seen` all turn over at the same midnight wherever the player is.

export const SECOND_MS = 1000;
export const HOUR_MS = 3600 * SECOND_MS;
export const DAY_MS = 24 * HOUR_MS;

export const utcDay = ms => new Date(ms).toISOString().slice(0, 10);
export const nextMidnight = ms => (Math.floor(ms / DAY_MS) + 1) * DAY_MS;
export const hourOf = ms => Math.floor(ms / HOUR_MS);

// A wait, rounded up, so a client that obeys it to the second is never early.
export const secondsUntil = (then, now) => Math.max(1, Math.ceil((then - now) / SECOND_MS));
