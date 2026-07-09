# Adloom

**Design-to-publish studio for social campaigns — as Claude Code skills.**

Adloom weaves the three strands of a social post into one loom: **image**, **copy**, and **schedule**.
Give it a brief; it generates AI image plates, composites them into a strict-grid layout with your brand
fonts and real product screenshots, writes on-voice captions in any language, and schedules the whole
week to your networks via Metricool.

Built and battle-tested end-to-end on a real 7-day bilingual (Arabic/English) campaign.

<p align="center">
  <img src="examples/coffee-shop/demo_4x5.png" width="420" alt="Adloom demo — AI plate + strict-grid composite, rendered to 1080x1350">
  <br>
  <em>Made entirely by Adloom: Gemini plate → strict-grid HTML composite → exact-pixel render.
  Reproduce it from <a href="examples/coffee-shop/">examples/coffee-shop</a>.</em>
</p>

```
brief ──▶ /adloom-voice ──▶ /adloom-campaign ─┬─▶ /adloom-plate    (AI imagery, one master → all ratios)
                                              ├─▶ /adloom-compose  (grid + fonts + mockups → PNGs)
                                              ├─▶ /adloom-hook     (openers) → captions
                                              └─▶ /adloom-review   (QA every artboard)
                                                        │ pass
                                                        ▼
                                               /adloom-schedule    (Metricool → FB / IG / LinkedIn)
```

## What's inside

| Skill | Does |
|-------|------|
| `/adloom-voice` | Build a reusable `brand-voice.md` from an interview + real samples |
| `/adloom-hook` | 6 scroll-stopping opening lines for any topic, on-voice |
| `/adloom-plate` | Gemini image plates + **extend one master across 1:1 / 4:5 / 9:16** (same image, every size) |
| `/adloom-compose` | Strict-grid HTML compositing + embedded fonts → exact-pixel PNGs (headless Chrome) |
| `/adloom-campaign` | Orchestrate a full multi-day campaign end-to-end |
| `/adloom-review` | Adversarial design QA: contrast, grid, overlap, fake text, cross-ratio consistency |
| `/adloom-schedule` | Schedule to Facebook / Instagram / LinkedIn via the Metricool MCP |

## Why it's different
- **Cross-ratio consistency**: one master image is *reframed* (image-to-image), not regenerated, so 1:1,
  4:5 and 9:16 show the same scene.
- **Pixel-identical renders**: brand fonts are embedded as base64 `@font-face` — no flaky web-font fetches
  mid-render. Absolute paths + unique user-data-dir make headless Chrome behave.
- **Real screenshots** dropped into premium phone/browser mockups, not just stock imagery.
- **One coherent look**: a strict grid (equal margins, centered header, footer on one baseline) makes a
  week of posts read as a family.
- **Actually publishes**: goes all the way to scheduled posts, including the public-image-URL workaround
  the Metricool API needs.

## Install
Requires Node 18+ and Chrome/Chromium.

```bash
git clone https://github.com/jihad1991/adloom.git
cd adloom
cp .env.example .env         # add your Google AI Studio key (GKEY)
cp config.example.json config.json   # set brand palette, fonts, ratios, hashtags
# drop your brand font files into ./fonts and your logo into ./assets
```

Use as a Claude Code plugin (add the repo as a marketplace/plugin), or copy the `skills/` folders into
your project's `.claude/skills/`.

For scheduling, connect the Metricool MCP once:
```bash
claude mcp add --transport http --scope user metricool https://ai.metricool.com/mcp
# then: /mcp  → authenticate metricool
```

## Configuration
Everything brand-specific lives in `config.json` (palette, fonts, aspect ratios, hashtags, schedule) and
secrets live in `.env` (never committed). No brand data is baked into the skills or scripts.

## Scripts
- `scripts/gen.mjs` — Gemini text-to-image plate. (`npm run plate -- out.png "4:5" "<prompt>"`)
- `scripts/gen_edit.mjs` — image-to-image reframe/extend (cross-ratio consistency, targeted edits). (`npm run extend`)
- `scripts/render.mjs` — render an HTML artboard to PNG at exact pixels via headless Chrome. (`npm run render`)
- `scripts/fontface.mjs` — embed local fonts as base64 `@font-face`.

## Try it in 5 minutes
[`examples/coffee-shop/`](examples/coffee-shop/) is a complete miniature project — config, brand voice,
a 3-day campaign, and the exact commands that produced the demo image above.

## Security
- Never commit `.env`, API keys, or account IDs. `.gitignore` covers them.
- The scheduler asks for explicit confirmation before anything goes live, and only uploads images you
  approve to a public host.

## License
MIT licensed. All code and skill text in this repository are original to Adloom.
