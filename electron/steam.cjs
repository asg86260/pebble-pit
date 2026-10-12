// Steam: the save's second home on a Steam build (DESIGN.md, "Three builds").
//
// The store (store.cjs) stays the save; Steam's remote storage is a mirror of
// it, reached through the Steamworks SDK (`steamworks.js`) and never through
// Auto-Cloud. Every write that lands on disk is written to Steam as well, and
// once at launch, before the page reads anything, each slot's two copies are
// compared by the save's own `playedS` -- the rule our cloud uses -- and the
// one played longer is the one both sides keep. If Steam is not running, the
// player has its cloud switched off, or the SDK is not there at all, the
// mirror is never made and the store is the store, with nothing said: the
// game is playable on disk alone, and a Steam build never reaches for our
// cloud in its place.
//
// Plain Node and nothing from Electron, like the store, so the node tier can
// hand it a fake remote storage (test/desk-steam.test.mjs). The SDK is
// required lazily and inside a try: dev, the checks and every itch build run
// without it installed.

const fs = require('node:fs');
const path = require('node:path');

// The Steam app ids. OWNER: none exist yet -- each is a placeholder until
// Steamworks issues the app (the full game) and its demo (a child app), and
// the release workflow takes its own copies from repository variables. While
// one is null, a packaged build lets Steam say which app it launched (Steam
// sets SteamAppId for a game it starts), and a build not started by Steam
// plays on disk. 480 is Valve's Spacewar, the id every Steamworks developer
// may test against; a dev run uses it unless STEAM_APP_ID names another.
const APPS = {
  full: null, // PLACEHOLDER: the full game's app id
  demo: null  // PLACEHOLDER: the demo's app id
};
const DEV_APP = 480;

// The save slots, which src/config/saves.js counts; the shell never imports
// from src/, so the number is written twice and the check holds them equal.
const SLOTS = 3;

// The words of the carry-over offer. OWNER: every string here is a
// placeholder for the owner to write (player copy is the owner's).
const CARRY_WORDS = {
  title: "[owner's words: the carry-over offer's title]",
  message: "[owner's words: a save from the demo was found -- carry it on?]",
  yes: "[owner's words: carry it on]",
  no: "[owner's words: start fresh]"
};

// The SDK, or null when it is not installed or will not load on this machine.
function loadSdk() {
  try { return require('steamworks.js'); } catch { return null; }
}

// The app id to start the SDK with: an explicit STEAM_APP_ID first, then the
// configured app for this cut, then Spacewar in dev. Undefined in a packaged
// build with no id configured, which the SDK reads as "the app Steam launched".
function appIdFor({ demo = false, packaged = true, env = process.env } = {}) {
  const asked = Number(env.STEAM_APP_ID);
  if (Number.isInteger(asked) && asked > 0) return asked;
  const set = demo ? APPS.demo : APPS.full;
  if (set) return set;
  return packaged ? undefined : DEV_APP;
}

// Start the SDK once and hand back its client, or null for every way that can
// fail (not installed, Steam not running, no such app). The cloud and the
// achievements both ride on this one client; the SDK is not started twice.
function startClient({ sdk = loadSdk(), appId } = {}) {
  if (!sdk || typeof sdk.init !== 'function') return null;
  try { return sdk.init(appId) || null; } catch { return null; }
}

// Hand back the remote storage as three plain calls, or null for every way
// that can fail. Each call swallows its own throw: a remote storage that
// errors mid-game is a disk-only game, not a crash. `client` is a started one
// (startClient); without it the SDK is started here.
function startSteam({ sdk = loadSdk(), appId, client = undefined } = {}) {
  if (client === undefined) client = startClient({ sdk, appId });
  if (!client) return null;
  let cloud;
  try {
    cloud = client.cloud;
    if (!cloud.isEnabledForAccount() || !cloud.isEnabledForApp()) return null;
  } catch {
    return null;
  }
  return {
    read(name) {
      try { return cloud.fileExists(name) ? cloud.readFile(name) : null; } catch { return null; }
    },
    write(name, raw) {
      try { return !!cloud.writeFile(name, raw); } catch { return false; }
    },
    remove(name) {
      try { return cloud.fileExists(name) ? !!cloud.deleteFile(name) : true; } catch { return false; }
    }
  };
}

// The names the page may ask Steam to unlock: ACH_ and the in-game id in
// upper case (src/achievements.js makes them). The shell never imports from
// src/, so the shape is all it checks -- a name the Steamworks dashboard does
// not hold is refused by Steam itself.
const ACH_NAME = /^ACH_[A-Z0-9_]{1,60}$/;

// The achievements, as two calls that never throw and do nothing without a
// client. `unlock` sets one and stores it, once per name per run and not at
// all if Steam already has it; `sync` unlocks a list (the save's, at launch)
// so a player who won them before Steam was in the game gets them too.
// steamworks.js's `activate` is the set and the store together.
function achievementsOf(client) {
  const api = client && client.achievement;
  const told = new Set();
  const unlock = name => {
    if (!api || typeof name !== 'string' || !ACH_NAME.test(name) || told.has(name)) return false;
    told.add(name);
    try {
      if (!api.isActivated(name)) api.activate(name);
      return true;
    } catch {
      return false;
    }
  };
  return {
    unlock,
    sync(names) {
      if (!Array.isArray(names)) return 0;
      return names.filter(unlock).length;
    }
  };
}

// A slot's name in remote storage: the store's own file name for it, so the
// two lists read the same. Only the current save is mirrored; last-good is
// this disk's backup, not a second save to sync.
const nameOf = slot => {
  const n = Number(slot) || 1;
  return n === 1 ? 'current.json' : `slot-${n}.json`;
};

// How long a blob's yard has been played, or -1 for no save at all (missing,
// empty, or not JSON), so any real save beats it.
function playedOf(raw) {
  if (!raw) return -1;
  try {
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return -1;
    const p = Number(s.playedS);
    return Number.isFinite(p) ? p : 0;
  } catch {
    return -1;
  }
}

// The store with Steam behind it. Reads are the disk's -- `reconcile` has
// already made the disk the newer copy -- and a write that lands on disk goes
// to Steam too. A reset (the empty string) deletes the slot from Steam rather
// than writing nothing to it, or the next launch would find the yard the
// player threw away played longer than the empty one, and bring it back.
function mirror(store, remote) {
  if (!remote) return { ...store, reconcile: () => [] };
  return {
    read: slot => store.read(slot),
    write(slot, raw) {
      const ok = store.write(slot, raw);
      if (ok) {
        if (raw === '') remote.remove(nameOf(slot));
        else remote.write(nameOf(slot), raw);
      }
      return ok;
    },
    // Once, at launch: for each slot, the copy played longer wins, and the
    // other side is brought up to it. Written through the store, so the disk
    // copy Steam replaces becomes last-good like any save written over. A tie
    // is the same yard, and nothing is written. What happened, a line a slot,
    // for the shell's log and the checks.
    reconcile(slots = SLOTS) {
      const out = [];
      for (let n = 1; n <= slots; n++) {
        const here = store.read(n).current;
        const there = remote.read(nameOf(n));
        const a = playedOf(here), b = playedOf(there);
        if (b > a) out.push(store.write(n, there) ? 'steam' : 'kept');
        else if (a > b) out.push(remote.write(nameOf(n), here) ? 'disk' : 'kept');
        else out.push('same');
      }
      return out;
    }
  };
}

// The demo's own folder beside the full game's: the demo is its own app and
// keeps its own saves, so the full game can find them by name.
const demoDirOf = userData => `${userData} Demo`;

function readOr(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

// The demo's save to carry, if there is one: the slot played longest, from
// the demo's disk or -- when the caller can reach it -- the demo's remote
// storage, whichever is newer.
function demoSave({ demoSaves, demoRemote = null, slots = SLOTS }) {
  let best = null, bestP = -1;
  for (let n = 1; n <= slots; n++) {
    const name = nameOf(n);
    for (const raw of [readOr(path.join(demoSaves, name)), demoRemote ? demoRemote.read(name) : null]) {
      const p = playedOf(raw);
      if (p > bestP) { best = raw; bestP = p; }
    }
  }
  return best;
}

// On the full game's first launch, offer the demo's save, once. First launch
// is a store with nothing in any slot -- read after `reconcile`, so a player
// whose full game is already in Steam on another machine is not asked. The
// marker is written whenever the offer is made, taken or not, so it is never
// made again; a launch with no demo save to offer leaves no marker, and asks
// again next time if the store is still empty. `ask` is the shell's dialog
// (a yes is true); the save goes to slot 1 through the store it is given, so
// on Steam it is mirrored like any other write. What happened, as a word.
function offerDemoSave({ store, demoSaves, demoRemote = null, marker, ask, slots = SLOTS }) {
  if (fs.existsSync(marker)) return 'asked before';
  for (let n = 1; n <= slots; n++) {
    const r = store.read(n);
    if (r.current || r.lastGood) return 'not first';
  }
  const raw = demoSave({ demoSaves, demoRemote, slots });
  if (!raw) return 'no demo save';
  let yes = false;
  try { yes = !!ask(CARRY_WORDS); } catch {}
  try { fs.writeFileSync(marker, JSON.stringify({ offered: new Date().toISOString(), taken: yes }) + '\n'); } catch {}
  if (!yes) return 'declined';
  return store.write(1, raw) ? 'carried' : 'failed';
}

module.exports = {
  APPS, DEV_APP, SLOTS, CARRY_WORDS,
  loadSdk, appIdFor, startClient, startSteam, achievementsOf, ACH_NAME, nameOf, playedOf, mirror, demoDirOf, demoSave, offerDemoSave
};
