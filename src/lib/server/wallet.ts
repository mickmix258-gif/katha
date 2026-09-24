import {
  DAILY_GRANT_FREE,
  DAILY_GRANT_PLUS,
  IMAGE_COST,
  STARTING_BALANCE,
} from "@/lib/wallet-constants";

export type LedgerType =
  | "daily_grant"
  | "image_spend"
  | "tip_out"
  | "tip_in"
  | "purchase_mock";

export type ServerLedgerEntry = {
  id: string;
  type: LedgerType;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  note?: string;
  counterparty?: string;
  meta?: Record<string, string>;
};

export type ServerWalletState = {
  balance: number;
  lastDailyClaimDate: string | null;
  plan: "free" | "plus";
  ledger: ServerLedgerEntry[];
};

export { IMAGE_COST, STARTING_BALANCE, DAILY_GRANT_FREE, DAILY_GRANT_PLUS };

/**
 * Server moon ledger.
 * Prefer Upstash Redis when UPSTASH_REDIS_REST_URL + TOKEN are set.
 * Fallback: in-memory Map keyed by userId — MVP only; lost on cold start /
 * not shared across Vercel instances. Documented in M7_PRESHARE_SECURITY.md.
 */
const memoryWallets = new Map<string, ServerWalletState>();

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyWallet(): ServerWalletState {
  return {
    balance: STARTING_BALANCE,
    lastDailyClaimDate: null,
    plan: "free",
    ledger: [],
  };
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function redisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

function redisKey(userId: string): string {
  return `katha:wallet:v1:${userId}`;
}

async function loadWallet(userId: string): Promise<{
  wallet: ServerWalletState;
  backend: "upstash" | "memory";
}> {
  if (redisConfigured()) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      const raw = await redis.get<ServerWalletState>(redisKey(userId));
      if (raw && typeof raw === "object" && typeof raw.balance === "number") {
        return {
          wallet: {
            balance: raw.balance,
            lastDailyClaimDate: raw.lastDailyClaimDate ?? null,
            plan: raw.plan === "plus" ? "plus" : "free",
            ledger: Array.isArray(raw.ledger) ? raw.ledger : [],
          },
          backend: "upstash",
        };
      }
      const fresh = emptyWallet();
      await redis.set(redisKey(userId), fresh);
      return { wallet: fresh, backend: "upstash" };
    } catch (err) {
      console.error(
        "[server-wallet] redis load failed",
        err instanceof Error ? err.message.slice(0, 120) : "unknown",
      );
    }
  }
  const existing = memoryWallets.get(userId);
  if (existing) return { wallet: existing, backend: "memory" };
  const fresh = emptyWallet();
  memoryWallets.set(userId, fresh);
  return { wallet: fresh, backend: "memory" };
}

async function saveWallet(
  userId: string,
  wallet: ServerWalletState,
  preferred: "upstash" | "memory",
): Promise<"upstash" | "memory"> {
  if (preferred === "upstash" || redisConfigured()) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      // Cap ledger size in storage
      const toStore: ServerWalletState = {
        ...wallet,
        ledger: wallet.ledger.slice(0, 200),
      };
      await redis.set(redisKey(userId), toStore);
      return "upstash";
    } catch (err) {
      console.error(
        "[server-wallet] redis save failed",
        err instanceof Error ? err.message.slice(0, 120) : "unknown",
      );
    }
  }
  memoryWallets.set(userId, { ...wallet, ledger: wallet.ledger.slice(0, 200) });
  return "memory";
}

export async function getServerWallet(userId: string) {
  const { wallet, backend } = await loadWallet(userId);
  return { wallet, backend };
}

export function dailyGrantAmount(plan: "free" | "plus"): number {
  return plan === "plus" ? DAILY_GRANT_PLUS : DAILY_GRANT_FREE;
}

export function canClaimDaily(wallet: ServerWalletState): boolean {
  return wallet.lastDailyClaimDate !== todayLocal();
}

export async function claimDailyServer(userId: string): Promise<
  | { ok: true; amount: number; balance: number; backend: "upstash" | "memory" }
  | { ok: false; reason: "already_claimed"; balance: number; backend: "upstash" | "memory" }
> {
  const { wallet, backend } = await loadWallet(userId);
  if (!canClaimDaily(wallet)) {
    return { ok: false, reason: "already_claimed", balance: wallet.balance, backend };
  }
  const amount = dailyGrantAmount(wallet.plan);
  wallet.balance += amount;
  wallet.lastDailyClaimDate = todayLocal();
  wallet.ledger.unshift({
    id: newId("led"),
    type: "daily_grant",
    amount,
    balanceAfter: wallet.balance,
    createdAt: new Date().toISOString(),
    note: "โบนัสรายวัน",
  });
  const savedBackend = await saveWallet(userId, wallet, backend);
  return { ok: true, amount, balance: wallet.balance, backend: savedBackend };
}

/**
 * Deduct moons after successful image gen. Returns insufficient without mutating.
 * Never call this before the provider succeeds — rate-limit 429 must not charge.
 */
export async function spendImageMoonsServer(
  userId: string,
  meta?: Record<string, string>,
): Promise<
  | { ok: true; balance: number; backend: "upstash" | "memory" }
  | {
      ok: false;
      reason: "insufficient";
      balance: number;
      need: number;
      backend: "upstash" | "memory";
    }
> {
  const { wallet, backend } = await loadWallet(userId);
  if (wallet.balance < IMAGE_COST) {
    return {
      ok: false,
      reason: "insufficient",
      balance: wallet.balance,
      need: IMAGE_COST,
      backend,
    };
  }
  wallet.balance -= IMAGE_COST;
  wallet.ledger.unshift({
    id: newId("led"),
    type: "image_spend",
    amount: -IMAGE_COST,
    balanceAfter: wallet.balance,
    createdAt: new Date().toISOString(),
    note: "สร้างภาพ",
    meta,
  });
  const savedBackend = await saveWallet(userId, wallet, backend);
  return { ok: true, balance: wallet.balance, backend: savedBackend };
}

/** Soft balance peek without side effects (pre-check before calling provider). */
export async function assertCanAffordImage(userId: string): Promise<
  | { ok: true; balance: number }
  | { ok: false; balance: number; need: number }
> {
  const { wallet } = await loadWallet(userId);
  if (wallet.balance < IMAGE_COST) {
    return { ok: false, balance: wallet.balance, need: IMAGE_COST };
  }
  return { ok: true, balance: wallet.balance };
}
