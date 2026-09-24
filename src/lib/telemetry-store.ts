import type { StoredTelemetryEvent } from "@/lib/telemetry-types";
import { TELEMETRY_RING_LIMIT } from "@/lib/telemetry-types";

/**
 * Server-side telemetry ring buffer.
 * Preferred: Upstash Redis list (LPUSH + LTRIM) when UPSTASH_REDIS_REST_* set.
 * Fallback: in-memory ring (~1000 events) — best-effort on serverless isolates.
 *
 * Never stores raw IP, full UA, prompts, or secrets (sanitized upstream).
 */

const REDIS_KEY = "katha:telemetry:events";

type MemoryRing = { events: StoredTelemetryEvent[] };

declare global {
  var __kathaTelemetryRing: MemoryRing | undefined;
}

function memoryRing(): MemoryRing {
  if (!globalThis.__kathaTelemetryRing) {
    globalThis.__kathaTelemetryRing = { events: [] };
  }
  return globalThis.__kathaTelemetryRing;
}

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

function pushMemory(event: StoredTelemetryEvent) {
  const ring = memoryRing();
  ring.events.unshift(event);
  if (ring.events.length > TELEMETRY_RING_LIMIT) {
    ring.events.length = TELEMETRY_RING_LIMIT;
  }
}

function listMemory(limit: number): StoredTelemetryEvent[] {
  return memoryRing().events.slice(0, Math.min(limit, TELEMETRY_RING_LIMIT));
}

function countsMemory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of memoryRing().events) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  return counts;
}

export type TelemetryBackend = "upstash" | "memory";

export async function appendTelemetryEvent(
  event: StoredTelemetryEvent,
): Promise<{ backend: TelemetryBackend }> {
  if (!upstashConfigured()) {
    pushMemory(event);
    return { backend: "memory" };
  }
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = Redis.fromEnv();
    await redis.lpush(REDIS_KEY, JSON.stringify(event));
    await redis.ltrim(REDIS_KEY, 0, TELEMETRY_RING_LIMIT - 1);
    return { backend: "upstash" };
  } catch (err) {
    console.error(
      "[telemetry] upstash append failed, memory fallback",
      err instanceof Error ? err.message.slice(0, 80) : "unknown",
    );
    pushMemory(event);
    return { backend: "memory" };
  }
}

export async function listTelemetryEvents(
  limit = 100,
): Promise<{ events: StoredTelemetryEvent[]; backend: TelemetryBackend }> {
  const n = Math.min(Math.max(1, limit), TELEMETRY_RING_LIMIT);
  if (!upstashConfigured()) {
    return { events: listMemory(n), backend: "memory" };
  }
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = Redis.fromEnv();
    const raw = await redis.lrange(REDIS_KEY, 0, n - 1);
    const events: StoredTelemetryEvent[] = [];
    for (const item of raw ?? []) {
      try {
        const parsed =
          typeof item === "string"
            ? (JSON.parse(item) as StoredTelemetryEvent)
            : (item as StoredTelemetryEvent);
        if (parsed?.id && parsed?.type && parsed?.ts) events.push(parsed);
      } catch {
        /* skip bad row */
      }
    }
    return { events, backend: "upstash" };
  } catch (err) {
    console.error(
      "[telemetry] upstash list failed, memory fallback",
      err instanceof Error ? err.message.slice(0, 80) : "unknown",
    );
    return { events: listMemory(n), backend: "memory" };
  }
}

export async function countTelemetryByType(): Promise<{
  counts: Record<string, number>;
  backend: TelemetryBackend;
  total: number;
}> {
  const { events, backend } = await listTelemetryEvents(TELEMETRY_RING_LIMIT);
  if (backend === "memory" && !upstashConfigured()) {
    const counts = countsMemory();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { counts, backend, total };
  }
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  return {
    counts,
    backend,
    total: events.length,
  };
}

export function telemetryStorageInfo() {
  return {
    backend: upstashConfigured() ? ("upstash" as const) : ("memory" as const),
    ringLimit: TELEMETRY_RING_LIMIT,
    note:
      "In-memory is best-effort on serverless (per-isolate). Prefer Upstash for durable shared buffer.",
  };
}
