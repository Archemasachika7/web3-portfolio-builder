import styles from "./loading.module.css"

/**
 * Every admin page is force-dynamic — it re-queries Supabase on each
 * navigation. Without this, clicking a nav link showed nothing at all
 * until the server finished rendering, which reads as an unresponsive
 * button. Next renders this instantly on navigation instead, and can
 * prefetch it on link hover.
 */
export default function Loading() {
  return (
    <div className={styles.wrap} aria-busy="true" aria-label="Loading">
      <div className={styles.header}>
        <div className={`skeleton ${styles.eyebrow}`} />
        <div className={`skeleton ${styles.title}`} />
        <div className={`skeleton ${styles.sub}`} />
      </div>

      <div className={styles.rows}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`skeleton ${styles.row}`} />
        ))}
      </div>
    </div>
  )
}
