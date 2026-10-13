// A save, gzipped and back: CompressionStream, which every browser, the desk,
// node and a Worker carry, so no dependency. A busy yard is a few kilobytes
// this way. The cloud's sync and the feedback form both send a save so, and
// the feedback worker reads one back so.

async function pipe(data, stream) {
  return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(stream)).arrayBuffer());
}
export const gzip = raw => pipe(new TextEncoder().encode(raw), new CompressionStream('gzip'));
export const gunzip = async b => (b.length ? new TextDecoder().decode(await pipe(b, new DecompressionStream('gzip'))) : '');
