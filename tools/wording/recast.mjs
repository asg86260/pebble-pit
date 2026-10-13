// The hand half of tools/wording/extract.mjs: a sentence the code built out
// of pieces, or a plural it picked by hand, recast as one message. A list is a
// module exporting `default` as an array of
//
//   { file, from, to,                       exact text in the file and what replaces it
//     msgs: [{ id, group, context, ftl,     the message, as Fluent source after `id =`
//              before: [{ args, text }] }] } what the code said before, for some args
//
// Each `from` must be in its file exactly once. The messages go into
// locales/en.ftl under their groups and the `before` cases into
// test/fixtures/wording-before.json, where the guard renders each message with
// its args and asks for the same text.
//
//   node tools/wording/recast.mjs <list.mjs>

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, relative, dirname, posix } from 'node:path';

const FTL = 'locales/en.ftl';
const BEFORE = 'test/fixtures/wording-before.json';
const list = (await import(pathToFileURL(resolve(process.argv[2])).href)).default;
let ftl = readFileSync(FTL, 'utf8');
const before = JSON.parse(readFileSync(BEFORE, 'utf8'));
before.cases ??= {};
const ids = new Set([...ftl.matchAll(/^([a-zA-Z][\w-]*) =/gm)].map(m => m[1]));

function add(group, block) {
  const head = `## ${group}\n`;
  const at = ftl.indexOf(head);
  if (at < 0) { ftl = ftl.replace(/\n*$/, '\n\n') + head + '\n' + block; return; }
  const next = ftl.indexOf('\n## ', at + head.length);
  const end = next < 0 ? ftl.length : next + 1;
  ftl = ftl.slice(0, end).replace(/\n*$/, '\n') + '\n' + block + (next < 0 ? '' : '\n' + ftl.slice(end));
}

const files = new Map();
let bad = 0;
for (const e of list) {
  if (e.file) {
    let src = files.get(e.file) ?? readFileSync(e.file, 'utf8').replace(/\r\n/g, '\n');
    const n = src.split(e.from).length - 1;
    if (n !== 1) { console.error(`${e.file}: ${n}x ${JSON.stringify(e.from).slice(0, 80)}`); bad++; continue; }
    src = src.replace(e.from, () => e.to);
    if (!/import \{[^}]*\bmsg\b[^}]*\} from '[^']*lang\.js'/.test(src)) {
      let rel = posix.normalize(relative(dirname(e.file), 'src/lang.js').replace(/\\/g, '/'));
      if (!rel.startsWith('.')) rel = './' + rel;
      const m = src.match(/^import [^;]*?;[^\n]*\n/m);
      const line = `import { msg } from '${rel}';\n`;
      // before the first import, or else after the header comment
      const head = src.match(/^(\/\/[^\n]*\n)*\n?/)[0];
      src = m ? src.slice(0, m.index) + line + src.slice(m.index) : head + line + (head ? '\n' : '') + src.slice(head.length);
    }
    files.set(e.file, src);
  }
  for (const m of e.msgs || []) {
    if (ids.has(m.id)) { console.error(`${m.id} is already a message`); bad++; continue; }
    ids.add(m.id);
    add(m.group, (m.context ? m.context.split('\n').map(l => `# ${l}\n`).join('') : '') + `${m.id} = ${m.ftl}\n`);
    before.cases[m.id] = m.before || [];
  }
}
if (bad) process.exit(1);
for (const [f, s] of files) writeFileSync(f, s);
writeFileSync(FTL, ftl);
writeFileSync(BEFORE, JSON.stringify(before, null, 1) + '\n');
