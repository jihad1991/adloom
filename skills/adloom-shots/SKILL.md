---
name: adloom-shots
description: >
  Screen Library — capture real product screens (Playwright) into a versioned library with a manifest,
  and pull mockup screenshots from there instead of ad-hoc captures. Use before any design that shows
  the product UI, or to refresh shots after a UI change. Triggers: "screenshots", "screen library",
  "capture screens", "product shots".
metadata:
  author: Adloom
  version: "0.1.0"
---

# Adloom Shots — Screen Library

Real screenshots beat fake UI — but only if they're consistent. This skill maintains ONE library of
design-grade product screens that `/adloom-compose` mockups pull from.

## Setup
`scripts/shots.mjs` (needs `npm i -D playwright`) + a `shots.config.json`:
baseUrl, optional `login` selectors, `viewports` (mobile 430×932 @2x, desktop 1600×1000 @2x),
and a `shots` list (`name · path · viewport · auth · settleMs`). Optional `hideCss` to hide dev
toolbars (debug bars, HMR overlays) before capture.

## Run
```bash
node scripts/shots.mjs shots.config.json              # public shots
APP_USER=... APP_PASS=... node scripts/shots.mjs ...  # + authenticated shots (user runs this)
node scripts/shots.mjs shots.config.json home pricing # only named shots
```
Credentials come from env at run time — never stored, never logged; the user runs authenticated
captures themselves.

## Rules
- Compositors read from the library by manifest name — never from loose screenshots.
- Re-capture before each campaign so shots reflect the current UI.
- Shot quality = data quality: capture from an account with clean demo data (broken images or
  placeholder names will leak into the artwork — `/adloom-review` flags them).
- deviceScaleFactor 2 minimum; crop/frame happens in `/adloom-compose`, not at capture time.
