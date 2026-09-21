"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tags as catalogTags } from "@/data/catalog";
import { CollaboratorsEditor } from "@/components/create/collaborators-editor";
import { SandboxStub } from "@/components/create/sandbox-stub";
import {
  ActionRow,
  AgeGateNote,
  EditorShell,
  Field,
  PrimaryButton,
  SecondaryButton,
  StatusBanner,
  TagPicker,
  TextArea,
  TextInput,
  Select,
} from "@/components/create/form-ui";
import {
  autoFillCharacter,
  canPublishCharacter,
  defaultCollaborators,
  enforceAdultAge,
  getUserCharacter,
  LOCAL_CREATOR,
  newId,
  type PromptVisibility,
  type UserCharacter,
  upsertCharacter,
} from "@/lib/user-works-store";

function blank(id?: string): UserCharacter {
  const now = new Date().toISOString();
  return {
    kind: "character",
    id: id ?? newId("char"),
    creatorHandle: LOCAL_CREATOR,
    name: "",
    tagline: "",
    description: "",
    personality: "",
    speakingStyle: "",
    greeting: "",
    genderPresentation: "unspecified",
    appearancePrompt: "",
    exampleDialogues: "",
    systemInstruction: "",
    systemInstructionVisibility: "owner",
    forbiddenTopics: "",
    rating: "safe",
    nsfwIntensity: "off",
    tags: ["original"],
    hashtags: [],
    visibility: "public",
    age: 18,
    scenarios: [],
    collaborators: defaultCollaborators(),
    status: "draft",
    messageCount: 0,
    likeCount: 0,
    featured: false,
    publishedAt: now,
    updatedAt: now,
  };
}

function QuickInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const existingId = sp.get("id") ?? undefined;
  const initial = useMemo(() => {
    if (existingId) {
      const found = getUserCharacter(existingId);
      if (found) return found;
    }
    return blank(existingId);
  }, [existingId]);

  const [draft, setDraft] = useState<UserCharacter>(initial);
  const [seedPrompt, setSeedPrompt] = useState("");
  const [filled, setFilled] = useState(!!existingId && !!initial.description);
  const [msg, setMsg] = useState("");

  const patch = (p: Partial<UserCharacter>) => setDraft((d) => ({ ...d, ...p, updatedAt: new Date().toISOString() }));

  const runAutoFill = () => {
    if (!draft.name.trim() && !seedPrompt.trim()) {
      setMsg("ใส่ชื่อหรือพรอมต์ก่อน");
      return;
    }
    const filledFields = autoFillCharacter(draft.name, seedPrompt);
    setDraft((d) => ({
      ...d,
      ...filledFields,
      age: enforceAdultAge(d.age),
      updatedAt: new Date().toISOString(),
    }));
    setFilled(true);
    setMsg("เติมร่างแล้ว — ปรับแก้ได้ก่อนบันทึก");
  };

  const save = (publish: boolean) => {
    const age = enforceAdultAge(draft.age);
    const next: UserCharacter = {
      ...draft,
      age,
      updatedAt: new Date().toISOString(),
    };
    if (age < 18) {
      setMsg("ตัวละครต้องอายุ 18 ปีขึ้นไป");
      return;
    }
    if (publish) {
      const err = canPublishCharacter(next);
      if (err) {
        setMsg(err);
        return;
      }
      next.status = next.visibility === "public" ? "pending_moderation" : "published";
      next.publishedAt = new Date().toISOString();
    } else {
      next.status = "draft";
    }
    upsertCharacter(next);
    setDraft(next);
    setMsg(publish ? "เผยแพร่แล้ว — ดูได้ในสำรวจ/ตัวละคร" : "บันทึกฉบับร่างแล้ว");
    if (publish) router.push(`/characters/${next.id}`);
  };

  return (
    <EditorShell title="สร้างตัวละครแบบเร็ว" subtitle="ชื่อ + พรอมต์ → เติมร่างอัตโนมัติ (ไม่มี LLM)">
      <AgeGateNote />
      <StatusBanner status={draft.status} visibility={draft.visibility} />
      {msg ? <p className="text-sm text-[var(--accent-2)]">{msg}</p> : null}

      <Field label="ชื่อ">
        <TextInput value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="ชื่อตัวละคร" />
      </Field>
      <Field label="พรอมต์ตั้งต้น" hint="ระบบจะแตกเป็นคำโปรย คำอธิบาย บุคลิก คำสั่งระบบ">
        <TextArea
          value={seedPrompt}
          onChange={(e) => setSeedPrompt(e.target.value)}
          placeholder="เช่น บรรณารักษ์เมืองชาด อายุ 24 เสียงนุ่ม รู้เรื่องต้องห้าม…"
        />
      </Field>
      <ActionRow>
        <PrimaryButton type="button" onClick={runAutoFill}>
          เติมร่างอัตโนมัติ
        </PrimaryButton>
        <Link href="/create/character" className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm">
          เปิดฟอร์มเต็ม
        </Link>
      </ActionRow>

      {filled ? (
        <>
          <Field label="อายุ (ปี ≥ 18)">
            <TextInput
              type="number"
              min={18}
              value={draft.age}
              onChange={(e) => patch({ age: enforceAdultAge(Number(e.target.value)) })}
            />
          </Field>
          <Field label="คำโปรย">
            <TextInput value={draft.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
          </Field>
          <Field label="คำอธิบายที่คนเห็น">
            <TextArea value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
          </Field>
          <Field label="บุคลิก">
            <TextArea value={draft.personality} onChange={(e) => patch({ personality: e.target.value })} />
          </Field>
          <Field label="วิธีพูด">
            <TextInput value={draft.speakingStyle} onChange={(e) => patch({ speakingStyle: e.target.value })} />
          </Field>
          <Field label="คำทักทาย">
            <TextArea value={draft.greeting} onChange={(e) => patch({ greeting: e.target.value })} />
          </Field>
          <Field label="คำสั่งระบบ (ซ่อน)" hint="ไม่แสดงบนหน้ารายละเอียดสาธารณะ">
            <TextArea
              value={draft.systemInstruction}
              onChange={(e) => patch({ systemInstruction: e.target.value })}
            />
          </Field>
          <Field label="ใครเห็นคำสั่งระบบ">
            <Select
              value={draft.systemInstructionVisibility}
              onChange={(e) =>
                patch({ systemInstructionVisibility: e.target.value as PromptVisibility })
              }
            >
              <option value="owner">เจ้าของเท่านั้น</option>
              <option value="collaborators">เจ้าของ + ผู้ร่วม</option>
              <option value="nobody">ไม่มีใคร (เก็บไว้ใช้ตอนเล่น)</option>
            </Select>
          </Field>
          <Field label="แท็ก">
            <TagPicker
              options={catalogTags.map((t) => ({ slug: t.slug, label: t.labelTh }))}
              value={draft.tags}
              onChange={(tags) => patch({ tags })}
            />
          </Field>
          <Field label="เรตติ้ง">
            <Select value={draft.rating} onChange={(e) => patch({ rating: e.target.value as "safe" | "mature" })}>
              <option value="safe">ทั่วไป</option>
              <option value="mature">ผู้ใหญ่</option>
            </Select>
          </Field>
          <Field label="การมองเห็น">
            <Select
              value={draft.visibility}
              onChange={(e) =>
                patch({ visibility: e.target.value as UserCharacter["visibility"] })
              }
            >
              <option value="public">สาธารณะ</option>
              <option value="unlisted">ไม่ลิสต์</option>
              <option value="private">ส่วนตัว</option>
            </Select>
          </Field>
          <CollaboratorsEditor
            value={draft.collaborators}
            onChange={(collaborators) => patch({ collaborators })}
          />
          <SandboxStub entityName={draft.name} />
          <ActionRow>
            <SecondaryButton type="button" onClick={() => save(false)}>
              บันทึกฉบับร่าง
            </SecondaryButton>
            <PrimaryButton type="button" onClick={() => save(true)}>
              เผยแพร่
            </PrimaryButton>
            <button
              type="button"
              className="text-sm text-[var(--muted)] underline"
              onClick={() => {
                const age = enforceAdultAge(draft.age);
                upsertCharacter({ ...draft, age, status: "draft", updatedAt: new Date().toISOString() });
                router.push(`/create/character?id=${draft.id}`);
              }}
            >
              ไปฟอร์มเต็มด้วยร่างนี้
            </button>
          </ActionRow>
        </>
      ) : null}
    </EditorShell>
  );
}

export default function QuickCharacterPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">กำลังโหลด…</div>}>
      <QuickInner />
    </Suspense>
  );
}
