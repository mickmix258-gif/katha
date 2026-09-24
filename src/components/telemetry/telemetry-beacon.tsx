"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/telemetry-client";
import type { TelemetryEventType } from "@/lib/telemetry-types";

/**
 * Lightweight layout beacon: page_view + route-specific coarse events.
 * No UI. Never links to developer studio.
 */
function routeEvent(pathname: string): TelemetryEventType | null {
  if (pathname === "/studio" || pathname.startsWith("/studio/")) return "studio_open";
  if (pathname === "/login" || pathname.startsWith("/login")) return "login_view";
  if (pathname === "/wallet" || pathname.startsWith("/wallet")) return "wallet_open";
  return null;
}

export function TelemetryBeacon() {
  const pathname = usePathname() ?? "/";
  const last = useRef<string>("");

  useEffect(() => {
    // Never beacon developer studio itself as public traffic noise
    if (pathname.startsWith("/dev/")) return;
    if (last.current === pathname) return;
    last.current = pathname;

    trackEvent("page_view", { path: pathname });
    const specific = routeEvent(pathname);
    if (specific) trackEvent(specific, { path: pathname });
  }, [pathname]);

  return null;
}
