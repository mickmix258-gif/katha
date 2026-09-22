import { LORE_TOKEN_CAP, type LoreCard, type PlayMessage } from "./types";

/** Rough Thai/EN token estimate (~2 chars / token). */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 2));
}

function normalize(s: string) {
  return s.toLowerCase();
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[\s,./\\|;:!?()[\]{}"'「」『』、。]+/)
    .filter((t) => t.length >= 2);
}

/** Simple overlap score as semantic stub (no embedding API). */
function semanticScore(card: LoreCard, corpusTokens: Set<string>): number {
  const bag = new Set([
    ...tokenize(card.title),
    ...tokenize(card.body),
    ...card.triggerWords.flatMap((w) => tokenize(w)),
  ]);
  let hit = 0;
  for (const t of bag) {
    if (corpusTokens.has(t)) hit += 1;
  }
  if (!bag.size) return 0;
  return (hit / bag.size) * card.weight;
}

function triggerMatch(card: LoreCard, haystack: string): boolean {
  const h = normalize(haystack);
  return card.triggerWords.some((w) => w && h.includes(normalize(w)));
}

/**
 * LoreEngine:
 * 1. alwaysOn
 * 2. trigger words in last user + last 2 assistant msgs
 * 3. semantic stub above threshold
 * 4. one-hop linked cards
 * 5. cap by token budget
 */
export function selectLoreCards(input: {
  cards: LoreCard[];
  messages: PlayMessage[];
  tokenCap?: number;
  semanticThreshold?: number;
}): { selected: LoreCard[]; reasons: Record<string, string> } {
  const cap = input.tokenCap ?? LORE_TOKEN_CAP;
  const threshold = input.semanticThreshold ?? 0.12;
  const msgs = input.messages;
  const lastUser = [...msgs].reverse().find((m) => m.role === "user");
  const lastAssistants = [...msgs]
    .reverse()
    .filter((m) => m.role === "assistant" || m.role === "narrator")
    .slice(0, 2);
  const haystack = [lastUser?.content, ...lastAssistants.map((m) => m.content)]
    .filter(Boolean)
    .join("\n");
  const corpusTokens = new Set(tokenize(haystack));

  const byId = new Map(input.cards.map((c) => [c.id, c]));
  const reasons: Record<string, string> = {};
  const picked = new Map<string, LoreCard>();

  for (const card of input.cards) {
    if (card.alwaysOn) {
      picked.set(card.id, card);
      reasons[card.id] = "alwaysOn";
    }
  }

  for (const card of input.cards) {
    if (picked.has(card.id)) continue;
    if (triggerMatch(card, haystack)) {
      picked.set(card.id, card);
      reasons[card.id] = "trigger";
    }
  }

  for (const card of input.cards) {
    if (picked.has(card.id)) continue;
    const score = semanticScore(card, corpusTokens);
    if (score >= threshold) {
      picked.set(card.id, card);
      reasons[card.id] = `semantic:${score.toFixed(2)}`;
    }
  }

  // one-hop links
  const hopIds = [...picked.values()].flatMap((c) => c.linkedCardIds);
  for (const id of hopIds) {
    if (picked.has(id)) continue;
    const linked = byId.get(id);
    if (linked) {
      picked.set(id, linked);
      reasons[id] = "one-hop";
    }
  }

  // Cap tokens: alwaysOn first, then by weight desc
  const ordered = [...picked.values()].sort((a, b) => {
    if (a.alwaysOn !== b.alwaysOn) return a.alwaysOn ? -1 : 1;
    return b.weight - a.weight;
  });

  const selected: LoreCard[] = [];
  let used = 0;
  for (const card of ordered) {
    const cost = estimateTokens(`${card.title}\n${card.body}`);
    if (used + cost > cap && selected.length > 0) break;
    selected.push(card);
    used += cost;
  }

  return { selected, reasons };
}

export function formatLoreBlock(cards: LoreCard[]): string {
  if (!cards.length) return "";
  return cards
    .map((c) => `[${c.type}] ${c.title}\n${c.body}`)
    .join("\n\n");
}
