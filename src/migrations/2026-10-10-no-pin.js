// The pin is gone (the owner, 2026-10-10): the shield on offer is sold on the
// story's card, and no card stands in the corner. A save's pinned key is
// dropped.
export default {
  since: '2026-10-10',
  v: 11,
  says: 'the pinned card is gone',
  apply(s) {
    delete s.pinned;
  }
};
