// Who the two of them are (wardrobe.js; DESIGN.md, "Who you are"): a name
// and a role apiece, chosen on a new yard's steps and held from then on, and
// every story line that names either of them reading the role and the name
// the player chose.
//
// The page is the browser tier's (selftest/wardrobe.js); here the yard keeps
// what the page hands it, through the same calls the page makes, with the
// steps up as the page puts them (`S.naming`). A reload is the save's
// question, so each read goes through a write and a read with S emptied
// between. The cloud's half is cloud-sync.test.mjs's.
import { readFileSync } from 'node:fs';
import { group, ok, run } from './helpers.mjs';
import { S } from '../src/state.js';
import { NAME_MAX } from '../src/config.js';
import { persist, restore } from '../src/persist.js';
import { migrate } from '../src/migrations/index.js';
import { msg } from '../src/lang.js';
import { setName, setRole, stepRole, rollName, rollSquare, nameOf, roleOf, selfOf, cleanName, selvesLocked,
         storyLine, outfitOf, ROLES, ROLE_START, DEFAULTS } from '../src/wardrobe.js';
import { CREW_NAMES } from '../src/crew/names.js';
import { STEPS } from '../src/objectives.js';
import { SECTIONS } from '../src/upgrades.js';
import { INDEX } from '../src/config/index.js';

const KEY = 'boulder-clicker/v4';
const steps = on => { S.naming = on; };
const reload = () => { persist(); S.selves = null; S.outfits = null; S.pairIds = { you: null, sqouse: null }; restore(); };

group('a name and a role chosen on the steps are kept by the save, and held once the steps are done', async () => {
  steps(true);
  setName('you', '  Ada  Lovelace-the-1st ');
  setRole('you', 'ouse');
  setName('sqouse', 'Мария');
  stepRole('sqouse', 1);                       // wife -> ouse -> husband, from the start
  stepRole('sqouse', 1);
  const chosen = { you: { ...selfOf('you') }, sqouse: { ...selfOf('sqouse') } };
  reload();
  const back = { you: { ...selfOf('you') }, sqouse: { ...selfOf('sqouse') } };
  const openBack = !selvesLocked();
  steps(false);
  S.dressOffered = true;
  setName('you', 'somebody else');
  setRole('sqouse', 'wife');
  const held = nameOf('you') === back.you.name && roleOf('sqouse') === back.sqouse.role;
  return [
    ok(chosen.you.name === 'Ada Lovelace' && [...chosen.you.name].length <= NAME_MAX,
       'a name is trimmed, its spaces made one, and cut to NAME_MAX', JSON.stringify(chosen.you.name)),
    ok(chosen.sqouse.name === 'Мария' && chosen.sqouse.role === 'husband' && chosen.you.role === 'ouse',
       'a name in any script, and each role as stepped', JSON.stringify(chosen)),
    ok(JSON.stringify(back) === JSON.stringify(chosen), 'a save and a load hand both back', JSON.stringify(back)),
    ok(openBack, 'while the steps are up they can still be changed'),
    ok(held, 'once the steps are done, neither the name nor the role changes', JSON.stringify(selfOf('you')))
  ];
});

group('a name keeps letters and digits of any script, space, - and \', and nothing that could be markup', async () => {
  const cases = [
    ['<b>x</b>', 'bxb'], ['a\nb', 'ab'], ['  ', ''], ['é-mile o\'hara', 'é-mile o\'har'], ['名前テスト', '名前テスト'],
    ['x'.repeat(40), 'x'.repeat(NAME_MAX)], ['&amp;', 'amp'], ['{ $name }', 'name'], [null, '']
  ];
  const wrong = cases.filter(([raw, want]) => cleanName(raw) !== want).map(([raw, want]) => `${JSON.stringify(raw)} -> ${JSON.stringify(cleanName(raw))}, wanted ${JSON.stringify(want)}`);
  return [ok(!wrong.length, 'every case reads as it should', wrong.join('; '))];
});

group('the name die draws off the crew\'s own names, never the other square\'s', async () => {
  steps(true);
  let bad = 0, clash = 0, n = 0;
  for (let i = 0; i < 200; i++) {
    const r = ((i * 7919) % 1000) / 1000;
    setName('sqouse', CREW_NAMES[i % CREW_NAMES.length]);
    rollName('you', () => r);
    n++;
    if (!CREW_NAMES.includes(nameOf('you')) || [...nameOf('you')].length > NAME_MAX) bad++;
    if (nameOf('you') === nameOf('sqouse')) clash++;
  }
  const outfit = JSON.stringify(outfitOf('you'));
  let k = 0;
  rollSquare('you', () => [0.99, 0.5, 0.01, 0.7, 0.3, 0.6, 0.2][k++ % 7]);
  steps(false);
  return [
    ok(!bad, 'every roll is a crew name that fits', `${bad} of ${n}`),
    ok(!clash, 'and never the one the other square has', `${clash} of ${n}`),
    ok(JSON.stringify(outfitOf('you')) !== outfit && ROLES.includes(roleOf('you')), 'the whole square rolls its outfit and role too')
  ];
});

group('a save from before the names keeps each body and outfit under its new key, unnamed in today\'s roles', async () => {
  run(1);
  persist();
  const raw = JSON.parse(localStorage.getItem(KEY));
  const you = raw.pairIds.you;
  raw.pairIds = { her: 'u999', him: you };
  raw.outfits = { her: { ...DEFAULTS.sqouse, head: 'crown' }, him: { ...DEFAULTS.you, back: 'flag' } };
  delete raw.selves;
  raw.saveV = 23;
  const ran = migrate(raw).map(m => m.v);
  const moved = JSON.stringify(raw.pairIds) + JSON.stringify(Object.keys(raw.outfits));
  localStorage.setItem(KEY, JSON.stringify(raw));
  restore();
  return [
    ok(ran.includes(24), 'the migration runs', `${ran}`),
    ok(raw.pairIds.you === you && raw.pairIds.sqouse === 'u999' && !('her' in raw.pairIds) && !('him' in raw.outfits),
       'him is you and her is your sqouse', moved),
    ok(outfitOf('sqouse').head === 'crown' && outfitOf('you').back === 'flag', 'each wears what it wore',
       `${outfitOf('sqouse').head} ${outfitOf('you').back}`),
    ok(S.pairIds.you === you, 'and the yard reads the body back', JSON.stringify(S.pairIds)),
    ok(!nameOf('you') && !nameOf('sqouse') && roleOf('you') === ROLE_START.you && roleOf('sqouse') === ROLE_START.sqouse,
       'unnamed, in today\'s roles', JSON.stringify(S.selves))
  ];
});

// Every line the story says about either of them, by where the game reads it.
const WORDS = { wife: 'sqwife', ouse: 'sqouse', husband: 'sqhusband' };
const PRONOUN = { wife: 'her life', ouse: 'their life', husband: 'his life' };
const goal = SECTIONS.find(s => s.goal);
const index = key => INDEX.find(e => e.key === key);
const LINES = [
  ['obj-rock (the story card)', 'sqouse', () => STEPS.find(s => s.key === 'rock').say],
  ['obj-rescue (the story card)', 'sqouse', () => STEPS.find(s => s.key === 'rescue').say],
  ['obj-free (the story card)', 'you', () => STEPS.find(s => s.key === 'free').say],
  ['goal-title (the goal card)', 'sqouse', () => goal.title],
  ['idx-sqwife-name (the index)', 'sqouse', () => index('sqwife').name],
  ['idx-rock-text (the index)', 'sqouse', () => index('rock').text],
  ['saved-why (the rescue sheet)', 'sqouse', () => storyLine('saved-why-who', 'saved-why', 'sqouse')],
  ['demoend-why (the demo sheet)', 'sqouse', () => storyLine('demoend-why-who', 'demoend-why', 'sqouse')],
  ['freed-why (the end sheet)', 'you', () => storyLine('freed-why-who', 'freed-why', 'you')],
  ['row-props-note (the bench)', 'sqouse', () => storyLine('row-props-note-who', 'row-props-note', 'sqouse')],
  ['books-tally-under (the books)', 'sqouse', () => storyLine('books-tally-under-who', 'books-tally-under', 'sqouse')],
  ['books-tally-saved (the books)', 'sqouse', () => storyLine('books-tally-saved-who', 'books-tally-saved', 'sqouse')],
];

group('every story line names the one it is about by the role chosen, and by the name when there is one', async () => {
  const wrong = [];
  for (const [what, who, read] of LINES) {
    for (const role of ROLES) {
      for (const name of ['', 'Robin 2']) {
        S.selves = { you: { name: '', role: ROLE_START.you }, sqouse: { name: '', role: ROLE_START.sqouse }, [who]: { name, role } };
        const other = who === 'you' ? 'sqouse' : 'you';
        S.selves[other] = { name: 'Zed', role: ROLES.find(r => r !== role) };
        const line = String(read());
        const says = Object.entries(WORDS).filter(([, w]) => line.includes(w)).map(([k]) => k);
        if (name) {
          if (!line.includes(name) || says.length) wrong.push(`${what} ${role} named: "${line}"`);
        } else if (says.join() !== role) wrong.push(`${what} ${role}: "${line}"`);
        if (line.includes('Zed')) wrong.push(`${what}: names the other square, "${line}"`);
      }
    }
  }
  // the index's text: the pronoun follows the role, named or not
  for (const role of ROLES) {
    S.selves = { you: { name: '', role: ROLE_START.you }, sqouse: { name: 'Robin', role } };
    const text = index('sqwife').text;
    if (!text.includes(PRONOUN[role])) wrong.push(`idx-sqwife-text ${role}: "${text}"`);
  }
  S.selves = null;
  const today = LINES.map(([what, , read]) => [what, read()]);
  return [
    ok(!wrong.length, 'each line, in each role, with and without a name', wrong.join(' | ')),
    ok(today.every(([what, l]) => l === msg(what.split(' ')[0])),
       'unnamed in today\'s roles, every line reads as it did', JSON.stringify(today))
  ];
});

// The audit: anything in the language file that names either of them is one
// of the lines above, its older line, the role word itself, or neutral.
group('nothing else in the language file names a role', async () => {
  const text = readFileSync('locales/en.ftl', 'utf8');
  const ids = [...text.matchAll(/^([a-z][\w-]*) =/gm)].map(m => m[1]);
  const known = new Set(LINES.map(([w]) => w.split(' ')[0]).flatMap(id => [id, `${id}-who`])
    .concat(['idx-sqwife-text', 'idx-sqwife-text-who', 'ward-role-word', 'ward-sqouse', 'ward-build-sqouse']));
  const roled = ids.filter(id => /sqwife|sqhusband|\bher\b|\bhis\b|\bhim\b|\bshe\b|\bhe\b|\bwife\b|\bhusband\b/.test(msg(id, { so: 'wife', named: 'no', name: '' }) + msg(id, { so: 'husband', named: 'no', name: '' })));
  const stray = roled.filter(id => !known.has(id));
  return [
    ok(!stray.length, 'every line that names a role follows the choice', stray.join(', ')),
    ok(msg('ach-gotout-name') === 'you saved your sqouse', 'the achievement is neutral', msg('ach-gotout-name'))
  ];
});
