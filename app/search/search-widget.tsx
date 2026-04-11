"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { SearchIndexItem } from "../../lib/workplace";
import styles from "./search.module.css";

const MAX_RESULTS = 40;

function normalize(s: string) {
  return s.toLowerCase();
}

function matches(item: SearchIndexItem, q: string): boolean {
  if (item.type === "domain") {
    return normalize(item.title).includes(q);
  }
  return (
    normalize(item.label).includes(q) ||
    normalize(item.domainTitle).includes(q) ||
    (item.summary ? normalize(item.summary).includes(q) : false)
  );
}

export function SearchWidget({ index }: { index: SearchIndexItem[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return index.filter((item) => matches(item, q)).slice(0, MAX_RESULTS);
  }, [query, index]);

  const domains = results.filter((r) => r.type === "domain");
  const topics = results.filter((r) => r.type === "topic");

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>Search</h1>
      <div className={styles.inputWrap}>
        <input
          ref={inputRef}
          autoFocus
          className={styles.input}
          type="search"
          placeholder="Search domains and topics…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
      </div>

      {query.trim() && results.length === 0 && (
        <p className={styles.empty}>No results for &ldquo;{query.trim()}&rdquo;</p>
      )}

      {domains.length > 0 && (
        <section className={styles.group}>
          <h2 className={styles.groupLabel}>Domains</h2>
          <div className={styles.list}>
            {(domains as Extract<SearchIndexItem, { type: "domain" }>[]).map((item) => (
              <Link key={item.slug} href={`/domains/${item.slug}`} className={styles.row}>
                <span className={styles.rowTitle}>{item.title}</span>
                <span className={styles.rowType}>Domain</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {topics.length > 0 && (
        <section className={styles.group}>
          <h2 className={styles.groupLabel}>Topics</h2>
          <div className={styles.list}>
            {(topics as Extract<SearchIndexItem, { type: "topic" }>[]).map((item) => (
              <Link
                key={`${item.domainSlug}-${item.topicId}`}
                href={`/domains/${item.domainSlug}/topics/${item.topicId}`}
                className={styles.row}
              >
                <span className={styles.rowTitle}>{item.label}</span>
                <span className={styles.rowDomain}>{item.domainTitle}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
