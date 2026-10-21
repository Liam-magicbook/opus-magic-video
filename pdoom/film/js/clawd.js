// Clawd —— Claude Code 的橙色小精灵，按「复古半调案卷」的角色配方重画。
// 造型依据它的原始像素比例（12 宽 × 8 高的方块身体、两条短竖眼、侧面短手、四条短腿），
// 换成厚墨线 + 平涂 + 一点点高光。所有姿势共用 clawdFace / setFace 接口。
import { el, txt, tf, op, show, seg, lerp, clamp, E, C, F, heartPath } from './lib.js';

export const CLAWD = { body: '#E8794F', dark: '#C05733', light: '#F59A73', eye: '#1D2340' };
const LW = 7;
const S = { stroke: C.navy, 'stroke-width': LW, 'stroke-linejoin': 'round' };
export const BODY = { w: 300, h: 210, rx: 74 };

// 造型：把原始像素网格（12 × 8 的方块，眼睛 2×2 在第 2–3 行）1:1 搬成矢量。
// 每格 cell px；原点 = 脚底中点，脚在最下面两行。
export const GRID = { cols: 12, rows: 8 };

export function clawdFace(g, { eyeY = 0, cell = 25 } = {}) {
  const eyes = [];
  const ey = eyeY;
  const ew = cell * 1.15, eh = cell * 2.45;   // 两条竖眼，不是圆点
  for (const x of [-cell * 2.0, cell * 2.0]) {
    const eg = el('g', {}, g);
    const openBar = el('g', {}, eg);
    el('rect', { x: -ew / 2, y: -eh / 2, width: ew, height: eh, rx: ew * 0.42, fill: CLAWD.eye }, openBar);
    const closedBar = el('path', { d: `M ${-ew * 0.6} 2 Q 0 ${eh * 0.42} ${ew * 0.6} 2`, fill: 'none', stroke: CLAWD.eye, 'stroke-width': 8, 'stroke-linecap': 'round' }, eg);
    const happyBar = el('path', { d: `M ${-ew * 0.6} ${eh * 0.3} Q 0 ${-eh * 0.42} ${ew * 0.6} ${eh * 0.3}`, fill: 'none', stroke: CLAWD.eye, 'stroke-width': 8, 'stroke-linecap': 'round' }, eg);
    eyes.push({ g: eg, openBar, closedBar, happyBar, x, y: ey });
  }
  const mouth = el('path', { d: `M ${-cell * 0.9} ${ey + cell * 1.5} Q 0 ${ey + cell * 2.1} ${cell * 0.9} ${ey + cell * 1.5}`, fill: 'none', stroke: CLAWD.eye, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }, g);
  const mouthO = el('ellipse', { cx: 0, cy: ey + cell * 1.7, rx: cell * 0.7, ry: cell * 0.8, fill: CLAWD.eye, opacity: 0 }, g);
  const sparkL = el('path', { d: 'M 0 -19 L 5 -5 L 19 0 L 5 5 L 0 19 L -5 5 L -19 0 L -5 -5 Z', fill: C.yellow, stroke: C.navy, 'stroke-width': 3.2, opacity: 0 }, g);
  const sparkR = el('path', { d: 'M 0 -19 L 5 -5 L 19 0 L 5 5 L 0 19 L -5 5 L -19 0 L -5 -5 Z', fill: C.yellow, stroke: C.navy, 'stroke-width': 3.2, opacity: 0 }, g);
  return { eyes, mouth, mouthO, sparkL, sparkR, eyeY: ey, cell };
}

export function setFace(f, { open = 1, lookX = 0, lookY = 0, mood = 'idle', mouth = 0, spark = 0 } = {}) {
  f.eyes.forEach(e => {
    const happy = mood === 'happy';
    show(e.openBar, !happy && open > 0.14);
    show(e.closedBar, !happy && open <= 0.14);
    show(e.happyBar, happy);
    e.openBar.setAttribute('transform', `translate(${e.x + lookX} ${e.y + lookY}) scale(1 ${Math.max(0.14, open).toFixed(3)})`);
    e.closedBar.setAttribute('transform', `translate(${e.x + lookX} ${e.y + lookY})`);
    e.happyBar.setAttribute('transform', `translate(${e.x + lookX} ${e.y + lookY})`);
  });
  f.mouth.setAttribute('opacity', mood === 'sad' ? 1 : 0);
  f.mouthO.setAttribute('opacity', mouth > 0.5 ? 1 : 0);
  const sp = mood === 'sad' ? 0 : spark;
  op(f.sparkL, sp); op(f.sparkR, sp);
  f.sparkL.setAttribute('transform', `translate(${-88 + lookX} ${f.eyeY - 30 + lookY}) rotate(12)`);
  f.sparkR.setAttribute('transform', `translate(${90 + lookX} ${f.eyeY - 44 + lookY}) rotate(-8)`);
}

export function blinkAt(t, times, d = 0.16) {
  let o = 1;
  for (const b of times) { const p = seg(t, b, b + d); if (p > 0 && p < 1) o = Math.min(o, Math.abs(1 - 2 * p)); }
  return o;
}

// 身体（原点 = 脚底中点）：12×8 格方块 + 第 4–5 行的短手 + 两只脚。
function clawdBody(g, { arms = true, legs = true, cell = 26 } = {}) {
  const inner = el('g', { filter: 'url(#boil)' }, g);
  const W = cell * 12, H = cell * 8;
  const footH = legs ? cell * 1.1 : 0;        // 脚只占最下面一行多一点
  const bottom = -footH;                       // 身体底边
  const top = bottom - H;
  const feet = [];
  if (legs) for (const x of [-cell * 2.35, cell * 2.35]) {
    const fg = el('g', {}, inner);
    el('rect', { x: -cell * 1.1, y: bottom, width: cell * 2.2, height: footH + 2, rx: cell * 0.36, fill: CLAWD.dark, ...S }, fg);
    tf(fg, x, 0);
    feet.push({ g: fg, x, ph: x > 0 ? Math.PI : 0 });
  }
  const body = el('g', {}, inner);
  el('rect', { x: -W / 2, y: top, width: W, height: H, rx: cell * 1.6, fill: CLAWD.body, ...S }, body);
  // 顶部亮块
  el('path', { d: `M ${-W * 0.30} ${top + cell * 0.7} Q ${-W * 0.08} ${top + cell * 0.25} ${W * 0.10} ${top + cell * 0.28}`, fill: 'none', stroke: CLAWD.light, 'stroke-width': cell * 0.5, 'stroke-linecap': 'round' }, body);
  // 手：第 4–5 行，向两侧各伸出两格
  const armG = [];
  if (arms) for (const sgn of [-1, 1]) {
    const ag = el('g', {}, inner);
    const ax = sgn > 0 ? W / 2 - cell * 0.2 : -W / 2 + cell * 0.2;
    const ay = top + cell * 3.1 + cell * 1.2;      // 肩点在手臂中段，旋转才不会甩出去
    el('rect', { x: sgn > 0 ? 0 : -cell * 2.2, y: -cell * 1.2, width: cell * 2.2, height: cell * 2.4, rx: cell * 0.7, fill: CLAWD.body, ...S }, ag);
    tf(ag, ax, ay);
    armG.push({ g: ag, x: ax, y: ay, sgn });
  }
  return { inner, body, arms: armG, legs: feet, faceY: top + cell * 2.6, cell, W, H, top, bottom };
}

// 正面站（原点 = 脚底中点）
export function clawdSit(parent, { legs = true, arms = true, cell = 26 } = {}) {
  const g = el('g', {}, parent);
  const b = clawdBody(g, { arms, legs, cell });
  const f = clawdFace(b.inner, { eyeY: b.faceY, cell });
  return { g, inner: b.inner, body: b.body, arms: b.arms, legs: b.legs, head: f };
}

// 侧面走（朝右；原点 = 脚底中点）
export function clawdWalk(parent, { legs = true, arms = true, cell = 26 } = {}) {
  const g = el('g', {}, parent);
  const b = clawdBody(g, { arms, legs, cell });
  const f = clawdFace(b.inner, { eyeY: b.faceY, cell });
  b.legs.forEach((l, i) => { l.ph = i < 2 ? Math.PI : 0; });
  return { g, inner: b.inner, body: b.body, arms: b.arms, legs: b.legs, head: f };
}
export function walkCycle(c, t, speed = 18, amp = 26) {
  c.legs.forEach(l => tf(l.g, l.x, -Math.abs(Math.sin(t * speed + (l.ph || 0))) * 6, 1, 0));
  c.body.setAttribute('transform', `translate(0 ${(-Math.abs(Math.sin(t * speed)) * 9).toFixed(1)})`);
}

// 趴（原点 = 身体底部中点）：整个身体压扁，眼在上沿
export function clawdLoaf(parent) {
  const g = el('g', {}, parent);
  const inner = el('g', { filter: 'url(#boil)' }, g);
  el('rect', { x: -186, y: -122, width: 372, height: 122, rx: 56, fill: CLAWD.body, ...S }, inner);
  el('path', { d: 'M -120 -114 Q -50 -122 10 -122', fill: 'none', stroke: CLAWD.light, 'stroke-width': 11, 'stroke-linecap': 'round' }, inner);
  const f = clawdFace(inner, { eyeY: -82 });
  return { g, inner, body: inner, arms: [], legs: [], head: f };
}

// 蜷（原点 = 身体中心）
export function clawdCurl(parent) {
  const g = el('g', {}, parent);
  const inner = el('g', { filter: 'url(#boil)' }, g);
  el('rect', { x: -160, y: -104, width: 320, height: 208, rx: 74, fill: CLAWD.body, ...S }, inner);
  el('path', { d: 'M -110 -96 Q -40 -104 20 -104', fill: 'none', stroke: CLAWD.light, 'stroke-width': 11, 'stroke-linecap': 'round' }, inner);
  const f = clawdFace(inner, { eyeY: -66 });
  return { g, inner, body: inner, arms: [], legs: [], head: f };
}

// 只露头（从字后/纸边探出），爪子搭在前面
export function clawdPeek(parent) {
  const g = el('g', {}, parent);
  const inner = el('g', { filter: 'url(#boil)' }, g);
  el('rect', { x: -150, y: -196, width: 300, height: 196, rx: 74, fill: CLAWD.body, ...S }, inner);
  el('path', { d: 'M -100 -186 Q -40 -198 20 -198', fill: 'none', stroke: CLAWD.light, 'stroke-width': 13, 'stroke-linecap': 'round' }, inner);
  const f = clawdFace(inner, { eyeY: -122 });
  const paws = [-104, 104].map(dx => {
    const p = el('g', { filter: 'url(#boil)' }, g);
    el('rect', { x: dx - 32, y: -34, width: 64, height: 52, rx: 22, fill: CLAWD.body, ...S }, p);
    return p;
  });
  return { g, inner, headWrap: inner, head: f, paws };
}

// 一条可伸向任意点的手臂
export function armTo(parent, { x = 0, y = 0 } = {}) {
  const g = el('g', { filter: 'url(#boil)' }, parent);
  const outer = el('line', { x1: 0, y1: 0, x2: 1, y2: 0, stroke: C.navy, 'stroke-width': 46 + LW * 2, 'stroke-linecap': 'round' }, g);
  const ink = el('line', { x1: 0, y1: 0, x2: 1, y2: 0, stroke: CLAWD.body, 'stroke-width': 46, 'stroke-linecap': 'round' }, g);
  const paw = el('g', {}, g);
  el('rect', { x: -25, y: -28, width: 50, height: 56, rx: 22, fill: CLAWD.body, ...S }, paw);
  return {
    g, x, y,
    set(px, py) {
      const a = Math.atan2(py - y, px - x), d = Math.hypot(px - x, py - y);
      g.setAttribute('transform', `translate(${x} ${y})`);
      outer.setAttribute('x2', d); ink.setAttribute('x2', d);
      tf(paw, d, 0, 1, a * 180 / Math.PI + 90);
    },
  };
}

export { heartPath };
