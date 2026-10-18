// The cutscene bench's rows (cutscenes.html). A row is the name of a cutscene,
// the setup that stands the yard up just before it, what starts it, and the
// fact that ends it. All three run inside the frame, handed its window, and
// use only the hooks the game already has: `__scene` for the setup (the same
// stills the scene bench stands), `__goOn` and `__next` for the press that
// begins it, and `__cutRead().done` (hooks.js) for the fact that it is over.
//
// A scene that holds its moment against the next frames (`__holdShot`) would
// make `__fast` skip, so the recorder lets that hold go after the setup; a row
// never has to.

const over = key => w => w.__cutRead().done.includes(key);
const none = () => {};

export const ROWS = [
  { key: 'act3-intro', name: 'act 3 intro', scene: 'act3-start',
    about: 'the go-on card pressed: the house falls, the pair rise to heaven\'s tear, they arrive',
    start: w => w.__goOn(), done: over('arrive'), need: ['__goOn'] },
  { key: 'house-fall', name: 'house fall', scene: 'act3-start',
    about: 'the intro\'s first beat alone: the rock out of the sky over the house',
    start: w => w.__goOn(), done: over('house-fall'), need: ['__goOn'] },
  { key: 'finale', name: 'finale', scene: 'finale-kill',
    about: 'the last blow, the gear, the portal, the walk, the house and the door',
    start: none, done: over('finale') },
  // Its scene starts at the whirlpool opening, not the rise: the scene that
  // stands the rise pins the serpent for four wall seconds with a per-frame
  // hack that would fight a stepped clock.
  { key: 'snatch', name: 'snatch', scene: 'snatch-portal',
    about: 'from the whirlpool opening in the abyss\'s surface to the sqwife\'s leap',
    start: none, done: over('snatch') },
  // The kill, which snatch.js plays: stood from the finale's own scene (the
  // last blow just landed), which needs no pin, and over once he is out and
  // has met her, where the finale takes over.
  { key: 'snatch-kill', name: 'snatch: the kill', scene: 'finale-kill',
    about: 'the last blow, the pull in on him in the belly, the coming apart, him out and meeting her',
    start: none, done: over('freed') },
  { key: 'opening', name: 'opening', scene: 'opening',
    about: 'the intro from the top: the pair out of the house, the first rock',
    start: none, done: over('show') },
  { key: 'first-trip', name: 'first trip down', scene: 'abyss-intro',
    about: 'the ripple ending, the camera pushing in on him in the cage',
    start: none, done: over('abyss') },
  { key: 'tear', name: 'tear', scene: 'tear>',
    about: 'the hole filled past its brim, giving way',
    start: none, done: over('tear') },
  { key: 'drown', name: 'drown', scene: 'drown>',
    about: 'the disc about to give way, then drowned',
    start: none, done: over('drown') },
  { key: 'first-muck', name: 'first muck', scene: 'firstmuck',
    about: 'the first muck after the first storm, a rockhand sent for it',
    start: none, done: over('firstmuck') },
  { key: 'shield-props', name: 'shield: props', scene: 'props',
    about: 'the props built, the rock let fall on them',
    start: w => w.__next(), done: over('props') },
];

// Why a row cannot be stood in this frame, or '' when it can: the scene it
// stands from is missing from this build, or a hook it presses is.
export function greyReason(row, w) {
  if (typeof w.__scene !== 'function') return 'the frame has no scene handle';
  if (typeof w.__cutRead !== 'function') return 'the frame has no __cutRead (hooks.js)';
  if (!w.__sceneSay(row.scene)) return `no scene "${row.scene}" in this build`;
  for (const h of row.need || []) if (typeof w[h] !== 'function') return `no ${h} hook`;
  return '';
}
