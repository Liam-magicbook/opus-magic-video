# The Fuse — procedural foley and ambience from events.json (numpy/scipy only).
import json, os, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'out')
os.makedirs(OUT, exist_ok=True)
DUR = 156.7
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)

def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [max(20, lo), min(SR/2 - 100, hi)], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def noise(d): return rng.standard_normal(int(round(d * SR)))
def env(d, a=.004, r=.06):
    n = int(round(d * SR)); t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))
def norm(x, p=1.0):
    m = np.abs(x).max()
    return x * (p / m) if m > 0 else x

def add(buf, x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i < 0 or i >= len(buf): return
    n = min(len(x), len(buf) - i)
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[i:i+n, 0] += x[:n] * gain * l * 1.414
    buf[i:i+n, 1] += x[:n] * gain * r * 1.414

# ---------------- sound makers
def pen(d=.12, v=.5, bright=1.0):
    d = max(.04, d); n = int(d * SR); x = rng.standard_normal(n)
    fib = lp(rng.standard_normal(n), 60); fib = .55 + .45 * np.abs(fib) / (np.abs(fib).max() + 1e-9)
    grain = (rng.random(n) > .997) * rng.standard_normal(n) * 5
    y = bp(x, 1500 * bright, 7200 * min(1.3, bright)) * fib + hp(grain, 2400)
    e = np.minimum(1, np.arange(n) / (.006 * SR)) * np.minimum(1, (n - np.arange(n)) / (.02 * SR))
    return norm(y * e) * v * .5
def page(d=.42, v=.6):
    n = int(d * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 700, 6000) * (np.exp(-t / .09) * .8 + np.exp(-((t - .16) / .09) ** 2) * .5)
    low = lp(rng.standard_normal(n), 300) * np.exp(-t / .12)
    return norm(x + low * .6) * v * .5
def slap(v=.6):
    d = .2; n = int(d * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 300, 3000) * np.exp(-t / .025)
    b = np.sin(2 * np.pi * 110 * t) * np.exp(-t / .05)
    return norm(x + b * .7) * v * .5
def brush(d=1.2, v=.4, lo=250, hi=3000):
    n = int(d * SR); t = np.arange(n) / SR
    bub = lp(np.abs(rng.standard_normal(n)), 25); bub = bub / (bub.max() + 1e-9)
    y = bp(rng.standard_normal(n), lo, hi) * (.5 + .8 * bub)
    e = (1 - np.exp(-t / .05)) * np.exp(-t / (d * .4))
    return norm(y * e) * v * .5
def chime(v=.4, pitch=1.0):
    d = 1.6; n = int(d * SR); t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * pitch * t) * np.exp(-t / tau) for f, a, tau in [(880, .5, .5), (1320, .3, .35), (1980, .2, .2)])
    return norm(y) * v * .35
def thump(v=.5, pitch=1.0):
    d = .5; n = int(d * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 55 * pitch * t) * np.exp(-t / .16) + np.sin(2 * np.pi * 110 * pitch * t) * np.exp(-t / .09) * .5
    return norm(y) * v * .6
def whoosh(d=.8, v=.5):
    n = int(d * SR); t = np.arange(n) / SR
    sweep = 400 + 2600 * (t / d)
    y = rng.standard_normal(n)
    # cheap sweeping band: crossfade two bands
    y = bp(y, 300, 1400) * (1 - t / d) + bp(y, 900, 4200) * (t / d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    return norm(y * e) * v * .4
def crunch(v=.6):
    d = .5; n = int(d * SR); t = np.arange(n) / SR
    clicks = (rng.random(n) > .992) * rng.standard_normal(n)
    y = bp(clicks, 800, 6000) * np.exp(-t / .12) + lp(rng.standard_normal(n), 400) * np.exp(-t / .08) * .5
    return norm(y) * v * .6
def boom(v=.6, pitch=1.0):
    d = 1.4; n = int(d * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 48 * pitch * t) * np.exp(-t / .5) + np.sin(2 * np.pi * 96 * pitch * t) * np.exp(-t / .3) * .4
    y += lp(rng.standard_normal(n), 120) * np.exp(-t / .25) * .3
    return norm(y) * v * .7
def pop(v=.4):
    d = .18; n = int(d * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * (300 + 500 * t / d) * t) * np.exp(-t / .04)
    return norm(y) * v * .4
def riser(d=1.0, v=.4, hi=3000):
    n = int(d * SR); t = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 200, hi) * (t / d) ** 2
    return norm(y) * v * .4
def zap(d=1.0, v=.4):
    n = int(d * SR); t = np.arange(n) / SR
    f = 120 + 700 * (1 - t / d) ** 2
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / (d * .5)) + bp(rng.standard_normal(n), 1200, 6000) * np.exp(-t / (d * .3)) * .4
    return norm(y) * v * .4
def clip(v=.4):
    d = .09; n = int(d * SR); t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau) for f, a, tau in [(3100, .6, .012), (4700, .4, .008), (1900, .3, .02)])
    y += hp(rng.standard_normal(n), 3000) * np.exp(-t / .003) * .6
    return norm(y) * v * .3
def rub(d=2.0, v=.5):
    n = int(d * SR); t = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 500, 3500) * (.55 + .45 * np.abs(lp(rng.standard_normal(n), 40)) / (np.abs(lp(rng.standard_normal(n), 40)).max() + 1e-9))
    e = np.minimum(1, t / .15) * np.minimum(1, (d - t) / .2)
    return norm(y * e) * v * .4
def crackle(d=2.0, v=.4):
    n = int(d * SR); t = np.arange(n) / SR
    clicks = (rng.random(n) > .994) * rng.standard_normal(n) * 3
    y = bp(clicks, 1500, 9000) + lp(rng.standard_normal(n), 600) * .25
    e = np.minimum(1, t / .3) * np.minimum(1, (d - t) / .4)
    return norm(y * e) * v * .35
def tick(v=.4):
    d = .12; n = int(d * SR); t = np.arange(n) / SR
    y = hp(rng.standard_normal(n), 2500) * np.exp(-t / .004) + np.sin(2 * np.pi * 1800 * t) * np.exp(-t / .02) * .4
    return norm(y) * v * .3
def snap(v=.5):
    d = .3; n = int(d * SR); t = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 900, 7000) * np.exp(-t / .03) + np.sin(2 * np.pi * 240 * t) * np.exp(-t / .04) * .5
    return norm(y) * v * .45
def loomhit(d=1.4, v=.4):
    n = int(d * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 90 * t) * (.5 + .5 * np.sin(2 * np.pi * 3 * t)) * np.exp(-t / .6)
    y += np.sin(2 * np.pi * 270 * t) * .25 * np.exp(-t / .4)
    return norm(y) * v * .4
def book(v=.8):
    d = 1.2; n = int(d * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 70 * t) * np.exp(-t / .12) + np.sin(2 * np.pi * 140 * t) * np.exp(-t / .07) * .5
    y += lp(rng.standard_normal(n), 900) * np.exp(-t / .05) * .5
    return norm(y) * v * .6
def grip(v=.4):
    d = .6; n = int(d * SR); t = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 400, 2500) * (.3 + .7 * (rng.random(n) > .9)) * np.exp(-t / .2)
    return norm(y) * v * .4
def paperfly(d=1.2, v=.4):
    n = int(d * SR); t = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 1200, 7000) * (.4 + .6 * np.abs(np.sin(2 * np.pi * 7 * t)))
    e = np.sin(np.pi * np.clip(t / d, 0, 1))
    return norm(y * e) * v * .3

MAKE = {
    'pen': lambda e: pen(e.get('d', .12), e.get('v', .5)),
    'page': lambda e: page(e.get('dur', .42), e.get('v', .6)),
    'slap': lambda e: slap(e.get('v', .6)),
    'brush': lambda e: brush(e.get('d', e.get('dur', 1.0)), e.get('v', .4)),
    'chime': lambda e: chime(e.get('v', .4), e.get('pitch', 1.0)),
    'thump': lambda e: thump(e.get('v', .5), e.get('pitch', 1.0)),
    'whoosh': lambda e: whoosh(e.get('dur', .8), e.get('v', .5)),
    'crunch': lambda e: crunch(e.get('v', .6)),
    'boom': lambda e: boom(e.get('v', .6), e.get('pitch', 1.0)),
    'pop': lambda e: pop(e.get('v', .4)),
    'blink': lambda e: clip(e.get('v', .3)),
    'humIn': lambda e: riser(.8, e.get('v', .4), 800),
    'riser': lambda e: riser(e.get('dur', 1.0), e.get('v', .4)),
    'zap': lambda e: zap(e.get('dur', 1.0), e.get('v', .4)),
    'press': lambda e: rub(e.get('d', e.get('dur', 1.0)), e.get('v', .6)),
    'hiss': lambda e: bp(rng.standard_normal(int(e.get('dur', .8) * SR)), 2500, 8000) * .3 * e.get('v', .4),
    'dart': lambda e: whoosh(.35, e.get('v', .4)),
    'slide': lambda e: brush(e.get('dur', 2.0), e.get('v', .35), 300, 1800),
    'tick': lambda e: tick(e.get('v', .4)),
    'rub': lambda e: rub(e.get('dur', 2.0), e.get('v', .5)),
    'windIn': lambda e: whoosh(1.4, e.get('v', .4)),
    'wind': lambda e: brush(e.get('dur', 2.0), e.get('v', .25), 200, 1200),
    'grip': lambda e: grip(e.get('v', .4)),
    'clip': lambda e: clip(e.get('v', .4)),
    'ignite': lambda e: crackle(.5, e.get('v', .7)),
    'crackle': lambda e: crackle(e.get('dur', 2.0), e.get('v', .4)),
    'cut': lambda e: snap(e.get('v', .6)),
    'paperfly': lambda e: paperfly(e.get('dur', 1.2), e.get('v', .4)),
    'snap': lambda e: snap(e.get('v', .5)),
    'gpu': lambda e: tick(e.get('v', .3)),
    'loom': lambda e: loomhit(e.get('dur', 1.4), e.get('v', .4)),
    'mask': lambda e: rub(.6, e.get('v', .4)),
    'book': lambda e: book(e.get('v', .8)),
    'softOut': lambda e: brush(e.get('dur', 3.6), e.get('v', .25), 200, 900),
}

# ---------------- beds
def bed():
    t = np.arange(N) / SR
    paper = hp(rng.standard_normal(N), 3000) * .012 + lp(rng.standard_normal(N), 120) * .01
    city = lp(rng.standard_normal(N), 220) * .05 + bp(rng.standard_normal(N), 300, 900) * .008
    hum = (np.sin(2 * np.pi * 50 * t) * .012 + np.sin(2 * np.pi * 100 * t) * .007) * (1 + .2 * np.sin(2 * np.pi * .17 * t))
    fan = bp(rng.standard_normal(N), 150, 1400) * .018
    wind = bp(rng.standard_normal(N), 200, 1600) * .02 * (1 + .5 * np.sin(2 * np.pi * .11 * t))
    room = lp(rng.standard_normal(N), 500) * .012
    def ramp(x0, x1, a, b):
        y = np.clip((x0 - a) / (b - a), 0, 1); return np.clip((x1 - a) / (b - a), 0, 1) - y
    W = np.zeros(N)
    for (a, b) in [(0, 22)]: W += ramp(t, 0, a, b) * 0  # placeholder
    # section weights (smooth 0.8 s edges)
    def w(a, b, c, d):
        up = np.clip((t - a) / .8, 0, 1); dn = np.clip((d - t) / .8, 0, 1)
        return up * dn
    m = (paper * .8 + city * .9) * w(-1, 0, 21.9, 23) + \
        (room * 1.0 + paper * .4) * w(21.9, 23, 38.0, 39.2) + \
        (hum * 1.0 + fan * 1.0) * w(38.0, 39.2, 57.8, 59.2) + \
        (wind * 1.1 + room * .3) * w(57.8, 59.2, 74.2, 75.6) + \
        (wind * 1.2) * w(74.2, 75.6, 94.2, 95.6) + \
        (hum * .5 + fan * .35 + room * .8) * w(94.2, 95.6, 108.8, 110.0) + \
        (paper * .9 + room * .5) * w(108.8, 110.0, 139.8, 141.0) + \
        (room * .9) * w(139.8, 141.0, 999, 999)
    bed = np.stack([m, m], 1)
    # fade the very end
    fade = np.clip((N / SR - t) / 1.2, 0, 1)[:, None]
    return (bed * fade).astype(np.float32)

def main():
    ev = json.load(open(os.path.join(HERE, '..', 'events.json')))['ev']
    buf = np.zeros((N, 2), np.float32)
    for e in ev:
        fn = MAKE.get(e['type'])
        if not fn: continue
        try:
            x = fn(e)
        except Exception as ex:
            print('skip', e['type'], ex); continue
        if x is None: continue
        add(buf, x.astype(np.float32), e['t'], e.get('v', .5) * .55, e.get('pan', 0.0))
    B = bed()
    wet = buf * .9 + B
    # gentle compression and high-pass
    wet = np.stack([hp(wet[:, c], 35) for c in range(2)], 1)
    peak = np.abs(wet).max()
    if peak > 0: wet = wet / peak * .85
    wavfile.write(os.path.join(OUT, 'foley.wav'), SR, wet.astype(np.float32))
    print('foley events', len(ev), 'peak', float(np.abs(wet).max()))

if __name__ == '__main__':
    main()
