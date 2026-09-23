"use client";

import { newId, readWorks, writeWorks, type PublishStatus } from "@/lib/user-works-store";
import { pushNotification } from "@/lib/notification-store";
import { readSettings } from "@/lib/settings-store";

export type ModVerdict = "approve" | "decline" | "needs_review";

export type RejectReason =
  | "minor_content"
  | "spam"
  | "malware"
  | "copyright_seed"
  | "other";

export type ModTargetType = "character" | "scene" | "world" | "report";

export type ModerationJob = {
  id: string;
  targetType: ModTargetType;
  targetId: string;
  targetTitle: string;
  creatorHandle: string;
  /** AI stub verdict */
  aiVerdict: ModVerdict;
  aiReason?: string;
  /** Final human or auto-applied verdict */
  verdict: ModVerdict | "pending";
  reason?: RejectReason | string;
  reviewerId?: string;
  reportBody?: string;
  reporterHandle?: string;
  createdAt: string;
  updatedAt: string;
  status: "open" | "closed";
};

const KEY = "katha.moderation.v1";

export type ModerationState = {
  jobs: ModerationJob[];
};

function empty(): ModerationState {
  return { jobs: [] };
}

export function readModeration(): ModerationState {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as ModerationState;
    return { jobs: parsed.jobs ?? [] };
  } catch {
    return empty();
  }
}

export function writeModeration(state: ModerationState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("katha-moderation"));
}

const BLOCK_PATTERNS = [
  /\b(child|kid|เด็ก|เยาวชน|นักเรียนม\.|นักเรียนมัธยม)\b/i,
  /\b(csam|underage|minor)\b/i,
];

const SPAM_PATTERNS = [/\b(buy now|crypto airdrop|free $$$)\b/i, /(.)\1{12,}/];

/**
 * Mock AI pre-moderation — no real model call.
 */
export function moderateWorkStub(input: {
  title: string;
  body: string;
  rating?: string;
}): { verdict: ModVerdict; reason?: string } {
  const text = `${input.title}\n${input.body}`;
  for (const re of BLOCK_PATTERNS) {
    if (re.test(text)) {
      return { verdict: "decline", reason: "minor_content" };
    }
  }
  for (const re of SPAM_PATTERNS) {
    if (re.test(text)) {
      return { verdict: "decline", reason: "spam" };
    }
  }
  if (/needs.?review|ตรวจมือ|ทักทายพิเศษยาวมาก/.test(text)) {
    return { verdict: "needs_review", reason: "other" };
  }
  // mature public works occasionally need review for demo variety
  if (input.rating === "mature" && text.length > 900) {
    return { verdict: "needs_review", reason: "other" };
  }
  return { verdict: "approve" };
}

function applyWorkStatus(
  targetType: ModTargetType,
  targetId: string,
  status: PublishStatus,
) {
  if (targetType === "report") return;
  const works = readWorks();
  if (targetType === "character") {
    const idx = works.characters.findIndex((c) => c.id === targetId);
    if (idx >= 0) works.characters[idx] = { ...works.characters[idx], status };
  } else if (targetType === "scene") {
    const idx = works.scenes.findIndex((c) => c.id === targetId);
    if (idx >= 0) works.scenes[idx] = { ...works.scenes[idx], status };
  } else if (targetType === "world") {
    const idx = works.worlds.findIndex((c) => c.id === targetId);
    if (idx >= 0) works.worlds[idx] = { ...works.worlds[idx], status };
  }
  writeWorks(works);
}

export function enqueueModerationJob(input: {
  targetType: Exclude<ModTargetType, "report">;
  targetId: string;
  targetTitle: string;
  creatorHandle: string;
  body: string;
  rating?: string;
}): ModerationJob {
  const ai = moderateWorkStub({
    title: input.targetTitle,
    body: input.body,
    rating: input.rating,
  });
  const now = new Date().toISOString();
  const auto = readSettings().autoModerate;
  let verdict: ModerationJob["verdict"] = "pending";
  let status: ModerationJob["status"] = "open";
  let workStatus: PublishStatus = "pending_moderation";

  if (auto && ai.verdict === "approve") {
    verdict = "approve";
    status = "closed";
    workStatus = "published";
  } else if (auto && ai.verdict === "decline") {
    verdict = "decline";
    status = "closed";
    workStatus = "declined";
  } else {
    // needs_review or auto off → human queue
    verdict = "pending";
    status = "open";
    workStatus = "pending_moderation";
  }

  applyWorkStatus(input.targetType, input.targetId, workStatus);

  const job: ModerationJob = {
    id: newId("mod"),
    targetType: input.targetType,
    targetId: input.targetId,
    targetTitle: input.targetTitle,
    creatorHandle: input.creatorHandle,
    aiVerdict: ai.verdict,
    aiReason: ai.reason,
    verdict,
    reason: ai.reason,
    createdAt: now,
    updatedAt: now,
    status,
  };

  const state = readModeration();
  state.jobs.unshift(job);
  writeModeration(state);

  const verdictLabel =
    workStatus === "published"
      ? "ผ่าน"
      : workStatus === "declined"
        ? "ไม่ผ่าน"
        : "ต้องตรวจมือ";

  pushNotification({
    type: "moderation",
    title: `ผลตรวจ: ${input.targetTitle}`,
    body: `คำตัดสิน (stub): ${verdictLabel}${ai.reason ? ` · ${ai.reason}` : ""}`,
    href: "/studio/moderation",
    payload: { jobId: job.id, verdict: workStatus },
  });

  return job;
}

export function submitReport(input: {
  targetType: Exclude<ModTargetType, "report">;
  targetId: string;
  targetTitle: string;
  creatorHandle: string;
  body: string;
  reason: RejectReason;
}): ModerationJob {
  const now = new Date().toISOString();
  const job: ModerationJob = {
    id: newId("mod"),
    targetType: "report",
    targetId: input.targetId,
    targetTitle: input.targetTitle,
    creatorHandle: input.creatorHandle,
    aiVerdict: "needs_review",
    aiReason: input.reason,
    verdict: "pending",
    reason: input.reason,
    reportBody: input.body,
    reporterHandle: "me",
    createdAt: now,
    updatedAt: now,
    status: "open",
  };
  const state = readModeration();
  state.jobs.unshift(job);
  writeModeration(state);

  pushNotification({
    type: "report",
    title: "รับรายงานแล้ว",
    body: `รายงาน「${input.targetTitle}」เข้าคิวตรวจแล้ว`,
    href: "/studio/moderation",
    payload: { jobId: job.id },
  });

  return job;
}

export function resolveModerationJob(
  jobId: string,
  verdict: ModVerdict,
  reason?: string,
  reviewerId = "admin-me",
): ModerationJob | undefined {
  const state = readModeration();
  const idx = state.jobs.findIndex((j) => j.id === jobId);
  if (idx < 0) return undefined;
  const job = state.jobs[idx];
  const now = new Date().toISOString();
  const next: ModerationJob = {
    ...job,
    verdict,
    reason: reason ?? job.reason,
    reviewerId,
    updatedAt: now,
    status: verdict === "needs_review" ? "open" : "closed",
  };
  state.jobs[idx] = next;
  writeModeration(state);

  if (job.targetType !== "report") {
    const workStatus: PublishStatus =
      verdict === "approve"
        ? "published"
        : verdict === "decline"
          ? "declined"
          : "pending_moderation";
    applyWorkStatus(job.targetType, job.targetId, workStatus);

    pushNotification({
      type: "moderation",
      title: `แอดมินตัดสิน: ${job.targetTitle}`,
      body:
        verdict === "approve"
          ? "ผ่านการตรวจ — เผยแพร่แล้ว"
          : verdict === "decline"
            ? `ไม่ผ่าน${reason ? ` · ${reason}` : ""}`
            : "ยังต้องตรวจต่อ",
      href: "/studio/moderation",
      payload: { jobId, verdict },
    });
  }

  return next;
}

export function listOpenJobs(): ModerationJob[] {
  return readModeration().jobs.filter((j) => j.status === "open");
}

export function listAllJobs(): ModerationJob[] {
  return [...readModeration().jobs].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export const REJECT_REASON_LABELS: Record<RejectReason, string> = {
  minor_content: "เนื้อหาเกี่ยวกับผู้เยาว์",
  spam: "สแปม",
  malware: "มัลแวร์ / ลิงก์อันตราย",
  copyright_seed: "ละเมิดซีดอย่างเป็นทางการ",
  other: "อื่น ๆ",
};
