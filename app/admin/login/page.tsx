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
      <div className={`card ${styles.panel}`}>
        <span className={styles.mark}>ARCHISHMAN DAS · ADMIN</span>
        <h1 className={styles.heading}>Sign in</h1>
        <LoginForm next={next} />
      </div>
    </main>
  )
}
