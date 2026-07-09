// Adloom — Gemini image-to-image: reframe/extend a reference image to a new aspect ratio
// while keeping the SAME subject/scene. This is how you get one master image consistent
// across 1:1 / 4:5 / 9:16. API key from env GKEY.
// Usage: GKEY=... node gen_edit.mjs <refFile> <outFile> <aspect> "<prompt>"
import fs from "node:fs";
const KEY = process.env.GKEY;
if (!KEY) { console.error("NO_KEY: set env GKEY"); process.exit(2); }
const model  = "gemini-3-pro-image-preview";
const refFile = process.argv[2];
const outFile = process.argv[3];
const aspect  = process.argv[4];
const prompt  = process.argv[5];
if (!refFile || !outFile || !aspect || !prompt) { console.error("usage: node gen_edit.mjs <ref> <out> <aspect> \"<prompt>\""); process.exit(2); }
const H = { "x-goog-api-key": KEY, "Content-Type": "application/json" };
const mimeOf = b => (b[0] === 0x89 && b[1] === 0x50) ? "image/png" : (b[0] === 0xff && b[1] === 0xd8) ? "image/jpeg" : "image/png";
const buf = fs.readFileSync(refFile);
const body = {
  contents: [{ parts: [
    { inlineData: { mimeType: mimeOf(buf), data: buf.toString("base64") } },
    { text: prompt },
  ]}],
  generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect } },
};
const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: "POST", headers: H, body: JSON.stringify(body) });
const t = await r.text();
if (r.status !== 200) { console.error("FAIL", r.status, (t || "").replaceAll(KEY, "***").slice(0, 500)); process.exit(1); }
const im = (JSON.parse(t)?.candidates?.[0]?.content?.parts || []).find(p => p.inlineData?.data);
if (!im) { console.error("NOIMG"); process.exit(1); }
fs.writeFileSync(outFile, Buffer.from(im.inlineData.data, "base64"));
console.log("OK", outFile, fs.statSync(outFile).size);
