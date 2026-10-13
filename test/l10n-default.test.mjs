// Which language a player who has not chosen one reads (DESIGN.md,
// "Localization phase two", section 1): their choice, else Steam's language
// for the game, else the system's languages, on the desk; else the browser's
// languages, on the web; else English -- each only if it names a ready
// language with a file. And the shell, which says its own few words before
// the page exists, reaches the same answer from the same table.
//
// Every input is handed in (src/languages.js is pure), so the Steam Deck in
// Brazil and the browser in Taipei are a line each. No yard.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pickLanguage, codeForTag, codeForSteam } from '../src/languages.js';

const require = createRequire(import.meta.url);
const shell = require('../electron/lang.cjs');
const TABLE = JSON.parse(readFileSync('locales/languages.json', 'utf8'));

// The table as it will be once every language is approved, and every file.
const ALL_READY = TABLE.map(r => ({ ...r, ready: true }));
const ALL_FILES = TABLE.map(r => r.code);
const pick = (o, table = ALL_READY, files = ALL_FILES) => pickLanguage({ files, table, ...o });

test('the browser\'s tags map to the nine', () => {
  const want = {
    'en-US': 'en', 'en-GB': 'en', en: 'en',
    'zh-CN': 'zh-CN', 'zh-SG': 'zh-CN', zh: 'zh-CN', 'zh-Hans': 'zh-CN', 'zh-Hans-CN': 'zh-CN', zh_CN: 'zh-CN',
    'zh-TW': null, 'zh-HK': null, 'zh-Hant': null, 'zh-Hant-TW': null,
    'pt-BR': 'pt-BR', 'pt-PT': 'pt-BR', pt: 'pt-BR',
    'es-ES': 'es', 'es-419': 'es', 'es-MX': 'es',
    ru: 'ru', 'ru-RU': 'ru', 'de-AT': 'de', 'fr-CA': 'fr', 'ja-JP': 'ja', 'ko-KR': 'ko',
    'nl-NL': null, 'english': null, '': null
  };
  for (const [tag, code] of Object.entries(want)) assert.equal(codeForTag(tag, TABLE), code, tag);
});

test('Steam\'s names map to the nine', () => {
  const want = { english: 'en', schinese: 'zh-CN', tchinese: null, russian: 'ru', spanish: 'es', latam: 'es',
    brazilian: 'pt-BR', portuguese: null, german: 'de', french: 'fr', japanese: 'ja', koreana: 'ko', korean: null };
  for (const [name, code] of Object.entries(want)) assert.equal(codeForSteam(name, TABLE), code, name);
});

test('the order: a choice, Steam, the system on the desk, the browser on the web, English', () => {
  // A choice wins over everything, ready or not, if its file exists.
  assert.equal(pick({ chosen: 'fr', desk: { steam: 'german', system: ['ja-JP'] } }), 'fr');
  assert.equal(pick({ chosen: 'en', browser: ['de-DE'] }), 'en');
  assert.equal(pick({ chosen: 'xx', browser: ['de-DE'] }), 'de', 'a choice with no file is no choice');
  // On the desk: Steam, then the system, and never the browser.
  assert.equal(pick({ desk: { steam: 'schinese', system: ['de-DE'] }, browser: ['fr'] }), 'zh-CN');
  assert.equal(pick({ desk: { steam: null, system: ['nl-NL', 'pt-PT'] }, browser: ['fr'] }), 'pt-BR');
  assert.equal(pick({ desk: { steam: 'english', system: ['ko-KR'] } }), 'en', 'Steam in English is English');
  assert.equal(pick({ desk: { steam: null, system: [] }, browser: ['fr'] }), 'en');
  // On the web: the browser's list in order.
  assert.equal(pick({ browser: ['zh-TW', 'ja', 'en'] }), 'ja', 'Traditional Chinese goes on down the list');
  assert.equal(pick({ browser: ['zh-TW'] }), 'en');
  assert.equal(pick({ browser: ['es-419', 'en'] }), 'es');
  assert.equal(pick({}), 'en');
});

test('a language not ready, or with no file, is passed over for the next', () => {
  // Today's table: only English is ready, so nobody follows into a draft.
  assert.equal(pick({ browser: ['de-DE', 'fr'] }, TABLE), 'en');
  assert.equal(pick({ desk: { steam: 'schinese', system: ['ja'] } }, TABLE), 'en');
  // One ready: a reader whose first is not ready gets their second.
  const frOnly = TABLE.map(r => ({ ...r, ready: r.code === 'en' || r.code === 'fr' }));
  assert.equal(pick({ browser: ['de-DE', 'fr-FR'] }, frOnly), 'fr');
  // Ready, but no file in this build.
  assert.equal(pick({ browser: ['de-DE'] }, ALL_READY, ['en']), 'en');
});

test('the shell reaches the page\'s answers from the same table', () => {
  const tags = ['en-US', 'zh-Hans-CN', 'zh-TW', 'pt-PT', 'es-419', 'ja-JP', 'ko', 'nl', 'de_DE', ''];
  for (const t of tags) assert.equal(shell.codeForTag(t, TABLE), codeForTag(t, TABLE), t);
  for (const n of ['english', 'schinese', 'tchinese', 'latam', 'koreana', null]) assert.equal(shell.codeForSteam(n, TABLE), codeForSteam(n, TABLE), String(n));
  // Its pick: Steam, then the system, ready only, with a file on disk.
  assert.equal(shell.pickShellLanguage({ steam: 'german', system: ['fr'], table: TABLE }), 'en', 'none ready yet');
  assert.equal(shell.pickShellLanguage({ steam: null, system: [], table: TABLE }), 'en');
  const onDisk = readdirSync('locales').filter(f => f.endsWith('.ftl')).map(f => f.slice(0, -4));
  for (const s of [{ steam: 'english', system: ['de'] }, { steam: null, system: ['en-GB'] }, { steam: 'japanese', system: [] },
    { steam: 'tchinese', system: ['zh-Hans-CN', 'ko-KR'] }, { steam: null, system: ['ko'] }]) {
    assert.equal(shell.pickShellLanguage({ ...s, table: ALL_READY }), pick({ desk: s }, ALL_READY, onDisk), JSON.stringify(s));
  }
});

test('the shell\'s words come from the language file, English unchanged', () => {
  const say = shell.sayer('en');
  assert.equal(say('title-doctitle'), 'Pebble Pit', 'the window\'s title');
  const steam = require('../electron/steam.cjs');
  assert.deepEqual(steam.CARRY_WORDS, {
    title: "[owner's words: the carry-over offer's title]",
    message: "[owner's words: a save from the demo was found -- carry it on?]",
    yes: "[owner's words: carry it on]",
    no: "[owner's words: start fresh]"
  });
  assert.deepEqual(steam.carryWords(shell.sayer('xx')), steam.CARRY_WORDS, 'a language with no file says it in English');
});

// The preference: `language`, null to follow. A player whose preferences
// were kept before phase two (no `language` key; most carry `lang: 'en'`)
// goes on in English; a new player follows.
async function prefsWith(raw) {
  const store = new Map(raw == null ? [] : [['boulder-clicker/prefs', raw]]);
  const was = globalThis.localStorage;
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  try {
    const m = await import(`../src/prefs.js?raw=${encodeURIComponent(raw ?? 'none')}`);
    return { pref: m.pref };
  } finally { globalThis.localStorage = was; }
}

test('the language preference: new players follow, players from before stay English', async () => {
  assert.equal((await prefsWith(null)).pref('language'), null, 'no preferences: follow');
  const old = await prefsWith(JSON.stringify({ muted: true, lang: 'en' }));
  assert.equal(old.pref('language'), 'en', 'kept before 2026-10-13: English');
  assert.equal(old.pref('lang'), undefined, 'the old key is retired');
  assert.equal((await prefsWith(JSON.stringify({ dark: true }))).pref('language'), 'en', 'from before phase one too');
  const now = await prefsWith(JSON.stringify({ muted: true, language: null }));
  assert.equal(now.pref('language'), null, 'written since: still following');
  assert.equal((await prefsWith(JSON.stringify({ language: 'ja' }))).pref('language'), 'ja', 'a choice is kept');
});
