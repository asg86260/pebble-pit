// The controls page's rows, once, for the held sheet and the landing page:
// the input on the left, what it does on the right. Both pages build their
// list from here so the two cannot drift apart.

export const CONTROLS = [
  ['left click', 'interact'],
  ['right click', 'focus workers'],
  ['right click + left click', 'pick up workers'],
  ['middle click', 'move camera'],
  ['scroll wheel', 'move camera'],
  ['← → / a d', 'move camera'],
  ['1 – 9', 'jump to a place'],
];

// Cells go straight into the grid, input then action, so the two columns are
// sized by what is in them (style.css, `.controls`).
export function fillControls(el) {
  el.replaceChildren(...CONTROLS.flat().map(text => {
    const s = document.createElement('span');
    s.textContent = text;
    return s;
  }));
}
