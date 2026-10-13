// Puts the English comment over every message of a drafted file, in sample
// order, so a reviewer reads each line with its context. Rewrites
// docs/l10n-pilot/draft/<lang>.ftl in place; what does not parse is kept as
// it was written, for the check to find.
//
//   node docs/l10n-pilot/tools/annotate.mjs <lang>
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SAMPLE, englishSample, messagesOf } from './lib.mjs';
import { dep } from './engine-deps.mjs';

const { serialize, Comment, Resource } = await dep('@fluent/syntax');
const lang = process.argv[2];
const file = path.join(ROOT, 'draft', `${lang}.ftl`);
const text = fs.readFileSync(file, 'utf8');
const { res, byId } = messagesOf(text);
const en = new Map(englishSample().map(m => [m.id.name, m]));
const head = `### Pebble Pit pilot, version A: drafted by Claude (Opus 5.5) after locales/STYLE.md, ${lang}.\n### A draft for a native reviewer, not a finished translation.\n\n`;
const out = [head];
for (const id of SAMPLE) {
  const m = byId.get(id);
  if (!m) continue;
  m.comment = en.get(id).comment ? new Comment(en.get(id).comment.content) : null;
  out.push(serialize(new Resource([m]), {}));
}
for (const j of res.body.filter(e => e.type === 'Junk')) out.push(j.content);
fs.writeFileSync(file, out.join('\n'));
console.log(lang, byId.size, 'messages,', res.body.filter(e => e.type === 'Junk').length, 'junk');
