# The Fuse — a pen-and-wash film for "I'm Upping My P(doom)"

A music film drawn entirely in code in the **Urban Sketch · Pen & Wash** style: sepia fineliner, cold-press paper,
loose transparent watercolour, and one orange line that is also the fuse. The full timeline runs 156.7 s; this
repository carries the **30-second showcase cut** plus the complete source and event tables.

## In this repository

| File | What it is |
|---|---|
| [`the-fuse-30s.mp4`](the-fuse-30s.mp4) | the showcase cut — 1920×1080, 24 fps, H.264 + AAC, −14.5 LUFS |
| [`the-fuse-30s-poster.jpg`](the-fuse-30s-poster.jpg) | the cover frame |
| [`the-fuse.srt`](the-fuse.srt) | the sung lyrics as subtitles (full song) |
| [`TREATMENT.md`](TREATMENT.md) | structure, shots, cue map, sound design, final-cut notes |
| [`CREDITS.md`](CREDITS.md) | every third-party asset and its licence |
| [`stills/`](stills/) | verification stills from the cut (0.6–29.5 s) and a contact sheet |
| [`build.sh`](build.sh) | from a blank page to the finished film |

Source: `film.js` (the edit and camera), `spreads.js` (eight 3840×2160 pages), `engine.js` + `poses.js`
(the style engine, from Lemo-Opuscar, MIT), `page.js` (page builder), `cues.json` / `events.json` / `lyrics.js`
(the shared time source), `audio/foley.py` + `audio/mix.py` (synthesised foley and mix), `fonts/` (self-hosted
OFL typefaces).

## Build

```sh
# the Lemo-Opuscar core tools (playwright-core + Chromium) are required
git clone https://github.com/lemomo-ai/lemo-opuscar
LIB=/path/to/lemo-opuscar sh build.sh
```

Needs Node 20+, ffmpeg, and Python 3 with numpy/scipy. `build.sh` writes the **full 156.7 s film** to
`the-fuse.mp4` (not checked in — it needs the same Lemo-Opuscar render/mux tools); the 30 s cut is already in the
repository.

## How it is made

- **One orange line is the clock.** The spark is the camera's target on a critically damped spring, with a
  designed zoom envelope and look-at anchors (her eyes, the colossus, the hanging man, the eye). The only cuts are
  the seven page turns.
- **Each page draws itself behind the fuse.** Ink and wash are timed to the line's arrival, so every figure, caption
  and margin note appears exactly as the line passes it; 65 pieces of marginalia (labels, arrows, circles, ticks, a
  stamp) are cued to the same moment.
- **Eight spreads, 3840×2160 each.** The bench, the room, the hall, the sky, the road, the office, the stack, the
  cover — built from the pen-and-wash engine with ink baked at its own draw-on time and colour arriving through a
  per-pixel arrival field.
- **All sound except the song is synthesised.** `audio/foley.py` turns `events.json` into pen-on-paper, page turns,
  brush, paperclips, the fuse and room tones; `audio/mix.py` ducks the music under the page turns and the four
  structural hits.

The song is not ours: see [`CREDITS.md`](CREDITS.md). The film itself carries no studio sign-off.

## Checks on the 30 s cut

- `ffprobe`: 1920×1080, 24 fps, H.264 + AAC, 30.0 s.
- `blackdetect`: no black frames.
- `ebur128`: −14.5 LUFS integrated, −1.0 dBFS true peak, LRA 2.0 LU.
- `stills/show30/` and `stills/show30_sheet.jpg`: one frame every ~3 s plus a contact sheet for pacing.
