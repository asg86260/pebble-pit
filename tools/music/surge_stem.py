"""One synth stem through Surge XT.

    python surge_stem.py <mid> <patch> <seconds> <sr> <prime_s> <out.npy>

One Surge per process: a second instance in the same process hangs, and
each takes 30 to 55 s to load, so render.mjs runs these side by side.
"""
import os, sys
import numpy as np
from mido import MidiFile, Message

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from surgefxp import load_surge

mid, patch, seconds, sr, prime_s, out = sys.argv[1:7]
seconds, sr, prime_s = float(seconds), int(sr), float(prime_s)

# mido turns the file's ticks into seconds through its tempo track; pedalboard
# wants each message stamped with its absolute time.
msgs, t = [], 0.0
for m in MidiFile(mid):
    t += m.time
    if m.type in ('note_on', 'note_off'):
        msgs.append(Message(m.type, note=m.note, velocity=m.velocity, channel=m.channel, time=t))

p = load_surge(patch, sr, prime_s)
n = int(round(seconds * sr))
y = p(msgs, seconds, sr, 2)[:, :n].astype(np.float32)
if y.shape[1] < n:
    y = np.pad(y, ((0, 0), (0, n - y.shape[1])))
np.save(out, y)
print(f"{patch}: peak {float(np.abs(y).max()):.3f}", file=sys.stderr)
