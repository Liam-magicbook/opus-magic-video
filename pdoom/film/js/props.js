// 复用道具：仪表、身高尺、巨型数字、纸张底、机架、裂纹、边缘网点
import { el, txt, tf, op, clamp, lerp, E, seg, halftone, radial, edge, rampDown, C, F, measure, paperclip, stampEl, mushroom } from './lib.js';

let _uid = 0;

// —— 纸张底 + 网点层 ——
export function paperBg(g, { halos = [[C.yellow, 1500, 520, 700, 0.68], [C.blue, 1900, 60, 380, 0.6]] } = {}) {
  el('rect', { width: 1920, height: 1080, fill: C.paper }, g);
  halos.forEach((h, i) => {
    const [color, cx, cy, R, k] = h;
    const p = halftone(g, { color, step: 22, angle: i ? 60 : 15, f: radial(cx, cy, R, 1.05), maxK: k });
    if (i) p.setAttribute('class', 'mul');
  });
}
export function nightBg(g, { dots = C.night2 } = {}) {
  el('rect', { width: 1920, height: 1080, fill: C.night }, g);
  halftone(g, { color: dots, step: 24, angle: 20, f: edge(700, 1.1), maxK: 0.72 });
}

// —— 巨型半调数字（出血） ——
export function bigNumeral(g, str, { x = 1920, y = 830, size = 760, fill = C.yellow, ink = C.pink, anchor = 'end', angle = 25, id } = {}) {
  const uid = id || ('bn' + (++_uid));
  const clip = el('clipPath', { id: uid }, g);
  txt(clip, str, { x, y, 'font-size': size, 'font-family': F.bagel, 'text-anchor': anchor });
  txt(g, str, { x, y, 'font-size': size, 'font-family': F.bagel, fill, 'text-anchor': anchor });
  const hg = el('g', { 'clip-path': `url(#${uid})` }, g);
  halftone(hg, { color: ink, step: 20, angle, f: rampDown(y - size * 0.85, y + size * 0.05, 0.12, 0.86), maxK: 0.7 });
  return g;
}

// —— 身高尺 ——
export function heightChart(g, { x = 150, y0 = 150, y1 = 960, w = 1620, labels = 'both' } = {}) {
  const cm = el('g', {}, g);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const y = y0 + (y1 - y0) * i / (n - 1);
    el('line', { x1: x, x2: x + w, y1: y, y2: y, stroke: C.navy, 'stroke-width': i % 2 ? 2 : 4, opacity: 0.42 }, cm);
    if (i % 2 === 0) {
      if (labels !== 'right') txt(cm, `${80 - i * 10}`, { x: x - 34, y: y + 9, 'font-size': 26, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, 'text-anchor': 'end', opacity: .7 });
      if (labels !== 'left') txt(cm, `${80 - i * 10}`, { x: x + w + 34, y: y + 9, 'font-size': 26, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, opacity: .7 });
    }
  }
  txt(cm, 'cm', { x: x + w + 34, y: y0 - 26, 'font-size': 22, 'font-family': F.mono, 'font-weight': 500, fill: C.navy, opacity: .6 });
  return cm;
}

// —— P(doom) 仪表 ——
export function gauge(parent, { cx = 960, cy = 800, R = 320, dark = false, label = 'P(doom)' } = {}) {
  const g = el('g', {}, parent);
  const ink = dark ? C.cream : C.navy;
  // 表盘（半圆）
  el('path', { d: `M ${cx - R - 54} ${cy} A ${R + 54} ${R + 54} 0 0 1 ${cx + R + 54} ${cy} Z`, fill: dark ? '#141A33' : C.cream, stroke: ink, 'stroke-width': 8, 'stroke-linejoin': 'round' }, g);
  // 红线区
  el('path', { d: `M ${cx + R * 0.66} ${cy - R * 0.75} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`, fill: 'none', stroke: C.red, 'stroke-width': 24 }, g);
  // 刻度（数字放在弧外）
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI + Math.PI * i / 20;
    const big = i % 5 === 0;
    const r0 = R * (big ? 0.80 : 0.86), r1 = R * 0.97;
    el('line', { x1: cx + Math.cos(a) * r0, y1: cy + Math.sin(a) * r0, x2: cx + Math.cos(a) * r1, y2: cy + Math.sin(a) * r1, stroke: ink, 'stroke-width': big ? 8 : 4, 'stroke-linecap': 'round' }, g);
  }
  el('text', { x: cx - R - 96, y: cy + 14, 'font-size': 40, 'font-family': F.mono, 'font-weight': 800, fill: ink, 'text-anchor': 'middle' }, g).textContent = '0';
  el('text', { x: cx, y: cy - R - 82, 'font-size': 40, 'font-family': F.mono, 'font-weight': 800, fill: ink, 'text-anchor': 'middle' }, g).textContent = '0.5';
  el('text', { x: cx + R + 96, y: cy + 14, 'font-size': 40, 'font-family': F.mono, 'font-weight': 800, fill: ink, 'text-anchor': 'middle' }, g).textContent = '1.0';
  txt(g, label, { x: cx, y: cy - R * 0.56, 'font-size': 52, 'font-family': F.bagel, fill: dark ? C.yellow : C.navy, 'text-anchor': 'middle' });
  // 读数放在表盘下方的空白里，指针扫不到
  el('rect', { x: cx - 150, y: cy + 34, width: 300, height: 104, rx: 10, fill: dark ? C.night : C.cream, stroke: dark ? C.cream : C.navy, 'stroke-width': 4 }, g);
  const read = txt(g, '0.00', { x: cx, y: cy + 118, 'font-size': 92, 'font-family': F.mono, 'font-weight': 800, fill: C.red, 'text-anchor': 'middle' });
  // 指针
  const needle = el('g', {}, g);
  el('path', { d: `M -24 14 L ${R * 0.80} 0 L -24 -14 Z`, fill: C.red, stroke: ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, needle);
  el('circle', { cx: 0, cy: 0, r: 32, fill: dark ? C.cream : C.navy, stroke: dark ? C.navy : C.cream, 'stroke-width': 8 }, needle);
  // 裂纹（随参数逐段画出）
  const cracks = [];
  const cr = (() => { let s = 5; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  for (let k = 0; k < 4; k++) {
    const a0 = Math.PI + 0.5 + k * 0.55;
    let x = cx + Math.cos(a0) * 40, y = cy + Math.sin(a0) * 40, ang = a0;
    let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    for (let i = 0; i < 4; i++) {
      ang += (cr() - 0.5) * 0.7;
      const st = 40 + cr() * 60;
      x += Math.cos(ang) * st; y += Math.sin(ang) * st;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    cracks.push(el('path', { d, fill: 'none', stroke: ink, 'stroke-width': 4, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1', 'stroke-dashoffset': 1 }, g));
  }
  return {
    g, needle, read, cracks,
    set(v, t = 0, crack = 0) {
      const a = Math.PI + Math.PI * clamp(v);
      needle.setAttribute('transform', `translate(${cx} ${cy}) rotate(${(a * 180 / Math.PI).toFixed(2)})`);
      read.textContent = v.toFixed(2);
      cracks.forEach((p, i) => p.setAttribute('stroke-dashoffset', (1 - clamp((crack - i * 0.2) * 2.4)).toFixed(3)));
    },
  };
}

// —— 机架墙 ——
export function rackWall(g, { x0 = 0, y0 = 0, w = 1920, h = 1080, cols = 7, rows = 3, dark = true } = {}) {
  const grp = el('g', {}, g);
  const ink = dark ? C.cream : C.navy;
  const bw = w / cols, bh = h / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = x0 + c * bw, y = y0 + r * bh;
    // 机柜：一个深色壳 + 若干 1U 单元，单元上有点灯（不是彩条墙）
    el('rect', { x: x + 8, y: y + 8, width: bw - 16, height: bh - 16, rx: 8, fill: dark ? '#101733' : C.cream, stroke: ink, 'stroke-width': 6 }, grp);
    const uh = (bh - 40) / 9;
    for (let i = 0; i < 9; i++) {
      el('rect', { x: x + 22, y: y + 22 + i * uh, width: bw - 44, height: uh - 5, rx: 3, fill: dark ? '#1B2244' : '#E4D6BE', stroke: ink, 'stroke-width': 1.5, opacity: .9 }, grp);
      // 面板上的指示灯
      for (let k = 0; k < 4; k++) {
        const col = (i + k) % 4 === 0 ? C.yellow : ((i + c + k) % 3 ? C.mint : C.pink);
        el('circle', { cx: x + 38 + k * 15, cy: y + 22 + i * uh + (uh - 5) / 2, r: 4.4, fill: col, opacity: .85 }, grp);
      }
      // 散热缝
      el('rect', { x: x + bw * 0.45, y: y + 22 + i * uh + (uh - 5) * 0.34, width: bw * 0.4, height: (uh - 5) * 0.3, rx: 2, fill: dark ? '#0C1024' : '#CDBC9E' }, grp);
    }
  }
  return grp;
}

// —— 边缘网点收拢（恐惧） ——
export function edgeCrowd(parent, { color = C.navy, ink = C.paper, step = 20 } = {}) {
  const g = el('g', {}, parent);
  const bands = [];
  const mk = (x0, y0, w, h, fn, ang) => {
    const gg = el('g', {}, g);
    const clipId = 'ec' + (++_uid);
    const cp = el('clipPath', { id: clipId }, g);
    el('rect', { x: x0, y: y0, width: w, height: h }, cp);
    const inner = el('g', { 'clip-path': `url(#${clipId})` }, gg);
    halftone(inner, { x0, y0, w, h, color, step, angle: ang, f: fn, maxK: 0.7 });
    bands.push(gg);
    return gg;
  };
  mk(0, 0, 1920, 300, (x, y) => Math.pow(clamp(1 - y / 300), 1.4), 20);
  mk(0, 780, 1920, 300, (x, y) => Math.pow(clamp((y - 780) / 300), 1.4), 20);
  mk(0, 0, 340, 1080, (x, y) => Math.pow(clamp(1 - x / 340), 1.4), 70);
  mk(1580, 0, 340, 1080, (x, y) => Math.pow(clamp((x - 1580) / 340), 1.4), 70);
  return { g, bands };
}

// —— 纯色块面板 ——
export function panel(parent, { x = 0, y = 0, w = 400, h = 300, r = 14, fill = C.cream, stroke = C.navy, lw = 6, shadow = true }) {
  const g = el('g', {}, parent);
  if (shadow) el('rect', { x: x + 9, y: y + 9, width: w, height: h, rx: r, fill: C.navy, opacity: .22, class: 'mul' }, g);
  el('rect', { x, y, width: w, height: h, rx: r, fill, stroke, 'stroke-width': lw, 'stroke-linejoin': 'round' }, g);
  return g;
}

// —— 星爆 ——
export function starburst(parent, { r1 = 120, r2 = 190, points = 22, fill = C.yellow, ink = C.navy, label, size = 100 } = {}) {
  const g = el('g', {}, parent);
  let d = '';
  for (let i = 0; i < points; i++) {
    const a = i / points * Math.PI * 2, rr = i % 2 ? r1 : r2;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
  }
  el('path', { d: d + 'Z', fill, stroke: ink, 'stroke-width': 7, 'stroke-linejoin': 'round' }, g);
  if (label) txt(g, label, { x: 6, y: size * 0.34, 'font-size': size, 'font-family': F.cute, fill: C.red, 'text-anchor': 'middle' });
  return g;
}

// —— 说话气泡 ——
export function bubble(parent, { x = 0, y = 0, w = 300, h = 130, tail = 'bl', fill = C.cream } = {}) {
  const g = el('g', {}, parent);
  el('path', { d: `M ${tail === 'bl' ? -w * 0.2 : w * 0.2} ${h / 2 - 4} L ${tail === 'bl' ? -w * 0.3 : w * 0.3} ${h / 2 + 70} L ${tail === 'bl' ? -w * 0.02 : w * 0.02} ${h / 2 - 4} Z`, fill, stroke: C.navy, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
  el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 28, fill, stroke: C.navy, 'stroke-width': 6 }, g);
  el('rect', { x: -w * 0.2, y: h / 2 - 9, width: w * 0.4, height: 16, fill }, g);
  return g;
}

// —— 人形（「你」） ——
export function tinyPerson(parent, { skin = C.peach } = {}) {
  const g = el('g', {}, parent);
  el('circle', { cx: 0, cy: -96, r: 34, fill: skin, stroke: C.navy, 'stroke-width': 6 }, g);
  el('path', { d: 'M -34 -60 Q 0 -74 34 -60 L 40 30 Q 0 46 -40 30 Z', fill: C.blue, stroke: C.navy, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
  el('line', { x1: -18, y1: 34, x2: -22, y2: 92, stroke: C.navy, 'stroke-width': 14, 'stroke-linecap': 'round' }, g);
  el('line', { x1: 18, y1: 34, x2: 22, y2: 92, stroke: C.navy, 'stroke-width': 14, 'stroke-linecap': 'round' }, g);
  return g;
}

// —— 折线图 ——
export function chart(parent, { x = 0, y = 0, w = 700, h = 380, pts = [], color = C.navy, lw = 10, fill } = {}) {
  const g = el('g', { transform: `translate(${x} ${y})` }, parent);
  el('line', { x1: 0, y1: 0, x2: 0, y2: h, stroke: C.navy, 'stroke-width': 4, opacity: .4 }, g);
  el('line', { x1: 0, y1: h, x2: w, y2: h, stroke: C.navy, 'stroke-width': 4, opacity: .4 }, g);
  let d = '';
  pts.forEach(([px, py], i) => { d += `${i ? 'L' : 'M'}${(px * w).toFixed(1)} ${(h - py * h).toFixed(1)}`; });
  if (fill) el('path', { d: d + ` L ${pts[pts.length - 1][0] * w} ${h} L 0 ${h} Z`, fill, opacity: .35 }, g);
  const path = el('path', { d, fill: 'none', stroke: color, 'stroke-width': lw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1', 'stroke-dashoffset': 1 }, g);
  return { g, path };
}
export function drawOn(path, p) { path.setAttribute('stroke-dashoffset', (1 - clamp(p)).toFixed(3)); }

// —— 打字机文本 ——
export function typeline(parent, str, attrs, t, t0, cps = 40) {
  const n = clamp(Math.floor((t - t0) * cps), 0, str.length);
  parent.textContent = str.slice(0, n);
  return n;
}

// —— 一条被红线划掉的清单 ——
export function checklist(parent, items, { x = 0, y = 0, gap = 96, size = 56, w = 760 } = {}) {
  const g = el('g', {}, parent);
  const rows = items.map((s, i) => {
    const rg = el('g', {}, g);
    el('rect', { x: -14, y: -34, width: 56, height: 56, rx: 6, fill: 'none', stroke: C.navy, 'stroke-width': 5 }, rg);
    txt(rg, s, { x: 62, y: 14, 'font-size': size, 'font-family': F.sans, 'font-weight': 900, fill: C.navy });
    // 叉划在文字上，宽 = 文字实际宽 + 两侧余量
    const tw = Math.min(w, measure(s, size, F.sans, 900)) + 30;
    // dashoffset 必须写在 <line> 上（写在 <g> 上不会继承给描边）
    const cross = el('line', { x1: 30, y1: -14, x2: 30 + tw, y2: -2, stroke: C.red, 'stroke-width': 10, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1', 'stroke-dashoffset': 1 }, rg);
    const bad = txt(rg, '×', { x: 30 + tw + 20, y: 22, 'font-size': 56, 'font-family': F.bagel, fill: C.red });
    return { g: rg, cross, bad, y: y + i * gap };
  });
  return { g, rows, gap, x, y };
}

// —— 桌面上的案卷（结尾拉远） ——
export function deskFiles(parent, { cols = 9, rows = 7, dx = 620, dy = 520, spread = 40, seed = 3 } = {}) {
  const g = el('g', {}, parent);
  const r = (() => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  const cells = [];
  const FW = dx * 0.68, FH = dy * 0.58;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const cg = el('g', {}, g);
    const x = ((i - (cols - 1) / 2) * dx + (r() - 0.5) * spread) - FW / 2;
    const y = ((j - (rows - 1) / 2) * dy + (r() - 0.5) * spread) - FH / 2;
    const rot = (r() - 0.5) * 16;
    el('rect', { x: x + 10, y: y + 12, width: FW, height: FH, rx: 6, fill: C.navy, opacity: .16 }, cg);
    el('rect', { x, y, width: FW, height: FH, rx: 6, fill: C.yellow, stroke: C.navy, 'stroke-width': 5 }, cg);
    el('path', { d: `M ${x + 10} ${y + FH * 0.14} L ${x + FW * 0.34} ${y + FH * 0.14} L ${x + FW * 0.42} ${y + FH * 0.04} L ${x + FW * 0.72} ${y + FH * 0.04} L ${x + FW * 0.80} ${y + FH * 0.14} L ${x + FW - 10} ${y + FH * 0.14}`, fill: 'none', stroke: C.navy, 'stroke-width': 5, 'stroke-linejoin': 'round' }, cg);
    el('rect', { x: x + FW * 0.09, y: y + FH * 0.50, width: FW * 0.56, height: FH * 0.22, fill: C.cream, stroke: C.navy, 'stroke-width': 4 }, cg);
    txt(cg, `No.${String(1 + j * cols + i).padStart(4, '0')}`, { x: x + FW * 0.13, y: y + FH * 0.65, 'font-size': FW * 0.072, 'font-family': F.mono, 'font-weight': 800, fill: C.navy });
    el('circle', { cx: x + FW * 0.78, cy: y + FH * 0.72, r: FW * 0.075, fill: 'none', stroke: C.red, 'stroke-width': 4, opacity: .7 }, cg);
    cg.setAttribute('transform', `rotate(${rot.toFixed(2)} ${(x + FW / 2).toFixed(1)} ${(y + FH / 2).toFixed(1)})`);
    cells.push({ g: cg, rot, x: x + FW / 2, y: y + FH / 2 });
  }
  return { g, cells };
}

export { paperclip, stampEl, mushroom };
