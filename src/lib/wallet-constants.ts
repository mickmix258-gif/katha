/** Shared wallet / moon constants (safe for client + server). */

export const DAILY_GRANT_FREE = 30;
export const DAILY_GRANT_PLUS = 300;
export const IMAGE_COST = 10;
export const DEFAULT_TIP_AMOUNTS = [5, 10, 30] as const;
export const STARTING_BALANCE = 50;

/** Image gen rate limits (per IP). Documented in docs/M7_PRESHARE_SECURITY.md */
export const IMAGE_GEN_RATE_LIMIT_PER_MINUTE = 5;
export const IMAGE_GEN_RATE_LIMIT_PER_HOUR = 30;
