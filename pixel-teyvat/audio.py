"""提瓦特 (Teyvat) soundtrack — harp, flute and plucked strings, locked to cues.json.

Not chiptune: the film's palette is the 20-pixel style but the world is Genshin, so the score is
harp arpeggios + a breathy flute lead + light pizzicato, with a bright glockenspiel for the item-get
fanfare and a night-time shimmer after the chest opens.

Form (all times from cues.json, 150 bpm, 0.4 s per beat, 1.6 s per bar):
    0.0-2.0  day   — harp arpeggio opens, flute enters on the run
    2.0-4.4  after — stomp hit, then the skid
    4.4-6.4  dusk  — dialogue box: thinner, harp + soft pad
    6.4-7.2  flash — item get: glock run + harp sweep
    7.2-8.0  title — full statement of the theme
    8.0-10.0 night — shimmer, held flute, final harp roll

Run: python3 audio.py   -> out/audio.wav
"""
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
# mgaudio lives in the repo-root lib/audio; fall back to a sibling checkout so this stays runnable alone.
for _p in (os.path.join(HERE, 'lib', 'audio'), os.path.join(HERE, '..', 'lib', 'audio'),
           os.path.join(HERE, '..', '..', 'mg-styles-15', 'lib', 'audio')):
    if os.path.isdir(os.path.join(_p, 'mgaudio')):
        sys.path.insert(0, _p)
        break
else:
    raise SystemExit('mgaudio not found — expected <repo>/lib/audio next to this folder')

import mgaudio as mg                                   # noqa: E402
from mgaudio import pluck, synth, fm, filters, drums, sfx   # noqa: E402
from mgaudio.theory import midi                        # noqa: E402
from mgaudio.core import Sound                         # noqa: E402

C = json.load(open(os.path.join(HERE, 'cues.json')))


m = mg.Mix(duration=10.0, bpm=C['bpm'], anchor=0.0)
m.group('music').level = -21
m.sfx_duck = 1.5

# ------------------------------------------------------------------ harmony
# One chord per half bar; the last bars cadence back to C for the night section.
CH = [(0.0, 'C'), (1.6, 'Am'), (3.2, 'F'), (4.0, 'G'), (4.8, 'F'), (5.6, 'G'),
      (6.4, 'C'), (7.2, 'Am'), (8.0, 'F'), (8.8, 'G'), (9.4, 'C')]
TRI = {'C': [48, 52, 55], 'Am': [45, 48, 52], 'F': [41, 45, 48], 'G': [43, 47, 50],
       'E': [40, 44, 47], 'Dm': [38, 41, 45]}


def chord_at(t):
    name = CH[0][1]
    for t0, n in CH:
        if t >= t0 - 1e-6:
            name = n
    return TRI[name]


# ------------------------------------------------------------------ harp arpeggio
harp = m.track('harp', level=-20, pan=-0.22, sends={'room': -15}, lp=9000)
harpPat = [0, 1, 2, 3, 2, 1]          # up-down inside the chord (+ octave on top)

t = 0.0
step = 0.2                            # 8ths at 150 bpm
while t < 10.0 - 1e-6:
    ch = chord_at(t)
    notes = ch + [ch[2] + 12]          # stay inside the harp's sampled range (34..95)
    n = notes[harpPat[int(round(t / step)) % len(harpPat)]]
    vel = 0.62 if t < 6.4 else 0.78
    if 4.4 <= t < 6.4:
        vel *= 0.62                   # dialogue: keep it under the text
    # engine='ks' forces the Karplus-Strong synth: the bundled harp sample pack is missing
    # most of its files (6 of 18), so sample playback raises on some notes.
    harp.add(pluck.harp(midi(n), dur=1.6, vel=vel, engine='ks', seed=int(t * 100)), at=t, gain=-1.5)
    t += step

# ------------------------------------------------------------------ flute lead
flute = m.track('flute', level=-22, pan=0.16, sends={'room': -14})


def flute_note(note, dur, vel=0.7):
    """Breathy flute: a soft sine-ish lead with slow vibrato and air added in the mix."""
    return synth.voice(midi(note), dur, vel, osc='sine', noise=0.055, cutoff=4200, res=0.1,
                       env=(0.06, 0.12, 0.85, 0.25), vib_rate=5.2, vib_cents=7.0,
                       vib_delay=0.18, seed=int(note * 7 + dur * 100))


# (time, midi note, duration) — G major pentatonic so it sits over every chord in the map
MEL = [
    (0.0, 67, 0.4), (0.4, 69, 0.2), (0.8, 72, 0.5), (1.4, 69, 0.2),
    (1.6, 76, 0.5), (2.2, 74, 0.2), (2.4, 72, 0.4), (2.8, 69, 0.4),
    (3.2, 67, 0.4), (3.6, 72, 0.4), (4.0, 74, 0.4), (4.4, 72, 0.3),
    # dialogue / dusk — sparse
    (4.8, 69, 0.6), (5.6, 67, 0.6),
    # item get
    (6.4, 79, 0.15), (6.6, 81, 0.15), (6.8, 84, 0.4),
    # title statement
    (7.2, 76, 0.4), (7.6, 79, 0.4), (8.0, 81, 0.6), (8.8, 79, 0.3), (9.2, 76, 0.3),
    # final
    (9.6, 72, 0.4),
]
for at, n, d in MEL:
    flute.add(flute_note(n, d, vel=0.62), at=at)

# ------------------------------------------------------------------ pizzicato bass
bass = m.track('pizz', level=-22, pan=0.0, sends={'room': -18})
for bar in np.arange(0.0, 10.0, 1.6):
    for k, off in enumerate((0.0, 0.8)):
        n = max(36, chord_at(bar + off)[0] - 12)
        bass.add(pluck.pizz(midi(n), 0.42, 0.72, seed=int(bar * 10 + k)), at=bar + off)

# ------------------------------------------------------------------ glock fanfare for the item get
glock = m.track('glock', level=-20, pan=0.3, sends={'room': -12})
for i, n in enumerate([79, 84, 88, 91]):
    glock.add(fm.mallet(midi(n), 0.7, 0.8, 'xylo'), at=6.4 + i * 0.08)

# ------------------------------------------------------------------ night shimmer
shim = m.track('shimmer', level=-26, pan=-0.4, sends={'room': -10})
for i, n in enumerate([79, 83, 86, 88]):
    shim.add(fm.bell(midi(n), 1.2, 0.45), at=8.0 + i * 0.18)

# ------------------------------------------------------------------ sound design, locked to cues
sfxT = m.track('sfx', level=-18)
for t_jump in C['jumps']:
    sfxT.add(sfx.jump(), at=t_jump, gain=-4)
for t_land in C['lands']:
    sfxT.add(sfx.impact(), at=t_land, gain=-6)
for t_coin in C['coins']:
    sfxT.add(sfx.coin(), at=t_coin, gain=-7)
sfxT.add(sfx.impact(), at=C['stomp'], gain=-3)                    # stomp
sfxT.add(sfx.swish(dur=0.3), at=C['skid'], gain=-8)               # skid
sfxT.add(sfx.boom(), at=C['chest_open'], gain=-8)                 # chest bursts open
for t_lid in C['lid_hops']:
    sfxT.add(sfx.tick(), at=t_lid, gain=-10)
for t_type in C['type'][:7]:
    sfxT.add(sfx.typing(), at=t_type, gain=-14)
sfxT.add(sfx.impact(), at=C['logo'], gain=-5)                     # title slam
for i, t_wave in enumerate(C['night_wave']):
    sfxT.add(sfx.sparkle(), at=t_wave, gain=-10)

out = os.path.join(HERE, 'out', 'audio.wav')
os.makedirs(os.path.dirname(out), exist_ok=True)
m.export(out, lufs=-15.0, tp=-1.0)
print('wrote', out)
