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
        <h1 className={styles.title}>Domain Intel</h1>
        <p className={styles.copy}>Explore the research landscape through structure.</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <h2 className={styles.sectionTitle}>Categories</h2>
          <Link href="/domains" className={styles.subtleLink}>
            {totalDomains.toLocaleString()} domains
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className={styles.categoryCard}>
                <h3 className={styles.categoryLabel}>{cat.label}</h3>
                <p className={styles.categoryDesc}>{cat.description}</p>
                <span className={styles.categoryCount}>
                  {cat.count.toLocaleString()} domain{cat.count === 1 ? "" : "s"}
                </span>
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
