// Adloom — Gemini text-to-image plate generator (REST).
// API key from env GKEY (never logged; sanitized out of error output).
// Usage: GKEY=... node gen.mjs <model> <outFile> <aspect> "<prompt>"
//   model  e.g. gemini-3-pro-image-preview   aspect e.g. 1:1 | 4:5 | 9:16
const KEY = process.env.GKEY;
if (!KEY) { console.error("NO_KEY: set env GKEY to your Google AI Studio key"); process.exit(2); }

const model   = process.argv[2] || "gemini-3-pro-image-preview";
const outfile = process.argv[3];
const aspect  = process.argv[4] || "1:1";
const prompt  = process.argv[5];
if (!outfile || !prompt) { console.error("usage: node gen.mjs <model> <outFile> <aspect> \"<prompt>\""); process.exit(2); }

const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function buildBody(withImageCfg) {
  const gc = { responseModalities: ["IMAGE"] };
  if (withImageCfg) gc.imageConfig = { aspectRatio: aspect };
  return JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: gc });
}
async function attempt(auth, withImageCfg) {
  const headers = { "Content-Type": "application/json" };
  if (auth === "bearer") headers["Authorization"] = "Bearer " + KEY;
  else headers["x-goog-api-key"] = KEY;
  const r = await fetch(base, { method: "POST", headers, body: buildBody(withImageCfg) });
  return { status: r.status, txt: await r.text() };
}
const sanitize = s => (s || "").replaceAll(KEY, "***");

(async () => {
  const authModes = KEY.startsWith("AIza") ? ["key", "bearer"] : ["bearer", "key"];
  let last = null;
  for (const auth of authModes) {
    for (const withCfg of [true, false]) {
      const res = await attempt(auth, withCfg);
      last = res;
      if (res.status === 200) {
        let j; try { j = JSON.parse(res.txt); } catch { console.error("BADJSON", sanitize(res.txt).slice(0, 400)); process.exit(3); }
        const img = (j?.candidates?.[0]?.content?.parts || []).find(p => p.inlineData?.data);
        if (!img) { console.error("NOIMG", JSON.stringify(j).slice(0, 400)); process.exit(4); }
        const buf = Buffer.from(img.inlineData.data, "base64");
        (await import("node:fs")).writeFileSync(outfile, buf);
        console.log(`OK auth=${auth} cfg=${withCfg} bytes=${buf.length} -> ${outfile}`);
        process.exit(0);
      }
      if (!/imageConfig|aspectRatio|Unknown name/i.test(res.txt)) break;
    }
  }
  console.error(`FAIL status=${last?.status} body=${sanitize(last?.txt).slice(0, 500)}`);
  process.exit(1);
})();
