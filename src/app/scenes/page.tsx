import { CatalogBrowser } from "@/components/catalog-browser";
import { scenes } from "@/data/catalog";

export default function ScenesPage() {
  return <CatalogBrowser title="ฉากเรื่อง" subtitle="ตลาดฉากเปิดเรื่อง" scenes={scenes} />;
}
