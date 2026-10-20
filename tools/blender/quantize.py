# The Blender renders put on the game's cell grid in the clouds' flat tones,
# and the owner's sheet built from them. Reference only: nothing here ships.
#
#   python tools/blender/quantize.py <render dir> <out dir> [game shot.png] [game cell px]
#
# A cell is cloud when the render covers at least half of it (its alpha):
# the day's lit tone is a hair off the sky, so cutting the silhouette by
# lightness would dissolve every sunlit edge into the sky. A cloud cell's
# tone is the average lightness of the cloud in it (sky pixels left out),
# taken to the nearest of the four day roles in L*. The dark page is the
# same cells recolored role for role, never quantized again.

import sys, os, json, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

P = 6
SIZES = (10, 20, 30)
LABEL = 'BLENDER TARGET (not the game)'

# src/config/clouds.js, CLOUDS_PALETTE and the 'round' band of
# CLOUDS_DEPTH_BANDS: roles sky, lit, body, shade, core.
ROLES = ['sky', 'lit', 'body', 'shade', 'core']
DAY = ['#ffffff', '#ebebeb', '#d6d6d6', '#a4a4a4', '#757575']
NIGHT = ['#121212', '#666666', '#4e4e4e', '#3a3a3a', '#262626']
SKY, LIT, BODY, SHADE, CORE = range(5)


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def lstar(v):
    # sRGB 0..1 grey to CIE L*
    lin = np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
    return np.where(lin > 216 / 24389, 116 * np.cbrt(lin) - 16, lin * 24389 / 27)


TONE_L = np.array([lstar(np.array(rgb(h)[0] / 255.0)) for h in DAY[1:]])


def load(path):
    a = np.asarray(Image.open(path).convert('RGBA')).astype(np.float64) / 255.0
    alpha = a[..., 3]
    # Blender writes straight (not premultiplied) alpha, so the grey is the cloud's own
    grey = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])
    ys, xs = np.nonzero(alpha > 0.5)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return grey[y0:y1, x0:x1], alpha[y0:y1, x0:x1]


def box(img, w, h):
    return np.asarray(Image.fromarray(img.astype(np.float32), 'F').resize((w, h), Image.BOX)).astype(np.float64)


def quantize(grey, alpha, rows):
    # rows tall; width from the cloud's own aspect
    h, w = grey.shape
    cols = max(1, round(w * rows / h))
    A = box(alpha, cols, rows)
    G = box(grey * alpha, cols, rows) / np.maximum(box(alpha, cols, rows), 1e-6)
    L = lstar(np.clip(G, 0, 1))
    tone = 1 + np.argmin(np.abs(L[..., None] - TONE_L[None, None, :]), axis=2)
    tone[A < 0.5] = SKY
    return tone, L


def neighbors(t):
    pad = np.pad(t, 1, constant_values=SKY)
    return pad[:-2, 1:-1], pad[2:, 1:-1], pad[1:-1, :-2], pad[1:-1, 2:]  # up, down, left, right


def faults(t):
    up, dn, lf, rt = neighbors(t)
    iso = (up != t) & (dn != t) & (lf != t) & (rt != t)
    thin = ((lf != t) & (rt != t)) | ((up != t) & (dn != t))
    return int(iso.sum()), int((thin & ~iso).sum())


def clean(t, passes=24):
    # A cell left one cell thick in its tone (across or up and down) takes the
    # tone most of its eight neighbors have, among the ones on its thin side:
    # the game's rule against single-cell lines (cloudgl.js, CLEAN). Cells are
    # taken one at a time in place -- two thin neighbors swapping at once
    # would only trade places -- and it repeats until nothing changes.
    t = t.copy()
    H, W = t.shape
    at = lambda y, x: t[y, x] if 0 <= y < H and 0 <= x < W else SKY
    for n in range(passes):
        changed = 0
        # the scan turns round each pass, so a pair that keeps handing a
        # thin cell back and forth is met from the other side
        ys = range(H) if n % 2 == 0 else range(H - 1, -1, -1)
        xs = list(range(W)) if n % 4 < 2 else list(range(W - 1, -1, -1))
        for y in ys:
            for x in xs:
                c = t[y, x]
                up, dn, lf, rt = at(y - 1, x), at(y + 1, x), at(y, x - 1), at(y, x + 1)
                cand = []
                if lf != c and rt != c:
                    cand += [lf, rt]
                if up != c and dn != c:
                    cand += [up, dn]
                if not cand:
                    continue
                ring = [at(y + j, x + i) for j in (-1, 0, 1) for i in (-1, 0, 1) if i or j]
                best = max(set(cand), key=lambda k: (ring.count(k), -abs(int(k) - int(c))))
                t[y, x] = best
                changed += 1
        if not changed:
            return t
    # What is left is a knot of three tones handing a thin cell round in a
    # ring; each is settled by whichever tone leaves the fewest thin cells
    # in its own five by five.
    def thin_near(y, x):
        n = 0
        for j in range(max(0, y - 2), min(H, y + 3)):
            for i in range(max(0, x - 2), min(W, x + 3)):
                c = t[j, i]
                if (at(j, i - 1) != c and at(j, i + 1) != c) or (at(j - 1, i) != c and at(j + 1, i) != c):
                    n += 1
        return n
    for _ in range(passes):
        f = faults(t)
        if not sum(f):
            break
        up, dn, lf, rt = neighbors(t)
        bad = ((lf != t) & (rt != t)) | ((up != t) & (dn != t))
        for y, x in zip(*np.nonzero(bad)):
            opts = set(at(y + j, x + i) for j in (-1, 0, 1) for i in (-1, 0, 1)) | {t[y, x]}
            score = {}
            for k in opts:
                t[y, x] = k
                score[k] = thin_near(y, x)
            t[y, x] = min(score, key=score.get)
    return t


def one_tone(t):
    return clean(np.where(t != SKY, BODY, SKY))


def two_tone(t):
    # Body, plus one flat shade on the underside: the render's shadowed cells
    # (its shade and core) that are connected to the silhouette's bottom edge
    # through shadowed cells, and in the lower half of their column, so the
    # crevices between domes up the cloud stay body.
    H, W = t.shape
    dark = (t == SHADE) | (t == CORE)
    up, dn, lf, rt = neighbors(t)
    seed = dark & (dn == SKY)
    top = np.array([np.argmax(t[:, x] != SKY) if (t[:, x] != SKY).any() else H for x in range(W)])
    bot = np.array([H - np.argmax(t[::-1, x] != SKY) if (t[:, x] != SKY).any() else 0 for x in range(W)])
    lower = np.zeros_like(dark)
    for x in range(W):
        mid = (top[x] + bot[x]) / 2
        lower[int(np.ceil(mid)):, x] = True
    ok = dark & lower
    reach = seed & ok
    while True:
        p = np.pad(reach, 1)
        grow = ok & (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])
        grow |= reach
        if (grow == reach).all():
            break
        reach = grow
    out = np.where(t != SKY, BODY, SKY)
    out[reach] = SHADE
    return clean(out)


def paint(t, page, cell=P, margin=2):
    pal = [rgb(h) for h in (DAY if page == 'light' else NIGHT)]
    H, W = t.shape
    im = np.zeros((H + 2 * margin, W + 2 * margin, 3), np.uint8)
    im[:] = pal[SKY]
    for k in range(5):
        im[margin:margin + H, margin:margin + W][t == k] = pal[k]
    return Image.fromarray(im).resize(((W + 2 * margin) * cell, (H + 2 * margin) * cell), Image.NEAREST)


def shares(t):
    n = max(1, int((t != SKY).sum()))
    return {ROLES[k]: round(100 * int((t == k).sum()) / n, 1) for k in (LIT, BODY, SHADE, CORE)}


def silhouette(t):
    # bumps on the top profile, the base's spread, how far the top rises
    H, W = t.shape
    cloud = t != SKY
    cols = [x for x in range(W) if cloud[:, x].any()]
    top = np.array([H - np.argmax(cloud[:, x]) for x in cols], float)        # height of the top
    bot = np.array([H - (H - np.argmax(cloud[::-1, x])) for x in cols], float)  # rows of sky under it
    # a bump is a run of columns standing higher than the columns either side
    peaks, x = [], 0
    while x < len(top):
        e = x
        while e + 1 < len(top) and top[e + 1] == top[x]:
            e += 1
        left = top[x - 1] if x > 0 else -1
        right = top[e + 1] if e + 1 < len(top) else -1
        if top[x] > left and top[x] > right:
            peaks.append(((x + e) / 2, top[x]))
        x = e + 1
    inner = bot[int(len(bot) * 0.15):max(int(len(bot) * 0.85), int(len(bot) * 0.15) + 1)]
    spacing = float(np.mean(np.diff([p[0] for p in peaks]))) if len(peaks) > 1 else None
    return {
        'cells': [H, W],
        'bumps': len(peaks),
        'bumps_per_10_cells_wide': round(10 * len(peaks) / W, 2),
        'bump_spacing_cells': round(spacing, 1) if spacing else None,
        'bump_heights_cells': sorted(set(int(h) for _, h in peaks)),
        'base_spread_cells_middle_70pct': int(inner.max() - inner.min()) if len(inner) else 0,
        'base_spread_cells_all': int(bot.max() - bot.min()),
        'rise_height_over_width': round(H / W, 2),
        'peak_at_share_of_width': round(peaks[int(np.argmax([p[1] for p in peaks]))][0] / W, 2) if peaks else None,
    }


def font(px):
    for f in ('C:/Windows/Fonts/consola.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, px)
    return ImageFont.load_default()


F = font(15)
FB = font(20)


def caption(im, text, page='light'):
    fg, bg = ((0, 0, 0), (255, 255, 255)) if page == 'light' else ((220, 220, 220), (18, 18, 18))
    c = Image.new('RGB', (max(im.width, int(F.getlength(text)) + 8), im.height + 22), bg)
    ImageDraw.Draw(c).text((2, 2), text, font=F, fill=fg)
    c.paste(im, (0, 22))
    return c


def row(ims, gap=16, bg=(255, 255, 255)):
    W = sum(i.width for i in ims) + gap * (len(ims) - 1)
    H = max(i.height for i in ims)
    r = Image.new('RGB', (W, H), bg)
    x = 0
    for i in ims:
        r.paste(i, (x, 0))
        x += i.width + gap
    return r


def stack(ims, gap=18, bg=(255, 255, 255), pad=16):
    W = max(i.width for i in ims) + 2 * pad
    H = sum(i.height for i in ims) + gap * (len(ims) - 1) + 2 * pad
    s = Image.new('RGB', (W, H), bg)
    y = pad
    for i in ims:
        s.paste(i, (pad, y))
        y += i.height + gap
    return s


def band(im, page):
    # a dark-page row sits on the dark page's own ground
    bg = (255, 255, 255) if page == 'light' else (18, 18, 18)
    b = Image.new('RGB', (im.width + 16, im.height + 16), bg)
    b.paste(im, (8, 8))
    return b


def heading(text, w=0):
    w = max(w, int(FB.getlength(text)) + 12)
    h = Image.new('RGB', (w, 30), (255, 255, 255))
    ImageDraw.Draw(h).text((0, 4), text, font=FB, fill=(0, 0, 0))
    return h


def main():
    src, out = sys.argv[1], sys.argv[2]
    shot = sys.argv[3] if len(sys.argv) > 3 else None
    shot_cell = int(sys.argv[4]) if len(sys.argv) > 4 else P
    os.makedirs(out, exist_ok=True)
    qdir = os.path.join(out, 'quantized')
    os.makedirs(qdir, exist_ok=True)
    order = ['near-turrets', 'towering', 'mid-group', 'far-flat', 'low-bank', 'fair-puff']
    names = [n for n in order if os.path.exists(os.path.join(src, n + '.png'))]
    report = {}
    compare = []
    simple_rows = []
    game = Image.open(shot).convert('RGB') if shot else None
    for name in names:
        grey, alpha = load(os.path.join(src, name + '.png'))
        # the render, small, over the white sky
        rgba = Image.open(os.path.join(src, name + '.png')).convert('RGBA')
        bbox = rgba.getchannel('A').point(lambda v: 255 if v > 127 else 0).getbbox()
        rgba = rgba.crop(bbox)
        sky = Image.new('RGBA', rgba.size, (255, 255, 255, 255))
        sky.alpha_composite(rgba)
        small = sky.convert('RGB')
        small = small.resize((int(small.width * 180 / small.height), 180), Image.LANCZOS) if small.height > 180 else small
        rep = {'sizes': {}}
        grids = {}
        for n in SIZES:
            t, L = quantize(grey, alpha, n)
            c = clean(t)
            o1, o2 = one_tone(t), two_tone(t)
            grids[n] = (t, c, o1, o2)
            for kind, g in (('four', t), ('four-clean', c), ('one', o1), ('two', o2)):
                for page in ('light', 'dark'):
                    paint(g, page).save(os.path.join(qdir, f'{name}-{n}-{kind}-{page}.png'))
            rep['sizes'][n] = {
                'raw_isolated_slivers': faults(t), 'clean_isolated_slivers': faults(c),
                'shares_raw': shares(t), 'shares_clean': shares(c),
                'silhouette_clean': silhouette(c),
            }
        rep['silhouette_one_tone_30'] = silhouette(grids[30][2])
        rep['two_tone_30_shares'] = shares(grids[30][3])
        report[name] = rep

        # the per-cloud sheet
        parts = [heading(f'{LABEL}  --  {name}', 900)]
        parts.append(caption(small, 'Blender render (Cycles volume), over white'))
        for kind, title in ((0, 'four tones, quantized (area average, nearest tone)'), (1, 'four tones, clean pass (no single cells, no one-cell slivers)')):
            for page in ('light', 'dark'):
                ims = [caption(paint(grids[n][kind], page), f'{n} cells  {sum(faults(grids[n][kind]))} faults', page) for n in SIZES]
                parts.append(band(caption(row(ims, bg=(255, 255, 255) if page == 'light' else (18, 18, 18)), f'{title}  [{page} page]', page), page))
        for page in ('light', 'dark'):
            for n in (20, 30):
                ims = [caption(paint(grids[n][k], page), lab, page) for k, lab in ((2, 'one tone (body)'), (3, 'two tones (body + underside)'), (1, 'four tones, clean'))]
                parts.append(band(caption(row(ims, bg=(255, 255, 255) if page == 'light' else (18, 18, 18)), f'simpler, {n} cells  [{page} page]', page), page))
        if game is not None:
            g = caption(game, 'REAL GAME (claude/playthrough-feedback-cb74a4 @ b052a1ac), level-god, zoom 1, unscaled')
            b = caption(paint(grids[20][1], 'light', cell=shot_cell), f'{LABEL}: 20 cells at the shot\'s {shot_cell} px a cell')
            parts.append(row([g, b]))
            compare.append(caption(paint(grids[20][1], 'light', cell=shot_cell), name))
        sheet = stack(parts)
        sheet.save(os.path.join(out, f'sheet-{name}.png'))
        simple_rows.append(row([caption(paint(grids[30][k], 'light'), f'{name}: {lab}') for k, lab in ((2, 'one tone'), (3, 'two tones'), (1, 'four tones'))]))

    # every cloud, simplest to fullest, at 30 cells
    stack([heading(f'{LABEL}  --  one, two and four tones at 30 cells', 900)] + simple_rows).save(os.path.join(out, 'sheet-simpler.png'))
    # every cloud at 20 cells beside the game's sky, the same cell size
    if game is not None:
        left = caption(game, 'REAL GAME (claude/playthrough-feedback-cb74a4 @ b052a1ac), level-god, zoom 1, unscaled')
        right = stack([heading(f'{LABEL}: 20 cells, clean, {shot_cell} px a cell', 600)] + compare, pad=0, gap=10)
        stack([row([left, right])]).save(os.path.join(out, 'sheet-vs-game.png'))
    with open(os.path.join(out, 'metrics.json'), 'w') as f:
        json.dump(report, f, indent=1)
    for name, rep in report.items():
        s = rep['sizes']
        print(name, {n: (s[n]['raw_isolated_slivers'], s[n]['clean_isolated_slivers']) for n in SIZES}, s[30]['shares_clean'])


if __name__ == '__main__':
    main()
