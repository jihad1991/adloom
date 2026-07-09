// Adloom — render an HTML file to a PNG at an EXACT pixel size via headless Chrome.
// Lessons baked in: absolute paths (Chrome headless fails on relative --screenshot),
// a unique --user-data-dir per render (avoids the silent no-output race).
// Usage: node render.mjs <input.html> <output.png> <width> <height> [chromePath]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const [, , inHtml, outPng, wStr, hStr, chromeArg] = process.argv;
if (!inHtml || !outPng || !wStr || !hStr) { console.error("usage: node render.mjs in.html out.png W H [chromePath]"); process.exit(2); }
const W = parseInt(wStr, 10), H = parseInt(hStr, 10);

function detectChrome() {
  const c = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium",
  ].filter(Boolean);
  for (const p of c) if (fs.existsSync(p)) return p;
  throw new Error("Chrome not found. Pass a path arg or set CHROME_PATH.");
}
const chrome = chromeArg || detectChrome();
const inAbs = path.resolve(inHtml), outAbs = path.resolve(outPng);
const udd = path.join(os.tmpdir(), "adloom-cdp-" + path.basename(outPng, path.extname(outPng)) + "-" + W + "x" + H);
try { fs.rmSync(outAbs, { force: true }); } catch {}
execFileSync(chrome, [
  "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
  `--window-size=${W},${H}`, `--user-data-dir=${udd}`,
  `--screenshot=${outAbs}`, inAbs,
], { stdio: "ignore" });
if (!fs.existsSync(outAbs)) { console.error("render produced no file"); process.exit(1); }
console.log(`OK ${outAbs} ${fs.statSync(outAbs).size}b`);
