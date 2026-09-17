import { listProjects, createProject } from "./actions"
import ProjectsListClient from "./ProjectsListClient"
import styles from "./projects.module.css"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  const projects = await listProjects()

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className="eyebrow">Work</span>
          <h1 className="page-title">Projects</h1>
          <p className={styles.pageSubtitle}>Manage the portfolio&rsquo;s published and draft case studies.</p>
        </div>
        <form action={createProject}>
          <input type="hidden" name="title" value="Untitled Project" />
          <button type="submit" className={`btn btn-primary ${styles.addProjectBtn}`}>
            + Add Project
          </button>
        </form>
      </div>
      <ProjectsListClient projects={projects} />
    </div>
  )
}
