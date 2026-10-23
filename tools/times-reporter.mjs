// A node test reporter: each file's time, boot and all, as one
// `TIMES node {...}` line, for test/times.json (`tools/times.mjs`). Run
// beside the usual reporter, so the log reads as it always has. A file is
// the test the runner wraps it in, named by its own path; the groups inside
// are named where `test()` is called, which is helpers.mjs for all of them.

export default async function* times(source) {
  const t = {};
  for await (const e of source) {
    const { file, name, details } = e.data || {};
    if (e.type === 'test:complete' && file && name && file.replaceAll('\\', '/').endsWith(name)) t[name] = Math.round(details.duration_ms);
  }
  yield `TIMES node ${JSON.stringify(t)}\n`;
}
