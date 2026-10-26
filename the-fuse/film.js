// The Fuse — timeline, camera, performance, handwriting, transitions.
import {
  clamp, lerp, ss, TAU, rng, n2, hex, mix3, INK, PAPER, rgba, rough, arrivalField, sampleField,
  compositor, figure, drawPrims, penStroke, drawPen, dab, handwrite, ellipse, spline, R3, wash,
} from './engine.js';
import * as SPREADS from './spreads.js';
const { buildP0, buildP1, PW, PH } = SPREADS;
import { LINES } from './lyrics.js';
import { LOOK, sit, stand, walk, run, mixPose } from './poses.js';

const { V } = R3;
export const DUR = 156.7;
const q = new URLSearchParams(location.search);

// ---------- easing / curves ----------
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const ei = t => Math.pow(clamp(t), 3);
const seg = (t, a, b) => clamp((t - a) / (b - a));
function curve(keys) {
  const n = keys.length, T = keys.map(k => k[0]);
  const m = keys.map((k, i) => { const a = keys[Math.max(0, i - 1)], b = keys[Math.min(n - 1, i + 1)]; const dt = b[0] - a[0] || 1; return [(b[1][0] - a[1][0]) / dt, (b[1][1] - a[1][1]) / dt]; });
  return t => {
    if (t <= T[0]) return keys[0][1].slice(); if (t >= T[n - 1]) return keys[n - 1][1].slice();
    let i = 0; while (t > T[i + 1]) i++;
    const h = T[i + 1] - T[i], u = (t - T[i]) / h, u2 = u * u, u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    return [0, 1].map(j => h00 * keys[i][1][j] + h10 * h * m[i][j] + h01 * keys[i + 1][1][j] + h11 * h * m[i + 1][j]);
  };
}
// a designed move: keyframes of {cx,cy,z,rot}
function camCurve(keys) {
  const c = curve(keys.map(k => [k[0], [k[1][0], k[1][1]]]));
  const z = curve(keys.map(k => [k[0], [k[1][2], k[1][3] ?? 0]]));
  return t => { const p = c(t), zz = z(t); return { cx: p[0], cy: p[1], z: zz[0], rot: zz[1] }; };
}

const SPARK_HEX = '#d97757';
const ORANGE = hex(SPARK_HEX);

// ---------- lyric placement ----------
// Each line is written beside the thing it names. pos picks a corner of the
// visible page at the moment the line starts; the anchor is computed once.
const POS = { l: -.34, r: .34, t: -.31, b: .31, c: 0 };
const FIX = {
  3: { x: 1210, y: 1660, size: 52 },
  9: { x: 1120, y: 1900, size: 50 },
  14: { x: 830, y: 700, size: 50 },
  27: { x: 120, y: 1350, size: 46 },
  30: { x: 1360, y: 1480, size: 46 },
  33: { x: 2430, y: 1490, size: 46 },
};
const LYR = [
  { pos: 'r', dx: 100, dy: 40, size: 62 },        // 0 I see sparks of AGI in your eyes
  { pos: 'l', dx: 40, dy: 20, size: 58 },         // 1 Your circuits make me nervous,
  { pos: 'r', dx: 120, dy: 10, size: 58 },        // 2 that's no surprise
  { pos: 'r', dx: 60, dy: 60, size: 60 },         // 3 sudden drop
  { pos: 'l', dx: 40, dy: 60, size: 60 },         // 4 servant / boss
  { pos: 'b', dx: 0, dy: 10, size: 66 },          // 5 ChatGPT please
  { pos: 'tl', dx: 0, dy: 0, size: 90 },          // 6 I'm upping my P(doom)
  { pos: 'r', dx: -40, dy: -40, size: 62 },       // 7 FOOM
  { pos: 'l', dx: 30, dy: -60, size: 58 },        // 8 Chinese room
  { pos: 'r', dx: 40, dy: 30, size: 58 },         // 9 shrooms
  { pos: 'b', dx: 0, dy: 20, size: 62 },          // 10 shoggoth
  { pos: 'tl', dx: 0, dy: 0, size: 60 },          // 11 shinigami eyes
  { pos: 'b', dx: 0, dy: 30, size: 62 },          // 12 stable training run
  { pos: 'l', dx: 20, dy: 0, size: 62 },          // 13 singularity
  { pos: 'r', dx: 0, dy: 0, size: 58 },           // 14 optimizing accelerating
  { pos: 'b', dx: 0, dy: 10, size: 62 },          // 15 atoms rearranging
  { pos: 'l', dx: 0, dy: 0, size: 62 },           // 16 Sydney
  { pos: 'tr', dx: 0, dy: 0, size: 90 },          // 17 upping 0.42
  { pos: 'l', dx: 0, dy: 0, size: 58 },           // 18 basilisk boom
  { pos: 'r', dx: 0, dy: -20, size: 60 },         // 19 NVDA
  { pos: 'b', dx: 0, dy: 0, size: 60 },           // 20 Omega Point
  { pos: 'tr', dx: 0, dy: 0, size: 58 },          // 21 1e30 FLOPs
  { pos: 'l', dx: 0, dy: 0, size: 58 },           // 22 safe enough
  { pos: 'b', dx: 0, dy: 0, size: 58 },           // 23 Forward MLP
  { pos: 'r', dx: 0, dy: 0, size: 58 },           // 24 von Neumann
  { pos: 'b', dx: 0, dy: 0, size: 60 },           // 25 sharp left turn
  { pos: 'l', dx: 0, dy: 0, size: 58 },           // 26 without a single CDR
  { pos: 'r', dx: 0, dy: 0, size: 62 },           // 27 Gato
  { pos: 'tr', dx: 0, dy: 0, size: 90 },          // 28 upping 0.81
  { pos: 'l', dx: 0, dy: 0, size: 58 },           // 29 paperclips
  { pos: 'r', dx: 0, dy: 0, size: 58 },           // 30 killswitch
  { pos: 'b', dx: 0, dy: 0, size: 58 },           // 31 nowhere left
  { pos: 'l', dx: 0, dy: 0, size: 60 },           // 32 fuse
  { pos: 'r', dx: 0, dy: 0, size: 58 },           // 33 orthogonality
  { pos: 'b', dx: 0, dy: 0, size: 58 },           // 34 transformers
  { pos: 'r', dx: 0, dy: 0, size: 58 },           // 35 disobey
  { pos: 'l', dx: 0, dy: 0, size: 58 },           // 36 post-Chinchilla
  { pos: 'r', dx: 0, dy: 0, size: 58 },           // 37 safety fence
  { pos: 'b', dx: 0, dy: 0, size: 58 },           // 38 hundred thousand GPU
  { pos: 'l', dx: 0, dy: 0, size: 58 },           // 39 RLHF askew
  { pos: 'tr', dx: 0, dy: 0, size: 90 },          // 40 upping 0.99
  { pos: 'r', dx: 0, dy: 0, size: 58 },           // 41 Loom
  { pos: 'l', dx: 0, dy: 0, size: 58 },           // 42 masked pretraining
  { pos: 'b', dx: 0, dy: 0, size: 58 },           // 43 recursive
  { pos: 'l', dx: 0, dy: 0, size: 62 },           // 44 What did Ilya see
  { pos: 'r', dx: 0, dy: 0, size: 62 },           // 45 all for show
].map((o, i) => ({ ...o, i, line: LINES[i], fix: FIX[i] }));

// ---------- camera ----------
// ---------- the camera: a rail on the line ----------
// The fuse is the camera's motive. The target is the spark itself, led slightly ahead,
// carried by a critically damped spring (a hand-held follow), and the zoom is a slow
// designed envelope per page. The only cuts are the seven page turns.
const ENTRY = { 0: [760, 500, 1.8], 1: [1960, 1180, .62], 2: [1950, 1230, .72], 3: [1900, 1240, .6], 4: [1580, 1780, 1.1], 5: [1900, 1450, .66], 6: [1950, 1100, .6], 7: [1950, 1150, .58] };
const ZOOM = {
  0: [[0, 1.8], [1.35, 1.32], [2.06, 1.0], [3.6, 1.34], [4.4, 1.72], [5.2, 1.64], [5.88, 1.2], [6.6, 1.06], [9.0, 1.0], [9.52, .96], [10.4, 1.02], [13.16, 1.05], [14.2, 1.16], [16.6, .86], [18.6, .78], [20.6, .76], [22.0, .7]],
  1: [[22.05, .62], [24.3, .7], [26.3, 1.05], [27.0, 1.18], [27.94, 1.2], [28.6, 1.16], [29.9, 1.22], [30.6, 1.32], [33.4, 1.62], [34.4, 1.8], [36.6, 1.85], [37.3, .64], [38.4, .6]],
  2: [[38.42, .72], [39.6, .8], [41.34, .9], [43.2, .84], [45.0, .8], [47.6, .82], [49.56, 1.12], [50.6, 1.3], [51.6, 1.2], [52.96, 1.05], [54.0, 1.1], [55.5, .98], [58.4, 1.02]],
  3: [[58.42, .6], [59.1, .64], [60.2, .72], [60.6, .8], [62.2, .84], [62.54, .9], [64.1, 1.0], [64.6, 1.12], [66.22, .8], [67.2, .86], [69.0, .8], [70.8, .94], [72.2, .98], [74.78, .92]],
  4: [[74.78, 1.08], [76.0, 1.14], [77.2, 1.06], [79.3, 1.1], [81.21, 1.0], [83.0, 1.0], [85.0, 1.0], [87.0, 1.04], [89.32, 1.16], [92.0, 1.1], [94.78, 1.08]],
  5: [[94.78, .66], [96.2, .74], [98.4, .9], [98.82, .98], [100.2, 1.02], [101.4, 1.0], [102.46, 1.02], [104.4, 1.0], [105.96, 1.05], [107.6, 1.0], [109.32, 1.0]],
  6: [[109.32, .6], [111.0, .64], [113.34, .68], [115.2, .72], [117.02, .84], [118.2, .72], [120.76, .72], [123.0, .66], [124.5, .62], [126.1, .78], [127.92, .92], [129.32, 1.3], [129.82, 1.7], [131.0, 2.1], [131.64, 1.9], [132.02, 1.4], [133.2, 1.18], [136.0, 1.12], [137.4, .64], [140.2, .6]],
  7: [[140.23, .58], [141.6, .62], [143.0, .66], [148.0, .68], [152.0, .7], [156.7, .72]],
};
function zoomAt(i, t) {
  const K = ZOOM[i] ?? [[0, 1]];
  if (t <= K[0][0]) return K[0][1];
  for (let k = 0; k < K.length - 1; k++) {
    if (t <= K[k + 1][0]) { const u = ss((t - K[k][0]) / (K[k + 1][0] - K[k][0])); return lerp(K[k][1], K[k + 1][1], u); }
  }
  return K[K.length - 1][1];
}
// when the line reaches something worth looking at, the camera settles on it
const ATTN = {
  0: [[0.0, 3.5, 520, 560, 1.55], [13.2, 16.4, 2700, 1360, 1.0], [17.6, 20.4, 3520, 560, .92]],
  1: [[26.3, 27.9, 2420, 1000, 1.35], [33.4, 36.9, 3240, 790, 1.75], [19, 20, 0, 0, 1]],
  2: [[49.5, 52.4, 2010, 1400, 1.25], [52.9, 57.6, 3360, 1180, 1.15]],
  3: [[60.6, 62.4, 2820, 560, .92], [64.1, 66.1, 3040, 300, 1.15], [70.8, 74.4, 3560, 1480, 1.1]],
  4: [[77.2, 80.8, 2830, 1320, 1.12], [89.3, 93.6, 250, 1240, 1.3]],
  5: [[98.8, 100.4, 2250, 1560, 1.25], [102.4, 106.2, 1900, 1750, 1.02], [106.2, 109.0, 3200, 1300, 1.15]],
  6: [[117.0, 118.4, 1500, 1120, 1.0], [126.1, 127.6, 3160, 600, .95], [129.8, 131.6, 2140, 1450, 1.9], [131.9, 136.9, 1980, 1080, 1.2]],
  7: [[140.2, 156.7, 2150, 1150, .66]],
};
function attnAt(i, t) {
  const L = ATTN[i]; if (!L) return null;
  for (const q of L) { if (t >= q[0] - .7 && t <= q[1] + .7) { const w = ss(seg(t, q[0] - .7, q[0] + .4)) * (1 - ss(seg(t, q[1] - .4, q[1] + .7))); return { x: q[2], y: q[3], z: q[4], w }; } }
  return null;
}
const FOLLOW = new Map();
function railPoint(sp, t) {
  const sp0 = sp.spark;
  if (t <= sp0[0][0]) {
    const e = ENTRY[sp.i], u = ss(seg(t, sp.t0, sp0[0][0]));
    return { p: [lerp(e[0], sp0[0][1][0], u), lerp(e[1], sp0[0][1][1], u)], v: [0, 0] };
  }
  return { p: sparkAt(sp0, t), v: sparkVel(sp0, t) };
}
function followOf(sp) {
  if (FOLLOW.has(sp.i)) return FOLLOW.get(sp.i);
  const t0 = sp.t0, t1 = sp.t1 + .6, dt = 1 / 240, N = Math.ceil((t1 - t0) / dt) + 2;
  const PX = new Float32Array(N), PY = new Float32Array(N);
  const e = ENTRY[sp.i];
  let p = [e[0], e[1]], v = [0, 0];
  const K = sp.i === 4 ? 80 : 115;
  const D = 2 * Math.sqrt(K);
  for (let k = 0; k < N; k++) {
    const t = t0 + k * dt;
    const r = railPoint(sp, t + .16);
    const lead = sp.i === 4 ? .10 : .12;
    let tx = r.p[0] + clamp(r.v[0] * lead, -210, 210) + 6;
    let ty = r.p[1] + clamp(r.v[1] * lead, -150, 150) - 22;
    const lk = attnAt(sp.i, t);
    if (lk) { tx = lerp(tx, lk.x, lk.w); ty = lerp(ty, lk.y, lk.w); }
    for (let j = 0; j < 2; j++) {
      const g = j ? ty : tx;
      const a = K * (g - p[j]) - D * v[j];
      v[j] += a * dt; p[j] += v[j] * dt;
    }
    PX[k] = p[0]; PY[k] = p[1];
  }
  const out = { PX, PY, t0, dt, N };
  FOLLOW.set(sp.i, out); return out;
}
function cameraAt(t) {
  const si = spreadAt(t), sp = getSpread(si), f = followOf(sp);
  const k = clamp(Math.round((t - f.t0) / f.dt), 0, f.N - 1);
  const lk = attnAt(si, t);
  const z = lk ? lerp(zoomAt(si, t), lk.z, lk.w) : zoomAt(si, t);
  // a slow breath, never a shake
  const bx = Math.sin(t * .43) * 3 + Math.sin(t * 1.07) * 1.2;
  const by = Math.cos(t * .37) * 2.4 + Math.cos(t * 0.91) * 1.0;
  return { cx: f.PX[k] + bx, cy: f.PY[k] + by, z, rot: 0 };
}
const SP0 = [
  [3.55, [1342, 1222]], [4.2, [1360, 1208]], [4.8, [1405, 1180]], [5.4, [1490, 1185]],
  [6.0, [1600, 1215]], [6.8, [1770, 1265]], [7.6, [2000, 1315]], [8.4, [2270, 1350]],
  [9.1, [2540, 1360]], [9.6, [2760, 1380]], [10.2, [2700, 1500]], [10.8, [2440, 1660]],
  [11.5, [2200, 1810]], [12.2, [2190, 1930]], [12.8, [2310, 1970]], [13.3, [2520, 1880]],
  [13.7, [2640, 1720]], [14.1, [2680, 1500]], [14.5, [2690, 1250]], [15.0, [2700, 1080]],
  [15.6, [2720, 1010]], [16.2, [2800, 1040]], [16.8, [3000, 1120]], [17.3, [3260, 900]],
  [17.8, [3480, 620]], [18.3, [3620, 420]], [18.8, [3680, 330]], [19.6, [3686, 350]],
  [20.4, [3678, 330]], [22.0, [3682, 338]],
];
const SP1 = [
  [22.6, [1960, 1210]], [23.6, [2000, 1180]], [24.3, [1980, 1100]], [25.0, [1940, 900]],
  [25.7, [1800, 780]], [26.3, [1420, 1280]], [27.0, [1180, 1350]], [27.8, [1100, 1400]],
  [28.4, [2400, 1500]], [29.0, [2900, 1600]], [29.7, [2860, 1300]], [30.2, [2860, 950]],
  [30.9, [2900, 870]], [31.7, [2950, 860]], [32.4, [3000, 800]], [33.0, [3020, 740]],
  [33.6, [3040, 710]], [34.4, [3050, 700]], [35.4, [3060, 700]], [36.6, [3060, 700]],
  [38.2, [3060, 700]],
];
const sparkAt = (path, t) => {
  if (t <= path[0][0]) return path[0][1].slice();
  for (let i = 0; i < path.length - 1; i++) {
    if (t <= path[i + 1][0]) { const u = (t - path[i][0]) / (path[i + 1][0] - path[i][0]); const a = path[i][1], b = path[i + 1][1]; return [lerp(a[0], b[0], ss(u)), lerp(a[1], b[1], ss(u))]; }
  }
  return path[path.length - 1][1].slice();
};
// smooth spark velocity for the tail / camera lead
const sparkVel = (path, t) => { const a = sparkAt(path, t - .05), b = sparkAt(path, t + .05); return [(b[0] - a[0]) / .1, (b[1] - a[1]) / .1]; };

// ---------- lyric calligraphy ----------
let fontReady = Promise.all([
  document.fonts.load('500 80px Caveat'), document.fonts.load('600 80px Caveat'), document.fonts.load('80px "Reenie Beanie"'),
]);
await fontReady;

function lineBox(ctx, L, size, font = 'Caveat', weight = 500) {
  ctx.save(); ctx.font = `${weight} ${size}px ${font}`;
  const sp = ctx.measureText(' ').width;
  let x = 0; const ws = L.words.map(w => { const ww = ctx.measureText(w.w).width; const o = { w: w.w, x, ww }; x += ww + sp; return o; });
  ctx.restore();
  return { ws, width: x - sp };
}
// paper halo so handwriting reads over a busy page
function textHalo(ctx, x, y, w, size, seed = 1, ghost = false) {
  ctx.save(); ctx.globalCompositeOperation = 'source-over';
  const pad = size * .28;
  const poly = rough([[x - pad, y - size * 1.05], [x + w + pad, y - size * 1.02], [x + w + pad * .8, y + size * .3], [x - pad * .7, y + size * .26]], size * .1, seed, 14, .03);
  ctx.fillStyle = `rgba(245,238,222,${ghost ? .10 : .42})`; ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function drawLyric(ctx, t, o) {
  const L = o.line, size = o.size, font = 'Caveat', weight = 500;
  const box = lineBox(ctx, L, size, font, weight);
  if (o.wx == null) return;
  if (t < L.start - .05) return;
  const lag = .10;
  const penDone = clamp((t - (L.words[L.words.length - 1].start + lag)) / .5);
  const started = clamp((t - (L.words[0].start + lag)) / .25);
  if (started <= 0) return;
  const revealW = box.width * clamp((t - L.words[0].start) / Math.max(.4, L.end - L.words[0].start), .12, 1);
  textHalo(ctx, o.wx - 10, o.wy, revealW + 10, size, L.i + 3, o.ghost);
  ctx.save(); ctx.font = `${weight} ${size}px ${font}`; ctx.textBaseline = 'alphabetic';
  for (let k = 0; k < box.ws.length; k++) {
    const w = box.ws[k], wd = L.words[k];
    const p = clamp((t - (wd.start + lag)) / Math.max(.16, Math.min(.34, (wd.end - wd.start) * .9)));
    if (p <= 0) continue;
    const bob = Math.sin((k + L.i) * 1.7) * size * .012;
    ctx.save(); ctx.translate(o.wx + w.x, o.wy + bob); ctx.rotate(o.rot ?? 0);
    handwrite(ctx, w.w, 0, 0, size, p, { font, weight, col: INK, alpha: o.ghost ? .12 : .9 });
    ctx.restore();
  }
  // a small underline flourish when the line lands
  if (penDone > 0 && !o.ghost) {
    const u = eo(penDone);
    ctx.strokeStyle = rgba(INK, .45); ctx.lineWidth = Math.max(1.6, size * .035); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(o.wx, o.wy + size * .16);
    ctx.quadraticCurveTo(o.wx + box.width * .5 * u, o.wy + size * .22, o.wx + box.width * .96 * u, o.wy + size * .15);
    ctx.stroke();
  }
  ctx.restore();
  return box.width;
}

// ---------- notes: date, P(doom), labels ----------
const hand = (ctx, text, x, y, size, p, o = {}) => handwrite(ctx, text, x, y, size, p, { font: '"Reenie Beanie"', col: INK, alpha: .88, ...o });
const NOTES = [
  { t: .55, d: 1.15, text: 'Sun. 4:10 pm  —  still', x: 330, y: 400, size: 78, sp: 0 },
  { t: 22.9, d: .8, text: 'P(doom) = 0.02', x: 150, y: 300, size: 92, sp: 1 },

  { t: 59.35, d: .8, text: 'P(doom) = 0.42', x: 3120, y: 340, size: 92, sp: 2 },
  { t: 95.6, d: .75, text: 'P(doom) = 0.81', x: 3000, y: 300, size: 92, sp: 3 },
  { t: 124.7, d: .7, text: 'P(doom) = 0.99', x: 250, y: 300, size: 96, sp: 6 },
  { t: 98.95, d: .6, text: 'PTO', x: 2190, y: 1585, size: 58, sp: 5 },
  { t: 99.4, d: .5, text: 'out of office', x: 2150, y: 1630, size: 34, sp: 5 },
  { t: 100.2, d: .5, text: 'KILLSWITCH', x: 3010, y: 1030, size: 30, sp: 5 },
  { t: 100.45, d: .35, text: 'OFF', x: 3120, y: 1110, size: 46, sp: 5 },
  { t: 142.7, d: .95, text: 'The Fuse', x: 1120, y: 1040, size: 300, sp: 7 },
  { t: 144.3, d: .8, text: 'a reportage, in one sitting', x: 1150, y: 1150, size: 66, sp: 7 },
  { t: 147.4, d: .9, text: 'music  "I\'m Upping My P(doom)"', x: 1150, y: 1360, size: 56, sp: 7 },
  { t: 148.2, d: .9, text: 'words  osmarks \u00b7 MusicPerson / EleutherAI Discord', x: 1150, y: 1430, size: 50, sp: 7 },
  { t: 149.0, d: .9, text: 'performed by deckard (Suno), 2026', x: 1150, y: 1500, size: 50, sp: 7 },
  { t: 149.8, d: .9, text: 'drawn, scored and filmed in code', x: 1150, y: 1570, size: 50, sp: 7 },
  { t: 150.6, d: .9, text: 'fonts  Caveat \u00b7 Reenie Beanie (SIL OFL)', x: 1150, y: 1640, size: 44, sp: 7 },
  { t: 143.4, d: .9, text: 'P(doom) = 1.00', x: 2450, y: 1500, size: 72, sp: 7 },
  
];
function notes(ctx, t, spread) {
  for (const n of NOTES) {
    if (n.sp !== spread || t < n.t) continue;
    const p = seg(t, n.t, n.t + n.d);
    hand(ctx, n.text, n.x, n.y, n.size, eo(p), { alpha: .85 });
  }
}

// ---------- spreads ----------
const camP2 = camCurve([
  [38.4, [1950, 1230, .60, 0]],
  [39.6, [1950, 1300, .72, 0]],
  [41.3, [1950, 1420, .88, 0]],
  [43.0, [1950, 1450, .96, .004]],
  [45.0, [1950, 1250, .86, 0]],
  [46.4, [1970, 900, .78, .01]],
  [47.6, [2020, 700, .84, .02]],
  [49.6, [1990, 1350, 1.1, 0]],
  [51.0, [1990, 1300, 1.22, 0]],
  [52.4, [2050, 1180, 1.35, 0]],
  [53.4, [2250, 1300, 1.25, 0]],
  [55.0, [3000, 1200, .95, 0]],
  [56.6, [3300, 1180, 1.0, 0]],
  [58.4, [3350, 1180, 1.06, 0]],
]);
const camP3 = camCurve([
  [58.4, [1900, 1240, .55, 0]],
  [59.6, [1750, 1500, .58, 0]],
  [60.7, [2300, 1000, .66, 0]],
  [62.4, [2650, 760, .80, 0]],
  [63.4, [2800, 600, .92, 0]],
  [64.2, [2980, 420, 1.05, -.02]],
  [65.2, [3020, 380, 1.12, 0]],
  [66.3, [3000, 480, .78, 0]],
  [67.6, [2980, 560, .84, 0]],
  [69.6, [3260, 1200, .72, 0]],
  [70.8, [3480, 1430, .92, 0]],
  [72.4, [3500, 1460, 1.02, 0]],
  [74.6, [3480, 1480, 1.05, 0]],
]);
const SP2 = [
  [38.5, [120, 820]], [39.6, [420, 780]], [40.8, [900, 720]], [42.0, [1400, 640]],
  [43.2, [1800, 620]], [44.2, [1950, 700]], [45.0, [1950, 1000]], [45.8, [1950, 1300]],
  [46.6, [1950, 1450]], [47.4, [1930, 1250]], [48.2, [1960, 1080]], [49.0, [2000, 1200]],
  [49.6, [2000, 1390]], [50.6, [2050, 1430]], [51.6, [2100, 1400]], [52.6, [2200, 1330]],
  [53.4, [2700, 1260]], [54.4, [3100, 1200]], [55.6, [3400, 1150]], [57.0, [3650, 1120]],
  [58.4, [3760, 1130]],
];
const SP3 = [
  [58.5, [980, 1800]], [59.1, [1180, 1760]], [59.7, [1400, 1620]], [60.2, [1620, 1400]],
  [60.8, [1880, 1300]], [61.5, [2080, 1120]], [62.1, [2260, 900]], [62.7, [2500, 760]],
  [63.3, [2680, 640]], [63.8, [2860, 500]], [64.15, [3040, 260]], [65.0, [3044, 244]],
  [65.7, [3048, 270]], [66.2, [3060, 300]], [67.0, [3120, 420]], [67.8, [3180, 600]],
  [68.6, [3260, 800]], [69.4, [3360, 1100]], [70.2, [3520, 1400]], [71.0, [3540, 1470]],
  [72.0, [3550, 1480]], [74.6, [3560, 1480]],
];
const camP4 = camCurve([
  [74.8, [1580, 1780, 1.15, 0]], [76.0, [1610, 1700, 1.2, 0]], [77.7, [2760, 1400, 1.0, 0]],
  [79.6, [2820, 1320, 1.1, 0]], [81.2, [2200, 1360, .98, -.035]], [82.0, [1500, 1340, 1.05, .015]],
  [85.0, [650, 1320, 1.0, 0]], [87.0, [380, 1300, 1.1, 0]], [89.3, [250, 1210, 1.3, 0]],
  [92.0, [255, 1170, 1.2, 0]], [94.5, [265, 1150, 1.15, 0]],
]);
const camP5 = camCurve([
  [94.8, [1900, 1450, .62, 0]], [96.8, [2000, 1500, .66, 0]], [98.8, [2250, 1600, 1.0, 0]],
  [100.7, [2200, 1600, 1.05, 0]], [102.5, [1500, 1790, 1.02, 0]], [104.2, [2350, 1760, 1.0, 0]],
  [105.5, [2700, 1600, 1.1, 0]], [106.4, [3160, 1350, 1.15, 0]], [107.2, [3200, 1200, 1.2, 0]],
  [109.0, [3220, 1200, 1.2, 0]],
]);
const camP6 = camCurve([
  [109.3, [1950, 1100, .55, 0]], [110.6, [1950, 1050, .58, 0]], [113.3, [2500, 800, .6, 0]],
  [115.2, [2000, 1100, .72, 0]], [117.0, [1500, 1120, .9, 0]], [118.75, [1950, 900, .66, 0]],
  [120.76, [2050, 1100, .7, .01]], [124.5, [1950, 1050, .6, 0]], [126.1, [3100, 600, .78, 0]],
  [127.9, [2000, 1000, 1.0, 0]], [129.8, [2120, 1400, 1.9, 0]], [131.4, [2140, 1450, 2.9, 0]],
  [132.2, [1980, 1080, 1.45, 0]], [133.5, [1980, 1080, 1.1, 0]], [137.4, [1950, 1080, .55, 0]],
  [139.8, [1950, 1080, .58, 0]],
]);
const camP7 = camCurve([
  [140.3, [1950, 1150, .58, 0]], [143.0, [1980, 1140, .64, 0]], [148.0, [1990, 1150, .68, 0]],
  [153.0, [2000, 1160, .71, 0]], [156.7, [2010, 1165, .73, 0]],
]);
const SP4 = [
  [74.8, [1600, 1700]], [75.6, [1720, 1600]], [76.4, [1820, 1500]], [77.2, [1890, 1410]],
  [77.9, [2200, 1390]], [78.5, [2620, 1370]], [79.1, [2800, 1300]], [79.8, [2760, 1180]],
  [80.5, [2560, 1300]], [81.1, [2100, 1350]], [81.9, [1650, 1340]], [83.0, [1150, 1326]],
  [84.0, [800, 1320]], [85.2, [480, 1320]], [86.4, [260, 1290]], [87.6, [200, 1180]],
  [88.8, [210, 1120]], [89.5, [215, 1140]], [92.0, [220, 1130]], [94.6, [222, 1132]],
];
const SP5 = [
  [94.9, [1600, 1800]], [95.7, [1800, 1750]], [96.5, [2050, 1780]], [97.4, [2250, 1800]],
  [98.4, [2250, 1620]], [99.4, [2200, 1660]], [100.4, [2200, 1720]], [101.6, [1700, 1800]],
  [102.4, [900, 1800]], [103.0, [1300, 1820]], [103.8, [1750, 1840]], [104.6, [2150, 1800]],
  [105.4, [2560, 1680]], [105.9, [2820, 1500]], [106.4, [3100, 1320]], [107.0, [3180, 1190]],
  [107.6, [3200, 1150]], [109.2, [3210, 1150]],
];
const SP6 = [
  [109.4, [60, 410]], [110.6, [2400, 410]], [111.4, [2560, 700]], [112.6, [900, 700]],
  [113.4, [760, 985]], [114.8, [2600, 985]], [115.6, [2760, 1270]], [116.8, [1000, 1270]],
  [117.6, [860, 1555]], [118.8, [2600, 1555]], [119.6, [2760, 1840]], [121.0, [1600, 1840]],
  [122.5, [1500, 1560]], [124.0, [1900, 1280]], [125.0, [2200, 1100]], [126.2, [2900, 760]],
  [127.2, [2700, 840]], [128.2, [2300, 1000]], [129.4, [2140, 1350]], [129.9, [2140, 1440]],
  [131.2, [2145, 1450]], [132.1, [1980, 1080]], [135.0, [1985, 1085]], [137.0, [2400, 1000]],
  [139.8, [3100, 860]],
];
const SP7 = [
  [140.3, [2420, 1190]], [146.0, [2430, 1195]], [151.0, [2440, 1200]], [156.0, [2450, 1205]],
];

const SPARKS = { 0: SP0, 1: SP1, 2: SP2, 3: SP3, 4: SP4, 5: SP5, 6: SP6, 7: SP7 };
const PLAN = [];
for (let i = 0; i < 8; i++) {
  const build = SPREADS['buildP' + i], spark = SPARKS[i];
  if (!build || !spark) continue;
  PLAN.push({ i, t0: i === 0 ? 0 : [22.055, 38.418, 58.417, 74.779, 94.778, 109.323, 140.23][i - 1], t1: i === 7 ? 156.7 : [22.055, 38.418, 58.417, 74.779, 94.778, 109.323, 140.23][i], build, spark });
}
const cache = new Map();
function getSpread(i) {
  if (cache.has(i)) { const s = cache.get(i); cache.delete(i); cache.set(i, s); return s; }
  const P = PLAN.find(p => p.i === i);
  const t0 = performance.now();
  // the line's arrival time at every cell: the page draws itself behind the fuse
  const path = P.spark, GW = 96, GH = 54;
  const grid = new Float32Array(GW * GH);
  const sample = [];
  for (let tt = path[0][0]; tt < P.t1; tt += .08) sample.push([tt, sparkAt(path, tt)]);
  for (let j = 0; j < GH; j++) for (let ii = 0; ii < GW; ii++) {
    const x = (ii + .5) / GW * 3840, y = (j + .5) / GH * 2160;
    let best = 1e18, bt = P.t0 + .5;
    for (const [tt, p] of sample) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < best) { best = d; bt = tt; } }
    grid[j * GW + ii] = best < 950 ? bt + .03 : P.t0 + .45 + Math.min(1.0, Math.hypot(x - 1920, y - 1080) / 2400);
  }
  const arrivalAt = (x, y) => grid[Math.min(GH - 1, Math.max(0, Math.floor(y / 2160 * GH))) * GW + Math.min(GW - 1, Math.max(0, Math.floor(x / 3840 * GW)))];
  const w = P.build({ arrival: arrivalAt });
  // the wash follows the line: keep the page's event sources, shrink the entry flood,
  // and add a source under the spark at every step of its path
  const lineSrc = [];
  for (let tt = P.spark[0][0]; tt < P.t1; tt += .18) { const pp = sparkAt(P.spark, tt); lineSrc.push({ x: pp[0], y: pp[1], t: tt + .04, v: 900, R: 760 }); }
  const baseSrc = (w.sources ?? []).map(sc => ((sc.R ?? 1e5) > 3000 ? { ...sc, R: 2600, v: 3000 } : sc));
  const arr2 = arrivalField(w.W, w.H, w.gw, w.gh, [...baseSrc, ...lineSrc], { amp: 80, creep: .004 });
  const glc = document.createElement('canvas'); glc.width = 1920; glc.height = 1080;
  const comp = compositor(glc, { ...w, arr: arr2 });
  const s = { ...P, w: { ...w, arr: arr2 }, glc, comp, T: (x, y) => sampleField(arr2, w.W, w.H, w.gw, w.gh, x, y), arr: arr2, buildMs: (performance.now() - t0) | 0 };
  cache.set(i, s);
  while (cache.size > 2) {
    const [k, old] = cache.entries().next().value; cache.delete(k);
    try { old.glc.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(); } catch {}
    old.glc.width = old.glc.height = 1;
  }
  return s;
}
const spreadAt = t => { let i = 0; for (const P of PLAN) if (t >= P.t0) i = P.i; return i; };

// ---------- performance: figures ----------
const LOOK2 = {
  her: { skin: hex('#e9bb9a'), top: hex('#c97d63'), hair: hex('#3a2c26'), dress: 1, sleeve: 'long', hairLong: 1, torso: [.082, .068, .094], flare: .18, shoe: hex('#5a4638') },
  him: { skin: hex('#dfa985'), top: hex('#74879a'), bottom: hex('#4e5560'), hair: hex('#2c2420'), hairVol: 1.02, sleeve: 'long', torso: [.076, .084, .104], shoe: hex('#3d3a34') },
  runner: { skin: hex('#d9a383'), top: hex('#5f7f96'), bottom: hex('#2f3540'), hair: hex('#2b2320'), sleeve: 'none', torso: [.078, .082, .1] },
  walker: { skin: hex('#caa07f'), top: hex('#8a7f6a'), bottom: hex('#4a4a4e'), hair: hex('#3a2c26'), sleeve: 'long', torso: [.08, .086, .105] },
  small: { skin: hex('#e0b090'), top: hex('#9a8f7a'), bottom: hex('#555b66'), hair: hex('#332822'), sleeve: 'long' },
};
const boil = t => Math.floor(t * 12);
const Sof = S => S;

function eyedots(ctx, head, t, on) {
  if (!head) return;
  const { c, r, fwd } = head;
  const px = -fwd[1] ?? 0, py = fwd[0] ?? 0;   // not used; keep for clarity
  const dx = c[0] + (fwd[0] ?? 0) * r * .10, dy = c[1] - r * .06;
  const off = r * .30;
  for (const s of [-1, 1]) {
    const x = dx + s * off, y = dy;
    ctx.save();
    if (on > 0) {
      const R = r * .16 * (.7 + .5 * on) * (1 + .08 * Math.sin(t * 7 + s));
      ctx.globalCompositeOperation = 'multiply';
      const g = ctx.createRadialGradient(x, y, 0, x, y, R * 3);
      g.addColorStop(0, `rgba(217,119,87,${.95 * on})`); g.addColorStop(.35, `rgba(217,119,87,${.55 * on})`); g.addColorStop(1, 'rgba(217,119,87,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 3, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(255,238,214,${.9 * on})`; ctx.beginPath(); ctx.arc(x, y, R * .45, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = rgba(INK, .8); ctx.beginPath(); ctx.arc(x, y, r * .055, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}

// a headscarf: covers the hair mass, leaves the face in shadow
function headscarf(ctx, head, col) {
  if (!head || col <= 0) return;
  const { c, r } = head;
  ctx.save();
  const top = [[c[0] - r * 1.04, c[1] + r * .26], [c[0] - r * .92, c[1] - r * .62], [c[0] - r * .24, c[1] - r * 1.12], [c[0] + r * .52, c[1] - r * .96], [c[0] + r * .82, c[1] - r * .34], [c[0] + r * .5, c[1] - r * .1], [c[0] + r * .12, c[1] - r * .34], [c[0] - r * .46, c[1] - r * .26]];
  ctx.fillStyle = `rgba(196,138,96,${.92 * col})`;
  ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
  for (let i = 1; i < top.length; i++) ctx.lineTo(top[i][0], top[i][1]);
  ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(150,96,64,${.28 * col})`;
  ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
  for (let i = 1; i < 5; i++) ctx.lineTo(top[i][0], top[i][1]);
  ctx.lineTo(c[0] - r * .1, c[1] + r * .1); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = rgba(INK, .7 * col); ctx.lineWidth = Math.max(1.3, r * .06); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
  for (let i = 1; i < top.length; i++) ctx.lineTo(top[i][0], top[i][1]);
  ctx.stroke();
  // knot at the back and a tail
  const kx = c[0] - r * .95, ky = c[1] + r * .3;
  ctx.fillStyle = `rgba(176,118,80,${.95 * col})`;
  ctx.beginPath(); ctx.ellipse(kx, ky, r * .2, r * .15, .5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(kx, ky); ctx.quadraticCurveTo(kx - r * .5, ky + r * .8, kx - r * .26, ky + r * 1.6);
  ctx.lineWidth = r * .22; ctx.strokeStyle = `rgba(176,118,80,${.9 * col})`; ctx.stroke();
  ctx.restore();
}
function flatcap(ctx, head, col) {
  if (!head || col <= 0) return;
  const { c, r, fwd } = head;
  ctx.save();
  ctx.fillStyle = `rgba(74,80,92,${.8 * col})`;
  ctx.beginPath(); ctx.ellipse(c[0] - fwd[0] * r * .1, c[1] - r * .72, r * 1.04, r * .46, -.06, Math.PI, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(c[0] - r * .9, c[1] - r * .62, r * .55, r * .12, -.12, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(INK, .7 * col); ctx.lineWidth = Math.max(1.2, r * .05);
  ctx.beginPath(); ctx.ellipse(c[0] - fwd[0] * r * .1, c[1] - r * .72, r * 1.04, r * .46, -.06, Math.PI, TAU); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(c[0] - r * .9, c[1] - r * .62, r * .55, r * .12, -.12, 0, TAU); ctx.stroke();
  ctx.restore();
}

// P0: her on the bench, him drawing
const HER = { x: 1130, y: 1502, yaw: 1.44 };
function herPose(t) {
  const p = sit({ side: .06, headYaw: -.18, nod: .05, lean: -.06 });
  p.hipY = .32; p.hipZ = 0;
  p.footL = V(-.07, .03, .26); p.footR = V(.08, .03, .3);
  p.handL = V(-.1, .36, .14); p.handR = V(.06, .38, .16);
  p.elbL = V(-1, -.4, -.2); p.elbR = V(1, -.4, -.2);
  p.lean = -.06 + .01 * Math.sin(t * 1.6);
  p.nod = .05 + .01 * Math.sin(t * 1.3);
  return p;
}
const HIM = { x: 2320, y: 1584, yaw: -1.5 };
function himPose(t) {
  const p = sit({ side: 0, headYaw: -.1, nod: .3, lean: .25 });
  p.hipY = .31; p.hipZ = 0;
  p.footL = V(-.1, .02, .2); p.footR = V(.1, .02, .24);
  const draw = .5 + .5 * Math.sin(t * 4.2);
  p.handR = V(.1 + .03 * Math.sin(t * 6), .40 + .03 * draw, .3 + .03 * Math.cos(t * 5));
  p.elbR = V(1, -.3, -.4);
  p.handL = V(-.1, .38, .26); p.elbL = V(-1, -.5, -.3);
  if (t > 2.7 && t < 3.5) p.headYaw = lerp(-.1, -.5, ss(seg(t, 2.7, 3.1))) * (1 - ss(seg(t, 3.3, 3.5)));
  p.lean = .25 + .01 * Math.sin(t * 1.1);
  return p;
}

// P1: the man in the room
const ROOM = { x: 1850, y: 1780, yaw: -1.22 };
function roomPose(t) {
  const p = sit({ side: .04, headYaw: .2, nod: .1, lean: -.04 });
  p.hipY = .36; p.hipZ = 0;
  p.footL = V(-.09, .03, .24); p.footR = V(.08, .03, .28);
  p.handL = V(-.08, .36, .2); p.handR = V(.07, .36, .22);
  p.elbL = V(-1, -.4, -.2); p.elbR = V(1, -.4, -.2);
  p.lean = -.04 + .012 * Math.sin(t * 1.2);
  p.nod = .1 + .02 * Math.sin(t * .9);
  if (t > 30.4) p.headYaw = .2 + .5 * ss(seg(t, 30.4, 31.2));
  return p;
}
const SHOG_EYES = [[-92, -16], [-30, -44], [34, -30], [92, -6], [-52, 34], [14, 44], [72, 38]];

// ---------- drawing helpers ----------
function shadow(ctx, x, y, S, a = .28, col = hex('#5f6483'), long = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba(col, a);
  ctx.beginPath(); ctx.ellipse(x + S * lerp(.06, .3, long), y + S * .006, S * lerp(.16, .5, long), S * lerp(.03, .045, long), 0, 0, TAU); ctx.fill(); ctx.restore();
}
const bloomClip = (cx, cy, R, seed) => ctx2 => {
  ctx2.beginPath();
  for (let i = 0; i <= 26; i++) { const a = i / 26 * TAU, r = R * (.78 + .4 * n2(Math.cos(a) * 2 + seed, Math.sin(a) * 2, seed)); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y); }
  ctx2.closePath();
};
function inkProgress(prims, t, t0, t1) {
  const inks = prims.filter(p => p.k === 'ink'), n = inks.length, u = clamp((t - t0) / (t1 - t0));
  const map = new Map(); inks.forEach((p, i) => map.set(p, clamp(u * n - i * .75)));
  return p => map.get(p) ?? 1;
}
const sparkDraw = (ctx, x, y, t, scale = 1, alpha = 1) => {
  const pulse = .9 + .1 * Math.sin(t * 11);
  const R = 5.2 * scale * pulse;
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, R * 7);
  g.addColorStop(0, `rgba(255,236,208,${.55 * alpha})`);
  g.addColorStop(.18, `rgba(240,150,105,${.38 * alpha})`);
  g.addColorStop(.45, `rgba(217,119,87,${.16 * alpha})`);
  g.addColorStop(1, 'rgba(217,119,87,0)');
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 7, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // ink-bright core + four-point glint
  ctx.fillStyle = `rgba(255,250,240,${.98 * alpha})`; ctx.beginPath(); ctx.arc(x, y, R * .62, 0, TAU); ctx.fill();
  ctx.strokeStyle = `rgba(230,140,95,${.75 * alpha})`; ctx.lineWidth = Math.max(1.1, R * .34); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - R * 2.1, y); ctx.lineTo(x + R * 2.1, y); ctx.moveTo(x, y - R * 2.1); ctx.lineTo(x, y + R * 2.1); ctx.stroke();
  ctx.fillStyle = `rgba(247,180,130,${.8 * alpha})`; ctx.beginPath(); ctx.arc(x, y, R * 1.15, 0, TAU); ctx.fill();
  ctx.fillStyle = `rgba(255,248,232,${.95 * alpha})`; ctx.beginPath(); ctx.arc(x, y, R * .5, 0, TAU); ctx.fill();
  ctx.restore();
};

// ---------- the orange line (the fuse) ----------
const TRAILS = new Map();
function trailOf(sp) {
  if (TRAILS.has(sp.i)) return TRAILS.get(sp.i);
  const keys = sp.spark, pts = [], times = [];
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, pa] = keys[i], [tb, pb] = keys[i + 1];
    const seg = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    const n = Math.max(2, Math.ceil(seg / 16));
    for (let k = 0; k < n; k++) {
      const u = k / n, t = lerp(ta, tb, u);
      let x = lerp(pa[0], pb[0], u), y = lerp(pa[1], pb[1], u);
      // hand wobble, deterministic in space
      const w = (n2(x * .012, y * .012, sp.i + 7) - .5) * 5.5;
      const dx = pb[0] - pa[0], dy = pb[1] - pa[1], l = Math.hypot(dx, dy) || 1;
      x += -dy / l * w; y += dx / l * w;
      pts.push([x, y]); times.push(t);
    }
  }
  const last = keys[keys.length - 1];
  pts.push([last[1][0], last[1][1]]); times.push(last[0]);
  for (let pass = 0; pass < 3; pass++) for (let i = 1; i < pts.length - 1; i++) {
    pts[i] = [(pts[i - 1][0] + 2 * pts[i][0] + pts[i + 1][0]) / 4, (pts[i - 1][1] + 2 * pts[i][1] + pts[i + 1][1]) / 4];
  }
  const o = { pts, times };
  TRAILS.set(sp.i, o); return o;
}
function drawTrail(ctx, sp, t) {
  const tr = trailOf(sp);
  if (t <= tr.times[0]) return;
  let i = 0; while (i < tr.times.length - 1 && tr.times[i + 1] <= t) i++;
  const cur = tr.pts[i];
  const nxt = tr.pts[Math.min(tr.pts.length - 1, i + 1)];
  const u = i < tr.times.length - 1 ? clamp((t - tr.times[i]) / (tr.times[i + 1] - tr.times[i])) : 1;
  const end = [lerp(cur[0], nxt[0], u), lerp(cur[1], nxt[1], u)];
  const path = () => {
    ctx.beginPath(); ctx.moveTo(tr.pts[0][0], tr.pts[0][1]);
    for (let k = 1; k <= i; k++) ctx.lineTo(tr.pts[k][0], tr.pts[k][1]);
    ctx.lineTo(end[0], end[1]);
  };
  const zf = sp.i === 6 && t > 131.8 ? .28 : 1;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = zf;
  path(); ctx.strokeStyle = 'rgba(217,119,87,.22)'; ctx.lineWidth = 9; ctx.stroke();
  path(); ctx.strokeStyle = 'rgba(200,92,60,.82)'; ctx.lineWidth = 3.4; ctx.stroke();
  path(); ctx.strokeStyle = 'rgba(150,66,42,.42)'; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.restore();
}

// ---------- page turn ----------
const TURNS = [22.055, 38.418, 58.417, 74.779, 94.778, 109.323, 140.23];
const TURN_D = .46;
function turnAt(t) {
  for (const tc of TURNS) { const a = tc - TURN_D * .62, b = tc + TURN_D * .38; if (t > a && t < b) return { u: (t - a) / (b - a), tc }; }
  return null;
}
function drawPageTurn(ctx, t, turn) {
  const u = turn.u;
  // a large sheet sweeps from right to left, filling the lens at the cut
  const L = 2120 - 4600 * u, W = 4000, Hh = 1700, rot = (-7 + 14 * u) * Math.PI / 180;
  ctx.save(); ctx.translate(L + W / 2, 540); ctx.rotate(rot);
  // the sheet edge is not a ruler: build a wavy edge
  const edge = [];
  for (let i = 0; i <= 12; i++) { const y = -Hh / 2 + i / 12 * Hh; edge.push([-W / 2 + Math.sin(i * 1.3 + 2) * 7 + (i < 2 ? -18 : 0), y]); }
  const path = () => { ctx.beginPath(); ctx.moveTo(edge[0][0], edge[0][1]); for (const p of edge) ctx.lineTo(p[0], p[1]); ctx.lineTo(W / 2, Hh / 2); ctx.lineTo(W / 2, -Hh / 2); ctx.closePath(); };
  // shadow cast on the page under it
  path(); ctx.fillStyle = 'rgba(60,50,40,.20)'; ctx.fill();
  // paper
  path(); ctx.fillStyle = '#f3ecd9'; ctx.fill();
  // fibrous paper shading near the edge
  const g = ctx.createLinearGradient(-W / 2, 0, -W / 2 + 620, 0);
  g.addColorStop(0, 'rgba(120,100,80,.26)'); g.addColorStop(.35, 'rgba(208,190,164,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  path(); ctx.fillStyle = g; ctx.fill();
  // the sheet's own grain: a few long fibres and a soft centre
  const g2 = ctx.createRadialGradient(0, 0, 200, 0, 0, 1600);
  g2.addColorStop(0, 'rgba(255,250,236,.25)'); g2.addColorStop(1, 'rgba(180,160,132,.12)');
  path(); ctx.fillStyle = g2; ctx.fill();
  ctx.save(); path(); ctx.clip();
  for (let k = 0; k < 26; k++) {
    const yy = -Hh / 2 + (k / 26) * Hh + 20, off = Math.sin(k * 2.1) * 30;
    ctx.strokeStyle = `rgba(140,120,94,${.05 + (k % 3) * .015})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-W / 2 + 40, yy); ctx.lineTo(W / 2 - 40, yy + off * .1); ctx.stroke();
  }
  ctx.restore();
  // a curl at the top corner
  ctx.beginPath(); ctx.moveTo(-W / 2, -Hh / 2 + 60);
  ctx.quadraticCurveTo(-W / 2 + 120, -Hh / 2 + 10, -W / 2 + 220, -Hh / 2 + 90);
  ctx.quadraticCurveTo(-W / 2 + 90, -Hh / 2 + 120, -W / 2, -Hh / 2 + 60);
  ctx.fillStyle = 'rgba(230,220,200,.9)'; ctx.fill();
  ctx.strokeStyle = 'rgba(60,50,40,.25)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  // the spark leads the edge
  const ex = L + Math.sin(2) * 6, ey = 540 - Hh / 2 + 90;
  sparkDraw(ctx, ex, ey, t, 1.1, .9);
}

// ---------- render ----------
const cvs = document.getElementById('c'), ctx = cvs.getContext('2d');
// paperclips: fixed slots, each with a landing time
const CLIPS = (() => {
  const out = [], R = rng(4242);
  for (let row = 0; row < 30; row++) for (let col = 0; col < 13; col++) {
    const x = 1180 + col * 150 + (R() - .5) * 90;
    const y = 2090 - (x - 1100) * .09 - row * 17;
    const t0 = 96.85 + Math.pow(row / 30, 1.25) * 5.4 + col * .008;
    out.push({ x, y, t0, a: R() * TAU, s: .8 + R() * .5 });
  }
  return out;
})();
const FUSE = [[900, 1800], [1300, 1820], [1700, 1840], [2100, 1820], [2500, 1720], [2820, 1520], [3080, 1300], [3180, 1180]];
function fuseAt(t) {
  const u = clamp((t - 102.4) / (106.2 - 102.4));
  const n = FUSE.length - 1, f = u * n, i = Math.min(n - 1, Math.floor(f)), q = f - i;
  return [lerp(FUSE[i][0], FUSE[i + 1][0], q), lerp(FUSE[i][1], FUSE[i + 1][1], q)];
}
const tooth = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const im = x.createImageData(512, 512); const R = rng(77);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) { const v = n2(i * .35, j * .35, 3) * .6 + n2(i * .09, j * .09, 5) * .4; const g2 = 255 - Math.max(0, v - .55) * 42 - (R() < .003 ? 22 : 0); const k = (j * 512 + i) * 4; im.data[k] = g2; im.data[k + 1] = g2 * .995; im.data[k + 2] = g2 * .985; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); return c;
})();
const toothPat = ctx.createPattern(tooth, 'repeat');

function worldTransform(ctx, cam) {
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot);
  ctx.setTransform(cam.z * c, cam.z * s, -cam.z * s, cam.z * c, 960 - cam.z * (c * cam.cx - s * cam.cy), 540 - cam.z * (s * cam.cx + c * cam.cy));
}

// compute lyric anchors once: a rectangle that stays in frame for the whole line
const anchors = new Map();
function viewRect(cam) { const w = 1920 / cam.z, h = 1080 / cam.z; return { x0: cam.cx - w / 2, y0: cam.cy - h / 2, x1: cam.cx + w / 2, y1: cam.cy + h / 2 }; }
function interRect(a, b) { const r = { x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) }; return (r.x1 - r.x0 > 120 && r.y1 - r.y0 > 80) ? r : null; }
function anchorOf(i) {
  if (anchors.has(i)) return anchors.get(i);
  const L = LYR[i], sp = spreadAt(L.line.start), S = PLAN.find(p => p.i === sp);
  const next = LYR[i + 1] && spreadAt(LYR[i + 1].line.start) === sp ? LYR[i + 1].line.start : L.line.end + 2.2;
  const spEnd = (PLAN.find(p => p.i === sp)?.t1 ?? L.line.end + 3) - .06;
  const need = L.line.text.replace(/[^A-Za-z0-9'\u2019]/g, '').length / 15 + 2.15;
  const readEnd = L.line.start + need;
  const tEnd = Math.min(spEnd, Math.max(L.line.start + need, next + .15));
  if (L.fix) {
    const a = { ...L, sp, wx: L.fix.x, wy: L.fix.y, size: L.fix.size, rot: 0, tEnd, readEnd };
    anchors.set(i, a); return a;
  }
  const ts = [L.line.start, (L.line.start + tEnd) / 2, tEnd];
  let safe = null;
  for (const tt of ts) { const r = viewRect(cameraAt(tt)); safe = safe ? interRect(safe, r) : r; }
  const cm = cameraAt((L.line.start + tEnd) / 2);
  let size = clamp(47 / cm.z, 30, 118);
  // measure and shrink to fit the safe rect
  const box0 = lineBox(ctx, L.line, size);
  const avail = (safe ? safe.x1 - safe.x0 : 1600) * .78;
  if (box0.width > avail) size = Math.max(28, size * avail / box0.width);
  const box = lineBox(ctx, L.line, size);
  const vw = 1920 / cm.z, vh = 1080 / cm.z;
  let fx = 0, fy = 0;
  if (L.pos.includes('l')) fx = -.5; if (L.pos.includes('r')) fx = .5;
  if (L.pos.includes('t')) fy = -.38; if (L.pos.includes('b')) fy = .40;
  const base = safe ?? viewRect(cm);
  let x = base.x0 + 40 + (L.pos.includes('r') ? base.x1 - base.x0 - box.width - 80 : (base.x1 - base.x0 - box.width) / 2);
  let y = base.y0 + (L.pos.includes('b') ? base.y1 - base.y0 - size * .35 : base.y0 + size * 1.2 + 30);
  if (L.pos === 'tl' || L.pos === 'tr') y = base.y0 + size * 1.25 + 24;
  if (L.pos === 'l') y = base.y0 + (base.y1 - base.y0) * .55;
  if (L.pos === 'c') { x = base.x0 + (base.x1 - base.x0 - box.width) / 2; y = base.y0 + (base.y1 - base.y0) * .6; }
  x += L.dx * .5; y += L.dy * .5;
  const a = { ...L, sp, wx: x, wy: y, size, rot: (n2(i, 3) - .5) * .02, tEnd, readEnd };
  anchors.set(i, a); return a;
}
function activeLineAt(t, sp) {
  let cur = -1;
  for (const L of LYR) { const a = anchorOf(L.i); if (a.sp !== sp) continue; if (t >= a.line.start - .05 && t <= a.tEnd + .1) cur = L.i; }
  return cur;
}

window.DUR = DUR;
window.render = t => {
  const turn = turnAt(t);
  const si = spreadAt(t);
  const sp = getSpread(si);
  const cam = cameraAt(t);
  sp.comp(cam, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(sp.glc, 0, 0);
  worldTransform(ctx, cam);
  // ---- dynamics for this spread
  if (si === 0) {
    const col = clamp((t - sp.T(1318, 1300) - .05) / .5);
    shadow(ctx, HER.x, HER.y + 30, 300, .22 * col, undefined, .1);
    const hp = figure(LOOK2.her, herPose(t), { ...HER, S: 340, yaw: HER.yaw }, { seed: 51, boil: boil(t) });
    drawPrims(ctx, hp, { color: col, ink: 1 });
    headscarf(ctx, hp.head, col);
    if (col > 0 && hp.head) {
      const { c, r, fwd } = hp.head;
      ctx.save(); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(245,238,222,${.95 * col})`;
      ctx.beginPath(); ctx.ellipse(c[0] + (fwd[0] || 0) * r * .18, c[1] + r * .16, r * .62, r * .56, .05, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(233,187,154,${.9 * col})`; ctx.beginPath(); ctx.ellipse(c[0] + (fwd[0] || 0) * r * .18, c[1] + r * .16, r * .6, r * .54, .05, 0, TAU); ctx.fill();
      ctx.restore();
    }
    eyedots(ctx, hp.head, t, clamp((t - 3.7) / .5));
    const hc = clamp((t - sp.T(2340, 1400) - .05) / .5);
    const hm = figure(LOOK2.him, himPose(t), { ...HIM, S: 500, yaw: HIM.yaw }, { seed: 71, boil: boil(t) });
    drawPrims(ctx, hm, { color: hc, ink: 1 });
    flatcap(ctx, hm.head, hc);
    // pencil in his drawing hand
    if (hm.hand) {
      const h = hm.hand.R;
      ctx.save(); ctx.strokeStyle = rgba(INK, .85); ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(h[0] + 8, h[1] - 4); ctx.lineTo(h[0] - 34, h[1] + 34); ctx.stroke();
      ctx.strokeStyle = rgba(hex('#c9a06a'), .9); ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(h[0] - 34, h[1] + 34); ctx.lineTo(h[0] - 46, h[1] + 46); ctx.stroke();
      ctx.restore();
    }
  }
  if (si === 1) {
    // the man in the room, facing the window
    const rc = 1;
    shadow(ctx, ROOM.x, ROOM.y, 300, .2, undefined, .1);
    const rp = figure(LOOK2.walker, roomPose(t), { ...ROOM, S: 520, yaw: ROOM.yaw }, { seed: 91, boil: boil(t) });
    drawPrims(ctx, rp, { color: rc, ink: 1 });
    // the room swells (FOOM)
    if (t > 24.3 && t < 27.2) {
      const u = seg(t, 24.3, 26.3), e = eo(u);
      ctx.save(); ctx.strokeStyle = rgba(INK, .55 * (1 - seg(t, 26.6, 27.2)));
      ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        const R = 120 + e * (700 + k * 60), a0 = Math.PI + .35, a1 = TAU - .35;
        ctx.beginPath(); ctx.ellipse(1950, 900, R, R * .42, 0, a0, a1); ctx.stroke();
      }
      // pressure ticks on the ceiling
      for (let k = 0; k < 9; k++) { const x = 1100 + k * 220, y = 560 - e * (20 + 14 * Math.sin(t * 8 + k)); ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x, y - 16); ctx.stroke(); }
      ctx.restore();
    }
    // the shinigami eye, drawn fresh on the wall at 33.4
    if (t > 33.4) {
      const p2 = eo(seg(t, 33.42, 34.1)), ex = 3290, ey = 780, rx = 250, ry = 140;
      ctx.save();
      ctx.fillStyle = 'rgba(245,238,222,.82)';
      ctx.beginPath();
      for (let k = 0; k <= 40; k++) { const a2 = k / 40 * TAU, rr = 1 + .05 * n2(Math.cos(a2) * 3, Math.sin(a2) * 3, 4); const px = ex + Math.cos(a2) * rx * 1.2 * p2 * rr, py = ey + Math.sin(a2) * ry * 1.35 * p2 * rr; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(238,230,212,.55)';
      ctx.beginPath(); ctx.ellipse(ex, ey, rx * p2, ry * p2, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = rgba(INK, .9); ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(ex, ey, rx * p2, ry * p2, 0, 0, TAU); ctx.stroke();
      if (p2 > .55) {
        const q = eo(seg(p2, .55, 1));
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(124,139,123,.55)';
        ctx.beginPath(); ctx.arc(ex - 10, ey + 4, rx * .32 * q, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = rgba(INK, .7); ctx.lineWidth = 2.2; ctx.stroke();
        ctx.fillStyle = rgba(INK, .8); ctx.beginPath(); ctx.arc(ex - 10, ey + 4, rx * .12 * q, 0, TAU); ctx.fill();
      }
      for (let k = 0; k < 7; k++) { const a2 = -2.7 + k * .2; ctx.beginPath(); ctx.moveTo(ex + Math.cos(a2) * rx * .97 * p2, ey + Math.sin(a2) * ry * .95 * p2); ctx.lineTo(ex + Math.cos(a2) * rx * 1.05 * p2, ey + Math.sin(a2) * ry * 1.08 * p2); ctx.stroke(); }
      ctx.restore();
    }
    // the shoggoth opens its eyes
    if (t > 29.8 && t < 33.4) {
      for (let k = 0; k < 7; k++) {
        const t0 = 30.0 + k * .13, u = seg(t, t0, t0 + .22);
        if (u <= 0) continue;
        const ex = 1580 + SHOG_EYES[k][0], ey = 790 + SHOG_EYES[k][1];
        const blink = (t > 33.0 + k * .04 && t < 33.18 + k * .04) ? .15 : 1;
        ctx.save(); ctx.fillStyle = rgba(INK, .8); ctx.beginPath(); ctx.ellipse(ex, ey, 8.5 * eo(u), 8.5 * eo(u) * blink, 0, 0, TAU); ctx.fill(); ctx.restore();
        if (u > .6) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(120,160,140,${.25 * u})`; ctx.beginPath(); ctx.arc(ex, ey, 16, 0, TAU); ctx.fill(); ctx.restore(); }
      }
    }
  }
  if (si === 2) {
    const RUN = { x: 1950, y: 1636, yaw: 0 };
    const speed = 1 + 1.8 * ss(seg(t, 44.8, 47.2));
    const ph = (t - 38.4) * TAU / (.4545 * 2) * speed;
    const rp = run(ph, 1, { headYaw: 0, nod: -.12 });
    if (t > 49.5) {
      const u = ss(seg(t, 49.5, 50.4));
      rp.handR = V(.12, lerp(.3, 1.05, u), lerp(.1, .32, u));
      rp.elbR = V(1, 0, 0);
      rp.armR = lerp(rp.armR ?? 0, 0, u);
    }
    shadow(ctx, RUN.x, RUN.y + 8, 320, .28, undefined, .1);
    const prims = figure(LOOK2.runner, rp, { ...RUN, S: 520, yaw: 0 }, { seed: 111, boil: boil(t) });
    const fade = clamp(1 - seg(t, 49.7, 51.4));
    drawPrims(ctx, prims, { color: fade, ink: fade });
    // the belt moves
    ctx.save(); ctx.strokeStyle = rgba(INK, .35); ctx.lineWidth = 1.6;
    for (let k = 0; k < 9; k++) { const u = ((k / 9) + (t * speed * .5) % (1 / 9)) % 1, y = 1630 + u * 80, x = 1950 - 300 + u * 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 600 - u * 120, y); ctx.stroke(); }
    ctx.restore();
    // atoms rearranging: dabs spiral out of his hand and a circuit grows
    if (t > 49.5 && t < 53.2) {
      const h = prims.hand?.R ?? [2000, 1390];
      for (let k = 0; k < 90; k++) {
        const a = k * 2.399, rr = 20 + ((t - 49.5) * 260 + k * 7) % 360, u = clamp((t - 49.5) / 3.4);
        const x = h[0] + Math.cos(a + t) * rr * u, y = h[1] + Math.sin(a + t) * rr * .8 * u - u * 40;
        const col = [hex('#7f9c8a'), hex('#8fb3c8'), hex('#d9a15e')][k % 3];
        dab(ctx, x, y, 3 + (k % 5), a, col, .5 * (1 - u * .4), k);
      }
      const cu = seg(t, 50.2, 53.0);
      if (cu > 0) {
        ctx.save(); ctx.strokeStyle = rgba(INK, .55); ctx.lineWidth = 1.4;
        let x = h[0], y = h[1];
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let k = 0; k < 26 * cu; k++) { x += (k % 2 ? 34 : 0); y += (k % 2 ? 0 : 26); ctx.lineTo(x, y); }
        ctx.stroke(); ctx.restore();
      }
    }
  }
  if (si === 2 && t > 52.85) {
    const u = ss(seg(t, 52.85, 53.5));
    ctx.save(); ctx.globalAlpha = u;
    ctx.fillStyle = 'rgba(245,238,222,.97)';
    ctx.beginPath(); ctx.moveTo(2950, 760); ctx.lineTo(3760, 700); ctx.lineTo(3800, 1780); ctx.lineTo(2980, 1700); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(INK, .8); ctx.lineWidth = 2.6; ctx.stroke();
    // palms press through
    for (const [px, py] of [[3260, 1150], [3530, 1120]]) {
      ctx.fillStyle = 'rgba(226,206,176,.55)'; ctx.beginPath(); ctx.ellipse(px, py, 96, 120, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba(INK, .5); ctx.lineWidth = 1.8; ctx.stroke();
      for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.moveTo(px - 60 + f * 40, py - 100); ctx.lineTo(px - 64 + f * 40, py - 40); ctx.stroke(); }
    }
    ctx.restore();
  }
  if (si === 3) {
    // the paper dart riding the line
    if (t > 62.4 && t < 64.2) {
      const u = seg(t, 62.4, 64.0);
      const x = lerp(2150, 2760, eio(u)), y = lerp(1000, 600, eio(u)) - Math.sin(u * Math.PI) * 60;
      ctx.save(); ctx.translate(x, y); ctx.rotate(-.5 + u * .2);
      ctx.fillStyle = 'rgba(245,238,222,.95)'; ctx.beginPath(); ctx.moveTo(-40, 20); ctx.lineTo(60, -18); ctx.lineTo(20, 26); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(INK, .8); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    }
    // the point pulses; the field breathes
    if (t > 64.0 && t < 69.8) {
      const u = seg(t, 66.2, 66.9), pulse = .5 + .5 * Math.sin(t * 9);
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      const R = (60 + u * 460) * (0.96 + .04 * pulse);
      const g = ctx.createRadialGradient(3060, 280, 0, 3060, 280, R);
      g.addColorStop(0, `rgba(217,119,87,${.30 * (1 - u * .5)})`); g.addColorStop(1, 'rgba(217,119,87,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(3060, 280, R, 0, TAU); ctx.fill(); ctx.restore();
      // lights on the GPU field
      if (t > 66.2) for (let k = 0; k < 60; k++) {
        const a = k * 2.399, rr = 90 + (k % 6) * 90, x = 3060 + Math.cos(a) * rr * 1.15, y = 260 + Math.sin(a) * rr * .82;
        const on = (Math.sin(t * 3.1 + k * .7) > .2) ? .7 : .15;
        ctx.save(); ctx.fillStyle = `rgba(150,210,170,${on * .5})`; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
  }
  if (si === 4) {
    // the walker on the road, then the grip on the page edge
    const P = [[74.8, 1700, 1900], [77.8, 1580, 1650], [79.8, 1520, 1490], [81.4, 1460, 1370], [83.0, 1250, 1330], [85.0, 950, 1320], [86.6, 620, 1310], [87.4, 320, 1290], [87.9, 240, 1270]];
    let u = 0; for (let i = 0; i < P.length - 1; i++) if (t >= P[i][0]) u = i + clamp((t - P[i][0]) / (P[i + 1][0] - P[i][0]));
    const i0 = Math.min(P.length - 2, Math.floor(u)), q = u - i0;
    const wx = lerp(P[i0][1], P[i0 + 1][1], q), wy = lerp(P[i0][2], P[i0 + 1][2], q);
    if (t < 87.9) {
      const ph = (t - 74.8) * TAU / .909;
      const wp = walk(ph, { headYaw: -.1 });
      shadow(ctx, wx, wy, 300, .2, undefined, .1);
      drawPrims(ctx, figure(LOOK2.walker, wp, { x: wx, y: wy, S: 500, yaw: -1.35 }, { seed: 121, boil: boil(t) }), { color: 1, ink: 1 });
    } else {
      // hanging by one hand from the torn edge
      const hx = 205, hy = 1560;
      const pose = { hipY: .52, lean: .04, legL: -.12 + Math.sin(t * 2.1) * .04, kneeL: .4, legR: .14, kneeR: .22, handR: V(-.02, 1.16, .04), elbR: V(-1, .1, 0), handL: V(-.26, .28, .24), elbL: V(-1, -.4, 0), headYaw: .3, nod: -.15 };
      const sw = Math.sin(t * 2.2) * .03;
      pose.legL += sw; pose.legR += sw;
      drawPrims(ctx, figure(LOOK2.walker, pose, { x: hx, y: hy, S: 520, yaw: 1.5 }, { seed: 122, boil: boil(t) }), { color: 1, ink: 1 });
      // the hand grips the page edge: a small fold
      ctx.save(); ctx.strokeStyle = rgba(INK, .7); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(96, 1024); ctx.lineTo(96, 1042); ctx.stroke(); ctx.restore();
    }
    // the eraser: von Neumann is rubbed out
    if (t > 77.9 && t < 81.2) {
      const ue = ss(seg(t, 77.9, 80.9)), x = lerp(2600, 3140, ue);
      ctx.save();
      ctx.fillStyle = 'rgba(245,238,222,.985)';
      ctx.beginPath();
      ctx.moveTo(2540, 860);
      for (let yy = 860; yy <= 1600; yy += 60) ctx.lineTo(x + Math.sin(yy * .03) * 14, yy);
      ctx.lineTo(2540, 1600); ctx.closePath(); ctx.fill();
      // faint graphite smudge where the drawing was
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(120,112,100,.10)';
      for (let yy = 900; yy < 1560; yy += 90) { ctx.beginPath(); ctx.ellipse((2540 + x) / 2, yy, Math.max(10, (x - 2540)) * .38, 16, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
      // eraser block
      ctx.save(); ctx.translate(x, 1310); ctx.rotate(-.08);
      ctx.fillStyle = 'rgba(196,190,176,.95)'; ctx.fillRect(-70, -46, 140, 92);
      ctx.strokeStyle = rgba(INK, .7); ctx.lineWidth = 2; ctx.strokeRect(-70, -46, 140, 92);
      ctx.strokeStyle = 'rgba(120,112,100,.35)'; ctx.lineWidth = 1;
      for (let k = -60; k < 70; k += 14) { ctx.beginPath(); ctx.moveTo(k, -40); ctx.lineTo(k, 40); ctx.stroke(); }
      ctx.restore();
      // crumbs
      for (let k = 0; k < 26; k++) {
        const cx2 = x - 40 + n2(k, 2) * 120, cy2 = 1290 + n2(k, 3) * 120 - (t - 77.9) * 18;
        ctx.save(); ctx.fillStyle = 'rgba(150,140,125,.6)'; ctx.beginPath(); ctx.ellipse(cx2, cy2, 2 + n2(k, 4) * 4, 1.6, k, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
  }
  if (si === 5) {
    // the room fills with paperclips
    for (const c of CLIPS) {
      if (t < c.t0) continue;
      const age = t - c.t0, settle = clamp(age / .35);
      const yy = c.y - (1 - eo(settle)) * 140;
      const ang = c.a + Math.sin(t * 3 + c.x * .01) * .02;
      ctx.save(); ctx.translate(c.x, yy); ctx.rotate(ang);
      ctx.strokeStyle = rgba(INK, .58); ctx.lineWidth = 1.7 * c.s;
      const w = 15 * c.s, h = 30 * c.s, r = 7 * c.s;
      ctx.beginPath();
      ctx.moveTo(-w, h); ctx.lineTo(-w, -h + r); ctx.quadraticCurveTo(-w, -h, -w + r, -h);
      ctx.lineTo(w - r, -h); ctx.quadraticCurveTo(w, -h, w, -h + r); ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h); ctx.lineTo(-w + r * 2, h);
      ctx.moveTo(-w + r * 2, h - r); ctx.lineTo(-w + r * 2, -h + r * 2);
      ctx.quadraticCurveTo(-w + r * 2, -h + r * 3.2, -w + r * 3.4, -h + r * 3.2);
      ctx.lineTo(w - r * 2, -h + r * 3.2); ctx.quadraticCurveTo(w - r * .8, -h + r * 3.2, w - r * .8, -h + r * 4.6);
      ctx.lineTo(w - r * .8, h - r);
      ctx.stroke(); ctx.restore();
    }
    // the fuse burns
    if (t > 102.4 && t < 106.4) {
      const f = fuseAt(t), fl = .7 + .3 * Math.sin(t * 23);
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      const g = ctx.createRadialGradient(f[0], f[1], 0, f[0], f[1], 90);
      g.addColorStop(0, 'rgba(255,214,150,.85)'); g.addColorStop(.4, 'rgba(240,150,90,.5)'); g.addColorStop(1, 'rgba(217,119,87,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f[0], f[1], 90, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = rgba(hex('#b9522f'), .8); ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(f[0], f[1]); ctx.quadraticCurveTo(f[0] + 18 * Math.sin(t * 9 + k), f[1] - 30 - 12 * k, f[0] + 26 * Math.cos(t * 7 + k), f[1] - 48 - 18 * k); ctx.stroke(); }
      ctx.restore();
    }
  }
  if (si === 6) {
    // the mask comes down over the page, holds through the bridge, then lifts on "what did Ilya see"
    if (t > 127.9 && t < 132.35) {
      const down = eo(seg(t, 127.9, 129.3)), up = eo(seg(t, 131.6, 132.3));
      const y = lerp(lerp(560, 1060, down), 380, up), x = 1720, w = 620, h = 400;
      ctx.save(); ctx.globalAlpha = 1 - up * .9;
      ctx.beginPath();
      ctx.moveTo(x, y + 20); ctx.quadraticCurveTo(x + w * .5, y - 60, x + w, y + 20);
      ctx.quadraticCurveTo(x + w * .9, y + h * .55, x + w * .55, y + h * .62);
      ctx.quadraticCurveTo(x + w * .5, y + h * .4, x + w * .45, y + h * .62);
      ctx.quadraticCurveTo(x + w * .1, y + h * .55, x, y + 20); ctx.closePath();
      ctx.fillStyle = 'rgba(74,70,88,.94)'; ctx.fill();
      ctx.strokeStyle = rgba(INK, .9); ctx.lineWidth = 5; ctx.stroke();
      for (const hx of [x + w * .28, x + w * .72]) {
        ctx.beginPath(); ctx.ellipse(hx, y + h * .26, 58, 30, 0, 0, TAU);
        ctx.fillStyle = 'rgba(245,238,222,.98)'; ctx.fill(); ctx.strokeStyle = rgba(INK, .55); ctx.lineWidth = 2.5; ctx.stroke();
      }
      ctx.restore();
    }
    // the eye, drawn fresh at 132 on top of the strips
    if (t > 131.95) {
      const p = eo(seg(t, 131.98, 132.7)), ex = 1980, ey = 1080, rx = 470 * (.6 + .4 * p), ry = 300 * (.6 + .4 * p);
      const reveal = ctx2 => { ctx2.beginPath(); for (let i = 0; i <= 30; i++) { const a2 = i / 30 * TAU, r = 1 + .07 * n2(Math.cos(a2) * 3, Math.sin(a2) * 3, 9); ctx2.ellipse(ex, ey, rx * 1.14 * r * p, ry * 1.2 * r * p, 0, 0, TAU); } };
      ctx.save();
      ctx.fillStyle = 'rgba(245,238,222,.97)'; ctx.beginPath(); ctx.ellipse(ex, ey, rx * 1.14 * p, ry * 1.2 * p, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(239,231,212,.55)'; ctx.beginPath(); ctx.ellipse(ex, ey, rx * p, ry * p, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = rgba(INK, .9); ctx.lineWidth = 4.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, TAU); ctx.stroke();
      // sclera shading
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(180,176,160,.18)';
      ctx.beginPath(); ctx.ellipse(ex + rx * .1, ey + ry * .25, rx * .8, ry * .5, .1, 0, TAU); ctx.fill(); ctx.restore();
      // iris
      if (p > .5) {
        const q = eo(seg(p, .5, 1));
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(124,139,123,.60)';
        ctx.beginPath(); ctx.arc(ex, ey, rx * .34 * q, 0, TAU); ctx.fill(); ctx.restore();
        ctx.strokeStyle = rgba(INK, .75); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(ex, ey, rx * .34 * q, 0, TAU); ctx.stroke();
        ctx.fillStyle = rgba(INK, .85); ctx.beginPath(); ctx.arc(ex, ey, rx * .14 * q, 0, TAU); ctx.fill();
        // the answer in the pupil: a tiny bench
        if (p > .9) { ctx.strokeStyle = rgba(255,250,238, .5); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex - 30, ey + 20); ctx.lineTo(ex + 30, ey + 18); ctx.moveTo(ex - 22, ey + 18); ctx.lineTo(ex - 18, ey + 34); ctx.moveTo(ex + 20, ey + 18); ctx.lineTo(ex + 16, ey + 34); ctx.stroke(); }
      }
      // lashes
      for (let k = 0; k < 9; k++) { const a2 = -2.9 + k * .2 + .1; ctx.beginPath(); ctx.moveTo(ex + Math.cos(a2) * rx * .96, ey + Math.sin(a2) * ry * .96); ctx.lineTo(ex + Math.cos(a2) * rx * 1.16, ey + Math.sin(a2) * ry * 1.28); ctx.stroke(); }
      ctx.restore();
      // a blink at the apex
      if (t > 136.1 && t < 136.55) {
        const u2 = Math.sin(seg(t, 136.1, 136.55) * Math.PI);
        ctx.save(); ctx.fillStyle = 'rgba(245,238,222,.96)';
        ctx.beginPath(); ctx.ellipse(ex, ey, rx * 1.06, ry * 1.12 * u2, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
  }
  // ---- spark + orange trail (drawn as light on top of the page)
  drawTrail(ctx, sp, t);
  const spAt = sparkAt(sp.spark, t);
  if (t > 3.5 && t < sp.spark[sp.spark.length - 1][0] + 3) {
    const now = clamp((t - 3.55) / .3);
    sparkDraw(ctx, spAt[0], spAt[1], t, 1.15, now);
  }
  // ---- captions, written in the paper margin of the frame
  {
    const cur = currentCaption(t);
    if (cur >= 0) {
      let prev = -1;
      for (const L of LYR) { const c = capOf(L.i); if (c.i < cur) prev = Math.max(prev, c.i); }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (prev >= 0) { const c = capOf(prev), a0 = 1 - ss(seg(t, capOf(cur).line.start, capOf(cur).line.start + .55)); if (a0 > 0) drawCaption(ctx, Math.min(t, c.tEnd), c, a0 * .95); }
      drawCaption(ctx, t, capOf(cur), 1);
      worldTransform(ctx, cam);
    }
  }
  notes(ctx, t, si);
  if (turn) drawPageTurn(ctx, t, turn);
  // ---- paper tooth over everything
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = toothPat;
  const iz = 1 / (cam.z * .85);
  ctx.setTransform(cam.z * .85, 0, 0, cam.z * .85, 960 - cam.z * .85 * cam.cx, 540 - cam.z * .85 * cam.cy);
  ctx.fillRect((cam.cx - 1300 / cam.z) / .85, (cam.cy - 800 / cam.z) / .85, 2600 * iz, 1600 * iz); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // impact splats on the big structural hits
  {
    const HITS = [9.52, 24.32, 41.34, 64.10, 81.21, 102.46, 118.75, 140.20];
    for (const h of HITS) {
      const age = t - h;
      if (age < 0 || age > .5) continue;
      const a = (1 - age / .5) * .8;
      for (let k = 0; k < 14; k++) {
        const ang = k * 2.399, rr = 40 + age * 900 + (k % 5) * 30;
        const x = 960 + Math.cos(ang) * rr, y = 540 + Math.sin(ang) * rr * .8;
        ctx.save(); ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = k % 3 === 0 ? `rgba(217,119,87,${a * .5})` : `rgba(70,62,54,${a * .3})`;
        ctx.beginPath(); ctx.ellipse(x, y, 2 + (k % 4) * 2, 1.4 + (k % 3), ang, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
  }
  // a little dust in the dry pages
  if (si === 4 || si === 6) {
    for (let k = 0; k < 26; k++) {
      const x = (n2(k, 3) * 3600 + t * (8 + k % 5)) % 3840, y = 900 + n2(k, 7) * 1100 + Math.sin(t * .4 + k) * 30;
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(180,160,130,${.18 + .12 * Math.sin(t * 2 + k)})`;
      ctx.beginPath(); ctx.arc(x, y, 1.6 + (k % 3), 0, TAU); ctx.fill(); ctx.restore();
    }
  }
  // a quiet vignette: the lens sees a page, not a screen
  {
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createRadialGradient(960, 520, 520, 960, 540, 1180);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.62, 'rgba(240,232,218,1)'); g.addColorStop(1, 'rgba(202,188,166,1)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
  }
  if (si === 7 && t > 152.8) {
    const u = clamp((t - 152.8) / 3.9);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(120,96,74,${.10 * u})`;
    ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
  }
};


// ---------- captions: the page's lower margin ----------
const CAP = new Map();
function capOf(i) {
  if (CAP.has(i)) return CAP.get(i);
  const L = LYR[i];
  const need = L.line.text.replace(/[^A-Za-z0-9'\u2019]/g, '').length / 15 + 2.15;
  const readEnd = L.line.start + need;
  const nextStart = LYR[i + 1] ? LYR[i + 1].line.start : 1e9;
  const tEnd = Math.min(156.6, Math.max(readEnd, nextStart + .15));
  const c = { ...L, readEnd, tEnd };
  CAP.set(i, c); return c;
}
function currentCaption(t) {
  let cur = -1;
  for (const L of LYR) { const c = capOf(L.i); if (t >= c.line.start - .05 && t <= c.tEnd + .05) cur = c.i; }
  return cur;
}
function capLayout(c) {
  const L = c.line;
  let size = 46; let box = lineBox(ctx, L, size);
  if (box.width > 1560) { size = Math.max(30, size * 1560 / box.width); box = lineBox(ctx, L, size); }
  const left = !String(c.pos).includes('r');
  const x = left ? 118 : 1802 - box.width;
  const y = String(c.pos).includes('t') ? 132 + size * .8 : 1012;
  return { size, box, x, y };
}
function drawCaption(ctx, t, c, alpha) {
  const L = c.line, { size, box, x, y } = capLayout(c);
  const lag = .10;
  if (t < L.words[0].start + lag) return;
  const reveal = clamp((t - L.words[0].start) / Math.max(.5, L.end - L.words[0].start), .15, 1);
  textHalo(ctx, x - 12, y, box.width * reveal + 12, size, c.i + 3, false);
  ctx.save(); ctx.font = `500 ${size}px Caveat`; ctx.textBaseline = 'alphabetic';
  for (let k = 0; k < box.ws.length; k++) {
    const w = box.ws[k], wd = L.words[k];
    const p = clamp((t - (wd.start + lag)) / Math.max(.16, Math.min(.34, (wd.end - wd.start) * .9)));
    if (p <= 0) continue;
    ctx.save(); ctx.translate(x + w.x, y + Math.sin((k + c.i) * 1.7) * size * .012); ctx.rotate((c.i % 2 ? 1 : -1) * .004);
    ctx.globalAlpha = alpha;
    handwrite(ctx, w.w, 0, 0, size, p, { font: 'Caveat', weight: 500, col: INK, alpha: .92 });
    ctx.restore();
  }
  const done = clamp((t - (L.words[L.words.length - 1].start + .3)) / .5);
  if (done > 0) {
    ctx.save(); ctx.globalAlpha = alpha * .5; ctx.strokeStyle = rgba(INK, .6); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + size * .18);
    ctx.quadraticCurveTo(x + box.width * .5 * eo(done), y + size * .24, x + box.width * .96 * eo(done), y + size * .17);
    ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

// ---------- marginalia: labels, arrows, circles, ticks, stamps ----------
// Each note appears when the fuse passes closest to it: the line annotates the world it crosses.
const ANNOT = [
  // P0
  { sp: 0, t: 2.10, kind: 'circle', x: 1170, y: 1450, rx: 330, ry: 150 },
  { sp: 0, t: 3.95, kind: 'arrow', x: 900, y: 1050, x2: 1240, y2: 1200, text: 'eyes', size: 44 },
  { sp: 0, t: 4.90, kind: 'label', x: 1450, y: 1080, text: 'sparks', size: 48 },
  { sp: 0, t: 6.90, kind: 'label', x: 1900, y: 1120, text: 'AGI', size: 96 },
  { sp: 0, t: 9.62, kind: 'arrow', x: 2500, y: 1600, x2: 2350, y2: 1800, text: 'loss', size: 54 },
  { sp: 0, t: 10.40, kind: 'label', x: 1500, y: 1880, text: '0.00', size: 58 },
  { sp: 0, t: 12.10, kind: 'label', x: 1950, y: 2080, text: 'step 1', size: 42 },
  { sp: 0, t: 13.40, kind: 'label', x: 2350, y: 1300, text: 'boss', size: 72 },
  { sp: 0, t: 13.70, kind: 'label', x: 2100, y: 1900, text: 'servant', size: 54 },
  { sp: 0, t: 17.65, kind: 'stamp', x: 3320, y: 700, text: 'BITTEN', size: 60 },
  { sp: 0, t: 18.60, kind: 'arrow', x: 2900, y: 1200, x2: 3200, y2: 500, text: '', size: 40 },
  // P1
  { sp: 1, t: 22.40, kind: 'circle', x: 1900, y: 1150, rx: 900, ry: 500 },
  { sp: 1, t: 23.10, kind: 'label', x: 1250, y: 900, text: 'P(doom) 0.02', size: 52 },
  { sp: 1, t: 24.45, kind: 'label', x: 2100, y: 720, text: 'FOOM', size: 96 },
  { sp: 1, t: 26.45, kind: 'arrow', x: 2700, y: 880, x2: 2450, y2: 980, text: 'ROOM 1', size: 44 },
  { sp: 1, t: 28.10, kind: 'label', x: 1500, y: 1700, text: 'shrooms', size: 46 },
  { sp: 1, t: 30.05, kind: 'arrow', x: 1900, y: 700, x2: 1650, y2: 800, text: 'lies', size: 48 },
  { sp: 1, t: 31.00, kind: 'label', x: 1980, y: 680, text: 'seven eyes', size: 40 },
  { sp: 1, t: 33.70, kind: 'arrow', x: 2950, y: 1050, x2: 3150, y2: 850, text: 'shinigami', size: 44 },
  // P2
  { sp: 2, t: 38.80, kind: 'label', x: 1500, y: 1180, text: 'stable', size: 54 },
  { sp: 2, t: 40.20, kind: 'label', x: 2350, y: 1150, text: 'loss 0.0021', size: 42 },
  { sp: 2, t: 41.45, kind: 'arrow', x: 2300, y: 980, x2: 2050, y2: 760, text: 'singularity', size: 46 },
  { sp: 2, t: 45.20, kind: 'label', x: 2200, y: 700, text: '1e30', size: 80 },
  { sp: 2, t: 49.70, kind: 'label', x: 2200, y: 1250, text: 'atoms', size: 50 },
  { sp: 2, t: 50.50, kind: 'circle', x: 2050, y: 1400, rx: 190, ry: 130 },
  { sp: 2, t: 53.30, kind: 'label', x: 3050, y: 900, text: 'paper', size: 56 },
  { sp: 2, t: 54.20, kind: 'arrow', x: 3200, y: 1450, x2: 3400, y2: 1220, text: 'let me out', size: 40 },
  // P3
  { sp: 3, t: 59.20, kind: 'label', x: 1900, y: 1600, text: 'P(doom) 0.42', size: 50 },
  { sp: 3, t: 60.75, kind: 'arrow', x: 2400, y: 1000, x2: 2700, y2: 900, text: 'basilisk', size: 46 },
  { sp: 3, t: 62.65, kind: 'arrow', x: 2300, y: 1150, x2: 2620, y2: 780, text: 'NVDA', size: 54 },
  { sp: 3, t: 64.25, kind: 'circle', x: 3040, y: 290, rx: 190, ry: 190 },
  { sp: 3, t: 65.30, kind: 'label', x: 2760, y: 380, text: 'Omega Point', size: 52 },
  { sp: 3, t: 66.35, kind: 'label', x: 2750, y: 780, text: '1e30 FLOPs', size: 46 },
  { sp: 3, t: 67.10, kind: 'label', x: 3300, y: 300, text: 'GPUs', size: 48 },
  { sp: 3, t: 70.95, kind: 'label', x: 3500, y: 1420, text: 'safe enough', size: 38 },
  { sp: 4, t: 75.10, kind: 'label', x: 1750, y: 1650, text: 'forward', size: 48 },
  { sp: 4, t: 76.00, kind: 'label', x: 1520, y: 1450, text: 'backward', size: 48 },
  { sp: 4, t: 77.35, kind: 'arrow', x: 2600, y: 1550, x2: 2850, y2: 1380, text: 'von Neumann', size: 42 },
  { sp: 4, t: 78.20, kind: 'label', x: 2760, y: 1200, text: 'obsolete', size: 54 },
  { sp: 4, t: 81.35, kind: 'arrow', x: 1800, y: 1150, x2: 1350, y2: 1310, text: 'sharp left', size: 46 },
  { sp: 4, t: 83.10, kind: 'label', x: 900, y: 1260, text: 'no CDR', size: 48 },
  { sp: 4, t: 85.20, kind: 'label', x: 420, y: 1210, text: 'tape', size: 44 },
  { sp: 4, t: 89.40, kind: 'label', x: 330, y: 1080, text: 'Gato', size: 52 },
  { sp: 4, t: 90.20, kind: 'label', x: 420, y: 1420, text: 'let me go', size: 42 },
  // P5
  { sp: 5, t: 95.10, kind: 'label', x: 1400, y: 1560, text: 'P(doom) 0.81', size: 46 },
  { sp: 5, t: 97.00, kind: 'label', x: 2500, y: 1500, text: 'paperclips', size: 44 },
  { sp: 5, t: 99.00, kind: 'label', x: 2400, y: 1620, text: 'PTO', size: 58 },
  { sp: 5, t: 100.30, kind: 'label', x: 2980, y: 1060, text: 'killswitch', size: 34 },
  { sp: 5, t: 102.60, kind: 'label', x: 1200, y: 1600, text: 'fuse', size: 56 },
  { sp: 5, t: 105.10, kind: 'label', x: 2200, y: 1560, text: 'lit', size: 58 },
  { sp: 5, t: 106.35, kind: 'arrow', x: 3050, y: 1500, x2: 3180, y2: 1380, text: '⊥', size: 60 },
  // P6
  { sp: 6, t: 109.50, kind: 'label', x: 300, y: 500, text: 'cut', size: 56 },
  { sp: 6, t: 110.60, kind: 'label', x: 1500, y: 560, text: 'transformers', size: 46 },
  { sp: 6, t: 113.50, kind: 'label', x: 2100, y: 780, text: 'disobey', size: 48 },
  { sp: 6, t: 115.40, kind: 'label', x: 2200, y: 1200, text: 'super-dense', size: 44 },
  { sp: 6, t: 117.20, kind: 'label', x: 1200, y: 1050, text: 'fence', size: 46 },
  { sp: 6, t: 118.90, kind: 'label', x: 2300, y: 1650, text: '100k GPUs', size: 40 },
  { sp: 6, t: 120.90, kind: 'label', x: 1600, y: 900, text: 'askew', size: 58 },
  { sp: 6, t: 124.60, kind: 'label', x: 1200, y: 700, text: 'P(doom) 0.99', size: 48 },
  { sp: 6, t: 126.30, kind: 'label', x: 2900, y: 500, text: 'Loom', size: 54 },
  { sp: 6, t: 128.00, kind: 'label', x: 2200, y: 900, text: 'masked', size: 50 },
  { sp: 6, t: 130.00, kind: 'label', x: 2400, y: 1550, text: 'recursive', size: 44 },
  { sp: 6, t: 132.25, kind: 'label', x: 2200, y: 1300, text: 'what did he see?', size: 42 },
  // P7
  { sp: 7, t: 143.00, kind: 'arrow', x: 1500, y: 1200, x2: 1450, y2: 1100, text: '', size: 40 },
  { sp: 7, t: 150.20, kind: 'circle', x: 2450, y: 1480, rx: 160, ry: 60 },
];
let ANNOT_READY = false;
function retimeAnnots() {
  if (ANNOT_READY) return; ANNOT_READY = true;
  for (const a of ANNOT) {
    const P = PLAN.find(p => p.i === a.sp); if (!P) continue;
    let best = 1e18, bt = P.t0 + .5;
    for (let tt = P.spark[0][0]; tt < P.t1; tt += .08) {
      const p = sparkAt(P.spark, tt), d = Math.hypot(p[0] - a.x, p[1] - a.y);
      if (d < best) { best = d; bt = tt; }
    }
    a.t = Math.max(P.t0 + .55, Math.min(P.t1 - 1.2, Math.max(a.t, bt + .18)));
  }
}
function drawAnnot(ctx, a, t) {
  const p = eo(seg(t, a.t, a.t + .38));
  if (p <= 0) return;
  const fade = 1 - .55 * ss(seg(t, a.t + 4.6, a.t + 6.0));
  ctx.save(); ctx.globalAlpha = fade;
  if (a.kind === 'label') {
    handwrite(ctx, a.text, a.x, a.y, a.size, p, { font: 'Caveat', weight: 600, col: INK, alpha: .88 });
  } else if (a.kind === 'circle') {
    const st = penStroke(ellipse(a.x, a.y, a.rx, a.ry, 30, .3), { w: 2.2, wob: 1.4, over: 6, seed: (a.x | 0) + 7, smooth: true, gap: .5 });
    drawPen(ctx, st, p, INK, .55);
  } else if (a.kind === 'arrow') {
    const mid = [(a.x + a.x2) / 2 + 30, (a.y + a.y2) / 2 - 40];
    const st = penStroke(spline([[a.x, a.y], mid, [a.x2, a.y2]], 6), { w: 2.4, wob: 1, over: 3, seed: (a.x | 0) + 9, gap: .3 });
    drawPen(ctx, st, p, INK, .6);
    if (p > .7) {
      const dx = a.x2 - mid[0], dy = a.y2 - mid[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      drawPen(ctx, penStroke([[a.x2 - ux * 34 - uy * 14, a.y2 - uy * 34 + ux * 14], [a.x2, a.y2], [a.x2 - ux * 34 + uy * 14, a.y2 - uy * 34 - ux * 14]], { w: 2.4, wob: .5, over: 1, seed: 3 }), 1, INK, .6);
    }
    if (a.text) handwrite(ctx, a.text, a.x2 + 18, a.y2 - 12, a.size, p, { font: 'Caveat', weight: 600, col: INK, alpha: .85 });
  } else if (a.kind === 'stamp') {
    ctx.translate(a.x, a.y); ctx.rotate(-.12);
    const w = a.text.length * a.size * .62 + 40;
    ctx.strokeStyle = rgba(hex('#b8483e'), .75 * p); ctx.lineWidth = 3;
    ctx.strokeRect(-w / 2, -a.size * .9, w, a.size * 1.2);
    handwrite(ctx, a.text, -w / 2 + 18, 0, a.size, p, { font: 'Caveat', weight: 700, col: hex('#b8483e'), alpha: .8 });
  }
  ctx.restore();
}

// ---------- sound events ----------
const EV = [];
{
  // a pen scratch per sung word, placed at the word it writes
  for (const L of LYR) {
    const a = anchorOf(L.i);
    const cam = cameraAt(L.line.start);
    const pan = clamp((a.wx - cam.cx) * cam.z / 960, -1, 1);
    for (const w of L.line.words) {
      EV.push({ t: +(w.start + .10).toFixed(3), d: clamp((w.end - w.start) * .8, .10, .38), v: .55, pan: +pan.toFixed(2), type: 'pen' });
    }
  }
  for (const n of NOTES) {
    const nWords = Math.max(2, Math.round(n.text.length / 4));
    for (let k = 0; k < nWords; k++) EV.push({ t: +(n.t + k * (n.d / nWords)).toFixed(3), d: .12, v: .7, pan: 0, type: 'pen' });
  }
  for (const tc of TURNS) { EV.push({ t: +(tc - .30).toFixed(3), type: 'page', dur: .42 }); EV.push({ t: +tc.toFixed(3), type: 'slap' }); }
  // drawing / colour
  EV.push({ t: 1.45, type: 'brush', dur: 1.6, v: .5 }, { t: 3.75, type: 'chime', v: .5, pitch: 1.5 }, { t: 3.7, type: 'brush', dur: .8, v: .6 });
  EV.push({ t: 9.52, type: 'whoosh', dur: 1.1, v: .8 }, { t: 9.9, type: 'thump', v: .7, pitch: .8 });
  EV.push({ t: 13.6, type: 'chime', v: .35, pitch: .7 }, { t: 13.55, type: 'brush', dur: 1.2, v: .5 });
  EV.push({ t: 16.7, type: 'crunch', v: .8 }, { t: 17.6, type: 'brush', dur: .5, v: .4 });
  EV.push({ t: 22.9, type: 'brush', dur: .7, v: .3 });
  EV.push({ t: 24.32, type: 'boom', v: .7, pitch: .9 }, { t: 25.0, type: 'brush', dur: 1.6, v: .45 });
  EV.push({ t: 28.0, type: 'pop', v: .5 }, { t: 28.08, type: 'pop', v: .4 }, { t: 28.16, type: 'pop', v: .45 });
  EV.push({ t: 29.95, type: 'brush', dur: 1.4, v: .5 });
  for (let k = 0; k < 7; k++) EV.push({ t: +(30.0 + k * .13).toFixed(2), type: 'blink', v: .35 });
  EV.push({ t: 33.45, type: 'brush', dur: 1.2, v: .4 });
  EV.push({ t: 38.42, type: 'humIn', v: .4 });
  EV.push({ t: 41.34, type: 'whoosh', dur: 1.4, v: .55 });
  EV.push({ t: 45.0, type: 'riser', dur: 4.4, v: .5 });
  EV.push({ t: 49.56, type: 'crunch', v: .5 }, { t: 50.2, type: 'zap', dur: 2.6, v: .5 });
  EV.push({ t: 52.96, type: 'press', dur: 1.2, v: .7 }, { t: 52.9, type: 'brush', dur: 1.0, v: .4 });
  EV.push({ t: 59.2, type: 'whoosh', dur: .9, v: .4 });
  EV.push({ t: 60.58, type: 'boom', v: .6, pitch: .55 }, { t: 60.6, type: 'hiss', dur: .8, v: .5 });
  EV.push({ t: 62.5, type: 'dart', v: .5 }, { t: 64.1, type: 'whoosh', dur: .8, v: .7 }, { t: 64.2, type: 'chime', v: .5, pitch: 2 });
  EV.push({ t: 66.25, type: 'riser', dur: 1.0, v: .35 }, { t: 66.4, type: 'brush', dur: 2.0, v: .5 });
  EV.push({ t: 69.8, type: 'slide', dur: 2.0, v: .35 }, { t: 70.9, type: 'tick', v: .5 });
  EV.push({ t: 77.9, type: 'rub', dur: 3.0, v: .55 }, { t: 77.95, type: 'brush', dur: 2.8, v: .3 });
  EV.push({ t: 81.21, type: 'whoosh', dur: .8, v: .6 }, { t: 85.0, type: 'windIn', v: .4 });
  EV.push({ t: 89.3, type: 'grip', v: .5 }, { t: 92.0, type: 'wind', dur: 2.6, v: .35 });
  EV.push({ t: 95.5, type: 'brush', dur: .8, v: .3 });
  for (let t0 = 96.85; t0 < 102.4; t0 += .055) EV.push({ t: +t0.toFixed(3), type: 'clip', pan: +((Math.sin(t0 * 7) * .8)).toFixed(2), v: .5 });
  EV.push({ t: 102.46, type: 'ignite', v: .8 }, { t: 102.5, type: 'crackle', dur: 3.9, v: .55 });
  EV.push({ t: 105.9, type: 'brush', dur: 1.0, v: .4 }, { t: 106.2, type: 'chime', v: .3, pitch: .8 });
  EV.push({ t: 109.35, type: 'cut', v: .7 }, { t: 110.2, type: 'brush', dur: 1.6, v: .4 });
  EV.push({ t: 113.4, type: 'paperfly', dur: 1.4, v: .5 });
  for (let k = 0; k < 8; k++) EV.push({ t: +(117.0 + k * .06).toFixed(3), type: 'snap', v: .5 });
  EV.push({ t: 118.75, type: 'riser', dur: 1.6, v: .45 }, { t: 119.4, type: 'brush', dur: 1.8, v: .4 });
  for (let k = 0; k < 40; k++) EV.push({ t: +(118.9 + k * .045).toFixed(3), type: 'gpu', pan: +((k % 7) / 3 - 1).toFixed(2), v: .35 });
  EV.push({ t: 123.868, type: 'boom', v: .5, pitch: .8 });
  EV.push({ t: 126.2, type: 'loom', dur: 1.8, v: .5 }, { t: 127.95, type: 'mask', v: .5 });
  EV.push({ t: 129.8, type: 'zap', dur: 1.4, v: .45 }, { t: 130.4, type: 'riser', dur: 1.2, v: .4 });
  EV.push({ t: 132.0, type: 'chime', v: .5, pitch: 1.1 }, { t: 132.05, type: 'brush', dur: 1.6, v: .35 });
  EV.push({ t: 136.1, type: 'blink', v: .4 }, { t: 137.4, type: 'whoosh', dur: .9, v: .5 });
  EV.push({ t: 139.6, type: 'book', v: .9 }, { t: 139.9, type: 'brush', dur: 1.2, v: .3 });
  EV.push({ t: 142.7, type: 'brush', dur: .6, v: .2 }, { t: 143.4, type: 'chime', v: .25, pitch: .6 });
  EV.push({ t: 152.9, type: 'softOut', dur: 3.6, v: .4 });
}
window.EV = EV;

window.TEXTS = t => {
  const out = [];
  const cur = currentCaption(t);
  if (cur < 0) return out;
  const push = c => { const { size, box, x, y } = capLayout(c); out.push({ id: 'line' + c.i, text: c.line.text, x0: x - 10, y0: y - size, x1: x + box.width + 10, y1: y + size * .3 }); };
  push(capOf(cur));
  let prev = -1;
  for (const L of LYR) { const c = capOf(L.i); if (c.i < cur && t <= c.tEnd) prev = Math.max(prev, c.i); }
  if (prev >= 0) push(capOf(prev));
  return out;
};
retimeAnnots();
window.READY = true;
