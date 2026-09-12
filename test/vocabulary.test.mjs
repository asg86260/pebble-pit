// The yard's vocabulary, and the one rule that keeps it in one place.
//
// Renaming three jobs -- miners to rock hands, labbers to scholars, scrubbers to
// air purifiers -- touched seventy-six files, because the names were written out
// as bare strings at two hundred-odd call sites. They live in src/jobs.js now,
// and this is the check that keeps them there: a raw `'rockhand'` written into a
// module tomorrow fails here, with the file and the word, rather than being
// found by the next person who tries to rename something.
//
// A string is also a thing you can misspell in silence. `w.type === 'rockhnd'`
// is a comparison that is simply false for ever; `TYPE.ROK` is `undefined` and
// wrong loudly, at the first body it is asked about.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { group, ok } from './helpers.mjs';
import { TYPE, JOB, JOB_OF, TYPE_OF, jobSaid } from '../src/jobs.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const files = [];
const walk = d => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.js')) files.push(p);
  }
};
walk(SRC);

// jobs.js is where the words are spelled, so it is allowed to spell them. The
// browser suite pins the words a player actually reads, on purpose -- that is
// the contract, not a shortcut. And persist.js keeps the *old* names, which are
// history rather than vocabulary: a save written under them still has to load.
const spelling = f => f.endsWith('jobs.js') || f.includes('selftest');

const WORDS = [...new Set([...Object.values(TYPE), ...Object.values(JOB)])];
const isComment = l => { const t = l.trimStart(); return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'); };

group('the job names are spelled in one file and referred to everywhere else', async () => {
  const loose = [];
  for (const f of files) {
    if (spelling(f)) continue;
    const lines = readFileSync(f, 'utf8').split(/\r?\n/);
    lines.forEach((l, i) => {
      if (isComment(l)) return;                       // prose says the words, and should
      for (const w of WORDS) {
        if (new RegExp(`(['"])${w}\\1`).test(l)) loose.push(`${relative(SRC, f)}:${i + 1} ${w}`);
      }
    });
  }

  // And the tables agree with each other, both ways round, with nothing missing
  // on either side -- they are built from one list, so this is really a check
  // that the list is still being built rather than typed.
  const roundTrip = Object.values(TYPE).every(t => TYPE_OF[JOB_OF[t]] === t);
  const sameSize = Object.keys(TYPE).length === Object.keys(JOB).length &&
                   Object.keys(JOB_OF).length === Object.keys(TYPE).length;

  return [
    ok(loose.length === 0, 'no module writes a job name out as a bare string',
       loose.slice(0, 6).join(' | ') || 'none'),
    ok(roundTrip, 'every type maps to a job and back to itself'),
    ok(sameSize, 'and the three tables are the same size',
       `${Object.keys(TYPE).length}/${Object.keys(JOB).length}/${Object.keys(JOB_OF).length}`),
    // The jobs whose said name is not their key, and the rest that are said as
    // they are spelled. This is the thing "labbers" was a symptom of: a key you
    // could not change without changing the word a player reads -- and it is
    // what let the rock's gang become the diggers and the cut's the miners
    // without a save field moving.
    ok(jobSaid(JOB.ROCK) === 'diggers' && jobSaid(JOB.QUARRY) === 'miners' && jobSaid(JOB.PURIFY) === 'air purifiers',
       'the renamed jobs are said in their own words', `${jobSaid(JOB.ROCK)} / ${jobSaid(JOB.QUARRY)} / ${jobSaid(JOB.PURIFY)}`),
    ok(jobSaid(JOB.HAUL) === 'haulers', 'and the haulers are haulers, not "the crew"',
       jobSaid(JOB.HAUL))
  ];
});
