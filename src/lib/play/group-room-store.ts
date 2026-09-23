"use client";

import { newId } from "@/lib/user-works-store";
import {
  createThread,
  getThread,
  saveThread,
} from "@/lib/play/thread-store";
import type { PlayMessage, PlayThread } from "@/lib/play/types";

export type GroupSeatRole = "host" | "player";

export type GroupMember = {
  userId: string;
  displayName: string;
  role: GroupSeatRole;
  seat: number;
  /** Opt-in for inner monologue in group (all must opt in) */
  innerMonologueOptIn: boolean;
  joinedAt: string;
};

export type GroupEntityKind = "character" | "scene";

export type GroupRoom = {
  id: string;
  /** Linked play thread id (mode=group) */
  threadId: string;
  entityKind: GroupEntityKind;
  entityId: string;
  entityTitle: string;
  inviteCode: string;
  maxSeats: number; // 2–4
  members: GroupMember[];
  /** Whose turn (member userId); stub round-robin */
  currentTurnUserId: string;
  createdAt: string;
  updatedAt: string;
};

const KEY = "katha.groupRooms.v1";

export type GroupRoomState = {
  rooms: GroupRoom[];
};

function empty(): GroupRoomState {
  return { rooms: [] };
}

export function readGroupRooms(): GroupRoomState {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as GroupRoomState;
    return { rooms: parsed.rooms ?? [] };
  } catch {
    return empty();
  }
}

export function writeGroupRooms(state: GroupRoomState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("katha-group-rooms"));
}

export function getGroupRoom(id: string): GroupRoom | undefined {
  return readGroupRooms().rooms.find((r) => r.id === id);
}

export function getGroupRoomByThread(threadId: string): GroupRoom | undefined {
  return readGroupRooms().rooms.find((r) => r.threadId === threadId);
}

export function getGroupRoomByInvite(code: string): GroupRoom | undefined {
  const c = code.trim().toUpperCase();
  return readGroupRooms().rooms.find((r) => r.inviteCode === c);
}

export function listGroupRooms(): GroupRoom[] {
  return [...readGroupRooms().rooms].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

function saveRoom(room: GroupRoom): GroupRoom {
  const state = readGroupRooms();
  const next = { ...room, updatedAt: new Date().toISOString() };
  const idx = state.rooms.findIndex((r) => r.id === room.id);
  if (idx >= 0) state.rooms[idx] = next;
  else state.rooms.unshift(next);
  writeGroupRooms(state);
  return next;
}

function makeInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function createGroupRoom(input: {
  entityKind: GroupEntityKind;
  entityId: string;
  entityTitle: string;
  opening?: { role: PlayMessage["role"]; content: string };
  maxSeats?: number;
  hostName?: string;
}): { room: GroupRoom; thread: PlayThread } {
  const maxSeats = Math.min(4, Math.max(2, input.maxSeats ?? 4));
  const now = new Date().toISOString();
  const host: GroupMember = {
    userId: "me",
    displayName: input.hostName ?? "ฉัน (โฮสต์)",
    role: "host",
    seat: 0,
    innerMonologueOptIn: false,
    joinedAt: now,
  };

  const thread = createThread({
    mode: "group",
    entityId: input.entityId,
    entityTitle: input.entityTitle,
    opening: input.opening,
    settings: { innerMonologue: false },
  });

  const room: GroupRoom = {
    id: newId("room"),
    threadId: thread.id,
    entityKind: input.entityKind,
    entityId: input.entityId,
    entityTitle: input.entityTitle,
    inviteCode: makeInviteCode(),
    maxSeats,
    members: [host],
    currentTurnUserId: host.userId,
    createdAt: now,
    updatedAt: now,
  };

  // attach group meta on thread for chrome
  saveThread({
    ...thread,
    groupRoomId: room.id,
    groupEntityKind: input.entityKind,
  });

  return { room: saveRoom(room), thread: getThread(thread.id)! };
}

/** Join as local mock seat (same browser). */
export function joinGroupRoom(
  roomId: string,
  displayName: string,
): { ok: true; room: GroupRoom } | { ok: false; error: string } {
  const room = getGroupRoom(roomId);
  if (!room) return { ok: false, error: "ไม่พบห้อง" };
  if (room.members.length >= room.maxSeats) {
    return { ok: false, error: "ที่นั่งเต็ม (สูงสุด 4)" };
  }
  if (room.members.length >= 4) {
    return { ok: false, error: "ที่นั่งเต็ม" };
  }
  // ensure at least 2 seats capacity already enforced on create
  const taken = new Set(room.members.map((m) => m.seat));
  let seat = 0;
  while (taken.has(seat) && seat < room.maxSeats) seat += 1;
  const userId = newId("seat");
  const member: GroupMember = {
    userId,
    displayName: displayName.trim() || `ผู้เล่น ${seat + 1}`,
    role: "player",
    seat,
    innerMonologueOptIn: false,
    joinedAt: new Date().toISOString(),
  };
  const next = saveRoom({ ...room, members: [...room.members, member] });
  return { ok: true, room: next };
}

export function leaveGroupRoom(
  roomId: string,
  userId: string,
): { ok: true; room: GroupRoom | null } | { ok: false; error: string } {
  const room = getGroupRoom(roomId);
  if (!room) return { ok: false, error: "ไม่พบห้อง" };
  const member = room.members.find((m) => m.userId === userId);
  if (!member) return { ok: false, error: "ไม่ได้อยู่ในห้อง" };
  if (member.role === "host") {
    return { ok: false, error: "โฮสต์ต้องปิดห้องแทนการออก" };
  }
  const members = room.members.filter((m) => m.userId !== userId);
  let currentTurnUserId = room.currentTurnUserId;
  if (currentTurnUserId === userId) {
    currentTurnUserId = members[0]?.userId ?? "";
  }
  const next = saveRoom({ ...room, members, currentTurnUserId });
  return { ok: true, room: next };
}

export function closeGroupRoom(roomId: string) {
  const state = readGroupRooms();
  writeGroupRooms({ rooms: state.rooms.filter((r) => r.id !== roomId) });
}

export function advanceTurn(roomId: string): GroupRoom | undefined {
  const room = getGroupRoom(roomId);
  if (!room || room.members.length === 0) return undefined;
  const idx = room.members.findIndex((m) => m.userId === room.currentTurnUserId);
  const nextIdx = idx < 0 ? 0 : (idx + 1) % room.members.length;
  return saveRoom({
    ...room,
    currentTurnUserId: room.members[nextIdx]!.userId,
  });
}

export function setMemberInnerOptIn(
  roomId: string,
  userId: string,
  optIn: boolean,
): GroupRoom | undefined {
  const room = getGroupRoom(roomId);
  if (!room) return undefined;
  const members = room.members.map((m) =>
    m.userId === userId ? { ...m, innerMonologueOptIn: optIn } : m,
  );
  return saveRoom({ ...room, members });
}

export function allMembersInnerOptIn(room: GroupRoom): boolean {
  return room.members.length > 0 && room.members.every((m) => m.innerMonologueOptIn);
}

export function setMaxSeats(roomId: string, maxSeats: number): GroupRoom | undefined {
  const room = getGroupRoom(roomId);
  if (!room) return undefined;
  const clamped = Math.min(4, Math.max(2, maxSeats));
  if (room.members.length > clamped) return room;
  return saveRoom({ ...room, maxSeats: clamped });
}
