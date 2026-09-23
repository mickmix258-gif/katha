"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_TIP_AMOUNTS,
  readWallet,
  tipCreator,
} from "@/lib/wallet-store";
import { pushNotification } from "@/lib/notification-store";

export function TipMoons({
  handle,
  displayName,
}: {
  handle: string;
  displayName?: string;
}) {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState<(typeof DEFAULT_TIP_AMOUNTS)[number]>(10);
  const [custom, setCustom] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setBalance(readWallet().balance);
    sync();
    window.addEventListener("katha-wallet", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("katha-wallet", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const resolved = custom.trim()
    ? Math.max(0, Math.floor(Number(custom)) || 0)
    : amount;

  const onTip = () => {
    setMsg(null);
    setErr(null);
    if (resolved <= 0) {
      setErr("ระบุจำนวนพระจันทร์ที่มากกว่า 0");
      return;
    }
    const result = tipCreator(handle, resolved);
    if (!result.ok) {
      setErr(
        `พระจันทร์ไม่พอ (มี ${result.balance} ต้องการ ${result.need}) — ไปรับโบนัสที่กระเป๋า`,
      );
      return;
    }
    setBalance(result.balance);
    setMsg(
      `ส่ง ${resolved} พระจันทร์ให้ @${handle}${displayName ? ` (${displayName})` : ""} แล้ว`,
    );
    pushNotification({
      type: "tip",
      title: `ส่ง ${resolved} พระจันทร์`,
      body: `ถึง @${handle}${displayName ? ` (${displayName})` : ""}`,
      href: `/c/${handle}`,
      payload: { handle, amount: resolved },
    });
    pushNotification({
      type: "creator_share",
      title: "ส่วนแบ่งครีเอเตอร์ (stub)",
      body: `ได้รับทิป ${resolved} พระจันทร์จากผู้เล่น`,
      href: "/studio/earnings",
      payload: { handle, amount: resolved },
    });
    setCustom("");
  };

  return (
    <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">ส่งพระจันทร์</h3>
        <p className="text-xs text-[var(--muted)]">ยอดคุณ: {balance}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEFAULT_TIP_AMOUNTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setAmount(n);
              setCustom("");
            }}
            className={`rounded-full px-3 py-1 text-sm ${
              !custom && amount === n
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)]"
            }`}
          >
            {n}
          </button>
        ))}
        <input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="กำหนดเอง"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="w-24 rounded-full border border-[var(--line)] bg-[var(--ink)] px-3 py-1 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={onTip}
        className="mt-3 rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-white"
      >
        ส่ง {resolved || "…"} พระจันทร์
      </button>
      {msg ? <p className="mt-2 text-xs text-[var(--accent-2)]">{msg}</p> : null}
      {err ? <p className="mt-2 text-xs text-red-300">{err}</p> : null}
    </div>
  );
}
