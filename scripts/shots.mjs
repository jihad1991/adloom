// Adloom — Screen Library: capture real product screens into a reusable library
// that compositors pull from (phone/browser mockups), instead of ad-hoc screenshots.
//
// Needs playwright installed (npm i -D playwright). Config: shots.config.json next to
// this script or passed as argv[2]:
// {
//   "baseUrl": "http://localhost:3000",
//   "outDir": "shots-library",
//   "login": { "path": "/login", "userSel": "#email", "passSel": "#password",
//              "submitSel": "button[type=submit]" },            // optional
//   "viewports": { "desktop": {"width":1600,"height":1000,"deviceScaleFactor":2},
//                  "mobile":  {"width":430,"height":932,"deviceScaleFactor":2,"isMobile":true} },
//   "shots": [ { "name":"home", "path":"/", "viewport":"mobile", "auth":false, "settleMs":4000 } ]
// }
// Credentials come from env APP_USER / APP_PASS at run time — never stored, never logged.
//   node shots.mjs [config.json] [shotName ...]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const cfgPath = process.argv[2]?.endsWith(".json") ? process.argv[2] : "shots.config.json";
const only = process.argv.slice(process.argv[2]?.endsWith(".json") ? 3 : 2);
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const outDir = path.resolve(path.dirname(cfgPath), cfg.outDir ?? "shots-library");
fs.mkdirSync(outDir, { recursive: true });

const USER = process.env.APP_USER, PASS = process.env.APP_PASS;
const canAuth = Boolean(cfg.login && USER && PASS);
const wanted = cfg.shots.filter(s => (only.length ? only.includes(s.name) : true));
const skipped = wanted.filter(s => s.auth && !canAuth).map(s => s.name);
const todo = wanted.filter(s => !s.auth || canAuth);
if (!todo.length) { console.error("nothing to capture", skipped.length ? `(auth shots need APP_USER/APP_PASS: ${skipped.join(", ")})` : ""); process.exit(1); }

const browser = await chromium.launch({ headless: true });
const manifestPath = path.join(outDir, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};

async function makeContext(vpName, authed) {
  const vp = cfg.viewports[vpName];
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor ?? 1,
    isMobile: vp.isMobile ?? false,
  });
  if (authed) {
    const l = cfg.login, page = await ctx.newPage();
    await page.goto(cfg.baseUrl + l.path, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(l.userSel, { timeout: 30000 });
    await page.fill(l.userSel, USER);
    await page.fill(l.passSel, PASS);
    await page.click(l.submitSel);
    await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.close();
  }
  return ctx;
}

const groups = new Map();
for (const s of todo) {
  const key = `${s.viewport}|${s.auth}`;
  (groups.get(key) ?? groups.set(key, []).get(key)).push(s);
}

let ok = 0, fail = 0;
for (const [key, shots] of groups) {
  const [vpName, authStr] = key.split("|");
  let ctx;
  try { ctx = await makeContext(vpName, authStr === "true"); }
  catch (e) { console.error(`context ${key} failed: ${e.message}`); fail += shots.length; continue; }
  for (const s of shots) {
    const page = await ctx.newPage();
    try {
      await page.goto(cfg.baseUrl + s.path, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(s.settleMs ?? 3000);
      // design-grade: hide common dev toolbars and scrollbars
      await page.addStyleTag({ content: (cfg.hideCss ?? "") + " ::-webkit-scrollbar{display:none}" }).catch(() => {});
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, `${s.name}.png`), fullPage: false });
      const vp = cfg.viewports[s.viewport];
      manifest[s.name] = { path: s.path, viewport: s.viewport,
        width: vp.width * (vp.deviceScaleFactor ?? 1), height: vp.height * (vp.deviceScaleFactor ?? 1),
        auth: !!s.auth, capturedAt: new Date().toISOString() };
      console.log(`OK  ${s.name}`); ok++;
    } catch (e) { console.error(`ERR ${s.name}: ${e.message.split("\n")[0]}`); fail++; }
    finally { await page.close(); }
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\ndone: ${ok} captured, ${fail} failed${skipped.length ? `, skipped (need APP_USER/APP_PASS): ${skipped.join(", ")}` : ""}\nlibrary: ${outDir}`);
