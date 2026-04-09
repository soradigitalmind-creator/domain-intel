import type { Metadata } from "next";
import Link from "next/link";
import { getPortalData, listPortalCategories } from "../lib/workplace";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: {
    absolute: "Domain Intel",
  },
  description:
    "Browse research fields by theme: health, earth sciences, engineering, society, and more. Each domain offers topic maps and paper collections.",
};

export default async function HomePage() {
  const categories = await listPortalCategories();
  const portal = await getPortalData();
  const totalDomains =
    typeof portal?.total_domains === "number" && portal.total_domains > 0
      ? portal.total_domains
      : portal?.domains?.length ?? 0;

  // Build per-category topic/paper totals from portal domain stats
  const domainMap = new Map(
    (portal?.domains ?? []).map((d) => [d.slug, d])
  );
  const categoryStats = new Map<string, { topics: number; papers: number }>();
  for (const cat of categories) {
    let topics = 0;
    let papers = 0;
    for (const d of cat.domains) {
      const info = domainMap.get(d.slug);
      if (info) {
        topics += info.parent_subgenres ?? 0;
        papers += info.sources ?? 0;
      }
    }
    categoryStats.set(cat.slug, { topics, papers });
  }

  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <h1 className={styles.title}>Domain Intel</h1>
        <p className={styles.copy}>Explore the research landscape through structure.</p>
      </section>

      <section className={styles.section}>
        {categories.length > 0 ? (
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className={styles.categoryCard}>
                <h3 className={styles.categoryLabel}>{cat.label}</h3>
                <p className={styles.categoryMeta}>
                  {cat.domains.length} domains · {(categoryStats.get(cat.slug)?.topics ?? 0).toLocaleString()} topics · {(categoryStats.get(cat.slug)?.papers ?? 0).toLocaleString()} papers
                </p>
                <div className={styles.categoryDomains}>
                  {cat.domains.map((d) => (
                    <span key={d.slug} className={styles.domainChip}>{d.title}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyBox}>
            <p className={styles.emptyTitle}>No categories yet</p>
            <p className={styles.emptyCopy}>Rebuild the portal data to populate the category index.</p>
          </div>
        )}
      </section>
    </main>
  );
}
