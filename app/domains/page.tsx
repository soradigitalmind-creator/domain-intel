import type { Metadata } from "next";
import { listDomains, listPortalCategories } from "../../lib/workplace";
import styles from "./domains.module.css";
import { DomainsTable } from "./domains-table";

export const metadata: Metadata = {
  title: "All domains",
  description: "Complete index of research domains: papers, topics, and entity maps.",
};

export default async function DomainsIndexPage() {
  const [domains, categories] = await Promise.all([listDomains(), listPortalCategories()]);
  const categoryBySlug = Object.fromEntries(
    categories.flatMap((cat) => cat.domains.map((d) => [d.slug, cat.label]))
  );

  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <h1 className={styles.title}>All domains</h1>
        <p className={styles.copy}>A complete index of research domains.</p>
      </section>

      <section className={styles.section}>
        <DomainsTable domains={domains} categoryBySlug={categoryBySlug} />
      </section>
    </main>
  );
}
