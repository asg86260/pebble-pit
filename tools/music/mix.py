"""Mix a scene's stems into one loop: python mix.py <plan.json>

The plan (written by render.mjs) names each stem, its level and pan, the
kick hits, the sample rate and the window [start, start + frames) of the
three-pass render that becomes the loop (tools/music/plan.mjs, loopWindow).
Every effect runs over the whole render, so the window starts with the
first pass's delay, reverb and compressor already in flight.

The chain follows the music-render skill's step 4: a kick-driven sidechain
on the bass and the pad, chorus on the pad, a dotted-eighth delay on the
lead, glue compression and a limiter on the master. Parts are found by
track id, the names the bench gives them.
"""
import json, sys
import numpy as np
import pedalboard as pb
from pedalboard.io import AudioFile

# The sidechain: a fast duck on each kick that breathes back out.
DUCK_ATTACK_S, DUCK_RELEASE_TAU, DUCK_SHAPE_S = .003, .15, .8
DUCK_DB = {'bass': 5, 'pad': 6}
# The bass: a little drive for weight on small speakers, its fizz trimmed.
BASS_DRIVE_DB, BASS_LP, BASS_HP = 5, 5000, 35
# The pad: a slow chorus to widen it, kept out of the bass and the hats.
PAD_CHORUS = dict(rate_hz=.7, depth=.35, centre_delay_ms=9, feedback=.1, mix=.45)
PAD_HP, PAD_LP = 160, 9000
# The lead: its taps alternate sides a dotted eighth apart, band-limited so
# the echoes sit behind the line rather than on it.
LEAD_HP, LEAD_SHELF_HZ, LEAD_SHELF_DB = 250, 7000, -3
DELAY_BEATS, DELAY_TAPS, DELAY_HP, DELAY_LP, DELAY_LEVEL = .75, (.5, .34, .23, .15), 300, 5000, .6
# One shared hall, sent lightly from the pad and the lead.
SEND = {'pad': .5, 'lead': .8}
DELAY_SEND = .5
HALL = dict(room_size=.55, damping=.6, wet_level=1, dry_level=0, width=1)
HALL_HP, HALL_LEVEL = 350, .32
# The master: glue, then a ceiling under the loudness pass's true-peak target.
MASTER_HP = 30
GLUE = dict(threshold_db=-16, ratio=2, attack_ms=25, release_ms=140)
MASTER_SHELF_HZ, MASTER_SHELF_DB, MASTER_LP = 8000, -2.5, 14000
MASTER_GAIN_DB, LIMIT_DB, LIMIT_RELEASE_MS = 3, -1.5, 80

plan = json.load(open(sys.argv[1]))
SR, N = plan['sr'], plan['total']
fx = lambda *p: (lambda x: pb.Pedalboard(list(p))(x.astype(np.float32), SR))


def fit(x):
    x = x[:, :N]
    return np.pad(x, ((0, 0), (0, N - x.shape[1]))) if x.shape[1] < N else x


def duck_curve(db):
    g, depth, a = np.ones(N), 1 - 10 ** (-db / 20), int(DUCK_ATTACK_S * SR)
    shape = np.concatenate([np.linspace(0, 1, a), np.exp(-np.arange(int(DUCK_SHAPE_S * SR) - a) / (DUCK_RELEASE_TAU * SR))])
    for t in plan['kicks']:
        i = int(round(t * SR))
        if i >= N:
            continue
        s = shape[:N - i]
        g[i:i + len(s)] = np.minimum(g[i:i + len(s)], 1 - depth * s)
    return g


def pingpong(x):
    m = fx(pb.HighpassFilter(DELAY_HP), pb.LowpassFilter(DELAY_LP))(x.mean(0, keepdims=True))[0]
    y, step = np.zeros_like(x), DELAY_BEATS * plan['beat']
    for k, g in enumerate(DELAY_TAPS):
        d = int(round((k + 1) * step * SR))
        y[k % 2, d:] += m[:N - d] * g
    return y


# Constant power, scaled so a centered track keeps its level.
def pan_gains(p):
    a = (max(-1, min(1, p)) + 1) * np.pi / 4
    return np.array([np.cos(a), np.sin(a)])[:, None] * np.sqrt(2)


dry, send = np.zeros((2, N)), np.zeros((2, N))
for t in plan['tracks']:
    x, tid = fit(np.load(t['stem']).astype(np.float64)), t['id']
    echo = None
    if tid == 'bass':
        x = fx(pb.Distortion(BASS_DRIVE_DB), pb.LowpassFilter(BASS_LP), pb.HighpassFilter(BASS_HP))(x)
    elif tid == 'pad':
        x = fx(pb.Chorus(**PAD_CHORUS), pb.HighpassFilter(PAD_HP), pb.LowpassFilter(PAD_LP))(x)
    elif tid == 'lead':
        x = fx(pb.HighpassFilter(LEAD_HP), pb.HighShelfFilter(LEAD_SHELF_HZ, LEAD_SHELF_DB))(x)
        echo = pingpong(x)
    if tid in DUCK_DB and plan['kicks']:
        x = x * duck_curve(DUCK_DB[tid])
    g = t['level'] * pan_gains(t.get('pan', 0))
    dry += x * g
    send += x * g * SEND.get(tid, 0)
    if echo is not None:
        dry += echo * g * DELAY_LEVEL
        send += echo * g * DELAY_SEND

mix = dry
if send.any():
    mix = mix + fx(pb.HighpassFilter(HALL_HP), pb.Reverb(**HALL))(send) * HALL_LEVEL
a, n = plan['start'], plan['frames']
glued = fx(pb.HighpassFilter(MASTER_HP), pb.Compressor(**GLUE),
           pb.HighShelfFilter(MASTER_SHELF_HZ, MASTER_SHELF_DB), pb.LowpassFilter(MASTER_LP),
           pb.Gain(MASTER_GAIN_DB))(mix)
y = fx(pb.Limiter(threshold_db=LIMIT_DB, release_ms=LIMIT_RELEASE_MS))(glued)
# How hard the limiter works: a few dB catches peaks, much more flattens the mix.
pre = 20 * np.log10(max(1e-9, float(np.abs(glued[:, a:a + n]).max())))
print(f"mix: into the limiter at {pre:+.1f} dBFS against a {LIMIT_DB} dB threshold", file=sys.stderr)
loop = y[:, a:a + n].copy()
# The head fades from the third pass's opening, the samples that really follow
# the loop's last one, into the second pass's own; the passes carry the same
# notes at the same offsets and differ only in oscillator phase, so a short
# linear fade between two nearly equal signals is all the seam needs.
k = plan['fade']
if k:
    w = np.linspace(0, 1, k, endpoint=False)
    loop[:, :k] = y[:, plan['end']:plan['end'] + k] * (1 - w) + loop[:, :k] * w
loop = loop.astype(np.float32)
with AudioFile(plan['out'], 'w', SR, 2) as f:
    f.write(loop)
print(f"mix: {n} frames, peak {float(np.abs(loop).max()):.3f}", file=sys.stderr)
