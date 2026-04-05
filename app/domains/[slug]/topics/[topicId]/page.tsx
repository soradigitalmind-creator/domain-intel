import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicDetail, listTopicStaticParams } from "../../../../../lib/workplace";
import { SetTrail } from "../../../../components/trail-context";
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

  const grandchildMap = new Map(
    detail.allSubgenres
      .filter((item) => item.parent_id)
      .reduce<Array<[string, typeof detail.allSubgenres]>>((acc, item) => {
        const key = item.parent_id as string;
        const existing = acc.find(([id]) => id === key);
        if (existing) {
          existing[1].push(item);
        } else {
          acc.push([key, [item]]);
        }
        return acc;
      }, [])
  );

  // Build ancestor chain for breadcrumb
  const topicTrail: { href: string; label: string }[] = [];
  if (detail.topic.parent_id) {
    const parent = detail.allSubgenres.find((item) => item.subgenre_id === detail.topic.parent_id);
    if (parent) {
      topicTrail.push({
        href: `/domains/${slug}/topics/${parent.subgenre_id}`,
        label: parent.label,
      });
    }
  }
  topicTrail.push({
    href: `/domains/${slug}/topics/${topicId}`,
    label: detail.topic.label,
  });

  return (
    <main className="page-shell">
      <SetTrail items={topicTrail} />
      <section className={styles.hero}>
        <h1 className={styles.title}>{detail.topic.label}</h1>
        <p className={styles.copy}>{detail.topic.summary}</p>
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
                <div className={styles.childList}>
                  {(grandchildMap.get(child.subgenre_id) ?? []).slice(0, 6).map((item) => (
                    <span key={item.subgenre_id} className={styles.childItem}>
                      {item.label}
                    </span>
                  ))}
                </div>
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
    </main>
  );
}
