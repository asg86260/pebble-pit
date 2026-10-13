// Writes the English sample as its own file (docs/l10n-pilot/en.ftl), the
// messages in sample order with their comments: the source both versions
// translate, and what the report reads the English from.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, REPO, SAMPLE, englishSample } from './lib.mjs';

const src = fs.readFileSync(path.join(REPO, 'locales', 'en.ftl'), 'utf8');
const msgs = englishSample();
// Cut each message's own lines out of the source, comment included, so the
// file reads exactly as en.ftl does.
const blocks = src.split(/\n\s*\n/);
const out = ['### The pilot sample, in English: cut from locales/en.ftl, in sample.txt order.\n'];
for (const id of SAMPLE) {
  const b = blocks.find(b => new RegExp(`^${id} =`, 'm').test(b));
  out.push(b.replace(/^##[^\n]*\n+/gm, '').trim() + '\n');
}
fs.writeFileSync(path.join(ROOT, 'en.ftl'), out.join('\n'));
console.log(msgs.length, 'messages');
