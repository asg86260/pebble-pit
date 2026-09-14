// The save, out of the browser and into your hand.
//
// The clipboard is not allowed on every page; when it is not, the text is
// left where the console can reach it, and the sheet says so. One copy of
// the fallback, shared by the settings sheet, the crashed sheet and the
// landing page, so no two of them can answer differently.
export async function copyOut(raw, sayEl) {
  if (!raw) { sayEl.textContent = 'nothing saved yet'; return; }
  try {
    await navigator.clipboard.writeText(raw);
    sayEl.textContent = 'copied ' + Math.round(raw.length / 1024) + 'kb';
  } catch {
    window.__save = raw;
    sayEl.textContent = 'in window.__save';
  }
}
