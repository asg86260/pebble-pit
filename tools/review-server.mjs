// The review bench's half on the dev server: the owner's decision, written
// where an agent can wait for it.
//
// review.html posts a note (the review, the option on screen, stop or keep
// going, and what to change) and it is appended as one JSON line to
// shots/review/notes.jsonl -- under shots/, so git and the file watcher both
// leave it alone and a note never reloads the page. An agent waits on that
// file with tools/review-wait.mjs, which returns the moment a line lands.
// Serve only: a build has no bench and nothing here ships.

import { appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

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
