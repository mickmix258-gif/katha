import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacter, getWorld, scenes, tagLabel } from "@/data/catalog";
import { FollowButton } from "@/components/follow-button";
import { WorkActions } from "@/components/work-actions";

export default async function WorldDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getWorld(id);
  if (!item) notFound();
  const worldScenes = scenes.filter((scene) => scene.worldId === item.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl">{item.title}</h1>
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
      <p className="mt-6 leading-8">{item.lore}</p>
      <h2 className="mt-8 text-xl">ผู้อยู่อาศัย</h2>
      <div className="mt-3 grid gap-2">
        {item.residentIds.map((residentId) => {
          const resident = getCharacter(residentId);
          return resident ? (
            <Link key={resident.id} href={`/characters/${resident.id}`} className="rounded-xl border border-[var(--line)] p-3">
              {resident.name}
            </Link>
          ) : null;
        })}
      </div>
      <h2 className="mt-8 text-xl">ฉากในโลกนี้</h2>
      <div className="mt-3 grid gap-2">
        {worldScenes.map((scene) => (
          <Link key={scene.id} href={`/scenes/${scene.id}`} className="rounded-xl border border-[var(--line)] p-3">
            {scene.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
