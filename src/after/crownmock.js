// MOCK grove-the-crown
// Throwaway, never merged: the oak's crown redrawn lopsided for the owner to
// vote on ("a bit more asymmetrical and a bit more natural"). Each option is
// its own clumps [x, y, r] (cells off the trunk's middle, up from its top, no
// mirroring), sky cut back out of it [x, y, r], how ragged a clump's edge is,
// and the side the light comes from; place.js lays the cells off them and
// pine.js shades them by it. Option A is today's crown, no entry here.
export const CROWN_MOCKS = {
  // B: the crown leans out over the fall side, its top off to the left and a
  // long low bough reaching there; the shack's side kept short.
  b: { lobes: [[-2.4, 8.8, 3.4], [1.4, 6.6, 2.6], [-5.2, 4.6, 3.3], [-6.4, -0.4, 2.5], [-0.6, 2.6, 2.8], [4, 3.2, 2.6], [4.3, 0.4, 2.0], [-1.6, -2.4, 2.9]],
       cut: [[-3.6, 1.0, 0.8], [2.6, 0.6, 0.7]], rag: 0.9, light: [-0.6, 0.8] },
  // C: windswept, the top and a streamer of leaves blown to the right, a
  // low clump trailing out on that side, two windows of sky.
  c: { lobes: [[2, 8.4, 3.3], [5.4, 6.4, 2.3], [-2.4, 5.6, 3.5], [4.6, 2.2, 3.0], [-5.4, 1.2, 2.9], [0.4, -1.4, 3.3], [7, -1.2, 1.8], [-3.6, -3.0, 2.1]],
       cut: [[-0.4, 3.0, 1.1], [3.6, -2.4, 0.9]], rag: 1.0, light: [-0.6, 0.8] },
  // D: an old oak's broken canopy, wide and flat-topped, many small clumps
  // with sky between them and the boughs showing through.
  d: { lobes: [[2.6, 9.4, 2.6], [-1.6, 7.8, 2.6], [-5.6, 5.4, 2.6], [5.0, 6.2, 2.6], [-7.2, 1.2, 1.8], [-3.4, 2.2, 2.6], [1.4, 4.4, 2.4], [6.2, 1.8, 2.0], [2.2, 0.4, 2.4], [-1.2, -3, 2.4], [4.2, -1.4, 1.9]],
       cut: [[-0.6, 4.4, 1.0], [-5.6, 2.6, 0.7], [4.6, 3.4, 0.8], [5.8, -1.0, 0.7]], rag: 0.8, light: [-0.6, 0.8] }
};
// The one tone the options add, with a job none of the four has: the
// sun-struck face, the side of a clump turned full to the light, a step
// brighter than the lit edge (AFTER_LEAVES[0]); light page, then dark.
export const CROWN_SUN = ['#5a9446', '#78b463'];
export const crownMock = () => CROWN_MOCKS[globalThis.__crownMock] || null;
export const crownMockKey = () => (CROWN_MOCKS[globalThis.__crownMock] ? globalThis.__crownMock : '');
// A cell's own wobble, -0.5..0.5, the same every time it is asked.
export const wobble = (c, y, s = 0) => { const v = Math.sin(c * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v) - 0.5; };
