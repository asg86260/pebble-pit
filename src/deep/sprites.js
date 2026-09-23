// The deep's stations, as drawn: each a cell a character, in the tones they
// are seen in: `#` the white of anything made, `+` and `-` its greys, `o` the
// black water held in it, `*` the abyss's purple, `.` nothing. Each is its
// weapon's shape: the altar a slab, the well a ring holding black water with
// a lance stood in it, the font a goblet with a ball of held ripples, the
// circle a standing stone over its ring, the spire a tower to a point.
//
// Data and nothing else, so the ground a station stands on (`standOf` in
// place.js) is read off the same drawing the renderer paints.

export const SPRITES = {
  altar: [
    '................',
    '..############..',
    '..#++++++++++#..',
    '..#+-*----*-+#..',
    '..############..',
    '....#+#..#+#....',
    '....#-#..#-#....',
    '....#+#..#+#....',
    '..############..',
    '.##############.'
  ],
  well: [
    '.......#........',
    '.......#........',
    '.......#........',
    '......*#*.......',
    '.......*........',
    '.##.........##..',
    '.#+#########+#..',
    '.#+oo*ooo*oo+#..',
    '.#+ooooooooo+#..',
    '.#+ooo*oooo*+#..',
    '.#############..'
  ],
  font: [
    '.....-++-.......',
    '....+*oo*+......',
    '....+o**o+......',
    '....+*oo*+......',
    '.....-++-.......',
    '..###########...',
    '...#+++++++#....',
    '....#######.....',
    '......#+#.......',
    '......#-#.......',
    '....#######.....',
    '...#########....'
  ],
  circle: [
    '.......##.......',
    '......#++#......',
    '......#*+#......',
    '......#+-#......',
    '......#+*#......',
    '......#-+#......',
    '......#++#......',
    '..**..#++#..**..',
    '.*..**####**..*.',
    '..**........**..'
  ],
  spire: [
    '.......#........',
    '......###.......',
    '......#*#.......',
    '.....##+##......',
    '.....#+++#......',
    '.....#+*+#......',
    '.....#+-+#......',
    '....##+++##.....',
    '....#++o++#.....',
    '....#++o++#.....',
    '...##+++++##....',
    '...#+++*+++#....',
    '..###########...',
    '.#############..'
  ]
};
