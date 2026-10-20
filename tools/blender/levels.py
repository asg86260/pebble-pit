# The L* spread of each render's cloud cells at 30 cells, against the four
# day tones' L*, for setting the one exposure every cloud shares.
#   python tools/blender/levels.py <render dir>
import sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from quantize import load, quantize, TONE_L

print('tones L*', TONE_L.round(1), 'boundaries', ((TONE_L[:-1] + TONE_L[1:]) / 2).round(1))
for n in ['near-turrets', 'towering', 'mid-group', 'far-flat', 'low-bank', 'fair-puff']:
    p = os.path.join(sys.argv[1], n + '.png')
    if os.path.exists(p):
        g, a = load(p)
        t, L = quantize(g, a, 30)
        print(n, 'L* 5/25/50/75/95%:', np.percentile(L[t != 0], [5, 25, 50, 75, 95]).round(1))
