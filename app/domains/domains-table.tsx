"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./domains.module.css";

type Domain = {
  slug: string;
  title: string;
  sources: number;
  topicCount: number;
  hasDetail: boolean;
};

type SortKey = "title" | "sources" | "topicCount";

const SORT_LABELS: Record<SortKey, string> = {
  title: "Name",
  sources: "Papers",
  topicCount: "Topics",
};

export function DomainsTable({
  domains,
  categoryBySlug,
}: {
  domains: Domain[];
  categoryBySlug: Record<string, string>;
}) {
  const [sort, setSort] = useState<SortKey>("title");

  const sorted = [...domains].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    return b[sort] - a[sort];
  });

  return (
    <>
      <div className={styles.sectionTop}>
        <h2 className={styles.sectionTitle}>Index</h2>
        <div className={styles.sortRow}>
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <button
              key={key}
              className={`${styles.sortButton} ${sort === key ? styles.sortButtonActive : ""}`}
              onClick={() => setSort(key)}
            >
              {SORT_LABELS[key]}
            </button>
          ))}
          <Link href="/" className={styles.subtleLink}>
            Categories
          </Link>
        </div>
      </div>

      <div className={styles.table}>
        {sorted.map((domain) =>
          domain.hasDetail ? (
            <Link key={domain.slug} href={`/domains/${domain.slug}`} className={styles.tableRow}>
              {categoryBySlug[domain.slug] && (
                <p className={styles.tableCategory}>{categoryBySlug[domain.slug]}</p>
              )}
              <p className={styles.tableTitle}>{domain.title}</p>
              <p className={styles.tableMeta}>
                {domain.sources.toLocaleString()} papers / {domain.topicCount.toLocaleString()} topics
              </p>
            </Link>
          ) : (
            <div key={domain.slug} className={`${styles.tableRow} ${styles.tableRowPending}`}>
              {categoryBySlug[domain.slug] && (
                <p className={styles.tableCategory}>{categoryBySlug[domain.slug]}</p>
              )}
              <p className={styles.tableTitle}>{domain.title}</p>
              <p className={styles.tableMeta}>
                {domain.sources.toLocaleString()} papers / {domain.topicCount.toLocaleString()} topics
              </p>
            </div>
          )
        )}
      </div>
    </>
  );
}
