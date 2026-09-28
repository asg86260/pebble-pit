// A slot's size against the cloud's cap (DESIGN.md, "Fail-safes: space and
// budget"). The largest yard on file, gzipped the way cloud.js sends it, is
// under a quarter of CLOUD_BLOB_MAX: a save format that grows trips this long
// before a player's yard trips the worker's 413.

import { readFileSync } from 'node:fs';

const { group, ok } = await import('./helpers.mjs');
const { gzip } = await import('../src/cloud.js');
const { CLOUD_BLOB_MAX } = await import('../src/config.js');

group('the largest save fixture gzips under a quarter of the cap', async () => {
  const raw = readFileSync(new URL('./fixtures/quarry-crossing.json', import.meta.url), 'utf8');
  const size = (await gzip(raw)).length;
  return [
    ok(size > 0 && size < CLOUD_BLOB_MAX / 4, 'quarry-crossing.json gzipped is under a quarter of the cap',
       `${size} bytes of ${CLOUD_BLOB_MAX}, from ${raw.length}`)
  ];
});
