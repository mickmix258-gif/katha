"use client";

export type SocialState = {
  liked: string[];
  saved: string[];
  disliked: string[];
  following: string[];
};

const KEY = "katha.social.v1";

export const emptySocial = (): SocialState => ({
  liked: [],
  saved: [],
  disliked: [],
  following: [],
});

export function readSocial(): SocialState {
  if (typeof window === "undefined") return emptySocial();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySocial();
    const parsed = JSON.parse(raw) as SocialState;
    return {
      liked: parsed.liked ?? [],
      saved: parsed.saved ?? [],
      disliked: parsed.disliked ?? [],
      following: parsed.following ?? [],
    };
  } catch {
    return emptySocial();
  }
}

export function writeSocial(state: SocialState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("katha-social"));
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function toggleLike(id: string) {
  const s = readSocial();
  const liked = toggle(s.liked, id);
  const disliked = liked.includes(id) ? s.disliked.filter((x) => x !== id) : s.disliked;
  writeSocial({ ...s, liked, disliked });
  return liked.includes(id);
}

export function toggleSave(id: string) {
  const s = readSocial();
  const saved = toggle(s.saved, id);
  writeSocial({ ...s, saved });
  return saved.includes(id);
}

export function toggleDislike(id: string) {
  const s = readSocial();
  const disliked = toggle(s.disliked, id);
  const liked = disliked.includes(id) ? s.liked.filter((x) => x !== id) : s.liked;
  writeSocial({ ...s, disliked, liked });
  return disliked.includes(id);
}

export function toggleFollow(handle: string) {
  const s = readSocial();
  const following = toggle(s.following, handle);
  writeSocial({ ...s, following });
  return following.includes(handle);
}
