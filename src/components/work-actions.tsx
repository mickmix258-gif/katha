"use client";

import { useEffect, useState } from "react";
import {
  readSocial,
  toggleDislike,
  toggleLike,
  toggleSave,
} from "@/lib/interaction-store";
import { pushNotification } from "@/lib/notification-store";

export function WorkActions({
  workId,
  baseLikes = 0,
}: {
  workId: string;
  baseLikes?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [disliked, setDisliked] = useState(false);

  useEffect(() => {
    const sync = () => {
      const s = readSocial();
      setLiked(s.liked.includes(workId));
      setSaved(s.saved.includes(workId));
      setDisliked(s.disliked.includes(workId));
    };
    sync();
    window.addEventListener("katha-social", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("katha-social", sync);
      window.removeEventListener("storage", sync);
    };
  }, [workId]);

  function refresh() {
    const s = readSocial();
    setLiked(s.liked.includes(workId));
    setSaved(s.saved.includes(workId));
    setDisliked(s.disliked.includes(workId));
  }

  const shownLikes = baseLikes + (liked ? 1 : 0);

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => {
          const on = toggleLike(workId);
          refresh();
          if (on) {
            pushNotification({
              type: "like",
              title: "ถูกใจผลงาน",
              body: `คุณถูกใจผลงาน ${workId}`,
              payload: { workId },
            });
          }
        }}
        className={`rounded-full px-4 py-2 text-sm ${liked ? "bg-[var(--accent)] text-black" : "border border-[var(--line)]"}`}
      >
        ถูกใจ · {shownLikes.toLocaleString()}
      </button>
      <button
        type="button"
        onClick={() => {
          toggleSave(workId);
          refresh();
        }}
        className={`rounded-full px-4 py-2 text-sm ${saved ? "bg-[var(--accent-2)] text-black" : "border border-[var(--line)]"}`}
      >
        {saved ? "เก็บแล้ว" : "เก็บไว้"}
      </button>
      <button
        type="button"
        onClick={() => {
          toggleDislike(workId);
          refresh();
        }}
        className={`rounded-full px-4 py-2 text-sm ${disliked ? "border border-[var(--accent)]" : "border border-[var(--line)]"}`}
      >
        ไม่ถูกใจ
      </button>
    </div>
  );
}
