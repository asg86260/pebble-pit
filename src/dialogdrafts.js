// MOCK gods-opening-lines
// Drafts of God's opening lines at the meeting, for the owner to pick from
// and rewrite on the review bench (review "god's opening lines", branch
// a3-review-both, never merged). Each script is a beat's `lines` list
// ([{ who, id }], DESIGN.md, "A dialog system"); the words are the
// `draft-god-*` messages in locales/en.ftl, between the MOCK draft-god
// markers. The bench's dialog editor (review.html, tools/review-server.mjs)
// rewrites that block and the SCRIPTS block below together on a save, ids
// numbered in script order, so the two never disagree; the write to this file
// is what reloads the bench (REVIEW_RELOAD watches src/).

import { setBeatLines } from './actbeats.js';
import { lineRows } from './render/dialog.js';
import { parseMarks, FX_MARKS } from './dialogsauce.js'; // MOCK dialog-sauce

export const SCRIPTS = {
  // BEGIN SCRIPTS (written by the review bench's dialog editor)
  'draft-god-a': [
    { who: 'god', id: 'draft-god-a-1' },
    { who: 'god', id: 'draft-god-a-2' },
    { who: 'god', id: 'draft-god-a-3' },
    { who: 'god', id: 'draft-god-a-4' },
    { who: 'god', id: 'draft-god-a-5' }
  ],
  'draft-god-b': [
    { who: 'god', id: 'draft-god-b-1' },
    { who: 'god', id: 'draft-god-b-2' },
    { who: 'god', id: 'draft-god-b-3' },
    { who: 'god', id: 'draft-god-b-4' }
  ],
  'draft-god-c': [
    { who: 'god', id: 'draft-god-c-1' },
    { who: 'god', id: 'draft-god-c-2' },
    { who: 'god', id: 'draft-god-c-3' },
    { who: 'god', id: 'draft-god-c-4' },
    { who: 'god', id: 'draft-god-c-5' },
    { who: 'god', id: 'draft-god-c-6' }
  ],
  'draft-god-d': [
    { who: 'god', id: 'draft-god-d-1' },
    { who: 'god', id: 'draft-god-d-2' },
    { who: 'god', id: 'draft-god-d-3' },
    { who: 'god', id: 'draft-god-d-4' },
    { who: 'god', id: 'draft-god-d-5' },
    { who: 'god', id: 'draft-god-d-6' }
  ],
  'draft-god-e': [
    { who: 'god', id: 'draft-god-e-1' },
    { who: 'god', id: 'draft-god-e-2' },
    { who: 'god', id: 'draft-god-e-3' },
    { who: 'god', id: 'draft-god-e-4' },
    { who: 'god', id: 'draft-god-e-5' }
  ]
  // END SCRIPTS
};

// The meeting plays script `key` in place of the beat's own lines, until the
// next new game.
export const playScript = key => setBeatLines('meet-god', SCRIPTS[key]);

// For the bench's line editor: the rows a line wraps to in the bubble at the
// scene shots' 800 wide and a phone's 360, measured by the drawing itself.
// (MOCK dialog-sauce: measured without the effects' marks, which are not drawn)
// (and the effects' marks, for the editor's cheat sheet)
if (typeof window !== 'undefined') window.__dialogMarks = FX_MARKS;
if (typeof window !== 'undefined') window.__dialogFit = text => { const t = parseMarks(text).plain; return { wide: lineRows(t, 800), phone: lineRows(t, 360) }; };
