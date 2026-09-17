import LoginForm from "./LoginForm"
import styles from "./login.module.css"

export const metadata = {
  title: "Sign in | Portfolio Admin"
}

export default function LoginPage({
  searchParams
}: {
  searchParams: { next?: string }
}) {
  const next = searchParams.next && searchParams.next.startsWith("/admin") ? searchParams.next : "/admin"

  return (
    <main className={styles.page}>
      <aside className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <span className={styles.mark}>Portfolio CMS</span>
        </div>
        <div className={styles.brandMiddle}>
          <h1 className={styles.brandName}>Archishman Das</h1>
          <p className={styles.brandLine}>
            Projects, media, documents and site content — managed in one place.
          </p>
        </div>
        <div className={styles.brandRules} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </aside>

      <section className={styles.formPanel}>
        <div className={styles.formInner}>
          <span className={styles.formEyebrow}>Restricted access</span>
          <h2 className={styles.heading}>Sign in</h2>
          <p className={styles.subheading}>Use the admin account for this portfolio&rsquo;s Supabase project.</p>
          <LoginForm next={next} />
        </div>
      </section>
    </main>
  )
}
