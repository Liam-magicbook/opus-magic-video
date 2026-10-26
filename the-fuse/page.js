// Pen & wash page builder for the film: static ink (with stroke-order time),
// wash layer, colour-arrival field, page edge, texture packing.
import { rng, fbm, n2, hex, mix3, lerp, clamp, TAU, ellipse, spline, penStroke, rasterPen, wash, reserve, dab, arrivalField, compositor, INK, PAPER } from './engine.js';

export const PW = 3840, PH = 2160;
export const M = 150;              // page margin

// one page = ink/time canvases + colour canvas
export function makePage(o = {}) {
  const W = o.W ?? PW, H = o.H ?? PH;
  const arrival = o.arrival ?? (() => (o.t0 ?? 0) + .4);
  const cv = (fill) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); if (fill) { x.fillStyle = fill; x.fillRect(0, 0, W, H); } return [c, x]; };
  const [colorC, color] = cv('#fff');
  const [inkC, ink] = cv();
  const [timeC, time] = cv('#fff');
  time.globalCompositeOperation = 'darken';
  const t0 = o.t0 ?? 0, dur = o.dur ?? 20;
  const WIN = [t0, dur];
  const strokes = [];
  const R = rng(o.seed ?? 1234);
  const page = {
    W, H, t0, dur, color, colorC, ink, inkC, time, timeC, strokes, R, winA: WIN, winB: [t0 + 1e5, 1],
    // a fineliner stroke, baked with its own draw-on time
    pen(pts, opt = {}, at) {
      const o2 = (opt.w ?? 2.4) < 1.4 ? opt : { ...opt, w: (opt.w ?? 2.4) * 1.16 };
      const st = penStroke(pts, o2); if (st.P.length < 2) return st;
      const tt = at ?? (t0 + .1 + R() * .4);
      const dd = opt.dur ?? clamp(st.L / 2400, .05, .55);
      rasterPen(ink, time, st, tt, dd, WIN);
      strokes.push([+tt.toFixed(3), +dd.toFixed(3), Math.round(st.L)]);
      return st;
    },
    wash: (poly, col, opt) => wash(color, poly, col, opt),
    reserve: (poly, a, j, seed) => reserve(color, poly, a, j, seed),
    dab: (x, y, r, ang, col, a, seed) => dab(color, x, y, r, ang, col, a, seed),
    ellipse, spline,
    inPage: (x, y, m = 0) => edgeMask(W, H, x, y) > m,
    arrivalAt: (x, y) => arrival(x, y),
    // finish: page edge, dabs, texture packing
    finish(edge = {}) {
      const mask = document.createElement('canvas'); mask.width = W; mask.height = H;
      const mx = mask.getContext('2d'); mx.fillStyle = '#fff';
      for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) if (edgeMask(W, H, x, y, edge) < 0) mx.fillRect(x, y, 4, 4);
      const Rm = rng((o.seed ?? 1234) + 7);
      // fray the colour edge into dabs
      for (let i = 0; i < 22000; i++) {
        const x = Rm() * W, y = Rm() * H, m = edgeMask(W, H, x, y, edge);
        if (m > 0 && m < 90 && Rm() < (1 - m / 90) * .55) dab(mx, x, y, 3 + Rm() * 8, Rm() * TAU, [255, 255, 255], .96, i);
      }
      color.save(); color.globalCompositeOperation = 'source-over'; color.drawImage(mask, 0, 0); color.restore();
      for (const c of [ink]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.drawImage(mask, 0, 0); c.restore(); }
      // pigment spray just outside the edge
      color.globalCompositeOperation = 'multiply';
      for (let i = 0; i < 6000; i++) {
        const x = Rm() * W, y = Rm() * H, m = edgeMask(W, H, x, y, edge);
        if (m < 0 && m > -80 && Rm() < (1 + m / 80) * .6) { const k = Rm(); dab(color, x, y, 4 + Rm() * 10, Rm() * TAU, k < .5 ? hex('#b9c09a') : hex('#cbb79a'), .3 + Rm() * .25, 20000 + i); }
      }
      color.globalCompositeOperation = 'source-over';
      return pack(W, H, colorC, inkC, timeC, WIN);
    },
  };
  return page;
}

export function edgeMask(W, H, x, y, o = {}) {
  const m = o.m ?? 90;
  const n = (fbm(x * .0038, y * .0038, 5, 3) - .5) * 170 + (n2(x * .028, y * .028, 8) - .5) * 42;
  const dl = x - m + n, dr = W - m - x + n * .7, dt = y - m + n * .8, db = H - m - y + n;
  return Math.min(dl, dr, dt, db);
}

export function pack(W, H, colorC, inkC, timeC, win) {
  const ink = new Uint8Array(W * H * 4), time = new Uint8Array(W * H * 4);
  const A = inkC.getContext('2d').getImageData(0, 0, W, H).data;
  for (let i = 0, n = W * H; i < n; i++) { ink[i * 4] = A[i * 4 + 3]; ink[i * 4 + 3] = 255; }
  const B = timeC.getContext('2d').getImageData(0, 0, W, H).data;
  for (let i = 0, n = W * H; i < n; i++) { time[i * 4] = B[i * 4]; time[i * 4 + 3] = 255; }
  return { W, H, color: colorC, ink, time, winA: win, winB: [win[0] + 1e5, 1] };
}

export function makeArrival(W, H, sources, o = {}) {
  const gw = o.gw ?? 640, gh = o.gh ?? 360;
  const arr = arrivalField(W, H, gw, gh, sources, { amp: o.amp ?? 220, creep: o.creep ?? .03 });
  return { arr, gw, gh };
}
export { compositor, INK, PAPER, hex, mix3, lerp, clamp, TAU, ellipse, spline, penStroke, rasterPen, wash, reserve, dab, rng, fbm, n2 };
