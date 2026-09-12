// The save, as a file.
//
// Plain Node and nothing from Electron, so the node tier can point this at a
// temp directory and prove the two things it promises. The first is that at
// every moment the directory holds at least one whole save: a new blob goes to
// `current.json.tmp` and is renamed over `current.json`, which on every
// filesystem this runs on is one step that either happens or does not. The
// second is that `last-good.json` is never anything but a save that has been
// read back off the disk and parsed: it is the save that was `current.json`
// before the last write, promoted only after the new blob has been read back
// whole -- so a write that is refused, or a rename that throws, leaves both
// files exactly as they were, and a blob that lands but turns out bad (a new
// build writing a shape the reader refuses) still has the one before it
// standing beside it. One write behind, by design: that is what a backup is.
//
// Named slots are not built; the directory is laid out so they can be, as
// `<name>.json` beside `current.json`. See DESIGN.md, "The desk".

const fs = require('node:fs');
const path = require('node:path');

const CURRENT = 'current.json';
const LAST_GOOD = 'last-good.json';

// A string, or null when the file is not there. Any other failure to read --
// a permission, a directory where a file should be -- is also "not there":
// the renderer's shape check is the one that decides what to do about a save
// it cannot use, and it needs a value to decide about, not a throw.
function readOr(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

// Write `raw` to `file` by way of a sibling temp file and a rename, so the
// file is never seen part-written. The temp is cleaned up on a throw, and the
// throw goes on to the caller.
function writeAtomic(file, raw) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, raw, 'utf8');
  try {
    fs.renameSync(tmp, file);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch {}
    throw err;
  }
}

function openStore(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const current = path.join(dir, CURRENT);
  const lastGood = path.join(dir, LAST_GOOD);
  return {
    read() {
      return { current: readOr(current), lastGood: readOr(lastGood) };
    },
    // Whether the blob is now `current.json` and has been read back whole. A
    // blob that is not JSON is refused before anything touches the disk. The
    // empty string is the renderer clearing its save (a reset): it skips the
    // parse and truncates `current.json`, and the yard that was there goes to
    // `last-good.json` like any other save being written over, because the
    // save before the reset is exactly the thing a player who pressed the
    // wrong button wants back. Nothing empty is ever promoted.
    write(raw) {
      if (typeof raw !== 'string') return false;
      try {
        if (raw !== '') JSON.parse(raw);
        const was = readOr(current);
        writeAtomic(current, raw);
        if (raw !== '') {
          const back = fs.readFileSync(current, 'utf8');
          if (back !== raw) return false;
          JSON.parse(back);
        }
        if (was && was !== raw && parses(was)) writeAtomic(lastGood, was);
        return true;
      } catch {
        return false;
      }
    }
  };
}

function parses(raw) {
  try { JSON.parse(raw); return true; } catch { return false; }
}

module.exports = { openStore };
