# CREDITS — The Fuse

A pen-and-wash film made in code for the song "I'm Upping My P(doom)".

## Music

- **"I'm Upping My P(doom)"** — lyrics: osmarks, based on an opening verse and chorus by MusicPerson, with lines from the EleutherAI Discord. Original 2024 version generated with Udio. This recording: the 2026 *Claude-Pop* version performed by **deckard** (Suno), the version most covers use.
- Audio file supplied by the client: `audio/song.mp3` (MD5 `71c4e69a79d9da3ee56fdf2455af46ea`, 156.7 s). The song is **not** covered by this project's licence; the client is responsible for the rights to use it.
- The film does not alter the song. All other sound — pen on cold-press paper, page turns, brush, paperclips, the fuse, the room tones — is synthesised for this film (`audio/foley.py`), timed from `events.json`.

## Typefaces

- **Caveat** — © The Caveat Project Authors, SIL Open Font License 1.1 (`fonts/OFL-Caveat.txt`).
- **Reenie Beanie** — © The Reenie Beanie Project Authors, SIL Open Font License 1.1 (`fonts/OFL-ReenieBeanie.txt`).
Both are self-hosted in `fonts/` and subset only by the browser at render time; no external font request is made.

## Engine

- `engine.js`, `poses.js` and the rendering tools `core/` come from **Lemo-Opuscar** (MIT), the *Urban Sketch · Pen & Wash* style library. The page builder (`page.js`) and every drawing in `spreads.js`, the timeline (`film.js`), the score-free foley (`audio/`) and this cut are new for this film.
- The film itself is the client's: it carries no LemoLab name, logo or sign-off.

## No other third-party material

No stock footage, no photographs, no samples, no 3D assets, no logos, no AI image generators. Every mark in the film is a deterministic drawing computed from the timeline.
