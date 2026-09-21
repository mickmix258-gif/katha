"use client";

import type { WorldCardDraft } from "@/lib/user-works-store";
import { Field, TextInput, TextArea, Select, SecondaryButton } from "./form-ui";

const TYPES = [
  { value: "location", label: "สถานที่" },
  { value: "faction", label: "กลุ่ม" },
  { value: "race", label: "เผ่าพันธุ์" },
  { value: "item", label: "วัตถุ" },
  { value: "character", label: "ตัวละคร" },
  { value: "custom", label: "อื่น ๆ" },
];

export function WorldCardsEditor({
  value,
  onChange,
}: {
  value: WorldCardDraft[];
  onChange: (next: WorldCardDraft[]) => void;
}) {
  const add = () => {
    onChange([...value, { title: "", type: "location", body: "", alwaysOn: false }]);
  };

  return (
    <Field label="ใบโลก (WorldCards)" hint="เชื่อมกับฉาก/โลก — lore engine เต็มใน M4">
      <div className="grid gap-3">
        {value.map((card, i) => (
          <div key={i} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <div className="mb-2 flex justify-end">
              <SecondaryButton type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                ลบ
              </SecondaryButton>
            </div>
            <div className="grid gap-2">
              <TextInput
                placeholder="ชื่อใบ"
                value={card.title}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...card, title: e.target.value };
                  onChange(next);
                }}
              />
              <Select
                value={card.type}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...card, type: e.target.value };
                  onChange(next);
                }}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <TextArea
                placeholder="เนื้อหา"
                value={card.body}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...card, body: e.target.value };
                  onChange(next);
                }}
              />
              <TextInput
                placeholder="คำกระตุ้น (คั่นด้วยจุลภาค)"
                value={card.triggerWords ?? ""}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...card, triggerWords: e.target.value };
                  onChange(next);
                }}
              />
              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={!!card.alwaysOn}
                  onChange={(e) => {
                    const next = [...value];
                    next[i] = { ...card, alwaysOn: e.target.checked };
                    onChange(next);
                  }}
                />
                เปิดตลอด (alwaysOn)
              </label>
            </div>
          </div>
        ))}
        <SecondaryButton type="button" onClick={add}>
          เพิ่มใบโลก
        </SecondaryButton>
      </div>
    </Field>
  );
}
