// A cached shape of rectangles filled with every edge on a whole device
// pixel, exactly.
//
// Snapping in world units is not enough. The canvas keeps its transform in
// single precision (1.6666666269... for a zoom of five sixths, doubled), so a
// rectangle snapped to a whole device pixel in double precision lands a few
// ten-thousandths of a pixel off it once the matrix has carried it. The
// rasterizer takes that hair as coverage: the edge comes out 254 of 255, a
// tone one step off the ink (a done mark's black seen as #010101 in the deep,
// which the deep's palette check counts). It shows only at zooms whose scale
// single precision cannot hold, so it came and went with the window's size.
//
// So the shape is laid in device pixels, every corner a whole number, and
// filled under a transform that is nothing but a whole-pixel offset: whole
// numbers are exact in single precision too, and no edge can fall between
// two pixels whatever the zoom.

import { ctx } from './ctx.js';

// `cache` is the caller's Map, one path per scale the shape has been drawn
// at; `lay(rect)` calls `rect(x0, y0, x1, y1)` for each rectangle, in the
// current space about the origin (`x`, `y`). The current transform is a
// scale and an offset (nothing here is drawn turned).
export function fillOnDevice(cache, lay, color, x = 0, y = 0) {
  const t = ctx.getTransform(), k = t.a;
  let path = cache.get(k);
  if (!path) {
    path = new Path2D();
    lay((x0, y0, x1, y1) => {
      const a = Math.round(x0 * k), b = Math.round(y0 * k);
      // a sliver thinner than a pixel still shows as one, as it did snapped
      path.rect(a, b, Math.max(1, Math.round(x1 * k) - a), Math.max(1, Math.round(y1 * k) - b));
    });
    cache.set(k, path);
  }
  ctx.setTransform(1, 0, 0, 1, Math.round(k * x + t.e), Math.round(t.d * y + t.f));
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.setTransform(t);
}
