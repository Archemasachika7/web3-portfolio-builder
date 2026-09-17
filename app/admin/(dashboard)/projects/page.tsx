import { listProjects, createProject } from "./actions"
import ProjectsListClient from "./ProjectsListClient"
import styles from "./projects.module.css"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  const projects = await listProjects()

  return (
    <div className={styles.page}>
      <form action={createProject} className={styles.newForm}>
        <input
          type="text"
          name="title"
          placeholder="New project title…"
          required
          className="input"
        />
        <button type="submit" className="btn btn-primary">
          Create draft
        </button>
      </form>
      <ProjectsListClient projects={projects} />
    </div>
  )
}
