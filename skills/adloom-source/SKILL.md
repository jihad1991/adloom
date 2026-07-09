---
name: adloom-source
description: >
  Teach Adloom a whole SaaS product from its own source code (and, optionally, its running app) so
  every campaign is grounded in what the product actually does — no verbal briefing. Scans routes,
  i18n labels, theme colors, fonts and logos into product-scan.json, then writes a product.md
  knowledge file, fills config.json (palette/fonts/logo/brand), and derives a shots.config.json from
  real routes. Run ONCE per product, and again after big feature/brand changes. Triggers: "understand
  my product", "connect the source", "learn the system", "افهم النظام", "اربط السورس", "افهم المنتج".
metadata:
  author: Adloom
  version: "0.1.0"
---

# Adloom Source — teach it the product

Instead of describing your SaaS in a brief, point Adloom at its codebase. This skill reads the source
(and optionally the live app) and produces the ground truth every other skill then builds on:

- **`product.md`** — the product knowledge file: what it is, who it's for, a feature→benefit map,
  the product's own terminology, and the angles actually worth marketing. Voice reads `brand-voice.md`;
  everything else reads `product.md`.
- **`config.json`** — auto-filled brand (name, domain, audience, promise), palette, fonts, logo.
- **`shots.config.json`** — a capture list derived from real routes, handed to `/adloom-shots`.

This is the missing half of `/adloom-voice`: voice is *how* the brand talks, `product.md` is *what it
actually sells*. Together they make hooks, concepts, captions and campaigns concrete instead of generic.

## Inputs
- **Source root** — the repo to learn. Set `source.root` in `config.json` (e.g. `"../my-saas"`), or pass
  a path when you run the skill. Read-only; the scanner never writes into the product repo and never
  reads secrets (`.env*`, keys, certs).
- **Live app URL** *(hybrid, optional)* — `source.appUrl` (e.g. `http://localhost:3000`). Used only to
  capture real screens via `/adloom-shots`. Skip it for a static-only pass.

## Steps

1. **Scan the code.** Run the mechanical extractor (Node 18+, no deps):
   ```bash
   node scripts/scan.mjs <source.root> product-scan.json
   ```
   It emits raw signals: `identity`, `stack`, `routes[]`, `labels[]` (i18n values — the product's own
   words for its features), `palette.ranked` + `palette.brandVars`, `fonts`, `logos`. The scanner
   **gathers, it never decides** — you do the interpreting in the next steps.

2. **Write `product.md`.** Read `product-scan.json` and, where a signal is ambiguous, open the 3–6
   files it points to (README, the router file, a main i18n file, the theme/tokens file) to confirm.
   Then write `product.md` in this shape:

   ```markdown
   # <Product name> — product knowledge
   > One-line: what it is and who it's for.  ·  Domain: <domain>  ·  Stack: <stack>

   ## What it is
   2–3 sentences. Plain language. No adjectives you can't back with a feature.

   ## Who it's for
   The audience(s), pulled from README / landing copy / i18n (e.g. "Cafes, Restaurants, Salons, Clinics").

   ## Feature map
   Group real routes + labels into user-facing capabilities. For each: the product's own name for it,
   the route(s) it lives at, and the ONE benefit a customer cares about. Only list features backed by a
   route or a label — never invent one.
   | Feature | Where | Why a customer cares |
   |---------|-------|----------------------|
   | Products & pricing | /products, /products/group-prices | ... |
   | ... | ... | ... |

   ## Terminology
   The product's own words (from i18n labels) so captions speak the system's language, not generic SaaS.

   ## Marketing angles
   5–10 concrete campaign ideas, each tied to a real feature — the raw material for /adloom-campaign
   and /adloom-concept.

   ## Not in scope / do not claim
   Things the code does NOT show (integrations, numbers, guarantees) so no skill invents them.
   ```

   Grounding rule: **every feature and claim must trace to a route, a label, or a file you read.** If the
   scan doesn't support it, it doesn't go in `product.md`. Never fabricate pricing, customer counts,
   integrations, or certifications.

3. **Fill `config.json`.** Propose values from the scan, show the diff, and confirm before writing (if a
   `config.json` already exists, never silently overwrite — merge and ask on conflicts):
   - `brand.name` / `brand.domain` / `brand.audience` / `brand.promise` — from identity + README + labels.
   - `palette` — prefer named brand tokens from `palette.brandVars` (e.g. `--primary`, `--accent`,
     `--*-brand`) over raw `ranked` hex frequency; map them onto Adloom's slots (`bg`, `bgDeep`, `accent`,
     `accentDeep`, `light`, `textOnBg`, `textOnAccent`). Keep contrast sane — verify, don't just paste.
   - `fonts.family` + `fonts.weights` — from `fonts.families` / `fonts.files` (copy the actual `.ttf/.woff`
     into `./fonts` if you want pixel-identical renders).
   - `logo` — pick a real wordmark/icon from `logos[]` (favour `wordmark*`, avoid tiny favicons).
   - `hashtags.fixed` — brand name + city if present; leave `topical` for the campaign.

4. **Derive `shots.config.json` (hybrid).** Turn the most demo-worthy routes into a capture list —
   dashboard, products, POS/checkout, reports, settings — with sensible viewports, then run
   `/adloom-shots` (the user runs authenticated captures themselves with `APP_USER`/`APP_PASS`). This is
   how real product screens flow into `/adloom-compose` mockups. Skip if no `appUrl`.

5. **Confirm.** Summarize: N features mapped, palette + fonts + logo set, M routes queued for capture.
   Point out anything low-confidence (guessed audience, ambiguous palette) for the user to correct once —
   corrections live in `product.md`/`config.json` and every later skill inherits them.

## How the rest of Adloom uses it
- `/adloom-campaign` plans days around the **feature map** and **marketing angles** — real capabilities,
  in priority order — instead of a hand-typed brief.
- `/adloom-concept` and `/adloom-hook` pull concrete features and the product's **terminology**, so ideas
  and openers are specific ("group pricing", "expiring stock") not generic ("boost your business").
- `/adloom-shots` captures the exact routes this skill queued.
- `/adloom-voice` still owns tone; this skill owns facts. Run voice for *how*, source for *what*.

## Rules
- **Brand-agnostic.** Works on any SaaS repo; bake in nothing product-specific. All output lives in the
  user's `product.md` / `config.json`, never in the skill.
- **Ground every claim.** A feature or benefit that isn't backed by a route, a label, or a file you read
  does not ship. When unsure, say so in "Not in scope" rather than guessing.
- **Never invent numbers.** No pricing, user counts, ratings, or integration names unless the code shows
  them. Marketing copy fabricating these is the failure mode this skill exists to prevent.
- **Read-only + secret-safe.** The scanner and this skill never modify the product repo and never open
  secrets. Only `product.md`, `config.json`, and `shots.config.json` (in the Adloom project) are written.
- **Refresh, don't drift.** Re-run after a major feature launch or rebrand so `product.md` and the palette
  stay true; log what changed.
