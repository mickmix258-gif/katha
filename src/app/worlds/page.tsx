import { CatalogBrowser } from "@/components/catalog-browser";
import { worlds } from "@/data/catalog";

export default function WorldsPage() {
  return <CatalogBrowser title="โลก" subtitle="ตลาดโลกและใบโลก" worlds={worlds} />;
}
