// The save, out of the browser and into your hand. The clipboard is not
// allowed on every page; when it is not, the text is left where the console
// can reach it. One copy of the fallback, shared by the settings sheet, the
// crashed sheet and the landing page.
import { msg } from './lang.js';

export async function copyOut(raw, sayEl) {
  if (!raw) { sayEl.textContent = msg('said-copyout-none'); return; }
  try {
    await navigator.clipboard.writeText(raw);
    sayEl.textContent = msg('said-copyout-copied', { n: Math.round(raw.length / 1024) });
  } catch {
    window.__save = raw;
    sayEl.textContent = msg('said-copyout-window');
  }
}
