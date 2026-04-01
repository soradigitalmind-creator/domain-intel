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

  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Research map catalog</p>
        <h1 className={styles.title}>Domain Intel</h1>
        <p className={styles.copy}>
          Explore scientific and technical fields through curated domains. Start from a category to
          see related domains, or open the full index to browse every entry.
        </p>
        <div className={styles.linkRow}>
          <Link href="/domains" className={`${styles.pill} ${styles.pillPrimary}`}>
            View all domains
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Browse by category</h2>
        <p className={styles.sectionCopy}>
          Categories group domains by theme ({totalDomains.toLocaleString()} domain
          {totalDomains === 1 ? "" : "s"} in the index). Select a card to see domains in that area.
        </p>

        {categories.length > 0 ? (
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className={styles.categoryCard}>
                <h3 className={styles.categoryLabel}>{cat.label}</h3>
                <p className={styles.categoryDesc}>{cat.description}</p>
                <div className={styles.categoryFooter}>
                  <span className={styles.categoryCount}>
                    {cat.count.toLocaleString()} domain{cat.count === 1 ? "" : "s"}
                  </span>
                  <span className={styles.categoryCta}>View →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyBox}>
            <p className={styles.emptyTitle}>No categories yet</p>
            <p className={styles.emptyCopy}>
              The portal index does not list categories yet. You can still browse every domain from
              the full index, or rebuild the portal data so categories are populated from your domain
              set.
            </p>
            <Link href="/domains" className={`${styles.pill} ${styles.pillPrimary}`}>
              Open all domains
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
