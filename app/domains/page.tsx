import type { Metadata } from "next";
import Link from "next/link";
import { listDomains } from "../../lib/workplace";
import styles from "./domains.module.css";

export const metadata: Metadata = {
  title: "All domains",
  description: "Complete index of research domains: papers, topics, and entity maps.",
};

export default async function DomainsIndexPage() {
  const domains = await listDomains();
  const featured = domains.slice(0, 6);

  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Domain index</p>
        <h1 className={styles.title}>All domains</h1>
        <p className={styles.copy}>
          Explore every domain in the catalog. Each entry links to topic maps, paper shelves, and
          structured summaries built from the published site data.
        </p>
        <div className={styles.linkRow}>
          <Link href="/" className={`${styles.pill} ${styles.pillPrimary}`}>
            Back to categories
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured</h2>
        <p className={styles.sectionCopy}>A sample of domains from the index.</p>
        <div className={styles.grid}>
          {featured.map((domain) => (
            <Link
              key={domain.slug}
              href={`/domains/${domain.slug}`}
              className={styles.card}
            >
              <strong className={styles.cardTitle}>{domain.title}</strong>
              <span className={styles.cardMeta}>
                {domain.sources.toLocaleString()} papers
              </span>
              <span className={styles.cardMeta}>
                {domain.topicCount.toLocaleString()} topics
              </span>
              <span className={styles.cardMeta}>
                Top concepts: {domain.topConcepts.map((item) => item.label).join(", ") || "—"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Complete list</h2>
        <p className={styles.sectionCopy}>
          Sorted by paper count. Open a domain to browse topics and papers.
        </p>
        <div className={styles.table}>
          {domains.map((domain) => (
            <div key={domain.slug} className={styles.tableRow}>
              <div>
                <p className={styles.tableTitle}>{domain.title}</p>
                <p className={styles.tableMeta}>
                  {domain.sources.toLocaleString()} papers / {domain.entities.toLocaleString()}{" "}
                  entities / {domain.claims.toLocaleString()} claims
                </p>
              </div>
              {domain.hasDetail ? (
                <Link href={`/domains/${domain.slug}`} className={styles.inlineLink}>
                  Open
                </Link>
              ) : (
                <span className={styles.pending}>Coming soon</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
