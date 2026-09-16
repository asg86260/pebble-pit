// Every hover rule in both stylesheets stands behind `@media (hover: hover)`
// (DESIGN.md, "A tap buys"). A phone browser that sees content change on
// hover treats the first tap as the hover and waits for a second to click,
// so one `:hover` rule outside the gate is a board that needs two taps to
// buy on every phone. The next hover rule written is caught here rather
// than in somebody's hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const FILES = ['src/style.css', 'src/shelf.css'];

// Walk the sheet block by block, keeping the heads of the blocks we are
// inside, and note every rule head with `:hover` in it that has no
// `(hover: hover)` media block above it. Comments and strings are skipped so
// a `:hover` in prose is not a finding.
function ungated(css) {
  const found = [];
  const stack = [];
  let head = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (css.startsWith('/*', i)) { i = css.indexOf('*/', i + 2) + 1; continue; }
    if (c === '"' || c === "'") { const j = css.indexOf(c, i + 1); i = j; continue; }
    if (c === '{') {
      const sel = head.trim();
      if (sel.includes(':hover') && !stack.some(h => /^@media\b/.test(h) && /\(\s*hover\s*:\s*hover\s*\)/.test(h)))
        found.push(sel.replace(/\s+/g, ' '));
      stack.push(sel);
      head = '';
      continue;
    }
    if (c === '}') { stack.pop(); head = ''; continue; }
    if (c === ';' && !stack.length) { head = ''; continue; }
    head += c;
  }
  return found;
}

for (const file of FILES) {
  test(`${file}: no :hover outside a (hover: hover) block`, () => {
    const bad = ungated(readFileSync(new URL('../' + file, import.meta.url), 'utf8'));
    assert.deepEqual(bad, [], `ungated hover rules in ${file}:\n  ${bad.join('\n  ')}`);
  });
}

// The scanner itself has to see one to be worth anything.
test('the scanner finds a hover rule left out in the open', () => {
  assert.deepEqual(ungated('.a:hover { color: red; } @media (hover: hover) { .b:hover { x: y } }'), ['.a:hover']);
  assert.deepEqual(ungated('@media (max-width: 500px) { .a:hover { x: y } }'), ['.a:hover']);
  assert.deepEqual(ungated('/* .c:hover */ @media (hover: hover) { @media (max-width: 500px) { .b:hover { x: y } } }'), []);
});
