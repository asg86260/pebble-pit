// The pilot's packages live outside the repo (the game takes no new
// dependencies): PILOT_DEPS names a folder whose node_modules holds
// @browsermt/bergamot-translator, @fluent/syntax and @fluent/bundle.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEPS = process.env.PILOT_DEPS;
if (!DEPS) throw new Error('set PILOT_DEPS');

// A package's ES module entry, or a file inside one.
export function dep(name) {
  const base = path.join(DEPS, 'node_modules');
  if (name.endsWith('.js')) return import(pathToFileURL(path.join(base, name)).href);
  const pkg = JSON.parse(fs.readFileSync(path.join(base, name, 'package.json'), 'utf8'));
  const exp = pkg.exports?.['.'];
  const entry = (typeof exp === 'object' ? (exp.import?.default ?? exp.import ?? exp.default) : exp) ?? pkg.module ?? pkg.main;
  return import(pathToFileURL(path.join(base, name, entry)).href);
}
