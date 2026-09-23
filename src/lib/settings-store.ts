"use client";

export type ContentModePref = "all" | "safe_only";

export type SettingsState = {
  ageVerified: boolean;
  contentMode: ContentModePref;
  /** When true, auto AI moderation can approve/decline without human */
  autoModerate: boolean;
};

const KEY = "katha.settings.v1";

export const DEFAULT_SETTINGS_STATE = (): SettingsState => ({
  ageVerified: false,
  contentMode: "all",
  autoModerate: true,
});

export function readSettings(): SettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS_STATE();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS_STATE();
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      ageVerified: Boolean(parsed.ageVerified),
      contentMode: parsed.contentMode === "safe_only" ? "safe_only" : "all",
      autoModerate: parsed.autoModerate !== false,
    };
  } catch {
    return DEFAULT_SETTINGS_STATE();
  }
}

export function writeSettings(state: SettingsState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("katha-settings"));
}

export function patchSettings(patch: Partial<SettingsState>): SettingsState {
  const next = { ...readSettings(), ...patch };
  writeSettings(next);
  return next;
}
