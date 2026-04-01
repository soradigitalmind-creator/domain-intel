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
                  {(child.member_terms.length > 0
                    ? child.member_terms.slice(0, 6)
                    : child.top_entities.slice(0, 6)
                  ).map((item) => (
                    <span key={item} className={styles.childItem}>
                      {item}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
