"use client"

import * as React from "react"
import { Github, PencilRuler, SquareChartGantt, LayoutGrid, Grid2x2Plus, FolderKanban } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type Mode = "ai" | "ce"

type Proof =
  | { status: "minted"; txUrl: string; network?: "ethereum" | "polygon" | "base" | string }
  | { status: "pending" }

export interface PortfolioProject {
  id: string
  mode: Mode
  title: string
  description: string
  tags: string[]
  repoUrl?: string
  demoUrl?: string
  proof?: Proof
}

export interface PortfolioSectionProps {
  className?: string
  style?: React.CSSProperties
  initialMode?: Mode
  projects?: PortfolioProject[]
  defaultSelectedTags?: string[]
  loadingDurationMs?: number
}

const DEFAULT_PROJECTS: PortfolioProject[] = [
  {
    id: "ai-llm-agent",
    mode: "ai",
    title: "Autonomous LLM Research Agent",
    description:
      "A multi-tool agent for literature review and experiment planning using retrieval-augmented generation and toolformer-style function calling.",
    tags: ["LLM", "RAG", "TypeScript", "OpenAI", "Vector DB"],
    repoUrl: "https://github.com/yourname/llm-research-agent",
    demoUrl: "https://your-demo.com/agent",
    proof: { status: "minted", txUrl: "https://basescan.org/tx/0x123" },
  },
  {
    id: "ai-time-series",
    mode: "ai",
    title: "Time-series Forecasting Pipeline",
    description:
      "End-to-end pipeline with feature stores, model registry, and champion-challenger evaluation for energy demand forecasting.",
    tags: ["MLOps", "Time Series", "Python", "Airflow", "MLflow"],
    repoUrl: "https://github.com/yourname/ts-forecasting",
    proof: { status: "pending" },
  },
  {
    id: "ai-vision-qc",
    mode: "ai",
    title: "Vision-based Quality Control",
    description:
      "Lightweight CNN + ViT hybrid for defect detection with on-device quantization and Grad-CAM explainability.",
    tags: ["Computer Vision", "PyTorch", "Quantization", "Edge AI"],
    repoUrl: "https://github.com/yourname/vision-qc",
    proof: { status: "minted", txUrl: "https://polygonscan.com/tx/0xabc" },
  },
  {
    id: "ce-bridge-bim",
    mode: "ce",
    title: "Parametric Bridge BIM Toolkit",
    description:
      "Procedural generation of girder bridges with alignment constraints, quantities, and clash detection export.",
    tags: ["BIM", "Parametric", "Grasshopper", "Python"],
    repoUrl: "https://github.com/yourname/bridge-bim-toolkit",
    proof: { status: "pending" },
  },
  {
    id: "ce-fea-optimizer",
    mode: "ce",
    title: "Steel Frame FEA + Optimizer",
    description:
      "Genetic algorithm driven section optimization with AISC checks and dynamic load combination envelopes.",
    tags: ["FEA", "Optimization", "AISC", "Python"],
    repoUrl: "https://github.com/yourname/fea-optimizer",
    proof: { status: "minted", txUrl: "https://etherscan.io/tx/0xdef" },
  },
  {
    id: "ce-site-logistics",
    mode: "ce",
    title: "Site Logistics Planner",
    description:
      "Interactive crane reach and staging planner with schedule alignment and risk heatmaps.",
    tags: ["Planning", "Simulation", "D3.js", "TypeScript"],
    repoUrl: "https://github.com/yourname/site-logistics-planner",
    demoUrl: "https://your-demo.com/logistics",
    proof: { status: "pending" },
  },
]

function useModeStyles(mode: Mode) {
  // AI: neon blue/purple; CE: earthy orange/green
  const accent = mode === "ai" ? "from-[#6b6ef9] to-[#9b8cff]" : "from-[#f59e0b] to-[#22c55e]"
  const ring = mode === "ai" ? "ring-[#6b6ef9]/40" : "ring-[#f59e0b]/40"
  const highlight = mode === "ai" ? "text-[#9b8cff]" : "text-[#f59e0b]"
  const badgeBg = mode === "ai" ? "bg-[#1b1c25]" : "bg-[#1b221b]"
  return { accent, ring, highlight, badgeBg }
}

export default function PortfolioSection({
  className,
  style,
  initialMode = "ai",
  projects = DEFAULT_PROJECTS,
  defaultSelectedTags = [],
  loadingDurationMs = 400,
}: PortfolioSectionProps) {
  const [mode, setMode] = React.useState<Mode>(initialMode)
  const [selectedTags, setSelectedTags] = React.useState<string[]>(defaultSelectedTags)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), Math.max(0, loadingDurationMs))
    return () => clearTimeout(t)
  }, [loadingDurationMs])

  React.useEffect(() => {
    // Reset filters when switching modes for clarity
    setSelectedTags([])
  }, [mode])

  const modeProjects = React.useMemo(() => projects.filter((p) => p.mode === mode), [projects, mode])

  const allTags = React.useMemo(() => {
    const set = new Set<string>()
    modeProjects.forEach((p) => p.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [modeProjects])

  const filtered = React.useMemo(() => {
    if (selectedTags.length === 0) return modeProjects
    return modeProjects.filter((p) => selectedTags.every((tag) => p.tags.includes(tag)))
  }, [modeProjects, selectedTags])

  const { accent, ring, highlight, badgeBg } = useModeStyles(mode)

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <section
      className={cn(
        "w-full max-w-full",
        "rounded-2xl bg-card/70 backdrop-blur",
        "border border-border",
        "p-4 sm:p-6 md:p-8",
        className
      )}
      style={style}
      aria-label="Portfolio projects"
    >
      <header className="w-full max-w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {mode === "ai" ? (
                <>
                  <SquareChartGantt className="h-3.5 w-3.5" aria-hidden />
                  <span>AI / ML / Data Science</span>
                </>
              ) : (
                <>
                  <PencilRuler className="h-3.5 w-3.5" aria-hidden />
                  <span>Civil / Structural Engineering</span>
                </>
              )}
            </div>
            <h2 className="mt-3 text-xl sm:text-2xl md:text-3xl font-heading tracking-tight">
              Portfolio Showcase
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-prose">
              Explore selected projects. Filter by skill/topic and switch modes to view domain-specific work.
            </p>
          </div>

          <Tabs
            value={mode}
            onValueChange={(v) => setMode((v as Mode) ?? "ai")}
            className="w-full sm:w-auto"
          >
            <TabsList className={cn("grid w-full grid-cols-2")}>
              <TabsTrigger value="ai" aria-label="Show AI and Data Science projects">
                <SquareChartGantt className="mr-2 h-4 w-4" aria-hidden />
                AI / Data
              </TabsTrigger>
              <TabsTrigger value="ce" aria-label="Show Civil and Structural Engineering projects">
                <PencilRuler className="mr-2 h-4 w-4" aria-hidden />
                Civil / Struct
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative mt-6">
          <div
            className={cn(
              "pointer-events-none absolute -inset-x-2 -top-2 h-20 rounded-t-2xl opacity-80 blur-2xl",
              "bg-gradient-to-r",
              accent
            )}
            aria-hidden
          />
          <div className="relative flex flex-wrap items-center gap-2">
            <FilterControls
              tags={allTags}
              selected={selectedTags}
              onToggle={toggleTag}
              onReset={() => setSelectedTags([])}
              mode={mode}
            />
          </div>
        </div>
      </header>

      <div className="mt-6">
        {isLoading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState onReset={() => setSelectedTags([])} mode={mode} />
        ) : (
          <ul
            className={cn(
              "grid w-full gap-4 sm:gap-5",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {filtered.map((project) => (
              <li key={project.id} className="min-w-0">
                <ProjectCard project={project} mode={mode} ringClass={ring} highlightClass={highlight} badgeBg={badgeBg} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="mt-8 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Showing {isLoading ? 0 : filtered.length} of {modeProjects.length} {mode === "ai" ? "AI/Data" : "Civil/Struct"} projects
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])} disabled={selectedTags.length === 0}>
            Clear filters
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.success("Filters saved for this session")}>
            Save filters
          </Button>
        </div>
      </footer>
    </section>
  )
}

function FilterControls({
  tags,
  selected,
  onToggle,
  onReset,
  mode,
}: {
  tags: string[]
  selected: string[]
  onToggle: (tag: string) => void
  onReset: () => void
  mode: Mode
}) {
  const { accent } = useModeStyles(mode)
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <div className={cn("inline-flex items-center rounded-md border border-border bg-secondary pr-2")}>
          <span className="inline-flex items-center gap-2 rounded-l-md bg-secondary px-2 py-1.5 text-xs text-secondary-foreground">
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            Filters
          </span>
          <div className="flex flex-wrap items-center gap-1.5 p-1.5">
            {tags.length === 0 ? (
              <span className="px-2 py-1 text-xs text-muted-foreground">No tags available</span>
            ) : (
              tags.map((tag) => {
                const active = selected.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggle(tag)}
                    aria-pressed={active}
                    className={cn(
                      "select-none rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                      active
                        ? "text-foreground bg-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {tag}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-muted-foreground">Mode accent</span>
          <span
            className={cn(
              "h-5 w-16 rounded-full bg-gradient-to-r",
              accent
            )}
            aria-hidden
          />
          <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
            <Grid2x2Plus className="h-3.5 w-3.5" aria-hidden />
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({
  project,
  mode,
  ringClass,
  highlightClass,
  badgeBg,
}: {
  project: PortfolioProject
  mode: Mode
  ringClass: string
  highlightClass: string
  badgeBg: string
}) {
  const minted = project.proof && project.proof.status === "minted"

  return (
    <Card
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border border-border bg-card/80",
        "transform-gpu will-change-transform transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
        "hover:-translate-y-0.5 hover:shadow-[0_12px_50px_-12px_rgba(107,110,249,0.35)]"
      )}
      onMouseMove={(e) => {
        const el = e.currentTarget as HTMLElement
        const r = el.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        const midX = r.width / 2
        const midY = r.height / 2
        const ry = ((x - midX) / midX) * 6 // deg
        const rx = -((y - midY) / midY) * 6 // deg
        el.style.setProperty("--rx", `${rx}deg`)
        el.style.setProperty("--ry", `${ry}deg`)
        el.style.setProperty("--tz", `18px`)
        el.style.setProperty("--mx", `${(x / r.width) * 100}%`)
        el.style.setProperty("--my", `${(y / r.height) * 100}%`)
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.setProperty("--rx", `0deg`)
        el.style.setProperty("--ry", `0deg`)
        el.style.setProperty("--tz", `0px`)
      }}
      style={{
        transform:
          "perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateZ(var(--tz,0))",
      }}
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-1 rotate-12",
          "bg-gradient-to-r from-white/0 via-white/20 to-white/0",
          "-translate-x-[120%] opacity-0",
          "group-hover:translate-x-[120%] group-hover:opacity-100",
          "transition duration-700 ease-out"
        )}
        aria-hidden
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          "bg-[radial-gradient(200px_140px_at_var(--mx,50%)_var(--my,0%),rgba(255,255,255,0.08),transparent_60%)]",
          "transition-opacity duration-500",
          "opacity-0 group-hover:opacity-100"
        )}
        aria-hidden
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r opacity-90",
          mode === "ai" ? "from-[#6b6ef9] to-[#9b8cff]" : "from-[#f59e0b] to-[#22c55e]"
        )}
        aria-hidden
      />
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 grid h-9 w-9 place-items-center rounded-lg border border-border",
              "bg-secondary text-secondary-foreground",
              "transition-colors"
            )}
            aria-hidden
          >
            {project.mode === "ai" ? (
              <SquareChartGantt className="h-4.5 w-4.5" />
            ) : (
              <PencilRuler className="h-4.5 w-4.5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className={cn("text-base sm:text-lg font-semibold leading-tight", "min-w-0 break-words")}>
              <span
                className={cn(
                  "bg-clip-text text-transparent",
                  "bg-gradient-to-r",
                  mode === "ai" ? "from-[#c7c3ff] to-[#9b8cff]" : "from-[#ffd39b] to-[#22c55e]"
                )}
              >
                {project.title}
              </span>
            </h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {project.tags.slice(0, 4).map((t) => (
                <Badge key={t} variant="outline" className={cn("border-border/60 text-xs text-muted-foreground")}>
                  {t}
                </Badge>
              ))}
              {project.tags.length > 4 ? (
                <Badge variant="secondary" className="text-xs">{`+${project.tags.length - 4}`}</Badge>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
      </CardContent>

      <CardFooter className="mt-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {project.repoUrl ? (
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-1.5 text-sm hover:text-foreground")}
              asChild
            >
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open GitHub repository for ${project.title}`}>
                <Github className="h-4 w-4" aria-hidden />
                Repo
              </a>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm text-muted-foreground"
              onClick={() => toast.message("Repository is private", { description: "Reach out for access." })}
            >
              <Github className="h-4 w-4" aria-hidden />
              Private
            </Button>
          )}

          {project.demoUrl ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-sm"
              asChild
            >
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                Live
              </a>
            </Button>
          ) : null}
        </div>

        <ProofBadge proof={project.proof} highlightClass={highlightClass} badgeBg={badgeBg} />
      </CardFooter>

      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl ring-0 transition-all duration-500",
          "group-hover:ring-2",
          ringClass
        )}
        aria-hidden
      />
    </Card>
  )
}

function ProofBadge({
  proof,
  highlightClass,
  badgeBg,
}: {
  proof?: Proof
  highlightClass: string
  badgeBg: string
}) {
  if (!proof) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs",
          "border border-border text-muted-foreground",
          badgeBg
        )}
      >
        NFT Proof
        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">n/a</span>
      </span>
    )
  }

  if (proof.status === "pending") {
    return (
      <button
        type="button"
        onClick={() =>
          toast.info("Mint in progress", {
            description: "This Proof of Work NFT is queued for minting.",
          })
        }
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs",
          "text-muted-foreground transition-colors hover:text-foreground"
        )}
        aria-label="Proof of Work mint pending"
      >
        NFT Proof
        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px]">pending</span>
      </button>
    )
  }

  return (
    <a
      href={proof.txUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs",
        "transition-colors hover:bg-muted/40"
      )}
      aria-label="View minted Proof of Work NFT transaction"
    >
      <span className={cn("font-medium", highlightClass)}>NFT Proof</span>
      <span className="rounded-sm bg-primary/20 px-1.5 py-0.5 text-[10px] text-foreground">minted</span>
    </a>
  )
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i}>
          <div className="relative overflow-hidden rounded-xl border border-border bg-card/60">
            <div className="h-1.5 w-full bg-muted" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
                  <div className="mt-2 flex gap-2">
                    <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-5 w-12 rounded bg-muted animate-pulse" />
                    <div className="h-5 w-10 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
                <div className="h-8 w-24 rounded-md bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyState({ onReset, mode }: { onReset: () => void; mode: Mode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
      <div className="grid place-items-center rounded-full bg-secondary size-14">
        <FolderKanban className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No projects match your filters</h3>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Try removing a few filters or resetting to view all {mode === "ai" ? "AI/Data" : "Civil/Struct"} projects.
      </p>
      <div className="mt-5">
        <Button onClick={onReset} className="gap-1.5">
          Reset filters
        </Button>
      </div>
    </div>
  )
}