"use client";

import { newId } from "@/lib/user-works-store";
import {
  DAILY_GRANT_FREE,
  DAILY_GRANT_PLUS,
  STARTING_BALANCE,
} from "@/lib/wallet-constants";

export type LedgerType =
  | "daily_grant"
  | "image_spend"
  | "tip_out"
  | "tip_in"
  | "purchase_mock";

export type LedgerEntry = {
  id: string;
  type: LedgerType;
  /** Signed delta: positive credit, negative debit */
  amount: number;
  balanceAfter: number;
  createdAt: string;
  note?: string;
  counterparty?: string;
  meta?: Record<string, string>;
};

export type WalletState = {
  balance: number;
  lastDailyClaimDate: string | null;
  plan: "free" | "plus";
};

const WALLET_KEY = "katha.wallet.v1";
const LEDGER_KEY = "katha.ledger.v1";
const CREATOR_KEY = "katha.creatorBalances.v1";

export {
  DAILY_GRANT_FREE,
  DAILY_GRANT_PLUS,
  IMAGE_COST,
  DEFAULT_TIP_AMOUNTS,
  STARTING_BALANCE,
} from "@/lib/wallet-constants";

export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyWallet(): WalletState {
  return { balance: STARTING_BALANCE, lastDailyClaimDate: null, plan: "free" };
}

export function readWallet(): WalletState {
  if (typeof window === "undefined") return emptyWallet();
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) return emptyWallet();
    const p = JSON.parse(raw) as Partial<WalletState>;
    return {
      balance: typeof p.balance === "number" ? p.balance : STARTING_BALANCE,
      lastDailyClaimDate: p.lastDailyClaimDate ?? null,
      plan: p.plan === "plus" ? "plus" : "free",
    };
  } catch {
    return emptyWallet();
  }
}

export function writeWallet(state: WalletState) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("katha-wallet"));
}

export function readLedger(): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as { entries?: LedgerEntry[] } | LedgerEntry[];
    return Array.isArray(p) ? p : (p.entries ?? []);
  } catch {
    return [];
  }
}

export function writeLedger(entries: LedgerEntry[]) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify({ entries }));
  window.dispatchEvent(new Event("katha-wallet"));
}

function appendLedger(entry: LedgerEntry) {
  writeLedger([entry, ...readLedger()].slice(0, 500));
}

export function readCreatorBalances(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CREATOR_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export function writeCreatorBalances(map: Record<string, number>) {
  localStorage.setItem(CREATOR_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event("katha-wallet"));
}

export function getCreatorBalance(handle: string): number {
  return readCreatorBalances()[handle] ?? 0;
}

export function canClaimDaily(wallet = readWallet()): boolean {
  return wallet.lastDailyClaimDate !== todayLocal();
}

export function dailyGrantAmount(wallet = readWallet()): number {
  return wallet.plan === "plus" ? DAILY_GRANT_PLUS : DAILY_GRANT_FREE;
}

export type ClaimResult =
  | { ok: true; amount: number; balance: number }
  | { ok: false; reason: "already_claimed" };

export function claimDaily(): ClaimResult {
  const wallet = readWallet();
  if (!canClaimDaily(wallet)) return { ok: false, reason: "already_claimed" };
  const amount = dailyGrantAmount(wallet);
  const next: WalletState = {
    ...wallet,
    balance: wallet.balance + amount,
    lastDailyClaimDate: todayLocal(),
  };
  writeWallet(next);
  appendLedger({
    id: newId("led"),
    type: "daily_grant",
    amount,
    balanceAfter: next.balance,
    createdAt: new Date().toISOString(),
    note: "โบนัสรายวัน",
  });
  return { ok: true, amount, balance: next.balance };
}

export type SpendResult =
  | { ok: true; balance: number; entry: LedgerEntry }
  | { ok: false; reason: "insufficient"; balance: number; need: number };

export function spendMoons(
  amount: number,
  type: Extract<LedgerType, "image_spend" | "purchase_mock">,
  note?: string,
  meta?: Record<string, string>,
): SpendResult {
  const wallet = readWallet();
  if (amount <= 0 || wallet.balance < amount) {
    return { ok: false, reason: "insufficient", balance: wallet.balance, need: amount };
  }
  const next: WalletState = { ...wallet, balance: wallet.balance - amount };
  writeWallet(next);
  const entry: LedgerEntry = {
    id: newId("led"),
    type,
    amount: -amount,
    balanceAfter: next.balance,
    createdAt: new Date().toISOString(),
    note,
    meta,
  };
  appendLedger(entry);
  return { ok: true, balance: next.balance, entry };
}

export type TipResult =
  | { ok: true; balance: number; creatorBalance: number }
  | { ok: false; reason: "insufficient"; balance: number; need: number };

export function tipCreator(handle: string, amount: number): TipResult {
  const wallet = readWallet();
  if (amount <= 0 || wallet.balance < amount) {
    return { ok: false, reason: "insufficient", balance: wallet.balance, need: amount };
  }
  const next: WalletState = { ...wallet, balance: wallet.balance - amount };
  writeWallet(next);
  appendLedger({
    id: newId("led"),
    type: "tip_out",
    amount: -amount,
    balanceAfter: next.balance,
    createdAt: new Date().toISOString(),
    note: `ส่งพระจันทร์ให้ @${handle}`,
    counterparty: handle,
  });

  const balances = readCreatorBalances();
  const creatorBalance = (balances[handle] ?? 0) + amount;
  balances[handle] = creatorBalance;
  writeCreatorBalances(balances);

  appendLedger({
    id: newId("led"),
    type: "tip_in",
    amount,
    balanceAfter: creatorBalance,
    createdAt: new Date().toISOString(),
    note: "ได้รับทิป",
    counterparty: handle,
  });

  return { ok: true, balance: next.balance, creatorBalance };
}

export function mockPurchase(packageId: string, moons: number, priceLabel: string): SpendResult {
  const wallet = readWallet();
  const next: WalletState = { ...wallet, balance: wallet.balance + moons };
  writeWallet(next);
  const entry: LedgerEntry = {
    id: newId("led"),
    type: "purchase_mock",
    amount: moons,
    balanceAfter: next.balance,
    createdAt: new Date().toISOString(),
    note: `เติมม็อก ${priceLabel}`,
    meta: { packageId },
  };
  appendLedger(entry);
  return { ok: true, balance: next.balance, entry };
}

export function ledgerLabelTh(type: LedgerType): string {
  switch (type) {
    case "daily_grant":
      return "โบนัสรายวัน";
    case "image_spend":
      return "สร้างภาพ";
    case "tip_out":
      return "ส่งพระจันทร์";
    case "tip_in":
      return "ได้รับทิป";
    case "purchase_mock":
      return "เติมม็อก";
    default:
      return type;
  }
}

export function sumTipInForHandle(handle: string): number {
  return readLedger()
    .filter((e) => e.type === "tip_in" && e.counterparty === handle)
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Wallet page ledger: hide tip_in (creator-side mirror). */
export function readUserLedger(): LedgerEntry[] {
  return readLedger().filter((e) => e.type !== "tip_in");
}
