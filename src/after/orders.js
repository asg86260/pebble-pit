// Act 3's orders: a bill paid in timber, carried (DESIGN.md, "Act 3's goods
// are blocks, and bodies carry every one", settled 2026-10-27). A row whose
// bill names timber does not lift its blocks off the mound when it is
// bought: it is an order, and idle members carry its blocks there a load at
// a time (bodies.js, the orderer's errand), its effect landing when the last
// is set down. Its blocks stay on the mound until a body takes them up,
// spoken for: `reserved` is read off the orders, never kept beside them, so
// the purse (words.js) and the mound can never drift apart.
//
// A station is not ordered: it is built on the yard's works (DESIGN.md, "Act
// 3 builds through the yard's construction").
//
// `S.after.orders` is each order: { id, key, card, n, claimed, brought } --
// the row it lands, the station it is carried to, its blocks, those a body
// has taken up off the mound and those set down at the station.

import { S } from '../state.js';
import { isEmpty } from '../carry.js';
import { nextId } from './util.js';
import { stationDoor } from './place.js';

// A member with no job: at the podium, or walking there (bodies.js). A pair's
// member, `pair` 0 or 1, is never idle.
// One out on an errand with its hands full (bodies.js) is not idle until it
// has put them down: put on a job then, what it carries would go with it.
export const isIdle = w => w.job == null && w.state === 'work' && w.pair == null && !(w.errand && !isEmpty(w));
// Nothing in the arms and nothing under way with them: a load carried or a
// heap being tipped. A body may be taken off its job only like this.
export const handsFree = w => isEmpty(w) && !w.phase;

export const orders = () => (S.after ? S.after.orders : []);
// A row bought with `n` timber blocks on its bill, to be carried to `card`.
export function placeOrder(key, card, n) {
  S.after.orders.push({ id: nextId(), key, card, n, claimed: 0, brought: 0 });
}
// How many of a row's orders are still being carried.
export const orderedOf = key => orders().filter(o => o.key === key).length;
// Blocks on the mound spoken for and not yet taken up.
export const timberReserved = () => orders().reduce((s, o) => s + Math.max(0, o.n - o.claimed), 0);
// The oldest order with a block still to take up, or null.
export const nextOrder = () => orders().find(o => o.claimed < o.n) || null;
export const orderOf = id => orders().find(o => o.id === id) || null;
// Where an order is set down: its station's door, the grove's at the
// forestry shack, whose board sells it.
export const orderAt = o => stationDoor(o.card === 'grove' ? 'forestry' : o.card);
// What lands a row when its order is in: the cards register it (rows.js), so
// the sim never imports the cards that sell it.
let landRow = null;   // page: the cards' landing, set once at load by rows.js
export const onOrderLanded = fn => { landRow = fn; };
// A block of order `o` set down at its station: the last lands the row.
export function orderBrought(o) {
  o.brought += 1;
  if (o.brought < o.n) return;
  S.after.orders = orders().filter(q => q !== o);
  landRow?.(o.key);
}
