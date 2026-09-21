"use client";

import type { ScenarioDraft } from "@/lib/user-works-store";
import { newId } from "@/lib/user-works-store";
import { Field, TextInput, TextArea, Select, SecondaryButton } from "./form-ui";

export function ScenariosEditor({
  value,
  onChange,
}: {
  value: ScenarioDraft[];
  onChange: (next: ScenarioDraft[]) => void;
}) {
  const add = () => {
    onChange([
      ...value,
      {
        id: newId("scen"),
        title: "",
        description: "",
        prompt: "",
        firstMessage: "",
        tags: [],
        rating: "safe",
      },
    ]);
  };

  return (
    <Field label="บทเปิด (0–N)" hint="แนบกับตัวละคร — เลือกตอนเริ่มบทใน M4">
      <div className="grid gap-4">
        {value.map((s, i) => (
          <div key={s.id} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-[var(--accent-2)]">บทเปิด #{i + 1}</p>
              <SecondaryButton type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                ลบ
              </SecondaryButton>
            </div>
            <div className="grid gap-3">
              <TextInput
                placeholder="ชื่อบทเปิด"
                value={s.title}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...s, title: e.target.value };
                  onChange(next);
                }}
              />
              <TextArea
                placeholder="คำอธิบาย"
                value={s.description}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...s, description: e.target.value };
                  onChange(next);
                }}
              />
              <TextArea
                placeholder="พรอมต์เปิดเรื่อง"
                value={s.prompt}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...s, prompt: e.target.value };
                  onChange(next);
                }}
              />
              <TextArea
                placeholder="ข้อความแรก"
                value={s.firstMessage}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...s, firstMessage: e.target.value };
                  onChange(next);
                }}
              />
              <TextInput
                placeholder="แท็ก คั่นด้วยจุลภาค"
                value={s.tags.join(", ")}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = {
                    ...s,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  };
                  onChange(next);
                }}
              />
              <Select
                value={s.rating}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...s, rating: e.target.value as "safe" | "mature" };
                  onChange(next);
                }}
              >
                <option value="safe">ทั่วไป</option>
                <option value="mature">ผู้ใหญ่</option>
              </Select>
            </div>
          </div>
        ))}
        <SecondaryButton type="button" onClick={add}>
          เพิ่มบทเปิด
        </SecondaryButton>
      </div>
    </Field>
  );
}
