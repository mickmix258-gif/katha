import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import {
  hasAuthSecret,
  hasGoogleProvider,
  hasTwitterProvider,
} from "@/lib/auth-status";

/**
 * Auth.js (NextAuth v5) — Google + X (Twitter) OAuth.
 * Env (set on Vercel; never commit values):
 *   AUTH_SECRET
 *   AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
 *   AUTH_TWITTER_ID / AUTH_TWITTER_SECRET  (X OAuth 2.0)
 *   AUTH_URL (optional on Vercel; AUTH_TRUST_HOST=true recommended)
 *
 * Build must succeed without these — providers are omitted when unset.
 * Runtime login requires AUTH_SECRET + at least one provider.
 */

const providers = [];

if (hasGoogleProvider()) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  );
}

if (hasTwitterProvider()) {
  providers.push(
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID!,
      clientSecret: process.env.AUTH_TWITTER_SECRET!,
    }),
  );
}

/**
 * Placeholder secret only for `next build` when AUTH_SECRET is unset.
 * Real sessions require AUTH_SECRET in production — see docs/M7_PRESHARE_SECURITY.md
 * Generate: `openssl rand -base64 32`
 */
const buildSafeSecret =
  process.env.AUTH_SECRET?.trim() ||
  "katha-build-placeholder-not-for-production-set-AUTH_SECRET";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: buildSafeSecret,
  trustHost: true,
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.provider) {
        token.provider = account.provider;
      }
      if (profile && "id" in profile && typeof profile.id === "string") {
        token.providerAccountId = profile.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || "";
      }
      return session;
    },
  },
});

/** Whether mutating wallet / charging moons must go through authenticated server APIs. */
export function authEnforced(): boolean {
  return hasAuthSecret() && providers.length > 0;
}
