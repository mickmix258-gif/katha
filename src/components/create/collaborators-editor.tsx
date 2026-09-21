"use client";

import type { Collaborator, CollaboratorRole } from "@/lib/user-works-store";
import { Field, Select, TextInput, SecondaryButton } from "./form-ui";

const ROLES: { value: CollaboratorRole; label: string }[] = [
  { value: "owner", label: "เจ้าของ" },
  { value: "editor", label: "แก้ไขได้" },
  { value: "credited", label: "เครดิต" },
];

export function CollaboratorsEditor({
  value,
  onChange,
}: {
  value: Collaborator[];
  onChange: (next: Collaborator[]) => void;
}) {
  const add = () => {
    if (value.length >= 5) return;
    onChange([...value, { handle: "", role: "credited" }]);
  };

  return (
    <Field label="ผู้ร่วมสร้าง (สูงสุด 5)" hint="stub — เก็บใน localStorage / แค็ตตาล็อก">
      <div className="grid gap-2">
        {value.map((row, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <TextInput
              placeholder="handle"
              value={row.handle}
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...row, handle: e.target.value.replace(/^@/, "") };
                onChange(next);
              }}
              className="min-w-[140px] flex-1"
            />
            <Select
              value={row.role}
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...row, role: e.target.value as CollaboratorRole };
                onChange(next);
              }}
              className="w-36"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            <SecondaryButton
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              disabled={row.role === "owner" && value.filter((c) => c.role === "owner").length <= 1}
            >
              ลบ
            </SecondaryButton>
          </div>
        ))}
        <SecondaryButton type="button" onClick={add} disabled={value.length >= 5}>
          เพิ่มผู้ร่วม
        </SecondaryButton>
      </div>
    </Field>
  );
}
