import { createFalClient, ApiError, ValidationError } from "@fal-ai/client";
import { NextResponse } from "next/server";
import { auth, authEnforced } from "@/auth";
import { getClientIp, rateLimitImageGen } from "@/lib/rate-limit";
import {
  assertCanAffordImage,
  IMAGE_COST,
  spendImageMoonsServer,
} from "@/lib/server/wallet";
import { checkSfwPrompt } from "@/lib/media/sfw-gate";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Optional paid fallback when FAL_KEY is set. */
const FAL_DEFAULT_MODEL = "fal-ai/flux/schnell";
const TIMEOUT_MS = 50_000;
const POLLINATIONS_TIMEOUT_MS = 45_000;

const STYLE_SUFFIX: Record<string, string> = {
  ink: "ink wash illustration, cinnabar red accents, Thai literary aesthetic",
  moon: "soft moonlight, cool blue tones, dreamy night atmosphere",
  ember: "warm ember glow, crimson shadows, intimate dramatic lighting",
  jade: "jade green tones, soft shadows, elegant East Asian aesthetic",
  noir: "high-contrast noir, monochrome dramatic lighting, cinematic",
};

type Body = {
  prompt?: string;
  styleId?: string;
  rating?: "safe" | "mature";
};

/**
 * Append style + SFW tone only.
 * Image API `rating` body field is ignored / forced safe — never append mature/NSFW hints.
 */
function buildPrompt(prompt: string, styleId: string) {
  const style = STYLE_SUFFIX[styleId] ?? STYLE_SUFFIX.ink;
  return `${prompt.trim()}. Style: ${style}. Tone: general audience friendly, SFW, no nudity.`;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

/** Build public Pollinations text-to-image URL (no API key). Server-only. */
function buildPollinationsUrl(fullPrompt: string, seed: number) {
  const encoded = encodeURIComponent(fullPrompt);
  const params = new URLSearchParams({
    width: "768",
    height: "1024",
    nologo: "true",
    seed: String(seed),
    // Emmy lock: always force Pollinations SFW safe-mode (never mature/NSFW path).
    safe: "true",
  });
  return `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`;
}

type ProviderOk = { imageUrl: string; seed: number; model: string };
type ProviderFail = {
  reason: string;
  messageTh: string;
  status: number;
  falStatus?: number;
};

function classifyProviderError(err: unknown, source: "pollinations" | "fal"): ProviderFail {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  const falStatus =
    err instanceof ApiError && typeof err.status === "number" ? err.status : undefined;

  if (
    (err instanceof Error && err.name === "TimeoutError") ||
    lower.includes("timeout") ||
    lower.includes("aborted") ||
    falStatus === 504
  ) {
    return {
      reason: "timeout",
      messageTh: "หมดเวลาสร้างภาพ — ลองใหม่",
      status: 504,
      falStatus,
    };
  }

  if (falStatus === 401 || lower.includes("unauthorized")) {
    return {
      reason: "provider_auth",
      messageTh: "คีย์ผู้ให้บริการไม่ถูกต้องหรือหมดอายุ — ติดต่อผู้ดูแลระบบ",
      status: 502,
      falStatus,
    };
  }

  if (falStatus === 403 || lower.includes("forbidden")) {
    return {
      reason: "provider_forbidden",
      messageTh: "ผู้ให้บริการปฏิเสธคำขอ — บัญชีอาจไม่มีสิทธิ์หรือโดเมนถูกจำกัด",
      status: 502,
      falStatus,
    };
  }

  if (err instanceof ValidationError || falStatus === 422) {
    return {
      reason: "bad_input",
      messageTh: "พารามิเตอร์สร้างภาพไม่ถูกต้อง — ลองปรับพรอมต์",
      status: 422,
      falStatus: falStatus ?? 422,
    };
  }

  if (
    lower.includes("nsfw") ||
    lower.includes("safety") ||
    lower.includes("content policy") ||
    lower.includes("blocked") ||
    lower.includes("moderated")
  ) {
    return {
      reason: "safe_mode",
      messageTh: "ถูกบล็อกโดยโหมดปลอดภัยของโมเดล — ลองปรับพรอมต์ (สูงสุดเซ็กซี่ระดับชุดว่ายน้ำ)",
      status: 422,
      falStatus,
    };
  }

  if (
    falStatus === 429 ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("queue full")
  ) {
    return {
      reason: "rate_limited",
      messageTh: "เรียกผู้ให้บริการถี่เกินไป — รอสักครู่แล้วลองใหม่",
      status: 429,
      falStatus,
    };
  }

  return {
    reason: "provider_error",
    messageTh:
      source === "pollinations"
        ? "สร้างภาพไม่สำเร็จ — บริการฟรีผิดพลาด ลองใหม่ภายหลัง"
        : "สร้างภาพไม่สำเร็จ — ผู้ให้บริการผิดพลาด ลองใหม่ภายหลัง",
    status: 502,
    falStatus,
  };
}

/**
 * Free primary: Pollinations text-to-image (no API key).
 * Fetches server-side to confirm image bytes, returns the public HTTPS URL.
 */
async function tryPollinations(
  fullPrompt: string,
  seed: number,
): Promise<ProviderOk> {
  const imageUrl = buildPollinationsUrl(fullPrompt, seed);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POLLINATIONS_TIMEOUT_MS);

  try {
    const res = await fetch(imageUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "image/*,*/*" },
      // Avoid Next/fetch caching a failed/partial response across requests.
      cache: "no-store",
      redirect: "follow",
    });

    const contentType = (res.headers.get("content-type") || "").toLowerCase();

    if (res.status === 429) {
      let detail = "rate_limited";
      try {
        const j = (await res.json()) as { message?: string };
        if (j.message) detail = j.message.slice(0, 160);
      } catch {
        /* ignore */
      }
      const err = new Error(`Too Many Requests: ${detail}`);
      throw err;
    }

    if (!res.ok) {
      let bodySnippet = "";
      try {
        bodySnippet = (await res.text()).slice(0, 200);
      } catch {
        /* ignore */
      }
      const lower = bodySnippet.toLowerCase();
      if (
        lower.includes("nsfw") ||
        lower.includes("safety") ||
        lower.includes("blocked") ||
        lower.includes("moderated") ||
        lower.includes("content policy")
      ) {
        throw new Error(`content policy blocked: ${bodySnippet.slice(0, 80)}`);
      }
      throw new Error(`pollinations HTTP ${res.status}: ${bodySnippet.slice(0, 120)}`);
    }

    if (!contentType.startsWith("image/")) {
      let bodySnippet = "";
      try {
        bodySnippet = (await res.text()).slice(0, 240);
      } catch {
        /* ignore */
      }
      const lower = bodySnippet.toLowerCase();
      if (lower.includes("queue full") || lower.includes("too many")) {
        throw new Error(`Too Many Requests: ${bodySnippet.slice(0, 120)}`);
      }
      if (
        lower.includes("nsfw") ||
        lower.includes("safety") ||
        lower.includes("blocked") ||
        lower.includes("moderated")
      ) {
        throw new Error(`content policy blocked: ${bodySnippet.slice(0, 80)}`);
      }
      throw new Error(
        `pollinations non-image response (${contentType}): ${bodySnippet.slice(0, 120)}`,
      );
    }

    // Consume body to ensure generation completed (and warm CDN cache for the client).
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 256) {
      throw new Error("pollinations returned empty/tiny image");
    }
    // JPEG/PNG/WebP magic — reject HTML/JSON disguised as image.
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isWebp = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
    if (!isJpeg && !isPng && !isWebp) {
      throw new Error("pollinations payload is not a valid image");
    }

    return {
      imageUrl,
      seed,
      model: "pollinations",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Optional secondary: fal.ai when FAL_KEY is present. Key never leaves this module. */
async function tryFal(fullPrompt: string, falKey: string): Promise<ProviderOk> {
  const model = process.env.IMAGE_GEN_MODEL?.trim() || FAL_DEFAULT_MODEL;
  const fal = createFalClient({ credentials: falKey });

  const result = await fal.subscribe(model as "fal-ai/flux/schnell", {
    input: {
      prompt: fullPrompt,
      num_images: 1,
      image_size: "portrait_4_3",
      enable_safety_checker: true,
      output_format: "jpeg",
      num_inference_steps: model.includes("schnell") ? 4 : 28,
    },
    timeout: TIMEOUT_MS,
  });

  const data = result.data as {
    images?: Array<{ url?: string }>;
    seed?: number;
    has_nsfw_concepts?: boolean[];
  };

  if (data.has_nsfw_concepts?.[0]) {
    const err = new Error("nsfw / safety checker blocked");
    throw err;
  }

  const imageUrl = data.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error("empty_images from fal");
  }

  return {
    imageUrl,
    seed: typeof data.seed === "number" ? data.seed : randomSeed(),
    model,
  };
}

function json429(retryAfterSec: number) {
  const headers: Record<string, string> = {
    "Retry-After": String(retryAfterSec),
  };
  return NextResponse.json(
    {
      ok: false,
      reason: "rate_limited",
      messageTh: `สร้างภาพถี่เกินไป — รอ ${retryAfterSec} วินาทีแล้วลองใหม่ (จำกัดต่อ IP)`,
      retryAfterSec,
      // Explicit: rate limit rejection MUST NOT charge moons
      charged: false,
    },
    { status: 429, headers },
  );
}

export async function POST(req: Request) {
  // 0) Parse body first so SFW gate runs before rate-limit / auth / provider / charge.
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        reason: "bad_request",
        messageTh: "คำขอไม่ถูกต้อง",
        charged: false,
      },
      { status: 400 },
    );
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json(
      {
        ok: false,
        reason: "empty_prompt",
        messageTh: "ใส่พรอมต์ก่อนสร้างภาพ",
        charged: false,
      },
      { status: 400 },
    );
  }

  // 1) SFW prompt gate — block nude/porn/explicit BEFORE rate-limit charge / provider.
  const sfw = checkSfwPrompt(prompt);
  if (!sfw.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason: "sfw_blocked",
        messageTh: sfw.messageTh,
        charged: false,
      },
      { status: 422 },
    );
  }

  // 2) Per-IP rate limit BEFORE any provider call or moon mutation.
  const ip = getClientIp(req);
  const rl = await rateLimitImageGen(ip);
  if (!rl.success) {
    return json429(rl.retryAfterSec);
  }

  // 3) When Auth.js is configured, require a session and pre-check server balance.
  //    Moons are deducted only AFTER successful generation (see below).
  const enforceAuth = authEnforced();
  let userId: string | null = null;
  if (enforceAuth) {
    const session = await auth();
    userId = session?.user?.id ?? null;
    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          reason: "unauthorized",
          messageTh: "กรุณาเข้าสู่ระบบก่อนสร้างภาพ",
          charged: false,
        },
        { status: 401 },
      );
    }
    const afford = await assertCanAffordImage(userId);
    if (!afford.ok) {
      return NextResponse.json(
        {
          ok: false,
          reason: "insufficient",
          messageTh: `พระจันทร์ไม่พอ (มี ${afford.balance} ต้องการ ${afford.need}) — รับโบนัสที่กระเป๋า`,
          balance: afford.balance,
          need: afford.need,
          charged: false,
        },
        { status: 402 },
      );
    }
  }

  const styleId = body.styleId ?? "ink";
  // Emmy lock: ignore client `rating` (mature → safe); never mature/NSFW tone hints.
  void body.rating;
  const fullPrompt = buildPrompt(prompt, styleId);
  const seed = randomSeed();

  async function afterSuccess(out: ProviderOk, provider: "pollinations" | "fal") {
    // Deduct moons only after success, only for authenticated users when auth is on.
    if (enforceAuth && userId) {
      const spend = await spendImageMoonsServer(userId, {
        prompt: prompt.slice(0, 80),
        model: out.model,
        provider,
      });
      if (!spend.ok) {
        // Race: balance changed between pre-check and spend. Image already generated —
        // do not charge; still return image but flag insufficient for client sync.
        return NextResponse.json(
          {
            ok: false,
            reason: "insufficient",
            messageTh: `พระจันทร์ไม่พอ (มี ${spend.balance} ต้องการ ${spend.need})`,
            balance: spend.balance,
            need: spend.need,
            charged: false,
          },
          { status: 402 },
        );
      }
      return NextResponse.json({
        ok: true,
        imageUrl: out.imageUrl,
        seed: out.seed,
        model: out.model,
        fromModel: true,
        provider,
        charged: true,
        costMoons: IMAGE_COST,
        balance: spend.balance,
      });
    }

    // Auth not configured: client may deduct locally; server does not charge.
    return NextResponse.json({
      ok: true,
      imageUrl: out.imageUrl,
      seed: out.seed,
      model: out.model,
      fromModel: true,
      provider,
      charged: false,
      costMoons: IMAGE_COST,
    });
  }

  // 4) Always try free Pollinations first (no API key; server-side only).
  try {
    const out = await tryPollinations(fullPrompt, seed);
    return afterSuccess(out, "pollinations");
  } catch (pollErr) {
    const pollClassified = classifyProviderError(pollErr, "pollinations");
    const pollMsg = pollErr instanceof Error ? pollErr.message : String(pollErr);
    console.error(
      "[api/images/generate] pollinations",
      pollClassified.reason,
      pollMsg.slice(0, 200),
    );

    // 5) Optional fal fallback only when key is present (never log the key).
    const falKey = process.env.FAL_KEY?.trim();
    if (falKey) {
      try {
        const out = await tryFal(fullPrompt, falKey);
        return afterSuccess(out, "fal");
      } catch (falErr) {
        const falClassified = classifyProviderError(falErr, "fal");
        const falMsg = falErr instanceof Error ? falErr.message : String(falErr);
        console.error(
          "[api/images/generate] fal",
          falClassified.reason,
          falClassified.falStatus ?? "",
          falMsg.slice(0, 200),
        );
        return NextResponse.json(
          {
            ok: false,
            reason: falClassified.reason,
            messageTh: falClassified.messageTh,
            charged: false,
            ...(falClassified.falStatus ? { falStatus: falClassified.falStatus } : {}),
          },
          { status: falClassified.status },
        );
      }
    }

    return NextResponse.json(
      {
        ok: false,
        reason: pollClassified.reason,
        messageTh: pollClassified.messageTh,
        charged: false,
      },
      { status: pollClassified.status },
    );
  }
}
