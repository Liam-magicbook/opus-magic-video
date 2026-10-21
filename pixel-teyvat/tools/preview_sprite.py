"""Offline sprite previewer — renders js/paimon_art.js rows with the film palette.

  python3 tools/preview_sprite.py            # idle0 at 14x
  python3 tools/preview_sprite.py idle0 cheer get0
  S=20 OUT=/tmp/x.png python3 tools/preview_sprite.py idle0
"""
import sys, os, re
from PIL import Image

HEX = ['0d0b1a', '1b1a33', '2a2f5a', '3d4a8a', '4f6fc0', '5b9bea', '8cc8f5', 'c8ecff', 'ffffff', '3b1f47',
       '6b2d5c', 'b0415f', 'e8665a', 'f59a4a', 'ffd166', 'fff3b0', '0f2a2a', '1d4a3a', '2e7a45', '4fae4a',
       '93d65a', '2b1a1f', '5a3326', '8a5236', 'c07a45', 'e8b27c', '7a1f2e', 'd23c3c', 'ffc9a0', '4a5270',
       '7d88a8', 'b8c2d9']
LEG = {'k': 0, 'n': 2, 'N': 3, 'b': 4, 'c': 5, 'v': 6, 'z': 7, 'w': 8, 'm': 9, 'p': 10, 'P': 11, 'o': 12, 'Y': 13,
       'y': 14, 'u': 15, 'g': 16, 'G': 17, 'H': 18, 'L': 19, 'l': 20, 'e': 21, 'd': 22, 'D': 23, 't': 24,
       'S': 25, 'R': 26, 'r': 27, 'x': 28, 's': 29, 'i': 30, 'I': 31}

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, '..', 'js', 'paimon_art.js')).read()
POSES = {}
for m in re.finditer(r"(\w+):\s*\[(.*?)\n  \],", src, re.S):
    rows = re.findall(r"'([^']*)'", m.group(2))
    POSES[m.group(1)] = rows

# raw text preview:  S=20 python3 tools/preview_sprite.py @rows.txt
if sys.argv[1:2] and sys.argv[1].startswith('@'):
    POSES = {'raw': [l.rstrip('\n') for l in open(sys.argv[1][1:]) if l.strip('\n')]}

S = int(os.environ.get('S', 16))
OUT = os.environ.get('OUT', '/tmp/paimon_preview.png')
names = sys.argv[1:] or ['idle0']


def render(rows, outline=True):
    """Renders the grid, then adds the same 1 px ink outline the film uses."""
    h = len(rows); w = max(len(r) for r in rows)
    grid = [[None] * w for _ in range(h)]
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch == '.' or ch not in LEG:
                continue
            v = HEX[LEG[ch]]
            grid[y][x] = tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))
    ink = tuple(int(HEX[0][i:i + 2], 16) for i in (0, 2, 4))
    pad = 1 if outline else 0
    img = Image.new('RGB', (w + pad * 2, h + pad * 2), (198, 214, 234))
    for y in range(h):
        for x in range(w):
            if grid[y][x]:
                img.putpixel((x + pad, y + pad), grid[y][x])
    if outline:
        for y in range(-1, h + 1):
            for x in range(-1, w + 1):
                inside = 0 <= y < h and 0 <= x < w and grid[y][x]
                if inside:
                    continue
                near = any(0 <= y + dy < h and 0 <= x + dx < w and grid[y + dy][x + dx]
                           for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                if near:
                    img.putpixel((x + pad, y + pad), ink)
    return img, w + pad * 2, h + pad * 2


imgs = [render(POSES[n]) for n in (["raw"] if names and names[0].startswith("@") else names)]
gap = 2
W = sum(i[1] for i in imgs) + gap * (len(imgs) - 1)
Hh = max(i[2] for i in imgs)
canvas = Image.new('RGB', (W, Hh), (238, 226, 206))
x = 0
for img, w, h in imgs:
    canvas.paste(img, (x, 0))
    x += w + gap
canvas = canvas.resize((W * S, Hh * S), Image.NEAREST)
px = canvas.load()
for gx in range(0, canvas.width, S):
    for gy in range(canvas.height):
        r, g, b = px[gx, gy]
        px[gx, gy] = (int(r * .85), int(g * .85), int(b * .85))
for gy in range(0, canvas.height, S):
    for gx in range(canvas.width):
        r, g, b = px[gx, gy]
        px[gx, gy] = (int(r * .85), int(g * .85), int(b * .85))
canvas.save(OUT)
print(f'{OUT}  {W}x{Hh} @{S}x')
