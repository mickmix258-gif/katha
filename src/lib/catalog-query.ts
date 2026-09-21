import type { Rating } from "@/data/catalog";

export type SortKey = "trending" | "new" | "most_played" | "most_messages" | "most_likes";
export type TimeWindow = "today" | "7d" | "30d" | "all";
export type ContentMode = "all" | "safe_only";
export type Section =
  | "popular"
  | "fresh"
  | "newest"
  | "top"
  | "following"
  | "saved"
  | "liked"
  | "mine"
  | "all";

export type CatalogParams = {
  tags: string[];
  rating?: Rating | "any";
  gender?: string;
  sort: SortKey;
  window: TimeWindow;
  contentMode: ContentMode;
  section: Section;
  q?: string;
};

export type SocialSnapshot = {
  liked: string[];
  saved: string[];
  disliked: string[];
  following: string[];
};

export function parseCatalogParams(sp: Record<string, string | string[] | undefined>): CatalogParams {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const tagsRaw = one("tags") ?? one("tag") ?? "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const sort = (one("sort") as SortKey) || "trending";
  const window = (one("window") as TimeWindow) || "all";
  const contentMode = (one("contentMode") as ContentMode) || "all";
  const section = (one("section") as Section) || "all";
  const rating = (one("rating") as Rating | "any") || "any";
  const gender = one("gender") || undefined;
  const q = one("q") || undefined;
  return { tags, rating, gender, sort, window, contentMode, section, q };
}

function windowStart(window: TimeWindow, now = Date.now()) {
  if (window === "today") return now - 24 * 60 * 60 * 1000;
  if (window === "7d") return now - 7 * 24 * 60 * 60 * 1000;
  if (window === "30d") return now - 30 * 24 * 60 * 60 * 1000;
  return 0;
}

type WorkLike = {
  id: string;
  tags: string[];
  rating: Rating;
  publishedAt: string;
  creatorHandle: string;
  genderPresentation?: string;
  messageCount?: number;
  playCount?: number;
  likeCount?: number;
  featured?: boolean;
  name?: string;
  title?: string;
  tagline?: string;
  premise?: string;
};

export function filterAndSortWorks<T extends WorkLike>(
  items: T[],
  params: CatalogParams,
  social?: SocialSnapshot,
  opts?: { kind?: "character" | "scene" | "world" },
): T[] {
  const start = windowStart(params.window);
  let list = items.filter((item) => {
    if (params.contentMode === "safe_only" && item.rating === "mature") return false;
    if (params.rating && params.rating !== "any" && item.rating !== params.rating) return false;
    if (params.tags.length && !params.tags.every((t) => item.tags.includes(t))) return false;
    if (params.gender && item.genderPresentation && item.genderPresentation !== params.gender) return false;
    if (start && new Date(item.publishedAt).getTime() < start) return false;
    if (params.q) {
      const hay = `${item.name ?? ""} ${item.title ?? ""} ${item.tagline ?? ""} ${item.premise ?? ""} ${item.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(params.q.toLowerCase())) return false;
    }
    if (social) {
      if (params.section === "liked" && !social.liked.includes(item.id)) return false;
      if (params.section === "saved" && !social.saved.includes(item.id)) return false;
      if (params.section === "following" && !social.following.includes(item.creatorHandle)) return false;
      if (params.section === "mine") return false; // anonymous M2
      if (social.disliked.includes(item.id) && params.section === "all") {
        // keep but downrank later
      }
    }
    return true;
  });

  const score = (item: T) => {
    const likes = item.likeCount ?? 0;
    const plays = item.playCount ?? 0;
    const msgs = item.messageCount ?? 0;
    const ageHours = Math.max(1, (Date.now() - new Date(item.publishedAt).getTime()) / 36e5);
    const trending = (likes * 2 + plays + msgs * 0.1) / Math.sqrt(ageHours);
    const disliked = social?.disliked.includes(item.id) ? -1000 : 0;
    return { likes, plays, msgs, trending, disliked, published: new Date(item.publishedAt).getTime() };
  };

  list = [...list].sort((a, b) => {
    const sa = score(a);
    const sb = score(b);
    if (params.sort === "new" || params.section === "newest" || params.section === "fresh") {
      return sb.published - sa.published;
    }
    if (params.sort === "most_likes" || params.section === "top") return sb.likes - sa.likes + (sb.disliked - sa.disliked);
    if (params.sort === "most_played") return sb.plays - sa.plays;
    if (params.sort === "most_messages") return sb.msgs - sa.msgs;
    // trending / popular
    return sb.trending + sb.disliked - (sa.trending + sa.disliked);
  });

  // Downrank disliked to the end for default browse sections
  if (social && (params.section === "all" || params.section === "popular")) {
    list = [
      ...list.filter((i) => !social.disliked.includes(i.id)),
      ...list.filter((i) => social.disliked.includes(i.id)),
    ];
  }

  void opts;
  return list;
}

export function toQuery(params: Partial<CatalogParams>): string {
  const sp = new URLSearchParams();
  if (params.tags?.length) sp.set("tags", params.tags.join(","));
  if (params.rating && params.rating !== "any") sp.set("rating", params.rating);
  if (params.gender) sp.set("gender", params.gender);
  if (params.sort && params.sort !== "trending") sp.set("sort", params.sort);
  if (params.window && params.window !== "all") sp.set("window", params.window);
  if (params.contentMode && params.contentMode !== "all") sp.set("contentMode", params.contentMode);
  if (params.section && params.section !== "all") sp.set("section", params.section);
  if (params.q) sp.set("q", params.q);
  const s = sp.toString();
  return s ? `?${s}` : "";
}
