// The house type, as English reads it, did not move when the sheets learned
// to change it a language at a time (DESIGN.md, "Localization phase two",
// section 3). Every tracked rule writes `calc(<its em> * var(--track))` and
// every face is `var(--face)`, so a CJK language can set two knobs instead of
// overriding seventy rules; with the root's values put back in, each rule must
// read exactly as it did before the knobs (test/fixtures/type-before.json,
// captured off the three sheets as they stood at 9d150c67).
//
// A parse, not a page: computed style is these declarations with the two
// variables substituted, and a rule added or reordered since is a rule this
// check asks to be looked at, which is the point.
//
// No yard: this is about the sheets.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SHEETS = ['src/style.css', 'src/shelf.css', 'src/title.css'];
const BEFORE = JSON.parse(readFileSync('test/fixtures/type-before.json', 'utf8'));

// Every letter-spacing, font and font-family declaration in a sheet, in
// order, with the selector it sits under.
function declarations(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  let sel = '';
  for (const m of text.matchAll(/([^{};]+)\{|(?<![\w-])(letter-spacing|font-family|font)\s*:\s*([^;}]+)/g)) {
    if (m[1] != null) { sel = m[1].trim().replace(/\s+/g, ' '); continue; }
    out.push({ sel, prop: m[2], value: m[3].trim().replace(/\s+/g, ' ') });
  }
  return out;
}

// The root's knobs, read off style.css's `:root` block.
const style = readFileSync('src/style.css', 'utf8');
const rootBlock = style.match(/:root\s*\{([^}]*)\}/)?.[1] || '';
const knob = name => rootBlock.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`))?.[1].trim();

// A declaration with the root's knobs put back: `calc(.1em * var(--track))`
// with --track 1 is `.1em`, and `var(--face)` is the stack.
function english(value) {
  const track = Number(knob('track'));
  return value
    .replace(/calc\(\s*([\d.]+)em\s*\*\s*var\(--track\)\s*\)/g, (_, n) => (track === 1 ? n : String(Number(n) * track)) + 'em')
    .replace(/var\(--face\)/g, knob('face'));
}

test('the root sets the knobs to the house type', () => {
  assert.equal(knob('track'), '1');
  assert.equal(knob('face'), 'ui-monospace, "Courier New", monospace');
});

test('every tracked rule and every face reads as it did in English', () => {
  const now = SHEETS.flatMap(f => declarations(readFileSync(f, 'utf8')).map(d => ({ file: f, ...d, value: english(d.value) })));
  assert.deepEqual(now, BEFORE);
});

test('no rule tracks words with a plain number but the pictures', () => {
  // The pips, the cloud's pairing code and the box it is typed into, and the
  // dev panel space marks or codes, not words: they keep their numbers.
  const PICTURES = /\.pips\b|pair-code|cloudsheet input|cloudsheet \.code|^#dev\b/;
  const plain = SHEETS.flatMap(f => declarations(readFileSync(f, 'utf8'))
    .filter(d => d.prop === 'letter-spacing' && /^[\d.]*[1-9][\d.]*em$/.test(d.value) && !PICTURES.test(d.sel))
    .map(d => `${f}: ${d.sel} ${d.value}`));
  assert.deepEqual(plain, []);
  const stacks = SHEETS.flatMap(f => declarations(readFileSync(f, 'utf8'))
    .filter(d => d.prop !== 'letter-spacing' && d.value.includes('"Courier New"')).map(d => `${f}: ${d.sel}`));
  assert.deepEqual(stacks, [], 'a face written out instead of var(--face)');
});
