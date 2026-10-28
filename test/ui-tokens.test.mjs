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
import { LIGHT_PAPER, LIGHT_INK, DARK_PAPER, DARK_INK, DEEP_PAPER, DEEP_INK, FLOAT_SHADOW_ALPHA } from '../src/config/view.js';
import { PAD_ACCENT } from '../src/config/pad.js';
import { TEXT_FLOOR, TEXT_AA } from '../src/config/view.js';
import { SHELF_DOT, SHELF_DOT_AT, SHELF_DOT_ALPHA } from '../src/config/boards.js';

const css = readFileSync('src/style.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const block = sel => css.match(new RegExp(`(?:^|\\n)${sel}\\s*\\{([^}]*)\\}`))?.[1] || '';
const token = (body, name) => body.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`))?.[1].trim().toLowerCase();
const light = block(':root'), dark = block('html\\.dark'), dim = block('html\\.dark\\.dim');

test('the light page draws the palette\'s coins, accent, ends and shadow', () => {
  assert.equal(token(light, 'coin-ore'), COIN.ore);
  assert.equal(token(light, 'coin-crop'), COIN.crop);
  assert.equal(token(light, 'coin-spark'), COIN.spark);
  assert.equal(token(light, 'accent'), PAD_ACCENT);
  assert.equal(token(light, 'c-paper'), LIGHT_PAPER.replace('#ffffff', '#fff'));
  assert.equal(token(light, 'c-ink'), LIGHT_INK.replace('#000000', '#000'));
  assert.equal(parseFloat(token(light, 'shadow-ink')) / 100, FLOAT_SHADOW_ALPHA);
});

test('the dark page draws the palette\'s dark coins, a rung of the purple, and the canvas\'s ends', () => {
  assert.equal(token(dark, 'coin-ore'), COIN_DARK.ore);
  assert.equal(token(dark, 'coin-crop'), COIN_DARK.crop);
  assert.equal(token(dark, 'coin-spark'), COIN_DARK.spark);
  assert.ok(PURPLE.includes(token(dark, 'accent')), 'the dark accent is a rung of PURPLE');
  assert.equal(token(dark, 'c-paper'), DARK_PAPER);
  assert.equal(token(dark, 'c-ink'), DARK_INK);
});

test('the dim page draws the first dark page\'s ends, its fills in the light gray', () => {
  assert.equal(token(dim, 'c-paper'), DEEP_PAPER);
  assert.equal(token(dim, 'c-ink'), DEEP_INK);
  assert.equal(token(dim, 'c-fill'), DEEP_INK);
  assert.equal(token(dim, 'c-on-fill'), DEEP_PAPER);
});

// The dots are drawn twice, by the stylesheet on the cards and by
// render/dots.js on the canvas's cards, so the page's tile is held to the
// constants the canvas builds its own from: the pitch, the dot's place in the
// cell, its ink (the page's own) and its weight.
test("every page's dots are the canvas's: the pitch, the place, the ink and the weight", () => {
  for (const [page, body] of [['light', light], ['dark', dark], ['dim', dim]]) {
    const svg = decodeURIComponent(token(body, 'dots') || '');
    const at = k => svg.match(new RegExp(`<svg[^>]* ${k}='([^']+)'`))?.[1];
    const dot = k => svg.match(new RegExp(`<rect[^>]* ${k}='([^']+)'`))?.[1];
    assert.equal(+at('width'), SHELF_DOT, `${page} --dots is ${SHELF_DOT} wide`);
    assert.equal(+at('height'), SHELF_DOT, `${page} --dots is ${SHELF_DOT} tall`);
    assert.equal(+dot('x'), SHELF_DOT_AT, `${page} dot x`);
    assert.equal(+dot('y'), SHELF_DOT_AT, `${page} dot y`);
    assert.equal(+dot('width'), 1, `${page} dot is one pixel`);
    assert.equal(dot('fill'), token(body, 'c-ink'), `${page} dots in the page's ink`);
    assert.equal(+dot('fill-opacity'), SHELF_DOT_ALPHA, `${page} dot weight`);
    // the toast's, inked the other way round: the same tile in the paper
    const turned = decodeURIComponent(token(body, 'dots-on-fill') || '');
    assert.equal(turned, svg.replace(`fill='${token(body, 'c-ink')}'`, `fill='${token(body, 'c-paper')}'`), `${page} --dots-on-fill is --dots in the paper`);
  }
});

test('no coin or purple is written outside the tokens', () => {
  const lit = [...Object.values(COIN), ...Object.values(COIN_DARK), ...PURPLE.slice(1)].map(c => c.toLowerCase());
  for (const f of ['src/style.css', 'src/shelf.css', 'src/title.css']) {
    const text = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').toLowerCase()
      .replace(/(?:^|\n)(:root|html\.dark(?:\.dim)?)\s*\{[^}]*\}/g, '');
    const found = lit.filter(c => text.includes(c));
    assert.deepEqual(found, [], `${f} writes a palette color outside :root`);
  }
});

// The type scale and the grays words are set in, read off the tokens: the
// whole-page reading is src/selftest/textaa.js, and this is the same rule
// held where a token is written, before any page is stood up.
const hex = h => {
  h = h.replace('#', '');
  if (h.length === 3) h = [...h].map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
};
const lum = rgb => {
  const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const x = lum(hex(a)), y = lum(hex(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

test('no size on the type scale is under the floor', () => {
  const sizes = [...light.matchAll(/--fs-([a-z]+)\s*:\s*([\d.]+)px/g)];
  assert.ok(sizes.length >= 6, 'the scale is read');
  for (const [, n, px] of sizes) assert.ok(+px >= TEXT_FLOOR, `--fs-${n} is ${px}px, under ${TEXT_FLOOR}`);
});

test('every gray words are set in is AA on its own paper, light and dark', () => {
  for (const [page, body] of [['light', light], ['dark', dark], ['dim', dim]]) {
    for (const n of ['ink-2', 'ink-4', 'ink-5']) {
      const r = ratio(token(body, n), token(body, 'c-paper'));
      assert.ok(r >= TEXT_AA, `${page} --${n} is ${r.toFixed(2)}:1 on its paper`);
    }
  }
});
