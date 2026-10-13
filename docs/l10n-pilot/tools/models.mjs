// Fetches the Firefox Translations (Bergamot) models the pilot uses, from
// Mozilla's own model registry: the public Remote Settings collection
// `translations-models` that Firefox itself downloads from. No account, no
// key. The models land in MODELS_DIR (outside the repo) with a registry.json
// in the shape @browsermt/bergamot-translator reads.
//
//   MODELS_DIR=<dir> node docs/l10n-pilot/tools/models.mjs
//
// A record carries a filter expression; this picks what a desktop release
// Firefox would pick: no filter, or one that is true off Android on release.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const RS = 'https://firefox.settings.services.mozilla.com/v1/buckets/main/collections/translations-models/records';
const CDN = 'https://firefox-settings-attachments.cdn.mozilla.net/';
const DIR = process.env.MODELS_DIR;
if (!DIR) throw new Error('set MODELS_DIR');
fs.mkdirSync(DIR, { recursive: true });

// Our codes against the registry's.
export const PAIRS = { de: 'de', fr: 'fr', es: 'es', 'pt-BR': 'pt', ru: 'ru', 'zh-CN': 'zh-Hans', ja: 'ja', ko: 'ko' };

const desktopRelease = f => !f || f === "env.appinfo.OS != 'Android' || env.channel != 'release'";
const vnum = v => v.split('.').map(Number);
const newer = (a, b) => { const x = vnum(a), y = vnum(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };

const records = (await (await fetch(RS)).json()).data.filter(r => desktopRelease(r.filter_expression) && !/[a-z]/.test(r.version));
const registry = {};
const versions = {};
for (const [ours, theirs] of Object.entries(PAIRS)) {
  for (const [from, to] of [['en', theirs], [theirs, 'en']]) {
    const rs = records.filter(r => r.fromLang === from && r.toLang === to);
    if (!rs.length) { console.log(`no model ${from}->${to}`); continue; }
    let best = rs[0].version;
    for (const r of rs) if (newer(r.version, best)) best = r.version;
    const key = `${from}${to}`;
    registry[key] = {};
    versions[key] = best;
    for (const r of rs.filter(r => r.version === best)) {
      const file = path.join(DIR, `${key}-${best}-${r.name}`);
      if (!fs.existsSync(file) || fs.statSync(file).size !== r.attachment.size) {
        const buf = Buffer.from(await (await fetch(CDN + r.attachment.location)).arrayBuffer());
        const sha = crypto.createHash('sha256').update(buf).digest('hex');
        if (sha !== r.attachment.hash) throw new Error(`hash mismatch ${file}`);
        fs.writeFileSync(file, buf);
      }
      registry[key][r.fileType] = { name: file, size: r.attachment.size, expectedSha256Hash: r.attachment.hash };
    }
    console.log(key, best, Object.keys(registry[key]).join(' '));
  }
}
fs.writeFileSync(path.join(DIR, 'registry.json'), JSON.stringify(registry, null, 1));
fs.writeFileSync(path.join(DIR, 'versions.json'), JSON.stringify(versions, null, 1));
