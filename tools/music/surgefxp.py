"""Surge XT under pedalboard with a factory patch, ported from Sunday Vacuum.

pedalboard's load_preset() fails on Surge's .fxp, so the patch chunk (the
bytes after the 60-byte header) is written into the plugin's JUCE state,
which base64-encodes it with its own alphabet. The first process() after a
state change is silent, so the plugin is primed before it is handed back.
"""
import re
import pedalboard as pb

A = ".ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+"
SURGE = r"C:\Users\asg86\AppData\Local\Programs\surge-xt\Surge Synth Team"
# The inner binary: pointing pedalboard at the bundle folder fails to scan.
VST = SURGE + r"\Surge XT.vst3\Contents\x86_64-win\Surge XT.vst3"
FACTORY = SURGE + r"\SurgeXTData\patches_factory"
FXP_HEADER = 60


def _enc(b):
    bits = nb = 0
    o = []
    for x in b:
        bits |= x << nb
        nb += 8
        while nb >= 6:
            o.append(A[bits & 63])
            bits >>= 6
            nb -= 6
    if nb:
        o.append(A[bits & 63])
    return f"{len(b)}." + ''.join(o)


def load_surge(patch, sr, prime_s):
    p = pb.load_plugin(VST)
    s = p.raw_state
    m = re.search(rb'<IComponent>(.*?)</IComponent>', s, re.S)
    with open(f"{FACTORY}/{patch}.fxp", 'rb') as f:
        chunk = f.read()[FXP_HEADER:]
    p.raw_state = s[:m.start(1)] + _enc(chunk).encode() + s[m.end(1):]
    p([], prime_s, sr, 2)
    return p
