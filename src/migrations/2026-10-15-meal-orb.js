// The serpent eats with its constrict (the owner's B, 2026-10-15): the near
// stream it ate out of is gone, and with it the stream's clock, the creature
// that had turned for the mouth, the eaten it kept from drawing again and the
// stream creatures that had shaken their handful. The window's own count
// (`mealT`) is kept, so the next meal comes when it would have.
export default {
  since: '2026-10-15',
  v: 21,
  says: 'the meal stream is gone: its clock, the turned and eaten creatures and their handfuls are dropped',
  apply(s) {
    delete s.stream;
    delete s.streamOff;
    delete s.mealI;
    delete s.eaten;
    delete s.streamShed;
  }
};
