# The Fuse — mix the song with the paper foley. Loudness mastering happens in mux.sh.
import os, subprocess, json
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'out')
os.makedirs(OUT, exist_ok=True)
SRC = os.path.join(HERE, 'song.mp3')
TMP = os.path.join(OUT, 'song.wav')

def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)

if not os.path.exists(TMP) or os.path.getmtime(TMP) < os.path.getmtime(SRC):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', SRC, '-ac', '2', '-ar', str(SR), TMP], check=True)
sr, music = wavfile.read(TMP)
music = music.astype(np.float32)
if music.max() > 1.5: music /= 32768.0
sr2, foley = wavfile.read(os.path.join(OUT, 'foley.wav'))
foley = foley.astype(np.float32)
N = min(len(music), len(foley), int(156.7 * SR))
music = music[:N]; foley = foley[:N]

# music sits forward; paper foley is close but never covers the vocal
M = music * .92
F = foley * 1.45

# duck the music a touch under the page turns, the bite, the fuse and the closing book
duck = np.ones(N, np.float32)
for t0, depth, d in [(22.0, .82, .5), (38.4, .84, .5), (58.4, .86, .5), (74.8, .86, .5), (94.8, .86, .5),
                     (109.3, .85, .55), (140.2, .78, .9), (16.6, .88, .5), (102.4, .9, .7), (136.0, .9, .6)]:
    a = int(max(0, (t0 - .15)) * SR); b = int(min(N / SR, t0 + d) * SR)
    if b <= a: continue
    r = np.linspace(0, 1, b - a)
    duck[a:b] = np.minimum(duck[a:b], depth + (1 - depth) * r ** 2)
M *= duck[:, None]

mix = M + F
mix = np.stack([hp(mix[:, c], 30) for c in range(2)], 1)
# soft limit
peak = np.abs(mix).max()
if peak > .98: mix = mix / peak * .98
# fade the last 0.8 s into paper
tail = int(.8 * SR)
mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
wavfile.write(os.path.join(OUT, 'mix.wav'), SR, mix.astype(np.float32))

def db(x): return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
print('music RMS %.1f dB   foley RMS %.1f dB   mix RMS %.1f dB   peak %.2f' % (db(M), db(F), db(mix), float(np.abs(mix).max())))
print('low<120Hz share %.1f dB' % (10 * np.log10((lp(mix[:, 0], 120) ** 2).mean() / (mix[:, 0] ** 2).mean() + 1e-12)))
