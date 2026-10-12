// The demo build (DESIGN.md, "Three builds"): the story stops at the farm --
// the last place the demo sells, the apothecary never offered -- and when the
// net fails, a sheet points to the full game in place of the next step. Set
// at build time (`VITE_DEMO=1`); a dev build and the node yard read it off,
// and a check turns it on with `__demoOn`.
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
export const DEMO_ON = env.VITE_DEMO === '1';
// The full game's store page, for the demo's last sheet; empty until the
// Steam app exists, and the sheet's link stays hidden while it is.
export const STORE_URL = env.VITE_STORE_URL || '';
// The steps of the story past the demo's end (objectives.js keys), never the
// line in the demo.
export const PAST_DEMO = ['quarry', 'arch', 'buytower', 'dome', 'rescue'];
