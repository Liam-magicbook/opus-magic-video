# opus-magic-video

**Six short films, every frame rendered from code.** No stock library, no NLE, no timeline dragging —
each frame is computed by `renderAt(t)`, and the score is synthesized in Python from the same event table.

**English** | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md)

<img src="docs/preview/hero.gif" width="720" alt="1.5 seconds from four of the six films: paper MG, hand-drawn splash, pixel adventure, halftone case file">

<sub>1.5 s from four of the six films, tiled 2×2. Top-left `deepseek-one-line`, top-right `cel-boil-splash`, bottom-left `pixel-teyvat`, bottom-right `pdoom`.</sub>

---

## The films

| Preview | Film | Runtime | Style | File |
|:---:|---|---:|---|---|
| <img src="docs/preview/deepseek-one-line.jpg" width="260"> | [`deepseek-one-line/`](deepseek-one-line/) | 60s | **Eight chapters, eight materials**: drafting paper / server hall / receipt / oscilloscope / woven cloth / machined metal / rock strata / back to paper. 28 shots trace a single price curve | [`out/video.mp4`](deepseek-one-line/out/video.mp4) · 2048×858 · 27 MB |
| <img src="docs/preview/deepseek-v41-flash.jpg" width="260"> | [`deepseek-v41-flash/`](deepseek-v41-flash/) | 60s | **Paper / sticker motion graphics**, technical breakdown: the more you read, the cheaper each token gets | Not rendered — see stills in [`out/stills/`](deepseek-v41-flash/out/stills/) |
| <img src="docs/preview/cel-boil-splash.jpg" width="260"> | [`cel-boil-splash/`](cel-boil-splash/) | 10s | **Frame-by-frame hand drawing / line boil**, a water sprite disintegrates and reforms | [`out/video.mp4`](cel-boil-splash/out/video.mp4) · 1920×1080 · 36 MB |
| <img src="docs/preview/pixel-teyvat.jpg" width="260"> | [`pixel-teyvat/`](pixel-teyvat/) | 10s | **320×180 pixel adventure + CRT**, chest opening, day-night cycle | [`out/video.mp4`](pixel-teyvat/out/video.mp4) · 1920×1080 · 13 MB |
| <img src="docs/preview/pdoom.jpg" width="260"> | [`pdoom/`](pdoom/) | 156s | **Retro halftone case file**, 47 scenes / 46 lyric lines, the P(doom) gauge ratchets up four times | [`pdoom-web.mp4`](pdoom/pdoom-web.mp4) · 1920×1080 · 79 MB |
| <img src="docs/preview/the-fuse.jpg" width="260"> | [`the-fuse/`](the-fuse/) | 30s | **Urban sketch · pen & wash**: a street sketcher draws the apocalypse in his notebook; one orange fuse threads eight spreads, every stroke timed to the song | [`the-fuse-30s.mp4`](the-fuse/the-fuse-30s.mp4) · 1920×1080 · 47 MB |

<sub>Thumbnails are extracted from the finished renders by [`docs/make_preview.sh`](docs/make_preview.sh) — not design mockups.</sub>

## One frame = one pure function

The first four films share a **single-file timeline plus deterministic seeking via `window.renderAt(t)`** —
picture, score and sound effects all read the same `cues.json`, so changing a time means changing one place:

```
cues.json ──┬──> index.html   renderAt(t) ──> per-frame capture ──> ffmpeg ──> out/video.mp4
            └──> audio.py     synthesize() ──> out/audio.wav ─────┘
```

Because the image is driven entirely by time, the same code produces identical frames on any machine:
you can resume an interrupted render, render a single section to check composition, or iterate on stills
without waiting for the whole film.

`pdoom/` is the long-form exception: 156 seconds, music from an independent source, timeline derived from
word-level timestamps in `data/lyrics.json`. It therefore uses `build.sh` for chunked rendering
(foley → render → mux → poster → subtitles).

`the-fuse/` is the same kind of exception in a different style: its full timeline is also 156.7 seconds, but the
repository carries the 30-second showcase cut plus the complete source. Its pen-and-wash engine comes from
[Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar); the edit, the eight spreads and the foley are new for
this film.

There is exactly one renderer: start a local static server → wait for `window.__ready` → step through
`renderAt(t)` → pipe captures into ffmpeg (`tmix` for motion blur) → H.264 + AAC.

## Layout

```
lib/audio/            mgaudio: synthesis engine + CC0 sample library (shared by four films' audio.py)
requirements.txt      soundtrack deps (numpy/scipy/soundfile/numba/pedalboard…)
docs/preview/         README thumbnails and animation
docs/make_preview.sh  re-extract thumbnails from finished films
<films>/              index.html · cues.json · audio.py · assets/ · out/
```

`out/stills/` holds verification stills at given timestamps — check composition without rendering the whole film.
`deepseek-one-line/out/sheet.png` is a contact sheet at one cell per 2 seconds, the fastest way to judge pacing.

Per-film conventions (details in each film's `README.md`):

- `deepseek-one-line/` — `index.html` carries the 28-shot `SHOTS` table plus `camAt()` camera keyframes;
  `docs/TREATMENT.md` is the director's treatment (chapter materials, shot table, sound design table);
  `out/sheet/` is a per-second contact sheet (not tracked).
- `deepseek-v41-flash/`, `pixel-teyvat/`, `cel-boil-splash/` — `js/` holds scene modules, `assets/` holds fonts and textures.
- `pdoom/` — `film/` is the project itself; `build.sh` rebuilds everything (foley → render → mux → poster → subtitles).
- `the-fuse/` — `film.js` is the edit, `spreads.js` the eight pages, `cues.json` / `events.json` the shared time
  source; `build.sh` renders the full 156.7 s film (needs a Lemo-Opuscar checkout at `$LIB`).

## Running it

```bash
# dependencies
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cd pixel-teyvat && npm install        # once per film directory

# preview (writes nothing)
cd deepseek-one-line && node tools/serve.mjs     # → http://127.0.0.1:8777/index.html

# stills
node harness/render.mjs . --stills 0.5,5.6

# score (locks to the event times in cues.json)
.venv/bin/python audio.py                          # → out/audio.wav

# final render
node harness/render.mjs . --out out/video.mp4 --audio out/audio.wav --workers 4

# refresh README thumbnails
./docs/make_preview.sh
```

Requires Google Chrome installed locally (the renderer drives it through `puppeteer-core`; it does not download
Chromium) and `ffmpeg`.

The `node_modules` in `deepseek-one-line` and `deepseek-v41-flash` are local symlinks (pointing at
`mg-styles-15/node_modules`), so after cloning you need to `npm i puppeteer-core` yourself — that is the only
dependency `deepseek-one-line` needs; it does not use d3.

## Reproducing the Opus 5.5 look on a small budget

To be blunt: **the quality of these films does not come from a stronger model — it comes from three engineering
constraints.** Any model willing to write code can get 70% of the way there if it holds to these; conversely, the
best model without constraints only produces footage that plays but reads as slop.

**① Deterministic seeking, not self-running animation.**
The image must be a pure function of `renderAt(t)` — same `t`, same frame, always. Only then is editing meaningful:
change one thing and re-render just the affected frames; if unsure, render a section to verify. CSS animations
running on their own, or `requestAnimationFrame` drifting on its own, give you neither frame alignment nor
re-renderability.

**② One time source, read by both picture and sound.**
A single event (`ev`) in `cues.json` decides both "at 12.4 s this frame slams down" and "at 12.4 s this sound
hits". The most expensive rework is not rendering, it is audio drifting out of sync — pull the time out into data
and that bug does not structurally exist.

**③ Decide the material first, then the camera move.**
The eight chapters of `deepseek-one-line` hold up because each one commits to a physical material first (paper,
receipt, oscilloscope, cloth…) and then makes the same line adapt to it. Asking "what is this section made of"
before "how does the camera move" is much faster and resists degrading into text with fades.

The honest cost breakdown:

| Item | Cost |
|---|---|
| Render compute | **0** — local Chrome + ffmpeg, no rented GPU |
| 60 s render | ~2 minutes at 3 workers (measured on `deepseek-one-line`) |
| 10 s score | 3–8 seconds (`mgaudio`, pure numpy synthesis, no sample-library subscription) |
| Model tokens | **the dominant cost**. Concept to delivery is dozens of turns; what you save is compute, not thinking |

So "low budget" means precisely this: **move the cost from compute into constraint design.** It drops further when
you have a reference library to copy from — pick an existing style, change the times in `cues.json` and one material
variable, and you can see your own version in minutes. That is the real value of the `video_prototype/` repos: they
do not make you invent from zero, they let you edit something that already runs.

## Constraints

- Duration / resolution / fps live in each film's `window.DEMO` in `index.html` or in `cues.json`; the renderer reads them.
- The image must be driven entirely by `renderAt(t)`; do not let CSS animation run on its own — per-frame rendering will drift.
- Audio and picture share `cues.json`'s `ev`: adding a visual beat means adding the sound effect in `audio.py` too.
- On a hard cut inside a chapter, animation that depends on absolute time must use the chapter clock
  (`t - chapter start`), not the shot-local `lt`, or everything after the cut is offset.
- For dark, finely textured films (e.g. `deepseek-one-line`), render with `--mb 3 --shutter 0.5` so fast push-ins do not judder.

## Acknowledgements

None of this was invented from nothing. These upstream repositories supplied the skeleton, the samples and the
methodology; this project is a rewrite on top of them:

| Repo | Author | Role here | License |
|---|---|---|---|
| [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | Vincentwei1021 | **Source of the renderer and the `mgaudio` engine.** `harness/render.mjs` and `lib/audio/` are taken directly from it; `cel-boil-splash` is adapted from `demos/05-cel-boil`, `pixel-teyvat` from `demos/20-pixel`, and `deepseek-v41-flash` borrows the visual language of `demos/19-paperclip` | MIT |
| [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | Vincentwei1021 | **Shot vocabulary**: 124 shot recipe cards / 150 motion effects. Looking up "how should this beat be shot" beats inventing it | Apache-2.0 |
| [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | LemoLab | **59 code-made film styles.** `pdoom`'s `playwright-core` dependency points here; `the-fuse`'s pen-and-wash engine comes from here; the data-storytelling and iso-infographic directions informed the look | MIT |
| [huashu-motion](https://github.com/alchaincyf/huashu-motion) | Huashu | Complete product-launch skill workflow: write the script, score it yourself, edit the picture in the browser | MIT |
| [pdoom-video](https://github.com/mexicat/pdoom-video) | Giacomo Magnanini | **The reference generative music video**: word-synced typography, deterministic rendering. `pdoom/` is a local adaptation | MIT |
| [openfilm/examples](https://github.com/openfilm/examples) | OpenFilm | Minimal projects you can open, change and render | MIT |

Also:

- **Fonts**: LXGW Marker Gothic, Caveat, Long Cang, Fusion Pixel 12px, Press Start 2P — all SIL Open Font License 1.1;
  CJK stroke-order data from [hanzi-writer-data](https://github.com/skishore/makemeahanzi) (LGPL-3.0 / Arphic).
- **Samples**: `lib/audio/samples/` is CC0 VCSL material; all other timbres are synthesized in numpy, no third-party assets.
- **`pixel-teyvat`**: the Paimon sprite and Teyvat-related visual settings are copyright miHoYo / HoYoverse. This project
  is a non-commercial fan-made technical demo.

Per-film attribution lives in each directory's `CREDITS.md`. The reference library index is in `video_prototype/README.md`.
