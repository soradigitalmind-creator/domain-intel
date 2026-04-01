import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicDetail, listTopicStaticParams } from "../../../../../lib/workplace";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ slug: string; topicId: string }>;
};

export async function generateStaticParams() {
  return listTopicStaticParams();
}

export const dynamicParams = false;

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

  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Topic Detail</p>
        <h1 className={styles.title}>{detail.topic.label}</h1>
        <p className={styles.copy}>{detail.topic.summary}</p>
        <div className={styles.metricRow}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Level</span>
            <strong className={styles.metricValue}>{detail.topic.level}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Papers</span>
            <strong className={styles.metricValue}>{detail.topic.paper_ids.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Child topics</span>
            <strong className={styles.metricValue}>{detail.children.length}</strong>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Topic signals</h2>
        <div className={styles.signalGrid}>
          <article className={styles.signalCard}>
            <p className={styles.signalLabel}>Top entities</p>
            <p className={styles.signalValue}>
              {detail.topic.top_entities.join(", ") || "none"}
            </p>
          </article>
          <article className={styles.signalCard}>
            <p className={styles.signalLabel}>Top properties</p>
            <p className={styles.signalValue}>
              {detail.topic.top_properties.join(", ") || "none"}
            </p>
          </article>
          <article className={styles.signalCard}>
            <p className={styles.signalLabel}>Member terms</p>
            <p className={styles.signalValue}>
              {detail.topic.member_terms.slice(0, 12).join(", ") || "none"}
            </p>
          </article>
        </div>
      </section>

      {detail.children.length > 0 ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Child topics</h2>
          <div className={styles.childGrid}>
            {detail.children.map((child) => (
              <Link
                key={child.subgenre_id}
                href={`/domains/${slug}/topics/${child.subgenre_id}`}
                className={styles.childCard}
              >
                <strong className={styles.childTitle}>{child.label}</strong>
                <span className={styles.childMeta}>{child.paper_ids.length} papers</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Paper shelf</h2>
        <p className={styles.sectionCopy}>
          Top 30 papers by adjusted citation count from `sources.jsonl`, restricted to this topic.
        </p>
        <div className={styles.paperGrid}>
          {detail.papers.map((paper) => (
            <article key={paper.source_id} className={styles.paperCard}>
              <div className={styles.paperTop}>
                <div>
                  <h3 className={styles.paperTitle}>
                    <Link href={`/domains/${slug}/papers/${paper.source_id.split("/").pop() ?? paper.source_id}`}>
                      {paper.title}
                    </Link>
                  </h3>
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
              <p className={styles.paperSummary}>{paper.short_summary || "No summary available."}</p>
              <p className={styles.paperConcepts}>
                {paper.concepts.slice(0, 6).join(", ") || "No concept labels"}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
