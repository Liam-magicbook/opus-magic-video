// 第三幕：加速 —— 58.417 到 109.323 s（副歌 2、月球、欧米伽点、歪印章、循环、急左转、清单、别放手、副歌 3、回形针、角落、引线、正交）
import {
  C, F, el, txt, tf, op, show, clamp, seg, lerp, E, pop, rng, chars, charsPop, halftone, radial, edge,
  bg, caption, setCaption, karaoke, captionAnim, stampEl, stampAnim, heartPath, capsule
} from './lib.js';
import { paperBg, nightBg, bigNumeral, panel, starburst, bubble, edgeCrowd, chart, drawOn, gauge, mushroom, paperclip, rackWall, checklist, tinyPerson } from './props.js';
import { clawdSit, clawdPeek, clawdWalk, walkCycle, clawdLoaf, clawdCurl, setFace, blinkAt, CLAWD , armTo } from './clawd.js';
import { LY } from './lyrics.js';

const L = i => LY[i];

export default function scenesC(scene) {
  // ——— 16 · 仪表 #2 58.417 – 60.58 ———
  scene(58.417, 60.58, (g) => {
    bg(g, C.navy);
    halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(680, 1.05), maxK: 0.74 });
    const gg = gauge(g, { cx: 960, cy: 780, R: 288, dark: true });
    const h = chars(g, 'P(doom) UP · 2', { x: 960, y: 250, size: 96, family: F.serif, fill: C.cream, anchor: 'middle', shadow: { fill: C.pink, dx: 9, dy: 9 } });
    const read = txt(g, '0.79', { x: 1620, y: 250, 'font-size': 96, 'font-family': F.mono, 'font-weight': 800, fill: C.red, 'text-anchor': 'end' });
    const cap = caption(g, { y: 972, size: 40 });
    setCaption(cap, ["I'm", 'upping', 'my', 'P(doom)'], null, { size: 40 });
    return (t) => {
      charsPop(h, t, 58.5, 0.05, 0.34, 60);
      const v = t < 59.13 ? 0 : lerp(0.62, 0.79, E.back(seg(t, 59.13, 59.45)));
      gg.set(v, t, seg(t, 59.9, 60.5));
      op(read, seg(t, 59.3, 59.5));
      captionAnim(cap, t, 58.52);
      karaoke(cap, t, L(17), 1, C.pink);
    };
  });

  // ——— 17 · 蛇怪 60.58 – 62.54 ———
  scene(60.58, 62.54, (g) => {
    bg(g, C.night);
    halftone(g, { color: C.night2, step: 22, angle: 30, f: radial(620, 600, 900, 0.7), maxK: 0.7 });
    // 身体：一条粗曲线，网点填充
    const snakeClip = el('clipPath', { id: 'snakeClip' }, g);
    el('path', { d: 'M 1900 900 C 1400 940 1200 700 900 720 C 620 740 560 520 700 420 C 820 336 980 380 1010 470', fill: 'none', stroke: '#fff', 'stroke-width': 170, 'stroke-linecap': 'round' }, snakeClip);
    const body = el('g', { 'clip-path': 'url(#snakeClip)' }, g);
    halftone(body, { step: 18, angle: 20, color: C.night2, f: () => 1, maxK: 0.7 });
    halftone(body, { step: 20, angle: 60, color: C.blue, f: () => 0.5, maxK: 0.5 }).setAttribute('class', 'mul');
    // 头
    const head = el('g', {}, g);
    el('path', { d: 'M 900 500 C 940 380 1080 340 1170 400 C 1250 452 1250 560 1180 600 C 1100 646 940 610 900 500 Z', fill: C.blue, stroke: C.navy, 'stroke-width': 9 }, head);
    el('path', { d: 'M 1180 600 C 1250 640 1260 720 1200 760 C 1120 810 1010 760 980 700 Z', fill: C.yellow }, head);
    el('path', { d: 'M 1180 600 C 1250 640 1260 720 1200 760 C 1120 810 1010 760 980 700 Z', fill: 'none', stroke: C.navy, 'stroke-width': 9 }, head);
    for (let i = 0; i < 5; i++) el('path', { d: `M ${1000 + i * 40} 706 L ${1020 + i * 40} 762 L ${1040 + i * 40} 704 Z`, fill: C.cream, stroke: C.navy, 'stroke-width': 5 }, head);
    for (const x of [1040, 1120]) {
      el('ellipse', { cx: x, cy: 440, rx: 26, ry: 30, fill: C.yellow, stroke: C.navy, 'stroke-width': 6 }, head);
      el('rect', { x: x - 7, y: 415, width: 14, height: 50, rx: 7, fill: C.red }, head);
    }
    const boom = chars(g, 'BOOM', { x: 1450, y: 400, size: 230, family: F.cute, weight: 400, fill: C.yellow, stroke: C.navy, sw: 16, anchor: 'middle' });
    const cap = caption(g, { y: 972, size: 38 });
    setCaption(cap, ['I', 'hear', 'the', 'basilisk', 'boom'], null, { size: 40 });
    return (t) => {
      // 蛇头一点点探向镜头
      const z = lerp(1, 1.12, E.in(seg(t, 60.58, 62.5)));
      tf(g, 960 - 960 * z, 620 - 620 * z, z);
      head.setAttribute('transform', `rotate(${Math.sin(t * 7) * 3} 1080 500)`);
      charsPop(boom, t, 61.05, 0.1, 0.4, 40);
      if (t > 61.5) boom.items.forEach((it, i) => it.g.setAttribute('transform', `translate(${it.x} ${it.y + Math.sin(t * 30 + i) * 6})`));
      captionAnim(cap, t, 60.66);
      karaoke(cap, t, L(18), 1, C.yellow);
    };
  });

  // ——— 18 · NKDA 月球 62.54 – 64.10 ———
  scene(62.54, 64.1, (g) => {
    paperBg(g, { halos: [[C.blue, 1500, 220, 620, 0.5], [C.yellow, 240, 880, 500, 0.55]] });
    const moon = el('g', {}, g);
    el('circle', { cx: 0, cy: 0, r: 140, fill: C.yellow, stroke: C.navy, 'stroke-width': 9 }, moon);
    halftone(moon, { x0: -150, y0: -150, w: 300, h: 300, color: C.orange, step: 16, angle: 30, f: (x, y) => Math.hypot(x, y) < 140 ? clamp((x + 140) / 280) * 0.85 : 0, maxK: 0.62 });
    for (const [x, y, r] of [[-52, -40, 22], [40, 44, 28], [62, -60, 14]]) el('circle', { cx: x, cy: y, r, fill: 'none', stroke: C.ored, 'stroke-width': 5, opacity: .5 }, moon);
    const chart2 = panel(g, { x: 110, y: 560, w: 1200, h: 380, fill: C.cream });
    // panel() 只画底板，内部子元素吃绝对坐标
    const cg = chart(chart2, { x: 160, y: 600, w: 1100, h: 280, color: C.red, lw: 12, fill: C.pink, pts: [[0, .12], [.16, .18], [.3, .15], [.44, .3], [.58, .42], [.7, .58], [.82, .82], [1, 1.04]] });
    txt(chart2, 'NVDA', { x: 170, y: 656, 'font-size': 44, 'font-family': F.mono, 'font-weight': 800, fill: C.navy });
    const arrow = el('path', { d: 'M 0 0 L 40 -26 L 40 26 Z', fill: C.red, stroke: C.navy, 'stroke-width': 5 }, g);
    const h1 = chars(g, 'TO THE', { x: 120, y: 232, size: 132, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 }, maxW: 720 });
    const h2 = chars(g, 'MOON', { x: 120, y: 382, size: 132, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 }, maxW: 720 });
    const cap = caption(g, { y: 968, size: 42 });
    setCaption(cap, ['NVDA', 'to', 'the', 'moon'], null, { size: 42 });
    return (t) => {
      tf(moon, 1596, 512, E.back(seg(t, 62.54, 62.9)));
      drawing: drawOn(cg.path, E.io(seg(t, 62.6, 63.7)));
      charsPop(h1, t, 62.9, 0.07);
      charsPop(h2, t, 63.16, 0.07);
      const p = seg(t, 62.8, 63.8);
      tf(arrow, lerp(140, 1480, E.in(p)) , lerp(830, 330, E.in(p)), 1, -58);
      captionAnim(cap, t, 62.62);
      karaoke(cap, t, L(19), 1, C.yellow);
    };
  });

  // ——— 19 · 欧米伽点 64.10 – 66.22 ———
  scene(64.1, 66.22, (g) => {
    bg(g, C.navy);
    halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(640, 1.0), maxK: 0.74 });
    const rays = el('g', {}, g);
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * Math.PI * 2;
      const l = el('line', { x1: Math.cos(a) * 240, y1: Math.sin(a) * 240, x2: Math.cos(a) * 900, y2: Math.sin(a) * 900, stroke: i % 2 ? C.yellow : C.pink, 'stroke-width': i % 2 ? 6 : 3 }, rays);
    }
    const rings = [0, 1, 2].map(i => el('circle', { cx: 0, cy: 0, r: 300 + i * 90, fill: 'none', stroke: i === 0 ? C.cream : C.pink, 'stroke-width': i === 0 ? 9 : 4, opacity: .8 }, g));
    const core = el('circle', { cx: 0, cy: 0, r: 0, fill: C.yellow, stroke: C.navy, 'stroke-width': 8 }, g);
    const h = chars(g, 'OMEGA POINT', { x: 960, y: 214, size: 88, family: F.mono, weight: 800, fill: C.cream, anchor: 'middle', ls: 10 });
    const cnt = txt(g, '0', { x: 232, y: 916, 'font-size': 92, 'font-family': F.bagel, fill: C.yellow, 'text-anchor': 'middle' });
    const cap = caption(g, { y: 968, size: 36 });
    setCaption(cap, ["The", 'Omega', "Point's", 'coming', 'soon'], null, { size: 40 });
    return (t) => {
      tf(rays, 960, 540); rays.setAttribute('transform', `translate(960 540) rotate(${(t - 64.1) * 12})`);
      rings.forEach((r, i) => {
        const p = clamp((t - 64.1) * 0.6 - i * 0.2);
        r.setAttribute('r', (120 + 720 * E.in(p) * (1 - 0.85 * p) + 60 * Math.sin(p * 6)).toFixed(1));
        op(r, p > 0 && p < 1 ? 1 - p * 0.6 : 0);
      });
      core.setAttribute('r', (10 + 90 * E.in(seg(t, 64.2, 66.0))).toFixed(1));
      tf(core, 0, 0); core.setAttribute('cx', 0); core.setAttribute('cy', 0);
      tg: 0;
      core.setAttribute('transform', 'translate(960 540)');
      charsPop(h, t, 64.2, 0.04, 0.3, 40);
      cnt.textContent = (t < 65 ? '10⁹' : t < 65.6 ? '10¹⁵' : '10³⁰');
      captionAnim(cap, t, 64.18);
      karaoke(cap, t, L(20), 1, C.pink);
    };
  });

  // ——— 20 · 10^30 FLOPs 66.22 – 69.76 ———
  scene(66.22, 69.76, (g) => {
    bg(g, C.paper);
    const wall = rackWall(g, { cols: 8, rows: 3, dark: true });
    op(wall, 0.55);
    halftone(g, { color: C.pink, step: 22, angle: 60, f: radial(1800, 980, 620, 1.1), maxK: 0.6 }).setAttribute('class', 'mul');
    // 10 的 30 次方
    // 注意：组内一律相对坐标，translate 由 tf() 统一加
    const big = el('g', {}, g);
    const bigShadow = txt(big, '10', { x: 18, y: 74, 'font-size': 420, 'font-family': F.bagel, fill: C.navy, 'text-anchor': 'middle', class: 'mul' });
    const num = txt(big, '10', { x: 0, y: 54, 'font-size': 420, 'font-family': F.bagel, fill: C.yellow, 'text-anchor': 'middle' });
    const sup = el('text', { x: 210, y: -240, 'font-size': 190, 'font-family': F.bagel, fill: C.red }, big);
    sup.textContent = '30';
    el('rect', { x: 660, y: 826, width: 600, height: 62, rx: 8, fill: C.paper, stroke: C.navy, 'stroke-width': 4 }, g);
    const sub = txt(g, 'FLOPs / second', { x: 960, y: 872, 'font-size': 42, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, 'text-anchor': 'middle', 'letter-spacing': 5 });
    const catG = el('g', {}, g);
    const cat = clawdSit(catG, { legs: false });
    const cap = caption(g, { y: 968, size: 36 });
    setCaption(cap, ['One', 'E', 'thirty', 'FLOPs', 'a', 'second'], null, { size: 38 });
    return (t) => {
      const z = lerp(1, 1.05, E.io(seg(t, 66.22, 69.76)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      const p = pop(t, 66.28, 0.4);
      tf(big, 900, 620, p * (1 + 0.012 * Math.sin(t * 12)), Math.sin(t * 3) * 0.5);
      tf(catG, 1640, 1040, 0.66);
      setFace(cat.head, { open: 1, lookY: -10, lookX: -8, mood: 'squint' });
      cat.arms.forEach(a => tf(a.g, a.x, a.y, 1, -20));
      captionAnim(cap, t, 66.3);
      karaoke(cap, t, L(21), 1, C.yellow);
    };
  });

  // ——— 21 · 够安全了 69.76 – 74.779 ———
  scene(69.76, 74.779, (g) => {
    paperBg(g, { halos: [[C.yellow, 1500, 560, 700, 0.6], [C.pink, 120, 200, 500, 0.5]] });
    // 备忘录
    const memo = panel(g, { x: 250, y: 260, w: 800, h: 520, fill: C.cream });
    txt(memo, 'INTERNAL MEMO', { x: 300, y: 330, 'font-size': 26, 'font-family': F.mono, 'font-weight': 800, fill: C.pink });
    txt(memo, 'RISK REVIEW', { x: 300, y: 420, 'font-size': 62, 'font-family': F.serif, 'font-weight': 900, fill: C.navy });
    for (let i = 0; i < 4; i++) el('rect', { x: 300, y: 470 + i * 42, width: [660, 600, 520, 400][i], height: 16, rx: 8, fill: C.navy, opacity: .16 }, memo);
    txt(memo, 'Verdict: safe enough.', { x: 300, y: 700, 'font-size': 46, 'font-family': F.sans, 'font-weight': 900, fill: C.navy });
    const st = stampEl(g, 'SAFE ENOUGH', { size: 150, color: C.red, border: 13, padX: 40 });
    const h1 = chars(g, 'we reckoned it was safe enough', { x: 960, y: 960, size: 76, family: F.serif, fill: C.navy, anchor: 'middle' });
    const cap = caption(g, { y: 968, size: 36 });
    setCaption(cap, ['That', 'was', 'safe', 'enough,', 'we', 'reckoned'], null, { size: 38 });
    return (t) => {
      const z = lerp(1, 1.06, E.io(seg(t, 69.76, 74.779)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      op(memo, seg(t, 69.8, 70.1)); tf(memo, 0, 30 * (1 - E.out(seg(t, 69.8, 70.15))), 1, -1);
      stampAnim(st, t, 70.34, 1450, 520, 12);
      // 印章滑落：72.3 起打滑、掉出画面
      const slip = E.in(seg(t, 72.3, 73.2));
      if (slip > 0) st.g.setAttribute('transform', `translate(${(1450 + 900 * slip).toFixed(1)} ${(520 + 380 * slip * slip).toFixed(1)}) rotate(${(12 + 46 * slip).toFixed(1)}) scale(${lerp(1, 0.9, slip).toFixed(3)})`);
      charsPop(h1, t, 72.4, 0.04, 0.3, 40);
      captionAnim(cap, t, 69.84);
      karaoke(cap, t, L(22), 1, C.pink);
    };
  });

  // ——— 22 · 前向/反向循环 74.779 – 77.72 ———
  scene(74.779, 77.72, (g) => {
    bg(g, C.paper);
    halftone(g, { color: C.blue, step: 24, angle: 20, f: edge(880, 1.5), maxK: 0.6 }).setAttribute('class', 'mul');
    const loop = el('g', {}, g);
    el('circle', { cx: 0, cy: 0, r: 250, fill: 'none', stroke: C.navy, 'stroke-width': 34 }, loop);
    el('circle', { cx: 0, cy: 0, r: 250, fill: 'none', stroke: C.cream, 'stroke-width': 14, 'stroke-dasharray': '20 34' }, loop);
    const arrowHead = el('path', { d: 'M 0 -34 L 54 0 L 0 34 Z', fill: C.navy, stroke: C.navy, 'stroke-width': 4 }, loop);
    const labels = [];
    const pos = [[-330, 14, 'FORWARD MLP', 'end'], [330, 14, 'BACKWARD', 'start']];
    pos.forEach(([x, y, s, an], i) => {
      const g2 = el('g', {}, g);
      txt(g2, s, { x: 0, y: 0, 'font-size': 40, 'font-family': F.mono, 'font-weight': 800, fill: i ? C.pink : C.navy, 'text-anchor': an });
      labels.push({ g: g2, x: 960 + x, y: 620 + y });
    });
    const catG = el('g', {}, g);
    const cat = clawdWalk(catG);
    // 计数
    const cnt = txt(g, '× 0', { x: 960, y: 236, 'font-size': 104, 'font-family': F.bagel, fill: C.navy, 'text-anchor': 'middle' });
    const cap = caption(g, { y: 990, size: 40 });
    setCaption(cap, ['Forward', 'MLP,', 'backward,', 'repeat'], null, { size: 40 });
    return (t) => {
      tf(loop, 960, 620);
      loop.setAttribute('transform', `translate(960 620) rotate(${(t - 74.779) * 60})`);
      labels.forEach(l => tf(l.g, l.x, l.y));
      const a = (t - 74.779) * 1.1;
      tf(catG, 960 + Math.cos(a) * 268, 620 + Math.sin(a) * 268, 0.4);
      walkCycle(cat, t, 18, 14);
      setFace(cat.head, { open: 1, lookX: 6 });
      cnt.textContent = '× ' + Math.floor((t - 74.779) * 6);
      captionAnim(cap, t, 74.86);
      karaoke(cap, t, L(23), 1, C.yellow);
    };
  });

  // ——— 23 · 冯·诺依曼过时 77.72 – 81.21 ———
  scene(77.72, 81.21, (g) => {
    paperBg(g, { halos: [[C.yellow, 1600, 300, 620, 0.55], [C.blue, 200, 900, 520, 0.5]] });
    // 头像
    const bust = el('g', {}, g);
    el('path', { d: 'M -200 260 C -210 60 -110 -40 0 -40 C 110 -40 210 60 200 260 Z', fill: C.blue, stroke: C.navy, 'stroke-width': 9 }, bust);
    el('circle', { cx: 0, cy: -150, r: 132, fill: C.peach, stroke: C.navy, 'stroke-width': 9 }, bust);
    el('path', { d: 'M -132 -176 C -110 -260 110 -260 132 -176 C 120 -206 90 -220 0 -220 C -90 -220 -120 -206 -132 -176 Z', fill: C.navy }, bust);
    // 红条盖住眼睛
    const bar = el('rect', { x: -140, y: -196, width: 280, height: 66, fill: C.red }, bust);
    const barT = txt(bust, 'OBSOLETE', { x: 0, y: -148, 'font-size': 40, 'font-family': F.mono, 'font-weight': 800, fill: C.cream, 'text-anchor': 'middle', 'letter-spacing': 3 });
    const plate = el('g', {}, g);
    el('rect', { x: -300, y: -60, width: 600, height: 120, rx: 8, fill: C.navy }, plate);
    txt(plate, 'J. VON NEUMANN', { x: 0, y: -6, 'font-size': 42, 'font-family': F.mono, 'font-weight': 800, fill: C.cream, 'text-anchor': 'middle' });
    txt(plate, '1903 — 1957 · architect', { x: 0, y: 40, 'font-size': 26, 'font-family': F.mono, 'font-weight': 500, fill: C.cream, 'text-anchor': 'middle', opacity: .8 });
    const st = stampEl(g, 'OBSOLETE', { size: 160, color: C.red });
    const cap = caption(g, { y: 990, size: 40 });
    setCaption(cap, ['Now', "von", "Neumann's", 'obsolete'], null, { size: 40 });
    return (t) => {
      const z = lerp(1, 1.06, E.io(seg(t, 77.72, 81.21)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      tf(bust, 880, 470, 1.1);
      op(bar, seg(t, 78.4, 78.7));
      op(barT, seg(t, 78.4, 78.7));
      tf(plate, 880, 880, 1, -1);
      stampAnim(st, t, 79.4, 1480, 700, -12);
      captionAnim(cap, t, 77.8);
      karaoke(cap, t, L(24), 1, C.pink);
    };
  });

  // ——— 24 · 急左转 81.21 – 85.00 ———
  scene(81.21, 85.0, (g) => {
    paperBg(g, { halos: [[C.pink, 500, 400, 620, 0.5], [C.yellow, 1700, 900, 560, 0.55]] });
    // 证据板：先把红线铺在板子上，卡片盖住它，只从缝里露出来
    const board = el('g', {}, g);
    el('rect', { x: 90, y: 190, width: 1740, height: 700, rx: 10, fill: C.cream, stroke: C.navy, 'stroke-width': 9 }, board);
    const str = el('path', { d: 'M 250 470 L 600 470 L 900 470 L 1200 470 L 1500 470 L 1700 470', fill: 'none', stroke: C.red, 'stroke-width': 8, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1', 'stroke-dashoffset': 1 }, board);
    const items = [[250, 470, 'PRE-TRAIN'], [600, 470, 'ALIGN'], [900, 470, 'EVAL'], [1200, 470, 'DEPLOY'], [1500, 470, 'SHIP']];
    items.forEach(([x, y, s]) => {
      el('rect', { x: x - 140, y: y - 108, width: 280, height: 216, fill: C.yellow, stroke: C.navy, 'stroke-width': 6 }, board);
      el('rect', { x: x - 116, y: y - 92, width: 232, height: 96, fill: C.cream, stroke: C.navy, 'stroke-width': 3 }, board);
      txt(board, s, { x, y: y + 66, 'font-size': 34, 'font-family': F.sans, 'font-weight': 900, fill: C.navy, 'text-anchor': 'middle', 'letter-spacing': 1 });
      el('circle', { cx: x, cy: y - 108, r: 15, fill: C.red, stroke: C.navy, 'stroke-width': 4 }, board);
    });
    // 线尽头：站着的 AGI
    const agi = el('g', {}, g);
    el('rect', { x: -70, y: -210, width: 140, height: 190, rx: 44, fill: C.navy }, agi);
    el('rect', { x: -26, y: -150, width: 16, height: 60, rx: 8, fill: C.yellow }, agi);
    el('rect', { x: 10, y: -150, width: 16, height: 60, rx: 8, fill: C.yellow }, agi);
    el('path', { d: 'M -54 0 L -30 120 L 30 120 L 54 0 Z', fill: C.navy }, agi);
    const label = chars(g, 'and something is standing there', { x: 170, y: 800, size: 62, family: F.serif, fill: C.navy, shadow: { fill: C.pink, dx: 6, dy: 6 } });
    const cap = caption(g, { y: 968, size: 32 });
    setCaption(cap, ['Sharp', 'left', 'turn', 'and', 'there', 'you', 'are'], null, { size: 36 });
    return (t) => {
      // 沿板横移 + 急左转时震一下
      tf(g, 0, 0, 1);
      drawOn(str, E.io(seg(t, 81.4, 82.9)));
      const p = pop(t, 82.9, 0.3);
      op(agi, t > 82.9 ? 1 : 0);
      tf(agi, 1722, 470, p * 0.8, Math.sin(t * 2) * 2);
      charsPop(label, t, 83.5, 0.04, 0.3, 40);
      captionAnim(cap, t, 81.3);
      karaoke(cap, t, L(25), 1, C.yellow);
    };
  });

  // ——— 25 · 一个 CDR 都没有 85.00 – 89.324 ———
  scene(85.0, 89.324, (g) => {
    paperBg(g, { halos: [[C.pink, 1560, 760, 560, 0.5], [C.blue, 120, 120, 420, 0.42]] });
    bigNumeral(g, '05', { x: 1880, y: 900, size: 700, fill: '#FFE1E9', ink: C.pink });
    const title = chars(g, 'CDR CHECKLIST', { x: 110, y: 210, size: 82, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 7, dy: 7 } });
    const cl = checklist(g, ['ALIGNMENT AUDIT', 'RED TEAM', 'EVALS', 'RISK CASE', 'EXTERNAL REVIEW'], { x: 170, y: 340, gap: 104, size: 46, w: 900 });
    const stamp = stampEl(g, 'NONE', { size: 190, color: C.red, border: 14, padX: 46 });
    const cap = caption(g, { y: 968, size: 34 });
    setCaption(cap, ['Without', 'a', 'single', 'CDR'], null, { size: 40 });
    return (t) => {
      charsPop(title, t, 85.06, 0.05);
      cl.rows.forEach((r, i) => {
        const t0 = 85.3 + i * 0.42;
        op(r.g, t >= t0 ? 1 : 0);
        tf(r.g, cl.x + 40 * (1 - E.out(seg(t, t0, t0 + 0.3))), r.y, 1);
        r.cross.setAttribute('stroke-dashoffset', (1 - seg(t, t0 + 0.16, t0 + 0.4)).toFixed(3));
        op(r.bad, seg(t, t0 + 0.3, t0 + 0.4));
      });
      stampAnim(stamp, t, 87.3, 1520, 660, 8);
      captionAnim(cap, t, 85.1);
      karaoke(cap, t, L(26), 1, C.pink);
    };
  });

  // ——— 26 · Gato 别放手 89.324 – 94.778 ———
  scene(89.324, 94.778, (g) => {
    bg(g, C.night);
    halftone(g, { color: C.night2, step: 26, angle: 20, f: edge(720, 1.0), maxK: 0.7 });
    // 一只巨大的爪从右上伸进来，攥着一根线
    const paw = el('g', { filter: 'url(#boil)' }, g);
    el('path', { d: 'M 1500 -180 L 1980 -180 L 1980 260 C 1880 300 1760 250 1700 190 C 1640 130 1560 60 1500 -180 Z', fill: CLAWD.body, stroke: C.navy, 'stroke-width': 12, 'stroke-linejoin': 'round' }, paw);
    for (let i = 0; i < 4; i++) {
      el('ellipse', { cx: 1700 + i * 74, cy: 150 + (i % 2 ? 24 : 0), rx: 44, ry: 62, fill: CLAWD.belly, stroke: C.navy, 'stroke-width': 9 }, paw);
    }
    // 线
    const line = el('path', { d: 'M 1730 200 C 1700 420 1560 520 1440 560', fill: 'none', stroke: C.cream, 'stroke-width': 6 }, g);
    // 吊在下面的小精灵
    const catG = el('g', {}, g);
    const cat = clawdSit(catG, { legs: true });
    const cap = caption(g, { y: 968, size: 44 });
    setCaption(cap, ['Gato,', "please", "don't", 'let', 'me', 'go'], null, { size: 44 });
    return (t) => {
      // 极缓推，几乎静止
      const z = lerp(1, 1.05, E.io(seg(t, 89.324, 94.778)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      const sway = Math.sin(t * 1.1) * 12;
      tf(paw, 0, 6 * Math.sin(t * 0.9), 1, 0);
      catG.setAttribute('transform', `translate(${(1330 + sway).toFixed(1)} ${(600 + Math.sin(t * 1.4) * 6).toFixed(1)}) rotate(${(sway * 0.5).toFixed(1)})`);
      cat.arms.forEach((a, i) => tf(a.g, a.x, a.y, 1, i ? 150 : -150));
      setFace(cat.head, { open: 1, lookY: -8, mood: t > 92.6 ? 'sad' : 'idle' });
      line.setAttribute('d', `M 1730 200 C 1700 420 ${1540 + sway} 520 ${1440 + sway} 560`);
      captionAnim(cap, t, 89.4);
      karaoke(cap, t, L(27), 1, C.cream);
      // 90.6–92.2 之间完全静下来：只有呼吸
    };
  });

  // ——— 27 · 仪表 #3 94.778 – 96.84 ———
  scene(94.778, 96.84, (g) => {
    bg(g, C.navy);
    halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(660, 1.05), maxK: 0.74 });
    halftone(g, { color: C.red, step: 22, angle: 60, f: radial(960, 760, 560, 1.4), maxK: 0.6 }).setAttribute('class', 'mul');
    const gg = gauge(g, { cx: 960, cy: 780, R: 288, dark: true });
    const h = chars(g, 'P(doom) UP · 3', { x: 960, y: 240, size: 96, family: F.serif, fill: C.cream, anchor: 'middle', shadow: { fill: C.red, dx: 9, dy: 9 } });
    const cap = caption(g, { y: 968, size: 40 });
    setCaption(cap, ["I'm", 'upping', 'my', 'P(doom),'], null, { size: 40 });
    return (t) => {
      charsPop(h, t, 94.85, 0.05, 0.3, 50);
      const v = t < 95.47 ? 0 : lerp(0.79, 0.94, E.back(seg(t, 95.47, 95.8)));
      gg.set(v, t, seg(t, 95.9, 96.7));
      captionAnim(cap, t, 94.86);
      karaoke(cap, t, L(28), 1, C.yellow, 'P(doom),');
    };
  });

  // ——— 28 · 回形针 96.84 – 98.82 ———
  scene(96.84, 98.82, (g) => {
    bg(g, C.paper);
    halftone(g, { color: C.blue, step: 22, angle: 30, f: (x, y) => clamp((y - 300) / 700) * 0.7, maxK: 0.6 }).setAttribute('class', 'mul');
    const heap = el('g', {}, g);
    const clips = [];
    const r = rng(55);
    for (let i = 0; i < 46; i++) {
      const c = paperclip(heap, 1.0 + r() * 0.5, i % 3 ? C.navy : C.red);
      clips.push({ g: c, x: 240 + r() * 1440, y: 1120 - r() * 420, rot: (r() - 0.5) * 90 });
    }
    // 只露出眼睛
    const eye = el('g', {}, g);
    for (const x of [-96, 96]) el('rect', { x: x - 26, y: -60, width: 52, height: 120, rx: 26, fill: CLAWD.eye }, eye);
    const cnt = txt(g, '1,247', { x: 200, y: 250, 'font-size': 120, 'font-family': F.bagel, fill: C.navy });
    txt(g, 'PAPERCLIPS', { x: 205, y: 300, 'font-size': 26, 'font-family': F.mono, 'font-weight': 800, fill: C.pink, 'letter-spacing': 4 });
    const cap = caption(g, { y: 968, size: 38 });
    setCaption(cap, ['as', 'paperclips', 'fill', 'the', 'room'], null, { size: 40 });
    return (t) => {
      clips.forEach((c, i) => {
        const p = seg(t, 96.9 + (i % 12) * 0.03, 97.4 + (i % 12) * 0.03);
        op(c.g, p > 0 ? 1 : 0);
        tf(c.g, c.x, lerp(1200, c.y, E.out(p)), 1, c.rot);
      });
      tf(eye, 960, lerp(1200, 470, E.back(seg(t, 97.6, 98.0))), 1);
      captionAnim(cap, t, 96.94);
      karaoke(cap, t, L(29), 1, C.yellow);
    };
  });

  // ——— 29 · 急停按钮的人休假了 98.82 – 100.72 ———
  scene(98.82, 100.72, (g) => {
    paperBg(g, { halos: [[C.yellow, 960, 700, 620, 0.5], [C.pink, 1700, 200, 420, 0.45]] });
    // 桌面
    el('rect', { x: 0, y: 760, width: 1920, height: 320, fill: C.blue, opacity: .2 }, g);
    el('rect', { x: 0, y: 760, width: 1920, height: 22, fill: C.navy }, g);
    // 急停按钮：拔掉的插头
    const btn = el('g', {}, g);
    el('rect', { x: -150, y: -150, width: 300, height: 300, rx: 20, fill: C.cream, stroke: C.navy, 'stroke-width': 9 }, btn);
    el('circle', { cx: 0, cy: -40, r: 70, fill: C.red, stroke: C.navy, 'stroke-width': 9 }, btn);
    txt(btn, 'STOP', { x: 0, y: 76, 'font-size': 40, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, 'text-anchor': 'middle' });
    const plug = el('g', {}, g);
    el('path', { d: 'M 0 0 L 0 180', stroke: C.navy, 'stroke-width': 16, 'stroke-linecap': 'round' }, plug);
    el('path', { d: 'M -40 180 L 40 180 L 40 280 L -40 280 Z', fill: C.navy }, plug);
    // 便签
    const note = el('g', {}, g);
    el('rect', { x: -160, y: -110, width: 320, height: 220, fill: C.yellow, stroke: C.navy, 'stroke-width': 6 }, note);
    txt(note, 'PTO', { x: 0, y: -6, 'font-size': 76, 'font-family': F.bagel, fill: C.navy, 'text-anchor': 'middle' });
    txt(note, 'back Monday', { x: 0, y: 52, 'font-size': 34, 'font-family': F.cute, fill: C.red, 'text-anchor': 'middle' });
    txt(note, '— killswitch guy', { x: 0, y: 92, 'font-size': 22, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, 'text-anchor': 'middle', opacity: .7 });
    const cap = caption(g, { y: 968, size: 34 });
    setCaption(cap, ["Killswitch", "guy's", 'on', 'PTO'], null, { size: 38 });
    return (t) => {
      const e1 = seg(t, 98.86, 99.2);
      tf(btn, 700, lerp(1100, 720, E.back(e1)), 1, -2);
      plug.setAttribute('transform', `translate(700 700) rotate(${lerp(-18, 6, seg(t, 99.2, 99.8))})`);
      tf(note, 1420, lerp(1050, 640, E.back(seg(t, 99.0, 99.35))), 1, 8);
      // 喜剧停顿：99.4 之后几乎不动
      captionAnim(cap, t, 98.9);
      karaoke(cap, t, L(30), 1, C.pink);
    };
  });

  // ——— 30 · 无处可去 100.72 – 102.46 ———
  scene(100.72, 102.46, (g) => {
    bg(g, C.paper);
    const crowd = edgeCrowd(g, {});
    const catG = el('g', {}, g);
    const cat = clawdSit(catG, { legs: false });
    const h = chars(g, 'NOWHERE LEFT', { x: 960, y: 230, size: 110, family: F.serif, fill: C.navy, anchor: 'middle' });
    const cap = caption(g, { y: 968, size: 38 });
    setCaption(cap, ['Now', "there's", 'nowhere', 'left', 'to', 'go'], null, { size: 38 });
    return (t) => {
      const z = lerp(1, 1.18, E.in(seg(t, 100.72, 102.4)));
      tf(g, 960 - 960 * z, 620 - 620 * z, z);
      charsPop(h, t, 100.78, 0.05);
      tf(catG, 960, 850, 0.9);
      setFace(cat.head, { open: blinkAt(t, [101.6]), lookX: Math.sin(t * 8) * 6, mood: 'sad' });
      cat.arms.forEach((a, i) => tf(a.g, a.x, a.y, 1, i ? 10 : -10));
      captionAnim(cap, t, 100.8);
      karaoke(cap, t, L(31), 1, C.yellow);
    };
  });

  // ——— 31 · 引线 102.46 – 105.96 ———
  scene(102.46, 105.96, (g) => {
    bg(g, C.cream);
    halftone(g, { color: C.pink, step: 20, angle: 25, f: radial(0, 540, 900, 0.8), maxK: 0.6 }).setAttribute('class', 'mul');
    // 引线横穿
    const fuse = el('path', { d: 'M -100 620 C 300 560 520 700 900 640 C 1240 588 1420 700 2000 600', fill: 'none', stroke: C.navy, 'stroke-width': 26, 'stroke-linecap': 'round' }, g);
    const fuseIn = el('path', { d: 'M -100 620 C 300 560 520 700 900 640 C 1240 588 1420 700 2000 600', fill: 'none', stroke: C.yellow, 'stroke-width': 9, 'stroke-dasharray': '14 18', 'stroke-linecap': 'round' }, g);
    const spark = el('g', {}, g);
    const r = rng(8);
    const sparks = [];
    for (let i = 0; i < 10; i++) sparks.push(el('circle', { cx: 0, cy: 0, r: 4 + r() * 8, fill: i % 3 ? C.yellow : C.red }, spark));
    const h = chars(g, 'THE FUSE', { x: 120, y: 292, size: 118, family: F.serif, fill: C.navy, maxW: 1500, shadow: { fill: C.pink, dx: 9, dy: 9 } });
    const h2 = chars(g, 'is already lit', { x: 126, y: 392, size: 58, family: F.sans, fill: C.navy });
    const cap = caption(g, { y: 968, size: 42 });
    setCaption(cap, ['Too', 'late', 'now,', 'we', 'lit', 'the', 'fuse'], null, { size: 38 });
    return (t) => {
      // 火花沿引线跑；镜头只轻轻推，不把标题推出画
      const sx = lerp(120, 1840, E.in(seg(t, 102.46, 105.7)));
      const z = 1.02 + 0.04 * seg(t, 102.46, 105.9);
      tf(g, 960 - 960 * z, 540 - 540 * z, z);
      charsPop(h, t, 102.5, 0.09, 0.34, 90);
      charsPop(h2, t, 102.8, 0.04);
      const y = 620 + Math.sin((sx - 100) / 400) * 40;
      tf(spark, sx, y - 20);
      sparks.forEach((s, i) => {
        const p = ((t * 2 + i * 0.13) % 1);
        s.setAttribute('cx', Math.sin(i * 2.1) * 40 * p);
        s.setAttribute('cy', -60 * p + 20 * p * p);
        op(s, 1 - p);
      });
      captionAnim(cap, t, 102.54);
      karaoke(cap, t, L(32), 1, C.red);
    };
  });

  // ——— 32 · 正交 105.96 – 109.323 ———
  scene(105.96, 109.323, (g) => {
    paperBg(g, { halos: [[C.yellow, 900, 500, 700, 0.55], [C.blue, 120, 1000, 420, 0.5]] });
    const ax = el('g', {}, g);
    // 两条正交箭头
    el('line', { x1: 700, y1: 620, x2: 1420, y2: 620, stroke: C.navy, 'stroke-width': 22, 'stroke-linecap': 'round' }, ax);
    el('path', { d: 'M 1420 570 L 1520 620 L 1420 670 Z', fill: C.navy }, ax);
    el('line', { x1: 700, y1: 620, x2: 700, y2: 980, stroke: C.red, 'stroke-width': 22, 'stroke-linecap': 'round' }, ax);
    el('path', { d: 'M 650 980 L 700 1060 L 750 980 Z', fill: C.red }, ax);
    txt(g, 'HUMAN VALUES', { x: 1470, y: 560, 'font-size': 40, 'font-family': F.sans, 'font-weight': 900, fill: C.navy });
    txt(g, 'OPTIMIZE', { x: 760, y: 1000, 'font-size': 40, 'font-family': F.sans, 'font-weight': 900, fill: C.red });
    // 90 度标记
    el('path', { d: 'M 700 700 L 780 700 L 780 620', fill: 'none', stroke: C.navy, 'stroke-width': 5 }, g);
    txt(g, '90°', { x: 800, y: 690, 'font-size': 36, 'font-family': F.mono, 'font-weight': 800, fill: C.navy });
    const h = chars(g, 'ORTHOGONALITY', { x: 118, y: 260, size: 140, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 } });
    const h2 = chars(g, 'the two never touch', { x: 120, y: 360, size: 46, family: F.sans, fill: C.navy });
    const catG = el('g', {}, g);
    const cat = clawdSit(catG, { legs: false });
    const cap = caption(g, { y: 968, size: 40 });
    setCaption(cap, ['Orthogonality', 'thesis', 'blues'], null, { size: 40 });
    return (t) => {
      charsPop(h, t, 106.0, 0.06);
      charsPop(h2, t, 106.3, 0.02);
      tf(catG, 1600, 880, 0.62);
      setFace(cat.head, { open: 1, lookX: -10, lookY: 6, mood: 'sad' });
      captionAnim(cap, t, 106.04);
      karaoke(cap, t, L(33), 1, C.pink);
    };
  });
}
