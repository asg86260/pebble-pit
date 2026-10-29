// The review bench's half on the dev server: the owner's decision, written
// where an agent can wait for it.
//
// review.html posts a note (the review, the option on screen, stop or keep
// going, and what to change) and it is appended as one JSON line to
// shots/review/notes.jsonl -- under shots/, so git and the file watcher both
// leave it alone and a note never reloads the page. An agent waits on that
// file with tools/review-wait.mjs, which returns the moment a line lands.
// Serve only: a build has no bench and nothing here ships.

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { prints } from './review-prints.mjs';
import { readStatus, readChanges } from './review-status.mjs';

export const notesPath = root => join(root, 'shots', 'review', 'notes.jsonl');

export function reviewPlugin(root) {
  const file = notesPath(root);
  const src = join(root, 'src').replace(/\\/g, '/').toLowerCase();
  return {
    name: 'boulder-review-notes',
    apply: 'serve',
    // A review server (REVIEW_RELOAD=1) reloads the page on every source
    // edit: Vite can see the change and still decide no update is needed (it
    // did, in a worktree), and the owner's open review then never shows it.
    // The review page stands its option up again on the reload.
    hotUpdate({ file }) {
      if (!process.env.REVIEW_RELOAD || this.environment.name !== 'client') return;
      if (!file.replace(/\\/g, '/').toLowerCase().startsWith(src)) return;
      this.environment.hot.send({ type: 'full-reload' });
      return [];
    },
    configureServer(server) {
      // The page posts its open reviews (each option's scene fields and
      // source, the branches the review names, what it supersedes) and gets
      // back each option's print and when it first appeared, and which
      // reviews have landed (tools/review-prints.mjs), so it can mark what
      // changed since the owner last looked and put away what is done. Registered before /__review, which would take
      // this path as its own prefix.
      server.middlewares.use('/__review/prints', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let s = '';
        req.on('data', c => { s += c; if (s.length > 4e6) req.destroy(); });
        req.on('end', () => {
          let out;
          try {
            // branch names go to git as arguments, so only a branch's characters pass
            const names = a => (Array.isArray(a) ? a : []).map(String);
            const reviews = JSON.parse(s).reviews.map(r => ({ slug: String(r.slug), name: String(r.name || r.slug),
              branches: names(r.branches).filter(b => /^[\w][\w./-]*$/.test(b)), supersedes: names(r.supersedes),
              options: r.options.map(o => ({ scene: String(o.scene), text: String(o.text) })) }));
            out = prints(root, reviews);
          } catch (e) { res.statusCode = 400; res.end(String(e.message)); return; }
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(out));
        });
      });
      // The board's other inputs, in one GET: what agents are doing
      // (shots/review/status.json, written by tools/review-status.mjs) and the
      // owner's notes so far, from which the page works out who waits on whom.
      server.middlewares.use('/__review/status', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end(); return; }
        let notes = [];
        try {
          notes = readFileSync(file, 'utf8').split('\n').filter(Boolean)
            .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).slice(-400);
        } catch {}
        res.setHeader('content-type', 'application/json');
        res.setHeader('cache-control', 'no-store');
        res.end(JSON.stringify({ entries: readStatus(root), notes, changes: readChanges(root) }));
      });
      server.middlewares.use('/__review', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let s = '';
        req.on('data', c => { s += c; if (s.length > 64e3) req.destroy(); });
        req.on('end', () => {
          let note;
          try { note = JSON.parse(s); } catch { res.statusCode = 400; res.end('not json'); return; }
          const line = { at: new Date().toISOString(), review: String(note.review || ''), option: String(note.option || ''),
                         verdict: note.verdict === 'stop' ? 'stop' : 'keep', say: String(note.say || '') };
          mkdirSync(dirname(file), { recursive: true });
          appendFileSync(file, JSON.stringify(line) + '\n');
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
        });
      });
    }
  };
}
