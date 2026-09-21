import { CatalogBrowser } from "@/components/catalog-browser";
import { characters } from "@/data/catalog";

export default function CharactersPage() {
  return (
    <CatalogBrowser
      title="ตัวละคร"
      subtitle="ตลาดตัวละครต้นฉบับ"
      characters={characters}
      showGender
    />
  );
}
