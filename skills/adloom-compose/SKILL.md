---
name: adloom-compose
description: >
  Composite text, logo, CTA, and real product screenshots (phone/browser mockups) over an image plate
  using a strict grid, then render to exact-pixel PNGs via headless Chrome. Embeds brand fonts as base64
  so renders are pixel-identical offline. Produces the final post artwork per ratio. Triggers: "compose",
  "layout", "overlay text", "mockup", "render post", "تركيب", "تخطيط".
metadata:
  author: Adloom
  version: "0.1.0"
---

# Adloom Compose

Turn a plate + copy into finished post artwork. You author each artboard as one self-contained HTML
file, then render it to PNG at exact pixels.

## The strict grid (why posts look like a family)
Read `config.json` `grid` + `ratios` + `palette`. Every artboard:
- Equal margins all sides (`grid.margin`), a flex column with `justify-content:space-between`.
- **Header** (eyebrow + headline, centered) at top · **stage** (plate/mockup) in the middle · **footer**
  (logo left, CTA right) on one baseline at the bottom.
- Cap copy per ratio: 1:1 = eyebrow + headline only; 4:5/9:16 can add a sub line. Never crowd the plate.
- For story 9:16, keep a top scrim behind the headline when the plate is bright, so text stays legible.

## Fonts — embed, don't @import
Web-font fetches flake during headless render and silently swap the face. Use `scripts/fontface.mjs`:
```
import { fontFaces } from "../scripts/fontface.mjs";
const FONTS = fontFaces(cfg.fonts.family, cfg.fonts.dir, cfg.fonts.weights); // inject at top of <style>
```

## Real screenshots → premium mockups
Drop a product screenshot into a phone or browser frame (rounded bezel, traffic-light dots, a URL bar).
Size the frame per ratio; enlarge it so the content reads. Add thin dotted teal connector lines from any
floating icons to the frame so they feel wired in, not decorative.

## Render (exact pixels, no surprises)
```
node scripts/render.mjs out/day1_4x5.html out/day1_4x5.png 1080 1350
```
`render.mjs` uses absolute paths + a unique user-data-dir (both required — headless Chrome silently
writes nothing otherwise). Loop it over each ratio.

## Checklist before shipping an artboard
- Headline legible over the plate (scrim if needed) · logo + CTA on one baseline · equal margins ·
  no gibberish text visible · same visual language as its campaign siblings · one embedded font family.

Next: `/adloom-campaign` to run the whole brief end-to-end, or `/adloom-schedule` to publish.
