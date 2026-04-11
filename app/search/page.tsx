import type { Metadata } from "next";
import { getSearchIndex } from "../../lib/workplace";
import { SearchWidget } from "./search-widget";

export const metadata: Metadata = {
  title: "Search",
  description: "Search domains and topics across Domain Intel.",
};

export default async function SearchPage() {
  const index = await getSearchIndex();
  return (
    <main className="page-shell">
      <SearchWidget index={index} />
    </main>
  );
}
