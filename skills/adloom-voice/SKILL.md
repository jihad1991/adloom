---
name: adloom-voice
description: >
  Build a reusable brand social-voice profile from a short interview plus real sample captions,
  and write it to brand-voice.md so every caption/hook/post stays on-voice. Reads config.json for
  known brand facts (name, audience, promise, languages, emoji policy, hashtags) and interviews only
  for the gaps. Use before writing any social copy or at the start of a campaign. Triggers: "brand voice",
  "voice", "نبرة", "صوت العلامة".
metadata:
  author: Adloom
  version: "0.1.0"
  adaptedFrom: charlie947/social-media-skills · voice-builder (MIT)
---

# Adloom Voice

Produce one source-of-truth voice file (`brand-voice.md`) that every caption and hook references.
Start immediately — no preamble about what makes a good voice.

## Step 0 — load knowns
Read `config.json` (`brand`, `hashtags`, `languages`, `emoji`). Do NOT ask about anything already there — confirm it.

## Step 1 — fill the gaps (AskUserQuestion, one batch)
- Primary platform emphasis (all equal / Instagram / LinkedIn / Facebook).
- Dialect / register strength (e.g. very light MSA ↔ strong local dialect).
- Second language line: every post, per-platform, or none.
- Current campaign angle/season, if any.

## Step 2 — learn from samples
Ask for 3–5 real published captions (or read an existing captions file). Extract ONLY real patterns:
sentence length, line rhythm, opening (hook) style, closing/CTA moves, signature phrases, how languages
are mixed and in what order, and **absence signals** (what the voice never does).

## Step 3 — write brand-voice.md (< 500 words)
Tone (3–4 adjectives) · sentence rhythm · opening patterns · closing/CTA moves · signature phrases ·
hashtags (fixed + how to pick topical) · a **"this voice never does"** list · and a post template:
`[hook] · [benefit 1–2 lines] · [second-language line] · [CTA] · [hashtags]`. Add one on-voice example.

## Step 4 — confirm & hand off
Summarize, then point to `/adloom-hook` (openers), full caption drafting, or `/adloom-schedule`.

## Rules
- Work from real sample patterns; invent nothing. Mark absence signals explicitly.
- Honor `brand.emoji` (default false → no emojis in copy).
- Keep the second language to a single short line unless samples show otherwise.
- Benefit before feature. A number beats a vague claim.
