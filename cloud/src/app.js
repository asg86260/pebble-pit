// The cloud's routes (docs/wave-cloud.md, "Routes"). `handle` is the whole
// worker as a function of the request, the bindings and the clock, so the
// worker's checks and the game's node checks run this same code in-process
// over cloud/test/d1.mjs. Skeleton: WORKER fills every route.

export async function handle(request, env, now = Date.now()) {
  return new Response(JSON.stringify({ error: 'not built' }), {
    status: 501,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
  });
}
