import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDomainPapersIndex } from "../../../../lib/workplace";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getDomainPapersIndex(slug);

  if (!detail) {
    return { title: "Papers Not Found" };
  }

  return {
    title: `${detail.domain.title} Papers | Domain Intel`,
    description: `${detail.archive.length.toLocaleString()} papers in the React archive view.`,
  };
}

export default async function DomainPapersPage({ params }: Props) {
  const { slug } = await params;
  const detail = await getDomainPapersIndex(slug);

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
        <p className={styles.eyebrow}>Paper Shelves</p>
        <h1 className={styles.title}>{detail.domain.title} papers</h1>
        <p className={styles.copy}>
          Root-topic shelves plus a citation-sorted archive generated directly from `sources.jsonl`.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Browse by topic</h2>
        <div className={styles.shelfGrid}>
          {detail.shelves.map((shelf) => (
            <article key={shelf.topicId} className={styles.shelfCard}>
              <div className={styles.shelfTop}>
                <h3 className={styles.shelfTitle}>{shelf.topicLabel}</h3>
                <Link href={`/domains/${slug}/topics/${shelf.topicId}`} className={styles.inlineLink}>
                  Topic
                </Link>
              </div>
              <div className={styles.paperList}>
                {shelf.papers.map((paper) => (
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
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Archive</h2>
        <div className={styles.archiveList}>
          {detail.archive.map((paper) => (
            <div key={paper.source_id} className={styles.archiveRow}>
              <div>
                <Link
                  href={`/domains/${slug}/papers/${paper.source_id.split("/").pop() ?? paper.source_id}`}
                  className={styles.archiveTitle}
                >
                  {paper.title}
                </Link>
                <p className={styles.archiveMeta}>
                  {paper.year ?? "n/a"} / {paper.cited_by_count.toLocaleString()} cites / {paper.primaryTopicLabel ?? "unassigned"}
                </p>
              </div>
              {paper.primaryTopicId ? (
                <Link href={`/domains/${slug}/topics/${paper.primaryTopicId}`} className={styles.inlineLink}>
                  Topic
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
