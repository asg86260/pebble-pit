// The deep's stations, as drawn: each a cell a character, in the tones they
// are seen in: `#` the white of anything made, `+` and `-` its greys, `o` the
// black water held in it, `*` the abyss's purple, `.` nothing. Each is its
// weapon's shape: the altar a black bag hung off a gibbet, a tentacle up out
// of the floor wound twice round it and curled over its top, the well a
// trestle rack with four barbed lances stood up through its bar, their butts
// in a trough of black water, the font a goblet with a
// ball of held ripples, the circle a standing stone over its ring, the spire
// a tower to a point.
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
    '......--++-........',
    '......--++-........',
    '.....+**oo*++......',
    '.....+oo**o++......',
    '.....+oo**o++......',
    '.....+**oo*++......',
    '......--++-........',
    '......--++-........',
    '.#################.',
    '...##+++++++++##...',
    '...##+++++++++##...',
    '.....#########.....',
    '........#+#........',
    '........#+#........',
    '........#-#........',
    '.....#########.....',
    '.....#########.....',
    '...#############...'
  ],
  circle: [
    '..........##..........',
    '..........##..........',
    '.........#++#.........',
    '.........#*+#.........',
    '.........#*+#.........',
    '.........#+-#.........',
    '.........#+*#.........',
    '.........#+*#.........',
    '.........#-+#.........',
    '.........#++#.........',
    '.........#++#.........',
    '...***...#++#...***...',
    '.**...***####***...**.',
    '.**...***####***...**.',
    '...***..........***...'
  ],
  spire: [
    '..........#..........',
    '..........#..........',
    '.........###.........',
    '.........#*#.........',
    '.........#*#.........',
    '.......###+###.......',
    '.......##+++##.......',
    '.......##+++##.......',
    '.......##+*+##.......',
    '.......##+-+##.......',
    '.......##+-+##.......',
    '......###+++###......',
    '......#+++o+++#......',
    '......#+++o+++#......',
    '......#+++o+++#......',
    '....###+++++++###....',
    '....###+++++++###....',
    '....##++++*++++##....',
    '...###############...',
    '...###############...',
    '.###################.'
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
