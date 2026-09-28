// The deep's machines, as drawn: each a cell a character, in the tones they
// are seen in: `#` the white of anything made, `+` and `-` its greys, `o`
// the black water held in it, `*` the abyss's purple, `.` nothing. A cell
// here is a cell on the screen, drawn at one to one. The party's stations
// are not here: a station is its fighter and a prop (deep/props.js).

// The crusher, a brick furnace: a square chute into a squat brick block, its
// mouth open across the middle twenty columns of the top row where the
// hopper takes a toss (`hopperRect`), an arched white-framed door low in its
// middle, left black: the fire in it is drawn over it every frame
// (render/deep.js, `drawFire`), and the door is every `o` under the brick's
// top edge.
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
