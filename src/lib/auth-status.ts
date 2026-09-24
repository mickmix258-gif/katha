/** Server-safe helpers for whether Auth.js OAuth is usable at runtime. */

export function hasAuthSecret(): boolean {
  return Boolean(process.env.AUTH_SECRET?.trim());
}

export function hasGoogleProvider(): boolean {
  return Boolean(
    process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim(),
  );
}

export function hasTwitterProvider(): boolean {
  return Boolean(
    process.env.AUTH_TWITTER_ID?.trim() && process.env.AUTH_TWITTER_SECRET?.trim(),
  );
}

/** True when login can actually complete (secret + ≥1 OAuth provider). */
export function isAuthConfigured(): boolean {
  return hasAuthSecret() && (hasGoogleProvider() || hasTwitterProvider());
}

export function authStatusPublic() {
  return {
    configured: isAuthConfigured(),
    providers: {
      google: hasGoogleProvider(),
      twitter: hasTwitterProvider(),
    },
  };
}
