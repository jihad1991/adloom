---
name: adloom-concept
description: >
  Creative director for a single post: turn a message into 5 competing Big Idea routes (visual metaphor,
  UI-in-the-real-world, scale play, cinematic portrait, editorial type poster), each with a ready-to-run
  Gemini prompt and a layout note. Use BEFORE adloom-plate when you want an ad that carries the message
  in the image itself, not just text over a background. Triggers: "concept", "big idea", "creative ad",
  "فكرة إعلانية", "إعلان إبداعي".
metadata:
  author: Adloom
  version: "0.1.0"
---

# Adloom Concept

The difference between a decent post and a scroll-stopper is the **idea living inside the image**.
This skill runs the creative-director pass: for one message, pitch **5 concept routes**, each from a
different archetype, then hand the winner to `/adloom-plate`.

## Input
One message/benefit (e.g. "orders arrive instantly", "coffee restarts your morning") + the brand facts
from `config.json`. If the message is vague, sharpen it to ONE claim first — a concept can only carry one.

## The 5 archetypes (pitch one route from each)

1. **Visual metaphor** — an object from the audience's world *becomes* the claim.
   *Chess board = next match. A queue of people walking into a giant phone = online orders.*
   Prompt keys: single dominant object, literal fusion of the two things, studio or cinematic ground,
   dramatic light, lots of negative space for type.

2. **UI in the real world** — a familiar interface element rendered as a physical object in a real scene.
   *A right-click "Refresh" menu leaning against a chai glass; an incoming-call card for "Coffee".*
   Prompt keys: name the exact UI element (context menu / incoming call / notification / battery bar),
   make it physical (paper, ceramic, neon), interacting with a real product. Keep UI text to 2–4 real
   words — spell them out in the prompt so the model doesn't invent gibberish.

3. **Scale play** — one thing absurdly giant (or tiny) treated with photoreal seriousness.
   *A person pulling a building-sized coffee cup on wheels; a kiosk whose roof is a takeaway lid.*
   Prompt keys: "impossibly giant/tiny", physical consequence (wheels, rope, ladder, shadow), everyday
   setting shot like a car commercial.

4. **Cinematic portrait** — one hero, one prop, one mood; the story on their face.
   *An elder beside a classic car in matching color; a coach behind a chess piece, low angle.*
   Prompt keys: color-matched subject+prop, moody single-source light, wide-angle or low hero angle,
   background dressed but out of focus.

5. **Editorial type poster** — the word IS the design; the subject sits in front of/inside huge display type.
   *A giant one-word headline behind an armchair portrait, keyhole vignette.*
   Two builds: (a) bake ONE short word into the plate via the prompt ("huge cream sans-serif word 'REFILL'
   behind the chair, partially occluded by the subject") — short words only, verify spelling on review;
   or (b) generate the subject on clean ground and set the giant type in `/adloom-compose` (safer).

## Output format
For each route: `title · one-line idea · why it sells the claim · the Gemini prompt (ready) · layout note
(where headline/CTA/logo go, what stays empty)`. Then recommend ONE and say why. On approval, run it
through `/adloom-plate` (master + ratio extends) and `/adloom-compose` (poster-mode type if route 5).

## Rules
- One claim per concept. If a route needs a paragraph to explain, kill it.
- Respect the brand palette in every prompt (name the hexes) and demand negative space for type.
- Any text baked into the image must be spelled letter-by-letter in the prompt and checked by `/adloom-review`.
- Don't clone a reference ad — steal the *mechanism* (metaphor/UI/scale), never the execution.
