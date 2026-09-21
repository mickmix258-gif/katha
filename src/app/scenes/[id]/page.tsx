import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacter, getScene, getWorld, tagLabel } from "@/data/catalog";
import { FollowButton } from "@/components/follow-button";
import { WorkActions } from "@/components/work-actions";

export default async function SceneDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getScene(id);
  if (!item) notFound();
  const world = item.worldId ? getWorld(item.worldId) : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs text-[var(--accent-2)]">ฉากเรื่อง{world ? ` · ${world.title}` : ""}</p>
      <h1 className="mt-2 text-4xl">{item.title}</h1>
      <FollowButton handle={item.creatorHandle} />
      <WorkActions workId={item.id} baseLikes={item.likeCount ?? 0} />
      <p className="mt-3 text-[var(--muted)]">{item.premise}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-[var(--line)] px-3 py-1 text-sm">
            {tagLabel(tag)}
          </span>
        ))}
      </div>
      <p className="mt-6 leading-8">{item.openingNarration}</p>
      <h2 className="mt-8 text-xl">ตัวในเรื่อง</h2>
      <div className="mt-3 grid gap-2">
        {item.npcIds.map((npcId) => {
          const npc = getCharacter(npcId);
          return npc ? (
            <Link key={npc.id} href={`/characters/${npc.id}`} className="rounded-xl border border-[var(--line)] p-3">
              {npc.name} · {npc.tagline}
            </Link>
          ) : null;
        })}
      </div>
      <h2 className="mt-8 text-xl">ใบโลก</h2>
      <div className="mt-3 grid gap-2">
        {item.worldCards.map((card) => (
          <div key={card.title} className="rounded-xl border border-[var(--line)] p-3">
            <p className="text-sm text-[var(--accent-2)]">{card.type}</p>
            <p className="font-medium">{card.title}</p>
            <p className="text-sm text-[var(--muted)]">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
