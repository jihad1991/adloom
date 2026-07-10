---
name: adloom-reel
description: >
  Build a vertical 9:16 social Reel (Instagram/TikTok/YouTube Shorts/FB Reels) from a real product
  screencast dropped into a branded phone mockup with beat-timed, burned-in captions. Chrome renders the
  brand layers (perfect Arabic), ffmpeg composites the video — deterministic, on-palette, no AI-video
  cost. Best "Product-in-motion" reel for a SaaS. Triggers: "reel", "short", "video ad", "ريل",
  "فيديو قصير", "شورت".
metadata:
  author: Adloom
  version: "0.1.0"
---

# Adloom Reel — Product-in-motion

Show the product *working*, not a description of it. This skill records a real flow from the app,
frames it in a branded phone mockup, and burns on-voice captions on the beat — a finished vertical reel.

Same render philosophy as `/adloom-compose`: **Chrome renders the pretty layers as PNGs** (brand
background, phone frame + wordmark + CTA, one caption card per beat — with embedded fonts so Arabic
shapes perfectly), then **ffmpeg composites**: background → screencast (in the screen rect) → frame →
timed captions. No fragile in-browser video stepping, no ffmpeg `drawtext` (it mangles Arabic).

## Inputs
`config.json` (palette/fonts/logo) · `product.md` + `brand-voice.md` (pick the flow + write the captions
in the brand voice) · a running app (`source.appUrl`) for the screencast. Needs **ffmpeg + ffprobe** and
Chrome on PATH (or `FFMPEG_PATH`/`FFPROBE_PATH`/`CHROME_PATH`), plus `playwright` for the capture
(`npm i -D playwright`, same dep as `/adloom-shots`).

## Steps

1. **Pick the flow (from `product.md`).** Choose one feature whose *motion* sells it — e.g. Smart Menu:
   scan → browse → add to cart → order. One clear job, 4–7 seconds. Concrete beats beat a feature tour.

2. **Script + record the screencast.** Write `screencast.config.json` (baseUrl, route, viewport, a
   `steps` list of wait/click/scroll/hover/fill, `recordSize` matching the screen rect aspect), then:
   ```bash
   node scripts/screencast.mjs screencast.config.json                 # public flow
   APP_USER=... APP_PASS=... node scripts/screencast.mjs screencast.config.json   # auth flow (user runs)
   ```
   Record from an account with **clean demo data** — junk names/broken images leak into the reel. Keep
   the interaction slow and deliberate; the camera is unforgiving. Output: `reel-src/screencast.webm`.

3. **Write the beats (captions) in brand voice.** 3–5 short lines, each tied to what's on screen at that
   moment. First beat is the hook (a statement, not a question — see `/adloom-hook`). Honor
   `brand.emoji` (default none). Time them to the screencast: `{ "text": "...", "from": s, "to": s, "sub": "..." }`.

4. **Assemble.** Write `reel.config.json` (screencast path, `screen` rect, `cta`, `beats[]`), then:
   ```bash
   node scripts/reel.mjs reel.config.json out/day3_reel.mp4
   ```
   It probes the screencast duration, renders the layers, and muxes an H.264 9:16 mp4 (`+faststart`).

5. **Review + hand off.** Watch it: captions legible over the footage, on-beat, no clipped motion, brand
   frame clean. Then `/adloom-schedule` (Metricool supports video) once approved. Nothing publishes here.

## reel.config.json (shape)
```json
{
  "canvas": { "w": 1080, "h": 1920, "fps": 30 },
  "screencast": "reel-src/screencast.webm",
  "screen": { "x": 160, "y": 300, "w": 760, "h": 1351, "radius": 46 },
  "cta": "فعّل Smart Menu",
  "beats": [
    { "text": "امسح الكود من الطاولة", "from": 0.2, "to": 2.2 },
    { "text": "الزبون يطلب بنفسه",     "from": 2.2, "to": 4.2 },
    { "text": "والمطبخ يشتغل فوراً",    "from": 4.2, "to": 6.0, "sub": "خدمة أسرع، أخطاء أقل" }
  ]
}
```
Palette, fonts, logo, and CTA colors default from `config.json` — set only what you want to override.

## Rules
- **Real footage only.** The whole point is authenticity — never fake the UI. If you can't record it,
  it's not a Product-in-motion reel.
- **Captions carry it (sound-off).** Reels autoplay muted; every claim must land as legible on-screen
  text. Keep lines short, high-contrast, in the lower-middle safe zone (clear of platform UI).
- **On the beat.** A caption must match what's on screen at that second, or it reads as a lie.
- **Ground every claim** in `product.md` — real features, real words. No invented numbers or prices.
- **Deterministic + brand-true.** Prefer the Chrome+ffmpeg path over AI video; it's free, repeatable, and
  exactly on-palette. Reach for AI b-roll only when real physical motion is unavoidable.
- Nothing publishes here — packaging only. Scheduling is a separate, explicit step.
