"use client";

import Link from "next/link";
import { ImageStudio } from "@/components/media/image-studio";
import { GroupSeatsPanel } from "@/components/group/group-seats-panel";
import {
  advanceTurn,
  allMembersInnerOptIn,
  createGroupRoom,
  getGroupRoom,
} from "@/lib/play/group-room-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getUserCharacter, newId } from "@/lib/user-works-store";
import { failMessageTh, generateImage } from "@/lib/media/image-store";
import { IMAGE_COST } from "@/lib/wallet-store";
import { assembleContext } from "@/lib/play/context";
import { downloadMarkdown, threadToMarkdown } from "@/lib/play/export-markdown";
import { getLlmAdapter } from "@/lib/play/llm-adapter";
import { buildAutoMemoryCard, buildManualMemory, buildSummary } from "@/lib/play/memory";
import { getPersona, readPersonas } from "@/lib/play/personas";
import { parseSlash } from "@/lib/play/slash";
import {
  activeMessages,
  createThread,
  deleteMemory,
  deleteThread,
  getThread,
  listThreadsByEntityId,
  saveThread,
  setLastRead,
  upsertMemory,
} from "@/lib/play/thread-store";
import {
  MODEL_OPTIONS,
  type PlayEntity,
  type PlayMessage,
  type PlayMode,
  type PlayThread,
  type ResponseLength,
} from "@/lib/play/types";

type Props = {
  mode: PlayMode;
  entity: PlayEntity;
  initialThreadId?: string;
  scenarioId?: string;
};

export function PlayRoom({ mode, entity, initialThreadId, scenarioId }: Props) {
  const [thread, setThread] = useState<PlayThread | null>(null);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamMonologue, setStreamMonologue] = useState("");
  const [streamContent, setStreamContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugText, setDebugText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [mobileTab, setMobileTab] = useState<"chat" | "memory" | "settings">("chat");
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const personas = useMemo(() => readPersonas(), []);

  const hydrate = useCallback(() => {
    if (initialThreadId) {
      const existing = getThread(initialThreadId);
      if (existing) {
        setThread(existing);
        return;
      }
    }
    const list = listThreadsByEntityId(entity.id);
    const match =
      list.find((t) => t.mode === mode) ??
      list[0] ??
      null;
    if (match && !initialThreadId) {
      setThread(match);
      return;
    }
    const scenarioOpening = resolveScenarioOpening(entity.id, scenarioId);
    const openingContent =
      scenarioOpening ||
      entity.openingNarration ||
      entity.greeting ||
      `เริ่มบทกับ ${entity.title}`;
    const openingRole: PlayMessage["role"] = entity.openingNarration && !scenarioOpening
      ? "narrator"
      : "assistant";
    const created = createThread({
      mode,
      entityId: entity.id,
      entityTitle: entity.title,
      opening: { role: openingRole, content: openingContent },
      scenarioId,
    });
    setThread(created);
  }, [entity, mode, initialThreadId, scenarioId]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onStorage = () => {
      if (!thread) return;
      const fresh = getThread(thread.id);
      if (fresh) setThread(fresh);
    };
    window.addEventListener("katha-threads", onStorage);
    return () => window.removeEventListener("katha-threads", onStorage);
  }, [thread]);

  const messages = thread ? activeMessages(thread) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (thread && messages.length) {
      const last = messages[messages.length - 1];
      setLastRead(thread.id, last.id);
    }
    // intentionally depend on length + stream cursor, not full messages array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, streamContent, thread?.id]);

  const persist = (next: PlayThread) => {
    const saved = saveThread(next);
    setThread(saved);
    return saved;
  };

  const abortStream = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  };

  const runAssistant = async (
    base: PlayThread,
    msgs: PlayMessage[],
    userTurn: string,
    replaceAssistantId?: string,
  ) => {
    setError(null);
    setStreaming(true);
    setStreamMonologue("");
    setStreamContent("");
    const ctx = assembleContext({
      entity,
      thread: base,
      messages: msgs,
      userTurn,
    });
    setDebugText(ctx.promptText);

    const controller = new AbortController();
    abortRef.current = controller;
    let monologue = "";
    let content = "";

    try {
      const adapter = getLlmAdapter();
      for await (const chunk of adapter.stream({
        entity,
        thread: base,
        context: ctx,
        userTurn,
        signal: controller.signal,
      })) {
        if (chunk.type === "monologue" && chunk.text) {
          monologue += chunk.text;
          setStreamMonologue(monologue);
        } else if (chunk.type === "content" && chunk.text) {
          content += chunk.text;
          setStreamContent(content);
        }
      }

      const assistantMsg: PlayMessage = {
        id: replaceAssistantId ?? newId("msg"),
        role: entity.mode === "scene" || entity.mode === "world" ? "assistant" : "assistant",
        content,
        monologue: base.settings.innerMonologue && monologue ? monologue : undefined,
        createdAt: new Date().toISOString(),
        branchId: base.activeBranchId,
      };

      let nextMessages: PlayMessage[];
      if (replaceAssistantId) {
        nextMessages = msgs.map((m) => (m.id === replaceAssistantId ? assistantMsg : m));
      } else {
        nextMessages = [...msgs, assistantMsg];
      }

      let turnCount = base.turnCount;
      if (!replaceAssistantId) turnCount += 1;

      let memoryCards = base.memoryCards;
      const auto = buildAutoMemoryCard(nextMessages, turnCount);
      if (auto && !memoryCards.some((c) => c.turnIndex === auto.turnIndex)) {
        memoryCards = [...memoryCards, auto];
        setSystemNotice(`สร้างใบจำอัตโนมัติ: ${auto.title}`);
      }

      persist({
        ...base,
        messages: mergeBranchMessages(base, nextMessages),
        turnCount,
        memoryCards,
      });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") {
        if (content || monologue) {
          const partial: PlayMessage = {
            id: replaceAssistantId ?? newId("msg"),
            role: "assistant",
            content: content || "(ยกเลิก)",
            monologue: monologue || undefined,
            createdAt: new Date().toISOString(),
            branchId: base.activeBranchId,
          };
          const nextMessages = replaceAssistantId
            ? msgs.map((m) => (m.id === replaceAssistantId ? partial : m))
            : [...msgs, partial];
          persist({
            ...base,
            messages: mergeBranchMessages(base, nextMessages),
            turnCount: replaceAssistantId ? base.turnCount : base.turnCount + 1,
          });
        }
      } else {
        setError("สร้างคำตอบไม่สำเร็จ");
      }
    } finally {
      setStreaming(false);
      setStreamMonologue("");
      setStreamContent("");
      abortRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!thread || streaming) return;
    const text = draft.trim();
    if (!text) return;

    const slash = parseSlash(text);
    if (slash) {
      setDraft("");
      await handleSlash(slash);
      return;
    }

    const userMsg: PlayMessage = {
      id: newId("msg"),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      branchId: thread.activeBranchId,
    };
    const msgs = [...activeMessages(thread), userMsg];
    const next = persist({
      ...thread,
      messages: mergeBranchMessages(thread, msgs),
    });
    setDraft("");
    await runAssistant(next, msgs, text);
    if (mode === "group" && next.groupRoomId) {
      advanceTurn(next.groupRoomId);
    }
  };

  const handleSlash = async (
    slash: NonNullable<ReturnType<typeof parseSlash>>,
  ) => {
    if (!thread) return;
    if (slash.kind === "reset") {
      deleteThread(thread.id);
      const openingContent =
        entity.openingNarration || entity.greeting || `เริ่มบทกับ ${entity.title}`;
      const created = createThread({
        mode,
        entityId: entity.id,
        entityTitle: entity.title,
        opening: {
          role: entity.openingNarration ? "narrator" : "assistant",
          content: openingContent,
        },
        scenarioId,
        settings: thread.settings,
      });
      setThread(created);
      setSystemNotice("รีเซ็ตบทแล้ว");
      return;
    }
    if (slash.kind === "summary") {
      const msgs = activeMessages(thread);
      const summary = buildSummary(msgs, thread.summary);
      persist({ ...thread, summary });
      setSystemNotice("อัปเดตสรุปบทแล้ว");
      return;
    }
    if (slash.kind === "memory") {
      const msgs = activeMessages(thread);
      const card = buildManualMemory(msgs, slash.n, thread.turnCount);
      upsertMemory(thread.id, card);
      setThread(getThread(thread.id) ?? thread);
      setSystemNotice(`สร้างใบจำจาก ${slash.n} ข้อความล่าสุด`);
      return;
    }
    if (slash.kind === "note") {
      const card = {
        id: newId("mem"),
        title: "โน้ต",
        body: slash.text,
        pinned: true,
        createdAt: new Date().toISOString(),
        turnIndex: thread.turnCount,
      };
      upsertMemory(thread.id, card);
      setThread(getThread(thread.id) ?? thread);
      setSystemNotice("บันทึกโน้ตแล้ว");
      return;
    }
    if (slash.kind === "image") {
      const prompt =
        slash.prompt.trim() ||
        `ภาพของ ${entity.title}` +
          (entity.premise ? ` — ${entity.premise.slice(0, 80)}` : "");
      setSystemNotice("กำลังสร้างภาพจากโมเดล…");
      const result = await generateImage({
        prompt,
        threadId: thread.id,
        entityTitle: entity.title,
      });
      if (!result.ok) {
        if (result.reason === "empty_prompt") {
          setSystemNotice("ใส่พรอมต์หลัง /image เช่น /image แสงจันทร์ในห้องสมุด");
        } else {
          setSystemNotice(failMessageTh(result));
        }
        return;
      }
      setSystemNotice(
        `จากโมเดลจริง (−${IMAGE_COST}) · ยอด ${result.balance} · ดูในแกลเลอรีหรือแผงภาพ`,
      );
      return;
    }
    if (slash.kind === "unknown") {
      setSystemNotice(`ไม่รู้จักคำสั่ง ${slash.raw}`);
    }
  };

  const regenerateLast = async () => {
    if (!thread || streaming) return;
    const msgs = activeMessages(thread);
    const lastAsstIdx = [...msgs].map((m, i) => ({ m, i })).reverse().find(
      ({ m }) => m.role === "assistant" || m.role === "narrator",
    );
    if (!lastAsstIdx) return;
    const lastUser = [...msgs].slice(0, lastAsstIdx.i).reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const without = msgs.filter((m) => m.id !== lastAsstIdx.m.id);
    const next = persist({
      ...thread,
      messages: mergeBranchMessages(thread, without),
      turnCount: Math.max(0, thread.turnCount - 1),
    });
    await runAssistant(next, without, lastUser.content);
  };

  const branchFrom = (msgId: string) => {
    if (!thread) return;
    const msgs = activeMessages(thread);
    const idx = msgs.findIndex((m) => m.id === msgId);
    if (idx < 0) return;
    const branchId = newId("branch");
    const cloned = msgs.slice(0, idx + 1).map((m) => ({
      ...m,
      id: newId("msg"),
      branchId,
      parentId: m.id,
    }));
    const now = new Date().toISOString();
    persist({
      ...thread,
      activeBranchId: branchId,
      branches: [
        ...thread.branches,
        {
          id: branchId,
          name: `สาขา ${thread.branches.length + 1}`,
          forkedFromMessageId: msgId,
          createdAt: now,
        },
      ],
      messages: [...thread.messages, ...cloned],
    });
    setSystemNotice("แยกสาขาแล้ว");
  };

  const deleteMessage = (msgId: string) => {
    if (!thread || streaming) return;
    const msgs = activeMessages(thread).filter((m) => m.id !== msgId);
    persist({
      ...thread,
      messages: mergeBranchMessages(thread, msgs),
    });
  };

  const commitEdit = () => {
    if (!thread || !editId) return;
    const msgs = activeMessages(thread).map((m) =>
      m.id === editId ? { ...m, content: editText, edited: true } : m,
    );
    persist({
      ...thread,
      messages: mergeBranchMessages(thread, msgs),
    });
    setEditId(null);
    setEditText("");
  };

  const startFresh = () => {
    if (streaming) abortStream();
    const openingContent =
      entity.openingNarration || entity.greeting || `เริ่มบทกับ ${entity.title}`;
    if (mode === "group") {
      const kind = thread?.groupEntityKind ?? "character";
      const { room, thread: created } = createGroupRoom({
        entityKind: kind,
        entityId: entity.id,
        entityTitle: entity.title,
        opening: {
          role: entity.openingNarration ? "narrator" : "assistant",
          content: openingContent,
        },
      });
      window.location.assign(`/room/${room.threadId}`);
      setThread(created);
      return;
    }
    const created = createThread({
      mode,
      entityId: entity.id,
      entityTitle: entity.title,
      opening: {
        role: entity.openingNarration ? "narrator" : "assistant",
        content: openingContent,
      },
      scenarioId,
    });
    setThread(created);
  };

  const patchSettings = (patch: Partial<PlayThread["settings"]>) => {
    if (!thread) return;
    persist({ ...thread, settings: { ...thread.settings, ...patch } });
  };

  if (!thread) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--muted)]">กำลังเปิดห้องบท…</div>
    );
  }

  const persona = getPersona(thread.settings.personaId);
  const backHref =
    mode === "character"
      ? `/characters/${entity.id}`
      : mode === "world"
        ? `/worlds/${entity.id}`
        : mode === "group"
          ? thread.groupEntityKind === "scene"
            ? `/scenes/${entity.id}`
            : `/characters/${entity.id}`
          : `/scenes/${entity.id}`;

  const groupRoom =
    mode === "group" && thread.groupRoomId
      ? getGroupRoom(thread.groupRoomId)
      : undefined;
  const groupInnerAllowed = groupRoom ? allMembersInnerOptIn(groupRoom) : true;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col gap-3 px-3 py-4 lg:flex-row">
      {/* Left chrome */}
      <aside className="hidden w-56 shrink-0 flex-col gap-3 lg:flex">
        <Link href={backHref} className="text-sm text-[var(--accent-2)]">
          ← กลับรายละเอียด
        </Link>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <p className="text-xs tracking-[0.2em] text-[var(--accent-2)]">
            {modeLabel(mode)}
          </p>
          <h1 className="mt-2 text-xl leading-snug">{entity.title}</h1>
          {entity.premise ? (
            <p className="mt-2 text-xs text-[var(--muted)] line-clamp-4">{entity.premise}</p>
          ) : null}
          {entity.npcNames.length > 1 ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              NPC: {entity.npcNames.join(", ")}
            </p>
          ) : null}
          {/* Never show systemInstruction to anonymous / non-owner UI chrome */}
          {entity.isOwner && entity.systemInstruction ? (
            <p className="mt-3 text-[10px] text-[var(--muted)]">
              (เจ้าของ) มีคำสั่งระบบในบริบท — ไม่แสดงต่อสาธารณะ
            </p>
          ) : null}
        </div>
        {mode === "group" && thread.groupRoomId ? (
          <GroupSeatsPanel
            roomId={thread.groupRoomId}
            onChange={() => setThread(getThread(thread.id) ?? thread)}
          />
        ) : null}
        <button
          type="button"
          onClick={() => setShowDebug((v) => !v)}
          className="rounded-xl border border-[var(--line)] px-3 py-2 text-left text-xs text-[var(--muted)]"
        >
          {showDebug ? "ซ่อน" : "แสดง"} แผงบริบท (dev)
        </button>
        {showDebug ? (
          <pre className="max-h-64 overflow-auto rounded-xl border border-[var(--line)] bg-[var(--ink)] p-2 text-[10px] text-[var(--muted)] whitespace-pre-wrap">
            {debugText || "(ส่งข้อความเพื่อประกอบบริบท)"}
            {"\n\nlore ids: "}
            {entity.loreCards.map((c) => c.id).join(", ") || "—"}
          </pre>
        ) : null}
      </aside>

      {/* Center chat */}
      <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
          <div>
            <p className="text-sm font-medium">{entity.title}</p>
            <p className="text-xs text-[var(--muted)]">
              สาขา: {thread.branches.find((b) => b.id === thread.activeBranchId)?.name ?? "หลัก"} ·
              เทิร์น {thread.turnCount} · ตัวตน {persona.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowImagePanel((v) => !v)}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
            >
              {showImagePanel ? "ซ่อนภาพ" : "สร้างภาพ"}
            </button>
            <button
              type="button"
              onClick={startFresh}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
            >
              บทใหม่
            </button>
            <button
              type="button"
              onClick={() =>
                downloadMarkdown(
                  `katha-${entity.id}-${thread.id}.md`,
                  threadToMarkdown(thread),
                )
              }
              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
            >
              ส่งออก Markdown
            </button>
            <div className="flex gap-1 lg:hidden">
              {(["chat", "memory", "settings"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMobileTab(t)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    mobileTab === t
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--line)]"
                  }`}
                >
                  {t === "chat" ? "บท" : t === "memory" ? "ใบจำ" : "ตั้งค่า"}
                </button>
              ))}
            </div>
          </div>
        </header>

        {(mobileTab === "chat" || true) && (
          <div
            className={`flex min-h-0 flex-1 flex-col ${
              mobileTab !== "chat" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: "58vh" }}>
              {messages.map((m) => (
                <article
                  key={m.id}
                  className={`rounded-xl border border-[var(--line)] p-3 ${
                    m.role === "user" ? "bg-[var(--paper-2)] ml-6" : "mr-6 bg-[var(--ink)]"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--accent-2)]">
                      {roleLabel(m.role, entity.title)}
                      {m.edited ? " · แก้แล้ว" : ""}
                    </span>
                    <div className="flex gap-1 text-[10px] text-[var(--muted)]">
                      <button type="button" onClick={() => { setEditId(m.id); setEditText(m.content); }}>
                        แก้
                      </button>
                      <button type="button" onClick={() => branchFrom(m.id)}>
                        แยกสาขา
                      </button>
                      <button type="button" onClick={() => deleteMessage(m.id)}>
                        ลบ
                      </button>
                    </div>
                  </div>
                  {editId === m.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={commitEdit}
                          className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs text-white"
                        >
                          บันทึก
                        </button>
                        <button type="button" onClick={() => setEditId(null)} className="text-xs">
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {m.monologue ? (
                        <p className="mb-2 text-sm italic text-[var(--muted)]">
                          (ในใจ) {m.monologue}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap text-sm leading-7">{m.content}</p>
                    </>
                  )}
                </article>
              ))}
              {streaming ? (
                <article className="mr-6 rounded-xl border border-[var(--accent)] bg-[var(--ink)] p-3">
                  <p className="text-xs text-[var(--accent-2)]">กำลังสร้าง…</p>
                  {streamMonologue ? (
                    <p className="mt-1 text-sm italic text-[var(--muted)]">
                      (ในใจ) {streamMonologue}
                    </p>
                  ) : null}
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-7">
                    {streamContent}
                    <span className="animate-pulse">▍</span>
                  </p>
                </article>
              ) : null}
              <div ref={bottomRef} />
            </div>

            {systemNotice ? (
              <p className="border-t border-[var(--line)] px-4 py-2 text-xs text-[var(--accent-2)]">
                {systemNotice}
                <button type="button" className="ml-2 underline" onClick={() => setSystemNotice(null)}>
                  ปิด
                </button>
              </p>
            ) : null}
            {error ? (
              <p className="border-t border-[var(--line)] px-4 py-2 text-xs text-red-300">{error}</p>
            ) : null}


            {showImagePanel ? (
              <div className="border-t border-[var(--line)] p-3">
                <ImageStudio
                  compact
                  threadId={thread.id}
                  entityTitle={entity.title}
                  onGenerated={() =>
                    setSystemNotice("แนบภาพม็อกเข้าบทนี้แล้ว — ดูในแกลเลอรีได้")
                  }
                />
              </div>
            ) : null}

            <div className="border-t border-[var(--line)] p-3">
              <p className="mb-2 text-[10px] text-[var(--muted)]">
                คำสั่ง: /reset /summary /memory [N] /note … /image [พรอมต์]
              </p>
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  rows={2}
                  placeholder="พิมพ์บท… (Enter ส่ง, Shift+Enter ขึ้นบรรทัด)"
                  className="min-h-[52px] flex-1 resize-y rounded-xl border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm"
                  disabled={streaming}
                />
                <div className="flex flex-col gap-2">
                  {streaming ? (
                    <button
                      type="button"
                      onClick={abortStream}
                      className="rounded-full border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-2)]"
                    >
                      หยุด
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleSend()}
                      className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white"
                    >
                      ส่ง
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={streaming}
                    onClick={() => void regenerateLast()}
                    className="rounded-full border border-[var(--line)] px-3 py-1 text-xs disabled:opacity-40"
                  >
                    สร้างใหม่
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`border-t border-[var(--line)] p-4 lg:hidden ${mobileTab === "memory" ? "" : "hidden"}`}>
          <MemoryPanel
            thread={thread}
            onChange={() => setThread(getThread(thread.id) ?? thread)}
          />
        </div>
        <div className={`border-t border-[var(--line)] p-4 lg:hidden ${mobileTab === "settings" ? "" : "hidden"}`}>
          {mode === "group" && thread.groupRoomId ? (
            <div className="mb-3">
              <GroupSeatsPanel
                roomId={thread.groupRoomId}
                onChange={() => setThread(getThread(thread.id) ?? thread)}
              />
            </div>
          ) : null}
          <SettingsPanel
            thread={thread}
            personas={personas}
            onPatch={patchSettings}
            onBranch={(id) => {
              persist({ ...thread, activeBranchId: id });
            }}
          groupInnerAllowed={groupInnerAllowed}
          />
        </div>
      </section>

      {/* Right pane */}
      <aside className="hidden w-72 shrink-0 flex-col gap-3 lg:flex">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <h2 className="text-sm font-medium">ตั้งค่า</h2>
          <SettingsPanel
            thread={thread}
            personas={personas}
            onPatch={patchSettings}
            onBranch={(id) => {
              persist({ ...thread, activeBranchId: id });
            }}
          groupInnerAllowed={groupInnerAllowed}
          />
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <h2 className="text-sm font-medium">ใบจำ</h2>
          <MemoryPanel
            thread={thread}
            onChange={() => setThread(getThread(thread.id) ?? thread)}
          />
        </div>
      </aside>
    </div>
  );
}

function SettingsPanel({
  thread,
  personas,
  onPatch,
  onBranch,
  groupInnerAllowed = true,
}: {
  thread: PlayThread;
  personas: ReturnType<typeof readPersonas>;
  onPatch: (p: Partial<PlayThread["settings"]>) => void;
  onBranch: (branchId: string) => void;
  groupInnerAllowed?: boolean;
}) {
  return (
    <div className="mt-3 space-y-3 text-sm">
      <label className="block">
        <span className="text-xs text-[var(--muted)]">โมเดล</span>
        <select
          value={thread.settings.modelId}
          onChange={(e) => onPatch({ modelId: e.target.value })}
          className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--ink)] px-2 py-1"
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-[var(--muted)]">ความยาว</span>
        <select
          value={thread.settings.responseLength}
          onChange={(e) => onPatch({ responseLength: e.target.value as ResponseLength })}
          className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--ink)] px-2 py-1"
        >
          <option value="short">สั้น</option>
          <option value="medium">กลาง</option>
          <option value="long">ยาว</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-[var(--muted)]">
          อุณหภูมิ / โทน ({thread.settings.temperature.toFixed(1)})
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={thread.settings.temperature}
          onChange={(e) => onPatch({ temperature: Number(e.target.value) })}
          className="mt-1 w-full"
        />
        <input
          value={thread.settings.tone}
          onChange={(e) => onPatch({ tone: e.target.value })}
          className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--ink)] px-2 py-1 text-xs"
          placeholder="โทน"
        />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={Boolean(thread.settings.innerMonologue && groupInnerAllowed)}
          disabled={!groupInnerAllowed}
          onChange={(e) => onPatch({ innerMonologue: e.target.checked })}
        />
        บทในใจ{!groupInnerAllowed ? " (กลุ่ม: ต้องยินยอมครบ)" : ""}
      </label>
      <label className="block">
        <span className="text-xs text-[var(--muted)]">ตัวตน</span>
        <select
          value={thread.settings.personaId}
          onChange={(e) => onPatch({ personaId: e.target.value })}
          className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--ink)] px-2 py-1"
        >
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {thread.branches.length > 1 ? (
        <label className="block">
          <span className="text-xs text-[var(--muted)]">สาขา</span>
          <select
            value={thread.activeBranchId}
            onChange={(e) => onBranch(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--ink)] px-2 py-1"
          >
            {thread.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {thread.summary ? (
        <div className="rounded-lg border border-[var(--line)] p-2 text-xs text-[var(--muted)]">
          <p className="text-[var(--accent-2)]">สรุป</p>
          <p className="mt-1 whitespace-pre-wrap line-clamp-6">{thread.summary}</p>
        </div>
      ) : null}
    </div>
  );
}

function MemoryPanel({
  thread,
  onChange,
}: {
  thread: PlayThread;
  onChange: () => void;
}) {
  if (!thread.memoryCards.length) {
    return (
      <p className="mt-2 text-xs text-[var(--muted)]">
        ยังไม่มีใบจำ — สร้างอัตโนมัติทุก 8 เทิร์น หรือใช้ /memory
      </p>
    );
  }
  return (
    <ul className="mt-3 space-y-2">
      {thread.memoryCards
        .slice()
        .sort((a, b) => Number(b.pinned) - Number(a.pinned))
        .map((card) => (
          <li key={card.id} className="rounded-xl border border-[var(--line)] p-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">
                {card.pinned ? "📌 " : ""}
                {card.title}
              </p>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    upsertMemory(thread.id, { ...card, pinned: !card.pinned });
                    onChange();
                  }}
                >
                  {card.pinned ? "เลิกปัก" : "ปัก"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const body = window.prompt("แก้ใบจำ", card.body);
                    if (body == null) return;
                    upsertMemory(thread.id, { ...card, body });
                    onChange();
                  }}
                >
                  แก้
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteMemory(thread.id, card.id);
                    onChange();
                  }}
                >
                  ลบ
                </button>
              </div>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-[var(--muted)]">{card.body}</p>
          </li>
        ))}
    </ul>
  );
}

function mergeBranchMessages(thread: PlayThread, active: PlayMessage[]): PlayMessage[] {
  const others = thread.messages.filter((m) => m.branchId !== thread.activeBranchId);
  return [...others, ...active];
}

function roleLabel(role: string, title: string) {
  if (role === "user") return "คุณ";
  if (role === "narrator") return "บรรยาย";
  if (role === "system") return "ระบบ";
  return title;
}

function modeLabel(mode: PlayMode) {
  if (mode === "character") return "ตัวละคร";
  if (mode === "scene") return "ฉากเรื่อง";
  if (mode === "world") return "โลก";
  if (mode === "group") return "ห้องกลุ่ม";
  return "หลายตัวละคร";
}

function resolveScenarioOpening(entityId: string, scenarioId?: string): string | undefined {
  if (!scenarioId) return undefined;
  const user = getUserCharacter(entityId);
  const scenario = user?.scenarios?.find((s) => s.id === scenarioId);
  if (scenario?.firstMessage) return scenario.firstMessage;
  if (scenario?.prompt) return scenario.prompt;
  return undefined;
}
