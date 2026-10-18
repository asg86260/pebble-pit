"""Mix a scene's stems into one loop: python mix.py <plan.json>

The plan (written by render.mjs) names each stem, its level, pan and effects
chain, the kick hits, the beat length, the sample rate and the window
[start, start + frames) of the three-pass render that becomes the loop
(tools/music/plan.mjs, loopWindow). Every effect runs over the whole render,
so the window starts with the first pass's delay, reverb and compressor
already in flight.

Each track's chain is its own (DESIGN.md, "A track's effects chain"): the
boxes run in the song file's order, every knob filled by plan.mjs, before the
track's level and pan; FX maps each MUSIC_FX type to the function that plays
it. The master's glue compression and limiter are the mix's, not a track's.
Effects run here rather than in the stems, so a turned knob costs a mix and
never a Surge render.
"""
import json, sys
import numpy as np
import pedalboard as pb
from pedalboard.io import AudioFile

# The filter box: the ladder's gentler 12 dB slope for each of its three types.
FILTER_MODES = {'lowpass': pb.LadderFilter.Mode.LPF12, 'highpass': pb.LadderFilter.Mode.HPF12,
                'bandpass': pb.LadderFilter.Mode.BPF12}
# The EQ box's three corners: a low shelf, a bell and a high shelf.
EQ_LOW_HZ, EQ_MID_HZ, EQ_HIGH_HZ, EQ_MID_Q = 200, 1000, 5000, .7
# The sidechain: a fast duck on each kick that breathes back out, its shape
# long enough for the slowest release to come all the way back.
DUCK_ATTACK_S, DUCK_TAIL_TAUS = .003, 6
# The master: glue, then a ceiling under the loudness pass's true-peak target.
MASTER_HP = 30
GLUE = dict(threshold_db=-16, ratio=2, attack_ms=25, release_ms=140)
MASTER_SHELF_HZ, MASTER_SHELF_DB, MASTER_LP = 8000, -2.5, 14000
MASTER_GAIN_DB, LIMIT_DB, LIMIT_RELEASE_MS = 3, -1.5, 80

plan = json.load(open(sys.argv[1]))
SR, N = plan['sr'], plan['total']
fx = lambda *p: (lambda x: pb.Pedalboard(list(p))(x.astype(np.float32), SR).astype(np.float64))


def fit(x):
    x = x[:, :N]
    return np.pad(x, ((0, 0), (0, N - x.shape[1]))) if x.shape[1] < N else x


def blend(x, wet, mix):
    return x * (1 - mix) + wet * mix


def duck_curve(db, tau):
    g, depth, a = np.ones(N), 1 - 10 ** (-db / 20), int(DUCK_ATTACK_S * SR)
    shape = np.concatenate([np.linspace(0, 1, a), np.exp(-np.arange(int(DUCK_TAIL_TAUS * tau * SR)) / (tau * SR))])
    for t in plan['kicks']:
        i = int(round(t * SR))
        if i >= N:
            continue
        s = shape[:N - i]
        g[i:i + len(s)] = np.minimum(g[i:i + len(s)], 1 - depth * s)
    return g


# One function a MUSIC_FX type, each taking the stem and the box's knobs.
def filter_(x, p):
    return fx(pb.LadderFilter(mode=FILTER_MODES[p['type']], cutoff_hz=p['cutoff'], resonance=p['reso']))(x)


def eq(x, p):
    return fx(pb.LowShelfFilter(EQ_LOW_HZ, p['low']), pb.PeakFilter(EQ_MID_HZ, p['mid'], EQ_MID_Q),
              pb.HighShelfFilter(EQ_HIGH_HZ, p['high']))(x)


def drive(x, p):
    return blend(x, fx(pb.Distortion(drive_db=p['amount']), pb.LowpassFilter(p['tone']))(x), p['mix'])


def bitcrush(x, p):
    return blend(x, fx(pb.Bitcrush(bit_depth=p['bits']))(x), p['mix'])


def chorus(x, p):
    return fx(pb.Chorus(rate_hz=p['rate'], depth=p['depth'], mix=p['mix']))(x)


def phaser(x, p):
    return fx(pb.Phaser(rate_hz=p['rate'], depth=p['depth'], mix=p['mix']))(x)


# The time knob is in beats, so the echoes land on the song's grid.
def delay(x, p):
    return fx(pb.Delay(delay_seconds=p['time'] * plan['beat'], feedback=p['feedback'], mix=p['mix']))(x)


def reverb(x, p):
    return fx(pb.Reverb(room_size=p['size'], damping=p['damp'], wet_level=p['mix'], dry_level=1 - p['mix']))(x)


def comp(x, p):
    return fx(pb.Compressor(threshold_db=p['threshold'], ratio=p['ratio'], release_ms=p['release']))(x)


# With no kicks in the scene there is nothing to duck under.
def duck(x, p):
    return x * duck_curve(p['amount'], p['release']) if plan['kicks'] else x


FX = {
    'filter': filter_,
    'eq': eq,
    'drive': drive,
    'bitcrush': bitcrush,
    'chorus': chorus,
    'phaser': phaser,
    'delay': delay,
    'reverb': reverb,
    'comp': comp,
    'duck': duck,
}


# Constant power, scaled so a centered track keeps its level.
def pan_gains(p):
    a = (max(-1, min(1, p)) + 1) * np.pi / 4
    return np.array([np.cos(a), np.sin(a)])[:, None] * np.sqrt(2)


mix = np.zeros((2, N))
for t in plan['tracks']:
    x = fit(np.load(t['stem']).astype(np.float64))
    for box in t.get('fx', []):
        x = FX[box['type']](x, box['params'])
    mix += x * t['level'] * pan_gains(t.get('pan', 0))

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
