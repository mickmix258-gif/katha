import { CatalogBrowser } from "@/components/catalog-browser";
import { characters, scenes, worlds } from "@/data/catalog";

export default function ExplorePage() {
  return (
    <CatalogBrowser
      title="สำรวจ"
      subtitle="กรองแท็ก เรต ช่วงเวลา เรียงลำดับ และสัญญาณสังคม"
      characters={characters}
      scenes={scenes}
      worlds={worlds}
    />
  );
}
