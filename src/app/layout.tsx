import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { PwaRegister } from "@/components/pwa-register";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KATHA · กถา",
  description: "เล่นเรื่อง สร้างโลก คุยกับตัวละคร",
  applicationName: "KATHA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "KATHA",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#b42318",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${noto.variable} antialiased`}>
        <AuthSessionProvider>
          <PwaRegister />
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <Analytics />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
