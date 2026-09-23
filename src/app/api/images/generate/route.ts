import { fal } from "@fal-ai/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_MODEL = "fal-ai/flux/dev";
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

  fal.config({ credentials: falKey });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
  }, TIMEOUT_MS);

  try {
    const subscribePromise = fal.subscribe(model as "fal-ai/flux/dev", {
      input: {
        prompt: fullPrompt,
        num_images: 1,
        image_size: "portrait_4_3",
        enable_safety_checker: rating === "safe",
        output_format: "jpeg",
      },
    });

    const result = await Promise.race([
      subscribePromise,
      new Promise<never>((_, reject) => {
        const check = setInterval(() => {
          if (timedOut) {
            clearInterval(check);
            reject(Object.assign(new Error("timeout"), { name: "TimeoutError" }));
          }
        }, 250);
      }),
    ]);

    const data = result.data as {
      images?: Array<{ url?: string }>;
      seed?: number;
    };
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json(
        {
          ok: false,
          reason: "provider_error",
          messageTh: "สร้างภาพไม่สำเร็จ — ไม่ได้รับรูปจากโมเดล",
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
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();

    if (name === "TimeoutError" || lower.includes("timeout") || lower.includes("aborted")) {
      return NextResponse.json(
        {
          ok: false,
          reason: "timeout",
          messageTh: "หมดเวลาสร้างภาพ — ลองใหม่",
        },
        { status: 504 },
      );
    }

    if (
      lower.includes("nsfw") ||
      lower.includes("safety") ||
      lower.includes("content policy") ||
      lower.includes("blocked")
    ) {
      return NextResponse.json(
        {
          ok: false,
          reason: "safe_mode",
          messageTh: "ถูกบล็อกโดยโหมดปลอดภัยของโมเดล — ลองปรับพรอมต์หรือเรตติ้ง",
        },
        { status: 422 },
      );
    }

    console.error("[api/images/generate]", message);
    return NextResponse.json(
      {
        ok: false,
        reason: "provider_error",
        messageTh: "สร้างภาพไม่สำเร็จ — ผู้ให้บริการผิดพลาด ลองใหม่ภายหลัง",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}
