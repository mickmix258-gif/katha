/** Deterministic mock image generator (SVG data URLs). No external GPU API. */

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
  const title = escapeXml(truncate(opts.prompt.trim() || "ภาพม็อก", 42));
  const styleLabel = escapeXml(style.labelTh);
  const rating = opts.rating === "mature" ? "ผู้ใหญ่" : "ทั่วไป";
  const bars = Array.from({ length: 6 }, (_, i) => {
    const x = 40 + i * 95;
    const h = 40 + ((seed >>> (i * 3)) % 220);
    const y = height - 80 - h;
    const op = (0.15 + ((seed >>> (i + 2)) % 40) / 100).toFixed(2);
    return `<rect x="${x}" y="${y}" width="70" height="${h}" rx="12" fill="${accent}" opacity="${op}"/>`;
  }).join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${accent}" opacity="0.35"/>
  <circle cx="${(cx + 180) % width}" cy="${(cy + 120) % height}" r="${r * 0.55}" fill="${ink}" opacity="0.2"/>
  ${bars}
  <rect x="24" y="24" width="${width - 48}" height="88" rx="16" fill="rgba(0,0,0,0.45)"/>
  <text x="44" y="58" fill="${ink}" font-family="Noto Sans Thai, sans-serif" font-size="18">${title}</text>
  <text x="44" y="86" fill="${accent}" font-family="Noto Sans Thai, sans-serif" font-size="13">${styleLabel} · ${rating} · #${seed.toString(16).slice(0, 6)}</text>
  <text x="44" y="${height - 36}" fill="${ink}" opacity="0.7" font-family="Noto Sans Thai, sans-serif" font-size="12">KATHA mock image · ไม่ใช่ภาพจริงจากโมเดล</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
