import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { WorkActions } from "@/components/work-actions";
import { getCharacter, tagLabel } from "@/data/catalog";

export default async function CharacterDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getCharacter(id);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs text-[var(--accent-2)]">
        <Link href={`/c/${item.creatorHandle}`}>@{item.creatorHandle}</Link> · อายุ {item.age}
      </p>
      <h1 className="mt-2 text-4xl">{item.name}</h1>
      <p className="mt-3 text-lg text-[var(--muted)]">{item.tagline}</p>
      <FollowButton handle={item.creatorHandle} />
      <WorkActions workId={item.id} baseLikes={item.likeCount} />
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <Link
            key={tag}
            href={`/explore?tags=${tag}`}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-sm"
          >
            {tagLabel(tag)}
          </Link>
        ))}
      </div>
      <p className="mt-6 leading-8 text-[var(--text)]">{item.description}</p>
      <dl className="mt-8 grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 text-sm">
        <div>
          <dt className="text-[var(--muted)]">บุคลิก</dt>
          <dd>{item.personality}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">วิธีพูด</dt>
          <dd>{item.speakingStyle}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">คำทักทาย</dt>
          <dd>{item.greeting}</dd>
        </div>
      </dl>
      <Link
        href="/create"
        className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm"
      >
        เริ่มบท · ห้องบทมาใน M4
      </Link>
    </div>
  );
}
