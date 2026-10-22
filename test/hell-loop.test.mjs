// Act 4's loop, the mine and the forge (hell/; DESIGN.md, "Acts 3 and 4",
// act 4). Reached the way a player reaches it once the road is built: the
// face and the barrier by the click (`__clickHell`, the pointer's way in),
// the cards by `__buy`; the setup a check is not about -- the act begun,
// coins in the store, a tool already made -- by `__hell`. Every group runs
// under the reload harness, so the act's save is asked every five seconds
// of every one.
import { bestMs, group, ok, run, runUntil, yard } from './helpers.mjs';
import { HELL_TIERS, BARRIER_BLOWS, LUMP_BLOWS, ORE_A_BAR, TOOL_RECIPES } from '../src/config.js';
const { cellsDown } = await import('../src/hell/barriers.js');

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const begin = (patch) => { window.__actsOn(true); window.__crew(2, 1); window.__goPlace('hell'); return window.__hell(patch); };
const end = () => { window.__view('yard'); window.__actsOn(null); };
const clickFace = i => { const p = window.__hellAt('face', i); return window.__clickHell(p.x, p.y); };
const clickWall = i => { const p = window.__hellAt('wall', i); return window.__clickHell(p.x, p.y); };

group('mining yields lumps: a click is a blow, and the miners swing on their own', async () => {
  begin();
  const h = () => S.hell;
  const hits = [];
  for (let k = 0; k < LUMP_BLOWS[0]; k++) hits.push(clickFace(0));
  const byClick = h().ore.dross;
  // The next chamber is behind the rubble: its face takes no click.
  const shut = clickFace(1);
  const lumps0 = h().mined.dross;
  run(40);
  const miners = h().bodies.filter(b => b.job === 'miner').length;
  const byMiners = h().mined.dross - lumps0;
  // A face cuts back into the wall as it is mined.
  for (let k = 0; k < LUMP_BLOWS[0] * 12; k++) clickFace(0);
  end();
  return [
    ok(hits.every(Boolean) && byClick === 1, `a lump off the dross after ${LUMP_BLOWS[0]} blows of the yard's pick`, `${byClick} lumps, ${hits}`),
    ok(!shut, 'a face behind a standing barrier takes no click'),
    ok(miners >= 1 && byMiners >= 1, 'the muster sends a miner down, and its swings knock lumps off', `${miners} miners, ${byMiners} lumps`),
    ok(h().seams[0] >= 1, 'and the face moves back into the wall a cell at a time', `${h().seams[0]} cells`)
  ];
});

group('a furnace smelts while it is fed, and goes out and stops when it is not', async () => {
  // Two brimstone in it, ore in the hopper, lit: the stoker is the second
  // ghost down the road, twenty seconds off, so the fuel runs out before
  // anyone can feed it.
  begin({ furnaces: { 0: { fuel: 2, lit: true, hopper: { dross: 10 } } } });
  const f = () => S.hell.furnaces[0];
  run(12);
  const fed = S.hell.smelted.dross;
  run(5);
  const out = { lit: f().lit, warm: f().warm, fuel: f().fuel, bars: f().tray.dross, hopper: f().hopper.dross };
  run(3);
  const still = f().tray.dross;
  // Then the stoker comes, carries a crust from the vent and lights it.
  const relit = runUntil(() => f().lit, 60);
  const before = S.hell.smelted.dross;
  run(30);
  end();
  return [
    ok(fed >= 1, 'it smelts while fed', `${fed} bars`),
    ok(!out.lit && out.fuel === 0 && out.warm === 0, 'out of brimstone it goes out and cools', JSON.stringify(out)),
    ok(still === out.bars && out.hopper >= ORE_A_BAR, 'and makes nothing cold, with ore still in the hopper', `${out.bars} -> ${still} bars, ${out.hopper} ore`),
    ok(relit && S.hell.smelted.dross > before, 'a stoker lights it again and it smelts on', `${before} -> ${S.hell.smelted.dross}`)
  ];
});

group('the anvil makes the next tool from the last and its bars, and a body carries it to the face', async () => {
  begin({ brimstone: 200, bars: { dross: TOOL_RECIPES[0].dross } });
  // Two rungs of the muster bought like a player, for a smith.
  const paid0 = S.hell.brimstone;
  const bought = [window.__buy('hellmuster'), window.__buy('hellmuster')];
  const spent = paid0 - S.hell.brimstone;
  const made = runUntil(() => S.hell.tool === 1, 150);
  const barsLeft = S.hell.bars.dross;
  const carried = runUntil(() => S.hell.faces[0].tool === 1, 90);
  // A lump off the dross now takes fewer blows.
  const lumps = S.hell.ore.dross;
  for (let k = 0; k < LUMP_BLOWS[1]; k++) clickFace(0);
  end();
  return [
    ok(bought.every(Boolean) && spent > 0, 'the muster climbs for brimstone', `${bought} ${spent} brimstone`),
    ok(made && barsLeft === 0, 'the smith turns the yard\'s pick and the dross bars into the dross pick', `tool ${S.hell.tool}, ${barsLeft} bars left`),
    ok(carried, 'a hauler carries it down to the face'),
    ok(S.hell.ore.dross >= lumps + 1, `and a lump comes off the dross in ${LUMP_BLOWS[1]} blows`, `${lumps} -> ${S.hell.ore.dross}`)
  ];
});

group('a barrier falls only to its tool, a cell at a time, and opens the next ore', async () => {
  begin();
  const rings0 = S.hell.rings;
  for (let k = 0; k < 20; k++) clickWall(0);
  const wrong = { blows: S.hell.blows[0], rang: S.hell.rings - rings0 };
  window.__hell({ tool: 1 });
  for (let k = 0; k < BARRIER_BLOWS[0] / 2; k++) clickWall(0);
  const half = cellsDown(0), pieces = S.hell.pieces.length;
  run(2);
  const landed = S.hell.walls[0].loose;
  const behind = clickFace(1);
  for (let k = 0; k < BARRIER_BLOWS[0]; k++) clickWall(0);
  const chamber = S.hell.chamber;
  const due = window.__hellWallDue ? window.__hellWallDue() : null;
  // The next chamber's face is open now, and its barrier wants the next tool.
  const hits = [];
  for (let k = 0; k < LUMP_BLOWS[0]; k++) hits.push(clickFace(1));
  const boneRings = S.hell.rings;
  clickWall(1);
  end();
  return [
    ok(wrong.blows === 0 && wrong.rang === 20, 'the yard\'s pick rings off the rubble and nothing comes loose', JSON.stringify(wrong)),
    ok(half > 0 && pieces > 0 && landed > 0, 'the dross pick knocks it down a cell at a time, each piece falling as spoil', `${half} cells, ${pieces} falling, ${landed} landed`),
    ok(!behind, 'the next face is shut while the rubble stands'),
    ok(chamber === 1, 'when the last cell is down, the next chamber opens', `chamber ${chamber}`),
    ok(due === 0, 'and the fall is owed to the story', `${due}`),
    ok(hits.every(Boolean) && S.hell.ore.cinder === 1, 'the cinder iron comes off its face, cut by the dross pick', `${S.hell.ore.cinder}`),
    ok(S.hell.rings === boneRings + 1 && S.hell.blows[1] === 0, 'and the bone wall rings the dross pick off')
  ];
});

group('the wall gang works the barrier with the tool carried down, off the faces', async () => {
  begin({ brimstone: 200, tool: 1, faces: { 0: { tool: 1 } } });
  for (let k = 0; k < 4; k++) window.__buy('hellmuster');
  const up = [window.__buy('hellgangup'), window.__buy('hellgangup')];
  runUntil(() => S.hell.bodies.length >= 6, 60);
  const fell = runUntil(() => S.hell.chamber === 1, 400);
  const heaped = runUntil(() => S.hell.walls[0].heap > 10, 120);
  end();
  return [
    ok(up.every(Boolean) && S.hell.gang === 2, 'the barrier\'s card sets two on the wall', `${S.hell.gang}`),
    ok(S.hell.walls[0].tool === 1, 'a hauler carries the dross pick to them'),
    ok(fell, 'and the gang brings the rubble down with no click', `${S.hell.blows[0]} of ${BARRIER_BLOWS[0]} blows`),
    ok(heaped, 'the spoil carried to the heap', `${S.hell.walls[0].heap} on the heap`)
  ];
});

group('a flare crusts and puts out, and never takes an item', async () => {
  begin({ furnaces: { 0: { fuel: 8, lit: true, hopper: { dross: 6 } } }, ore: { dross: 5 }, bars: { dross: 3 }, brimstone: 4, tool: 1 });
  const h = () => S.hell;
  const metal = () => {
    const x = h();
    let n = 0;
    for (const t of HELL_TIERS) {
      n += x.ore[t.ore] + ORE_A_BAR * x.bars[t.ore];
      for (const f of x.furnaces) n += f.hopper[t.ore] + ORE_A_BAR * f.tray[t.ore];
    }
    for (const b of x.bodies) if (b.carry?.what === 'ore') n++; else if (b.carry?.what === 'bar') n += ORE_A_BAR;
    return n;
  };
  const brim = () => h().brimstone + h().vents.reduce((n, v) => n + v.crust, 0) + h().furnaces.reduce((n, f) => n + f.fuel, 0)
    + h().bodies.filter(b => b.carry?.what === 'brim').length;
  const tools = () => JSON.stringify([h().tool, h().faces.map(f => f.tool), h().walls.map(w => w.tool)]);
  let seen = null, warned = false;
  for (let k = 0; k < 120 * 60 && !seen; k++) {
    const before = { metal: metal(), brim: brim(), tools: tools(), flares: h().flareCount };
    if (window.__hellFlareWarning?.(0)) warned = true;
    run(1 / 60);
    if (h().flareCount > before.flares)
      seen = { before, after: { metal: metal(), brim: brim(), tools: tools() }, face: h().faces[0].crust, lit: h().furnaces[0].lit };
  }
  end();
  return [
    ok(!!seen, 'a flare breaks out in the landing'),
    ok(warned, 'warned ahead of it'),
    ok(seen && seen.after.metal >= seen.before.metal && seen.after.brim >= seen.before.brim && seen.after.tools === seen.before.tools,
       'and no ore, bar, brimstone or tool is lost to it', JSON.stringify(seen)),
    ok(seen && seen.face > 0 && !seen.lit, 'it crusts the face and puts the furnace out', JSON.stringify(seen && { face: seen.face, lit: seen.lit }))
  ];
});

group('a reload in the middle of a wall stands hell back as it was', async () => {
  begin({ tool: 1, brimstone: 50 });
  window.__buy('hellface');
  run(25);
  for (let k = 0; k < 50; k++) clickWall(0);
  const want = JSON.stringify(S.hell), cells = cellsDown(0);
  yard.persist();
  S.hell.blows[0] = 0; S.hell.bodies = [];
  yard.restore();
  const back = JSON.stringify(S.hell);
  end();
  return [
    ok(back === want, 'every fact of the act comes back from the save', back.length + ' vs ' + want.length),
    ok(cellsDown(0) === cells && cells > 0, 'and the hole in the rubble is the same hole', `${cells} -> ${cellsDown(0)}`),
    ok(S.hell.rungs.hellface === 1, 'the rung bought with it')
  ];
});

group('the boards climb in bands: brimstone, then low bars', async () => {
  begin({ brimstone: 500, bars: { dross: 20, cinder: 20 } });
  const bill = () => window.__rows().find(r => r.key === 'hellfurnace').bill.map(([c]) => c).sort().join();
  const first = bill();
  window.__buy('hellfurnace'); window.__buy('hellfurnace');
  const second = bill();
  const low0 = S.hell.bars.dross + S.hell.bars.cinder;
  const pressed = window.__buy('hellfurnace');
  const low1 = S.hell.bars.dross + S.hell.bars.cinder;
  end();
  return [
    ok(first === 'brimstone', 'the first band asks brimstone alone', first),
    ok(second === 'brimstone,lowbar', 'the second adds the low bars', second),
    ok(pressed && low1 < low0, 'and takes them off the anvil\'s stock', `${low0} -> ${low1}`)
  ];
});

// Hell is stepped every frame with its act on, whatever the camera is
// looking at, so its cost is paid on the yard's frames as well: the whole
// run open, the full muster down and every errand going, timed on hell's own
// step alone, the minimum of three passes (PERF.md, section 0).
const { stepHell } = await import('../src/hell/index.js');
group('a full hell costs a small share of a frame', async () => {
  begin({ brimstone: 5000, bars: { dross: 99, cinder: 99, copper: 99, obsidian: 99 }, tool: 4, chamber: 4,
          rungs: { hellmuster: 8 }, gang: 4, road: 4,
          furnaces: { 0: { fuel: 9, lit: true }, 1: { fuel: 9, lit: true }, 2: { fuel: 9, lit: true }, 3: { fuel: 9, lit: true }, 4: { fuel: 9, lit: true } } });
  run(90);
  const bodies = S.hell.bodies.length;
  const c = { now: 0, dt: 1000 / 60 };
  const best = bestMs(() => stepHell(c), 600);
  end();
  return [
    ok(bodies === 14, 'the full muster is down', `${bodies}`),
    ok(best < 0.25, 'and a frame of hell costs under a quarter of a millisecond', `${best.toFixed(3)} ms`)
  ];
});
