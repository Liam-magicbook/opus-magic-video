"""Decode the reference sprite sheet back into character grids, exactly.

The sheet is a 6x nearest-neighbour render of the sprites on a flat background, so each sprite pixel
is a solid 6x6 block and sampling a block centre returns the original character.

Pose order is the order drawSheet() lays them out:
    row 1  run0 run1 run2 run3 run4 run5 up down land skid
    row 2  idle0 idle1 cheer get0 get1 flinch0 flinch1 blink

Cell widths differ per pose, so each sprite is found by its own ink bounding box — never by assuming
a fixed pitch (that is what silently cut haloes and capes off in earlier attempts).

  python3 tools/decode_sheet.py                  -> work/reference_poses.json
  python3 tools/decode_sheet.py --dump idle0     -> print one pose
"""
import json
import sys

import numpy as np
from PIL import Image

HEX = ['0d0b1a','1b1a33','2a2f5a','3d4a8a','4f6fc0','5b9bea','8cc8f5','c8ecff','ffffff','3b1f47','6b2d5c','b0415f',
       'e8665a','f59a4a','ffd166','fff3b0','0f2a2a','1d4a3a','2e7a45','4fae4a','93d65a','2b1a1f','5a3326','8a5236',
       'c07a45','e8b27c','7a1f2e','d23c3c','ffc9a0','4a5270','7d88a8','b8c2d9']
PAL = {tuple(int(h[i:i+2], 16) for i in (0, 2, 4)): k for k, h in enumerate(HEX)}
LET = {0:'k',1:'k',2:'n',3:'N',4:'b',5:'c',6:'v',7:'z',8:'w',9:'m',10:'p',11:'P',12:'o',13:'Y',14:'y',15:'u',
       16:'g',17:'G',18:'H',19:'L',20:'l',21:'e',22:'d',23:'D',24:'t',25:'S',26:'R',27:'r',28:'x',29:'s',
       30:'i',31:'I'}
BG = (200, 236, 255)
S = 6

ROWS = [(4, ['run0', 'run1', 'run2', 'run3', 'run4', 'run5', 'up', 'down', 'land', 'skid']),
        (36, ['idle0', 'idle1', 'cheer', 'get0', 'get1', 'flinch0', 'flinch1', 'blink'])]
BAND_H = 30          # design px tall band per row, enough to hold any pose


def groups(vals, gap=8):
    """Split sorted pixel indices into [start, end] groups separated by > gap."""
    out, s0, p = [], vals[0], vals[0]
    for v in vals[1:]:
        if v > p + gap:
            out.append((s0, p)); s0 = v
        p = v
    out.append((s0, p))
    return out


def decode(a, x0, y0, w, h):
    """Design-space rectangle -> character rows (block-centre sampling)."""
    rows = []
    for j in range(h):
        line = ''
        for i in range(w):
            x, y = int((x0 + i) * S + S // 2), int((y0 + j) * S + S // 2)
            if y < 0 or x < 0 or y >= a.shape[0] or x >= a.shape[1]:
                line += '.'; continue
            c = tuple(int(v) for v in a[y, x])
            line += '.' if c == BG else LET.get(PAL.get(c, -1), '?')
        rows.append(line)
    return rows


def main():
    path = 'work/attachments/seq3477_sheet.png'
    a = np.array(Image.open(path).convert('RGB'))
    mask = (np.abs(a.astype(int) - np.array(BG)).sum(axis=2) > 10)

    poses = {}
    for y_design, names in ROWS:
        y0, y1 = y_design * S, (y_design + BAND_H) * S
        band = mask[y0:y1]
        cols = np.nonzero(band.any(axis=0))[0]
        cells = groups(cols)
        assert len(cells) == len(names), f'row at y={y_design}: {len(cells)} cells vs {len(names)} names'
        for name, (cx0, cx1) in zip(names, cells):
            sub = band[:, cx0:cx1 + 1]
            rws = np.nonzero(sub.any(axis=1))[0]
            # snap the bbox to design-pixel boundaries
            dx0, dx1 = int(round(cx0 / S)), int(round((cx1 + 1) / S)) - 1
            dy0, dy1 = int(round((y0 + rws[0]) / S)), int(round((y0 + rws[-1] + 1) / S)) - 1
            rows = decode(a, dx0, dy0, dx1 - dx0 + 1, dy1 - dy0 + 1)
            # head centre: horizontal centre of the top 4 ink rows (stable across poses)
            top = next(j for j, r in enumerate(rows) if r.strip('.'))
            hb = rows[top:top + 4]
            hx = [i for i in range(len(rows[0])) if any(r[i] != '.' for r in hb)]
            poses[name] = {'rows': rows, 'ax': (min(hx) + max(hx) + 1) / 2.0, 'ay': len(rows) - 1}

    if '--dump' in sys.argv:
        for j, r in enumerate(poses[sys.argv[sys.argv.index('--dump') + 1]]['rows']):
            print(f'{j:2d} {r}')
        return

    with open('work/reference_poses.json', 'w') as f:
        json.dump(poses, f, indent=1)
    print('wrote work/reference_poses.json')
    for k, v in poses.items():
        print(f'  {k:9s} {len(v["rows"][0]):2d} x {len(v["rows"]):2d}  ax={v["ax"]:.1f}')


main()
