// Adloom — Reel assembler. Composites a real product screencast into a branded
// 9:16 phone-mockup reel with burned-in, beat-timed captions.
//
// Design: Chrome renders the pretty layers as PNGs (perfect Arabic shaping via
// embedded fonts) — an opaque brand BACKGROUND, a transparent FRAME (phone bezel +
// wordmark + CTA), and one transparent CAPTION card per beat. ffmpeg then layers:
//   background  ->  screencast (in the screen rect)  ->  frame  ->  timed captions.
// No fragile in-browser video frame-stepping; no ffmpeg drawtext (which mangles
// Arabic). Deterministic and pixel-identical.
//
// Needs: Chrome/Chromium + ffmpeg + ffprobe on PATH (or CHROME_PATH / FFMPEG_PATH /
// FFPROBE_PATH). Reads config.json (fonts/palette/logo) + reel.config.json.
//   node reel.mjs [reel.config.json] [out.mp4]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fontFaces } from "./fontface.mjs";

const cfgPath = process.argv[2]?.endsWith(".json") ? process.argv[2] : "reel.config.json";
const outMp4 = path.resolve(process.argv[3] || "reel.mp4");
const dir = path.dirname(path.resolve(cfgPath));
const reel = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const brand = fs.existsSync(path.join(dir, "config.json"))
  ? JSON.parse(fs.readFileSync(path.join(dir, "config.json"), "utf8")) : {};

// ---- resolve tools -----------------------------------------------------------
function which(bin, envVar, candidates) {
  if (process.env[envVar] && fs.existsSync(process.env[envVar])) return process.env[envVar];
  for (const c of candidates) if (c && fs.existsSync(c)) return c;
  return bin; // trust PATH
}
const chrome = which("chrome", "CHROME_PATH", [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium",
]);
const ffmpeg = which("ffmpeg", "FFMPEG_PATH", []);
const ffprobe = which("ffprobe", "FFPROBE_PATH", []);

// ---- config + defaults -------------------------------------------------------
const W = reel.canvas?.w ?? 1080, H = reel.canvas?.h ?? 1920, FPS = reel.canvas?.fps ?? 30;
const pal = brand.palette ?? {};
const bgTop = reel.bg?.top ?? pal.bg ?? "#1E2537";
const bgBottom = reel.bg?.bottom ?? pal.bgDeep ?? "#0B101D";
const accent = reel.accent ?? pal.accent ?? "#5ABBB5";
const textOnBg = pal.textOnBg ?? "#FFFFFF";
const textOnAccent = pal.textOnAccent ?? "#062429";
const screen = reel.screen ?? { x: 160, y: 300, w: 760, h: 1351, radius: 46 };
const bezel = reel.bezel ?? 14;
const cta = reel.cta ?? null;
const screencast = path.resolve(dir, reel.screencast || "reel-src/screencast.webm");
if (!fs.existsSync(screencast)) { console.error(`NO_SCREENCAST: ${screencast} — run screencast.mjs first`); process.exit(2); }

// font embedding (optional — falls back to a system Arabic stack if files absent)
let fontCss = "", fam = "system-ui, sans-serif";
try {
  if (brand.fonts?.family && brand.fonts?.weights) {
    const fdir = path.resolve(dir, brand.fonts.dir ?? "./fonts");
    const present = brand.fonts.weights.filter(([f]) => fs.existsSync(path.join(fdir, f)));
    if (present.length) {
      fontCss = fontFaces(brand.fonts.family, fdir, present);
      fam = `${JSON.stringify(brand.fonts.family)}, ${brand.fonts.latinFamily ?? "Inter"}, system-ui, sans-serif`;
    }
  }
} catch (e) { console.error("font embed skipped:", e.message); }
if (!fontCss) console.error("note: brand fonts not found — using system font fallback");

// logo as data URI (avoids file:// quirks in headless Chrome)
function dataUri(p) {
  const abs = path.resolve(dir, p);
  if (!fs.existsSync(abs)) return null;
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${fs.readFileSync(abs).toString("base64")}`;
}
const wordmark = reel.wordmark ? dataUri(reel.wordmark) : (brand.logo?.light ? dataUri(brand.logo.light) : null);

// ---- render helpers ----------------------------------------------------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "adloom-reel-"));
const cleanup = [];
function renderHtml(html, name) {
  const htmlPath = path.join(tmp, name + ".html");
  const pngPath = path.join(tmp, name + ".png");
  fs.writeFileSync(htmlPath, html);
  const udd = path.join(tmp, "udd-" + name);
  execFileSync(chrome, [
    "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--default-background-color=00000000", `--window-size=${W},${H}`,
    `--user-data-dir=${udd}`, `--screenshot=${pngPath}`, htmlPath,
  ], { stdio: "ignore" });
  if (!fs.existsSync(pngPath)) throw new Error("chrome produced no PNG for " + name);
  cleanup.push(pngPath);
  return pngPath;
}
const base = `<style>${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;font-family:${fam};-webkit-font-smoothing:antialiased}
.stage{position:absolute;inset:0;width:${W}px;height:${H}px}
</style>`;

// 1) BACKGROUND (opaque, sits UNDER the video)
const bgPng = renderHtml(`${base}<div class="stage" style="background:
  radial-gradient(120% 90% at 50% 0%, ${bgTop} 0%, ${bgBottom} 78%)"></div>`, "bg");

// 2) FRAME (transparent — bezel ring around the screen rect + wordmark + CTA)
const frameHtml = `${base}<div class="stage">
  <div style="position:absolute;left:${screen.x - bezel}px;top:${screen.y - bezel}px;
    width:${screen.w + bezel * 2}px;height:${screen.h + bezel * 2}px;
    border:${bezel}px solid #0a0d16;border-radius:${screen.radius + bezel}px;
    box-shadow:0 30px 90px rgba(0,0,0,.55), inset 0 0 0 1.5px rgba(255,255,255,.06)"></div>
  ${wordmark ? `<img src="${wordmark}" style="position:absolute;left:56px;bottom:70px;height:52px;opacity:.96"/>` : ""}
  ${cta ? `<div style="position:absolute;right:56px;bottom:64px;background:${accent};color:${textOnAccent};
    font-weight:700;font-size:34px;padding:16px 30px;border-radius:999px">${cta}</div>` : ""}
</div>`;
const framePng = renderHtml(frameHtml, "frame");

// 3) CAPTIONS (transparent, one per beat; placed in the lower-middle with a scrim)
const beats = (reel.beats ?? []).map((b, i) => {
  const html = `${base}<div class="stage">
    <div style="position:absolute;left:70px;right:70px;bottom:560px;text-align:center">
      <div style="display:inline-block;max-width:900px;background:rgba(8,12,20,.62);
        backdrop-filter:blur(2px);border-radius:26px;padding:26px 38px;
        border:1px solid rgba(255,255,255,.08)">
        <div style="color:${textOnBg};font-weight:700;font-size:62px;line-height:1.25;
          text-shadow:0 3px 18px rgba(0,0,0,.6)">${b.text}</div>
        ${b.sub ? `<div style="color:${accent};font-weight:600;font-size:36px;margin-top:12px">${b.sub}</div>` : ""}
      </div>
    </div>
  </div>`;
  return { ...b, png: renderHtml(html, "cap" + i) };
});

// ---- probe screencast duration ----------------------------------------------
function probeDuration(f) {
  const out = execFileSync(ffprobe, ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", f], { encoding: "utf8" }).trim();
  const d = parseFloat(out);
  return Number.isFinite(d) && d > 0 ? d : null;
}
const DUR = probeDuration(screencast) ?? (beats.length ? Math.max(...beats.map(b => b.to)) : 8);

// ---- build ffmpeg graph ------------------------------------------------------
// inputs: 0 screencast, 1 bg, 2 frame, 3.. captions
const inputs = ["-i", screencast, "-loop", "1", "-i", bgPng, "-loop", "1", "-i", framePng];
beats.forEach(b => inputs.push("-loop", "1", "-i", b.png));

const fc = [];
fc.push(`[1:v]scale=${W}:${H},setsar=1[bg]`);
fc.push(`[0:v]scale=${screen.w}:${screen.h}:force_original_aspect_ratio=increase,crop=${screen.w}:${screen.h},setsar=1[scr]`);
fc.push(`[bg][scr]overlay=${screen.x}:${screen.y}[s0]`);
fc.push(`[s0][2:v]overlay=0:0[s1]`);
let last = "s1";
beats.forEach((b, i) => {
  const inIdx = 3 + i;
  const capL = `cap${i}`, outL = `s${i + 2}`;
  const fadeIn = 0.25, fadeOut = 0.25;
  const outStart = Math.max(b.from, b.to - fadeOut);
  fc.push(`[${inIdx}:v]format=yuva420p,fade=t=in:st=${b.from}:d=${fadeIn}:alpha=1,fade=t=out:st=${outStart}:d=${fadeOut}:alpha=1[${capL}]`);
  fc.push(`[${last}][${capL}]overlay=0:0:enable='between(t,${b.from},${b.to})'[${outL}]`);
  last = outL;
});

const args = [
  "-y", ...inputs,
  "-filter_complex", fc.join(";"),
  "-map", `[${last}]`,
  "-t", DUR.toFixed(2), "-r", String(FPS),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20",
  "-movflags", "+faststart",
  outMp4,
];

console.log(`rendering reel: ${W}x${H} @${FPS}fps, ${DUR.toFixed(1)}s, ${beats.length} caption(s)`);
try {
  execFileSync(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"] });
} catch (e) {
  const err = (e.stderr?.toString() || e.message).split("\n").slice(-12).join("\n");
  console.error("ffmpeg failed:\n" + err); process.exit(1);
}
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
console.log(`OK reel -> ${outMp4} (${fs.statSync(outMp4).size} bytes)`);
