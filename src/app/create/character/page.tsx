"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tags as catalogTags } from "@/data/catalog";
import { CollaboratorsEditor } from "@/components/create/collaborators-editor";
import { ScenariosEditor } from "@/components/create/scenarios-editor";
import { SandboxStub } from "@/components/create/sandbox-stub";
import {
  ActionRow,
  AgeGateNote,
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
import type { Intensity as CatalogIntensity, Rating } from "@/data/catalog";

function blank(): UserCharacter {
  const now = new Date().toISOString();
  return {
    kind: "character",
    id: newId("char"),
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

function FullInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id");
  const [draft, setDraft] = useState<UserCharacter | null>(null);
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (id) {
      const found = getUserCharacter(id);
      setDraft(found ?? { ...blank(), id });
    } else {
      setDraft(blank());
    }
    setReady(true);
  }, [id]);

  if (!ready || !draft) {
    return <div className="mx-auto max-w-3xl px-4 py-10">กำลังโหลดตัวแก้ไข…</div>;
  }

  const patch = (p: Partial<UserCharacter>) =>
    setDraft((d) => (d ? { ...d, ...p, updatedAt: new Date().toISOString() } : d));

  const save = (publish: boolean) => {
    const age = enforceAdultAge(draft.age);
    if (age < 18) {
      setMsg("ตัวละครต้องอายุ 18 ปีขึ้นไป");
      return;
    }
    const next: UserCharacter = { ...draft, age, updatedAt: new Date().toISOString() };
    if (publish) {
      const err = canPublishCharacter(next);
      if (err) {
        setMsg(err);
        return;
      }
      next.status = next.visibility === "public" ? "pending_moderation" : "published";
      next.publishedAt = new Date().toISOString();
    } else {
      next.status = next.status === "pending_moderation" || next.status === "published" ? next.status : "draft";
      if (!publish && next.status === "draft") {
        /* keep draft */
      }
      if (!publish) next.status = "draft";
    }
    upsertCharacter(next);
    setDraft(next);
    setMsg(publish ? "เผยแพร่แล้ว · อาจแสดงสถานะรอตรวจ" : "บันทึกฉบับร่างแล้ว");
    if (publish) router.push(`/characters/${next.id}`);
    else router.replace(`/create/character?id=${next.id}`);
  };

  return (
    <EditorShell title="สร้างตัวละครแบบเต็ม" subtitle="ฟิลด์ครบตามสเปก M3 · ซ่อนคำสั่งระบบจากผู้ชมสาธารณะ">
      <AgeGateNote />
      <StatusBanner status={draft.status} visibility={draft.visibility} />
      {msg ? <p className="text-sm text-[var(--accent-2)]">{msg}</p> : null}

      <Field label="ชื่อ *">
        <TextInput value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
      </Field>
      <Field label="อายุ (ปี ≥ 18) *">
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
      <Field label="เพศที่นำเสนอ">
        <Select
          value={draft.genderPresentation}
          onChange={(e) => patch({ genderPresentation: e.target.value })}
        >
          <option value="female">หญิง</option>
          <option value="male">ชาย</option>
          <option value="nonbinary">นอนไบนารี</option>
          <option value="unspecified">ไม่ระบุ</option>
        </Select>
      </Field>
      <Field label="หน้าตา / appearance prompt">
        <TextArea value={draft.appearancePrompt} onChange={(e) => patch({ appearancePrompt: e.target.value })} />
      </Field>
      <Field label="บุคลิก">
        <TextArea value={draft.personality} onChange={(e) => patch({ personality: e.target.value })} />
      </Field>
      <Field label="วิธีพูด">
        <TextInput value={draft.speakingStyle} onChange={(e) => patch({ speakingStyle: e.target.value })} />
      </Field>
      <Field label="คำทักทาย / ข้อความแรก">
        <TextArea value={draft.greeting} onChange={(e) => patch({ greeting: e.target.value })} />
      </Field>
      <Field label="บทสนทนาตัวอย่าง (3–6 เทิร์น)">
        <TextArea
          value={draft.exampleDialogues}
          onChange={(e) => patch({ exampleDialogues: e.target.value })}
          className="min-h-[140px]"
        />
      </Field>
      <Field label="คำสั่งระบบ (ซ่อน)" hint="ไม่เคยแสดงบนหน้ารายละเอียดสำหรับผู้ชมนิรนาม">
        <TextArea
          value={draft.systemInstruction}
          onChange={(e) => patch({ systemInstruction: e.target.value })}
          className="min-h-[140px]"
        />
      </Field>
      <Field label="การมองเห็นคำสั่งระบบ">
        <Select
          value={draft.systemInstructionVisibility}
          onChange={(e) =>
            patch({ systemInstructionVisibility: e.target.value as PromptVisibility })
          }
        >
          <option value="owner">เจ้าของเท่านั้น</option>
          <option value="collaborators">เจ้าของ + ผู้ร่วม</option>
          <option value="nobody">ไม่มีใครเห็นใน UI (ใช้ตอนเล่น)</option>
        </Select>
      </Field>
      <Field label="สิ่งที่ห้าม">
        <TextArea value={draft.forbiddenTopics} onChange={(e) => patch({ forbiddenTopics: e.target.value })} />
      </Field>
      <Field label="แท็ก">
        <TagPicker
          options={catalogTags.map((t) => ({ slug: t.slug, label: t.labelTh }))}
          value={draft.tags}
          onChange={(tags) => patch({ tags })}
        />
      </Field>
      <Field label="แฮชแท็กกำหนดเอง" hint="คั่นด้วยช่องว่าง เช่น #ห้องสมุดชาด">
        <TextInput
          value={draft.hashtags.join(" ")}
          onChange={(e) =>
            patch({
              hashtags: e.target.value
                .split(/\s+/)
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>
      <Field label="ความเข้ม NSFW">
        <Select
          value={draft.nsfwIntensity}
          onChange={(e) => patch({ nsfwIntensity: e.target.value as CatalogIntensity })}
        >
          <option value="off">ปิด</option>
          <option value="suggestive">ยั่วยวน</option>
          <option value="explicit">โจ่งแจ้ง</option>
        </Select>
      </Field>
      <Field label="เรตติ้ง">
        <Select value={draft.rating} onChange={(e) => patch({ rating: e.target.value as Rating })}>
          <option value="safe">ทั่วไป</option>
          <option value="mature">ผู้ใหญ่</option>
        </Select>
      </Field>
      <Field label="การมองเห็นผลงาน">
        <Select
          value={draft.visibility}
          onChange={(e) => patch({ visibility: e.target.value as UserCharacter["visibility"] })}
        >
          <option value="public">สาธารณะ (อาจรอตรวจ)</option>
          <option value="unlisted">ไม่ลิสต์</option>
          <option value="private">ส่วนตัว</option>
        </Select>
      </Field>

      <ScenariosEditor value={draft.scenarios} onChange={(scenarios) => patch({ scenarios })} />
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
        <Link href="/create/quick-character" className="text-sm text-[var(--muted)] underline">
          สร้างเร็ว
        </Link>
      </ActionRow>
    </EditorShell>
  );
}

export default function FullCharacterPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">กำลังโหลด…</div>}>
      <FullInner />
    </Suspense>
  );
}
