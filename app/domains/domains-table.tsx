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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(Object.values(categoryBySlug))).sort();

  const filtered = activeCategory
    ? domains.filter((d) => categoryBySlug[d.slug] === activeCategory)
    : domains;

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    return b[sort] - a[sort];
  });

  return (
    <>
      <div className={styles.sectionTop}>
        <h2 className={styles.sectionTitle}>Index</h2>
        <div className={styles.controls}>
          {categories.length > 0 && (
            <div className={styles.filterRow}>
              <button
                className={`${styles.sortButton} ${activeCategory === null ? styles.sortButtonActive : ""}`}
                onClick={() => setActiveCategory(null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.sortButton} ${activeCategory === cat ? styles.sortButtonActive : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
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
          </div>
        </div>
      </div>

      <div className={styles.table}>
        {sorted.map((domain) =>
          domain.hasDetail ? (
            <Link key={domain.slug} href={`/domains/${domain.slug}`} className={styles.tableRow}>
              <div className={styles.tableMain}>
                <p className={styles.tableTitle}>{domain.title}</p>
                <p className={styles.tableMeta}>
                  {domain.topicCount.toLocaleString()} topics / {domain.sources.toLocaleString()} papers
                </p>
              </div>
              {categoryBySlug[domain.slug] && (
                <p className={styles.tableCategory}>{categoryBySlug[domain.slug]}</p>
              )}
            </Link>
          ) : (
            <div key={domain.slug} className={`${styles.tableRow} ${styles.tableRowPending}`}>
              <div className={styles.tableMain}>
                <p className={styles.tableTitle}>{domain.title}</p>
                <p className={styles.tableMeta}>
                  {domain.topicCount.toLocaleString()} topics / {domain.sources.toLocaleString()} papers
                </p>
              </div>
              {categoryBySlug[domain.slug] && (
                <p className={styles.tableCategory}>{categoryBySlug[domain.slug]}</p>
              )}
            </div>
          )
        )}
      </div>
    </>
  );
}
