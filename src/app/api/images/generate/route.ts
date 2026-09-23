import { createFalClient, ApiError, ValidationError } from "@fal-ai/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Known-good, fast text-to-image endpoint (valid presets + jpeg). */
const DEFAULT_MODEL = "fal-ai/flux/schnell";
const TIMEOUT_MS = 50_000;

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

function thaiNoProvider() {
  return "ยังไม่ได้ตั้งค่าผู้ให้บริการสร้างภาพ (FAL_KEY) — ติดต่อผู้ดูแลระบบ";
}

/** Append style + rating hint; never strip sexual terms from the user prompt. */
function buildPrompt(prompt: string, styleId: string, rating: "safe" | "mature") {
  const style = STYLE_SUFFIX[styleId] ?? STYLE_SUFFIX.ink;
  const ratingHint =
    rating === "mature"
      ? "mature adult content allowed, sensual artistic portrayal"
      : "general audience friendly";
  return `${prompt.trim()}. Style: ${style}. Tone: ${ratingHint}.`;
}

/** Safe, non-secret debug code for clients / ops (never include key material). */
function classifyProviderError(err: unknown): {
  reason: string;
  messageTh: string;
  status: number;
  falStatus?: number;
} {
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
    lower.includes("blocked")
  ) {
    return {
      reason: "safe_mode",
      messageTh: "ถูกบล็อกโดยโหมดปลอดภัยของโมเดล — ลองปรับพรอมต์หรือเรตติ้ง",
      status: 422,
      falStatus,
    };
  }

  if (falStatus === 429 || lower.includes("rate limit")) {
    return {
      reason: "rate_limited",
      messageTh: "เรียกผู้ให้บริการถี่เกินไป — รอสักครู่แล้วลองใหม่",
      status: 429,
      falStatus,
    };
  }

  return {
    reason: "provider_error",
    messageTh: "สร้างภาพไม่สำเร็จ — ผู้ให้บริการผิดพลาด ลองใหม่ภายหลัง",
    status: 502,
    falStatus,
  };
}

export async function POST(req: Request) {
  const falKey = process.env.FAL_KEY?.trim();
  if (!falKey) {
    return NextResponse.json(
      {
        ok: false,
        reason: "no_provider",
        messageTh: thaiNoProvider(),
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        reason: "bad_request",
        messageTh: "คำขอไม่ถูกต้อง",
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
      },
      { status: 400 },
    );
  }

  const styleId = body.styleId ?? "ink";
  const rating = body.rating === "mature" ? "mature" : "safe";
  const model = process.env.IMAGE_GEN_MODEL?.trim() || DEFAULT_MODEL;
  const fullPrompt = buildPrompt(prompt, styleId, rating);

  // Per-request client — avoids mutating the process-wide singleton credentials.
  const fal = createFalClient({ credentials: falKey });

  try {
    const result = await fal.subscribe(model as "fal-ai/flux/schnell", {
      // Valid Flux input fields (see fal-ai/flux/schnell + flux/dev schemas).
      // Never disable safety_checker: accounts without that privilege get HTTP 403 Forbidden.
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
      return NextResponse.json(
        {
          ok: false,
          reason: "safe_mode",
          messageTh: "ถูกบล็อกโดยโหมดปลอดภัยของโมเดล — ลองปรับพรอมต์หรือเรตติ้ง",
        },
        { status: 422 },
      );
    }

    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json(
        {
          ok: false,
          reason: "provider_error",
          messageTh: "สร้างภาพไม่สำเร็จ — ไม่ได้รับรูปจากโมเดล",
          detail: "empty_images",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      imageUrl,
      seed: typeof data.seed === "number" ? data.seed : undefined,
      model,
      fromModel: true,
    });
  } catch (err) {
    const classified = classifyProviderError(err);
    const message = err instanceof Error ? err.message : String(err);
    // Log message only — never credentials / FAL_KEY.
    console.error(
      "[api/images/generate]",
      classified.reason,
      classified.falStatus ?? "",
      message.slice(0, 200),
    );
    return NextResponse.json(
      {
        ok: false,
        reason: classified.reason,
        messageTh: classified.messageTh,
        ...(classified.falStatus ? { falStatus: classified.falStatus } : {}),
      },
      { status: classified.status },
    );
  }
}
