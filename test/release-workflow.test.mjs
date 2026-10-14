// The release workflow's steps run in bash on every runner. The windows
// runner's default is pwsh, where `>> "$GITHUB_ENV"` names an unset
// PowerShell variable, so a server address written that way never reached the
// windows build. Read as text: no yaml parser is a dependency here, and the
// two facts checked are line-shaped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const yml = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n');

test('every run step defaults to bash', () => {
  assert.match(yml, /^defaults:\n {2}run:\n {4}shell: bash$/m);
});

test('no step overrides the shell with something else', () => {
  const others = [...yml.matchAll(/^\s+shell:\s*(\S+)/gm)].map(m => m[1]).filter(s => s !== 'bash');
  assert.deepEqual(others, []);
});
