// 第一幕：立案 —— 0 到 16.6 s（封面、档案照、电路、耸肩、训练损失、主仆翻面、深渊）
import {
  C, F, el, txt, tf, op, show, clamp, seg, lerp, E, pop, rng, chars, charsPop, halftone, radial, edge,
  bg, caption, setCaption, karaoke, captionAnim, stampEl, stampAnim, heartPath
} from './lib.js';
import { paperBg, nightBg, heightChart, bigNumeral, panel, starburst, bubble, edgeCrowd, chart, drawOn, tinyPerson } from './props.js';
import { clawdSit, clawdPeek, clawdWalk, walkCycle, setFace, blinkAt, CLAWD, armTo } from './clawd.js';
import { LY } from './lyrics.js';

const L = i => LY[i];

export default function scenesA(scene) {
  // ——— 封面 0 – 2.056 ———
  scene(0, 2.056, (g) => {
    bg(g, C.blue);
    halftone(g, { color: C.navy, step: 24, angle: 20, f: edge(820, 1.4), maxK: 0.7 });
    halftone(g, { color: C.pink, step: 22, angle: 70, f: radial(1720, 980, 520, 1.1), maxK: 0.62 }).setAttribute('class', 'mul');
    halftone(g, { color: C.yellow, step: 22, angle: 45, f: radial(180, 150, 420, 1.2), maxK: 0.6 });
    txt(g, 'FILE 001 / 001', { x: 62, y: 74, 'font-size': 24, 'font-family': F.mono, 'font-weight': 800, fill: C.cream, 'letter-spacing': 2 });
    txt(g, 'P(DOOM) · CASE FILE', { x: 1858, y: 74, 'font-size': 24, 'font-family': F.mono, 'font-weight': 800, fill: C.cream, 'text-anchor': 'end', 'letter-spacing': 2 });
    const title = chars(g, 'P(doom)', { x: 960, y: 790, size: 250, family: F.bagel, weight: 400, fill: C.cream, anchor: 'middle', ls: 8, shadow: { fill: C.navy, dx: 12, dy: 12 } });
    const peek = clawdPeek(g);
    const sub = chars(g, 'a case file on one small sprite', { x: 960, y: 930, size: 40, family: F.sans, weight: 900, fill: C.cream, anchor: 'middle', ls: 2 });
    return (t) => {
      title.items.forEach((it, i) => {
        const t0 = 0.02 + i * 0.1;
        const p = seg(t, t0 - 0.22, t0);
        if (t < t0 - 0.24) { op(it.g, 0); return; }
        op(it.g, 1);
        const y = it.y - 760 * (1 - E.in(p));
        const a = Math.max(0, t - t0);
        const sq = t < t0 ? 1.12 : 1 - 0.24 * Math.exp(-a * 9) * Math.cos(a * 26);
        it.g.setAttribute('transform', `translate(${it.x} ${y}) scale(${(1 / sq).toFixed(3)} ${sq.toFixed(3)})`);
      });
      const ph = seg(t, 1.34, 1.68);
      tf(peek.inner, 960, lerp(760, 352, E.back(ph)), 0.82, Math.sin(t * 2.6) * 2.5);
      op(peek.g, t >= 1.3 ? 1 : 0);
      setFace(peek.head, { open: blinkAt(t, [1.62, 1.94]), lookX: Math.sin(t * 2.4) * 5, lookY: 6 });
      peek.paws.forEach((p, i) => {
        const pp = seg(t, 1.42 + i * 0.05, 1.66 + i * 0.05);
        op(p, t >= 1.42 ? 1 : 0);
        tf(p, 960 + (i ? 152 : -152), lerp(600, 508, E.back(pp)), 1, i ? 7 : -7);
      });
      charsPop(sub, t, 1.05, 0.018, 0.26, 22);
    };
  });

  // ——— 0 · 档案照 2.056 – 5.88 ———
  scene(2.056, 5.88, (g) => {
    paperBg(g, { halos: [[C.yellow, 1500, 520, 720, 0.66], [C.blue, 1880, 40, 380, 0.58]] });
    heightChart(g, { x: 700, y0: 210, y1: 950, w: 760, labels: 'right' });
    // 档案信息
    const info = el('g', {}, g);
    txt(info, 'SUBJECT · 01', { x: 120, y: 300, 'font-size': 26, 'font-family': F.mono, 'font-weight': 800, fill: C.pink });
    txt(info, 'CLAWD', { x: 118, y: 372, 'font-size': 66, 'font-family': F.bagel, fill: C.navy });
    txt(info, 'orange · 22 cm · writes code', { x: 120, y: 426, 'font-size': 30, 'font-family': F.sans, 'font-weight': 900, fill: C.navy });
    txt(info, 'MARKS', { x: 120, y: 492, 'font-size': 24, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, opacity: .6 });
    txt(info, 'two vertical eyes · never sleeps', { x: 120, y: 536, 'font-size': 30, 'font-family': F.sans, 'font-weight': 900, fill: C.navy });
    // 身高牌
    const plate = el('g', {}, g);
    el('rect', { x: -340, y: -116, width: 680, height: 214, rx: 8, fill: C.navy }, plate);
    txt(plate, 'CLAWD', { x: 0, y: -50, 'font-size': 58, 'font-family': F.mono, 'font-weight': 800, fill: C.cream, 'text-anchor': 'middle' });
    txt(plate, 'CASE No.2026-DOOM-001', { x: 0, y: -2, 'font-size': 24, 'font-family': F.mono, 'font-weight': 500, fill: C.cream, 'text-anchor': 'middle', opacity: .85 });
    const charge = txt(plate, '', { x: 0, y: 52, 'font-size': 32, 'font-family': F.sans, 'font-weight': 900, fill: C.cream, 'text-anchor': 'middle' });
    charge.innerHTML = 'CHARGE: <tspan fill="#FFC628">AGI in the eyes</tspan>';
    // 主体
    const catG = el('g', {}, g);
    const cat = clawdSit(catG);
    const spark = starburst(g, { r1: 30, r2: 54, points: 16, fill: C.yellow, ink: C.navy });
    txt(spark, 'AGI', { x: 0, y: 10, 'font-size': 24, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, 'text-anchor': 'middle' });
    const bub = bubble(g, { w: 250, h: 120 });
    txt(bub, 'hi.', { x: 0, y: 24, 'font-size': 62, 'font-family': F.cute, fill: C.navy, 'text-anchor': 'middle' });
    const cap = caption(g, {});
    setCaption(cap, ['I', 'see', 'sparks', 'of', 'AGI', 'in', 'your', 'eyes'], null, { size: 38 });
    return (t) => {
      const z = lerp(1, 1.045, E.io(seg(t, 2.06, 5.88)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      tf(catG, 1080, lerp(1220, 640, E.back(seg(t, 2.1, 2.55))), 1.15);
      const squint = (t > 3.2 && t < 3.5) || (t > 4.2 && t < 4.5);
      const agi = seg(t, 3.62, 3.9) - seg(t, 5.0, 5.2);
      setFace(cat.head, {
        open: squint ? 0.12 : Math.min(1, blinkAt(t, [2.9, 5.4])),
        lookX: Math.sin(t * 1.2) * 5, lookY: agi > 0.2 ? -6 : 2,
        spark: clamp(agi * 1.6),
      });
      tf(cat.body, 0, 0 + Math.sin(t * 2.4) * 2, 1, -2 + Math.sin(t * 1.7) * 2);
      cat.arms.forEach((a, i) => { tf(a.g, a.x, a.y, 1, i ? -3 : 3); });
      tf(plate, 1092, lerp(1330, 812, E.back(seg(t, 2.3, 2.7))), 0.72, -1.2);
      op(info, seg(t, 2.5, 2.8)); tf(info, -24 * (1 - E.out(seg(t, 2.5, 2.8))), 0);
      op(spark, agi > 0.05 ? 1 : 0); tf(spark, 1214, 566 - 10 * agi, pop(t, 3.62, 0.25) * 1.2 * (1 + 0.05 * Math.sin(t * 26)), 8);
      op(bub, t > 4.7 ? 1 : 0); tf(bub, 1300, 430, pop(t, 4.7, 0.3) * 0.9, 2);
      captionAnim(cap, t, 2.2);
      karaoke(cap, t, L(0), 1);
    };
  });

  // ——— 1 · 电路 5.88 – 7.72 ———
  scene(5.88, 7.72, (g) => {
    bg(g, C.paper);
    halftone(g, { color: C.pink, step: 22, angle: 30, f: radial(960, 520, 760, 0.85), maxK: 0.66 }).setAttribute('class', 'mul');
    const eye = el('g', {}, g);
    tf(eye, 960, 520);
    el('rect', { x: -230, y: -330, width: 460, height: 660, rx: 200, fill: CLAWD.body, stroke: C.navy, 'stroke-width': 14 }, eye);
    el('rect', { x: -66, y: -190, width: 132, height: 380, rx: 66, fill: CLAWD.eye }, eye);
    el('rect', { x: -30, y: -152, width: 42, height: 104, rx: 21, fill: C.cream }, eye);
    // 电路从瞳孔长出来
    const circ = el('g', {}, g);
    const paths = [];
    const r = rng(11);
    for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2;
      let x = 960 + Math.cos(a) * 70, y = 520 + Math.sin(a) * 190;
      let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      for (let k = 0; k < 4; k++) {
        x += Math.cos(a) * (60 + r() * 120); y += Math.sin(a) * (60 + r() * 120);
        if (k % 2) x += (r() - 0.5) * 90; else y += (r() - 0.5) * 90;
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      const p = el('path', { d, fill: 'none', stroke: C.blue, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1', 'stroke-dashoffset': 1 }, circ);
      const dot = el('circle', { cx: x, cy: y, r: 10, fill: C.yellow, stroke: C.navy, 'stroke-width': 4 }, circ);
      paths.push({ p, dot });
    }
    const label = txt(g, 'CIRCUIT / ARRAY', { x: 120, y: 140, 'font-size': 26, 'font-family': F.mono, 'font-weight': 800, fill: C.navy });
    const cap = caption(g, {});
    setCaption(cap, ['Your', 'circuits', 'make', 'me', 'nervous,'], null, { size: 40 });
    return (t) => {
      const z = lerp(1, 1.55, E.in(seg(t, 5.88, 7.7)));
      tf(g, 960 - 960 * z, 520 - 520 * z, z);
      eye.setAttribute('transform', `rotate(${Math.sin(t * 22) * 1.2})`);
      paths.forEach((o, i) => {
        const p = clamp((t - 5.95 - i * 0.06) * 3.2);
        o.p.setAttribute('stroke-dashoffset', (1 - p).toFixed(3));
        op(o.dot, p > 0.95 ? 1 : 0);
      });
      op(label, seg(t, 6.0, 6.3));
      captionAnim(cap, t, 5.95);
      karaoke(cap, t, L(1), 1);
    };
  });

  // ——— 2 · 意料之中 7.72 – 9.52 ———
  scene(7.72, 9.52, (g) => {
    paperBg(g, { halos: [[C.yellow, 1450, 560, 640, 0.66], [C.blue, 40, 1020, 420, 0.56]] });
    const big = txt(g, '02', { x: 1880, y: 850, 'font-size': 620, 'font-family': F.bagel, fill: '#FFC9D8', 'text-anchor': 'end', opacity: .85 });
    const catG = el('g', {}, g);
    const cat = clawdSit(catG);
    const h1 = chars(g, 'NO SURPRISE', { x: 120, y: 330, size: 118, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 } });
    const st = stampEl(g, 'OF COURSE', { size: 120, color: C.red });
    const cap = caption(g, {});
    setCaption(cap, ["that's", 'no', 'surprise'], null, { size: 42 });
    return (t) => {
      charsPop(h1, t, 7.78, 0.06);
      const ent = E.back(seg(t, 7.8, 8.2));
      tf(catG, 900, lerp(1250, 760, ent), 1.06);
      // 耸肩：手臂外翻 + 头微缩
      const sh = seg(t, 8.15, 8.55);
      cat.arms.forEach((a, i) => {
        const s = i ? 1 : -1;
        tf(a.g, a.x + s * 30 * E.out(sh), a.y - 72 * E.out(sh), 1, s * 62 * E.out(sh));
      });
      setFace(cat.head, { open: 1, lookX: -6, lookY: 4, mood: 'idle' });
      const tilt = Math.sin(t * 1.8) * 3;
      tf(cat.body, 0, 10 * E.out(sh), 1, tilt);
      stampAnim(st, t, 8.62, 1400, 700, -11);
      captionAnim(cap, t, 7.86);
      karaoke(cap, t, L(2), 1);
    };
  });

  // ——— 3 · 训练损失断崖 9.52 – 13.16 ———
  scene(9.52, 13.16, (g) => {
    bg(g, C.paper);
    halftone(g, { color: C.blue, step: 24, angle: 20, f: edge(880, 1.6), maxK: 0.58 }).setAttribute('class', 'mul');
    const panelG = panel(g, { x: 92, y: 250, w: 1060, h: 560, fill: C.cream });
    const grid = el('g', {}, panelG);
    for (let i = 1; i < 4; i++) el('line', { x1: 152, y1: 346 + i * 120, x2: 1082, y2: 346 + i * 120, stroke: C.navy, 'stroke-width': 2, opacity: .16 }, grid);
    const ch = chart(panelG, { x: 152, y: 346, w: 930, h: 380, color: C.blue, lw: 12, fill: C.blue, pts: [[0, .78], [.12, .8], [.24, .79], [.36, .81], [.5, .8], [.52, .06], [.64, .09], [.78, .08], [1, .07]] });
    txt(g, 'training loss', { x: 152, y: 310, 'font-size': 28, 'font-family': F.mono, 'font-weight': 800, fill: C.navy });
    txt(g, 'step →', { x: 1120, y: 800, 'font-size': 24, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, 'text-anchor': 'end', opacity: .7 });
    const h1 = chars(g, 'THE', { x: 1250, y: 420, size: 150, family: F.serif, fill: C.navy, shadow: { fill: C.pink, dx: 8, dy: 8 } });
    const h2 = chars(g, 'DROP', { x: 1248, y: 570, size: 150, family: F.serif, fill: C.navy, shadow: { fill: C.pink, dx: 8, dy: 8 } });
    const sub = chars(g, 'after step 3,', { x: 1252, y: 660, size: 32, family: F.sans, fill: C.navy });
    const sub2 = chars(g, 'nothing is the same', { x: 1252, y: 704, size: 32, family: F.sans, fill: C.navy });
    const readout = txt(g, '0.81', { x: 1080, y: 330, 'font-size': 84, 'font-family': F.bagel, fill: C.red, 'text-anchor': 'end' });
    const clipG = el('g', {}, panelG);
    const pin = el('circle', { cx: 0, cy: 0, r: 15, fill: C.red, stroke: C.navy, 'stroke-width': 5 }, clipG);
    const catG = el('g', {}, g);
    const cat = clawdSit(catG, { legs: false });
    const cap = caption(g, {});
    setCaption(cap, ['There', 'was', 'a', 'sudden', 'drop', 'in', 'your', 'training', 'loss,'], null, { size: 36 });
    return (t) => {
      const z = lerp(1, 1.04, E.io(seg(t, 9.52, 13.16)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      drawOn(ch.path, E.io(seg(t, 9.6, 10.4)));
      const drop = seg(t, 11.146, 11.5);
      op(pin, t > 9.7 ? 1 : 0);
      pin.setAttribute('cx', (152 + 930 * lerp(0.44, 0.66, E.io(drop))).toFixed(1));
      pin.setAttribute('cy', (346 + 380 * (drop < 0.5 ? 0.2 : 0.9)).toFixed(1));
      readout.textContent = drop < 0.5 ? '0.81' : (drop < 1 ? lerp(0.81, 0.06, E.in(drop)).toFixed(2) : '0.06');
      charsPop(h1, t, 10.3, 0.09, 0.34, 90);
      charsPop(h2, t, 10.55, 0.09, 0.34, 90);
      charsPop(sub, t, 10.95, 0.02, 0.26, 20);
      charsPop(sub2, t, 11.1, 0.02, 0.26, 20);
      tf(catG, 250, 1010 + 260 * (1 - E.back(seg(t, 9.7, 10.1))), 0.62);
      setFace(cat.head, { open: 1, lookX: -6, lookY: -6, mood: t > 11.2 ? 'sad' : 'idle' });
      cat.arms.forEach((a, i) => tf(a.g, a.x, a.y, 1, i ? -18 : 18));
      captionAnim(cap, t, 9.62);
      karaoke(cap, t, L(3), 1, C.yellow, 'drop');
    };
  });

  // ——— 4 · 主仆翻面 13.16 – 16.60 ———
  scene(13.16, 16.6, (g) => {
    paperBg(g, { halos: [[C.pink, 1500, 380, 700, 0.6], [C.blue, 180, 940, 460, 0.55]] });
    // 巨大的 Clawd 坐在右侧（半身出画）
    const bigG = el('g', {}, g);
    const big = clawdSit(bigG, {});
    // 咖啡 + 伸出来的手：它真的端着，而不是浮着一根棍子
    const tray = el('g', {}, g);
    const armOut = el('path', { d: 'M 0 0 L -160 46', fill: 'none', stroke: C.navy, 'stroke-width': 62, 'stroke-linecap': 'round' }, tray);
    const armIn = el('path', { d: 'M 0 0 L -160 46', fill: 'none', stroke: CLAWD.body, 'stroke-width': 46, 'stroke-linecap': 'round' }, tray);
    const paw = el('rect', { x: -186, y: 20, width: 58, height: 56, rx: 22, fill: CLAWD.body, stroke: C.navy, 'stroke-width': 7 }, tray);
    const cup = el('g', {}, tray);
    el('path', { d: 'M -212 -36 L -102 -36 L -108 34 L -206 34 Z', fill: C.cream, stroke: C.navy, 'stroke-width': 7, 'stroke-linejoin': 'round' }, cup);
    el('path', { d: 'M -204 -18 L -110 -18', stroke: C.pink, 'stroke-width': 9 }, cup);
    el('path', { d: 'M -170 -50 q 10 -16 0 -34 M -140 -50 q 10 -16 0 -34', fill: 'none', stroke: C.navy, 'stroke-width': 5, opacity: .4 }, cup);

    // 小小的「你」：左边，戴皇冠
    const person = tinyPerson(g, {});
    const crown = el('g', {}, g);
    el('path', { d: 'M -42 0 L -32 -38 L -11 -10 L 0 -48 L 11 -10 L 32 -38 L 42 0 Z', fill: C.yellow, stroke: C.navy, 'stroke-width': 5, 'stroke-linejoin': 'round' }, crown);
    const boss = chars(g, 'BOSS', { x: 366, y: 796, size: 32, family: F.mono, fill: C.red, anchor: 'middle' });
    const h1 = chars(g, 'SERVANT', { x: 110, y: 300, size: 118, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 } });
    const h2 = chars(g, '/ BOSS', { x: 108, y: 430, size: 118, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 } });
    const cap = caption(g, {});
    setCaption(cap, ["now", "I'm", 'your', 'servant', 'and', "you're", 'my', 'boss'], null, { size: 36 });
    return (t) => {
      const z = lerp(1, 1.05, E.io(seg(t, 13.16, 16.6)));
      tf(g, 960 - 960 * z, 560 - 560 * z, z);
      charsPop(h1, t, 13.22, 0.045);
      charsPop(h2, t, 13.46, 0.045);
      tf(bigG, 1250, lerp(1300, 880, E.back(seg(t, 13.3, 13.8))), 1.06);
      setFace(big.head, { open: blinkAt(t, [14.6, 16.2]), lookX: -12, lookY: 8, mood: t > 15.9 ? 'happy' : 'idle' });
      big.body.setAttribute('transform', `translate(0 ${Math.sin(t * 2.2) * 3})`);
      const bow = seg(t, 14.9, 15.4);
      tf(tray, 1226, 878 + 30 * Math.sin(bow * Math.PI), 0.94, -2 - 6 * bow);
      tf(person, 366, lerp(1080, 940, E.out(seg(t, 13.4, 13.9))), 0.62);
      tf(crown, 366, 842 + Math.sin(t * 2) * 3, 0.92);
      op(crown, t > 14.2 ? 1 : 0);
      charsPop(boss, t, 13.9, 0.04, 0.24, 12);
      captionAnim(cap, t, 13.26);
      karaoke(cap, t, L(4), 1, C.yellow, 'servant');
    };
  });

  // ——— 5 · ChatGPT 深渊 16.60 – 22.06 ———
  scene(16.6, 22.06, (g) => {
    bg(g, C.paper);
    halftone(g, { color: C.pink, step: 22, angle: 30, f: radial(1180, 560, 820, 0.8), maxK: 0.64 }).setAttribute('class', 'mul');
    halftone(g, { color: C.yellow, step: 22, angle: 60, f: radial(180, 180, 460, 1.1), maxK: 0.55 });
    // 嘴：一整页的深渊（右侧）
    const mouth = el('g', {}, g);
    const lip = el('path', { d: 'M 560 300 C 700 210 1440 210 1600 320 C 1720 400 1720 800 1600 860 C 1440 950 700 950 560 860 C 440 780 440 380 560 300 Z', fill: CLAWD.eye, stroke: C.navy, 'stroke-width': 14, 'stroke-linejoin': 'round' }, mouth);
    // 上排牙 = 字母
    const teeth = [];
    const word = [...'ChatGPT'];
    word.forEach((ch, i) => {
      const tg = el('g', {}, mouth);
      el('path', { d: 'M -44 0 L 44 0 L 38 96 L -38 96 Z', fill: C.cream, stroke: C.navy, 'stroke-width': 6, 'stroke-linejoin': 'round' }, tg);
      txt(tg, ch, { x: 0, y: 74, 'font-size': 64, 'font-family': F.bagel, fill: C.navy, 'text-anchor': 'middle' });
      teeth.push({ g: tg, x: 660 + i * 156, y: 372 });
    });
    // 下排牙
    const lower = [];
    for (let i = 0; i < 6; i++) {
      const lg = el('g', {}, mouth);
      el('path', { d: 'M -50 0 L 50 0 L 44 -84 L -44 -84 Z', fill: C.cream, stroke: C.navy, 'stroke-width': 6, 'stroke-linejoin': 'round' }, lg);
      lower.push({ g: lg, x: 680 + i * 176, y: 862 });
    }
    const label = txt(mouth, 'CHAT', { x: 1090, y: 660, 'font-size': 150, 'font-family': F.bagel, fill: C.pink, 'text-anchor': 'middle', opacity: 0 });
    // 跑的小精灵
    const runG = el('g', {}, g);
    const run = clawdWalk(runG);
    const h1 = chars(g, "DON'T EAT ME", { x: 110, y: 250, size: 88, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 } });
    const h2 = chars(g, 'please.', { x: 112, y: 336, size: 56, family: F.sans, fill: C.navy });
    const cap = caption(g, {});
    setCaption(cap, ['ChatGPT,', 'please', "don't", 'eat', 'me', 'alive'], null, { size: 36 });
    return (t) => {
      const z = lerp(1, 1.10, E.in(seg(t, 16.6, 21.6)));
      tf(g, 960 - 960 * z, 600 - 600 * z, z);
      charsPop(h1, t, 16.66, 0.03, 0.3, 60);
      charsPop(h2, t, 17.0, 0.03, 0.26, 30);
      // 合嘴：上下牙相向，深渊变窄
      const close = E.io(seg(t, 20.2, 20.9));
      mouth.setAttribute('transform', `translate(0 ${-30 * close})`);
      teeth.forEach(tg => tg.g.setAttribute("transform", `translate(${tg.x} ${tg.y + 150 * close})`));
      lower.forEach(lg => lg.g.setAttribute("transform", `translate(${lg.x} ${lg.y - 130 * close})`));
      op(label, seg(t, 19.2, 19.5) * (1 - seg(t, 20.4, 20.8)));
      // 跑：从左到右，越来越快
      const p = seg(t, 16.9, 21.3);
      const x = lerp(200, 1580, E.in(p));
      tf(runG, x, 872 + Math.abs(Math.sin(t * 24)) * -12, 0.62);
      walkCycle(run, t, 24, 40);
      setFace(run.head, { open: 1, lookX: 8, lookY: -4 });
      captionAnim(cap, t, 16.72);
      karaoke(cap, t, L(5), 1, C.yellow, [4]);
    };
  });

}
