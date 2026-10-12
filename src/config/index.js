// The index: every thing a player can look up, in the order the book lists
// them (DESIGN.md, "The index"; docs/knowledge-index.md is where each was
// read off the code).
//
// THE TEXTS ARE DRAFTS, for the owner to edit. Every word a player reads in
// the index is here and nowhere else: change a `text` (or a `name`) in this
// file and the book says it.
//
// key    the entry's own key: what `S.seen` and `S.indexRead` hold
// group  the heading it is listed under (GROUPS, in that order)
// name   the name the game already shows for it
// glyph  a drawing in GLYPHS (src/glyphs.js), `mark:<coin>` for a coin's
//        mark, or null where nobody has drawn one yet (none is shown)
// met    when the player has met it, as a fact the save already holds
//        (met.js reads it):
//          'start'          from the first frame
//          'seen'           only `S.seen`, written where the thing first happens
//          '<field>'        a field on S, met once it is true or above nought
//          'tally:<name>'   a count in `S.tally` above nought
//          'machine:<key>'  that machine bought
//          'shield:<kind>'  that barrier raised
//          'beat:<key>'     that beat played
// serpent  true for the deep's half, listed only where the serpent is on

import { TYPE, JOB } from '../jobs.js';

export const GROUPS = ['materials', 'the yard', 'the sky', 'places', 'crew', 'the story'];

export const INDEX = [
  // --- materials ---
  { key: 'dust', group: 'materials', name: 'pebbles', glyph: 'mark:dust', met: 'start',
    text: 'chipped off the boulder by you, the diggers and the ram. toss them into the hole: what is in the hole pays for everything.' },
  { key: 'shard', group: 'materials', name: 'ore', glyph: 'mark:shard', met: 'seenShard',
    text: 'dug out of the quarry by the miners and carried up to the hole. pays for the arch and the later rungs of every ladder.' },
  { key: 'spore', group: 'materials', name: 'crops', glyph: 'mark:spore', met: 'seenSpore',
    text: 'grown on the farm and harvested by the farmers. pays for the net, and the apothecary brews with them.' },
  { key: 'spark', group: 'materials', name: 'sparks', glyph: 'mark:spark', met: 'seenSpark',
    text: "shed by the star when the wizards bolt it apart. the machines' coin: every machine, every rung of their ladders, and the rift." },
  { key: 'scale', group: 'materials', name: 'scales', glyph: 'mark:scale', met: 'seenScale', serpent: true,
    text: "the deep's coin, crushed out of what the serpent drops." },
  { key: 'crit', group: 'materials', name: 'crits', glyph: 'cracked', met: 'seen',
    text: 'now and then a hit lands hard, and a fountain of pebbles comes off instead of a chip. the bench sells the chance and the size.' },

  // --- the yard ---
  { key: 'rock', group: 'the yard', name: 'the boulder', glyph: null, met: 'start',
    text: 'falls out of the sky, one after another. chip it down for pebbles; each new one drives the last back into the ground.' },
  { key: 'pit', group: 'the yard', name: 'the hole', glyph: null, met: 'start',
    text: 'everything you bank lands here, and every bill is paid out of it. it fills up.' },
  { key: 'rift', group: 'the yard', name: 'the rift', glyph: null, met: 'riftOpen',
    text: 'torn open over the hole once it was full. it swallows what the hole cannot take, and grows as it eats.' },
  { key: 'abyss', group: 'the yard', name: 'the abyss', glyph: null, met: 'drowned',
    text: 'the hole, drowned. bottomless: whatever goes in, there is always room.' },
  { key: 'muck', group: 'the yard', name: 'muck', glyph: null, met: 'tally:muckRains',
    text: 'dirty rain lands as muck. nobody touches it while the storm is still dropping it; after, the crew shovel it up. muck on a station slows the work there.' },
  { key: 'poop', group: 'the yard', name: 'poop', glyph: null, met: 'seen',
    text: 'everybody has to go sometime. the janitors clean it up.' },
  { key: 'bird', group: 'the yard', name: 'birds', glyph: null, met: 'seen',
    text: 'they cross the sky now and then. click one and it shakes a few pebbles loose.' },
  { key: 'house', group: 'the yard', name: 'the house', glyph: 'house', met: 'crew',
    text: 'a room for every body. buy another house to hire somebody; its board is the crew.' },

  // --- the sky ---
  { key: 'pollution', group: 'the sky', name: 'pollution', glyph: null, met: 'seenAir',
    text: 'every grain dug kicks a mote into the sky, and the machines put up soot. the fuller the sky, the dirtier the rain. only the air filter takes it down.' },
  { key: 'cloud', group: 'the sky', name: 'clouds', glyph: null, met: 'start',
    text: 'they drift past at the back. when they swell and darken, rain is coming.' },
  { key: 'rain', group: 'the sky', name: 'rain', glyph: null, met: 'rains',
    text: 'comes when it likes and washes some of the sky down. clean drops just wet the yard; dirty ones land as muck.' },
  { key: 'lightning', group: 'the sky', name: 'lightning', glyph: null, met: 'seen',
    text: 'comes with a heavy pour. all show: it touches nothing.' },
  { key: 'star', group: 'the sky', name: 'the star', glyph: null, met: 'meteorOpen',
    text: 'a rock in the sky only the wizards can reach. every bit they bolt off sheds sparks; when it is gone they call down the next.' },
  { key: 'balloon', group: 'the sky', name: 'balloon', glyph: 'balloon', met: 'filterOpen',
    text: "the air filter's craft: it rides up among the clouds and draws the haze in." },
  { key: 'recycler', group: 'the sky', name: 'the recycler', glyph: null, met: 'filterOpen',
    text: 'hands back some of what the air filter takes out of the sky.' },

  // --- places ---
  { key: 'bench', group: 'places', name: 'the bench', glyph: null, met: 'seenBench',
    text: "your own board: your click, carry and toss, the haulers' gear, crits, the barriers, and the door to every new place." },
  { key: 'shack', group: 'places', name: 'the shack', glyph: 'hut', met: 'shackOpen',
    text: "the diggers' hut by the boulder. sells their swing and pick, the breaker hat and the ram." },
  { key: 'stats', group: 'places', name: 'the books', glyph: null, met: 'banked',
    text: 'the noticeboard: how long you have played and what the yard earns a second.' },
  { key: 'farm', group: 'places', name: 'the farm', glyph: 'furrow', met: 'farmOpen',
    text: 'plots that grow crops, worked by farmers. sells plots, tending and yield, the grower hat and the tiller.' },
  { key: 'quarry', group: 'places', name: 'the quarry', glyph: 'hoist', met: 'quarryOpen',
    text: 'an open cut; miners work its floor and carry ore up. sells depth, pace and seam, the blaster hat and the drill.' },
  { key: 'apothecary', group: 'places', name: 'the apothecary', glyph: 'pot', met: 'apothecaryOpen',
    text: 'a keeper lights the pot and it brews by itself. the brews walk out to the crew.' },
  { key: 'tower', group: 'places', name: 'the tower', glyph: 'tower', met: 'towerOpen',
    text: 'summons wizards, a hat each, who fly up to the star. sells the spells, the sphere and the barrier.' },
  { key: 'casino', group: 'places', name: 'the casino', glyph: 'die', met: 'casinoOpen',
    text: 'no board, just levers. pull the arm and a handful of grains pours down the pegs; the bins they land in pay.' },
  { key: 'outhouse', group: 'places', name: "the janitor's closet", glyph: 'bucket', met: 'outhouseOpen',
    text: 'home of the janitors, who clean up the poop and the muck. sells caps and the roombas.' },
  { key: 'filter', group: 'places', name: 'the air filter', glyph: null, met: 'filterOpen',
    text: 'the only thing that empties the sky. air purifiers work it; its dial reads clean, dirty or filthy.' },
  { key: 'ram', group: 'places', name: 'the ram', glyph: 'ram', met: 'machine:ram',
    text: "the boulder's machine. bought and tuned with sparks, and it puts up soot." },
  { key: 'jaw', group: 'places', name: 'the drill', glyph: 'jaw', met: 'machine:jaw',
    text: "the quarry's machine. bought and tuned with sparks, and it puts up soot." },
  { key: 'tiller', group: 'places', name: 'the tiller', glyph: 'tiller', met: 'machine:tiller',
    text: "the farm's machine. bought and tuned with sparks, and it puts up soot." },
  { key: 'belt', group: 'places', name: 'the belt', glyph: 'belt', met: 'machine:belt',
    text: 'carries pebbles from the boulder to the hole with nobody minding it. the haulers tip their loads onto it.' },
  { key: 'sphere', group: 'places', name: 'the sphere', glyph: 'sphere', met: 'machine:sphere',
    text: 'a shell round the star that catches its light and lets it fall as sparks.' },
  { key: 'roomba', group: 'places', name: 'the roombas', glyph: 'roomba', met: 'machine:roomba',
    text: 'little machines that go out from their dock, pick up the mess and bin it.' },
  { key: 'driver', group: 'places', name: 'forklift', glyph: 'lift', met: 'drivers',
    text: 'drives itself to the hole with nobody aboard, and smokes.' },
  { key: 'props', group: 'places', name: 'wooden barrier', glyph: 'planks', met: 'shield:props',
    text: 'the first try at holding off the next boulder. it does not hold.' },
  { key: 'net', group: 'places', name: 'the net', glyph: 'net', met: 'shield:net',
    text: 'rope that catches the boulder and lets it down slowly. it does not hold either.' },
  { key: 'arch', group: 'places', name: 'the arch', glyph: 'arch', met: 'shield:arch',
    text: 'stone that catches one, and then the crack runs.' },
  { key: 'dome', group: 'places', name: 'the barrier', glyph: 'dome', met: 'shield:dome',
    text: 'poured by the wizards, not carried. this one holds.' },
  { key: 'deep', group: 'places', name: 'the deep', glyph: null, met: 'portalOpen', serpent: true,
    text: 'the water under the drowned hole, where the serpent lives.' },
  { key: 'portal', group: 'places', name: 'the portal', glyph: 'portal', met: 'portalOpen', serpent: true,
    text: 'conjured by the wizards over the abyss: the way down to the deep.' },
  { key: 'crusher', group: 'places', name: 'the crusher', glyph: null, met: 'seenScale', serpent: true,
    text: "where the deep's scales are crushed and kept." },
  { key: 'pods', group: 'places', name: 'the pods', glyph: null, met: 'pods', serpent: true,
    text: "the deep's houses: a room for a body down there." },

  // --- crew ---
  { key: TYPE.HAUL, group: 'crew', name: JOB.HAUL, glyph: null, met: 'start',
    text: 'carry pebbles from the ground to the hole. anybody without a job hauls, and they shovel muck too.' },
  { key: TYPE.ROCK, group: 'crew', name: 'diggers', glyph: null, met: JOB.ROCK,
    text: 'swing at the boulder from its row. the shack sells their swing and pick.' },
  { key: TYPE.QUARRY, group: 'crew', name: 'miners', glyph: null, met: JOB.QUARRY,
    text: "work the quarry's floor and bring ore up." },
  { key: TYPE.FARM, group: 'crew', name: 'farmers', glyph: null, met: JOB.FARM,
    text: 'tend the plots and harvest the crops.' },
  { key: TYPE.PURIFY, group: 'crew', name: 'air purifiers', glyph: null, met: JOB.PURIFY,
    text: 'work the air filter. only the ones inside it count.' },
  { key: TYPE.STIR, group: 'crew', name: 'apothecary', glyph: null, met: JOB.STIR,
    text: 'the keeper who lights the pot.' },
  { key: TYPE.JANITOR, group: 'crew', name: JOB.JANITOR, glyph: 'cap', met: JOB.JANITOR,
    text: 'go after the poop first, then the muck.' },
  { key: TYPE.WIZARD, group: 'crew', name: JOB.WIZARD, glyph: 'point', met: JOB.WIZARD,
    text: 'fly up and bolt the star apart for sparks, and call down a new one. they pour the barrier too.' },
  { key: TYPE.BUILD, group: 'crew', name: JOB.BUILD, glyph: null, met: JOB.BUILD,
    text: 'spare hands lent to put up a building or a machine.' },
  { key: 'breaker', group: 'crew', name: 'breaker', glyph: 'helmet', met: 'breakers',
    text: "the diggers' hat: twice the bite." },
  { key: 'carter', group: 'crew', name: 'carter', glyph: 'cart', met: 'carters',
    text: "the haulers' cart: twice the load." },
  { key: 'blaster', group: 'crew', name: 'blaster', glyph: 'lamp', met: 'blasters',
    text: "the miners' hat: twice the trips." },
  { key: 'grower', group: 'crew', name: 'grower', glyph: 'brim', met: 'growers',
    text: "the farmers' hat: twice the tending." },
  { key: 'brews', group: 'crew', name: 'brews', glyph: 'vial', met: 'brews',
    text: 'one for each coin. hearty stew speeds a body up, strong brew makes it stronger, bracing tonic makes it crit.' },
  { key: 'party', group: 'crew', name: JOB.FIGHT, glyph: null, met: JOB.FIGHT, serpent: true,
    text: 'crew gone down to the deep to fight the serpent, a fighter to a station.' },

  // --- the story ---
  { key: 'sqwife', group: 'the story', name: 'sqwife', glyph: null, met: 'start',
    text: 'buried by the first boulder. every one you clear, somebody runs to dig; every new one drives them back in.' },
  { key: 'objective', group: 'the story', name: 'objective', glyph: null, met: 'start',
    text: "the line at the top: the story's next step." },
  { key: 'notices', group: 'the story', name: 'achievements', glyph: null, met: 'won',
    text: "the yard's milestones. this sheet keeps the ones you have earned." },
  { key: 'rescue', group: 'the story', name: 'you saved your sqwife', glyph: null, met: 'rescued',
    text: 'the barrier held, and the sqwife came out.' },
  { key: 'cutscene', group: 'the story', name: 'scenes', glyph: null, met: 'start',
    text: 'now and then a scene takes the camera. hold space to skip one.' },
  { key: 'sqhusband', group: 'the story', name: 'sqhusband', glyph: null, met: 'beat:snatch', serpent: true,
    text: 'snatched by the serpent after the rescue. free him from its belly.' },
  { key: 'serpent', group: 'the story', name: 'the serpent', glyph: null, met: 'beat:snatch', serpent: true,
    text: 'lives in the deep, and swallowed the sqhusband.' },
];
