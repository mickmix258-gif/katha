"use client";

import { newId } from "@/lib/user-works-store";

export type NotificationType =
  | "follow"
  | "like"
  | "tip"
  | "moderation"
  | "creator_share"
  | "report";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
  readAt?: string;
  payload?: Record<string, string | number | boolean | null>;
};

const KEY = "katha.notifications.v1";
const LOCAL_USER = "me";

export type NotificationStore = {
  userId: string;
  items: AppNotification[];
};

function empty(): NotificationStore {
  return { userId: LOCAL_USER, items: [] };
}

export function readNotifications(): NotificationStore {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as NotificationStore;
    return { userId: parsed.userId ?? LOCAL_USER, items: parsed.items ?? [] };
  } catch {
    return empty();
  }
}

export function writeNotifications(state: NotificationStore) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("katha-notifications"));
}

export function pushNotification(
  input: Omit<AppNotification, "id" | "createdAt"> & { createdAt?: string },
): AppNotification {
  const state = readNotifications();
  const item: AppNotification = {
    id: newId("notif"),
    createdAt: input.createdAt ?? new Date().toISOString(),
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    payload: input.payload,
    readAt: input.readAt,
  };
  state.items.unshift(item);
  // cap store
  if (state.items.length > 200) state.items = state.items.slice(0, 200);
  writeNotifications(state);
  return item;
}

export function markNotificationRead(id: string) {
  const state = readNotifications();
  const idx = state.items.findIndex((n) => n.id === id);
  if (idx < 0) return;
  if (!state.items[idx].readAt) {
    state.items[idx] = { ...state.items[idx], readAt: new Date().toISOString() };
    writeNotifications(state);
  }
}

export function markAllNotificationsRead() {
  const state = readNotifications();
  const now = new Date().toISOString();
  let changed = false;
  state.items = state.items.map((n) => {
    if (n.readAt) return n;
    changed = true;
    return { ...n, readAt: now };
  });
  if (changed) writeNotifications(state);
}

export function unreadCount(): number {
  return readNotifications().items.filter((n) => !n.readAt).length;
}

export function listNotifications(): AppNotification[] {
  return [...readNotifications().items].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}
