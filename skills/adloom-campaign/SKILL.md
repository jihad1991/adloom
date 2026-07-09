---
name: adloom-campaign
description: >
  Orchestrate a full social campaign end-to-end from a brief: plan the days, generate plates, composite
  artwork in every ratio, write on-voice captions + hashtags, and package everything ready to schedule.
  Ties the other Adloom skills together. Use for a multi-day launch or seasonal push. Triggers: "campaign",
  "content calendar", "launch", "حملة", "تقويم محتوى".
metadata:
  author: Adloom
  version: "0.1.0"
---

# Adloom Campaign

Run a whole campaign as one coordinated pass. Keep the human in the loop between phases.

## Inputs
`config.json` (brand/palette/fonts/ratios/hashtags/schedule) · `brand-voice.md` (run `/adloom-voice` first
if missing) · a brief: goal, number of days, the angle/season, and the message per day.

## Phases
1. **Plan** — one line per day: pillar, headline idea, CTA, and best-time slot from `config.schedule`.
   Decide ONE visual language for the set (all photoreal, or all mockup, or a deliberate rhythm).
2. **Plates** — per day, generate a master and extend it to 1:1 / 4:5 / 9:16 via `/adloom-plate`.
   For product days, use real screenshots instead of AI plates.
3. **Compose** — lay the strict grid, text, logo, CTA, mockups over each plate and render PNGs per ratio
   via `/adloom-compose`. Review each before moving on.
4. **Copy** — per day write a caption in the brand voice: hook (`/adloom-hook`) + benefit + second-language
   line + CTA + hashtags. Save to `captions.md`.
5. **Package** — organize `out/dayN/{1x1,4x5,9x16}.png` + `captions.md`. Optionally build a review page
   (a simple HTML gallery) so the owner can approve the whole week at a glance.
6. **Schedule** — hand to `/adloom-schedule` (Metricool) once approved.

## Rules
- Consistency is the product: same grid, same font, same visual language, cross-ratio-identical images.
- Cap copy per ratio; never crowd the art.
- Nothing publishes here — packaging only. Publishing is a separate, explicit step.
- Log anything dropped (a day skipped, a ratio not made) — don't silently under-deliver.
