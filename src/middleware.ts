import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Basic security headers for all matched routes.
 * CORS: do not open APIs cross-origin — same-origin browser calls only
 * (no Access-Control-Allow-Origin: *).
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Vercel/static sometimes emits Access-Control-Allow-Origin: *; strip it.
  response.headers.delete("Access-Control-Allow-Origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  // Mild CSP: allow self + inline styles (Tailwind) + images from https (provider CDN)
  // frame-ancestors 'none' reinforces X-Frame-Options
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https:",
    ].join("; "),
  );

  // Block trivial cross-origin API abuse: reject non-same-origin POSTs to /api/*
  // (browser form/fetch from other sites). Allow missing Origin (same-origin / server).
  if (request.method !== "GET" && request.method !== "HEAD") {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
      const origin = request.headers.get("origin");
      if (origin) {
        const host = request.headers.get("host");
        try {
          const originHost = new URL(origin).host;
          if (host && originHost !== host) {
            return NextResponse.json(
              {
                ok: false,
                reason: "cors_forbidden",
                messageTh: "คำขอข้ามโดเมนไม่ได้รับอนุญาต",
              },
              { status: 403 },
            );
          }
        } catch {
          return NextResponse.json(
            {
              ok: false,
              reason: "cors_forbidden",
              messageTh: "คำขอข้ามโดเมนไม่ได้รับอนุญาต",
            },
            { status: 403 },
          );
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets Next serves directly.
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js).*)",
  ],
};
