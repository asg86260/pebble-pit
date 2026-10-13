// Builds docs/l10n-pilot/report.html from the results: one self-contained
// page, no scripts from anywhere.
//
//   node docs/l10n-pilot/tools/report.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, LANGS, NAMES, SAMPLE } from './lib.mjs';

const R = path.join(ROOT, 'results');
const J = f => JSON.parse(fs.readFileSync(path.join(R, f), 'utf8'));
const mech = J('mechanical.json'), scores = J('scores.json'), renders = J('render.json'), notes = J('notes.json');
const back = f => { try { return J(path.join('back', f)); } catch { return {}; } };
const argosV = back('argos-versions.json');
if (process.env.MODELS_DIR) fs.copyFileSync(path.join(process.env.MODELS_DIR, 'versions.json'), path.join(R, 'engine.json'));
const engine = J('engine.json');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n1 = x => x == null ? '–' : x.toFixed(1);
const en = renders.en;
const MTKEY = { de: 'de', fr: 'fr', es: 'es', 'pt-BR': 'pt', ru: 'ru', 'zh-CN': 'zh-Hans', ja: 'ja', ko: 'ko' };
const maskLog = lang => { try { return fs.readFileSync(path.join(ROOT, 'machine', `${lang}.log.txt`), 'utf8').trim().split('\n').filter(Boolean); } catch { return []; } };

const count = (lang, v, ...kinds) => kinds.reduce((s, k) => s + (mech.langs[lang][v].count[k] || 0), 0);
const cell = (n, bad = true) => `<td class="num${n && bad ? ' bad' : ''}">${n}</td>`;

// Mechanical table.
let mechRows = '';
for (const lang of LANGS) for (const v of ['draft', 'machine']) {
  const m = mech.langs[lang][v];
  mechRows += `<tr${v === 'draft' ? ' class="first"' : ''}>${v === 'draft' ? `<th rowspan="2" scope="rowgroup">${esc(NAMES[lang])}<br><code>${lang}</code></th>` : ''}<td>${v === 'draft' ? 'A drafted' : 'B machine'}</td>`
    + `<td class="num${m.junk ? ' bad' : ''}">${m.junk ? m.junk + ' errors' : 'yes'}</td>`
    + cell(count(lang, v, 'variable', 'missing', 'render'))
    + cell(count(lang, v, 'markup'))
    + cell(count(lang, v, 'keys'))
    + cell(count(lang, v, 'english-left', 'untranslated'))
    + cell(count(lang, v, 'long'))
    + `<td class="num">${m.medianLength.toFixed(2)}</td></tr>`;
}

// Score table.
let scoreRows = '';
for (const lang of LANGS) {
  const s = scores.langs[lang];
  scoreRows += `<tr><th scope="row">${esc(NAMES[lang])}</th><td class="num">${n1(s.aArgos)}</td><td class="num">${n1(s.bArgos)}</td><td class="num">${s.argosWinsA ?? '–'} / ${s.argosWinsB ?? '–'}</td><td class="num dim">${n1(s.a)}</td><td class="num dim">${n1(s.b)}</td><td class="num dim">${n1(s.bself)}</td></tr>`;
}

// Per-language sections.
const better = w => w === 'A' ? '<span class="tag a">A</span>' : w === 'B' ? '<span class="tag b">B</span>' : '<span class="tag t">tie</span>';
let langSections = '';
for (const lang of LANGS) {
  const N = notes.langs[lang];
  const A = back(`draft-${lang}.json`), B = back(`machine-${lang}.json`), Aa = back(`argos-draft-${lang}.json`), Ba = back(`argos-machine-${lang}.json`);
  const tally = { A: 0, B: 0, tie: 0 };
  let rows = '';
  for (const id of notes.table) {
    const [w, note] = N.notes[id];
    tally[w]++;
    rows += `<tr><td><code class="id">${id}</code><div class="en">${esc(en[id])}</div></td>`
      + `<td lang="${lang}">${esc(renders[`${lang}.draft`][id])}<div class="bt">${esc(A[id])}</div>${Aa[id] ? `<div class="bt3">${esc(Aa[id])}</div>` : ''}</td>`
      + `<td lang="${lang}">${esc(renders[`${lang}.machine`][id])}<div class="bt">${esc(B[id])}</div>${Ba[id] ? `<div class="bt3">${esc(Ba[id])}</div>` : ''}</td>`
      + `<td>${better(w)} ${esc(note)}</td></tr>`;
  }
  const issues = mech.langs[lang].machine.issues.filter(i => i.kind !== 'long');
  const log = maskLog(lang);
  const longA = mech.langs[lang].draft.issues.filter(i => i.kind === 'long').map(i => i.id);
  const s = scores.langs[lang];
  langSections += `<section class="lang" id="${lang}">
<h3>${esc(NAMES[lang])} <code>${lang}</code></h3>
<p class="verdict"><strong>Verdict:</strong> ${esc(N.verdict)}</p>
<p class="meta">On these 15 lines: A better on ${tally.A}, B better on ${tally.B}, ${tally.tie} even. Argos chrF over all ${SAMPLE.length - 1} lines: A ${n1(s.aArgos)}, B ${n1(s.bArgos)}. Engine model: en→${MTKEY[lang]} ${esc(engine['en' + MTKEY[lang]] ?? '?')}; back: ${MTKEY[lang]}→en ${esc(engine[MTKEY[lang] + 'en'] ?? '?')}${argosV[lang] ? `; Argos ${esc(argosV[lang])}` : ''}.</p>
<div class="scroll"><table class="lines">
<thead><tr><th scope="col">English</th><th scope="col">A drafted <span class="key">back: Bergamot · <i>Argos</i></span></th><th scope="col">B machine <span class="key">back: by hand · <i>Argos</i></span></th><th scope="col">Which keeps meaning and voice</th></tr></thead>
<tbody>${rows}</tbody></table></div>
<details><summary>B's mechanical problems in ${esc(NAMES[lang])} (${issues.length + log.length})</summary><ul class="issues">
${issues.map(i => `<li><code>${i.id}</code> ${esc(i.msg)}</li>`).join('')}
${log.map(l => `<li class="mask">${esc(l)}</li>`).join('')}
</ul></details>
<details><summary>A's labels over the length budget (${longA.length})</summary><p class="small">${longA.map(id => `<code>${id}</code>`).join(' ') || 'none'}</p></details>
</section>`;
}

const totalLong = l => mech.langs[l].draft.count.long || 0;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Translation Pilot</title>
<meta name="description" content="Pebble Pit localization pilot: a drafted translation against Firefox Translations (Bergamot), 115 messages in eight languages.">
<style>
:root {
  --bg: #fbfbf9; --fg: #1d1d1b; --muted: #5d5d58; --line: #dcdcd6; --panel: #f1f1ec;
  --a: #1f5f8b; --a-bg: #e3eef6; --b: #8a4b12; --b-bg: #f6ebdf; --t-bg: #ebebe6; --bad: #a3271f; --bad-bg: #f8e4e1;
  --font: system-ui, -apple-system, "Segoe UI", "Noto Sans", "Noto Sans CJK SC", "Microsoft YaHei", "Yu Gothic", "Malgun Gothic", sans-serif;
  --mono: ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #161615; --fg: #e9e9e4; --muted: #a3a39c; --line: #3a3a37; --panel: #20201e;
    --a: #8cc2e8; --a-bg: #1b3142; --b: #e6b07c; --b-bg: #3b2a1a; --t-bg: #2b2b28; --bad: #f19b92; --bad-bg: #3d1f1c;
  }
}
:root[data-theme="dark"] {
  --bg: #161615; --fg: #e9e9e4; --muted: #a3a39c; --line: #3a3a37; --panel: #20201e;
  --a: #8cc2e8; --a-bg: #1b3142; --b: #e6b07c; --b-bg: #3b2a1a; --t-bg: #2b2b28; --bad: #f19b92; --bad-bg: #3d1f1c;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.55 var(--font); }
main { max-width: 1180px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { font-size: 28px; line-height: 1.2; margin: 0 0 6px; }
h2 { font-size: 20px; margin: 44px 0 10px; padding-top: 12px; border-top: 1px solid var(--line); }
h3 { font-size: 17px; margin: 0 0 8px; }
h3 code { font-weight: 400; color: var(--muted); }
p, li { max-width: 78ch; }
.lede { color: var(--muted); margin: 0 0 20px; }
code { font-family: var(--mono); font-size: 0.88em; }
.answer { background: var(--panel); border-left: 4px solid var(--a); padding: 14px 18px; border-radius: 4px; }
.answer p { margin: 6px 0; }
.caveat { background: var(--b-bg); border-left: 4px solid var(--b); padding: 12px 16px; border-radius: 4px; }
.scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid var(--line); border-radius: 6px; margin: 10px 0; max-width: 100%; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { text-align: left; vertical-align: top; padding: 7px 10px; border-bottom: 1px solid var(--line); }
thead th { background: var(--panel); font-weight: 600; position: sticky; top: 0; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
td.bad { color: var(--bad); background: var(--bad-bg); font-weight: 600; }
td.dim { color: var(--muted); }
tr.first td, tr.first th { border-top: 2px solid var(--line); }
.mech { min-width: 760px; }
.mech td:nth-child(2), .mech tr:not(.first) td:first-child { white-space: nowrap; }
.scores { min-width: 680px; }
.lines { min-width: 980px; }
.lines td { width: 25%; }
.lines td:first-child { width: 20%; }
.lines td:last-child { width: 30%; }
.id { color: var(--muted); font-size: 12px; }
.en { margin-top: 2px; }
.bt, .bt3 { margin-top: 6px; padding-top: 4px; border-top: 1px dashed var(--line); color: var(--muted); font-size: 13px; }
.bt3 { font-style: italic; border-top: none; padding-top: 0; margin-top: 2px; }
.key { display: block; font-weight: 400; color: var(--muted); font-size: 12px; }
.tag { display: inline-block; min-width: 2.4em; text-align: center; font-size: 12px; font-weight: 700; border-radius: 3px; padding: 0 5px; margin-right: 4px; }
.tag.a { color: var(--a); background: var(--a-bg); }
.tag.b { color: var(--b); background: var(--b-bg); }
.tag.t { color: var(--muted); background: var(--t-bg); }
.lang { margin: 36px 0; }
.verdict { margin: 4px 0; }
.meta, .small { color: var(--muted); font-size: 13px; }
details { margin: 6px 0; }
summary { cursor: pointer; color: var(--muted); font-size: 14px; }
.issues { font-size: 13px; padding-left: 20px; }
.issues li { margin: 2px 0; overflow-wrap: anywhere; }
.issues .mask { color: var(--bad); }
nav.toc { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 14px; margin: 8px 0 0; }
nav.toc a { color: var(--a); }
a { color: var(--a); }
@media (max-width: 600px) { h1 { font-size: 23px; } body { font-size: 14px; } }
</style>
</head>
<body>
<main>
<h1>Translation pilot</h1>
<p class="lede">Pebble Pit, ${SAMPLE.length} messages in eight languages, translated twice: <strong>A</strong> drafted by Claude to a style guide, and <strong>B</strong> machine-translated with Firefox Translations (Bergamot). Written ${new Date().toISOString().slice(0, 10)}.</p>

<div class="answer">
<p><strong>The short answer.</strong> On meaning and voice, the drafted version (A) is better in all eight languages, and the gap is widest in Japanese, Korean, Chinese and Russian. On word-for-word closeness to the English, the machine (B) scores higher, because it translates literally. The machine also makes errors no player should see: it misreads words with two meanings (save, scale, bolt), slips into the formal address, leaves English behind, and in Chinese and Japanese loses three of the numbers the game fills in. My recommendation is <strong>A for every language</strong>, with a native reviewer for each before anything ships. Use B only as a cross-check for omissions.</p>
<p><strong>Read this with care:</strong> I wrote version A, and I also back-translated version B, so I am grading my own work. The checks below that do not rely on my judgment are the mechanical table and the Argos column, where a third engine that wrote neither version back-translates both.</p>
</div>
<nav class="toc">${LANGS.map(l => `<a href="#${l}">${esc(NAMES[l])}</a>`).join('')}<a href="#full">the full file</a></nav>

<h2>What was compared</h2>
<ul>
<li><strong>The sample.</strong> ${SAMPLE.length} messages from <code>locales/en.ftl</code> (<code>docs/l10n-pilot/sample.txt</code> lists each one and why it was picked). It covers every group except the index, which the owner is rewriting, and every hard case in the file: the plural, the ordinal, the nested select and the numeric-key selects; messages with one to four variables; both kinds of markup (<code>&lt;br&gt;</code> and the <code>data-l10n-name</code> spans); an attribute-only message; the achievement jokes (pylons, "you're a wizard", "shaken baby syndrome", "we're so back"); one-word buttons; long sentences; and every invented term. The <code>[owner's words]</code> placeholders are left out.</li>
<li><strong>A, drafted.</strong> Written by Claude (Opus 5.5) to <code>locales/STYLE.md</code>: lowercase where the English is, informal address, the player never given a gender, jokes swapped for the local equivalent, and a glossary that renders sqwife and sqhusband as blends of each language's own words for "square" and "wife" or "husband". In <code>docs/l10n-pilot/draft/</code>. Written once and not edited after the back-translations came in, except to shorten five labels over the length budget (before any scoring).</li>
<li><strong>B, machine.</strong> Firefox Translations: Mozilla's Bergamot models, the ones Firefox downloads, taken from its public Remote Settings model registry and run offline in node through <code>@browsermt/bergamot-translator</code> 0.4.9 (wasm). No account, no key, nothing scraped. Every language was available. Fluent was protected: each select is split into whole sentences, one per plural category of the target language, with a number from that category put in so the engine inflects for it; every variable and markup element goes in as a number and comes back as itself; the selects are then rebuilt. The only post-edits are first-letter case and leaving the game's name alone. In <code>docs/l10n-pilot/machine/</code>.</li>
<li><strong>The referees.</strong> Each version is back-translated by something that did not write it: A by Bergamot, B by me, literally, with errors kept and notes in [brackets]. Then a <strong>third engine, Argos Translate</strong> (OpenNMT models from the Argos index, offline), back-translates <em>both</em>. That column is the only symmetric one. Argos has no usable Spanish model (es→en 1.9 repeats one token forever under the installed CTranslate2, so Spanish has no Argos score), and its Japanese and Korean models (1.1) are small and noisy, which pulls both versions' scores down there. Scores are chrF (character n-gram F-score, 0 to 100) against the English, with variables filled the same way on both sides (a number is 5, a word is X).</li>
</ul>

<h2>Mechanical checks</h2>
<p>Every file was parsed with the strict <code>@fluent/syntax</code> parser and the runtime <code>@fluent/bundle</code>. Then: does every variable the English shows reach every translated line; is the markup identical; are the plural keys the language's own CLDR categories; is any English left (a line identical to the English, or English words in it, not counting true cognates); and are labels up to 20 columns more than 40% longer (a CJK character counts as two columns, as in the game's monospace face).</p>
<div class="scroll"><table class="mech">
<thead><tr><th scope="col">language</th><th scope="col">version</th><th scope="col">parses</th><th scope="col" class="num">variables lost</th><th scope="col" class="num">markup wrong</th><th scope="col" class="num">bad plural keys</th><th scope="col" class="num">English left</th><th scope="col" class="num">short labels &gt;40% longer</th><th scope="col" class="num">median length vs English</th></tr></thead>
<tbody>${mechRows}</tbody></table></div>
<p>Both versions parse in every language and keep the markup. <strong>B loses variables in Chinese and Japanese</strong>, where the engine writes a number as a word (两天 for "2 days"; 第一 for the ordinal) or fuses it into another word, so those lines would show a fixed number whatever the game passed in. The pipeline logs this and does not repair it (the list is under each language). B's English-left count includes "sqwife" and "shusband" left in place and whole lines left untranslated (Korean <code>held-keys</code>, Russian and Korean <code>casino-drop</code>). A's long labels are mostly German, French and Portuguese words that cannot be cut without losing meaning (<code>title-play</code> "spielen", <code>played-hm</code>'s units). The style guide's budget of a third extra is tight for them, and the owner should decide whether to loosen it or shorten the words.</p>

<h2>Back-translation scores</h2>
<div class="scroll"><table class="scores">
<thead><tr><th scope="col">language</th><th scope="col" class="num">A, Argos</th><th scope="col" class="num">B, Argos</th><th scope="col" class="num">lines A / B ahead (Argos, by 5+)</th><th scope="col" class="num">A, Bergamot</th><th scope="col" class="num">B, by hand</th><th scope="col" class="num">B, its own engine</th></tr></thead>
<tbody>${scoreRows}</tbody></table></div>
<div class="caveat">
<p><strong>What these numbers do and do not say.</strong> Back-translation rewards literalness, not voice. A translation that turns "it never rains but it pours" into the local proverb is right, and it scores low, because the proverb comes back as different English. A translation that copies the English word for word is wrong in the language, and it scores high, because it comes back as the same English. B is literal by nature, so B leads on every column here. That lead is real, but it measures closeness to the English words, not correctness.</p>
<p>The grey columns are not symmetric. A was back-translated by an engine that adds its own errors ("Spielstände" came back as "Playstands"). B was back-translated by me, and I know the English, which pulls B's back-translation toward the source. "B, its own engine" shows how far an engine flatters its own output on a round trip. Only the two Argos columns use the same referee for both versions.</p>
</div>

<h2>Line by line</h2>
<p>For each language, the same 15 lines, chosen for the hard cases: sqwife and sqhusband, a wrong-speaker trap, symbols, a plural, the tagline, sarcasm, a quotation joke, a dark joke, an idiom, colloquial voice, a word with two meanings ("bolt"), a label before a time, a machine name in a variable, and an article before a variable. Under each translation is its back-translation (Bergamot or by hand, then Argos in italics). The last column says which version keeps the meaning and the voice better, and why.</p>
${langSections}

<h2 id="full">The full file</h2>
<p><strong>Recommendation:</strong> draft all 964 messages (minus the owner's placeholders and the index being rewritten) as version A, to <code>locales/STYLE.md</code>, in every language. Then:</p>
<ol>
<li><strong>The owner approves the glossary first</strong>: above all the sqwife and sqhusband blends, which appear on the rescue sheet, the objectives and the books, and the German all-lowercase nouns. Changing a term after 964 lines are written costs a re-pass.</li>
<li><strong>Draft in batches by group</strong> (sheets, boards, crew, the deep…), about 120 messages per batch per language. This pilot took one sitting for 115 × 8. The rest is about eight such passes, plus a consistency pass per language against the glossary.</li>
<li><strong>Run the pilot's checks on every batch</strong>: <code>check.mjs</code> (parse, variables, markup, CLDR keys, English left, length) catches the mechanical failures automatically. Run Bergamot over the same batch as a <em>second opinion only</em>: a line where A's Bergamot back-translation drifts far from the English is worth a second look for an omission. Never let B's text replace A's.</li>
<li><strong>A native reviewer per language</strong> (DESIGN.md, phase two) reads the drafts with the English comments beside them before anything ships. The pilot's own uncertain calls, marked in the notes: the localized StarCraft pylon line in German and Portuguese, the "potion seller" meme everywhere, French non-breaking spaces before <code>: ? !</code>, and whether neutral Spanish should lean Latin American.</li>
<li><strong>What the words cannot fix</strong>: the casino marquee and the number font draw only ASCII capitals (no Ü, Á, Ё, nor any CJK), so <code>casino-drop</code> and <code>serp-level</code> need glyphs drawn (DESIGN.md, Faces). <code>$name</code>, <code>$who</code> and <code>$place</code> arrive in the nominative case, so German, Russian and Korean lines around them have to be worded to fit. A Fluent term or a case attribute per name would fix that properly, and it is a design decision for the owner.</li>
</ol>

<h2>Reproducing it</h2>
<p class="small">All tools are in <code>docs/l10n-pilot/tools/</code>. Their packages and the models stay outside the repo (<code>PILOT_DEPS</code>, <code>MODELS_DIR</code>, <code>ARGOS_PACKAGES_DIR</code>). The order: <code>models.mjs</code> (fetch the Bergamot models), <code>english.mjs</code>, <code>machine.mjs &lt;lang&gt;</code>, <code>annotate.mjs &lt;lang&gt;</code>, <code>check.mjs</code>, <code>back.mjs &lt;lang&gt; [machine]</code>, <code>argos_back.py</code>, <code>score.mjs</code>, <code>report.mjs</code>. The bergamot-translator 0.4.9 npm package needs two local patches to run in node on Windows: a <code>{"type":"commonjs"}</code> package.json in its <code>worker/</code> folder, and <code>pathToFileURL</code>/<code>fileURLToPath</code> for the worker's own location. Its default registry splits <code>zh-Hans</code> wrongly, which <code>engine.mjs</code> works around.</p>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'report.html'), html);
console.log('report.html', html.length, 'bytes');
