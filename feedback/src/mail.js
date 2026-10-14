// The owner's mail a report: one short plain-text message once the report is
// stored, through the `send_email` binding `MAIL`, to the verified address in
// the secret `NOTIFY_TO`. The binding's structured `send()` takes the fields
// and writes the MIME, the Message-ID and the Date itself, so nothing here
// imports `cloudflare:email` (which node cannot load) and the checks run the
// real path over a stub.
//
// The words are a stranger's: they go in the body as plain text only, and
// what reaches the subject is cut and has every control character taken out,
// so no line break can open a header of its own.

import { FEEDBACK_MAIL_SUBJECT_MAX, FEEDBACK_MAIL_ORIGIN } from '../../src/config/feedback.js';

// Control characters, CR and LF among them, and the Unicode line breaks.
const CONTROL = /[\p{Cc}\p{Zl}\p{Zp}]/gu;
const oneLine = s => String(s).replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();

// Mail goes only from a worker that has the binding and both addresses.
export const mailOn = env => !!(env && env.MAIL && typeof env.MAIL.send === 'function' && env.NOTIFY_TO && env.NOTIFY_FROM);

export function subjectOf(id, text) {
  const words = oneLine(text);
  const cut = words.length > FEEDBACK_MAIL_SUBJECT_MAX ? `${words.slice(0, FEEDBACK_MAIL_SUBJECT_MAX).trimEnd()}...` : words;
  return `report #${id}: ${cut}`;
}

// `r` is what the worker stored: id, text, kind, meta (already read down to
// the short lists) and the save's gzipped size, 0 for none.
export function bodyOf(r) {
  const m = r.meta;
  const fact = (k, v) => `${k}: ${v == null ? '-' : oneLine(v)}`;
  const lines = [
    r.text,
    '',
    '--',
    fact('report', `#${r.id}`),
    ...(r.kind ? [fact('kind', r.kind)] : []),
    fact('version', m.version),
    fact('target', m.target),
    fact('shell', m.shell),
    fact('os', m.os),
    fact('lang', m.lang),
    fact('page', m.page),
    ...(m.fatal ? [fact('fatal', m.fatal)] : []),
    fact('save', r.saveBytes ? `yes, ${r.saveBytes} bytes gzipped` : 'no')
  ];
  // The route, never the token: the mail is only as safe as the inbox.
  if (r.saveBytes) {
    lines.push('', 'The save (GET /reports/<id>/save, owner token):',
      `curl -H "Authorization: Bearer $FEEDBACK_TOKEN" ${FEEDBACK_MAIL_ORIGIN}/reports/${r.id}/save > test/fixtures/report-${r.id}.json`);
  }
  return lines.join('\n') + '\n';
}

export function mailOf(env, r) {
  return { from: env.NOTIFY_FROM, to: env.NOTIFY_TO, subject: subjectOf(r.id, r.text), text: bodyOf(r) };
}

// Never throws: a mail that fails is one log line with the id and the reason,
// none of the words, and the report it was about stays taken.
export async function notify(env, r) {
  if (!mailOn(env)) return false;
  try {
    await env.MAIL.send(mailOf(env, r));
    return true;
  } catch (err) {
    console.error(JSON.stringify({ mail: 'failed', id: r.id, error: String(err?.code || err?.message || err) }));
    return false;
  }
}
