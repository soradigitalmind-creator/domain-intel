import type { Metadata } from "next";
import Link from "next/link";
import { listDomains, listPortalCategories } from "../../lib/workplace";
import styles from "./domains.module.css";

export const metadata: Metadata = {
  title: "All domains",
  description: "Complete index of research domains: papers, topics, and entity maps.",
};

export default async function DomainsIndexPage() {
  const [domains, categories] = await Promise.all([listDomains(), listPortalCategories()]);
  const categoryBySlug = new Map(
    categories.flatMap((cat) => cat.domains.map((d) => [d.slug, cat.label]))
  );

  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <h1 className={styles.title}>All domains</h1>
        <p className={styles.copy}>A complete index of research domains.</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <h2 className={styles.sectionTitle}>Index</h2>
          <Link href="/" className={styles.subtleLink}>
            Categories
          </Link>
        </div>
        <div className={styles.table}>
          {domains.map((domain) =>
            domain.hasDetail ? (
              <Link key={domain.slug} href={`/domains/${domain.slug}`} className={styles.tableRow}>
                {categoryBySlug.get(domain.slug) && (
                  <p className={styles.tableCategory}>{categoryBySlug.get(domain.slug)}</p>
                )}
                <p className={styles.tableTitle}>{domain.title}</p>
                <p className={styles.tableMeta}>
                  {domain.sources.toLocaleString()} papers / {domain.topicCount.toLocaleString()} topics
                </p>
              </Link>
            ) : (
              <div key={domain.slug} className={`${styles.tableRow} ${styles.tableRowPending}`}>
                {categoryBySlug.get(domain.slug) && (
                  <p className={styles.tableCategory}>{categoryBySlug.get(domain.slug)}</p>
                )}
                <p className={styles.tableTitle}>{domain.title}</p>
                <p className={styles.tableMeta}>
                  {domain.sources.toLocaleString()} papers / {domain.topicCount.toLocaleString()} topics
                </p>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
