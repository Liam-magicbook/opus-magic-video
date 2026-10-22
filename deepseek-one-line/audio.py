# deepseek-one-line — 60 s score. 100 BPM, 25 bars, 1 bar = 2.4 s.
# Every cut in the picture is a bar line, so the picture can be cut to the grid:
#   bar 0  0.0   ORIGIN      bar 5  12.0  COST       bar 12 28.8  SPARSITY   bar 18 43.2  ASYMMETRY
#   bar 2  4.8   ECONOMY     bar 8  19.2  SHOCK      bar 15 36.0  CONTEXT    bar 21 50.4  LINE
import sys, os, json
_H = os.path.dirname(os.path.abspath(__file__))
for _p in (os.path.join(_H, 'lib', 'audio'), os.path.join(_H, '..', 'lib', 'audio')):
    if os.path.isdir(os.path.join(_p, 'mgaudio')):
        sys.path.insert(0, _p); break
else:
    raise SystemExit('mgaudio not found (expected claude-lab/lib/audio next to this folder)')

import numpy as np
import mgaudio as mg
from mgaudio import sfx, synth, samples, drums, fx as FX
from mgaudio.core import Sound

# The shared sample index also lists files that were never downloaded into lib/audio/samples;
# hide them so Instrument.pick never lands on a missing FLAC.
_orig_index = samples._index
def _present_index():
    idx = _orig_index()
    return {k: [i for i in v if os.path.exists(os.path.join(samples.ROOT, i['file']))] for k, v in idx.items()}
samples._index = _present_index
samples.inst.cache_clear()

D = _H + '/'
E = json.load(open(D + 'cues.json'))['ev']
DUR, BPM = 60.0, 100.0
BAR = 60.0 / BPM * 4          # 2.4 s

m = mg.Mix(duration=DUR, bpm=BPM, anchor=0.0)

# ------------------------------------------------------------------ instruments
PIA = samples.inst('piano')
KAL = samples.inst('kalimba')
GLK = samples.inst('glock')
VIB = samples.inst('vibraphone')
HAR = samples.inst('harp')

piano = m.track('piano', level=-23, sends={'hall': -17})
kalimba = m.track('kalimba', level=-25, sends={'hall': -20}, pan=-.12)
glock = m.track('glock', level=-27, sends={'hall': -18}, pan=.2)
vibes = m.track('vibes', level=-27, sends={'hall': -20}, pan=-.25)
harp = m.track('harp', level=-30, sends={'hall': -14}, pan=.3)
pad = m.track('pad', level=-27, sends={'hall': -14, 'big': -20})
bowed = m.track('bowed', level=-28, sends={'big': -14}, hp=120)   # bow-ish pad, no samples
bass = m.track('bass', level=-24)
sub = m.track('sub', level=-26, lp=90)
taiko = m.track('taiko', level=-20, sends={'big': -16})
kick = m.track('kick', level=-27)
perc = m.track('perc', level=-30, sends={'room': -18})
air = m.track('air', level=-34, sends={'big': -12})     # beds: room tone, tape, wind

# ------------------------------------------------------------------ helpers
def piano_note(n, t, dur=2.0, vel=.55, gain=0.0):
    pia = PIA.play(n, dur=dur, vel=vel)
    piano.add(pia, t, gain=gain)

def kal(n, t, dur=.9, vel=.6, gain=0.0):
    kalimba.add(KAL.play(n, dur=dur, vel=vel), t, gain=gain)

def glk(n, t, dur=1.6, vel=.5, gain=0.0):
    glock.add(GLK.play(n, dur=dur, vel=vel), t, gain=gain)

def vib(n, t, dur=2.2, vel=.45, gain=0.0):
    vibes.add(VIB.play(n, dur=dur, vel=vel), t, gain=gain)

def chord(t, notes, dur, kind='warm', vel=.5, gain=0.0, trk=None):
    (trk or pad).add(synth.pad(notes, dur, vel=vel, kind=kind), t, gain=gain)

def bow(t, notes, dur, vel=.4, gain=0.0):
    """A bowed-string colour without a string library: a warm pad with a slow bow-like attack,
    plus a harp harmonic on the root to give the entrance an edge."""
    bowed.add(synth.pad(notes, dur, vel=vel, kind='strings', attack=.28, release=.9), t, gain=gain)
    harp.add(HAR.play(notes[0], dur=min(dur, 2.0), vel=.30), t + .02, gain=-10)

# ------------------------------------------------------------------ 01 ORIGIN (bars 0-1)
air.add(sfx.vinyl(2.6), 0.0, gain=-24)
air.add(sfx.static(2.2, 'radio'), 0.0, gain=-40)
piano_note('A2', 0.10, 4.6, .34)
piano_note('A3', 0.46, 3.4, .48)
piano_note('E4', 1.30, 2.8, .40)
piano_note('A4', 2.05, 2.6, .34)
piano_note('C5', 2.86, 3.0, .30)
piano_note('B4', 3.62, 1.4, .26)
piano_note('A4', 4.18, 2.0, .30)
bow(2.4, ['A2', 'E3'], 2.6, .26, -4)

# ------------------------------------------------------------------ 02 ECONOMY (bars 2-4)
ostinato = ['D4', 'F4', 'A4', 'C5', 'A4', 'F4', 'D4', 'A3']
for b in range(2, 5):
    for i in range(16):
        n = ostinato[i % 8] if (i // 8) % 2 == 0 else ostinato[7 - (i % 8)]
        kal(n, b * BAR + i * BAR / 16, .55, .30 + .17 * (i % 4 == 0))
    bass.add(synth.bass('D2' if b % 2 else 'A1', BAR * .9, .55, kind='sub'), b * BAR, gain=-3)
    pad.add(synth.pad(['D3', 'F3', 'A3', 'C4'] if b % 2 else ['A2', 'C3', 'E3', 'G3'],
                      BAR * .95, vel=.30, kind='air'), b * BAR, gain=-4)
# the six experts light up: one pluck each, rising
for i, t in enumerate(E['experts']):
    glk(['D5', 'F5', 'A5', 'C6', 'E6', 'G6'][i], t, 1.1, .34, -5)
# the price staircase: two falling notes per step
for i, (t, n) in enumerate([(E['price1'], 'A4'), (E['price1'] + .24, 'D4'),
                            (E['price2'], 'F4'), (E['price2'] + .24, 'A3')]):
    piano_note(n, t, 1.2, .38, -3)
# 93 % less KV cache / 5.76x throughput: a woodblock clock opening up
for i in range(6):
    perc.add(drums.woodblock('muyu', .5), E['kvcache'] + i * .12, gain=-8 + i)
perc.add(samples.hit('woodblock', vel=.6), E['throughput'], gain=-6)

# ------------------------------------------------------------------ 03 COST (bars 5-7)
# strings enter: Bb maj7 -> F/A -> Gm7, one chord per bar, wide
chords = [(['Bb2', 'D3', 'F3', 'A3'], 'strings'), (['F2', 'A2', 'C3', 'F3'], 'strings'),
          (['G2', 'Bb2', 'D3', 'F3'], 'strings')]
for i, (ns, k) in enumerate(chords):
    bow(5 * BAR + i * BAR, ns, BAR * 1.05, .30, -1)
    pad.add(synth.pad(ns, BAR * 1.02, vel=.26, kind='warm'), 5 * BAR + i * BAR, gain=-6)
# heartbeat: soft kick on 1 and 3, sub pulse underneath
for b in range(5, 8):
    for bt in (0, 2):
        kick.add(drums.kick('soft', .55), b * BAR + bt * BAR / 4, gain=-2)
    sub.add(synth.bass('Bb1' if b == 5 else ('F1' if b == 6 else 'G1'), BAR * .5, .5, kind='sub'),
            b * BAR, gain=-4)
# the loss curve falling: a glock descent, one note per 8th, landing on the flat
for i, n in enumerate(['A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'A4', 'G4']):
    glk(n, 5 * BAR + .3 + i * BAR / 8, 1.4, .22, -6)
# the ruler: 2,788,000 GPU hours counted out as ticks that accelerate then lock
for i in range(26):
    t = E['count'] + (i / 26) ** 1.7 * 1.02
    perc.add(sfx.tick('hi', ), t, gain=-20 + 8 * (i / 25))
perc.add(sfx.tick('wood'), E['count'] + 1.08, gain=-10)
piano_note('D3', E['cost'], 1.8, .40, -4)
piano_note('A3', E['cost'] + .12, 1.8, .34, -6)

# ------------------------------------------------------------------ 04 SHOCK (bars 8-11)
# build: taiko on the bar, then eighths, then sixteenths
for i, t in enumerate([8 * BAR, 8 * BAR + .6, 8 * BAR + 1.2, 8 * BAR + 1.5,
                       8 * BAR + 1.8, 8 * BAR + 1.95]):
    taiko.add(drums.taiko('taiko', .6 + .06 * i), t, gain=-6 + i)
for i in range(8):
    taiko.add(drums.taiko('rim', .4), 8 * BAR + 1.2 + i * .15, gain=-16 + i * .6)
bow(8 * BAR, ['E2', 'B2', 'E3'], BAR * .6, .40, -2)
for i in range(6):
    pad.add(synth.stab(['E3', 'G#3', 'B3'], .3, .5, kind='brass'), 8 * BAR + i * .3, gain=-14 + i)
# the cliff: bar 9 starts with everything
m.group('music').automate('gain', [(0, -8), (E['ch1'], -2), (1.6, 0), (E['ch3'] - .3, -1),
                                   (E['ch3'], -2), (E['cliff'] - .5, 0), (E['hush'], -1.5),
                                   (E['hush'] + .04, -60), (E['silenceEnd'] - .02, -60),
                                   (E['silenceEnd'] + .10, -3), (E['appstore'], -1),
                                   (E['ch4'], -2), (E['ch5'], -2.5), (E['ch6'], -3),
                                   (E['collapse'], -2), (E['title'], -3), (E['credits'], -8), (DUR, -12)])
taiko.add(drums.gong('chinese', .8), E['cliff'], gain=-8)
taiko.add(drums.taiko('dagu', .9), E['cliff'], gain=-3)
# the floor falls out: a sub drop and a long reverse tail into the silence
sub.add(sfx.sub_drop(1.5), E['cliff'] + .02, gain=-3)
m.sfx(sfx.impact('cinematic', 1.0), E['cliff'] + .04, gain=0, verb=-12)
m.sfx(sfx.whoosh(1.2, 'heavy', -1, .5), E['cliff'] + .1, gain=-8, verb=-14)
# 1.2 s of silence, then one piano note (bar 9.8 = 23.52)
piano_note('A3', E['silenceEnd'] + .02, 4.2, .42, -1)
piano_note('E3', E['silenceEnd'] + .02, 4.2, .26, -6)
air.add(sfx.static(1.6, 'radio'), E['hush'] + .06, gain=-44)
# R1: MIT, App Store #1, NVIDIA
vib('E5', E['r1date'], 2.4, .34, -8)
vib('A5', E['mit'], 2.2, .30, -9)
glk('C6', E['appstore'], 2.4, .30, -8)
glk('E6', E['appstore'] + .28, 2.2, .24, -11)
# the number: a low piano cluster and a dying cymbal under −17 %
piano_note('D2', E['nvda'], 3.4, .44, -3)
piano_note('A2', E['nvda'], 3.4, .30, -7)
taiko.add(drums.gong('tamtam', .5), E['nvda'], gain=-16)
# the line recovers: two soft piano notes climbing out
piano_note('C4', 27.6, 1.6, .28, -6)
piano_note('E4', 28.1, 1.6, .26, -8)

# ------------------------------------------------------------------ 05 SPARSITY (bars 12-14)
for i, (ns, k) in enumerate([(['F2', 'A2', 'C3', 'E3'], 'glass'),
                             (['C3', 'E3', 'G3', 'B3'], 'glass'),
                             (['G2', 'Bb2', 'D3', 'F3'], 'glass')]):
    pad.add(synth.pad(ns, BAR * 1.06, vel=.30, kind=k), 12 * BAR + i * BAR, gain=-4)
    sub.add(synth.bass(ns[0][:-1] + '1', BAR * .7, .4, kind='sub'), 12 * BAR + i * BAR, gain=-10)
air.add(sfx.static(2.0, 'radio'), 12 * BAR, gain=-46)
# the matrix: 2,240 dots, then most go dark — a filtered noise sweep does the fading
m.sfx(sfx.whoosh(1.1, 'air', 0, .35), E['sparse'], gain=-12, verb=-10)
for i in range(22):
    # the ones that survive: dry ticks that thin out
    t = E['sparse'] + (i / 22) ** 1.5 * 1.15
    perc.add(sfx.tick('hi'), t, gain=-26 + 6 * (i / 21))
# four golds: IMO, CMO, ICPC, IOI — a rising bell figure
for i, t in enumerate(E['medals']):
    glk(['F5', 'A5', 'C6', 'E6'][i], t, 2.2, .32, -4)
    vib(['C5', 'F5', 'A5', 'C6'][i], t + .04, 2.0, .22, -10)
# the matrix going dark: a high, thin shimmer that thins out with it
for i in range(10):
    t = 12 * BAR + .3 + i * .34
    vib(['C6', 'E6', 'G6', 'B5'][i % 4], t, 1.4, .10, -20 - i * 0.6)
# API −50 %: the price falls one more step
piano_note('C4', E['api50'], 1.4, .30, -5)
piano_note('F3', E['api50'] + .22, 1.6, .26, -7)

# ------------------------------------------------------------------ 06 CONTEXT (bars 15-17)
pad.add(synth.pad(['C2', 'G2', 'D3', 'E3', 'B3'], 3.0, vel=.34, kind='air'), 15 * BAR, gain=+1)
pad.add(synth.pad(['A2', 'E3', 'G3', 'C4'], 3.0, vel=.30, kind='air'), 16 * BAR, gain=-1)
pad.add(synth.pad(['F2', 'C3', 'E3', 'A3'], 3.0, vel=.30, kind='air'), 17 * BAR, gain=-1)
# a slow two-note figure, wide apart, to keep the long shot moving
for i, (t, a, b) in enumerate([(0, 'G5', 'E5'), (1, 'E5', 'C5'), (2, 'C5', 'A4')]):
    glk(a, 15 * BAR + i * BAR + .5, 2.0, .16, -16)
    vib(b, 15 * BAR + i * BAR + 1.7, 2.0, .14, -18)
m.sfx(sfx.whoosh(2.6, 'sci', 1, .3), 15 * BAR, gain=-30, verb=-12)
# 1,000,000 tokens: a long ruler being pulled out — paper slide + a rolling counter
m.sfx(sfx.paper('slide', 1.4), E['stretch'], gain=-14, pan=-.3, verb=-14)
for i in range(40):
    t = E['stretch'] + (i / 40) ** .85 * 1.5
    perc.add(sfx.tick('hi'), t, gain=-27 + 6 * (i / 39), pan=-.4 + .8 * (i / 39))
# the counter lands on 1,000,000
glk('E6', E['million'], 2.6, .34, -5)
vib('A4', E['million'] + .02, 2.4, .26, -8)
# the fold: a tape zip and a paper crumple, reversed into a soft thud
m.sfx(sfx.tape_rip(.5, up=False), E['fold'] - .3, gain=-12, verb=-10)
m.sfx(sfx.paper('crumple', .5), E['fold'] + .05, gain=-12, verb=-8)
perc.add(sfx.tick('wood'), E['fold'] + .28, gain=-9)

# ------------------------------------------------------------------ 07 ASYMMETRY (bars 18-20)
fig = [0, 2, 1, 3, 2, 0, 3, 1]          # the same kalimba figure as ECONOMY, now in 3/4-feel
for b, (root, ns) in enumerate([('D2', ['D3', 'F3', 'A3', 'C4']),
                                ('A1', ['A2', 'C3', 'E3', 'G3']),
                                ('Bb1', ['Bb2', 'D3', 'F3', 'A3'])]):
    for i in range(16):
        kal(ns[fig[i % 8]], 18 * BAR + b * BAR + i * BAR / 16, .5, .24 + .16 * (i % 4 == 0))
    bass.add(synth.bass(root, BAR * .8, .5, kind='sub'), 18 * BAR + b * BAR, gain=-4)
    pad.add(synth.pad(ns, BAR * 1.0, vel=.24, kind='warm'), 18 * BAR + b * BAR, gain=-8)
glk('A5', E['split'], 2.0, .30, -6)
# through the narrow gate: a breath, then the mouth opens
m.sfx(sfx.whoosh(.55, 'air', 1, .5), E['gate'], gain=-11, pan=-.1, verb=-12)
perc.add(sfx.tick('wood'), E['gate'] + .02, gain=-13)
m.sfx(sfx.whoosh(.7, 'air', 1, .55), E['decode'], gain=-10, pan=.2, verb=-12)
glk('C6', E['decode'] + .02, 2.0, .26, -7)
# KV cache to a quarter and an eighth: two ticks, two notes
perc.add(sfx.tick('hi'), E['cache'], gain=-14, pan=.2)
perc.add(sfx.tick('hi'), E['cache'] + .2, gain=-16, pan=.3)
piano_note('F4', E['cache'], 1.4, .30, -6)
piano_note('C5', E['cache'] + .2, 1.4, .24, -9)
# the last price step
piano_note('A3', E['price3'], 1.6, .34, -4)
piano_note('E3', E['price3'] + .2, 1.8, .28, -7)

# ------------------------------------------------------------------ 08 ONE LINE (bars 21-24)
# everything folds back: a reverse swell into a single piano note
m.sfx(sfx.reverse_cymbal(1.7), E['collapse'], gain=-14, verb=-10)
m.sfx(sfx.whoosh(1.5, 'cloth', 0, .4), E['collapse'] + .1, gain=-14, verb=-12)
piano_note('A2', E['collapse'] + .3, 5.0, .34, -3)
air.add(sfx.static(3.0, 'radio'), E['collapse'], gain=-46)
# title 52.6: the motif, one last time, alone
piano_note('A3', E['title'], 3.0, .50, 0)
piano_note('E4', E['title'] + .34, 2.8, .38, -2)
piano_note('A4', E['title'] + .76, 2.6, .32, -5)
# question 54.2
piano_note('C5', E['question'], 2.6, .30, -4)
piano_note('B4', E['question'] + .62, 2.2, .26, -7)
piano_note('A4', E['question'] + 1.24, 4.0, .28, -8)
bow(E['question'], ['A2', 'E3'], 4.4, .22, -8)
# credits 56.0: room tone only, and a very quiet sub
air.add(sfx.vinyl(3.4), E['credits'], gain=-32)
sub.add(synth.bass('A1', 3.0, .30, kind='sub'), E['credits'], gain=-14)
# the spark leaves frame
glk('A6', E['sparkOut'], 3.0, .18, -14)
m.sfx(sfx.sparkle(1.1, 10, key='A', mode='minor'), E['sparkOut'], gain=-20, verb=-8)

# ------------------------------------------------------------------ sound design on the picture
# the line is drawn / morphs at every chapter cut: one airy pass per cut
cuts = [E['ch1'], E['ch2'], E['ch3'], E['ch4'], E['ch5'], E['ch6'], E['collapse']]
for i, t in enumerate(cuts):
    m.sfx(sfx.whoosh(.6 if i < 5 else 1.2, 'air' if i % 2 else 'swish', 1 if i % 2 else 0, .38),
          t - .18, gain=-16, pan=(-.3 if i % 2 else .3), verb=-12)
# ink ticks as the text lands
for t in [E['date'], E['founding'], E['kvcache'], E['flat'], E['ruler'], E['mit'],
          E['appstore'], E['nvda'], E['medals'][0], E['million'], E['cache'], E['question']]:
    m.sfx(sfx.click('soft'), t, gain=-24)
# pads breathing
for t in [E['ch2'], E['ch5'], E['collapse']]:
    m.sfx(sfx.tick('clock'), t, gain=-40)

# ------------------------------------------------------------------ mix balance
for k, dg in {'piano': 1.5, 'kalimba': 2, 'glock': 1, 'pad': -1, 'bowed': 1,
              'bass': -2, 'sub': -3, 'taiko': -1, 'kick': 1, 'perc': 2}.items():
    if k in m.tracks:
        m[k].gain += dg
m.group('sfx').automate('gain', [(0, -4), (E['ch3'], 0), (E['hush'], -2), (E['silenceEnd'], 0), (DUR, 0)])

# ------------------------------------------------------------------ render
if __name__ == '__main__':
    print('bpm', m.grid.bpm, 'bar', round(m.grid.bar_len, 3), 'bars', round(DUR / m.grid.bar_len, 2))
    res = m.export(D + 'out/audio.wav', lufs=-14.0, tp=-1.0, spectrogram=D + 'out/audio_spec.png')
    print('done', res)
