// The daily cron (docs/wave-cloud.md, "The daily cron"). A plain function of
// the bindings and the clock, so the checks run it at any hour they like.
//
// What it sweeps is what nobody is coming back for: a vault minted and never
// pushed to, a vault no device has opened in half a year, a pairing past its
// ten minutes, a rate-limit row past its window. Each vault goes with its
// slots' bytes subtracted, so the store's ceiling measures what is there.

import { CLOUD_EMPTY_D, CLOUD_STALE_D } from '../../src/config/cloud.js';
import { DAY_MS } from './clock.js';
import { forgetVault, statsOf } from './app.js';

export async function sweep(env, now = Date.now()) {
  const { results } = await env.DB.prepare(
    'SELECT id FROM vaults WHERE (pushed = 0 AND created < ?) OR seen < ?'
  ).bind(now - CLOUD_EMPTY_D * DAY_MS, now - CLOUD_STALE_D * DAY_MS).all();
  for (const { id } of results) await env.DB.batch(forgetVault(env, id));

  await env.DB.batch([
    env.DB.prepare('DELETE FROM pairings WHERE expires <= ?').bind(now),
    env.DB.prepare('DELETE FROM limits WHERE until <= ?').bind(now)
  ]);

  const s = await statsOf(env, now);
  const line = `cloud: ${s.day} writes ${s.writes}/${s.capWrites} bytes ${s.bytes}/${s.capBytes} vaults ${s.vaults}`;
  console.log(line);
  return { line, swept: results.length };
}
