import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicDetail } from "../../../../../lib/workplace";
import { SetTrail } from "../../../../components/trail-context";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ slug: string; topicId: string }>;
};

export const revalidate = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, topicId } = await params;
  const detail = await getTopicDetail(slug, topicId);

  if (!detail) {
    return { title: "Topic Not Found" };
  }

  return {
    title: `${detail.topic.label} · ${detail.domain.title}`,
    description: `${detail.topic.paper_ids.length.toLocaleString()} papers in ${detail.topic.label}.`,
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug, topicId } = await params;
  const detail = await getTopicDetail(slug, topicId);

  if (!detail) {
    notFound();
  }

  const topicTrail = [
    ...detail.ancestorTrail,
    { href: `/domains/${slug}/topics/${topicId}`, label: detail.topic.label },
  ];

  return (
    <main className="page-shell">
      <SetTrail items={topicTrail} />
      <section className={styles.hero}>
        <h1 className={styles.title}>{detail.topic.label}</h1>
        <div className={styles.heroMeta}>
          <span>{detail.topic.paper_ids.length.toLocaleString()} papers</span>
          {detail.children.length > 0 && (
            <span>{detail.children.length.toLocaleString()} subtopics</span>
          )}
        </div>
      </section>

      {detail.children.length > 0 ? (
        <section className={styles.section}>
          <div className={styles.childGrid}>
            {detail.children.map((child) => (
              <Link
                key={child.subgenre_id}
                href={`/domains/${slug}/topics/${child.subgenre_id}`}
                className={styles.childCard}
              >
                <strong className={styles.childTitle}>{child.label}</strong>
                <p className={styles.childMeta}>{child.paperCount.toLocaleString()} papers</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={`${styles.section} ${styles.paperSection}`}>
        <h2 className={styles.sectionTitle}>Paper shelf</h2>
        <div className={styles.paperGrid}>
          {detail.papers.map((paper) => (
            <Link
              key={paper.source_id}
              href={`/domains/${slug}/papers/${paper.source_id.split("/").pop() ?? paper.source_id}`}
              className={styles.paperCard}
            >
              <div className={styles.paperTop}>
                <div>
                  <h3 className={styles.paperTitle}>{paper.title}</h3>
                  <p className={styles.paperMeta}>
                    {paper.year ?? "n/a"} / {paper.cited_by_count.toLocaleString()} cites
                  </p>
                </div>
                {paper.assignment ? (
                  <span className={styles.paperConfidence}>
                    {Math.round(paper.assignment.confidence * 100)}%
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {detail.siblingTopics?.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Related topics</h2>
          <div className={styles.relatedGrid}>
            {detail.siblingTopics.map((t) => (
              <Link
                key={t.subgenre_id}
                href={`/domains/${slug}/topics/${t.subgenre_id}`}
                className={styles.relatedCard}
              >
                <div className={styles.relatedTop}>
                  <strong className={styles.relatedLabel}>{t.label}</strong>
                  {t.similarity > 0 && (
                    <span className={styles.relatedSimilarity}>{t.similarity}%</span>
                  )}
                </div>
                <span className={styles.relatedMeta}>
                  {t.paperCount} papers{t.subtopicCount > 0 ? ` · ${t.subtopicCount} subtopics` : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
