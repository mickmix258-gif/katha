"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { characters as seedCharacters, tags as catalogTags } from "@/data/catalog";
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
  canPublishWorld,
  defaultCollaborators,
  getUserWorld,
  LOCAL_CREATOR,
  newId,
  publishedCharacters,
  readWorks,
  type UserWorld,
  upsertWorld,
} from "@/lib/user-works-store";
import type { Rating } from "@/data/catalog";

function blank(): UserWorld {
  const now = new Date().toISOString();
  return {
    kind: "world",
    id: newId("world"),
    creatorHandle: LOCAL_CREATOR,
    title: "",
    premise: "",
    setting: "",
    tone: "",
    lore: "",
    rating: "safe",
    tags: ["original"],
    residentIds: [],
    worldCards: [],
    collaborators: defaultCollaborators(),
    visibility: "public",
    status: "draft",
    playCount: 0,
    likeCount: 0,
    featured: false,
    publishedAt: now,
    updatedAt: now,
    coverStub: "",
  };
}

function WorldInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id");
  const [draft, setDraft] = useState<UserWorld | null>(null);
  const [msg, setMsg] = useState("");
  const [charOptions, setCharOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (id) setDraft(getUserWorld(id) ?? { ...blank(), id });
    else setDraft(blank());
    const userChars = readWorks().characters;
    const pub = publishedCharacters();
    const map = new Map<string, string>();
    seedCharacters.forEach((c) => map.set(c.id, c.name));
    [...userChars, ...pub].forEach((c) => map.set(c.id, c.name || c.id));
    setCharOptions([...map.entries()].map(([cid, name]) => ({ id: cid, name })));
  }, [id]);

  if (!draft) return <div className="mx-auto max-w-3xl px-4 py-10">กำลังโหลด…</div>;

  const patch = (p: Partial<UserWorld>) =>
    setDraft((d) => (d ? { ...d, ...p, updatedAt: new Date().toISOString() } : d));

  const toggleResident = (cid: string) => {
    const has = draft.residentIds.includes(cid);
    patch({
      residentIds: has ? draft.residentIds.filter((x) => x !== cid) : [...draft.residentIds, cid],
    });
  };

  const save = (publish: boolean) => {
    const next: UserWorld = { ...draft, updatedAt: new Date().toISOString() };
    if (publish) {
      const err = canPublishWorld(next);
      if (err) {
        setMsg(err);
        return;
      }
      next.status = next.visibility === "public" ? "pending_moderation" : "published";
      next.publishedAt = new Date().toISOString();
    } else {
      next.status = "draft";
    }
    upsertWorld(next);
    setDraft(next);
    setMsg(publish ? "เผยแพร่โลกแล้ว" : "บันทึกฉบับร่างแล้ว");
    if (publish) router.push(`/worlds/${next.id}`);
    else router.replace(`/create/world?id=${next.id}`);
  };

  return (
    <EditorShell title="สร้าง / แก้โลก" subtitle="ผู้อยู่อาศัย · ใบโลก · โทนและตำนาน">
      <StatusBanner status={draft.status} visibility={draft.visibility} />
      {msg ? <p className="text-sm text-[var(--accent-2)]">{msg}</p> : null}

      <Field label="ชื่อโลก *">
        <TextInput value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
      </Field>
      <Field label="ภาพปก (stub URL หรือคำอธิบาย)">
        <TextInput
          value={draft.coverStub ?? ""}
          onChange={(e) => patch({ coverStub: e.target.value })}
          placeholder="เช่น gradient-cinnabar หรือ https://…"
        />
      </Field>
      <Field label="บทนำ *">
        <TextArea value={draft.premise} onChange={(e) => patch({ premise: e.target.value })} />
      </Field>
      <Field label="โทน">
        <TextInput value={draft.tone} onChange={(e) => patch({ tone: e.target.value })} />
      </Field>
      <Field label="ฉากหลัง / setting">
        <TextArea value={draft.setting} onChange={(e) => patch({ setting: e.target.value })} />
      </Field>
      <Field label="ตำนาน / lore">
        <TextArea value={draft.lore} onChange={(e) => patch({ lore: e.target.value })} className="min-h-[140px]" />
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
          onChange={(e) => patch({ visibility: e.target.value as UserWorld["visibility"] })}
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
      <Field label="ผู้อยู่อาศัย / residents" hint="เลือกจากแค็ตตาล็อก + ผลงานของคุณ">
        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {charOptions.map((c) => {
            const on = draft.residentIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleResident(c.id)}
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

export default function WorldCreatePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">กำลังโหลด…</div>}>
      <WorldInner />
    </Suspense>
  );
}
