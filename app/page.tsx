import Link from "next/link";
import { listDomains } from "../lib/workplace";
import styles from "./page.module.css";

export default async function HomePage() {
  const domains = await listDomains();
  const featured = domains.slice(0, 6);

  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Next.js Migration</p>
        <h1 className={styles.title}>Workplace JSON rendered in React</h1>
        <p className={styles.copy}>
          The pipeline now emits structured site JSON as well as `workplace/*` artifacts.
          This app prefers the Python-generated `site-data.json` contract and falls back
          to raw workplace artifacts only when needed.
        </p>
        <div className={styles.linkRow}>
          <Link href="/domains/psychiatry" className={`${styles.pill} ${styles.pillPrimary}`}>
            Open psychiatry in React
          </Link>
          <Link href="/domains/climate-change" className={styles.pill}>
            Open climate change
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured domains</h2>
        <p className={styles.sectionCopy}>
          These cards are rendered from `topic_summary.json`, `subgenres.json`, and
          `overview_partition_summary.json`.
        </p>
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
                Top concepts: {domain.topConcepts.map((item) => item.label).join(", ") || "n/a"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>All domains</h2>
        <p className={styles.sectionCopy}>
          The goal is for this list to be driven entirely by Python-emitted JSON contracts,
          not HTML pages.
        </p>
        <div className={styles.table}>
          {domains.map((domain) => (
            <div key={domain.slug} className={styles.tableRow}>
              <div>
                <p className={styles.tableTitle}>{domain.title}</p>
                <p className={styles.tableMeta}>
                  {domain.sources.toLocaleString()} papers / {domain.entities.toLocaleString()} entities / {domain.claims.toLocaleString()} claims
                </p>
              </div>
              {domain.hasDetail ? (
                <Link href={`/domains/${domain.slug}`} className={styles.inlineLink}>
                  Open
                </Link>
              ) : (
                <span className={styles.pending}>Pending detail</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
