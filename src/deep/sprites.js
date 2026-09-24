// The deep's stations, as drawn: each a cell a character, in the tones they
// are seen in: `#` the white of anything made, `+` and `-` its greys, `o` the
// black water held in it, `*` the abyss's purple, `.` nothing. Each is its
// weapon's shape: the altar a black bag hung off a gibbet, a tentacle up out
// of the floor wound twice round it and curled over its top, the well a
// trestle rack with four barbed lances stood up through its bar, their butts
// in a trough of black water, the font a stone basin brimming with black
// water, a purple thread rising off it to a grenade held over it and ripples
// curling up both sides, the circle its own ring stood on edge, a white hoop
// of black water with a purple star bound in it, on a plinth over the same
// ring laid flat on the floor, the spire a black obelisk with purple runes
// winding up it and a white crystal with a purple heart throwing rays on top.
//
// A cell here is a cell on the screen: drawn at one to one, so what is
// painted in the station editor (stations.html) is what the deep shows. A
// scale that was not whole put a hairline of lopsidedness into every
// symmetric drawing, one column doubled on one side and not the other.
//
// Data and nothing else, so the ground a station stands on (`standOf` in
// place.js) is read off the same drawing the renderer paints.

export const SPRITES = {
  altar: [
    '..#############.....',
    '..##+-...##...#.....',
    '..##.+-..--...-.....',
    '...##....##.........',
    '...##...####........',
    '...##..#oooo#...+*..',
    '...##..#oooo#..+....',
    '...##..#oo++++*.....',
    '...##..#++-*o#......',
    '...##.*+oooo#.......',
    '...##.+#oooo#.......',
    '...##.-#oooo#.......',
    '...##..#oooo++......',
    '...##..#oo++*#......',
    '...##..#++*oo#......',
    '...##.+*####........',
    '...##.+*............',
    '..###.-+*...........',
    '.####--++*..........',
    '####################'
  ],
  well: [
    '...#............#...',
    '..*+*..#....#..*+*..',
    '...+..*+*..*+*..+...',
    '...*...*....*...*...',
    '...+...+....+...+...',
    '.##-###-####-###-##.',
    '.#+*...*....*...*-#.',
    '.#++...+....+...+-#.',
    '.#++...+....+...+-#.',
    '#+.*...*....*...*.-#',
    '#+.+...+....+...+.-#',
    '#+.+...+....+...+.-#',
    '#+.*...*....*...*.-#',
    '###-###-####-###-###',
    '#+oooooooooooooooo-#',
    '#+ooo*oooooooo*ooo-#',
    '#+oooooo*oo*oooooo-#',
    '####################'
  ],
  font: [
    '........####........',
    '.......#o**o#.......',
    '......-#*oo*#-......',
    '......-#*oo*#-......',
    '.......#o**o#.......',
    '........####........',
    '.....-...**...-.....',
    '....+....**....+....',
    '....+...-**-...+....',
    '.##################.',
    '.#oo*ooo****ooo*oo#.',
    '..#oooooooooooooo#..',
    '...##++++++++++##...',
    '.....##########.....',
    '........#++#........',
    '........#++#........',
    '........#--#........',
    '......########......',
    '....############....',
    '.##################.'
  ],
  circle: [
    '.......########.......',
    '......##oo**oo##......',
    '.....##ooo**ooo##.....',
    '....##oooo**oooo##....',
    '...##oooo*oo*oooo##...',
    '...#ooooo*oo*ooooo#...',
    '...+o************o+...',
    '...#oo****oo****oo#...',
    '...#ooo**oooo**ooo#...',
    '...#oooo******oooo#...',
    '...+oooo*o**o*oooo+...',
    '...##oo***oo***oo##...',
    '....##o**oooo**o##....',
    '.....##*oooooo*##.....',
    '......##oooooo##......',
    '.......########.......',
    '........##++##........',
    '.....############.....',
    '..******************..'
  ],
  spire: [
    '....*....**....*....',
    '.....*..*##*..*.....',
    '.......*####*.......',
    '......*##**##*......',
    '.......*####*.......',
    '.....*..*##*..*.....',
    '.........**.........',
    '........#oo#........',
    '........#o*#........',
    '........#oo#........',
    '.......#oo*o#.......',
    '.......#o*oo#.......',
    '.......#oo*o#.......',
    '.......#o*oo#.......',
    '......#oooooo#......',
    '......#o*oo*o#......',
    '......#oooooo#......',
    '.....##++++++##.....',
    '....#-*------*-#....',
    '...##############...',
    '####################'
  ]
};

// The crusher, a brick furnace: a square chute into a squat brick block, its
// mouth open across the middle twenty columns of the top row where the
// hopper takes a toss (`hopperRect`), an arched white-framed door low in its
// middle, left black: the fire in it is drawn over it every frame
// (render/deep.js, `drawFire`), and the door is every `o` under the brick's
// top edge. Kept apart from SPRITES, whose every entry stands under a dome:
// the crusher has none.
export const CRUSHER_SPRITES = {
  rest: [
    '....#++++++++++++++++++++#....',
    '.....#oooooooooooooooooo#.....',
    '......#oooooooooooooooo#......',
    '.......#ooooooooooooooo#......',
    '.......#oooooooooooooo#.......',
    '........#oooooooooooo#........',
    '.........#oooooooooo#.........',
    '.############################.',
    '..#+++++-+++++++-+++++++-++#..',
    '..#+++++-+++++++-+++++++-++#..',
    '..#+++++-+++++++-+++++++-++#..',
    '..#+++++-+++++++-+++++++-++#..',
    '..#------------------------#..',
    '..#+-+++++++-+++++++-++++++#..',
    '..#+-+++++++-+++++++-++++++#..',
    '..#+-+++++++########-++++++#..',
    '..#+-++++++##oooooo##++++++#..',
    '..#--------#oooooooo#------#..',
    '..#+++++-++#oooooooo#+++-++#..',
    '..#+++++-++#oooooooo#+++-++#..',
    '..#+++++-++#oooooooo#+++-++#..',
    '..#+++++-++#oooooooo#+++-++#..',
    '..#--------#oooooooo#------#..',
    '..#+-++++++#oooooooo#++++++#..',
    '..#+-++++++#oooooooo#++++++#..',
    '..#+-++++++#oooooooo#++++++#..',
    '..#+-++++++#oooooooo#++++++#..',
    '..#--------#oooooooo#------#..',
    '.############################.',
    '------------------------------'
  ]
};

// The station editor (stations.html) keeps its work in the browser; a dev
// build reads it over the table above, before anything measures a station.
// Nothing of this ships.
export const SPRITES_KEY = 'boulder-clicker/sprites';
export const COMMITTED = Object.fromEntries(Object.entries(SPRITES).map(([k, rows]) => [k, [...rows]]));
if (import.meta.env && import.meta.env.DEV && typeof localStorage !== 'undefined') {
  try { Object.assign(SPRITES, JSON.parse(localStorage.getItem(SPRITES_KEY) || '{}')); }
  catch { /* a bad save is no save */ }
}
