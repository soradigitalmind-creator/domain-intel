import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <section className={styles.heroPanel}>
        <p className={styles.eyebrow}>Not Found</p>
        <h1 className={styles.title}>Domain not available</h1>
        <p className={styles.copy}>
          The requested generated domain data could not be found.
        </p>
        <Link href="/" className={styles.pillLink}>Back to home</Link>
      </section>
    </main>
  );
}
