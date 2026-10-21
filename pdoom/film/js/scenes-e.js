// 尾声：140.23 – 156.651 s（拉远：桌上成千上万份同款案卷；印章落空）
import {
  C, F, el, txt, tf, op, show, clamp, seg, lerp, E, pop, rng, chars, charsPop, halftone, radial, edge,
  bg, caption, setCaption, karaoke, captionAnim, stampEl, stampAnim, heartPath
} from './lib.js';
import { paperBg, nightBg, bigNumeral, panel, deskFiles, gauge, paperclip } from './props.js';
import { clawdSit, clawdCurl, clawdLoaf, setFace, blinkAt, CLAWD } from './clawd.js';

export default function scenesE(scene) {
  scene(140.23, 156.651, (g) => {
    // —— 桌面 ——
    el('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#E6D6B8' }, g);
    const world = el('g', {}, g);
    const desk = el('g', {}, world);
    el('rect', { x: -2600, y: -1600, width: 5200, height: 3200, fill: '#EADCC2' }, desk);
    for (let i = 0; i < 46; i++) {
      el('path', { d: `M -2600 ${-1600 + i * 72} C -600 ${-1600 + i * 72 - 14} 900 ${-1600 + i * 72 + 26} 2600 ${-1600 + i * 72 + 4}`, fill: 'none', stroke: '#C9B694', 'stroke-width': 3, opacity: .3 }, desk);
    }

    // —— 成千上万份同款案卷 ——
    const files = deskFiles(world, { cols: 9, rows: 7, dx: 620, dy: 520, spread: 40, seed: 11 });

    // —— 这一份（本片主角）——
    const center = el('g', {}, world);
    const CW = 900, CH = 640;
    el('rect', { x: -CW / 2 + 14, y: -CH / 2 + 16, width: CW, height: CH, rx: 10, fill: C.navy, opacity: .22 }, center);
    el('rect', { x: -CW / 2, y: -CH / 2, width: CW, height: CH, rx: 10, fill: C.yellow, stroke: C.navy, 'stroke-width': 10 }, center);
    // 卷宗上的标签槽
    el('path', { d: `M ${-CW / 2 + 26} ${-CH / 2 + 52} L -250 ${-CH / 2 + 52} L -206 ${-CH / 2 + 8} L 40 ${-CH / 2 + 8} L 84 ${-CH / 2 + 52} L ${CW / 2 - 26} ${-CH / 2 + 52}`, fill: 'none', stroke: C.navy, 'stroke-width': 9, 'stroke-linejoin': 'round' }, center);
    // 档案卡
    el('rect', { x: -CW / 2 + 54, y: 40, width: 470, height: 178, rx: 4, fill: C.cream, stroke: C.navy, 'stroke-width': 6 }, center);
    txt(center, 'CASE No.2026-DOOM-001', { x: -CW / 2 + 80, y: 102, 'font-size': 33, 'font-family': F.mono, 'font-weight': 800, fill: C.navy });
    txt(center, 'SUBJECT: CLAWD', { x: -CW / 2 + 80, y: 156, 'font-size': 38, 'font-family': F.sans, 'font-weight': 900, fill: C.navy });
    const statusT = txt(center, 'STATUS: OPEN', { x: -CW / 2 + 80, y: 200, 'font-size': 29, 'font-family': F.mono, 'font-weight': 800, fill: C.red, opacity: .9 });
    // 红色骑缝章（半枚，压边）
    const edgeStamp = el('g', {}, center);
    el('circle', { cx: CW / 2 - 40, cy: -CH / 2 + 118, r: 74, fill: 'none', stroke: C.red, 'stroke-width': 8, opacity: .75 }, edgeStamp);
    txt(edgeStamp, 'FILE', { x: CW / 2 - 40, y: -CH / 2 + 106, 'font-size': 26, 'font-family': F.mono, 'font-weight': 800, fill: C.red, 'text-anchor': 'middle', opacity: .8 });

    // —— 桌上的小精灵 ——
    const catG = el('g', {}, world);
    const cat = clawdSit(catG);

    // —— 笔 & 杯子 ——
    const props = el('g', {}, world);
    const pen = el('g', {}, props);
    el('rect', { x: -150, y: -16, width: 300, height: 32, rx: 16, fill: C.blue, stroke: C.navy, 'stroke-width': 6 }, pen);
    el('path', { d: 'M 150 -14 L 208 0 L 150 14 Z', fill: C.cream, stroke: C.navy, 'stroke-width': 6, 'stroke-linejoin': 'round' }, pen);
    tf(pen, -520, 470, 1, -13);
    const cup = el('g', {}, props);
    el('path', { d: 'M -62 -86 L 62 -86 L 54 8 L -54 8 Z', fill: C.cream, stroke: C.navy, 'stroke-width': 7, 'stroke-linejoin': 'round' }, cup);
    el('path', { d: 'M -52 -66 L 52 -66', stroke: C.pink, 'stroke-width': 10 }, cup);
    el('ellipse', { cx: 0, cy: 8, rx: 54, ry: 12, fill: C.navy, opacity: .22 }, cup);
    tf(cup, 560, 430, 1.1, 6);

    // —— 落空的印章 ——
    const st = stampEl(world, 'CLOSED', { size: 190, color: C.red, border: 14, padX: 44 });
    const stInk = el('g', {}, world);   // 桌上留下的墨：故意偏到纸外
    el('rect', { x: -250, y: -110, width: 500, height: 220, rx: 12, fill: 'none', stroke: C.red, 'stroke-width': 12, opacity: .0 }, stInk);
    txt(stInk, 'CLOSED', { x: 0, y: 34, 'font-size': 120, 'font-family': F.sans, 'font-weight': 900, fill: C.red, 'text-anchor': 'middle', opacity: 0 });
    tf(stInk, 790, -246, 1, 13);

    // —— 收尾卡 ——
    const endCard = el('g', {}, g);
    el('rect', { x: -960, y: -540, width: 1920, height: 1080, fill: C.navy }, endCard);
    const endNo = txt(endCard, 'CASE No.2026-DOOM-001', { x: 0, y: -70, 'font-size': 30, 'font-family': F.mono, 'font-weight': 800, fill: C.pink, 'text-anchor': 'middle', 'letter-spacing': 8 });
    const endT = txt(endCard, 'CASE FILE · OPEN', { x: 0, y: 40, 'font-size': 96, 'font-family': F.bagel, fill: C.cream, 'text-anchor': 'middle', 'letter-spacing': 4 });
    const endSub = txt(endCard, 'P(doom) = 1.00', { x: 0, y: 150, 'font-size': 44, 'font-family': F.mono, 'font-weight': 800, fill: C.yellow, 'text-anchor': 'middle', 'letter-spacing': 6 });
    tf(endCard, 960, 540);
    op(endCard, 0);

    return (t) => {
      // 大拉远：从这一份，拉到整张桌子
      const z = lerp(1.02, 0.36, E.io(seg(t, 140.23, 147.2)));
      tf(world, 960, 540 + 60 * seg(t, 140.23, 147.2), z);
      // 小精灵：一直在那儿，眨眼、抬头
      tf(catG, 268, 292, 0.72);
      setFace(cat.head, { open: blinkAt(t, [141.4, 144.2, 149.4, 152.2]), lookY: -6, lookX: Math.sin(t * 0.9) * 6, mood: t > 149.6 ? 'happy' : 'idle' });
      cat.arms.forEach((a, i) => tf(a.g, a.x, a.y, 1, i ? -8 : 8));
      // 印章落下：落在纸外的桌面上
      const fall = E.in(seg(t, 149.0, 149.34));
      const t0 = 149.34;
      if (t < t0 - 0.09) op(st.g, 0);
      else {
        const after = Math.max(0, t - t0);
        const bounce = 1 + 0.06 * Math.sin(after * 26) * Math.exp(-after * 8);
        op(st.g, 0.92);
        if (t < t0) tf(st.g, 900, -230 - 520 * (1 - fall), lerp(1.6, 1, fall) * bounce, 15);
        else tf(st.g, 900, -230 + 6 * Math.sin(after * 12) * Math.exp(-after * 5), bounce, 15);
      }
      // 桌面留下的一圈墨（证明它盖歪了、盖空了）
      const inkP = seg(t, 149.5, 149.8);
      op(stInk, inkP * 0.8);
      // 纸被风掀一下
      const lift = Math.max(0, Math.sin(seg(t, 149.8, 150.7) * Math.PI));
      center.setAttribute('transform', `translate(0 ${(-8 * lift).toFixed(1)}) rotate(${(0.9 * lift).toFixed(2)})`);
      // 收尾：先压暗桌面，再推字
      const dim = seg(t, 150.6, 151.6);
      const cardIn = seg(t, 151.2, 152.4);
      op(endCard, dim * 0.78 + cardIn * 0.22);
      tf(endCard, 960, 540);
      op(endNo, cardIn);
      op(endT, cardIn);
      op(endSub, seg(t, 152.0, 152.9));
      statusT.setAttribute('opacity', t > 151.2 ? 0.9 : 0.9);
    };
  });
}
