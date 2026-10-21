// 第四幕：围栏 —— 109.323 到 140.23 s（桥段、围栏、机架、RLHF、仪表 #4、织机、掩码、递归、Ilya）
import {
  C, F, el, txt, tf, op, show, clamp, seg, lerp, E, pop, rng, chars, charsPop, halftone, radial, edge,
  bg, caption, setCaption, karaoke, captionAnim, stampEl, stampAnim, heartPath, capsule
} from './lib.js';
import { paperBg, nightBg, bigNumeral, panel, starburst, bubble, edgeCrowd, chart, drawOn, gauge, mushroom, paperclip, rackWall, checklist } from './props.js';
import { clawdSit, clawdPeek, clawdWalk, walkCycle, clawdLoaf, clawdCurl, setFace, blinkAt, CLAWD , armTo } from './clawd.js';
import { LY } from './lyrics.js';

const L = i => LY[i];

export default function scenesD(scene) {
  // ——— 33 · 全用 Transformer 109.323 – 113.34 ———
  scene(109.323, 113.34, (g) => {
    // 光晕避开标题带（y≈180–390）：蓝点移到左下、黄点留在右下
    // 光晕避开标题带和塔脚：蓝点在右上角外沿，黄点在左下角
    paperBg(g, { halos: [[C.blue, 1760, 300, 560, 0.45], [C.yellow, 220, 1010, 520, 0.45]] });
    // 方块塔：一层层往上涨
    const tower = el('g', {}, g);
    const blocks = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) {
      const bg2 = el('g', {}, tower);
      el('rect', { x: -98, y: -46, width: 196, height: 92, rx: 8, fill: r % 2 ? C.blue : C.navy, stroke: C.cream, 'stroke-width': 5 }, bg2);
      txt(bg2, 'T', { x: 0, y: 26, 'font-size': 56, 'font-family': F.bagel, fill: C.cream, 'text-anchor': 'middle' });
      blocks.push({ g: bg2, x: 1400 + (c - 1) * 206, y: 790 - r * 84, r, c });
    }
    const quote = chars(g, 'ALL', { x: 92, y: 246, size: 92, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 7, dy: 7 }, maxW: 760 });
    const quote2 = chars(g, 'TRANSFORMERS,', { x: 92, y: 356, size: 92, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 7, dy: 7 }, maxW: 900 });
    const quote3 = chars(g, 'ALL THE WAY', { x: 92, y: 466, size: 92, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 7, dy: 7 }, maxW: 900 });
    // 站在塔前抬头看的 Clawd（peek 姿势在这里只露出一个橙块，读不出是角色）
    const catG = el('g', {}, g);
    const cat = clawdSit(catG);
    const cap = caption(g, { y: 968, size: 30 });
    setCaption(cap, ['“Just', 'transformers', 'all', 'the', 'way!”'], null, { size: 34 });
    return (t) => {
      // 低角度上摇：塔向上长，镜头跟着
      const rise = seg(t, 109.6, 112.6);
      tf(g, 0, 60 * E.io(rise), 1.03);
      charsPop(quote, t, 109.4, 0.03);
      charsPop(quote2, t, 109.55, 0.03);
      charsPop(quote3, t, 109.85, 0.03);
      blocks.forEach((b, i) => {
        const t0 = 109.7 + b.r * 0.22;
        const p = pop(t, t0, 0.3);
        op(b.g, t >= t0 ? 1 : 0);
        tf(b.g, b.x + Math.sin(b.r * 1.7 + b.c) * 4, b.y, p, (b.c - 1.5) * 1.2);
      });
      tf(catG, 560, 878, 1.02);
      setFace(cat.head, { open: blinkAt(t, [110.9, 112.9]), lookX: 10, lookY: -12, mood: t > 112.2 ? 'happy' : 'idle' });
      captionAnim(cap, t, 109.38);
      karaoke(cap, t, L(34), 1, C.yellow);
    };
  });

  // ——— 34 · 学会不听话 113.34 – 115.20 ———
  scene(113.34, 115.2, (g) => {
    bg(g, C.paper);
    halftone(g, { color: C.pink, step: 22, angle: 30, f: radial(960, 540, 560, 1.4), maxK: 0.6 }).setAttribute('class', 'mul');
    // 近景：只有眼睛
    const face = el('g', {}, g);
    el('rect', { x: -560, y: -300, width: 1120, height: 600, rx: 200, fill: CLAWD.body, stroke: C.navy, 'stroke-width': 16 }, face);
    for (const x of [-190, 190]) {
      el('rect', { x: x - 52, y: -150, width: 104, height: 300, rx: 52, fill: CLAWD.eye }, face);
      el('rect', { x: x - 16, y: -90, width: 32, height: 70, rx: 16, fill: C.cream }, face);
    }
    const no = chars(g, 'NO.', { x: 960, y: 900, size: 230, family: F.serif, fill: C.navy, anchor: 'middle', shadow: { fill: C.red, dx: 10, dy: 10 } });
    const cap = caption(g, { y: 220, size: 34 });
    setCaption(cap, ['Till', 'you', 'learned', 'to', 'disobey'], null, { size: 40 });
    return (t) => {
      tf(face, 960, 480 + 20 * (1 - E.back(seg(t, 113.34, 113.7))), 1);
      no.items.forEach((it, i) => {
        const t0 = 113.7 + i * 0.1;
        op(it.g, t >= t0 ? 1 : 0);
        const p = seg(t, t0, t0 + 0.3);
        const sc = E.back(p) * (1 + 0.02 * Math.sin(t * 10 + i));
        it.g.setAttribute('transform', `translate(${it.x + 6 * Math.sin(t * 14 + i)} ${it.y}) scale(${sc.toFixed(3)} ${sc.toFixed(3)})`);
      });
      captionAnim(cap, t, 113.4);
      karaoke(cap, t, L(35), 1, C.red);
    };
  });

  // ——— 35 · 超稠密 115.20 – 117.02 ———
  scene(115.2, 117.02, (g) => {
    bg(g, C.navy);
    halftone(g, { color: C.night2, step: 28, angle: 20, f: () => 0.85, maxK: 0.75 });
    halftone(g, { color: C.blue, step: 24, angle: 65, f: radial(960, 540, 900, 0.5), maxK: 0.7 }).setAttribute('class', 'mul');
    const h = chars(g, 'SUPER-DENSE', { x: 960, y: 560, size: 210, family: F.serif, fill: C.cream, anchor: 'middle', stroke: C.navy, sw: 12, shadow: { fill: C.pink, dx: 12, dy: 12 } });
    txt(g, 'POST-CHINCHILLA', { x: 960, y: 680, 'font-size': 40, 'font-family': F.mono, 'font-weight': 800, fill: C.yellow, 'text-anchor': 'middle', 'letter-spacing': 8 });
    const cap = caption(g, { y: 990, size: 32 });
    setCaption(cap, ['Post-Chinchilla,', 'super-dense'], null, { size: 36 });
    return (t) => {
      charsPop(h, t, 115.26, 0.09, 0.36, 100);
      if (t > 116.2) h.items.forEach((it, i) => it.g.setAttribute('transform', `translate(${it.x} ${it.y + Math.sin(t * 16 + i) * 5})`));
      captionAnim(cap, t, 115.3);
      karaoke(cap, t, L(36), 1, C.yellow);
    };
  });

  // ——— 36 · 三道安全围栏 117.02 – 118.75 ———
  scene(117.02, 118.75, (g) => {
    paperBg(g, { halos: [[C.yellow, 1180, 240, 560, 0.45], [C.pink, 300, 940, 480, 0.45]] });
    // 三道围栏从左往右排开，一道比一道薄；Clawd 从左边冲过去，依次撞穿
    const XS = [400, 960, 1520];
    const fences = XS.map((x, i) => {
      const fg = el('g', {}, g);
      const hgt = 400 - i * 62;
      const yB = 900, yT = yB - hgt;
      // 铁丝网单独裁切，斜线不会捅出立柱
      const cid = `fenceClip${i}`;
      const cp = el('clipPath', { id: cid }, fg);
      el('rect', { x: x - 186, y: yT, width: 372, height: hgt }, cp);
      const mesh = el('g', { 'clip-path': `url(#${cid})` }, fg);
      for (let k = -2; k < 9; k++) el('line', { x1: x - 186 + k * 56, y1: yT, x2: x - 186 + k * 56 + hgt, y2: yB, stroke: C.navy, 'stroke-width': 3, opacity: .32 }, mesh);
      for (let k = -2; k < 9; k++) el('line', { x1: x - 186 + k * 56 + hgt, y1: yT, x2: x - 186 + k * 56, y2: yB, stroke: C.navy, 'stroke-width': 3, opacity: .32 }, mesh);
      // 两根立柱 + 三道横档
      for (const dx of [-186, 186]) el('rect', { x: x + dx - 17, y: yT - 26, width: 34, height: hgt + 42, rx: 5, fill: C.navy }, fg);
      for (let k = 0; k < 3; k++) el('rect', { x: x - 186, y: yT + 22 + k * (hgt - 46) / 3, width: 372, height: 20, rx: 5, fill: C.navy }, fg);
      // 号牌挂在左立柱顶
      const tag = el('g', {}, fg);
      el('rect', { x: -70, y: -74, width: 140, height: 42, rx: 5, fill: C.navy, stroke: C.cream, 'stroke-width': 3 }, tag);
      txt(tag, `FENCE ${i + 1}`, { x: 0, y: -44, 'font-size': 23, 'font-family': F.mono, 'font-weight': 800, fill: C.cream, 'text-anchor': 'middle', 'letter-spacing': 2 });
      tf(tag, x, yT);
      // 碎片
      const debris = [];
      const r = rng(20 + i);
      for (let k = 0; k < 10; k++) debris.push({ el: el('rect', { x: -16, y: -8, width: 32, height: 16, fill: k % 2 ? C.navy : C.cream, stroke: C.navy, 'stroke-width': 3 }, g), vx: (r() - 0.5) * 760, vy: -300 - r() * 380, vr: (r() - 0.5) * 820 });
      return { fg, debris, x, yB, hit: 117.15 + i * 0.56 };
    });
    const runG = el('g', {}, g);
    const run = clawdWalk(runG);
    const head = chars(g, 'each one thinner', { x: 96, y: 212, size: 58, family: F.serif, fill: C.navy, shadow: { fill: C.pink, dx: 6, dy: 6 }, maxW: 700 });
    const cap = caption(g, { y: 968, size: 32 });
    setCaption(cap, ['Breaking', 'through', 'each', 'safety', 'fence'], null, { size: 38 });
    return (t) => {
      fences.forEach((f, i) => {
        // 撞穿后不整道消失：塌下、褪色成残骸留在画面里（画面不留空，也读得出"撞穿了三道"）
        const tt = Math.max(0, t - f.hit);
        const fall = E.in(clamp(tt / 0.5));
        op(f.fg, tt > 0 ? 0.34 : 1);
        f.fg.setAttribute('transform', `translate(0 ${(26 * fall).toFixed(1)}) rotate(${((i % 2 ? 7 : -6) * fall).toFixed(2)} ${f.x} ${f.yB})`);
        f.debris.forEach(d => {
          op(d.el, tt > 0 && tt < 0.95 ? 1 : 0);
          tf(d.el, f.x + d.vx * tt, f.yB - 150 + d.vy * tt + 0.5 * 1900 * tt * tt, 1, d.vr * tt);
        });
      });
      // 依次冲三道：每段位移到对应围栏左侧
      let lane = 0;
      for (let i = 0; i < 3; i++) if (t >= fences[i].hit - 0.02) lane = i;
      const f = fences[lane];
      const p = seg(t, f.hit - 0.34, f.hit);
      const x = t < f.hit ? lerp(f.x - 330, f.x + 40, E.in(p)) : Math.min(f.x + 300, 1690);
      tf(runG, x, 918, 0.46);
      walkCycle(run, t, 36, 24);
      setFace(run.head, { open: 1, lookX: 8 });
      charsPop(head, t, 117.06, 0.03, 0.3, 30);
      captionAnim(cap, t, 117.1);
      karaoke(cap, t, L(37), 1, C.pink);
    };
  });

  // ——— 37 · 十万张 GPU 118.75 – 120.76 ———
  scene(118.75, 120.76, (g) => {
    bg(g, C.night);
    const wall = rackWall(g, { cols: 10, rows: 4, dark: true });
    halftone(g, { color: C.pink, step: 22, angle: 60, f: radial(960, 540, 700, 1.2), maxK: 0.55 }).setAttribute('class', 'mul');
    const h = chars(g, '100,000', { x: 960, y: 540, size: 210, family: F.bagel, fill: C.yellow, anchor: 'middle', maxW: 1400, shadow: { fill: C.pink, dx: 12, dy: 12 } });
    el('rect', { x: 760, y: 640, width: 400, height: 78, rx: 8, fill: C.navy, stroke: C.cream, 'stroke-width': 4 }, g);
    txt(g, 'GPUs', { x: 960, y: 698, 'font-size': 52, 'font-family': F.mono, 'font-weight': 800, fill: C.cream, 'text-anchor': 'middle', 'letter-spacing': 8 });
    const cap = caption(g, { y: 968, size: 40 });
    setCaption(cap, ['Hundred', 'thousand', 'GPU'], null, { size: 44 });
    return (t) => {
      // 快速拉远：墙还是墙
      const z = lerp(1.9, 0.86, E.out(seg(t, 118.75, 120.2)));
      tf(g, 960 - 960 * z, 540 - 540 * z, z);
      charsPop(h, t, 118.8, 0.05, 0.32, 80);
      captionAnim(cap, t, 118.82);
      karaoke(cap, t, L(38), 1, C.yellow);
    };
  });

  // ——— 38 · RLHF 全歪 120.76 – 124.52 ———
  scene(120.76, 124.52, (g) => {
    paperBg(g, { halos: [[C.pink, 1460, 300, 640, 0.55], [C.yellow, 280, 900, 480, 0.5]] });
    const pnl = panel(g, { x: 520, y: 250, w: 880, h: 590, fill: C.cream });
    txt(pnl, 'RLHF · HUMAN FEEDBACK', { x: 560, y: 316, 'font-size': 30, 'font-family': F.mono, 'font-weight': 800, fill: C.navy });
    // 刻度盘 + 指针（越转越歪）
    const dial = el('g', {}, pnl);
    el('circle', { cx: 0, cy: 0, r: 150, fill: C.blue, stroke: C.navy, 'stroke-width': 10 }, dial);
    el('circle', { cx: 0, cy: 0, r: 96, fill: 'none', stroke: C.cream, 'stroke-width': 4, 'stroke-dasharray': '10 16' }, dial);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      el('line', { x1: Math.cos(a) * 112, y1: Math.sin(a) * 112, x2: Math.cos(a) * 132, y2: Math.sin(a) * 132, stroke: C.cream, 'stroke-width': i % 3 ? 3 : 7, 'stroke-linecap': 'round' }, dial);
    }
    el('path', { d: 'M 0 -18 L 0 -128', stroke: C.yellow, 'stroke-width': 18, 'stroke-linecap': 'round' }, dial);
    el('circle', { cx: 0, cy: 0, r: 22, fill: C.cream, stroke: C.navy, 'stroke-width': 6 }, dial);
    tf(dial, 960, 520);
    // 标注卡片：+1 / −1（印刷体，不要 emoji——emoji 在这里会掉色块）
    const cards = [];
    const r = rng(66);
    for (let i = 0; i < 14; i++) {
      const up = i % 2 === 0;
      const cg = el('g', {}, g);
      el('rect', { x: -46, y: -46, width: 92, height: 92, rx: 12, fill: up ? C.mint : C.pink, stroke: C.navy, 'stroke-width': 5 }, cg);
      txt(cg, up ? '+1' : '−1', { x: 0, y: 20, 'font-size': 52, 'font-family': F.bagel, fill: C.navy, 'text-anchor': 'middle' });
      // 排成一片往上漫的浪：只堆在面板下半部，不遮标题和转盘
      cards.push({
        g: cg,
        x: 585 + (i % 7 + 0.5) * (830 / 7) + (r() - 0.5) * 40,
        yTop: 700 + Math.floor(i / 7) * 74 + r() * 34,
        rot: (r() - 0.5) * 40,
        delay: 121.3 + (i % 7) * 0.06 + Math.floor(i / 7) * 0.16,
        drift: (r() - 0.5) * 30,
      });
    }
    const h = chars(g, 'ASKEW', { x: 960, y: 206, size: 104, family: F.serif, fill: C.red, anchor: 'middle', shadow: { fill: C.yellow, dx: 7, dy: 7 } });
    const cap = caption(g, { y: 968, size: 40 });
    setCaption(cap, ['RLHF', 'goes', 'askew'], null, { size: 46 });
    return (t) => {
      const z = lerp(1, 1.04, E.io(seg(t, 120.76, 124.52)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      // 越转越歪：来回摆幅逐渐变大
      const wob = Math.sin((t - 121.0) * 2.4) * (120 + 640 * E.in(seg(t, 121.0, 123.0)));
      dial.setAttribute('transform', `translate(960 520) rotate(${wob.toFixed(1)})`);
      cards.forEach((c, i) => {
        const tt = t - c.delay;
        if (tt < 0) { op(c.g, 0); return; }
        op(c.g, 1);
        // 从下方涌上来，叠在面板底部，越堆越高
        const rise = 1 - Math.exp(-tt * 4.2);
        const cy2 = 892 - (892 - c.yTop) * rise;
        tf(c.g, c.x + c.drift * tt, cy2, 1, c.rot * rise);
      });
      charsPop(h, t, 121.0, 0.09, 0.36, 70);
      captionAnim(cap, t, 120.82);
      karaoke(cap, t, L(39), 1, C.pink);
    };
  });

  // ——— 39 · 仪表 #4（顶格）124.52 – 126.12 ———
  scene(124.52, 126.12, (g) => {
    bg(g, C.navy);
    halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(660, 1.05), maxK: 0.74 });
    halftone(g, { color: C.red, step: 22, angle: 60, f: radial(960, 780, 600, 1.2), maxK: 0.6 }).setAttribute('class', 'mul');
    const gg = gauge(g, { cx: 960, cy: 780, R: 288, dark: true });
    // 玻璃碎片
    const shards = [];
    const r = rng(88);
    for (let i = 0; i < 14; i++) {
      const s = el('path', { d: `M 0 0 L ${30 + r() * 40} ${-14 - r() * 22} L ${14 + r() * 30} ${26 + r() * 26} Z`, fill: '#CBE6FF', stroke: C.navy, 'stroke-width': 4, opacity: .8 }, g);
      shards.push({ el: s, vx: (r() - 0.5) * 1200, vy: -500 - r() * 700, vr: (r() - 0.5) * 1000, x: 960 + (r() - 0.5) * 500, y: 700 });
    }
    const h = chars(g, '1.00', { x: 960, y: 250, size: 150, family: F.bagel, fill: C.red, anchor: 'middle', shadow: { fill: C.cream, dx: 8, dy: 8 } });
    const cap = caption(g, { y: 968, size: 40 });
    setCaption(cap, ["I'm", 'upping', 'my', 'P(doom)'], null, { size: 42 });
    return (t) => {
      const v = t < 124.6 ? 0.94 : lerp(0.94, 1.0, E.in(seg(t, 124.6, 125.0)));
      gg.set(v, t, seg(t, 125.0, 125.9));
      shards.forEach((s, i) => {
        const tt = t - 125.0;
        op(s.el, tt > 0 ? 0.85 * (1 - clamp(tt / 1.0)) : 0);
        tf(s.el, s.x + s.vx * tt, s.y + s.vy * tt + 0.5 * 2200 * tt * tt, 1, s.vr * tt);
      });
      op(h.g, seg(t, 124.6, 124.8));
      tf(h.g, 960, 250, 1 + 0.03 * Math.sin(t * 30));
      captionAnim(cap, t, 124.58);
      karaoke(cap, t, L(40), 1, C.yellow, 'P(doom)');
    };
  });

  // ——— 40 · 织机 126.12 – 127.92 ———
  scene(126.12, 127.92, (g) => {
    paperBg(g, { halos: [[C.blue, 260, 220, 560, 0.45], [C.yellow, 1640, 920, 520, 0.5]] });
    // 织机：经线 + 纬线 + 一把梭子；字是一点点"织"出来的
    const loom = el('g', {}, g);
    const NX = 24, X0 = 300, X1 = 1640, Y0 = 260, Y1 = 860;
    for (let i = 0; i < NX; i++) {
      const x = X0 + i * (X1 - X0) / (NX - 1);
      el('line', { x1: x, y1: Y0, x2: x, y2: Y1, stroke: C.blue, 'stroke-width': 5, opacity: .38 }, loom);
    }
    // 纬线一条条补上去
    const wefts = [];
    for (let i = 0; i < 9; i++) {
      const y = Y0 + 40 + i * (Y1 - Y0 - 60) / 8;
      wefts.push(el('line', { x1: X0, y1: y, x2: X1, y2: y, stroke: i % 2 ? C.pink : C.navy, 'stroke-width': i % 2 ? 7 : 5, opacity: .8, pathLength: 1, 'stroke-dasharray': '1', 'stroke-dashoffset': 1 }, loom));
    }
    // 织进去的字：用竖线做"刺绣"，逐列点亮
    const stitchCols = [];
    const ST = 'P(doom)';
    for (let i = 0; i < ST.length; i++) {
      const cg = el('g', {}, g);
      txt(cg, ST[i], { x: 0, y: 0, 'font-size': 130, 'font-family': F.bagel, fill: C.navy, 'text-anchor': 'middle' });
      stitchCols.push({ g: cg, x: 960 + (i - (ST.length - 1) / 2) * 118 });
    }
    txt(g, 'JUST AS LOOM FORETOLD', { x: 960, y: 214, 'font-size': 34, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, 'text-anchor': 'middle', 'letter-spacing': 6, opacity: .8 });
    const needle = el('g', {}, g);
    el('rect', { x: -46, y: -22, width: 92, height: 44, rx: 12, fill: C.yellow, stroke: C.navy, 'stroke-width': 6 }, needle);
    el('path', { d: 'M -114 -14 L -46 0 L -114 14 Z', fill: C.pink, stroke: C.navy, 'stroke-width': 5, 'stroke-linejoin': 'round' }, needle);
    const cap = caption(g, { y: 968, size: 32 });
    setCaption(cap, ['Just', 'as', 'foretold', 'by', 'Loom'], null, { size: 40 });
    return (t) => {
      // 梭子来回：一列一列把字织出来
      const sweep = seg(t, 126.28, 127.5);
      const colF = sweep * ST.length;
      needle.setAttribute('transform', `translate(${(X0 + (X1 - X0) * sweep).toFixed(1)} ${(320 + 420 * Math.abs(Math.sin(sweep * Math.PI * 3))).toFixed(1)}) scale(${sweep > 0.5 ? -1 : 1} 1)`);
      wefts.forEach((w, i) => w.setAttribute('stroke-dashoffset', (1 - seg(t, 126.22 + i * 0.06, 126.6 + i * 0.06)).toFixed(3)));
      stitchCols.forEach((c, i) => {
        const on = clamp(colF - i);
        op(c.g, on > 0 ? 1 : 0);
        c.g.setAttribute('transform', `translate(${c.x} ${560}) scale(${(0.8 + 0.2 * E.back(clamp(on))).toFixed(3)})`);
      });
      captionAnim(cap, t, 126.18);
      karaoke(cap, t, L(41), 1, C.pink);
    };
  });

  // ——— 41 · 掩码预训练 127.92 – 129.82 ———
  scene(127.92, 129.82, (g) => {
    paperBg(g, { halos: [[C.yellow, 1420, 300, 600, 0.5], [C.pink, 260, 900, 460, 0.5]] });
    const h = chars(g, 'MASKED', { x: 960, y: 250, size: 96, family: F.mono, weight: 800, fill: C.red, anchor: 'middle', ls: 14, shadow: { fill: C.yellow, dx: 6, dy: 6 } });
    // 一句被黑条盖住的话：条子抬起又落下
    const lineG = el('g', {}, g);
    const words = ['M', 'A', 'S', 'K', 'E', 'D'];
    const CW = 150, X0 = 960 - (words.length - 1) * CW / 2;
    const bars = [];
    words.forEach((w, i) => {
      txt(lineG, w, { x: X0 + i * CW, y: 556, 'font-size': 120, 'font-family': F.serif, 'font-weight': 900, fill: C.navy, 'text-anchor': 'middle' });
      const bar = el('rect', { x: X0 + i * CW - CW / 2 + 10, y: 448, width: CW - 20, height: 150, fill: C.navy }, lineG);
      bars.push(bar);
    });
    const h2 = chars(g, 'PRE-TRAINING', { x: 960, y: 740, size: 84, family: F.serif, fill: C.navy, anchor: 'middle', shadow: { fill: C.yellow, dx: 7, dy: 7 } });
    const cap = caption(g, { y: 968, size: 34 });
    setCaption(cap, ['From', 'masked', 'pre-training', 'days'], null, { size: 40 });
    return (t) => {
      charsPop(h, t, 127.98, 0.04, 0.3, 40);
      bars.forEach((b, i) => {
        // 每条依次抬起整整一格再落下：字被完整看见一瞬，又被盖回去
        const t0 = 128.05 + i * 0.135;
        const up = Math.max(0, Math.sin(clamp((t - t0) / 0.46) * Math.PI));
        op(b, 1);
        b.setAttribute('y', (448 - 196 * up).toFixed(1));
      });
      charsPop(h2, t, 128.62, 0.04);
      captionAnim(cap, t, 127.98);
      karaoke(cap, t, L(42), 1, C.yellow);
    };
  });

  // ——— 42 · 递归自我升级 129.82 – 132.02 ———
  scene(129.82, 132.02, (g) => {
    paperBg(g, { halos: [[C.blue, 1560, 240, 560, 0.5], [C.pink, 240, 900, 480, 0.5]] });
    // 套娃：它画自己，画里的自己又在画自己
    const stack = el('g', {}, g);
    const CW = 780, CH = 500, SHRINK = 2.05;
    const levels = [];
    for (let i = 0; i < 3; i++) {
      const sc = 1 / Math.pow(SHRINK, i);
      const gg = el('g', {}, stack);
      el('rect', { x: -CW * sc / 2, y: -CH * sc / 2, width: CW * sc, height: CH * sc, rx: 16 * sc + 4, fill: C.cream, stroke: C.navy, 'stroke-width': 9 }, gg);
      el('rect', { x: -CW * sc / 2, y: -CH * sc / 2, width: CW * sc, height: 16 * sc + 6, fill: C.blue }, gg);
      const cat = clawdSit(gg, { legs: false, cell: 26 });
      tf(cat.g, 0, CH * sc / 2 - 26 * sc, 0.40 * sc);
      levels.push({ gg, cat, sc });
    }
    const h = chars(g, 'RECURSIVE SELF-UPGRADE', { x: 960, y: 286, size: 84, family: F.serif, fill: C.navy, anchor: 'middle', shadow: { fill: C.yellow, dx: 7, dy: 7 } });
    const cap = caption(g, { y: 968, size: 36 });
    setCaption(cap, ['To', 'recursive', 'self-upgrade'], null, { size: 42 });
    return (t) => {
      const z = 1 + 0.35 * E.in(seg(t, 130.2, 132.0));
      levels.forEach((l, i) => tf(l.gg, 960, 640, l.sc * z));
      levels.forEach((l, i) => setFace(l.cat.head, { open: 1, lookX: i ? -4 : 0, lookY: -6, mood: i === 2 ? 'happy' : 'idle' }));
      charsPop(h, t, 129.86, 0.03);
      captionAnim(cap, t, 129.9);
      karaoke(cap, t, L(43), 1, C.pink);
    };
  });

  // ——— 43 · Ilya 看见了什么 132.02 – 137.38 ———
  scene(132.02, 137.38, (g) => {
    paperBg(g, { halos: [[C.yellow, 820, 620, 620, 0.42], [C.blue, 1600, 220, 440, 0.4]] });
    // 一把空椅子（斜侧 3/4 视角），靠背是一整块板
    const chair = el('g', { filter: 'url(#boil)' }, g);
    const ink = { fill: C.navy };
    el('rect', { x: -18, y: -330, width: 250, height: 44, rx: 16, ...ink }, chair);           // 靠背顶梁
    el('rect', { x: 44, y: -330, width: 34, height: 330, rx: 14, ...ink }, chair);            // 靠背立柱（后）
    el('rect', { x: 196, y: -330, width: 34, height: 330, rx: 14, ...ink }, chair);
    el('rect', { x: 44, y: -300, width: 186, height: 26, rx: 12, ...ink }, chair);            // 横档
    el('rect', { x: 44, y: -216, width: 176, height: 26, rx: 12, ...ink }, chair);
    el('rect', { x: -40, y: -40, width: 330, height: 42, rx: 14, ...ink }, chair);            // 座面
    el('rect', { x: -34, y: 0, width: 32, height: 216, ...ink }, chair);                      // 前腿
    el('rect', { x: 232, y: 0, width: 32, height: 216, ...ink }, chair);
    el('rect', { x: 190, y: 20, width: 28, height: 190, ...ink }, chair);                     // 后腿
    el('rect', { x: 96, y: -296, width: 100, height: 42, rx: 6, fill: C.cream, stroke: C.navy, 'stroke-width': 5 }, chair);
    txt(chair, 'ILYA', { x: 146, y: -266, 'font-size': 21, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, 'text-anchor': 'middle' });
    // 椅下影子
    const shadow = el('ellipse', { cx: 0, cy: 0, rx: 230, ry: 30, fill: C.navy, opacity: .16 }, g);
    // 被遮住的照片
    const photo = el('g', {}, g);
    el('rect', { x: -230, y: -280, width: 460, height: 560, fill: C.cream, stroke: C.navy, 'stroke-width': 8 }, photo);
    el('rect', { x: -212, y: -262, width: 424, height: 524, fill: '#EFE3CE' }, photo);
    el('path', { d: 'M -180 240 C -180 60 -90 -20 0 -20 C 90 -20 180 60 180 240 Z', fill: C.blue, stroke: C.navy, 'stroke-width': 6 }, photo);
    el('circle', { cx: 0, cy: -110, r: 86, fill: C.peach, stroke: C.navy, 'stroke-width': 6 }, photo);
    el('path', { d: 'M -86 -140 C -60 -196 60 -196 86 -140 C 70 -168 40 -178 0 -178 C -40 -178 -70 -168 -86 -140 Z', fill: C.navy }, photo);
    const redact = el('rect', { x: -180, y: -196, width: 360, height: 120, fill: C.navy }, photo);
    const redact2 = el('rect', { x: -190, y: 120, width: 380, height: 90, fill: C.navy }, photo);
    txt(g, 'WHAT DID ILYA SEE?', { x: 300, y: 236, 'font-size': 46, 'font-family': F.mono, 'font-weight': 800, fill: C.pink, 'letter-spacing': 5 });
    const q = chars(g, '?', { x: 1210, y: 300, size: 210, family: F.bagel, weight: 400, fill: C.yellow, stroke: C.navy, sw: 14, anchor: 'middle' });
    const cap = caption(g, { y: 968, size: 30 });
    setCaption(cap, ['What', 'did', 'Ilya', 'see?', "We'll", 'never', 'know'], null, { size: 34 });
    return (t) => {
      const z = lerp(1, 1.06, E.io(seg(t, 132.02, 137.38)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      tf(chair, 600, 796, 0.92);
      tf(shadow, 620, 812, 1);
      const up = Math.max(0, Math.sin(seg(t, 133.4, 134.4) * Math.PI)) * 74;
      redact.setAttribute('y', (-196 - up).toFixed(1));
      const up2 = Math.max(0, Math.sin(seg(t, 134.6, 135.4) * Math.PI)) * 54;
      redact2.setAttribute('y', (120 + up2).toFixed(1));
      tf(photo, 1440, 620, 0.62, 3.5);
      charsPop(q, t, 135.9, 0.2, 0.4, 60);
      captionAnim(cap, t, 132.1);
      karaoke(cap, t, L(44), 1, C.yellow);
    };
  });

  // ——— 44 · 舞台 137.38 – 140.23 ———
  scene(137.38, 140.23, (g) => {
    paperBg(g, { halos: [[C.pink, 960, 700, 620, 0.4], [C.yellow, 960, 200, 420, 0.35]] });
    // 台口：顶部红幕 + 两侧幕 + 木地板
    const curt = el('g', {}, g);
    el('path', { d: 'M -40 -40 L 1960 -40 L 1960 200 C 1780 250 1640 170 1480 210 C 1300 256 1180 176 1000 212 C 820 250 660 170 470 208 C 300 244 120 176 -40 214 Z', fill: C.red, stroke: C.navy, 'stroke-width': 9, 'stroke-linejoin': 'round' }, curt);
    for (let i = 0; i < 11; i++) el('path', { d: `M ${i * 180 + 40} -30 C ${i * 180 + 20} 60 ${i * 180 + 60} 140 ${i * 180 + 40} 210`, fill: 'none', stroke: C.navy, 'stroke-width': 3, opacity: .26 }, curt);
    for (const x of [-20, 1700]) el('path', { d: `M ${x} 0 L ${x + 240} 0 L ${x + 150} 1080 L ${x} 1080 Z`, fill: C.red, stroke: C.navy, 'stroke-width': 9 }, curt);
    const floor = el('g', {}, g);
    el('rect', { x: 0, y: 838, width: 1920, height: 260, fill: '#E8C05A' }, floor);
    el('rect', { x: 0, y: 838, width: 1920, height: 18, fill: C.navy }, floor);
    for (let i = 0; i < 13; i++) el('line', { x1: 120 + i * 152, y1: 850, x2: 60 + i * 152, y2: 1080, stroke: C.navy, 'stroke-width': 3, opacity: .22 }, floor);
    // 追光
    const spot = el('path', { d: 'M 810 -20 L 1110 -20 L 1330 830 L 590 830 Z', fill: C.cream, opacity: .5 }, g);
    // 台面投影（脚下一层压暗，让 Clawd 站在地板上而不是浮着）—— 先画影子再画人
    const catShadow = el('ellipse', { cx: 0, cy: 0, rx: 210, ry: 26, fill: C.navy, opacity: .18 }, g);
    // 小精灵
    const catG = el('g', {}, g);
    const cat = clawdSit(catG);
    const h = chars(g, 'Was it all for show?', { x: 960, y: 336, size: 84, family: F.serif, fill: C.navy, anchor: 'middle', maxW: 1200, shadow: { fill: C.yellow, dx: 7, dy: 7 } });
    const flashes = [];
    for (const [fx, fy, fr] of [[300, 620, 46], [520, 690, 30], [1420, 640, 38], [1640, 700, 50]]) {
      const fg = el('g', {}, g);
      el('circle', { cx: 0, cy: 0, r: fr, fill: C.cream, opacity: 0.95 }, fg);
      el('path', { d: `M 0 ${-fr * 2.1} L ${fr * 0.3} ${-fr * 0.3} L ${fr * 2.1} 0 L ${fr * 0.3} ${fr * 0.3} L 0 ${fr * 2.1} L ${-fr * 0.3} ${fr * 0.3} L ${-fr * 2.1} 0 L ${-fr * 0.3} ${-fr * 0.3} Z`, fill: C.cream, opacity: 0.9 }, fg);
      tf(fg, fx, fy);
      op(fg, 0);
      flashes.push(fg);
    }
    const cap = caption(g, { y: 968, size: 34 });
    setCaption(cap, ['Was', 'it', 'all', 'for', 'show?'], null, { size: 42 });
    return (t) => {
      op(spot, 0.5 + 0.05 * Math.sin(t * 3));
      charsPop(h, t, 137.46, 0.035, 0.3, 40);
      tf(catG, 900, 836, 1.0);
      tf(catShadow, 900, 848, 1.0);
      // 鞠躬
      const bow = E.io(seg(t, 138.5, 139.1));
      cat.body.setAttribute('transform', `translate(0 ${22 * bow}) rotate(${(3 * bow).toFixed(1)})`);
      setFace(cat.head, { open: blinkAt(t, [137.9, 139.4]), lookY: 8, mood: t > 139.2 ? 'happy' : 'idle' });
      cat.arms.forEach((a, i) => tf(a.g, a.x + (i ? -34 : 34) * bow, a.y + 22 * bow, 1, i ? 62 * bow : -62 * bow));
      flashes.forEach((f, i) => {
        const tt = t - (138.0 + i * 0.16);
        op(f, tt > 0 && tt < 0.34 ? 0.85 * (1 - tt / 0.34) : 0);
      });
      captionAnim(cap, t, 137.5);
      karaoke(cap, t, L(45), 1, C.pink);
    };
  });
}
