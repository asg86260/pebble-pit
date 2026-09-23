// Every row on every board, and how a player reaches it.
//
// One line a row. The two coverage files (`shop-coverage-*.test.mjs`) walk this
// table and ask three things of each entry: that the row is off the boards
// until its gate is met and on them once it is; that it can be bought, through
// `__buy`, the way a player presses it; and that a cold reload -- the save
// written, the yard thrown away, the save read back -- leaves every board
// reading exactly as it did. The ore yield ladder was on the boards for a
// month, bought and rebought after every refresh, and no check noticed
// because no check bought it and looked again after a load. This table is
// so that cannot happen to the next row: a row on the boards with no line
// here is a red check, not a bug report.
//
//   reach   the setup that meets the row's gate -- hooks, and the odd fact
//           set on S directly where no hook says it. This is the setup the
//           check is NOT about, so it may be dev handles; the purchase
//           itself is never one. Called with `(S, run)`, `run` in game
//           seconds, for a gate that needs the yard to have turned over.
//   fresh   the row is on the boards from the first frame, so there is no
//           hidden-before to assert
//   dial    the row is a setting or an action, not a purchase -- a pot's
//           standing order, a chip, the tower's "ask" -- so only its gate is
//           checked; nothing about it is bought and nothing about it is kept
//   purse   the row is bought out of what `reach` handed over, not the flood
//           the walk pours in before every other press -- for a row whose
//           gate is about the coins (a pot needs room in the hole)
//   fired   how to tell the press did something, for a row `__buy` cannot
//           read -- one that stays on the board and changes no figure
//   part    which coverage file runs it, so the two files stay about the
//           same length (wall time is the slowest single file)

const grantAll = () =>
  window.__grant({ dust: 1e9, shards: 1e7, spores: 1e7, cores: 1e5, sparks: 1e6 });
const crew = () => { window.__crew(3, 6, 3, 3); };
// Hands at the rock and the pit only: `__crew` given quarriers or farmhands
// opens their grounds, which pre-empts the doors that sell them.
const hands = () => { window.__crew(3, 6); };
// Everything open and every ladder that gates a machine at its top -- and every
// hat handed out, which pre-empts the kit rows, so those reach past this.
const sites = () => { window.__fullSites(); crew(); grantAll(); };
const grounds = () => { window.__invest(); crew(); grantAll(); };
const tower = () => { sites(); window.__answered('props', 'net', 'arch'); window.__meteor(); };
const filter = () => { sites(); window.__air({ open: true }); };
// The apothecary's ladders come on with the brews, so it is opened with a few
// behind it -- the extra pot's own count is on its line.
const apothecary = () => { sites(); window.__buy('unlockapothecary'); window.__finish(); window.__brews(3); };
export const ROWS = [
  // --- the bench --------------------------------------------------------------
  { key: 'carry', fresh: true, part: 1 },
  { key: 'auto', fresh: true, part: 1 },
  // Gated like the carry row, on having dragged, which the yard has from the first frame here.
  { key: 'autotoss', fresh: true, part: 1 },
  // Both sit beside the sweep once the throwing is automatic.
  { key: 'toss', part: 1, reach: S => { S.autoToss = true; } },
  { key: 'reach', part: 1, reach: S => { S.autoToss = true; } },
  // Both sit beside the swing once the swinging is automatic.
  { key: 'speed', part: 1, reach: S => { S.autoMine = true; } },
  { key: 'pick', part: 1, reach: S => { S.autoMine = true; } },
  { key: 'critchance', fresh: true, part: 1 },
  { key: 'critmult', fresh: true, part: 1 },
  { key: 'haulcarry', fresh: true, part: 1 },
  { key: 'haulpace', fresh: true, part: 1 },
  { key: 'house', fresh: true, part: 1 },
  // The two doors with a `once`: revealed when the price is within reach.
  { key: 'unlockshack', part: 1, reach: () => { crew(); grantAll(); } },
  { key: 'unlockfarm', part: 1, reach: () => { hands(); window.__answered('props'); grantAll(); } },
  // The plots first: the quarry's door waits on the farm standing (shield.js,
  // `shieldOpened`), so the farm is opened by the crew and not by its row.
  { key: 'unlockquarry', part: 1, reach: () => { window.__crew(3, 6, 0, 3); window.__answered('props', 'net'); } },
  { key: 'unlocktower', part: 1, reach: () => { crew(); window.__answered('props', 'net', 'arch'); } },
  { key: 'unlockcasino', part: 1, reach: () => { window.__invest(); } },
  { key: 'unlockapothecary', part: 1, reach: sites },
  { key: 'unlockouthouse', part: 1, reach: S => { crew(); S.seenMess = true; } },
  { key: 'unlockfilter', part: 1,
    reach: S => { sites(); window.__machine('ram', { bought: true }); window.__air({ rains: 1 }); S.seenAir = true; } },
  { key: 'loopost', part: 1, reach: () => { sites(); window.__loo(); } },

  // --- the shields, and the crew's kit ----------------------------------------
  { key: 'props', part: 1, reach: S => { crew(); S.boulderNo = 5; } },
  { key: 'net', part: 1, reach: () => { window.__invest(); window.__answered('props'); } },
  { key: 'arch', part: 1, reach: () => { window.__invest(); window.__answered('props', 'net'); } },
  { key: 'dome', part: 1, reach: () => { tower(); window.__wizardHat(1); } },
  { key: 'askwizards', dial: true, part: 1, reach: () => { window.__answered('props', 'net', 'arch'); } },
  { key: 'breaker', part: 1, reach: () => { grounds(); window.__shack(); window.__answered('props'); } },
  { key: 'carter', part: 1, reach: () => { grounds(); window.__answered('props'); } },
  // The belt's gate: a full set of carts and both of the haulers' ladders topped.
  { key: 'driver', part: 1,
    reach: () => { sites(); window.__levels({ haulCarryLevel: 99, haulPaceLevel: 99 }); window.__kit({ carters: 3 }); } },
  { key: 'blaster', part: 1, reach: () => { grounds(); window.__answered('props', 'net', 'arch'); } },
  { key: 'grower', part: 1, reach: () => { grounds(); window.__answered('props', 'net'); } },

  // --- the shack and the machines --------------------------------------------
  { key: 'rockhandpick', fresh: true, part: 1 },
  { key: 'rockhandspeed', fresh: true, part: 1 },
  { key: 'ram', part: 1, reach: () => { sites(); window.__kit({ breakers: 3 }); } },
  { key: 'tuneram', part: 1, reach: () => { sites(); window.__machine('ram', { bought: true }); } },
  { key: 'belt', part: 1,
    reach: () => { sites(); window.__levels({ haulCarryLevel: 99, haulPaceLevel: 99 }); window.__kit({ carters: 3 }); } },

  // --- the tower --------------------------------------------------------------
  { key: 'wizard', part: 2, reach: tower },
  { key: 'wizspeed', part: 2, reach: tower },
  { key: 'wizpower', part: 2, reach: tower },
  // The sphere's gate: a full set of hats and the tower's two ladders topped.
  { key: 'sphere', part: 2,
    reach: () => { tower(); window.__wizardHat(3); window.__levels({ wizSpeedLevel: 99, wizPowerLevel: 99 }); } },
  // Its ladder is offered once the shell stands, which is the pour, not the purchase.
  { key: 'tunesphere', part: 2,
    reach: S => { tower(); window.__wizardHat(3); window.__machine('sphere', { bought: true }); S.spherePour = 1; } },
  // A spell is offered once the thing it enchants is in the yard (tower.js,
  // SPELL_NEEDS): a machine for the drive, the closet for the sweep.
  { key: 'spelldrive', part: 2, reach: () => { tower(); window.__machine('ram', { bought: true }); } },
  { key: 'spellluck', part: 2, reach: tower },
  { key: 'spellgmo', part: 2, reach: tower },
  { key: 'spellthrift', part: 2, reach: tower },
  { key: 'spellsweep', part: 2, reach: () => { tower(); window.__loo(); } },

  // --- the air filter ----------------------------------------------------
  { key: 'power', part: 2, reach: filter },
  { key: 'balloonspeed', part: 2, reach: filter },
  { key: 'balloon', part: 2, reach: filter },
  { key: 'recycler', part: 2, reach: filter },

  // --- the quarry -------------------------------------------------------------
  { key: 'seam', part: 2, reach: sites },
  { key: 'quarrypace', part: 2, reach: sites },
  { key: 'quarrybench', part: 2, reach: () => { window.__invest(); crew(); grantAll(); } },
  { key: 'jaw', part: 2, reach: () => { sites(); window.__machineGates(); } },
  { key: 'tunejaw', part: 2, reach: () => { sites(); window.__machine('jaw', { bought: true }); } },

  // --- the farm ---------------------------------------------------------------
  { key: 'crop', part: 2, reach: sites },
  { key: 'tend', part: 2, reach: sites },
  { key: 'farmplot', part: 2, reach: () => { window.__invest(); crew(); grantAll(); } },
  { key: 'tiller', part: 2, reach: () => { sites(); window.__machineGates(); } },
  { key: 'tunetiller', part: 2, reach: () => { sites(); window.__machine('tiller', { bought: true }); } },

  // --- the apothecary ---------------------------------------------------------
  { key: 'potkeep', dial: true, part: 2, reach: apothecary },
  { key: 'anotherpot', part: 2, reach: () => { apothecary(); window.__brews(5); } },
  { key: 'bufflength', part: 2, reach: apothecary },
  { key: 'brewdoses', part: 2, reach: apothecary },
  { key: 'potency-stew', part: 2, reach: apothecary },
  { key: 'potency-brace', part: 2, reach: apothecary },
  { key: 'potency-strong', part: 2, reach: apothecary },

  // The casino has no board: its decisions are levers on the building and
  // heaps on the ground (levers.js, stakes.js), checked in casino.test.mjs.
];
