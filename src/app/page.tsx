import Link from "next/link";
import { CatalogCard } from "@/components/catalog-card";
import { characters, scenes, tags, worlds } from "@/data/catalog";
import th from "@/locales/th.json";

export default function HomePage() {
  const featuredCharacters = characters.filter((item) => item.featured);
  const featuredScenes = scenes.filter((item) => item.featured);
  const featuredWorlds = worlds.filter((item) => item.featured);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <section className="grid gap-8 py-12 md:grid-cols-[1.3fr_0.7fr] md:items-end">
        <div>
          <p className="text-xs tracking-[0.35em] text-[var(--accent-2)]">KATHA / กถา</p>
          <h1 className="mt-4 max-w-xl text-4xl leading-tight md:text-6xl">{th.app.tagline}</h1>
          <p className="mt-5 max-w-xl text-[var(--muted)]">
            สามพื้นผิวในเว็บเดียว ตลาดตัวละคร ฉากเรื่องที่มีใบโลกและใบจำ และแกลเลอรีชุมชน
            โหมดผู้ใหญ่เปิดได้หลังยืนยันอายุ ตัวละครทุกตัวเป็นผู้ใหญ่
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/characters" className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm">
              เข้าตลาดตัวละคร
            </Link>
            <Link href="/scenes" className="rounded-full border border-[var(--line)] px-5 py-3 text-sm">
              เปิดฉากเรื่อง
            </Link>
          </div>
        </div>
        <div className="grid gap-3">
          {[
            ["01", th.app.threeSurfaces.character, "คุยตัวต่อตัว บัตรตัวละคร บทเปิดหลายบท"],
            ["02", th.app.threeSurfaces.sceneWorld, "โลก ฉาก ใบโลก LoreEngine ใบจำ"],
            ["03", th.app.threeSurfaces.gallery, "ติดตาม ถูกใจ ส่วนแบ่งพระจันทร์"],
          ].map(([no, title, body]) => (
            <div key={no} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
              <p className="text-xs text-[var(--accent-2)]">{no}</p>
              <h2 className="mt-1 text-lg">{title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.slug}
            href={`/explore?tag=${tag.slug}`}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--muted)]"
          >
            {tag.labelTh}
          </Link>
        ))}
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl">ตัวละครเด่น</h2>
          <Link href="/characters" className="text-sm text-[var(--muted)]">ดูทั้งหมด</Link>
        </div>
        <div className="card-grid">
          {featuredCharacters.map((item) => (
            <CatalogCard
              key={item.id}
              href={`/characters/${item.id}`}
              title={item.name}
              subtitle={item.tagline}
              tags={item.tags}
              rating={item.rating}
              meta={`${item.messageCount.toLocaleString()} บท`}
            />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl">ฉากเรื่องเด่น</h2>
          <Link href="/scenes" className="text-sm text-[var(--muted)]">ดูทั้งหมด</Link>
        </div>
        <div className="card-grid">
          {featuredScenes.map((item) => (
            <CatalogCard
              key={item.id}
              href={`/scenes/${item.id}`}
              title={item.title}
              subtitle={item.premise}
              tags={item.tags}
              rating={item.rating}
              meta={`${item.playCount.toLocaleString()} รอบเล่น`}
            />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl">โลกเด่น</h2>
          <Link href="/worlds" className="text-sm text-[var(--muted)]">ดูทั้งหมด</Link>
        </div>
        <div className="card-grid">
          {featuredWorlds.map((item) => (
            <CatalogCard
              key={item.id}
              href={`/worlds/${item.id}`}
              title={item.title}
              subtitle={item.premise}
              tags={item.tags}
              rating={item.rating}
              meta={item.setting}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
