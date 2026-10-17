// Builds index.html: src/main.js bundled with the game's REAL wardrobe drawing
// code (src/render/wardrobe.js, wardheads.js, wardaura.js and the item lists
// in src/wardrobe.js), so every "today" panel is the game's own draw, and
// inlined into src/page.html. The language and preference modules are
// stubbed: the mock needs no words from the locale and must always draw on
// the light page (the dark page and the deep are made here, from the light
// draw, as the game makes them).
//
//   node docs/mocks/wardrobe-polish-2026-10-16/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const esbuild = await import(pathToFileURL(resolve(root, '../../../node_modules/esbuild/lib/main.js')).href)
  .catch(() => import(pathToFileURL('C:/git/boulder-clicker/node_modules/esbuild/lib/main.js').href));

const LANG_STUB = `export const msg = id => id; export const msgOr = id => id; export const FACE = {};
export const placeOf = () => null; export const writeInto = () => {}; export const has = () => false;
export const LANG = 'en'; export const LANGS = ['en']; export const LANGUAGES = []; export const chooseLang = () => {};`;

const r = await esbuild.build({
  entryPoints: [resolve(here, 'src/main.js')],
  bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error',
  define: { 'import.meta.env.DEV': 'false' },
  plugins: [{
    name: 'stubs',
    setup(b) {
      b.onLoad({ filter: /[\\/]src[\\/]lang\.js$/ }, () => ({ contents: LANG_STUB, loader: 'js' }));
      b.onLoad({ filter: /[\\/]src[\\/]prefs\.js$/ }, a => ({
        contents: readFileSync(a.path, 'utf8').replace('export function dark() {', 'export function dark() { return false;'),
        loader: 'js' }));
    },
  }],
});
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const page = readFileSync(resolve(here, 'src/page.html'), 'utf8').replace('/*BUNDLE*/', () => js);
writeFileSync(resolve(here, 'index.html'), page);
console.log('index.html', (page.length / 1024).toFixed(0) + ' KB');
