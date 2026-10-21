"""Paimon sprite generator — writes js/paimon_art.js.

ONE pixel grid for the whole film: the hero is drawn in the same 320x180 design grid as the world,
so one character = one world pixel = 6 screen px at base zoom.

Canvas 21 x 32, centre column 10, boot sole on art row 29.

Vertical plan
    y0-1   halo: a THICK band (4 rows of colour), not a 1 px ring — a 1 px ring's hole gets inked
           solid by outline(), which is what used to turn it into a black bar or a "hat"
    y2-4   gap, so the halo floats clear of the hair
    y5-19  head: tall oval, hair wings spiking out at eye level
    y13-17 face window (small and low — this is the chibi ratio)
    y20-21 navy scarf
    y22-26 white dress, rose-gold hip plates, slate hem
    y21-28 starfield cape flaring wide BEHIND the dress
    y27-29 stockings + rose-gold boots

What makes her read as Paimon rather than a white blob:
    * head is a TALL oval, not a circle, ~2x the body's width
    * face window is only 7 px of a 15 px head, so hair frames it
    * two pointed hair wings spike out at eye level
    * navy cape is the widest mass in the lower half
    * halo is narrower than the head and floats above it

Letters match LEG in js/scene.js:
    w silver · z silver shade · I slate trim · x skin · S skin shade
    P rose · o rose light · R rose dark · N navy · n navy dark · m eye · u cream · y gold

Run: python3 tools/gen_paimon.py --write     → js/paimon_art.js
     python3 tools/gen_paimon.py idle0       → print that pose
"""
import os
import sys

W, H = 21, 32
CX = 10

# halo: thick band so it survives outline(). row -> (left, right, colour)
HALO = {                     # open arc, not a closed ring — see draw_halo()
    0: (7, 13),
    1: (7, 8),
    2: (13, 13),
}

# row -> (left, right): solid head mass (tall oval)
HEAD = {
    5: (7, 13),
    6: (6, 14),
    7: (5, 15),
    8: (4, 16),
    9: (4, 16),
    10: (3, 17),
    11: (3, 17),
    12: (3, 17),
    13: (3, 17),
    14: (3, 17),
    15: (4, 16),
    16: (4, 16),
    17: (5, 15),
    18: (6, 14),
    19: (7, 13),
}
# pointed hair wings at eye level: row -> (outer, inner) on the left, mirrored to the right
WINGS = {
    11: (2, 3),
    12: (1, 3),
    13: (1, 3),
    14: (2, 4),
}
# small face window, low in the head
FACE = {
    13: (7, 13),
    14: (7, 13),
    15: (7, 13),
    16: (8, 12),
    17: (8, 12),
}
# fringe locks painted back over the forehead
FRINGE = {
    13: [(7, 13)],
    14: [(7, 7), (10, 10), (13, 13)],
}

BODY = {
    20: [(6, 14, 'N')],                                    # scarf
    21: [(5, 15, 'N')],
    22: [(4, 16, 'w')],                                    # bodice — the wide mass
    23: [(3, 17, 'w')],
    24: [(3, 17, 'w')],                                    # skirt
    25: [(3, 17, 'w')],
    26: [(3, 17, 'I')],                                    # slate hem
}

# starfield cape: row -> half-width. One wide panel behind the dress.
# Cape half-width stays only ~1-3 px wider than the dress, so it reads as wings, not a bowl.
CAPE = {
    'hang': [(22, 8), (23, 8), (24, 8), (25, 8), (26, 8), (27, 7), (28, 6)],
    'up':   [(22, 8), (23, 8), (24, 8), (25, 7)],
    'down': [(22, 9), (23, 9), (24, 9), (25, 9), (26, 8), (27, 7), (28, 6)],
    'run':  [(22, 9), (23, 9), (24, 9), (25, 8), (26, 8), (27, 7), (28, 6)],
}


def blank():
    return [['.'] * W for _ in range(H)]


def put(g, x, y, c):
    if c != '.' and 0 <= int(x) < W and 0 <= int(y) < H:
        g[int(y)][int(x)] = c


def span(g, y, x0, x1, c):
    for x in range(int(x0), int(x1) + 1):
        put(g, x, y, c)


def draw_halo(g):
    # An OPEN arc: one lit bar across the top and two tips curling down. The middle is left empty, so
    # the sky shows through the gap instead of a filled disc, and there is no enclosed hole that would
    # otherwise read as a coloured hat.
    span(g, 0, 7, 13, 'P')
    put(g, 7, 1, 'P'); put(g, 8, 1, 'o')
    put(g, 12, 1, 'o'); put(g, 13, 1, 'P')
    span(g, 0, 9, 11, 'u')                              # crest highlight
    put(g, 7, 0, 'u'); put(g, 13, 0, 'u')               # lit tips


def draw_cape(g, mode='hang'):
    for (y, hw) in CAPE[mode]:
        span(g, y, CX - hw, CX + hw, 'N')
    for (y, hw) in CAPE[mode]:
        put(g, CX - hw, y, 'n'); put(g, CX + hw, y, 'n')
    # starfield glints, only on the visible cape panels (outside the dress)
    for (dx, dy) in ((-8, 23), (8, 22), (-8, 25), (8, 24), (-7, 27), (7, 27)):
        put(g, CX + dx, dy, 'w')
    for (dx, dy) in ((-8, 24), (8, 25)):
        put(g, CX + dx, dy, 'v')


def draw_head(g):
    for y, (x0, x1) in HEAD.items():
        span(g, y, x0, x1, 'w')
    for y, (o, i) in WINGS.items():
        span(g, y, o, i, 'w')
        span(g, y, W - 1 - i, W - 1 - o, 'w')
    # form: cool shadow down the outer edge
    for y, (x0, x1) in HEAD.items():
        if y < 7:
            continue
        put(g, x0, y, 'z'); put(g, x1, y, 'z')
    for y, (o, i) in WINGS.items():
        put(g, o, y, 'z'); put(g, W - 1 - o, y, 'z')
    # small face window
    for y, (x0, x1) in FACE.items():
        span(g, y, x0, x1, 'x')
    for y, segs in FRINGE.items():
        for (x0, x1) in segs:
            span(g, y, x0, x1, 'w')


def draw_eyes(g, blink=False):
    for ex in (7, 12):                                    # 2 wide
        if blink:
            span(g, 15, ex, ex + 1, 'k')
            span(g, 16, ex, ex + 1, 'S')
            continue
        span(g, 14, ex, ex + 1, 'k')                      # lash line
        span(g, 15, ex, ex + 1, 'm')                      # iris
        span(g, 16, ex, ex + 1, 'k')                      # lower lid


def draw_face(g):
    put(g, 6, 16, 'o')                                    # blush (left)
    put(g, 14, 16, 'o')                                   # blush (right)
    span(g, 17, 9, 11, 'R')                               # mouth
    span(g, 18, 9, 11, 'S')                               # jaw shade


def draw_hairpin(g):
    """Navy four-point star pin on viewer's right, over the ear."""
    put(g, 14, 7, 'N'); put(g, 14, 8, 'N'); put(g, 14, 9, 'N')
    put(g, 13, 8, 'N'); put(g, 15, 8, 'N')
    put(g, 14, 8, 'w')


def draw_body(g):
    for y, segs in BODY.items():
        for (x0, x1, c) in segs:
            span(g, y, x0, x1, c)
    span(g, 24, 3, 4, 'P'); span(g, 24, 16, 17, 'P')       # rose-gold hip plates
    span(g, 25, 3, 4, 'P'); span(g, 25, 16, 17, 'P')
    for x in (6, 10, 14):                                  # gold hem dashes
        put(g, x, 25, 'y')
    put(g, 10, 23, 'I')                                    # centre pleat


def draw_arms(g, lift=0):
    end = 23 - lift
    for lx, hl in ((2, 'o'), (18, 'P')):
        for y in range(21, end + 1):
            put(g, lx, y, 'w')
        put(g, lx, 21, hl)                                 # pauldron
        put(g, lx, end + 1, 'P')                           # rose-gold cuff
        put(g, lx, end + 2, 'x')                           # hand


def draw_legs(g, back=(0, 0), front=(0, 0)):
    for (dx, lift), is_back in ((back, True), (front, False)):
        lx = (7 if is_back else 11) + dx
        y = 27 - lift
        span(g, y, lx, lx + 1, 'z' if is_back else 'w')    # stocking
        span(g, y + 1, lx - 1, lx + 2, 'P')                # boot cuff
        put(g, lx - 1, y + 1, 'o')                         # rim light
        span(g, y + 2, lx - 1, lx + 2, 'R')                # sole


def shift(g, dx, dy):
    out = [['.'] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            if g[y][x] == '.':
                continue
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W:
                out[yy][xx] = g[y][x]
    return out


def build(bob=0, blink=False, lit=False, back=(0, 0), front=(0, 0),
          arm_lift=0, cape=None):
    g = blank()
    if cape:
        draw_cape(g, cape)
    draw_legs(g, back, front)
    draw_body(g)
    draw_head(g)
    draw_eyes(g, blink)
    draw_face(g)
    draw_hairpin(g)
    draw_arms(g, arm_lift)
    draw_halo(g)
    if lit:
        span(g, 6, 8, 12, 'u')                             # crown highlight
    if bob:
        g = shift(g, 0, bob)
    rows = [''.join(r) for r in g]
    for i, r in enumerate(rows):
        assert len(r) == W, (i, len(r), r)
    return rows


POSES = {
    'idle0':   build(back=(-1, 0), front=(1, 0)),
    'idle1':   build(bob=1, back=(-1, 0), front=(1, 0)),
    'blink':   build(blink=True, back=(-1, 0), front=(1, 0)),
    'run0':    build(cape='run', back=(-2, 1), front=(1, 0)),
    'run1':    build(cape='run', bob=-1, back=(-1, 0), front=(2, -1)),
    'run2':    build(cape='run', bob=-1, back=(0, 1), front=(1, -1)),
    'run3':    build(cape='hang', back=(0, 2), front=(-1, 0)),
    'run4':    build(cape='hang', bob=1, back=(-1, 2), front=(-2, 1)),
    'run5':    build(cape='hang', back=(-2, 2), front=(0, 1)),
    'up':      build(cape='up', bob=-1, back=(-2, -1), front=(2, -2), arm_lift=2),
    'down':    build(cape='down', back=(-2, 1), front=(2, 0)),
    'land':    build(cape='down', bob=1, back=(-2, 2), front=(2, 1)),
    'skid':    build(cape='run', bob=1, back=(-1, 2), front=(2, 2)),
    'cheer':   build(cape='up', lit=True, arm_lift=7, back=(-2, -1), front=(2, -1)),
    'get0':    build(lit=True, arm_lift=8, back=(-1, 0), front=(1, 0)),
    'get1':    build(bob=1, lit=True, arm_lift=8, back=(-1, 1), front=(1, 1)),
    'flinch0': build(bob=2, arm_lift=3, back=(-2, 2), front=(2, 0)),
    'flinch1': build(bob=2, arm_lift=4, back=(-2, 2), front=(2, 0)),
}

if __name__ == '__main__':
    if '--write' in sys.argv:
        out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'paimon_art.js')
        with open(out, 'w') as f:
            f.write('// generated by tools/gen_paimon.py — 21x32, one char = ONE WORLD PIXEL\n')
            f.write("// (the film draws it at the background's pixel pitch: 6 screen px per char)\n")
            f.write('export const POSES = {\n')
            for k, rows in POSES.items():
                f.write(f'  {k}: [\n')
                for r in rows:
                    f.write(f'    {r!r},\n')
                f.write('  ],\n')
            f.write('};\n')
        print('wrote js/paimon_art.js')
    for k in [a for a in sys.argv[1:] if not a.startswith('--')] or ['idle0']:
        print(k)
        print('col ' + ''.join(str(i % 10) for i in range(W)))
        for y, r in enumerate(POSES[k]):
            if r.strip('.'):
                print(f'{y:2d} {r}')
