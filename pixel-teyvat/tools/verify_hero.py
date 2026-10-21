"""Per-pixel check: the hero as it lands in the frame buffer vs. the sprite pose the film asked for.

  python3 tools/verify_hero.py <dump.json> [pose]

The dump comes from tools/hero_check.mjs, which exports the buffer AND the POSES the page actually
imported — so a stale module cache cannot fake a pass. Prints every differing row.
"""
import json, re, sys

LET = {0:'k',2:'n',3:'N',4:'b',5:'c',6:'v',7:'z',8:'w',9:'m',10:'p',11:'P',12:'o',13:'Y',14:'y',15:'u',
       16:'g',17:'G',18:'H',19:'L',20:'l',21:'e',22:'d',23:'D',24:'t',25:'S',26:'R',27:'r',28:'x',29:'s',
       30:'i',31:'I'}

def ink(rows):
    h, w = len(rows), len(rows[0])
    o = [['.'] * (w + 2) for _ in range(h + 2)]
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c != '.':
                o[y + 1][x + 1] = c
    out = [row[:] for row in o]
    for y in range(h + 2):
        for x in range(w + 2):
            if o[y][x] != '.':
                continue
            for dy, dx in ((-1,0),(1,0),(0,-1),(0,1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < h + 2 and 0 <= xx < w + 2 and o[yy][xx] != '.':
                    out[y][x] = 'k'; break
    return [''.join(r) for r in out]

d = json.load(open(sys.argv[1] if len(sys.argv) > 1 else '/tmp/hero_dump.json'))
pose = sys.argv[2] if len(sys.argv) > 2 else None
W, H, ib, poses = d['w'], d['h'], d['ib'], d['poses']
buf = [[LET.get(ib[y * W + x] - 64, '#') if ib[y * W + x] >= 64 else '.' for x in range(W)] for y in range(H)]

cands = [pose] if pose else list(poses)
best = (None, -1, None)
for name in cands:
    if name not in poses:
        continue
    exp = poses[name]['rows']  # dict {ax, ay, rows}; already carries its ink outline
    eh, ew = len(exp), len(exp[0])
    for oy in range(H - eh + 1):
        for ox in range(W - ew + 1):
            k = 0
            for y in range(eh):
                row, want = buf[oy + y], exp[y]
                for x in range(ew):
                    if want[x] != '.' and row[ox + x] == want[x]:
                        k += 1
            if k > best[1]:
                best = (name, k, (ox, oy, exp))

name, score, (ox, oy, exp) = best
eh, ew = len(exp), len(exp[0])
print(f'frame {d["f"]}: best-matching pose = {name}   at buffer ({ox},{oy})   matches={score}')
diffs = 0
for y in range(eh):
    got, want = ''.join(buf[oy + y][ox:ox + ew]), exp[y]
    if got != want:
        diffs += 1
        print(f'{y:3d} want {want}\n    got  {got}\n         ' + ''.join('^' if a != b else ' ' for a, b in zip(want, got)))
print('EXACT MATCH' if diffs == 0 else f'{diffs} differing rows')
