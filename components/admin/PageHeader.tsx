import styles from "./AdminShell.module.css"

/**
 * The header every admin page opens with: a mono eyebrow carrying the
 * section, the page title, and one line on what the page manages. The
 * shell renders it from the nav config, so pages stay consistent without
 * each one repeating the markup.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className={styles.pageHeader}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="page-title">{title}</h1>
        {description && <p className={styles.pageDescription}>{description}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </div>
  )
}
