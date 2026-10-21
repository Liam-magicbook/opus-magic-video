#!/usr/bin/env python3
"""拟音合成 + 与歌曲混音。

读 film/events.json（从页面导出的真实时间表，和渲染用的是同一份 EV），
按事件类型合成印厂拟音（纸滑、印章、快门、玻璃裂、弹簧、回形针等），
再与 song.mp3 混成 film/mix.wav（48k / 立体声 / 16bit）。

用法：
  .venv/bin/python music_sfx.py            # 生成 mix.wav
  .venv/bin/python music_sfx.py --dry      # 只打印事件统计
"""
from __future__ import annotations

import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy import signal
import wave

ROOT = Path(__file__).resolve().parent
FILM = ROOT / "film"
SR = 48000
rng = np.random.default_rng(20261021)


# ---------------------------------------------------------------- 基础工具
def env(n: int, a: float, d: float, curve: float = 2.0) -> np.ndarray:
    """attack/decay 包络，n 个采样，a/d 为秒。"""
    na, nd = max(1, int(a * SR)), max(1, int(d * SR))
    e = np.ones(n, dtype=np.float64)
    if na + nd > n:
        na = max(1, n // 8)
        nd = max(1, n - na)
    e[:na] = np.linspace(0, 1, na) ** 0.6
    tail = np.linspace(1, 0, nd) ** curve
    e[na:na + nd] = tail[: min(nd, n - na)]
    if na + nd < n:
        e[na + nd:] = 0.0
    return e


def noise(n: int) -> np.ndarray:
    return rng.standard_normal(n)


def band(x: np.ndarray, lo: float, hi: float, order: int = 3) -> np.ndarray:
    lo = max(20.0, lo)
    hi = min(SR / 2 - 500, hi)
    if hi <= lo:
        return x
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lowpass(x: np.ndarray, f: float, order: int = 3) -> np.ndarray:
    sos = signal.butter(order, min(f, SR / 2 - 500), btype="low", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def highpass(x: np.ndarray, f: float, order: int = 3) -> np.ndarray:
    sos = signal.butter(order, max(20.0, f), btype="high", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def place(buf: np.ndarray, at: float, sig: np.ndarray, gain: float = 1.0, pan: float = 0.0):
    """把单声道信号按等功率声像放进立体声缓冲。"""
    i = int(at * SR)
    if i >= buf.shape[0]:
        return
    n = min(sig.shape[0], buf.shape[0] - i)
    if n <= 0:
        return
    s = sig[:n] * gain
    # 等功率声像
    th = (np.clip(pan, -1, 1) + 1) * math.pi / 4
    buf[i:i + n, 0] += s * math.cos(th)
    buf[i:i + n, 1] += s * math.sin(th)


def tap(dur: float, decay: float = 26.0, tone: float = 2600.0) -> np.ndarray:
    """硬物轻敲：极短冲击 + 快速衰减。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * tone * t) * np.exp(-t * decay)
    click = highpass(noise(n), 1800) * np.exp(-t * decay * 2.6)
    return (body * 0.5 + click * 0.9) * env(n, 0.0005, dur * 0.9, 3.0)


# ---------------------------------------------------------------- 各类拟音
def sfx_stamp(big: int = 0) -> np.ndarray:
    dur = 0.9 if big else 0.6
    n = int(dur * SR)
    t = np.arange(n) / SR
    # 低频"噗"+ 木头共鸣 + 少量纸的沙声
    thump = np.sin(2 * np.pi * (68 if big else 96) * t) * np.exp(-t * (7 if big else 11))
    thump += 0.5 * np.sin(2 * np.pi * (135 if big else 190) * t) * np.exp(-t * 9)
    slap = band(noise(n), 260, 3200) * np.exp(-t * (16 if big else 22)) * 0.6
    paper = band(noise(n), 2200, 7600) * np.exp(-t * 5) * 0.10
    s = (thump * 1.0 + slap * 0.55 + paper)
    return s * env(n, 0.001, dur, 2.0)


def sfx_stamp_miss() -> np.ndarray:
    """盖歪了：木头落桌面 + 印章回弹轻晃。"""
    a = sfx_stamp(big=1)
    n2 = int(0.34 * SR)
    b = tap(0.34, 16, 420) * 0.35
    out = np.concatenate([a, np.zeros(int(0.22 * SR)), b])
    return out


def sfx_paper(dur: float = 0.5) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    # 纸张摩擦：噪声 + 缓慢梳状起伏
    x = band(noise(n), 1400, 9000)
    wob = 0.55 + 0.45 * np.sin(2 * np.pi * 9 * t + rng.random() * 6)
    x = x * wob * env(n, 0.02, dur, 1.3)
    x += band(noise(n), 300, 1200) * 0.18 * env(n, 0.01, dur, 1.5)
    return x


def sfx_shutter() -> np.ndarray:
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    a = highpass(noise(n), 2600) * np.exp(-t * 90)
    b = np.zeros(n)
    shifted = int(0.055 * SR)
    b[shifted:] = (highpass(noise(n - shifted), 2000) * np.exp(-t[: n - shifted] * 110))
    s = (a * 0.8 + b * 0.55)
    s += tap(0.28, 40, 520) * 0.2
    return s * env(n, 0.001, 0.26, 2.4)


def sfx_thud() -> np.ndarray:
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 52 * t) * np.exp(-t * 8)
    s += np.sin(2 * np.pi * 91 * t) * np.exp(-t * 12) * 0.6
    s += lowpass(noise(n), 500) * np.exp(-t * 10) * 0.5
    return s * env(n, 0.002, 0.65, 2.0)


def sfx_boom(dur: float = 1.4) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 44 * t + 1.5 * np.sin(2 * np.pi * 3 * t)) * np.exp(-t * 3.0)
    s += band(noise(n), 60, 900) * np.exp(-t * 4.5) * 0.7
    s += band(noise(n), 900, 5200) * np.exp(-t * 9) * 0.18
    return s * env(n, 0.004, dur, 1.7)


def sfx_glass_tap() -> np.ndarray:
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 2480 * t) + 0.6 * np.sin(2 * np.pi * 3740 * t) + 0.35 * np.sin(2 * np.pi * 5210 * t))
    s *= np.exp(-t * 13)
    s += highpass(noise(n), 3000) * np.exp(-t * 60) * 0.4
    return s * env(n, 0.0008, 0.45, 2.2)


def sfx_crack() -> np.ndarray:
    """玻璃裂：一连串随机小爆点 + 高频延长。"""
    dur = 1.1
    n = int(dur * SR)
    out = np.zeros(n)
    for _ in range(26):
        at = rng.random() ** 1.7 * dur * 0.7
        c = tap(0.06, 120, 3000 + rng.random() * 4200) * (0.25 + rng.random() * 0.6)
        i = int(at * SR)
        m = min(c.shape[0], n - i)
        out[i:i + m] += c[:m]
    out += band(noise(n), 3200, 12000) * np.exp(-np.arange(n) / SR * 4.5) * 0.10
    return out


def sfx_shatter() -> np.ndarray:
    dur = 2.4
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = sfx_crack() * 1.2
    pad = np.zeros(n)
    pad[: out.shape[0]] += out[:n]
    # 低频冲击 + 玻璃碎屑长尾
    bm = sfx_boom(0.9) * 0.55
    pad[:min(n, bm.shape[0])] += bm[:n]
    tail = band(noise(n), 4000, 13000) * np.exp(-t * 1.7) * 0.16
    pad += tail
    for _ in range(60):
        at = rng.random() ** 2 * dur * 0.8
        c = tap(0.05, 90, 2400 + rng.random() * 6000) * 0.18
        i = int(at * SR)
        m = min(c.shape[0], n - i)
        pad[i:i + m] += c[:m]
    return pad


def sfx_foom() -> np.ndarray:
    """膨胀：上滑的低频 + 空气。"""
    dur = 1.0
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 60 * np.exp(t * 1.6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 1.2)
    s += band(noise(n), 200, 2600) * (0.25 + 0.5 * np.exp(-t * 2))
    return s * env(n, 0.01, dur, 1.4)


def sfx_implode() -> np.ndarray:
    dur = 2.0
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 520 * np.exp(-t * 1.5) + 40
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * 0.8
    s += band(noise(n), 100, 2200) * 0.35
    return s * env(n, 0.05, dur, 1.2)


def sfx_tick() -> np.ndarray:
    return tap(0.12, 70, 3400) * 0.7


def sfx_snap() -> np.ndarray:
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    s = highpass(noise(n), 1400) * np.exp(-t * 60) * 0.9
    s += np.sin(2 * np.pi * 320 * t) * np.exp(-t * 40) * 0.5
    return s


def sfx_creak() -> np.ndarray:
    dur = 1.6
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 180 + 90 * np.sin(2 * np.pi * 0.8 * t) + 40 * np.sin(2 * np.pi * 3.1 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = (np.sin(ph) + 0.5 * np.sin(2 * ph)) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 5.5 * t)))
    s = lowpass(s, 2400)
    nz = band(noise(n), 500, 2600) * 0.10
    return (s * 0.5 + nz) * env(n, 0.12, dur, 1.4)


def sfx_slide(dur: float = 0.5) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = band(noise(n), 700, 5200) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t))
    s += lowpass(noise(n), 400) * 0.25
    return s * env(n, 0.03, dur, 1.4)


def sfx_curtain() -> np.ndarray:
    dur = 1.2
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = band(noise(n), 200, 2600) * np.exp(-t * 2.2)
    s += band(noise(n), 2600, 8000) * np.exp(-t * 3.4) * 0.4
    return s * env(n, 0.09, dur, 1.5)


def sfx_stamp_big() -> np.ndarray:
    return sfx_stamp(1) * 1.15


def sfx_clips() -> np.ndarray:
    """一堆回形针落桌：密集金属点。"""
    dur = 1.4
    n = int(dur * SR)
    out = np.zeros(n)
    for k in range(46):
        at = (rng.random() ** 1.6) * dur * 0.75
        tone = 1800 + rng.random() * 3800
        c = tap(0.14, 60, tone) * (0.2 + rng.random() * 0.5)
        i = int(at * SR)
        m = min(c.shape[0], n - i)
        out[i:i + m] += c[:m]
    return out


def sfx_check() -> np.ndarray:
    n = int(0.2 * SR)
    t = np.arange(n) / SR
    s = highpass(noise(n), 1800) * np.exp(-t * 55) * 0.8
    s += np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 40) * 0.3
    return s


def sfx_plug() -> np.ndarray:
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 220 * t) * np.exp(-t * 20) * 0.6
    s += band(noise(n), 900, 6000) * np.exp(-t * 32) * 0.6
    return s


def sfx_bell() -> np.ndarray:
    dur = 2.4
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f, a, d in [(880, 1.0, 1.6), (1320, 0.5, 2.2), (1980, 0.3, 3.0), (2640, 0.16, 4.0)]:
        s += a * np.sin(2 * np.pi * f * t) * np.exp(-t * d)
    return s * env(n, 0.004, dur, 1.5)


def sfx_room() -> np.ndarray:
    """整张桌子：低频空间感 + 远处纸张摩擦。"""
    dur = 2.6
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = lowpass(noise(n), 220) * 0.5 * np.exp(-t * 1.1)
    s += band(noise(n), 1200, 5000) * 0.10 * (0.5 + 0.5 * np.sin(2 * np.pi * 4 * t))
    return s * env(n, 0.4, dur, 1.3)


def sfx_tread() -> np.ndarray:
    dur = 3.0
    n = int(dur * SR)
    t = np.arange(n) / SR
    beat = np.exp(-((t * 4.4) % 1) * 12)
    s = band(noise(n), 180, 1600) * beat * 0.4
    s += np.sin(2 * np.pi * 70 * t) * beat * 0.25
    return s * env(n, 0.15, dur, 1.2)


def sfx_fan() -> np.ndarray:
    dur = 2.2
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = band(noise(n), 300, 3600) * (0.5 + 0.5 * np.sin(2 * np.pi * 26 * t))
    return s * env(n, 0.2, dur, 1.2) * 0.7


def sfx_fuse() -> np.ndarray:
    dur = 2.2
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = band(noise(n), 1600, 9000) * np.exp(-t * 0.8) * 0.5
    s += band(noise(n), 400, 1600) * 0.2
    return s * env(n, 0.02, dur, 1.5)


def sfx_misc(kind: str) -> np.ndarray:
    dur = 0.9
    n = int(dur * SR)
    t = np.arange(n) / SR
    base = band(noise(n), 240, 3200) * np.exp(-t * 5)
    if kind in ("circuit", "tower"):
        base += np.sin(2 * np.pi * 720 * t) * np.exp(-t * 7) * 0.3
    if kind in ("atoms", "omega"):
        base = np.sin(2 * np.pi * 310 * t) * np.exp(-t * 4) * 0.6 + band(noise(n), 400, 4000) * 0.2
    if kind in ("loom",):
        base = band(noise(n), 800, 5000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 22 * t)))
    if kind in ("mask",):
        base = sfx_paper(0.7)
        pn = base.shape[0]
        e = env(pn, 0.01, pn / SR, 1.6)
        return base * e
    if kind in ("sticky",):
        base = band(noise(n), 1200, 6000) * np.exp(-t * 9)
    base = base[:n] if base.shape[0] > n else np.pad(base, (0, n - base.shape[0]))
    return base * env(n, 0.01, dur, 1.6)


# ---------------------------------------------------------------- 主流程
MAP = {
    "wipe": lambda ev: sfx_paper(0.42),
    "stamp": lambda ev: sfx_stamp(0),
    "stamp_big": lambda ev: sfx_stamp(1),
    "stamp_miss": lambda ev: sfx_stamp_miss(),
    "shutter": lambda ev: sfx_shutter(),
    "paper": lambda ev: sfx_paper(0.7),
    "thud": lambda ev: sfx_thud(),
    "boom": lambda ev: sfx_boom(1.5),
    "foom": lambda ev: sfx_foom(),
    "implode": lambda ev: sfx_implode(),
    "tick": lambda ev: sfx_tick(),
    "snap": lambda ev: sfx_snap(),
    "creak": lambda ev: sfx_creak(),
    "slide": lambda ev: sfx_slide(),
    "curtain": lambda ev: sfx_curtain(),
    "clips": lambda ev: sfx_clips(),
    "check": lambda ev: sfx_check(),
    "plug": lambda ev: sfx_plug(),
    "bell": lambda ev: sfx_bell(),
    "room": lambda ev: sfx_room(),
    "tread": lambda ev: sfx_tread(),
    "fan": lambda ev: sfx_fan(),
    "fuse": lambda ev: sfx_fuse(),
    "glass_tap": lambda ev: sfx_glass_tap(),
    "crack": lambda ev: sfx_crack(),
    "shatter": lambda ev: sfx_shatter(),
}

GAIN = {
    "wipe": 0.13, "stamp": 0.55, "stamp_big": 0.62, "stamp_miss": 0.66, "shutter": 0.20,
    "paper": 0.28, "thud": 0.46, "boom": 0.52, "foom": 0.34, "implode": 0.34, "tick": 0.22,
    "snap": 0.30, "creak": 0.24, "slide": 0.24, "curtain": 0.30, "clips": 0.26, "check": 0.30,
    "plug": 0.34, "bell": 0.34, "room": 0.34, "tread": 0.22, "fan": 0.16, "fuse": 0.24,
    "glass_tap": 0.30, "crack": 0.44, "shatter": 0.58,
}


def main() -> int:
    events = json.loads((FILM / "events.json").read_text())
    dur = float(events["dur"])
    evs = events["ev"]
    if "--dry" in sys.argv:
        from collections import Counter
        c = Counter(e["type"] for e in evs)
        print(f"events={len(evs)} dur={dur}")
        for k, v in c.most_common():
            print(f"  {k:12s} {v}")
        return 0

    n = int(math.ceil(dur * SR))
    sfx = np.zeros((n, 2), dtype=np.float64)
    count = 0
    for ev in evs:
        typ = ev["type"]
        at = float(ev["t"])
        if typ in MAP:
            sig = MAP[typ](ev)
        else:
            sig = sfx_misc(typ)
        g = GAIN.get(typ, 0.24)
        # 轻微声像，避免全部挤在正中
        pan = 0.0
        if typ in ("shutter", "tick", "check", "clips"):
            pan = (rng.random() - 0.5) * 0.5
        place(sfx, max(0.0, at), sig, g, pan)
        count += 1
        # 成串事件：mask/check/paper 的后续点
        if typ in ("mask", "check", "paper"):
            k = int(ev.get("n", 0) or 0)
            for j in range(1, k + 1):
                s2 = MAP.get(typ, lambda e: sfx_paper(0.4))(ev)
                place(sfx, max(0.0, at + 0.09 * j), s2, g * (0.9 - 0.05 * j), pan)

    print(f"placed {count} sfx events, buffer {n / SR:.2f}s")

    # 读歌
    mp3 = FILM / "song.mp3"
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
        check=True, capture_output=True,
    ).stdout
    song = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    if song.shape[0] < n:
        song = np.pad(song, ((0, n - song.shape[0]), (0, 0)))
    else:
        song = song[:n]

    # 歌曲稍作处理：整体 -1.5 dB，低频轻微收敛（给拟音让位）
    song = song * 0.84

    mix = song + sfx
    # 总线：软限幅
    peak = np.max(np.abs(mix))
    print(f"peak before limit {peak:.3f}")
    if peak > 0:
        mix = mix / peak * 1.05
    mix = np.tanh(mix * 1.15) / np.tanh(1.15)
    mix *= 0.94

    # 目标峰值 -1.0 dBFS
    pk = np.max(np.abs(mix))
    if pk > 0:
        mix = mix / pk * 0.891

    out = FILM / "mix.wav"
    pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
    with wave.open(str(out), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())
    print(f"wrote {out}  {pcm.shape[0] / SR:.2f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
