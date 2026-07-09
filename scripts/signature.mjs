// Adloom — Brand Signature strip: the locked footer lockup every post ends with.
// One fixed placement for logo + tagline + domain = a week of posts reads as one brand.
// Config-driven; see config.example.json ("brand", "logo", "palette").
//
//   import { signatureCSS, signatureHTML } from "./signature.mjs";
//   // inject signatureCSS(cfg) in <style>; place signatureHTML(cfg, "dark") as the
//   // LAST child of a full-height flex column with justify-content:space-between.
//
// Locked spec: full-width pill inside the artboard margins, anchored to the bottom.
// Logo on the reading-start side, tagline + domain on the other. "dark" over dark
// plates, "light" over bright ones. The logo appears ONCE per artwork — here.

export function signatureCSS(cfg) {
  const p = cfg.palette;
  return `
.asig{width:100%;display:flex;align-items:center;justify-content:space-between;
  border-radius:999px;padding:18px 38px}
.asig.dark{background:${hexA(p.bgDeep ?? p.bg, .78)};border:1px solid ${hexA(p.accent, .35)}}
.asig.light{background:${hexA(p.light ?? "#ffffff", .88)};border:1px solid ${hexA(p.bg, .18)}}
.asig img{height:44px;width:auto;display:block}
.asig .atx{font-size:24px;font-weight:400}
.asig.dark .atx{color:${p.light ?? "#fff"}}
.asig.light .atx{color:${p.bg}}
.asig .atx b{font-weight:700}
.asig.dark .atx b{color:${p.accent}}
.asig.light .atx b{color:${p.accentDeep ?? p.accent}}`;
}

export function signatureHTML(cfg, variant = "dark") {
  const logo = variant === "light" ? (cfg.logo?.dark ?? cfg.logo?.light) : (cfg.logo?.light ?? cfg.logo?.dark);
  const tagline = cfg.brand?.promise ?? "";
  const domain = cfg.brand?.domain ?? "";
  return `<div class="asig ${variant}">
    <img src="${logo}" alt="${cfg.brand?.name ?? ""}">
    <span class="atx">${tagline}${domain ? ` · <b>${domain}</b>` : ""}</span>
  </div>`;
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
