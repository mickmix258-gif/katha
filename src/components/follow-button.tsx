"use client";

import { useEffect, useState } from "react";
import { readSocial, toggleFollow } from "@/lib/interaction-store";
import { pushNotification } from "@/lib/notification-store";

export function FollowButton({ handle }: { handle: string }) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const sync = () => setFollowing(readSocial().following.includes(handle));
    sync();
    window.addEventListener("katha-social", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("katha-social", sync);
      window.removeEventListener("storage", sync);
    };
  }, [handle]);

  return (
    <button
      type="button"
      onClick={() => {
        const nowFollowing = toggleFollow(handle);
        setFollowing(nowFollowing);
        if (nowFollowing) {
          pushNotification({
            type: "follow",
            title: `ติดตาม @${handle}`,
            body: "คุณเริ่มติดตามครีเอเตอร์นี้แล้ว",
            href: `/c/${handle}`,
            payload: { handle },
          });
        }
      }}
      className={`mt-4 rounded-full px-5 py-2 text-sm ${
        following ? "bg-[var(--accent)] text-black" : "border border-[var(--line)]"
      }`}
    >
      {following ? "ติดตามแล้ว" : "ติดตาม"}
    </button>
  );
}
