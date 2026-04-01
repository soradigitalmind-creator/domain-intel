import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listCategorySlugs } from "../../../lib/workplace";
import styles from "./category.module.css";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category" };
  }

  return {
    title: category.label,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <h1 className={styles.title}>{category.label}</h1>
        <p className={styles.copy}>{category.description}</p>
      </section>

      <section className={styles.section}>
        {category.domains.length > 0 ? (
          <div className={styles.grid}>
            {category.domains.map((d) => (
              <Link key={d.slug} href={`/domains/${d.slug}`} className={styles.card}>
                <strong className={styles.cardTitle}>{d.title}</strong>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No domains are listed in this category yet.</p>
        )}
      </section>
    </main>
  );
}
