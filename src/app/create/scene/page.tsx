"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  characters as seedCharacters,
  tags as catalogTags,
  worlds as seedWorlds,
} from "@/data/catalog";
import { CollaboratorsEditor } from "@/components/create/collaborators-editor";
import { WorldCardsEditor } from "@/components/create/worldcards-editor";
import { SandboxStub } from "@/components/create/sandbox-stub";
import {
  ActionRow,
  EditorShell,
  Field,
  PrimaryButton,
  SecondaryButton,
  Select,
  StatusBanner,
  TagPicker,
  TextArea,
  TextInput,
} from "@/components/create/form-ui";
import {
  canPublishScene,
  defaultCollaborators,
  getUserScene,
  LOCAL_CREATOR,
  newId,
  publishedCharacters,
  publishedWorlds,
  readWorks,
  type UserScene,
  upsertScene,
} from "@/lib/user-works-store";
import type { Rating } from "@/data/catalog";

function blank(): UserScene {
  const now = new Date().toISOString();
  return {
    kind: "scene",
    id: newId("scene"),
    creatorHandle: LOCAL_CREATOR,
    worldId: undefined,
    title: "",
    premise: "",
    openingNarration: "",
    setting: "",
    tone: "",
    playerRole: "",
    rating: "safe",
    tags: ["original"],
    npcIds: [],
    worldCards: [],
    collaborators: defaultCollaborators(),
    visibility: "public",
    status: "draft",
    playCount: 0,
    likeCount: 0,
    featured: false,
    publishedAt: now,
    updatedAt: now,
  };
}

function SceneInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id");
  const [draft, setDraft] = useState<UserScene | null>(null);
  const [msg, setMsg] = useState("");
  const [charOptions, setCharOptions] = useState<{ id: string; name: string }[]>([]);
  const [worldOptions, setWorldOptions] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (id) setDraft(getUserScene(id) ?? { ...blank(), id });
    else setDraft(blank());

    const user = readWorks();
    const cmap = new Map<string, string>();
    seedCharacters.forEach((c) => cmap.set(c.id, c.name));
    [...user.characters, ...publishedCharacters()].forEach((c) => cmap.set(c.id, c.name || c.id));
    setCharOptions([...cmap.entries()].map(([cid, name]) => ({ id: cid, name })));

    const wmap = new Map<string, string>();
    seedWorlds.forEach((w) => wmap.set(w.id, w.title));
    [...user.worlds, ...publishedWorlds()].forEach((w) => wmap.set(w.id, w.title || w.id));
    setWorldOptions([...wmap.entries()].map(([wid, title]) => ({ id: wid, title })));
  }, [id]);

  if (!draft) return <div className="mx-auto max-w-3xl px-4 py-10">กำลังโหลด…</div>;

  const patch = (p: Partial<UserScene>) =>
    setDraft((d) => (d ? { ...d, ...p, updatedAt: new Date().toISOString() } : d));

  const toggleNpc = (cid: string) => {
    const has = draft.npcIds.includes(cid);
    patch({ npcIds: has ? draft.npcIds.filter((x) => x !== cid) : [...draft.npcIds, cid] });
  };

  const save = (publish: boolean) => {
    const next: UserScene = { ...draft, updatedAt: new Date().toISOString() };
    if (publish) {
      const err = canPublishScene(next);
      if (err) {
        setMsg(err);
        return;
      }
      next.status = next.visibility === "public" ? "pending_moderation" : "published";
      next.publishedAt = new Date().toISOString();
    } else {
      next.status = "draft";
    }
    upsertScene(next);
    setDraft(next);
    setMsg(publish ? "เผยแพร่ฉากแล้ว — ดูในสำรวจ/ฉากเรื่อง" : "บันทึกฉบับร่างแล้ว");
    if (publish) router.push(`/scenes/${next.id}`);
    else router.replace(`/create/scene?id=${next.id}`);
  };

  return (
    <EditorShell title="สร้าง / แก้ฉากเรื่อง" subtitle="บทเปิด · NPC · ใบโลก · เชื่อมโลก">
      <StatusBanner status={draft.status} visibility={draft.visibility} />
      {msg ? <p className="text-sm text-[var(--accent-2)]">{msg}</p> : null}

      <Field label="ชื่อฉาก *">
        <TextInput value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
      </Field>
      <Field label="บทนำ / premise *">
        <TextArea value={draft.premise} onChange={(e) => patch({ premise: e.target.value })} />
      </Field>
      <Field label="บทบรรยายเปิด">
        <TextArea
          value={draft.openingNarration}
          onChange={(e) => patch({ openingNarration: e.target.value })}
          className="min-h-[120px]"
        />
      </Field>
      <Field label="บทบาทผู้เล่น">
        <TextInput value={draft.playerRole} onChange={(e) => patch({ playerRole: e.target.value })} />
      </Field>
      <Field label="ฉากหลัง">
        <TextInput value={draft.setting} onChange={(e) => patch({ setting: e.target.value })} />
      </Field>
      <Field label="โทน">
        <TextInput value={draft.tone} onChange={(e) => patch({ tone: e.target.value })} />
      </Field>
      <Field label="โลกที่เชื่อม">
        <Select
          value={draft.worldId ?? ""}
          onChange={(e) => patch({ worldId: e.target.value || undefined })}
        >
          <option value="">— ไม่เชื่อม / สแตนด์อโลน —</option>
          {worldOptions.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="NPC ที่เชื่อม">
        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {charOptions.map((c) => {
            const on = draft.npcIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleNpc(c.id)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  on ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] text-[var(--muted)]"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="เรตติ้ง">
        <Select value={draft.rating} onChange={(e) => patch({ rating: e.target.value as Rating })}>
          <option value="safe">ทั่วไป</option>
          <option value="mature">ผู้ใหญ่</option>
        </Select>
      </Field>
      <Field label="การมองเห็น">
        <Select
          value={draft.visibility}
          onChange={(e) => patch({ visibility: e.target.value as UserScene["visibility"] })}
        >
          <option value="public">สาธารณะ</option>
          <option value="unlisted">ไม่ลิสต์</option>
          <option value="private">ส่วนตัว</option>
        </Select>
      </Field>
      <Field label="แท็ก">
        <TagPicker
          options={catalogTags.map((t) => ({ slug: t.slug, label: t.labelTh }))}
          value={draft.tags}
          onChange={(tags) => patch({ tags })}
        />
      </Field>
      <WorldCardsEditor value={draft.worldCards} onChange={(worldCards) => patch({ worldCards })} />
      <CollaboratorsEditor
        value={draft.collaborators}
        onChange={(collaborators) => patch({ collaborators })}
      />
      <SandboxStub entityName={draft.title} />
      <ActionRow>
        <SecondaryButton type="button" onClick={() => save(false)}>
          บันทึกฉบับร่าง
        </SecondaryButton>
        <PrimaryButton type="button" onClick={() => save(true)}>
          เผยแพร่
        </PrimaryButton>
        <Link href="/create" className="text-sm text-[var(--muted)] underline">
          กลับศูนย์สร้าง
        </Link>
      </ActionRow>
    </EditorShell>
  );
}

export default function SceneCreatePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">กำลังโหลด…</div>}>
      <SceneInner />
    </Suspense>
  );
}
