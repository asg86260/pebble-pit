// Acts 3 and 4, the scaffold (acts.js; DESIGN.md, "Acts 3 and 4: the afterlife
// and hell"). Nothing a player can reach plays yet, so nothing here is reached
// the way a player would: the switches, the dev travel and the owed triggers
// are the handles, and what is checked is that the scaffold holds -- with the
// switches off nothing of either act is reachable and the save is untouched;
// with them on each place is stepped every frame, on screen or not, the yard
// runs on under the camera in either, and each act's facts round-trip a save.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { BEATS } from '../src/beats.js';
import { AFTER_STORY } from '../src/after/story.js';
import { HELL_STORY } from '../src/hell/story.js';
import { afterFloor, afterX0, afterX1 } from '../src/after/place.js';
import { hellFloor, hellX0, hellX1 } from '../src/hell/place.js';
import { HELL_FLOOR_MARGIN } from '../src/config.js';
import { actPlace } from '../src/acts.js';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const ACT_KEYS = [...Object.keys(AFTER_STORY), ...Object.keys(HELL_STORY)];
const actsDone = () => S.beatsDone.filter(k => ACT_KEYS.includes(k));
const saved = () => JSON.parse(localStorage.getItem(KEY));

group('with the switches off, nothing of acts 3 and 4 is reachable', async () => {
  window.__actsOn(false);
  window.__crew(2, 1);
  for (const k of ACT_KEYS) window.__actOwe(k);
  const frames0 = window.__actFrames();
  const to = [window.__goPlace('after'), window.__goPlace('hell'), window.__view('after'), window.__view('hell')];
  run(6);
  const frames1 = window.__actFrames();
  yard.persist();
  const blob = saved();
  // A save a build with the acts on left in the afterlife, read by one with
  // them off: back in the yard on the first frame.
  blob.view = 'after';
  localStorage.setItem(KEY, JSON.stringify(blob));
  yard.restore();
  run(1 / 60);
  const back = S.view;
  window.__actsOn(null);
  window.__actOwe(null);
  return [
    ok(to.every(v => v === 'yard'), 'no way into either place takes the camera there', to.join(' ')),
    ok(S.view === 'yard' && back === 'yard', 'and a save left in one comes back to the yard', back),
    ok(actsDone().length === 0 && !Object.values(S.beat).some(k => ACT_KEYS.includes(k)),
       'no act beat plays, every trigger owed', actsDone().join(' ')),
    ok(frames1.after === frames0.after && frames1.hell === frames0.hell, 'neither place is stepped',
       `${JSON.stringify(frames0)} -> ${JSON.stringify(frames1)}`),
    ok(S.after === null && S.hell === null && blob.after === null && blob.hell === null,
       'and the save carries nothing of either act', `${JSON.stringify(blob.after)} ${JSON.stringify(blob.hell)}`)
  ];
});

group('with the switches on, each place steps every frame, on screen or not', async () => {
  window.__actsOn(true);
  window.__crew(2, 1);
  const t0 = S.tick, f0 = window.__actFrames();
  run(3);
  const f1 = window.__actFrames(), dt = S.tick - t0;
  // Up in the afterlife, the yard and hell run on underneath.
  const view = window.__goPlace('after');
  const camAfter = { foot: S.camY + S.viewH, x0: S.camX, x1: S.camX + S.viewW };
  const banked = S.banked, t1 = S.tick;
  run(20);
  const f2 = window.__actFrames(), dt2 = S.tick - t1;
  const stillAfter = S.view;
  const viewHell = window.__goPlace('hell');
  const camHell = { foot: S.camY + S.viewH, x0: S.camX, x1: S.camX + S.viewW };
  run(2);
  window.__view('yard');
  window.__actsOn(null);
  return [
    ok(f1.after - f0.after === dt && f1.hell - f0.hell === dt, 'from the yard, both places step once a frame',
       `${dt} frames, ${f1.after - f0.after} afterlife, ${f1.hell - f0.hell} hell`),
    ok(view === 'after' && stillAfter === 'after', 'the dev travel takes the camera up, and it stays', `${view} ${stillAfter}`),
    ok(Math.abs(camAfter.foot - (afterFloor() + actPlace('after').margin)) <= 1 && camAfter.x0 >= afterX0() - 1 && camAfter.x1 <= afterX1() + 1,
       'framed on its own camera, its floor on the window\'s foot', JSON.stringify(camAfter)),
    ok(f2.after - f1.after >= dt2 && f2.hell - f1.hell >= dt2, 'up there, hell still steps every frame',
       `${dt2} frames, ${f2.after - f1.after} afterlife, ${f2.hell - f1.hell} hell`),
    ok(S.banked > banked, 'and the yard keeps working under it', `${banked} -> ${S.banked} banked`),
    ok(viewHell === 'hell' && Math.abs(camHell.foot - (hellFloor() + HELL_FLOOR_MARGIN)) <= 1
       && camHell.x0 >= hellX0() - 1 && camHell.x1 <= hellX1() + 1,
       'down in hell, framed on hell\'s own camera', `${viewHell} ${JSON.stringify(camHell)}`)
  ];
});

group('each act\'s facts round-trip a save', async () => {
  window.__actsOn(true);
  const nothing = [S.after, S.hell];
  window.__goPlace('after');
  window.__goPlace('hell');
  S.after.rebel = 7; S.after.stock.logs = 3; S.after.rims = '0128'; S.after.gate = 1;
  S.hell.brimstone = 11; S.hell.blows[1] = 5; S.hell.ore.cinder = 2; S.hell.chamber = 1;
  const want = JSON.stringify([S.after, S.hell]);
  yard.persist();
  S.after.rebel = 0; S.hell.brimstone = 0; S.hell.blows[1] = 0;
  yard.restore();
  const back = JSON.stringify([S.after, S.hell]);
  // A save from before a field was added comes back with it blank.
  const blob = saved();
  delete blob.after.posters; delete blob.hell.flights;
  localStorage.setItem(KEY, JSON.stringify(blob));
  yard.restore();
  const mended = Array.isArray(S.after.posters) && S.hell.flights === 0;
  run(6);                              // and across the harness's own reloads, in hell
  const view = S.view;
  window.__view('yard');
  window.__actsOn(null);
  return [
    ok(nothing[0] === null && nothing[1] === null, 'neither act has facts before it begins'),
    ok(back === want, 'what each act holds comes back from the save', `${back} not ${want}`),
    ok(mended, 'a field the save has not got comes back empty'),
    ok(view === 'hell', 'and a reload keeps the camera where it was', view)
  ];
});

// The beats are placeholder cutscenes now (actbeats.js), each taking its
// seconds and its walk; a held skip hurries them, never cuts them.
const hurryUntil = (fn, limit) => runUntil(() => { if (S.beat.camera) window.__skipBeat('camera'); return fn(); }, limit);

group('an act\'s beats play behind its switch, each once', async () => {
  window.__actsOn(true, false);
  window.__crew(2, 1);
  window.__actOwe('house-fall');
  window.__actOwe('descend');
  hurryUntil(() => actsDone().includes('refuse'), 200);
  run(2);
  const afterOnly = actsDone();
  window.__actsOn(true);
  window.__actOwe('descend');
  hurryUntil(() => actsDone().includes('wall-first'), 400);
  const both = actsDone();
  window.__actOwe('house-fall');
  run(3);
  const again = actsDone();
  window.__actsOn(null);
  const keys = BEATS.map(r => r.key);
  return [
    ok(['house-fall', 'arrive', 'meet-god', 'refuse'].every(k => afterOnly.includes(k)) && !afterOnly.includes('descend'),
       'the fall plays through the opening of act 3, and hell\'s waits on its own switch', afterOnly.join(' ')),
    ok(both.includes('descend') && both.includes('wall-first'), 'switched on, the descent and the first attempt play', both.join(' ')),
    ok(again.length === both.length, 'and nothing plays twice', again.join(' ')),
    ok(ACT_KEYS.every(k => keys.includes(k)) && new Set(keys).size === keys.length,
       'every act beat is a row of the table, and no key is used twice', ACT_KEYS.filter(k => !keys.includes(k)).join(' '))
  ];
});

group('with the switches off, the connective tissue is out of reach: no go-on, no portal, no mansion', async () => {
  const { sayGoOn, goOnDue } = await import('../src/actbeats.js');
  const { portalStands, throughPortal } = await import('../src/portals.js');
  window.__actsOn(false);
  window.__crew(2, 1);
  window.__actsAt('home');
  run(8);
  const goOn = { due: goOnDue(), said: sayGoOn(), acts: S.acts };
  // a save from a build with the acts on, the road open, read by one with them off
  window.__actsAt('mansion', 3);
  const T = S.acts.mansion.T;
  run(2);
  const portals = { heaven: portalStands('heaven'), hell: portalStands('hell'), went: throughPortal('heaven') || throughPortal('hell') };
  const ran = S.acts.mansion.T !== T;
  window.__actsOn(null);
  return [
    ok(!goOn.due && !goOn.said && goOn.acts === null, 'no go-on card after the finale, and no act begun', JSON.stringify(goOn)),
    ok(!portals.heaven && !portals.hell && !portals.went, 'neither portal stands or takes the camera', JSON.stringify(portals)),
    ok(!ran, 'the mansion does not step', `${ran}`)
  ];
});
