---
name: adloom-schedule
description: >
  Schedule finished posts (image + caption + hashtags) to social networks via the Metricool MCP server,
  handling the public-image-URL requirement. Confirms before anything goes live. Use to publish/schedule
  a prepared campaign. Triggers: "schedule", "publish", "post to", "metricool", "جدولة", "نشر".
metadata:
  author: Adloom
  version: "0.1.0"
---

# Adloom Schedule

Publish/schedule prepared posts through Metricool. **Nothing auto-publishes without explicit user
confirmation of the exact posts, times, and networks.**

## Prereqs
- Metricool MCP connected + authenticated: `claude mcp add --transport http --scope user metricool https://ai.metricool.com/mcp`
  then authenticate via `/mcp` in an interactive session.
- Tools used: `getBrandSettings`, `getScheduledPosts`, `createScheduledPost`, `updateScheduledPost`,
  `getBestTimeToPostByNetwork`.

## The image gotcha (important)
The API `media` field takes **public URLs only** — not local files. So host each image publicly first,
then pass the URL; Metricool downloads and re-hosts it on its own CDN (the temp copy becomes disposable).
Anonymous host example:
```
curl -s -F "reqtype=fileupload" -F "fileToUpload=@out/day2/day2_4x5.png" https://catbox.moe/user/api.php
```
Only do this for assets that are meant to be public (marketing creatives are). Get user sign-off before
uploading anything sensitive to a third-party host.

## Flow
1. `getBrandSettings` → confirm `blogId`, timezone, and which networks are actually connected. If the
   user wants a network that isn't connected (e.g. X, TikTok), tell them to link it first.
2. Host the images → collect public URLs.
3. For each post, `createScheduledPost` (or `updateScheduledPost` on an existing draft) with:
   `text`, `media:[url]`, `providers`, `publicationDate:{dateTime,timezone}`, per-network `*Data`,
   `autoPublish:true`, `draft:false`. Instagram requires ≥1 image. Respect per-network limits
   (X ≤ 280 chars, Bluesky ≤ 300 — do not thread; edit instead).
4. **Confirm the full schedule with the user** (days, times, networks) before flipping drafts live.
5. Verify with `getScheduledPosts` that each is `draft:false` with media attached.

## Rules
- Times in the brand timezone from `getBrandSettings`.
- Show what will publish and when; get a clear yes before it goes live.
- Report per-post status; never assume success — read it back.
