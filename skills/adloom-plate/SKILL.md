---
name: adloom-plate
description: >
  Generate AI image "plates" (backgrounds/scenes) with Gemini and, crucially, extend one master plate
  into every aspect ratio (1:1 / 4:5 / 9:16) so the SAME image stays consistent across sizes. Also
  covers cleaning baked-in gibberish text and swapping subjects. Use to create the imagery layer of a
  post before compositing text on top. Triggers: "plate", "background", "AI image", "generate scene",
  "لوحة", "خلفية".
metadata:
  author: Adloom
  version: "0.1.0"
---

# Adloom Plate

Create the imagery layer. Text/logo/UI go on top later via `/adloom-compose` — so plates should leave
**clean negative space** (usually the top third) for a headline.

## Prereqs
- `GKEY` in `.env` (Google AI Studio). Node 18+ (built-in fetch). `scripts/gen.mjs`, `scripts/gen_edit.mjs`.

## 1) Generate the master (one ratio, usually 4:5 or 1:1)
```
GKEY=$GKEY node scripts/gen.mjs gemini-3-pro-image-preview out/master_4x5.png "4:5" "<prompt>"
```
Prompt tips: state the brand palette hex, the scene, "generous empty space at the TOP for a headline",
and hard negatives ("no gibberish text, not a cartoon" etc.). Photoreal vs 3D-diorama vs UI-mockup —
pick ONE language and keep it consistent across a campaign (mixing styles reads as incoherent).

## 2) Extend the master to the other ratios (consistency)
Do NOT re-generate from scratch (you'd get a different scene). Reframe the master:
```
node scripts/gen_edit.mjs out/master_4x5.png out/master_1x1.png  "1:1"  "Reframe this EXACT same photo into 1:1. Keep the identical subject, scale, centered. Extend the background on the sides. Seamless, same lighting."
node scripts/gen_edit.mjs out/master_4x5.png out/master_9x16.png "9:16" "Reframe this EXACT same photo into a tall 9:16. Keep the identical subject centered; extend background up and down; keep empty space at the TOP. Seamless."
```

## 3) Targeted edits (same tool)
- Remove baked gibberish: "Keep this image identical; only replace the dashboard's fake text with clean abstract charts, no readable text."
- Swap/adjust a subject, keep everything else: describe the one change, end with "everything else unchanged, seamless."

## Notes
- Output is often JPEG bytes even with a .png name — fine for compositing; if you post-process with an
  image lib, decode from bytes (e.g. `imagecreatefromstring`) rather than by extension.
- Review every plate before compositing. Regenerate rather than fight a bad plate.
- Next: `/adloom-compose` to lay the grid, text, logo, and mockups over the plate.
