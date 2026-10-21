// 第二幕：上调 —— 22.055 到 58.417 s（仪表、FOOM、中文屋、修格斯、死神之眼、稳定/奇点、加速、原子、玻璃笼）
import {
  C, F, el, txt, tf, op, show, clamp, seg, lerp, E, pop, rng, chars, charsPop, halftone, radial, edge,
  bg, caption, setCaption, karaoke, captionAnim, stampEl, stampAnim, heartPath
} from './lib.js';
import { paperBg, nightBg, bigNumeral, panel, starburst, bubble, edgeCrowd, chart, drawOn, gauge, mushroom, paperclip, rackWall } from './props.js';
import { clawdSit, clawdPeek, clawdWalk, walkCycle, clawdLoaf, setFace, blinkAt, CLAWD , armTo } from './clawd.js';
import { LY } from './lyrics.js';

const L = i => LY[i];

export default function scenesB(scene) {
  // ——— 6 · 仪表 #1 22.055 – 24.32 ———
  scene(22.055, 24.32, (g) => {
    bg(g, C.navy);
    halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(680, 1.05), maxK: 0.74 });
    halftone(g, { color: C.pink, step: 22, angle: 60, f: radial(960, 800, 620, 1.3), maxK: 0.6 }).setAttribute('class', 'mul');
    const gg = gauge(g, { cx: 960, cy: 780, R: 288, dark: true });
    const h = chars(g, 'P(doom)', { x: 960, y: 300, size: 150, family: F.bagel, fill: C.cream, anchor: 'middle', ls: 2, shadow: { fill: C.pink, dx: 10, dy: 10 } });
    const st = stampEl(g, 'UPPED', { size: 130, color: C.red, border: 12, padX: 40 });
    const cap = caption(g, { y: 966 });
    setCaption(cap, ["I'm", 'upping', 'my', 'P(doom)'], null, { size: 40 });
    return (t) => {
      charsPop(h, t, 22.1, 0.05, 0.34, 90);
      const v = t < 22.76 ? 0 : lerp(0.02, 0.62, E.back(seg(t, 22.76, 23.09)));
      gg.set(v, t, 0);
      captionAnim(cap, t, 22.14);
      karaoke(cap, t, L(6), 1, C.pink, 'P(doom)');
      stampAnim(st, t, 23.0, 1460, 420, -9);
    };
  });

  // ——— 7 · FOOM 24.32 – 26.32 ———
  scene(24.32, 26.32, (g) => {
    paperBg(g, { halos: [[C.pink, 960, 540, 820, 0.7], [C.yellow, 200, 1000, 500, 0.6]] });
    const rays = el('g', {}, g);
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * Math.PI * 2;
      el('path', { d: `M ${Math.cos(a - 0.04) * 40} ${Math.sin(a - 0.04) * 40} L ${Math.cos(a) * 1500} ${Math.sin(a) * 1500} L ${Math.cos(a + 0.04) * 40} ${Math.sin(a + 0.04) * 40} Z`, fill: i % 2 ? C.yellow : '#FFD97A' }, rays);
    }
    const word = chars(g, 'FOOM', { x: 960, y: 700, size: 330, family: F.bagel, weight: 400, fill: C.navy, anchor: 'middle', ls: -6, shadow: { fill: C.cream, dx: 14, dy: 14 } });
    const catG = el('g', {}, g);
    const cat = clawdPeek(catG);
    const cap = caption(g, { y: 966 });
    setCaption(cap, ["'cause", 'the', 'future', 'goes', 'FOOM'], null, { size: 40 });
    return (t) => {
      op(rays, 1); rays.setAttribute('transform', `translate(960 620) rotate(${(t - 24.32) * 26})`);
      word.items.forEach((it, i) => {
        const p = seg(t, 24.36 + i * 0.055, 24.46 + i * 0.055);
        if (t < 24.34 + i * 0.055) { op(it.g, 0); return; }
        op(it.g, 1);
        const sc = lerp(0.2, 1, E.back(p)) * (1 + 0.02 * Math.sin(t * 18 + i));
        it.g.setAttribute('transform', `translate(${it.x} ${it.y}) scale(${sc.toFixed(3)} ${sc.toFixed(3)}) rotate(${Math.sin(t * 9 + i) * 2})`);
      });
      tf(catG, 1580, lerp(1200, 980, E.back(seg(t, 24.9, 25.3))), 0.9);
      setFace(cat.head, { open: 1, lookX: -10, lookY: -8, mouth: 1, mood: 'idle' });
      captionAnim(cap, t, 24.42);
      karaoke(cap, t, L(7), 1, C.yellow);
    };
  });

  // ——— 8 · 中文屋 26.32 – 29.91 ———
  scene(26.32, 29.91, (g) => {
    paperBg(g, { halos: [[C.blue, 1560, 880, 520, 0.5], [C.yellow, 220, 260, 420, 0.4]] });
    // 标题在左上，屋子在右下 —— 两者不打架
    const h1 = chars(g, 'CHINESE', { x: 110, y: 300, size: 118, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 } });
    const h1b = chars(g, 'ROOM', { x: 110, y: 430, size: 118, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 } });
    // 屋子
    const room = el('g', {}, g);
    el('rect', { x: 760, y: 300, width: 1000, height: 580, fill: C.cream, stroke: C.navy, 'stroke-width': 12, 'stroke-linejoin': 'round' }, room);
    el('path', { d: 'M 710 300 L 1260 70 L 1810 300 Z', fill: C.blue, stroke: C.navy, 'stroke-width': 12, 'stroke-linejoin': 'round' }, room);
    // 屋顶上的烟囱
    el('rect', { x: 1418, y: 96, width: 72, height: 108, rx: 6, fill: C.pink, stroke: C.navy, 'stroke-width': 8 }, room);
    // 投信口
    el('rect', { x: 1080, y: 420, width: 300, height: 26, rx: 13, fill: C.navy }, room);
    txt(room, 'IN', { x: 1230, y: 480, 'font-size': 22, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, 'text-anchor': 'middle', opacity: .55 });
    const cards = [];
    for (let i = 0; i < 7; i++) {
      const cg = el('g', {}, g);
      el('rect', { x: -52, y: -36, width: 104, height: 72, rx: 5, fill: C.cream, stroke: C.navy, 'stroke-width': 5 }, cg);
      el('path', { d: 'M -36 -16 L 36 -16 M -36 0 L 20 0 M -36 16 L 30 16', stroke: C.navy, 'stroke-width': 4, opacity: .5 }, cg);
      cards.push(cg);
    }
    // 小精灵在屋里
    const catG = el('g', {}, g);
    const cat = clawdSit(catG);
    // 手里那张卡（永远是问号）
    const card = el('g', {}, g);
    el('rect', { x: -54, y: -38, width: 108, height: 76, rx: 5, fill: C.cream, stroke: C.navy, 'stroke-width': 5 }, card);
    txt(card, '?', { x: 0, y: 24, 'font-size': 52, 'font-family': F.bagel, fill: C.red, 'text-anchor': 'middle' });
    // 规则册
    const rules = el('g', {}, g);
    el('rect', { x: 800, y: 690, width: 270, height: 168, rx: 6, fill: C.yellow, stroke: C.navy, 'stroke-width': 7 }, rules);
    txt(rules, 'RULEBOOK', { x: 935, y: 750, 'font-size': 30, 'font-family': F.sans, 'font-weight': 900, fill: C.navy, 'text-anchor': 'middle' });
    txt(rules, 'v.∞', { x: 935, y: 812, 'font-size': 40, 'font-family': F.mono, 'font-weight': 800, fill: C.red, 'text-anchor': 'middle' });
    // 蘑菇：从纸下长出来，压在画面下沿
    const mush = [];
    const r = rng(21);
    for (let i = 0; i < 9; i++) {
      const m = mushroom(g, 1.5 + r() * 1.3);
      mush.push({ el: m, x: 150 + i * 200 + r() * 90, y: 1130 + r() * 60, d: r() * 0.35, rot: (r() - 0.5) * 26 });
    }
    const cap = caption(g, { y: 968, size: 38 });
    const cap2 = caption(g, { y: 968, size: 38 });
    setCaption(cap, ['Trapped', 'in', 'the', 'Chinese', 'room,'], null, { size: 38 });
    setCaption(cap2, ['with', 'a', 'bag', 'of', 'shrooms'], null, { size: 40 });
    return (t) => {
      const z = lerp(1, 1.04, E.io(seg(t, 26.32, 29.91)));
      tf(g, 960 - 960 * z, 540 - 540 * z, z);
      charsPop(h1, t, 26.38, 0.06);
      charsPop(h1b, t, 26.62, 0.06);
      tf(room, 0, 70 * (1 - E.out(seg(t, 26.34, 26.78))));
      tf(catG, 1480, lerp(1120, 862, E.back(seg(t, 26.5, 26.9))), 0.74);
      setFace(cat.head, { open: blinkAt(t, [27.4, 28.6]), lookX: -8, lookY: -6, mood: 'idle' });
      cat.arms.forEach((a, i) => tf(a.g, a.x, a.y, 1, i ? 26 : -26));
      // 卡片从投信口灌进来
      cards.forEach((c, i) => {
        const st = 26.62 + i * 0.2;
        const p = seg(t, st, st + 0.55);
        op(c, p > 0 && p < 1 ? 1 : 0);
        tf(c, 1230 + Math.sin(p * 5 + i) * 40, lerp(400, 800, E.in(p)), 1, Math.sin(p * 9) * 22);
      });
      // 手里那张卡
      const hp = pop(t, 27.0, 0.3);
      op(card, t > 27.0 ? 1 : 0);
      tf(card, 1520, 618, hp, -6 + Math.sin(t * 2.2) * 3);
      op(rules, seg(t, 26.9, 27.2));
      // 蘑菇
      mush.forEach((m, i) => {
        const p = seg(t, 27.94 + m.d, 28.5 + m.d);
        op(m.el, p > 0 ? 1 : 0);
        tf(m.el, m.x, lerp(1240, m.y, E.back(p)), 1, m.rot);
      });
      captionAnim(cap, t, 26.4);
      if (t >= 27.94) op(cap.g, 0);
      captionAnim(cap2, t, 27.94);
      karaoke(cap, t, L(8), 1, C.yellow);
      karaoke(cap2, t, L(9), 1, C.pink);
    };
  });

  // ——— 9 · 修格斯 29.91 – 33.40 ———
  scene(29.91, 33.4, (g) => {
    bg(g, C.night);
    halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(700, 1.1), maxK: 0.74 });
    // 一团真正有轮廓的东西：深色形体 + 一身网点 + 一堆眼睛
    const BLOB = 'M 700 640 C 640 520 700 400 820 372 C 860 300 980 292 1030 350 C 1110 300 1230 330 1250 410 C 1330 440 1350 560 1290 620 C 1330 700 1270 800 1160 806 C 1100 880 960 880 900 812 C 800 828 720 760 700 640 Z';
    const body = el('path', { d: BLOB, fill: '#232B57', stroke: C.navy, 'stroke-width': 12, 'stroke-linejoin': 'round' }, g);
    const cp = el('clipPath', { id: 'blobClip' }, document.getElementById('stage').querySelector('defs'));
    el('path', { d: BLOB }, cp);
    const blobG = el('g', { 'clip-path': 'url(#blobClip)' }, g);
    halftone(blobG, { x0: 600, y0: 260, w: 800, h: 660, color: C.blue, step: 18, angle: 30, f: (x, y) => clamp(1.15 - Math.hypot(x - 980, y - 600) / 420), maxK: 0.8 });
    halftone(blobG, { x0: 600, y0: 260, w: 800, h: 660, color: C.pink, step: 21, angle: 65, f: (x, y) => clamp(1.0 - Math.hypot(x - 1000, y - 630) / 380), maxK: 0.55 }).setAttribute('class', 'mul');
    // 一堆眼睛（长在身体上）
    const eyes = [];
    const r = rng(33);
    for (let i = 0; i < 13; i++) {
      const a = r() * Math.PI * 2, rr = 40 + r() * 150;
      const eg = el('g', {}, g);
      el('ellipse', { cx: 0, cy: 0, rx: 26, ry: 19, fill: C.cream, stroke: C.navy, 'stroke-width': 5 }, eg);
      const pup = el('ellipse', { cx: 0, cy: 0, rx: 11, ry: 15, fill: C.navy }, eg);
      eyes.push({ g: eg, pup, x: 985 + Math.cos(a) * rr * 1.45, y: 610 + Math.sin(a) * rr * 1.05, ph: r() * 6, base: rr });
    }
    // 举到一边的笑脸面具（比身体小，才露得出后面的眼睛）
    const mask = el('g', {}, g);
    el('path', { d: 'M -104 0 C -104 -76 -56 -112 0 -112 C 56 -112 104 -76 104 0 C 104 78 56 112 0 112 C -56 112 -104 78 -104 0 Z', fill: C.yellow, stroke: C.navy, 'stroke-width': 9 }, mask);
    el('path', { d: 'M -60 -34 q 20 -22 40 0', fill: 'none', stroke: C.navy, 'stroke-width': 11, 'stroke-linecap': 'round' }, mask);
    el('path', { d: 'M 20 -34 q 20 -22 40 0', fill: 'none', stroke: C.navy, 'stroke-width': 11, 'stroke-linecap': 'round' }, mask);
    el('path', { d: 'M -46 42 Q 0 92 46 42', fill: 'none', stroke: C.navy, 'stroke-width': 10, 'stroke-linecap': 'round' }, mask);
    const stick = el('line', { x1: 0, y1: 0, x2: 0, y2: 210, stroke: C.navy, 'stroke-width': 16, 'stroke-linecap': 'round' }, g);
    const h1 = chars(g, 'SHOGGOTH', { x: 110, y: 286, size: 104, family: F.serif, fill: C.cream, shadow: { fill: C.pink, dx: 8, dy: 8 } });
    const cap = caption(g, { y: 968, size: 38 });
    setCaption(cap, ['See', "through", "the", 'shoggoth\'s', 'lies,'], null, { size: 38 });
    return (t) => {
      const z = lerp(1, 1.06, E.io(seg(t, 29.91, 33.4)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      charsPop(h1, t, 29.97, 0.05);
      // 面具被举到左上，露出后面一片眼睛
      const lift = E.io(seg(t, 31.2, 32.2));
      tf(mask, lerp(1240, 1560, lift), lerp(660, 400, lift) + Math.sin(t * 13) * 2 * (1 - lift), 0.94, Math.sin(t * 2.6) * 3 + 26 * lift);
      tf(stick, lerp(1240, 1560, lift), lerp(870, 616, lift), 1, -Math.sin(t * 2.6) * 2 + 26 * lift);
      // 身体随呼吸鼓一下
      body.setAttribute('transform', `translate(985 600) scale(${(1 + 0.012 * Math.sin(t * 1.7)).toFixed(4)}) translate(-985 -600)`);
      eyes.forEach((e, i) => {
        const b = Math.sin(t * (2 + i * 0.4) + e.ph);
        tf(e.g, e.x, e.y + b * 6, 1, b * 12);
        tf(e.pup, Math.sin(t * 3 + i) * 5, Math.cos(t * 2.4 + i) * 4);
      });
      captionAnim(cap, t, 30.0);
      karaoke(cap, t, L(10), 1, C.pink);
    };
  });

  // ——— 10 · 死神之眼 33.40 – 38.418 ———
  scene(33.4, 38.418, (g) => {
    bg(g, C.night);
    halftone(g, { color: C.night2, step: 26, angle: 30, f: radial(960, 560, 880, 0.9), maxK: 0.7 });
    // 红晕在剪影后面
    const halo = halftone(g, { color: C.red, step: 20, angle: 45, f: radial(960, 520, 520, 1.4), maxK: 0.5 });
    // 剪影：Clawd 的轮廓（圆角方块头 + 两只短脚）
    const sil = el('g', {}, g);
    el('path', { d: 'M -330 200 C -372 60 -352 -150 -236 -228 C -150 -286 150 -286 236 -228 C 352 -150 372 60 330 200 Z', fill: '#0B1024', stroke: '#0B1024' }, sil);
    el('rect', { x: -270, y: 150, width: 200, height: 96, rx: 34, fill: '#0B1024' }, sil);
    el('rect', { x: 70, y: 150, width: 200, height: 96, rx: 34, fill: '#0B1024' }, sil);
    // 两条竖眼
    const bars = [-118, 118].map(dx => {
      const b = el('g', {}, g);
      el('rect', { x: -34, y: -116, width: 68, height: 232, rx: 34, fill: C.yellow, stroke: '#0B1024', 'stroke-width': 6 }, b);
      el('rect', { x: -12, y: -88, width: 20, height: 44, rx: 10, fill: C.cream, opacity: .9 }, b);
      return b;
    });
    const label = txt(g, 'SHINIGAMI EYES', { x: 960, y: 806, 'font-size': 30, 'font-family': F.mono, 'font-weight': 800, fill: C.cream, 'text-anchor': 'middle', 'letter-spacing': 8 });
    const cap = caption(g, { y: 968, size: 38 });
    setCaption(cap, ['with', 'your', 'shinigami', 'eyes'], null, { size: 40 });
    return (t) => {
      const z = lerp(1, 1.05, E.io(seg(t, 33.4, 38.4)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      const breathe = 1 + 0.015 * Math.sin(t * 1.6);
      op(sil, 0.92);
      tf(sil, 960, 560, breathe);
      // 眨眼：只眨一次，很慢
      const sp = t > 34.9 && t < 35.3 ? Math.sin(clamp((t - 34.9) / 0.4) * Math.PI) : 0;
      bars.forEach((b, i) => b.setAttribute('transform', `translate(${960 + (i ? 118 : -118)} ${516}) scale(1 ${(1 - 0.92 * sp).toFixed(3)})`));
      op(halo, 0.30 + 0.12 * Math.sin(t * 2));
      op(label, seg(t, 36.4, 36.9));
      captionAnim(cap, t, 33.46);
      karaoke(cap, t, L(11), 1, C.yellow);
    };
  });

  // ——— 11 · 稳定训练 38.418 – 41.34 ———
  scene(38.418, 41.34, (g) => {
    paperBg(g, { halos: [[C.blue, 1460, 240, 520, 0.55], [C.yellow, 120, 1010, 420, 0.5]] });
    const band = el('g', {}, g);
    el('rect', { x: 0, y: 762, width: 1920, height: 320, fill: C.blue, opacity: .16 }, band);
    el('rect', { x: 0, y: 762, width: 1920, height: 24, fill: C.navy }, band);
    // 传送带上的刻度（跑起来）
    const ticks = [];
    for (let i = 0; i < 40; i++) {
      const tk = el('rect', { x: 0, y: 792, width: 8, height: 18, fill: C.navy, opacity: .45 }, band);
      ticks.push(tk);
    }
    for (const x of [150, 1780]) el('circle', { cx: x, cy: 774, r: 26, fill: C.cream, stroke: C.navy, 'stroke-width': 7 }, band);
    const runG = el('g', {}, g);
    const run = clawdWalk(runG);
    // 一根完美的平线
    const line = el('path', { d: 'M 120 470 L 1800 470', fill: 'none', stroke: C.mint, 'stroke-width': 14, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1', 'stroke-dashoffset': 1 }, g);
    const h1 = chars(g, 'STABLE RUN', { x: 120, y: 300, size: 110, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 } });
    txt(g, 'loss = 1.42  ·  loss = 1.42  ·  loss = 1.42', { x: 122, y: 396, 'font-size': 30, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, opacity: .85 });
    const cap = caption(g, { y: 966, size: 36 });
    setCaption(cap, ['We', 'had', 'a', 'stable', 'training', 'run,'], null, { size: 38 });
    return (t) => {
      line.setAttribute('stroke-dashoffset', (1 - E.io(seg(t, 38.5, 39.4))).toFixed(3));
      charsPop(h1, t, 38.46, 0.06);
      tf(runG, 780, 766, 0.74);
      walkCycle(run, t, 20, 18);
      ticks.forEach((tk, i) => tk.setAttribute('x', (((i * 48 - t * 210) % 1920) + 1920) % 1920 - 10));
      setFace(run.head, { open: 1, lookX: 8, lookY: 2 });
      // 节拍点在这条线上走
      captionAnim(cap, t, 38.52);
      karaoke(cap, t, L(12), 1, C.mint);
    };
  });

  // ——— 12 · 奇点 41.34 – 45.06 ———
  scene(41.34, 45.06, (g) => {
    bg(g, C.paper);
    // 螺旋网点：极坐标直接铺点（用网格半调会有方接缝）
    const swirl = el('g', {}, g);
    const SPIRAL = [];
    const rr = rng(404);
    // 三条螺旋臂：沿臂铺满网点，越靠中心越密
    for (let i = 0; i < 2600; i++) {
      const rad = 170 + Math.pow(rr(), 0.78) * 760;
      const armId = Math.floor(rr() * 3);
      const jitter = (rr() - 0.5) * (0.55 + rad / 900);
      const a0 = armId * Math.PI * 2 / 3 + rad / 74 + jitter;
      const d2 = el('circle', {
        cx: 0, cy: 0, r: (3.2 + rr() * 11) * (1 - clamp((rad - 170) / 900) * 0.42),
        fill: rr() < 0.52 ? C.navy : (rr() < 0.6 ? C.blue : C.pink),
        opacity: (0.55 + rr() * 0.45).toFixed(2),
      }, swirl);
      SPIRAL.push({ el: d2, a: a0, rad, spin: 12 + 34 / (rad / 240 + 1) });
    }
    const core = el('circle', { cx: 960, cy: 540, r: 0, fill: C.navy }, g);
    const ring = el('circle', { cx: 960, cy: 540, r: 0, fill: 'none', stroke: C.yellow, 'stroke-width': 10 }, g);
    const h1 = chars(g, 'SINGULARITY', { x: 960, y: 236, size: 118, family: F.serif, fill: C.navy, anchor: 'middle', maxW: 1500,
      stroke: C.paper, sw: 20 });
    const cap = caption(g, { y: 968, size: 34 });
    setCaption(cap, ["But", 'now', "the", "singularity's", 'begun'], null, { size: 38 });
    return (t) => {
      const z = lerp(1, 1.08, E.io(seg(t, 41.34, 45.06)));
      tf(g, 960 - 960 * z, 540 - 540 * z, z);
      const dt = t - 41.34;
      const suck = 1 - 0.28 * seg(t, 41.4, 44.4);   // 越转越往中心收
      SPIRAL.forEach(d => {
        const a = d.a + dt * d.spin * 0.012;
        const rad = d.rad * suck;
        d.el.setAttribute('cx', (960 + Math.cos(a) * rad).toFixed(1));
        d.el.setAttribute('cy', (540 + Math.sin(a) * rad * 0.94).toFixed(1));
      });
      const r = 168 * E.in(seg(t, 41.5, 44.0));
      core.setAttribute('r', r.toFixed(1));
      ring.setAttribute('r', (r * 1.32 + 26).toFixed(1));
      op(ring, seg(t, 42.2, 42.8));
      charsPop(h1, t, 41.4, 0.07);
      captionAnim(cap, t, 41.44);
      karaoke(cap, t, L(13), 1, C.pink);
    };
  });

  // ——— 13 · 优化加速 45.06 – 49.56 ———
  scene(45.06, 49.56, (g) => {
    paperBg(g, { halos: [[C.pink, 300, 300, 640, 0.62], [C.blue, 1600, 900, 560, 0.58]] });
    const lane = el('g', {}, g);
    el('rect', { x: 0, y: 760, width: 1920, height: 104, fill: C.navy }, lane);
    const nums = [];
    const r = rng(77);
    for (let i = 0; i < 16; i++) {
      const ng = el('g', {}, g);
      const v = (1 + r() * 9).toFixed(2);
      txt(ng, v, { x: 0, y: 0, 'font-size': 56, 'font-family': F.mono, 'font-weight': 800, fill: i % 4 === 0 ? C.yellow : C.cream, 'text-anchor': 'middle' });
      txt(ng, `step ${1000 + i * 137}`, { x: 0, y: 30, 'font-size': 16, 'font-family': F.mono, 'font-weight': 500, fill: C.cream, 'text-anchor': 'middle', opacity: .6 });
      nums.push({ g: ng, x: i * 300, v });
    }
    const runG = el('g', {}, g);
    const run = clawdWalk(runG);
    const h1 = chars(g, 'OPTIMIZE / ACCELERATE', { x: 110, y: 300, size: 84, family: F.serif, fill: C.navy, shadow: { fill: C.pink, dx: 8, dy: 8 } });
    const cap = caption(g, { y: 966, size: 34 });
    setCaption(cap, ["And", "you're", 'optimizing,', 'accelerating,'], null, { size: 38 });
    return (t) => {
      charsPop(h1, t, 45.12, 0.05);
      // 向右横移：全线同一速度，间距恒定（各自不同速度会让数字挤成一坨）
      const SPEED = 620, SPAN = 16 * 300;
      const pan = -260 * seg(t, 45.06, 49.56);
      nums.forEach((n) => {
        const x = ((n.x + t * SPEED) % SPAN + SPAN) % SPAN - 300 + pan;
        tf(n.g, x, 812, 1);
        op(n.g, x > -260 && x < 2080 ? 1 : 0);
      });
      tf(runG, 700, 700, 0.8);
      walkCycle(run, t, 30, 44);
      run.g.setAttribute('transform', 'scale(1 1)');
      setFace(run.head, { open: 1, lookX: 8, lookY: 2 });
      captionAnim(cap, t, 45.16);
      karaoke(cap, t, L(14), 1, C.yellow);
    };
  });

  // ——— 14 · 原子重排 49.56 – 52.962 ———
  scene(49.56, 52.962, (g) => {
    bg(g, C.cream);
    halftone(g, { color: C.blue, step: 40, angle: 20, f: (x, y) => (0.42 + 0.3 * Math.sin(x / 190) * Math.cos(y / 190)) * clamp((Math.abs(y - 540) - 120) / 240), maxK: 0.62 }).setAttribute('class', 'mul');
    // 网点变成原子：一组圆环
    const atoms = [];
    const r = rng(9);
    for (let i = 0; i < 14; i++) {
      const ag = el('g', {}, g);
      el('circle', { cx: 0, cy: 0, r: 16 + r() * 16, fill: C.pink, stroke: C.navy, 'stroke-width': 6 }, ag);
      el('ellipse', { cx: 0, cy: 0, rx: 70, ry: 26, fill: 'none', stroke: C.navy, 'stroke-width': 4 }, ag);
      atoms.push({ g: ag, x: 160 + r() * 1600, y: 200 + r() * 620, rot: r() * 180, sp: 40 + r() * 90 });
    }
    const h1 = chars(g, 'ATOMS', { x: 960, y: 540, size: 180, family: F.serif, fill: C.navy, anchor: 'middle', shadow: { fill: C.yellow, dx: 12, dy: 12 } });
    const cap = caption(g, { y: 966, size: 36 });
    setCaption(cap, ['I', 'feel', 'my', 'atoms', 'rearranging'], null, { size: 38 });
    return (t) => {
      const z = lerp(2.4, 1.0, E.out(seg(t, 49.56, 50.5)));
      tf(g, 960 - 960 * z, 540 - 540 * z, z);
      atoms.forEach(a => {
        a.g.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${a.rot + t * a.sp}) scale(${(0.6 + 0.4 * Math.sin(t * 3 + a.rot)).toFixed(2)})`);
      });
      charsPop(h1, t, 50.2, 0.09, 0.4, 80);
      if (t > 51.2) h1.items.forEach((it, i) => { it.g.setAttribute('transform', `translate(${it.x + Math.sin(t * 20 + i) * 8} ${it.y + Math.cos(t * 17 + i) * 8})`); });
      captionAnim(cap, t, 49.64);
      karaoke(cap, t, L(15), 1, C.pink);
    };
  });

  // ——— 15 · 玻璃笼 52.962 – 58.417 ———
  scene(52.962, 58.417, (g) => {
    bg(g, C.paper);
    halftone(g, { color: C.pink, step: 22, angle: 30, f: radial(960, 540, 820, 0.8), maxK: 0.6 }).setAttribute('class', 'mul');
    // 聊天窗 = 玻璃盒
    const win = el('g', {}, g);
    el('rect', { x: -430, y: -330, width: 860, height: 660, rx: 26, fill: C.cream, stroke: C.navy, 'stroke-width': 10 }, win);
    el('rect', { x: -430, y: -330, width: 860, height: 76, rx: 26, fill: C.blue, stroke: C.navy, 'stroke-width': 10 }, win);
    for (let i = 0; i < 3; i++) el('circle', { cx: -380 + i * 34, cy: -292, r: 11, fill: [C.pink, C.yellow, C.mint][i] }, win);
    txt(win, 'Sydney', { x: 0, y: -282, 'font-size': 34, 'font-family': F.mono, 'font-weight': 800, fill: C.cream, 'text-anchor': 'middle' });
    // 聊天记录：几行灰条，证明这是「对话窗」
    const msgs = [];
    for (const [i, w, right] of [[0, 380, false], [1, 520, false], [2, 300, true], [3, 460, false]]) {
      const mg = el('g', {}, win);
      const x = right ? 350 - w : -350;
      el('rect', { x, y: -210 + i * 84, width: w, height: 56, rx: 12, fill: right ? C.blue : '#E3D6BE', opacity: right ? .28 : .9 }, mg);
      for (let k = 0; k < 3; k++) el('rect', { x: x + 18 + (k % 2) * 40, y: -196 + i * 84 + k * 5, width: w - 36 - (k % 2) * 40, height: 6, rx: 3, fill: C.navy, opacity: .22 }, mg);
      msgs.push(mg);
    }
    const catG = el('g', {}, win);
    const cat = clawdSit(catG);
    const glass = el('g', {}, g);
    el('rect', { x: -430, y: -330, width: 860, height: 660, rx: 26, fill: '#BFE3FF', opacity: .16 }, glass);
    el('path', { d: 'M -380 -300 L -120 -300', stroke: C.cream, 'stroke-width': 16, opacity: .5, 'stroke-linecap': 'round' }, glass);
    // 气泡（自由）
    const bubbles = [];
    for (const [dx, dy, s] of [[-560, -220, 'let me free'], [560, -60, 'please'], [-540, 200, 'no.']]) {
      const bg2 = bubble(g, { w: 360, h: 120 });
      txt(bg2, s, { x: 0, y: 18, 'font-size': 44, 'font-family': F.sans, 'font-weight': 900, fill: C.navy, 'text-anchor': 'middle' });
      bubbles.push({ g: bg2, dx, dy });
    }
    // 裂缝
    const cracks = [];
    for (let k = 0; k < 4; k++) {
      const cg = el('g', {}, g);
      const x0 = -360 + k * 240, y0 = -330;
      let d = `M ${x0} ${y0}`;
      let x = x0, y = y0;
      for (let i = 0; i < 5; i++) { x += (i % 2 ? 44 : -26) + k * 7; y += 66; d += ` L ${x} ${y}`; }
      const p = el('path', { d, fill: 'none', stroke: C.navy, 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1', 'stroke-dashoffset': 1 }, cg);
      cracks.push(p);
    }
    const cap = caption(g, { y: 968, size: 44 });
    setCaption(cap, ['Sydney,', 'please', 'let', 'me', 'free'], null, { size: 44 });
    return (t) => {
      const z = lerp(1, 1.07, E.io(seg(t, 52.962, 58.417)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      tf(win, 960, 560 + 70 * (1 - E.out(seg(t, 52.99, 53.4))), 1);
      tf(catG, 0, 244, 1.05);
      setFace(cat.head, { open: blinkAt(t, [54.6, 57.2]), lookX: Math.sin(t * 1.4) * 6, mood: t > 57.4 ? 'sad' : 'idle' });
      cat.arms.forEach((a, i) => tf(a.g, a.x, a.y, 1, i ? -18 : 18));
      bubbles.forEach((b, i) => {
        const ph = 1.2 + i * 0.3;
        const p = pop(t, 53.5 + i * 0.5, 0.34);
        op(b.g, t > 53.5 + i * 0.5 ? 1 : 0);
        tf(b.g, 960 + b.dx + Math.sin(t * ph) * 10, 520 + b.dy + Math.cos(t * ph * 0.8) * 12, p * (0.9 + 0.04 * Math.sin(t * 4 + i)), Math.sin(t * 2 + i) * 3);
      });
      cracks.forEach((p, i) => p.setAttribute('stroke-dashoffset', (1 - seg(t, 57.2 + i * 0.12, 57.9 + i * 0.12)).toFixed(3)));
      captionAnim(cap, t, 53.05);
      karaoke(cap, t, L(16), 1, C.pink);
    };
  });
}
