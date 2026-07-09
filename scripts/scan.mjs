// Adloom — Source scanner: read a SaaS codebase and emit raw PRODUCT SIGNALS
// (name, features/routes, i18n labels, palette + CSS-var candidates, fonts, logos,
// nav labels, product terminology) as one JSON file. The /adloom-source skill
// reasons over this to write product.md and fill config.json — the scanner never
// decides, it only gathers. Best-effort and framework-agnostic (Laravel, Vue,
// React, Next, Nuxt, Svelte, plain).
//
// Usage: node scripts/scan.mjs <repoRoot> [outFile]
//   node scripts/scan.mjs ../my-saas product-scan.json
// Node 18+, zero dependencies.
//
// Safety: never reads dotfiles or secrets (.env*, *.key, *.pem, *.p12). Skips
// vendor/build/dep dirs. Read-only — it opens files, it never writes to the repo.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || ".");
const outFile = process.argv[3] || "product-scan.json";
if (!fs.existsSync(root)) { console.error(`NO_ROOT: ${root} does not exist`); process.exit(2); }

// --- walk config: what we refuse to descend into, and hard caps to stay bounded.
const SKIP_DIR = new Set([
  "node_modules", "vendor", ".git", ".github", "dist", "build", "out", "coverage",
  ".next", ".nuxt", ".svelte-kit", ".turbo", ".cache", "tmp", "temp", "storage",
  "bootstrap", "public", "static", "assets-build", "__pycache__", ".venv", "venv",
]);
// public/ is skipped for *code* walking but we still want logos/fonts from it,
// so we scan a shallow asset pass separately (see collectAssets).
const MAX_FILES = 8000;
const MAX_READ = 400 * 1024; // 400 KB per file
const isSecret = f => /(^\.env)|\.(key|pem|p12|pfx|crt|cer)$/i.test(f);

const codeExt = new Set([".php", ".js", ".ts", ".jsx", ".tsx", ".vue", ".svelte", ".blade.php"]);
const styleExt = new Set([".css", ".scss", ".sass", ".less", ".vue", ".svelte", ".html"]);

let fileCount = 0;
const extCounts = {};
const files = []; // {abs, rel, ext, base}

function ext2(name) {
  if (name.endsWith(".blade.php")) return ".blade.php";
  return path.extname(name).toLowerCase();
}
function walk(dir) {
  if (fileCount >= MAX_FILES) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (fileCount >= MAX_FILES) return;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR.has(e.name) || e.name.startsWith(".")) continue;
      walk(abs);
    } else if (e.isFile()) {
      if (isSecret(e.name)) continue;
      const ext = ext2(e.name);
      extCounts[ext] = (extCounts[ext] || 0) + 1;
      files.push({ abs, rel: path.relative(root, abs).replaceAll("\\", "/"), ext, base: e.name });
      fileCount++;
    }
  }
}
walk(root);

function read(abs) {
  try {
    const st = fs.statSync(abs);
    if (st.size > MAX_READ) return null;
    return fs.readFileSync(abs, "utf8");
  } catch { return null; }
}

// --- 1. Identity: name / description / keywords from manifests + README --------
const identity = { name: null, description: null, keywords: [], readmeTitle: null, readmeIntro: null, homepage: null };
function tryJson(rel) {
  const f = files.find(x => x.rel === rel);
  if (!f) return null;
  try { return JSON.parse(read(f.abs) || "{}"); } catch { return null; }
}
const pkg = tryJson("package.json");
if (pkg) {
  identity.name = identity.name || pkg.name || null;
  identity.description = identity.description || pkg.description || null;
  if (Array.isArray(pkg.keywords)) identity.keywords.push(...pkg.keywords);
  identity.homepage = identity.homepage || pkg.homepage || null;
}
const composer = tryJson("composer.json");
if (composer) {
  identity.name = identity.name || composer.name || null;
  identity.description = identity.description || composer.description || null;
  if (Array.isArray(composer.keywords)) identity.keywords.push(...composer.keywords);
}
const readme = files.find(x => /^readme(\.md|\.txt)?$/i.test(x.base));
if (readme) {
  const t = read(readme.abs) || "";
  const h = t.match(/^#\s+(.+)$/m);
  identity.readmeTitle = h ? h[1].trim() : null;
  // first non-empty, non-heading, non-badge paragraph
  const para = t.split(/\n\s*\n/).map(s => s.trim())
    .find(s => s && !s.startsWith("#") && !s.startsWith("![") && !s.startsWith("<") && !/^\[!\[/.test(s));
  identity.readmeIntro = para ? para.replace(/\s+/g, " ").slice(0, 500) : null;
}
identity.keywords = [...new Set(identity.keywords)].slice(0, 40);

// --- 2. Stack detection --------------------------------------------------------
const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
const has = n => Object.prototype.hasOwnProperty.call(deps, n);
const stack = [];
if (composer || extCounts[".php"]) stack.push("php");
if (files.some(f => f.base === "artisan")) stack.push("laravel");
if (has("next")) stack.push("next");
else if (has("nuxt") || has("nuxt3")) stack.push("nuxt");
else if (has("vue") || extCounts[".vue"]) stack.push("vue");
if (has("react") || has("react-dom")) stack.push("react");
if (has("svelte") || extCounts[".svelte"]) stack.push("svelte");
if (has("tailwindcss") || files.some(f => /^tailwind\.config\./.test(f.base))) stack.push("tailwind");

// --- 3. Features / routes ------------------------------------------------------
// Best-effort per stack. A "route" is {path, name, source}. Deduped later.
const routes = [];
const seenRoute = new Set();
function addRoute(p, name, src) {
  const pathKey = (p || "").trim();
  if (!pathKey && !name) return;
  const key = (pathKey || name).toLowerCase();
  if (seenRoute.has(key)) return;
  seenRoute.add(key);
  routes.push({ path: pathKey || null, name: name || null, source: src });
}

for (const f of files) {
  if (routes.length > 800) break;
  // Laravel route files
  if (f.ext === ".php" && /(^|\/)routes\//.test(f.rel)) {
    const t = read(f.abs); if (!t) continue;
    const re = /Route::(?:get|post|put|patch|delete|any|match|resource|view)\s*\(\s*['"]([^'"]+)['"]/g;
    let m; while ((m = re.exec(t))) {
      // grab a ->name('...') that follows on the same statement, if any
      const tail = t.slice(m.index, m.index + 400);
      const nm = tail.match(/->name\(\s*['"]([^'"]+)['"]/);
      addRoute("/" + m[1].replace(/^\//, ""), nm ? nm[1] : null, "laravel-route");
    }
  }
  // JS/TS/Vue router config: path: '...'  (+ name: '...' nearby)
  if ([".js", ".ts", ".jsx", ".tsx"].includes(f.ext) && /(rout|pages)/i.test(f.rel)) {
    const t = read(f.abs); if (!t) continue;
    const re = /path:\s*['"`]([^'"`]+)['"`]/g;
    let m; while ((m = re.exec(t))) {
      // prefer a name: in the SAME object — look forward from the path first,
      // then a short window back; a wide back-window steals the sibling's name.
      const fwd = t.slice(m.index, m.index + 160).match(/name:\s*['"`]([^'"`]+)['"`]/);
      const back = t.slice(Math.max(0, m.index - 60), m.index).match(/name:\s*['"`]([^'"`]+)['"`]/);
      addRoute(m[1], fwd ? fwd[1] : (back ? back[1] : null), "js-router");
    }
  }
}
// Next.js / Nuxt file-based routing → derive from pages|app dir file paths
for (const f of files) {
  if (routes.length > 900) break;
  const m = f.rel.match(/(?:^|\/)(?:src\/)?(?:pages|app|routes)\/(.+)\.(?:vue|jsx?|tsx?|svelte)$/);
  if (!m) continue;
  let p = "/" + m[1]
    .replace(/\/(index|page|\+page)$/i, "")
    .replace(/index$/i, "")
    .replace(/\[\.{3}(\w+)\]/g, ":$1*")
    .replace(/\[(\w+)\]/g, ":$1");
  p = p.replace(/\/+$/, "") || "/";
  if (!/\/(_|api\/)/.test(p)) addRoute(p, null, "file-route");
}

// --- 4. i18n labels (feature names live here) ----------------------------------
// Collect human-readable VALUES from translation files; these are the product's
// own words for its features. Deduped, capped.
const labels = new Map(); // value -> count
function addLabel(v) {
  if (typeof v !== "string") return;
  const s = v.trim();
  if (!s || s.length < 2 || s.length > 60) return;
  if (/^[\d\W_]+$/.test(s)) return;             // pure punctuation/numbers
  if (/[\\]/.test(s)) return;                    // escaped fragments (Couldn\')
  if (/https?:\/\/|@|\{|\}|<|>|\$\{/.test(s)) return; // urls, code, interpolation
  labels.set(s, (labels.get(s) || 0) + 1);
}
function flattenJson(o, depth = 0) {
  if (depth > 6 || o == null) return;
  if (typeof o === "string") return addLabel(o);
  if (Array.isArray(o)) return o.forEach(v => flattenJson(v, depth + 1));
  if (typeof o === "object") for (const v of Object.values(o)) flattenJson(v, depth + 1);
}
const i18nDir = /(^|\/)(lang|locales?|i18n|translations?|messages)(\/|$)/i;
const i18nFile = /(^|\/)(messages|translation|locale|en|ar|fr|es|de)\.(json|js|ts)$/i;
for (const f of files) {
  if (labels.size > 4000) break;
  const inI18n = i18nDir.test(f.rel) || i18nFile.test(f.rel);
  if (!inI18n) continue;
  const t = read(f.abs); if (!t) continue;
  if (f.ext === ".json") {
    try { flattenJson(JSON.parse(t)); continue; } catch { /* fall through to regex */ }
  }
  // JS/TS/PHP translation arrays: grab quoted string VALUES after => or :
  const re = /(?:=>|:)\s*['"]([^'"]{2,60})['"]/g;
  let m; while ((m = re.exec(t))) addLabel(m[1]);
}
const topLabels = [...labels.entries()].sort((a, b) => b[1] - a[1]).slice(0, 250).map(([v, c]) => ({ label: v, count: c }));

// --- 5. Palette: hex frequency + CSS custom properties -------------------------
const hexCount = new Map();
const cssVars = new Map(); // --name -> hex (first win)
const HEX = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const VAR = /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
function normHex(h) {
  let x = h.toLowerCase();
  if (x.length === 4) x = "#" + [...x.slice(1)].map(c => c + c).join(""); // #abc -> #aabbcc
  return x;
}
for (const f of files) {
  if (!styleExt.has(f.ext) && ![".js", ".ts", ".jsx", ".tsx"].includes(f.ext)) continue;
  const t = read(f.abs); if (!t) continue;
  let m;
  while ((m = HEX.exec(t))) { const h = normHex(m[0]); hexCount.set(h, (hexCount.get(h) || 0) + 1); }
  while ((m = VAR.exec(t))) { if (!cssVars.has(m[1])) cssVars.set(m[1], normHex(m[2])); }
}
// drop pure black/white noise from the ranked list (still available via count)
const paletteRanked = [...hexCount.entries()]
  .filter(([h]) => !["#000000", "#ffffff"].includes(h))
  .sort((a, b) => b[1] - a[1]).slice(0, 40).map(([hex, count]) => ({ hex, count }));
const brandVars = [...cssVars.entries()]
  .filter(([n]) => /(brand|primary|accent|secondary|bg|background|surface|text|fg|foreground|muted)/i.test(n))
  .slice(0, 40).map(([name, hex]) => ({ name, hex }));

// --- 6. Fonts ------------------------------------------------------------------
const fontFamilies = new Map();
const fontFiles = new Set();
const FF = /font-family\s*:\s*([^;}{]+)[;}]/gi;
const FSRC = /url\(['"]?([^'")]+\.(?:woff2?|ttf|otf|eot))['"]?\)/gi;
for (const f of files) {
  if (!styleExt.has(f.ext)) continue;
  const t = read(f.abs); if (!t) continue;
  let m;
  while ((m = FF.exec(t))) {
    const first = m[1].split(",")[0].trim().replace(/['"]/g, "");
    if (first && !/^(inherit|initial|unset|var\()/i.test(first) && first.length < 40)
      fontFamilies.set(first, (fontFamilies.get(first) || 0) + 1);
  }
  while ((m = FSRC.exec(t))) fontFiles.add(m[1].split("/").pop());
}
const topFonts = [...fontFamilies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([family, count]) => ({ family, count }));

// --- 7. Logo + font asset files (shallow public/ + assets pass) ----------------
// public/ was skipped during the code walk; do a bounded asset-only sweep so we
// still surface logos and font files that live there.
const assetHits = { logos: [], fonts: [] };
function assetSweep(dir, rel, budget) {
  if (budget.n <= 0) return;
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (budget.n <= 0) return;
    if (e.name.startsWith(".")) continue;
    const abs = path.join(dir, e.name), r = (rel ? rel + "/" : "") + e.name;
    if (e.isDirectory()) {
      if (["node_modules", "vendor", ".git", "build"].includes(e.name)) continue;
      assetSweep(abs, r, budget);
    } else {
      budget.n--;
      if (/logo|brand|wordmark|icon/i.test(e.name) && /\.(svg|png|jpe?g|webp)$/i.test(e.name))
        assetHits.logos.push(r);
      if (/\.(woff2?|ttf|otf)$/i.test(e.name)) assetHits.fonts.push(r.split("/").pop());
    }
  }
}
for (const d of ["public", "assets", "static", "src/assets", "resources"]) {
  const abs = path.join(root, d);
  if (fs.existsSync(abs)) assetSweep(abs, d, { n: 4000 });
}
assetHits.logos = [...new Set(assetHits.logos)].slice(0, 30);
assetHits.fonts = [...new Set([...fontFiles, ...assetHits.fonts])].slice(0, 40);

// --- 8. Emit -------------------------------------------------------------------
const out = {
  scannedAt: new Date().toISOString(),
  root,
  stack: [...new Set(stack)],
  fileCount,
  truncated: fileCount >= MAX_FILES,
  extCounts,
  identity,
  routes: routes.slice(0, 500),
  labels: topLabels,
  palette: { ranked: paletteRanked, brandVars },
  fonts: { families: topFonts, files: assetHits.fonts },
  logos: assetHits.logos,
};
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
console.log(
  `OK scanned ${fileCount} files${out.truncated ? " (capped)" : ""}\n` +
  `  stack: ${out.stack.join(", ") || "unknown"}\n` +
  `  routes: ${routes.length}  labels: ${topLabels.length}  colors: ${paletteRanked.length}  fonts: ${topFonts.length}  logos: ${assetHits.logos.length}\n` +
  `  -> ${outFile}`
);
