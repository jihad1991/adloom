---
name: adloom-hook
description: >
  Generate 6 scroll-stopping first-line hooks for any topic, on-brand and audience-tuned, with an
  optional second-language mirror. Reads brand-voice.md (if present) and config.json. Use when starting
  a caption, ad, or reel and you need a strong opener. Triggers: "hook", "هوك", "opening line", "أول سطر".
metadata:
  author: Adloom
  version: "0.1.0"
---

# Adloom Hook Generator

Generate **6 hooks** for a given topic. Start at Step 1 — do not explain what makes a good hook.

## Before generating
- If `brand-voice.md` exists, obey its tone/register. Else use `config.json` `brand` facts (and suggest running `/adloom-voice`, but don't block).
- If `product.md` exists (from `/adloom-source`), use its feature map + terminology so hooks name real capabilities in the product's own words.
- Input: a topic/feature. If missing, ask one line for it.
- Speak to the brand's audience by their direct benefit, not the feature.

## Rules per hook
- One or two short lines. First line grabs; second flips/raises stakes.
- **No question in the first line** (it weakens the stop). Turn it into a statement.
- **Numbers beat vague claims** — use concrete digits (3 taps, 1 minute, 24→23, %, shorter queue).
- Honor `brand.emoji` (default false → none). No hype, no false promises.
- Match the voice's register/dialect.
- Optional second-language mirror line beneath each (one short line) — useful for LinkedIn.

## The six patterns (one each)
1. **Number/metric** — opens on a concrete figure.
2. **Contrarian** — reverses a common belief.
3. **Before→after transformation** — the customer's state, with a digit.
4. **Authority steal** — borrows a known player/situation.
5. **Admission/loss** — names a mistake or money the audience is losing.
6. **Future shock** — a seasonal/forward prediction (kept as a statement, not a question).

## Output
Show all six, numbered, each tagged with its pattern, with the optional mirror line beneath. Then offer:
extend the strongest into a full caption (hook + benefit + second line + CTA + hashtags) using `brand-voice.md`,
or hand off to `/adloom-schedule`.

## Quality
Target the audience's pain/desire, not the tech. Tension + curiosity gap + clear stakes = a stop.
Vary the angles — don't ship six number-hooks.
