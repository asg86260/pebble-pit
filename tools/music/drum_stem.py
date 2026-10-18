"""The drum stem, synthesized in numpy by GM pitch.

    python drum_stem.py <events.json> <seconds> <sr> <out.npy>

No SoundFont: synthesized drums are punchier than GeneralUser GS's kits.
The noise is seeded so the same events give the same samples, which is
what lets the stem be cached.
"""
import json, sys
import numpy as np
import pedalboard as pb

SEED = 92
KICK_S, KICK_BODY_HZ, KICK_SWEEP_HZ, KICK_SWEEP_TAU = .45, 48, 130, .03
KICK_TAU, KICK_CLICK, KICK_CLICK_TAU, KICK_DRIVE, KICK_GAIN = .13, .35, .03, 1.6, .9
SNARE_S, SNARE_TONE_HZ, SNARE_TONE, SNARE_TONE_TAU = .3, 185, .5, .05
SNARE_NOISE_TAU, SNARE_HP, SNARE_LP, SNARE_GAIN = .07, 1200, 9000, .5
CLAP_S, CLAP_TAPS, CLAP_TAP_S, CLAP_TAP_TAU, CLAP_TAIL_TAU = .35, (0, .011, .022, .031), .012, .006, .07
CLAP_HP, CLAP_LP, CLAP_GAIN = 900, 7000, .55
HAT_S, HAT_TAU, OPEN_S, OPEN_TAU, HAT_HP, HAT_LP, HAT_GAIN = .1, .018, .4, .07, 6500, 10500, .22
# Velocity is a curve, not a line, so the soft hats sit back as on a kit.
VEL_CURVE = 1.2
# Per-voice stereo gains: the closed hat a touch right, the open one a touch left.
PAN = {36: (1, 1), 38: (1, 1), 39: (1, 1), 42: (.8, 1), 46: (1, .8)}

evs_path, seconds, sr, out = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
with open(evs_path) as f:
    evs = json.load(f)
rng = np.random.default_rng(SEED)
N = int(round(seconds * sr))


def noise(sec): return rng.standard_normal(int(sec * sr))
def env(n, tau): return np.exp(-np.arange(n) / (tau * sr))
def band(x, hp, lp): return pb.Pedalboard([pb.HighpassFilter(hp), pb.LowpassFilter(lp)])(x[None].astype(np.float32), sr)[0]


def kick():
    n = int(KICK_S * sr); t = np.arange(n) / sr
    ph = 2 * np.pi * np.cumsum(KICK_BODY_HZ + KICK_SWEEP_HZ * np.exp(-t / KICK_SWEEP_TAU)) / sr
    body = np.sin(ph) * env(n, KICK_TAU) + KICK_CLICK * np.sin(2 * ph) * env(n, KICK_CLICK_TAU)
    return np.tanh(KICK_DRIVE * body) * KICK_GAIN


def snare():
    n = int(SNARE_S * sr); t = np.arange(n) / sr
    tone = np.sin(2 * np.pi * SNARE_TONE_HZ * t) * env(n, SNARE_TONE_TAU)
    return (tone * SNARE_TONE + band(noise(SNARE_S)[:n] * env(n, SNARE_NOISE_TAU), SNARE_HP, SNARE_LP)) * SNARE_GAIN


def clap():
    n = int(CLAP_S * sr); x = np.zeros(n); last = len(CLAP_TAPS) - 1
    for k, d in enumerate(CLAP_TAPS):
        i = int(d * sr)
        m = int(CLAP_TAP_S * sr) if k < last else n - i
        x[i:i + m] += noise(m / sr)[:m] * env(m, CLAP_TAP_TAU if k < last else CLAP_TAIL_TAU)
    return band(x, CLAP_HP, CLAP_LP) * CLAP_GAIN


def hat(sec, tau):
    n = int(sec * sr)
    return band(noise(sec)[:n] * env(n, tau), HAT_HP, HAT_LP) * HAT_GAIN


SND = {36: kick(), 38: snare(), 39: clap(), 42: hat(HAT_S, HAT_TAU), 46: hat(OPEN_S, OPEN_TAU)}

buf = np.zeros((2, N))
for t, pitch, _len, vel in evs:
    if pitch not in SND:
        print(f"drum pitch {pitch} has no voice", file=sys.stderr)
        continue
    i = int(round(t * sr))
    if i >= N:
        continue
    seg = SND[pitch][:N - i] * (vel / 127) ** VEL_CURVE
    buf[:, i:i + len(seg)] += seg[None] * np.array(PAN[pitch])[:, None]
np.save(out, buf.astype(np.float32))
