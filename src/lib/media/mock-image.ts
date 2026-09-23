/** Deterministic mock / cover art (SVG data URLs). KATHA Portrait Cards style lock.
 * Silhouette/illustrated placeholders — not photos, not claimed AI art.
 */

export const STYLE_PRESETS = [
  { id: "ink", labelTh: "หมึกชาด", tint: ["#1b1612", "#b42318", "#e8c9a8"] },
  { id: "moon", labelTh: "แสงจันทร์", tint: ["#0f1420", "#6b7cff", "#d4dff7"] },
  { id: "ember", labelTh: "เถ้าแดง", tint: ["#1a0c0a", "#c45c2a", "#f0c9a0"] },
  { id: "jade", labelTh: "หยกเงา", tint: ["#0c1612", "#2a8f6e", "#b8e0d0"] },
  { id: "noir", labelTh: "นัวร์", tint: ["#0a0a0a", "#555555", "#eeeeee"] },
] as const;

export type StylePresetId = (typeof STYLE_PRESETS)[number]["id"];

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickStyle(styleId?: string) {
  return STYLE_PRESETS.find((s) => s.id === styleId) ?? STYLE_PRESETS[0];
}

function styleFromSeed(seed: number) {
  return STYLE_PRESETS[seed % STYLE_PRESETS.length];
}

function monogram(title: string): string {
  const cleaned = title.replace(/\s+/g, " ").trim();
  if (!cleaned) return "ก";
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.slice(0, 2);
  }
  return cleaned.slice(0, 2);
}

/** Bust / head / shoulder silhouette variants in a 320×400 portrait frame (viewBox). */
const SILHOUETTE_PATHS = [
  // 0 — classic centered bust, soft shoulders
  "M160 72 C132 72 112 98 112 128 C112 158 132 182 160 182 C188 182 208 158 208 128 C208 98 188 72 160 72 Z M96 388 C96 286 118 236 160 236 C202 236 224 286 224 388 Z",
  // 1 — three-quarter turn, hair sweep left
  "M172 68 C148 64 118 92 116 126 C114 158 136 186 166 188 C192 190 214 168 218 140 C222 112 206 84 182 74 C178 92 168 104 152 108 C148 88 156 72 172 68 Z M88 392 C92 292 120 242 168 240 C214 238 236 290 242 392 Z",
  // 2 — upright profile-ish, narrow shoulders
  "M168 70 C142 68 124 96 126 128 C128 160 148 184 172 182 C196 180 214 154 212 122 C210 92 192 72 168 70 Z M118 390 C122 300 138 250 170 248 C202 246 220 298 226 390 Z",
  // 3 — wider shoulders, chin-down presence
  "M160 78 C128 78 106 106 106 138 C106 170 128 196 160 196 C192 196 214 170 214 138 C214 106 192 78 160 78 Z M72 394 C78 278 108 228 160 226 C212 224 244 276 248 394 Z",
  // 4 — long hair cascade right
  "M154 66 C126 70 108 100 110 132 C112 162 132 186 158 188 C178 190 196 174 202 154 C210 168 228 176 242 168 C248 148 236 120 214 108 C208 88 188 66 154 66 Z M94 392 C98 290 122 238 160 236 C204 234 230 288 236 392 Z",
  // 5 — hooded / cloaked silhouette
  "M160 58 C118 62 96 100 98 140 C100 176 124 198 160 200 C196 198 220 176 222 140 C224 100 202 62 160 58 Z M160 58 C130 78 118 110 120 140 M100 392 C104 300 128 250 160 248 C192 250 216 300 220 392 Z M86 250 C100 230 120 220 140 218 L140 392 L86 392 Z M234 250 C220 230 200 220 180 218 L180 392 L234 392 Z",
  // 6 — slight lean left, asymmetric hair
  "M148 70 C122 76 108 108 112 140 C116 172 140 192 168 188 C194 184 212 158 208 126 C204 96 180 68 148 70 C140 96 128 112 118 118 Z M100 390 C106 288 130 238 166 236 C210 234 234 286 238 390 Z",
  // 7 — high collar / formal bust
  "M160 74 C134 74 116 100 116 130 C116 160 134 184 160 184 C186 184 204 160 204 130 C204 100 186 74 160 74 Z M108 250 C118 220 136 206 160 204 C184 206 202 220 212 250 L230 392 L90 392 Z",
] as const;

function silhouettePath(seed: number): string {
  return SILHOUETTE_PATHS[seed % SILHOUETTE_PATHS.length];
}

function darkenHex(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lightenHex(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(n.slice(0, 2), 16) + (255 - parseInt(n.slice(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(n.slice(2, 4), 16) + (255 - parseInt(n.slice(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(n.slice(4, 6), 16) + (255 - parseInt(n.slice(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Shared portrait-card SVG: silhouette + theme gradient + bottom overlay. */
function renderPortraitCard(opts: {
  seed: number;
  style: (typeof STYLE_PRESETS)[number];
  label: string;
  caption?: string;
  width: number;
  height: number;
  /** Portrait art frame inside viewBox; cover may be landscape with centered crop. */
  artW?: number;
  artH?: number;
}): string {
  const { seed, style, width, height } = opts;
  const [bg, accent, ink] = style.tint;
  const glow = lightenHex(accent, 0.35);
  const silhouetteFill = darkenHex(bg, 0.35);
  const silhouetteStroke = darkenHex(accent, 0.15);
  const path = silhouettePath(seed);
  const mono = escapeXml(monogram(opts.label));
  const name = escapeXml(truncate(opts.label, 22));
  const caption = escapeXml(truncate(opts.caption ?? style.labelTh, 36));
  const uid = `p${seed.toString(36)}`;

  // Map silhouette (designed for 320×400) into the card; center horizontally.
  const artW = opts.artW ?? 320;
  const artH = opts.artH ?? 400;
  const scale = Math.min(width / artW, height / artH);
  const ox = (width - artW * scale) / 2;
  const oy = (height - artH * scale) / 2 - height * 0.02;
  const glowCx = width * (0.42 + ((seed >>> 3) % 20) / 100);
  const glowCy = height * (0.32 + ((seed >>> 9) % 16) / 100);
  const glowR = Math.round(Math.min(width, height) * (0.38 + ((seed >>> 12) % 12) / 100));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="${darkenHex(bg, 0.2)}"/>
    </linearGradient>
    <radialGradient id="glow-${uid}" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="${glow}" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="${accent}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shade-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="45%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="78%" stop-color="rgba(0,0,0,0.35)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.78)"/>
    </linearGradient>
    <linearGradient id="sil-${uid}" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${silhouetteFill}" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="${silhouetteStroke}" stop-opacity="0.98"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg-${uid})"/>
  <circle cx="${glowCx.toFixed(1)}" cy="${glowCy.toFixed(1)}" r="${glowR}" fill="url(#glow-${uid})"/>
  <g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${scale.toFixed(4)})">
    <path d="${path}" fill="url(#sil-${uid})" opacity="0.95"/>
    <path d="${path}" fill="none" stroke="${ink}" stroke-opacity="0.12" stroke-width="3"/>
  </g>
  <rect width="100%" height="100%" fill="url(#shade-${uid})"/>
  <rect x="0" y="${height - Math.round(height * 0.22)}" width="${width}" height="${Math.round(height * 0.22)}" fill="rgba(0,0,0,0.28)"/>
  <circle cx="${Math.round(width * 0.12)}" cy="${height - Math.round(height * 0.11)}" r="${Math.max(18, Math.round(Math.min(width, height) * 0.055))}" fill="rgba(0,0,0,0.45)" stroke="${ink}" stroke-opacity="0.35"/>
  <text x="${Math.round(width * 0.12)}" y="${height - Math.round(height * 0.11) + Math.round(Math.min(width, height) * 0.022)}" text-anchor="middle" fill="${ink}" font-family="Noto Sans Thai, sans-serif" font-size="${Math.max(14, Math.round(Math.min(width, height) * 0.045))}" font-weight="700">${mono}</text>
  <text x="${Math.round(width * 0.22)}" y="${height - Math.round(height * 0.13)}" fill="${ink}" font-family="Noto Sans Thai, sans-serif" font-size="${Math.max(13, Math.round(Math.min(width, height) * 0.04))}" font-weight="600">${name}</text>
  <text x="${Math.round(width * 0.22)}" y="${height - Math.round(height * 0.065)}" fill="${accent}" font-family="Noto Sans Thai, sans-serif" font-size="${Math.max(10, Math.round(Math.min(width, height) * 0.028))}">${caption}</text>
  <text x="${width - 16}" y="${height - 12}" text-anchor="end" fill="${ink}" opacity="0.45" font-family="Noto Sans Thai, sans-serif" font-size="11">ตัวอย่าง · placeholder</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Catalog cover: portrait-card silhouette, landscape-friendly crop for h-36 cards. */
export function renderCoverPortrait(opts: {
  id: string;
  title: string;
  subtitle?: string;
  rating?: "safe" | "mature";
  tags?: string[];
  width?: number;
  height?: number;
}): string {
  const width = opts.width ?? 640;
  const height = opts.height ?? 400;
  const seed = hashString(`${opts.id}|${opts.title}|${opts.rating ?? "safe"}`);
  const style = styleFromSeed(seed);
  const rating = opts.rating === "mature" ? "ผู้ใหญ่" : "ทั่วไป";
  const tagHint = (opts.tags ?? []).slice(0, 2).join(" · ") || style.labelTh;
  const caption = `${rating} · ${tagHint}`;

  return renderPortraitCard({
    seed,
    style,
    label: opts.title,
    caption,
    width,
    height,
  });
}

/** Gallery / studio mock: portrait tile (~3:4) with silhouette + caption. */
export function renderMockImage(opts: {
  prompt: string;
  styleId?: string;
  seed?: number;
  rating?: "safe" | "mature";
  width?: number;
  height?: number;
}): string {
  const width = opts.width ?? 480;
  const height = opts.height ?? 640;
  const style = pickStyle(opts.styleId);
  const seed =
    opts.seed ?? hashString(`${opts.prompt}|${style.id}|${opts.rating ?? "safe"}`);
  const label = opts.prompt.trim() || "ภาพตัวอย่าง";
  const rating = opts.rating === "mature" ? "ผู้ใหญ่" : "ทั่วไป";
  const caption = `${style.labelTh} · ${rating}`;

  return renderPortraitCard({
    seed,
    style,
    label,
    caption,
    width,
    height,
  });
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
