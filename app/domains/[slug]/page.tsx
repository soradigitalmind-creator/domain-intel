import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDomainDetail, listDomainSlugs } from "../../../lib/workplace";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listDomainSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const domain = await getDomainDetail(slug);

  if (!domain) {
    return {
      title: "Domain Not Found",
    };
  }

  return {
    title: domain.title,
    description: `${domain.sources.toLocaleString()} papers and ${domain.topicCount.toLocaleString()} topics — topic map and paper index.`,
  };
}

export default async function DomainPage({ params }: Props) {
  const { slug } = await params;
  const domain = await getDomainDetail(slug);

  if (!domain) {
    notFound();
  }

  const parentTopics = domain.subgenres.filter((item) => item.parent_id === null).slice(0, 12);
  const childMap = new Map(
    domain.subgenres
      .filter((item) => item.parent_id)
      .reduce<Array<[string, typeof domain.subgenres]>>((acc, item) => {
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

  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <h1 className={styles.title}>{domain.title}</h1>
        <p className={styles.copy}>
          {domain.abstractionLabel ??
            "A monochrome browsing surface for moving through landmark papers, topic clusters, and high-signal subtopics without relying on search."}
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.topicGrid}>
          {parentTopics.map((topic) => {
            const children = (childMap.get(topic.subgenre_id) ?? []).slice(0, 6);
            const labels =
              children.length > 0
                ? children.map((item) => item.label)
                : topic.member_terms.slice(0, 6);

            return (
              <Link
                key={topic.subgenre_id}
                href={`/domains/${slug}/topics/${topic.subgenre_id}`}
                className={styles.topicCard}
              >
                <h2 className={styles.topicTitle}>{topic.label}</h2>
                <div className={styles.topicList}>
                  {labels.map((label) => (
                    <span key={label} className={styles.topicItem}>
                      {label}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.footerLinks}>
          <Link href={`/domains/${slug}/topics`} className={styles.footerLink}>
            Topic atlas
          </Link>
          <Link href={`/domains/${slug}/papers`} className={styles.footerLink}>
            Papers
          </Link>
        </div>
      </section>
    </main>
  );
}
