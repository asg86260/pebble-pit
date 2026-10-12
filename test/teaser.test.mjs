// The free build's teaser (DESIGN.md, "Three builds"): the snatch plays, the
// story's line goes on to the wizards, the portal is never offered, and the
// wizards' board opened is the end -- the teaser's sheet stands. The snatch is
// the setup (`__snatch`); the board is opened the way a player opens it.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { objective } from '../src/objectives.js';
import { showPanel } from '../src/board.js';

const S = yard.S;
const shown = key => !!window.__rows().find(r => r.key === key && r.shown);

group('on the free build the snatch plays, the portal is never offered, and the wizards end it', async () => {
  window.__deepOn(false);
  window.__reset();
  window.__snatch({ played: true });
  // the snatch's hook stands the portal too; the story here is the moment
  // after the snatch, before anybody has asked the wizards anything
  S.portalOpen = false; S.portalPour = 0; S.askedWizards = false;
  window.__meteor();                       // the tower
  window.__crew(1, 0, 0, 0, 0, 1);         // and a wizard in it
  run(2);
  const line = objective();
  const portal = shown('portal');
  showPanel('tower', true);
  runUntil(() => S.beat.sheet === 'teaseend', 30);
  const sheet = S.beat.sheet;
  const after = objective();
  window.__deepOn(null);
  window.__reset();
  return [
    ok(S.snatched !== undefined, 'the snatch has played'),
    ok(line && (line.key === 'talk' || line.key === 'tower'), "the story's line goes on to the wizards", line && line.key),
    ok(!portal, 'the portal is never offered'),
    ok(sheet === 'teaseend', "the wizards' board opened, the teaser's sheet stands", String(sheet)),
    ok(!after || (after.key !== 'portal' && after.key !== 'free'), 'and the line never asks for the portal', after && after.key)
  ];
});

group('the paid game is unchanged: the portal is offered after the snatch', async () => {
  window.__deepOn(true);
  window.__reset();
  window.__snatch({ played: true });
  S.portalOpen = false; S.portalPour = 0; S.askedWizards = false;
  window.__meteor();
  window.__crew(1, 0, 0, 0, 0, 1);
  run(2);
  showPanel('tower', true);
  run(2);
  const portal = shown('portal'), sheet = S.beat.sheet;
  window.__deepOn(null);
  window.__reset();
  return [
    ok(portal, 'the portal is offered'),
    ok(sheet !== 'teaseend' && !S.beatsDone.includes('teaseend'), 'and no teaser sheet')
  ];
});
