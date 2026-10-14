// The page's colors are the canvas's (docs/design-language/ui.md): a
// stylesheet cannot import config/palette.js, so style.css writes the same
// values out, and this holds the two equal -- a coin retuned in the palette
// and not on the page would be one coin in two colors.
//
// No yard: this is about the files.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COIN, COIN_DARK, PURPLE, GREY } from '../src/config/palette.js';
import { LIGHT_PAPER, LIGHT_INK, DARK_PAPER, DARK_INK, FLOAT_SHADOW_INK } from '../src/config/view.js';
import { PAD_ACCENT } from '../src/config/pad.js';

const css = readFileSync('src/style.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const block = sel => css.match(new RegExp(`(?:^|\\n)${sel}\\s*\\{([^}]*)\\}`))?.[1] || '';
const token = (body, name) => body.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`))?.[1].trim().toLowerCase();
const light = block(':root'), dark = block('html\\.dark');

test('the light page draws the palette\'s coins, accent, ends and shadow', () => {
  assert.equal(token(light, 'coin-ore'), COIN.ore);
  assert.equal(token(light, 'coin-crop'), COIN.crop);
  assert.equal(token(light, 'coin-spark'), COIN.spark);
  assert.equal(token(light, 'accent'), PAD_ACCENT);
  assert.equal(token(light, 'c-paper'), LIGHT_PAPER.replace('#ffffff', '#fff'));
  assert.equal(token(light, 'c-ink'), LIGHT_INK.replace('#000000', '#000'));
  assert.equal(token(light, 'ink-7'), FLOAT_SHADOW_INK);
  assert.equal(FLOAT_SHADOW_INK, GREY[4]);
});

test('the dark page draws the palette\'s dark coins, a rung of the purple, and the canvas\'s ends', () => {
  assert.equal(token(dark, 'coin-ore'), COIN_DARK.ore);
  assert.equal(token(dark, 'coin-crop'), COIN_DARK.crop);
  assert.equal(token(dark, 'coin-spark'), COIN_DARK.spark);
  assert.ok(PURPLE.includes(token(dark, 'accent')), 'the dark accent is a rung of PURPLE');
  assert.equal(token(dark, 'c-paper'), DARK_PAPER);
  assert.equal(token(dark, 'c-ink'), DARK_INK);
});

test('no coin or purple is written outside the tokens', () => {
  const lit = [...Object.values(COIN), ...Object.values(COIN_DARK), ...PURPLE.slice(1)].map(c => c.toLowerCase());
  for (const f of ['src/style.css', 'src/shelf.css', 'src/title.css']) {
    const text = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').toLowerCase()
      .replace(/(?:^|\n)(:root|html\.dark)\s*\{[^}]*\}/g, '');
    const found = lit.filter(c => text.includes(c));
    assert.deepEqual(found, [], `${f} writes a palette color outside :root`);
  }
});
