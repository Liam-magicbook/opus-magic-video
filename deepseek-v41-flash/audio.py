# deepseek-v41-flash — 60 s tech-explainer bed + UI sound design locked to cues.json
import sys, json, os
# mgaudio lives in the repo-root lib/audio; fall back to a sibling checkout so this stays runnable alone.
_H = os.path.dirname(os.path.abspath(__file__))
for _p in (os.path.join(_H, 'lib', 'audio'), os.path.join(_H, '..', 'lib', 'audio'),
           os.path.join(_H, '..', '..', 'mg-styles-15', 'lib', 'audio')):
    if os.path.isdir(os.path.join(_p, 'mgaudio')):
        sys.path.insert(0, _p)
        break
else:
    raise SystemExit('mgaudio not found — expected <repo>/lib/audio next to this folder')
import mgaudio as mg
from mgaudio import recipes, sfx, sync, synth, samples, fx as FX
from mgaudio import filters as F

D = os.path.dirname(os.path.abspath(__file__)) + '/'
C = json.load(open(D + 'cues.json')); E = C['ev']
OUT = D + 'out/audio.wav'

m = recipes.explainer(duration=60.0, bpm=112, key='D',
                      drop=E['c1kick'] + .04, build=E['c1kick'] - .62,
                      outro=E['dark'], music_level=-21.5, sfx_duck=4.0)
print('bpm', m.form.bpm, 'drop', round(m.form.drop, 2), 'build', round(m.form.build, 2), 'outro', round(m.form.outro, 2))

S = m.sfx
def T(name, **kw):
    try: return m.track(name, group='sfx', **kw)
    except Exception: return m.track(name, **kw)

FOL = T('foley', level=-11)
HIT = T('hit', level=-7)
HIT.insert(lambda x: FX.saturate(x, drive_db=8, kind='tanh'),
           lambda x: FX.compress(x, thr=-20, ratio=4, attack=.001, release=.08, makeup=5))
PEN = T('pen', level=-14, hp=900)

def hitS(at, gain=0, pan=0, seed=0, rr=0):
    HIT.add(sfx.sticker_slap(seed=seed), at=at, gain=gain + 3, pan=pan)
    HIT.add(samples.hit('slapstick', vel=.9, rr=rr, maxdur=.45), at=at, gain=gain, pan=pan)

def slapS(at, gain=0, pan=0, seed=0):
    FOL.add(samples.hit('slapstick', vel=.9, rr=seed, maxdur=.45), at=at, gain=gain, pan=pan)

# ---------------- A · hook ----------------
S(sfx.swish(dur=.22, seed=6), at=.02, gain=-13, pan=.3)
S(sfx.swish(dur=.26, seed=2), at=E['title1'] + .16, gain=-10, pan=-.3)
S(sfx.swish(dur=.26, seed=3), at=E['title2'] + .16, gain=-10, pan=-.3)
S(sfx.pen('marker', dur=.34, seed=4), at=E['marker'][0] + .12, gain=-10, pan=-.2)
S(sfx.click('soft'), at=E['kick'], gain=-11)
hitS(E['doc_land'], -8, .4, 1, 1)
for i, t in enumerate(E['chips']):
    S(sfx.pop('bubble', pitch=1.0 + .04 * i), at=t, gain=-9, pan=-.35 + .3 * i)
S(sfx.click('hard'), at=E['note'], gain=-13)
# second beat: the question sharpens into a thesis
S(sfx.swish(dur=.22, seed=8), at=E['q2'] - .04, gain=-16, pan=.2)
S(sfx.pen('marker', dur=.26, seed=9), at=E['q2'] + .5, gain=-14, pan=-.15)
S(sfx.blip(note=71, kind='sine'), at=E['q2'] + .56, gain=-15, pan=-.2)

# ---------------- camera whips between chapters ----------------
for (a, b), g, pk, flip in [((4.20, 5.25), -6, 4.83, -9), ((16.30, 17.40), -5, 16.92, -8),
                            ((27.60, 28.70), -5, 28.24, -8), ((39.80, 40.50), -8, 40.15, -10)]:
    S(sfx.whoosh(dur=min(1.05, b - a + .18), kind='swish', direction=1, peak=.45, seed=int(a * 10)),
      at=pk, gain=g)
    S(sfx.paper('flip', dur=.2), at=pk - .04, gain=flip, pan=.25)

# ---------------- B · CED ----------------
S(sfx.click('soft'), at=E['c1kick'], gain=-10)
S(sfx.paper('slide', dur=.4, seed=31), at=E['c1head'] + .2, gain=-16)
# two boxes are pasted on, one after the other
hitS(E['c1head'] + .18, -11, -.25, 71, 1)
hitS(E['c1head'] + .34, -10, .25, 72, 2)
S(sfx.blip(note=74, kind='sine'), at=E['prefill'], gain=-12, pan=-.35)
S(sfx.blip(note=81, kind='sine'), at=E['decode'], gain=-12, pan=.35)
S(sfx.pen('pen', dur=.5, seed=40), at=E['slash'], gain=-15, pan=-.1)
hitS(E['card'][0], -9, .35, 2, 2)
S(sfx.pop('mouth', pitch=1.0), at=E['card'][0] + .04, gain=-14, pan=.35)
# token lane: a steady run of soft ticks as tokens stream under both boxes
for i in range(16):
    S(sfx.tick('hi'), at=E['slash'] + .5 + i * .16, gain=-29 + 5 * (i / 15), pan=-.45 + .9 * (i / 15))
S(sfx.ding(note=76, dur=.7), at=E['note1'], gain=-16, pan=.1)
# second beat: 20 layer copies collapse into one shared copy
for i in range(6):
    S(sfx.tick('hi'), at=E['bstack'] + .5 + i * .09, gain=-27 + i, pan=.3 - .1 * i)
S(sfx.click('wood'), at=E['bstack'] + 1.02, gain=-11, pan=.35)
S(sfx.blip(note=83, kind='sine'), at=E['bstack'] + 1.06, gain=-15, pan=.35)

# ---------------- C · kv cache ----------------
S(sfx.click('soft'), at=E['c2kick'], gain=-10)
# count-up on 890: ticks that thicken and then lock
for i, k in enumerate(range(4, 22)):
    S(sfx.tick('hi'), at=E['n890'] + .045 * k, gain=-28 + 8 * (i / 18), pan=-.4 + .8 * (i / 18))
S(sfx.ding(note=78, dur=1.1), at=E['n890'] + .96, gain=-7, pan=-.2)
S(sfx.click('hard'), at=E['n890'] + .96, gain=-8)
hitS(E['bar0'], -6, -.2, 5, 2)
S(sfx.whoosh(dur=.3, kind='air', direction=0, peak=.4, seed=7), at=E['bar0'] + .16, gain=-15, pan=-.1)
hitS(E['bar1'], -6, .2, 6, 3)
S(sfx.whoosh(dur=.3, kind='air', direction=0, peak=.4, seed=8), at=E['bar1'] + .16, gain=-15, pan=.1)
S(sfx.ding(note=81, dur=1.0), at=E['n437'], gain=-8, pan=-.3)
for i, t in enumerate(E['c2tech']):
    S(sfx.click('wood'), at=t, gain=-13 + 2 * i, pan=-.2 + .25 * i)
S(sfx.tape_rip(dur=.18, up=False, seed=91), at=E['c2tech'][2] + .1, gain=-19)
# second beat: 890 B x 1M = 890 MB, one card holds 90 sessions
S(sfx.tick('hi'), at=E['cstack'] + .1, gain=-22, pan=.2)
S(sfx.blip(note=76, kind='sine'), at=E['cstack'] + .18, gain=-14, pan=.25)
S(sfx.ding(note=79, dur=.9), at=E['cstack'] + .52, gain=-17, pan=.3)

# ---------------- D · benchmarks ----------------
S(sfx.click('soft'), at=E['c3kick'], gain=-10)
names = [-.45, -.3, .3, .45, .1]
for i, t in enumerate(E['rows']):
    S(sfx.tick('hi'), at=t, gain=-20, pan=names[i])
    # each bar's growth ends in a soft chime; the rise is a short filtered swell
    S(sfx.whoosh(dur=.5, kind='air', direction=0, peak=.35, seed=20 + i), at=t + .24, gain=-22, pan=names[i])
    S(sfx.blip(note=[74, 76, 78, 81, 83][i], kind='sine'), at=t + .56, gain=-15, pan=names[i])
S(sfx.click('hard'), at=E['stamp'], gain=-3)
hitS(E['stamp'], -4, .35, 12, 4)
S(sfx.ding(note=86, dur=1.0), at=E['stamp'] + .02, gain=-9, pan=.35)
S(sfx.pen('marker', dur=.3, seed=50), at=E['note3'] - .1, gain=-18, pan=.2)
# second beat: five deltas roll up into +6.6
S(sfx.whoosh(dur=.36, kind='air', direction=0, peak=.35, seed=55), at=E['dsum'], gain=-19, pan=.3)
S(sfx.blip(note=84, kind='sine'), at=E['dsum'] + .12, gain=-13, pan=.3)
S(sfx.ding(note=88, dur=.9), at=E['dsum'] + .16, gain=-19, pan=.32)

# ---------------- E · multimodal + pricing ----------------
S(sfx.click('soft'), at=E['c4kick'], gain=-10)
S(sfx.pen('pen', dur=.5, seed=60), at=E['c4head'] + .3, gain=-16, pan=-.1)
for i, t in enumerate(E['cards']):
    hitS(t, -8, .15 + .2 * i, 20 + i, 5 + i)
    S(sfx.pop('bubble', pitch=.96 + .05 * i), at=t + .05, gain=-12, pan=-.1 + .2 * i)
for i, t in enumerate(E['price']):
    S(sfx.tick('hi'), at=t, gain=-15, pan=.15)
    S(sfx.blip(note=[69, 72, 76][i], kind='sine'), at=t + .03, gain=-16, pan=.2)
# the half-price ticket: a paper zip then a rubber stamp
S(sfx.tape_rip(dur=.2, up=False, seed=93), at=E['half'] - .05, gain=-14, pan=-.2)
hitS(E['half'], -5, -.2, 30, 2)
S(sfx.ding(note=84, dur=.9), at=E['half'] + .02, gain=-11, pan=-.2)
# second beat: cache hit is 50x cheaper than a miss
S(sfx.click('hard'), at=E['esplit'], gain=-13, pan=-.15)
S(sfx.blip(note=81, kind='sine'), at=E['esplit'] + .06, gain=-14, pan=-.1)
S(sfx.ding(note=86, dur=1.0), at=E['esplit'] + .12, gain=-18, pan=0)

# ---------------- F · end card ----------------
# pull-out to black: a low body drop + reverse swell into the peel
S(sfx.whoosh(dur=.9, kind='air', direction=0, peak=.35, seed=101), at=E['dark'] + .2, gain=-12)
S(sfx.riser(dur=1.4, kind='hybrid', end='cut'), at=E['slam'] - .18, gain=-11)
S(sfx.sticker_peel(dur=.26), at=E['peel'] + .02, gain=-8, pan=-.1)
S(sfx.whoosh(dur=1.4, kind='air', direction=0, peak=.5, seed=102), at=53.0, gain=-7)
S(sfx.impact(kind='punch', size=1.0), at=E['slam'], gain=1)
S(sfx.boom(dur=1.9), at=E['slam'], gain=-4)
hitS(E['slam'], 0, .2, 40, 6)
S(sfx.click('hard'), at=E['head'] - .04, gain=-9)
S(sfx.pen('marker', dur=.3, seed=70), at=E['tag'] + .04, gain=-11, pan=.15)
S(sfx.ding(note=86, dur=1.2), at=E['slam'] + .3, gain=-13, pan=.2)

# ---------------- mix tweaks ----------------
print('gains', {k: round(m[k].gain, 1) for k in m.tracks})
for k, dg in {'sub': -4, 'pluckbass': -3, 'pad': -3, 'glock': 2, 'arp': 3, 'shaker': 1, 'marimba': 2,
              'kick': -1, 'rim': 2}.items():
    if k in m.tracks: m[k].gain += dg
# bed: quiet through the intro title, open at the first chapter, breathe before the end, cut at the slam
m.group('music').automate('gain', [(0, -14), (E['kick'], -4), (1.2, -1), (E['c1kick'] - .06, 0),
                                   (E['c1kick'], 0), (E['dark'] - .5, 0), (E['dark'] + .1, -3),
                                   (E['slam'] - .16, -2), (E['slam'] - .12, -40), (E['slam'], -6),
                                   (E['slam'] + 1.2, 0), (60, 0)])
m.group('sfx').automate('gain', [(0, -3), (E['dark'], -1), (E['slam'] - .2, 0), (60, 0)])

res = m.export(OUT, lufs=-14.0, tp=-1.0, spectrogram=D + 'out/audio_spec.png')
print('done', res)
