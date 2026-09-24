import {
  IMAGE_GEN_RATE_LIMIT_PER_HOUR,
  IMAGE_GEN_RATE_LIMIT_PER_MINUTE,
} from "@/lib/wallet-constants";

export type RateLimitResult = {
  success: boolean;
  /** Seconds until the client should retry (Retry-After). */
  retryAfterSec: number;
  limit: number;
  remaining: number;
  backend: "upstash" | "memory";
};

type MemoryBucket = { timestamps: number[] };

/**
 * In-memory fallback keyed by identifier.
 * LIMITATION: best-effort only on multi-instance / serverless — each isolate
 * has its own Map. Prefer Upstash Redis (UPSTASH_REDIS_REST_URL + TOKEN).
 */
const memoryStores = {
  minute: new Map<string, MemoryBucket>(),
  hour: new Map<string, MemoryBucket>(),
};

function pruneAndCheck(
  store: Map<string, MemoryBucket>,
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; retryAfterSec: number; remaining: number } {
  const now = Date.now();
  const bucket = store.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) {
    store.set(key, bucket);
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { success: false, retryAfterSec, remaining: 0 };
  }
  bucket.timestamps.push(now);
  store.set(key, bucket);
  return {
    success: true,
    retryAfterSec: 0,
    remaining: Math.max(0, limit - bucket.timestamps.length),
  };
}

function checkMemory(identifier: string): RateLimitResult {
  const min = pruneAndCheck(
    memoryStores.minute,
    `min:${identifier}`,
    IMAGE_GEN_RATE_LIMIT_PER_MINUTE,
    60_000,
  );
  if (!min.success) {
    return {
      success: false,
      retryAfterSec: min.retryAfterSec,
      limit: IMAGE_GEN_RATE_LIMIT_PER_MINUTE,
      remaining: 0,
      backend: "memory",
    };
  }
  const hour = pruneAndCheck(
    memoryStores.hour,
    `hour:${identifier}`,
    IMAGE_GEN_RATE_LIMIT_PER_HOUR,
    3_600_000,
  );
  if (!hour.success) {
    return {
      success: false,
      retryAfterSec: hour.retryAfterSec,
      limit: IMAGE_GEN_RATE_LIMIT_PER_HOUR,
      remaining: 0,
      backend: "memory",
    };
  }
  return {
    success: true,
    retryAfterSec: 0,
    limit: IMAGE_GEN_RATE_LIMIT_PER_MINUTE,
    remaining: Math.min(min.remaining, hour.remaining),
    backend: "memory",
  };
}

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/**
 * Rate-limit image generation per IP.
 * Uses @upstash/ratelimit when UPSTASH_REDIS_REST_* is set; else in-memory Map.
 */
export async function rateLimitImageGen(identifier: string): Promise<RateLimitResult> {
  if (!upstashConfigured()) {
    return checkMemory(identifier);
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const redis = Redis.fromEnv();

    const minuteLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(IMAGE_GEN_RATE_LIMIT_PER_MINUTE, "1 m"),
      prefix: "katha:img:min",
      analytics: false,
    });
    const hourLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(IMAGE_GEN_RATE_LIMIT_PER_HOUR, "1 h"),
      prefix: "katha:img:hour",
      analytics: false,
    });

    const min = await minuteLimiter.limit(identifier);
    if (!min.success) {
      const retryAfterSec = Math.max(1, Math.ceil((min.reset - Date.now()) / 1000));
      return {
        success: false,
        retryAfterSec,
        limit: IMAGE_GEN_RATE_LIMIT_PER_MINUTE,
        remaining: min.remaining,
        backend: "upstash",
      };
    }
    const hour = await hourLimiter.limit(identifier);
    if (!hour.success) {
      const retryAfterSec = Math.max(1, Math.ceil((hour.reset - Date.now()) / 1000));
      return {
        success: false,
        retryAfterSec,
        limit: IMAGE_GEN_RATE_LIMIT_PER_HOUR,
        remaining: hour.remaining,
        backend: "upstash",
      };
    }
    return {
      success: true,
      retryAfterSec: 0,
      limit: IMAGE_GEN_RATE_LIMIT_PER_MINUTE,
      remaining: Math.min(min.remaining, hour.remaining),
      backend: "upstash",
    };
  } catch (err) {
    console.error(
      "[rate-limit] upstash failed, falling back to memory",
      err instanceof Error ? err.message.slice(0, 120) : "unknown",
    );
    return checkMemory(identifier);
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}
