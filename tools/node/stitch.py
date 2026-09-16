"""Stitch the frames of a strip folder side by side: python tools/node/stitch.py <dir> <out.png>"""
import sys, os
from PIL import Image
d, out = sys.argv[1], sys.argv[2]
files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
ims = [Image.open(os.path.join(d, f)) for f in files]
w, h, pad = ims[0].width, ims[0].height, 6
strip = Image.new('RGB', ((w + pad) * len(ims) - pad, h), (255, 255, 255))
for i, im in enumerate(ims):
    strip.paste(im, (i * (w + pad), 0))
strip.save(out)
print(out, strip.size)
