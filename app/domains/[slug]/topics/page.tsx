import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDomainTopicsIndex } from "../../../../lib/workplace";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getDomainTopicsIndex(slug);

  if (!detail) {
    return { title: "Topics Not Found" };
  }

  return {
    title: `${detail.domain.title} Topics | Domain Intel`,
    description: `${detail.hierarchy.rootTopics.toLocaleString()} root topics and ${detail.hierarchy.descendantTopics.toLocaleString()} descendant topics.`,
  };
}

export default async function DomainTopicsPage({ params }: Props) {
  const { slug } = await params;
  const detail = await getDomainTopicsIndex(slug);

  if (!detail) {
    notFound();
  }

  return (
    <main className="page-shell">
      <div className={styles.backRow}>
        <Link href={`/domains/${slug}`} className={styles.backLink}>
          Back to {detail.domain.title}
        </Link>
      </div>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Topic Atlas</p>
        <h1 className={styles.title}>{detail.domain.title} topics</h1>
        <p className={styles.copy}>
          A scan-first atlas built from `subgenres.json`, `topic_year_counts.json`, and the paper assignments.
        </p>
        <div className={styles.metricRow}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Root topics</span>
            <strong className={styles.metricValue}>{detail.hierarchy.rootTopics}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Descendants</span>
            <strong className={styles.metricValue}>{detail.hierarchy.descendantTopics}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Leaf topics</span>
            <strong className={styles.metricValue}>{detail.hierarchy.leafTopics}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Max depth</span>
            <strong className={styles.metricValue}>{detail.hierarchy.maxDepth}</strong>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        {detail.topics.map((topic) => (
          <article key={topic.subgenre_id} className={styles.card}>
            <div className={styles.cardTop}>
              <div>
                <p className={styles.trend}>{topic.trendLabel}</p>
                <h2 className={styles.cardTitle}>{topic.label}</h2>
              </div>
              <Link href={`/domains/${slug}/topics/${topic.subgenre_id}`} className={styles.openLink}>
                Open
              </Link>
            </div>
            <p className={styles.summary}>{topic.summary}</p>
            <p className={styles.meta}>
              {topic.paperCount} papers / {topic.subtopicCount} direct subtopics
            </p>
            <div className={styles.tagRow}>
              {topic.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className={styles.childList}>
              {topic.children.map((child) => (
                <Link
                  key={child.subgenre_id}
                  href={`/domains/${slug}/topics/${child.subgenre_id}`}
                  className={styles.childLink}
                >
                  {child.label} ({child.paperCount})
                </Link>
              ))}
            </div>
            <div className={styles.paperList}>
              {topic.featuredPapers.map((paper) => (
                <Link
                  key={paper.source_id}
                  href={`/domains/${slug}/papers/${paper.source_id.split("/").pop() ?? paper.source_id}`}
                  className={styles.paperLink}
                >
                  <span>{paper.title}</span>
                  <span className={styles.paperMeta}>{paper.year ?? "n/a"} / {paper.cited_by_count.toLocaleString()} cites</span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
