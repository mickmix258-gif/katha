import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { TipMoons } from "@/components/tip-moons";
import { characters, creators, scenes, worlds } from "@/data/catalog";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const creator = creators.find((item) => item.handle === handle);
  if (!creator) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl">{creator.displayName}</h1>
      <p className="mt-2 text-[var(--muted)]">@{creator.handle}</p>
      <p className="mt-4">{creator.bio}</p>
      <FollowButton handle={creator.handle} />
      <TipMoons handle={creator.handle} displayName={creator.displayName} />
      <h2 className="mt-8 text-xl">ผลงาน</h2>
      <div className="mt-3 grid gap-2">
        {characters
          .filter((item) => item.creatorHandle === handle)
          .map((item) => (
            <Link
              key={item.id}
              href={`/characters/${item.id}`}
              className="rounded-xl border border-[var(--line)] p-3"
            >
              ตัวละคร · {item.name}
            </Link>
          ))}
        {scenes
          .filter((item) => item.creatorHandle === handle)
          .map((item) => (
            <Link
              key={item.id}
              href={`/scenes/${item.id}`}
              className="rounded-xl border border-[var(--line)] p-3"
            >
              ฉากเรื่อง · {item.title}
            </Link>
          ))}
        {worlds
          .filter((item) => item.creatorHandle === handle)
          .map((item) => (
            <Link
              key={item.id}
              href={`/worlds/${item.id}`}
              className="rounded-xl border border-[var(--line)] p-3"
            >
              โลก · {item.title}
            </Link>
          ))}
      </div>
    </div>
  );
}
