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
    title: `${domain.title} | Domain Intel`,
    description: `${domain.sources.toLocaleString()} papers and ${domain.topicCount.toLocaleString()} topics rendered from workplace JSON.`,
  };
}

export default async function DomainPage({ params }: Props) {
  const { slug } = await params;
  const domain = await getDomainDetail(slug);

  if (!domain) {
    notFound();
  }

  const featuredTopics = domain.subgenres.slice(0, 12);
  const parentTopics = domain.subgenres.filter((item) => item.parent_id === null).slice(0, 8);
  const activeRoleProfiles = domain.roleProfiles.slice(0, 10);

  return (
    <main className="page-shell">
      <div className={styles.backRow}>
        <Link href="/" className={styles.backLink}>
          Back to domains
        </Link>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Site Data Contract</p>
          <h1 className={styles.title}>{domain.title}</h1>
          <p className={styles.copy}>
            This page is rendered from Python-generated site JSON when available, with
            `workplace/{domain.slug}` only used as a fallback data source.
          </p>
          {domain.abstractionLabel ? (
            <p className={styles.copy}>{domain.abstractionLabel}</p>
          ) : null}
        </div>

        <div className={styles.metricGrid}>
          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Papers</span>
            <strong className={styles.metricValue}>{domain.sources.toLocaleString()}</strong>
          </article>
          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Topics</span>
            <strong className={styles.metricValue}>{domain.topicCount.toLocaleString()}</strong>
          </article>
          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Entities</span>
            <strong className={styles.metricValue}>{domain.entities.toLocaleString()}</strong>
          </article>
          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Claims</span>
            <strong className={styles.metricValue}>{domain.claims.toLocaleString()}</strong>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Overview split</h2>
          <p className={styles.sectionCopy}>
            Partitioning metadata already present in the pipeline output.
          </p>
        </div>
        <div className={styles.partitionGrid}>
          <article className={styles.partitionCard}>
            <span className={styles.partitionLabel}>Overview papers</span>
            <strong className={styles.partitionValue}>{domain.overviewPapers.toLocaleString()}</strong>
          </article>
          <article className={styles.partitionCard}>
            <span className={styles.partitionLabel}>Topical papers</span>
            <strong className={styles.partitionValue}>{domain.topicalPapers.toLocaleString()}</strong>
          </article>
          {Object.entries(domain.facetCounts).map(([facet, count]) => (
            <article key={facet} className={styles.partitionCard}>
              <span className={styles.partitionLabel}>{facet}</span>
              <strong className={styles.partitionValue}>{count.toLocaleString()}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.jumpRow}>
          <Link href={`/domains/${slug}/topics`} className={styles.jumpLink}>
            Open topic atlas
          </Link>
          <Link href={`/domains/${slug}/papers`} className={styles.jumpLink}>
            Open paper archive
          </Link>
        </div>
      </section>

      {domain.risingTopics && domain.risingTopics.length > 0 ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Rising topics</h2>
            <p className={styles.sectionCopy}>
              These come from Python-side derived site data rather than React-side heuristics.
            </p>
          </div>
          <div className={styles.topicGrid}>
            {domain.risingTopics.map((topic) => (
              <Link key={topic.id} href={`/domains/${slug}/topics/${topic.id}`} className={styles.topicCard}>
                <div className={styles.topicHeader}>
                  <h3 className={styles.topicTitle}>{topic.label}</h3>
                  <span className={styles.topicCount}>{topic.trend}</span>
                </div>
                <p className={styles.topicMeta}>
                  {topic.year_total ? `${topic.year_total.toLocaleString()} recent counted papers` : "Derived from topic-year counts"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Parent topics</h2>
          <p className={styles.sectionCopy}>
            Top-level groups from `subgenres.json`. Child-topic navigation can build on this next.
          </p>
        </div>
        <div className={styles.topicGrid}>
          {parentTopics.map((topic) => (
            <Link
              key={topic.subgenre_id}
              href={`/domains/${slug}/topics/${topic.subgenre_id}`}
              className={styles.topicCard}
            >
              <div className={styles.topicHeader}>
                <h3 className={styles.topicTitle}>{topic.label}</h3>
                <span className={styles.topicCount}>{topic.paper_ids.length} papers</span>
              </div>
              <p className={styles.topicSummary}>{topic.summary}</p>
              <p className={styles.topicMeta}>
                Entities: {topic.top_entities.slice(0, 4).join(", ") || "none"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured topics</h2>
          <p className={styles.sectionCopy}>
            Representative rows from the current topic structure.
          </p>
        </div>
        <div className={styles.topicGrid}>
          {featuredTopics.map((topic) => (
            <Link
              key={topic.subgenre_id}
              href={`/domains/${slug}/topics/${topic.subgenre_id}`}
              className={styles.topicCard}
            >
              <div className={styles.topicHeader}>
                <h3 className={styles.topicTitle}>{topic.label}</h3>
                <span className={styles.topicCount}>L{topic.level}</span>
              </div>
              <p className={styles.topicSummary}>{topic.summary}</p>
              <p className={styles.topicMeta}>
                Properties: {topic.top_properties.slice(0, 3).join(", ") || "none"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Role profiles</h2>
          <p className={styles.sectionCopy}>
            Semantic and UI-role hints already produced by the pipeline.
          </p>
        </div>
        <div className={styles.roleGrid}>
          {activeRoleProfiles.map((profile) => (
            <article key={profile.label} className={styles.roleCard}>
              <div className={styles.roleTop}>
                <strong className={styles.roleLabel}>{profile.label}</strong>
                <span className={styles.roleConfidence}>
                  {Math.round(profile.confidence * 100)}%
                </span>
              </div>
              <p className={styles.roleMeta}>
                {profile.semantic_role} / {profile.topic_role} / {profile.ui_role}
              </p>
              <p className={styles.roleMeta}>{profile.evidence_count} evidence rows</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
