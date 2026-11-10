---
name: review-bench
description: Run the owner's review bench (review.html) for Pebble Pit -- serve it, put options on it (real-game scenes or plain-shape mocks), keep each card's status true, and act on the owner's notes the moment they land. Use whenever a look, layout or behavior change goes to the owner for a vote, when the owner says "the bench", "the review board", "i answered", "keep iterating", or asks why the bench is not updated.
---

# The review bench

The owner votes on review.html, one page for every review: a board of cards
(Waiting on you / Iterating / Building / Signed off), and per card its
options, each a scene the game frame stands up. Their answer is a note
("stop: pick this one" or "keep iterating" plus words). **The bench is the
owner's channel: a note there is a message to you, and nothing arrives in
chat when they write one.** Every failure this skill exists for was the
coordinator not looking at the bench the owner was looking at.

## 1. Serve it from your own checkout, on 5211

- One bench server, port **5211**, from **your session's own worktree** on a
  review branch (`review-bench`, or the review's own). Never 5183 (the
  owner's game) and never another agent's worktree: a hook forbids writing
  there, and going around it with the shell is going around the rule.
- Start it with full reloads on, or the owner's open page keeps the scene
  list it loaded with:
  `REVIEW_RELOAD=1 <main checkout>/node_modules/.bin/vite --port 5211 --strictPort --force`
  (run in the background). Restart it the same way after any change to
  config exports or `tools/review-server.mjs`; a TaskStop on the shell leaves
  vite orphaned, so stop the vite PID found by its command line.
- Moving the bench to another checkout: copy `shots/review/` (notes,
  status, changes, prints) across first, so the owner's history comes with it.
- Agents build in their own worktrees and push branches; you merge their
  branches into the review branch (or copy a mock file they wrote to the
  scratchpad into `mocks/`). They never write into the served tree.

## 2. Options are scenes

An option is a scene in `src/scenes.js` with `review: '<card title>'`,
`option: '<letter> <one line>'`, `say:` (one line under the frame) and
`stage: 'built: ...'` or `'mock: ...'` (the card says BUILT or MOCK from it).
A real-game option stands the game up in `run`. A plain-shape mock:

- is made with the `mock` skill's template and saved as `mocks/<name>.html`
  in the served tree;
- is laid over the frame by its scenes, **one option per scene**:
  `run: () => mockOver('/mocks/<name>.html?opt=A')`. The template's `?opt=`
  keeps that option's panel alone, scaled to the frame. Never point every
  option at the whole page (three panels stacked in one frame is wrong).
- `mockOver` is review-branch code (`// MOCK`, never on main). If the review
  branch lacks it, add it to `src/scenes.js` above the scenes:

  ```js
  // MOCK: a plain-shape page laid over the game for a review, gone with the next scene.
  function mockOver(src) {
    if (!window.__sceneMockWrapped) {
      const go = window.__scene;
      window.__scene = n => { document.getElementById('mock-over')?.remove(); return go(n); };
      window.__sceneMockWrapped = true;
    }
    document.getElementById('mock-over')?.remove();
    const f = document.createElement('iframe');
    f.id = 'mock-over'; f.src = src;
    f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:#fff';
    document.body.appendChild(f);
  }
  ```

Mark throwaway scenes and helpers `// MOCK`; they never land on main.

## 3. Status is yours to keep true

`node tools/review-status.mjs <served checkout> set "<card>" building|iterating "<what>"`
when work starts, `clear "<card>"` when it lands, and
`changed "<card>" "<one line>"` with each new round. **Always the served
checkout's path**: status written to any other checkout is invisible to the
owner (the card shows Waiting on you while you are still building).

## 4. Read the owner's notes before anything else

- Keep `node tools/review-wait.mjs <served checkout>` running in the
  background: it exits the moment a note lands, and its exit wakes you. Start
  it again each time it exits.
- At the start of every turn while a review is open,
  `tail shots/review/notes.jsonl` in the served checkout and act on any note
  newer than the last you handled: start the next round, set the card to
  building. Never tell the owner a card waits on them without reading it.

## 5. Before saying anything is ready

1. Load `http://localhost:5211/review.html` fresh, open the **board** view,
   and read the columns as the owner sees them.
2. Step to each new option and look at the frame (a screenshot at 1440x900):
   one option, the right one, nothing stacked or stale; no console errors.
3. Then report, in a few lines: what changed per card, each option in one
   line, your pick. Give the owner the 5211 address, never another.

## Briefing an agent for a bench round

Give it: the owner's note verbatim, the option it is iterating on, what to
make (real-game scenes on its own branch, or a mock to the scratchpad via
the `mock` skill, one panel per option labeled `A.`, `B.`, `C.`), the rule
that it must not write into the served tree or touch 5211, and the self-check
(shots at the owner's scale, light and dark). Pick the model by the task:
Sonnet for a mock or a scene from a clear spec, Opus for a diagnosis or a
design call.
