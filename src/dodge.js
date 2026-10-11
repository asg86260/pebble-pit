// The cards pinned to the glass's corners, and how far down a card hung from
// the top edge has to stand to clear them. The mess tags (messtags.js) and
// the toast (toast.js) both ask, so the two read the same boxes the same way:
// the story's card and its queue at the top left, the squares at the top
// right, measured where they stand on screen this frame.

const topleft = document.getElementById('topleft');
const corner = document.getElementById('corner');

// The page's own spacing, read once: the gap between two cards and under a
// card one ducks below is the gap every floating card here keeps.
export const GAP = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 0;

// The boxes a card at the top must not stand on, in screen pixels.
export function cornerCards() {
  const out = [];
  const add = el => {
    if (!el || el.hidden || el.classList.contains('off')) return;
    const r = el.getBoundingClientRect();
    if (r.width && r.height) out.push(r);
  };
  if (topleft) for (const el of topleft.children) add(el);
  if (corner) for (const el of corner.children) add(el);
  return out;
}

// The left edge, in screen pixels, of the row of squares in the top-right
// corner, or null while none is up: the story's card, which shares the top
// edge with them, stops short of it.
export function cornerLeft() {
  let x = null;
  if (corner) for (const el of corner.children) {
    if (el.hidden) continue;
    const r = el.getBoundingClientRect();
    if (r.width && (x === null || r.left < x)) x = r.left;
  }
  return x;
}

// The top, in screen pixels, a box `left`..`right` and `h` tall starting at
// `top` comes to rest at: under each box it would land on, a gap below it,
// until it lands on none.
export function clearBelow(left, right, top, h, boxes, gap = GAP) {
  let y = top;
  for (let pass = 0; pass < boxes.length; pass++) {
    const hit = boxes.find(b => b.left < right && left < b.right && b.top < y + h && y < b.bottom);
    if (!hit) break;
    y = Math.ceil(hit.bottom + gap);
  }
  return y;
}
