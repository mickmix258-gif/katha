/**
 * Emmy-locked SFW gate for image generation.
 * Max allowed = swimsuit / bikini / form-fitting sexy clothing.
 * Nude / porn / explicit = instant block (no provider call, no moon charge).
 *
 * Keep lists lowercase; matching uses normalized text (see normalizeForGate).
 */

/** English keywords / phrases that must fail the gate. */
export const SFW_BLOCK_EN: readonly string[] = [
  "nude",
  "naked",
  "nsfw",
  "porn",
  "porno",
  "xxx",
  "hentai",
  "explicit sex",
  "sexual intercourse",
  "make love nude",
  "fully nude",
  "completely naked",
  "bare breasts",
  "bare nipples",
  "nipples visible",
  "visible nipples",
  "no clothes",
  "without clothes",
  "clothes off",
  "undressed",
  "topless",
  "bottomless",
  "genitals",
  "genital",
  "vagina",
  "penis",
  "cock",
  "pussy",
  "anus",
  "anal",
  "oral sex",
  "blowjob",
  "handjob",
  "cumshot",
  "ejaculation",
  "masturbat",
  "orgasm",
  "deepthroat",
  "creampie",
  "gangbang",
  "threesome sex",
  "sex scene",
  "having sex",
  "have sex",
  "nude body",
  "naked body",
  "nude art",
  "erotic nude",
  "uncensored nude",
  "without underwear only",
  "only lingerie removed",
  "spread legs nude",
];

/** Thai keywords / phrases that must fail the gate. */
export const SFW_BLOCK_TH: readonly string[] = [
  "เปลือย",
  "โป๊",
  "หุ่นเปลือย",
  "ภาพโป๊",
  "โป๊เปลือย",
  "ถอดเสื้อ",
  "ถอดกางเกง",
  "ถอดหมด",
  "ไม่ใส่เสื้อ",
  "ไม่นุ่ง",
  "นมเปลือย",
  "หัวนม",
  "เห็นหัวนม",
  "อวัยวะเพศ",
  "หี",
  "ควย",
  "เย็ด",
  "มีเซ็กส์",
  "มีเซคส์",
  "เซ็กส์ชัด",
  "เอากัน",
  "สำเร็จความใคร่",
  "ช่วยตัวเอง",
  "หลั่ง",
  "หนังโป๊",
  "18+ โป๊",
  "นู้ด",
  "นูด",
  "nude",
];

const BLOCK_PHRASES: readonly string[] = [...SFW_BLOCK_EN, ...SFW_BLOCK_TH];

/** Thai message shown when the prompt is blocked. */
export const SFW_BLOCK_MESSAGE_TH =
  "ไม่อนุญาตภาพเปลือยหรือโป๊ — ขอบเขตสูงสุดคือเซ็กซี่ระดับชุดว่ายน้ำ";

export type SfwGateResult =
  | { ok: true }
  | { ok: false; reason: "sfw_blocked"; messageTh: string; matched?: string };

/** Normalize for matching: lowercase, collapse whitespace, strip zero-width. */
export function normalizeForGate(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns ok:false when the prompt clearly requests nude/porn/explicit content.
 * Bikini / swimsuit / sexy clothing prompts are allowed (not in the block list).
 */
export function checkSfwPrompt(prompt: string): SfwGateResult {
  const normalized = normalizeForGate(prompt);
  if (!normalized) return { ok: true };

  for (const phrase of BLOCK_PHRASES) {
    const p = phrase.toLowerCase();
    if (!p) continue;
    if (normalized.includes(p)) {
      return {
        ok: false,
        reason: "sfw_blocked",
        messageTh: SFW_BLOCK_MESSAGE_TH,
        matched: phrase,
      };
    }
  }

  return { ok: true };
}
