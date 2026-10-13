// The faces for Chinese, Japanese and Korean (DESIGN.md, "Localization phase
// two", section 3): Noto Sans SC, JP and KR, each cut down to the characters
// its language's file uses, with the weight axis kept from regular to bold,
// written as `src/fonts/<code>.woff2` for lang.js to load when that language
// is the one in force. The cut faces are made, never committed (src/fonts/ is
// ignored), so a translation cannot ship without its glyphs; the vite config
// runs this at the start of every build and dev server.
//
//   node tools/fonts.mjs     cut every face whose language has a file, and
//                            say what each came to
//
// The whole fonts (10 to 18 MB each, as variable TrueType) are fetched once a
// machine from Google Fonts' own repository, pinned to a commit and checked
// against a hash, and kept outside the checkout (PIT_FONT_CACHE, else
// ~/.cache/pebble-pit/fonts), so seventy worktrees share one copy and nothing
// multi-megabyte is in git. Why that source: it is the one Google Fonts
// serves from, it carries the variable (weight-axis) TrueType that the
// subsetter cuts cleanly, and a pinned commit cannot change under us; the
// @fontsource packages ship the CJK faces only pre-split into a hundred
// unicode-range slices, which is the wrong shape to cut from.
//
// Every way this can fail -- no file for the language yet, no network on a
// first run, a hash that does not match -- is a line on the console and no
// face, never a failed build: the system's own CJK face still answers, as it
// did before there were any.

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'https://raw.githubusercontent.com/google/fonts';
// A face a key in locales/languages.json's `face` column: where its whole
// font is, at a pinned commit, and the hash of that file.
export const SOURCES = {
  SC: { file: 'NotoSansSC[wght].ttf', url: `${REPO}/a85815a42757630ce188fdad368c2dfc444d4773/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf`, sha256: 'a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da' },
  JP: { file: 'NotoSansJP[wght].ttf', url: `${REPO}/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf`, sha256: 'c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f' },
  KR: { file: 'NotoSansKR[wght].ttf', url: `${REPO}/b38c5c93af322c45f633e17ac440ec1e6c94d489/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf`, sha256: '194018e6b2b293a7964f037b25c0249ce1418bc9ab3c971060a03aa57861e252' }
};
export const LICENSE = { file: 'OFL.txt', url: `${REPO}/a85815a42757630ce188fdad368c2dfc444d4773/ofl/notosanssc/OFL.txt` };

// Every face also carries these, whatever the file says: the figures and the
// marks the game writes itself (a count, a clock, a `·`), the CJK
// punctuation, and the full-width forms the `wide` pseudo-language and a
// translator's full-width figures use. The kana in full for Japanese, so a
// name or a re-translation never lands in a gap.
const ALWAYS = ' 0123456789.,:;!?%+-×·…—–‘’“”()[]<>/' + range(0x3000, 0x303f) + range(0xff01, 0xff5e);
const EXTRA = { JP: range(0x3041, 0x3096) + range(0x30a1, 0x30fc) };
// Regular to bold: the two weights the sheets ask for. The rest of the axis
// is cut away, which is most of a variable face's size.
const WEIGHTS = { min: 400, max: 700 };

function range(a, b) { let s = ''; for (let c = a; c <= b; c++) s += String.fromCodePoint(c); return s; }

export const cacheDir = () => process.env.PIT_FONT_CACHE || join(homedir(), '.cache', 'pebble-pit', 'fonts');
export const OUT = join(ROOT, 'src', 'fonts');

// The characters a language's file asks a face to draw: its messages' words,
// not its comments (which are the translators' notes, often in English).
export function charsOf(ftl) {
  const words = ftl.split(/\r?\n/).filter(l => !/^\s*#/.test(l)).join('\n');
  return [...new Set(words + ALWAYS)].join('');
}

async function fetched(src, log) {
  const dir = cacheDir(), file = join(dir, src.file);
  if (!existsSync(file)) {
    log(`fonts: fetching ${src.file} (once a machine)`);
    const r = await fetch(src.url);
    if (!r.ok) throw new Error(`${src.url}: ${r.status}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(file + '.part', Buffer.from(await r.arrayBuffer()));
    renameSync(file + '.part', file);
  }
  const buf = readFileSync(file);
  if (src.sha256) {
    const got = createHash('sha256').update(buf).digest('hex');
    if (got !== src.sha256) throw new Error(`${file}: hash ${got}, wanted ${src.sha256}; delete it to fetch again`);
  }
  return buf;
}

// Cut every face whose language has a file, skipping one already cut from
// the file as it stands. What happened, a line a language.
export async function cutFaces({ log = console.log } = {}) {
  const table = JSON.parse(readFileSync(join(ROOT, 'locales', 'languages.json'), 'utf8'));
  const out = [];
  for (const row of table.filter(r => r.face)) {
    const ftl = join(ROOT, 'locales', `${row.code}.ftl`), woff = join(OUT, `${row.code}.woff2`);
    if (!existsSync(ftl)) { out.push({ code: row.code, said: 'no file yet' }); continue; }
    if (existsSync(woff) && statSync(woff).mtimeMs > statSync(ftl).mtimeMs && statSync(woff).mtimeMs > statSync(fileURLToPath(import.meta.url)).mtimeMs) {
      out.push({ code: row.code, said: 'current', bytes: statSync(woff).size });
      continue;
    }
    try {
      const src = SOURCES[row.face];
      const { default: subsetFont } = await import('subset-font');
      const chars = charsOf(readFileSync(ftl, 'utf8')) + (EXTRA[row.face] || '');
      const cut = await subsetFont(await fetched(src, log), chars, { targetFormat: 'woff2', variationAxes: { wght: WEIGHTS } });
      mkdirSync(OUT, { recursive: true });
      writeFileSync(woff, cut);
      out.push({ code: row.code, said: 'cut', bytes: cut.length, chars: [...new Set(chars)].length });
    } catch (e) {
      log(`fonts: ${row.code} not cut (${e.message}); the system's face answers`);
      out.push({ code: row.code, said: 'failed' });
    }
  }
  // The faces' license, beside them wherever they go (SIL OFL 1.1).
  if (out.some(o => o.bytes) && !existsSync(join(OUT, LICENSE.file))) {
    try { writeFileSync(join(OUT, LICENSE.file), await fetched(LICENSE, log)); } catch (e) { log(`fonts: no license file (${e.message})`); }
  }
  return out;
}

// The vite side: cut at the start of a build or a dev server, and ship the
// license with the faces.
export function fontsPlugin() {
  return {
    name: 'pit-fonts',
    async buildStart() {
      const said = await cutFaces({ log: m => this.warn ? this.warn(m) : console.warn(m) });
      for (const s of said) if (s.said === 'cut') console.log(`fonts: ${s.code} ${(s.bytes / 1024).toFixed(0)} KB`);
    },
    generateBundle() {
      const lic = join(OUT, LICENSE.file);
      if (existsSync(lic) && existsSync(OUT)) this.emitFile({ type: 'asset', fileName: 'fonts/OFL.txt', source: readFileSync(lic) });
    }
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const said = await cutFaces();
  for (const s of said) console.log(`${s.code.padEnd(6)} ${s.said}${s.bytes ? `  ${(s.bytes / 1024).toFixed(1)} KB` : ''}${s.chars ? `  ${s.chars} characters` : ''}`);
}
