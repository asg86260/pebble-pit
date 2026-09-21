// Who an itch key belongs to. The itch desktop app puts a key in the
// environment of a game it launches; the game sends it up with the time, and
// itch's own API says whose it is. Null for no key, a bad key, or itch away
// -- in every case the row falls back to the typed name and no badge.

const ME = "https://itch.io/api/1/jwt/me";

export type WhoIs = (key: string) => Promise<string | null>;

export const itchWhoIs: WhoIs = async (key) => {
  if (!key) return null;
  try {
    const r = await fetch(ME, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const j = (await r.json()) as { user?: { username?: string } };
    const name = j?.user?.username;
    return typeof name === "string" && name ? name : null;
  } catch {
    return null;
  }
};
