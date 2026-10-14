// The Worker's entry: the routes are `handle` and the cron is `sweep`, both
// plain functions the checks call with their own clock.

import { handle } from './app.js';
import { sweep } from './sweep.js';

export default {
  fetch: (request, env, ctx) => handle(request, env, Date.now(), ctx),
  // The kill switch stops the cron too: a paused worker touches nothing.
  scheduled: (event, env, ctx) => {
    if (env.FEEDBACK_PAUSED === '1') return;
    ctx.waitUntil(sweep(env, event.scheduledTime || Date.now()));
  }
};
