// The daily cron (DESIGN.md, "Feedback form", "Caps"): a plain function of
// the bindings and the clock, so the checks run it at any hour they like.
//
// A save goes FEEDBACK_SAVE_KEEP_D days after it came in, a report
// FEEDBACK_REPORT_KEEP_D days, and yesterday's ip counts at once. Each save
// goes with its bytes taken off the total, so the ceiling measures what is
// there.

import { FEEDBACK_SAVE_KEEP_D, FEEDBACK_REPORT_KEEP_D } from '../../src/config/feedback.js';
import { DAY_MS, utcDay } from '../../cloud/src/clock.js';
import { statsOf } from './app.js';

export async function sweep(env, now = Date.now()) {
  const saveBefore = now - FEEDBACK_SAVE_KEEP_D * DAY_MS;
  const reportBefore = now - FEEDBACK_REPORT_KEEP_D * DAY_MS;
  const old = 'SELECT id FROM reports WHERE at < ?';
  const [, saves, , reports] = await env.DB.batch([
    env.DB.prepare(`UPDATE totals SET bytes = bytes -
        (SELECT COALESCE(SUM(LENGTH(blob)), 0) FROM saves WHERE report_id IN (${old})) WHERE id = 1`).bind(saveBefore),
    env.DB.prepare(`DELETE FROM saves WHERE report_id IN (${old})`).bind(saveBefore),
    env.DB.prepare('UPDATE reports SET save_bytes = 0 WHERE at < ? AND save_bytes > 0').bind(saveBefore),
    env.DB.prepare('DELETE FROM reports WHERE at < ?').bind(reportBefore),
    env.DB.prepare('DELETE FROM limits WHERE day < ?').bind(utcDay(now))
  ]);
  const s = await statsOf(env, now);
  const line = `feedback: ${s.day} today ${s.today}/${s.capToday} bytes ${s.bytes}/${s.capBytes} reports ${s.reports} unread ${s.unread}`;
  console.log(line);
  return { line, saves: saves.meta.changes, reports: reports.meta.changes };
}
