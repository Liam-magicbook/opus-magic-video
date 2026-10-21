// 复古半调案卷 —— 基础工具（沿用该风格的引擎约定）
export const NS = 'http://www.w3.org/2000/svg';
export const C = {
  paper: '#F4ECDD', navy: '#1D2340', blue: '#2E55D6', pink: '#FF5A87', yellow: '#FFC628',
  cream: '#FFF4E2', red: '#E8384F', night: '#18203F', night2: '#2A3568',
  orange: '#E8794F', ored: '#B8512F', peach: '#F7B08A', mint: '#56C29E', sky: '#7FB6E8',
};
export const F = {
  serif: "'Noto Serif SC'", cute: "'ZCOOL KuaiLe'", bagel: "'Bagel Fat One'",
  mono: "'JetBrains Mono', 'Noto Sans SC'", sans: "'Noto Sans SC'",
};
export const FPS = 30;

export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
export function txt(parent, str, attrs) { const e = el('text', attrs, parent); e.textContent = str; return e; }
export function tf(e, x = 0, y = 0, s = 1, r = 0, sy) {
  e.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${s.toFixed(4)} ${(sy ?? s).toFixed(4)})`);
}
export function op(e, o) { e.setAttribute('opacity', Math.max(0, Math.min(1, o)).toFixed(3)); }
export function show(e, v) { e.style.display = v ? '' : 'none'; }
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, p) => a + (b - a) * p;
export const E = {
  out: p => 1 - Math.pow(1 - p, 3),
  in: p => p * p * p,
  io: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  back: p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
};
export const pop = (t, t0, d = 0.35) => t < t0 ? 0 : E.back(seg(t, t0, t0 + d));
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// 宽度一律用 DOM 量（canvas 与 DOM 的字宽会有十几 px 的差，逐字排就会叠字）
let _mroot = null;
function mroot() {
  if (!_mroot) {
    const svg = document.querySelector('#stage');
    _mroot = el('g', { visibility: 'hidden' }, svg);
  }
  return _mroot;
}
export function measure(str, size, family, weight = 900) {
  const t = el('text', { x: 0, y: 0, 'font-size': size, 'font-family': family, 'font-weight': weight, 'text-anchor': 'start' }, mroot());
  t.textContent = str === ' ' ? '\u00a0' : str;
  const w = t.getComputedTextLength();
  t.remove();
  return w;
}

// 逐字文字（错版阴影）
export function chars(parent, str, o) {
  const { x, y, size, family, weight = 900, fill = C.navy, anchor = 'start', ls = 0, shadow, stroke, sw = 0, maxW,
    halo = fill === C.navy ? C.paper : null } = o;
  const g = el('g', { transform: `translate(${x} ${y})` }, parent);
  const inner = el('g', {}, g);   // 内层承担自动缩放 + 动画，外层固定锚点
  const arr = [...str];
  // 按 advance 排：canvas 与 DOM 的 advance 一致，宽字形（Bagel 的括号）也不会互相压住
  const adv = arr.map(c => measure(c === ' ' ? '\u00a0' : c, size, family, weight));
  const total = adv.reduce((a, b) => a + b, 0) + ls * (arr.length - 1);
  // 组原点 = 锚点，逐字坐标相对原点（这样场景里再 tf(组, …) 不会叠加两次）
  let cx = anchor === 'middle' ? -total / 2 : anchor === 'end' ? -total : 0;
  const items = arr.map((ch, i) => {
    const cg = el('g', {}, inner);
    const base = { 'font-size': size, 'font-family': family, 'font-weight': weight, 'text-anchor': 'middle' };
    if (ch !== ' ') {
      if (shadow) txt(cg, ch, { ...base, x: shadow.dx, y: shadow.dy, fill: shadow.fill, class: 'mul' });
      const st = stroke
        ? { stroke, 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }
        : (halo ? { stroke: halo, 'stroke-width': size * 0.13, 'paint-order': 'stroke', 'stroke-linejoin': 'round' } : {});
      txt(cg, ch, { ...base, x: 0, y: 0, fill, ...st });
    }
    const it = { g: cg, x: cx + adv[i] / 2, y: 0, w: adv[i], size, ch };
    cx += adv[i] + ls;
    tf(cg, it.x, it.y);
    return it;
  });
  // 出血保护：标题超出可用宽度就整体缩，不裁字
  const avail = maxW ?? 1800;
  if (total > avail) {
    const k = avail / total;
    inner.setAttribute('transform', `scale(${k.toFixed(4)})`);
    g.setAttribute('data-fit', k.toFixed(3));
    return { g, inner, items, total: avail, scale: k };
  }
  return { g, inner, items, total };
}

export function charsPop(c, t, t0, stagger = 0.05, d = 0.38, from = 60) {
  c.items.forEach((it, i) => {
    const s = t0 + i * stagger;
    const p = seg(t, s, s + d);
    const h = it.size * 0.35;
    if (t < s) { op(it.g, 0); return; }
    op(it.g, 1);
    const sc = E.back(p);
    const sq = 1 + 0.25 * Math.sin(p * Math.PI) * (1 - p);
    it.g.setAttribute('transform', `translate(${it.x} ${it.y + from * (1 - E.out(p))}) translate(0 ${-h}) scale(${(sc / sq).toFixed(3)} ${(sc * sq).toFixed(3)}) translate(0 ${h})`);
  });
}

// 半调网点
export function halftone(parent, { x0 = 0, y0 = 0, w = 1920, h = 1080, step = 22, angle = 15, color, f, maxK = 0.62 }) {
  const a = angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const n = Math.ceil(Math.hypot(w, h) / step / 2) + 2;
  let d = '';
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    const u = i * step, v = j * step;
    const x = x0 + w / 2 + u * ca - v * sa, y = y0 + h / 2 + u * sa + v * ca;
    if (x < x0 - step || x > x0 + w + step || y < y0 - step || y > y0 + h + step) continue;
    const s = clamp(f(x, y)); if (s < 0.05) continue;
    const r = s * step * maxK;
    d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`;
  }
  return el('path', { d, fill: color }, parent);
}
export const radial = (cx, cy, R, pw = 1.2) => (x, y) => Math.pow(clamp(1 - Math.hypot(x - cx, y - cy) / R), pw);
export const edge = (R = 900, pw = 1.6) => (x, y) => Math.pow(clamp(Math.hypot(x - 960, y - 540) / R - 0.35), pw) * 1.3;
export const rampDown = (y0, y1, a = 0.15, b = 0.9) => (x, y) => lerp(a, b, clamp((y - y0) / (y1 - y0)));

export function bg(parent, color) { return el('rect', { width: 1920, height: 1080, fill: color }, parent); }

// 字幕条（英文唱词 + 中文意译）。字幕统一挂在 capLayer 上，不吃场景里的推镜变形。
let CAP_HOST = null;
let CAP_SCENE = null;
const SCENE_CAPS = new Map();
export function setCaptionHost(e) { CAP_HOST = e; }
export function beginScene(g) { CAP_SCENE = g; SCENE_CAPS.set(g, []); }
export function endScene() { CAP_SCENE = null; }
export function sceneCaps(g) { return SCENE_CAPS.get(g) || []; }
export function caption(parent, { x = 960, y = 968 } = {}) {
  parent = CAP_HOST || parent;
  const g = el('g', {}, parent);
  const inner = el('g', {}, g);
  const c = { g, inner, x, y, parent };
  // 出生就落到最终位置：否则没跑 captionAnim 的字幕会停在 (0,0) 露出一角
  tf(g, x, y, 1, -0.9);
  if (CAP_SCENE) SCENE_CAPS.get(CAP_SCENE).push(c);
  return c;
}
export function setCaption(c, words, zh, { y = null, size = 40, zhFill = C.navy } = {}) {
  if (y != null) c.y = y;
  c.inner.textContent = '';
  if (c.zhG) { c.zhG.remove(); c.zhG = null; }
  const padX = 36;
  const maxW = 1660 - padX * 2;
  // 整行一个 <text>，逐词 tspan —— 排版完全交给浏览器，宽度不会再对不上
  let fs = size;
  const t = el('text', { x: 0, y: fs * 0.35, 'font-size': fs, 'font-family': F.sans, 'font-weight': 900, 'text-anchor': 'middle' }, c.inner);
  c.wEls = words.map((w, i) => {
    const sp = el('tspan', { fill: C.cream }, t);
    sp.textContent = (i ? '\u00a0' : '') + w;
    return sp;
  });
  let bb = t.getBBox();
  if (bb.width > maxW) {
    fs = fs * maxW / bb.width;
    t.setAttribute('font-size', fs.toFixed(1));
    t.setAttribute('y', (fs * 0.35).toFixed(1));
    bb = t.getBBox();
  }
  const tw = bb.width;
  const hgt = fs * 1.62;
  // 字幕条永远不出画：底边留 18px 余量
  c.y = clamp(c.y, 200 + hgt / 2, 1050 - hgt / 2);
  tf(c.g, c.x, c.y, 1, -0.9);
  const back = el('g', {}, c.inner);
  c.inner.insertBefore(back, t.firstChild && t.firstChild.nodeType === 1 ? t : t);
  c.inner.insertBefore(back, t);
  el('rect', { x: -tw / 2 - padX + 8, y: -hgt / 2 + 8, width: tw + padX * 2, height: hgt, rx: 14, fill: C.pink, class: 'mul' }, back);
  el('rect', { x: -tw / 2 - padX, y: -hgt / 2, width: tw + padX * 2, height: hgt, rx: 14, fill: C.navy }, back);
  c.w = tw;
  // 副行（可选）：奶油字 + 墨边，亮场暗场都读得清
  if (!zh) { c.zhG = null; return c; }
  c.zhG = txt(c.parent, zh, { x: c.x, y: c.y - hgt / 2 - 26, 'font-size': Math.max(26, fs * 0.74), 'font-family': F.sans, 'font-weight': 900, fill: C.cream, stroke: C.navy, 'stroke-width': 8, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': 'middle' });
  return c;
}

export function captionAnim(c, t, t0) {
  const p = seg(t, t0, t0 + 0.38);
  if (t < t0) { op(c.g, 0); return; }
  op(c.g, seg(t, t0, t0 + 0.1));
  if (c.zhG) op(c.zhG, seg(t, t0 + 0.08, t0 + 0.26));
  tf(c.g, c.x, c.y + 34 * (1 - E.out(p)), lerp(0.86, 1, E.back(p)), -0.9);
}

// 逐词卡拉 OK：未唱 0.5，已唱 1，当前词高亮
export function karaoke(c, t, line, live = 0, hi = C.yellow, key = []) {
  if (typeof key === 'string') key = [key];
  const keyIdx = key.map(k => typeof k === 'number' ? k : line.words.findIndex(w => w.w.toLowerCase().startsWith(String(k).toLowerCase()))).filter(i => i >= 0);
  const ws = line.words;
  let cur = -1;
  for (let i = 0; i < ws.length; i++) if (t >= ws[i].t0 - 0.04 && t < ws[i].t1 + 0.12) cur = i;
  if (t >= ws[ws.length - 1].t1) cur = ws.length;
  c.wEls.forEach((e, i) => {
    const sung = t >= ws[i].t0 - 0.04;
    const isKey = keyIdx.includes(i);
    e.setAttribute('fill', (i === cur || isKey) ? hi : C.cream);
    op(e, sung ? 1 : (live ? 0.72 : 0.92));
  });
}

// 印章
export function stampEl(parent, str, { size = 180, color = C.red, family = F.sans, padX = 46, padY = 24, border = 12 } = {}) {
  const g = el('g', {}, parent);
  // 印章宽度上限：不超过画面的三分之一多一点，长词自动缩字号
  const maxW = 640;
  const need = measure(str, size, family, 900) + padX * 2;
  if (need > maxW) { const k = (maxW - padX * 2) / measure(str, size, family, 900); size = Math.max(40, size * k); }
  const inner = el('g', { filter: 'url(#stampInk)' }, g);
  const w = measure(str, size, family, 900) + padX * 2, h = size * 1.06 + padY * 2;
  el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 20, fill: 'none', stroke: color, 'stroke-width': border }, inner);
  el('rect', { x: -w / 2 + border * 1.9, y: -h / 2 + border * 1.9, width: w - border * 3.8, height: h - border * 3.8, rx: 10, fill: 'none', stroke: color, 'stroke-width': border * 0.35 }, inner);
  txt(inner, str, { x: 0, y: size * 0.35, 'font-size': size, 'font-family': family, 'font-weight': 900, fill: color, 'text-anchor': 'middle' });
  return { g, w, h };
}
export function stampAnim(s, t, t0, x, y, rot, alpha = 0.93) {
  if (t < t0 - 0.09) { op(s.g, 0); return; }
  const p = seg(t, t0 - 0.09, t0);
  const after = Math.max(0, t - t0);
  const bounce = 1 + 0.05 * Math.sin(after * 30) * Math.exp(-after * 9);
  // 印章必须完整落在画面里（含描边留白）
  const X = clamp(x, s.w / 2 + 60, 1920 - s.w / 2 - 60);
  const Y = clamp(y, s.h / 2 + 60, 1080 - s.h / 2 - 60);
  op(s.g, p < 1 ? 0.35 + 0.65 * p : alpha);
  tf(s.g, X, Y, lerp(2.6, 1, E.in(p)) * bounce, rot);
}

export function heartPath(s = 1) {
  return `M0 ${30 * s}C${-40 * s} 0 ${-50 * s} ${-30 * s} ${-25 * s} ${-45 * s}C${-10 * s} ${-52 * s} 0 ${-40 * s} 0 ${-30 * s}C0 ${-40 * s} ${10 * s} ${-52 * s} ${25 * s} ${-45 * s}C${50 * s} ${-30 * s} ${40 * s} 0 0 ${30 * s}Z`;
}

// 圆角柱（手臂/腿/围栏立柱）
export function capsule(parent, { w = 30, h = 90, fill = C.orange, stroke = C.navy, lw = 7, r = null }) {
  return el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: r ?? w / 2, fill, stroke, 'stroke-width': lw, 'stroke-linejoin': 'round' }, parent);
}

// 复用的道具：回形针、蘑菇、栅栏、机架
export function paperclip(parent, s = 1, color = C.navy) {
  const g = el('g', {}, parent);
  el('path', {
    d: `M ${-14 * s} ${18 * s} L ${-14 * s} ${-22 * s} A ${14 * s} ${14 * s} 0 0 1 ${14 * s} ${-22 * s} L ${14 * s} ${26 * s} A ${9 * s} ${9 * s} 0 0 0 ${32 * s} ${26 * s} L ${32 * s} ${-10 * s}`,
    fill: 'none', stroke: color, 'stroke-width': 7 * s, 'stroke-linecap': 'round',
  }, g);
  return g;
}
export function mushroom(parent, s = 1) {
  const g = el('g', {}, parent);
  el('path', { d: `M ${-11 * s} ${8 * s} Q ${-9 * s} ${34 * s} 0 ${34 * s} Q ${9 * s} ${34 * s} ${11 * s} ${8 * s} Z`, fill: C.cream, stroke: C.navy, 'stroke-width': 6 * s, 'stroke-linejoin': 'round' }, g);
  el('path', { d: `M ${-44 * s} ${10 * s} C ${-44 * s} ${-34 * s} ${-22 * s} ${-46 * s} 0 ${-46 * s} C ${22 * s} ${-46 * s} ${44 * s} ${-34 * s} ${44 * s} ${10 * s} Z`, fill: C.pink, stroke: C.navy, 'stroke-width': 6 * s, 'stroke-linejoin': 'round' }, g);
  for (const [x, y, r] of [[-22, -12, 7], [4, -24, 6], [22, -8, 5]]) el('circle', { cx: x * s, cy: y * s, r: r * s, fill: C.cream }, g);
  return g;
}
