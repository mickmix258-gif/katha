/** Deterministic mock / cover art (SVG data URLs). No external GPU API. */

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

/** Rich catalog cover: distinct per id/title, finished display look. */
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
  const [bg, accent, ink] = style.tint;
  const mono = escapeXml(monogram(opts.title));
  const title = escapeXml(truncate(opts.title, 28));
  const rating = opts.rating === "mature" ? "ผู้ใหญ่" : "ทั่วไป";
  const tagHint = escapeXml(truncate((opts.tags ?? []).slice(0, 2).join(" · ") || style.labelTh, 36));
  const cx = 120 + (seed % 360);
  const cy = 80 + ((seed >>> 7) % 180);
  const r = 70 + ((seed >>> 14) % 90);
  const glowX = (cx + 220) % width;
  const glowY = (cy + 90) % height;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="55%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
    <radialGradient id="orb" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="${ink}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="40%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.72)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#orb)"/>
  <circle cx="${glowX}" cy="${glowY}" r="${Math.round(r * 0.65)}" fill="${accent}" opacity="0.28"/>
  <path d="M0 ${height * 0.55} C ${width * 0.25} ${height * 0.4}, ${width * 0.55} ${height * 0.75}, ${width} ${height * 0.5} L ${width} ${height} L 0 ${height} Z" fill="${accent}" opacity="0.18"/>
  <rect width="100%" height="100%" fill="url(#shade)"/>
  <circle cx="${width - 96}" cy="96" r="54" fill="rgba(0,0,0,0.35)" stroke="${ink}" stroke-opacity="0.35"/>
  <text x="${width - 96}" y="108" text-anchor="middle" fill="${ink}" font-family="Noto Sans Thai, sans-serif" font-size="34" font-weight="700">${mono}</text>
  <text x="28" y="${height - 58}" fill="${ink}" font-family="Noto Sans Thai, sans-serif" font-size="26" font-weight="600">${title}</text>
  <text x="28" y="${height - 28}" fill="${accent}" font-family="Noto Sans Thai, sans-serif" font-size="14">${rating} · ${tagHint}</text>
  <text x="${width - 28}" y="${height - 20}" text-anchor="end" fill="${ink}" opacity="0.45" font-family="Noto Sans Thai, sans-serif" font-size="11">ตัวอย่างภาพ · placeholder</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function renderMockImage(opts: {
  prompt: string;
  styleId?: string;
  seed?: number;
  rating?: "safe" | "mature";
  width?: number;
  height?: number;
}): string {
  const width = opts.width ?? 640;
  const height = opts.height ?? 800;
  const style = pickStyle(opts.styleId);
  const seed =
    opts.seed ?? hashString(`${opts.prompt}|${style.id}|${opts.rating ?? "safe"}`);
  const [bg, accent, ink] = style.tint;
  const cx = 80 + (seed % 480);
  const cy = 100 + ((seed >>> 8) % 560);
  const r = 60 + ((seed >>> 16) % 140);
  const title = escapeXml(truncate(opts.prompt.trim() || "ภาพตัวอย่าง", 42));
  const styleLabel = escapeXml(style.labelTh);
  const rating = opts.rating === "mature" ? "ผู้ใหญ่" : "ทั่วไป";
  const mono = escapeXml(monogram(opts.prompt.trim() || "กถา"));
  const ribbons = Array.from({ length: 5 }, (_, i) => {
    const x = 36 + i * 115;
    const h = 80 + ((seed >>> (i * 3)) % 260);
    const y = height - 120 - h;
    const op = (0.18 + ((seed >>> (i + 2)) % 35) / 100).toFixed(2);
    return `<rect x="${x}" y="${y}" width="88" height="${h}" rx="18" fill="${accent}" opacity="${op}"/>`;
  }).join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.6"/>
    </linearGradient>
    <radialGradient id="halo" cx="40%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${ink}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="50%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.7)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#halo)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${accent}" opacity="0.32"/>
  <circle cx="${(cx + 180) % width}" cy="${(cy + 120) % height}" r="${r * 0.55}" fill="${ink}" opacity="0.22"/>
  ${ribbons}
  <rect width="100%" height="100%" fill="url(#fade)"/>
  <circle cx="${width / 2}" cy="${height * 0.38}" r="92" fill="rgba(0,0,0,0.28)" stroke="${ink}" stroke-opacity="0.35"/>
  <text x="${width / 2}" y="${height * 0.38 + 18}" text-anchor="middle" fill="${ink}" font-family="Noto Sans Thai, sans-serif" font-size="52" font-weight="700">${mono}</text>
  <rect x="24" y="24" width="${width - 48}" height="78" rx="16" fill="rgba(0,0,0,0.4)"/>
  <text x="44" y="54" fill="${ink}" font-family="Noto Sans Thai, sans-serif" font-size="18">${title}</text>
  <text x="44" y="80" fill="${accent}" font-family="Noto Sans Thai, sans-serif" font-size="13">${styleLabel} · ${rating}</text>
  <text x="44" y="${height - 28}" fill="${ink}" opacity="0.5" font-family="Noto Sans Thai, sans-serif" font-size="12">ตัวอย่างภาพ · placeholder</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
