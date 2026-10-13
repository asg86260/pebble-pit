// The feedback form's working (DESIGN.md, "Feedback form"): what a report
// is, the line that says what goes, and the send. No page in here: the form
// on a page is feedbackform.js, which draws this, so the node tier can drive
// the very thing the page does.
//
// Light on purpose: the crashed sheet fetches it at the click, after the
// game has stopped, so nothing here may reach for the yard. A report reads
// the open slot's blob, handed in by the page, and nothing else; it never
// writes the store or touches `S`, and a worker that is down costs a report,
// never a yard.
//
// Nothing is sent later. A send that fails says so and keeps the words and
// the tick, and the player presses send again or does not: a report sent
// behind the player's back would carry a save they had played past, at a
// moment the line of what goes was not on screen. Only the words survive the
// page closing, as a draft (prefs, `feedbackDraft`), never the save.

import {
  FEEDBACK_URL, FEEDBACK_TEXT_MAX, FEEDBACK_SAVE_MAX, FEEDBACK_FATAL_MAX, FEEDBACK_TIMEOUT_MS
} from './config/feedback.js';
import { TARGET } from './config/cloud.js';
import { DEMO_ON } from './config/demo.js';
import { BUILD } from './version.js';
import { LANG, msg } from './lang.js';
import { pref, setPref } from './prefs.js';
import { gzip } from './gzip.js';

// --- where the worker is ------------------------------------------------------
// A build's answer is the constant; the checks point the form at the real
// worker's `handle` (the node tier) or a scripted one (the browser tier).
let url = FEEDBACK_URL;
let fetchFn = null;
export const setFeedbackUrl = u => { url = u || ''; };
export const setFeedbackFetch = fn => { fetchFn = typeof fn === 'function' ? fn : null; };
// Whether there is a form at all: no address is no button, no pane and no
// request.
export function feedbackReady() {
  try { return !!url && typeof (fetchFn || globalThis.fetch) === 'function'; } catch { return false; }
}

// --- the facts that go along without asking ----------------------------------
// The build as the sheet's foot writes it, without the day: `0.9.14 · 3f2a9c1`,
// or `dev`.
export const versionOf = (b = BUILD) => [b.version, b.hash].filter(Boolean).join(' · ');
// The store, and whether this is its demo.
export const targetOf = () => TARGET + (DEMO_ON ? '-demo' : '');
export const shellOf = () => (typeof window !== 'undefined' && window.desk ? 'desk' : 'web');
// The machine, folded to one word. Not the user agent string, which says far
// more than which machine; an iPad asks for the desktop site and calls itself
// a Mac, but it is the one Mac with a touch screen.
export function osOf(nav = globalThis.navigator) {
  const p = String(nav?.userAgentData?.platform || nav?.platform || '').toLowerCase();
  if (/iphone|ipad|ipod|ios/.test(p)) return 'ios';
  if (/android/.test(p)) return 'android';
  if (/win/.test(p)) return 'windows';
  if (/mac/.test(p)) return nav?.maxTouchPoints > 1 ? 'ios' : 'mac';
  if (/linux|cros|x11/.test(p)) return 'linux';
  return 'other';
}
// The language in force, and whether the player chose it or the game
// followed Steam, the system or the browser to it.
export const langOf = () => `${LANG} · ${pref('language') ? 'chosen' : 'followed'}`;

// Everything attached, in the order the line lists it. `fatal` is the
// crashed sheet's alone: the error's first line, never the stack, whose
// file paths carry the Windows user's name on the desk.
export function factsOf(page, fatal = null) {
  const meta = { version: versionOf(), target: targetOf(), shell: shellOf(), os: osOf(), lang: langOf(), page };
  if (page === 'crashed' && fatal) meta.fatal = String(fatal).slice(0, FEEDBACK_FATAL_MAX);
  return meta;
}

// --- the save -----------------------------------------------------------------
// Base64 a few kilobytes at a time: one call over a quarter of a megabyte
// overflows the argument list.
const CHUNK = 0x8000;
export function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += CHUNK) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  return btoa(s);
}

// What the tick would send: the blob gzipped, as base64, and its size; or,
// for an empty slot or a save past the cap, why there is nothing to tick.
export async function offerOf(raw) {
  if (!raw) return { why: 'empty' };
  let gz;
  try { gz = await gzip(raw); } catch { return { why: 'empty' }; }
  if (gz.length > FEEDBACK_SAVE_MAX) return { why: 'big', bytes: gz.length };
  return { bytes: gz.length, b64: toBase64(gz) };
}

const kbOf = bytes => Math.max(1, Math.round(bytes / 1024));

// Which yard a blob is, as the saves rows say one: for the landing page,
// where there is no yard behind the form to say it.
export function yardOf(raw) {
  let s = null;
  try { s = JSON.parse(raw); } catch {}
  if (!s) return '';
  return [msg('slots-row-rock', { n: s.boulderNo || 1 }), msg('slots-row-crew', { n: s.crew || 0 })].join(' · ');
}

// --- the report and its line --------------------------------------------------
// The request's body: the words, the facts, and the save only while the tick
// is on.
export function reportOf({ text, meta, offer, ticked }) {
  const report = { text, meta };
  if (ticked && offer?.b64) report.save = offer.b64;
  return report;
}

// The line of what goes, read off the report itself, key by key, so it
// cannot list less than the request carries: the words as a word, each fact
// as its value, the save as its size. A key the request gains later is
// listed as it stands until it is given words of its own.
export function goesOf(report, offer = null, yard = '') {
  const out = [];
  for (const [k, v] of Object.entries(report)) {
    if (k === 'text') out.push({ key: 'text', text: msg('fb-goes-words') });
    else if (k === 'meta') for (const [m, mv] of Object.entries(v)) out.push({ key: `meta.${m}`, text: String(mv) });
    else if (k === 'save') {
      const kb = kbOf(offer?.bytes || 0);
      out.push({ key: 'save', text: yard ? msg('fb-goes-save-yard', { yard, kb }) : msg('fb-goes-save', { kb }) });
    } else out.push({ key: k, text: String(v) });
  }
  return out;
}
// Every key a report carries, as `goesOf` names them: the line's check.
export const keysOf = report => Object.entries(report)
  .flatMap(([k, v]) => (k === 'meta' ? Object.keys(v).map(m => `meta.${m}`) : [k]));

// Why the tick is grey, said on the line; '' while it can be ticked.
export function whyNot(offer) {
  if (offer?.why === 'empty') return msg('fb-nosave-empty');
  if (offer?.why === 'big') return msg('fb-nosave-big', { kb: kbOf(offer.bytes) });
  return '';
}

// --- the draft ------------------------------------------------------------------
const draft = () => {
  const d = pref('feedbackDraft');
  return typeof d === 'string' ? d.slice(0, FEEDBACK_TEXT_MAX) : '';
};

// --- the send ---------------------------------------------------------------------
// One request, and its answer: 201 is taken; anything else, or no answer
// inside the timeout, did not go.
async function post(body) {
  const fn = fetchFn || globalThis.fetch;
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => ctl?.abort(), FEEDBACK_TIMEOUT_MS);
  try {
    const res = await fn(url.replace(/\/+$/, '') + '/reports', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: ctl?.signal
    });
    let data = null;
    try { data = await res.json(); } catch {}
    return { ok: res.status === 201, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

// --- the form, as a thing with no page ------------------------------------------
// `page` is which of the three it is on; `raw` reads the open slot's blob,
// once, as the form opens; `fatal` the crash's first line; `yard` whether the
// line says which yard the save is (the landing page). `onChange` is told
// whenever anything the page draws has changed. The tick is off every time a
// form is made, and the words are the draft.
export function feedbackForm({ page, raw = () => null, fatal = null, yard = false, onChange = () => {} }) {
  let blob = null;
  try { blob = raw() || null; } catch {}
  const f = {
    page,
    text: draft(),
    ticked: false,
    // 'edit', 'sending', 'sent' or 'failed'
    phase: 'edit',
    offer: null,
    // what the last send carried, and whether the worker kept its save
    sentSave: false,
    savedKept: null,
    yard: yard && blob ? yardOf(blob) : '',
  };
  const changed = () => { try { onChange(f); } catch {} };
  f.ready = offerOf(blob).then(o => { f.offer = o; changed(); return o; });

  f.meta = () => factsOf(page, fatal);
  f.report = () => reportOf({ text: f.text, meta: f.meta(), offer: f.offer, ticked: f.ticked });
  f.goes = () => goesOf(f.report(), f.offer, f.yard);
  f.why = () => whyNot(f.offer);
  f.left = () => FEEDBACK_TEXT_MAX - f.text.length;
  const open = () => f.phase !== 'sending' && f.phase !== 'sent';
  f.canTick = () => !!f.offer?.b64 && open();
  f.canSend = () => feedbackReady() && f.text.trim().length > 0 && open();

  f.type = text => {
    if (!open()) return;
    f.text = String(text ?? '').slice(0, FEEDBACK_TEXT_MAX);
    setPref('feedbackDraft', f.text);
    changed();
  };
  f.tick = () => {
    if (!f.canTick()) return;
    f.ticked = !f.ticked;
    changed();
  };
  f.send = async () => {
    if (!f.canSend()) return false;
    const report = f.report();
    f.phase = 'sending';
    changed();
    const r = await post(JSON.stringify(report));
    if (r.ok) {
      f.phase = 'sent';
      f.sentSave = 'save' in report;
      f.savedKept = r.data?.save !== false;
      f.text = '';
      setPref('feedbackDraft', '');
    } else {
      f.phase = 'failed';
    }
    changed();
    return r.ok;
  };
  return f;
}
