---
name: adloom-review
description: >
  Critique rendered post artwork before it ships: contrast, grid discipline, overlap, fake/gibberish
  text, cross-ratio consistency, and campaign-family coherence. Produces a pass/fix report per artboard
  and per campaign. Use after adloom-compose and before adloom-schedule. Triggers: "review designs",
  "critique", "check the posts", "مراجعة التصاميم", "فحص".
metadata:
  author: Adloom
  version: "0.1.0"
---

# Adloom Review

Adversarial design QA. Look at every rendered PNG (actually read the image files) and try to FAIL each
one before an audience sees it. Report findings ranked by severity; don't rubber-stamp.

## Per-artboard checks (read the PNG, judge visually)
1. **Headline legibility** — enough contrast over the plate at a glance? If the plate is bright behind
   light text (or vice versa), demand a scrim or reposition.
2. **Grid discipline** — equal margins on all sides; header centered; logo + CTA sitting on ONE baseline;
   nothing hugging an edge.
3. **Overlap & crowding** — no element covering a face, product, or another element; the plate's subject
   still breathes; copy capped for the ratio (1:1 leanest).
4. **Dead zones** — no large awkward empty band (common in 9:16 when the subject sits too low); suggest
   lifting/scaling the stage.
5. **Fake text** — zoom into any AI-generated UI/dashboard/signage: gibberish or lorem-like strings fail
   the board. Fix via a targeted `/adloom-plate` edit ("replace with clean abstract charts, no readable text").
6. **Brand fidelity** — palette hexes from `config.json`, correct logo variant for the background, the
   right font actually rendered (a swapped fallback font is a FAIL — check letterforms).
7. **Safe zones (9:16)** — headline and CTA clear of top/bottom UI bands where stories get cropped.

## Per-campaign checks
- **Cross-ratio consistency** — 1:1 / 4:5 / 9:16 of the same day show the SAME scene (master-extended),
  not three different generations.
- **Family coherence** — one visual language across the set (or a deliberate, stated rhythm); consistent
  eyebrow/CTA styling; no two days accidentally sharing the same plate.
- **Copy sanity** — captions match the artwork's message; hashtags present; CTA consistent with the design's CTA.

## Output
A table: `artboard · verdict (PASS / FIX) · finding · concrete fix`. Then a one-line campaign verdict.
Offer to apply the fixes (re-edit plate, adjust compose HTML, re-render) and re-review only what changed.

## Rules
- Read the actual rendered files; never approve from the HTML source alone.
- Severity order: illegible text > fake text > overlap > grid drift > polish.
- Be specific: "move noteCard top from 35% to 30%" beats "improve spacing".
