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
          {domains.map((domain) => (
            <div key={domain.slug} className={styles.tableRow}>
              <div>
                <p className={styles.tableTitle}>{domain.title}</p>
                <p className={styles.tableMeta}>
                  {domain.sources.toLocaleString()} papers / {domain.topicCount.toLocaleString()} topics
                </p>
              </div>
              {domain.hasDetail ? (
                <Link href={`/domains/${domain.slug}`} className={styles.inlineLink}>
                  View
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
