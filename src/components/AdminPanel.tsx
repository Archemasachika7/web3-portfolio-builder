"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  LockKeyhole,
  Vault,
  FileUp,
  FileCheck2,
  FileX2,
  FolderUp,
  PanelLeft,
  Workflow,
  FileCog,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

type IPFSUploadResult = {
  cid: string
  url: string
  pinned: boolean
}

export type Project = {
  id: string
  title: string
  description: string
  repoUrl?: string
  nftBadgeUrl?: string
  ipfsAsset?: {
    cid: string
    url: string
    pinned: boolean
    name?: string
    size?: number
  }
  updatedAt: string
  createdAt: string
}

type AdminPanelProps = {
  className?: string
  style?: React.CSSProperties
  // Auth
  validatePassword?: (password: string) => Promise<boolean>
  onLogout?: () => void
  // Data
  initialProjects?: Project[]
  // Upload handlers
  onUploadResume?: (
    file: File,
    onProgress: (progress: number) => void
  ) => Promise<IPFSUploadResult>
  onUploadToIPFS?: (
    file: File,
    onProgress: (progress: number) => void
  ) => Promise<IPFSUploadResult>
  // CRUD handlers
  onCreateProject?: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<Project>
  onUpdateProject?: (project: Project) => Promise<Project>
  onDeleteProject?: (id: string) => Promise<void>
}

const DEFAULT_DELAY = 900

function useLocalSession(key: string) {
  const [isAuthed, setAuthed] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem(key)
    setAuthed(saved === "true")
  }, [key])

  const save = useCallback(
    (value: boolean) => {
      setAuthed(value)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value ? "true" : "false")
      }
    },
    [key]
  )

  const clear = useCallback(() => {
    setAuthed(false)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key)
    }
  }, [key])

  return { isAuthed, save, clear }
}

const fallbackValidatePassword = async (password: string) => {
  // DO NOT use in production. Provide a secure server-side validator.
  await new Promise((r) => setTimeout(r, DEFAULT_DELAY))
  return password.length >= 10
}

const fallbackUpload = async (
  file: File,
  onProgress: (p: number) => void
): Promise<IPFSUploadResult> => {
  // Mock progress
  const totalSteps = 6
  for (let i = 1; i <= totalSteps; i++) {
    await new Promise((r) => setTimeout(r, 200))
    onProgress(Math.round((i / totalSteps) * 100))
  }
  const cid = `bafy${Math.random().toString(36).slice(2)}`
  return {
    cid,
    url: `https://ipfs.io/ipfs/${cid}/${encodeURIComponent(file.name)}`,
    pinned: true,
  }
}

const fallbackCreateProject = async (
  project: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<Project> => {
  await new Promise((r) => setTimeout(r, DEFAULT_DELAY))
  const now = new Date().toISOString()
  return {
    ...project,
    id: Math.random().toString(36).slice(2),
    createdAt: now,
    updatedAt: now,
  }
}

const fallbackUpdateProject = async (project: Project) => {
  await new Promise((r) => setTimeout(r, DEFAULT_DELAY))
  return { ...project, updatedAt: new Date().toISOString() }
}

const fallbackDeleteProject = async (_id: string) => {
  await new Promise((r) => setTimeout(r, DEFAULT_DELAY))
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString()
}

function ProjectPreview({ project }: { project: Project }) {
  return (
    <Card className="bg-card border border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg md:text-xl">{project.title || "Untitled Project"}</CardTitle>
        <CardDescription>{project.repoUrl ? new URL(project.repoUrl).hostname : "No repository linked"}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm text-muted-foreground break-words">{project.description || "No description provided yet."}</p>
        <div className="rounded-md bg-secondary/50 border border-border/60 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Workflow className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Assets</span>
          </div>
          <Separator className="my-2 bg-border/70" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <FileCog className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="min-w-0 truncate">
                {project.ipfsAsset?.url ? project.ipfsAsset.url : "No IPFS asset"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Vault className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="min-w-0 truncate">
                {project.nftBadgeUrl || "No NFT badge"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminPanel({
  className,
  style,
  validatePassword = fallbackValidatePassword,
  onLogout,
  initialProjects = [],
  onUploadResume = fallbackUpload,
  onUploadToIPFS = fallbackUpload,
  onCreateProject = fallbackCreateProject,
  onUpdateProject = fallbackUpdateProject,
  onDeleteProject = fallbackDeleteProject,
}: AdminPanelProps) {
  const { isAuthed, save, clear } = useLocalSession("@admin-session")
  const [authLoading, setAuthLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [activeTab, setActiveTab] = useState<"resume" | "projects">("resume")

  // Resume upload
  const [resumeProgress, setResumeProgress] = useState(0)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)

  // Project form
  const emptyProject: Project = useMemo(
    () => ({
      id: "",
      title: "",
      description: "",
      repoUrl: "",
      nftBadgeUrl: "",
      ipfsAsset: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    []
  )
  const [editing, setEditing] = useState<Project>(emptyProject)
  const [editOpen, setEditOpen] = useState(false)
  const [ipfsProgress, setIpfsProgress] = useState(0)
  const [ipfsUploading, setIpfsUploading] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const ipfsInputRef = useRef<HTMLInputElement | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      const ok = await validatePassword(password)
      if (ok) {
        save(true)
        toast.success("Authenticated")
      } else {
        toast.error("Invalid password")
      }
    } catch {
      toast.error("Authentication error")
    } finally {
      setAuthLoading(false)
      setPassword("")
    }
  }

  const handleLogout = () => {
    clear()
    onLogout?.()
    toast.message("Logged out")
  }

  const handleResumeUpload = async (file: File) => {
    setResumeProgress(0)
    setResumeUploading(true)
    try {
      const res = await onUploadResume(file, (p) => setResumeProgress(p))
      setResumeUrl(res.url)
      toast.success("Resume uploaded and pinned to IPFS")
    } catch {
      toast.error("Failed to upload resume")
    } finally {
      setResumeUploading(false)
    }
  }

  const startEdit = (p?: Project) => {
    setEditing(p ? { ...p } : { ...emptyProject, id: "" })
    setIpfsProgress(0)
    setEditOpen(true)
  }

  const handleProjectFileUpload = async (file: File) => {
    setIpfsProgress(0)
    setIpfsUploading(true)
    try {
      const res = await onUploadToIPFS(file, (p) => setIpfsProgress(p))
      setEditing((prev) => ({
        ...prev,
        ipfsAsset: { ...res, name: file.name, size: file.size },
      }))
      toast.success("Asset uploaded to IPFS")
    } catch {
      toast.error("Failed to upload to IPFS")
    } finally {
      setIpfsUploading(false)
    }
  }

  const handleSaveProject = async () => {
    // Basic validation
    if (!editing.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (editing.repoUrl && !isValidUrl(editing.repoUrl)) {
      toast.error("Repository URL is invalid")
      return
    }
    if (editing.nftBadgeUrl && !isValidUrl(editing.nftBadgeUrl)) {
      toast.error("NFT badge URL is invalid")
      return
    }
    try {
      if (!editing.id) {
        const created = await onCreateProject({
          title: editing.title.trim(),
          description: editing.description.trim(),
          repoUrl: editing.repoUrl?.trim(),
          nftBadgeUrl: editing.nftBadgeUrl?.trim(),
          ipfsAsset: editing.ipfsAsset,
        })
        setProjects((prev) => [created, ...prev])
        toast.success("Project added")
      } else {
        const updated = await onUpdateProject(editing)
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        toast.success("Project updated")
      }
      setEditOpen(false)
    } catch {
      toast.error("Failed to save project")
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await onDeleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success("Project deleted")
    } catch {
      toast.error("Failed to delete project")
    } finally {
      setDeleteId(null)
    }
  }

  const onSelectResumeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file")
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)")
      return
    }
    void handleResumeUpload(file)
    e.currentTarget.value = ""
  }

  const onSelectProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File too large (max 100MB)")
      return
    }
    void handleProjectFileUpload(file)
    e.currentTarget.value = ""
  }

  if (!isAuthed) {
    return (
      <Card className={cn("bg-card border border-border/60 shadow-none w-full", className)} style={style}>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <PanelLeft className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-xs">Admin Access</span>
          </div>
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Secure Admin Panel</CardTitle>
          <CardDescription>Sign in with the admin password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-primary" aria-hidden="true" />
                Admin Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your secure admin password"
                className="bg-secondary border-border/60"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
              />
              <p className="text-xs text-muted-foreground">Minimum 10 characters. Keep it secret, keep it safe.</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Vault className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Protected route: /admin</span>
              </div>
              <Button type="submit" disabled={authLoading} className="bg-primary text-primary-foreground hover:opacity-90">
                {authLoading ? "Verifying..." : "Unlock"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("w-full max-w-full", className)} style={style}>
      <Card className="bg-card border border-border/60 shadow-none">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <PanelLeft className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <CardTitle className="text-lg sm:text-xl md:text-2xl truncate">Admin Control Center</CardTitle>
            </div>
            <Button
              variant="secondary"
              className="bg-secondary text-foreground hover:bg-secondary/80"
              onClick={handleLogout}
              aria-label="Log out"
            >
              Logout
            </Button>
          </div>
          <CardDescription className="text-muted-foreground">
            Manage your resume and portfolio projects. All file uploads are pinned to IPFS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
            <TabsList className="bg-secondary/60 border border-border/70">
              <TabsTrigger value="resume" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                <FileUp className="h-4 w-4 mr-2" aria-hidden="true" />
                Resume
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                <Workflow className="h-4 w-4 mr-2" aria-hidden="true" />
                Projects
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resume" className="mt-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="resume" className="flex items-center gap-2">
                    <FolderUp className="h-4 w-4 text-primary" aria-hidden="true" />
                    Upload Resume (PDF)
                  </Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      id="resume"
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={onSelectResumeFile}
                      className="bg-secondary border-border/60 max-w-sm"
                      aria-describedby="resume-help"
                    />
                    <Button
                      type="button"
                      disabled={resumeUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-primary text-primary-foreground hover:opacity-90"
                    >
                      <FileUp className="h-4 w-4 mr-2" aria-hidden="true" />
                      {resumeUploading ? "Uploading..." : "Select PDF"}
                    </Button>
                  </div>
                  <p id="resume-help" className="text-xs text-muted-foreground">
                    Max 20MB. File is auto-pinned to IPFS upon upload.
                  </p>
                  {resumeUploading && (
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Uploading to IPFS</span>
                        <span>{resumeProgress}%</span>
                      </div>
                      <Progress value={resumeProgress} className="h-2 bg-secondary" />
                    </div>
                  )}
                  {resumeUrl && !resumeUploading && (
                    <div className="rounded-md border border-border/60 bg-secondary/40 p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileCheck2 className="h-4 w-4 text-chart-3" aria-hidden="true" />
                        <span className="min-w-0 truncate break-words">
                          Uploaded: {resumeUrl}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Share this IPFS gateway link or embed it in your public resume section.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <div className="grid gap-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Workflow className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="text-sm">Manage Projects</span>
                  </div>
                  <Button
                    className="bg-primary text-primary-foreground hover:opacity-90"
                    onClick={() => startEdit()}
                  >
                    <FileUp className="h-4 w-4 mr-2" aria-hidden="true" />
                    New Project
                  </Button>
                </div>

                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-secondary/40">
                      <TableRow className="hover:bg-secondary/40">
                        <TableHead className="w-[38%]">Title</TableHead>
                        <TableHead className="w-[22%]">Repository</TableHead>
                        <TableHead className="w-[20%]">Last Updated</TableHead>
                        <TableHead className="w-[20%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                            No projects yet. Create your first project.
                          </TableCell>
                        </TableRow>
                      ) : (
                        projects.map((p) => (
                          <TableRow key={p.id} className="hover:bg-secondary/30">
                            <TableCell className="min-w-0">
                              <div className="flex flex-col">
                                <span className="truncate font-medium">{p.title}</span>
                                <span className="text-xs text-muted-foreground line-clamp-1">{p.description}</span>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-0">
                              <span className="text-sm text-muted-foreground truncate break-words">
                                {p.repoUrl || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{formatDate(p.updatedAt)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="secondary" className="bg-secondary hover:bg-secondary/80" size="sm" onClick={() => startEdit(p)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeleteId(p.id)}
                                  className="bg-destructive text-destructive-foreground hover:opacity-90"
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-popover text-popover-foreground border border-border/60">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Project" : "New Project"}</DialogTitle>
            <DialogDescription>Provide details and upload optional IPFS assets.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-3 sm:col-span-1">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  className="bg-secondary border-border/60"
                  placeholder="Project title"
                  value={editing.title}
                  onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repo">Repository URL</Label>
                <Input
                  id="repo"
                  className="bg-secondary border-border/60"
                  placeholder="https://github.com/username/repo"
                  inputMode="url"
                  value={editing.repoUrl ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p, repoUrl: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="badge">NFT Badge URL</Label>
                <Input
                  id="badge"
                  className="bg-secondary border-border/60"
                  placeholder="https://example.com/nft-badge.png"
                  inputMode="url"
                  value={editing.nftBadgeUrl ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p, nftBadgeUrl: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  className="bg-secondary border-border/60 min-h-28"
                  placeholder="Brief description of the project..."
                  value={editing.description}
                  onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-primary" aria-hidden="true" />
                  IPFS Asset (optional)
                </Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    ref={ipfsInputRef}
                    type="file"
                    onChange={onSelectProjectFile}
                    className="bg-secondary border-border/60 max-w-sm"
                  />
                  <Button
                    type="button"
                    disabled={ipfsUploading}
                    onClick={() => ipfsInputRef.current?.click()}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <FileUp className="h-4 w-4 mr-2" aria-hidden="true" />
                    {ipfsUploading ? "Uploading..." : "Select File"}
                  </Button>
                </div>
                {ipfsUploading && (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uploading to IPFS</span>
                      <span>{ipfsProgress}%</span>
                    </div>
                    <Progress value={ipfsProgress} className="h-2 bg-secondary" />
                  </div>
                )}
                {editing.ipfsAsset && !ipfsUploading && (
                  <div className="rounded-md border border-border/60 bg-secondary/40 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileCheck2 className="h-4 w-4 text-chart-3" aria-hidden="true" />
                      <span className="min-w-0 truncate break-words">
                        {editing.ipfsAsset.url}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      CID: {editing.ipfsAsset.cid} • {editing.ipfsAsset.pinned ? "Pinned" : "Unpinned"}
                      {editing.ipfsAsset.name ? ` • ${editing.ipfsAsset.name}` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="sm:col-span-1 min-w-0">
              <Label className="mb-2 block">Live Preview</Label>
              <ProjectPreview project={editing} />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditOpen(false)}
              className="bg-secondary text-foreground hover:bg-secondary/80"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveProject}
              className="bg-primary text-primary-foreground hover:opacity-90"
              disabled={!editing.title.trim()}
            >
              {editing.id ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-popover text-popover-foreground border border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileX2 className="h-5 w-5 text-destructive" aria-hidden="true" />
              Delete project?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the project from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={() => deleteId && handleDeleteProject(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function isValidUrl(v?: string) {
  if (!v) return true
  try {
    new URL(v)
    return true
  } catch {
    return false
  }
}