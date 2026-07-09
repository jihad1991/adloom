// Adloom — embed local font files as base64 @font-face, so composited HTML renders
// pixel-identical every time with NO network dependency (web-font fetches can flake
// during headless render and silently swap the typeface). Prefer this over @import.
//
//   import { fontFaces } from "./fontface.mjs";
//   const css = fontFaces("My Brand Arabic", "./fonts", [
//     ["MyBrand-Regular.ttf", 400], ["MyBrand-Medium.ttf", 500],
//     ["MyBrand-SemiBold.ttf", 600], ["MyBrand-Bold.ttf", 700],
//   ]);
//   // then inject `${css}` at the top of your <style>.
import fs from "node:fs";
import path from "node:path";

export function fontFaces(family, dir, weights) {
  return weights.map(([file, weight]) => {
    const b64 = fs.readFileSync(path.join(dir, file)).toString("base64");
    const ext = path.extname(file).slice(1).toLowerCase();
    const fmt = ext === "ttf" ? "truetype" : ext === "otf" ? "opentype" : ext === "woff2" ? "woff2" : "woff";
    return `@font-face{font-family:${JSON.stringify(family)};font-style:normal;font-weight:${weight};` +
           `font-display:block;src:url(data:font/${ext};base64,${b64}) format(${JSON.stringify(fmt)})}`;
  }).join("\n");
}
