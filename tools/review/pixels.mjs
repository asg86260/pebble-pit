// PNG in, PNG and GIF out, in plain node: the review's shots are the
// headless shell's PNGs, and a moving change wants a GIF beside them.
//
// Nothing here is installed. node's zlib does PNG's deflate both ways, and a
// GIF is a palette and LZW, which is a page of code. The game is black and
// white with a handful of tones, so a frame almost always fits a 255-color
// palette exactly; a frame that does not (a store shot, a smeared screenshot)
// is cut down to its most-used colors, every other pixel taking the nearest.

import { inflateSync, deflateSync } from 'node:zlib';

// --- PNG ---------------------------------------------------------------------

// Eight bits a channel, not interlaced: what Chrome writes, and what the
// store art is. Gray, gray-alpha, RGB, RGBA and paletted all come back RGBA.
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png');
  let at = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0, pal = null, trns = null;
  const idat = [];
  while (at < buf.length) {
    const len = buf.readUInt32BE(at), kind = buf.toString('latin1', at + 4, at + 8);
    const body = buf.subarray(at + 8, at + 8 + len);
    if (kind === 'IHDR') { w = body.readUInt32BE(0); h = body.readUInt32BE(4); depth = body[8]; type = body[9]; interlace = body[12]; }
    else if (kind === 'PLTE') pal = body;
    else if (kind === 'tRNS') trns = body;
    else if (kind === 'IDAT') idat.push(body);
    else if (kind === 'IEND') break;
    at += 12 + len;
  }
  if (depth !== 8 || interlace) throw new Error(`png: depth ${depth}, interlace ${interlace} not read here`);
  const chans = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * chans, px = new Uint8Array(stride * h);
  // Undo each row's filter against the row above.
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride, up = row - stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= chans ? px[row + i - chans] : 0, b = y ? px[up + i] : 0, c = y && i >= chans ? px[up + i - chans] : 0;
      let v = raw[src + i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[row + i] = v;
    }
  }
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const s = i * chans, d = i * 4;
    if (type === 0) { data[d] = data[d + 1] = data[d + 2] = px[s]; data[d + 3] = 255; }
    else if (type === 4) { data[d] = data[d + 1] = data[d + 2] = px[s]; data[d + 3] = px[s + 1]; }
    else if (type === 2) { data[d] = px[s]; data[d + 1] = px[s + 1]; data[d + 2] = px[s + 2]; data[d + 3] = 255; }
    else if (type === 6) { data[d] = px[s]; data[d + 1] = px[s + 1]; data[d + 2] = px[s + 2]; data[d + 3] = px[s + 3]; }
    else { const k = px[s]; data[d] = pal[k * 3]; data[d + 1] = pal[k * 3 + 1]; data[d + 2] = pal[k * 3 + 2]; data[d + 3] = trns && k < trns.length ? trns[k] : 255; }
  }
  return { width: w, height: h, data };
}

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(kind, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0); out.write(kind, 4, 'latin1'); body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

// RGBA, every row unfiltered: the review's sheets are flat color, which
// deflate takes down well enough without a filter search.
export function encodePng({ width, height, data }) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) Buffer.from(data.buffer, data.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  const head = Buffer.alloc(13);
  head.writeUInt32BE(width, 0); head.writeUInt32BE(height, 4); head[8] = 8; head[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', head), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Several pictures in a grid on `bg`, `gap` pixels apart, `cols` to a row:
// the achievement icons of one ladder side by side, before and after.
export function tile(images, { cols = images.length, gap = 8, bg = [255, 255, 255, 255] } = {}) {
  const cw = Math.max(...images.map(i => i.width)), ch = Math.max(...images.map(i => i.height));
  const rows = Math.ceil(images.length / cols);
  const width = cols * cw + (cols + 1) * gap, height = rows * ch + (rows + 1) * gap;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set(bg, i * 4);
  images.forEach((im, n) => {
    const ox = gap + (n % cols) * (cw + gap), oy = gap + Math.floor(n / cols) * (ch + gap);
    for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
      const s = (y * im.width + x) * 4, d = ((oy + y) * width + ox + x) * 4, a = im.data[s + 3] / 255;
      for (let k = 0; k < 3; k++) data[d + k] = Math.round(im.data[s + k] * a + data[d + k] * (1 - a));
      data[d + 3] = 255;
    }
  });
  return { width, height, data };
}

// --- GIF ---------------------------------------------------------------------

// One palette for the whole clip (index 0 is transparent, for the pixels a
// frame leaves as the last one had them), so a frame's bytes are only what
// changed: each frame after the first is cut to the box of what moved.
export function encodeGif(frames, { delayMs = 100, loop = true } = {}) {
  const { width, height } = frames[0];
  const key = (d, i) => (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
  const counts = new Map();
  for (const f of frames) for (let i = 0; i < f.data.length; i += 4) { const k = key(f.data, i); counts.set(k, (counts.get(k) || 0) + 1); }
  const pal = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 255).map(e => e[0]);
  const index = new Map(pal.map((k, i) => [k, i + 1]));
  const near = k => {
    let best = 1, bd = Infinity;
    const r = k >> 16, g = (k >> 8) & 255, b = k & 255;
    pal.forEach((p, i) => { const d = (r - (p >> 16)) ** 2 + (g - ((p >> 8) & 255)) ** 2 + (b - (p & 255)) ** 2; if (d < bd) { bd = d; best = i + 1; } });
    index.set(k, best);
    return best;
  };
  const at = k => index.get(k) ?? near(k);

  const bytes = [];
  const u16 = n => bytes.push(n & 255, n >> 8);
  bytes.push(...Buffer.from('GIF89a', 'latin1')); u16(width); u16(height);
  bytes.push(0xf7, 0, 0);    // a global table of 256
  for (let i = 0; i < 256; i++) { const k = i === 0 ? 0 : pal[i - 1] ?? 0; bytes.push(k >> 16, (k >> 8) & 255, k & 255); }
  if (loop) bytes.push(0x21, 0xff, 11, ...Buffer.from('NETSCAPE2.0', 'latin1'), 3, 1, 0, 0, 0);

  let prev = null;
  for (const f of frames) {
    const idx = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) idx[i] = at(key(f.data, i * 4));
    // The box of what changed since the frame before; a still frame keeps one pixel.
    let x0 = 0, y0 = 0, x1 = width - 1, y1 = height - 1;
    if (prev) {
      x0 = width; y0 = height; x1 = -1; y1 = -1;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (idx[i] !== prev[i]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 < 0) { x0 = y0 = x1 = y1 = 0; }
    }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, sub = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y0 + y) * width + x0 + x;
      sub[y * w + x] = prev && idx[i] === prev[i] ? 0 : idx[i];
    }
    const cs = Math.round(delayMs / 10);
    bytes.push(0x21, 0xf9, 4, (1 << 2) | (prev ? 1 : 0), cs & 255, cs >> 8, 0, 0);
    bytes.push(0x2c); u16(x0); u16(y0); u16(w); u16(h); bytes.push(0);
    bytes.push(8);
    const lzw = lzwEncode(sub, 8);
    for (let i = 0; i < lzw.length; i += 255) { const n = Math.min(255, lzw.length - i); bytes.push(n); for (let k = 0; k < n; k++) bytes.push(lzw[i + k]); }
    bytes.push(0);
    prev = idx;
  }
  bytes.push(0x3b);
  return Buffer.from(bytes);
}

// GIF's LZW: variable-width codes, least significant bit first, the table
// cleared when it fills at 4096.
function lzwEncode(px, minSize) {
  const clear = 1 << minSize, end = clear + 1;
  const out = [];
  let size = minSize + 1, next = end + 1, acc = 0, bits = 0;
  const emit = code => { acc |= code << bits; bits += size; while (bits >= 8) { out.push(acc & 255); acc >>>= 8; bits -= 8; } };
  let dict = new Map();
  emit(clear);
  let cur = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i], kk = cur * 256 + k;
    const hit = dict.get(kk);
    if (hit !== undefined) { cur = hit; continue; }
    emit(cur);
    if (next < 4096) { dict.set(kk, next++); if (next > (1 << size) && size < 12) size++; }
    else { emit(clear); dict = new Map(); size = minSize + 1; next = end + 1; }
    cur = k;
  }
  emit(cur);
  emit(end);
  if (bits > 0) out.push(acc & 255);
  return out;
}
