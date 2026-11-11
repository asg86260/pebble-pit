// What lands a timber order's row when its last block is set down: the
// cards register it (rows.js) and the sim calls it (orders.js), so the sim
// never imports the cards that sell it. Kept in a file that imports nothing:
// rows.js registers at load, and orders.js sits in an import ring (through
// carry.js and levels.js back round to the cards), so a registry living
// there could still be uninitialized when the cards load.
let landRow = null;   // page: the cards' landing, set once at load by rows.js
export const onOrderLanded = fn => { landRow = fn; };
export const landOrder = key => landRow?.(key);
