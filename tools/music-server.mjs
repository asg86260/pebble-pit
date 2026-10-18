// The music bench's half on the dev server: save a song to disk and render it.
//
// A song is a file in git (src/music/songs/), so the bench writes it here
// rather than keeping it in the browser. Render runs tools/music/render.mjs,
// which prints one JSON line an event, and those lines are streamed straight
// back to the page so it can show each stem as Surge finishes it. Serve only:
// a build has no bench and nothing here ships.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { validate } from '../src/music/song.js';

// Surge XT's factory patches, for the bench's patch list.
const SURGE_PATCHES = process.env.SURGE_PATCHES ||
  'C:/Users/asg86/AppData/Local/Programs/surge-xt/Surge Synth Team/SurgeXTData/patches_factory';
const listPatches = () => {
  if (!existsSync(SURGE_PATCHES)) return [];
  const out = [];
  for (const cat of readdirSync(SURGE_PATCHES, { withFileTypes: true }))
    if (cat.isDirectory())
      for (const f of readdirSync(join(SURGE_PATCHES, cat.name)))
        if (f.endsWith('.fxp')) out.push(cat.name + '/' + f.slice(0, -4));
  return out.sort();
};

const NAME = /^[a-z0-9][a-z0-9-]{0,40}$/;

export function musicPlugin(root) {
  const songs = join(root, 'src', 'music', 'songs');
  const renderer = join(root, 'tools', 'music', 'render.mjs');
  let rendering = null;

  const send = (res, code, body) => {
    res.statusCode = code;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(body));
  };
  const body = req => new Promise((ok, no) => {
    let s = '';
    req.on('data', c => { s += c; });
    req.on('end', () => ok(s));
    req.on('error', no);
  });

  return {
    name: 'music-bench',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__music', async (req, res) => {
        const url = new URL(req.url, 'http://x');
        const [, kind, name] = url.pathname.split('/');
        try {
          if (kind === 'songs' && req.method === 'GET')
            return send(res, 200, readdirSync(songs).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)));
          if (kind === 'patches' && req.method === 'GET') return send(res, 200, listPatches());
          if (!NAME.test(name || '')) return send(res, 400, { error: 'bad song name' });
          const file = join(songs, name + '.json');
          if (kind === 'song' && req.method === 'GET') {
            if (!existsSync(file)) return send(res, 404, { error: 'no such song' });
            return send(res, 200, JSON.parse(readFileSync(file, 'utf8')));
          }
          if (kind === 'song' && req.method === 'PUT') {
            const song = JSON.parse(await body(req));
            const bad = validate(song);
            if (bad.length) return send(res, 422, { error: bad.join('; ') });
            writeFileSync(file, JSON.stringify(song, null, 1) + '\n');
            return send(res, 200, { saved: name });
          }
          if (kind === 'render' && req.method === 'POST') {
            if (rendering) return send(res, 409, { error: 'a render is already running' });
            if (!existsSync(renderer)) return send(res, 501, { error: 'tools/music/render.mjs is not here yet' });
            const args = [renderer, file];
            const scene = url.searchParams.get('scene');
            if (scene === '*') args.push('--all'); else if (scene) args.push('--scene', scene);
            res.statusCode = 200;
            res.setHeader('content-type', 'application/x-ndjson');
            rendering = spawn(process.execPath, args, { cwd: root });
            rendering.stdout.on('data', c => res.write(c));
            let err = '';
            rendering.stderr.on('data', c => { err += c; if (err.length > 8000) err = err.slice(-8000); });
            rendering.on('close', code => {
              if (code) res.write(JSON.stringify({ event: 'error', message: `render exited ${code}`, log: err.slice(-2000) }) + '\n');
              rendering = null;
              res.end();
            });
            // The page going away stops the render with it.
            res.on('close', () => { if (rendering && !res.writableEnded) rendering.kill(); });
            return;
          }
          send(res, 404, { error: 'unknown' });
        } catch (e) {
          send(res, 500, { error: String(e.message || e) });
        }
      });
    },
  };
}
