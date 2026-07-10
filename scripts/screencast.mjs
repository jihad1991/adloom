// Adloom — Screencast: record a REAL product flow as video (Playwright), the raw
// footage a Product-in-motion reel is built from. Drives a route through scripted
// steps while recording, then reports the saved webm + its native size.
//
// Needs playwright (npm i -D playwright — same dep as shots.mjs).
// Config: screencast.config.json next to this script or passed as argv[2]:
// {
//   "baseUrl": "http://localhost:3000",
//   "outDir": "reel-src",
//   "login": { "path":"/login", "userSel":"#email", "passSel":"#password",
//              "submitSel":"button[type=submit]" },        // optional (auth flows)
//   "auth": false,                                          // login before recording?
//   "route": "/menu",
//   "viewport": { "width":430, "height":932, "deviceScaleFactor":2, "isMobile":true },
//   "recordSize": { "width":886, "height":1920 },           // video pixels (screen aspect)
//   "hideCss": ".debugbar{display:none}",                   // optional
//   "steps": [                                              // scripted interaction
//     { "action":"wait",   "ms":1500 },
//     { "action":"click",  "selector":".menu-category:nth-child(2)" },
//     { "action":"scroll", "y":700, "ms":1200 },
//     { "action":"click",  "selector":"[data-add-to-cart]" }
//   ],
//   "out": "screencast.webm"
// }
// Credentials come from env APP_USER / APP_PASS at run time — never stored, never logged.
//   node screencast.mjs [config.json]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const cfgPath = process.argv[2]?.endsWith(".json") ? process.argv[2] : "screencast.config.json";
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const outDir = path.resolve(path.dirname(cfgPath), cfg.outDir ?? "reel-src");
fs.mkdirSync(outDir, { recursive: true });

const USER = process.env.APP_USER, PASS = process.env.APP_PASS;
if (cfg.auth && (!cfg.login || !USER || !PASS)) {
  console.error("auth requested but missing login config or APP_USER/APP_PASS env"); process.exit(1);
}

const vp = cfg.viewport ?? { width: 430, height: 932, deviceScaleFactor: 2, isMobile: true };
const recSize = cfg.recordSize ?? { width: vp.width * (vp.deviceScaleFactor ?? 1), height: vp.height * (vp.deviceScaleFactor ?? 1) };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: vp.width, height: vp.height },
  deviceScaleFactor: vp.deviceScaleFactor ?? 1,
  isMobile: vp.isMobile ?? false,
  recordVideo: { dir: outDir, size: { width: recSize.width, height: recSize.height } },
});

// Block dev-tool assets so they never render (most reliable for toolbars that
// rebuild themselves — e.g. Laravel Debugbar loads /_debugbar/assets/*).
const blockUrls = cfg.blockUrls ?? [];
if (blockUrls.length) await ctx.route("**/*", (route) => {
  const u = route.request().url();
  return blockUrls.some((s) => u.includes(s)) ? route.abort() : route.continue();
});

async function login() {
  const l = cfg.login, page = await ctx.newPage();
  await page.goto(cfg.baseUrl + l.path, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(l.userSel, { timeout: 30000 });
  await page.fill(l.userSel, USER); await page.fill(l.passSel, PASS);
  await page.click(l.submitSel);
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  await page.close(); // login page video is discarded; recording page is the star
}

// Persist hideCss across EVERY navigation (a plain addStyleTag is lost on goto,
// and dev toolbars often mount after load) by injecting at document-start.
// Some toolbars (Laravel Debugbar) resist display:none via their own !important
// stylesheet, so hideSelectors are physically REMOVED from the DOM on an interval.
if (cfg.hideCss || cfg.hideSelectors) await ctx.addInitScript(({ css, selectors }) => {
  if (css) {
    const inject = () => {
      if (document.getElementById("__adloom_hide")) return;
      const s = document.createElement("style");
      s.id = "__adloom_hide"; s.textContent = css;
      (document.head || document.documentElement).appendChild(s);
    };
    inject(); document.addEventListener("DOMContentLoaded", inject);
  }
  if (selectors?.length) {
    const strip = () => { for (const sel of selectors) document.querySelectorAll(sel).forEach(e => e.remove()); };
    setInterval(strip, 300);
    document.addEventListener("DOMContentLoaded", strip);
  }
}, { css: cfg.hideCss ?? "", selectors: cfg.hideSelectors ?? [] });

if (cfg.auth) await login();

const page = await ctx.newPage();
await page.goto(cfg.baseUrl + (cfg.route ?? "/"), { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
if (cfg.hideCss) await page.addStyleTag({ content: cfg.hideCss }).catch(() => {});
if (cfg.waitFor) await page.waitForSelector(cfg.waitFor, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(800);

for (const s of cfg.steps ?? []) {
  try {
    if (s.action === "wait") await page.waitForTimeout(s.ms ?? 1000);
    else if (s.action === "click") { await page.click(s.selector, { timeout: 10000 }); await page.waitForTimeout(s.ms ?? 700); }
    else if (s.action === "hover") { await page.hover(s.selector, { timeout: 10000 }); await page.waitForTimeout(s.ms ?? 500); }
    else if (s.action === "fill") { await page.fill(s.selector, s.value ?? "", { timeout: 10000 }); await page.waitForTimeout(s.ms ?? 500); }
    else if (s.action === "scroll") { await page.mouse.wheel(0, s.y ?? 500); await page.waitForTimeout(s.ms ?? 900); }
    else if (s.action === "goto") { await page.goto(cfg.baseUrl + s.path, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {}); await page.waitForTimeout(s.ms ?? 800); }
    console.log(`step ok: ${s.action}${s.selector ? " " + s.selector : ""}`);
  } catch (e) { console.error(`step ERR ${s.action}: ${e.message.split("\n")[0]}`); }
}

// A screencast needs a tail so the last beat isn't cut mid-motion.
await page.waitForTimeout(cfg.tailMs ?? 1200);

const video = page.video();
await page.close(); // finalizes the video file
await ctx.close();
await browser.close();

const tmpPath = video ? await video.path() : null;
if (!tmpPath || !fs.existsSync(tmpPath)) { console.error("no video produced"); process.exit(1); }
const outPath = path.join(outDir, cfg.out ?? "screencast.webm");
fs.renameSync(tmpPath, outPath);
console.log(`OK screencast -> ${outPath} (${fs.statSync(outPath).size} bytes, record ${recSize.width}x${recSize.height})`);
console.log(`next: point reel.config.json "screencast" at this file, then: node scripts/reel.mjs reel.config.json`);
