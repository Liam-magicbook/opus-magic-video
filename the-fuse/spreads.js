// The Fuse — page art. Eight spreads, each 3840×2160 world px.
// Everything is drawn with the pen & wash engine: ink first, colour arriving later.
import { makePage, makeArrival } from './page.js';
import { penStroke, drawPen, wash, reserve, dab, foliage, ellipse, spline, hex, mix3, lerp, clamp, rng, n2, fbm, TAU, INK } from './engine.js';

export const PW = 3840, PH = 2160;
const C = {
  sky: hex('#a8bccd'), skyD: hex('#8ba4bd'), dusk: hex('#c9a58c'), cloud: hex('#b7b3c9'),
  lime: hex('#d8c6a0'), ochre: hex('#cfaa72'), glass: hex('#9ab2c6'), brick: hex('#c09a7c'), stone: hex('#cbb79a'),
  haze: hex('#b9c0cc'), shadow: hex('#5f6483'), road: hex('#d5c7ab'), roadD: hex('#b7a889'),
  lawn: hex('#b9c47a'), lawnD: hex('#7f9c52'), leaf: hex('#7fa04a'), leafD: hex('#4b6b3c'),
  wood: hex('#c49a6c'), woodD: hex('#8a6544'), slate: hex('#7b8794'), slateD: hex('#4c5966'),
  data: hex('#8fb39a'), paper: hex('#f5eede'), orange: hex('#d97757'), warm: hex('#d9a15e'),
  steel: hex('#9aa6b0'), steelD: hex('#6a747e'), violet: hex('#8c86b8'), amber: hex('#d2a35c'),
};
const ORANGE = C.orange;

// ---------------------------------------------------------------- helpers
function line(p, a, b, o = {}, at) { return p.pen([a, b], { w: 2.2, wob: 1, over: 5, ...o }, at); }
function rectInk(p, x0, y0, x1, y1, o = {}, at, sides = 'all') {
  const w = o.w ?? 2.2, wob = o.wob ?? 1, over = o.over ?? 5, gap = o.gap ?? .4;
  const s = o.seed ?? ((x0 + y0) | 0);
  const seg = (a, b, k) => p.pen([a, b], { w, wob, over, gap, seed: s + k, smooth: false, ...(o.dash ? { gap: 1 } : {}) }, at);
  if (sides.includes('t')) seg([x0 - over, y0], [x1 + over, y0 + (o.skew ?? 0)], 1);
  if (sides.includes('b')) seg([x0 - over, y1], [x1 + over, y1], 2);
  if (sides.includes('l')) seg([x0, y0 - over], [x0 + (o.skew ?? 0), y1 + over], 3);
  if (sides.includes('r')) seg([x1, y0 - over], [x1, y1 + over], 4);
}
function polyInk(p, pts, o = {}, at) {
  p.pen([...pts, pts[0], pts[1]], { w: 2.2, wob: 1, over: 5, gap: .5, ...o, smooth: o.smooth ?? false }, at);
}
function hatch(p, x0, y0, x1, y1, o = {}) {
  const R = rng(o.seed ?? 11), step = o.step ?? 18, ang = o.ang ?? -.9, w = o.w ?? 1.3;
  const L = Math.hypot(x1 - x0, y1 - y0), dx = Math.cos(ang), dy = Math.sin(ang);
  for (let i = 0; i < L / step; i++) {
    const t0 = i * step;
    const ax = x0 + (x1 - x0) * (o.u0 ?? 0) + dx * t0, ay = y0 + dy * t0;
    const bx = ax + dx * (x1 - x0) * .9, by = ay + dy * (y1 - y0) * .9;
    if (R() < (o.dens ?? .8)) p.pen([[ax, ay], [bx, by]], { w, wob: .5, over: 1, seed: (o.seed ?? 11) + i, gap: .4 }, o.at);
  }
}
// a building: silhouette, windows, shadow side
function building(p, x, base, halfW, top, col, o = {}) {
  const R = rng(o.seed ?? 21), tiers = o.tiers ?? [[top, halfW]];
  const at = o.at;
  for (const [t, hw] of tiers) {
    const poly = [[x - hw, base], [x - hw, t], [x + hw, t], [x + hw, base]];
    p.reserve(poly, .55, 3, o.seed ?? 21);
    p.wash(poly, col, { a: o.far ? .26 : .44, j: 4, layers: 2, edge: .3, seed: (o.seed ?? 21) + t, dx: 2, dy: 1 });
    p.wash([[x + hw * .4, base], [x + hw * .4, t], [x + hw, t], [x + hw, base]], mix3(col, C.shadow, .42), { a: o.far ? .16 : .3, j: 3, layers: 2, edge: 0, seed: (o.seed ?? 21) + 5 });
    rectInk(p, x - hw, t, x + hw, base, { w: o.far ? 1.5 : 2.3, wob: .9, gap: .5, seed: (o.seed ?? 21) + 2 }, at, 'tlr');
    // windows: sparse marks, never a grid
    const rows = Math.floor((base - t) / (o.winH ?? 64)), cols = Math.max(2, Math.floor(hw * 2 / (o.winW ?? 64)));
    for (let r = 1; r < rows; r++) {
      const y = t + r * (o.winH ?? 64);
      if (y > base - 30) break;
      if (fbm(x * .01, y * .02, o.seed ?? 21, 2) < .46) continue;
      for (let c = 0; c < cols; c++) {
        if (R() < .45) continue;
        const wx = x - hw + 14 + c * (hw * 2 - 22) / cols;
        p.pen([[wx, y], [wx + (o.far ? 4 : 6), y + (o.far ? 7 : 11)]], { w: (o.far ? 1.3 : 1.7), wob: .4, over: 0, seed: (o.seed ?? 21) + r * 70 + c, smooth: false }, at == null ? undefined : at + .2 + R() * .5);
      }
    }
    base = t;
  }
  if (o.antenna) p.pen([[x, top], [x + 6, top - 90]], { w: 2, wob: .4, over: 3, seed: (o.seed ?? 21) + 9 }, at);
}
function tree(p, x, ground, r, o = {}) {
  const seed = o.seed ?? 5, crown = o.crown ?? [{ x, y: ground - r * 2.2, r }, { x: x - r * .6, y: ground - r * 1.9, r: r * .7 }, { x: x + r * .62, y: ground - r * 1.95, r: r * .72 }];
  // trunk
  const tw = r * .09;
  p.reserve([[x - tw, ground], [x - tw * .7, ground - r * 1.6], [x + tw * .7, ground - r * 1.6], [x + tw, ground]], .5, 2, seed);
  p.wash([[x - tw, ground], [x - tw * .7, ground - r * 1.7], [x + tw * .7, ground - r * 1.7], [x + tw, ground]], C.wood, { a: .4, j: 2, edge: .3, seed });
  p.wash([[x - tw * .2, ground], [x - tw * .2, ground - r * 1.7], [x + tw * .7, ground - r * 1.7], [x + tw, ground]], C.woodD, { a: .3, j: 2, edge: 0, seed: seed + 1 });
  p.pen([[x - tw, ground], [x - tw * .55, ground - r * 1.65]], { w: 2.2, wob: 1, seed }, o.at);
  p.pen([[x + tw, ground], [x + tw * .55, ground - r * 1.6]], { w: 2.2, wob: 1, seed: seed + 1 }, o.at);
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k - 1) * .55, L = r * (.5 + n2(seed, k) * .3);
    p.pen(spline([[x, ground - r * 1.5], [x + Math.cos(a) * L * .5, ground - r * 1.6 + Math.sin(a) * L * .5], [x + Math.cos(a) * L, ground - r * 1.6 + Math.sin(a) * L]], 4), { w: 1.8, wob: 1, seed: seed + 8 + k, gap: .5 }, o.at);
  }
  for (const c of crown) p.reserve(ellipse(c.x, c.y, c.r * .8, c.r * .76, 20), .5, c.r * .1, seed + c.x);
  foliage(p.color, crown, { seed, scale: o.scale ?? 1, dens: o.dens ?? .95, base: .9 });
  // a few outer leaf clusters and broken edge marks (no big circles)
  const R = rng(seed + 3);
  for (const c of crown) {
    for (let k = 0; k < 14; k++) {
      const a2 = R() * TAU, rr = c.r * (.84 + R() * .12), x2 = c.x + Math.cos(a2) * rr, y2 = c.y + Math.sin(a2) * rr * .86;
      const sz = c.r * (.09 + R() * .06);
      p.pen([[x2 - sz, y2], [x2 - sz * .2, y2 - sz * .5], [x2 + sz * .6, y2 - sz * .2], [x2 + sz, y2 + sz * .3]], { w: 1.5, wob: .8, over: 1, seed: seed + 400 + k + (c.x | 0), gap: .4 }, o.at);
    }
  }
}

function pigeons(p, x, y, n, o = {}) {
  const R = rng(o.seed ?? 3);
  for (let i = 0; i < n; i++) {
    const px = x + (R() - .5) * 260, py = y + (R() - .5) * 90, s = 14 + R() * 10;
    p.pen([[px - s, py], [px, py - s * .7], [px + s, py]], { w: 1.6, wob: .4, seed: i, over: 1 }, o.at);
    p.wash(ellipse(px + s * .1, py - s * .3, s * .5, s * .3, 10), C.slate, { a: .4, j: 1.5, edge: .2, seed: i });
    p.pen([[px, py - s * .7], [px - s * .2, py - s * 1.1]], { w: 1.2, wob: .2, seed: i + 4, over: 0 }, o.at);
  }
}
// distant people: one wash blob, two leg strokes, a head dot
function carrot(p, x, y, S, top, o = {}) {
  const hip = y - S * .46, sh = y - S * .78, hw = S * .075, R = rng(o.seed ?? 1);
  const body = [[x - hw * .8, hip + S * .03], [x - hw, sh + S * .02], [x - hw * .45, sh - S * .015], [x + hw * .45, sh - S * .015], [x + hw, sh + S * .02], [x + hw * .8, hip + S * .03]];
  p.reserve(body, .8, 1, o.seed ?? 1); p.wash(body, top, { a: .6, j: 1.4, layers: 2, edge: .3, seed: o.seed ?? 1, dx: 1.5 });
  p.wash([[x - hw * .8, hip], [x + hw * .8, hip], [x + hw * .6, hip + S * .16], [x - hw * .6, hip + S * .16]], mix3(top, C.shadow, .5), { a: .32, j: 1, edge: 0 });
  for (const s of [-1, 1]) p.pen([[x + s * hw * .4, hip], [x + s * hw * .55, y]], { w: 1.6, wob: .3, over: 0, seed: (o.seed ?? 1) + s * 3 }, o.at);
  p.pen([[x - hw * .8, hip + 2], [x - hw * .95, sh]], { w: 1.5, wob: .3, over: 1, seed: (o.seed ?? 1) + 9 }, o.at);
  p.pen([[x + hw * .8, hip + 2], [x + hw * .95, sh]], { w: 1.6, wob: .3, over: 1, seed: (o.seed ?? 1) + 8 }, o.at);
  p.wash(ellipse(x, sh - S * .07, S * .05, S * .055, 10), hex('#d9ae8e'), { a: .5, j: .8, edge: 0 });
  p.pen(ellipse(x, sh - S * .07, S * .05, S * .055, 12).slice(2, 9), { w: 1.3, wob: .2, over: 0, seed: (o.seed ?? 1) + 4 }, o.at);
}
function paperTape(p, pts, w, at) {
  const R = rng(9);
  const left = [], right = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const ww = w * (i / pts.length) * .6 + w * .4;
    left.push([pts[i][0] + nx * ww, pts[i][1] + ny * ww]); right.push([pts[i][0] - nx * ww, pts[i][1] - ny * ww]);
  }
  const poly = [...left, ...right.reverse()];
  p.reserve(poly, .8, 2, 12); p.wash(poly, hex('#efe6d2'), { a: .5, j: 2, layers: 2, edge: .35, seed: 13 });
  p.pen([...left], { w: 1.8, wob: .6, over: 3, seed: 14, gap: .5 }, at);
  p.pen([...right], { w: 1.8, wob: .6, over: 3, seed: 15, gap: .5 }, at);
  for (let i = 0; i < 14; i++) { const k = (R() * pts.length) | 0; p.pen([[left[k][0] + 4, left[k][1]], [right[k][0] - 4, right[k][1]]], { w: 1, wob: .3, over: 0, seed: 20 + i, gap: .8 }, at); }
}
function mushroom(p, x, y, s, col, at) {
  const cap = spline([[x - s, y], [x - s * 1.15, y - s * .55], [x - s * .55, y - s * 1.05], [x, y - s * 1.15], [x + s * .6, y - s * 1.0], [x + s * 1.15, y - s * .5], [x + s, y]], 5, false);
  p.pen([[x, y], [x + s * .05, y - s * .95]], { w: 2, wob: .5, over: 2, seed: x | 0 }, at);
  p.reserve([...cap, [x + s * .1, y]], .7, 2, x | 0);
  p.wash([...cap, [x, y - s * .1]], col, { a: .55, j: 3, layers: 2, edge: .4, seed: (x | 0) + 3 });
  p.pen(cap, { w: 2.2, wob: .8, over: 3, seed: (x | 0) + 1, gap: .4 }, at);
  for (let i = 0; i < 3; i++) p.pen([[x - s * .5 + i * s * .45, y - s * .6], [x - s * .3 + i * s * .45, y - s * .5]], { w: 1.2, wob: .3, over: 0, seed: (x | 0) + 9 + i }, at);
}

// ---------------------------------------------------------------- P0 — the bench (0–22)
// One sheet: a Sunday plaza above a torn bottom edge; below it, the "training loss" pit.
export function buildP0() {
  const p = makePage({ t0: 0, dur: 22, seed: 100 });
  const at = (x, y, k = 0) => p.arrivalAt(x, y) + k;
  const GROUND = 1300;
  const fold = x => 1545 + x / 3840 * 190 + Math.sin(x * .0055) * 22 + (fbm(x * .004, 7, 5) - .5) * 46;
  const sheet = (x0, x1, yTop) => { const q = [[x0, yTop]]; for (let x = x0; x <= x1; x += 40) q.push([x, fold(x)]); q.push([x1, fold(x1)]); return q; };

  // ---------------- sky: one soft mass, two cloud reserves
  for (let i = 0; i < 22; i++) {
    const R = rng(210 + i), x = 200 + R() * 3600, y = 80 + R() * 520, rx = 300 + R() * 340;
    p.wash(ellipse(x, y, rx, rx * .26, 24, R()), R() < .3 ? C.skyD : C.sky, { a: .16 + R() * .07, j: rx * .22, layers: 2, edge: .08, seed: 320 + i, freq: .0055 });
  }
  for (const [x, y, rx, ry] of [[1980, 470, 330, 100], [3300, 380, 380, 120]]) {
    const puff = []; for (let k = 0; k < 10; k++) { const a = Math.PI + k / 9 * Math.PI; puff.push([x + Math.cos(a) * rx * (.85 + .28 * n2(k, x)), y + Math.sin(a) * ry * (1.1 + .45 * n2(k, y))]); }
    puff.push([x + rx * .9, y + ry * .3], [x - rx * .9, y + ry * .3]);
    p.reserve(spline(puff, 4, true), .82, 14, x | 0);
    p.wash(ellipse(x + rx * .04, y + ry * .3, rx * .76, ry * .3, 18), C.cloud, { a: .18, j: 12, edge: .08, seed: x | 0 });
  }

  // ---------------- far skyline (hazy, few marks)
  const RB = rng(77);
  for (let i = 0; i < 14; i++) {
    const x = 1700 + i * 150, hw = 40 + RB() * 30, top = 1030 + RB() * 130;
    building(p, x, 1280, hw, top, mix3(RB() < .5 ? C.stone : C.glass, C.haze, .55), { far: 1, seed: 400 + i, at: at(x, top), winH: 46, winW: 40, sparse: .3 });
  }
  // ---------------- the street wall
  building(p, 1720, 1300, 130, 810, C.lime, { seed: 21, at: at(1720, 810), antenna: 1, winH: 62, winW: 58, sparse: .55 });
  building(p, 1975, 1300, 105, 960, C.glass, { seed: 22, at: at(1975, 960), winH: 54, winW: 50, sparse: .5 });
  building(p, 2230, 1300, 180, 690, C.ochre, { seed: 23, at: at(2230, 690), tiers: [[690, 180], [620, 140]], winH: 64, winW: 62, tank: 1, sparse: .8 });
  building(p, 2600, 1300, 130, 900, C.brick, { seed: 24, at: at(2600, 900), winH: 58, winW: 54, sparse: .6 });
  building(p, 2850, 1300, 150, 760, C.glass, { seed: 25, at: at(2850, 760), winH: 46, winW: 44, glassy: 1, sparse: .7 });
  building(p, 3120, 1300, 140, 980, C.stone, { seed: 26, at: at(3120, 980), antenna: 1, winH: 56, sparse: .5 });
  building(p, 3380, 1300, 190, 830, C.ochre, { seed: 27, at: at(3380, 830), winH: 66, winW: 60, sparse: .7 });
  building(p, 3660, 1300, 130, 900, C.lime, { seed: 28, at: at(3660, 900), winH: 60, sparse: .55 });
  building(p, 640, 1300, 150, 900, C.stone, { seed: 29, at: at(640, 900), winH: 60, sparse: .55 });
  building(p, 940, 1300, 110, 985, C.ochre, { seed: 30, at: at(940, 985), winH: 66, sparse: .6 });
  building(p, 1200, 1300, 170, 860, C.brick, { seed: 34, at: at(1200, 860), winH: 62, sparse: .62 });
  building(p, 1470, 1300, 120, 940, C.glass, { seed: 35, at: at(1470, 940), winH: 54, sparse: .55 });
  // blank billboard on the ochre block
  p.reserve([[2200, 840], [2400, 840], [2400, 990], [2200, 990]], .5, 3, 31);
  p.wash([[2200, 840], [2400, 840], [2400, 990], [2200, 990]], hex('#e9e0c8'), { a: .32, j: 3, edge: .3, seed: 32 });
  rectInk(p, 2200, 840, 2400, 990, { w: 3, wob: .7, seed: 33, gap: .2 }, at(2300, 900));

  // ---------------- plaza (clipped at the tear)
  const plaza = sheet(-20, PW + 20, GROUND);
  p.reserve([...plaza, [PW + 20, GROUND - 4], [-20, GROUND - 4]], .28, 10, 61);
  p.wash(plaza, C.road, { a: .42, j: 14, layers: 2, edge: 0, seed: 62 });
  for (let k = 0; k < 3; k++) {
    const y = GROUND + 44 + k * 46, band = [[-20, y]]; for (let x = -20; x <= PW + 20; x += 60) band.push([x, y + Math.sin(x * .004 + k) * 8]); band.push([PW + 20, y + 46], [-20, y + 46]);
    p.wash(band.filter(q => q[1] < fold(q[0])), k % 2 ? C.roadD : hex('#e3d8c0'), { a: .1, j: 16, edge: 0, seed: 70 + k });
  }
  for (let k = 0; k < 3; k++) {
    const y = GROUND + 70 + k * 54;
    p.pen([[-40, y + Math.sin(y) * 5], [PW + 40, y + 14 + Math.cos(y) * 5]], { w: 1.3, wob: .7, over: 3, seed: 120 + k, gap: .6 }, at(300, y));
  }
  // a few stones
  for (let i = 0; i < 26; i++) { const x = 120 + n2(i, 4) * 3600, y = GROUND + 40 + n2(i, 6) * 200; if (y > fold(x) - 20) continue; p.pen([[x, y], [x + 24 + n2(i, 7) * 30, y + 2], [x + 40 + n2(i, 8) * 30, y + 6]], { w: 1.2, wob: .6, over: 2, seed: 130 + i, gap: .6 }, at(x, y)); }

  // warm afternoon light across the plaza
  p.wash(ellipse(1150, 1360, 1450, 210, 30), hex('#e8c98f'), { a: .09, j: 60, layers: 2, edge: 0, seed: 1400, freq: .004 });
  p.wash([[-20, 1292], [PW + 20, 1292], [PW + 20, 1312], [-20, 1312]], hex('#6a6f8c'), { a: .14, j: 8, edge: 0, seed: 1399 });
  // shopfronts at street level
  for (const [x0, x1, col] of [[560, 900, hex('#8f7f6a')], [950, 1420, hex('#7d6f5e')], [1720, 1960, hex('#8a7a64')], [2000, 2260, hex('#7a6b5c')], [2440, 2700, hex('#8d7c66')], [2800, 3080, hex('#76695c')], [3300, 3600, hex('#8b7a63')]]) {
    p.wash([[x0, 1222], [x1, 1222], [x1, 1298], [x0, 1298]], col, { a: .38, j: 5, layers: 2, edge: .3, seed: x0 });
    p.pen([[x0, 1222], [x1, 1222]], { w: 2.2, wob: .6, over: 4, seed: x0 + 1 }, at(x0, 1222));
    for (let d = x0 + 30; d < x1 - 40; d += 120) {
      p.pen([[d, 1298], [d, 1252], [d + 54, 1252], [d + 54, 1298]], { w: 1.7, wob: .5, seed: d | 0, smooth: false }, at(d, 1250));
      p.wash([[d, 1252], [d + 54, 1252], [d + 54, 1298], [d, 1298]], mix3(col, hex('#3f3a34'), .35), { a: .25, j: 2, edge: .2, seed: d + 2 });
      // awning
      p.wash([[d - 6, 1248], [d + 60, 1248], [d + 54, 1230], [d, 1230]], hex('#b06a52'), { a: .3, j: 2, edge: .25, seed: d + 3 });
      p.pen([[d - 6, 1248], [d + 60, 1248]], { w: 1.6, wob: .5, seed: d + 4 }, at(d, 1248));
    }
  }
  // a second row of trees behind the bench
  tree(p, 1780, 1340, 190, { seed: 340, at: at(1780, 1200), dens: .9, scale: .8 });
  tree(p, 2050, 1330, 150, { seed: 341, at: at(2050, 1200), dens: .85, scale: .7 });
  // long afternoon shadows
  p.wash([[980, 1500], [1420, 1496], [1780, 1440], [1500, 1478], [1000, 1510]], hex('#6a6f8c'), { a: .12, j: 14, edge: 0, seed: 1410 });
  p.wash([[560, 1478], [640, 1474], [1260, 1430], [900, 1470], [600, 1486]], hex('#6a6f8c'), { a: .1, j: 18, edge: 0, seed: 1411 });

  // ---------------- bench (a real park bench: seat at 0.45 of a person)
  {
    const x0 = 900, x1 = 1430, seat = 1390, back = 1284, leg = 1502;
    p.wash([[x0 + 40, seat + 30], [x1 + 20, seat + 30], [x1 + 70, leg + 16], [x0 + 10, leg + 16]], C.shadow, { a: .14, j: 12, edge: 0, seed: 500 });
    // back: two boards + top rail
    for (let k = 0; k < 2; k++) {
      const y0 = back + 8 + k * 44, y1 = y0 + 32;
      p.reserve([[x0 + 6, y0 - 3], [x1 - 6, y0 - 3], [x1 - 6, y1 + 3], [x0 + 6, y1 + 3]], .45, 2, 510 + k);
      p.wash([[x0 + 6, y0], [x1 - 6, y0], [x1 - 6, y1], [x0 + 6, y1]], C.wood, { a: .46, j: 2, layers: 2, edge: .3, seed: 511 + k });
      p.wash([[x0 + 6, y0 + 18], [x1 - 6, y0 + 18], [x1 - 6, y1], [x0 + 6, y1]], C.woodD, { a: .24, j: 2, edge: 0, seed: 513 + k });
      for (let g = 0; g < 2; g++) p.pen([[x0 + 40 + g * 24, y0 + 9 + g * 8], [x1 - 60 + g * 14, y0 + 11 + g * 9]], { w: .9, wob: 1, over: 2, seed: 514 + k * 10 + g, gap: .75 }, at(x0, y0));
      rectInk(p, x0 + 6, y0, x1 - 6, y1, { w: 1.9, wob: .6, seed: 516 + k, gap: .35 }, at(x0, y0));
    }
    p.pen([[x0 - 4, back], [x1 + 4, back + 1]], { w: 2.8, wob: .6, over: 6, seed: 520 }, at(x0, back));
    // seat
    p.reserve([[x0 - 6, seat - 5], [x1 + 6, seat - 5], [x1 + 6, seat + 30], [x0 - 6, seat + 30]], .5, 2, 521);
    p.wash([[x0 - 6, seat], [x1 + 6, seat], [x1 + 6, seat + 18], [x0 - 6, seat + 18]], C.wood, { a: .5, j: 2, layers: 2, edge: .3, seed: 522 });
    p.wash([[x0 - 6, seat + 20], [x1 + 6, seat + 20], [x1 + 6, seat + 30], [x0 - 6, seat + 30]], C.woodD, { a: .34, j: 2, edge: .2, seed: 523 });
    p.pen([[x0 - 8, seat], [x1 + 8, seat + 1]], { w: 2.6, wob: .6, over: 6, seed: 524, gap: .2 }, at(x0, seat));
    p.pen([[x0 - 8, seat + 20], [x1 + 8, seat + 22]], { w: 2, wob: .7, over: 5, seed: 525 }, at(x1, seat));
    p.pen([[x0 - 8, seat + 32], [x1 + 8, seat + 34]], { w: 2.2, wob: .7, over: 5, seed: 526 }, at(x0, seat));
    // ends and cast-iron legs
    for (const x of [x0, x1]) {
      p.pen([[x, back - 3], [x, seat + 32]], { w: 3, wob: .5, over: 5, seed: x, smooth: false }, at(x, back));
      p.pen([[x, seat + 32], [x - 18, leg + 2]], { w: 2.8, wob: .5, over: 4, seed: x + 1, smooth: false }, at(x, seat));
      p.pen([[x, seat + 32], [x + 22, leg]], { w: 2.8, wob: .5, over: 4, seed: x + 2, smooth: false }, at(x, seat));
      p.pen([[x - 22, leg + 2], [x + 26, leg]], { w: 2.2, wob: .5, over: 3, seed: x + 3 }, at(x, leg));
      p.wash(ellipse(x + 40, leg + 12, 150, 14, 14), C.shadow, { a: .18, j: 5, edge: 0, seed: x + 4 });
    }
    // armrest, right end
    p.pen([[x1 - 30, back + 26], [x1 + 34, back + 32], [x1 + 34, seat - 2]], { w: 2.6, wob: .5, over: 4, seed: 530 }, at(x1, back));
    p.pen([[x1 - 30, back + 26], [x1 - 30, back + 8]], { w: 1.6, wob: .5, over: 2, seed: 531 }, at(x1, back));
  }

  // ---------------- lamp post
  {
    const x = 560, base = 1470, top = 830;
    p.wash([[x - 14, base], [x - 8, top], [x + 8, top], [x + 14, base]], C.slateD, { a: .7, j: 1.5, edge: .3, seed: 71 });
    p.wash([[x - 30, base + 6], [x - 24, base - 50], [x + 24, base - 50], [x + 30, base + 6]], C.slateD, { a: .8, j: 1.5, seed: 72 });
    p.reserve([[x - 28, top + 52], [x - 34, top - 4], [x + 34, top - 4], [x + 28, top + 52]], 1, 0);
    p.wash([[x - 28, top + 52], [x - 34, top - 4], [x + 34, top - 4], [x + 28, top + 52]], hex('#e8dcae'), { a: .4, j: 1, edge: 0, seed: 73 });
    p.wash([[x - 42, top - 4], [x, top - 52], [x + 42, top - 4]], C.slateD, { a: .8, j: 1, seed: 74 });
    p.pen([[x - 14, base], [x - 8, top + 44]], { w: 2.8, wob: .6, over: 4, seed: 80, smooth: false }, at(x, base));
    p.pen([[x + 14, base], [x + 8, top + 44]], { w: 2.8, wob: .6, over: 4, seed: 81, smooth: false }, at(x, base));
    p.pen([[x - 28, top + 60], [x - 34, top - 4]], { w: 2.4, wob: .5, seed: 82, smooth: false }, at(x, top));
    p.pen([[x + 28, top + 60], [x + 34, top - 4]], { w: 2.4, wob: .5, seed: 83, smooth: false }, at(x, top));
    p.pen([[x - 42, top - 4], [x, top - 52], [x + 42, top - 4]], { w: 2.4, wob: .5, seed: 84, smooth: false }, at(x, top));
    p.pen([[x, top - 52], [x, top - 84]], { w: 2.2, wob: .3, seed: 85 }, at(x, top));
    p.wash(ellipse(x + 26, base + 8, 130, 16, 16), C.shadow, { a: .2, j: 4, edge: 0, seed: 86 });
  }

  // ---------------- the sketcher's stool (he sits here)
  {
    const x = 2320, seat = 1405, y = 1584;
    p.wash([[x - 70, seat], [x + 70, seat], [x + 60, seat + 26], [x - 60, seat + 26]], C.woodD, { a: .45, j: 2, edge: .3, seed: 560 });
    p.pen([[x - 70, seat], [x + 70, seat]], { w: 2.4, wob: .5, over: 4, seed: 561 }, at(x, seat));
    p.pen([[x - 70, seat], [x - 96, y]], { w: 2.2, wob: .5, over: 3, seed: 562, smooth: false }, at(x, seat));
    p.pen([[x + 70, seat], [x + 98, y]], { w: 2.2, wob: .5, over: 3, seed: 563, smooth: false }, at(x, seat));
    p.pen([[x, seat + 20], [x + 8, y + 4]], { w: 2, wob: .5, over: 3, seed: 564, smooth: false }, at(x, seat));
    p.pen([[x - 60, seat + 60], [x + 50, seat + 84]], { w: 1.6, wob: .5, over: 2, seed: 565 }, at(x, seat));
    p.wash(ellipse(x + 30, y + 10, 150, 16, 14), C.shadow, { a: .18, j: 4, edge: 0, seed: 566 });
  }

  // ---------------- tree (left, only the near half is in frame)
  tree(p, 120, 1500, 380, { seed: 300, at: at(120, 1260), dens: 1.25, scale: 1.25 });

  // ---------------- small life
  pigeons(p, 1830, 1442, 3, { seed: 9, at: at(1830, 1442) });
  carrot(p, 1720, 1408, 90, hex('#8ea6c4'), { seed: 61, at: at(1720, 1408) });
  carrot(p, 1782, 1414, 82, hex('#c9796a'), { seed: 62, at: at(1782, 1414) });
  carrot(p, 3560, 1424, 94, hex('#d9d2c2'), { seed: 63, at: at(3560, 1424) });
  for (let i = 0; i < 4; i++) { const x = 2420 + i * 130 + n2(i, 3) * 50, y = 320 + n2(i, 4) * 100; p.pen([[x - 13, y], [x - 6, y - 7], [x, y - 1], [x + 6, y - 8], [x + 13, y]], { w: 1.5, wob: .4, over: 1, seed: 660 + i }, at(2500, 400)); }
  // bicycle leaning
  {
    const x = 3260, y = 1470;
    p.pen(ellipse(x - 38, y - 34, 32, 32, 18), { w: 1.9, wob: .4, seed: 700 }, at(x, y));
    p.pen(ellipse(x + 48, y - 34, 32, 32, 18), { w: 1.9, wob: .4, seed: 701 }, at(x, y));
    p.pen([[x - 38, y - 34], [x + 2, y - 72], [x + 48, y - 34]], { w: 1.9, wob: .4, seed: 702 }, at(x, y));
    p.pen([[x + 2, y - 72], [x - 6, y - 34], [x + 38, y - 34]], { w: 1.7, wob: .4, seed: 703 }, at(x, y));
    p.pen([[x + 2, y - 72], [x + 10, y - 90], [x + 28, y - 90]], { w: 1.7, wob: .4, seed: 704 }, at(x, y));
    p.wash(ellipse(x + 4, y - 4, 62, 10, 12), C.shadow, { a: .18, j: 3, edge: 0, seed: 705 });
  }

  // ---------------- the tear
  {
    const pts = []; for (let x = -20; x <= PW + 20; x += 24) pts.push([x, fold(x)]);
    p.pen(pts, { w: 2.2, wob: 1.2, over: 6, seed: 130, gap: .75 }, at(1500, 1560));
    for (let i = 0; i < 40; i++) {
      const x = i / 40 * PW + 30, y = fold(x);
      p.pen([[x, y + 2], [x + 8 + n2(i, 2) * 12, y + 6 + n2(i, 3) * 7]], { w: .9, wob: .5, over: 0, seed: 140 + i, gap: .7 }, at(x, y));
    }
    for (let i = 0; i < 26; i++) { const x = 80 + n2(i, 7) * 3600; p.dab(x, fold(x) + 11 + n2(i, 5) * 8, 2.5 + n2(i, 6) * 3, n2(i, 8) * 3, hex('#c9b79a'), .28, i); }
  }

  // ---------------- the pit: loss graph, inverted blocks, the colossus
  {
    // faint graph, only where it belongs
    for (let i = 0; i < 4; i++) { const x = 1420 + i * 300; p.pen([[x, 1660], [x, 2090]], { w: .9, wob: .35, over: 0, seed: 800 + i, gap: .8 }, 9.65 + i * .015); }
    for (let k = 0; k < 4; k++) { const y = 1700 + k * 110; p.pen([[1380, y], [2740, y + 6]], { w: .8, wob: .35, over: 0, seed: 810 + k, gap: .82 }, 9.65 + k * .015); }
    const loss = spline([[1380, 1620], [1760, 1640], [2040, 1690], [2250, 1820], [2390, 2010], [2470, 2120]], 10);
    p.pen(loss, { w: 3.8, wob: 1, over: 6, seed: 820 }, 9.55);
    // three buildings hanging from the tear (inverted: their windows point down)
    for (let i = 0; i < 3; i++) {
      const x = 1600 + i * 330, hw = 78 + i * 10, h = 180 + i * 40, t = fold(x) + 30;
      p.reserve([[x - hw, t], [x - hw, t + h], [x + hw, t + h], [x + hw, t]], .34, 3, 840 + i);
      p.wash([[x - hw, t], [x - hw, t + h], [x + hw, t + h], [x + hw, t]], mix3(C.stone, C.haze, .38), { a: .28, j: 5, layers: 2, edge: .3, seed: 850 + i });
      rectInk(p, x - hw, t, x + hw, t + h, { w: 2, wob: .8, seed: 860 + i, gap: .3 }, 9.75 + i * .12, 'lrt');
      for (let k = 0; k < 3; k++) p.pen([[x - hw + 18, t + 40 + k * (h - 50) / 3], [x - hw + 52, t + 44 + k * (h - 50) / 3]], { w: 1.2, wob: .4, over: 0, seed: 890 + i * 10 + k, gap: .5 }, 9.85 + i * .12 + k * .02);
    }
    // the colossus (opaque paper first so the city does not show through)
    const S = { x: 2740, y: 980 };
    const head = ellipse(S.x, S.y, 112, 138, 26);
    const body = [...head, [S.x + 96, S.y + 150], [S.x + 232, S.y + 220], [S.x + 268, S.y + 520], [S.x + 218, S.y + 690], [S.x + 262, S.y + 880], [S.x + 150, S.y + 1030], [S.x + 60, S.y + 1050], [S.x + 10, S.y + 860], [S.x - 40, S.y + 1060], [S.x - 160, S.y + 1040], [S.x - 218, S.y + 880], [S.x - 178, S.y + 690], [S.x - 242, S.y + 520], [S.x - 214, S.y + 230], [S.x - 92, S.y + 152]];
    p.reserve(body, .92, 10, 900);
    p.wash(body, hex('#6f7291'), { a: .26, j: 26, layers: 2, edge: .0, seed: 901, freq: .005 });
    p.wash([[S.x - 50, S.y + 210], [S.x + 205, S.y + 250], [S.x + 205, S.y + 900], [S.x + 45, S.y + 1000]], hex('#565a7a'), { a: .2, j: 34, layers: 2, edge: 0, seed: 902, freq: .005 });
    // contour fragments only
    p.pen([[S.x - 104, S.y + 54], [S.x - 114, S.y + 148], [S.x - 86, S.y + 190]], { w: 2, wob: 1.2, over: 3, seed: 903, gap: .5 }, 12.9);
    p.pen([[S.x + 92, S.y + 158], [S.x + 222, S.y + 232], [S.x + 244, S.y + 430]], { w: 2, wob: 1.2, over: 3, seed: 904, gap: .5 }, 13.0);
    p.pen([[S.x - 212, S.y + 620], [S.x - 186, S.y + 850], [S.x - 118, S.y + 1000]], { w: 1.8, wob: 1.2, over: 3, seed: 905, gap: .6 }, 13.1);
    p.pen([[S.x + 40, S.y + 210], [S.x + 30, S.y + 420]], { w: 1.4, wob: 1.4, over: 2, seed: 906, gap: .7 }, 13.15);
    // window marks inside the shadow
    for (let i = 0; i < 22; i++) { const x = S.x - 170 + n2(i, 2) * 340, y = S.y + 280 + n2(i, 8) * 620; p.pen([[x, y], [x + 14, y + 18]], { w: 1.1, wob: .4, over: 0, seed: 910 + i, gap: .55 }, 13.2 + i * .012); }
    // its eyes
    p.wash(ellipse(S.x - 40, S.y - 10, 12, 9, 10), ORANGE, { a: .95, j: 1, edge: 0, seed: 931 });
    p.wash(ellipse(S.x + 40, S.y - 10, 12, 9, 10), ORANGE, { a: .95, j: 1, edge: 0, seed: 932 });
  }

  // ---------------- the bite at the top-right corner
  {
    const cx = 3640, cy = 300, R = 500, bite = [];
    for (let i = 0; i <= 30; i++) { const a = Math.PI + i / 30 * Math.PI * .6, rr = R * (.66 + .34 * Math.abs(Math.sin(i * 1.9))); bite.push([cx + Math.cos(a) * rr, cy - Math.sin(a) * rr * .8]); }
    bite.push([PW + 60, -60]);
    // a shadow along the torn edge, so a paper bite reads on paper
    p.wash(bite.map(q => [q[0] - 26, q[1] + 26]), hex('#6a6480'), { a: .22, j: 8, layers: 2, edge: 0, seed: 11 });
    p.reserve(bite, 1, 0, 12);
    for (let i = 0; i < 10; i++) {
      const a = Math.PI + (i + .5) / 10 * Math.PI * .6, rr = R * .74;
      const x = cx + Math.cos(a) * rr, y = cy - Math.sin(a) * rr * .8;
      p.pen(spline([[x - 28, y + 2], [x, y + 40], [x + 30, y]], 3), { w: 1.9, wob: .6, over: 3, seed: 940 + i }, 16.7);
    }
    for (let i = 0; i < 6; i++) { const x = 3360 + i * 62 + n2(i, 3) * 36, y = 330 + n2(i, 4) * 150; p.pen([[x - 12, y], [x + 12, y + 5]], { w: 1.3, wob: .8, over: 2, seed: 950 + i }, 16.8); }
  }

  const w = p.finish();
  const src = [
    { x: 1250, y: 1120, t: 1.5, v: 1800, R: 4400, mask: (x, y) => y < fold(x) - 24 && !(x > 2450 && x < 3050 && y > 930) },
    { x: 1150, y: 1220, t: 3.85, v: 380, R: 520, sy: 1.1 },
    { x: 2100, y: 1400, t: 8.8, v: 1500, R: 3000, mask: (x, y) => y < fold(x) },
    { x: 2740, y: 1010, t: 13.55, v: 700, R: 1000, mask: (x, y) => x > 2380 && x < 3120 && y > 900 },
    { x: 3500, y: 420, t: 17.4, v: 900, R: 700, mask: (x, y) => y < 900 },
  ];
  return { ...w, ...makeArrival(w.W, w.H, src), sources: src };
}
// ---------------------------------------------------------------- P1 — the room (22.055–38.418)
// A cut-away room at evening: window onto the city, a desk, a chair, mushrooms on the floor,
// a doll's house on the desk, and a big eye drawn in the margin.
export function buildP1() {
  const p = makePage({ t0: 22, dur: 16.4, seed: 200 });
  const at = (x, y, k = 0) => p.arrivalAt(x, y) + k;
  const BX0 = 900, BX1 = 3000, BY0 = 560, BY1 = 1420;       // back wall
  const FX0 = 120, FX1 = 3720, FY = 2060;                    // front floor edge
  const VP = [1950, 980];

  // ---- walls / floor / ceiling
  p.reserve([[BX0, BY0], [BX1, BY0], [BX1, BY1], [BX0, BY1]], .5, 4, 1);
  p.wash([[BX0, BY0], [BX1, BY0], [BX1, BY1], [BX0, BY1]], hex('#dcc3a0'), { a: .58, j: 8, layers: 2, edge: .25, seed: 2 });
  p.wash([[BX0, BY1 - 190], [BX1, BY1 - 190], [BX1, BY1], [BX0, BY1]], hex('#c3aa88'), { a: .22, j: 12, layers: 2, edge: 0, seed: 3 });
  // side walls
  p.wash([[0, 180], [BX0, BY0], [BX0, BY1], [0, 2100]], hex('#c6a984'), { a: .5, j: 12, layers: 2, edge: .2, seed: 4 });
  p.wash([[PW, 180], [BX1, BY0], [BX1, BY1], [PW, 2100]], hex('#b79a76'), { a: .5, j: 12, layers: 2, edge: .2, seed: 5 });
  // floor
  p.wash([[0, 2100], [BX0, BY1], [BX1, BY1], [PW, 2100]], hex('#c9a366'), { a: .55, j: 12, layers: 2, edge: .2, seed: 6 });
  p.wash([[0, 2160], [0, 2100], [PW, 2100], [PW, 2160]], hex('#b7935f'), { a: .3, j: 12, edge: 0, seed: 7 });
  // ceiling
  p.wash([[0, 180], [BX0, BY0], [BX1, BY0], [PW, 180]], hex('#b5a084'), { a: .38, j: 12, layers: 2, edge: 0, seed: 8 });
  // room edges
  p.pen([[BX0, BY0], [BX1, BY0]], { w: 3.2, wob: 1, over: 8, seed: 10, gap: .25 }, at(1900, 600));
  p.pen([[BX0, BY1], [BX1, BY1]], { w: 3, wob: 1, over: 8, seed: 11 }, at(1900, 1420));
  p.pen([[BX0, BY0], [BX0, BY1]], { w: 3, wob: .8, over: 8, seed: 12 }, at(900, 1000));
  p.pen([[BX1, BY0], [BX1, BY1]], { w: 3, wob: .8, over: 8, seed: 13 }, at(3000, 1000));
  p.pen([[0, 180], [BX0, BY0]], { w: 2.6, wob: 1.2, over: 8, seed: 14 }, at(600, 400));
  p.pen([[0, 2100], [BX0, BY1]], { w: 2.6, wob: 1.2, over: 8, seed: 15 }, at(600, 1900));
  p.pen([[PW, 180], [BX1, BY0]], { w: 2.6, wob: 1.2, over: 8, seed: 16 }, at(3300, 400));
  p.pen([[PW, 2100], [BX1, BY1]], { w: 2.6, wob: 1.2, over: 8, seed: 17 }, at(3300, 1900));
  // baseboard
  p.pen([[BX0, BY1 - 26], [BX1, BY1 - 27]], { w: 2.2, wob: .6, over: 5, seed: 18 }, at(1900, 1400));
  // floor boards toward the VP
  for (let i = -7; i < 15; i++) {
    const xb = VP[0] + i * 230, xf = VP[0] + i * 620;
    p.pen([[xb, BY1], [xf, 2120]], { w: 1.3, wob: .6, over: 4, seed: 30 + i, gap: .6 }, at(xf, 2000));
  }

  // ---- window, and through it: the city, the shoggoth
  {
    const wx0 = 1060, wx1 = 1960, wy0 = 660, wy1 = 1200;
    p.reserve([[wx0, wy0], [wx1, wy0], [wx1, wy1], [wx0, wy1]], 1, 0);
    p.wash([[wx0, wy0], [wx1, wy0], [wx1, wy1], [wx0, wy1]], C.sky, { a: .3, j: 5, layers: 2, edge: .1, seed: 50 });
    for (let i = 0; i < 8; i++) {
      const x = wx0 + 30 + i * 110, h = 70 + (i % 4) * 60;
      p.wash([[x, wy1], [x, wy1 - h], [x + 78, wy1 - h], [x + 78, wy1]], mix3(C.stone, C.sky, .45), { a: .32, j: 3, edge: .25, seed: 60 + i });
      p.pen([[x, wy1], [x, wy1 - h], [x + 78, wy1 - h], [x + 78, wy1]], { w: 1.5, wob: .5, seed: 70 + i }, at(wx0, wy0));
      for (let k = 0; k < 3; k++) p.pen([[x + 14 + k * 22, wy1 - h + 22], [x + 22 + k * 22, wy1 - h + 22]], { w: 1.1, wob: .3, over: 0, seed: 72 + i * 5 + k }, at(wx0, wy0));
    }
    // rooftop ledge for the shoggoth
    p.wash([[1280, 940], [1900, 936], [1900, 972], [1280, 976]], hex('#9c8f7c'), { a: .4, j: 3, edge: .3, seed: 80 });
    p.pen([[1280, 940], [1900, 936]], { w: 2.2, wob: .6, seed: 81 }, at(1500, 940));
    // the shoggoth: an amoeboid scribble with seven eyes
    const sx = 1580, sy = 790, base = [];
    for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; const r = 150 + Math.sin(a * 3.1) * 28 + Math.sin(a * 5.7 + 1) * 18; base.push([sx + Math.cos(a) * r * 1.25, sy + Math.sin(a) * r * .95]); }
    p.reserve(base, .8, 3, 90);
    p.wash(base, hex('#6d6a86'), { a: .5, j: 10, layers: 2, edge: .35, seed: 91 });
    p.pen([...base, base[0]], { w: 2.4, wob: 1.6, over: 4, seed: 92, gap: .4, smooth: true }, at(sx, sy));
    // interior scribble
    for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU, r = 40 + (i % 4) * 26; p.pen(spline([[sx + Math.cos(a) * r, sy + Math.sin(a) * r * .7], [sx + Math.cos(a + .5) * (r + 30), sy + Math.sin(a + .5) * (r + 20) * .7], [sx + Math.cos(a + 1) * r, sy + Math.sin(a + 1) * r * .7]], 2), { w: 1.2, wob: 2, over: 1, seed: 100 + i, gap: .6 }, at(sx, sy)); }
    // eyes open at 30.0 — drawn here as static sockets, opened in film.js
    const eyes = [[-92, -16], [-30, -44], [34, -30], [92, -6], [-52, 34], [14, 44], [72, 38]];
    for (const [ex, ey] of eyes) { p.reserve(ellipse(sx + ex, sy + ey, 24, 18, 14), .9, 1, 110); p.wash(ellipse(sx + ex, sy + ey, 24, 18, 14), hex('#efe6d0'), { a: .5, j: 1.5, edge: .25, seed: 111 }); p.pen(ellipse(sx + ex, sy + ey, 24, 18, 14), { w: 1.8, wob: .5, seed: 112 }, 30.0); }
    // window frame: four panes
    rectInk(p, wx0, wy0, wx1, wy1, { w: 3.2, wob: .5, seed: 120, gap: .15 }, at(wx0, wy0));
    p.pen([[wx0 + 300, wy0], [wx0 + 300, wy1]], { w: 2.4, wob: .4, seed: 121 }, at(wx0, wy0));
    p.pen([[wx0, wy0 + 270], [wx1, wy0 + 270]], { w: 2.4, wob: .4, seed: 122 }, at(wx0, wy0));
    // sill
    p.wash([[wx0 - 24, wy1], [wx1 + 24, wy1], [wx1 + 10, wy1 + 22], [wx0 - 10, wy1 + 22]], hex('#b9a17f'), { a: .45, j: 2, edge: .3, seed: 123 });
    p.pen([[wx0 - 24, wy1], [wx1 + 24, wy1]], { w: 2.6, wob: .5, seed: 124 }, at(wx0, wy1));
  }

  // wall shadow / vignette
  p.wash([[900, 560], [3000, 560], [3000, 760], [900, 760]], hex('#7a6a5c'), { a: .12, j: 22, layers: 2, edge: 0, seed: 302, freq: .006 });
  p.wash([[900, 560], [1040, 560], [1040, 1420], [900, 1420]], hex('#7a6a5c'), { a: .12, j: 16, edge: 0, seed: 303 });
  p.wash([[2860, 560], [3000, 560], [3000, 1420], [2860, 1420]], hex('#7a6a5c'), { a: .12, j: 16, edge: 0, seed: 304 });
  { const fx = 2290, fy = 930, w = 320, h = 132; p.reserve([[fx, fy], [fx + w, fy], [fx + w, fy + h], [fx, fy + h]], .8, 2, 305); p.wash([[fx, fy], [fx + w, fy], [fx + w, fy + h], [fx, fy + h]], hex('#e7dcc4'), { a: .4, j: 2, layers: 2, edge: .3, seed: 306 }); rectInk(p, fx, fy, fx + w, fy + h, { w: 2.6, wob: .5, seed: 307, gap: .2 }, at(fx, fy)); p.pen([[fx + 12, fy + 12], [fx + w - 12, fy + 12]], { w: 1.4, wob: .4, seed: 308 }, at(fx, fy)); }

  // evening light through the window: a pale cool patch on the floor
  p.wash([[1180, 1430], [1980, 1430], [2380, 2100], [1180, 2100]], hex('#aebfd0'), { a: .16, j: 24, layers: 2, edge: 0, seed: 300, freq: .005 });
  p.wash([[900, 1420], [1180, 1420], [1180, 2100], [900, 2100]], hex('#5b5a78'), { a: .14, j: 30, layers: 2, edge: 0, seed: 301, freq: .004 });

  // ---- desk (right of the window)
  {
    const x0 = 2180, x1 = 2960, top = 1500;
    p.reserve([[x0 - 20, top - 16], [x1 + 20, top - 16], [x1 + 20, top + 24], [x0 - 20, top + 24]], .6, 3, 130);
    p.wash([[x0 - 20, top - 10], [x1 + 20, top - 14], [x1 + 20, top + 26], [x0 - 20, top + 22]], C.wood, { a: .5, j: 3, layers: 2, edge: .35, seed: 131 });
    p.pen([[x0 - 20, top - 10], [x1 + 20, top - 14]], { w: 3, wob: .6, over: 6, seed: 132 }, at(x0, top));
    p.pen([[x0 - 20, top + 22], [x1 + 20, top + 18]], { w: 2.2, wob: .6, over: 5, seed: 133 }, at(x1, top));
    for (const dx of [x0 + 40, x1 - 40]) { p.pen([[dx, top + 20], [dx - 10, 1780]], { w: 2.6, wob: .5, over: 4, seed: 134 + dx, smooth: false }, at(dx, top)); p.pen([[dx + 20, top + 20], [dx + 30, 1780]], { w: 2.6, wob: .5, over: 4, seed: 136 + dx, smooth: false }, at(dx, top)); }
    // lamp
    p.pen([[2700, top - 12], [2700, top - 150], [2760, top - 200]], { w: 2.4, wob: .4, seed: 140, smooth: false }, at(2700, top));
    p.wash([[2700, top - 200], [2760, top - 246], [2840, top - 214], [2790, top - 180]], hex('#e3cf9c'), { a: .4, j: 2, edge: .3, seed: 141 });
    p.pen([[2700, top - 200], [2760, top - 246], [2840, top - 214], [2790, top - 180]], { w: 2, wob: .5, seed: 142, smooth: false }, at(2700, top));
    // papers
    for (let k = 0; k < 3; k++) { const px = 2240 + k * 30, py = 1468 + k * 8; p.pen([[px, py], [px + 150, py - 6], [px + 156, py + 30], [px + 6, py + 36]], { w: 1.4, wob: .6, seed: 150 + k, smooth: false }, at(px, py)); }
  }

  // ---- chair (the figure sits here)
  {
    const x = 1850, y = 1780, seat = 1590;
    p.pen([[x - 90, seat], [x + 90, seat]], { w: 2.6, wob: .5, seed: 180 }, at(x, seat));
    p.pen([[x - 90, seat], [x - 80, seat - 40], [x - 80, y - 30]], { w: 2.4, wob: .5, seed: 181, smooth: false }, at(x, seat));
    p.pen([[x + 90, seat], [x + 80, seat - 40], [x + 80, y - 30]], { w: 2.4, wob: .5, seed: 182, smooth: false }, at(x, seat));
    p.pen([[x - 80, y - 30], [x + 80, y - 30]], { w: 2.4, wob: .5, seed: 183 }, at(x, y));
    p.pen([[x - 90, seat], [x - 100, y]], { w: 2.4, wob: .5, seed: 184 }, at(x, seat));
    p.pen([[x + 90, seat], [x + 100, y]], { w: 2.4, wob: .5, seed: 185 }, at(x, seat));
    p.wash(ellipse(x + 10, y + 8, 170, 20, 14), C.shadow, { a: .22, j: 6, edge: 0, seed: 186 });
  }

  // ---- a framed sketch, a light switch, a radiator: the wall is not empty
  {
    const fx = 2480, fy = 680, fw = 230, fh = 170;
    p.reserve([[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh]], .6, 2, 2400);
    p.pen([[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh], [fx, fy]], { w: 2.4, wob: .5, seed: 2401, smooth: false }, 22.6);
    p.pen([[fx + 20, fy + fh - 40], [fx + 80, fy + 50], [fx + 140, fy + fh - 60], [fx + fw - 20, fy + 40]], { w: 1.6, wob: .8, seed: 2402, gap: .4 }, 22.7);
    p.wash(ellipse(fx + fw - 60, fy + 50, 26, 26, 14), hex('#e3cf9c'), { a: .4, j: 2, edge: .2, seed: 2403 });
    const sx = 2820, sy = 1030;
    p.pen([[sx, sy], [sx + 50, sy], [sx + 50, sy + 60], [sx, sy + 60], [sx, sy]], { w: 2, wob: .4, seed: 2404, smooth: false }, 22.8);
    p.pen([[sx + 25, sy + 12], [sx + 25, sy + 48]], { w: 3.4, wob: .3, seed: 2405 }, 22.85);
    p.pen([[1200, 1420], [1200, 1260], [1160, 1220]], { w: 2, wob: .4, seed: 2406 }, 22.9);
    for (let k = 0; k < 20; k++) { const x = 1150 + k * 90; p.pen([[x, 1400], [x, 1460]], { w: 1.6, wob: .3, seed: 2410 + k }, 22.95); }
    p.pen([[1140, 1400], [2950, 1400]], { w: 2, wob: .5, seed: 2430 }, 23.0);
  }

  // ---- cables, clock, poster, rug
  for (let k = 0; k < 3; k++) p.pen(spline([[960, 1420], [1200, 1480 + k * 26], [1500, 1430 + k * 34], [1900, 1490 + k * 20], [2300, 1440 + k * 30]], 5), { w: 1.6, wob: 1.1, over: 4, seed: 240 + k, gap: .5 }, at(1200, 1450));
  { const cx = 2740, cy = 780; p.pen(ellipse(cx, cy, 62, 62, 24).concat([[cx + 62, cy]]), { w: 2.4, wob: .5, seed: 250 }, at(cx, cy)); p.pen([[cx, cy], [cx + 26, cy - 30]], { w: 2, wob: .3, seed: 251 }, at(cx, cy)); }
  p.wash([[700, 1900], [1500, 1880], [1640, 2020], [620, 2050]], hex('#a8746a'), { a: .28, j: 12, layers: 2, edge: .2, seed: 252 });
  p.pen([[700, 1900], [1500, 1880], [1640, 2020], [620, 2050], [700, 1900]], { w: 1.8, wob: .9, seed: 253, gap: .5 }, at(900, 1950));

  // ---- mushrooms (they come up on the beat)
  const shroomCols = [hex('#c06a5a'), hex('#b98a4a'), hex('#8b6f9e')];
  mushroom(p, 1120, 1760, 40, shroomCols[0], 22.62);
  mushroom(p, 1210, 1790, 66, shroomCols[1], 22.68);
  mushroom(p, 1300, 1740, 34, shroomCols[2], 22.72);
  mushroom(p, 2140, 1810, 52, shroomCols[0], 22.76);
  mushroom(p, 2230, 1760, 76, shroomCols[1], 22.66);
  mushroom(p, 2330, 1820, 38, shroomCols[2], 22.78);
  mushroom(p, 2440, 1770, 46, shroomCols[0], 22.8);

  const w = p.finish();
  const src = [
    { x: 1950, y: 1200, t: 21.90, v: 11000, R: 6000, mask: (x, y) => !(x > 2920 && y < 1100) },
    { x: 1550, y: 900, t: 29.9, v: 900, R: 900, mask: (x, y) => x < 2100 },
    { x: 3290, y: 780, t: 33.5, v: 900, R: 900 },
    { x: 1800, y: 1760, t: 28.0, v: 900, R: 1200, mask: (x, y) => y > 1400 },
  ];
  return { ...w, ...makeArrival(w.W, w.H, src), sources: src };
}

// ---------------------------------------------------------------- P2 — the hall (38.418–58.417)
// A server cathedral in one point perspective; a treadmill on the centre line; the hall
// bends upward beyond the vanishing point. On the right, the page itself becomes a wall.
export function buildP2() {
  const p = makePage({ t0: 38.4, dur: 20, seed: 300 });
  const at = (x, y, k = 0) => p.arrivalAt(x, y) + k;
  const VP = [1950, 950];
  const sideRack = (side) => {
    // side = -1 left, +1 right
    for (let k = 0; k < 7; k++) {
      const u = k / 7;
      const xNear = 1950 + side * (240 + u * 1500), xFar = 1950 + side * (200 + u * 1300);
      const wN = 150 + u * 300, wF = 120 + u * 250;
      const topN = 950 - (330 + u * 560), topF = 950 - (300 + u * 520);
      const baseN = 1740 + u * 220, baseF = 1660 + u * 190;
      // face
      const face = [[xNear - wN * .5, baseN], [xNear - wN * .5, topN], [xNear + wN * .5, topN], [xNear + wN * .5, baseN]];
      p.reserve(face, .35, 3, 400 + k + side * 10);
      p.wash(face, mix3(C.slate, hex('#39424e'), .25), { a: .5, j: 4, layers: 2, edge: .3, seed: 401 + k + side * 10 });
      // top face (toward the VP)
      const top = [[xNear - wN * .5, topN], [xNear + wN * .5, topN], [xFar + wF * .5, topF], [xFar - wF * .5, topF]];
      p.wash(top, mix3(C.slateD, hex('#2c333d'), .2), { a: .4, j: 4, layers: 2, edge: .2, seed: 420 + k + side * 10 });
      // inner side face
      const inner = [[xNear + side * wN * .5, baseN], [xNear + side * wN * .5, topN], [xFar + side * wF * .5, topF], [xFar + side * wF * .5, baseF]];
      p.wash(inner, hex('#333b46'), { a: .35, j: 5, layers: 2, edge: 0, seed: 430 + k + side * 10 });
      // contour
      p.pen(face.concat([face[0]]), { w: 2.2 - u * .8, wob: .8, over: 4, seed: 440 + k + side * 10, smooth: false, gap: .4 }, at(xNear, topN));
      // rack slots (horizontal lines) + one fan + LEDs
      const n = 9;
      for (let s = 1; s < n; s++) {
        const y = topN + (baseN - topN) * s / n;
        p.pen([[xNear - wN * .42, y], [xNear + wN * .42, y]], { w: 1.1 - u * .4, wob: .4, over: 2, seed: 460 + k * 20 + s + side, gap: .5 }, at(xNear, y));
      }
      const fx = xNear - side * wN * .18, fy = topN + (baseN - topN) * .42, fr = 26 - u * 12;
      p.pen(ellipse(fx, fy, fr, fr, 14).concat([[fx + fr, fy]]), { w: 1.3, wob: .4, seed: 520 + k + side * 10 }, at(fx, fy));
      p.pen([[fx - fr * .6, fy], [fx + fr * .6, fy]], { w: 1, wob: .3, seed: 521 + k + side * 10 }, at(fx, fy));
      for (let d = 0; d < 3; d++) p.wash(ellipse(xNear + wN * .3, topN + 40 + d * 46, 3.2, 3.2, 8), d === 0 ? hex('#a9d6b0') : hex('#8fb8c8'), { a: .8, j: .5, edge: 0, seed: 530 + k * 3 + d });
    }
  };
  // ceiling
  p.wash([[-20, -20], [PW + 20, -20], [PW + 20, 520], [VP[0] + 200, VP[1] - 340], [VP[0] - 200, VP[1] - 340], [-20, 520]], hex('#3f4854'), { a: .4, j: 12, layers: 2, edge: 0, seed: 590 });
  // floor
  p.wash([[-20, 1900], [VP[0] - 300, VP[1]], [VP[0] + 300, VP[1]], [PW + 20, 1900]], hex('#5c6672'), { a: .45, j: 12, layers: 2, edge: .2, seed: 600 });
  p.wash([[-20, 2160], [-20, 1900], [PW + 20, 1900], [PW + 20, 2160]], hex('#46505c'), { a: .4, j: 12, edge: 0, seed: 601 });
  sideRack(-1); sideRack(1);
  // floor grid + centre rail
  for (let i = -9; i < 16; i++) { const xb = VP[0] + i * 120, xf = VP[0] + i * 520; p.pen([[xb, VP[1] + 20], [xf, 2160]], { w: 1.3, wob: .5, over: 4, seed: 620 + i, gap: .55 }, at(xf, 2000)); }
  for (let k = 0; k < 6; k++) { const u = k / 6, y = VP[1] + 30 + Math.pow(u, 1.8) * 1200; p.pen([[VP[0] - 300 - u * 900, y], [VP[0] + 300 + u * 900, y]], { w: 1.2, wob: .5, over: 3, seed: 640 + k, gap: .6 }, at(VP[0], y)); }
  p.pen([[VP[0] - 90, VP[1]], [VP[0] - 260, 2160]], { w: 3, wob: .6, over: 5, seed: 650, gap: .3 }, at(VP[0], 1400));
  p.pen([[VP[0] + 90, VP[1]], [VP[0] + 260, 2160]], { w: 3, wob: .6, over: 5, seed: 651, gap: .3 }, at(VP[0], 1400));
  for (let k = 0; k < 26; k++) { const u = k / 26, y = VP[1] + Math.pow(u, 1.7) * 1180, x = VP[0] + Math.pow(u, 1.2) * 0; p.pen([[VP[0] - 150 - u * 120, y], [VP[0] + 150 + u * 120, y]], { w: 1.6, wob: .4, over: 0, seed: 660 + k, gap: .4 }, at(VP[0], y)); }
  // treadmill
  {
    const x = 1950, y = 1700;
    p.reserve([[x - 300, y - 80], [x + 300, y - 80], [x + 340, y + 40], [x - 340, y + 40]], .6, 4, 700);
    p.wash([[x - 300, y - 80], [x + 300, y - 80], [x + 340, y + 40], [x - 340, y + 40]], C.slateD, { a: .6, j: 4, layers: 2, edge: .4, seed: 701 });
    p.pen([[x - 300, y - 80], [x + 300, y - 80], [x + 340, y + 40], [x - 340, y + 40], [x - 300, y - 80]], { w: 2.6, wob: .6, seed: 702, smooth: false }, at(x, y));
    for (let k = 0; k < 7; k++) { const xx = x - 270 + k * 90; p.pen([[xx, y - 70], [xx + 14, y + 30]], { w: 1.2, wob: .4, over: 0, seed: 710 + k, gap: .6 }, at(x, y)); }
    // console post + screen (a flat line chart)
    p.pen([[x + 280, y - 60], [x + 280, y - 300], [x + 420, y - 300]], { w: 2.4, wob: .4, seed: 720, smooth: false }, at(x, y));
    p.reserve([[x + 330, y - 380], [x + 520, y - 380], [x + 520, y - 260], [x + 330, y - 260]], .7, 2, 721);
    p.wash([[x + 330, y - 380], [x + 520, y - 380], [x + 520, y - 260], [x + 330, y - 260]], hex('#8ea89b'), { a: .35, j: 2, edge: .3, seed: 722 });
    p.pen([[x + 330, y - 380], [x + 520, y - 380], [x + 520, y - 260], [x + 330, y - 260], [x + 330, y - 380]], { w: 2, wob: .4, seed: 723, smooth: false }, at(x + 330, y - 380));
    p.pen([[x + 345, y - 300], [x + 380, y - 302], [x + 420, y - 298], [x + 470, y - 300], [x + 505, y - 299]], { w: 1.6, wob: .3, seed: 724 }, at(x + 340, y - 300));
  }
  // the hall bends up beyond the vanishing point (a spiral of rails)
  {
    const cx = 1950, cy = 900;
    for (let ring = 0; ring < 3; ring++) {
      const pts = [];
      for (let a = 0; a < Math.PI * 4.2; a += .12) { const r = 60 + a * 44 + ring * 40; pts.push([cx + Math.cos(a) * r * 1.15, cy + Math.sin(a) * r * .72 - a * 12]); }
      p.pen(pts, { w: 2.2 - ring * .4, wob: .8, over: 4, seed: 800 + ring, gap: .4 }, 45.1 + ring * .2);
    }
    for (let k = 0; k < 4; k++) { const x = 1750 + k * 120; p.pen([[x, 950], [x + 30, 820]], { w: 1.4, wob: .4, seed: 810 + k, gap: .5 }, 45.3); }
  }
  // scoreboard on the left wall
  {
    const x0 = 150, y0 = 700, x1 = 560, y1 = 980;
    p.reserve([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], .7, 3, 850);
    p.wash([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], hex('#d8d2c0'), { a: .4, j: 3, layers: 2, edge: .3, seed: 851 });
    rectInk(p, x0, y0, x1, y1, { w: 2.6, wob: .6, seed: 852 }, at(x0, y0));
    p.pen([[x0 + 30, y0 + 90], [x1 - 30, y0 + 90]], { w: 1.4, wob: .4, seed: 853 }, at(x0, y0));
    p.pen([[x0 + 30, y0 + 160], [x1 - 30, y0 + 160]], { w: 1.4, wob: .4, seed: 854 }, at(x0, y0));
    p.pen([[x0 + 30, y0 + 230], [x1 - 30, y0 + 230]], { w: 1.4, wob: .4, seed: 855 }, at(x0, y0));
  }
  const w = p.finish({ m: 70 });
  const src = [
    { x: 1950, y: 1400, t: 38.15, v: 11000, R: 6000, mask: (x, y) => !(x > 2880 && y > 620) },
    { x: 1950, y: 1700, t: 39.0, v: 1300, R: 900, mask: (x, y) => y > 1200 },
    { x: 3400, y: 1200, t: 52.9, v: 1100, R: 1400 },
  ];
  return { ...w, ...makeArrival(w.W, w.H, src), sources: src };
}

// ---------------------------------------------------------------- P3 — the sky (58.417–74.779)
// The city is a thin band; the sky is graph paper. One line climbs to the moon; the point it
// reaches turns out to be a crowd of GPUs.
export function buildP3() {
  const p = makePage({ t0: 58.4, dur: 16.4, seed: 400 });
  const at = (x, y, k = 0) => p.arrivalAt(x, y) + k;
  const HOR = 1840;
  // sky: dusk
  for (let i = 0; i < 26; i++) {
    const R = rng(500 + i), x = 200 + R() * 3500, y = 100 + R() * 1300, rx = 400 + R() * 420;
    p.wash(ellipse(x, y, rx, rx * .2, 26, R()), R() < .45 ? hex('#b58d86') : hex('#9fa8c4'), { a: .15 + R() * .08, j: rx * .25, layers: 2, edge: .06, seed: 510 + i, freq: .0045 });
  }
  // far clouds
  for (let i = 0; i < 5; i++) { const x = 500 + i * 700, y = 520 + (i % 3) * 180, rx = 300 + (i % 2) * 120; p.reserve(ellipse(x, y, rx, 46, 18), .5, 28, 540 + i); p.wash(ellipse(x, y + 14, rx * .95, 30, 18), hex('#c9a8a0'), { a: .18, j: 20, edge: 0, seed: 550 + i }); }
  // city band
  p.wash([[-20, HOR], [PW + 20, HOR], [PW + 20, 2060], [-20, 2060]], hex('#8b8fa0'), { a: .28, j: 10, layers: 2, edge: 0, seed: 600 });
  const RB = rng(6);
  for (let i = 0; i < 40; i++) {
    const x = -20 + i * 100, hw = 26 + RB() * 60, h = 70 + RB() * 420;
    const col = mix3(RB() < .5 ? C.stone : C.glass, hex('#8b8fa0'), .55);
    p.wash([[x - hw, HOR], [x - hw, HOR - h], [x + hw, HOR - h], [x + hw, HOR]], col, { a: .4, j: 4, layers: 2, edge: .25, seed: 610 + i });
    p.pen([[x - hw, HOR], [x - hw, HOR - h], [x + hw, HOR - h], [x + hw, HOR]], { w: 1.6, wob: .6, seed: 620 + i, gap: .4 }, at(x, HOR - h));
    for (let k = 0; k < 4; k++) if (RB() < .6) p.pen([[x - hw + 10, HOR - h + 20 + k * 40], [x - hw + 34, HOR - h + 20 + k * 40]], { w: 1, wob: .3, over: 0, seed: 630 + i * 5 + k }, at(x, HOR));
  }
  // graph grid in the sky
  for (let i = 0; i < 9; i++) { const x = 500 + i * 380; p.pen([[x, 260], [x, 1820]], { w: .7, wob: .35, over: 0, seed: 700 + i, gap: .9 }, at(x, 1000)); }
  for (let k = 0; k < 6; k++) { const y = 320 + k * 300; p.pen([[420, y], [3420, y + 4]], { w: .7, wob: .35, over: 0, seed: 710 + k, gap: .9 }, at(1900, y)); }
  // the moon
  {
    const mx = 2820, my = 520, r = 230;
    p.reserve(ellipse(mx, my, r * 1.12, r * 1.12, 40), .95, 4, 800);
    p.wash(ellipse(mx, my, r, r, 40), hex('#efe4c4'), { a: .5, j: 3, layers: 2, edge: .25, seed: 801 });
    p.wash(ellipse(mx - 40, my - 30, r * .8, r * .8, 30), hex('#e3d3a8'), { a: .25, j: 10, edge: 0, seed: 802 });
    p.pen(ellipse(mx, my, r, r, 48).concat([[mx + r, my]]), { w: 2.6, wob: .8, over: 6, seed: 803, gap: .3 }, 58.6);
    for (let k = 0; k < 8; k++) { const a = k * 1.1, rr = r * (.3 + (k % 3) * .18); p.pen(ellipse(mx + Math.cos(a) * rr, my + Math.sin(a) * rr, 20 + (k % 4) * 12, 16 + (k % 3) * 10, 12), { w: 1, wob: .5, over: 1, seed: 810 + k, gap: .6 }, 58.7); }
  }
  // the snake (basilisk): around the moon and down to the right
  {
    const pts = spline([[2200, 760], [2400, 480], [2700, 300], [3040, 330], [3240, 520], [3180, 760], [2960, 900], [2740, 880]], 6);
    p.wash(pts.concat([[2760, 980]]), hex('#9db08a'), { a: .18, j: 26, layers: 2, edge: 0, seed: 850 });
    p.pen(pts, { w: 7.5, wob: 1.2, over: 6, seed: 851, gap: .35 }, 60.6); p.pen(pts.map(q => [q[0] + 3, q[1] + 4]), { w: 2.2, wob: 1.4, over: 4, seed: 8511, gap: .5 }, 60.65); for (let k = 0; k < 20; k++) { const q = pts[Math.floor(k / 20 * (pts.length - 1))]; p.pen([[q[0] - 6, q[1] + 12], [q[0] + 8, q[1] + 26]], { w: 1, wob: .4, over: 0, seed: 8520 + k, gap: .6 }, 60.7); }
    // head
    const hx = 2720, hy = 900;
    p.pen(ellipse(hx, hy, 60, 40, 20).concat([[hx + 60, hy]]), { w: 2.4, wob: .6, seed: 852 }, 60.8);
    p.wash(ellipse(hx, hy, 58, 38, 20), hex('#9db08a'), { a: .3, j: 3, edge: .2, seed: 853 });
    p.pen([[hx - 40, hy - 10], [hx - 18, hy - 14], [hx + 2, hy - 8]], { w: 1.8, wob: .3, seed: 854 }, 60.9);
    p.wash(ellipse(hx + 30, hy - 6, 5, 5, 8), INK, { a: .8, j: .5, edge: 0, seed: 855 });
    for (let k = 0; k < 2; k++) p.pen([[hx + 46, hy + 12 + k * 8], [hx + 62, hy + 26 + k * 8]], { w: 1.4, wob: .3, seed: 856 + k }, 60.95);
  }
  // the omega point: lines converge at the top of the spike
  {
    const ox = 3060, oy = 210;
    for (let k = 0; k < 26; k++) { const a = -Math.PI + k / 25 * Math.PI, r0 = 300 + (k % 4) * 130; p.pen([[ox + Math.cos(a) * r0, oy + Math.sin(a) * r0 * .7], [ox + Math.cos(a) * 60, oy + Math.sin(a) * 60 * .7], [ox, oy]], { w: 1.1, wob: .5, over: 0, seed: 950 + k, gap: .45 }, 64.1 + (k % 5) * .03); }
    p.pen([[2820, 520], [2940, 380], [3060, 210]], { w: 4, wob: .8, over: 6, seed: 960 }, 63.9);
    p.wash(ellipse(ox, oy, 26, 26, 14), ORANGE, { a: .9, j: 1, edge: 0, seed: 961 });
  }
  // GPU mandala (hidden inside the point): a radial field of boxes, revealed at 66.2
  {
    const ox = 3060, oy = 260;
    const RBg = rng(77);
    for (let ring = 1; ring <= 6; ring++) {
      const n = 10 + ring * 8, r = ring * 92;
      for (let k = 0; k < n; k++) {
        const a = k / n * TAU + ring * .2, x = ox + Math.cos(a) * r * 1.15, y = oy + Math.sin(a) * r * .82;
        const s = 12 + ring * 2.5;
        p.pen([[x - s, y - s * .7], [x + s, y - s * .7], [x + s, y + s * .7], [x - s, y + s * .7], [x - s, y - s * .7]], { w: 1, wob: .4, seed: 1000 + ring * 100 + k, gap: .5 }, 66.25 + ring * .06 + k * .002);
        p.pen(ellipse(x, y, s * .34, s * .34, 8), { w: .8, wob: .3, seed: 1100 + ring * 100 + k, gap: .4 }, 66.25 + ring * .06 + k * .002);
      }
    }
  }
  // margin: surveyor's checkbox and a date
  {
    const x = 3560, y = 1500;
    p.pen([[x, y], [x + 54, y], [x + 54, y + 54], [x, y + 54], [x, y]], { w: 2, wob: .4, seed: 1300, smooth: false }, 70.4);
    p.pen([[x + 8, y + 30], [x + 24, y + 48], [x + 56, y + 2]], { w: 3.4, wob: .5, seed: 1301 }, 71.0);
    p.pen([[x, y + 90], [x + 260, y + 90]], { w: 1.2, wob: .5, seed: 1302 }, 70.8);
  }

  const w = p.finish({ m: 80 });
  const src = [
    { x: 1500, y: 1500, t: 58.15, v: 11000, R: 6000, mask: (x, y) => y < 1900 && Math.hypot(x - 2820, y - 520) > 300 && !(x > 2600 && y < 560) },
    { x: 2820, y: 520, t: 60.2, v: 1000, R: 700 },
    { x: 3060, y: 260, t: 64.2, v: 1200, R: 1000 },
  ];
  return { ...w, ...makeArrival(w.W, w.H, src), sources: src };
}

// ---------------------------------------------------------------- P4 — the road (74.779–94.778)
// A road leaves the city, turns hard left and runs out at the torn edge of the page.
export function buildP4() {
  const p = makePage({ t0: 74.7, dur: 20.1, seed: 500 });
  const at = (x, y, k = 0) => p.arrivalAt(x, y) + k;
  const HOR = 1180;
  // sky: dry, hot
  for (let i = 0; i < 18; i++) {
    const R = rng(600 + i), x = 200 + R() * 3500, y = 100 + R() * 700, rx = 380 + R() * 400;
    p.wash(ellipse(x, y, rx, rx * .22, 24, R()), R() < .4 ? hex('#d8b98c') : hex('#c9c3ae'), { a: .1 + R() * .05, j: rx * .25, layers: 2, edge: .06, seed: 610 + i, freq: .0045 });
  }
  // a warm dusk gradient
  for (let i = 0; i < 10; i++) { const y = 200 + i * 90; p.wash([[-40, y], [PW + 40, y - 20], [PW + 40, y + 110], [-40, y + 130]], i < 4 ? hex('#c9a08c') : hex('#d8b98c'), { a: .10, j: 30, layers: 2, edge: 0, seed: 590 + i, freq: .004 }); }
  // mesas
  const RB = rng(11);
  for (let k = 0; k < 5; k++) {
    const x = 300 + k * 780 + RB() * 200, w = 320 + RB() * 260, h = 90 + RB() * 120, top = HOR - h;
    p.wash([[x - w / 2, HOR], [x - w / 2 + 30, top], [x + w / 2 - 20, top], [x + w / 2, HOR]], mix3(hex('#b98a63'), hex('#c9c3ae'), .45), { a: .35, j: 6, layers: 2, edge: .3, seed: 620 + k });
    p.pen([[x - w / 2, HOR], [x - w / 2 + 30, top], [x + w / 2 - 20, top], [x + w / 2, HOR]], { w: 1.8, wob: .8, seed: 630 + k, gap: .4 }, at(x, top));
    for (let i = 0; i < 4; i++) p.pen([[x - w / 2 + 40 + i * 60, top + 10], [x - w / 2 + 46 + i * 60, top + 44]], { w: 1, wob: .4, seed: 635 + k * 5 + i, gap: .6 }, at(x, top));
  }
  // ground
  p.wash([[-20, HOR], [PW + 20, HOR], [PW + 20, 2160], [-20, 2160]], hex('#cdb289'), { a: .38, j: 14, layers: 2, edge: 0, seed: 700 });
  p.wash([[-20, HOR], [PW + 20, HOR], [PW + 20, HOR + 120], [-20, HOR + 120]], hex('#b9986c'), { a: .18, j: 16, edge: 0, seed: 701 });
  // road: from bottom centre to the turn, then left
  const roadPoly = [[1450, 2160], [1750, 1500], [1900, 1360], [1860, 1330], [1300, 1300], [960, 1310], [900, 1340], [1100, 1380], [1600, 1430], [1500, 1600], [1250, 2160]];
  p.reserve(roadPoly, .55, 3, 710);
  p.wash(roadPoly, hex('#e0d3b6'), { a: .5, j: 5, layers: 2, edge: .35, seed: 711 });
  // centre line, broken
  for (let k = 0; k < 7; k++) {
    const u = k / 7;
    const y0 = 2120 - u * 700, x0 = 1500 - u * 60;
    p.pen([[x0, y0], [x0 - 40, y0 - 60]], { w: 2.2, wob: .5, over: 2, seed: 720 + k, gap: .2 }, at(x0, y0));
  }
  for (let k = 0; k < 4; k++) { const x = 1250 - k * 90, y = 1332 + k * 6; p.pen([[x, y], [x - 60, y + 4]], { w: 2, wob: .4, over: 1, seed: 730 + k, gap: .3 }, at(x, y)); }
  // road edges
  p.pen([[1460, 2150], [1756, 1504], [1902, 1364]], { w: 2.4, wob: .8, over: 5, seed: 740, gap: .4 }, at(1700, 1700));
  p.pen([[1240, 2150], [1494, 1604], [1604, 1434]], { w: 2.4, wob: .8, over: 5, seed: 741, gap: .4 }, at(1500, 1800));
  p.pen([[1864, 1336], [1300, 1306], [960, 1316]], { w: 2.6, wob: .8, over: 5, seed: 742, gap: .35 }, at(1500, 1320));
  p.pen([[1880, 1356], [1300, 1326], [950, 1336]], { w: 2.2, wob: .8, over: 5, seed: 743, gap: .4 }, at(1500, 1340));
  // scrub and stones
  for (let i = 0; i < 40; i++) { const x = 200 + n2(i, 3) * 3400, y = 1250 + n2(i, 4) * 780; if (x > 1000 && x < 2000 && y < 1700) continue; for (let k = 0; k < 4; k++) p.pen([[x, y], [x + (n2(i, k) - .5) * 26, y - 16 - n2(i, k + 5) * 22]], { w: 1.1, wob: .4, over: 0, seed: 921 + i * 4 + k, gap: .5 }, at(x, y)); }
  // a dead windmill and a gas sign
  {
    const x = 2450, base = 1250, top = 900;
    p.pen([[x - 26, base], [x - 14, top], [x + 14, top], [x + 26, base]], { w: 2.2, wob: .6, seed: 960, smooth: false }, at(x, base));
    p.pen([[x - 14, top], [x, top - 40], [x + 14, top]], { w: 2, wob: .5, seed: 961 }, at(x, top));
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; p.pen([[x, top - 30], [x + Math.cos(a) * 110, top - 30 + Math.sin(a) * 110]], { w: 1.6, wob: .5, seed: 970 + k, gap: .4 }, at(x, top)); }
    const gx = 1350, gy = 1300;
    p.pen([[gx, gy], [gx, gy - 260], [gx + 200, gy - 260], [gx + 200, gy - 160], [gx, gy - 160]], { w: 2.6, wob: .6, seed: 980, smooth: false }, at(gx, gy));
    p.wash([[gx + 8, gy - 252], [gx + 192, gy - 252], [gx + 192, gy - 168], [gx + 8, gy - 168]], hex('#d8c8a2'), { a: .35, j: 3, edge: .2, seed: 981 });
  }
  // vultures
  for (let i = 0; i < 4; i++) { const x = 900 + i * 360, y = 300 + n2(i, 2) * 180; p.pen([[x - 40, y], [x - 12, y - 18], [x, y - 6], [x + 14, y - 20], [x + 42, y]], { w: 1.8, wob: .5, over: 1, seed: 940 + i }, at(x, y)); }
  // a dirt track joining the road
  p.wash([[1900, 1500], [2300, 1420], [2800, 1400], [2850, 1430], [2300, 1470], [1950, 1540]], hex('#c2a67e'), { a: .28, j: 8, layers: 2, edge: .2, seed: 950 });
  // telephone poles
  for (let k = 0; k < 4; k++) {
    const x = 2500 - k * 300, y = HOR + 60 + k * 60, h = 300 - k * 30;
    p.pen([[x, y], [x - 6, y - h]], { w: 2.6, wob: .5, seed: 750 + k }, at(x, y));
    p.pen([[x - 40, y - h + 30], [x + 34, y - h + 28]], { w: 2, wob: .4, seed: 760 + k }, at(x, y));
    p.pen([[x - 30, y - h + 60], [x + 24, y - h + 58]], { w: 1.6, wob: .4, seed: 770 + k }, at(x, y));
  }
  // wires
  for (let k = 0; k < 2; k++) p.pen(spline([[2200, 940 + k * 26], [1950, 1010 + k * 26], [1700, 990 + k * 26], [1450, 1030 + k * 26]], 5), { w: 1.1, wob: .8, over: 4, seed: 780 + k, gap: .6 }, at(1900, 1000));
  // statue on a plinth (von Neumann)
  {
    const x = 2870, base = 1470;
    p.reserve([[x - 160, base], [x - 130, base - 110], [x + 130, base - 110], [x + 160, base]], .5, 3, 800);
    p.wash([[x - 160, base], [x - 130, base - 110], [x + 130, base - 110], [x + 160, base]], hex('#c9b79a'), { a: .5, j: 3, layers: 2, edge: .3, seed: 801 });
    p.pen([[x - 160, base], [x - 130, base - 110], [x + 130, base - 110], [x + 160, base]], { w: 2.4, wob: .6, seed: 802, smooth: false }, at(x, base));
    // bust
    p.wash([[x - 70, base - 60], [x - 60, base - 190], [x - 20, base - 240], [x + 20, base - 240], [x + 60, base - 190], [x + 70, base - 60]], hex('#b8ae9c'), { a: .45, j: 4, layers: 2, edge: .3, seed: 803 });
    p.pen([[x - 70, base - 60], [x - 60, base - 190], [x - 20, base - 240], [x + 20, base - 240], [x + 60, base - 190], [x + 70, base - 60]], { w: 2.4, wob: .9, seed: 804, gap: .35 }, at(x, base));
    p.wash(ellipse(x, base - 262, 46, 56, 20), hex('#c4b9a6'), { a: .5, j: 3, edge: .3, seed: 805 });
    p.pen(ellipse(x, base - 262, 46, 56, 20).concat([[x + 46, base - 262]]), { w: 2.2, wob: .8, seed: 806, gap: .4 }, at(x, base));
    p.wash(ellipse(x, base - 60, 150, 16, 14), C.shadow, { a: .24, j: 4, edge: 0, seed: 807 });
    // plaque
    p.pen([[x - 80, base - 30], [x + 80, base - 30]], { w: 1.6, wob: .4, seed: 808 }, at(x, base));
  }
  // one tree, right
  tree(p, 3420, 1420, 210, { seed: 820, at: at(3420, 1200), dens: .8, scale: .85 });
  // dry grass tufts
  for (let i = 0; i < 120; i++) {
    const x = n2(i, 3) * PW, y = 1250 + n2(i, 4) * 800;
    if (y < HOR + 40) continue;
    if (x > 1200 && x < 1950 && y < 1700) continue;
    for (let k = 0; k < 2; k++) p.pen([[x + k * 5, y], [x + k * 5 + (n2(i, k) - .5) * 18, y - 12 - n2(i, k + 9) * 14]], { w: 1, wob: .3, over: 0, seed: 900 + i * 3 + k, gap: .5 }, at(x, y));
  }
  // the paper tape, unspooled off the left edge
  {
    const pts = spline([[960, 1330], [780, 1290], [600, 1330], [420, 1280], [240, 1320], [60, 1270], [-40, 1300]], 5);
    paperTape(p, pts, 34, 85.4);
  }
  // the page's left edge: torn, with a notch where a hand will hang
  {
    const pts = []; for (let y = 600; y < 1900; y += 30) pts.push([90 + Math.sin(y * .02) * 14 + (fbm(y * .01, 3, 5) - .5) * 34, y]);
    p.pen(pts, { w: 2.2, wob: 1.2, over: 5, seed: 950, gap: .6 }, at(120, 1200));
    for (let i = 0; i < 26; i++) { const y = 620 + i * 48, x = 90 + Math.sin(y * .02) * 14; p.pen([[x, y], [x + 10 + n2(i, 2) * 10, y + 8]], { w: .9, wob: .5, over: 0, seed: 960 + i, gap: .7 }, at(120, y)); }
  }

  const w = p.finish({ m: 100 });
  const src = [
    { x: 1800, y: 1500, t: 74.55, v: 11000, R: 6000, mask: (x, y) => !(x > 2650 && x < 3120 && y > 1120 && y < 1520) },
    { x: 2870, y: 1300, t: 77.8, v: 900, R: 700 },
    { x: 700, y: 1320, t: 84.9, v: 700, R: 1200, mask: (x, y) => x < 1400 },
  ];
  return { ...w, ...makeArrival(w.W, w.H, src), sources: src };
}

// ---------------------------------------------------------------- P5 — the office (94.778–109.323)
// A small office filling with paperclips; the orange line turns out to be a fuse.
export function buildP5() {
  const p = makePage({ t0: 94.7, dur: 14.8, seed: 600 });
  const at = (x, y, k = 0) => p.arrivalAt(x, y) + k;
  const BX0 = 1100, BX1 = 2900, BY0 = 620, BY1 = 1440;
  // room
  p.reserve([[BX0, BY0], [BX1, BY0], [BX1, BY1], [BX0, BY1]], .5, 4, 1);
  p.wash([[BX0, BY0], [BX1, BY0], [BX1, BY1], [BX0, BY1]], hex('#d3d2bd'), { a: .52, j: 9, layers: 2, edge: .25, seed: 2 });
  p.wash([[0, 300], [BX0, BY0], [BX0, BY1], [0, 2100]], hex('#b3b29a'), { a: .46, j: 12, layers: 2, edge: .2, seed: 3 });
  p.wash([[PW, 300], [BX1, BY0], [BX1, BY1], [PW, 2100]], hex('#a5a48d'), { a: .46, j: 12, layers: 2, edge: .2, seed: 4 });
  p.wash([[0, 2100], [BX0, BY1], [BX1, BY1], [PW, 2100]], hex('#b8b098'), { a: .52, j: 12, layers: 2, edge: .2, seed: 5 });
  p.wash([[0, 2160], [0, 2100], [PW, 2100], [PW, 2160]], hex('#9c9580'), { a: .36, j: 12, edge: 0, seed: 6 });
  p.wash([[0, 300], [BX0, BY0], [BX1, BY0], [PW, 300]], hex('#a2a28c'), { a: .48, j: 12, layers: 2, edge: 0, seed: 7 });
  p.pen([[BX0, BY0], [BX1, BY0]], { w: 3, wob: 1, over: 8, seed: 10, gap: .25 }, at(1900, 650));
  p.pen([[BX0, BY1], [BX1, BY1]], { w: 2.8, wob: 1, over: 8, seed: 11 }, at(1900, 1440));
  p.pen([[BX0, BY0], [BX0, BY1]], { w: 3, wob: .8, over: 8, seed: 12 }, at(1100, 1000));
  p.pen([[BX1, BY0], [BX1, BY1]], { w: 3, wob: .8, over: 8, seed: 13 }, at(2900, 1000));
  p.pen([[0, 300], [BX0, BY0]], { w: 2.4, wob: 1.2, over: 8, seed: 14 }, at(600, 500));
  p.pen([[0, 2100], [BX0, BY1]], { w: 2.4, wob: 1.2, over: 8, seed: 15 }, at(600, 1900));
  p.pen([[PW, 300], [BX1, BY0]], { w: 2.4, wob: 1.2, over: 8, seed: 16 }, at(3200, 500));
  p.pen([[PW, 2100], [BX1, BY1]], { w: 2.4, wob: 1.2, over: 8, seed: 17 }, at(3200, 1900));
  // ceiling light panels
  for (let k = 0; k < 2; k++) { const x = 1500 + k * 900; p.reserve([[x - 260, 330], [x + 260, 330], [x + 240, 400], [x - 240, 400]], .6, 2, 20 + k); p.wash([[x - 260, 330], [x + 260, 330], [x + 240, 400], [x - 240, 400]], hex('#f0e9c8'), { a: .35, j: 2, edge: .2, seed: 21 + k }); rectInk(p, x - 260, 330, x + 260, 400, { w: 2, wob: .5, seed: 22 + k }, at(x, 340)); }
  // desk (left)
  {
    const x0 = 1180, x1 = 1980, top = 1560;
    p.reserve([[x0 - 20, top - 14], [x1 + 20, top - 14], [x1 + 20, top + 22], [x0 - 20, top + 22]], .55, 3, 40);
    p.wash([[x0 - 20, top - 10], [x1 + 20, top - 12], [x1 + 20, top + 24], [x0 - 20, top + 22]], C.woodD, { a: .42, j: 4, layers: 2, edge: .35, seed: 41 });
    p.pen([[x0 - 20, top - 10], [x1 + 20, top - 12]], { w: 2.8, wob: .6, over: 6, seed: 42 }, at(x0, top));
    for (const dx of [x0 + 40, x1 - 40]) { p.pen([[dx, top + 20], [dx - 10, 1900]], { w: 2.6, wob: .5, over: 4, seed: 43 + dx, smooth: false }, at(dx, top)); p.pen([[dx + 22, top + 20], [dx + 32, 1900]], { w: 2.6, wob: .5, over: 4, seed: 45 + dx, smooth: false }, at(dx, top)); }
    // monitor: a plain panel, no interface
    p.reserve([[1320, 1330], [1680, 1330], [1680, 1520], [1320, 1520]], .75, 2, 46);
    p.wash([[1320, 1330], [1680, 1330], [1680, 1520], [1320, 1520]], hex('#7e8b84'), { a: .45, j: 3, layers: 2, edge: .3, seed: 47 });
    rectInk(p, 1320, 1330, 1680, 1520, { w: 2.2, wob: .5, seed: 48 }, at(1320, 1330));
    p.pen([[1500, 1520], [1490, 1560]], { w: 2, wob: .4, seed: 49 }, at(1500, 1520));
    // papers + mug
    for (let k = 0; k < 3; k++) p.pen([[1740, 1550 - k * 8], [1880, 1544 - k * 8], [1884, 1570 - k * 8], [1744, 1576 - k * 8]], { w: 1.2, wob: .5, seed: 50 + k, smooth: false }, at(1740, 1550));
    p.wash(ellipse(1830, 1536, 26, 10, 12), hex('#d9d2c0'), { a: .4, j: 1.5, edge: .2, seed: 54 });
    p.pen(ellipse(1830, 1520, 24, 12, 12), { w: 1.8, wob: .3, seed: 55 }, at(1830, 1520));
  }
  p.wash([[1180, 1900], [1900, 1900], [2000, 1990], [1120, 1990]], hex('#5c5a52'), { a: .18, j: 14, edge: 0, seed: 39 });
  // chair (empty, turned)
  {
    const x = 2250, y = 1880, seat = 1660;
    p.pen([[x - 100, seat], [x + 100, seat]], { w: 2.8, wob: .5, seed: 60 }, at(x, seat));
    p.pen([[x - 100, seat], [x - 90, seat - 40], [x - 90, y - 330]], { w: 2.6, wob: .5, seed: 61, smooth: false }, at(x, seat));
    p.pen([[x + 100, seat], [x + 90, seat - 40], [x + 90, y - 330]], { w: 2.6, wob: .5, seed: 62, smooth: false }, at(x, seat));
    p.pen([[x - 90, y - 330], [x + 90, y - 330]], { w: 2.6, wob: .5, seed: 63 }, at(x, y));
    p.pen([[x - 100, seat], [x - 120, y]], { w: 2.4, wob: .5, seed: 64 }, at(x, seat));
    p.pen([[x + 100, seat], [x + 120, y]], { w: 2.4, wob: .5, seed: 65 }, at(x, seat));
    p.wash(ellipse(x, y + 10, 190, 22, 14), C.shadow, { a: .2, j: 6, edge: 0, seed: 66 });
    // PTO note stuck to the back
    p.reserve([[x - 70, y - 320], [x + 70, y - 320], [x + 70, y - 250], [x - 70, y - 250]], .8, 2, 67);
    p.pen([[x - 70, y - 320], [x + 70, y - 320], [x + 70, y - 250], [x - 70, y - 250], [x - 70, y - 320]], { w: 1.6, wob: .5, seed: 68, smooth: false }, at(x, y - 320));
  }
  // the red switch on the right wall
  {
    const x = 3160, y = 1180;
    p.reserve([[x - 110, y - 170], [x + 110, y - 170], [x + 110, y + 150], [x - 110, y + 150]], .6, 3, 70);
    p.wash([[x - 110, y - 170], [x + 110, y - 170], [x + 110, y + 150], [x - 110, y + 150]], hex('#b8483e'), { a: .45, j: 3, layers: 2, edge: .3, seed: 71 });
    rectInk(p, x - 110, y - 170, x + 110, y + 150, { w: 3, wob: .6, seed: 72 }, at(x, y));
    p.wash(ellipse(x, y + 10, 62, 62, 18), hex('#8f2f28'), { a: .5, j: 2, edge: .3, seed: 73 });
    p.pen([[x, y + 10], [x + 26, y - 50]], { w: 8, wob: .4, seed: 74 }, at(x, y));
    p.pen([[x, y - 70], [x + 30, y - 120]], { w: 3, wob: .4, seed: 75 }, at(x, y));
  }
  // door (left wall) + whiteboard
  {
    const q = [[420, 700], [820, 840], [820, 1600], [420, 1760]];
    p.reserve(q, .5, 3, 80); p.wash(q, hex('#9a9384'), { a: .38, j: 3, layers: 2, edge: .3, seed: 81 });
    polyInk(p, q, { w: 2.4, wob: .8, seed: 82 }, at(500, 1100));
    const wb = [[930, 900], [1080, 900], [1080, 1250], [930, 1250]];
    p.reserve(wb, .7, 2, 83); p.wash(wb, hex('#e6e3d4'), { a: .35, j: 2, layers: 2, edge: .25, seed: 84 });
    p.pen([...wb, wb[0]], { w: 2, wob: .5, seed: 85, smooth: false }, at(930, 900));
  }
  // floor tiles
  for (let i = -6; i < 14; i++) { const xb = 2000 + i * 160, xf = 2000 + i * 420; p.pen([[xb, BY1], [xf, 2120]], { w: 1.1, wob: .5, over: 4, seed: 90 + i, gap: .6 }, at(xf, 2000)); }
  for (let k = 0; k < 5; k++) { const y = 1480 + k * 130; p.pen([[-40, y], [PW + 40, y + 6]], { w: 1, wob: .5, over: 3, seed: 100 + k, gap: .7 }, at(300, y)); }

  const w = p.finish({ m: 80 });
  const src = [
    { x: 1900, y: 1400, t: 94.55, v: 11000, R: 6000 },
    { x: 2400, y: 1900, t: 96.8, v: 900, R: 1200, mask: (x, y) => y > 1200 },
  ];
  return { ...w, ...makeArrival(w.W, w.H, src), sources: src };
}

// ---------------------------------------------------------------- P6 — the stack (109.323–140.23)
// The page is cut into strips and re-stacked. A loom weaves the strips; a fence snaps;
// the recursion becomes a hand drawing a hand; everything collapses into one eye.
export function buildP6() {
  const p = makePage({ t0: 109.3, dur: 31, seed: 700 });
  const at = (x, y, k = 0) => p.arrivalAt(x, y) + k;
  const bands = [
    [140, 400, -40, 'sky'], [424, 684, 70, 'racks'], [708, 968, -20, 'room'],
    [992, 1252, 90, 'road'], [1276, 1536, -60, 'clips'], [1560, 1820, 40, 'gpu'],
    [1844, 2040, -80, 'eye'],
  ];
  // paper of the stack
  for (const [y0, y1, off] of bands) {
    p.reserve([[-60, y0], [PW + 60, y0], [PW + 60, y1], [-60, y1]], .35, 5, (y0 | 0) + 3);
    p.wash([[-60, y0], [PW + 60, y0], [PW + 60, y1], [-60, y1]], hex('#efe7d4'), { a: .22, j: 8, layers: 2, edge: 0, seed: (y0 | 0) + 4 });
    p.wash([[-60, y0], [PW + 60, y0], [PW + 60, y1], [-60, y1]], (y0 % 3 === 0) ? hex('#8c86b8') : hex('#c9b183'), { a: .10, j: 8, edge: 0, seed: (y0 | 0) + 5 });
  }
  // the paper cutter: a blade and its hard shadow above the stack
  {
    const bl = [[700, 210], [3200, 190], [3200, 300], [700, 320]];
    p.reserve(bl, .6, 2, 7000);
    p.wash(bl, hex('#7b8794'), { a: .35, j: 4, layers: 2, edge: .3, seed: 7001 });
    p.pen([...bl, bl[0]], { w: 3.4, wob: .6, seed: 7002 }, 109.45);
    p.pen([[700, 320], [3200, 300]], { w: 5, wob: .3, seed: 7003 }, 109.5);
    p.wash([[700, 320], [3200, 300], [3200, 360], [700, 380]], hex('#5b5a78'), { a: .14, j: 6, edge: 0, seed: 7004 });
    // handle
    p.pen([[700, 210], [560, 150], [560, 60]], { w: 8, wob: .5, seed: 7005 }, 109.5);
  }
  // content per band
  for (const [y0, y1, off, kind] of bands) {
    const H = y1 - y0, mid = (y0 + y1) / 2;
    if (kind === 'sky') {
      for (let i = 0; i < 10; i++) { const x = 100 + i * 380, h = 90 + (i % 4) * 70, hw = 40 + (i % 3) * 60; p.wash([[x - hw + off, y1], [x - hw + off, y1 - h], [x + hw + off, y1 - h], [x + hw + off, y1]], mix3(C.stone, C.sky, .5), { a: .35, j: 4, layers: 2, edge: .25, seed: 900 + i }); p.pen([[x - hw + off, y1], [x - hw + off, y1 - h], [x + hw + off, y1 - h], [x + hw + off, y1]], { w: 1.6, wob: .6, seed: 910 + i }, at(x, mid)); }
      p.pen(ellipse(3000 + off, y0 + 80, 90, 90, 30), { w: 2, wob: .6, seed: 920 }, at(3000, y0));
      for (let i = 0; i < 4; i++) { const x = 1500 + i * 130 + off, y = y0 + 60 + (i % 2) * 40; p.pen([[x - 12, y], [x, y - 6], [x + 12, y]], { w: 1.4, wob: .3, seed: 930 + i }, at(x, y)); }
    } else if (kind === 'racks') {
      for (let i = 0; i < 14; i++) { const x = 100 + i * 280 + off; p.pen([[x, y0 + 10], [x, y1 - 10]], { w: 2.2, wob: .4, seed: 940 + i }, at(x, mid)); for (let k = 0; k < 6; k++) p.pen([[x + 20, y0 + 30 + k * 34], [x + 200, y0 + 32 + k * 34]], { w: 1.1, wob: .4, seed: 950 + i * 7 + k, gap: .5 }, at(x, mid)); }
    } else if (kind === 'room') {
      const wx = 1200 + off, wy = y0 + 30;
      p.wash([[wx, wy], [wx + 700, wy], [wx + 700, wy + 180], [wx, wy + 180]], C.sky, { a: .3, j: 4, layers: 2, edge: .15, seed: 960 });
      p.pen([[wx, wy], [wx + 700, wy], [wx + 700, wy + 180], [wx, wy + 180], [wx, wy]], { w: 2.4, wob: .5, seed: 961, smooth: false }, at(wx, wy));
      p.pen([[wx + 350, wy], [wx + 350, wy + 180]], { w: 2, wob: .4, seed: 962 }, at(wx, wy));
      for (let i = 0; i < 4; i++) mushroom(p, 700 + i * 260 + off, y1 - 10, 30, hex('#c06a5a'), at(700, mid));
    } else if (kind === 'road') {
      p.wash([[200 + off, y1], [1400 + off, y1], [2000 + off, y0 + 40], [3000 + off, y0 + 40]], hex('#d8c7a6'), { a: .3, j: 8, layers: 2, edge: .2, seed: 970 });
      for (let k = 0; k < 7; k++) { const x = 2600 + k * 130 + off, y = y0 + 20; p.pen([[x, y1 - 10], [x, y1 - 150]], { w: 3, wob: .5, seed: 980 + k }, at(x, mid)); p.pen([[x - 20, y1 - 90], [x + 22, y1 - 92]], { w: 2, wob: .4, seed: 990 + k }, at(x, mid)); }
    } else if (kind === 'clips') {
      for (let i = 0; i < 26; i++) { const x = 100 + i * 108 + off, y = y0 + 30 + (i % 3) * 40; p.pen(spline([[x, y], [x + 40, y - 20], [x + 76, y + 10], [x + 44, y + 40], [x + 14, y + 20], [x + 36, y - 4]], 4), { w: 1.8, wob: .6, seed: 1000 + i, gap: .3 }, at(x, mid)); }
    } else if (kind === 'gpu') {
      for (let r = 0; r < 2; r++) for (let i = 0; i < 22; i++) { const x = 60 + i * 128 + off, y = y0 + 30 + r * 80; p.pen([[x, y], [x + 78, y], [x + 78, y + 54], [x, y + 54], [x, y]], { w: 1.4, wob: .4, seed: 1010 + r * 30 + i, gap: .4 }, at(x, mid)); p.pen(ellipse(x + 39, y + 27, 12, 12, 10), { w: 1, wob: .3, seed: 1050 + r * 30 + i }, at(x, mid)); }
      // a transformer block diagram: boxes and attention arrows
      for (let b = 0; b < 5; b++) { const x = 500 + b * 700, y = y0 + 24; p.pen([[x, y], [x + 220, y], [x + 220, y + 90], [x, y + 90], [x, y]], { w: 2.6, wob: .5, seed: 1060 + b, smooth: false }, at(x, mid)); p.pen([[x + 40, y + 44], [x + 180, y + 44]], { w: 1.6, wob: .4, seed: 1070 + b }, at(x, mid)); if (b < 4) { p.pen([[x + 226, y + 44], [x + 470, y + 44]], { w: 2, wob: .4, seed: 1080 + b }, at(x, mid)); p.pen([[x + 440, y + 30], [x + 470, y + 44], [x + 440, y + 58]], { w: 2, wob: .4, seed: 1090 + b, smooth: false }, at(x, mid)); } }
    } else if (kind === 'eye') {
      for (let i = 0; i < 8; i++) { const x = 100 + i * 260 + off; p.pen(ellipse(x, mid, 90, 46, 18), { w: 1.6, wob: .7, seed: 1080 + i }, at(x, mid)); }
    }
    // a soft shadow in the gap under each strip
    p.wash([[-40, y1], [PW + 40, y1], [PW + 40, y1 + 18], [-40, y1 + 18]], hex('#5b5a78'), { a: .16, j: 4, edge: 0, seed: (y1 | 0) + 2 });
    // cut lines: crisp
    p.pen([[-40, y0], [PW + 40, y0]], { w: 2.4, wob: .25, over: 2, seed: (y0 | 0) + 9, gap: .05 }, 109.35);
    p.pen([[-40, y1], [PW + 40, y1]], { w: 2.4, wob: .25, over: 2, seed: (y1 | 0) + 9, gap: .05 }, 109.4);
  }
  // a hard shadow behind the whole stack, and a cut slash
  p.wash([[-60, 180], [PW + 60, 140], [PW + 60, 2060], [-60, 2080]], hex('#5b5a78'), { a: .06, j: 30, edge: 0, seed: 6900 });
  p.pen([[200, 300], [3400, 1900]], { w: 2.2, wob: .4, over: 8, seed: 6901, gap: .6 }, 109.6);
  // large cut-up motifs inside the strips: a mouth, a hand, a key, a closed eye
  {
    // mouth (strip 2)
    const mx = 1680, my = 560, mw = 520, mh = 150;
    const lip = [[mx - mw, my], [mx - mw * .55, my - mh * .8], [mx, my - mh], [mx + mw * .55, my - mh * .8], [mx + mw, my], [mx + mw * .55, my + mh * .7], [mx, my + mh * .9], [mx - mw * .55, my + mh * .7]];
    p.reserve(lip, .7, 4, 7100); p.wash(lip, hex('#c06a5a'), { a: .30, j: 6, layers: 2, edge: .3, seed: 7101 });
    p.pen([...lip, lip[0]], { w: 3.6, wob: .8, over: 6, seed: 7102 }, 110.1);
    p.pen([[mx - mw * .92, my], [mx + mw * .92, my]], { w: 3, wob: .6, seed: 7103 }, 110.2);
    for (let k = 0; k < 11; k++) { const x = mx - mw * .8 + k * mw * .16; p.pen([[x, my - 8], [x + 12, my + 44], [x + 26, my - 6]], { w: 2.2, wob: .5, seed: 7110 + k, smooth: false }, 110.25); }
    // hand (strip 4)
    const hx = 2600, hy = 1140;
    const palm = [[hx - 150, hy + 60], [hx - 170, hy - 20], [hx - 120, hy - 70], [hx - 40, hy - 80], [hx + 40, hy - 70], [hx + 90, hy - 20], [hx + 100, hy + 60], [hx + 40, hy + 100], [hx - 60, hy + 100]];
    p.reserve(palm, .8, 3, 7200); p.wash(palm, hex('#e0b48f'), { a: .38, j: 4, layers: 2, edge: .3, seed: 7201 });
    p.pen([...palm, palm[0]], { w: 3.2, wob: .9, over: 5, seed: 7202 }, 116.5);
    for (let f = 0; f < 4; f++) { const bx = hx - 100 + f * 60; p.pen([[bx, hy - 60], [bx + 4, hy - 165 - (f % 2) * 30], [bx + 26, hy - 170 - (f % 2) * 30]], { w: 2.6, wob: .7, seed: 7210 + f }, 116.6); }
    p.pen([[hx - 150, hy + 10], [hx - 230, hy - 40], [hx - 250, hy - 10]], { w: 2.6, wob: .7, seed: 7220 }, 116.6);
    // key (strip 6)
    const kx = 820, ky = 1700;
    p.pen(ellipse(kx, ky, 52, 52, 22).concat([[kx + 52, ky]]), { w: 3.4, wob: .6, seed: 7300 }, 120.1);
    p.pen([[kx + 52, ky], [kx + 240, ky]], { w: 3.4, wob: .5, seed: 7301 }, 120.15);
    p.pen([[kx + 200, ky], [kx + 200, ky + 44]], { w: 3, wob: .4, seed: 7302 }, 120.2);
    p.pen([[kx + 232, ky], [kx + 232, ky + 34]], { w: 3, wob: .4, seed: 7303 }, 120.2);
    // a closed eye (strip 7, before the big one)
    const ex = 3000, ey = 1930;
    p.pen(spline([[ex - 260, ey], [ex - 80, ey - 60], [ex + 80, ey - 60], [ex + 260, ey]], 6), { w: 3, wob: .8, seed: 7400 }, 124.2);
    for (let k = 0; k < 5; k++) p.pen([[ex - 150 + k * 76, ey - 10], [ex - 150 + k * 76, ey + 40]], { w: 2, wob: .4, seed: 7410 + k }, 124.3);
  }

  // the fence across the road band
  for (let k = 0; k < 9; k++) {
    const x = 300 + k * 280;
    p.pen([[x, 1258], [x + 4, 986]], { w: 4.6, wob: .4, seed: 1100 + k }, 117.0 + k * .06);
    p.pen([[x + 26, 1250], [x + 30, 992]], { w: 3.6, wob: .4, seed: 1110 + k }, 117.02 + k * .06);
    p.pen([[x - 4, 1122], [x + 32, 1118]], { w: 2.4, wob: .4, seed: 1120 + k }, 117.04 + k * .06);
    p.pen([[x, 1250], [x + 28, 1000]], { w: 1.8, wob: .5, seed: 1130 + k, gap: .3 }, 117.05 + k * .06);
    p.pen([[x + 28, 1250], [x, 1000]], { w: 1.8, wob: .5, seed: 1140 + k, gap: .3 }, 117.06 + k * .06);
  }
  // the loom (top right)
  {
    const x0 = 2920, x1 = 3760, y0 = 220, y1 = 900;
    p.pen([[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], { w: 5, wob: .6, seed: 1200, smooth: false }, 126.0);
    p.pen([[x0, y0 + 40], [x1, y0 + 40]], { w: 2.2, wob: .5, seed: 1201 }, 126.1);
    p.pen([[x0, y1 - 40], [x1, y1 - 40]], { w: 2.2, wob: .5, seed: 1202 }, 126.1);
    for (let k = 0; k < 18; k++) { const x = x0 + 30 + k * 44; p.pen([[x, y0 + 40], [x, y1 - 40]], { w: 1.2, wob: .5, seed: 1210 + k, gap: .4 }, 126.15 + k * .02); }
    // woven band
    for (let k = 0; k < 9; k++) { const y = y0 + 80 + k * 56; p.pen([[x0 + 30, y], [x0 + 700, y + 6]], { w: 3.4, wob: .7, seed: 1230 + k, gap: .3 }, 126.5 + k * .1); }
  }
  // recursive self-upgrade: a page drawing a page drawing a page
  for (let k = 0; k < 4; k++) {
    const s2 = Math.pow(.62, k), cx = 2080, cy = 1430, w = 520 * s2, h = 320 * s2, rot = .04 * k;
    const pts = [[-w, -h], [w, -h], [w, h], [-w, h]].map(([px, py]) => [cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot)]);
    p.reserve(pts, .8, 2, 1600 + k);
    p.wash(pts, hex('#efe7d4'), { a: .28, j: 3, layers: 2, edge: .2, seed: 1601 + k });
    p.pen([...pts, pts[0]], { w: 3.4 - k * .5, wob: .6, seed: 1602 + k, smooth: false }, 129.8 + k * .28);
    // a tiny eye inside each page
    const ex = cx, ey = cy, r = 130 * s2;
    p.pen(ellipse(ex, ey, r, r * .62, 20).concat([[ex + r, ey]]), { w: 2.4 - k * .3, wob: .5, seed: 1610 + k }, 129.95 + k * .28);
    p.wash(ellipse(ex, ey, r * .3, r * .3, 14), hex('#7c8b7b'), { a: .4, j: 1, edge: .2, seed: 1614 + k });
    p.wash(ellipse(ex, ey, r * .1, r * .1, 10), INK, { a: .7, j: .6, edge: 0, seed: 1618 + k });
  }
  const w = p.finish({ m: 70 });
  const src = [
    { x: 1900, y: 900, t: 109.0, v: 11000, R: 6000, mask: (x, y) => !(x > 2880 && y < 960) },
    { x: 3300, y: 600, t: 126.0, v: 1000, R: 1200 },
    { x: 1980, y: 1080, t: 132.0, v: 900, R: 1400 },
  ];
  return { ...w, ...makeArrival(w.W, w.H, src), sources: src };
}

// ---------------------------------------------------------------- P7 — the cover (140.23–156.7)
export function buildP7() {
  const p = makePage({ t0: 140.2, dur: 16.5, seed: 800 });
  const at = (x, y, k = 0) => p.arrivalAt(x, y) + k;
  // the closed book
  const q = [[760, 560], [3120, 620], [3080, 1720], [720, 1660]];
  p.wash(q, hex('#c9b183'), { a: .42, j: 6, layers: 2, edge: .25, seed: 1 });
  p.reserve(q, .35, 6, 2);
  // linen weave
  for (let i = 0; i < 22; i++) { const u = i / 22; p.pen([[lerp(760, 720, u) - 20, lerp(560, 1660, u) + 8], [lerp(3120, 3080, u) + 20, lerp(620, 1720, u) + 2]], { w: .7, wob: .8, over: 0, seed: 10 + i, gap: .85 }, 140.4); }
  for (let i = 0; i < 14; i++) { const u = i / 14; p.pen([[lerp(760, 3120, u), lerp(560, 620, u)], [lerp(720, 3080, u), lerp(1660, 1720, u)]], { w: .7, wob: .6, over: 0, seed: 80 + i, gap: .85 }, 140.45); }
  p.pen([...q, q[0]], { w: 3.4, wob: 1, over: 6, seed: 120, gap: .2 }, 140.3);
  // page block at the right
  for (let k = 0; k < 7; k++) p.pen([[3100 + k * 6, 640 + k * 6], [3060 + k * 6, 1700 + k * 6]], { w: 1.4, wob: .4, seed: 130 + k, gap: .5 }, 140.5);
  // elastic band
  p.pen([[2900, 640], [2860, 1700]], { w: 10, wob: .5, seed: 140 }, 140.6);
  p.pen([[2900, 640], [2860, 1700]], { w: 3, wob: .5, seed: 141 }, 140.6);
  // title plate (a slightly darker panel) + spine
  p.wash([[980, 760], [2780, 800], [2760, 1160], [960, 1120]], hex('#b99a6b'), { a: .12, j: 14, layers: 2, edge: 0, seed: 190 });
  p.pen([[820, 600], [790, 1680]], { w: 4, wob: 1, over: 4, seed: 193, gap: .3 }, 140.55);
  // a pencil on the cover
  p.wash([[2330, 1548], [2690, 1592], [2688, 1572], [2328, 1528]], hex('#c9a06a'), { a: .55, j: 2, edge: .25, seed: 150 });
  p.pen([[2330, 1538], [2690, 1582]], { w: 2, wob: .4, seed: 1501 }, 140.8);
  p.pen([[2330, 1550], [2690, 1594]], { w: 2, wob: .4, seed: 1502 }, 140.8);
  p.wash([[2280, 1530], [2330, 1540], [2330, 1560], [2280, 1552]], hex('#3a3230'), { a: .7, j: 1, edge: .2, seed: 1503 });
  p.pen([[2280, 1530], [2330, 1540]], { w: 1.4, wob: .3, seed: 1504 }, 140.8);
  p.pen([[2280, 1552], [2330, 1560]], { w: 1.4, wob: .3, seed: 1505 }, 140.8);
  p.wash([[2350, 1556], [2380, 1562], [2680, 1604], [2676, 1584]], hex('#d9a15e'), { a: .5, j: 2, edge: .2, seed: 152 });
  // label with the date (bottom left)
  p.reserve([[820, 1400], [1300, 1400], [1300, 1520], [820, 1520]], .8, 2, 160);
  p.pen([[820, 1400], [1300, 1400], [1300, 1520], [820, 1520], [820, 1400]], { w: 2, wob: .5, seed: 161, smooth: false }, 140.9);
  // shadow under the book
  p.wash([[700, 1680], [3100, 1740], [3260, 1860], [640, 1800]], hex('#5b5a78'), { a: .18, j: 26, layers: 2, edge: 0, seed: 170 });
  const w = p.finish({ m: 120 });
  const src = [{ x: 1950, y: 1100, t: 139.95, v: 11000, R: 6000 }];
  return { ...w, ...makeArrival(w.W, w.H, src), sources: src };
}
