# The raw renders over a white sky, stacked, for a quick look while tuning.
#   python tools/blender/contact.py <render dir> <out.png>
import sys, glob, os
from PIL import Image

files = sorted(glob.glob(os.path.join(sys.argv[1], '*.png')))
files = [f for f in files if not os.path.basename(f).startswith('_')]
ims = []
for f in files:
    im = Image.open(f).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    ims.append(bg.convert('RGB'))
W = max(i.width for i in ims)
H = sum(i.height + 8 for i in ims)
sheet = Image.new('RGB', (W, H), (200, 120, 120))
y = 0
for i in ims:
    sheet.paste(i, (0, y))
    y += i.height + 8
sheet.save(sys.argv[2])
