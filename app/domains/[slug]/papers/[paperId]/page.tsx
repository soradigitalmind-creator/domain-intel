import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPaperDetail, listPaperStaticParams } from "../../../../../lib/workplace";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ slug: string; paperId: string }>;
};

export async function generateStaticParams() {
  return listPaperStaticParams();
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, paperId } = await params;
  const detail = await getPaperDetail(slug, paperId);

  if (!detail) {
    return { title: "Paper Not Found" };
  }

  return {
    title: detail.paper.title,
    description: detail.paper.short_summary || `${detail.paper.cited_by_count.toLocaleString()} citations`,
  };
}

export default async function PaperPage({ params }: Props) {
  const { slug, paperId } = await params;
  const detail = await getPaperDetail(slug, paperId);

  if (!detail) {
    notFound();
  }

  return (
    <main className="page-shell">
      <div className={styles.backRow}>
        <Link href={`/domains/${slug}`} className={styles.backLink}>
          Back to {detail.domain.title}
        </Link>
        {detail.paper.primaryTopicId ? (
          <Link
            href={`/domains/${slug}/topics/${detail.paper.primaryTopicId}`}
            className={styles.backLink}
          >
            Open primary topic
          </Link>
        ) : null}
      </div>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Paper Detail</p>
        <h1 className={styles.title}>{detail.paper.title}</h1>
        <p className={styles.meta}>
          {detail.paper.year ?? "n/a"} / {detail.paper.cited_by_count.toLocaleString()} citations / adjusted {detail.paper.adjusted_cited_by_count.toFixed(2)}
        </p>
        <p className={styles.summary}>{detail.paper.short_summary || "No summary available."}</p>
        <div className={styles.linkRow}>
          <a href={detail.paper.url} target="_blank" rel="noreferrer" className={styles.primaryLink}>
            Open source
          </a>
          {detail.paper.doi ? (
            <a href={detail.paper.doi} target="_blank" rel="noreferrer" className={styles.secondaryLink}>
              DOI
            </a>
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Assignment</h2>
        <div className={styles.infoCard}>
          <p className={styles.infoLine}>
            Primary topic: {detail.paper.primaryTopicId ?? "none"}
          </p>
          <p className={styles.infoLine}>
            Secondary topics: {detail.paper.secondaryTopicIds.join(", ") || "none"}
          </p>
          <p className={styles.infoLine}>
            Matched terms: {detail.paper.assignment?.matched_terms.join(", ") || "none"}
          </p>
          <p className={styles.infoLine}>
            Confidence: {detail.paper.assignment ? `${Math.round(detail.paper.assignment.confidence * 100)}%` : "n/a"}
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Concepts</h2>
        <div className={styles.tagGrid}>
          {detail.paper.concepts.map((concept) => (
            <span key={concept} className={styles.tag}>
              {concept}
            </span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Entities</h2>
        <div className={styles.entityGrid}>
          {detail.paper.entities.map((entity) => (
            <article key={entity.canonical_id} className={styles.entityCard}>
              <strong className={styles.entityName}>{entity.canonical_name}</strong>
              <p className={styles.entityMeta}>
                {entity.entity_type} / evidence {entity.evidence_count}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Claims</h2>
        {detail.paper.claims.length > 0 ? (
          <div className={styles.claimGrid}>
            {detail.paper.claims.map((claim, index) => (
              <article key={`${claim.property_name}-${index}`} className={styles.claimCard}>
                <strong className={styles.claimName}>
                  {claim.property_name}: {claim.value_text} {claim.unit}
                </strong>
                <p className={styles.claimMeta}>
                  {claim.polarity} / {Math.round(claim.confidence * 100)}%
                </p>
                <p className={styles.claimText}>{claim.evidence_text}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>No extracted claims for this paper.</p>
        )}
      </section>
    </main>
  );
}
